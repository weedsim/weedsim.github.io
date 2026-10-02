---
pubDatetime: 2026-10-02T16:00:00+09:00
title: "탄성과 마찰은 물체가 아니라 한 쌍이 가진 값이다"
lang: ko
translationKey: rigidbody-physics-material
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - 물리
  - C#
description: "Rigidbody와 Physics Material을 직접 돌려보며 정리한 2020년 학습 기록이다. 관찰은 좋은데 글쓴이가 끝까지 못 푼 의문이 둘 있다. 둘 다 같은 자리에서 풀린다. 탄성과 마찰은 한쪽 물체의 값이 아니라 충돌하는 두 콜라이더가 함께 만드는 값이다."
---

게임 개발 프로젝트를 진행하면서 **Rigidbody로 중력과 충돌 같은 물리 엔진을
적용해보고 싶어서** 방법을 찾던 중에 스크랩한 글이다. 2020년 "게임 개발 5일차"
라는 학습 기록이고, 중력·충돌·탄성·마찰을 **직접 값을 바꿔가며 움짤로
확인한다.** 찾던 것과 정확히 맞는 종류였다.

그리고 글쓴이가 **스스로 모르겠다고 적어둔 자리가 둘** 있다.

> 근데 가만히 보고 있다보니 공이 계속 같은 높이로 튀어 오르는 게 아니라 점점
> 올라간다
>
> 띠용,, 바닥의 탄성도 결합해서 그런 건가

> 이번에는 마찰력을 0으로 해보았다 ... 공에 의해 상자가 밀려났다가 정지했다
>
> 이거는 마찰력을 0으로 해놓고, 마찰 계산 방식을 Minumum, 최소로 해줬다
>
> 그러자 빙판길에서 밀리듯이 계속 상자가 이동한다

두 번째 의문이 특히 이상하다. **마찰을 0으로 두고 계산 방식만 바꿨는데 결과가
다르다.** 0을 어떻게 평균 내든 최소를 취하든 0일 것 같은데 안 그렇다.

둘 다 같은 자리에서 풀린다. **그 값은 물체 하나의 성질이 아니다.** 충돌하는
두 콜라이더가 각자 값을 내놓고, 그 둘을 합쳐서 한 쌍의 값을 만든다. 0을 둔
쪽만 보면 계산이 안 맞는다.

## 목차

## 관찰은 좋고, 세 군데가 틀렸다

먼저 잘 짚은 것부터. 충돌의 기준에 대한 문장이 정확하다.

> 그래서 충돌의 기준을 물체로 알고 있으면 안 된다 Collider로 알고 있어야 한다!

그리고 그걸 증명하는 방법도 좋다. 공 두 개에 Sphere Collider의 Radius를 0.5와
1로 다르게 주고 떨어뜨려서, 반지름 1인 공이 **땅에서 떠 있는** 화면을 보여준다.
눈에 보이는 공과 충돌하는 영역이 다른 것이다. 입문자에게 이보다 나은 설명이
드물다.

낙하 속도에 대한 설명도 맞다.

> 하지만 물체의 질량이 커진다고 낙하 속도가 빨라지지는 않는다
>
> 왜냐하면 낙하 시, 중력가속도라는 일정한 값을 가지기 때문이다

맞고, 왜 맞는지가 Physics 설정 문서에 한 단어로 들어 있다.

> **Gravity:** Use the x, y and z axes to set the amount of gravity applied to all
> Rigidbody components. ... Gravity is defined in world units per **seconds
> squared.**

"초당 거리"가 아니라 "초제곱당 거리"다. 가속도이므로 질량이 들어갈 자리가 없다.
질량이 영향을 주는 건 **힘을 줬을 때**이고, 그래서 글이 "질량은 힘과 관계가
있지만 낙하 속도에 영향을 미치지는 않는다"라고 쓴 것도 정확하다.

틀린 쪽은 셋이다.

**첫째, Rigidbody를 붙이면 Collider가 따라오지 않는다.** 글은 이렇게 적는다.

> Rigid body를 추가하면 **꼭 따라서 Inspector에 추가되는 애가 있는데** 얘가
> Collider이다

