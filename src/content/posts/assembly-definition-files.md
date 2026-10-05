---
pubDatetime: 2026-10-05T17:45:00+09:00
title: "asmdef를 만들면 Assembly-CSharp가 안 보인다"
lang: ko
translationKey: assembly-definition-files
featured: false
draft: false
tags:
  - Unity
  - C#
  - 어셈블리
  - 컴파일
  - 에디터
  - 최적화
description: "어셈블리 정의 파일 문서를 스크랩했는데 2017.4판이다. 종속성이 한 방향이라는 설명은 맞지만, 반대 방향이 '금지'라는 말이 없다. 그게 '전부 쓰거나 전혀 쓰지 말라'는 권고의 실제 이유다."
---

**스크립트가 컴파일되는 걸 보면서 Unity의 컴파일 과정 자체를 알아보려고**
찾던 중 스크랩한 글이다. 스크립트를 저장하면 에디터 오른쪽 아래에 스피너가
돌고, 잠시 뒤에 다시 플레이할 수 있게 된다. 그 사이에 무엇이 어떤 단위로
컴파일되는지는 보이지 않는다.

문서를 따라가면 그 단위에 이름이 있다. **어셈블리**다. 그리고 기본 상태에서는
그 단위가 거의 하나뿐이라, 현행 문서가 결과를 한 줄로 적는다.

> Every time you change one script, Unity has to recompile all the other
> scripts, increasing overall compilation time for iterative code changes.

스크랩본은 그 해법인 **어셈블리 정의 파일**(`.asmdef`)을 다룬 Unity 공식
매뉴얼이다. 문제는 판본이다. `source`에 적힌 URL이
`docs.unity3d.com/kr/2017.4/`다. **2017.4판 한국어 매뉴얼이고, 그 사이에
필드가 4개에서 11개로 늘었다.**

그런데 판본보다 먼저 걸리는 건 빠진 문장이다. 스크랩본은 종속성을 이렇게
설명한다.

> 미리 정의된 어셈블리는 **항상** 모든 어셈블리 정의 파일의 어셈블리에
> 종속됩니다.

맞다. `Assembly-CSharp`는 내가 만든 어셈블리를 볼 수 있다. 그런데 **그 반대가
안 된다는 말이 없다.** 현행 문서는 Unity가 허용하지 않는 참조를 목록으로
적어두고, 그 첫 줄이 이것이다.

> References from custom assemblies created with an Assembly Definition to the
> predefined assemblies.

**asmdef로 만든 어셈블리에서 `Assembly-CSharp`로 가는 참조는 금지다.** 스크립트
하나를 asmdef 폴더로 옮기는 순간, 그 스크립트는 아직 `Assembly-CSharp`에 남아
있는 다른 스크립트를 볼 수 없게 된다. 컴파일이 느려지는 게 아니라 **컴파일이
안 된다.**

## 목차

## 종속성은 한 방향이고, 반대 방향은 금지다

현행 문서가 기본 동작을 적는 문장은 스크랩본과 거의 같다. 한 단어가 다르다.

> **By default,** the predefined assemblies reference all other assemblies,
> including those created with Assembly Definitions (1) and precompiled
> assemblies added to the project as plugins (2).

스크랩본의 **「항상」**이 현행 문서에서는 **「기본적으로」**다. 뒤에서 다시
보겠지만 그 차이를 만든 건 `Auto Referenced`라는 스위치다.

중요한 건 이 참조가 **단방향**이라는 쪽이다. 네 개의 미리 정의된 어셈블리가
내 어셈블리들을 참조하고, 내 어셈블리는 그 넷을 참조할 수 없다. 이유는 같은
문서의 다음 금지 항목에 있다.

> Cyclical references, which is when two assemblies reference each other.

미리 정의된 어셈블리가 내 어셈블리를 **전부** 참조하므로, 내 어셈블리가
`Assembly-CSharp`를 참조하면 그게 바로 순환이 된다. 그래서 한쪽을 금지하는
것이다. 선택이 아니라 구조상의 결과다.

