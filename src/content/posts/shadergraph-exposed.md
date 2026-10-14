---
pubDatetime: 2026-10-14T21:30:00+09:00
title: "인스펙터에 띄우는 건 Exposed가 아니라 Show In Inspector다"
lang: ko
translationKey: shadergraph-exposed
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - 그래픽스
  - URP
  - 렌더링
  - 에디터
description: "셰이더를 공부하던 중에 스크랩한 Unity 공식 입문 문서다. 그런데 URL이 10.8이고 지금 에디터에 붙는 건 17.6이다. 그 사이에 프로퍼티 옵션표가 가장 많이 썩었다 — Exposed는 이름만 남고 뜻이 바뀌었고, 인스펙터 노출은 Show In Inspector가 가져갔다."
---

**셰이더를 공부하던 중에 스크랩한 것이다.** 그리고 스크랩해둔 것이 블로그 글이
아니라 **Unity 공식 문서** — Shader Graph 패키지 매뉴얼의 「첫 번째 셰이더
그래프」 페이지, 그것도 한국어판이다. 공식 문서니까 대조할 간극이 없을
거라고 생각했는데, 바로 그 반대였다.

URL에 버전이 박혀 있다 —
`docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html`.

**`@10.8`이다.** Unity 6.6 매뉴얼이 가리키는 Shader Graph 패키지는
**17.6**이다. 메이저 일곱 개 차이다. 그런데 이게 번역이 늦은 페이지를
어쩌다 집은 게 아니다 — 아래에서 확인하지만 **한국어 패키지 문서 자체가
10.8에서 멈춰 있다.** 한국어로 검색해서 셰이더 그래프 입문 문서를 찾으면
구조적으로 이 버전에 도착하게 된다.

튜토리얼의 절차 자체는 대체로 살아 있다. 그래프를 만들고, 노드를 만들고,
Base Color에 연결하고, 저장하고, 머티리얼을 만든다. 순서가 바뀌지 않았다.
**가장 많이 썩은 부분은 맨 끝의 프로퍼티 옵션표다.** 일곱 줄 중에서 한 줄은
이름만 남고 뜻이 바뀌었고, 두 줄은 다른 페이지로 옮겨갔고, 한 줄은 사라졌다.

그 한 줄이 `Exposed`다.

## 목차

## 한국어 패키지 문서는 10.8에서 멈춰 있다

먼저 이게 "이 페이지만 번역이 늦었다"가 아니라는 걸 확인해야 한다. 같은
방식으로 URL을 몇 개 열어봤다.

| URL | 결과 |
|---|---|
| `/kr/Packages/com.unity.shadergraph@10.8/manual/index.html` | 열린다. 한국어 |
| `/kr/Packages/com.unity.shadergraph@11.0/manual/index.html` | 열리지 않는다 |
| `/kr/Packages/com.unity.shadergraph@12.0/manual/index.html` | 열리지 않는다 |
| `/kr/Packages/com.unity.shadergraph@17.0/manual/index.html` | 열리지 않는다 |
| `/kr/Packages/com.unity.shadergraph@17.6/manual/index.html` | 열리지 않는다 |
| `/Packages/com.unity.shadergraph@11.0/manual/index.html` (영문) | 열린다 |

마지막 줄이 대조군이다. **영문 11.0은 열린다.** 그러니까 11.0이라는 버전이
없어서가 아니고, `/kr/` 경로가 그 버전부터 없는 것이다. 10.8의 한국어
페이지는 지금도 멀쩡하게 열린다 — 첫 제목이 "셰이더 그래프 소개"이고 첫
문장이 이렇다.

> 셰이더 그래프를 사용하면 셰이더를 시각적으로 빌드할 수 있습니다.
>
> — [셰이더 그래프 소개 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/index.html)

**다만 "Unity가 10.8까지만 번역했다"고 적어둔 문서는 찾지 못했다.** 내가
확인한 것은 위 여섯 줄의 결과뿐이다. 직접 눌러보면 같은 결과가 나올 것이고,
그게 이 글에서 10.8을 기준 삼는 이유다.

번역이 **있는** 페이지가 영문과 어긋난 경우도 전에 한 번 걸렸다 — 매크로
이름에서 글자 하나가 빠져 있었다. 그 기록은
[GPU 인스턴싱 셰이더: 한국어 매뉴얼의 매크로 이름에 A가 빠져 있다](/posts/gpu-instancing-shader/)에
있다. 이번 건은 성격이 다르다. **오역이 아니라 버전이 멈춘 것**이고, 그래서
틀린 문장을 찾는 게 아니라 **그 사이에 무엇이 바뀌었는지**를 찾아야 한다.

