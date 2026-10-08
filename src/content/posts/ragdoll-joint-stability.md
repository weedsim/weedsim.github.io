---
pubDatetime: 2026-10-08T19:30:00+09:00
title: "늘어나는 래그돌을 붙잡는 건 Strength가 아니라 projection이다"
lang: ko
translationKey: ragdoll-joint-stability
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - 물리
  - 시뮬레이션
  - C#
description: "래그돌 사용법 글이 엿가락처럼 늘어나는 몸을 Strength 값 탓으로 설명한다. 그런데 Strength는 유니티 매뉴얼 어디에도 설명이 없고, 늘어남에는 전용 페이지가 따로 있다. 그 페이지가 지목하는 것은 다른 것이다."
---

캐릭터가 죽을 때 **정해진 사망 모션을 재생하는 대신 물리로 쓰러지게**
하고 싶었다. 그래야 죽을 때마다 쓰러지는 모양이 달라진다. 방법을 찾다
래그돌을 알게 되어 사용법 글을 스크랩해뒀다. 원문은 2024년에 올라온 재게시
글이고, 본문에 밝혀진 원출처는 베르의 글이다. 마법사를 열어 본을 끼우고,
Total Mass를 45로 두고, 몸통 리지드바디에 `AddForce`를 가해 캐릭터를
날려보내는 데까지 사진으로 따라간다. 절차는 지금도 그대로 통한다.

문제는 설명이 붙은 딱 한 군데다. 글은 `Strength` 값을 이렇게 소개한다.

> Strength 값은 래그돌이 모양을 유지하고 붕괴되지 않도록 도와주는 힘에 대한
> 값이다.

그리고 이어서 증상을 하나 진단한다.

> 래그돌이 적용된 게임에서 종종 사망한 캐릭터의 몸이 엿가락처럼 늘어나서
> 마구 흔들리는 문제는 이 Strength 값이 낮아서 발생하는 문제이다.

이 두 문장의 출처를 찾아보려고 매뉴얼을 뒤졌는데, **`Strength`를 설명하는
문서를 찾지 못했다.** 4.5 레거시 문서, 2018.3, 6.3 LTS, 현행 6.6까지 네
판을 열어봤고 네 판 모두 그 칸을 설명하지 않는다.

그런데 "엿가락처럼 늘어나서 마구 흔들리는 문제"는 유니티가 **전용 페이지**를
따로 두고 다루고 있다. 그 페이지가 지목하는 것은 `Strength`가 아니다.

확인한 것은 다섯 가지다. **`Total Mass`와 `Strength`는 매뉴얼에 설명이
없다**, **늘어남의 처방은 `enableProjection`이고 그 처방에는 명시된 대가가
있다**, **질량 비율 10배가 흔들림의 기준선이다**, **`AddForce`가 조용히
아무 일도 안 하는 경우가 둘 있다**, 그리고 **문서가 권하는 사망 처리는
오브젝트 교체가 아니다**.

마지막 항목이 목표와 직접 걸린다. 쓰러지는 모양을 매번 다르게 만들려면
애니메이션에서 물리로 넘기는 **그 한 프레임**이 있어야 하는데, 앞의 네
항목이 전부 그 프레임에서 터진다.

이 블로그에 물리 글이 몇 개 있다.
[FreezePositionY가 얼리는 건 월드 Y다](/posts/rigidbody-constraints/)는
Rigidbody 제약을, [탄성과 마찰은 물체가 아니라 한 쌍이 가진
값이다](/posts/rigidbody-physics-material/)는 충돌하는 두 콜라이더가 함께
만드는 값을 다뤘다. 이 글은 **조인트로 묶인 리지드바디 떼가 서로를 못 붙잡고
있을 때**의 이야기다. 다만 다른 글로 넘기지는 않는다. 필요한 설명과 예제
코드는 여기서 다시 전부 싣는다.

확인 시점은 **2026-10-08**이고, 기준은 Unity **6.6**이다. 6.6이 현재
Supported 최신판이고, 6.7은 Beta, 6.3이 LTS다. 아래 인용은 6.6 기준이며
6.3에서도 같은 문장을 확인했다.

## 목차

## 마법사가 만드는 건 콜라이더·리지드바디·조인트 셋이다

먼저 마법사가 무엇을 만드는지부터. 메뉴 경로는 매뉴얼에 그대로 적혀 있다.

