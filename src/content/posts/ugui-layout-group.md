---
pubDatetime: 2026-09-30T21:30:00+09:00
title: "Control Child Size를 켜면 크기를 묻는 상대가 바뀐다"
lang: ko
translationKey: ugui-layout-group
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - 레이아웃
description: "레이아웃 그룹 인스펙터 설명은 정확하다. 그런데 Control Child Size를 켜면 자식이 0으로 사라지는 이유가 빠져 있다. 이 체크박스는 크기를 Rect Transform이 아니라 레이아웃 요소 속성에서 읽게 만들고, 맨 RectTransform의 그 값은 0이다."
---

UI를 손으로 배치하다가, **화면 크기에 대응하려고 좌표를 다시 잡는 게
불편해서** 다른 방법이 있는지 찾던 중에 스크랩한 글이다. 유니티의 레이아웃
그룹 세 종류를 인스펙터 속성 단위로 훑은 2023년 글로, 수평·수직 레이아웃
그룹의 속성들을 하나씩 켜고 끈 스크린샷까지 붙어 있다.

**인스펙터 설명은 정확하다.** 세 종류가 무엇인지, 오브젝트당 하나만 붙는다는
것, 자식의 좌표가 잠긴다는 것 — 전부 맞다. 속성별 스크린샷도 실제 동작과
일치한다.

걸리는 건 한 군데다. 글이 `Control Child Size`를 켜면 자식이 사라진다고
적어놓고, **왜 사라지는지는 미뤄둔다.**

> *(Control Child Size를 활용하는 방법에는 이 외에도 다른 컴포넌트와 연계하여
> 사용하는 방법이 있다고 하며, 해당 내용은 숙지하는 대로 추가하도록
> 하겠습니다.)*

미뤄둔 그 자리가 이 컴포넌트의 핵심이다. **저 체크박스는 자식의 크기를
제어하는 스위치가 아니라, 크기를 누구에게 물을지 바꾸는 스위치다.**

## 목차

## 인스펙터 설명은 정확하다

먼저 맞는 쪽부터. 클리핑은 레이아웃 그룹을 이렇게 정의한다.

> 레이아웃 그룹은 **하위 UI 오브젝트들의 배치를 일괄적으로 관리하기 위한
> 컴포넌트**

맞다. 그리고 하나만 붙는다는 것도 맞다.

> 또한 **레이아웃 그룹 컴포넌트는 오브젝트당 하나만 포함** 할 수 있습니다.

이건 우연이 아니라 명시된 제약이다. 세 종류는 전부 `LayoutGroup`이라는 추상
클래스를 상속하는데, 그 클래스에 `DisallowMultipleComponent`가 붙어 있다.

```csharp
[DisallowMultipleComponent]
[ExecuteAlways]
[RequireComponent(typeof(RectTransform))]
public abstract class LayoutGroup : UIBehaviour, ILayoutElement, ILayoutGroup
{
```

`DisallowMultipleComponent`는 **그 속성이 붙은 클래스를 기준으로** 중복을
막는다. 그래서 `HorizontalLayoutGroup`과 `GridLayoutGroup`처럼 서로 다른
클래스여도, 둘 다 `LayoutGroup`을 상속하므로 한 오브젝트에 같이 붙지 않는다.
수평과 그리드를 같이 쓰고 싶으면 **오브젝트를 하나 더 만들어 중첩해야 한다.**

세 종류를 정리하면 이렇다.

| 컴포넌트 | 자식 배치 | 자식 크기 | 자식 개수가 늘면 |
| --- | --- | --- | --- |
| Horizontal Layout Group | 한 줄, 가로로 | 각자 다를 수 있음 | 줄이 길어진다 |
| Vertical Layout Group | 한 줄, 세로로 | 각자 다를 수 있음 | 줄이 길어진다 |
| Grid Layout Group | 바둑판 | `Cell Size`로 전부 동일 | 줄바꿈이 생긴다 |

