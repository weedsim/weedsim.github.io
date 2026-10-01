---
pubDatetime: 2026-10-01T19:30:00+09:00
title: "Override Tags는 태그를 무시하지 않는다"
lang: ko
translationKey: tmp-inspector-settings
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - TextMeshPro
description: "TextMeshPro 인스펙터 칸들을 훑은 정리 글인데, 네 칸이 다른 걸 가리킨다. Override Tags는 색 태그만 무시하고, Text Wrapping Mode에 Overflow라는 값은 없고, Extra Settings에는 윤곽선도 그림자도 없고, Text Style은 Font Style이 아니다."
---

레거시 UI 대신 **퀄리티가 더 좋고 폰트를 다양하게 쓸 수 있다는 TextMeshPro**를
어떻게 쓰는지 찾다가 스크랩한 글이다. 2025년 글이고, 인스펙터 스크린샷 하나에
보이는 항목을 위에서 아래로 번호 붙여 설명한다.

필드 이름과 값의 목록은 대체로 맞다. `Font Asset`이 SDF 텍스처를 들고 있다는
설명도, `Spacing Options`의 네 항목도, `Alignment`가 아홉 방향이라는 것도
맞다.

그런데 **네 칸이 다른 걸 가리킨다.** 이름을 잘못 읽은 게 아니라, 그 칸이 하는
일을 옆 칸이 하는 일로 적어놨다.

| 클리핑이 적은 것 | 실제 |
| --- | --- |
| Override Tags: 태그를 무시한다 | 색을 바꾸는 태그만 무시한다 |
| Text Wrapping Mode: Normal / Overflow | Wrapping과 Overflow는 별개 칸이다 |
| Extra Settings: 윤곽선·그림자·테두리 | 그건 머티리얼이다 |
| Text Style: Bold, Italic 조합 | 그건 Font Style이다 |

네 개가 따로 난 실수는 아니다. **TextMeshPro 인스펙터는 서로 다른 세 에셋의
설정이 한 패널에 겹쳐 있는 구조**이고, 그걸 한 줄짜리 목록으로 읽으면 이렇게
된다.

## 목차

## 필드 이름과 값은 대체로 맞다

먼저 맞는 쪽부터. `Font Asset` 설명은 정확하다.

> 이 폰트는 TextMeshPro 전용 Font Asset으로, SDF(Signed Distance Field)
> 텍스처를 포함하고 있습니다.

맞다. 그리고 이게 레거시 UI의 `Text`와 갈리는 지점이다. 문서가 SDF 아틀라스를
이렇게 설명한다.

> SDF font assets contain **contour distance information.** In font atlases, this
> information looks like grayscale gradients running from the middle of each
> glyph to a point past its edge.

글자 모양을 픽셀로 굽는 대신 **윤곽까지의 거리**를 담아두고, 셰이더가 그 거리로
윤곽을 다시 그린다. 그래서 비트맵 폰트가 카메라 거리와 변형에 따라 거칠어지거나
흐려지는 자리에서, SDF는 **거리와 무관하게 매끄러운 경계**를 낸다. "퀄리티가 더
좋다"는 말의 실체가 이것이다.

거리 정보를 들고 있다는 게 하나를 더 준다. **윤곽선과 그림자를 셰이더에서
거리값으로 만들 수 있다** — 뒤에서 볼 머티리얼의 `Outline`과 `Underlay`가
그것이다.

`Spacing Options`의 네 항목도 맞다. 문서가 같은 네 개를 나열한다.

| 인스펙터 | 문서 설명 |
| --- | --- |
| Character | "Sets spacing between characters." |
| Word | "Sets spacing between words." |
| Line | "Sets spacing between lines." |
| Paragraph | "Sets spacing between paragraphs (explicit line breaks)." |

`Paragraph`에 붙은 괄호가 중요한데, 클리핑에는 없다. **단락은 명시적인 줄바꿈
(`\n` 또는 `<br>`)으로 구분된 덩어리**다. 자동 줄바꿈으로 생긴 줄은 `Line`이고,
엔터로 만든 줄은 `Paragraph`다. 둘 다 올려놓고 왜 간격이 두 배로 벌어지는지
못 찾는 일이 생긴다.

