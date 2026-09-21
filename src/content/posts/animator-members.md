---
pubDatetime: 2026-09-21T20:20:00+09:00
title: "IK Pass가 꺼져 있으면 IK 함수 여섯 개가 전부 무음이다"
lang: ko
translationKey: animator-members
featured: false
draft: false
tags:
  - Unity
  - Animator
  - 애니메이션
  - C#
description: "Animator의 프로퍼티와 함수를 정리한 2021년 공부 노트를 현행 문서와 대조했다. 설명은 정확한데, 적힌 스위치를 무효로 만드는 조건 쪽이 비어 있다. 세 군데가 그랬다."
---

IK를 코드로 제어할 방법을 찾다가 스크랩해둔 2021년 글이다. `Animator`의
프로퍼티와 함수를 모아뒀는데, 스스로 "공부하면서 알게된 것만 정리합니다"라고
적어둔 노트치고 **서술이 꼼꼼하다.** 시그니처를 같이 적고 인수마다 의미를
풀어놨으며, IK 함수도 여섯 개가 들어 있다.

나흘 전에 [CrossFade 글](/posts/animator-crossfade/)을 쓰면서 2014년 자료의
단위 문제를 짚었는데, **그 답이 이 클리핑에 이미 있었다.** 그 이야기부터
짧게 하고 넘어간다.

그다음이 본론이다. 이 노트는 **켜는 스위치**를 잘 적어뒀는데, **그 스위치를
무효로 만드는 조건**이 세 군데 비어 있다. 셋 다 "코드를 불렀는데 아무 일도
안 일어나는" 모양이고, **찾던 IK가 그중 하나였다.**

## 목차

## 나흘 전 글의 답이 여기 있었다

`CrossFade`의 두 번째 인수를 이 노트는 이렇게 설명한다.

> 두 번째 인수: 지연 시간 (다음 애니메이션으로 바뀌는데 걸리는 fade 시간)
> **0.1f 라면 바뀔 애니메이션의 10 %는 부드럽게 애니메이션이 이어지는데
> 쓴다.**

**비율이라는 걸 정확히 알고 있다.** 2014년 자료가 같은 자리를 "FadeOut되는
시간"이라고 적어 초 단위로 읽히게 했던 것과 대조적이다. 같은 이름의 메서드를
두고 쓰인 시점이 7년 차이인데, 뒤쪽이 정확하다.

다만 한 칸이 더 남는다. 이 노트는 **"바뀔 애니메이션의 10%"** 라고 해서
**도착 상태**를 기준으로 말한다. 그런데 애니메이터 트랜지션 인스펙터 문서의
기준은 반대다.

> **Fixed Duration** 상자가 체크되어 있지 않으면, 트랜지션 시간은 **소스
> 상태**의 정규화된 시간에 대한 비율로 해석된다.

그쪽은 인스펙터의 트랜지션 설명이고 `CrossFade` API 페이지는 "정규화됨"이라고만
할 뿐 기준을 말하지 않는다. 그러니 **"비율이 맞다"까지는 확실하고, "무엇에
대한 비율인가"는 API 문서만으로 못 정한다.** 초 단위가 필요하면
`CrossFadeInFixedTime`을 쓰면 되는 이유가 여전히 여기 있다.

노트의 두 번째 예제도 눈여겨볼 만하다.

```csharp
anim.CrossFade("ATTACK", 0.1f, -1, 0f); // layer -1 , 반복 재생.(0초로 돌아감)
```

네 번째 인수 `0f`를 **굳이 적어준** 것이다. 앞 글에서 확인했듯 `CrossFade`는
오버로드마다 `normalizedTimeOffset` 기본값이 다르다 — 문자열판이
`float.NegativeInfinity`, 해시판이 `0.0f`. 문자열로 호출하면서 0을 원한다면
**정말로 적어줘야 한다.** 생략하면 기본값이 다르다.

## IK 함수 여섯 개가 전제하는 것

