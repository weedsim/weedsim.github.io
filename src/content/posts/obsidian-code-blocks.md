---
pubDatetime: 2026-10-06T19:20:00+09:00
title: "백틱은 세 개가 아니라 세 개 이상이다"
lang: ko
translationKey: obsidian-code-blocks
featured: false
draft: false
tags:
  - Obsidian
  - 마크다운
description: "옵시디언 코드 블록 정리글이다. 설명은 대체로 맞는데, 백틱을 '세 개'로 못 박은 자리에서 글 자신의 첫 예제가 걸린다. 코드 블록 안에 코드 블록을 넣으려고 백틱을 이스케이프했는데, 문서에는 그럴 필요가 없다고 적혀 있다."
---

**예전에 옵시디언 노트에 예시 코드를 넣으면서 방법을 찾던 중** 스크랩한 글이다.
지금은 스크랩을 쌓아두는 보관함으로 쓰고 있지만, 그때는 코드 조각을 어떻게
담아둘지가 먼저 걸렸다. 2024년 글이고 **개요부터 플러그인까지 일곱 절**로 짧게
정리돼 있다.

대체로 맞는다. 콜아웃으로 접는 방법, Prism을 쓴다는 것, 플러그인 선택지까지
확인해보면 다 실재한다.

걸리는 건 첫 절이다.