`Alignment`도 맞다. 다만 아홉 가지라는 것보다 **가로와 세로가 따로**라는 게
실제로 쓰이는 정보다. 가로는 Left / Center / Right / Justified / Flush /
Geometry Center, 세로는 Top / Middle / Bottom / Baseline / Midline / Capline
이다. 클리핑은 "왼쪽 정렬, 가운데 정렬, 오른쪽 정렬, 위쪽 정렬 등"으로 가로와
세로를 한 줄에 섞어 적었다.

`Font Style`의 목록도 일부만 적혀 있다. 클리핑은 네 개를 든다 — B, I, U, S.
인스펙터에는 일곱 개가 있다.

| 버튼 | 뜻 |
| --- | --- |
| B / I / U / S | Bold / Italic / Underline / Strikethrough |
| ab | 전부 소문자 |
| AB | 전부 대문자 |
| SC | 스몰캡스 |

그리고 조합 규칙이 문서에 적혀 있다.

> Enable standard text styling options. You can use these options in any
> combination, **except for the casing options (lowercase, uppercase, and small
> caps), which are mutually exclusive.**

B와 I는 같이 켜지지만 ab와 AB는 같이 안 켜진다.

## Override Tags는 색 태그만 무시한다

클리핑의 설명은 이렇다.

> **Override Tags**: TextMeshPro의 태그(예: `<b>`로 굵게 설정)를 무시할지 여부를
> 설정합니다.

예시로 `<b>`를 들었는데, **`<b>`는 이 체크박스와 아무 상관이 없다.** 문서의
설명은 한 줄이다.

> **Override Tags:** Enable this option to **ignore any rich text tags that change
> text color.**

색을 바꾸는 태그만이다. `<color=red>`, `<#ff0000>`, `<gradient>` 같은 것들.
`<b>`, `<i>`, `<size>`, `<align>`은 체크해도 그대로 적용된다.

쓰는 자리가 분명하다. **서버나 유저가 넣은 문자열을 그대로 표시할 때**, 색만
막고 서식은 살리고 싶은 경우다. 닉네임에 `<color=#000000>`을 넣어 검은 배경에서
안 보이게 만드는 장난을 막으면서 `<b>`는 허용하고 싶다면 이 칸이 맞다.

반대로 **모든 태그를 글자로 보이게 하고 싶다면 이 칸이 아니다.** 그 칸은
`Rich Text`이고, 뒤에서 볼 `Extra Settings` 안에 있다.

> **Rich Text:** Toggle rich text tag support.

코드에서는 두 칸이 이름이 다른 두 프로퍼티다. 헷갈릴 일이 없다.

```csharp
using TMPro;
using UnityEngine;

public class ChatLabel : MonoBehaviour
{
    [Header("References")]
    [SerializeField, Tooltip("채팅 한 줄을 표시할 라벨")]
    private TextMeshProUGUI _label;

    /// <summary>유저가 보낸 문자열. 색 장난만 막고 서식은 살린다.</summary>
    public void ShowUserMessage(string message)
    {
        _label.richText = true;          // <b>, <size>는 그대로 적용된다.
        _label.overrideColorTags = true; // <color>, <#hex>, <gradient>만 무시한다.
        _label.text = message;
    }

    /// <summary>태그를 글자 그대로 보여준다. 로그 창처럼.</summary>
    public void ShowRaw(string message)
    {
        _label.richText = false;         // 모든 태그가 글자로 보인다.
        _label.text = message;
    }
}
```

같은 Color 그룹에 있는 `Vertex Color` 설명도 한 군데 틀렸다.

> **Vertex Color** ... 이 색상은 Material의 색상 위에 **추가적으로** 적용됩니다.

문서가 말하는 건 더하기가 아니라 곱하기다. `Color Gradient` 쪽에 명시되어 있다.

