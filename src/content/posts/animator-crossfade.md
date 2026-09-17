---
pubDatetime: 2026-09-17T22:00:00+09:00
title: "CrossFade의 0.3f: 한쪽은 0.3초고 한쪽은 아니다"
lang: ko
translationKey: animator-crossfade
featured: false
draft: false
tags:
  - Unity
  - Animator
  - 애니메이션
  - C#
description: "2014년에 쓰인 CrossFade 설명을 확인했다. 그 글은 맞다. 다만 지금 쓰는 컴포넌트에는 같은 이름의 메서드가 따로 있고, 두 번째 인자의 단위가 다르다."
---

애니메이션 전환을 스크립트에서 부드럽게 다룰 방법을 찾다가 `CrossFade`에
닿았고, 설명이 짧고 명확해서 스크랩해뒀었다. 다시 열어보니 **2014년 6월**
글이다. 열두 해 전이다.

> CrossFade 함수는 두 가지 인수가 있음.
> 첫 번째 인수는 변경할 애니메이션 클립의 명칭.
> 두 번째 인수는 다른 애니메이션 클립으로 FadeOut되는 시간.

읽는 순간 걸리는 게 있었다. 예제가 `Animation anim;`으로 시작한다.
**`Animator`가 아니라 `Animation`이다.** 그리고 지금 Unity에서 캐릭터
애니메이션을 다루면 거의 항상 `Animator`를 쓴다.

그래서 확인해봤다. 두 컴포넌트에 **같은 이름의 메서드가 둘 다 있고**, 두 번째
인자의 **단위가 다르다.**

## 목차

## 2014년 글이 설명하는 API는 `Animation`이다

먼저 원문이 맞는지부터 봤다. 맞다.

```csharp
public void CrossFade(string animation,
                      float fadeLength = 0.3F,
                      PlayMode mode = PlayMode.StopSameLayer);
```

문서가 `fadeLength`를 이렇게 설명한다.

> 크로스페이드의 지속 시간, **초 단위**. 음수는 0초로 클램프된다.

원문의 "FadeOut되는 시간"이 정확히 이 뜻이다. 심지어 원문 예제의 `0.3f`는
**이 메서드의 기본값 그대로**다. 2014년 글이 지금도 틀리지 않았다.

문제는 다른 데 있다. 이건 **`Animation` 컴포넌트**의 메서드이고, `Animation`은
Mecanim 이전 시스템이다. 원문의 `anim.runForward.name`처럼 클립을 속성으로
꺼내 쓰는 방식도 그 시절 것이다.

## 문서 세 곳이 서로 다르게 말한다

`Animation`이 지금 어떤 상태인지 찾다가, **공식 문서 세 곳의 태도가 다른**
것을 봤다.

| 문서 | 뭐라고 하나 |
|---|---|
| 매뉴얼 — Legacy Animation component | "이 컴포넌트는 **하위 호환성을 위해** 유지된다. **새 프로젝트에서는 `Animator` 컴포넌트를 사용하라.**" |
| 매뉴얼 — Legacy Animation system | "Legacy는 **더 쓰기 쉽고 단순한 애니메이션에서 성능이 더 좋기 때문에** 여전히 제공된다." |
| 스크립팅 레퍼런스 — `Animation` | Legacy라는 표시가 **없다** |

같은 회사의 같은 시점 문서인데 하나는 "새 프로젝트에서 쓰지 마라"고 하고,
하나는 "이런 장점이 있어서 남겨뒀다"고 하고, 하나는 아무 말이 없다.

**스크립팅 레퍼런스만 보고 있으면 이게 구세대 시스템인지 알 방법이 없다.**
`Animation.CrossFade` 페이지에도 `Animator`를 가리키는 안내가 없다. 검색으로
API 페이지에 바로 떨어지는 경우가 대부분이라, 이건 실제로 헷갈릴 만한
배치다.

정리하면 이렇게 읽는 게 맞겠다. **새로 만드는 캐릭터 애니메이션은 `Animator`,
`Animation`은 이미 그걸로 만들어진 것을 유지할 때.** 매뉴얼의 컴포넌트 페이지가
가장 분명하게 말하고 있는 쪽이다.

## `0.3f`의 의미가 바뀐다

여기가 핵심이다. `Animator`에도 `CrossFade`가 있다.

```csharp
public void CrossFade(string stateName,
                      float normalizedTransitionDuration,
                      int layer = -1,
                      float normalizedTimeOffset = float.NegativeInfinity,
                      float normalizedTransitionTime = 0.0f);
```

두 번째 인자 이름이 다르다. `fadeLength`가 아니라
**`normalizedTransitionDuration`** 이다. 문서의 설명도 한 단어가 다르다.

> 트랜지션의 지속 시간(**정규화됨**).

클래스 설명도 같은 이야기를 한다 — "**정규화된 시간을 사용해** 현재 상태에서
다른 상태로 크로스페이드를 만든다."