> Select GameObject > 3D Object > Ragdoll… from the menu bar.

원문은 Hierarchy 뷰에서 우클릭해 `3D Object > Ragdoll...`로 들어갔는데,
같은 메뉴다. 그리고 만들어지는 것은 세 종류다.

> Unity can then generate all colliders, rigidbody components, and joints
> that make up a ragdoll

**콜라이더, 리지드바디, 조인트.** 세 번째가 이 글의 주인공이다. 조인트는
`CharacterJoint`이고, 매뉴얼이 그 축에 이름을 붙여둔다.

> For character joints made with the Ragdoll wizard, the following naming
> scheme applies:

표에서 `Twist`는 "Twists the limb."이고 `Swing 1`은 "Limb's largest swing
axis."다. 즉 래그돌 하나는 **리지드바디 10여 개가 `CharacterJoint`로 사슬처럼
묶인 구조물**이다. 몸이 "늘어난다"는 말은 그 사슬의 고리가 벌어졌다는
뜻이다.

가져오기 설정에 대한 주의도 한 줄 있다.

> If needed, disable Generate Colliders in the Import Settings dialog.

원문이 T자 자세를 권한 부분은 매뉴얼에서 근거를 찾지 못했다. 이 페이지에는
포즈에 대한 언급이 없다. 경험에서 나온 조언일 수 있고, 틀렸다는 뜻은
아니다. 다만 **문서가 보증하는 내용은 아니다.**

## Total Mass와 Strength는 매뉴얼에 설명이 없다

마법사 창에는 본을 끼우는 칸들 말고 숫자 칸이 두 개 있다. 원문은 둘 다
설명한다.

> Total Mass 값은 래그돌의 무게를 정하는 값이다. 이 값을 정해주면 사람의
> 평균적인 부위별 무게 비율에 맞춰 각 본들의 무게가 정해진다.

네 판의 매뉴얼에서 이 두 칸을 찾아봤다.

| 문서 | `Total Mass` | `Strength` |
| --- | --- | --- |
| 6.6 (현행 Supported) | 설명 없음 | 설명 없음 |
| 6.3 LTS | 설명 없음 | 설명 없음 |
| 2018.3 | 설명 없음 | 설명 없음 |
| 4.5 (레거시) | 설명 없음 | 설명 없음 |

6.6의 "Create a ragdoll" 페이지가 칸에 대해 하는 말은 끌어다 넣으라는
것뿐이다. 본을 다 끼우고 만들면 인스펙터에 무엇이 보이는지를 알려주고
("The inspector displays the following components:" — Skinned Mesh Renderer,
Box Collider, Rigidbody), 거기서 끝난다.

**그래서 원문의 Total Mass 설명도, Strength 설명도 1차 출처가 없다.** 둘 다
틀렸다고 말하는 게 아니다. **확인할 수 없다**는 말이다. 특히 "사람의 평균적인
부위별 무게 비율"은 그럴듯하지만 그 비율표가 어디에도 공개되어 있지 않다.

여기서 할 수 있는 일은 하나다. **만든 다음에 숫자를 직접 읽는 것.** 마법사가
끝나면 본마다 Rigidbody가 붙고, 각 Rigidbody의 `Mass` 칸에 실제로 들어간
값이 보인다. 추측할 필요가 없다. 다음 절이 그 숫자를 왜 봐야 하는지에 대한
이야기다.

## 늘어남에는 전용 페이지가 따로 있다

"엿가락처럼 늘어난다"는 증상을 유니티는 **Joint and ragdoll stability**라는
페이지에서 다룬다. 래그돌 문서 트리의 형제 페이지다. 이 페이지에 늘어남이
그대로 적혀 있다.

> This can result in stretching.

솔버가 극한 상황에서 래그돌을 붙잡는 데 실패하면 늘어난다는 것이고, 처방이
바로 뒤에 붙는다.

> enable projection on the Joints using either ConfigurableJoint.projectionMode
> or CharacterJoint.enableProjection.

**`Strength`가 아니라 `enableProjection`이다.** 마법사는
`CharacterJoint`를 만들므로 이쪽이 해당한다.

같은 페이지에 증상별로 다른 처방이 더 있다. 원문이 한 문장에 뭉쳐놓은
"늘어나서 마구 흔들리는"은 문서에서는 **서로 다른 세 증상**이다.