작은 것 하나. 클리핑의 도입부에 영문 이름이 서로 뒤바뀌어 있다 — "수평
레이아웃 그룹(Vertical Layout Group), 수직 레이아웃 그룹(Horizontal Layout
Group)". 본문의 설명과 스크린샷은 올바른 쪽이라 읽는 데 지장은 없지만, 처음
보는 사람이 그 한 줄만 보고 컴포넌트를 고르면 반대로 집는다.

## 자식의 좌표가 잠기는 건 Driven 속성 때문이다

클리핑은 이렇게 적는다.

> 레이아웃 그룹 컴포넌트가 추가 시, 해당 오브젝트의 하위 오브젝트들은 Rect
> Transform에서 **앵커 및 x, y 좌표를 수정할 수 없습니다.**

맞다. 그런데 "레이아웃 그룹이 관리하니까"로 끝내면, **왜 Width는 여전히
수정되는지**를 설명할 수 없다. `Control Child Size`를 끈 상태에서 자식의 Width
필드는 멀쩡히 열려 있다. 같은 컴포넌트가 관리하는데 어떤 필드는 잠기고 어떤
필드는 안 잠긴다.

이유는 `DrivenRectTransformTracker`다. 레이아웃 그룹이 자식을 배치할 때, **자기가
실제로 덮어쓰는 필드만 골라서** 트래커에 등록한다. 등록된 필드는 인스펙터에서
회색으로 잠긴다. 자식을 배치하는 코드는 두 갈래인데, 크기까지 정하는 쪽은
이렇다.

```csharp
protected void SetChildAlongAxisWithScale(RectTransform rect, int axis, float pos, float size, float scaleFactor)
{
    if (rect == null)
        return;

    m_Tracker.Add(this, rect,
        DrivenTransformProperties.Anchors |
        (axis == 0 ?
            (DrivenTransformProperties.AnchoredPositionX | DrivenTransformProperties.SizeDeltaX) :
            (DrivenTransformProperties.AnchoredPositionY | DrivenTransformProperties.SizeDeltaY)
        )
    );
    // ...
}
```

크기를 안 정하는 쪽은 `SizeDelta`가 빠진다.

```csharp
protected void SetChildAlongAxisWithScale(RectTransform rect, int axis, float pos, float scaleFactor)
{
    if (rect == null)
        return;

    m_Tracker.Add(this, rect,
        DrivenTransformProperties.Anchors |
        (axis == 0 ? DrivenTransformProperties.AnchoredPositionX : DrivenTransformProperties.AnchoredPositionY));
    // ...
}
```

두 갈래 모두 `Anchors`와 `AnchoredPosition`은 등록한다. 그래서 **앵커와 좌표는
항상 잠긴다.** `SizeDelta`는 `Control Child Size`를 켰을 때만 등록되고, 그래서
**Width/Height는 그 체크박스를 따라 잠기고 풀린다.**

| Control Child Size | 잠기는 필드 | 열려 있는 필드 |
| --- | --- | --- |
| 끔 | Anchors, Pos X, Pos Y | Width, Height |
| Width만 켬 | Anchors, Pos X, Pos Y, Width | Height |
| 둘 다 켬 | Anchors, Pos X, Pos Y, Width, Height | (없음) |

잠긴 필드에 값을 써도 다음 레이아웃 패스에서 되돌아간다. **회색 필드는
"건드리지 마세요"가 아니라 "여기 쓴 값은 곧 지워집니다"라는 뜻이다.**

## Control Child Size를 켜면 크기를 묻는 상대가 바뀐다

여기가 클리핑이 미뤄둔 자리다. 증상은 정확히 적혀 있다.

> 다른 설정 없이 Control Child Size의 width나 Height를 체크할 경우 **해당 값이
> 0으로 바뀌어 사라져버리며**, 후술할 Child Force Expand와 함께 쓸 경우 남는
> 공간을 모두 채우는 식으로 설정됩니다.

