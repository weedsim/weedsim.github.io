---
pubDatetime: 2026-10-09T18:30:00+09:00
title: "Content가 늘어나는 방향을 정하는 건 Anchor가 아니라 Pivot이다"
lang: ko
translationKey: ugui-scroll-view-content
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - 레이아웃
  - 스크롤
description: "Scroll View에 Layout 컴포넌트로 항목을 넣는 강좌다. 절차대로 하면 만들어진다. 그런데 Content에 Anchor를 설정하라고 적힌 축은 Content Size Fitter가 가져가는 축이고, 방향을 정하는 Pivot은 한 번도 언급되지 않는다."
---

**인벤토리를 Scroll View로 만들다가** 방법을 찾던 중 스크랩한 강좌다.
2021.3 LTS 기준 연재물의 한 편이고, 스크롤바를 치우고
`Horizontal Layout Group`과 `Content Size Fitter`를 `Content`에 붙여
가로/세로 스크롤을 만드는 절차를 사진과 표로 따라간다. 따라 하면 실제로
만들어진다. 입문 자료로 잘 쓰여 있다.

대조해보니 **설정값은 맞는데 설명이 비어 있는 자리**가 몇 군데 있었다. 그리고
한 군데는 적힌 설정이 다른 설정에 먹힌다.

가장 큰 것은 `Content`에 대한 지시다. 강좌는 이렇게 적는다.

> Anchor X 와 Y 의 Min = 0, Max = 1 로 설정

> Content Size Fitter 의 Horizontal Fit 속성을 Preferred Size

두 줄이 같은 축을 두고 싸운다. uGUI의 Auto Layout 문서가 그 축에 무슨 일이
일어나는지 적어뒀다.

> a Content Size Fitter which has the Horizontal Fit property set to Minimum
> or Preferred will drive the width of the Rect Transform on the same Game
> Object.

> The width will appear as read-only

그리고 정작 `Content`가 **어느 방향으로** 늘어나는지를 정하는 속성은 강좌에
한 번도 나오지 않는다. `Pivot`이다.

확인한 것은 다섯 가지다. **Content Size Fitter가 가져간 축의 값은 driven이
되고 씬에 저장되지도 않는다**, **늘어나는 방향은 Pivot이 정한다**,
**스크롤바 참조를 None으로 두는 것과 Viewport를 넓히는 것은 다른 설정이다**,
**무엇이 내용을 잘라내는지가 강좌에 없다**, 그리고 **수직 편의 "다른 사항"에
수평 편과 같은 값이 적혀 있다.**

그리고 계기 쪽으로 한 가지 더. **인벤토리는 한 축 목록이 아니라 격자이고,
uGUI 매뉴얼에 그 조합의 이름 붙은 조합법이 따로 있다.** 강좌의 한 축 레시피로는
닿지 않는다.

이 블로그에
[Control Child Size를 켜면 크기를 묻는 상대가 바뀐다](/posts/ugui-layout-group/)가
있다. 그쪽은 **레이아웃 그룹이 자식의 크기와 좌표를 가져가는** 이야기였다.
이 글은 한 겹 위다 — **레이아웃 그룹을 얹은 `Content` 자신이 누구에게
크기를 빼앗기는지**, 그리고 그게 Scroll View의 구조와 어떻게 맞물리는지.
다만 다른 글로 넘기지는 않는다. 필요한 설명과 예제 코드는 여기서 다시 전부
싣는다.

확인 시점은 **2026-10-09**이고, 기준은 uGUI **2.7.0**이다.

## 목차

## Content Size Fitter가 가져간 축은 driven이 된다

먼저 `Content Size Fitter`가 무엇인지부터. 문서의 첫 문장이 정체를 밝힌다.

> The Content Size Fitter functions as a layout controller that controls the
> size of its own layout element.

**레이아웃 컨트롤러**다. 자기 자신의 크기를 통제한다. `Horizontal Fit`의 값은
**넷**이다.

> Do not drive the width based on the layout element.

> Drive the width based on the minimum width of the layout element.

> Drive the width based on the preferred width of the layout element.

> Ensures that the width of the layout element stays within the minimum and
> maximum bounds.