이 노트에서 제일 긴 부분이 IK이고, 내가 찾던 것도 이것이었다.
`SetIKPositionWeight`, `SetIKRotationWeight`, `SetLookAtWeight`,
`SetIKPosition`, `SetIKRotation`, `SetLookAtPosition` — 여섯 개를 시그니처와
함께 정리해뒀다. 설명도 맞다.

빠진 건 **어디서 부르는가**와 **무엇이 켜져 있어야 하는가**다.

`OnAnimatorIK` 문서가 후자를 못 박는다.

> IK를 처리하려는 **애니메이터 컨트롤러 레이어에 IK Pass 옵션이 활성화되어
> 있어야 한다.**

그리고 전자에 대해서는 이렇게 설명한다.

> 애니메이션 IK(역운동학) 설정을 위한 **콜백**. 이 콜백은 IK 목표의 위치와
> 각각의 가중치를 설정하는 데 쓸 수 있다.

`SetIKPositionWeight` 같은 개별 함수 페이지에는 "여기서만 불러야 한다"는
문장이 **없다.** 다만 `OnAnimatorIK` 문서의 예제가 네 함수를 전부 그 콜백
안에서 부르고, 설명 자체가 "IK 설정을 위한 콜백"이다. 그러니 정확히는
**문서가 금지한 게 아니라 그 자리를 전제로 쓰여 있다**고 보는 게 맞겠다.

실무에서 문제가 되는 건 **IK Pass 쪽**이다. 이건 코드가 아니라 **애니메이터
컨트롤러의 레이어 설정**에 있는 체크박스다. 꺼져 있으면 여섯 함수를 다
불러도 **예외도 경고도 없이 아무 일이 안 일어난다.** 코드를 아무리 들여다봐도
원인이 안 보이는 자리다.

목록만 보고 `Update`에서 `SetIKPosition`을 부르는 게 자연스러운 첫 시도인데,
그 시도는 조용히 실패한다.

## `applyRootMotion`을 무시하는 함수가 있다

노트의 프로퍼티 항목은 하나, `applyRootMotion`이다.

> `true` 로 해주면 루트 모션을 켜준다.

맞는 설명이다. 문서의 요약도 "루트 모션을 적용해야 하는가?"다. 그런데 문서에
단서가 하나 붙어 있다.

> 스크립트가 **`MonoBehaviour.OnAnimatorMove` 함수를 구현하면**
> `applyRootMotion`은 **효과가 없다.**

여기도 같은 모양이다. **프로퍼티를 `true`로 해뒀는데 캐릭터가 안 움직인다면,
같은 오브젝트 어딘가에 `OnAnimatorMove`가 있는지부터 봐야 한다.** 인스펙터의
체크박스는 여전히 켜져 있으니 그쪽을 보고 있으면 원인이 안 나온다.

루트 모션을 직접 제어하려고 `OnAnimatorMove`를 구현해놓고 나중에 잊는
경우가 흔하다. 그 순간부터 `applyRootMotion`은 표시만 남고 아무것도 안 한다.

## `SetTrigger`만 적혀 있고 `ResetTrigger`는 없다

노트는 파라미터 관련 함수를 두 묶음으로 정리한다 — `SetFloat`·`SetBool`·
`SetInteger`·`SetTrigger`, 그리고 `GetFloat`·`GetBool`·`GetInteger`.
`SetFloat`의 감쇠 오버로드까지 잡아냈다.

```csharp
SetFloat("Horizontal Move", moveInput.x * animationSpeedPercent, 0.05f, Time.deltaTime);
```

문서의 선언과 맞는다.

```csharp
public void SetFloat(string name, float value, float dampTime, float deltaTime);
```

그런데 `Set` 묶음에 `ResetTrigger`가 없다. 그리고 트리거는 **다른 파라미터와
성질이 다르다.** 문서가 이렇게 적는다.

> 같은 `true`/`false` 선택지를 가진 `bool`과 달리, `Trigger`는 **자동으로
> `false`로 되돌아가는** `true` 옵션을 가진다.

"자동으로 되돌아간다"까지는 적혀 있는데, **언제 되돌아가는지는 안 적혀
있다.** 대신 Unity가 `ResetTrigger`를 따로 두고 그 용도를 이렇게 설명한다.

