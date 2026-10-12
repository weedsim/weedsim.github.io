---
pubDatetime: 2026-10-12T19:30:00+09:00
title: "스크롤 위치를 쥐고 있는 건 설정이 아니라 쓰는 순서다"
lang: ko
translationKey: scrollrect-reset-timing
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - 스크롤
  - Animator
description: "스크롤 뷰 작업의 불편을 해결하려고 찾던 중 스크랩한, 팝업의 스크롤 뷰가 매번 맨 아래에서 열리는 기록이다. 저자는 원인을 부모의 오픈 애니메이션으로 찾아냈지만 어떤 상호작용인지는 모르겠다고 적었다. 문서도 프레임 안의 순서를 글로는 적지 않는다. 대신 알아내는 수단과 미루는 수단을 적어둔다."
---

**스크롤 뷰 작업에서 걸린 불편들**을 하나씩 해결하려고 자료를 더 찾던 중에
짧은 에러 기록을 스크랩해뒀다. 증상 · 시도 · 원인 · 해결 넷으로 끝나는
TIL이고, 2023년 글이다. 팝업 창의 스크롤 뷰가 열릴 때마다 맨 아래로
내려가는데 `verticalNormalizedPosition = 1`로 되돌려도 다시 내려간다는
내용이다. 저자는 원인을 **부모에 붙어 있던 팝업 오픈 애니메이션**으로
찾아냈다. 거기까지가 기록이고, 그다음 한 줄이 이 글의 출발점이다.

> 해당 애니메이션과 어떤 상호작용을 했는지는 정확히 모르겠지만

**이 글은 그 "정확히 모르겠다"를 문서로 메우려는 글이다.** 결론부터 적으면
문서도 프레임 안의 순서를 **글로는 적지 않는다.** 대신 두 가지를 적어둔다 —
알아내는 수단과, 순서를 몰라도 되게 미루는 수단.

이 블로그에 uGUI 글이 둘 있다.
[Content가 늘어나는 방향을 정하는 건 Anchor가 아니라 Pivot이다](/posts/ugui-scroll-view-content/)와
[Control Child Size를 켜면 크기를 묻는 상대가 바뀐다](/posts/ugui-layout-group/)다.
그 둘은 **무엇이 크기를 정하는가**를 다뤘다. 이 글은 같은 `ScrollRect`를
놓고 **그 값을 언제 쓰는가**만 본다. 겹치는 자리는 링크로 넘기지 않고
필요한 만큼 여기서 다시 싣는다.

확인한 것은 여섯 가지다. **캔버스가 계산하는 시점이 문서에 이름으로 적혀
있다**, **프레임 안의 순서는 그림에만 있고 문서는 프로파일러 마커를
가리킨다**, **오브젝트가 다르면 같은 이벤트 함수의 순서에 기댈 수 없다고
적혀 있다**, **스크립트끼리의 순서는 설정할 수 있지만 애니메이션 시스템과의
순서는 그 설정의 대상이 아니다**, **클립이 끝나는 시점을 받는 수단이 둘
있다**, 그리고 **`ScrollRect`는 대입과 무관하게 스스로 움직이는 상태를
가진다.**

확인 시점은 **2026-10-12**이고, 기준은 Unity **6.6**과 uGUI **2.7.0**이다.

## 목차

## 브레이크포인트를 걸면 되는 건 단서다

기록에서 가장 정보가 많은 줄은 원인도 해결도 아니다. 시도 목록의 마지막
줄이다.

> 특히 스크롤뷰 위치를 리셋시켜주는 scrollRect.verticalNormalizedPosition =
> 1에 디버깅을 걸어서 천천히 시도했을 때는 정상적으로 초기위치설정이
> 작동하기도 했다.

**설정은 브레이크포인트에 반응하지 않는다.** Pivot이 틀렸으면 멈춰서 봐도
틀리고, Content 크기가 틀렸으면 천천히 가도 틀리다. 멈추면 되고 그냥 두면
안 되는 것은 값이 아니라 **그 값을 쓰는 순서**다. 그래서 그 앞의 시도들은

> pivot 변경도 해보고 다른 곳에 있는 스크롤뷰 설정을 그대로 가져와서 사용도
> 해보고 이것저것 시도해봤으나 계속 같은 현상이 발생했다.

