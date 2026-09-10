---
pubDatetime: 2026-09-10T22:00:00+09:00
title: "댓글에서 된다고 확인된 그 기능은 OpenCode 1.3.0에서 빠졌다"
lang: ko
translationKey: opencode-usage-guide-revisited
featured: false
draft: false
tags:
  - OpenCode
  - Claude Code
  - AI
  - 에이전트
  - CLI
description: "OpenCode 사용 후기와 설치 가이드를 지금 기준으로 확인했다. 글이 지금은 된다고 적은 기능은 공식 문서가 금지라고 적게 됐고, JSON 예시에는 복사하면 깨지는 흔적이 남아 있다."
---

[앞 글](/posts/oh-my-opencode-revisited/)에 이어, Claude Code의 오픈 소스 대안을
찾던 중에 스크랩해둔 것이 하나 더 있다. OpenCode와 oh-my-opencode를 일주일
써본 후기에 설치 절차와 설정 방법을 붙인
[글](https://www.gpters.org/dev/post/summary-opencode-usage-reviews-w25e8CqBmoVnv7K)이다.
Bun 설치부터 MCP 추가까지 손으로 따라갈 수 있게 적혀 있어서 앞 글보다 실용적이다.

2026년 1월 16일 글이다. 이번에는 **이 글이 무엇에 근거를 두고 있는지**가
눈에 걸렸다. 인증 문제를 다루면서 이렇게 적는다.

> **글 작성 시점 기준으로는 우회가 되어 실제 사용은 가능하지만** 약관 관점에서
> 권장하기는 어려운 상황입니다.

그리고 댓글에서 실제로 된다는 확인까지 오간다. 여덟 달 뒤에 그 기능이
어떻게 됐는지가 이 글의 내용이다.

## 목차

## 댓글에서 확인된 그 기능

댓글 하나가 저자에게 직접 묻는다.

> 일단 설치는 했는데 여기 나와있는 설치방법으로 설치하면 그 앤트로픽이 막은
> 설치를 우회하는건가요? 저는 **클로드 max plan이 그냥 인증 성공되더라구요.**

저자의 답이다.

> 넵 **Opencode 쪽에 Claude Code 로그인 기능이 붙어있습니다**

1월에는 그랬다. 지금 OpenCode 공식 문서의 Anthropic 항목은 이렇게 적혀 있다.

> There are plugins that allow you to use your Claude Pro/Max models with
> OpenCode. **Anthropic explicitly prohibits this.**
>
> Previous versions of OpenCode came bundled with these plugins but that is
> **no longer the case as of 1.3.0**

**"붙어 있던" 그 기능이 1.3.0에서 번들에서 빠졌다.** 그리고 문서가 그 용도를
"Anthropic이 명시적으로 금지한다"고 적는다.

여기서 앞 글의 서술을 한 단계 더 정확히 해둘 필요가 있다. 4월의 조치는
Anthropic이 구독 상품에서 서드파티 사용을 뺀 정책이었고, **OpenCode 쪽에서도
그 경로를 기본 배포에서 제거**했다. 회사가 막은 것과 도구가 스스로 뺀 것이
따로 있었던 셈이다.

그러니 이 글의 설치 절차를 그대로 따라가면 **4)번 로그인 단계에서 갈린다.**
Anthropic을 고르고 Claude Pro/Max로 붙는 부분이 예전 같지 않다. 나머지 절차는
멀쩡한데 그 한 단계가 다르다.

**"지금은 됩니다"는 근거로 쓰기 어렵다.** 글을 쓴 사람이 무책임했다는 뜻이
아니다. 오히려 저 문장은 정직한 편이다 — 약관상 권장하기 어렵다는 단서를
같이 달았으니까. 다만 **동작 여부는 그 시점의 사실**이라 스크랩과 함께 낡는다.

## 설치 경로는 살아 있다, 조직 이름만 바뀌었다

인증을 빼면 설치 절차 자체는 지금도 대체로 맞는다.

```bash
bun add -g opencode-ai
opencode --version
```

npm 패키지 이름 `opencode-ai`는 그대로다. 현재 버전이 **1.18.30**이니 글이
쓰이던 1.0.x대에서 한참 올라왔다.

바뀐 건 조직 이름이 드러나는 자리다. 원문의 도식이 OpenCode를 "**SST
오픈소스**"라고 적는데, 지금 공식 문서의 설치 경로는 이렇다.

| 방법 | 현재 |
| --- | --- |
| 스크립트 | `curl -fsSL https://opencode.ai/install \| bash` |
| npm | `npm install -g opencode-ai` |
| Homebrew | `brew install anomalyco/tap/opencode` |
| Docker | `docker run -it --rm ghcr.io/anomalyco/opencode` |