안 따라온다. `Rigidbody`에는 Collider를 요구하는 어트리뷰트가 없다. 문서는
이렇게 쓴다 — Rigidbody가 충돌에 반응하는 것은 **"올바른 Collider 컴포넌트가
함께 있을 때"**다. 함께 있으면 반응하고, 없으면 없다.

글쓴이가 그렇게 본 이유는 짐작된다. `GameObject > 3D Object > Sphere`로 만든
기본 도형에는 **Collider가 이미 붙어 있다.** 거기에 Rigidbody를 더하면 둘이
같이 보인다. 순서가 반대인 것이다.

이게 실제로 걸리는 자리는 **직접 만든 메시를 가져왔을 때**다. FBX를 끌어다 놓고
Rigidbody만 붙이면 Collider가 없고, 그러면 **바닥을 그냥 통과한다.** 중력은
받는데 멈출 면이 없다.

**둘째, 이름이 바뀌었다.** 2020년 글을 지금 따라가면 코드가 컴파일되지 않는다.

| 글 시점 | 현재 |
| --- | --- |
| `PhysicMaterial` | `PhysicsMaterial` |
| `Rigidbody.drag` | `Rigidbody.linearDamping` |
| `Rigidbody.angularDrag` | `Rigidbody.angularDamping` |
| `Rigidbody.velocity` | `Rigidbody.linearVelocity` |

인스펙터의 라벨도 같이 바뀌었다. 글이 "(Linear) Drag"라고 적은 칸은 지금
**Linear Damping**이다. 값의 의미는 그대로다 — 이름만 바뀌었다.

```csharp
// 2020년 글을 따라 쓰면 이렇게 된다. 지금은 컴파일되지 않는다.
PhysicMaterial bounce = new PhysicMaterial("Bounce");
_rigidbody.drag = 0.5f;
_rigidbody.angularDrag = 0.05f;
_rigidbody.velocity = Vector3.up * 5f;
```

```csharp
// 현재 이름. 의미는 위와 같다.
PhysicsMaterial bounce = new PhysicsMaterial("Bounce");
_rigidbody.linearDamping = 0.5f;
_rigidbody.angularDamping = 0.05f;
_rigidbody.linearVelocity = Vector3.up * 5f;
```

**셋째, 인스펙터에 `Gravity`라는 칸은 없다.** 글의 목록에 "Gravity: 중력"이
있는데, 실제 칸 이름은 `Use Gravity`이고 체크박스다. 중력의 크기는 오브젝트가
아니라 Physics 설정에 있다. 글 본문에서는 "Use Gravity에 체크가 되어있을 때"로
올바르게 쓰고 있으니 목록 쪽 오타로 보인다.

## 탄성과 마찰은 물체가 아니라 한 쌍의 값이다

여기가 두 번째 의문이 풀리는 자리다. 문서의 첫 문장이 전부다.

> When two colliders are in contact, the physics system uses the surface
> properties of **each collider** to calculate the **total friction and bounce
> between the two surfaces.**

두 콜라이더가 각각 값을 갖고, 물리 시스템이 그 둘로 **"두 표면 사이의" 값**을
만든다. 네 가지 계산 방식이 있고 전부 두 값을 받는다.

| Combine | 문서 설명 | 두 값이 0과 0.6이면 |
| --- | --- | --- |
| Maximum | "Use the largest of the two values." | 0.6 |
| Multiply | "Use the product of one value multiplied by the other." | 0 |
| Minimum | "Use the smallest of the two values." | 0 |
| Average | "Use the mean average of the two values; that is, the sum of both values, divided by two." | 0.3 |

이제 글쓴이가 본 화면이 계산된다. 글은 공의 물리 재질 마찰을 0으로 두고 계산
방식만 바꿨다. **바닥 쪽 값은 건드리지 않았다.** 물리 재질을 새로 만들면 마찰
기본값이 0.6이고, 바닥에 재질을 아예 안 붙였어도 값은 있다.

> **Default Material:** Set a reference to the default **Physics Material** to use
> if none has been assigned to an individual **Collider**.