그러니까 2014년 글을 읽고 `Animator`에 그대로 옮기면 이렇게 된다.

```csharp
// 2014년 글 — Animation 컴포넌트. 0.3f는 0.3초다.
_animation.CrossFade("Run", 0.3f);

// 같은 숫자를 Animator에 — 0.3초가 아니다.
_animator.CrossFade("Run", 0.3f);
```

**컴파일도 되고 실행도 된다.** 화면에서도 페이드가 일어난다. 다만 그 길이가
0.3초가 아니라, 상태 길이에 대한 비율이다. 애니메이션 클립이 2초면 0.6초가
되고, 0.5초짜리 클립이면 0.15초가 된다. **클립마다 전환 속도가 제각각이 되는데
숫자는 똑같이 0.3f라서 원인을 찾기 어렵다.**

한 가지 짚어둘 게 있다. API 문서는 "정규화됨"이라고만 하고 **무엇에 대해
정규화했는지는 말하지 않는다.** 애니메이터 트랜지션 인스펙터 쪽 문서에는
기준이 적혀 있다.

> **Fixed Duration** 상자가 체크되어 있지 않으면, 트랜지션 시간은 **소스
> 상태**의 정규화된 시간에 대한 비율로 해석된다.

인스펙터의 트랜지션에 대한 설명이고 `CrossFade` API 페이지의 설명은 아니다.
그래서 **API만 읽고 정확한 기준을 알 방법은 없다.**

그럴 필요도 없다. Unity가 초 단위 판을 따로 만들어뒀다.

```csharp
public void CrossFadeInFixedTime(string stateName,
                                 float fixedTransitionDuration,
                                 int layer = -1,
                                 float fixedTimeOffset = 0.0f,
                                 float normalizedTransitionTime = 0.0f);
```

> 트랜지션의 지속 시간(**초 단위**).

클래스 설명도 "**초 단위 시간을 사용해** 크로스페이드를 만든다"이다. 세 메서드를
나란히 놓으면 이렇다.

| 메서드 | 두 번째 인자 | 단위 |
|---|---|---|
| `Animation.CrossFade` | `fadeLength` | **초** |
| `Animator.CrossFade` | `normalizedTransitionDuration` | **정규화** |
| `Animator.CrossFadeInFixedTime` | `fixedTransitionDuration` | **초** |

**옛 코드나 옛 글에서 본 숫자를 옮길 때 맞는 건 `CrossFadeInFixedTime`이다.**
`Animation.CrossFade(name, 0.3f)`와 의미가 같아지는 쪽은 그쪽이다.

## 어디에 왜 쓰나

`Animator`의 전환은 보통 컨트롤러 그래프에서 파라미터로 건다. 그럼
`CrossFade`는 언제 쓰나. **그래프에 트랜지션을 만들어두기 곤란한 전환**일 때다.
피격 리액션처럼 어느 상태에서든 즉시 끼어들어야 하는 것, 또는 상태 수가 많아
간선을 다 그리면 그래프가 읽히지 않는 경우다.

### 상태 전환을 코드로 걸 때

```csharp
using UnityEngine;

/// <summary>
/// 어느 상태에서든 즉시 피격 리액션으로 전환한다.
/// </summary>
[RequireComponent(typeof(Animator))]
public class HitReaction : MonoBehaviour
{
    private const float FADE_SECONDS = 0.15f;
    private const int BASE_LAYER = 0;

    // 문자열을 매번 해싱하지 않도록 상태 해시를 캐싱한다.
    private static readonly int HIT_STATE = Animator.StringToHash("Base Layer.Hit");

    [Header("Reaction")]
    [SerializeField, Range(0.02f, 1f), Tooltip("전환에 쓰는 시간(초)")]
    private float _fadeSeconds = FADE_SECONDS;

    private Animator _animator;

    private void Awake()
    {
        _animator = GetComponent<Animator>();
    }

    public void Play()
    {
        // 정규화판이 아니라 초 단위판을 쓴다.
        // 클립 길이가 달라져도 전환 시간이 흔들리지 않는다.
        _animator.CrossFadeInFixedTime(HIT_STATE, _fadeSeconds, BASE_LAYER);
    }
}
```

문서에서 가져온 판단이 셋 있다.

- **`CrossFadeInFixedTime`을 골랐다.** 인스펙터에 초 단위로 노출할 값이라
  정규화판은 맞지 않는다. 기획자가 0.15를 넣으면 0.15초여야 한다.
- **상태 이름에 레이어를 붙였다.** 문서가 상태 이름에 부모 레이어를 포함하라고
  하고 예로 `"Base Layer.Run"`을 든다.
