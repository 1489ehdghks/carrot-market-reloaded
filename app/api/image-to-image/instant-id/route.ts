import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Replicate from 'replicate';
import { getSession } from '@/lib/auth';
import { db } from '@/shared/lib/db';
import { getImageModelById } from '@/app/(tabs)/image/data/imageModels';

// Replicate API 클라이언트 인스턴스 생성
const getReplicate = () => {
  return new Replicate({
    auth: process.env.REPLICATE_API_KEY || "",
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(120000) // 2분 타임아웃
      });
    }
  });
};

// 동적으로 검증 스키마 생성
function createValidationSchema() {
  // 기본 필드 스키마
  const baseSchema = {
    prompt: z.string().min(1, '프롬프트는 필수입니다'),
    negative_prompt: z.string().optional(),
    face_image_url: z.string().url('유효한 얼굴 이미지 URL이 필요합니다'),
    image_url: z.string().url('유효한 이미지 URL이 필요합니다').optional(),
    width: z.number().or(z.string().transform(v => parseInt(v, 10))).default(768),
    height: z.number().or(z.string().transform(v => parseInt(v, 10))).default(768),
    seed: z.number().int().default(-1)
  };
  
  // 추가 필드를 허용하는 스키마 생성
  return z.object(baseSchema).passthrough();
}

export async function POST(req: NextRequest) {
  try {
    // 세션 확인
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 데이터 파싱
    const rawData = await req.json();
    
    // 동적 검증 스키마 생성 및 데이터 검증
    const validationSchema = createValidationSchema();
    const validationResult = validationSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('요청 데이터 검증 오류:', validationResult.error);
      return NextResponse.json({
        error: '요청 데이터가 유효하지 않습니다',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    // 검증된 데이터
    const data = validationResult.data;
    
    // 모델 정보 조회
    const modelId = 'instantId';
    const modelInfo = getImageModelById(modelId);
    
    if (!modelInfo) {
      return NextResponse.json({ error: '모델 정보를 찾을 수 없습니다' }, { status: 400 });
    }
    
    // API 모델 정보 추출
    const [apiModel, version] = modelInfo.apiModel.split(':');
    
    // 시드 처리
    const seed = data.seed === -1 
      ? Math.floor(Math.random() * 2147483647)
      : data.seed;
    
    console.log(`InstantID 이미지 변환 요청: ${data.prompt.substring(0, 30)}...`);
    
    // API 요청을 위한 기본 매개변수
    const modelInputs: Record<string, any> = {
      prompt: data.prompt,
      negative_prompt: data.negative_prompt || "low quality, bad anatomy, worst quality, low resolution, blurry",
      face_image: data.face_image_url,
      seed
    };
    
    // 이미지 URL이 제공된 경우 추가
    if (data.image_url) {
      modelInputs.image = data.image_url;
    }
    
    // 크기 설정
    modelInputs.width = data.width;
    modelInputs.height = data.height;
    
    // 설정 옵션에서 추가 매개변수 추출
    if (modelInfo.configOptions) {
      Object.entries(modelInfo.configOptions).forEach(([key, config]) => {
        if (data[key] !== undefined) {
          modelInputs[key] = data[key];
        } else if (config.default !== undefined) {
          modelInputs[key] = config.default;
        }
      });
    }
    
    // 추가 매개변수 처리
    Object.entries(data).forEach(([key, value]) => {
      if (!modelInputs.hasOwnProperty(key) && 
          !['prompt', 'negative_prompt', 'face_image_url', 'image_url', 'width', 'height', 'seed'].includes(key)) {
        modelInputs[key] = value;
      }
    });
    
    console.log('InstantID 모델 입력:', modelInputs);
    
    // Replicate API 호출
    const replicate = getReplicate();
    
    console.log(`InstantID API 호출: ${apiModel}/${version}`);
    const output = await replicate.run(
      `${apiModel}/${version}`,
      { input: modelInputs }
    );
    
    console.log('InstantID API 응답:', output);
    
    // 이미지 URL 추출
    let imageUrl: string = '';
    
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = String(output[0]);
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      const outputObj = output as any;
      if (outputObj.output) {
        if (typeof outputObj.output === 'string') {
          imageUrl = outputObj.output;
        } else if (Array.isArray(outputObj.output) && outputObj.output.length > 0) {
          imageUrl = String(outputObj.output[0]);
        }
      }
    }
    
    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 URL을 생성하지 못했습니다' }, { status: 500 });
    }
    
    // 사용된 모델 매개변수 기록
    const modelParams: Record<string, any> = { 
      seed,
      width: data.width,
      height: data.height
    };
    
    // 추가 매개변수 저장
    Object.entries(data).forEach(([key, value]) => {
      if (!['prompt', 'negative_prompt', 'face_image_url', 'image_url', 'width', 'height', 'seed'].includes(key)) {
        modelParams[key] = value;
      }
    });
    
    // 생성된 이미지 정보 DB에 저장
    const imageData = await db.aIImage.create({
      data: {
        userId: session.id,
        prompt: data.prompt,
        negativePrompt: data.negative_prompt || '',
        model: modelId,
        fileUrl: imageUrl,
        thumbnailUrl: imageUrl,
        width: data.width,
        height: data.height,
        title: `InstantID - ${data.prompt.substring(0, 30)}...`,
        category: 'faceswap',
        format: 'jpeg',
        settings: JSON.stringify(modelParams),
        isPublic: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // 응답 반환
    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      id: imageData.id,
      prompt: data.prompt
    });
    
  } catch (error: any) {
    console.error('InstantID 이미지 변환 중 오류:', error);
    
    // Replicate API 오류 처리
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return NextResponse.json({
          error: errorData.detail || '외부 API 오류',
          details: errorData
        }, { status: error.response.status || 500 });
      } catch {
        return NextResponse.json({
          error: `외부 API 오류 (${error.response.status})`,
        }, { status: error.response.status || 500 });
      }
    }
    
    return NextResponse.json({
      error: error.message || '이미지 변환 중 오류가 발생했습니다',
    }, { status: 500 });
  }
} 