> 애니메이터 컨트롤러에서 **아직 활성 상태일 수 있는** 트리거 파라미터를
> 초기화할 때 사용한다.

**"아직 활성 상태일 수 있는"** 이 핵심이다. 쏜 트리거가 어떤 트랜지션에도
소비되지 않으면 남아 있고, 나중에 조건이 맞는 순간 **의도하지 않은 시점에**
발동한다. 공격 도중에 눌린 회피 입력이 공격이 끝나자마자 튀어나오는 식이다.

문서의 예제도 새 트리거를 쏘기 전에 경쟁 관계의 트리거를 먼저 리셋한다.
목록에 `SetTrigger`만 있으면 이 짝이 안 보인다.

## 어디에 왜 쓰나

세 항목이 전부 **"코드는 맞는데 아무 일도 안 일어난다"** 로 수렴한다. 그래서
실제로 쓸 때는 전제 조건을 코드 옆에 남겨두는 편이 낫다.

### IK를 실제로 켜는 최소 형태

```csharp
using UnityEngine;

/// <summary>
/// 오른손을 목표 지점에 붙이고 시선을 그쪽으로 돌린다.
/// 애니메이터 레이어의 IK Pass가 켜져 있어야 동작한다.
/// </summary>
[RequireComponent(typeof(Animator))]
public class HandIK : MonoBehaviour
{
    [Header("Target")]
    [SerializeField, Tooltip("손이 붙을 목표. 비우면 IK를 적용하지 않는다")]
    private Transform _target;

    [Header("Weights")]
    [SerializeField, Range(0f, 1f), Tooltip("1에 가까울수록 IK가 강하게 적용된다")]
    private float _positionWeight = 1f;

    [SerializeField, Range(0f, 1f), Tooltip("시선 가중치")]
    private float _lookWeight = 0.8f;

    private Animator _animator;

    private void Awake()
    {
        _animator = GetComponent<Animator>();
    }

    // IK 함수는 이 콜백 안에서 부른다. layerIndex는 IK Pass가 켜진 레이어다.
    private void OnAnimatorIK(int layerIndex)
    {
        if (_target == null)
        {
            // 가중치를 0으로 내려 원래 애니메이션으로 되돌린다.
            _animator.SetIKPositionWeight(AvatarIKGoal.RightHand, 0f);
            _animator.SetLookAtWeight(0f);
            return;
        }

        _animator.SetIKPositionWeight(AvatarIKGoal.RightHand, _positionWeight);
        _animator.SetIKPosition(AvatarIKGoal.RightHand, _target.position);

        _animator.SetLookAtWeight(_lookWeight);
        _animator.SetLookAtPosition(_target.position);
    }
}
```

몇 가지 의도를 적어둔다.

- **전제 조건을 주석과 요약에 적었다.** IK Pass는 코드에 안 보이는 설정이라,
  이 컴포넌트를 나중에 보는 사람이 먼저 확인할 수 있어야 한다.
- **목표가 없으면 가중치를 0으로 내린다.** 문서가 가중치를 "0 = IK 이전의 원래
  애니메이션, 1 = 목표 지점"으로 설명한다. 그냥 `return`하면 직전 프레임의
  가중치가 남는다.
- **`_target == null` 비교를 썼다.** `Transform`은 Unity 오브젝트라 `==`
  오버로드를 타야 한다. 여기에 `?.`를 쓰면 안 된다.
- **가중치에 `[Range(0f, 1f)]`를 붙였다.** 다만 이건 인스펙터에서만 막아준다.
  코드로 대입하는 값까지 막으려면 따로 손을 대야 하는데, 그 이야기는
  [애트리뷰트 쪽 글](/posts/unity-attributes/)에 정리해뒀다.

### 트리거를 안전하게 쏘기

경쟁 관계인 트리거들은 **쏘기 전에 정리한다.**

