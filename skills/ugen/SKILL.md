---
name: ugen
description: "Unified CLI workflow for generating images and videos with Gemini, OpenAI, and Grok(xAI) via `ugen`. Use for tasks that require model discovery (`ugen models`), ordered multi-input composition (`--part text:...` and `--part image:...`), provider-specific option tuning (`--option`, `--options-json`), secure token handling (env or password prompt), and troubleshooting generation failures/timeouts."
---

`ugen` 작업을 수행할 때 아래 순서를 그대로 따른다.

## 목표

- 실행 가능한 생성 명령을 빠르게 만든다.
- 입력 순서를 보존한 멀티 파트 프롬프트를 구성한다.
- 실패 시 원인을 분리하고 즉시 재시도 가능한 수정안을 만든다.

## 표준 절차

1. 모델과 모달리티를 확인한다.
2. 토큰 제공 방식을 확정한다.
3. 최소 입력으로 1회 성공시킨다.
4. 옵션을 추가하며 품질을 튜닝한다.
5. 실패 케이스를 점검하고 재현 가능한 해결 명령을 남긴다.

## 1) 모델 확인

먼저 모델 범위를 고정한다.

```bash
ugen models
ugen models --provider gemini --modality image
ugen models --provider openai --modality video
```

모델 ID는 출력된 값을 그대로 사용한다.

## 2) 인증 처리

환경변수가 있으면 자동 사용한다. 없으면 `password` 프롬프트로 입력한다.

- Gemini: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Grok(xAI): `XAI_API_KEY`

예시:

```bash
export OPENAI_API_KEY="***"
ugen models --provider openai
```

## 3) 입력 구성 규칙

`--part`는 반복 가능하며 순서가 그대로 전달된다.

- `text:...`
- `image:/path/to/file.png`

규칙:

- 텍스트 지시는 짧은 단위로 분해한다.
- 이미지 경로는 실행 전에 존재 여부를 확인한다.
- 여러 입력이 필요한 경우 `text/image`를 의도한 순서대로 배치한다.

예시:

```bash
--part text:"구도 유지" image:./ref1.png --part text:"색감만 반영" image:./ref2.jpg
```

## 4) 이미지 생성 기본 템플릿

텍스트 기반:

```bash
ugen generate image \
  --provider openai \
  --model gpt-image-1.5 \
  --part text:"눈 오는 밤 네온 거리의 고양이" \
  --option size=1024x1024 quality=high
```

텍스트+이미지 기반:

```bash
ugen generate image \
  --provider gemini \
  --model gemini-2.5-flash-image-preview \
  --part text:"구도를 유지" image:./ref.png text:"색감을 따뜻하게"
```

## 5) 비디오 생성 기본 템플릿

```bash
ugen generate video \
  --provider openai \
  --model sora-2 \
  --part text:"비 오는 도시를 달리는 고양이" image:./first-frame.png \
  --option seconds=8 size=1280x720
```

긴 작업은 타임아웃/폴링을 조정한다.

```bash
ugen generate video ... --timeout-ms 1800000 --poll-interval-ms 7000
```

## 6) 옵션 전달 규칙

단순 키-값은 `--option`, 복잡한 구조는 `--options-json`을 사용한다.

```bash
ugen generate video \
  --provider gemini \
  --model veo-3.1-generate-preview \
  --part text:"해변 일출 타임랩스" \
  --option durationSeconds=8 aspectRatio=16:9 \
  --options-json '{"numberOfVideos":1,"generateAudio":false}'
```

해석 규칙:

- `true/false/null` 자동 타입 변환
- 숫자 문자열 자동 숫자 변환
- `--options-json` 값이 최종 병합값으로 적용

## 7) 트러블슈팅

### `지원하지 않는 provider`

- `gemini|openai|grok` 중 하나로 수정한다.

### `이미지 파일을 찾을 수 없습니다`

- 파일 경로 오타를 수정한다.
- 상대경로 대신 절대경로로 재시도한다.

### 인증 실패 (`401`, `permission denied`)

- provider와 토큰 종류를 다시 맞춘다.
- 오래된 환경변수를 제거하고 다시 입력한다.

### 비디오 생성 지연/타임아웃

- `--timeout-ms`를 늘린다.
- `seconds`, `size`, `resolution`을 낮춘다.

### 모델이 입력 타입 거부

- `ugen models --provider ... --modality ...`로 지원 입력을 재확인한다.
- text-only 모델에는 이미지 파트를 제거한다.

## 8) 결과 확인 체크리스트

- 명령이 `완료: provider/modality/model`을 출력하는지 확인한다.
- 출력 파일 경로가 `outputs/` 아래 생성됐는지 확인한다.
- 실패 시 오류 메시지와 함께 재실행 가능한 명령을 남긴다.

## 9) 빠른 치트시트

```bash
ugen models
ugen generate image --provider openai --model gpt-image-1.5 --part text:"..."
ugen generate video --provider openai --model sora-2 --part text:"..." image:./first.png
ugen generate image --provider gemini --model imagen-4.0-generate-001 --part text:"..." --options-json '{"numberOfImages":2}'
```