처음부터 다른 축을 보고 있었다. 설정 축에서 아무리 바꿔도 순서 축의 문제는
움직이지 않는다.

이 증상은 원인이 셋인데 겉모습이 같다. 셋 다 "열었더니 맨 아래"로 보인다.

| 원인 | 무엇이 어긋났나 | 문서가 준 수단 |
| --- | --- | --- |
| 레이아웃이 아직 안 섰다 | 비율의 분모가 될 크기가 미정 | `Canvas.ForceUpdateCanvases` |
| 나중에 쓰는 쪽이 있다 | 대입 뒤에 다른 코드·클립이 덮는다 | 프로파일러 마커 · 실행 순서 설정 |
| 움직이는 상태가 남아 있다 | 대입은 됐지만 속도가 남아 있다 | `ScrollRect.StopMovement` |

기록이 만난 것은 둘째이고, 셋째가 겹쳐 있었을 가능성이 있다. 첫째는 앞선
두 글의 영역이라 이 글에서는 시점만 짚는다.

## 캔버스가 계산하는 시점이 문서에 있다

`Canvas.ForceUpdateCanvases`의 설명이 이 문제의 절반을 그냥 적어둔다.

> Force all canvases to update their content.

> A canvas performs its layout and content generation calculations at the end
> of a frame, just before rendering, in order to ensure that it's based on all
> the latest changes that may have happened during that frame.

> This means that in the Start callback and the first Update callback, the
> layout and content under the canvas may not be up-to-date.

**`Start`와 첫 `Update`가 문서에 이름으로 적혀 있다.** 캔버스는 프레임이
끝날 때, 렌더링 직전에 계산한다. 그래서 팝업을 켠 바로 그 프레임의
`Start`나 `OnEnable`에서 읽는 레이아웃은 최신이 아니다.

여기에 `verticalNormalizedPosition`이 어떤 값인지를 겹치면 결과가 나온다.

> The vertical scroll position as a value between 0 and 1, with 0 being at the
> bottom.

**0과 1 사이의 비율이고, 0이 아래다.** 비율이라는 말은 분모가 따로 있다는
뜻이다. Content의 크기가 아직 정해지지 않았으면 `1`이 가리키는 자리도 아직
정해지지 않는다. 기록의 저자가 Content 설정을 바꿔보고 Pivot을 바꿔본 것은
이 축을 더듬은 것이고, 방향은 틀리지 않았다. 다만 **크기를 바꿔서 될 일이
아니라 크기가 정해진 뒤에 쓰는 문제**였다.

크기 쪽 이야기는 위에 링크한 Pivot 글에 적어뒀다. 이 글은 시점만 본다.

## 프레임 안의 순서는 그림으로만 있다

그럼 한 프레임 안에서 스크립트와 애니메이션 중 누가 먼저인가. 매뉴얼에
전용 페이지가 있다. 그런데 **그 순서는 페이지의 본문이 아니라 그림에 있다.**
본문에 글로 적힌 것은 그림의 일부 노드를 펼친 설명들이다 — 물리, 애니메이션,
렌더링, 코루틴 재개 지점, 그리고 한계. **`Update`와 `LateUpdate`의 전후를
문장으로 적은 자리는 없다.** 애니메이션 쪽 본문이 적는 것도 호출되는 함수의
**목록**이다 — `OnAnimatorMove`, `OnAnimatorIK`, 그리고
`StateMachineBehaviour`의 일곱 개.

순서를 알고 싶으면 어디를 보라고 적혀 있나.

> Other animation functions shown in the diagram are internal to the animation
> system and are provided for context. These functions have associated Profiler
> markers so you can use the Profiler to see when in the frame Unity calls
> them.

> Knowing when Unity calls these functions can help you understand exactly when
> the event functions you do call are executed.

**문서의 답은 "프로파일러를 보라"다.** 저자의 "어떤 상호작용인지 정확히
모르겠다"에 대한 공식 수단이 이것이다. 추측하지 말고 프레임 안에서 언제
불리는지를 마커로 본다.

그리고 같은 페이지가 순서에 기대는 것 자체에 선을 긋는다.

> In general, you can't rely on the order in which the same event function is
> invoked for different GameObjects, except when the order is explicitly
> documented or settable.

> You can't specify the order in which an event function is called for
> different instances of the same MonoBehaviour script.