관찰은 맞다. 그런데 "0이 된다"와 "Child Force Expand를 같이 켜면 채워진다"는
서로 다른 두 사실처럼 보이고, 실제로는 **같은 한 문장에서 나온다.**

공식 문서의 `childControlWidth` 설명이 그 문장이다.

> Returns true if the Layout Group controls the widths of its children.
> **Returns false if children control their own widths.**

읽는 방식이 중요하다. 이건 "레이아웃 그룹이 크기를 정한다 / 안 정한다"가
아니라 **"크기의 출처가 레이아웃 그룹이다 / 자식이다"**다. 소스를 보면 한눈에
들어온다.

```csharp
private void GetChildSizes(RectTransform child, int axis, bool controlSize, bool childForceExpand,
    out float min, out float max, out float preferred, out float flexible)
{
    if (!controlSize)
    {
        min = child.sizeDelta[axis];
        max = min;
        preferred = min;
        flexible = 0;
    }
    else
    {
        min = LayoutUtility.GetMinSize(child, axis);
        max = LayoutUtility.GetMaxSize(child, axis);
        preferred = LayoutUtility.GetPreferredSize(child, axis);
        flexible = LayoutUtility.GetFlexibleSize(child, axis);
    }

    if (childForceExpand)
        flexible = Mathf.Max(flexible, 1);
}
```

`controlSize`가 꺼져 있으면 최소·선호 크기가 전부 `child.sizeDelta`, 즉 **자식이
인스펙터에 적어둔 그 값**이다. 켜져 있으면 `LayoutUtility`를 통해 **자식에
붙어 있는 레이아웃 요소 컴포넌트들에게 물어본다.**

그래서 자식이 0이 되는 이유는 이 한 문장이다. 오토 레이아웃 문서가 직접
말한다.

> Any Game Object with a Rect Transform on it can function as a layout element.
> **They will by default have minimum, preferred, and flexible sizes of 0.**

빈 오브젝트에 Rect Transform만 있으면, 물어봤을 때 돌아오는 답이 전부 0이다.
그다음은 할당 규칙이 그대로 굴러간다.

> **First minimum sizes are allocated.** If there is sufficient available space,
> preferred sizes are allocated. If there is additional available space,
> flexible size is allocated.

최소 0, 선호 0, 여유분 배분 계수 0. 결과도 0이다. **버그가 아니라 정직한
대답이다.** 자식이 크기를 말할 줄 모르는데 크기를 물어본 것뿐이다.

| | Control Child Size 끔 | Control Child Size 켬 |
| --- | --- | --- |
| 크기를 묻는 상대 | 자식의 Rect Transform | 자식의 레이아웃 요소 속성 |
| 맨 RectTransform | 인스펙터의 Width 값 | 0 |
| Image(스프라이트 있음) | 인스펙터의 Width 값 | 스프라이트 크기 |
| Text | 인스펙터의 Width 값 | 글자 길이에 맞는 크기 |
| Layout Element | 인스펙터의 Width 값 | 거기 적은 Preferred Width |

`Image`와 `Text`가 답을 가지고 있는 건 문서에 적혀 있다.

> **The Image and Text components are two examples of components that provide
> layout element properties.** They change the preferred width and height to
> match the sprite or text content.

단, `Image`의 대답은 스프라이트에서 나온다. 비어 있으면 0이다.

```csharp
public virtual float preferredWidth
{
    get
    {
        if (activeSprite == null)
            return 0;
        if (type == Type.Sliced || type == Type.Tiled)
            return Sprites.DataUtility.GetMinSize(activeSprite).x / pixelsPerUnit;
        return activeSprite.rect.size.x / pixelsPerUnit;
    }
}
```

`GameObject > UI > Image`로 만든 오브젝트는 Source Image가 비어 있다. **Image를
붙였는데도 자식이 사라진다면 스프라이트가 안 들어간 것이다.**