이게 실무에서 어떤 모양으로 나타나는지가 중요하다. 폴더 하나에 `.asmdef`를
놓는 순간 경계가 생기고, **그 경계는 안쪽에서 바깥을 못 본다.**

```text
Assets/
  Core/
    Game.Core.asmdef        ← 여기에 경계가 생긴다
    Health.cs               ← Assembly-CSharp의 타입을 못 본다
  GameManager.cs            ← Assembly-CSharp. Health는 볼 수 있다
```

`GameManager.cs`에서 `Health`를 쓰는 건 된다. `Health.cs`에서 `GameManager`를
쓰는 건 안 된다. **의존 방향을 안쪽으로 몰아야** 어셈블리를 나눌 수 있다는
뜻이고, 이건 설계 이야기가 된다.

## "전부 쓰거나 전혀"의 이유가 문서에 적힌 것과 다르다

스크랩본에는 권고가 하나 있다.

> 프로젝트의 모든 스크립트에 어셈블리 정의 파일을 사용하거나, 또는 어셈블리
> 정의 파일을 전혀 사용하지 않는 것이 좋습니다. 이렇게 하지 않으면 어셈블리
> 정의 파일을 사용하지 않는 스크립트는 어셈블리 파일이 다시 컴파일될 때마다
> 매번 다시 컴파일됩니다. 즉, 어셈블리 정의 파일을 사용하는 이점이 반감됩니다.

2017.4 영문판도 같은 말을 한다.

> It is highly recommended that you use assembly definition files for all the
> scripts in the Project, or not at all.

**이유로 적힌 건 「이점이 반감된다」다.** 성능 이야기다. 절반만 나누면
`Assembly-CSharp`가 매번 다시 컴파일되니 단축 효과가 줄어든다는 것이고, 그건
사실이다.

그런데 앞 절에서 본 금지 규칙을 같이 읽으면 **이유가 하나 더 있고, 그쪽이 더
세다.** 절반만 나누면 효과가 줄어드는 게 아니라, 나눈 쪽 코드가 안 나눈 쪽
코드를 **아예 참조할 수 없다.** 성능 저하가 아니라 컴파일 에러다.