**"기댈 수 없다"가 문서의 문장이다.** 팝업 창 스크립트와 스크롤 뷰 스크립트가
서로 다른 오브젝트에 붙어 있으면, 둘의 `OnEnable` 순서는 보장이 없다. 기록의
두 번째 해결책 —

> 스크롤뷰를 가진 컴포넌트를 애니메이션을 가지고 있는 부모컴포넌트로부터
> 독립시켜준다.

— 이 "어색하다"는 대가 말고도 이 보장 없음을 그대로 물려받는다. 부모에서
떼어내면 애니메이션의 영향은 끊기지만, 대신 **누가 먼저 켜지는지를 모르는
상태**가 된다.

## 순서는 정할 수 있다, 스크립트끼리만

순서에 기댈 수 없다는 문장에는 예외가 달려 있었다 — "except when the order is
explicitly documented or settable". 그 settable이 가리키는 설정이 따로 있다.

> all instances of a script with a lower execution order value are executed
> before any instances of a script with a higher execution order value,
> regardless of which GameObject they're attached to.

프로젝트 설정의 Script Execution Order고, 코드로는 `[DefaultExecutionOrder]`
속성이다. **값이 작은 쪽이 먼저고, 어느 오브젝트에 붙어 있든 상관없다.**
기록처럼 "팝업이 열리고 → 스크롤을 되돌린다"의 두 스크립트 순서를 고정하고
싶다면 이 설정이 정식 수단이다.

다만 적용되지 않는 자리가 명시돼 있다. 문서가 "doesn't affect" 아래에 둘을
적는다.

> The order of functions marked with the [RuntimeInitializeOnLoadMethod]
> attribute.

> OnDisable and OnDestroy functions.

**끄는 쪽에는 안 듣는다.** 팝업을 닫으면서 정리하는 코드의 순서를 이 설정으로
잡으려 하면 안 된다.

그리고 이 글의 문제에는 **더 중요한 한계**가 있다. 이 설정이 정하는 것은
**스크립트끼리의 순서**다. 스크립트와 애니메이션 시스템 사이의 순서를 이
값으로 바꾼다는 서술은 그 페이지에 없고, 확인하지 못했다. 기록의 원인이
애니메이션이었으므로, **이 설정만으로는 끝나지 않는다는 뜻이다.**

## 끝나는 시점은 '체크'하는 게 아니라 받는 것이다

기록의 세 번째 해결책은 방향이 맞다.

> 애니메이션 끝나는 시간 체크해줘서 UIHelper.ResetScrollRect(); 실행시키기

다만 "시간 체크"는 문서가 이벤트를 주는 자리다. 수단이 둘 있다.

첫째, 클립에 직접 박는 것이다.

> Use an Animation Event to call a function at a specific point in time.

Animation Event다. 클립의 끝에 마커를 하나 찍고 거기서 함수를 부른다.
제약이 하나 적혀 있다.

> Note that Animation Events only support methods with a single parameter.

**인자가 하나인 메서드만 고를 수 있다.** 되돌리는 함수라면 인자가 필요 없을
테니 문제가 되지 않는다. 에셋으로 받은 클립이라 Animation 창에서 못 건드리는
경우가 있는데, 그건 창의 문제고 임포트 설정 쪽에 자리가 따로 있다 —
[읽기 전용인 건 클립이 아니라 Animation 창의 뷰다](/posts/imported-clip-readonly/)에
적어뒀다.

둘째, 상태 머신에서 받는 것이다.

> Invoked on the last update frame when a state machine evaluates this state.

> Implement this message to react to a state ending.

> OnStateExit is invoked when a transition to a state has completed or has been
> interrupted.

`StateMachineBehaviour.OnStateExit`다. 상태가 끝나는 것에 반응하라고 설명에
그대로 적혀 있다. 함정이 둘이다. 하나는 문서가 Note로 달아둔 것이다.

> Note: OnStateExit may be invoked multiple times on the same state if that
> state is synchronized on multiple layers.

**여러 번 불릴 수 있다.** 그래서 여기서 부르는 되돌리기는 **여러 번 불려도
같은 결과여야 한다.** 위치를 특정 값으로 대입하는 함수라면 그 조건은 저절로
만족된다.