| 증상 | 문서가 지목하는 처방 |
| --- | --- |
| 늘어남 (stretching) | 조인트에 projection을 켠다 |
| 조인트가 분리되거나 제멋대로 움직임 | preprocessing을 끈다 |
| 연결된 리지드바디가 떨림 (jitter) | Default Solver Iterations를 올린다 |
| 튕김이 부정확함 | Default Solver Velocity Iterations를 올린다 |
| 서로 파고든 상태로 시작함 | `Rigidbody.maxDepenetrationVelocity`를 낮춘다 |

떨림에 대한 숫자는 구체적으로 적혀 있다.

> increasing the Default Solver Iterations value to between 10 and 20

분리와 제멋대로 움직임에 대한 처방은 이렇다.

> Disabling preprocessing can help prevent Joints from separating or moving
> erratically

이 처방은 한 겹 더 파보면 설명이 비어 있다. `Joint.enablePreprocessing`의
스크립팅 레퍼런스는 **플래그가 켜져 있을 때** 무슨 일이 일어나는지만 적는다.

> Toggle preprocessing for this joint.

> When the flag is set, PhysX would ignore constraints that produce huge
> impulses

끄면 어떻게 되는지는 그 페이지에 없다. 기본값도 적혀 있지 않다. 매뉴얼은
"끄면 도움이 된다"고 하고, API 페이지는 "켜져 있으면 이렇게 동작한다"고만
한다. **둘을 이어붙여 추론할 수는 있지만, 그 추론을 문서가 적어준 건
아니다.** 이 글에서는 그 선까지만 말하겠다.

그리고 각도에 대한 주의가 하나 더 있다.

> Avoid small Joint angles of Angular Y Limit and Angular Z Limit.

아주 좁은 각도 제한은 불안정하니, 아예 잠그고 싶으면 0으로 두라는 쪽이다.

## projection은 공짜가 아니다

`enableProjection`을 켜면 끝인가. 스크립팅 레퍼런스가 그 대가를 명시한다.

> public bool enableProjection;

> Brings violated constraints back into alignment even when the solver fails.

솔버가 실패해도 어긋난 제약을 제자리로 되돌린다 — 그래서 늘어남이 잡힌다.
그런데 다음 문장이 중요하다.

> Projection is not a physical process and does not preserve momentum or
> respect collision geometry.

**물리적 과정이 아니고, 운동량을 보존하지 않고, 콜리전 지오메트리를 존중하지
않는다.** 그러니까 projection은 물리를 더 잘 푸는 게 아니라 **결과를 손으로
끌어다 맞추는 것**이다. 팔이 벽을 뚫고 제자리로 돌아올 수 있다는 뜻이다.
문서의 권고도 미묘하다.

> It is best avoided if practical, but can be useful in improving simulation
> quality

> where joint separation results in unacceptable artifacts.

"가능하면 피하는 게 낫다"가 먼저 온다. 즉 순서가 있다. **먼저 늘어나는
원인을 없애고**(질량 비율, 스케일, 솔버 반복 횟수), 그래도 눈에 거슬리는
분리가 남을 때 **마지막 수단으로** projection을 켠다. 원문처럼 `Strength`
하나로 설명하면 이 순서가 보이지 않는다.

## 질량 비율 10배가 흔들림의 기준선이다

늘어남의 원인 쪽에서 가장 먼저 볼 숫자가 질량이다. 같은 stability 페이지가
기준선을 숫자로 준다.

> It's okay to have one Rigidbody with twice as much mass as another,

> when one mass is ten times larger than the other, the simulation can become
> jittery.

**2배는 괜찮고 10배면 떨린다.** 이게 앞 절의 "숫자를 직접 읽어라"가 걸리는
지점이다. Total Mass를 45로 두면 마법사가 그 45를 본들에 쪼개 넣는데, 몸통과
손목이 몇 배 차이로 갈리는지는 만들어보기 전에 알 수 없다. **만든 뒤에 각
Rigidbody의 `Mass`를 훑어서 최대/최소 비율을 보는 것**이 실제로 할 수 있는
확인이다.

그리고 비율은 Total Mass 값과 무관하다는 점도 같이 봐야 한다. 45를 90으로
올려도 **비율은 그대로**다. 전체를 무겁게 해서 떨림이 잡히지 않는 이유가
이것이다.