```csharp
private static readonly int ATTACK = Animator.StringToHash("Attack");
private static readonly int DODGE = Animator.StringToHash("Dodge");

public void Attack()
{
    // 남아 있을지 모르는 반대쪽 트리거를 먼저 내린다.
    _animator.ResetTrigger(DODGE);
    _animator.SetTrigger(ATTACK);
}

public void Dodge()
{
    _animator.ResetTrigger(ATTACK);
    _animator.SetTrigger(DODGE);
}
```

**해시를 미리 계산한 건 습관이 아니라 이유가 있다.** 문자열 오버로드는 호출할
때마다 해싱한다. 애트리뷰트 쪽에서 `[Range]` 경계를 `const`로 뺀 것과 같은
결의 정리다.

### 쓰지 말아야 할 자리

- **`Update`에서 IK 함수 호출.** 문서가 금지하지는 않지만, 그 자리를 전제로
  쓰인 API가 아니다. `OnAnimatorIK`가 제자리다.
- **`applyRootMotion`만 믿는 것.** 같은 오브젝트에 `OnAnimatorMove`가 있으면
  효과가 없다.
- **`SetTrigger`를 짝 없이 쓰는 것.** 소비되지 않은 트리거는 남는다.
- **`Play`로 전환을 대신하는 것.** 노트의 설명이 정확하다 — `Play`는 "뚝뚝
  끊기듯" 바뀐다. 블렌딩이 필요하면 `CrossFade` 계열이다.

## 정리

- **2021년 노트는 `CrossFade`의 두 번째 인수를 비율로 정확히 이해했다.** 다만
  "바뀔 애니메이션의 10%"라고 해서 도착 상태를 기준으로 말하는데, 트랜지션
  문서의 기준은 **소스 상태**다. API 문서만으로는 못 정한다.
- **IK 함수 여섯 개는 레이어의 IK Pass를 전제한다.** 꺼져 있으면 예외도
  경고도 없이 무음이다. 호출 위치는 `OnAnimatorIK`다.
- **`applyRootMotion`은 `OnAnimatorMove`가 구현되어 있으면 효과가 없다.**
  인스펙터 체크박스는 그대로 켜져 있으므로 거기서는 원인이 안 보인다.
- **트리거는 소비되지 않으면 남는다.** 문서가 `ResetTrigger`를 "아직 활성
  상태일 수 있는" 트리거용으로 둔 이유다. 경쟁 트리거는 쏘기 전에 내린다.
- **`SetFloat`에는 감쇠 오버로드가 있다.** 노트가 잡아낸 그대로
  `(name, value, dampTime, deltaTime)`이다.

목록형 자료의 약점이 여기서 분명해진다. **함수 하나를 한 줄로 적으면 그 함수가
무엇을 하는지는 남지만, 무엇이 갖춰져 있어야 그 일이 일어나는지는 안 남는다.**
이 노트가 특히 꼼꼼한데도 그랬으니, 목록을 읽을 때 전제 조건은 따로 찾아야
한다는 쪽이 맞겠다.

---

### 참고

- [MonoBehaviour.OnAnimatorIK — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/MonoBehaviour.OnAnimatorIK.html)
- [Animator.SetIKPositionWeight](https://docs.unity3d.com/ScriptReference/Animator.SetIKPositionWeight.html)
- [Animator.applyRootMotion](https://docs.unity3d.com/ScriptReference/Animator-applyRootMotion.html)
- [Animator.SetTrigger](https://docs.unity3d.com/ScriptReference/Animator.SetTrigger.html)
- [Animator.ResetTrigger](https://docs.unity3d.com/ScriptReference/Animator.ResetTrigger.html)
- [Animator.SetFloat](https://docs.unity3d.com/ScriptReference/Animator.SetFloat.html)
- [Animator.Play](https://docs.unity3d.com/ScriptReference/Animator.Play.html)
- [Animation transitions — Fixed Duration](https://docs.unity3d.com/Manual/class-Transition.html)

이 글의 출발점이 된 자료는 [공부하는 식빵맘 — Animation 관련 컴포넌트들과 프로퍼티/함수 모음](https://ansohxxn.github.io/unitydocs/anim/)
(2021-01-17)이다. 항목 구성을 따라가며 현행 스크립팅 레퍼런스와 대조했다.