`sst/tap`이 아니라 **`anomalyco/tap`**이다. 앞 글에서 저장소가
`sst/opencode`에서 `anomalyco/opencode`로 옮겨간 걸 짚었는데, **패키지 경로에도
같은 변화가 반영돼 있다.** 도식의 "SST 오픈소스"는 이제 맞지 않는다.

데스크탑 앱도 원문은 "최근 베타로 출시된"이라고 소개하는데, 현재 문서는
터미널·데스크탑 앱·IDE 확장을 나란히 놓고 베타 표기를 달지 않는다.

## 붙여넣기 사고를 댓글이 잡았다, 절반만

댓글에서 다른 사람이 이걸 지적한다.

> 강준님, 일단 bun 인스톨 명령어... `curl -fsSL < https://bun.com/install > | bash`
> 여기 `< >` 이거 필요없는거 같아요.

저자도 "붙여넣기 과정에서 잘못 들어간 것 같네요"라고 인정했다. 노션 계열
편집기에서 링크를 옮길 때 생기는 흔적이다.

문제는 **같은 흔적이 글 곳곳에 더 남아 있다는 것**이다. 스크랩본에서 세어보면
여섯 군데인데, 그중 넷은 JSON 안이다.

```json
{
  "$schema": "<https://opencode.ai/config.json>",
  "mcp": {
    "linear": {
      "type": "remote",
      "url": "<https://mcp.linear.app/mcp>",
      "oauth": {}
    }
  }
}
```

**이건 복사하면 그대로 깨진다.** 명령어에 붙은 `< >`는 셸이 리다이렉션으로
해석해 눈에 띄는 에러를 내주지만, JSON 문자열 안의 `< >`는 **문법적으로
멀쩡한 값**이다. 파싱은 통과하고 그 URL로 접속만 실패한다.

댓글이 잡아준 건 눈에 띄는 쪽 하나였고, 조용히 실패하는 쪽 넷은 남았다.
**따라 하는 가이드에서 더 위험한 건 뒤쪽이다.**

## 에이전트별 MCP 제한은 Claude Code에도 있다

원문에서 OpenCode의 장점으로 든 항목 하나가 이것이다.

> **Claude code 에서는 지원하지 않는 기능이지만** opencode 에서는 특정 Agent
> 에서만 MCP 활성화, 메인 에이전트에서는 비활성화 하는 방식으로 토큰을 절약할
> 수 있습니다

OpenCode 쪽 설정은 지금도 맞다. 전역에서 끄고 특정 에이전트에서만 켜는 구조다.

```json
{
  "tools": { "my-mcp*": false },
  "agent": {
    "my-agent": {
      "tools": { "my-mcp*": true }
    }
  }
}
```

**앞부분이 지금 기준으로는 성립하지 않는다.** Claude Code 서브에이전트 문서에
같은 일을 하는 필드가 있고, MCP 서버 단위 패턴까지 받는다.

> Both fields accept **MCP server-level patterns** in addition to exact tool
> names: `mcp__<server>` or `mcp__<server>__*` grants or removes every tool
> from the named server.

문서의 예시가 정확히 그 용도다.

> This example uses `tools` to allow only Read, Grep, Glob, and Bash. The
> subagent **can't edit files, write files, or use any MCP tools**

앞 글에서도 비슷한 항목이 나왔는데, **비교 문장이 제일 먼저 상한다**는 게 여기서
또 확인된다. 토큰을 아끼려고 MCP를 에이전트별로 가르는 발상 자체는 좋고, 지금은
양쪽에서 다 된다.

## 지금도 그대로인 것들

설치와 비교를 빼면 남는 게 꽤 있다.

**프로젝트 설정 구조.** `<project>/opencode.json`과 `.opencode/` 아래
`agents/`, `commands/`, `skills/`로 나뉘는 구성은 그대로다. Claude Code의
`.claude`와 나란히 놓아 설명한 것도 이해에 도움이 된다.

**`AGENTS.md` 대 `CLAUDE.md`.** OpenCode는 `AGENTS.md`를 쓰고, 기존
`CLAUDE.md`를 계속 쓰고 싶으면 `instructions`로 지정하면 된다는 설명도
유효하다.

**MCP 설정 형태.** `type`이 `local`이면 `command` 배열, `remote`면 `url`을
쓰는 형태가 현재 문서와 같다. 다만 **명령어 목록은 늘었다.**

| 명령 | 현재 문서 |
| --- | --- |
| `opencode mcp auth <server>` | 있음 |
| `opencode mcp list` | 있음 |
| `opencode mcp logout <server>` | **추가됨** |
| `opencode mcp debug <server>` | **추가됨** |
| `opencode mcp add` | 현재 목록에서는 못 찾았다 |

