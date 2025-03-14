import { NextRequest, NextResponse } from "next/server";
import { handleGlobalError, UserFacingError } from "../../lib/error-handling";

/**
 * 로컬 이미지 파일을 Cloudflare Images에 직접 업로드하는 API 엔드포인트
 * 
 * 요청 본문:
 * - FormData with 'file' field
 * - width: 이미지 너비 (FormData에 추가 가능)
 * - height: 이미지 높이 (FormData에 추가 가능)
 * 
 * 응답:
 * - success: 성공 여부
 * - url: 영구 저장된 이미지 URL (적절한 variant 선택)
 * - thumbnailUrl: 썸네일 URL (항상 public variant)
 * - id: Cloudflare 이미지 ID
 */
export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let width = parseInt(formData.get('width') as string || '0', 10) || undefined;
    let height = parseInt(formData.get('height') as string || '0', 10) || undefined;
    
    // 파일 검증
    if (!file) {
      return NextResponse.json(
        { success: false, error: "이미지 파일이 필요합니다" },
        { status: 400 }
      );
    }
    
    console.log("로컬 이미지 업로드 정보:", {
      fileName: file.name,
      fileSize: `${Math.round(file.size / 1024)} KB`, 
      fileType: file.type, 
      width, 
      height
    });
    
    // 이미지 크기 정보가 없는 경우 기본값 설정
    if (!width || !height) {
      console.log("이미지 크기 정보가 없음, 기본값 설정");
      width = width || 768;
      height = height || 768;
    }
    
    // Cloudflare API 키와 계정 ID 가져오기
    const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
    const cloudflareAccountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;
    const cloudflareImageDeliveryUrl = process.env.CLOUDFLARE_IMAGE_DELIVERY_URL;
    
    if (!cloudflareAccountId || !cloudflareApiKey || !cloudflareAccountHash) {
      console.error("Cloudflare 환경 변수 확인:", {
        hasAccountId: !!cloudflareAccountId,
        hasApiKey: !!cloudflareApiKey,
        hasAccountHash: !!cloudflareAccountHash,
        hasImageDeliveryUrl: !!cloudflareImageDeliveryUrl
      });
      throw new Error("Cloudflare 환경 변수가 설정되지 않았습니다");
    }
    
    // Cloudflare Images API를 통해 직접 업로드 URL 가져오기
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1/direct_upload`;
    
    console.log("Cloudflare API 요청:", apiUrl);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cloudflareApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requireSignedURLs: false,
        metadata: {
          source: "carrot-market-app",
          type: "upload",
        },
      }),
    });
    
    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
      } catch (e) {
        errorDetail = await response.text().catch(() => '응답 없음');
      }
      
      console.error("Cloudflare API 응답 실패:", {
        status: response.status,
        statusText: response.statusText,
        errorDetail: errorDetail.length > 200 ? errorDetail.substring(0, 200) + "..." : errorDetail
      });
      
      throw new Error(`Cloudflare 업로드 URL을 생성하는데 실패했습니다: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result || !data.result.uploadURL) {
      console.error("Cloudflare API 응답 형식 오류:", data);
      throw new Error("Cloudflare API 응답이 유효하지 않습니다");
    }
    
    const uploadUrl = data.result.uploadURL;
    console.log("Cloudflare 업로드 URL 획득:", uploadUrl.substring(0, 50) + "...");
    
    // Cloudflare Images에 업로드 - FormData 그대로 사용
    // 이미 클라이언트에서 File 객체가 FormData에 추가되었으므로 직접 사용
    console.log("Cloudflare Images에 이미지 업로드 시작");
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      // 파일 업로드를 위한 헤더는 FormData에서 자동으로 설정되므로 지정하지 않음
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      let errorText;
      try {
        errorText = await uploadResponse.text();
        // 긴 오류 텍스트는 짧게 표시
        if (errorText && errorText.length > 100) {
          errorText = errorText.substring(0, 100) + "...";
        }
      } catch (e) {
        errorText = "응답 텍스트를 가져올 수 없음";
      }
      
      console.error("Cloudflare 업로드 실패:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText
      });
      
      throw new Error(`Cloudflare 업로드 실패: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    // 업로드 응답 처리
    const uploadResult = await uploadResponse.json();
    console.log("Cloudflare 업로드 성공:", !!uploadResult.success);
    
    // 영구 URL 생성 (variants 확인)
    if (!uploadResult.success || !uploadResult.result || !uploadResult.result.id) {
      console.error("Cloudflare 업로드 응답 형식 오류:", uploadResult);
      throw new Error("Cloudflare 업로드 응답 형식이 유효하지 않습니다");
    }
    
    // Cloudflare 이미지 ID 획득
    const cloudflareImageId = uploadResult.result.id;
    console.log("Cloudflare 이미지 ID:", cloudflareImageId);
    
    // 기본 Cloudflare 이미지 URL 생성
    const baseDeliveryUrl = cloudflareImageDeliveryUrl || `https://imagedelivery.net/${cloudflareAccountHash}`;
    const cloudflareDeliveryUrl = `${baseDeliveryUrl}/${cloudflareImageId}`;
    
    // 이미지 크기에 따라 적절한 variant 선택
    let variant = 'normal'; // 기본값
    
    if (width && height) {
      if (width === height) {
        variant = 'normal';
      } else if (width > height) {
        variant = 'width';
      } else {
        variant = 'height';
      }
      
      // 작은 이미지는 public variant 사용
      if (width < 251 && height < 251) {
        variant = 'public';
      }
    }
    
    console.log(`이미지 크기에 따른 variant 선택: ${variant}, 크기: ${width}x${height}`);
    
    // 성공 응답 반환 (선택된 variant 사용)
    const responseData = {
      success: true,
      url: `${cloudflareDeliveryUrl}/${variant}`, // 선택된 variant 사용
      thumbnailUrl: `${cloudflareDeliveryUrl}/public`, // 썸네일은 항상 public variant 사용
      id: cloudflareImageId,
      // variants 정보 추가
      variants: {
        original: cloudflareDeliveryUrl,
        height: `${cloudflareDeliveryUrl}/height`,
        width: `${cloudflareDeliveryUrl}/width`,
        normal: `${cloudflareDeliveryUrl}/normal`,
        public: `${cloudflareDeliveryUrl}/public`
      }
    };
    
    console.log("응답 전송 완료");
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error("직접 업로드 중 오류:", error);
    
    // 전역 에러 핸들러에 에러 전달
    handleGlobalError(error);
    
    // 오류 응답 반환
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다" 
      },
      { status: 500 }
    );
  }
} 