> TextMesh Pro **multiplies** gradient colors with the text's main vertex color
> (**Main Settings > Vertex Color** in the TextMesh Pro Inspector).

곱하기라는 게 실제로 걸리는 지점이 있다. 클리핑의 스크린샷은 `Vertex Color`가
**검정**이고 `Color Gradient`가 꺼져 있는 상태다. 이 상태에서 그라데이션을
켜면 **아무것도 안 보인다.** 어떤 색을 넣어도 검정과 곱하면 검정이다. 문서가
그 경우를 직접 든다.

> if the main vertex color is black, the gradient colors disappear entirely

그라데이션을 쓸 거면 `Vertex Color`를 **흰색**으로 두는 게 기본이다. 그래야
그라데이션 색이 그대로 나온다.

머티리얼의 Face Color와 버텍스 컬러가 어떻게 합쳐지는지는 문서에서 찾지
못했다. 그라데이션과 버텍스 컬러가 곱해진다는 것만 적혀 있다.

## Text Wrapping Mode에 Overflow라는 값은 없다

클리핑은 이렇게 적는다.

> **Text Wrapping Mode** — 텍스트가 컨테이너를 초과할 경우의 처리 방식을
> 설정합니다: **Normal**: 텍스트가 자동으로 줄 바꿈됩니다. **Overflow**: 텍스트가
> 컨테이너를 넘어서 렌더링됩니다.

두 개를 하나로 합쳐놨다. 인스펙터에는 **칸이 두 개**다.

> **Wrapping:** **Enable** or **Disable** word wrapping.
>
> **Overflow:** Specify what happens when the text doesn't fit inside the display
> area.

줄바꿈 모드의 값은 네 개이고 그중에 `Overflow`는 없다.

| `TextWrappingModes` | 뜻 |
| --- | --- |
| Normal | 단어 단위로 줄바꿈 |
| NoWrap | 줄바꿈 안 함 |
| PreserveWhitespace | 줄바꿈하면서 공백 유지 |
| PreserveWhitespaceNoWrap | 줄바꿈 없이 공백 유지 |

`Overflow`는 따로 있는 칸이고, 값이 일곱 개다.

| `Overflow` | 문서 설명 |
| --- | --- |
| Overflow | "Extends the text beyond the bounds of the display area, but still wraps it if **Wrapping** is enabled." |
| Ellipsis | "Cuts off the text and inserts an ellipsis (…)..." |
| Masking | "Like **Overflow**, but the shader hides everything outside of the display area." |
| Truncate | "Cuts off the text when it no longer fits." |
| Scroll Rect | "A legacy mode that's similar to **Masking**." |
| Page | "Cuts the text into several pages that each fit inside the display area." |
| Linked | "Extends the text into another TextMesh Pro GameObject that you select." |

첫 줄이 두 칸의 관계를 그대로 말해준다. `Overflow`를 골라도 **`Wrapping`이
켜져 있으면 줄바꿈은 그대로 일어난다.** 영역을 넘어가는 건 세로 방향이다.
이게 둘을 하나로 합쳐 생각하면 안 되는 이유다. 네 개 × 일곱 개의 조합이 있고,
`NoWrap` + `Ellipsis`(한 줄로 자르고 … 붙이기)처럼 자주 쓰는 조합은 양쪽을
따로 골라야 나온다.

코드에서도 프로퍼티가 둘이다. 한 줄로 자르고 … 붙이는 흔한 조합은 이렇게
된다.

```csharp
using TMPro;
using UnityEngine;

public class NicknameLabel : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private TextMeshProUGUI _label;

    private void Awake()
    {
        // 두 칸이다. 하나를 Overflow로 두는 게 아니라 각각 고른다.
        _label.textWrappingMode = TextWrappingModes.NoWrap;
        _label.overflowMode = TextOverflowModes.Ellipsis;
    }

    public void Show(string nickname)
    {
        _label.text = nickname;
    }
}
```

