import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

/**
 * Replicate 웹훅을 처리하는 API 엔드포인트
 * 
 * Replicate에서 이미지 생성이 완료되면 이 엔드포인트로 웹훅을 보냅니다.
 * 웹훅을 받으면 이미지를 Cloudflare에 업로드하고 데이터베이스를 업데이트합니다.
 */

// Cloudflare 업로드 함수
async function uploadToCloudflare(imageUrl: string) {
  try {
    // Cloudflare API 키 확인
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    if (!apiKey || !accountId) {
      console.error("Cloudflare API 키 또는 계정 ID가 없습니다");
      return {
        success: false,
        error: "Cloudflare 인증 정보 없음"
      };
    }
    
    // Replicate에서 이미지 스트리밍 다운로드 시작
    console.log("Replicate 이미지 스트리밍 다운로드 시작...");
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.warn(`이미지 다운로드 실패 (${imageResponse.status}), 원본 URL 사용`);
      return {
        success: false,
        error: `이미지 다운로드 실패 (${imageResponse.status})`
      };
    }
    
    // 이미지 데이터를 ArrayBuffer로 가져옴
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    
    // Cloudflare 직접 업로드 URL 요청
    console.log("Cloudflare 업로드 URL 요청 중...");
    const uploadUrlResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!uploadUrlResponse.ok) {
      console.warn(`Cloudflare 업로드 URL 요청 실패 (${uploadUrlResponse.status})`);
      return {
        success: false,
        error: `Cloudflare 업로드 URL 요청 실패 (${uploadUrlResponse.status})`
      };
    }
    
    const uploadUrlData = await uploadUrlResponse.json();
    
    if (!uploadUrlData.success) {
      console.warn("Cloudflare 업로드 URL 응답 실패");
      return {
        success: false,
        error: "Cloudflare 업로드 URL 응답 실패"
      };
    }
    
    // FormData 생성 및 이미지 첨부
    const formData = new FormData();
    const filename = `ai-image-${Date.now()}.png`;
    const blob = new Blob([imageBuffer], { type: "image/png" });
    const file = new File([blob], filename, { type: "image/png" });
    formData.append("file", file);
    
    // Cloudflare로 이미지 업로드
    console.log("Cloudflare에 이미지 업로드 중...");
    const uploadResponse = await fetch(uploadUrlData.result.uploadURL, {
      method: "POST",
      body: formData
    });
    
    if (!uploadResponse.ok) {
      console.warn(`Cloudflare 이미지 업로드 실패 (${uploadResponse.status})`);
      return {
        success: false,
        error: `Cloudflare 이미지 업로드 실패 (${uploadResponse.status})`
      };
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.warn("Cloudflare 업로드 결과 실패");
      return {
        success: false,
        error: "Cloudflare 업로드 결과 실패"
      };
    }
    
    console.log("Cloudflare 업로드 성공, 이미지 ID:", uploadResult.result.id);
    
    return {
      success: true,
      cloudflareId: uploadResult.result.id,
      imageUrl: uploadResult.result.variants[0],
      variants: uploadResult.result.variants
    };
  } catch (cloudflareError) {
    console.error("Cloudflare 업로드 중 오류:", cloudflareError);
    return {
      success: false,
      error: "Cloudflare 업로드 중 오류 발생"
    };
  }
}

// 기존 변형자를 public 변형자로 교체하는 함수
function generatePublicVariantUrl(originalUrl: string): string {
  try {
    // Cloudflare 이미지 URL 예시:
    // https://imagedelivery.net/abcdefg/some-id/variant
    
    const urlParts = originalUrl.split('/');
    if (urlParts.length < 4) {
      console.warn("예상된 Cloudflare URL 형식이 아닙니다:", originalUrl);
      return originalUrl;
    }
    
    // 마지막 부분(변형자)만 'public'으로 교체
    urlParts[urlParts.length - 1] = 'public';
    return urlParts.join('/');
  } catch (error) {
    console.error("URL 변환 중 오류:", error);
    return originalUrl; // 오류 발생 시 원본 반환
  }
}

export async function POST(request: Request) {
  try {
    // 웹훅 로그 기록
    console.log("Replicate 웹훅 수신");
    
    // 요청 본문 파싱
    const webhookData = await request.json();
    console.log("웹훅 데이터:", JSON.stringify(webhookData).substring(0, 200) + "...");
    
    // 웹훅 상태 확인 (성공한 경우만 처리)
    if (webhookData.status !== "succeeded") {
      console.log(`처리 성공이 아닌 웹훅 무시: ${webhookData.status}`);
      return NextResponse.json({ success: false, message: "성공 상태가 아닌 웹훅 무시" });
    }
    
    // 예측 ID와 출력 이미지 URL 추출
    const predictionId = webhookData.id;
    if (!predictionId) {
      console.error("웹훅에 예측 ID가 없음");
      return NextResponse.json({ success: false, error: "예측 ID 없음" }, { status: 400 });
    }
    
    // 출력 이미지 URL 추출
    const output = webhookData.output;
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl) {
      console.error("웹훅에 이미지 URL이 없음");
      return NextResponse.json({ success: false, error: "이미지 URL 없음" }, { status: 400 });
    }
    
    console.log(`예측 ID: ${predictionId}, 이미지 URL: ${imageUrl}`);
    
    // 데이터베이스에서 처리 중인 가장 최근 레코드 검색
    const existingRecord = await db.aIImage.findFirst({
      where: {
        status: "processing",
      },
      orderBy: {
        id: "desc"
      }
    });
    
    if (!existingRecord) {
      console.error("처리 중인 이미지 레코드를 찾을 수 없음");
      return NextResponse.json({ success: false, error: "처리 중인 이미지 레코드 없음" }, { status: 404 });
    }
    
    // Cloudflare에 이미지 업로드
    console.log("Cloudflare에 이미지 업로드 시작");
    const uploadResult = await uploadToCloudflare(imageUrl);
    
    if (!uploadResult.success) {
      console.error("Cloudflare 업로드 실패:", uploadResult.error);
      
      // 업로드 실패 시 원본 이미지 URL 사용
      await db.aIImage.update({
        where: { id: existingRecord.id },
        data: {
          fileUrl: imageUrl,
          thumbnailUrl: imageUrl,
          status: "completed"
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "업로드 실패로 원본 URL 사용",
        imageUrl: imageUrl
      });
    }
    
    // 업로드 성공 시 Cloudflare URL 사용
    const finalImageUrl = uploadResult.imageUrl;
    const thumbnailUrl = generatePublicVariantUrl(finalImageUrl);
    
    // 데이터베이스 업데이트
    console.log("데이터베이스 레코드 업데이트");
    await db.aIImage.update({
      where: { id: existingRecord.id },
      data: {
        fileUrl: finalImageUrl,
        thumbnailUrl: thumbnailUrl,
        status: "completed"
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "이미지 처리 완료",
      imageUrl: finalImageUrl,
      imageId: existingRecord.id
    });
    
  } catch (error: any) {
    console.error("웹훅 처리 중 오류:", error);
    return NextResponse.json({ 
      success: false, 
      error: `웹훅 처리 중 오류: ${error.message || "알 수 없는 오류"}` 
    }, { status: 500 });
  }
} 