다른 하나는 문서가 적지 않은 쪽이다. "Invoked on the last update frame" —
**마지막 갱신 프레임에 불린다.** 그 프레임에 애니메이션이 값을 쓰는 것과
`OnStateExit`가 불리는 것의 전후를 그 페이지는 말하지 않고, 확인하지
못했다. 두 문장을 이어붙이면 "마지막 프레임의 애니메이션 출력에 다시 덮일 수
있다"가 되는데 **그건 제 추론이다.** 그래서 아래 예제는 `OnStateExit`에
기대지 않고, 한 프레임을 더 미루는 쪽을 기본으로 둔다.

폴링으로 끝을 재야 하는 경우라면 숫자를 적지 말고 상태에서 읽는다.

> Returns an AnimatorStateInfo with the information on the current state.

> The integer part is the number of times the State has looped.

> The fractional part is a percentage (0-1) that represents the progress of the
> current loop.

`Animator.GetCurrentAnimatorStateInfo(layerIndex)`로 상태를 얻고
`normalizedTime`을 본다. **정수부가 반복 횟수고 소수부가 진행률이므로, 한 번
도는 클립은 1에 닿으면 끝이다.** 클립 길이를 인스펙터에 숫자로 적어두는
것보다 낫다 — 클립을 갈아끼우면 숫자는 틀리고 이 값은 안 틀린다.

## 프레임 끝까지 미루는 수단도 있다

순서를 알아내는 대신 **순서를 몰라도 되게** 만드는 길이 있다. 실행 순서
페이지가 코루틴 재개 지점을 적어둔다.

> Suspended coroutines can resume at different points in the execution sequence
> depending on the yield instruction used.

> For example, coroutines that use WaitForEndOfFrame resume at the end of the
> frame, while those that use WaitForFixedUpdate resume at the end of the fixed
> update step.

**`WaitForEndOfFrame`은 프레임의 끝에서 재개한다.** `Update`에서 쓰는 것보다
나중이고, 순서를 알아내지 않고도 "나중"에 설 수 있다. 다만 캔버스가 계산한다는
"at the end of a frame, just before rendering"과 **정확히 같은 지점인지는 이
페이지가 말하지 않는다.** 확인한 것은 둘 다 프레임의 끝 쪽이라는 것까지다.

여기에도 보장되지 않는 구석이 적혀 있다.

> The exact order of execution between resuming coroutines and asynchronous
> tasks is not guaranteed.

코루틴과 비동기 작업 사이의 순서는 보장되지 않는다. 되돌리기를 `async`
쪽에서 하고 있다면 이 문장을 먼저 읽어야 한다.

## ScrollRect는 대입과 무관하게 움직인다

기록의 원인 문장에 쓰인 동사가 하나 있다.

> 팝업이 오픈되고 scrollRect.verticalNormalizedPosition = 1로
> 초기위치 설정이 제대로 된 이후에 애니메이션이 작동해서
> 스크롤뷰가 튕겼던 것.

**"튕겼다"**다. 그리고 `ScrollRect`에는 튕김이 설정으로 들어 있다.

> Unrestricted, Elastic or Clamped.

> Use Elastic or Clamped to force the content to remain within the bounds of
> the Scroll Rect.

> Elastic mode bounces the content when it reaches the edge of the Scroll Rect.

`Movement Type`이고, `Elastic`이 끝에서 튕긴다. 그 위에 손을 뗀 뒤의 미끄러짐이
따로 있다.

> When Inertia is set the content will continue to move when the pointer is
> released after a drag.

> When Inertia is not set the content will only move when dragged.

**"continue to move"** — 입력이 끝난 뒤에도 계속 움직인다는 뜻이다. 그 움직임은
상태로 남아 있고, API에 이름이 있다.

> The current velocity of the content.

> Sets the velocity to zero on both axes so the content stops moving.

`velocity`와 `StopMovement()`다. **속도가 0이 아닌 상태에서 위치만 대입하면,
다음 프레임부터 그 속도가 계속 적용된다.** 기록의 증상이 "대입은 되는데 다시
내려간다"였다는 점에서 이쪽도 같은 모습으로 보인다.

그래서 되돌리기는 **위치 대입 한 줄이 아니라 두 줄**이다. 속도를 죽이고 위치를
쓴다. `Movement Type`과 `Inertia` 자체의 선택 기준은
[Content가 늘어나는 방향을 정하는 건 Anchor가 아니라 Pivot이다](/posts/ugui-scroll-view-content/)에
적어뒀다.