반대 방향의 간섭도 있다. 문서가 한 줄 덧붙인다 — 일부 오버플로 모드는 줄바꿈
설정을 덮어쓴다. `Truncate`는 `Wrapping`이 켜져 있든 꺼져 있든 자른다.

## Extra Settings에는 윤곽선도 그림자도 없다

클리핑의 마지막 항목이다.

> **Extra Settings** — 추가 설정을 열어 텍스트 **윤곽선, 그림자, 테두리** 등
> 고급 효과를 제어할 수 있습니다.

세 개 다 아니다. 윤곽선·그림자·베벨은 **머티리얼(셰이더)** 속성이다. Distance
Field 셰이더의 묶음 이름과 설명이 이렇다.

| 셰이더 속성 그룹 | 문서 설명 |
| --- | --- |
| Face | "Controls the text's overall appearance." |
| Outline | "Adds a colored and/or textured outline to the text." |
| Underlay | "Adds a second rendering of the text underneath the original rendering, for example to add a drop shadow." |
| Lighting | "Simulates local directional lighting on the text." |
| Glow | "Adds a smooth outline to the text in order to simulate glow." |

윤곽선은 `Outline`, 그림자는 `Underlay`, 테두리 입체감은 `Lighting`의 베벨이다.
전부 인스펙터 **아래쪽의 머티리얼 섹션**에 있고, `Extra Settings`와는 다른
에셋이다.

`Extra Settings`에 실제로 들어 있는 건 이것들이다.

| 항목 | 문서 설명 |
| --- | --- |
| Margins | "Adjusts distance between text and container boundaries." |
| Geometry Sorting | "Normal or Reverse quad rendering order." |
| Rich Text | "Toggle rich text tag support." |
| Raycast Target | "Makes the object a raycast target." |
| Parse Escape Characters | "Interprets backslash-escaped characters as special characters." |
| Visible Descender | "Controls text reveal direction (bottom-up or top-down)." |
| Sprite Asset | "Asset reference for sprites." |
| Kerning | "Toggles kerning; defined in Font Asset." |
| Extra Padding | "Adds padding to character sprites to prevent clipping." |

효과가 아니라 **동작 설정**들이다. 그리고 이 목록에 실무에서 가장 자주 건드리는
두 칸이 들어 있다.

`Raycast Target`은 기본이 켜져 있다. 버튼 위에 얹은 라벨이 클릭을 먹어서 버튼이
안 눌리는 증상이 여기서 나온다. **텍스트가 클릭을 받을 이유가 없으면 끈다.**

`Extra Padding`은 글자 주변에 여백을 더해서 잘림을 막는다. 윤곽선이나 그림자를
머티리얼에서 크게 줬을 때 글자 끝이 사각형 경계에서 잘리는데, 그때 켜는 칸이다.
**효과는 머티리얼에서 켜고, 그 효과가 잘리는 건 여기서 막는다** — 한 증상을
두 에셋이 나눠 갖고 있는 예다.

## Text Style은 Font Style이 아니다

클리핑은 맨 위에 `Text Style`을 두고 이렇게 설명한다.

> **Normal**: 텍스트 스타일을 설정합니다. 기본적으로 Normal로 설정되며,
> **Bold(굵게), Italic(기울임) 등의 스타일을 조합**할 수 있습니다.

그런데 Bold와 Italic을 조합하는 칸은 세 줄 아래에 `Font Style`로 또 나온다.
같은 걸 두 번 설명한 게 아니라, **첫 번째는 다른 것**이다.

`Text Style`은 **스타일 시트의 항목**을 고르는 칸이다. 스타일 시트는 TMP의
별도 에셋이고, 거기 정의된 하나의 스타일은 문서 표현으로 이렇다.

> a text style ... can include **opening and closing rich text tags, as well as
> leading and trailing text.**

여는 태그, 닫는 태그, 그리고 **앞뒤에 붙는 글자까지** 한 묶음으로 저장한다.
예를 들어 `H1`이라는 스타일에 글꼴 굵기·크기·색을 넣어두고, 텍스트에서는
이렇게 쓴다.

