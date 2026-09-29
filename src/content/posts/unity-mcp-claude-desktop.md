---
pubDatetime: 2026-09-29T18:00:00+09:00
title: "Claude Code에 돈을 내야 하는 건 MCP 때문이 아니다"
lang: ko
translationKey: unity-mcp-claude-desktop
featured: false
draft: false
tags:
  - Unity
  - MCP
  - AI
  - 에이전트
description: "MCP for Unity를 붙이는 절차는 따라 할 만하다. 다만 글이 출발점으로 삼은 전제 — 'Claude Code는 MCP 연결에 결제가 필요하다' — 가 문서와 다르고, 제품 이름 둘이 섞여 있다."
---

**AI 도구를 써서 Unity 프로젝트 개발을 실제로 진행할 수 있는지** 알아보던 중에
스크랩한 글이다. Unity 에디터를 MCP로 AI 클라이언트에 붙이는 방법을 2026년
2월에 정리한 것으로, 에셋스토어에서 MCP for Unity를 받고 필요한 런타임을 깔고
전송 방식을 바꿔 연결까지 가는 과정을 화면별로 따라간다. **막히는 지점을 실제로
겪고 적어둔 글**이라 그 부분이 특히 쓸모 있다.

다만 글이 **출발점으로 삼은 전제**가 문서와 다르다.

> 하지만 Claude Code는 **유료 결제를 해야 MCP 연결이 가능하다고 들어서**
> 무료버전을 써도 되는 Claude Code Desktop과 유니티를 연결하려 한다

결론(결제가 필요하다)은 맞는데 **이유가 다르다.** 그리고 이 한 문장 안에
**서로 다른 제품 이름 둘**이 섞여 있다.

## 목차

## 절차 자체는 지금도 유효하다

먼저 맞는 쪽부터. 클리핑이 준 UPM Git URL은 저장소 README의 것과 **글자 그대로
같다.**

```
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
```

README가 이 URL을 그대로 적고, 대안 두 가지를 덧붙인다.

> 현재 릴리스로 고정하려면 **`#v10.0.0`** 으로 핀을 걸거나, OpenUPM을 쓴다:
> `openupm add com.coplaydev.unity-mcp`

에셋스토어에서 무료로 받을 수 있다는 것도 맞다. 요구 사항도 확인된다.

> Unity **2021.3 LTS부터 6.x까지**
> Python **3.10 이상** (`uv`로 설치)

클리핑의 2단계 "필요한 요소들 다운로드"에서 빨간불이 뜨는 게 바로 이
`uv`/Python이다. **빨간불이 정상**이고, 창이 알려주는 링크로 깔면 초록불이
된다는 서술은 정확하다.

한 가지 움직인 게 있다. README가 지금 권하는 경로는 **`Window → MCP for
Unity → Configure All Detected Clients`** 한 번이다. 클리핑이 밟는
`Toggle MCP Window` → 클라이언트별 `Configure`보다 단계가 줄었다. 글이 2026년
2월이고 README의 현재 릴리스가 v10.0.0이니, **화면이 글과 다르면 그쪽을
먼저 의심하면 된다.**

## "MCP 때문에 유료"가 아니다

클리핑의 전제를 문서와 맞춰보자. Claude Code의 MCP 문서에는 **요금제 이야기가
없다.** 플랜 요구 사항은 다른 문서에 있고, 대상이 MCP가 아니다.

> Claude Code는 **Pro, Max, Team, Enterprise, 또는 Console 계정이 필요하다.
> 무료 claude.ai 플랜에는 Claude Code 접근이 포함되지 않는다.** 서드파티 API
> 제공자와 함께 쓸 수도 있다.

**결제 장벽은 MCP가 아니라 Claude Code 자체에 있다.** 차이가 실무에서 갈린다.