스케일에 대한 주의도 같은 페이지에 있다.

> Try to avoid scaling different from 1 in the Transform containing Rigidbody
> or the Joint.

캐릭터 모델을 임포트한 뒤 Transform 스케일로 크기를 맞춰둔 프로젝트가
흔한데, 래그돌을 붙이는 순간 이 줄이 걸린다.

마지막으로 조인트로 묶인 바디를 코드로 움직일 때의 금지 사항이 하나 있다.

> Never use direct Transform access with Kinematic Rigidbody components
> connected by Joints

## kg은 맞다. 다만 적힌 곳이 한쪽뿐이다

원문이 Total Mass를 45로 정하면서 근거로 댄 문장은 이것이다.

> 유니티에서 말하는 Mass 값의 기본 단위는 1값이 1kg이라고 하기 때문에

**이건 맞다.** 그리고 출처가 한 군데 있다. Rigidbody **컴포넌트 레퍼런스**가
적는다.

> Define the mass of the GameObject (in kilograms).

> Mass is set to 1 by default.

재미있는 건 같은 내용을 **스크립팅 레퍼런스에서는 찾을 수 없다**는 것이다.
`Rigidbody.mass` 페이지가 하는 말은 이렇다.

> The mass of the rigidbody.

> Different Rigidbodies with large differences in mass can make the physics
> simulation unstable.

단위가 없다. 대신 질량 차이가 시뮬레이션을 불안정하게 만든다는 경고가 있고,
**숫자는 없다.** 숫자(2배/10배)는 stability 페이지에만 있다. 세 페이지를 다
열어야 하나의 그림이 되는 구조다.

이 글에서 매뉴얼과 스크립팅 레퍼런스를 짝으로 본 이유가 이것이다. 한쪽만
보면 단위를 모르거나 기준선을 모른 채 끝난다.

## AddForce가 조용히 아무 일도 안 하는 경우가 둘 있다

원문의 코드는 이렇다. 주석까지 원문 그대로다.

```csharp file="RagDollPhysics.cs (원문)"
using UnityEngine;

public class RagDollPhysics: MonoBehaviour
{
    [SerializeField]
    Rigidbody spineRigidBody;

    // Update is called once per frame
    void Update ()
    {
        if(Input.GetKeyDown(KeyCode.Space))
        {
            spineRigidBody.AddForce(new Vector3(0f, 10000f, 10000f));
        }
    }
}
```

돌아가는 코드다. 다만 `AddForce` 레퍼런스에 **힘이 그냥 무시되는 조건이 둘**
적혀 있고, 둘 다 래그돌에서 실제로 밟는다.

> Also, the Rigidbody cannot be kinematic.

> If a GameObject is inactive, AddForce has no effect.

첫째, **키네마틱이면 안 된다.** 애니메이션으로 캐릭터를 움직이다가 죽는
순간 래그돌로 넘기는 구조라면 본의 리지드바디들은 그때까지 키네마틱이다.
`isKinematic = false`로 돌리기 **전에** `AddForce`를 부르면 아무 일도
일어나지 않는다. 에러도 경고도 없다.

둘째, **오브젝트가 비활성이면 효과가 없다.** 원문이 뒤에서 권하는 "래그돌
오브젝트를 따로 만들어두고 액티브를 켜서 교체한다" 패턴이 바로 이 조건을
건드린다. 켜는 것과 힘을 주는 것의 순서가 중요해진다.

힘의 모드도 짚어둘 만하다. 선언부가 기본값을 보여준다.

> public void AddForce(Vector3 force, ForceMode mode = ForceMode.Force);

기본은 `ForceMode.Force`다. 그리고 적용 시점이 이렇다.

> The physics system applies the effects during the next simulation run

`ForceMode.Force`는 **다음 시뮬레이션 스텝까지 누적되는 지속력**이다. 그런데
원문 코드는 `Update`에서 부른다. `Update`는 프레임마다, 시뮬레이션은 고정
스텝마다 돈다. 한 번 누른 `GetKeyDown`은 한 프레임에만 참이니 이 코드는
한 번만 부르고 끝나므로 결과적으로는 동작하는데, **같은 자리에 "누르고 있는
동안" 류의 조건을 넣으면 프레임레이트에 따라 한 스텝에 누적되는 호출 수가
달라진다.** 순간적으로 날려보내려는 의도라면 `ForceMode.Impulse`가 의도를
그대로 적는 방법이다.