`Unconstrained` · `Min Size` · `Preferred Size` · `Clamped` 순서다. 설명을 읽는
기준은 **drive라는 단어**다. 둘은 drive하고 둘은 안 한다.

| 값 | 그 축을 drive하나 |
| --- | --- |
| `Unconstrained` | 아니다 ("Do not drive") |
| `Min Size` | **한다** |
| `Preferred Size` | **한다** |
| `Clamped` | 아니다 — 범위만 제한한다 |

강좌가 지정한 `Preferred Size`가 drive하는 쪽이다. 그리고 `Clamped`는 이
글을 쓰면서 처음 제대로 읽은 값인데, **크기를 가져가지 않으면서 상·하한만
걸어주는** 유일한 선택지다. 목록 항목처럼 "너무 작아지지도 너무 커지지도
않게"가 필요한 자리에 맞는다.

drive된 축이 어떻게 되는지는 Auto Layout 문서에 있다.

> The width will appear as read-only

> those sizes and positions should not be manually edited at the same time
> through the Inspector or Scene View.

> Such changed values would just get reset by the layout controller on the
> next layout calculation anyway.

**인스펙터에서 읽기 전용으로 바뀌고, 손으로 바꿔도 다음 레이아웃 계산에서
되돌려진다.** 한 줄이 더 있다.

> the values of driven properties are not saved as part of the Scene

**씬에 저장되지도 않는다.** 그래서 수평 스크롤에서 `Content`의 Anchor X를
Min=0, Max=1로 늘려놓는 지시는 — 그 축의 폭을 `Content Size Fitter`가
가져가므로 — 결과에 남지 않는다. 틀린 설정이 아니라 **무효한 설정**이다.

정리하면 축마다 주인이 다르다.

| 축 | 수평 스크롤에서 | 누가 정하나 |
| --- | --- | --- |
| 너비(X) | 자식이 늘어나는 축 | `Content Size Fitter`의 `Horizontal Fit` |
| 높이(Y) | Viewport에 맞춰야 하는 축 | Anchor 스트레치 (여기서는 Min=0 Max=1이 의미 있다) |

수직 스크롤이면 X와 Y가 바뀐다. 강좌가 양축을 한꺼번에 Min=0 Max=1로
설정하라고 적은 것은, **의미가 있는 한 축과 무효한 한 축을 같이 적은 것**이다.
결과가 나오니 틀린 절차로 보이지 않는다.

## 늘어나는 방향은 Pivot이 정한다

그러면 `Content Size Fitter`가 폭을 1000에서 2000으로 늘릴 때 **어느 쪽으로**
늘어나는가. 강좌에는 그 답이 없고, 문서에는 있다.

> the resizing is around the pivot.

> This means that the direction of the resizing can be controlled using the
> pivot.

구체적인 예까지 적어뒀다.

> when the pivot is in the upper left corner, the Content Size Fitter will
> expand the Rect Transform down and to the right.

**피벗이 좌상단이면 오른쪽과 아래로 늘어난다.** 이게 Scroll View에서 왜
중요한지는 바로 드러난다.

- **수평 목록**은 왼쪽에서 시작해 오른쪽으로 쌓여야 한다 → 피벗의 X가 **0**
- **수직 목록**은 위에서 시작해 아래로 쌓여야 한다 → 피벗의 Y가 **1**

피벗이 가운데(0.5, 0.5)로 남아 있으면 `Content`는 중심을 기준으로 양쪽으로
늘어난다. 항목을 추가할 때마다 이미 있던 항목들이 **왼쪽으로 밀려나간다.**
Scene 창에서는 "왼쪽부터 차례대로 생성되는 것"처럼 보일 수 있는데, 그건
`Content`가 Viewport보다 작을 때의 모습이다. 넘어가는 순간 어긋난다.

강좌의 수평 편 사진이 멀쩡한 결과를 보여주는 것은, 그 프로젝트의 `Content`
피벗이 이미 맞는 값이었다는 뜻이다. **그 값이 기본값인지 저자가 맞춰둔
것인지는 확인하지 않았다** — 프리팹의 기본값을 문서에서 찾지 못했다. 어느
쪽이든 결론은 같다. **문서가 "방향을 정하는 속성"이라고 적어둔 값이 절차에
한 줄도 없다.** 피벗이 맞는 프로젝트에서는 아무 문제가 없고, 틀린
프로젝트에서는 왜 틀렸는지 찾을 단서가 없다.