콜라이더에 재질을 안 붙이면 기본 재질이 쓰인다. **"재질이 없다"와 "마찰이
없다"는 다르다.**

| 글쓴이가 한 설정 | 실제로 쓰인 값 | 본 화면 |
| --- | --- | --- |
| 공 0, 방식 Average | (0 + 0.6) / 2 = **0.3** | 상자가 밀렸다가 정지 |
| 공 0, 방식 Minimum | min(0, 0.6) = **0** | 빙판처럼 계속 미끄러짐 |

0을 평균 낸 게 아니라 **0과 0.6을 평균 낸 것**이다. 그래서 "마찰력을 0으로
했는데 상자가 멈춘다"가 모순이 아니다. 실제 마찰은 0.3이었다.

같은 이유로 글의 다른 관찰도 설명된다.

> 근데 공과 바닥이 충돌할 때 Minimum과 Multiply는 둘 다 0 이었다

바닥이든 공이든 **한쪽이 0이면** Minimum은 0이고 Multiply도 0이다. 공의 탄성을
1로 뒀으니 0인 쪽은 바닥이다. 즉 **바닥의 탄성이 0이었다**는 사실이 이 한 줄로
드러난다. 글쓴이가 "바닥의 탄성도 결합해서 그런 건가"라고 쓴 추측이 맞았는데,
확인할 방법을 못 찾은 것이다.

## 섞는 방식도 한쪽이 못 정한다

여기서 한 겹 더 들어간다. 두 콜라이더의 재질이 **서로 다른 Combine 방식**을
갖고 있으면 누구 말을 듣나.

> Unity takes **priority** into consideration when the colliders in a collider
> pair have Physic Material assets with different combine settings.

그리고 문서의 표가 우선순위 순으로 나열되어 있다 — "The properties in the table
are in priority order."

| 우선순위 | Combine |
| --- | --- |
| 1 (가장 높음) | Maximum |
| 2 | Multiply |
| 3 | Minimum |
| 4 (가장 낮음) | Average |

**내가 Average로 해뒀어도 상대가 Maximum이면 Maximum이 적용된다.** 결과값만
한 쌍이 정하는 게 아니라, 계산 방식까지 한 쌍이 정한다.

실무에서 이게 어떻게 나타나나. 바닥 재질을 Average로 만들어 씬 전체에 깔아두고,
어느 날 누가 "튀는 공"을 만들면서 공 재질을 Maximum으로 설정한다. 그 공이
닿는 모든 바닥에서 **바닥의 Average 설정이 무시된다.** 바닥을 고쳐도 안 바뀌고,
공을 찾아야 바뀐다.

기본값이 Average인 것도 이 표와 함께 읽으면 의미가 달라진다. Average는
**우선순위가 가장 낮은 값이 기본값**이다. 그래서 아무도 건드리지 않으면
Average로 가고, 누구 하나가 다른 걸 고르면 그쪽으로 끌려간다. 조용히 양보하는
기본값이다.

| 공 쪽 설정 | 바닥 쪽 설정 | 적용되는 것 |
| --- | --- | --- |
| Average | Average | Average |
| Average | Maximum | **Maximum** |
| Minimum | Average | **Minimum** |
| Minimum | Multiply | **Multiply** |
| Maximum | Multiply | **Maximum** |

## 1로 두면 에너지를 빼는 게 없다

첫 번째 의문이다. 탄성 1, Bounce Combine을 Maximum으로 두니 **공이 점점 높이
튀어 올랐다.**

두 가지가 겹친다.

먼저 Maximum이다. 앞의 표대로 **두 값 중 큰 쪽**을 쓴다. 공이 1이면 바닥이
0이어도 한 쌍의 탄성은 1이다. 그래서 글쓴이가 "바닥의 탄성도 결합해서 그런
건가"라고 의심한 건 **이 경우에는 아니다** — Maximum에서는 바닥 값이 결과에
들어가지 않는다. 그 추측이 맞았던 건 Minimum과 Multiply 쪽이었다.

다음은 1이라는 숫자다. 문서의 설명이 이렇다.

> **bounciness:** How bouncy is the surface? A value of 0 will not bounce. A value
> of 1 will bounce **without any loss of energy.**