참고로 힘을 주면 잠들어 있던 바디는 깨어난다.

> By default the Rigidbody's state is set to awake once a force is applied

## 문서가 권하는 건 오브젝트 교체가 아니다

원문은 마지막에 운용 패턴을 하나 권한다.

> 이런 래그돌 오브젝트를 만들어둔 다음, 애니메이션이 포함된 일반 캐릭터가
> 정상적으로 움직이다가 캐릭터가 죽으면 일반 캐릭터 오브젝트의 액티브를
> 끄고 래그돌 오브젝트의 액티브를 켜서 교체하는 식으로 자주 사용된다.

널리 쓰이는 패턴이고 장점도 있다. 다만 **유니티 문서가 적어둔 방법은
이게 아니다.** `Rigidbody.isKinematic`의 스크립팅 레퍼런스가 래그돌을
이름으로 언급하며 다른 방법을 권한다.

> Kinematic rigidbodies are also particularly useful for making characters
> which are normally driven by an animation,

> but on certain events can be quickly turned into a ragdoll by setting
> isKinematic to false.

**오브젝트를 하나로 두고 `isKinematic`을 뒤집는다.** 같은 페이지의 예제가
두 메서드로 그 전환을 보여주는데, 뒤집는 값이 하나가 아니라 둘이다.
`EnableRagdoll()`은 `rb.isKinematic = false`와 `rb.detectCollisions = true`를
같이 두고 주석을 이렇게 달아놨다.

> Let the rigidbody take control and detect collisions.

반대쪽 `DisableRagdoll()`은 `rb.isKinematic = true`와
`rb.detectCollisions = false`에 이렇게 적어뒀다.

> Let animation control the rigidbody and ignore collisions.

키네마틱이 무엇을 끊는지도 같은 페이지에 있다.

> If isKinematic is enabled, Forces, collisions or joints will not affect the
> rigidbody anymore.

**힘도 충돌도 조인트도 끊긴다.** 그래서 애니메이션 중에는 조인트가 아무 일도
하지 않고, `isKinematic = false`가 되는 순간 조인트 사슬이 한꺼번에 일을
시작한다. 이 전환 프레임이 앞 절들에서 본 늘어남과 떨림이 가장 잘 터지는
자리다.

한 가지는 그 예제에도 없다. **`Animator`를 끄는 줄이 없다.** 예제는 주석으로
"animation control"이라고만 쓰고 애니메이션 컴포넌트를 건드리지 않는다.
`Animator`를 켠 채로 `isKinematic = false`를 하면 애니메이터가 계속 본
Transform에 값을 쓰려 하고 물리도 같은 Transform을 쓴다. 아래 예제에서는
`Animator`를 명시적으로 끈다. **문서에 없는 줄이므로 추론임을 밝혀둔다.**

오브젝트 교체 쪽을 택한다면 비활성화가 무엇을 하는지는 따로 알아둘 필요가
있다. [SetActive(false)는 코루틴을 멈추는 게 아니라
끝낸다](/posts/unity-object-pooling/)에 그 이야기를 적어뒀다.

마지막으로 원문의 성능 조언이다.

> 래그돌의 성능은 캐릭터의 사지 전체와 몸통의 관절에 대한 물리를 모두
> 계산해야하기 때문에 조금은 무거운 편에 속한다.

방향은 맞다. 그리고 "몇 초 뒤에 물리 계산을 끈다"는 조언은 문서상
**`isKinematic = true`로 돌리는 것**이 그 수단이다. 위 인용대로 힘·충돌·조인트
전부가 끊기니, 계산을 멈추는 가장 직접적인 스위치다.

## 어디에 왜 쓰나

### 동작하는 예제

문서가 권하는 쪽, 즉 **오브젝트 하나 + `isKinematic` 전환**으로 짠다. 본
리지드바디들을 모아두고 한꺼번에 뒤집는다.