그래서 클리핑이 "다른 컴포넌트와 연계하여 사용하는 방법"이라고 미뤄둔 그
컴포넌트는 **`Layout Element`**다. 자식에게 이걸 붙이고 값을 채우면, 물어봤을
때 0이 아닌 답이 돌아온다.

> **Preferred Width:** Specifies the preferred width of this layout element
> before allocating additional available width.

한 오브젝트에 답할 수 있는 컴포넌트가 둘 이상이면 — 예를 들어 `Image`와
`Layout Element`가 같이 붙어 있으면 — 우선순위로 정한다.

> **Layout Priority:** The layout priority for this component. If a GameObject
> has more than one component with layout properties (for example, an Image
> component and a LayoutElement component), **the layout system uses the
> property values from the component with the highest Layout Priority.**

`Layout Element`는 `m_LayoutPriority = 1`로 선언되어 있고, `Image`의
`layoutPriority`는 `{ get { return 0; } }`다. 그래서 둘을 같이
붙이면 `Layout Element`가 이긴다. 뒤집고 싶으면 우선순위 숫자를 내리면 된다.

## Child Force Expand는 n등분이 아니라 flexible = 1이다

클리핑은 `Child Force Expand`를 이렇게 설명한다.

> **Child Force Expand** 체크 여부에 따라 공간이 남을 경우 n등분하여 배치할지
> 결정할 수 있습니다.

그리고 한 번 더.

> 하위 오브젝트가 몇개 없어 공간이 남을 경우 **Spacing 값에 상관 없이 공간을
> n등분하여 배치합니다.**

관찰한 화면은 그렇게 보인다. 그런데 이건 **기본값일 때만 n등분**이다. 실제로
이 체크박스가 하는 일은 앞에서 본 `GetChildSizes`의 마지막 두 줄이다.

```csharp
if (childForceExpand)
    flexible = Mathf.Max(flexible, 1);
```

여유분을 나누는 건 이 `flexible` 값이다. 문서가 그 의미를 정한다.

> **Flexible Width:** Defines the relative amount of additional available width
> this layout element takes up compared to its siblings.

상대적인 비율이지 균등 분할이 아니다. 배치 코드가 그대로 보여준다.

```csharp
float surplusSpace = size - GetTotalPreferredSize(axis);

if (surplusSpace > 0)
{
    if (GetTotalFlexibleSize(axis) == 0)
        pos = GetStartOffset(axis, GetTotalPreferredSize(axis) - (axis == 0 ? padding.horizontal : padding.vertical));
    else if (GetTotalFlexibleSize(axis) > 0)
        itemFlexibleMultiplier = surplusSpace / GetTotalFlexibleSize(axis);
}
// ...
float childSize = Mathf.Lerp(min, preferred, minMaxLerp);
childSize += flexible * itemFlexibleMultiplier;
```

남은 공간을 `flexible`의 합으로 나눈 계수를 구하고, 각 자식에게 **자기
`flexible`만큼 곱해서** 준다. 자식 셋이 전부 기본값 0이면 `Child Force
Expand`가 셋 다 1로 올리므로 1:1:1, 즉 n등분이다. 그런데 가운데 자식에게만
`Layout Element`를 붙이고 Flexible Width를 3으로 주면 **1:3:1**이 된다.

여기서 `Mathf.Max`가 중요하다. `Child Force Expand`는 **올리기만 한다.**
`Layout Element`로 Flexible Width를 0.5로 낮춰놨어도, 이 체크박스가 켜져
있으면 1로 올라간다. 특정 자식만 안 늘어나게 하고 싶다면 체크박스를 끄고
자식별로 `flexible`을 주는 쪽이 맞다.

"Spacing 값에 상관 없이"라는 표현도 한 겹 들어가 볼 만하다. `Spacing`은
무시되지 않는다. 루프의 마지막 줄이 이렇다.

