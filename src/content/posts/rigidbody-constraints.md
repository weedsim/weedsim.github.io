---
pubDatetime: 2026-09-11T18:00:00+09:00
title: "FreezePositionY가 얼리는 건 월드 Y다"
lang: ko
translationKey: rigidbody-constraints
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - 물리
  - C#
description: "RigidbodyConstraints를 정리한 글을 매뉴얼과 대조했다. 열거형 멤버 넷이 빠져 있고, 어느 축을 기준으로 얼리는지가 없고, 비트 연산 설명이 두 군데 어긋난다."
---

Rigidbody를 공부하던 중에 `RigidbodyConstraints`를 정리한
[글](https://coding-shop.tistory.com/318)을 스크랩해뒀었다. 여섯 개 옵션을
나열하고 `|` 연산자로 묶는 예시까지 붙여둔 짧은 글이라 훑기 좋다.

매뉴얼과 대조해봤다. **열거형 멤버 넷이 빠져 있고**, 그중 하나는 원문 예제를
세 줄에서 한 줄로 줄여준다. 그리고 더 중요한 게 하나 빠져 있다. **"X축 회전을
동결한다"고 할 때 그 X가 어느 X인지**가 글에 없다.

하나 더, 원문과 별개로 짚어둘 게 있다. 옵션 목록과 `|` 예시만으로는 **이걸
어디에 왜 쓰는지가 안 그려진다.** 그래서 실제로 손이 가는 자리 네 개를 코드와
함께 먼저 적어두고, 정정은 그다음에 이어간다.

## 목차

## 표에 없는 넷

원문이 다루는 멤버는 여섯 개다. `FreezeRotationX/Y/Z`와
`FreezePositionX/Y/Z`. 그리고 "추가 정보"에서 `None`을 한 줄 언급한다.

실제 열거형은 **열 개**다. 나머지 넷이 이렇다.

| 멤버 | 매뉴얼의 정의 |
| --- | --- |
| `None` | "No constraints." |
| `FreezePosition` | "Freeze motion along all axes. Equivalent of `FreezePositionX \| FreezePositionY \| FreezePositionZ`." |
| `FreezeRotation` | "Freeze rotation along all axes. Equivalent of `FreezeRotationX \| FreezeRotationY \| FreezeRotationZ`." |
| `FreezeAll` | "Freeze rotation and motion along all axes. Equivalent of `FreezePosition \| FreezeRotation`." |

**매뉴얼이 "Equivalent of"라고 적어둔 그 조합이, 원문 예제가 손으로 쓰고 있는
바로 그것이다.** 원문의 두 번째 예시를 보자.

```csharp
// 원문: X, Y, Z축 회전 동결
rigid.constraints = RigidbodyConstraints.FreezeRotationX
                  | RigidbodyConstraints.FreezeRotationY
                  | RigidbodyConstraints.FreezeRotationZ;

// 같은 것
rigid.constraints = RigidbodyConstraints.FreezeRotation;
```

인스펙터의 Constraints 항목에서 Freeze Rotation의 X·Y·Z를 다 체크하는 것과
같다. 캐릭터가 넘어지지 않게 하는 가장 흔한 설정이 이거라서, **실무에서 제일
자주 쓰는 멤버가 목록에서 빠져 있는 셈이다.**

## 어디에 왜 쓰나

제약이 필요해지는 순간은 대개 하나다. **물리로 굴리고는 싶은데, 물리가
마음대로 하면 곤란한 축이 있을 때.** 전부 직접 계산하면(키네마틱) 충돌
반응이 사라지고, 전부 맡기면 의도하지 않은 방향으로 굴러간다. 제약은 그
사이에 선을 긋는 도구다.

### 1. 캐릭터가 넘어지지 않게

제일 흔하다. 캡슐 콜라이더에 Rigidbody를 붙여 걷게 만들면, 벽에 부딪히거나
경사를 밟는 순간 캐릭터가 넘어진다. 물리 입장에서는 당연한 반응인데 게임
입장에서는 버그다.

**목적** — 충돌 반응과 중력은 그대로 받되, 회전은 내 스크립트만 정한다.

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerBody : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField, Range(1f, 20f), Tooltip("회전 속도(도/초)")]
    private float _turnSpeed = 360f;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();

        // 물리가 캐릭터를 눕히지 못하게 한다. 이동은 그대로 물리에 맡긴다
        _rigidbody.constraints = RigidbodyConstraints.FreezeRotation;
    }

    // 회전은 내가 돌린다. 제약은 시뮬레이션에만 걸리므로 이건 막히지 않는다
    public void TurnTowards(Vector3 direction)
    {
        if (direction.sqrMagnitude < 0.001f) return;

        Quaternion target = Quaternion.LookRotation(direction, Vector3.up);
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation, target, _turnSpeed * Time.deltaTime);
    }
}
```

`FreezeRotation` 하나로 세 축이 다 잠긴다. 그리고 **`transform.rotation`
대입은 여전히 먹힌다** — 뒤에서 다루겠지만 제약은 시뮬레이션에만 걸리기
때문이다. 이 조합이 "물리로 밀리되 넘어지지는 않는" 캐릭터를 만든다.

### 2. 3D 물리로 2.5D 만들기

매뉴얼이 직접 언급하는 용도다.

> The constraints can be combined using bitwise OR operations **for cases like
> 2D game development.**

3D 씬에 3D 모델과 3D 물리를 쓰면서 게임플레이는 한 평면에서만 일어나게 하는
구성이다. 깊이(Z)로 새어나가지 않게 묶는다.

**목적** — 3D 에셋과 조명을 쓰면서 판정은 2D처럼 단순하게 유지한다.

```csharp
// X-Y 평면에서만 논다. 깊이 이동과 화면 밖으로 기울어지는 회전을 막는다
_rigidbody.constraints = RigidbodyConstraints.FreezePositionZ
                       | RigidbodyConstraints.FreezeRotationX
                       | RigidbodyConstraints.FreezeRotationY;