## 너비가 먼저, 높이가 나중이다

Auto Layout 문서에 순서가 못 박혀 있다.

> As can be seen from the above, the auto layout system evaluates widths first
> and then evaluates heights afterwards.

> Thus, calculated heights may depend on widths, but calculated widths can
> never depend on heights.

**높이는 너비에 의존할 수 있지만 너비는 높이에 의존할 수 없다.** 이 한 줄이
수평 목록과 수직 목록을 비대칭으로 만든다.

- **수직 목록**에서 항목의 높이가 폭에 따라 달라지는 경우 — 줄바꿈되는
  텍스트가 대표적이다 — 는 성립한다. 폭이 먼저 정해지고 그 폭으로 높이를
  계산한다.
- **수평 목록**에서 항목의 폭이 높이에 따라 달라지는 경우는 성립하지 않는다.
  폭을 계산할 때 높이를 아직 모른다.

그래서 "수평과 수직은 축만 바꾸면 같다"는 강좌의 설명은 **설정 절차에
대해서는 맞고, 동작에 대해서는 맞지 않는다.** 가변 크기 항목을 쓰는 순간
수평 쪽에 먼저 한계가 온다.

## 인벤토리는 한 축이 아니라 격자다

강좌가 쓰는 것은 `Horizontal Layout Group`과 `Vertical Layout Group`이다.
항목을 한 줄로 세우는 컴포넌트들이다. 인벤토리는 **한 줄이 아니라 격자**이고,
거기에 맞는 컴포넌트가 따로 있다.

> The Grid Layout Group component places its child layout elements in a grid.

그리고 이 컴포넌트에는 앞 두 절과 바로 맞물리는 속성이 있다. `Constraint`다.
설명이 짧은데 목적을 밝힌다.

> Constraint the grid to a fixed number of rows or columns to aid the auto
> layout system.

**"to aid the auto layout system"** — 레이아웃 시스템을 **돕기 위해** 행이나
열 수를 고정한다는 것이다. 앞 절에서 본 "너비 먼저, 높이 나중" 때문에 이게
필요하다. 열 수가 고정되어 있으면 폭에서 행 수가 나오고, 행 수에서 높이가
나온다. 열 수가 유동이면 그 연쇄가 끊긴다.

`Flexible`을 골랐을 때 무슨 일이 생기는지도 적혀 있다.

> The grid will attempt to make the row and column count approximately the
> same.

행과 열 수를 **비슷하게 맞추려 한다.** 인벤토리에서는 곤란하다. 아이템이 4개면
2×2, 9개면 3×3이 된다. **칸 수에 따라 열 수가 바뀐다.** 매뉴얼도 이 선택의
대가를 적어둔다.

> will have no control over the specific number of rows and columns

그래서 매뉴얼에는 인벤토리에 해당하는 조합이 **이름까지 붙어서** 따로 있다.
"Fixed width and flexible height"이고, 설명이 이렇다.

> where the grid expands vertically as more elements are added

적혀 있는 설정 세 줄을 그대로 옮기면 이렇다.

| 항목 | 문서가 적은 값 |
| --- | --- |
| Grid Layout Group `Constraint` | "Fixed Column Count" |
| Content Size Fitter `Horizontal Fit` | "Preferred Size or Unconstrained" |
| Content Size Fitter `Vertical Fit` | "Preferred Size" |

그리고 조건이 한 줄 붙는다.

> If unconstrained Horizontal Fit is used, it's up to you to give the grid a
> width that is big enough

> to fit the specified column count of cells.

`Horizontal Fit`을 `Unconstrained`로 두면 — 즉 폭을 Anchor 스트레치로 Viewport에
맞추면 — **열 수만큼의 칸이 들어갈 폭인지는 내가 보장해야 한다.** 칸 크기 ×
열 수 + 간격이 Viewport 폭을 넘으면 넘친다.

