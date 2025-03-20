import { NextRequest, NextResponse } from "next/server";
import { handleGlobalError, UserFacingError } from "../../lib/error-handling";
import { getImageSession } from '@/app/lib/imageSessionService';

/**
 * 임시 이미지 URL을 Cloudflare Images에 업로드하고 영구 URL을 반환하는 API 엔드포인트
 * 
 * 요청 본문:
 * - imageUrl: 임시 이미지 URL 또는 Base64 데이터 URL
 * - imageId: 생성된 이미지 ID
 * - width: 이미지 너비 (선택)
 * - height: 이미지 높이 (선택)
 * 
 * 응답:
 * - success: 성공 여부
 * - url: 영구 저장된 이미지 URL (적절한 variant 선택)
 * - thumbnailUrl: 썸네일 URL (항상 public variant)
 * - id: Cloudflare 이미지 ID
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 정보 확인 (로그인 필요)
    const session = await getImageSession();
    if (!session?.id) {
      console.log('[Cloudflare 업로드] 인증되지 않은 요청');
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }
    
    // userId는 number 타입이어야 함 (schema.prisma 기준)
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);

    // 환경 변수 확인 및 로깅
    console.log("=== Cloudflare 업로드 시작 ===");
    console.log("환경 변수 확인:", {
      CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID ? "설정됨" : "없음",
      CLOUDFLARE_API_KEY: !!process.env.CLOUDFLARE_API_KEY ? "설정됨" : "없음",
      CLOUDFLARE_ACCOUNT_HASH: !!process.env.CLOUDFLARE_ACCOUNT_HASH ? "설정됨" : "없음"
    });
    
    // 요청 본문 파싱
    const body = await request.json();
    const { imageUrl, imageId = `img-${Date.now()}` } = body;
    let { width, height } = body;
    
    console.log("요청 정보:", {
      userId,
      imageId,
      width, 
      height,
      hasImageUrl: !!imageUrl,
      isDataUrl: imageUrl?.startsWith('data:'),
      urlLength: imageUrl?.length
    });

    // 필수 파라미터 검증
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "이미지 URL이 필요합니다" },
        { status: 400 }
      );
    }

    // "pending" 또는 무효한 URL 체크
    if (imageUrl === "pending" || imageUrl === "null") {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 이미지 URL입니다" },
        { status: 400 }
      );
    }

    // URL 형식 검증
    try {
      new URL(imageUrl);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "유효한 URL 형식이 아닙니다" },
        { status: 400 }
      );
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

    // 이미지 데이터 준비
    let imageBlob;
    let arrayBuffer;
    
    // Base64 데이터 URL인 경우 직접 변환
    if (imageUrl.startsWith('data:')) {
      console.log("Base64 데이터 URL에서 이미지 추출 시작");
      
      try {
        // data:image/png;base64,로 시작하는 데이터 URL에서 실제 Base64 부분만 추출
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          throw new Error("유효하지 않은 Base64 데이터 URL 형식입니다");
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Base64를 바이너리 데이터로 변환
        const binary = atob(base64Data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        arrayBuffer = bytes.buffer;
        imageBlob = new Blob([bytes], { type: mimeType });
        console.log(`Base64 데이터를 Blob으로 변환 완료, 크기: ${Math.round(imageBlob.size / 1024)} KB`);
        
        // Base64 이미지에서 크기 정보 추출 (width, height가 전달되지 않은 경우)
        if (!width || !height) {
          try {
            const img = new Image();
            img.src = imageUrl;
            await new Promise((resolve) => {
              img.onload = () => {
                width = img.width;
                height = img.height;
                console.log(`이미지 크기 추출 완료: ${width}x${height}`);
                resolve(null);
              };
              img.onerror = () => {
                console.log("이미지 크기 추출 실패, 기본값 사용");
                width = width || 768;
                height = height || 768;
                resolve(null);
              };
            });
          } catch (error) {
            console.log("이미지 크기 추출 중 오류, 기본값 사용", error);
            width = width || 768;
            height = height || 768;
          }
        }
      } catch (error) {
        console.error("Base64 데이터 처리 오류:", error);
        throw new Error("Base64 데이터를 처리하는 중 오류가 발생했습니다");
      }
    } 
    // 일반 URL인 경우 가져오기
    else {
      console.log("외부 URL에서 이미지 다운로드 시작");
      try {
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          console.error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        // 이미지 데이터를 ArrayBuffer로 먼저 가져옴
        arrayBuffer = await imageResponse.arrayBuffer();
        // ArrayBuffer를 Blob으로 변환
        imageBlob = new Blob([arrayBuffer], { type: imageResponse.headers.get('content-type') || 'image/png' });
        console.log(`이미지 다운로드 완료, 크기: ${Math.round(imageBlob.size / 1024)} KB`);
      } catch (error) {
        console.error("이미지 URL 다운로드 오류:", error);
        throw new Error("이미지를 다운로드하는 중 오류가 발생했습니다");
      }
    }

    // Cloudflare Images 업로드를 위한 FormData 생성
    const formData = new FormData();
    
    // 파일명 설정 (이미지 ID 사용)
    const fileName = `${imageId || `img-${Date.now()}`}.png`;
    
    // 파일 객체 생성 - Node.js 환경에서는 FormData에 Blob 대신 File 객체를 사용해야 할 수 있음
    const file = new File([imageBlob], fileName, { type: imageBlob.type });
    
    // 'file' 필드만 추가 (Cloudflare Images API는 이 필드만 필요로 함)
    formData.append("file", file);

    // Cloudflare Images 직접 업로드 URL 가져오기
    console.log("Cloudflare 업로드 URL 가져오기");
    
    // v1 API 사용 (v2는 일부 계정에서 지원하지 않을 수 있음)
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
          type: "ai-generated",
        },
      }),
    });

    console.log("Cloudflare API 응답 상태:", response.status, response.statusText);
    
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
    console.log("Cloudflare API 응답 상태:", data.success ? "성공" : "실패");
    
    if (!data.success || !data.result || !data.result.uploadURL) {
      console.error("Cloudflare API 응답 형식 오류:", data);
      throw new Error("Cloudflare API 응답이 유효하지 않습니다");
    }
    
    const uploadUrl = data.result.uploadURL;
    console.log("Cloudflare 업로드 URL 획득:", uploadUrl.substring(0, 50) + "...");

    // Cloudflare Images에 업로드
    console.log("Cloudflare Images에 이미지 업로드 시작");
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      // 파일 업로드를 위한 헤더는 FormData에서 자동으로 설정됨
      body: formData,
    });

    console.log("Cloudflare 업로드 응답 상태:", uploadResponse.status, uploadResponse.statusText);
    
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
    console.log("업로드 성공:", !!uploadResult.success);

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
    console.log("Cloudflare 이미지 Delivery URL:", cloudflareDeliveryUrl);
    
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
      // variants 정보 추가 (필요시 클라이언트에서 사용 가능)
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
    console.error("Cloudflare 업로드 중 오류:", error);
    
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