```

카메라를 향한 축(Z) 회전은 남겨뒀다. 넘어지는 연출이나 굴러가는 상자에는 그게
필요하다. 아예 안 돌아도 되면 `FreezePositionZ | FreezeRotation`이면 된다.

참고로 처음부터 2D로 갈 거라면 `Rigidbody2D`에 `RigidbodyConstraints2D`가 따로
있다. 멤버가 여섯 개뿐이고, 여기서 `FreezeRotation`의 정의가
"Freeze rotation **along the Z-axis**"다. 2D에서 회전축은 하나뿐이니 축별로
나뉘지 않는다.

### 3. 집었다 놓는 오브젝트

퍼즐이나 시뮬레이션에서 물체를 집어 옮기는 동작이다. 집는 동안에는 물리가
간섭하면 안 되고, 놓는 순간에는 다시 물리로 떨어져야 한다.

**목적** — 잡고 있는 동안만 물리를 멈추고, 놓으면 원래대로 돌려놓는다.

```csharp
public class Grabbable : MonoBehaviour
{
    private Rigidbody _rigidbody;
    private RigidbodyConstraints _originalConstraints;
    private bool _isHeld;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();

        // 원래 설정을 기억해둔다. 이 물체에 이미 다른 제약이 걸려 있을 수 있다
        _originalConstraints = _rigidbody.constraints;
    }

    public void Grab(Transform holder)
    {
        if (_isHeld) return;

        _isHeld = true;
        _rigidbody.constraints = RigidbodyConstraints.FreezeAll;
        transform.SetParent(holder);
    }

    public void Release()
    {
        if (!_isHeld) return;

        _isHeld = false;
        transform.SetParent(null);

        // None으로 되돌리지 않는다. 원래 걸려 있던 것을 복원한다
        _rigidbody.constraints = _originalConstraints;
    }
}
```

여기서 `Release()`가 `RigidbodyConstraints.None`을 대입하지 않는 게 요점이다.
그 물체에 원래 `FreezePositionY` 같은 게 걸려 있었다면 놓는 순간 조용히
풀린다. **끄는 코드는 켜기 전 상태를 기억해야 한다.**

### 4. 한 축으로만 도는 물체

문, 레버, 회전 발판처럼 축 하나로만 도는 것들이다.

**목적** — 제자리에서 한 축으로만 돌게 한다.

```csharp
// 제자리 고정 + Y축 회전만 허용
_rigidbody.constraints = RigidbodyConstraints.FreezePosition
                       | RigidbodyConstraints.FreezeRotationX
                       | RigidbodyConstraints.FreezeRotationZ;