손실이 없다. **줄이는 쪽이 하나도 없는 상태**로 둔 것이다. 매 충돌마다 들어온
속도만큼 나간다면 높이는 유지된다. 그런데 유지가 아니라 증가했다면, 어딘가에서
속도가 더해지고 있고 **그걸 깎아줄 장치가 없다**는 뜻이다.

속도를 더할 수 있는 자리가 문서에 둘 있다.

> **Default Contact Offset:** Set the distance the collision detection system uses
> to generate collision contacts. ... This is set to 0.01 by default.

> **Default Max Depenetration Velocity:** Define the default value for the maximum
> depenetration velocity (**the velocity that the solver can set to a body while
> trying to pull it out of overlap** with the other bodies).

물리는 고정 간격으로 한 칸씩 전진한다. 한 칸 안에서 공이 바닥에 조금 파묻히면,
솔버가 꺼내주면서 **속도를 준다.** 탄성이 1보다 작으면 그 여분이 다음 충돌에서
깎여 사라지는데, 1이면 깎이지 않고 남는다. 남은 게 쌓이면 높이가 올라간다.

다만 **"탄성 1이 에너지를 더한다"는 문장을 유니티 문서에서 찾지는 못했다.**
위 세 인용을 이어붙인 추론이다. 확실한 결론은 하나다 — **1은 상한이 아니라
경계다.** 1보다 작게 두면 매 충돌에서 조금씩 빠지고, 그 "조금"이 시뮬레이션을
안정하게 만든다. 0.9와 1의 차이는 10%가 아니라 **수렴과 발산의 차이다.**

반대쪽 관찰도 설명된다. Average로 두면 "다시 튀어 오르는 정도가 반씩 줄어든다"고
글이 적었는데, 그 공은 결국 멈춘다. 멈추는 이유는 탄성만이 아니다.

> **Bounce Threshold:** Set a velocity value. **If two colliding objects have a
> relative velocity below this value, they do not bounce off each other.** This
> value also reduces jitter, so it is not recommended to set it to a very low
> value.

속도가 이 값 아래로 내려가면 **튕김 자체가 꺼진다.** 탄성 0.5로 무한히 작게
튀는 게 아니라, 어느 선에서 딱 멈춘다. 그리고 문서가 그 이유를 적어뒀다 —
떨림을 줄이는 장치라서 너무 낮추면 안 된다.

## 무게가 아니라 솔버의 분류다

글의 마지막 실험이다. 상자를 두 가지로 놓고 공을 굴린다 — Rigidbody가 없는
상자, Rigidbody를 붙이고 Is Kinematic을 켠 상자. 밀려난 세기가 달랐고, 글쓴이가
이렇게 추측한다.

> 내 생각에는 **Rigid body를 넣음으로 상자가 무게를 가지게 되었고**, 이게
> 결과의 차이를 만든 것 같다

**무게는 아니다.** `isKinematic` 문서를 보면 질량이 들어갈 자리가 없다.

> Controls whether physics affects the rigidbody. ... **Forces, collisions or
> joints will not affect the rigidbody anymore.**

힘도 충돌도 이 바디를 움직이지 못한다. 질량이 얼마든 결과가 같다. 그러면서도
상대는 밀어낸다.

> kinematic bodies ... **affect the motion of other rigidbodies through collisions
> or joints**

Rigidbody가 아예 없는 상자도 마찬가지다. 문서는 그걸 **static collider**라고
부른다.

> **Static colliders:** The GameObject has a collider but no Rigidbody.

그리고 둘 다 움직이는 공과는 충돌하고 메시지도 보낸다. 문서의 조합표에서 두
줄만 뽑으면 이렇다.

| 한쪽 | 다른쪽 | 결과 |
| --- | --- | --- |
| Static collider | Dynamic (Rigidbody) | 충돌하고 메시지가 간다 |
| Kinematic | Dynamic (Rigidbody) | 충돌하고 메시지가 간다 |
| Static collider | Kinematic | **충돌 메시지가 가지 않는다** |
| Static collider | Static collider | **충돌 메시지가 가지 않는다** |
| Kinematic | Kinematic | **충돌 메시지가 가지 않는다** |