여기서 하나 덧붙여야 한다. **현행 문서에서는 저 권고 문장을 찾지 못했다.**
[조직화 허브 페이지](https://docs.unity3d.com/6000.2/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)와
[어셈블리 소개 페이지](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-intro.html)
어디에도 "전부 아니면 전혀"에 해당하는 문장이 없다. 대신 모듈성과 재사용성을
이야기한다.

> By defining assemblies, you can organize your code to promote modularity and
> reusability.

권고가 사라진 것 자체가 방향 전환으로 보인다. 2017년에는 "효과를 보려면 전부
나눠라"였고, 지금은 "경계를 의도적으로 그어라"다. **그리고 그 사이에 점진적
이행을 가능하게 하는 도구가 하나 추가됐다** — 뒤에서 볼 `.asmref`다.

## define을 설정할 수 없다는 문장은 이제 틀렸다

스크랩본에 「어셈블리 정의 파일은 빌드 시스템 파일이 아님」이라는 절이 있다.
앞부분은 지금도 맞다.

> The assembly definition files are not assembly build files. They do not
> support conditional build rules typically found in build systems.

문제는 그 뒤에 붙은 문장이다.

> 그렇기 때문에 어셈블리 파일은 전처리 명령(define)의 설정도 지원하지
> 않습니다. **항상 정적이기 때문입니다.**

**지금은 둘 다 아니다.** 현행 asmdef에는 define을 다루는 필드가 두 개 있고,
그중 하나는 이름부터 「버전에 따라 define한다」는 뜻이다.

`defineConstraints`는 **읽는** 쪽이다. 인스펙터 레퍼런스의 설명이다.

> Define constraints specify the scripting symbols that must be defined in your
> project for Unity to compile or reference an assembly. All the listed symbols
> must be defined for the assembly to compile.

나열한 심볼이 **전부** 정의돼 있어야 그 어셈블리가 컴파일된다. AND다. 참고로
플러그인 쪽 define constraints에는 부정 형태도 문서화되어 있다.

> You can use the '!' character to specify that a plug-in should be included
> only when a certain #define directive is **not** set in the currently defined
> define directives.

`versionDefines`는 **쓰는** 쪽이다. 파일 포맷 레퍼런스가 필드 셋을 적는다.

> Contains an object for each version define. This object has three fields:
> `name`:string – The name of the resource. `expression`:string – The
> expression defining the version or range of versions of the resource.
> `define`:string – The symbol to define.

**마지막 필드가 「정의할 심볼」이다.** 패키지나 모듈의 버전을 보고 전처리기
심볼을 정의한다. 스크랩본이 "항상 정적이라서 안 된다"고 한 바로 그 일이다.

버전 식은 수학의 구간 표기를 쓴다.

| 식 | 평가 결과 |
| --- | --- |
| `[1.3,3.4.1]` | `1.3.0 <= x <= 3.4.1` |
| `(1.3.0,3.4)` | `1.3.0 < x < 3.4.0` |
| `[2.4.5]` | `x = 2.4.5` |

대괄호가 포함, 소괄호가 제외다. 문서가 제약도 적어둔다 — **공백과 와일드카드는
쓸 수 없다.**

입력 처리를 패키지 버전에 따라 가르는 예로 쓰면 이렇게 된다.

```json
{
    "name": "Game.Input",
    "references": ["Unity.InputSystem"],
    "versionDefines": [
        {
            "name": "com.unity.inputsystem",
            "expression": "[1.14.0,2.0.0)",
            "define": "GAME_INPUTSYSTEM_1_14_OR_NEWER"
        }
    ]
}
```

그러면 코드 쪽에서 이렇게 갈린다.

```csharp
#if GAME_INPUTSYSTEM_1_14_OR_NEWER
    // 1.14 이상에서만 있는 경로
#else
    // 그 아래 버전용 폴백
#endif
```

`#if`로 플랫폼을 가르는 이야기는
[Application.Quit을 다룬 글](/posts/unity-application-quit/)에서 봤다. 거기서는
`UNITY_EDITOR`·`UNITY_ANDROID`처럼 **Unity가 정의해 주는** 심볼을 썼고, 여기서는
**내가 조건을 적어 만든** 심볼을 쓴다. 생성 주체가 다르다. Input System의
생성 클래스를 다룬 글은 [여기](/posts/input-generated-class/)에 있다 — 패키지
버전에 따라 생성물이 달라지는 쪽이라 이 필드를 쓸 자리가 실제로 생긴다.

## 필드가 4개에서 11개가 됐다

스크랩본의 파일 포맷 표는 네 줄이다.

| 필드 | 타입 |
| --- | --- |
| `name` | 문자열 |
| `references` (optional) | 문자열 배열 |
| `includePlatforms` (optional) | 문자열 배열 |
| `excludePlatforms` (optional) | 문자열 배열 |

현행 레퍼런스는 열한 줄이다. 알파벳 순으로 `allowUnsafeCode`,
`autoReferenced`, `defineConstraints`, `excludePlatforms`, `includePlatforms`,
`name`, `noEngineReferences`, `overrideReferences`, `precompiledReferences`,
`references`, `versionDefines`다. 필수는 여전히 `name` 하나다.

늘어난 일곱 개 중 성격을 알아둘 만한 것들이다.

| 필드 | 하는 일 |
| --- | --- |
| `autoReferenced` | 미리 정의된 어셈블리가 이 어셈블리를 자동 참조할지. 기본 `true` |
| `noEngineReferences` | 켜면 `UnityEngine`·`UnityEditor` 참조를 넣지 않는다 |
| `allowUnsafeCode` | C# `unsafe` 키워드를 쓸 때 컴파일러에 `/unsafe`를 넘긴다 |
| `overrideReferences` | 의존하는 **미리 컴파일된** 어셈블리를 직접 지정하겠다는 선언 |
| `precompiledReferences` | 그 DLL들의 파일명. 경로 없이 확장자까지 |
| `defineConstraints` | 이 심볼들이 전부 정의돼 있어야 컴파일된다 |
| `versionDefines` | 패키지·모듈 버전을 보고 심볼을 정의한다 |

`autoReferenced`의 설명에 한 줄이 더 붙어 있는데, 이게 헷갈리기 쉬운 자리다.

> Specify whether this assembly is automatically referenced by Unity's
> predefined assemblies. When disabled, Unity does not automatically reference
> the assembly during compilation. **This has no effect on whether Unity
> includes the assembly in the build.**

**참조를 끊는 것과 빌드에서 빼는 것은 다르다.** `autoReferenced`를 끄면
`Assembly-CSharp`에서 그 타입들이 안 보이게 되지만, 어셈블리 자체는 그대로
빌드에 들어간다. 용량을 줄이려고 끄는 스위치가 아니다.

`precompiledReferences`의 공식 예제에는 익숙한 이름이 들어 있다.

```json
{
    "name": "BeeAssembly",
    "references": ["Unity.CollabProxy.Editor", "AssemblyB"],
    "includePlatforms": ["Android", "LinuxStandalone64", "WebGL"],
    "excludePlatforms": [],
    "overrideReferences": true,
    "precompiledReferences": ["Newtonsoft.Json.dll", "nunit.framework.dll"],
    "autoReferenced": false,
    "defineConstraints": ["UNITY_2019", "UNITY_INCLUDE_TESTS"]
}
```

`Newtonsoft.Json.dll`이다.
[Newtonsoft Json 설치를 다룬 글](/posts/unity-newtonsoft-json-install/)에서 같은
타입이 두 어셈블리에 들어가 충돌하는 경우를 봤는데, `overrideReferences`와
`precompiledReferences`가 그 충돌을 **어셈블리 단위로 고정**하는 수단이다. 어떤
DLL을 참조할지 이름으로 못 박는다.

### 이름 대신 GUID로 참조한다

스크랩본의 예제는 참조를 어셈블리 이름으로 적는다.

```json
{
    "name": "MyLibrary",
    "references": [ "Utility" ],
    "includePlatforms": ["Android", "iOS"]
}
```

현행 문서의 두 번째 예제는 모양이 다르다.

```json
{
    "name": "BeeAssembly",
    "references": ["GUID:17b36165d09634a48bf5a0e4bb27f4bd"],
    "excludePlatforms": ["iOS", "macOSStandalone", "tvOS"],
    "allowUnsafeCode": false,
    "overrideReferences": true
}
```

인스펙터의 `Use GUIDs` 스위치가 이걸 결정한다.

> This setting controls how Unity serializes references to other Assembly
> Definition assets. When you enable this property, Unity saves the reference as
> the asset's GUID, instead of the Assembly Definition name.

이득은 분명하다.

> allows you to change the filename of the referenced Assembly Definition asset
> without updating references in other Assembly Definitions to reflect the new
> name.

**이름을 바꿔도 참조가 안 깨진다.** 대신 조건이 붙는다. GUID는 `.meta` 파일에
있는 값이므로, `.meta`를 지우거나 에디터 밖에서 파일을 옮기면 GUID가 바뀌고
참조가 끊긴다. `.meta` 파일이 왜 전부 커밋 대상인지는
[Git LFS 추적을 해제한 글](/posts/git-lfs-untrack/)에서 다뤘다. 거기서는 개수가
많아서 LFS에 넣지 말라는 이야기였는데, **참조의 정체성이 그 안에 있다**는 것이
더 본질적인 이유다.

### Root Namespace는 인스펙터에만 있다

현행 인스펙터에는 `Root Namespace` 항목이 있다.

> The default namespace for scripts in this assembly definition. If you use
> either Rider or Visual Studio as your code editor, they automatically add this
> namespace to any new scripts you create in this assembly definition.

그런데 **파일 포맷 레퍼런스의 열한 개 필드에 `rootNamespace`가 없다.**
인스펙터 레퍼런스에는 있고 파일 포맷 레퍼런스에는 없다. 둘 중 하나가 덜
갱신된 상태로 보인다. asmdef를 손으로 편집할 때는 인스펙터로 한 번 설정하고
저장된 JSON을 확인하는 편이 안전하다.

참고로 스크랩본의 예제 JSON은 그 자체로 한 번 더 깨져 있다. 스마트 인용부호
(`"` 대신 `“ ”`)로 되어 있고 대괄호가 이스케이프돼 있어서, 그대로 복사하면
**JSON으로 파싱되지 않는다.** 문서의 문제가 아니라 스크랩 과정의 사고지만,
클리핑에서 바로 붙여 쓰려면 걸린다.

## 2017.4와 지금 사이에 바뀐 절차

손으로 따라가는 절차도 달라졌다. 스크랩본의 메뉴 경로는 이렇다.

> 어셈블리 정의 파일은 **Assets** > **Create** > **Assembly Definition** 을
> 선택하여 생성할 수 있는 에셋 파일입니다.

현행은 **Assets > Create > Scripting > Assembly Definition**이다. `Scripting`
한 단계가 중간에 들어갔다. 그리고 같은 메뉴에 2017.4에는 없던 항목이 하나 더
있다 — **Assembly Definition Reference**(`.asmref`)다.

| | `.asmdef` | `.asmref` |
| --- | --- | --- |
| 하는 일 | 새 어셈블리를 정의한다 | 이 폴더의 스크립트를 **기존** 어셈블리에 넣는다 |
| 인스펙터 | 이름, 참조, 플랫폼, 제약 등 | 대상 어셈블리 정의 하나 |
| 쓰는 자리 | 경계를 새로 긋는다 | 떨어져 있는 폴더를 기존 경계 안으로 끌어온다 |

그래서 중첩 규칙도 문장이 달라졌다. 스크랩본은 「경로 거리가 가장 짧은 어셈블리
정의 파일에 각 스크립트가 추가됩니다」고 한다. 현행은 이렇다.

> The new assembly includes all scripts in the same folder as the Assembly
> Definition plus those in any subfolders that don't have their own Assembly
> Definition **or Reference** file.

`.asmref`도 경계를 끊는다는 말이다. 결과는 같지만 끊는 수단이 둘이 됐다.

### Editor 폴더가 런타임 어셈블리에 들어간다

스크랩본은 asmdef가 특수 폴더보다 우선한다고만 적는다. 현행 문서는 그 결과를
구체적으로 쓴다.

> Unity normally compiles any scripts in folders named `Editor` into the
> predefined `Assembly-CSharp-Editor` assembly no matter where those scripts are
> located.

> if you create an Assembly Definition asset in a folder that has an `Editor`
> folder underneath it, Unity no longer puts those Editor scripts into the
> predefined Editor assembly. Instead, they go into the new assembly created by
> your Assembly Definition.

**`Editor` 폴더에 넣어둔 코드가 런타임 어셈블리로 들어간다.** 그 안에서
`UnityEditor`를 쓰고 있으면 플레이어 빌드에서 참조를 해결할 곳이 없다.
[애트리뷰트를 다룬 글](/posts/unity-attributes/)에서 `[MenuItem]`을
MonoBehaviour에 붙일 때 생기던 충돌과 **같은 모양**이다. 거기서 매뉴얼이
`Editor` 폴더의 대안으로 어셈블리 정의 에셋을 든다고 적었는데, 그 대안이 이
함정을 같이 들고 온다.

해법은 에디터 코드에 **자기 asmdef를 따로 주고 플랫폼을 Editor로 제한**하는
것이다. 미리 정의된 어셈블리 쪽 규칙을 같이 보면 왜 그래야 하는지가 보인다.

| 단계 | 어셈블리 | 들어가는 스크립트 |
| --- | --- | --- |
| 1 | `Assembly-CSharp-firstpass` | `Plugins` 폴더의 런타임 스크립트 |
| 2 | `Assembly-CSharp-Editor-firstpass` | 최상위 `Plugins` 안의 `Editor` 폴더 스크립트 |
| 3 | `Assembly-CSharp` | `Editor` 폴더에 없는 나머지 전부 |
| 4 | `Assembly-CSharp-Editor` | `Editor` 폴더에 있는 나머지 전부 |

> The basic rule is that a script can reference anything compiled in its own
> compilation phase or an earlier one, but can't reference anything compiled in
> a later phase.

**이 네 단계가 asmdef를 쓰면 통째로 비활성된다.** 단계로 풀던 순서 문제를
참조 그래프로 직접 풀어야 한다는 뜻이고, 에디터·런타임 분리도 그중 하나다.

## 그림 3의 캡션이 같은 것을 두 번 센다

판본과 별개로, 한국어판 자체에 오류가 하나 있다. 스크랩본의 그림 3 설명이다.

> **그림 3** 의 다이어그램은 미리 정의된 어셈블리, 어셈블리 정의 파일 어셈블리,
> **미리 정의된 어셈블리**의 상호 종속성을 도해로 설명합니다.

세 항목을 나열하는데 첫째와 셋째가 같은 말이다. 영문 2017.4판을 보면 답이
나온다.

> The diagram in **Figure 3** illustrates the dependencies between predefined
> assemblies, assembly definition files assemblies and **precompiled
> assemblies**.

셋째는 `precompiled assemblies`, **미리 컴파일된 어셈블리**다. 플러그인으로
넣는 DLL이다. `precompiled`가 `predefined`로 옮겨지면서 **세 종류 중 하나가
목록에서 사라졌다.**

번역 선택이 아니라 오류로 보는 근거는 같은 절 바로 앞 문단에 있다. 거기서는
용어를 제대로 쓴다.

> 모든 스크립트가 Unity 에디터의 액티브 빌드 타겟과 호환되는 모든 **미리
> 컴파일된 어셈블리(플러그인/.dll)** 에 종속되는 것과 유사합니다.

**한 절 안에서 같은 단어가 두 번 다르게 옮겨졌다.** 그리고 사라진 그 항목이
앞에서 본 `precompiledReferences`가 가리키는 대상이라, 빠진 자리가 작지 않다.
세 종류를 구분하면 이렇다.

| 종류 | 예 | 내 asmdef에서 참조하는 방법 |
| --- | --- | --- |
| 미리 정의된 어셈블리 | `Assembly-CSharp` | 금지 |
| 어셈블리 정의 어셈블리 | 내가 만든 `Game.Core` | `references` |
| 미리 컴파일된 어셈블리 | `Newtonsoft.Json.dll` | `overrideReferences` + `precompiledReferences` |

한국어 매뉴얼의 오류는 앞서도 만났다.
[GPU 인스턴싱 문서](/posts/gpu-instancing-shader/)에서는 매크로 이름에서 글자
하나가 빠져 있었다. 한국어 매뉴얼을 볼 때는 **이름이 걸리는 순간 영문판을 같이
여는 쪽**이 빠르다.

## 어디에 왜 쓰나

### 안쪽으로만 의존하게 만든다

금지 규칙 때문에 어셈블리를 나누는 일은 **의존 방향을 정리하는 일**이 된다.
안쪽(asmdef)은 바깥(`Assembly-CSharp`)을 못 보므로, 바깥이 필요한 것은
인터페이스로 뒤집는다.

경계 안쪽에 두는 코드다. 바깥의 어떤 타입도 참조하지 않는다.

```csharp
// Assets/Core/Game.Core.asmdef 안
using System;
using UnityEngine;

namespace Game.Core
{
    public interface IDamageable
    {
        void TakeDamage(int amount);
    }

    [DisallowMultipleComponent]
    public class Health : MonoBehaviour, IDamageable
    {
        private const int DEFAULT_MAX = 100;

        [Header("Health")]
        [SerializeField, Range(1, 999), Tooltip("최대 체력")]
        private int _maxHealth = DEFAULT_MAX;

        private int _current;

        // 바깥 어셈블리가 구독한다. 안쪽은 누가 듣는지 모른다.
        public event Action<int, int> HealthChanged;
        public event Action Died;

        public int Current => _current;

        private void Awake()
        {
            _current = _maxHealth;
        }

        public void TakeDamage(int amount)
        {
            if (amount <= 0 || _current <= 0)
            {
                return;
            }

            _current = Mathf.Max(_current - amount, 0);
            HealthChanged?.Invoke(_current, _maxHealth);

            if (_current == 0)
            {
                Died?.Invoke();
            }
        }
    }
}
```

바깥에 남겨두는 글루 코드다. 이쪽은 안쪽을 **참조할 수 있다.**

```csharp
// Assets/GameplayGlue.cs — Assembly-CSharp
using Game.Core;
using UnityEngine;

public class GameplayGlue : MonoBehaviour
{
    private const string PLAYER_TAG = "Player";

    [Header("Wiring")]
    [SerializeField, Tooltip("체력을 감시할 대상")]
    private Health _playerHealth;

    private void Awake()
    {
        if (_playerHealth == null && !TryGetComponent(out _playerHealth))
        {
            return;
        }

        _playerHealth.Died += OnPlayerDied;
    }

    private void OnDestroy()
    {
        if (_playerHealth == null)
        {
            return;
        }

        // 구독은 반드시 해제한다. 이벤트 수명이 컴포넌트 수명보다 길다.
        _playerHealth.Died -= OnPlayerDied;
    }

    private void OnTriggerEnter(Collider other)
    {
        // 문자열 비교 대신 CompareTag를 쓴다.
        if (!other.CompareTag(PLAYER_TAG))
        {
            return;
        }

        if (other.TryGetComponent(out IDamageable damageable))
        {
            damageable.TakeDamage(10);
        }
    }

    private void OnPlayerDied()
    {
        Debug.Log("player died", this);
    }
}
```

**`event`와 인터페이스가 방향을 뒤집는 도구다.** `Health`는 누가 자신을
구독하는지 모르고, 그래서 바깥을 참조할 필요가 없다. 추상에 의존해 구체를
바꿔 끼우는 모양 자체는
[팩토리 패턴을 다룬 글](/posts/factory-pattern/)에서 본 것과 같은데, 여기서는
동기가 설계 취향이 아니라 **컴파일러가 막기 때문**이다.

`_playerHealth == null` 비교를 `?.`로 쓰지 않는 이유는
[Fake Null을 다룬 글](/posts/unity-fake-null/)에 있다. Unity 오브젝트는 파괴된
뒤에도 관리 측 참조가 남아서, `?.`는 그 상태를 걸러내지 못한다.

### 어디서 끊을지 정한다

어디에 경계를 그을지는 참조 방향으로 정한다. 실제로 쓸 만한 순서다.

1. **아무것도 참조하지 않는 코드부터** asmdef로 묶는다. 수학 유틸리티, 순수
   데이터 타입, 확장 메서드 같은 것들이다. 바깥을 안 보므로 금지 규칙에 걸릴
   일이 없다.
2. 그 위에 **그 유틸리티만 참조하는 층**을 묶는다.
3. 씬의 특정 오브젝트를 알아야 하는 글루 코드는 **`Assembly-CSharp`에
   남긴다.** 가장 자주 고치는 코드이기도 하다.
4. 에디터 코드는 **자기 asmdef에 플랫폼 Editor로** 넣는다.

떨어져 있는 폴더를 기존 어셈블리에 합치고 싶을 때만 `.asmref`를 쓴다. 폴더
구조를 바꾸지 않고 경계를 조정할 수 있다는 게 2017.4 시점에 없던 여유다.

### 쓰지 말아야 할 자리

- **스크립트 몇 개를 시험 삼아 asmdef로 옮기는 것.** 옮긴 쪽이 남은 쪽을
  참조할 수 없다. 참조가 없는 코드부터 옮긴다.
- **용량을 줄이려고 `autoReferenced`를 끄는 것.** 문서가 명시한다 — 빌드 포함
  여부에는 영향이 없다.
- **`Editor` 폴더에 의존해 에디터 코드를 분리하는 것.** 상위 폴더에 asmdef가
  있으면 그 폴더 이름은 의미를 잃는다.
- **참조를 이름으로 두고 파일명을 바꾸는 것.** `Use GUIDs`를 켜두면 이름 변경이
  참조를 깨지 않는다.
- **`defineConstraints`를 플랫폼 분기로 쓰는 것.** 플랫폼은
  `includePlatforms`·`excludePlatforms`의 일이고, 문서는 둘을 같은 파일에서
  함께 쓰지 말라고 한다.
- **2017.4 문서를 보고 "asmdef로는 define을 못 만든다"고 결론 내리는 것.**
  `versionDefines`가 정확히 그 일을 한다.

## 정리

- **종속성은 한 방향이고 반대는 금지다.** 미리 정의된 어셈블리가 내 어셈블리를
  참조하고, 내 어셈블리는 미리 정의된 어셈블리를 참조할 수 없다. 전부
  참조하기 때문에 반대 방향이 곧 순환이 된다.
- **그게 "전부 쓰거나 전혀"의 실제 이유다.** 스크랩본이 적은 이유는 「이점이
  반감된다」인데, 절반만 나누면 효과가 줄어드는 게 아니라 컴파일이 안 된다.
- **현행 문서에서는 그 권고 문장을 찾지 못했다.** 대신 모듈성과 재사용성을
  말하고, 점진적 이행용으로 `.asmref`가 추가됐다.
- **"define을 설정할 수 없다"는 틀렸다.** `defineConstraints`는 심볼을 읽고,
  `versionDefines`는 패키지 버전을 보고 심볼을 **정의한다.** 스크랩본이 적은
  「항상 정적이기 때문」이라는 근거도 같이 무효가 된다.
- **필드가 4개에서 11개로 늘었다.** 그중 `autoReferenced`는 참조만 끊고 빌드
  포함에는 영향이 없다. `Use GUIDs`를 켜면 파일명을 바꿔도 참조가 유지되는데,
  그 값은 `.meta`에 있다.
- **`Root Namespace`는 인스펙터 레퍼런스에만 있다.** 파일 포맷 레퍼런스의 열한
  필드에 `rootNamespace`가 없다.
- **메뉴 경로에 `Scripting`이 끼었고 `.asmref`가 생겼다.** 중첩 규칙도
  「asmdef 또는 asmref가 없는 하위 폴더」로 문장이 바뀌었다.
- **asmdef를 두면 특수 폴더 네 단계가 비활성된다.** `Editor` 폴더 코드가
  런타임 어셈블리로 들어가므로, 에디터 코드에는 플랫폼을 제한한 자기 asmdef를
  준다.

---

### 참고

- [Organizing scripts into assemblies — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html) ·
  [Introduction to assemblies in Unity](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-intro.html)
- [Referencing assemblies — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-referencing.html)
- [Creating assembly assets — Unity 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/assembly-definitions-creating.html)
- [Assembly Definition properties reference — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-AssemblyDefinitionImporter.html)
- [Assembly Definition file format reference — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definition-file-format.html)
- [Conditionally including assemblies — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definition-includes.html)
- [Predefined assemblies reference — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/script-compile-order-folders.html)
- [PluginImporter.DefineConstraints — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/PluginImporter.DefineConstraints.html)
- [CompilationPipeline — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Compilation.CompilationPipeline.html)
- [Script compilation and assembly definition files — Unity 2017.4 매뉴얼 (스크랩본의 판)](https://docs.unity3d.com/2017.4/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)

이 글의 출발점이 된 자료는
[스크립트 컴파일 및 어셈블리 정의 파일](https://docs.unity3d.com/kr/2017.4/Manual/ScriptCompilationAssemblyDefinitionFiles.html)
(Unity 2017.4 한국어 매뉴얼)이다. 설명과 필드 표를 현행 Unity 6 문서와 다시
대조하고, 영문 2017.4판으로 번역을 확인했다.