앞 두 절과 이어 보면 인벤토리 `Content`의 설정이 전부 정해진다.

| 축 | 누가 정하나 | 값 |
| --- | --- | --- |
| 너비(X) | Anchor 스트레치 | Min X=0, Max X=1 / `Horizontal Fit` = `Unconstrained` |
| 높이(Y) | `Content Size Fitter` | `Vertical Fit` = `Preferred Size` |
| 늘어나는 방향 | `Pivot` | Y = **1** (위에서 아래로) |
| 첫 칸 위치 | `Start Corner` | "The corner where the first element is located." → Upper Left |
| 채우는 순서 | `Start Axis` | "Horizontal will fill an entire row before a new row is started." |

강좌의 양축 Anchor 지시가 **인벤토리에서는 절반만 맞는** 이유가 여기서
드러난다. 너비 쪽 Anchor는 의미가 있고(Fit이 `Unconstrained`니까), 높이 쪽
Anchor는 `Vertical Fit`에 먹힌다.

## 스크롤바를 None으로 두는 것과 Viewport를 넓히는 건 다른 설정이다

강좌의 첫 표는 스크롤바를 치우는 절차다. 네 줄로 되어 있다 — ScrollRect의
`Horizontal Scrollbar`/`Vertical Scrollbar`를 None, Viewport의 Left/Top/
Right/Bottom을 0, 스크롤바 오브젝트 둘을 비활성화.

첫 줄은 문서가 보장한다. 스크롤바 참조 설명이 이렇다.

> Optional reference to a horizontal scrollbar element.

**Optional**이다. 비워도 되는 자리다. 그런데 두 번째 줄 — Viewport의 오프셋을
손으로 0으로 만드는 것 — 에 해당하는 **전용 설정이 따로 있다.** 스크롤바마다
`Visibility`가 있고, 설명이 이렇다.

> Whether the scrollbar should automatically be hidden when it isn't needed,
> and optionally expand the viewport as well.

그리고 그 옵션 중 하나에 대해 이렇게 적는다.

> the viewport is automatically expanded when the scrollbars are hidden

**스크롤바가 숨었을 때 Viewport가 자동으로 넓어진다.** 강좌가 손으로 하는 일이
이 설정의 문서화된 동작이다.

둘의 차이는 실제로 갈린다.

| 방법 | 스크롤바 | 항목이 적을 때 |
| --- | --- | --- |
| 참조를 None + 오브젝트 비활성화 | 영구히 없다 | 변화 없음 |
| `Auto Hide And Expand Viewport` | 필요할 때만 나온다 | Viewport가 스크롤바 자리를 먹는다 |

스크롤바를 **아예 안 쓸 작정**이면 강좌의 방법이 단순하고 명확하다. 다만
**"스크롤바를 숨기고 싶다"**가 목적이었다면 참조를 끊을 이유가 없다. 끊어두면
나중에 스크롤바를 되살릴 때 참조부터 다시 꽂아야 한다.

참고로 `Content`와 `Viewport`도 문서에서는 **참조**다.

> This is a reference to the Rect Transform of the UI element to be scrolled,
> for example a large image.

> Reference to the viewport Rect Transform that is the parent of the content
> Rect Transform.

계층 구조가 아니라 인스펙터의 칸이다. "Content는 Viewport의 자식 객체입니다"는
프리팹이 그렇게 생겼다는 설명이고, ScrollRect가 그 둘을 찾는 방법은 참조다.

덧붙여, 같은 속성을 API 레퍼런스는 조금 다르게 적는다.

> The content that can be scrolled. It should be a child of the GameObject
> with ScrollRect on it.

매뉴얼은 "Viewport가 Content의 부모"라고 적고, API는 "ScrollRect가 붙은
게임오브젝트의 자식"이라고 적는다. Viewport 자신이 그 오브젝트의 자식이므로
Content는 **자손**이지 직접 자식이 아니다. 프리팹 구조를 아는 상태에서는 둘 다
같은 말로 읽히지만, 직접 만들 때는 매뉴얼 쪽이 정확하다.

## 무엇이 잘라내는지가 강좌에 없다