```csharp
pos += childSize * scaleFactor + spacing;
```

여유분은 **자식이 차지하는 칸(`childSize`)에 더해지고**, `spacing`은 그 위에
그대로 더해진다. `Control Child Size`가 꺼져 있으면 자식 자신은 안 커지고 칸만
커지므로, **간격이 벌어진 것처럼 보인다.** 실제로는 간격이 아니라 칸이 커진
것이고, `Spacing`은 여전히 그 칸들 사이에 들어가 있다.

| Control Child Size | Child Force Expand | 결과 |
| --- | --- | --- |
| 끔 | 끔 | 자식은 제 크기, 남는 공간은 `Child Alignment` 쪽으로 몰림 |
| 끔 | 켬 | 자식은 제 크기, 칸만 커져서 간격이 벌어짐 |
| 켬 | 끔 | 자식은 선호 크기까지만, 남는 공간은 그대로 남음 |
| 켬 | 켬 | 자식이 늘어나서 남는 공간을 `flexible` 비율로 채움 |

## Grid의 Flexible은 두 군데에서 다르게 계산된다

그리드의 `Constraint`를 클리핑은 이렇게 설명한다.

> 디폴트 값인 Flexible의 경우 Start Corner와 Start Axis를 기준으로 배치하다가
> **다음 배치할 오브젝트가 레이아웃 그룹의 영역을 벗어날 경우, 자동으로 열이나
> 행을 바꾸는 방식**입니다.

배치에 관한 한 정확하다. 실제 열 개수를 정하는 코드가 그대로다.

```csharp
if (cellSize.x + spacing.x <= 0)
    cellCountX = int.MaxValue;
else
    cellCountX = Mathf.Max(1, Mathf.FloorToInt((width - padding.horizontal +
                 spacing.x + 0.001f) / (cellSize.x + spacing.x)));
```

자기 폭에서 패딩을 빼고, 셀 하나와 간격 하나를 묶은 값으로 나눈다. 폭이
좁아지면 열이 줄고 줄바꿈이 생긴다.

빠진 건 **그리드가 "나는 이만큼이 필요하다"고 대답할 때의 답**이다. 이 질문은
`Content Size Fitter`를 붙였거나, 그리드를 다른 레이아웃 그룹의 자식으로 넣고
`Control Child Size`를 켰을 때 날아온다. 그때 실행되는 코드는 위와 완전히
다르다.

```csharp
else
{
    totalMax = LayoutUtility.DefaultMaxSize;
    totalMin = padding.horizontal + cellWidthWithSpacing - spacing.x;

    float squareRootOfChildren = Mathf.Sqrt(rectChildren.Count);
    int preferredColumnCount = Mathf.CeilToInt(squareRootOfChildren);

    totalPreferred = padding.horizontal + cellWidthWithSpacing *
                    preferredColumnCount - spacing.x;
}
```

`Flexible`일 때 그리드의 **최소 폭은 한 열**, **선호 폭은 자식 개수의
제곱근을 올림한 열 수**다. 자식이 10개면 선호 폭은 4열, 자식이 20개면 5열.
정사각형에 가깝게 만들려는 값이다.

그래서 이런 일이 생긴다. `Flexible` 그리드에 `Content Size Fitter`의
Horizontal Fit을 `Preferred Size`로 걸면, **내가 몇 열로 만들고 싶었는지와
무관하게 대략 정사각형이 된다.** 6열로 보여주고 싶었다면 `Fixed Column Count`를
6으로 주는 쪽이 맞다. 그쪽은 최소·선호가 둘 다 정확히 6열 폭이다.

```csharp
if (m_Constraint == Constraint.FixedColumnCount)
{
    totalMin = totalMax = totalPreferred = padding.horizontal +
              cellWidthWithSpacing * m_ConstraintCount - spacing.x;
}
```