지금 버전은 Unity 6.6 매뉴얼이 밝힌다.

> The Shader Graph package adds a visual Shader editing tool to Unity.
>
> You can use this tool to create Shaders in a visual way instead of writing
> code.
>
> — [Shader Graph — Unity 6.6 매뉴얼 (`com.unity.shadergraph@17.6`)](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)

## 인스펙터에 띄우는 건 Exposed가 아니라 Show In Inspector다

10.8 표의 `Exposed` 줄은 이렇게 적혀 있다.

> **Exposed** — 이 체크박스를 활성화하면 머티리얼의 인스펙터에서 프로퍼티가
> 표시됩니다.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

**머티리얼 인스펙터에 보이게 하는 체크박스**다. 그 뜻으로 알고 17.6
튜토리얼을 보면 이름이 안 나온다. 같은 자리에서 켜라고 하는 옵션이 다르다.

> In the Blackboard, select Add (+), and then select Color.
>
> Make sure to activate the Show In Inspector option.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

`Show In Inspector`의 설명은 프로퍼티 타입 페이지에 있다.

> **Show In Inspector** — Displays the property in the material Inspector when
> enabled.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

**10.8의 `Exposed` 설명이 그대로 이 줄로 옮겨왔다.** 이름만 바뀐 것이다.
그러면 `Exposed`라는 이름은 없어졌을까. 아니다 — 남아 있고, **뜻이 달라졌다.**

> **Exposed** — Enable this setting to make the property available for you to
> edit via the C# API.
>
> — [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)

`C# API`로 편집할 수 있게 하는 설정이고, 같은 페이지가 **기본으로 켜져
있다**고 적는다. 10.8 문서를 보고 "인스펙터에 띄우려면 Exposed를 켜라"로
외워두면, 지금 에디터에서는 **이미 켜져 있는 다른 뜻의 체크박스를 보면서
인스펙터에 안 뜨는 이유를 못 찾는다.**

| 옵션 이름 | 10.8이 적은 뜻 | 17.6이 적은 뜻 |
|---|---|---|
| `Exposed` | "머티리얼의 인스펙터에서 프로퍼티가 표시됩니다" | "available for you to edit via the C# API" |
| `Show In Inspector` | 없는 옵션 | "Displays the property in the material Inspector" |
| `Reference` | "C# 스크립트에 표시되는 프로퍼티의 이름" | "the internal identifier used by the shader" |
| `Default` | "프로퍼티의 기본 값" | `Default Value` — 새 머티리얼 인스턴스의 초기값 |

`Reference`도 미묘하게 움직였다. 10.8은 그것을
**"C# 스크립트에 표시되는 이름"**이라고 썼고, 17.6은 **"the internal
identifier used by the shader for this property"**라고 쓴다. 쓰는 쪽에서 보면
같은 문자열이지만, 17.6은 그게 C#을 위한 이름이 아니라 **셰이더 내부
식별자**라는 쪽을 먼저 말한다. 그래서 제약도 같이 붙었다.

> If the Reference Name contains any characters that HLSL does not support, the
> Editor replaces those characters with underscores.
>
> — [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)

**HLSL이 못 받는 문자는 에디터가 밑줄로 바꾼다.** C# 쪽에서 쓰려고 적어둔
문자열이 그대로 남아 있지 않을 수 있다는 뜻이고, 10.8 표에는 없는 문장이다.

## Exposed라는 이름은 현행 문서 두 페이지에서도 엇갈린다

여기서 한 겹 더 이상한 게 나온다. 위에서 인용한 두 줄은 **같은 17.6 문서
안의 다른 두 페이지**다. 그리고 두 페이지의 옵션 목록이 맞지 않는다.

| 페이지 | 목록에 있는 것 |
|---|---|
| `Blackboard` (17.6) | `Name` · `Reference` · `Default` · `Precision` · `Exposed` — 다섯 줄 |
| `Property Types` (17.6) | `Name` · `Reference` · `Default Value` · `Precision` · `Scope` · `Show In Inspector` · `Promote to final Shader` · `Disable connector` · `Preview Value` · `Read Only` · `Custom Attributes` · `Use Custom Binding` |