다만 분명히 해둘 것이 있다. **이 기록만으로는 그 애니메이션이 무엇을 키로
잡았는지 알 수 없다.** 클리핑에 클립의 내용이 없다. 그러니 "애니메이션이
`ScrollRect`의 어느 값을 덮었는가"는 확인할 수 없는 영역이고, 저자가 모르겠다고
적은 것도 그 지점이다. 확인할 수 있는 것은 위 수단들이 문서에 있다는 것까지다.

누가 움직였는지 보고 싶으면 콜백이 있다.

> Callback executed when the position of the child changes. Provides the
> normalized position as a Vector2.

`onValueChanged`다. 되돌린 직후부터 이걸 로그로 찍어두면 **대입 뒤에 위치가
또 바뀌는지**가 눈에 보인다. 추측과 측정을 가르는 한 줄이다.

## 어디에 왜 쓰나

### 동작하는 예제

팝업 베이스 클래스 형태다. 기록의 세 번째 해결책이 말한 "베이스 윈도우에
애니메이션 받아서 끝날 때 실행시킬 함수 만들어주는 구조"를 문서가 준 수단으로
짠 것이다.

```csharp file="Scripts/UI/PopupWindow.cs"
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Animator))]
public class PopupWindow : MonoBehaviour
{
    [Header("참조")]
    [Tooltip("열릴 때 초기 위치로 되돌릴 스크롤 뷰")]
    [SerializeField]
    private ScrollRect _scrollRect;

    [Tooltip("ScrollRect의 Content. 레이아웃을 먼저 확정할 때 쓴다")]
    [SerializeField]
    private RectTransform _content;

    [Header("초기 위치")]
    [Tooltip("1이 위, 0이 아래")]
    [Range(0f, 1f)]
    [SerializeField]
    private float _initialVerticalPosition = 1f;

    [Tooltip("오픈 애니메이션이 들어 있는 레이어")]
    [SerializeField]
    private int _openLayerIndex;

    private Animator _animator;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("Animator가 없다.", this);
        }
    }

    private void OnEnable()
    {
        // 여기서 위치만 대입하고 끝내지 않는다. 캔버스는 프레임 끝에
        // 계산하고, 오픈 애니메이션은 그 뒤로도 값을 쓴다.
        StartCoroutine(ResetAfterOpenAnimation());

        if (_scrollRect != null)
        {
            _scrollRect.onValueChanged.AddListener(HandleScrollChanged);
        }
    }

    private void OnDisable()
    {
        // 코루틴은 비활성화와 함께 멈춘다. 리스너는 직접 뗀다.
        if (_scrollRect != null)
        {
            _scrollRect.onValueChanged.RemoveListener(HandleScrollChanged);
        }
    }

    private IEnumerator ResetAfterOpenAnimation()
    {
        // 상태가 바뀌는 데 한 프레임을 준다. 켜진 프레임의 상태 정보는
        // 아직 이전 상태일 수 있다.
        yield return null;

        if (_animator != null)
        {
            // 클립 길이를 숫자로 적지 않는다. 정수부가 반복 횟수,
            // 소수부가 진행률이므로 한 번 도는 클립은 1에서 끝난다.
            while (_animator.GetCurrentAnimatorStateInfo(_openLayerIndex)
                       .normalizedTime < 1f)
            {
                yield return null;
            }
        }

        // 프레임의 끝까지 미룬다. 이 뒤로 이번 프레임에 값을 쓰는 코드가
        // 남아 있지 않다.
        yield return new WaitForEndOfFrame();

        ResetScrollPosition();
    }

    // Animation Event에서 직접 불러도 되게 public으로 둔다. 여러 번 불려도
    // 결과가 같다.
    public void ResetScrollPosition()
    {
        if (_scrollRect == null)
        {
            return;
        }

        // 비율의 분모가 될 크기를 먼저 확정한다.
        if (_content != null)
        {
            LayoutRebuilder.ForceRebuildLayoutImmediate(_content);
        }

        Canvas.ForceUpdateCanvases();

        // 속도가 남아 있으면 대입한 위치가 다음 프레임부터 다시 밀린다.
        _scrollRect.StopMovement();
        _scrollRect.verticalNormalizedPosition = _initialVerticalPosition;
    }

    // 되돌린 뒤에 누가 또 움직이는지 보려고 남겨둔 자리다.
    private void HandleScrollChanged(Vector2 normalizedPosition)
    {
        Debug.Log($"스크롤 위치 {normalizedPosition.y:F3}", this);
    }
}
```