| Constraint | 실제 열 개수를 정하는 것 | 스스로 요청하는 폭 |
| --- | --- | --- |
| Flexible | 자기 Rect의 폭 | 최소 1열, 선호 `ceil(√개수)`열 |
| Fixed Column Count | `Constraint Count` | 정확히 `Constraint Count`열 |
| Fixed Row Count | 개수 ÷ `Constraint Count` (올림) | 그 계산된 열 수 |

클리핑이 "Fixed 설정에서는 하위 오브젝트들이 레이아웃 영역을 벗어날 수
있습니다"라고 경고한 것도 여기서 설명된다. Fixed는 열 수를 고정하므로 폭이
모자라도 줄바꿈을 안 한다. 넘치는 게 싫으면 **폭을 늘리거나**, `Content Size
Fitter`를 붙여서 **그리드가 요청한 폭을 실제로 주면 된다.**

## 어디에 왜 쓰나

### 세로로 쌓이는 랭킹 목록

[InputField로 이름을 입력받는 글](/posts/ugui-inputfield-name-entry/)에서 이름
입력 창을 만들 때는 배경 이미지와 버튼을 손으로 배치했다. 항목이 두세 개면
그래도 된다. 그 이름들로 랭킹 판을 만들면 항목 개수가 런타임에 정해지므로,
손으로 잡을 좌표가 없다.

계층은 이렇게 잡는다.

```
RankingPanel            (Image)
└─ Content              (Vertical Layout Group, Content Size Fitter)
   ├─ RankingRow(Clone) (Horizontal Layout Group)
   ├─ RankingRow(Clone)
   └─ ...
```

`Content`의 설정:

| 속성 | 값 | 이유 |
| --- | --- | --- |
| Padding | 16 / 16 / 12 / 12 | 패널 테두리와의 여백 |
| Spacing | 8 | 행 사이 간격 |
| Child Alignment | Upper Center | 항목이 적어도 위에서부터 채운다 |
| Control Child Width | 켬 | 행의 가로를 패널 폭에 맞춘다 |
| Control Child Height | 켬 | 행의 세로를 행이 스스로 요청하게 한다 |
| Child Force Expand Width | 켬 | 남는 가로를 행이 채운다 |
| Child Force Expand Height | **끔** | 행이 세로로 늘어나면 안 된다 |

`Child Force Expand Height`를 끄는 게 핵심이다. 켜두면 항목이 세 개일 때 행
하나가 패널 높이의 3분의 1까지 늘어난다. 끄면 각 행이 요청한 높이만 쓰고,
남는 공간은 `Child Alignment`대로 아래에 남는다.

행 프리팹(`RankingRow`)에는 `Layout Element`를 붙이고 Preferred Height를 48로
준다. 이게 없으면 `Control Child Height`가 켜진 순간 행 높이가 0이 된다 —
앞에서 본 그 이유 그대로다.

행 안쪽은 수평 레이아웃 그룹이다.

| 자식 | Layout Element | 이유 |
| --- | --- | --- |
| RankText | Preferred Width 48, Flexible Width 0 | 등수 칸은 고정 |
| NameText | Flexible Width 1 | 남는 가로를 이름이 먹는다 |
| ScoreText | Preferred Width 96, Flexible Width 0 | 점수 칸은 고정 |

`Child Force Expand Width`는 **꺼야 한다.** 켜면 `Mathf.Max(flexible, 1)`이
등수와 점수의 `flexible`도 1로 올려버려서, 세 칸이 1:1:1로 균등 분할된다.

채우는 코드는 이렇다.

```csharp
using System;
using UnityEngine;

[Serializable]
public struct RankingEntry
{
    public string Name;
    public int Score;
}
```