```csharp file="Scripts/Character/RagdollController.cs"
using UnityEngine;

public class RagdollController : MonoBehaviour
{
    // 순간적으로 날려보내는 힘. ForceMode.Impulse 기준이다.
    private const float DeathImpulse = 12f;

    [Header("참조")]
    [Tooltip("비워두면 Awake에서 자식에서 모아온다")]
    [SerializeField]
    private Rigidbody[] _boneBodies;

    [SerializeField]
    private Rigidbody _spineBody;

    [Header("전환")]
    [Tooltip("래그돌로 넘어간 뒤 물리를 끄기까지의 시간(초)")]
    [SerializeField]
    private float _settleSeconds = 4f;

    private Animator _animator;
    private bool _isRagdoll;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("Animator가 없다.", this);
        }

        if (_boneBodies == null || _boneBodies.Length == 0)
        {
            _boneBodies = GetComponentsInChildren<Rigidbody>();
        }

        // 살아 있는 동안은 애니메이션이 Transform을 쓴다.
        SetRagdoll(false);
    }

    public void Die(Vector3 direction)
    {
        if (_isRagdoll)
        {
            return;
        }

        SetRagdoll(true);

        // 키네마틱을 푼 '뒤'에 힘을 준다. 순서를 뒤집으면 무시된다.
        if (_spineBody != null)
        {
            _spineBody.AddForce(direction.normalized * DeathImpulse,
                                ForceMode.Impulse);
        }

        Invoke(nameof(FreezeRagdoll), _settleSeconds);
    }

    private void SetRagdoll(bool isRagdoll)
    {
        _isRagdoll = isRagdoll;

        // 문서 예제에 없는 줄이다. 애니메이터와 물리가 같은 Transform을
        // 두고 다투지 않게 한쪽을 끈다.
        if (_animator != null)
        {
            _animator.enabled = !isRagdoll;
        }

        foreach (Rigidbody body in _boneBodies)
        {
            if (body == null)
            {
                continue;
            }

            body.isKinematic = !isRagdoll;
            body.detectCollisions = isRagdoll;
        }
    }

    // 움직임이 멎은 뒤 물리를 끈다. 원문의 성능 조언에 해당하는 부분이다.
    private void FreezeRagdoll()
    {
        foreach (Rigidbody body in _boneBodies)
        {
            if (body == null)
            {
                continue;
            }

            body.isKinematic = true;
            body.detectCollisions = false;
        }
    }
}
```

`_animator`와 `body`에 `?.`를 쓰지 않은 이유가 있다. 둘 다
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다.

안정성 쪽 설정은 코드가 아니라 인스펙터와 프로젝트 설정에서 만진다. 순서는
문서가 말하는 순서, 즉 **원인부터**다.

```text file="래그돌이 늘어날 때 보는 순서"
1. 각 본 Rigidbody의 Mass 를 훑는다
   → 최대/최소 비율이 10배를 넘지 않는지 (2배는 괜찮다)
2. Rigidbody / Joint 가 올라간 Transform 의 Scale 이 1 인지
3. Project Settings > Physics 의 Default Solver Iterations
   → 떨린다면 10~20 으로
4. Angular Y / Z Limit 에 아주 좁은 각도가 들어가 있지 않은지
   → 잠그고 싶으면 0
5. 그래도 분리가 눈에 남으면
   → CharacterJoint 의 Enable Projection
      (운동량을 보존하지 않는 보정이라는 것을 알고 켠다)
```

### 무엇을 고르나

증상에서 처방으로 가는 표다. 전부 stability 페이지가 지목한 것이다.

| 증상 | 볼 곳 |
| --- | --- |
| 몸이 늘어난다 | 질량 비율 · 스케일 → 최후에 `enableProjection` |
| 조인트가 분리되거나 제멋대로 움직인다 | preprocessing |
| 연결된 바디가 떨린다 | Default Solver Iterations 10~20, 질량 비율 |
| 튕김이 부정확하다 | Default Solver Velocity Iterations 10~20 |
| 시작부터 서로 파고들어 있다 | `Rigidbody.maxDepenetrationVelocity`를 낮춘다 |
| 좁은 각도에서 불안정하다 | 각도를 0으로 잠근다 |

사망 처리 방식은 이렇게 갈린다.

- **오브젝트 하나 + `isKinematic` 전환** — 문서가 적어둔 방법. 위치와 포즈가
  그대로 이어지고, 되살리기도 같은 스위치로 된다. `Animator`를 끄는 책임이
  내 코드에 남는다.
- **오브젝트 두 개 교체** — 원문이 권한 방법. 래그돌 전용 프리팹을 따로
  튜닝할 수 있다. 대신 켜는 순서와 포즈 동기화를 내가 맞춰야 하고,
  비활성 오브젝트에는 `AddForce`가 듣지 않는다.