`_scrollRect`·`_content`·`_animator`에 `?.`를 쓰지 않은 이유가 있다. 전부
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다.

`ResetScrollPosition()`을 `public`으로 둔 것이 이 구조의 핵심이다. **코루틴
경로와 Animation Event 경로가 같은 함수를 부른다.** 클립을 건드릴 수 있으면
끝에 이벤트를 찍는 쪽이 가장 짧고, 못 건드리면 코루틴이 같은 자리를 메운다.
`OnStateExit`에서 불러도 된다 — 여러 번 불려도 같은 값을 쓰기 때문이다.

`HandleScrollChanged`의 로그는 **출시용이 아니라 진단용**이다. 되돌린 직후에
이 로그가 한 번 더 찍히면 아직 누가 쓰고 있다는 뜻이고, 그때 프로파일러
마커를 보면 된다. 원인을 찾은 뒤에는 리스너째로 지우면 된다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| 열릴 때 맨 위로 | `StopMovement()` → `verticalNormalizedPosition = 1` |
| 크기가 먼저 정해져야 한다 | `LayoutRebuilder.ForceRebuildLayoutImmediate` |
| `Start`·첫 `Update`에서 레이아웃이 안 맞는다 | `Canvas.ForceUpdateCanvases` |
| 오픈 애니메이션이 끝난 뒤에 | 클립 끝에 Animation Event |
| 클립을 건드릴 수 없다 | `normalizedTime >= 1` 폴링 또는 `OnStateExit` |
| 누가 나중에 쓰는지 모르겠다 | `WaitForEndOfFrame`으로 프레임 끝까지 미룸 |
| 스크립트 둘의 순서를 고정한다 | Script Execution Order · `[DefaultExecutionOrder]` |
| 끄는 순서를 고정한다 | 그 설정으로는 안 된다 (`OnDisable`·`OnDestroy` 제외) |
| 프레임 안의 위치를 알고 싶다 | 프로파일러의 애니메이션 마커 |
| 되돌린 뒤 또 움직이는지 본다 | `onValueChanged` 로그 |

판단 순서는 이렇게 두면 된다.

- **먼저 측정한다.** `onValueChanged`에 로그를 걸어 대입 뒤에 위치가 또
  바뀌는지 본다. 안 바뀌면 순서 문제가 아니라 크기 문제다.
- **또 바뀌면 미룬다.** `WaitForEndOfFrame`이 가장 싸다. 순서를 알아내지
  않고도 "가장 나중"에 설 수 있다.
- **그래도 바뀌면 클립이다.** 오픈 애니메이션이 끝난 뒤로 옮긴다. 클립 끝의
  Animation Event가 가장 정확하다.
- **속도는 따로 죽인다.** 위 셋 중 어느 길로 가도 `StopMovement()`는 같이
  부른다. 위치 대입은 속도를 건드리지 않는다.

### 쓰지 말아야 할 자리

- **`Start`나 첫 `Update`에서 스크롤 위치를 대입하고 끝내는 것.** 문서가 그
  두 자리를 이름으로 지목해 "may not be up-to-date"라고 적었다.
- **클립 길이를 인스펙터에 숫자로 적어두는 것.** 클립을 갈아끼우면 숫자만
  틀린다. `normalizedTime`은 안 틀린다.
- **`OnStateExit`에서 한 번만 돌아야 하는 일을 하는 것.** 문서가 "may be
  invoked multiple times"라고 적었다. 되돌리기처럼 멱등인 일만 둔다.
- **Script Execution Order로 애니메이션과의 순서를 잡으려는 것.** 그 설정이
  정하는 것은 스크립트끼리의 순서다. 애니메이션 시스템과의 순서를 정한다는
  서술은 찾지 못했다.
- **`OnDisable`·`OnDestroy`의 순서를 그 설정에 기대는 것.** 문서가 "doesn't
  affect"에 그 둘을 적어뒀다.
- **위치만 대입하고 `StopMovement()`를 빼는 것.** `velocity`는 별도 상태이고,
  남아 있으면 다음 프레임부터 다시 움직인다.
