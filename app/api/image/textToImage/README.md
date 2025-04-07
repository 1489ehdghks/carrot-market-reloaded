# 이미지 생성 API 문서

## 이전 구현 및 문제점

### 1. 폴링(Polling) 메커니즘의 문제

이전 구현에서는 비동기 처리 방식을 사용했습니다. 이미지 생성 요청을 받으면 즉시 임시 ID를 반환하고, 클라이언트는 이 ID를 사용하여 주기적으로 API를 호출하여 생성 상태를 확인했습니다.

```
GET /api/generate?tempId=api-1742118569025-791 200 in 14ms
```

이러한 로그가 많이 나타나는 이유는 바로 이 폴링 때문이었습니다. 클라이언트는 이미지 생성이 완료될 때까지 약 5초 간격으로 계속해서 API를 호출했습니다.

**문제점:**
- 서버에 불필요한 요청 부하 발생
- 네트워크 트래픽 증가
- 클라이언트에서 타이머 관리 복잡성
- 실시간성이 떨어짐 (폴링 간격만큼 지연 발생)
- 진행 상황에 대한 상세 정보 제공 불가 (단순히 진행 중/완료 상태만 확인 가능)

### 2. 필요 없는 속성 (`forceNew`)

`forceNew` 속성은 원래 캐싱을 우회하고 항상 새 이미지를 생성하도록 하는 옵션이었으나, 불필요한 코드 복잡성만 증가시키고 있어 제거했습니다.

## 현재 구현 (개선된 방식)

### 1. 동기식 처리 방식 적용

폴링 대신 동기식 처리 방식을 도입했습니다. 이미지 생성 요청을 받으면 이미지가 완전히 생성될 때까지 처리한 후 최종 결과를 반환합니다.

**장점:**
- 서버 부하 감소 (폴링을 위한 추가 요청 없음)
- 코드 단순화 (상태 추적 로직 제거)
- 신뢰할 수 있는 결과 (확실히 완료된 이미지 반환)
- GET 엔드포인트가 필요 없어짐

**클라이언트 측 코드:**
```javascript
// 이미지 생성 요청 - 완료될 때까지 대기
const response = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify(requestData)
});

// 완료된 이미지 데이터 바로 사용
const data = await response.json();
updateUI(data.image.url);
```

### 2. 서버 측 처리 흐름

1. POST 요청 수신 및 요청 데이터 검증
2. Replicate API 호출하여 이미지 생성 (동기적 대기)
3. Cloudflare에 업로드 (즉시 처리)
4. 데이터베이스에 저장 (영구 저장)
5. 최종 이미지 URL 반환

### 3. 개선된 에러 처리

- 각 단계별 에러 처리 강화
- 파이프라인에서 실패하더라도 최대한 결과 제공
- 자세한 에러 메시지 반환

## 주의사항

1. 요청 처리 시간이 길어질 수 있음 (이미지 생성 + 업로드)
2. 타임아웃 가능성 있음 (클라이언트 측에서 적절한 타임아웃 설정 필요)
3. 필요한 경우 나중에 비동기 패턴으로 다시 변경할 수 있음 (SSE 등 고려)

## 개선 방안

### 1. Server-Sent Events(SSE) 도입

폴링 대신 SSE를 사용하면 서버에서 클라이언트로 실시간 업데이트를 push할 수 있습니다. 이를 통해:

```javascript
// 서버 측 구현 (app/api/generate/sse/route.ts)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tempId = url.searchParams.get('tempId');
  
  // SSE 헤더 설정
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 상태 모니터링 함수
      const checkStatus = async () => {
        const status = processTracker.get(tempId);
        
        if (!status) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "처리 정보 없음" })}\n\n`));
          controller.close();
          return;
        }
        
        // 상태 전송
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(status)}\n\n`));
        
        // 완료 또는 실패 시 스트림 종료
        if (status.status === 'completed' || status.status === 'failed') {
          controller.close();
          return;
        }
        
        // 계속 모니터링
        setTimeout(checkStatus, 1000);
      };
      
      // 초기 체크 시작
      checkStatus();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// 클라이언트 측 구현
const startImageGeneration = async () => {
  // 1. 이미지 생성 요청
  const response = await fetch('/api/generate', { method: 'POST', body: JSON.stringify(data) });
  const { tempId } = await response.json();
  
  // 2. SSE로 상태 모니터링
  const eventSource = new EventSource(`/api/generate/sse?tempId=${tempId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // 상태 업데이트 처리
    updateUI(data);
    
    // 완료 시 연결 종료
    if (data.status === 'completed' || data.status === 'failed') {
      eventSource.close();
    }
  };
  
  eventSource.onerror = () => {
    eventSource.close();
  };
};
```

### 2. 웹소켓(WebSocket) 도입

대규모 실시간 상호작용이 필요한 경우, 웹소켓을 통해 양방향 통신을 구현할 수 있습니다. 이미지 생성뿐만 아니라 다른 실시간 기능도 통합할 수 있습니다.

## 구현 우선순위

1. SSE 구현 (중간 난이도, 높은 효과)
2. 속성 제거 (낮은 난이도, 코드 정리)
3. 웹소켓 구현 (높은 난이도, 장기적 확장성)

## 참고 자료

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Next.js API Routes and SSE](https://nextjs.org/docs/api-routes/response-helpers) 