| | 클리핑의 이해 | 문서 |
|---|---|---|
| 무엇이 유료인가 | MCP 연결 기능 | **Claude Code 제품 전체** |
| Pro를 결제하면 | MCP가 열린다 | Claude Code가 열리고, **MCP는 원래 별도 관문이 없다** |
| 무료로 가려면 | MCP를 피한다 | **무료 플랜에 포함된 클라이언트를 쓴다** |

세 번째 줄이 중요하다. 클리핑이 **실제로 한 선택은 맞다** — 무료로 쓰려면
Claude Code가 아닌 다른 클라이언트를 쓰는 것. 다만 그 이유를 "MCP가 유료라서"로
적어두면, 나중에 Pro를 결제하고도 "MCP를 따로 켜야 하나" 하고 찾게 된다.
**그런 스위치는 없다.**

## "Claude Code Desktop"이라는 제품은 없다

같은 문장에 제품 이름 둘이 붙어 있다. 정리하면 이렇다.

- **Claude Code** — 터미널에서 도는 에이전틱 코딩 도구. 위 인용대로 **무료
  플랜에 포함되지 않는다.**
- **Claude 데스크톱 앱** — 대화형 앱. 클리핑이 4단계에서 "설정 > 개발자"를
  열고 `running`을 확인한 그 앱이다.

클리핑이 실제로 연결한 것은 **뒤쪽**이다. 제목과 본문의 "Claude Code Desktop"은
앞의 이름을 가져다 뒤의 것에 붙인 셈이다.

헷갈릴 만한 사정도 있다. 지금 Claude Code 문서에는 이런 안내가 붙어 있다.

> 그래픽 인터페이스를 선호하나? **Desktop 앱**을 쓰면 터미널 없이 Claude Code를
> 쓸 수 있다.

**Claude Code를 띄우는 데스크톱 앱이 따로 생겼다.** 그래도 요금제 조건은 그대로
Claude Code의 것이다. 이름이 비슷해졌을 뿐, "데스크톱이니까 무료"가 되지는
않는다. MCP for Unity의 README도 두 이름을 나란히, 그러나 **따로** 적는다.

> Claude Desktop, **Claude Code**, Cursor, VS Code, Windsurf, Cline, Gemini
> CLI 등과 동작한다.

## HTTP가 아니라 stdio — 이 글이 건진 것

클리핑에서 가장 값어치 있는 부분이다. Configure를 눌렀더니 오류가 났고,
설정 안내문이 이렇게 말했다는 것이다.

> Claude Desktop은 HTTP 전송 방식을 지원하지 않아 Advanced Settings에 가서
> HTTP 대신 stdio로 하라고 한다

그런데 안내가 가리킨 Advanced 창에 그 설정이 없었다. 글쓴이가 찾아낸 답이
이거다.

> **그냥 맨위에 HTTP Local로 되어있던 설정 Stdio로 바꾸고 Start server 해주면
> 된다**

**안내문이 가리킨 곳과 실제 설정이 있는 곳이 달랐다.** 문서로는 안 나오고
직접 부딪혀야 나오는 종류의 정보이고, 이 글의 존재 이유이기도 하다.

배경을 덧붙이면, Anthropic이 문서화한 **Claude 데스크톱의 로컬 MCP 경로는 지금
확장(Extension)** 쪽이다. 도움말 문서가 설명하는 설치 방법이 이렇다.

> 디렉터리에서 설치: Claude Desktop에서 **Settings > Extensions**로 이동

> 커스텀 확장 설치: **'Advanced settings'**를 클릭하고 **Extension Developer**
> 섹션을 찾는다

JSON 설정 파일을 직접 만지는 대신 **`.mcpb` 파일을 UI로 설치**하는 흐름이다.
MCP for Unity처럼 설정을 대신 써주는 도구를 쓰면 이 차이가 잘 안 보이는데,
**직접 손봐야 할 때 찾아갈 자리가 바뀌었다는 것**은 알아둘 만하다.

## 이 도구가 실제로 할 수 있는 일