```

다만 이 자리는 **경계선**이다. 문에 필요한 게 회전 제한만이 아니라 "0도에서
90도 사이"라는 각도 범위, 경첩 위치, 스프링 같은 것이라면 제약으로는 안 된다.
그때는 `HingeJoint`다. **제약은 축을 통째로 잠그거나 풀거나 둘 중 하나**이고,
중간값을 다루지 못한다. 그 선을 넘어가는 순간 조인트로 갈아타는 게 맞다.

### 쓰지 말아야 할 자리

- **각도나 거리의 범위를 제한하고 싶을 때** — 제약은 켜기/끄기뿐이다. 조인트가
  할 일이다.
- **오브젝트의 로컬 축 기준으로 묶고 싶을 때** — 바로 다음 절의 이유 때문에
  안 된다.
- **물리를 아예 안 쓸 때** — 전부 스크립트로 움직인다면 `isKinematic`이 더
  단순하다. 제약을 다 거는 것과 키네마틱은 다른 얘기다.

## 어느 축인가 — 위치는 월드, 회전은 관성 공간

원문의 설명은 전부 "X축 회전을 동결합니다" 형태다. **기준 축이 무엇인지가
없다.** 매뉴얼은 `Rigidbody.constraints` 쪽에 한 문장으로 적어뒀다.

> Note that position constraints are applied in **World space**, and rotation
> constraints are applied in the **inertia space** (relative to
> `Rigidbody.inertiaTensorRotation`).

| 제약 | 기준 공간 |
| --- | --- |
| 위치(`FreezePosition*`) | **월드 공간** |
| 회전(`FreezeRotation*`) | **관성 공간** (`inertiaTensorRotation` 기준) |

**둘이 다르다.** 그리고 둘 다 오브젝트의 로컬 축이 아니다.

위치 쪽이 실무에서 먼저 걸린다. 오브젝트를 45도 돌려놓고
`FreezePositionY`를 걸면, 얼어붙는 건 **그 오브젝트가 위라고 여기는 방향이
아니라 월드의 Y축**이다. 기울어진 발판 위를 미끄러지는 물체를 "자기 기준
위아래로만" 묶으려고 이걸 쓰면 의도대로 안 된다. 로컬 축 기준으로 묶고 싶으면
제약이 아니라 조인트(`ConfigurableJoint`)의 영역이다.

회전 쪽은 더 미묘하다. 로컬도 월드도 아닌 **관성 텐서 방향** 기준이라, 콜라이더
구성이 비대칭이면 내가 생각한 축과 어긋날 수 있다. 대부분의 경우 — 캡슐
콜라이더 하나 붙인 캐릭터처럼 — 차이를 못 느끼지만, **"왜 Z만 살짝 도는지"
같은 증상이 나오면 여기를 의심할 자리**가 된다.

이 한 문장이 없으면 "동결한다"는 설명이 로컬 기준으로 읽힌다. 그게 기본
직관이기 때문이다.

## 비트 연산 설명이 두 군데 어긋난다

**첫째,** "추가 정보"의 이 줄이다.

> 여러 옵션을 함께 사용하려면 **| 또는 &** 연산자를 사용합니다.

**`&`로는 합칠 수 없다.** `|`는 켜는 연산이고 `&`는 걸러내는 연산이다.
`FreezeRotationX & FreezeRotationY`는 겹치는 비트가 없으니 결과가 `None`이다.
원문 자신의 코드가 이걸 보여준다.

```csharp
rigid.constraints |= RigidbodyConstraints.FreezeRotationX;   // 추가
rigid.constraints &= ~RigidbodyConstraints.FreezeRotationY;  // 제거
```

`&`가 쓰인 자리는 **제거**이고, 그것도 `~`와 짝이다. 요약 줄과 예제가 서로
다른 말을 한다. 셋으로 갈라 적으면 이렇게 된다.

- 합치기 — `|`
- 빼기 — `&= ~`
- 켜져 있는지 보기 — `&` 뒤에 `!= 0` 또는 `HasFlag`

**둘째,** "비트 마스크 활용"이라는 별도 항목이다.

```csharp
int mask = (int)RigidbodyConstraints.FreezeRotationX | (int)RigidbodyConstraints.FreezeRotationY;
rigid.constraints = (RigidbodyConstraints)mask;
```

**바로 위 예시와 완전히 같은 코드다.** C#에서 열거형끼리 `|`를 쓰면 이미
비트 OR이 일어난다. `int`로 내렸다가 되올리는 두 번의 캐스팅이 하는 일이
없다. 별개의 기법처럼 항목을 세워두면, 읽는 사람은 **뭔가 다른 상황에 쓰는
방법이라고 오해**한다. 실제로는 같은 것을 길게 쓴 버전이다.

## 컴파일되지 않는 줄

"기존 제약 유지" 블록만 변수 이름이 다르다.

```csharp
// 원문
rigidbody.constraints |= RigidbodyConstraints.FreezeRotationX;
```

나머지 예제는 전부 `rigid`인데 여기만 `rigidbody`다. 두 가지로 읽히고
**어느 쪽이든 컴파일되지 않는다.**

앞의 예제에서 이어지는 변수라면 이름이 틀렸다. 그게 아니라 `MonoBehaviour`가
제공하던 `rigidbody` 단축 속성을 가리킨 거라면, **그건 없어졌다.** 현재 Unity
스크립팅 API 문서에 `Component.rigidbody` 페이지가 없다(404). Unity 5.x 문서에는
남아 있는 걸 보면 그 무렵 정리된 속성이다.

지금 기준으로 쓰면 이렇게 된다.

```csharp
[SerializeField]
private Rigidbody _rigidbody;