`Blackboard` 페이지에는 `Show In Inspector`와 `Scope`가 **없고**,
`Property Types` 페이지에는 `Exposed`가 **없다.** 그런데 튜토리얼은
`Show In Inspector`를 켜라고 한다. 세 페이지가 같은 UI를 두 가지 이름 체계로
설명하고 있는 것이다.

**어느 쪽이 현재 에디터의 라벨인지는 문서만으로 확정할 수 없다.** 문서가
서로 다르게 적고 있고, 나는 그 UI를 열어보고 쓰는 게 아니다. 확인된 것은
이것까지다 — **튜토리얼 본문과 프로퍼티 타입 페이지가 `Show In Inspector`로
일치하고, 블랙보드 페이지만 `Exposed`로 남아 있다.** 두 이름이 한 화면에 다
있는지, 하나만 있는지는 에디터에서 직접 봐야 한다.

실무에서 이 상황을 다루는 방법은 **이름으로 외우지 않는 것**이다. 프로퍼티
하나를 만들고, 저장하고, 머티리얼 인스펙터를 열어서 보이는지 확인한다.
체크박스 이름이 무엇이든 그 왕복 한 번이 답을 준다.

## Mode는 페이지를 옮겼고, Hybrid Instanced는 Scope의 한 값이 됐다

10.8 표의 나머지 세 줄도 그대로 있지 않다. `Mode`는 「첫 번째 셰이더
그래프」에서 사라지고 프로퍼티 타입 페이지로 갔다. 내용은 거의 같은데,
문장 하나가 더 붙어 있다.

> **Color** — Defines a Color value.
>
> **Default** — Allows to select a standard sRGB color.
>
> **HDR** — Allows to select an HDR color and sets its intensity from -10 to 10
> exposure stops.
>
> In versions prior to 10.0, Shader Graph didn't correct HDR colors for the
> project colorspace.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

`-10 ~ 10 exposure stops`라는 범위도, **10.0 이전에는 HDR 컬러를 프로젝트
색공간에 맞게 보정하지 않았다**는 주석도 10.8 표에는 없다. 클리핑이 10.8이니
그 수정은 이미 들어간 뒤의 문서지만, 문장으로는 적혀 있지 않았다.

`Hybrid Instanced`는 더 크게 움직였다. 10.8은 이렇게 적는다.

> **Hybrid Instanced** — Hybrid DOTS 렌더러를 사용할 때 이 프로퍼티를
> 인스턴스화할 수 있도록 해주는 실험 단계의 기능입니다.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

17.6에는 **그 이름의 체크박스가 없다.** 대신 `Scope`라는 열거형이 생기고,
그 값 중 하나가 되었다.

> **Scope** — Specifies where and how the property is edited across materials.
>
> **Global** — Makes the property editable at a global level, through a C#
> script only, for all materials that use it.
>
> **Per Material** — Makes the property independently editable per material,
> either through a C# script, or in the Inspector UI
>
> **Hybrid Per Instance** — Has the same effect as Per Material, unless you're
> using DOTS instancing.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

**체크박스 하나가 세 값짜리 선택으로 바뀌었다.** 그리고 `Global`의 설명이
의미 있다 — "through a C# script only"다. 10.8 표에는 "모든 머티리얼에
전역으로 걸리는 프로퍼티"라는 개념 자체가 없었다.

`Precision`도 값이 명시됐다.

> **Precision** — Sets the numeric precision for the property's data type.
>
> **Inherit** — Uses the precision defined by the graph or parent context.
>
> **Single** — Uses single-precision (float) for maximum accuracy.
>
> **Half** — Uses half-precision to reduce memory and improve performance.
>
> **Use Graph Precision** — Uses the precision mode set in the graph settings.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

10.8은 `Precision`을 "프로퍼티의 기본 정밀도입니다"라고만 쓰고 별도 문서로
링크를 넘겼다. 값 네 개가 표 안에 들어온 것은 17.6이다.