Scroll View의 핵심 동작은 "Viewport 영역만 보이고 나머지는 안 보인다"는
것이다. 강좌도 그걸 길게 설명한다 — Content는 계속 커지지만 보이는 건
Viewport만큼이라고. 맞다. 그런데 **그 가리는 일을 하는 컴포넌트가 무엇인지는
적혀 있지 않다.** 문서에는 있다.

> Usually a Scroll Rect is combined with a Mask in order to create a scroll
> view, where only the scrollable content inside the Scroll Rect is visible.

> The viewport has a Mask component.

`ScrollRect`는 **자르지 않는다.** 드래그와 스크롤 위치를 다루고, 잘라내는
것은 Viewport에 붙은 마스크다. 둘이 한 세트로 묶여 있어서 프리팹을 쓰는
동안에는 구분할 필요가 없고, **직접 만들 때 비로소 드러난다.** Viewport에
마스크가 없으면 Content가 Scroll View 밖까지 그대로 보인다. 스크롤은 여전히
된다. 그래서 증상이 "스크롤이 안 된다"가 아니라 "다 보인다"로 나타난다.

## 수직 편의 "다른 사항"에 같은 값이 적혀 있다

수직 스크롤 절은 "거의 동일합니다. 다른 사항은 다음과 같습니다"로 시작하고
네 줄을 든다. 그 첫 줄이 이것이다.

> Scroll View 객체의 **Width = 1000 / Height = 300** 으로 설정합니다.

수평 편의 값과 **같다.** 수평 편 표에도 `Width = 1000 / Height = 300`이
적혀 있다. 다른 사항으로 적혀 있는데 다르지 않다.

값 자체도 수직 목록에는 어울리지 않는다. 1000×300은 가로로 길고 세로로 짧은
상자다. 세로로 쌓이는 목록을 그 안에 넣으면 한 번에 보이는 항목이 한두 개고,
좌우로는 공간이 남는다. 수직 편 사진이 그 상태를 보여주고 있다.

**이건 복사 과정의 실수로 보인다.** 나머지 세 줄(Horizontal 체크해제,
`Vertical Layout Group`, `Vertical Fit = Preferred Size`)은 정확하다. 수직
목록이라면 Height를 키우고 Width를 줄이는 쪽이 맞다.

## Movement Type을 안 건드리면 목록이 튕긴다

강좌가 ScrollRect에서 건드리는 것은 `Horizontal`/`Vertical` 체크와 스크롤바
참조뿐이다. 그래서 나머지는 기본값으로 남는데, 그중 하나가 체감에 바로
나타난다. `Movement Type`이다.

> Unrestricted, Elastic or Clamped. Use Elastic or Clamped to force the
> content to remain within the bounds of the Scroll Rect.

세 값이고, `Elastic`에 대해 이렇게 적는다.

> Elastic mode bounces the content when it reaches the edge of the Scroll Rect

**끝에서 튕긴다.** 모바일 목록이면 자연스러운 동작이고, 설정 화면의 짧은
목록이면 거슬린다. 튕김의 양은 따로 있다.

> This is the amount of bounce used in the elasticity mode.

`Elasticity`다. 그리고 손을 뗀 뒤 계속 미끄러지는 동작도 설정이다.

> When Inertia is set the content will continue to move when the pointer is
> released after a drag.

> When Inertia is set the deceleration rate determines how quickly the
> contents stop moving.

`Inertia`와 `Deceleration Rate`다. 마우스 휠 감도도 있다.

> The sensitivity to scroll wheel and track pad scroll events.

강좌가 이 넷을 언급하지 않은 것은 입문 자료로서 합리적인 생략이다. 다만
"만들었는데 느낌이 이상하다"의 답이 전부 이 넷에 있다는 점은 적어둘 만하다.
끝에서 딱 멈추게 하려면 `Clamped`, 미끄러짐을 없애려면 `Inertia` 해제다.

## 어디에 왜 쓰나

### 동작하는 예제

강좌의 구조를 그대로 쓰되, 위에서 짚은 것들을 코드로 보증한다. 인스펙터에서
빠뜨리기 쉬운 값(피벗, 축별 Fit)을 런타임에 한 번 맞춰주는 형태다.