그래서 글쓴이가 본 "밀려난 세기의 차이"가 질량에서 온 게 아닌 건 분명하다.
다만 **그 차이가 무엇에서 왔는지는 글만으로 알 수 없다.** 두 상자의 콜라이더
크기와 중심, 공의 속도, 재질이 같았는지가 화면으로는 확인되지 않는다. 글이
"크기와 거리, 공의 무게를 같게 해줬다"고 적었지만 물리 재질은 언급이 없고,
앞 절에서 본 대로 **재질이 한 쌍으로 섞이므로 상자 쪽 재질이 바뀌면 결과가
바뀐다.**

진짜로 외워둘 차이는 표의 아래 세 줄이다. **둘 다 static이거나 둘 다
kinematic이면 충돌 메시지가 오지 않는다.** 문 두 짝을 kinematic으로 만들어
놓고 서로 부딪히는 걸 감지하려 하면 `OnCollisionEnter`가 한 번도 불리지 않는다.
그게 무게보다 자주 발목을 잡는다.

## 어디에 왜 쓰나

### 튀는 공 하나

공이 바닥에서 **일정한 높이로** 계속 튀게 만들고 싶다고 하자. 탄성 1로 두면
안 되는 이유를 앞에서 봤다. 설정은 이렇게 간다.

| 어디 | 값 | 이유 |
| --- | --- | --- |
| 공 재질 Bounciness | 0.8 | 1은 경계다. 아래로 둔다 |
| 공 재질 Bounce Combine | Maximum | 바닥이 무엇이든 공이 정한다 |
| 바닥 재질 Bounciness | 0 | Maximum이므로 결과에 안 들어간다 |
| Physics 설정 Bounce Threshold | 기본값 유지 | 낮추면 떨림이 생긴다 |

Bounce Combine을 Maximum으로 두는 게 요점이다. 앞 절의 우선순위 표대로 **공
쪽이 바닥 쪽 설정을 이긴다.** 바닥이 스무 종류여도 공 하나만 보면 된다.