### 쓰지 말아야 할 자리

- **`isKinematic = false` 전에 `AddForce`.** 문서에 "the Rigidbody cannot be
  kinematic"이라고 적혀 있다. 조용히 무시된다.
- **비활성 오브젝트에 `AddForce`.** "If a GameObject is inactive, AddForce
  has no effect."
- **떨림을 Total Mass로 고치려는 시도.** 전체를 무겁게 해도 **비율은 그대로**다.
- **`Rigidbody`나 `Joint`가 올라간 Transform의 스케일 조정.** 문서가 1에서
  벗어나지 말라고 적어둔 자리다.
- **projection을 기본값처럼 켜두는 것.** 운동량을 보존하지 않는 보정이고,
  문서 자체가 "best avoided if practical"이라고 쓴다.
- **조인트로 묶인 키네마틱 바디를 `transform`으로 직접 움직이는 것.**
  "Never use direct Transform access..."

## 정리

- 마법사가 만드는 것은 **콜라이더 · 리지드바디 · 조인트** 셋이고, 조인트는
  `CharacterJoint`다. 늘어남은 그 사슬의 고리가 벌어진 것이다.
- **`Total Mass`와 `Strength`는 4.5 · 2018.3 · 6.3 · 6.6 어느 매뉴얼에도
  설명이 없다.** 원문의 두 설명은 틀렸다기보다 **확인할 수 없다.**
- 늘어남의 처방은 **`CharacterJoint.enableProjection`**이고, 전용 페이지인
  Joint and ragdoll stability에 적혀 있다. `Strength`는 그 페이지에
  나오지 않는다.
- **projection에는 명시된 대가가 있다.** "not a physical process and does not
  preserve momentum or respect collision geometry." 문서 권고 순서는 원인
  제거가 먼저, projection이 마지막이다.
- 흔들림의 기준선은 숫자로 있다. **2배는 괜찮고 10배면 떨린다.** Total Mass를
  올려도 비율은 안 바뀐다.
- **kg은 맞다.** 다만 그 문장은 컴포넌트 레퍼런스에만 있고 `Rigidbody.mass`
  스크립팅 레퍼런스에는 단위가 없다. 숫자 기준선은 또 다른 페이지에 있다.
- `AddForce`가 **조용히 무시되는 경우가 둘** 있다. 키네마틱일 때, 그리고
  오브젝트가 비활성일 때. 둘 다 사망 처리에서 실제로 밟는다.
- 문서가 적어둔 사망 처리는 **오브젝트 교체가 아니라 `isKinematic` 전환**이고,
  `detectCollisions`와 **짝으로** 뒤집는다. 다만 그 예제에도 `Animator`를
  끄는 줄은 없다.

---

### 참고

- [Ragdoll physics — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/ragdoll-physics-section.html)
- [Create a ragdoll — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/wizard-RagdollWizard.html)
- [Joint and Ragdoll stability — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/RagdollStability.html)
- [Rigidbody 컴포넌트 레퍼런스 — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-Rigidbody.html)
- [CharacterJoint.enableProjection — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CharacterJoint-enableProjection.html)
- [Joint.enablePreprocessing — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Joint-enablePreprocessing.html)
- [Rigidbody.isKinematic — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-isKinematic.html)
- [Rigidbody.AddForce — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-AddForce.html)
- [Rigidbody.mass — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-mass.html)
- [Create a ragdoll — Unity 6.3 LTS 매뉴얼](https://docs.unity3d.com/6000.3/Documentation/Manual/wizard-RagdollWizard.html)

이 글의 출발점이 된 자료는
[\[유니티\] Ragdoll 사용법 스크랩 (제일 이해하기 쉬웠음)](https://plzlotto1st.tistory.com/59)
(l\_\_j\_\_h, 2024-01-31)이다. 이 글 자체가 재게시물이고, 본문에 밝혀둔
원출처는 [베르의 프로그래밍 노트](https://wergia.tistory.com/67?category=748455)다.
인용한 한국어 문장은 모두 그 본문에서 가져왔다. 절차는 원문을 그대로 따라가면서
각 설명을 현행 Unity 6.6 매뉴얼과 스크립팅 레퍼런스 양쪽에 대조했다. 확인
시점은 2026-10-08이다.