클리핑의 5단계가 "테스트"인데, 결과가 이렇다.

> 알아서 prefab과 코드, texture 등을 만든 모습

그리고 권한 요청에 대해서는 이렇게 적는다.

> 중간중간 이런식으로 Find in File 하는 권한을 허용해달라고 요청한다
> **알잘딱으로 허용 / 거부 하자**

**"알잘딱"으로 결정하기에는 범위가 넓다.** README가 밝히는 규모다.

> 씬 생성, C# 스크립트 편집, 에셋 관리, 테스트, 프로파일링, 빌드 자동화를
> 아우르는 **47개의 도구 엔드포인트**

씬 생성과 **C# 스크립트 편집**과 **빌드 자동화**가 같은 목록에 있다. 즉 이
연결을 켜는 순간, 대화 상대가 **프로젝트 파일을 쓰고 지울 수 있는 경로**가
열린다. 프리팹 하나 만들어주는 것과 스크립트를 고치는 것은 같은 권한 위에
있다.

MIT 라이선스의 오픈소스이고 저장소도 공개되어 있으니 **무엇을 할 수 있는지
읽어볼 수 있다는 점은 좋다.** 다만 읽지 않고 켜면 범위를 모르는 채로 켜는
것이다.

## 어디에 왜 쓰나

클리핑이 마지막에 밝힌 용도가 정확하다.

> 이제 무료로 클로드와 연동도 되는 것을 확인했으니 **프로젝트의 최적화 / 전체
> 개요 파악** 등에 쓸 생각이다

**읽기 중심의 용도**다. 프로젝트 구조 파악, 어디에 무엇이 있는지 찾기, 설정
훑기. 이쪽이 이 도구의 가장 안전하고 가장 효과적인 쓰임이다.

### 연결하기 전에 해둘 것

세 가지다. 순서가 중요하다.

1. **버전 관리에 커밋해둔다.** 되돌릴 수 있어야 실험할 수 있다. 에디터를
   붙이는 순간부터 파일이 바뀔 수 있다.
2. **연습용 프로젝트로 먼저 켠다.** 47개 엔드포인트가 무엇을 하는지 감을
   잡기 전에 실제 프로젝트에 붙이지 않는다.
3. **패키지 버전을 핀으로 고정한다.** README가 `#v10.0.0` 형태를 안내한다.
   `#main`으로 두면 다음에 열 때 도구 목록이 달라져 있을 수 있다.

```
# 고정
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#v10.0.0

# 최신 추종 (클리핑이 적은 형태)
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
```

### 무엇을 허용하고 무엇을 막나

권한 요청이 올 때 판단 기준을 미리 정해두면 "알잘딱"이 아니게 된다.

| 요청 | 기준 |
|---|---|
| 읽기(파일 찾기, 씬 조회, 컴포넌트 확인) | 대체로 허용. 되돌릴 게 없다 |
| 새 에셋·프리팹 생성 | 허용하되 **어디에** 만드는지 본다 |
| 기존 스크립트 수정 | **커밋 상태를 확인하고** 허용. diff를 직접 읽는다 |
| 삭제, 빌드 설정 변경 | **거부하고 직접 한다** |

마지막 줄이 이 블로그의 다른 작업에서도 쓰는 기준과 같다. **설치나 시스템
변경, 되돌리기 어려운 동작은 사람이 직접 실행한다.** 명령을 받아보고 내가
누르는 편이, 누른 뒤에 무엇이 일어났는지 되짚는 것보다 언제나 싸다.

### 쓰지 말아야 할 자리

- **커밋하지 않은 작업 트리에 붙이기.** 되돌릴 수 없는 상태에서 쓰기 권한을
  연다.
- **"MCP가 유료라서"로 도구를 고르기.** 결제 조건은 클라이언트 제품에 붙어
  있지 MCP에 붙어 있지 않다.
- **`#main`으로 두고 잊기.** 도구 목록과 UI가 바뀐다. 이 클리핑이 반년 만에
  화면이 달라진 게 그 예다.