높이를 유지해야 한다면 탄성에 기대지 말고 코드로 보충한다.

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class ConstantBouncer : MonoBehaviour
{
    private const float TARGET_SPEED = 6f;
    private const float SPEED_TOLERANCE = 0.2f;

    [Header("Bounce")]
    [SerializeField, Range(0f, 1f), Tooltip("재질의 Bounciness보다 이 값을 믿는다")]
    private float _bounciness = 0.8f;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        // Rigidbody는 Collider를 데려오지 않는다. 둘 다 있는지 확인한다.
        _rigidbody = GetComponent<Rigidbody>();

        if (!TryGetComponent(out Collider _))
        {
            Debug.LogError($"{name}에 Collider가 없다. Rigidbody만으로는 바닥을 통과한다.");
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        // 닿은 면의 법선 방향으로 목표 속도를 다시 세운다.
        // 재질의 탄성이 깎아낸 만큼을 여기서 보충하므로 발산하지 않는다.
        Vector3 normal = collision.GetContact(0).normal;
        float incoming = _rigidbody.linearVelocity.magnitude;

        if (incoming < TARGET_SPEED - SPEED_TOLERANCE)
        {
            _rigidbody.linearVelocity = normal * TARGET_SPEED;
        }
    }
}
```

`linearVelocity`라고 쓴 게 앞 절의 이름 변경이다. 2020년 글의 코드를 그대로
옮기면 `velocity`가 되고, 지금은 컴파일되지 않는다.

탄성 1로 두고 발산하게 놔두는 대신 0.8로 깎고 코드로 되돌리는 쪽이 안전하다.
**깎는 쪽이 솔버 안에 있고 더하는 쪽이 내 코드 안에 있으면**, 이상해질 때 어디를
볼지 분명해진다.

### 미끄러운 바닥과 안 미끄러운 바닥

빙판 구역을 만든다고 하자. 흔한 실수가 **빙판 바닥의 마찰만 0으로 두는 것**이다.
앞 절의 계산대로, 플레이어 재질이 0.6이고 바닥이 0이면 Average에서는 0.3이다.
미끄럽지 않다.

두 가지 중 하나를 골라야 한다.

| 방법 | 설정 | 주의 |
| --- | --- | --- |
| 바닥이 결정한다 | 빙판 재질: 마찰 0, Friction Combine **Minimum** | 플레이어 값이 얼마든 0이 된다 |
| 양쪽을 맞춘다 | 플레이어 마찰도 낮춘다 | 빙판 아닌 바닥에서도 미끄러워진다 |

앞쪽이 낫다. Minimum은 Average보다 우선순위가 높으므로, **플레이어 재질이
Average여도 빙판 위에서는 Minimum이 적용된다.** 바닥 하나만 만들면 끝난다.

반대 방향도 같은 수법이다. 절대 미끄러지면 안 되는 경사면이라면 그 면의 재질을
마찰 1, Friction Combine **Maximum**으로 둔다. 어떤 물체가 올라와도 그 면이
이긴다.

```csharp
public static class TagNames
{
    public const string PLAYER = "Player";
}
```

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 빙판 구역에 들어간 동안만 재질을 바꾼다.
/// 재질을 교체하는 쪽이 Rigidbody의 damping을 만지는 것보다 예측하기 쉽다.
/// </summary>
[RequireComponent(typeof(Collider))]
public class SlipperyZone : MonoBehaviour
{
    [Header("Materials")]
    [SerializeField, Tooltip("마찰 0, Friction Combine은 Minimum으로 만들 것")]
    private PhysicsMaterial _iceMaterial;

    // 나갈 때 되돌려야 한다. 들어온 콜라이더마다 원래 재질을 기억한다.
    private readonly Dictionary<Collider, PhysicsMaterial> _originals = new();

    private void OnTriggerEnter(Collider other)
    {
        if (!other.CompareTag(TagNames.PLAYER) || _originals.ContainsKey(other))
        {
            return;
        }

        // 문서: Collider.material을 읽으면 공유 재질을 복제한다.
        //       에셋 참조만 바꾸려는 것이므로 sharedMaterial을 쓴다.
        _originals[other] = other.sharedMaterial;
        other.sharedMaterial = _iceMaterial;
    }

    private void OnTriggerExit(Collider other)
    {
        if (!_originals.TryGetValue(other, out PhysicsMaterial original))
        {
            return;
        }

        other.sharedMaterial = original;
        _originals.Remove(other);
    }
}
```

`sharedMaterial`을 쓴 이유가 문서에 있다.

> **Collider.material:** The material used by the collider. **If material is shared
> by colliders, it will duplicate the material and assign it to the collider.**

`material`을 읽는 순간 에셋이 복제된다. 여기서 하려는 일은 **"어느 에셋을
가리킬지"를 바꾸는 것**이므로 복제가 필요 없다. 반대로 이 콜라이더만의 값을
조금 비틀고 싶다면 `material` 쪽이 맞다.

> **Collider.sharedMaterial:** The shared physics material of this collider.
> **Modifying this material will change the surface properties of all colliders
> using the material.** In most cases you want to modify Collider.material
> instead.

재질이 `Collider`에 붙어 있다는 게 중요하다. 글이 "Rigid body에 Physics
Material을 추가해줘야 한다"라고 썼는데, 실제로 재질 칸이 생기는 곳은 글 자신이
다음 문장에서 적은 대로 **Collider**다.

> 그러면 Collider 칸에 Material 값이 추가가 된다

### 쓰지 말아야 할 자리

**플레이어 이동을 마찰로 만들기.** 마찰은 접촉면이 생긴 뒤에 계산된다. 공중에
있는 프레임에는 적용되지 않고, 경사면에서는 법선이 기울어 결과가 달라진다.
걷고 멈추는 느낌을 마찰로 조율하려 하면 **값 하나가 지형마다 다르게 동작한다.**
이동은 속도를 직접 다루고, 마찰은 "미끄러운 구역" 같은 국소 효과에 쓴다.