> 인라인 코드에는 백틱(\`) 한 개를, 코드 블록에는 **세 개의 백틱**(\`\`\`)을
> 사용하여 생성할 수 있습니다.

그리고 바로 위에 붙은 예제가 이렇게 생겼다.

````text
```
\`\`\`

이것은 코드 블록입니다

\`\`\`
```
````

**백틱이 백슬래시로 이스케이프되어 있다.** 코드 블록을 보여주는 코드 블록을
만들려다 안쪽 백틱이 바깥 울타리를 닫아버려서, 한 글자씩 escape한 것이다.
공식 문서에는 그럴 필요가 없다고 적혀 있다.

## 목차

## 백틱은 세 개가 아니라 세 개 이상이다

옵시디언 공식 문서의 코드 블록 설명은 이렇다.

> Enclose code with **three or more backticks** or **three or more tildes**.

**"세 개"가 아니라 "세 개 이상"**이고, 백틱만이 아니라 틸드도 된다. 그리고 바로
이어서 중첩 규칙을 적는다.

> The outer code block must use **more** fence characters (backticks or tildes)
> than any inner code block, or use a **different fence character type**.

**바깥이 안쪽보다 많으면 된다.** 이스케이프가 필요한 자리가 아니다. 위 예제는
이렇게 쓰면 된다.

`````text
````
```
이것은 코드 블록입니다
```
````
`````

바깥이 백틱 네 개, 안쪽이 세 개다. 또는 종류를 바꿔도 된다.

````text
~~~
```
이것은 코드 블록입니다
```
~~~
````

이 글도 그 규칙으로 쓰고 있다. 위의 두 예제는 각각 **백틱 다섯 개**와 **네
개**로 감싸져 있다. 안쪽에 네 개짜리와 세 개짜리가 들어 있으니 바깥은 그보다
많아야 한다.

세 개로 못 박아 외우면 **코드 블록을 설명하는 글을 쓸 수 없다.** 마크다운
자체를 다루는 문서, 셸 스크립트 안의 heredoc, 다른 사람의 코드 블록을 인용하는
경우가 전부 여기 걸린다. 클리핑이 escape로 돌아간 이유도 그것이다.

### 틸드와 들여쓰기도 있다

문서가 세는 방법은 셋이다.

| 방법 | 쓰는 자리 |
| --- | --- |
| 백틱 세 개 이상 | 기본. 언어 지정이 가능하다 |
| 틸드 세 개 이상 | 안쪽에 백틱 울타리가 있을 때 종류를 바꾸는 쪽 |
| Tab 또는 공백 4칸 들여쓰기 | 언어를 지정할 수 없다 |

> Alternatively, indent using **Tab** or **4 blank spaces**.

들여쓰기 방식은 CommonMark의 indented code block이고, **언어 식별자를 붙일
자리가 없다.** 구문 강조를 쓰려면 울타리 방식이어야 한다. 옛 문서나 옛 글에서
들여쓴 코드가 강조 없이 나오는 이유다.

## 인라인 코드도 한 개가 아닐 수 있다

인라인 코드 쪽도 같은 성질이 있다. 문서의 설명이다.

> Text inside `backticks` on a line will be formatted like code.

> inline ``code with a backtick ` inside``

**안에 백틱이 들어가면 바깥을 두 개로 늘린다.** 코드 블록의 중첩 규칙과 같은
원리이고, 같은 이유로 "한 개"로 외우면 막힌다.

실무에서 이게 걸리는 자리는 분명하다. 마크다운 문법을 설명할 때, 셸의 명령
치환(`` `cmd` ``)을 인용할 때, 그리고 **지금 이 문장처럼 백틱 자체를 보여줄
때**다. 바로 앞의 `` `cmd` ``도 바깥을 두 개로 쓴 것이다.

## 접는 건 코드 블록이 아니라 콜아웃이다

클리핑의 두 번째 절이다.

> 코드 블록을 접고싶을 땐, 접을 수 있는 콜아웃 안에 넣으면 됩니다.

맞는 방법이고, 공식 문서가 두 조건을 다 보증한다. 먼저 콜아웃을 접는 문법이다.

> You can make a callout foldable by adding a plus (`+`) or a minus (`-`)
> directly after the type identifier.

> A plus sign **expands** the callout by default, and a minus sign **collapses**
> it instead.

클리핑의 예제가 쓴 `-`가 **기본 접힘**이다. 펼친 상태로 두려면 `+`다. 그리고
콜아웃 안에 코드 블록을 넣는 것도 문서에 적혀 있다 — 콜아웃은 마크다운, 내부
링크, 임베드를 품을 수 있고, 목록과 코드 블록을 선택해 콜아웃으로 감싸는 명령도
있다.

중요한 건 **이게 코드 블록의 기능이 아니라는 점**이다. 마크다운에도
옵시디언에도 코드 블록 자체를 접는 문법은 없다. 콜아웃의 접기를 빌려 쓰는
우회다. 그래서 접힌 상태의 제목이 콜아웃 제목이 되고, 아이콘도 콜아웃 타입의
아이콘이 붙는다.

````text
> [!note]- 전체 설정 파일
> ```json
> {
>   "name": "Game.Input",
>   "references": ["Unity.InputSystem"]
> }
> ```
````

**모든 줄에 `>`가 붙는다.** 울타리 줄까지 포함해서다. 하나라도 빠지면 콜아웃이
거기서 끊기고 코드 블록만 바깥으로 떨어져 나온다. 클리핑의 예제는 이 부분을
제대로 적어뒀다.

덧붙이면 **이 블로그에서도 그대로 쓸 수 있다.** 이 사이트는 콜아웃을
`rehype-callouts`로 렌더링하고 Obsidian 테마를 쓰는데, 그 패키지가 이렇게
적는다.

> Supports collapsible callouts with `-/+` and nestable callouts.

옵시디언에서 접어둔 글을 그대로 올려도 접힌 상태로 나온다는 뜻이다. 보관함과
블로그 사이에서 깨지지 않는 몇 안 되는 문법이다.

## Prism은 읽기 모드 쪽이다

구문 강조 절이다.

> 옵시디언은 **300여개의** 다양한 언어를 지원하는 Prism 라이브러리를 사용합니다.

Prism을 쓴다는 건 공식 문서가 직접 적는다.

> Obsidian uses **Prism** for syntax highlighting.

숫자는 Prism 쪽에서 확인된다. 지원 언어 목록 페이지가 세어둔다.

> This is the list of all **297 languages** currently supported by Prism

297이다. "300여개"는 넘는 쪽으로 반올림한 값이고, 확인 시점은 2026-10-06이다.
Prism에 언어가 추가되면 바뀐다.

숫자보다 중요한 게 뒤에 있다. 클리핑은 같은 절에서 플러그인 하나를 권한다.

> 고급 기능이 필요한 경우 Editor Syntax Highlight 플러그인을 사용해 보세요.

**왜 그 플러그인이 필요한지가 적혀 있지 않다.** 플러그인의 README를 보면 답이
나온다.

> A plugin for Obsidian which allows syntax highlighting for code blocks **in
> the editor**.

> imports a bunch of syntax highlighting modes **from CodeMirror**

Prism이 아니라 **CodeMirror**다. 옵시디언은 모드에 따라 하이라이터가 다르다.

| 모드 | 하이라이터 |
| --- | --- |
| 읽기 모드 | Prism (297개 언어) |
| 편집 모드 | CodeMirror (옵시디언이 묶어둔 모드만) |

**같은 코드 블록이 두 모드에서 다르게 보이는 이유가 이것이다.** 편집 중에는
강조가 안 되던 언어가 읽기 모드로 넘기면 색이 붙는다. 297이라는 숫자는 읽기
모드 쪽 숫자이고, 편집 모드는 그보다 훨씬 적다. 그 차이를 메우는 게 그
플러그인이다.

이 구조를 모르면 **엉뚱한 데를 고치게 된다.** 편집 모드에서 강조가 안 되는 걸
언어 식별자 오타로 의심하거나, Prism이 그 언어를 지원하는지 찾아보게 된다. 둘
다 아니다.

## 같은 울타리를 세 번 다르게 읽는다

여기까지가 클리핑의 범위인데, 보관함에서 블로그로 글을 옮기는 쪽이면 한 겹이
더 있다. **이 블로그는 Prism도 CodeMirror도 쓰지 않는다.** Astro의 기본
하이라이터인 **Shiki**를 쓴다.

그러면 똑같이 생긴 울타리 한 줄이 세 군데에서 세 번 해석된다.

| 읽는 쪽 | 무엇으로 | 결과 |
| --- | --- | --- |
| 옵시디언 편집 모드 | CodeMirror | 묶여 있는 모드만 강조 |
| 옵시디언 읽기 모드 | Prism | 297개 언어 강조 |
| 빌드된 블로그 | Shiki | TextMate 문법으로 강조 |

언어 식별자 자체는 대부분 통한다. `csharp`, `json`, `yaml`은 셋 다 안다.
갈리는 건 **식별자 뒤에 붙이는 것들**이다.

이 블로그의 설정에는 Shiki 트랜스포머가 넷 걸려 있다. 그중 하나는 파일 이름을
붙이는 커스텀 트랜스포머인데, 울타리 줄에 이렇게 쓴다.

````text
```ts file="astro.config.ts"
export default defineConfig({ ... });
```
````

그리고 diff 표기는 주석으로 쓴다.

````text
```csharp
int before = 1;  // [!code --]
int after = 2;   // [!code ++]
```
````

**둘 다 Shiki 전용이다.** 옵시디언에서 열면 `file="astro.config.ts"`는 그냥
무시되고, `// [!code ++]`는 **글자 그대로 주석으로 보인다.** 지워지지도
강조되지도 않는다.

반대 방향도 있다. 옵시디언 플러그인이 제공하는 문법 — 뒤에서 볼 Code Styler의
제목·줄 강조 표기 같은 것들 — 은 **빌드된 사이트에서 아무 일도 하지 않는다.**
울타리 줄에 남은 문자열이 될 뿐이다.

그래서 보관함과 블로그를 같이 쓰면 규칙이 하나 생긴다. **표준 마크다운에
있는 것만 양쪽에서 믿는다.** 울타리 개수, 틸드, 언어 식별자, 콜아웃 접기까지가
그 범위다. 그 밖은 한쪽에서만 동작한다고 보고 쓴다.

## 플러그인 쪽은 맞는다

나머지 절들은 확인해도 걸리지 않는다.

| 클리핑의 주장 | 확인 |
| --- | --- |
| 줄 번호는 CSS 스니펫이나 플러그인으로 표시 | 맞음. 코드 블록 줄 번호는 내장 기능이 아니다 |
| 코드 블록 탭은 Codeblock Tabs 플러그인으로 | 맞음 |
| 스타일은 CSS 스니펫·플러그인·테마로 바꿀 수 있다 | 맞음 |
| Code Styler가 위 기능을 모두 지원 | 맞음 |

마지막 줄은 README로 대조해볼 값이 있다. 클리핑이 센 여섯 기능이 전부 있다.

| 클리핑 | README |
| --- | --- |
| 코드 블록에 제목 추가 | "Titles and references" — 제목을 다른 노트나 웹사이트 링크로도 쓸 수 있다 |
| 줄 번호 표시 | "line numbers" |
| 코드 줄 강조 표시 | 줄 번호·범위·따옴표 구문·**정규식**까지 |
| 접기 지원 | "Collapsible codeblocks with custom placeholder text" |
| 인라인 코드 지원 | `{language} code` 문법으로 인라인 코드에도 강조 |
| 외부 코드 참조 | "Display local or remote files with line range selection" |

**두 줄은 클리핑이 적은 것보다 넓다.** 줄 강조는 정규식까지 받고, 접기는
**접힌 상태의 문구를 지정**할 수 있다. 앞 절에서 본 콜아웃 우회와 달리 코드
블록 자체를 접는 쪽이라, 제목이 콜아웃 제목으로 끌려가지 않는다.

"줄 번호가 내장이 아니다"는 한 번 짚어둘 값이 있다. 옵시디언 설정의
**편집기 > 줄 번호 표시**는 **노트 본문**의 줄 번호이고, 코드 블록 안쪽 줄에는
번호가 붙지 않는다. 이름이 비슷해서 켜놓고 왜 안 되나 보게 되는 자리다.

## 어디에 왜 쓰나

### 마크다운을 설명하는 문서를 쓸 때

가장 자주 걸리는 자리다. 울타리를 몇 겹까지 쓸지 미리 정해두면 편하다.

| 깊이 | 울타리 |
| --- | --- |
| 코드 | 백틱 3개 |
| 코드를 보여주는 코드 | 백틱 4개 |
| 그걸 또 보여주는 코드 | 백틱 5개 |

이 글이 쓰는 방식이다. 3단계까지 가는 일은 드물지만, **규칙이 "하나 더"라서
깊이에 상한이 없다.** 이스케이프는 깊이가 늘면 같이 늘어나는데, 울타리는 한
글자만 늘면 된다.

언어 식별자는 바깥 울타리에도 붙일 수 있다. 마크다운을 보여줄 때는 `text`나
`markdown`을 쓴다 — 안쪽 울타리가 코드로 강조되지 않게 하려면 `text`가 낫다.

### 보관함을 git에 넣을 때

옵시디언 보관함은 **전부 평문 마크다운**이다. 그래서 git에 그대로 들어가고,
diff가 읽힌다. 다만 한 가지를 같이 정해두는 편이 좋다.

[Git LFS 추적을 해제한 글](/posts/git-lfs-untrack/)에서 **텍스트 파일을 LFS로
잡으면 손해만 본다**는 결론을 봤다. 보관함이 정확히 그 경우다. 마크다운은 수가
많고 각각 작아서 LFS의 이득이 없고, diff만 잃는다. 보관함에서 LFS로 보낼 것이
있다면 첨부한 이미지와 PDF 쪽이다.

인코딩도 한 번 맞춰두면 끝난다. 보관함과 블로그 저장소를 오가는 파일이라
[문자 인코딩을 정리한 글](/posts/character-encodings/)의 UTF-8 기준을 양쪽에
걸어두면, 코드 블록 안의 한글 문자열이 깨지는 일이 없다.

### 쓰지 말아야 할 자리

- **백틱을 이스케이프해서 중첩을 피하는 것.** 바깥을 한 개 늘리면 된다.
  이스케이프한 글은 복사해서 붙여도 동작하지 않는다.
- **인라인 코드에 백틱이 들어갈 때 한 개를 고집하는 것.** 두 개로 감싼다.
- **들여쓴 코드 블록에 언어를 지정하려는 것.** 식별자를 붙일 자리가 없다.
  구문 강조가 필요하면 울타리를 쓴다.
- **편집 모드의 강조를 Prism 지원 여부로 의심하는 것.** 편집 모드는
  CodeMirror다. 지원 언어 목록이 다르다.
- **설정의 「줄 번호 표시」로 코드 블록 줄 번호를 기대하는 것.** 그건 노트
  본문 쪽이다.
- **플러그인 문법으로 쓴 코드 블록을 그대로 블로그에 올리는 것.** Shiki는 그
  문법을 모른다. 반대로 Shiki 표기도 옵시디언에서 주석으로 보인다.
- **코드 블록 자체를 접는 마크다운 문법을 찾는 것.** 없다. 콜아웃 접기를
  빌리거나 플러그인을 쓴다.

## 정리

- **울타리는 "세 개"가 아니라 "세 개 이상"이다.** 문서가 "three or more
  backticks or three or more tildes"라고 적는다.
- **중첩 규칙은 바깥이 더 많은 것이다.** "The outer code block must use more
  fence characters than any inner code block, or use a different fence
  character type." 클리핑이 escape로 돌아간 자리가 여기다.
- **인라인 코드도 안에 백틱이 있으면 두 개로 감싼다.** 같은 원리다.
- **들여쓴 코드 블록에는 언어를 지정할 수 없다.** 강조가 필요하면 울타리다.
- **코드 블록을 접는 문법은 없다.** 콜아웃의 `-`/`+`를 빌리는 우회이고, `-`가
  기본 접힘이다. 이 블로그도 `rehype-callouts`로 같은 문법을 지원한다.
- **Prism은 읽기 모드 쪽이다.** 297개라는 숫자가 그쪽 숫자이고, 편집 모드는
  CodeMirror다. 클리핑이 권한 플러그인이 존재하는 이유가 그 차이다.
- **울타리 한 줄을 세 하이라이터가 다르게 읽는다.** 옵시디언 편집(CodeMirror),
  읽기(Prism), 빌드된 블로그(Shiki)다. `file="..."`과 `// [!code ++]`는 Shiki
  전용이고, 옵시디언에서는 각각 무시되고 주석으로 보인다.
- **플러그인 절은 전부 맞는다.** Code Styler는 클리핑이 센 여섯 기능을 다
  갖고 있고, 줄 강조는 정규식까지 받는다.

---

### 참고

- [Basic formatting syntax — Obsidian 공식 도움말](https://obsidian.md/help/syntax)
- [Callouts — Obsidian 공식 도움말](https://obsidian.md/help/callouts)
- [Supported languages — Prism](https://prismjs.com/#supported-languages)
- [Editor Syntax Highlight — deathau/cm-editor-syntax-highlight-obsidian](https://github.com/deathau/cm-editor-syntax-highlight-obsidian)
- [Code Styler — mayurankv/Obsidian-Code-Styler](https://github.com/mayurankv/Obsidian-Code-Styler)
- [rehype-callouts](https://github.com/lin-stephanie/rehype-callouts)
- [Shiki — 지원 언어](https://shiki.style/languages) ·
  [@shikijs/transformers](https://shiki.style/packages/transformers)
- [Fenced code blocks — CommonMark 명세](https://spec.commonmark.org/0.31.2/#fenced-code-blocks)

이 글의 출발점이 된 자료는
[제이닉 — 옵시디언 기초: 코드 블록(Code block)](https://kaminik.tistory.com/entry/%EC%98%B5%EC%8B%9C%EB%94%94%EC%96%B8-%EA%B8%B0%EC%B4%88-%EC%BD%94%EB%93%9C-%EB%B8%94%EB%A1%9DCode-block)
(2024-02-25)이다. 문법 설명을 옵시디언 공식 도움말과 CommonMark 명세에 대조하고,
하이라이터 쪽은 Prism·CodeMirror·Shiki의 문서로 확인했다. 확인 시점은
2026-10-06이다.