- **삭제·빌드 설정을 위임하기.** 되돌리는 비용이 맡기는 이득보다 크다.
- **읽기 용도로 충분한 일에 쓰기 권한까지 열기.** 개요 파악이 목적이면 읽기만
  있어도 된다.

## 정리

- **UPM Git URL과 요구 사항은 지금도 맞다.** Unity 2021.3 LTS~6.x, Python
  3.10+(`uv`). 2단계에서 빨간불이 뜨는 게 정상이다.
- **권장 경로는 줄었다.** README는 `Window → MCP for Unity → Configure All
  Detected Clients` 한 번을 안내한다.
- **"MCP 연결에 결제가 필요"한 게 아니다.** 문서 표현으로 **"Claude Code는
  Pro, Max, Team, Enterprise, 또는 Console 계정이 필요하다"**이고, 무료
  claude.ai 플랜에 **Claude Code 자체가** 포함되지 않는다. MCP에 별도 관문은
  없다.
- **"Claude Code Desktop"은 제품명이 아니다.** Claude Code(코딩 도구)와 Claude
  데스크톱 앱은 별개다. 클리핑이 연결한 것은 뒤쪽이다.
- 지금은 **Claude Code를 띄우는 Desktop 앱**도 따로 있어서 이름이 더
  헷갈린다. 그래도 요금제 조건은 Claude Code의 것을 따른다.
- **stdio 우회는 이 글이 건진 실제 정보다.** 안내문이 가리킨 Advanced 창이
  아니라 맨 위 설정을 바꿔야 했다.
- **Anthropic이 문서화한 Claude 데스크톱의 로컬 MCP 경로는 확장(Extensions)
  쪽**으로 옮겨갔다. `Settings > Extensions`, 그리고 커스텀은 `Advanced
  settings`의 Extension Developer 섹션이다.
- **47개 엔드포인트**에 C# 스크립트 편집과 빌드 자동화가 포함된다. "알잘딱"
  으로 허용할 범위가 아니다.

붙이는 절차를 다룬 글이 대개 그렇듯, **켠 다음에 무엇을 조심해야 하는지는
잘 안 적힌다.** 이 글도 마지막에 용도를 "최적화 / 전체 개요 파악"으로
정확하게 잡아놓고, 그 사이의 권한 이야기는 한 줄로 넘어간다. 읽기만 하려고
켜는 연결에도 **쓰기 권한이 같이 딸려 온다**는 것이 그 한 줄에 들어갈
내용이다.

"AI로 개발을 진행할 수 있나"가 출발점이었다면 답은 **"된다, 그리고 그게
문제다"** 쪽이다. 47개 엔드포인트에 스크립트 편집과 빌드 자동화가 들어 있으니
기술적으로는 가능하다. 그래서 고를 것은 **되냐 안 되냐**가 아니라 **어디까지
맡기고 어디부터 직접 누를 것인가**가 된다.

---

### 참고

- [MCP for Unity — CoplayDev/unity-mcp README](https://github.com/CoplayDev/unity-mcp)
- [MCP for Unity — Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/mcp-for-unity-ai-driven-development-329908)
- [Claude Code 고급 설정 — 인증과 플랜 요건](https://code.claude.com/docs/en/setup)
- [Claude Code의 MCP 문서](https://code.claude.com/docs/en/mcp)
- [Claude 데스크톱의 로컬 MCP 서버 시작하기 — Claude 도움말](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

이 글의 출발점이 된 자료는 [굴러다니다니 — \[Unity\] 유니티와 클로드코드 데스크탑을 연결하자 (ClaudeCode Desktop MCP)](https://dani2344.tistory.com/188)
(2026-02-04)이다. 설치와 연결 절차를 그대로 따라가면서, 요금제 전제와 제품
이름을 Anthropic 공식 문서와, 패키지 정보를 저장소 README와 대조했다.