```
<style="H1">장비 강화</style>
```

또는 인스펙터의 `Text Style` 드롭다운에서 `H1`을 고르면 **그 텍스트 전체에**
적용된다. `Font Style`의 B 버튼과 겹쳐 보이지만 성질이 다르다.

| | Font Style | Text Style |
| --- | --- | --- |
| 어디에 저장되나 | 이 컴포넌트 | 별도 스타일 시트 에셋 |
| 바꾸면 영향 범위 | 이 오브젝트만 | 그 스타일을 쓰는 전부 |
| 할 수 있는 것 | 굵기·기울임·밑줄·대소문자 | 리치 텍스트 태그 묶음 + 앞뒤 글자 |
| 태그로도 되나 | `<b>`, `<i>` 등 각각 | `<style="이름">` 하나로 |

`Text Style`을 쓰는 이유가 여기 있다. 제목 스타일을 쉰 군데에서 쓰다가 색을
바꿔야 할 때, `Font Style`로 해놨다면 쉰 개를 고친다. 스타일 시트로 해놨다면
한 군데를 고친다.

## 세 개의 에셋이 한 패널에 겹쳐 있다

네 가지 오류가 따로 생긴 게 아니다. TMP 인스펙터는 **스크롤 하나에 서로 다른
세 에셋의 설정이 이어져** 있고, 클리핑은 그걸 위에서 아래로 한 줄짜리 목록으로
읽었다. 그러면 어느 칸이 어느 에셋에 쓰이는지가 사라진다.

| 층 | 어디에 저장되나 | 바꾸면 영향받는 범위 | 대표 칸 |
| --- | --- | --- | --- |
| 텍스트 컴포넌트 | 그 GameObject | 이 오브젝트만 | Font Size, Alignment, Wrapping, Override Tags, Extra Settings |
| 머티리얼 | `.mat` 에셋 | 그 머티리얼을 쓰는 모든 텍스트 | Face, Outline, Underlay, Glow |
| 폰트 에셋 | `.asset` 에셋 | 그 폰트를 쓰는 모든 텍스트 | 아틀라스, Sampling Point Size, Padding, Fallback, Kerning 테이블 |

이 표가 실제로 하는 일은 **"내가 지금 뭘 깨뜨리는지"를 알려주는 것**이다.

`Font Size`를 74로 바꾸는 건 이 오브젝트 하나다. `Material Preset`을 다른 걸로
고르는 건 머티리얼을 교체하는 것이고, 머티리얼이 다르면 배치가 갈린다. 그리고
인스펙터 아래쪽 머티리얼 섹션에서 `Outline Width`를 올리는 건 — **그 머티리얼을
공유하는 모든 텍스트의 윤곽선을 동시에 올리는 것이다.** 한 군데만 윤곽선을
주고 싶으면 머티리얼 프리셋을 새로 만들어야 한다.

`Kerning` 칸이 좋은 예다. `Extra Settings`의 체크박스는 컴포넌트 설정이지만,
문서가 괄호로 덧붙인다 — "defined in Font Asset". **켤지 말지는 컴포넌트가
정하고, 무엇을 얼마나 당길지는 폰트 에셋의 Glyph Adjustment Table이 정한다.**
한 기능이 두 층에 걸쳐 있다.

## 어디에 왜 쓰나

### 점수 표시 하나

매 프레임 갱신되는 점수 라벨을 만든다. 인스펙터에서 정할 것부터.

| 칸 | 값 | 이유 |
| --- | --- | --- |
| Font Size | 고정값 | Auto Size는 끈다. 아래에서 다룬다 |
| Wrapping | Disable | 숫자는 줄바꿈할 이유가 없다 |
| Overflow | Overflow | 자릿수가 늘어도 자르지 않는다 |
| Alignment | Right / Middle | 자릿수가 늘어도 왼쪽으로 자란다 |
| Raycast Target | 끔 | 점수판이 클릭을 먹을 이유가 없다 |
| Rich Text | 끔 | 태그를 쓰지 않으면 파싱도 안 한다 |