**탄성 1.** 앞에서 본 그대로다. 문서가 "without any loss of energy"라고 적은
값이고, 깎는 장치가 없으면 쌓이는 쪽으로 간다.

**Bounce Threshold를 낮춰서 작은 튕김을 살리기.** 문서가 직접 말린다 — "This
value also reduces jitter, so it is not recommended to set it to a very low
value." 아주 작은 튕김을 살리면 떨림도 같이 살아난다.

**두 kinematic 사이의 충돌을 감지하려는 것.** 조합표의 마지막 줄이다. 메시지가
오지 않는다. 한쪽을 dynamic으로 만들거나, 트리거와
[`Physics.OverlapSphere`](/posts/physics-overlapsphere/) 같은 질의로 직접 재는
쪽으로 간다.

**Is Kinematic으로 "고정"을 표현하기.** 움직이지 않는 장애물이라면 Rigidbody를
아예 안 붙이는 쪽이 싸다. static collider는 솔버의 동적 집합에 들어가지 않는다.
Is Kinematic은 **"스크립트나 애니메이션이 직접 옮긴다"**는 선언이고, 안 옮길
거라면 선언할 이유가 없다. 축만 묶고 싶다면
[`RigidbodyConstraints`](/posts/rigidbody-constraints/) 쪽이다.

## 정리

이 글은 입문자가 값을 직접 돌려보고 화면으로 확인한 기록이다. 충돌 영역이
물체가 아니라 Collider라는 걸 반지름 두 개로 보여준 부분은 지금 봐도 좋은
설명이고, 질량이 낙하 속도를 바꾸지 않는다는 결론도 정확하다.

틀린 셋은 짧다. **Rigidbody는 Collider를 데려오지 않는다** — 기본 도형에 이미
붙어 있었을 뿐이고, 직접 만든 메시에서는 바닥을 통과한다. 그리고 `PhysicMaterial`
과 `drag`, `velocity`는 이름이 바뀌었다.

남겨둔 의문 둘은 같은 자리에서 풀린다. **탄성과 마찰은 물체 하나의 값이
아니다.** 문서의 표현대로 두 콜라이더의 값으로 "두 표면 사이의" 값을 만들고,
그래서 **마찰 0과 기본값 0.6을 평균 내면 0.3이다.** 재질을 안 붙인 콜라이더도
기본 재질의 값을 갖는다. 그리고 섞는 방식까지 한 쌍이 정한다 — Maximum >
Multiply > Minimum > Average 순으로 우선순위가 있고, 기본값인 Average가 가장
낮다.

탄성 1이 발산한 쪽은 조금 다르게 읽힌다. Maximum이니 바닥 값은 들어가지 않았고,
1은 **깎는 장치를 꺼둔 값**이다. 솔버가 겹침을 풀면서 주는 속도를 되돌릴 방법이
없으니 쌓인다. 유니티 문서가 그 과정을 직접 설명하지는 않으므로 추론이지만,
결론은 추론이 아니다 — **1은 상한이 아니라 경계다.**

---

### 참고

- [Physics Material 컴포넌트 레퍼런스 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-PhysicsMaterial.html)
- [How collider surface values combine — Unity 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/collider-surfaces-combine.html)
- [Physics 설정 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-PhysicsManager.html)
- [Colliders 개요 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/CollidersOverview.html)
- [Interaction between collider types — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/collider-types-interaction.html)
- [Collider.material — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Collider-material.html)
- [Collider.sharedMaterial — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Collider-sharedMaterial.html)
- [Rigidbody — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody.html)
- [Rigidbody.isKinematic — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-isKinematic.html)
- [PhysicsMaterial.bounciness — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/PhysicsMaterial-bounciness.html)

이 글의 출발점이 된 자료는 [뉴터 — \[게임 개발 5일차\] 유니티(unity) 물리엔진 적용하기(중력, 충돌, 탄성, 마찰), Rigid body!](https://m.blog.naver.com/haran3056/222033199454)
(2020-07-18)이다. 글쓴이가 직접 돌려본 설정과 관찰, 그리고 끝까지 못 푼 두
의문을 현행 Unity 매뉴얼과 스크립팅 레퍼런스에 대조했다.