```csharp
using UnityEngine;
using UnityEngine.UI;

public class RankingBoard : MonoBehaviour
{
    private const int MAX_ROW_COUNT = 50;

    [Header("References")]
    [SerializeField, Tooltip("Vertical Layout Group이 붙은 오브젝트")]
    private RectTransform _content;

    [SerializeField, Tooltip("행 프리팹. Layout Element로 Preferred Height를 줄 것")]
    private RankingRow _rowPrefab;

    public void Rebuild(RankingEntry[] entries)
    {
        if (_content == null || _rowPrefab == null)
        {
            Debug.LogError("RankingBoard의 참조가 비어 있다. 인스펙터를 확인할 것.");
            return;
        }

        for (int i = _content.childCount - 1; i >= 0; i--)
        {
            Destroy(_content.GetChild(i).gameObject);
        }

        int count = Mathf.Min(entries.Length, MAX_ROW_COUNT);
        for (int i = 0; i < count; i++)
        {
            // 좌표를 안 준다. 레이아웃 그룹이 Anchors와 AnchoredPosition을 덮어쓴다.
            RankingRow row = Instantiate(_rowPrefab, _content);
            row.Bind(i + 1, entries[i].Name, entries[i].Score);
        }
    }
}
```

```csharp
using TMPro;
using UnityEngine;

public class RankingRow : MonoBehaviour
{
    [Header("Labels")]
    [SerializeField] private TMP_Text _rankLabel;
    [SerializeField] private TMP_Text _nameLabel;
    [SerializeField] private TMP_Text _scoreLabel;

    public void Bind(int rank, string playerName, int score)
    {
        _rankLabel.text = rank.ToString();
        _nameLabel.text = playerName;
        _scoreLabel.text = score.ToString("N0");
    }
}
```

`Instantiate` 뒤에 좌표를 주는 줄이 없다는 게 요점이다. 줘봐야 다음 레이아웃
패스에서 지워진다.

### 런타임에 채우고 크기를 바로 읽을 때

위 코드를 부르고 **같은 프레임에** `_content.rect.height`를 읽으면 이전 값이
나온다. 레이아웃은 즉시 계산되지 않기 때문이다.

> **MarkLayoutForRebuild:** Mark the given RectTransform as needing it's layout
> to be recalculated during the **next layout pass**.

스크롤 위치를 맨 아래로 내린다든가, 방금 만든 목록의 전체 높이가 당장
필요하다면 강제로 한 번 돌릴 수 있다.

```csharp
using UnityEngine;
using UnityEngine.UI;

public class RankingBoardScroller : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private RankingBoard _board;
    [SerializeField] private RectTransform _content;
    [SerializeField] private ScrollRect _scrollRect;

    public void ShowAndScrollToBottom(RankingEntry[] entries)
    {
        _board.Rebuild(entries);

        // 이 줄이 없으면 아래 height는 Rebuild 이전 값이다.
        LayoutRebuilder.ForceRebuildLayoutImmediate(_content);

        float height = _content.rect.height;
        Debug.Log($"목록 전체 높이: {height}");

        _scrollRect.verticalNormalizedPosition = 0f;
    }
}
```

문서는 이 함수를 아껴 쓰라고 한다.

> **ForceRebuildLayoutImmediate:** Forces an immediate rebuild of the layout
> element and child layout elements affected by the calculations.

즉시 계산이 비싼 이유는 오토 레이아웃이 네 번을 도는 구조이기 때문이다.

> 1. The minimum, preferred, and flexible **widths** of layout elements are
>    calculated... This is performed in **bottom-up** order
> 2. The effective widths of layout elements are calculated and set... This is
>    performed in **top-down** order
> 3. The minimum, preferred, and flexible **heights** of layout elements are
>    calculated... bottom-up
> 4. The effective heights of layout elements are calculated and set...
>    top-down

그리고 순서가 고정되어 있다.

> the auto layout system evaluates **widths first and then evaluates heights
> afterwards.**

이 순서가 `Content Size Fitter`와 레이아웃 그룹을 겹칠 때 결과가 이상해지는
이유이기도 하다. 세로 크기를 결정하는 단계는 가로가 이미 정해진 뒤에 돌기
때문에, **가로가 세로에 의존하는 배치**(예: 글이 길어지면 줄바꿈이 늘어 높이가
커지는 구조)는 한 번에 안 맞고 한 프레임 밀린다.