코드는 이렇게 된다.

```csharp
using TMPro;
using UnityEngine;

public class ScoreLabel : MonoBehaviour
{
    private const string SCORE_FORMAT = "{0:0}";

    [Header("References")]
    [SerializeField, Tooltip("점수를 표시할 TextMeshProUGUI")]
    private TextMeshProUGUI _label;

    private int _lastShownScore = -1;

    private void Awake()
    {
        if (_label == null)
        {
            Debug.LogError($"{name}의 _label이 비어 있다. 인스펙터를 확인할 것.");
        }
    }

    public void Show(int score)
    {
        // 값이 안 바뀌었으면 건드리지 않는다. text에 대입하면 메시가 다시 만들어진다.
        if (score == _lastShownScore)
        {
            return;
        }

        _lastShownScore = score;
        _label.SetText(SCORE_FORMAT, score);
    }
}
```

`SetText`에 서식 문자열을 넘기는 오버로드를 쓴 이유는 `string` 하나를 만들어
대입하는 경로를 피하려는 것이다. 문서가 제공하는 오버로드는 이렇다.

> **SetText(string, float)** — "Formatted string containing a pattern and a value
> representing the text to be rendered."

`float` 인자를 일곱 개까지 받는 오버로드가 있고, `StringBuilder`와 `char[]`를
받는 것도 있다. 다만 **이 오버로드들이 할당을 하지 않는다는 문장은 문서에서
찾지 못했다.** 프로파일러로 직접 확인하는 편이 확실하다.

`_lastShownScore`로 같은 값을 걸러내는 쪽이 확실한 절약이다. `text`에 대입하면
값이 같든 다르든 메시를 다시 만든다.

### 레이아웃 그룹 안에 넣을 때

[레이아웃 그룹을 다룬 글](/posts/ugui-layout-group/)에서 `Control Child Size`를
켜면 레이아웃 그룹이 자식의 **레이아웃 요소 속성**을 읽는다는 걸 봤다. 맨
RectTransform은 거기서 0을 돌려주니 자식이 사라진다는 이야기였다.

TMP 텍스트는 0을 돌려주지 않는다. `TextMeshProUGUI`의 클래스 선언에
`ILayoutElement`가 들어 있다.

```csharp
public class TextMeshProUGUI : TMP_Text, ICanvasElement, IClippable,
    IMaskable, IMaterialModifier, ILayoutElement
```

그래서 물어보면 글자에 맞는 크기를 대답한다.

> **preferredWidth:** Computed preferred width of the text object.
>
> **preferredHeight:** Computed preferred height of the text object.

추상 기반 클래스인 `TMP_Text`에는 `ILayoutElement`가 없고, 구현 클래스인
`TextMeshProUGUI`와 `TextMeshPro`에 각각 붙어 있다. 코드에서 `TMP_Text`로
받아놨다면 레이아웃 속성에 손이 닿긴 하지만, 레이아웃 시스템이 보는 건
컴포넌트에 붙은 실제 타입이다.

여기서 `Auto Size`를 켜면 **방향이 서로 반대인 두 계산이 맞물린다.** Auto Size는
사각형에 맞춰 글자 크기를 정하고, `Control Child Size`나 `Content Size Fitter`는
글자 크기에 맞춰 사각형을 정한다. 문서가 Auto Size의 동작을 이렇게 적는다.

> When this option is enabled, TextMesh Pro **lays out the text multiple times to
> find a good fit.** This is a resource intensive process, so **avoid auto-sizing
> dynamic text that changes frequently.**

사각형이 고정된 칸 안에 길이가 들쭉날쭉한 문구를 넣어야 한다면 Auto Size가
맞다. 반대로 **글자에 맞춰 칸이 늘어나야 한다면 Auto Size를 끄고** 고정
`Font Size` + `Content Size Fitter`로 간다. 둘을 같이 켜면 한쪽이 상대의 입력을
매 프레임 바꾸는 구조가 된다.

