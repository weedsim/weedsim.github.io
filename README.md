# 다다익선 개발자

Unity 클라이언트 개발자 심호연의 기술 블로그 겸 포트폴리오입니다.

🔗 https://weedsim.github.io

## 다루는 것

- Unity 클라이언트 개발 — 게임 시스템 구조 설계와 구현
- 멀티플레이 / 서버 프로그래밍
- 개발하면서 부딪힌 문제와 해결 과정

## 기술 스택

| | |
|---|---|
| 프레임워크 | Astro 7 |
| 스타일 | Tailwind CSS 4 |
| 검색 | Pagefind |
| 패키지 매니저 | pnpm 11 |
| 배포 | GitHub Actions → GitHub Pages |

## 로컬 실행

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 배포 산출물 생성 (dist/)
```

Node.js 22.12 이상이 필요합니다.

## 공급망 보안 설정

`pnpm-workspace.yaml`에 다음 정책을 적용했습니다.

- `minimumReleaseAge: 10080` — 배포 후 7일이 지난 패키지만 설치
- `trustPolicy: no-downgrade` — 배포 신뢰 수준이 이전 릴리스보다 낮아진 버전 차단
- `blockExoticSubdeps: true` — 이행 의존성의 git/tarball 등 비표준 소스 차단
- `allowBuilds` — 설치 시 실행되는 스크립트 없음

예외 항목은 사유와 재확인 기한을 주석으로 명시했습니다.

## 라이선스

[AstroPaper](https://github.com/satnaing/astro-paper) (MIT, © Sat Naing) 기반으로 제작했습니다.