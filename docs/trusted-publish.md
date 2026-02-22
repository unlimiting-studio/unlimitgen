**npm Trusted Publishing 설정 가이드 (@unlimiting/unlimitgen)**

이 저장소는 GitHub Actions OIDC 기반 trusted publish 워크플로우를 이미 포함합니다.

- 워크플로우 파일: `.github/workflows/publish.yml`
- publish 명령: `npm publish --access public --provenance`
- 필요 권한: `id-token: write`, `contents: read`

남은 1회성 연결( npm 사이트 ):

1. npm에 퍼블리셔 계정으로 로그인
2. 패키지 `@unlimiting/unlimitgen` 페이지로 이동
3. `Settings` → `Publishing access`(또는 Trusted publishers) 진입
4. GitHub repository를 `unlimiting-studio/unlimitgen`로 지정
5. Workflow filename을 `publish.yml`로 지정
6. Environment를 `npm`으로 지정 (워크플로우와 동일)

릴리즈 방법:

1. GitHub에서 `v0.1.0` 같은 태그로 Release 생성 (Published)
2. `Publish to npm` 워크플로우 자동 실행
3. npm에서 새 버전 확인

문제 해결:

- `E401` / `permission denied`: npm 계정 권한 또는 trusted publisher 연결 상태 확인
- `not allowed to publish with OIDC`: npm의 trusted publisher 항목(repo/workflow/environment) 값이 워크플로우와 정확히 일치하는지 확인
- `version already exists`: `package.json` 버전을 올리고 새 태그/Release로 재시도