```csharp file="Scripts/UI/ScrollListBuilder.cs"
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(ScrollRect))]
public class ScrollListBuilder : MonoBehaviour
{
    private const float Spacing = 10f;

    [Header("참조")]
    [Tooltip("Content에 붙는다. 비워두면 ScrollRect.content에서 찾는다.")]
    [SerializeField]
    private RectTransform _content;

    [Tooltip("항목 프리팹. Layout Element가 붙어 있는 편이 안전하다.")]
    [SerializeField]
    private RectTransform _itemPrefab;

    [Header("방향")]
    [Tooltip("켜면 수평 목록, 끄면 수직 목록")]
    [SerializeField]
    private bool _isHorizontal = true;

    private ScrollRect _scrollRect;

    private void Awake()
    {
        if (!TryGetComponent(out _scrollRect))
        {
            Debug.LogError("ScrollRect가 없다.", this);
            return;
        }

        if (_content == null)
        {
            _content = _scrollRect.content;
        }

        ConfigureContent();
    }

    // 강좌에 없는 두 가지를 여기서 맞춘다 — 피벗과 축별 Fit.
    private void ConfigureContent()
    {
        if (_content == null)
        {
            Debug.LogError("Content가 비어 있다.", this);
            return;
        }

        // 문서: "the direction of the resizing can be controlled using
        // the pivot." 수평은 왼쪽(0), 수직은 위(1)에서 시작해야 한다.
        _content.pivot = _isHorizontal
            ? new Vector2(0f, 0.5f)
            : new Vector2(0.5f, 1f);

        ConfigureLayoutGroup();
        ConfigureFitter();

        _scrollRect.horizontal = _isHorizontal;
        _scrollRect.vertical = !_isHorizontal;
    }

    private void ConfigureLayoutGroup()
    {
        // 축에 맞는 그룹만 남긴다. 둘 다 붙어 있으면 서로 덮어쓴다.
        HorizontalOrVerticalLayoutGroup group = _isHorizontal
            ? GetOrAdd<HorizontalLayoutGroup>()
            : (HorizontalOrVerticalLayoutGroup)GetOrAdd<VerticalLayoutGroup>();

        group.spacing = Spacing;
        group.childAlignment = TextAnchor.MiddleCenter;
    }

    private void ConfigureFitter()
    {
        ContentSizeFitter fitter = GetOrAdd<ContentSizeFitter>();

        // 늘어나는 축만 Preferred, 반대 축은 Unconstrained로 둔다.
        // Unconstrained 축은 Anchor 스트레치가 맡는다.
        fitter.horizontalFit = _isHorizontal
            ? ContentSizeFitter.FitMode.PreferredSize
            : ContentSizeFitter.FitMode.Unconstrained;

        fitter.verticalFit = _isHorizontal
            ? ContentSizeFitter.FitMode.Unconstrained
            : ContentSizeFitter.FitMode.PreferredSize;
    }

    public void Build(int itemCount)
    {
        if (_content == null || _itemPrefab == null)
        {
            Debug.LogError("참조가 비어 있다.", this);
            return;
        }

        for (int i = _content.childCount - 1; i >= 0; i--)
        {
            Destroy(_content.GetChild(i).gameObject);
        }

        for (int i = 0; i < itemCount; i++)
        {
            Instantiate(_itemPrefab, _content);
        }

        // 레이아웃은 프레임 끝에 한 번 돌아간다. 지금 크기를 읽거나
        // 스크롤 위치를 맞추려면 강제로 돌려야 한다.
        LayoutRebuilder.ForceRebuildLayoutImmediate(_content);

        ScrollToStart();
    }

    private void ScrollToStart()
    {
        if (_isHorizontal)
        {
            _scrollRect.horizontalNormalizedPosition = 0f;
        }
        else
        {
            // 수직은 1이 위다. 0이 아니다.
            _scrollRect.verticalNormalizedPosition = 1f;
        }
    }

    private T GetOrAdd<T>() where T : Component
    {
        if (_content.TryGetComponent(out T existing))
        {
            return existing;
        }

        return _content.gameObject.AddComponent<T>();
    }
}
```