private void Awake()
{
    if (_rigidbody == null && TryGetComponent(out Rigidbody body))
    {
        _rigidbody = body;
    }
}

private void FreezeHorizontalDrift()
{
    _rigidbody.constraints |= RigidbodyConstraints.FreezePositionX;
}
```

원문의 `Rigidbody rigid = GetComponent<Rigidbody>();`도 동작은 하지만,
매 프레임 도는 자리에서 부르면 안 되는 호출이라 참조는 `Awake`에서 잡아두는
편이 낫다.

## 제약은 시뮬레이션에만 건다

원문의 "활용 방법"에 "오브젝트 고정: 오브젝트가 특정 위치에서 움직이지
않도록 제어"가 있다. 맞는 말인데 범위가 정해져 있다. `Rigidbody.constraints`
매뉴얼의 첫 문장이다.

> Controls which degrees of freedom are allowed for **the simulation** of this
> Rigidbody.

**시뮬레이션에 거는 제약이다.** 물리가 밀어서 움직이는 걸 막는 것이지,
스크립트에서 `transform.position`에 값을 대입하는 것까지 막지 않는다.
`FreezeAll`을 걸어놓고도 트랜스폼을 직접 쓰면 오브젝트는 움직인다. "고정"이라는
말로 기대할 법한 것과 실제 범위가 여기서 갈린다.

같은 성질의 속성이 하나 더 있는데 원문에 없다. `Rigidbody.freezeRotation`이다.

> Controls whether **physics** will change the rotation of the object.

회전 전체를 막는 `bool` 스위치라 `FreezeRotation`과 목적이 겹친다. 매뉴얼이
1인칭 게임에서 마우스로 직접 회전을 다룰 때의 용도로 소개한다. 둘 다 있다는 걸
알아두면 기존 코드를 읽을 때 헷갈리지 않는다.

## 그래도 쓸모 있는 것

**기존 제약을 유지하며 켜고 끄는 패턴**이 이 글에서 제일 실용적인 부분이다.
변수 이름만 고치면 그대로 쓸 수 있다.

```csharp
// 지금 걸린 것을 유지한 채 하나 추가
_rigidbody.constraints |= RigidbodyConstraints.FreezeRotationX;