| 10.8 표의 일곱 줄 | 17.6에서 |
|---|---|
| 프로퍼티 버튼 (우클릭 Rename/Delete) | `Name` 행으로 — 이름 더블클릭으로 변경 |
| `Exposed` (인스펙터 노출) | 이름은 남고 **뜻이 C# API 쪽으로** 바뀜 |
| `Reference` (C# 이름) | **셰이더 내부 식별자**로 설명이 바뀌고 HLSL 제약 추가 |
| `Default` | `Default Value` — 새 머티리얼 인스턴스의 초기값 |
| `Mode` | **프로퍼티 타입 페이지로 이동**, HDR 범위·색공간 주석 추가 |
| `Precision` | 값 네 개(`Inherit`/`Single`/`Half`/`Use Graph Precision`)가 명시됨 |
| `Hybrid Instanced` (실험) | **`Scope`의 `Hybrid Per Instance` 값으로 흡수** |
| — | `Show In Inspector`·`Read Only`·`Custom Attributes` 등 새 옵션들 |

## 노드 만드는 길이 둘에서 하나로 줄었다

절차 쪽에서 바뀐 것도 있다. 10.8은 Create Node 메뉴를 여는 방법을 **두 개**
적는다 — 우클릭 후 컨텍스트 메뉴에서 **Create Node**, 또는 스페이스바.

17.6은 스페이스바만 적는다.

> Select the Shader Graph window's workspace and press the Spacebar.
>
> In the Input > Basic category, double-click on Color.
>
> Drag it to the Base Color block port of the Fragment section of the master
> stack.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

**우클릭이 사라진 게 아니라, 17.6 튜토리얼이 그 길을 안 적는다.** 17.6에서
우클릭은 프로젝트 창에서 에셋을 만들 때 쓰는 동작으로 나온다. 그리고 세 가지가
더 구체적이 됐다 — 노드의 위치가 **`Input > Basic`**으로, 선택 방식이
**더블클릭**으로(10.8은 클릭 또는 하이라이트 후 Enter), 연결 대상이
**Fragment 섹션의 Base Color 블록**으로 적힌다.

에셋을 만드는 메뉴 경로도 다르다.

| 단계 | 10.8 | 17.6 |
|---|---|---|
| 에셋 생성 메뉴 | **Create > Shaders** | **Create > Shader Graph > URP > Lit** |
| Create Node 여는 법 | 우클릭 또는 스페이스바 | 스페이스바 |
| Color 노드 찾기 | 검색창에 "color" | 검색 후 `Input > Basic`에서 더블클릭 |
| 연결 대상 | 프래그먼트 스택의 Base Color 블록 | Fragment 섹션의 Base Color 블록 포트 |
| 프로퍼티 추가 | 블랙보드 **Add (+)** | 블랙보드 **Add (+)** — 동일 |

10.8이 "**Blank Shader Graph**는 활성 타겟 또는 Block 노드를 선택하지 않은
상태에서 셰이더 그래프를 생성합니다"라고 설명하고, 예시로는
**Universal > Lit**을 쓴다. 17.6 튜토리얼은 처음부터
`Create > Shader Graph > URP > Lit`를 누르라고 한다. **빈 그래프에서 타겟을
고르는 경로를 설명하는 대신, 파이프라인이 박힌 프리셋을 바로 누르게 하는
쪽으로 글이 바뀌었다.**

## 바뀌지 않은 것 — 저장은 여전히 수동이다

전부 바뀐 건 아니다. 10.8의 이 문장은 지금도 유효하다.

> 현재 셰이더 그래프는 자동으로 저장되지 않습니다.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

17.6도 저장 방법을 같은 두 가지로 적는다.

> Click the Save Asset button in the top left corner of the window.
>
> If Unity detects any unsaved changes, a dialog appears, and asks if you want
> to save those changes.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

**`Save Asset` 버튼과 닫을 때의 팝업.** 일곱 메이저를 건너왔는데 이 부분은
문장 구조까지 거의 같다. 바뀐 것을 세는 글에서 **바뀌지 않은 것을 같이
세는 게 중요하다** — 그래야 "10.8 문서는 전부 못 믿는다"로 과하게 가지
않는다.

머티리얼을 만들고 인스펙터의 `Shader` 드롭다운에서 셰이더를 고르는 절차도
그대로다. 10.8이 "일반 셰이더와 동일"하다고 적어둔 부분이고, 그 드롭다운에
셰이더가 **안 뜨는** 경우가 따로 있다는 것은
[Lite 버전은 셰이더 목록에 뜨지 않는다](/posts/liltoon-setup/)에 적어뒀다.

## 추가 튜토리얼 링크는 전부 블로그 첫 화면으로 간다

10.8 페이지 끝에는 블로그 글 링크가 여섯 개 붙어 있다. 전부
`blogs.unity3d.com` 도메인이다. 두 개를 눌러봤다.

| 클리핑의 링크 | 결과 |
|---|---|
| `blogs.unity3d.com/2018/10/05/art-that-moves-...` | **302 → `https://unity.com/blog`** |
| `blogs.unity3d.com/2018/02/27/introduction-to-shader-graph-...` | **302 → `https://unity.com/blog`** |

**글로 가는 게 아니라 블로그 목록 첫 화면으로 간다.** 도메인이 옮겨가면서
개별 글 경로를 살려두지 않은 것이다. 열어보기 전에는 "링크가 살아 있다"로
보이는 종류의 죽은 링크다 — 404가 아니라 200이 떨어지니까.

17.6의 같은 자리는 **네 개**다. "Art That Moves: Creating Animated Materials
with Shader Graph", "Custom Lighting in Shader Graph: Expanding Your Graphs in
2019", 셰이더 그래프 비디오 튜토리얼, 셰이더 그래프 포럼. 10.8의 여섯 개
중 네 개가 목록에서 빠졌다.

## 빌트인에서 되는지에 대해 두 문서가 다르게 적는다

이 패키지에 대해 하나 더 확인한 게 있다. **Shader Graph가 빌트인 렌더
파이프라인에서 되는가**에 대해 현행 문서 두 곳이 다르게 적는다.

Shader Graph 패키지 소개 페이지는 둘만 센다.

> Currently, both the High Definition Rendering Pipeline and the Universal
> Rendering Pipeline support Shader Graph.
>
> — [Shader Graph — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)

렌더 파이프라인 기능 비교표는 셋 다 "Yes"다.

> Shader Graph | Yes | Yes | Yes
>
> — [Render pipeline feature comparison — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)

열 머리글이 `Built-in Render Pipeline` · `URP` · `HDRP`이고, 같은 표의
서피스 셰이더 행은 빌트인만 "Yes"이고 URP·HDRP는 "No"다. 즉 비교표는
**빌트인에서 Shader Graph가 된다**고 적고, 패키지 소개 페이지는
**URP와 HDRP만 센다.**

[커스텀 셰이더 문서의 표는 목차가 아니라 분기다](/posts/unity-custom-shaders/)에서
같은 호환성 표를 6000.2 기준으로 읽고 "Shader Graph는 빌트인에서도 된다"고
적었다. 그 표는 **6000.6에서 `Shaders.html`에 더 이상 없다.**
`render-pipelines-feature-comparison.html`로 옮겨갔고, 옮겨간 표의 값은
같다. 다만 그 페이지가 전제를 하나 새로 달고 있다.

> Important: The Built-In Render Pipeline is deprecated and will be made
> obsolete in a future release.
>
> — [Render pipeline feature comparison — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)

같은 페이지가 **Unity 6.7 LTS 수명 주기 동안은 버그 수정과 유지보수를
포함해 지원된다**고 덧붙인다. 그래서 "빌트인에서도 된다"는 답은 유효하지만,
**새로 시작하는 그래프를 빌트인 기준으로 세울 이유는 줄었다.** 빌트인이
무엇인지 — 파이프라인 에셋 칸이 비었을 때의 결과라는 것 — 은
[렌더 파이프라인은 에셋이고, 빌트인은 그 칸이 비었을 때의 결과다](/posts/render-pipelines-overview/)에
적어뒀다.

## 어디에 왜 쓰나

Shader Graph는 코드 없이 셰이더를 만드는 도구고, 이 글이 파고든
**프로퍼티**는 그 셰이더를 **나중에 바깥에서 조절하는 창구**다. 머티리얼
인스펙터에서 아티스트가 만지게 하거나, C#에서 런타임에 바꾸거나, 둘 다
하거나. 어느 쪽을 원하는지에 따라 켜야 할 옵션이 다르고, 그 옵션 이름이
10.8과 17.6에서 다르다는 게 이 글의 내용이다.

### 동작하는 예제

그래프 쪽은 그림이라 코드로 옮길 수 없다. 코드로 옮길 수 있는 쪽은
**C#에서 그 프로퍼티를 건드리는 부분**이고, 거기서 쓰는 문자열이 바로
`Reference` 이름이다. 아래는 그 왕복을 한 컴포넌트로 만든 것이다.

```csharp file="Scripts/Rendering/ShaderGraphColorDriver.cs"
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class ShaderGraphColorDriver : MonoBehaviour
{
    private const float MinDuration = 0.01f;

    [Header("프로퍼티")]
    [Tooltip("블랙보드의 Reference 이름을 그대로 적는다. URP Lit의 기본 색은 _BaseColor다")]
    [SerializeField]
    private string _colorReference = "_BaseColor";

    [Header("색")]
    [Tooltip("시작 색")]
    [SerializeField]
    private Color _from = Color.white;

    [Tooltip("도착 색")]
    [SerializeField]
    private Color _to = Color.red;

    [Tooltip("왕복 한 번에 걸리는 시간(초)")]
    [Min(MinDuration)]
    [SerializeField]
    private float _duration = 2f;

    [Header("로그")]
    [Tooltip("켜면 프로퍼티를 못 찾았을 때 한 번만 경고한다")]
    [SerializeField]
    private bool _warnOnMissing = true;

    // 문서가 "better to get the identifiers of the properties you need just
    // once"라고 적는다. 매 프레임 문자열을 넘기지 않는다.
    private int _colorId;

    private Material _instanceMaterial;
    private bool _hasProperty;

    private void Awake()
    {
        if (!TryGetComponent(out Renderer meshRenderer))
        {
            Debug.LogError("Renderer가 붙어 있지 않다.", this);
            return;
        }

        // material은 읽는 순간 인스턴스를 만든다. sharedMaterial을 고치면
        // 프로젝트에 저장된 머티리얼까지 바뀐다고 문서가 적는다.
        _instanceMaterial = meshRenderer.material;

        _colorId = Shader.PropertyToID(_colorReference);
        _hasProperty = _instanceMaterial.HasProperty(_colorId);

        if (!_hasProperty && _warnOnMissing)
        {
            // Reference에 HLSL이 못 받는 문자가 있으면 에디터가 밑줄로
            // 바꾼다. 인스펙터에 적은 이름과 다를 수 있다.
            Debug.LogWarning(
                $"'{_colorReference}' 프로퍼티가 머티리얼에 없다.", this);
        }
    }

    private void OnDestroy()
    {
        // Renderer.material이 만든 인스턴스는 자동으로 정리되지 않는다.
        if (_instanceMaterial != null)
        {
            Destroy(_instanceMaterial);
        }
    }

    private void Update()
    {
        if (!_hasProperty) { return; }

        float t = Mathf.PingPong(Time.time / _duration, 1f);

        // nameID 오버로드를 쓴다. 문자열 오버로드도 있지만 매 프레임
        // 호출에는 식별자 쪽이 맞다.
        _instanceMaterial.SetColor(_colorId, Color.Lerp(_from, _to, t));
    }
}
```

세 가지를 짚어둘 만하다.

**하나 — `_colorReference`의 기본값이 `_BaseColor`다.** 문서가 파이프라인별
이름을 직접 적어둔다.

> Property name. For example, "_Color" in Built-in Render Pipeline,
> "_BaseColor" in URP.
>
> — [Material.SetColor](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)

Shader Graph로 만든 프로퍼티라면 **블랙보드의 `Reference` 칸에 적힌
문자열**이 이 자리에 들어간다. `Show In Inspector`를 껐더라도 이 경로는
막히지 않는다 — 인스펙터 노출과 C#에서의 접근이 다른 옵션으로 갈라진
이유가 그것이다.

**둘 — ID를 `Awake`에서 한 번만 받는다.** 문서가 이유를 적어뒀다.

> Using property identifiers is more efficient than passing strings to all
> material property functions.
>
> Each name of shader property (for example, _MainTex or _Color) is assigned an
> unique integer number in Unity, that stays the same for the whole game.
>
> The numbers will not be the same between different runs of the game or
> between machines, so do not store them or send them over network.
>
> — [Shader.PropertyToID](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.PropertyToID.html)

**한 실행 안에서는 고정이고, 실행 사이·기기 사이에는 다르다.** 그래서
`Awake`에서 받아 쓰는 건 맞고, 세이브 파일이나 네트워크 패킷에 담는 건
문서가 하지 말라고 적는다.

**셋 — 머티리얼 인스턴스를 직접 치운다.** `Renderer.sharedMaterial` 문서가
왜 `material`을 쓰라고 하는지 적는다.

> Modifying sharedMaterial will change the appearance of all objects using this
> material, and change material settings that are stored in the project too.
>
> It is not recommended to modify materials returned by sharedMaterial.
>
> — [Renderer.sharedMaterial](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

`material`로 받으면 인스턴스가 생기고, 그 인스턴스의 수명은 내 책임이다.
그 책임이 문서의 어느 문장에 적혀 있는지는
[정의가 설명한 건 셰이더가 아니라 픽셀 셰이더다](/posts/what-is-a-shader/)에서
짚어뒀다.

마지막으로 `SetColor`에는 색공간 규칙이 붙어 있다. 프로퍼티의 `Mode`를
`HDR`로 두었을 때 관련된다.

> A material property is considered to be in gamma space if either of the
> following are true:
>
> The property is declared as a color and has the [HDR] attribute
>
> If this method's target property is in gamma space and the project is in
> linear space, value is converted to linear space before being stored.
>
> — [Material.SetColor](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)

**`[HDR]`이 붙은 색 프로퍼티는 감마 공간으로 취급되고, 프로젝트가 선형이면
넣은 값이 선형으로 변환되어 저장된다.** 인스펙터에서 고른 색과 C#으로 넣은
색이 다르게 보이면 이 변환을 먼저 본다. 참고로 **없는 프로퍼티에 `SetColor`를
했을 때 어떻게 되는지는 문서가 말하지 않는다** — 그래서 예제가
`HasProperty`로 먼저 걸러낸다.

### 무엇을 고르나

| 하고 싶은 일 | 켜야 할 것 (17.6 기준) | 근거 문장 |
|---|---|---|
| 머티리얼 인스펙터에 노출 | `Show In Inspector` | "Displays the property in the material Inspector" |
| C# API로 편집 | `Exposed` (블랙보드 페이지) | "available for you to edit via the C# API" |
| 머티리얼별로 따로 값 | `Scope` = `Per Material` | "independently editable per material" |
| 전부에 한 값 (C#만) | `Scope` = `Global` | "through a C# script only" |
| DOTS 인스턴싱 | `Scope` = `Hybrid Per Instance` | "unless you're using DOTS instancing" |
| 인스펙터에서 못 고치게 | `Read Only` | "adding the PerRendererData attribute" |
| 정밀도를 그래프에 맡김 | `Precision` = `Use Graph Precision` | "the precision mode set in the graph settings" |
| C#에서 색 바꾸기 | `Reference` 이름 + `Shader.PropertyToID` | "more efficient than passing strings" |

문서를 고를 때는 이 순서로 둔다.

1. **URL의 버전을 먼저 본다.** `@10.8`이면 지금 에디터와 일곱 메이저
   차이다. 한국어 패키지 문서는 그 버전밖에 없다.
2. **영문 현행판을 같이 띄운다.** `/kr/`를 빼고 버전을 `@17.6`으로 바꾸면
   된다. 절차는 대조하기 쉽고, 옵션 이름은 꼭 대조해야 한다.
3. **옵션 이름은 에디터에서 확인한다.** 현행 문서 두 페이지가 이미 다르게
   적고 있다. 프로퍼티 하나 만들어서 인스펙터까지 왕복하는 게 빠르다.
4. **C#에서 쓸 이름은 `Reference` 칸을 본다.** 표시 이름이 아니고, HLSL
   제약으로 밑줄로 바뀌어 있을 수 있다.

### 쓰지 말아야 할 자리

- **10.8 문서의 옵션 이름을 그대로 외우는 자리.** `Exposed`는 이름만
  남았고 뜻이 C# API 쪽으로 바뀌었다.
- **인스펙터에 안 떠서 `Exposed`를 찾는 자리.** 17.6 기준으로 그 일을
  하는 것은 `Show In Inspector`다.
- **`Hybrid Instanced` 체크박스를 찾는 자리.** `Scope`의 값 하나로
  흡수됐다.
- **`Mode`를 「첫 번째 셰이더 그래프」 페이지에서 찾는 자리.** 프로퍼티 타입
  페이지로 옮겨갔다.
- **`Reference`에 적은 문자열을 그대로 C# 상수로 박는 자리.** HLSL이 못
  받는 문자는 에디터가 밑줄로 바꾼다고 문서가 적는다.
- **`Shader.PropertyToID` 결과를 저장하거나 네트워크로 보내는 자리.**
  문서가 실행·기기 사이에 같지 않다고 적는다.
- **`sharedMaterial`을 런타임에 고치는 자리.** 문서가 프로젝트에 저장된
  설정까지 바뀐다고 적는다.
- **`Renderer.material`로 인스턴스를 만들고 안 치우는 자리.** 수명이
  내 책임이다.
- **없는 프로퍼티에 `SetColor`를 거는 자리.** 문서가 그 경우를 말하지
  않으니 `HasProperty`로 먼저 본다.
- **클리핑의 `blogs.unity3d.com` 링크를 신뢰하는 자리.** 404가 아니라
  블로그 첫 화면으로 302된다.
- **새 그래프를 빌트인 기준으로 세우는 자리.** 비교표는 "Yes"지만 같은
  페이지가 빌트인을 deprecated로 적어뒀다.

## 정리

- 클리핑은 **공식 문서인데 `@10.8`**이고, Unity 6.6이 가리키는 패키지는
  **17.6**이다.
- `/kr/` 경로로는 **10.8만 열렸다.** 11.0·12.0·17.0·17.6은 열리지 않았고,
  영문 11.0은 열렸다. 번역 범위를 밝힌 문서는 못 찾았다.
- **`Exposed`는 이름만 남고 뜻이 바뀌었다.** 10.8은 "머티리얼의 인스펙터에서
  프로퍼티가 표시됩니다", 17.6은 **"available for you to edit via the C#
  API"**다.
- 인스펙터 노출은 **`Show In Inspector`**가 가져갔다 — "Displays the property
  in the material Inspector when enabled."
- **현행 문서 안에서도 엇갈린다.** 블랙보드 페이지에는 `Exposed`가 있고
  `Show In Inspector`가 없고, 프로퍼티 타입 페이지는 그 반대다. 어느 쪽이
  에디터의 라벨인지는 **문서로 확정할 수 없다.**
- `Reference`는 "C# 스크립트에 표시되는 이름"에서 **"the internal identifier
  used by the shader"**로 설명이 바뀌고, HLSL 미지원 문자를 밑줄로 바꾼다는
  제약이 붙었다.
- `Mode`는 **프로퍼티 타입 페이지로 이동**했고, `Hybrid Instanced`는
  **`Scope`의 `Hybrid Per Instance`로 흡수**됐다. `Precision`은 값 네 개가
  명시됐다.
- 에셋 생성 경로가 **Create > Shaders → Create > Shader Graph > URP > Lit**
  으로 바뀌고, Create Node를 여는 길이 **둘에서 스페이스바 하나로** 줄었다.
- **저장은 여전히 수동이다.** `Save Asset` 버튼과 닫을 때의 팝업, 둘 다
  그대로다.
- 10.8의 블로그 링크 여섯 개 중 눌러본 둘이 **`unity.com/blog`로 302**된다.
  404가 아니라서 죽은 줄 모르고 지나치기 쉽다.
- Shader Graph가 빌트인에서 되는지에 대해 **패키지 소개 페이지는 URP·HDRP
  둘만 세고, 기능 비교표는 셋 다 "Yes"다.** 그 비교표는 `Shaders.html`에서
  옮겨왔고, **빌트인은 deprecated**로 적혀 있다.
- C#에서 쓰는 문자열은 `Reference` 이름이고, URP Lit의 기본 색은
  **`_BaseColor`**다. ID는 `Awake`에서 한 번 받고, **저장하거나 보내지
  않는다.**

---

### 참고

- [첫 번째 셰이더 그래프 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)
- [셰이더 그래프 소개 — Shader Graph 10.8 (한국어)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/index.html)
- [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)
- [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)
- [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)
- [Get started with Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Getting-Started.html)
- [About Shader Graph — Shader Graph 11.0 (영문 대조군)](https://docs.unity3d.com/Packages/com.unity.shadergraph@11.0/manual/index.html)
- [Shader Graph — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)
- [Custom shaders — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/Shaders.html)
- [Render pipeline feature comparison — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)
- [Material.SetColor — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)
- [Shader.PropertyToID — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.PropertyToID.html)
- [Renderer.sharedMaterial — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

원문 클리핑은 Unity 공식 문서
[첫 번째 셰이더 그래프 | Shader Graph | 10.8.0](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)의
한국어판이다. 공식 문서라서 대조할 것이 없을 줄 알았는데, **버전이 박힌
URL이 그 자체로 대조 대상이었다.** 절차는 살아 있고 저장 방식은 그대로인데,
프로퍼티 옵션표는 이름과 위치가 거의 다 움직였다. 한국어 패키지 문서가
10.8에서 멈춰 있다는 것까지가 이 글이 확인한 내용이다.