`_content`, `_itemPrefab`, `_scrollRect`에 `?.`를 쓰지 않은 이유가 있다. 전부
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` 비교를 쓴다. 순수 C#
객체라면 `?.`가 맞다.

`LayoutRebuilder.ForceRebuildLayoutImmediate`가 왜 필요한지, 그리고 레이아웃
갱신이 어느 시점에 도는지는
[Control Child Size를 켜면 크기를 묻는 상대가 바뀐다](/posts/ugui-layout-group/)에
적어뒀다. 요약하면 레이아웃 계산은 즉시가 아니라 **프레임 끝**에 돌고, 방금
만든 목록의 전체 크기를 그 전에 읽으면 이전 값이 나온다.

`verticalNormalizedPosition`에 **1이 위**인 것도 짚어둔다. API 레퍼런스가
0 쪽만 정의한다.

> The vertical scroll position as a value between 0 and 1, with 0 being at the
> bottom.

> The horizontal scroll position as a value between 0 and 1, with 0 being at
> the left.

0이 아래이고 0이 왼쪽이다. 그래서 목록을 채운 뒤 맨 위로 올리려면 **1**을
넣는다. 수평은 0이다.

### 무엇을 고르나

| 하려는 것 | 어디서 |
| --- | --- |
| 격자로 쌓이는 인벤토리 | `Grid Layout Group` + `Constraint` = Fixed Column Count |
| 항목이 늘어나는 축의 크기 | `Content Size Fitter`의 해당 축 Fit |
| 그 반대 축의 크기 | Anchor 스트레치 (Fit은 `Unconstrained`) |
| 늘어나는 **방향** | `Content`의 **Pivot** |
| 항목 사이 간격 | 레이아웃 그룹의 `Spacing` |
| 내용을 Viewport 밖으로 안 보이게 | Viewport의 **Mask** |
| 스크롤바를 영구히 없앤다 | 참조를 None + 오브젝트 비활성화 |
| 필요할 때만 스크롤바를 보인다 | 스크롤바 `Visibility` |
| 끝에서 튕기지 않게 | `Movement Type = Clamped` |
| 손 뗀 뒤 미끄러지지 않게 | `Inertia` 해제 |

축을 고르는 기준은 이렇게 두면 된다.

- **항목 개수가 늘어나는 축** → `Content Size Fitter`가 맡는다. 그 축의
  Anchor는 손대지 않는다. 어차피 driven이고 저장되지 않는다.
- **Viewport에 맞춰야 하는 축** → Anchor 스트레치가 맡는다. 그 축의 Fit은
  `Unconstrained`다.
- **둘 다 Preferred Size로 두는 것**은 Scroll View에서 거의 틀린 설정이다.
  Content가 양쪽으로 자유롭게 커지면 Viewport와의 관계가 사라진다.

가변 크기 항목을 쓸 거라면 **수직을 먼저 고려하라.** 너비가 먼저, 높이가
나중에 계산되므로 폭에 따라 높이가 달라지는 항목은 수직 목록에서 성립하고
수평 목록에서는 성립하지 않는다.

### 쓰지 말아야 할 자리

- **Fit이 걸린 축의 Anchor나 크기를 인스펙터에서 맞추려는 것.** 읽기 전용이
  되고, 바꿔도 다음 계산에서 되돌려지고, 씬에 저장되지 않는다.
- **Pivot을 기본값(0.5, 0.5)으로 둔 Content.** 항목을 추가할 때마다 양쪽으로
  늘어나 기존 항목이 밀려난다.
- **Viewport에 마스크 없이 직접 만든 Scroll View.** 스크롤은 되는데 다
  보인다. 증상이 스크롤 문제처럼 보이지 않는다.
- **수평 목록에 폭이 높이에 의존하는 항목.** 문서가 "calculated widths can
  never depend on heights"라고 적었다.
- **항목 수백 개를 레이아웃 그룹 + Content Size Fitter로 그대로 쌓는 것.**
  항목이 늘면 갱신 비용이 따라 늘어난다. 그 지점부터는 재사용(풀링) 구조로
  가야 한다.
- **스크롤바를 "숨기려고" 참조를 끊는 것.** 되살릴 때 참조부터 다시 꽂아야
  한다. 숨기는 것이 목적이면 `Visibility`가 그 자리다.

## 정리

- `Content Size Fitter`는 **레이아웃 컨트롤러**다. `Preferred Size`를 준 축은
  **drive**되어 인스펙터에서 읽기 전용이 되고, 손으로 바꿔도 되돌려지고,
  **씬에 저장되지 않는다.**
- `Fit`의 값은 **넷**이다. `Min Size`와 `Preferred Size`만 drive하고,
  `Unconstrained`와 `Clamped`는 안 한다. **`Clamped`는 크기를 가져가지 않으면서
  상·하한만 거는** 유일한 값이다.
- 그래서 강좌의 "Anchor X와 Y의 Min=0, Max=1" 중 **Fit이 걸린 축 쪽은 결과에
  남지 않는다.** 틀린 설정이 아니라 무효한 설정이다.
- **늘어나는 방향을 정하는 것은 Pivot이다.** 문서가 "the direction of the
  resizing can be controlled using the pivot"이라고 적었고, 강좌에는 피벗이
  한 줄도 없다. 수평은 X=0, 수직은 Y=1이다.
- 레이아웃은 **너비를 먼저, 높이를 나중에** 계산한다. "높이는 너비에 의존할
  수 있지만 너비는 높이에 의존할 수 없다." 수평과 수직은 절차만 대칭이고
  동작은 대칭이 아니다.
- 스크롤바 참조는 **"Optional"**이라 비워도 된다. 다만 Viewport를 손으로
  넓히는 일에는 **`Visibility`**라는 전용 설정이 있고, 숨겼을 때 Viewport를
  자동으로 넓혀준다.
- 내용을 잘라내는 것은 `ScrollRect`가 아니라 **Viewport의 Mask**다. 문서가
  "The viewport has a Mask component."라고 적어뒀다. 직접 만들 때 빠뜨리면
  "다 보인다"로 나타난다.
- 수직 편의 "다른 사항" 첫 줄에 **수평 편과 같은 `Width = 1000 / Height =
  300`**이 적혀 있다. 복사 실수로 보이고, 수직 목록에 맞는 비율도 아니다.
- `Movement Type` · `Elasticity` · `Inertia` · `Scroll Sensitivity`는 전부
  기본값으로 남는다. "느낌이 이상하다"의 답이 이 넷에 있다.
- **인벤토리는 격자다.** 매뉴얼에 "Fixed width and flexible height"라는 이름
  붙은 조합이 있고, `Constraint` = Fixed Column Count · `Horizontal Fit` =
  Unconstrained · `Vertical Fit` = Preferred Size다. `Flexible`은 "행과 열
  수를 비슷하게" 맞추려 해서 칸 수에 따라 열 수가 바뀐다.

---

### 참고

- [Scroll Rect — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ScrollRect.html)
- [Content Size Fitter — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ContentSizeFitter.html)
- [Auto Layout — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/UIAutoLayout.html)
- [Horizontal Layout Group — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-HorizontalLayoutGroup.html)
- [Grid Layout Group — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-GridLayoutGroup.html)
- [Layout Element — uGUI 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-LayoutElement.html)
- [LayoutRebuilder — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)
- [ContentSizeFitter — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ContentSizeFitter.html)
- [ScrollRect — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ScrollRect.html)
- [ContentSizeFitter.FitMode — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ContentSizeFitter.FitMode.html)

이 글의 출발점이 된 자료는
[\[유니티 기초\] UI 편 - Layout 컴포넌트를 이용한 Scroll View 항목 생성](https://ugames.tistory.com/entry/%EC%9C%A0%EB%8B%88%ED%8B%B0-%EA%B0%95%EC%9D%98-UI-%ED%8E%B8-Scroll-View-2-%EC%8B%A4%EC%82%AC%EC%9A%A9-%EC%98%88%EC%A0%9C)
(레오란다, 2022-12-05)이다. Unity 2021.3 LTS 기준 연재물의 한 편이고, 설정
절차는 원문을 그대로 따라가면서 각 항목을 현행 uGUI 2.7.0 매뉴얼과 API
레퍼런스에 대조했다. 확인 시점은 2026-10-09이다.