// 하나만 해제
_rigidbody.constraints &= ~RigidbodyConstraints.FreezeRotationY;

// 전부 해제
_rigidbody.constraints = RigidbodyConstraints.None;
```

대입(`=`)과 추가(`|=`)를 구분해 보여준 것도 좋다. 다른 시스템이 이미 제약을
걸어둔 상태에서 `=`로 덮어쓰면 그쪽 설정이 조용히 사라지는데, 그 차이를
예제로 갈라둔 자료가 의외로 드물다.

**활용 예시**도 결이 맞는다. 캐릭터 회전 제한, 오브젝트 고정, 움직임 제한을
이용한 퍼즐 — 실제로 제약을 쓰는 자리들이다.

## 정리

- 쓰는 자리는 넷이다. **넘어지지 않는 캐릭터**(`FreezeRotation`),
  **3D로 만드는 2.5D**, **집었다 놓기**(원래 값 복원), **한 축 회전체**. 각도
  범위가 필요해지면 그때는 조인트다.
- 열거형 멤버는 **열 개**다. 원문이 다루지 않은 `FreezePosition`,
  `FreezeRotation`, `FreezeAll`이 매뉴얼에 "Equivalent of"로 정의돼 있고,
  **원문 예제의 세 줄 OR이 `FreezeRotation` 한 줄이다.**
- **위치 제약은 월드 공간, 회전 제약은 관성 공간**(`inertiaTensorRotation`
  기준)이다. 둘 다 오브젝트의 로컬 축이 아니다. 로컬 축으로 묶으려면 조인트
  쪽이다.
- **`&`로는 제약을 합칠 수 없다.** 합치기는 `|`, 빼기는 `&= ~`, 확인은 `&`
  뒤에 비교다.
- **"비트 마스크 활용" 예시는 바로 위 예시와 같은 코드다.** `int` 캐스팅이
  하는 일이 없다.
- `rigidbody.constraints` 줄은 **컴파일되지 않는다.** 변수 이름이 틀렸거나,
  없어진 `Component.rigidbody`를 가리킨다.
- **제약은 시뮬레이션에 건다.** `transform`을 직접 쓰는 건 막지 않는다.
  회전만 막는 `Rigidbody.freezeRotation`도 따로 있다.
- `|=`와 `&= ~`로 기존 제약을 유지하며 켜고 끄는 패턴은 그대로 쓸 만하다.

열거형을 정리한 글에서 빠지기 쉬운 게 **조합 멤버**다. 개별 값을 나열하는 건
쉬운데, `FreezeRotation`처럼 여러 비트를 미리 묶어둔 멤버는 목록을 훑다가
지나치기 쉽다. 그런데 실무에서 손이 가는 건 대개 그쪽이다.

그리고 **"어느 축인가"는 열거형 이름만 봐서는 절대 알 수 없는 정보**다.
`FreezePositionY`라는 이름 어디에도 월드인지 로컬인지가 없다. 이름이 자명해
보일수록 한 번 더 문서를 봐야 하는 자리다.

## 참고

- [RigidbodyConstraints — Unity 스크립팅 API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/RigidbodyConstraints.html)
- [Rigidbody.constraints — Unity 스크립팅 API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-constraints.html)
- [Rigidbody.freezeRotation — Unity 스크립팅 API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-freezeRotation.html)
- 원문: [RigidbodyConstraints : 회전과 위치 제어](https://coding-shop.tistory.com/318)
