---
name: ugen
summary: Gemini/OpenAI/Grok으로 이미지·동영상을 생성하는 CLI 사용 가이드
owner: unlimiting-studio
package: '@unlimiting/unlimitgen'
binary: ugen
---

`ugen`은 여러 AI 플랫폼의 미디어 생성 모델을 한 CLI로 다루기 위한 도구입니다.

- 이미지 생성
  - Gemini: `gemini-3-pro-image-preview`, `gemini-2.5-flash-image-preview`, `imagen-4.0-generate-001`, `imagen-4.0-ultra-generate-001`, `imagen-4.0-fast-generate-001`
  - OpenAI: `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`
  - Grok(xAI): `grok-imagine-image`, `grok-imagine-image-pro`
- 동영상 생성
  - Gemini: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`
  - OpenAI: `sora-2`, `sora-2-pro`
  - Grok(xAI): `grok-imagine-video`

이 문서는 처음 쓰는 사용자도 "설치 → 인증 → 생성 → 문제 해결" 흐름을 끝까지 따라갈 수 있도록 작성되었습니다.

## 1) 언제 쓰면 좋은가

- 플랫폼마다 다른 SDK/요청 형식을 외울 필요 없이 한 인터페이스로 생성하고 싶을 때
- 텍스트와 이미지 입력을 순서대로 섞어(멀티 파트) 컨트롤하고 싶을 때
- 모델 옵션을 CLI에서 빠르게 바꿔가며 실험하고 싶을 때

## 2) 설치와 기본 실행

### 설치

```bash
npm i -g @unlimiting/unlimitgen
```

또는 프로젝트 내에서 일회성으로:

```bash
npx @unlimiting/unlimitgen --help
```

### 정상 설치 확인

```bash
ugen --help
ugen models
```

## 3) 인증 방식 (토큰 입력)

`ugen`은 먼저 환경변수를 찾고, 없으면 숨김(password) 프롬프트로 토큰을 입력받습니다.

- Gemini: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Grok(xAI): `XAI_API_KEY`

예시:

```bash
export OPENAI_API_KEY="..."
ugen models --provider openai
```

## 4) 핵심 입력 개념: `--part`

모든 생성은 `--part`를 반복해서 입력합니다. 입력 순서가 그대로 모델 요청에 반영됩니다.

- `text:...`
- `image:/절대/또는/상대/경로.png`

예시:

```bash
--part text:"첫 지시" image:./ref1.png --part text:"두 번째 지시" image:./ref2.jpg
```

권장:

- 텍스트 지시를 짧고 명확하게 끊어서 `text` 파트로 여러 개 주기
- 이미지 파일은 경로 오타가 잦으므로 실행 전 존재 확인

## 5) 빠른 시작 시나리오

### A. 텍스트만으로 이미지 생성

```bash
ugen generate image \
  --provider openai \
  --model gpt-image-1.5 \
  --part text:"눈 오는 밤, 네온 간판 아래 고양이" \
  --option size=1024x1024 quality=high
```

### B. 텍스트 + 참조 이미지로 이미지 생성

```bash
ugen generate image \
  --provider gemini \
  --model gemini-2.5-flash-image-preview \
  --part text:"첫 이미지 구도 유지" image:./shot1.png text:"두 번째 이미지 색감 참고" image:./style1.jpg
```

### C. 텍스트 + 첫 프레임 이미지로 동영상 생성

```bash
ugen generate video \
  --provider openai \
  --model sora-2 \
  --part text:"비 오는 도심을 달리는 고양이" image:./first-frame.png \
  --option seconds=8 size=1280x720
```

## 6) 옵션 전달 방법

옵션은 두 가지 방식으로 전달합니다.

- 간단한 key-value: `--option key=value`
- 복잡한 구조: `--options-json '{...}'`

두 방식을 같이 쓰면 `--options-json`이 최종 병합됩니다.

예시:

```bash
ugen generate video \
  --provider gemini \
  --model veo-3.1-generate-preview \
  --part text:"해변 일출 타임랩스" \
  --option durationSeconds=8 aspectRatio=16:9 \
  --options-json '{"numberOfVideos":1,"generateAudio":false}'
```

## 7) 실전 운영 흐름 (권장)

1. `ugen models`로 대상 모델/옵션 확인
2. 최소 입력(텍스트 1개)으로 한 번 생성해 baseline 확보
3. `--part`로 지시를 분해해 품질 조정
4. `--option`으로 해상도/품질/길이 등 튜닝
5. 안정화되면 스크립트로 명령 고정

## 8) 출력물 확인

- 기본 출력 폴더: `./outputs`
- 성공 시 터미널에 파일 경로 목록이 출력됨
- 비디오는 모델 특성상 생성 대기가 길 수 있음 (`--poll-interval-ms`, `--timeout-ms` 조정)

## 9) 자주 겪는 문제와 해결

### 9-1) `지원하지 않는 provider` 오류

원인:

- provider 오타

해결:

- `gemini`, `openai`, `grok` 중 하나로 재실행

### 9-2) 이미지 파일을 찾을 수 없다는 오류

원인:

- 경로 오타, 상대경로 기준 혼동

해결:

- 경로를 절대경로로 바꿔 실행
- 파일 확장자(`.png/.jpg/.jpeg/.webp`) 확인

### 9-3) 토큰 관련 인증 실패

원인:

- 잘못된 키
- 잘못된 provider 키를 입력

해결:

- provider별 키를 다시 확인
- 환경변수에 남아있는 이전 키를 제거 후 재시도

### 9-4) 비디오 생성이 오래 걸리거나 타임아웃

원인:

- 모델 큐 지연, 해상도/길이 옵션이 무거움

해결:

- `--timeout-ms` 상향
- `seconds`, `size`, `resolution` 등 옵션 완화

예시:

```bash
ugen generate video ... --timeout-ms 1800000 --poll-interval-ms 7000
```

### 9-5) 모델이 입력 타입을 거부

원인:

- 특정 모델은 text-only 또는 입력 조합 제한

해결:

- `ugen models --provider <...> --modality <...>`로 지원 특성 확인
- 모델을 입력 시나리오에 맞게 교체

## 10) 보안/운영 팁

- CI 로그에 토큰이 출력되지 않게 주의
- 팀 환경에서는 `.env` 대신 Secret Manager 사용 권장
- 생성 결과물은 저작권/정책 검토 후 배포

## 11) 배포/업데이트 확인

- 최신 배포본 확인: npm 패키지 페이지에서 버전 확인
- 버전 업 후 반영 확인:

```bash
npm i -g @unlimiting/unlimitgen@latest
ugen --version
```

## 12) 한눈에 보는 명령 치트시트

```bash
# 모델 목록
ugen models
ugen models --provider gemini --modality video

# 이미지 생성
ugen generate image --provider openai --model gpt-image-1.5 --part text:"..."

# 비디오 생성
ugen generate video --provider openai --model sora-2 --part text:"..." image:./first.png

# JSON 옵션
ugen generate image --provider gemini --model imagen-4.0-generate-001 --part text:"..." --options-json '{"numberOfImages":2}'
```
