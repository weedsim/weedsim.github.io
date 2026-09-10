---
pubDatetime: 2026-09-10T17:00:00+09:00
title: "8개월 된 설치 가이드: oh-my-opencode는 이제 그 이름이 아니다"
lang: ko
translationKey: oh-my-opencode-revisited
featured: false
draft: false
tags:
  - OpenCode
  - Claude Code
  - AI
  - 에이전트
  - CLI
description: "2026년 1월에 나온 oh-my-opencode 설치 가이드를 지금 기준으로 확인했다. 프로젝트 이름부터 바뀌었고, 글이 경고한 Anthropic 구독 차단은 4월에 실제로 시행됐다."
---

Claude Code의 대안을 찾던 중이었다. 조건이 두 가지 있었다. **오픈 소스일
것**, 그리고 **로컬 LLM을 붙일 수 있을 것**. 그러다 OpenCode 위에 올리는
에이전트 플러그인 **oh-my-opencode**의 설치·설정 가이드를 정리한
[글](https://goddaehee.tistory.com/485)을 스크랩해뒀었다. 설치 명령부터 인증,
설정 파일 구조, 에이전트별 모델 지정까지 한 번에 훑는 구성이라 시작점으로
쓰기 좋아 보였다.

2026년 1월 7일 글이고, 지금은 9월이다. **여덟 달이다.** 설치 가이드에게는 긴
시간이고, 실제로 그랬다. 확인해보니 **프로젝트 이름부터 바뀌어 있었고**, 글이
"권장하지 않는다"고 경고한 일은 4월에 정식으로 시행됐다. 그리고 글 안에서
서로 어긋나는 대목도 몇 군데 있다.

## 목차

## 이름부터 바뀌었다

`github.com/code-yeongyu/oh-my-opencode`로 들어가면 **`oh-my-openagent`**로
넘어간다. 공식 문서에 사유가 적혀 있다.

> The project was formerly called "oh-my-opencode" but is now
> "oh-my-openagent" to reflect its **provider-agnostic design**.

OpenCode 전용이라는 인상을 지우려는 개명이다. 실제로 지금은 Codex CLI용 경량
배포판(`npx lazycodex-ai install`)도 따로 있다.

여덟 달 치를 나란히 놓으면 이렇다.

| 항목 | 원문(2026-01) | 지금(2026-09) |
| --- | --- | --- |
| 이름 | oh-my-opencode | **oh-my-openagent (OmO)** |
| 설치 | `bunx oh-my-opencode install` | `bunx oh-my-openagent install` |
| OpenCode 최소 버전 | 1.0.150 이상 | **1.4.0 이상** |
| 에이전트 | Sisyphus + 6개 | **11개** |
| GitHub 스타 | 9,500+ | **68.9k** |
| Claude 구독 인증 | "ToS 위반, 권장 안 함" | **2026-04-04부로 차단** |

에이전트 구성도 늘기만 한 게 아니라 성격이 달라졌다. 원문의 Sisyphus·Oracle·
Librarian·Explore는 남아 있는데, 여기에 Hephaestus(자율 심층 작업),
Prometheus(전략 수립), Atlas(할 일 관리), Metis(누락 탐지), Momus(계획 검토),
Sisyphus-Junior가 붙었다.

**설치 명령 한 줄이 안 듣는 순간부터 그 글의 나머지도 못 믿게 된다.** 설정 파일
경로도, 플래그도, 모델명도 전부 그 이름을 전제하고 있기 때문이다.

## 글이 경고한 일은 실제로 일어났다

원문에서 가장 공들인 대목이 Anthropic 인증이다. 발행 이틀 뒤에 붙인 업데이트
블록이 있다.

> **\[2026-01-09 업데이트\] Anthropic OAuth 인증 제한**
>
> Anthropic이 Claude Code OAuth 토큰을 공식 Claude Code에서만 사용 가능하도록
> 기술적 제한을 적용했습니다.

그리고 결론을 이렇게 냈다.

> 단순 차단이 아닌 **계정 밴** 사례가 발생하고 있으므로, **반드시 API 키 방식을
> 사용** 하세요.

**이 판단은 맞았다.** 그리고 그 뒤로 한 단계 더 갔다. 2026년 4월 3일 보도에
따르면 Anthropic은 **4월 4일 오후 12시(PT)를 기해** Claude Pro/Max 구독으로
서드파티 에이전트를 쓰는 것을 아예 끊었다. Claude Code 총괄 Boris Cherny의
설명이 이렇다.

> We've been working hard to meet the increase in demand for Claude, and our
> subscriptions weren't built for the usage patterns of these third-party tools.

기술적 제재가 아니라 **용량 문제로 인한 정책 결정**이라는 쪽이다. 대신
기존 구독자에게 월 요금만큼의 일회성 크레딧(4월 17일까지)과 선구매 사용량
번들 최대 30% 할인을 제시했고, 남은 경로는 **종량제나 API**라고 안내했다.

원문의 "API 키를 쓰라"는 조언이 그대로 유효해진 셈인데, 배경이 다르다. 원문은
**ToS 위반과 계정 밴**을 이유로 들었고, 실제로는 **구독 상품에서 서드파티
사용을 빼는 정책**으로 정리됐다. 지금 저 글을 읽는 사람에게는 "위반이라
피해야 한다"보다 **"애초에 그 경로가 없다"**가 정확한 설명이다.

재밌는 건 oh-my-openagent 저장소 상단에 걸린 문구다. "Anthropic blocked
OpenCode because of us." 이 사건에서 자기 위치를 그렇게 잡고 있다.

## 글 안에서 어긋나는 것들

낡아서 어긋난 것과 별개로, **발행 시점에 이미 자기모순인 대목**이 있다.

| 항목 | 한쪽 | 다른 쪽 |
| --- | --- | --- |
| GitHub 스타 | 도입부 "1만 2천개 이상" | 본문 표 "Stars: 9,500+" |
| Gemini 3 모델명 | "더 이상 `-preview` 접미사가 필요하지 않다" | 트러블슈팅 "`-preview`를 붙이지 않았다"가 404 원인 |
| 에이전트 수 | 본문 "7개의 전문 에이전트가 병렬로" | 비교표 "Sisyphus + 6개 (총 7개)" |
| 순정 OpenCode | 비교표 "build/plan + @general (3개)" | 본문 "Build와 Plan 에이전트 2개로" |
| 계정 밴 | "계정 밴 사례가 발생하고 있으므로" | "이 이슈로 차단된 계정은 모두 해제 완료" |

스타 수는 둘 다 **"2026년 1월 초 기준"**이라고 못 박혀 있다. 도입부만 나중에
갱신하고 본문 표는 그대로 둔 흔적으로 보인다.

`-preview` 쪽은 실제로 따라 하다 막히는 자리다. 본문 중간에서는 GA 출시로
접미사가 필요 없어졌다며 `google/gemini-3-flash`를 권하는데,

```json
"model": "google/gemini-3-flash"
"model": "google/gemini-3-pro"
```

같은 글 트러블슈팅 5번에서는 바로 그 표기를 404 원인으로 지목한다.

```json
// ❌ 잘못된 설정 (404 발생)
"model": "google/gemini-3-flash"

// ✅ 올바른 설정
"model": "google/gemini-3-flash-preview"
```

**정면으로 부딪힌다.** 그리고 글의 설정 예시(`oh-my-opencode.json`)는
`-preview`를 쓰고 있어서, GA 안내 쪽이 나중에 끼워 넣어졌으나 나머지에 반영되지
않은 것으로 보인다. 어느 쪽이 맞든 **한 글 안에서 답이 둘이면 독자가 고를 수
없다.**

에이전트 수도 마찬가지다. "Sisyphus 오케스트레이터가 이끄는 7개의 전문
에이전트"면 총 8개인데, 비교표는 "총 7개"라고 적는다. 표의 에이전트 목록을
세면 Sisyphus 포함 7개다.

## 저장소 주소가 세 개다

원문이 인용하는 GitHub 이슈 링크가 **서로 다른 세 조직**을 가리킨다.

- `anomalyco/opencode/issues/6930` — Anthropic OAuth 관련
- `opencode-ai/opencode/issues/{523,530,541}` — 종료·백그라운드 이슈
- `sst/opencode` — 참고 자료의 "OpenCode 소스 코드"

확인해보니 현재 공식 문서(`opencode.ai/docs`)가 가리키는 저장소는
**`anomalyco/opencode`**다. 사이트 하단도 Anomaly 저작권 표기다. `sst/opencode`는
그 이전 조직명이다.

문제는 가운데다. **`opencode-ai/opencode`는 아카이브된 다른 프로젝트다.**
저장소 상단 배너가 이렇게 말한다.

> This repository is no longer maintained and has been archived for provenance.
> The project has continued under the name **Crush**, developed by the original
> author and the Charm team.

Go로 만들어진 별개의 터미널 AI 도구이고, 지금은 Charm의 Crush로 이어졌다.
이름이 같아서 섞인 것으로 보이는데, **트러블슈팅 7·8번의 근거 링크가 엉뚱한
프로젝트를 향하고 있다는 뜻**이다. 증상 설명 자체는 쓸 만하지만 링크를 따라가
확인할 수는 없다.

## Claude Code 비교는 지금 기준으로 성립하지 않는다

원문의 FAQ에 이런 답이 있다.

> Claude Code는 Claude 모델만 사용할 수 있지만, oh-my-opencode는 Claude,
> ChatGPT, Gemini를 역할별로 최적화하여 사용한다. 또한 **멀티 에이전트 협업,
> 병렬 실행**, Todo Enforcer 등 **Claude Code에 없는 기능**을 제공한다.

앞부분은 공정하다. 뒷부분이 현재 문서와 어긋난다. Claude Code 서브에이전트
문서의 표현이다.

> Each subagent runs in its own context window with a custom system prompt,
> specific tool access, and independent permissions.
>
> For independent investigations, **spawn multiple subagents to work
> simultaneously**.
>
> **Background subagents** run concurrently while you continue working.

멀티 에이전트도 병렬 실행도 있다. 비교표의 "**모델 선택: 단일 모델 사용**"도
마찬가지다.

> The `model` field controls which model the subagent uses.

서브에이전트마다 모델을 지정한다. Claude 계열 안에서라는 제약은 있지만,
"단일 모델"은 아니다.

Hook 쪽도 이름이 맞지 않는다. 원문은 "Claude Code와 **완전 호환**"이라며
`PreToolExecution` / `PostToolExecution` / `Notification` / `Stop` 네 가지를
든다. 그런데 Claude Code가 문서에 올려둔 이벤트 이름은 `PreToolUse`,
`PostToolUse`를 포함해 서른 개가 넘는다. `Notification`과 `Stop`은 겹치지만
앞의 둘은 **이름이 다르다.** 원문의 목록만으로는 "완전 호환"이 무엇을 뜻하는지
확인할 수 없다.

다만 이건 **여덟 달이라는 시차를 감안해야 할 항목**이다. 비교 글은 원래 제일
먼저 상한다. 지금 이 글을 읽고 도구를 고르려는 사람에게는 성립하지 않는다는
것이 요점이지, 저자가 없는 말을 지어냈다는 뜻은 아니다.

## 제목이 약속한 슬래시 명령어

제목에 "**기본 명령어, 슬래시 명령어**, 연동 방법 등"이 들어 있다. 본문에서
슬래시 명령어는 셋뿐이고, 셋 다 트러블슈팅이나 각주 맥락에서 스쳐 지나간다.

- `/connect` — OpenAI OAuth 로그인
- `/exit` — 종료(이걸로 종료해도 백그라운드 에이전트가 남는다는 이슈 설명 중)
- `/tasks` — 실행 중인 태스크 확인

`/init`이나 `/model` 같은 건 아예 없다. 기본 명령어 챕터도 없는데, 저자가
서두에서 **Part 1을 먼저 읽고 오라**고 전제해뒀기 때문이다. 시리즈의 2편이라
그런 것이니 글 자체의 결함이라기보다는, **검색으로 이 글에 바로 닿은 사람에게
제목이 과하게 약속한다**는 쪽이다.

## 그래도 남는 것

낡은 것과 별개로, 여덟 달 뒤에도 그대로인 설계가 있다.

**컨텍스트 자동 주입.** 파일을 읽으면 그 디렉토리부터 프로젝트 루트까지의
`AGENTS.md`와 `README.md`를 모두 주입하고, 각 디렉토리 컨텍스트는 세션당 한
번만 넣는다. 현재 문서도 같은 기능을 유지하고 있다.

**MCP 큐레이션.** Exa(웹 검색), Context7(공식 문서), Grep.app(GitHub 코드
검색) 세 개를 기본 포함한다는 것도 지금 문서에 그대로 있다.

**다계정 부하 분산.** Google 계정을 여러 개 등록해 rate limit을 넘기는 구조도
남아 있다. 다만 원문이 이걸 "무료로 rate limit 극복하기"라고 소개하면서 바로
다음 문장에 "단, Google의 서비스 약관을 준수해야 한다"를 붙인 건 **앞뒤가
맞지 않는다.** 우회를 권하면서 준수를 덧붙이면 독자가 판단할 근거가 없다.

**비용 구조에 대한 경고.** 구독료와 API 비용의 이중 부담, Opus 계열의 단가,
단순 작업에는 순정 도구를 쓰라는 조언은 지금도 유효하다. 오히려 4월 이후로
더 유효해졌다.

## 로컬 LLM 쪽은 여전히 비어 있다

내가 이 글을 스크랩한 이유가 여기 걸린다. 원문의 FAQ가 이렇게 답한다.

> A: oh-my-opencode는 기본적으로 Claude, ChatGPT, Gemini 구독을 전제로
> 설계되었다. **로컬 모델과의 호환성은 공식 문서에서 명확히 언급되지 않으며,
> 실제 테스트가 필요하다.**

정직한 답이다. 그리고 여덟 달 뒤에도 크게 달라지지 않았다. 현재 문서에서
Ollama가 등장하는 자리는 Sisyphus의 폴백 체인 한 줄인데, 이름이
**`ollama-cloud`**다. 로컬 실행이 아니라 Ollama의 클라우드 쪽을 가리키는
것으로 읽힌다. 커스텀 엔드포인트를 설정에서 감지해준다는 언급은 있지만,
**로컬 모델을 어떻게 붙이는지에 대한 안내는 내가 찾은 범위에서는 없었다.**

권장 구성도 그대로다. 문서가 Sisyphus에 권하는 모델은 Claude Opus 5이고,
나머지 체인도 Kimi K3, GPT-5.6, GLM-5.2 같은 호스팅 모델이다. 이름을
`oh-my-openagent`로 바꾼 이유가 "provider-agnostic"인데, **여기서 provider는
여러 회사를 뜻하지 로컬을 뜻하지 않는다.**

## 정리

- **프로젝트 이름이 `oh-my-openagent`로 바뀌었다.** 설치 명령이
  `bunx oh-my-openagent install`이고, OpenCode 최소 요구 버전도 1.0.150에서
  1.4.0으로 올랐다. 에이전트는 7개에서 11개가 됐다.
- **글이 경고한 Anthropic 구독 차단은 2026년 4월 4일 정식 시행됐다.** 다만
  이유가 ToS 위반이 아니라 **구독 상품에서 서드파티 사용을 제외하는 정책**으로
  정리됐다.
- 글 안에 **자기모순이 다섯 군데** 있다. 특히 Gemini 3 모델명의 `-preview`는
  본문과 트러블슈팅이 정반대를 말해서 따라 하다 막힌다.
- **인용된 GitHub 저장소가 세 조직으로 갈려 있다.** 그중
  `opencode-ai/opencode`는 **아카이브된 다른 프로젝트**(현 Crush)라 근거 링크가
  엉뚱한 곳을 가리킨다.
- **Claude Code 비교는 지금 기준으로 성립하지 않는다.** 서브에이전트, 병렬
  실행, 에이전트별 모델 지정이 모두 문서에 있다.
- 제목이 약속한 슬래시 명령어는 `/connect`, `/exit`, `/tasks` 셋뿐이다.
  시리즈 1편을 전제한 글이다.
- 반면 **컨텍스트 자동 주입, MCP 큐레이션, 다계정 분산, 비용 경고**는 지금도
  유효하다.
- **로컬 LLM은 여전히 안내가 없다.** 문서에 보이는 Ollama는 `ollama-cloud`이고,
  권장 구성은 전부 호스팅 모델이다.

도구 소개 글에서 제일 먼저 상하는 건 **설치 명령과 비교표**다. 둘 다 그 순간의
사실이라서 그렇다. 오래 가는 건 **왜 그렇게 설계했는지** 쪽이었다 — 컨텍스트를
어떻게 주입하는지, 무엇을 위임하는지, 비용이 어디서 새는지.

찾던 두 조건으로 돌아오면 답이 갈린다. **오픈 소스라는 쪽은 그대로다.** 반면
**로컬 LLM은 여전히 아니다.** 오히려 4월의 구독 차단 이후로 이 도구가 서 있는
자리가 더 분명해졌는데, 여러 회사의 호스팅 모델을 역할별로 갈라 쓰는 구조이지
내 기계에서 돌리는 구조가 아니다. Claude Code 하나에 묶이지 않으려는
목적이라면 맞고, **바깥에 아무것도 부르지 않으려는 목적이라면 여기가 아니다.**

스크랩해둔 설치 가이드를 여덟 달 뒤에 여는 일은 앞으로도 생길 것이다.
**저장소를 먼저 열어보는 것**이 이 글에서 얻은 순서다. 이름이 그대로인지부터
확인하면 나머지를 읽을지 말지가 정해진다.

## 참고

- [code-yeongyu/oh-my-openagent — GitHub](https://github.com/code-yeongyu/oh-my-openagent)
- [Oh My OpenAgent Docs](https://omo.dev/docs)
- [OpenCode Docs](https://opencode.ai/docs/)
- [opencode-ai/opencode (아카이브) — GitHub](https://github.com/opencode-ai/opencode)
- [Anthropic cuts off the ability to use Claude subscriptions with OpenClaw and third-party AI agents — VentureBeat](https://venturebeat.com/technology/anthropic-cuts-off-the-ability-to-use-claude-subscriptions-with-openclaw-and)
- [Subagents — Claude Code](https://code.claude.com/docs/en/sub-agents)
- [Hooks — Claude Code](https://code.claude.com/docs/en/hooks)
- 원문: [Open Code 리뷰(2) : oh-my-opencode 설치 및 설정 방법](https://goddaehee.tistory.com/485)