원문이 config를 모르겠으면 `opencode mcp add`로 만들라고 안내하는데, 지금
문서의 MCP 명령 목록에는 그 항목이 보이지 않는다. 없어졌는지 문서에만 빠진
것인지는 확인하지 못했다.

**Claude Code 호환 레이어를 끄는 설정.** `~/.config/opencode/oh-my-opencode.json`의
`claude_code` 블록으로 `mcp`/`commands`/`skills`/`agents`/`hooks`/`plugins`를
개별로 끄는 방식은 세부 항목까지 적어둔 자료가 드물어서 여전히 쓸모가 있다.
다만 플러그인 이름이 `oh-my-openagent`로 바뀌었으니 파일 이름부터 확인해야 한다.

## 반대로 늘어난 것

원문은 "공식 지원 쪽으로 움직이는 사례"로 OpenAI와 GitHub Copilot 둘을 든다.
지금 공식 문서에는 하나가 더 있다.

> other companies (ChatGPT Plus, GitHub Copilot, **GitLab Duo**) support
> developer tool freedom with zero setup required

Copilot 쪽은 문서에 인증 방법까지 들어왔다. "To use your GitHub Copilot
subscription with opencode"로 시작해 `github.com/login/device`에서 디바이스
코드로 인증하고, 일부 모델은 Pro+ 구독이 필요하다고 적는다. 원문이 X 게시물
링크로만 걸어둔 것이 여덟 달 만에 공식 문서 항목이 됐다.

**한쪽이 닫히는 동안 다른 쪽이 열렸다.** 원문의 관찰 자체는 그대로 유효하고,
목록만 늘었다.

## 정리

- 댓글에서 "**클로드 max plan이 그냥 인증 성공되더라구요**"로 확인된 그 기능은
  **OpenCode 1.3.0에서 번들에서 빠졌다.** 현재 문서는 그 용도를 "Anthropic
  explicitly prohibits this"라고 적는다.
- 회사가 막은 것(4월 구독 정책)과 **도구가 스스로 뺀 것(1.3.0)이 따로 있다.**
- 설치 절차는 대체로 유효하다. `opencode-ai` 패키지도 그대로고 지금 버전은
  1.18.30이다. 다만 **Homebrew tap과 Docker 이미지가 `anomalyco`로 바뀌었고**,
  도식의 "SST 오픈소스"는 맞지 않는다.
- 댓글이 잡아준 `< >` 붙여넣기 흔적이 **JSON 예시 안에 넷 더 남아 있다.**
  셸에서는 에러가 나지만 **JSON에서는 조용히 통과한다.**
- "**에이전트별 MCP 제한은 Claude Code에 없다**"는 지금 기준으로 성립하지
  않는다. `tools` / `disallowedTools`가 `mcp__<server>` 패턴을 받는다.
- 여전히 유효한 것: `.opencode/` 구조, `AGENTS.md`와 `instructions`,
  MCP 설정 형태, Claude Code 호환 레이어를 항목별로 끄는 설정.
- 공식 지원 목록에 **GitLab Duo**가 추가됐고, GitHub Copilot은 문서에 인증
  절차까지 들어왔다.

앞 글이 이름과 버전이 낡는 이야기였다면, 이 글은 **근거가 낡는 이야기**다.
"지금은 됩니다"는 확인해본 사람만 쓸 수 있는 문장이라 신뢰가 가는데, 정확히 그
이유로 제일 빨리 상한다. 댓글에서 두 사람이 주고받으며 확인까지 마친 항목이
여덟 달 뒤 공식 문서에서 금지로 적히는 데까지 걸린 시간이 그 정도다.

그래서 이런 글에서 오래 가는 부분은 따로 있었다. **설정 파일이 어떻게 생겼고
무엇을 켜고 끌 수 있는지** 쪽이다. 그건 동작 확인이 아니라 구조라서, 버전이
올라가도 이름만 바뀌지 자리는 남는다.

## 참고

- [OpenCode Docs](https://opencode.ai/docs/)
- [Providers — OpenCode](https://opencode.ai/docs/providers/)
- [MCP Servers — OpenCode](https://opencode.ai/docs/mcp-servers/)
- [Subagents — Claude Code](https://code.claude.com/docs/en/sub-agents)
- [8개월 된 설치 가이드: oh-my-opencode는 이제 그 이름이 아니다](/posts/oh-my-opencode-revisited/)
- 원문: [Opencode 사용후기 및 사용방법 정리](https://www.gpters.org/dev/post/summary-opencode-usage-reviews-w25e8CqBmoVnv7K)