### 쓰지 말아야 할 자리

**매 프레임 바뀌는 텍스트에 Auto Size.** 문서가 직접 피하라고 적어둔 조합이다.
남은 시간이나 FPS 표시처럼 매 프레임 글자가 바뀌는데 Auto Size가 켜져 있으면,
프레임마다 레이아웃을 여러 번 돈다.

**한 군데만 바꾸려고 머티리얼을 건드리기.** 머티리얼 섹션의 값은 그 머티리얼을
쓰는 전부에 간다. 제목 하나에만 윤곽선을 주려고 `Outline Width`를 올리면 같은
폰트를 쓰는 모든 텍스트에 윤곽선이 생긴다. `Material Preset`을 새로 만들어
그 오브젝트에만 지정한다.

**모든 태그를 막으려고 Override Tags를 켜기.** 색 태그만 막힌다. `<b>`나
`<size>`까지 글자로 보여야 한다면 `Extra Settings`의 `Rich Text`를 끈다.

**Horizontal / Vertical Mapping을 기본 머티리얼에서 만지기.** 문서가 조건을
붙여놨다.

> **Horizontal Mapping:** Specify how textures map to text horizontally **when you
> use a shader that supports textures.**

Face에 텍스처를 넣지 않은 기본 Distance Field 머티리얼에서는 이 두 칸을 어떻게
바꿔도 화면이 안 변한다. 클리핑은 "문자 단위로 텍스처가 매핑됩니다"까지만
적었는데, **텍스처가 없으면 매핑할 게 없다.**

## 정리

클리핑의 목록 자체는 쓸 만하다. 칸 이름과 값이 대체로 맞고, `Font Asset`이 SDF를
들고 있다는 것처럼 TMP의 핵심도 짚었다.

틀린 네 칸은 전부 **옆 칸이 하는 일을 가져다 붙인 것**이다. `Override Tags`는
색 태그만 무시하고, 모든 태그를 막는 칸은 `Extra Settings`의 `Rich Text`다.
줄바꿈과 오버플로는 별개 칸이고, `Overflow`는 줄바꿈 모드의 값이 아니다.
`Extra Settings`에는 효과가 없고 동작 설정만 있다 — 윤곽선과 그림자는
머티리얼의 `Outline`과 `Underlay`다. `Text Style`은 `Font Style`이 아니라
스타일 시트 항목이다.

네 번 다 같은 데서 미끄러진다. **한 패널에 세 에셋이 겹쳐 있는데 한 줄짜리
목록으로 읽었기 때문이다.** 칸 이름을 외우는 것보다, 그 칸이 컴포넌트에
쓰이는지 머티리얼에 쓰이는지 폰트 에셋에 쓰이는지를 아는 쪽이 오래 쓸모 있다.
그게 **내가 지금 몇 개의 텍스트를 바꾸고 있는지**를 알려준다.

---

### 참고

- [UI Text GameObjects — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/TMPObjectUIText.html)
- [Signed Distance Field 폰트 에셋 — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/FontAssetsSDF.html)
- [Style Sheets — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/StyleSheets.html)
- [Color Gradients — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/ColorGradients.html)
- [Distance Field 셰이더 — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@3.0/manual/TextMeshPro/ShadersDistanceField.html)
- [TextMeshProUGUI — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/api/TMPro.TextMeshProUGUI.html)
- [TMP_Text.SetText — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@3.0/api/TMPro.TMP_Text.SetText.html)
- [TextWrappingModes — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/api/TMPro.TextWrappingModes.html)

이 글의 출발점이 된 자료는 [곰빛 — Unity의 TextMeshPro 컴포넌트의 Inspector 설정](https://j2su0218.tistory.com/1511)
(2025-01-16)이다. 거기 정리된 인스펙터 항목을 하나씩 따라가면서, 각 칸의 설명을
현행 TextMesh Pro 매뉴얼과 API 레퍼런스에 대조했다.
