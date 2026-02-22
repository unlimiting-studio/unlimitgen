**ugen**

Gemini / OpenAI / Grok(xAI) 모델로 이미지/동영상을 생성하는 CLI입니다.

- 이미지
  - Gemini: `gemini-3-pro-image-preview`, `gemini-2.5-flash-image-preview`, `imagen-4.0-generate-001`, `imagen-4.0-ultra-generate-001`, `imagen-4.0-fast-generate-001`
  - OpenAI: `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`
  - Grok: `grok-imagine-image`, `grok-imagine-image-pro`
- 동영상
  - Gemini: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`
  - OpenAI: `sora-2`, `sora-2-pro`
  - Grok: `grok-imagine-video`

> 참고: xAI(Grok)는 공식 문서의 OpenAI 호환 SDK 경로를 사용합니다.

## 설치

```bash
npm install
npm run build
npm link
```

그 뒤 `ugen` 명령을 사용할 수 있습니다.

## 인증(비밀번호 입력)

아래 환경변수가 없으면 실행 시 숨김 입력(password prompt)으로 토큰을 받습니다.

- Gemini: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Grok(xAI): `XAI_API_KEY`

## 핵심 사용법

모델 목록과 모델별 옵션 키 보기:

```bash
ugen models
ugen models --provider gemini --modality video
```

이미지 생성(입력 순서 보장):

```bash
ugen generate image \
  --provider openai \
  --model gpt-image-1.5 \
  --part text:"고양이 우주비행사" text:"필름 카메라 스타일" \
  --option size=1024x1024 quality=high
```

이미지 + 텍스트 혼합 입력(여러 개, 순서 보장):

```bash
ugen generate image \
  --provider gemini \
  --model gemini-2.5-flash-image-preview \
  --part text:"첫 이미지의 구도를 유지" image:./ref1.png text:"두 번째 이미지 색감을 반영" image:./ref2.jpg
```

동영상 생성:

```bash
ugen generate video \
  --provider openai \
  --model sora-2 \
  --part text:"네온 도시를 달리는 고양이" image:./first-frame.png \
  --option seconds=8 size=1280x720
```

고급 옵션(JSON) 병합:

```bash
ugen generate video \
  --provider gemini \
  --model veo-3.1-generate-preview \
  --part text:"바닷가 일출 타임랩스" \
  --options-json '{"numberOfVideos":1,"durationSeconds":8,"aspectRatio":"16:9"}'
```

## 옵션 구조

- `--part <type:value...>`
  - 반복 가능
  - `text:...`, `image:/path/to/file` 지원
  - 입력 순서는 그대로 모델 요청에 반영
- `--option <key=value...>`
  - 반복 가능
  - 숫자/불리언/null 자동 파싱
- `--options-json <json>`
  - `--option` 위에 merge
- 비디오 전용
  - `--poll-interval-ms` (기본 `5000`)
  - `--timeout-ms` (기본 `900000`)

## 구현 메모

- Gemini SDK: `@google/genai`
- OpenAI SDK: `openai`
- xAI(Grok): OpenAI 호환 SDK(base URL `https://api.x.ai/v1`)
- 출력물: 기본 `./outputs`

## npm 배포(Trusted Publish)

- 워크플로우: `.github/workflows/publish.yml`
- 가이드: `docs/trusted-publish.md`

Release(Published) 생성 시 OIDC 기반 trusted publish로 배포됩니다.

## ugen 스킬 문서

- 경로: `skills/ugen/SKILL.md`
- 설치/인증/사용 흐름/트러블슈팅을 사용자 관점에서 정리한 가이드입니다.

## 옵션 정보 출처(공식 문서)

- Google GenAI SDK (`generateImages`, `generateVideos`, `generateContent`): https://www.npmjs.com/package/@google/genai
- OpenAI TypeScript SDK (`images.generate/edit`, `videos.create/retrieve/downloadContent`): https://github.com/openai/openai-node
- OpenAI Sora 모델/비디오 가이드: https://platform.openai.com/docs/models/sora-2
- xAI API docs (OpenAI 호환 사용): https://docs.x.ai/docs/overview