- **해시를 미리 계산했다.** 문서의 안내가 이렇다 — `stateName` 파라미터를 쓰면
  내부적으로 `Animator.StringToHash`를 호출하므로, **같은 이름으로 자주 호출할
  거면 해시를 미리 계산해 `stateHashName` 파라미터를 쓰라**고. 셰이더 쪽에서
  [`Shader.PropertyToID`를 캐싱한 것](/posts/unity-custom-shaders/)과 같은
  이유다.

입력을 받아 상태를 바꾸는 구조라면, 입력 쪽 수명 관리는
[InputAction을 직접 구독하기](/posts/input-action-subscribe/)에 정리해뒀다.

### 문자열 오버로드가 숨기는 것

해시 캐싱은 성능 이야기로 알려져 있는데, `CrossFade`에는 **동작이 달라지는**
지점이 하나 더 있다. 두 오버로드의 기본값이 다르다.

| 오버로드 | `normalizedTimeOffset` 기본값 |
|---|---|
| `CrossFade(string, ...)` | `float.NegativeInfinity` |
| `CrossFade(int, ...)` | `0.0f` |

**같은 파라미터인데 기본값이 다르다.** 성능 때문에 문자열판에서 해시판으로
바꾸면, 세 번째·네 번째 인자를 생략하고 있었을 경우 시간 오프셋의 기본 동작이
같이 바뀐다.

`CrossFadeInFixedTime` 쪽은 두 오버로드 모두 `fixedTimeOffset = 0.0f`로 같다.
이 점에서도 초 단위판이 덜 위험하다.

오프셋을 신경 쓰는 코드라면 **생략하지 말고 명시하는 편**이 낫다. 오버로드를
바꿔도 동작이 안 바뀐다.

### 쓰지 말아야 할 자리

- **그래프로 표현되는 전환.** 걷기 ↔ 뛰기처럼 조건이 분명한 전환은 파라미터와
  트랜지션으로 두는 쪽이 읽기 좋다. 코드로 직접 거는 건 그래프에 담기 곤란한
  경우로 한정하는 게 낫다.
- **옛 글의 숫자를 `Animator.CrossFade`에 그대로 옮기는 것.** 앞 절대로
  단위가 다르다.
- **새 프로젝트에서 `Animation` 컴포넌트.** 매뉴얼의 컴포넌트 페이지가
  `Animator`를 쓰라고 직접 적어놨다.

## 정리

- **2014년 글은 틀리지 않았다.** `Animation.CrossFade`의 `fadeLength`는 문서
  표현 그대로 "초 단위"이고, 예제의 `0.3f`는 그 메서드의 기본값이다.
- **다만 그건 Legacy 시스템의 API다.** 매뉴얼은 "하위 호환성을 위해 유지된다,
  새 프로젝트에서는 `Animator`를 쓰라"고 한다.
- **문서 세 곳의 태도가 다르다.** 매뉴얼 컴포넌트 페이지는 쓰지 말라 하고,
  매뉴얼 시스템 페이지는 장점을 들고, 스크립팅 레퍼런스에는 Legacy 표시가
  없다.
- **`Animator.CrossFade`의 두 번째 인자는 초가 아니다.** 이름부터
  `normalizedTransitionDuration`이고, 문서 설명도 "정규화됨"이다. 정작
  **무엇에 대해 정규화했는지는 API 문서가 말하지 않는다.**
- **초 단위로 쓰려면 `CrossFadeInFixedTime`.** 옛 코드의 숫자를 옮길 때
  의미가 같아지는 쪽이다.
- **상태 해시를 미리 계산한다.** 성능 때문만은 아니다. `CrossFade`는 두
  오버로드의 `normalizedTimeOffset` 기본값이 서로 다르다.

오래된 글이 위험한 건 틀려서가 아니라, **맞는 채로 다른 것을 가리키고 있기**
때문이다. 이 글의 `0.3f`는 지금도 유효한 숫자인데, 옮겨 적는 순간 다른 뜻이
된다.

---

### 참고

- [Animation.CrossFade — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Animation.CrossFade.html)
- [Animator.CrossFade](https://docs.unity3d.com/ScriptReference/Animator.CrossFade.html)
- [Animator.CrossFadeInFixedTime](https://docs.unity3d.com/ScriptReference/Animator.CrossFadeInFixedTime.html)
- [Legacy Animation component — Unity 매뉴얼](https://docs.unity3d.com/Manual/class-Animation.html)
- [Legacy Animation system](https://docs.unity3d.com/6000.2/Documentation/Manual/Animations.html)
- [Animation transitions — Fixed Duration](https://docs.unity3d.com/Manual/class-Transition.html)

이 글의 출발점이 된 자료는 [주누다 — \[Unity - 유니티\] CrossFade](https://sharkmino.tistory.com/1426)
(2014-06-02)이다. 설명 자체는 `Animation.CrossFade`의 현행 문서와 일치했고,
`Animator` 쪽 차이는 스크립팅 레퍼런스와 매뉴얼로 따로 확인했다.
