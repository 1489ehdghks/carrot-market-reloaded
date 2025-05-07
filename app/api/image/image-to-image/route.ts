import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { scheduleCloudflareUpload } from "@/features/image/lib/imageService";
import { getImageModelById } from "@/shared/models/image/imageModels";
import { ImageGenerationStatus } from "@/features/image/image-category-types";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // JSON 데이터 파싱
    const requestData = await request.json();
    const {
      imageUrl,
      prompt,
      negativePrompt = "",
      width,
      height,
      num_inference_steps,
      guidance_scale,
      scheduler = "DPMSolverMultistep",
      strength = 0.7,
      model: modelId
    } = requestData;

    if (!imageUrl || !prompt || !modelId) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다" },
        { status: 400 }
      );
    }
    
    // 모델 정보 가져오기
    const modelInfo = getImageModelById(modelId);
    if (!modelInfo) {
      return NextResponse.json(
        { error: "유효하지 않은 모델입니다" },
        { status: 400 }
      );
    }
    
    const apiVersion = modelInfo.version || "ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219";

    // Base64 이미지 처리 - 이미 클라이언트에서 최적화되어 전송됨
    let processedImage = imageUrl;
    
    console.log(`[image-to-image] 요청 시작: 모델=${modelId}, 프롬프트="${prompt.substring(0, 30)}..."`);

    // 임시 이미지 생성 레코드 생성 - 상태 추적용
    const tempImage = await db.aIImage.create({
      data: {
        userId: session.id,
        title: prompt.substring(0, 50),
        prompt,
        negativePrompt: negativePrompt || "",
        model: modelId,
        status: "processing" as ImageGenerationStatus,
        category: "other", // 기본 카테고리
        fileUrl: "", // 임시 빈 값
        thumbnailUrl: "", // 임시 빈 값
        width,
        height,
        format: "png" // 기본값
      },
    });

    console.log(`[image-to-image] 임시 이미지 생성 ID: ${tempImage.id}`);

    // Replicate API 호출
    const result = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: apiVersion,
        input: {
          image: processedImage,
          prompt,
          negative_prompt: negativePrompt || "",
          width,
          height,
          num_inference_steps,
          guidance_scale,
          scheduler,
          strength,
          // 모델별 추가 매개변수가 있는 경우 처리
          ...(modelInfo.additionalParams || {})
        },
      }),
    });

    if (!result.ok) {
      const error = await result.json();
      console.error("[image-to-image] API 오류:", error);
      
      // 실패 상태로 업데이트
      await db.aIImage.update({
        where: { id: tempImage.id },
        data: { status: "failed" as ImageGenerationStatus },
      });
      
      return NextResponse.json(
        { error: error.detail || "이미지 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    const response = await result.json();
    console.log("[image-to-image] API 응답:", JSON.stringify(response).substring(0, 200));

    // 폴링을 통한 결과 대기
    let generatedUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 최대 60번 시도 (약 3분)

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[image-to-image] 결과 폴링: 시도 ${attempts}/${maxAttempts}`);

      const checkResult = await fetch(`https://api.replicate.com/v1/predictions/${response.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      if (!checkResult.ok) {
        console.error("[image-to-image] 폴링 오류:", await checkResult.text());
        // 폴링 오류 발생해도 계속 시도
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
        continue;
      }

      const status = await checkResult.json();
      console.log(`[image-to-image] 상태: ${status.status}`);

      if (status.status === "succeeded") {
        generatedUrl = Array.isArray(status.output) ? status.output[0] : status.output;
        console.log(`[image-to-image] 생성된 이미지 URL: ${generatedUrl}`);
        break;
      } else if (status.status === "failed") {
        console.error("[image-to-image] 생성 실패:", status.error);
        
        // 실패 상태로 업데이트
        await db.aIImage.update({
          where: { id: tempImage.id },
          data: { status: "failed" as ImageGenerationStatus },
        });
        
        return NextResponse.json(
          { error: "이미지 생성에 실패했습니다: " + status.error },
          { status: 500 }
        );
      }

      // 3초 대기 후 다시 시도
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!generatedUrl) {
      console.error("[image-to-image] 최대 시도 횟수 초과");
      
      // 실패 상태로 업데이트
      await db.aIImage.update({
        where: { id: tempImage.id },
        data: { status: "failed" as ImageGenerationStatus },
      });
      
      return NextResponse.json(
        { error: "처리 시간이 초과되었습니다" },
        { status: 500 }
      );
    }

    // 이미지 생성 성공 - 레코드 업데이트
    await db.aIImage.update({
      where: { id: tempImage.id },
      data: {
        status: "completed" as ImageGenerationStatus,
        fileUrl: generatedUrl,
        thumbnailUrl: generatedUrl, // 임시로 동일한 URL 사용
      },
    });

    // Cloudflare에 업로드 예약
    try {
      console.log(`[image-to-image] Cloudflare 업로드 예약: 이미지ID=${tempImage.id}, URL=${generatedUrl}`);
      
      // Cloudflare 업로드 API 직접 호출
      const uploadResponse = await fetch('/api/image/cloudflare-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId: tempImage.id,
          imageUrl: generatedUrl
        }),
        // next.js 서버 액션에서 fetch 시 필요한 옵션
        cache: 'no-store'
      });
      
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        console.error(`[image-to-image] Cloudflare 업로드 실패: ${uploadResponse.status} - ${uploadError.substring(0, 100)}...`);
      } else {
        const uploadResult = await uploadResponse.json();
        console.log(`[image-to-image] Cloudflare 업로드 요청 성공:`, uploadResult);
      }
    } catch (uploadError) {
      console.error("[image-to-image] Cloudflare 업로드 예약 실패:", uploadError);
      // 업로드 예약 실패해도 계속 진행
    }

    // 성공 응답 반환 (URL과 ID 포함)
    return NextResponse.json({ 
      id: tempImage.id,
      url: generatedUrl 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("[image-to-image] 처리 오류:", error);
    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 