- **서로 다른 오브젝트의 `OnEnable` 순서에 기대는 것.** 문서가 "you can't
  rely on the order"라고 적었다.
- **진단 로그를 그대로 출시하는 것.** `onValueChanged`는 위치가 바뀔 때마다
  불린다. 드래그 한 번에 로그가 쏟아진다.

## 정리

- 기록에서 가장 값진 줄은 원인이 아니라 **디버깅을 걸어 천천히 했을 때는
  되기도 했다는 시도 기록**이다. 설정은 브레이크포인트에 반응하지 않는다.
  멈추면 되는 증상은 순서 문제다.
- 캔버스는 **"at the end of a frame, just before rendering"** 계산하고, 문서가
  **`Start`와 첫 `Update`를 이름으로 지목**해 레이아웃이 최신이 아닐 수 있다고
  적는다. `Canvas.ForceUpdateCanvases`가 그걸 당기는 수단이다.
- `verticalNormalizedPosition`은 **"a value between 0 and 1, with 0 being at
  the bottom"**이다. 비율이므로 분모가 될 크기가 먼저 정해져야 한다.
- 프레임 안의 순서는 매뉴얼 **본문이 아니라 그림에** 있다. 본문이 가리키는
  것은 **프로파일러 마커**다 — "use the Profiler to see when in the frame Unity
  calls them."
- 순서에 기대는 것 자체에 선이 그어져 있다. **"you can't rely on the order in
  which the same event function is invoked for different GameObjects"**다.
- 스크립트끼리의 순서는 Script Execution Order와 `[DefaultExecutionOrder]`로
  정한다 — 값이 작은 쪽이 먼저다. 다만 **`OnDisable`·`OnDestroy`에는 안 듣고**,
  애니메이션 시스템과의 순서를 정한다는 서술은 없다.
- 클립이 끝나는 시점은 **Animation Event**("call a function at a specific point
  in time", 인자 하나까지)나 **`OnStateExit`**("react to a state ending")로
  받는다. 후자는 **"may be invoked multiple times"**다.
- 폴링해야 하면 `GetCurrentAnimatorStateInfo(layer).normalizedTime`을 본다.
  **정수부가 반복 횟수, 소수부가 진행률**이다.
- 순서를 몰라도 되게 하려면 **`WaitForEndOfFrame`**이다. 문서가 "resume at the
  end of the frame"이라고 적는다. 단 코루틴과 비동기 작업 사이는 보장되지
  않는다.
- `ScrollRect`는 **`velocity`**를 상태로 가지고 `Elastic`은 끝에서 튕긴다.
  위치 대입은 속도를 건드리지 않으므로 **`StopMovement()`를 같이 부른다.**
- 애니메이션이 정확히 무엇을 덮었는지는 **이 기록만으로 확인할 수 없다.**
  클립의 내용이 클리핑에 없다. 추측 대신 `onValueChanged` 로그와 프로파일러
  마커가 그 자리를 메운다.

---

### 참고

- [Event function execution order — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/execution-order.html)
- [Script execution order — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/script-execution-order.html)
- [Animation Events — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/script-AnimationWindowEvent.html)
- [Canvas.ForceUpdateCanvases — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Canvas.ForceUpdateCanvases.html)
- [StateMachineBehaviour.OnStateExit — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/StateMachineBehaviour.OnStateExit.html)
- [Animator.GetCurrentAnimatorStateInfo — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetCurrentAnimatorStateInfo.html)
- [AnimatorStateInfo.normalizedTime — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AnimatorStateInfo-normalizedTime.html)
- [Scroll Rect — uGUI 2.7 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ScrollRect.html)
- [ScrollRect — uGUI 2.7 API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ScrollRect.html)
- [LayoutRebuilder — uGUI 2.7 API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)

이 글의 출발점이 된 자료는
[유니티 스크롤뷰 초기 설정 에러 기록](https://jjing-log.tistory.com/98)
(jjiing, 2023-04-24)이다. 증상과 원인, 세 가지 해결책은 원문을 그대로
따라가면서, 원문이 "정확히 모르겠다"고 적은 부분을 현행 Unity 6.6 매뉴얼과
스크립팅 레퍼런스, uGUI 2.7.0 문서 양쪽에 대조했다. 확인 시점은 2026-10-12이다.