### 쓰지 말아야 할 자리

**좌표가 고정된 HUD.** 체력바가 왼쪽 위, 미니맵이 오른쪽 위처럼 자리가 고정된
UI는 앵커로 잡는 게 맞다. 레이아웃 그룹을 붙이면 `Anchors`와
`AnchoredPosition`이 잠기므로, 오히려 자리를 지정할 방법이 사라진다.

**매 프레임 값이 바뀌는 텍스트.** 점수나 남은 시간처럼 매 프레임 갱신되는
텍스트를 `Control Child Size`가 켜진 레이아웃 그룹 안에 넣으면, 글자 수가 바뀔
때마다 레이아웃 재계산이 돈다. 폭을 `Layout Element`로 고정하거나, 레이아웃
그룹 밖으로 빼고 앵커로 잡는 쪽이 싸다.

**깊게 중첩된 레이아웃 그룹.** 레이아웃 그룹 안에 레이아웃 그룹, 그 안에 또
`Content Size Fitter`를 넣으면 위의 네 단계가 깊이만큼 곱해진다. 두세 겹까지는
쓸 만하고, 그 이상은 한 겹을 `Layout Element`로 대체할 수 있는지 먼저 본다.

**셀 크기가 제각각인 그리드.** `Grid Layout Group`은 `Cell Size`로 모든 자식을
같은 크기로 만든다. 항목마다 크기가 달라야 하면 그리드가 아니라 수평 레이아웃
그룹을 세로로 쌓거나, 전용 배치 코드를 쓴다.

## 정리

`Control Child Size`를 켜면 자식이 0이 되는 건 예상 밖의 동작이 아니다.
**크기를 물어볼 상대를 바꿨고, 새 상대가 0이라고 대답한 것이다.** `GetChildSizes`
한 함수가 그 전부다 — 꺼져 있으면 `child.sizeDelta`, 켜져 있으면
`LayoutUtility`.

클리핑이 미뤄둔 "다른 컴포넌트"는 `Layout Element`다. 자식에게 붙이고 Preferred
Width/Height를 채우면, 물어봤을 때 0이 아닌 답이 나온다. `Image`나 `Text`가
이미 붙어 있다면 그쪽이 스프라이트 크기나 글자 크기로 대답하고, 둘 다 있으면
Layout Priority가 높은 쪽이 이긴다.

나머지 속성들도 같은 자리에서 설명된다. `Child Force Expand`는 남는 공간을
n등분하는 게 아니라 `flexible`의 하한을 1로 올리고, 배분은 `flexible` 비율로
간다. 그리드의 `Flexible`은 배치할 때는 자기 폭으로 열을 정하지만, 크기를
요청할 때는 `ceil(√개수)`열을 선호 폭으로 내놓는다.

---

### 참고

- [Auto Layout — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/UIAutoLayout.html)
- [Horizontal Layout Group — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-HorizontalLayoutGroup.html)
- [Grid Layout Group — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-GridLayoutGroup.html)
- [Layout Element — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-LayoutElement.html)
- [HorizontalOrVerticalLayoutGroup — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.HorizontalOrVerticalLayoutGroup.html)
- [LayoutRebuilder — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)
- [uGUI 소스 — Unity-Technologies/uGUI](https://github.com/Unity-Technologies/uGUI)

이 글의 출발점이 된 자료는 [sam0308 — \[Unity\]\[UI\] 레이아웃 그룹(Layout Group)](https://sam0308.tistory.com/41)
(2023-03-31)이다. 인스펙터 속성별 설명을 그대로 따라가면서, 클리핑이 미뤄둔
`Control Child Size`의 동작을 현행 uGUI 매뉴얼과 패키지 소스에 대조했다.
