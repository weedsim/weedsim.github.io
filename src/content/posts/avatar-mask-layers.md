---
pubDatetime: 2026-10-12T21:00:00+09:00
title: "마스크가 고르는 건 부위고, 나머지를 채우는 건 아래 레이어다"
lang: ko
translationKey: avatar-mask-layers
featured: false
draft: false
tags:
  - Unity
  - Animator
  - 애니메이션
  - C#
description: "IK와 아바타 마스크를 조합해 상체에만 애니메이션을 걸려고 찾던 중 스크랩한 글이다. 아바타 마스크를 만들어 레이어에 꽂는 절차를 보여준다. 절차는 맞는데 마스크가 정하는 것은 어디까지인지가 빠져 있다. 부위 목록은 문서 두 곳에서 다르고, 마스크를 지탱하는 규칙은 본문이 아니라 툴팁에 있다."
---

**IK와 아바타 마스크를 조합해서 상체에만 애니메이션이 걸리게** 만들고 싶었다.
총을 조준하면서 앞으로 걷는 것처럼 **애니메이션 둘을 상하체로 나눠 거는**
방법을 찾던 중에, 아바타 마스크를 만들어 애니메이터 레이어에 꽂는 글을
스크랩해뒀다. 2022년 글이고 절차가 짧다 — `Create → Avatar Mask`로 에셋을 만들고, 인스펙터에서
쓸 부위를 초록으로 만들고, 애니메이터 컨트롤러의 레이어 설정에서 `Mask`에
꽂는다. 지금도 그대로 된다.

마스크의 정의를 글은 이렇게 적는다.

> 아바타 마스크의 정의(기능)은 애니메이션을 부분적으로 표현하는 것이다.

틀린 말은 아니다. 다만 **마스크가 정하는 것이 어디까지인지가 빠져 있다.**
마스크는 "어느 부위에" 적용할지만 정한다. "얼마나" 적용할지는 다른 칸이고,
"나머지 부위는 어떻게 되는지"는 또 다른 규칙이다. 그리고 그 규칙이 매뉴얼
**본문이 아니라 용어 툴팁에** 있다.

이 블로그에 Animator 글이 셋 있다. 그중 둘이 이 글과 맞닿는다.
[읽기 전용인 건 클립이 아니라 Animation 창의 뷰다](/posts/imported-clip-readonly/)는
**임포트 설정에서 클립에 마스크를 얹는 쪽**을 다뤘고,
[IK Pass가 꺼져 있으면 IK 함수 여섯 개가 전부 무음이다](/posts/animator-members/)는
**레이어의 IK Pass 체크박스**를 다뤘다. 이 글은 **마스크 에셋 자체와
레이어의 `Mask` 칸**을 본다. 마스크를 거는 자리가 둘이라는 것은 문서가
직접 적어두는 사실이라 그 자리부터 짚는다.

확인한 것은 다섯 가지다. **마스크를 정의하는 방법이 둘이고 고르는 기준이
적혀 있다**, **부위 목록이 매뉴얼과 enum에서 다르다**, **마스크의 이득에
메모리와 CPU가 적혀 있다**, **레이어의 `Weight`는 레이어 페이지에 설명이
없다**, 그리고 **아래 레이어가 나머지 부위를 채운다는 규칙이 용어 툴팁에
있다.**

확인 시점은 **2026-10-12**이고, 기준은 Unity **6.6**이다.

## 목차

## 마스크를 정의하는 방법은 둘이고, 고르는 기준이 있다

원문은 인스펙터를 열었을 때의 인상을 이렇게 적는다.

> 솔직히 처음에는 아무것도 조정할수 없는 에셋인가보다 했지만 Humanoid와
> Transform의 날개(화살표)를 펴서 보면 나름 전문적이게 생긴 모델이 나온다.

**둘을 "펴서 보는 두 칸"으로 다뤘다.** 매뉴얼은 둘을 **선택지**로 적는다.

> There are two ways to define which parts of your animation should be masked:

> By selecting from a Humanoid body map

> By choosing which bones to include or exclude from a Transform hierarchy

그리고 어느 쪽을 고르는지에 조건이 붙어 있다.

> If your animation uses a Humanoid Avatar

> you can select or deselect portions of the simplified humanoid body diagram

> If your animation does not use a Humanoid Avatar

> you want more detailed control over which bones are masked

**Humanoid 아바타를 쓰는지**가 첫 갈림길이고, 쓰더라도 **뼈 단위로 더 세밀히
제어하고 싶으면** Transform 쪽이다. 둘 다 펴놓고 둘 다 건드리는 것이 아니다.

Transform 쪽에는 원문에 없는 준비 단계가 하나 있다.

> Assign a reference to the Avatar whose transform you would like to mask.

> Click the **Import Skeleton** button.

> The hierarchy of the avatar appears in the inspector.

> You can check each bone in the hierarchy to use as your mask.

**아바타를 꽂고 `Import Skeleton`을 눌러야 계층이 나타난다.** 눌러보기 전에는
목록이 비어 있으니, 원문처럼 "날개를 펴서 보면 모델이 나온다"는 Humanoid 쪽
이야기다. 이 버튼을 모르면 Transform 쪽은 영구히 빈 칸으로 보인다.

색의 뜻은 원문과 문서가 같은 말을 한다.

> click the Avatar diagram for that portion until it appears as green.

> To exclude animation, click the body portion until it appears red.

원문의 "터치하면 빨간색으로 바뀜 -> 적용 X"와 같다. 초록이 포함, 빨강이
제외다.

| | Humanoid | Transform |
| --- | --- | --- |
| 문서가 적은 조건 | "uses a Humanoid Avatar" | "does not use a Humanoid Avatar" 또는 뼈 단위 제어 |
| 고르는 단위 | 몸 그림의 부위 | 계층의 뼈 하나하나 |
| 준비 작업 | 없음 | 아바타 참조 + `Import Skeleton` |
| 코드에서 읽는 법 | `GetHumanoidBodyPartActive` | `GetTransformActive` · `transformCount` |

## 부위 목록이 두 곳에서 다르다

매뉴얼이 몸 그림의 부위를 이렇게 묶는다고 적는다.

> The body diagram groups body parts into these portions:

목록이 여덟이다 — Head, Left Arm, Right Arm, Left Hand, Right Hand,
Left Leg, Right Leg, 그리고 "Root (denoted by the “shadow” under the feet)".

스크립팅 레퍼런스의 `AvatarMaskBodyPart`는 **열넷**이다.

| enum 멤버 | 문서 설명 | 매뉴얼 목록에 있나 |
| --- | --- | --- |
| Root | "The Root." | 있음 |
| Body | "The Body." | **없음** |
| Head | "The Head." | 있음 |
| LeftLeg · RightLeg | "The Left Leg." · "The Right Leg." | 있음 |
| LeftArm · RightArm | "The Left Arm." · "The Right Arm." | 있음 |
| LeftFingers · RightFingers | "Left Fingers." · "Right Fingers." | Hand로 적혀 있음 |
| LeftFootIK · RightFootIK | "Left Foot IK." · "Right Foot IK." | IK 토글로만 언급 |
| LeftHandIK · RightHandIK | "Left Hand IK." · "Right Hand IK." | IK 토글로만 언급 |
| LastBodyPart | "Total number of body parts." | 없음(개수용) |

**가장 중요한 차이가 `Body`다.** 매뉴얼의 여덟 목록에 몸통이 없고 enum에는
있다. 그리고 Hand와 Fingers는 이름이 다르다.

여기서 원문의 문장 둘이 어긋난다. 저자는 이렇게 적는다.

> 이렇게 총을 쏘는 게임에 나올법하게 상체만 만들어줬다.

그리고 바로 뒤에 이렇게 적는다.

> 그러면 저 레이어는 애니메이션을 실행할때 팔만 쓰도록 설정된다.

**상체와 팔은 같은 선택이 아니다.** 어느 쪽이든 **토글 하나로 끝나지도
않는다.** 매뉴얼 목록을 기준으로 보면 "상체만"은 Head · Left Arm ·
Right Arm · Left Hand · Right Hand를 켜고 Left Leg · Right Leg · Root를
끄는 조합이고, "팔만"은 Left Arm · Right Arm(필요하면 Hand까지)만 켜는
조합이다. 그리고 몸통을 어떻게 둘지는 **enum에는 `Body`가 있고 매뉴얼
목록에는 없어서** 문서만 보고는 답이 안 나온다. 확인할 수 있는 것은 두 목록이
다르다는 것까지다.

실무에서 이게 왜 문제가 되나. **조준 자세가 허리까지 돌아야 하는지 팔만
돌면 되는지가 몸통 포함 여부에서 갈린다.** 그 칸을 이름으로 짚지 못하면
"왜 상체가 안 돌지"를 감으로 더듬게 된다. 코드에서는 이름으로 짚을 수
있다 — `AvatarMaskBodyPart.Body`다.

## 마스크의 이득은 표현만이 아니다

원문이 적은 정의는 표현 쪽이다. 매뉴얼은 이득을 하나 더 적는다.

> A benefit of using Masks is that they tend to reduce memory overheads

> body parts that are not active do not need their associated animation curves.

> the unused curves need not be calculated during playback

**커브가 아예 없어지고, 없는 커브는 계산되지도 않는다.** 메모리와 CPU 양쪽이
적혀 있다. 그래서 마스크는 "부분만 보이게 하는 연출 수단"이 아니라 **쓰지
않을 애니메이션 데이터를 버리는 수단**이기도 하다.

이 문장이 앞서 쓴 임포트 설정 글과 맞물린다. 거기서 본 클립 마스크 페이지는
같은 일을 "discard"라는 단어로 적었다. **거는 자리가 둘인데 둘 다 버리는
일을 한다.** 스크립팅 레퍼런스가 그 둘을 한 문장에 담아둔다.

> They can be used when importing animation or in an animator controller layer.

클래스 설명도 같은 범위다.

> AvatarMask is used to mask out humanoid body parts and transforms.

## 레이어에 꽂는 것만으로 끝나지 않는다

원문의 마지막 절차는 이렇다.

> 원하는 Layer에 설정을 열고 Mask에 넣어주면 된다.

맞다. 그 칸의 설명이 이렇게 적혀 있다.

> The Mask property is there to specify the mask used on this layer

> The mask specifies the body parts on which to apply the animation.

**"on which to apply" — 어디에 적용할지다.** 얼마나 적용할지는 이 문장에
없다. 같은 레이어 설정에 블렌딩이 따로 있다.

> Select Override to use the animation on this layer, replacing the animation
> on previous layers.

> Select Additive to add the animation on this layer on top of the animation
> from previous layers.

`Override`는 **앞 레이어를 교체**하고 `Additive`는 **앞 레이어에 더한다.**
더하는 쪽에는 전제가 붙어 있다.

> For additive blending to be successful, the animation on the additive layer
> must contain the same properties

같은 프로퍼티를 가지고 있어야 한다는 뜻이다. 조준 상체 레이어를 `Additive`로
두고 하체 이동 클립과 프로퍼티가 어긋나면, 더해질 대상이 없어서 기대한
결과가 안 나온다.

그리고 **여기서 문서에 빈 자리가 하나 있다.** 레이어 인스펙터에는 `Weight`
칸이 있는데, **Animation Layers 매뉴얼 페이지에 그 칸의 설명이 없다.**
그 페이지에서 "weight"라는 단어는 `Sync`·`Timing` 설명에만 나온다.

> The Timing checkbox allows the animator to adjust how long each animation in
> synced layers takes, determined by the weight.

가중치가 문서화된 자리는 스크립팅 레퍼런스다.

> public void SetLayerWeight(int layerIndex, float weight);

> Changes the weight of the layer at a specific index.

> If the specified layer does not exist, this method does nothing.

인자 설명에 범위가 적혀 있다.

> The new layer weight which is a value between 0 and 1.

**유효 범위는 0과 1 사이다.** 다만 **기본값이 무엇인지는 그 페이지에 적혀
있지 않고, 확인하지 못했다.** 그래서 "마스크를 꽂았는데 아무 일도 안 난다"의
원인을 가중치 0이라고 단정하지는 않겠다. 확인한 것은 이것이다 — **마스크는
부위만 정하고, 적용량은 별도의 값이며, 그 값을 코드로 읽고 쓰는 API가 따로
있다.** 읽는 쪽도 있다.

> Returns the weight of the layer at the specified index.

`GetLayerWeight`다. 조준으로 올라가고 내려오는 전환을 코드로 다룰 거라면 이
둘이 손잡이다.

레이어를 숫자로 지목하는 것도 피할 수 있다.

> Returns the index of the animation layer with the given name.

> The index of the specified layer. Returns -1 if the layer name is not found.

`GetLayerIndex`고, **못 찾으면 -1이 돌아온다고 적혀 있다.** 레이어 인덱스를
코드에 숫자로 박는 문제는
[CrossFade의 0.3f: 한쪽은 0.3초고 한쪽은 아니다](/posts/animator-crossfade/)에서도
한 번 나왔다. 이름으로 찾고 -1을 검사하는 쪽이 레이어를 재배치해도 안
깨진다.

## 하체 레이어를 따로 만들 필요가 없다

원문은 이렇게 끝난다.

> 하체 레이어를 따로 만들어서 두 레이어를 쓰는게 좋겠다.

**이 조언은 대부분의 경우 필요하지 않다.** 이유가 문서에 있는데, 자리가
의외다. 아바타 마스크 페이지 본문이 아니라 **"Animation Layer" 용어
툴팁**에 이 문장이 들어 있다.

> The higher layers take precedence for the body parts they control.

**"그 레이어가 제어하는 부위에 대해서" 위 레이어가 우선한다.** 뒤집으면,
제어하지 않는 부위 — 즉 마스크에서 뺀 부위 — 는 **아래 레이어가 그대로
가져간다.** 베이스 레이어가 전신 이동을 돌리고 있으면, 상체 마스크 레이어
하나를 얹는 것으로 끝난다. 하체를 위한 레이어를 새로 만들 이유가 없다.
`Override`의 설명이 "replacing the animation on previous layers"인 것과
같은 이야기다.

하체 레이어가 필요한 경우가 아예 없는 것은 아니다. **하체만 따로 켜고 끄거나
가중치를 따로 주고 싶을 때**는 레이어를 분리하는 쪽이 맞다. 원문의 조언이
틀렸다기보다 **이유가 빠졌고, 그래서 안 필요한 경우까지 권하는 모양**이
됐다.

짚어둘 만한 것은 이 규칙의 **위치**다. 레이어의 우선순위는 레이어 기능의
핵심인데, Animation Layers 페이지 본문에는 "take precedence"라는 표현이 아예
없다. 레이어를 설명하는 페이지가 아니라 용어 툴팁이 그 규칙을 들고 있다.
문서를 읽고도 이 규칙을 모르고 지나가기 쉬운 구조다.

## IK 체크는 두 군데 있고 같은 것이 아니다

마스크 쪽에도 IK가 있다.

> You can also toggle **Inverse Kinematics (IK)** for hands and feet, which
> determines whether or not to include IK curves in animation blending.

**손과 발의 IK 커브를 블렌딩에 포함할지**를 정한다. enum 쪽에도 넷이 따로
있다 — `LeftFootIK` · `RightFootIK` · `LeftHandIK` · `RightHandIK`.

**"따로"가 중요하다.** `AvatarMaskBodyPart`에서 이 넷은 `LeftArm`·`RightArm`
과 **별개 항목**이고, 매뉴얼도 몸 부위 목록을 적은 뒤에 "You can **also**
toggle"로 이어 붙인다. 즉 **팔을 켰다고 그 손의 IK 목표가 따라 켜지지
않는다.** 조준을 IK로 잡으면서 상체만 마스크로 쓰려면 **팔 부위와 해당
`HandIK` 항목을 같이** 봐야 한다. 반대 조합도 가능하다 — 팔은 빼고 IK
목표만 두거나, 팔만 두고 IK 목표를 빼는 것. 문서가 둘을 별개 항목으로
나눠둔 이유가 그것이다.

이것은 레이어 설정의 `IK Pass` 체크박스와 **다른 칸이다.** 그쪽은
`OnAnimatorIK` 콜백이 불릴지를 정하고, 꺼져 있으면 IK 함수가 전부 무음이
된다 —
[IK Pass가 꺼져 있으면 IK 함수 여섯 개가 전부 무음이다](/posts/animator-members/)에
적어뒀다. 참고로 **Animation Layers 매뉴얼 페이지에는 `IK Pass`가 없다.**
`Weight`와 같은 상황이다.

정리하면 이름에 IK가 들어간 칸이 둘이고, 하나는 **커브를 섞을지**(마스크),
하나는 **콜백을 부를지**(레이어)다. 섞을 커브가 없는데 콜백만 켜도, 콜백을
안 켰는데 커브만 섞어도 기대한 결과가 안 나온다.

## 어디에 왜 쓰나

### 동작하는 예제

조준용 상체 레이어의 가중치를 다루는 형태다. 원문의 절차에서 빠진 두 가지 —
**레이어를 이름으로 찾기**와 **가중치**를 코드가 담당한다.

```csharp file="Scripts/Character/AimLayerController.cs"
using UnityEngine;

[RequireComponent(typeof(Animator))]
public class AimLayerController : MonoBehaviour
{
    [Header("레이어")]
    [Tooltip("마스크를 꽂아둔 상체 레이어의 이름. 인덱스를 숫자로 적지 않는다")]
    [SerializeField]
    private string _aimLayerName = "Aim";

    [Tooltip("가중치가 0에서 1까지 가는 데 걸리는 시간(초)")]
    [Min(0f)]
    [SerializeField]
    private float _blendDuration = 0.15f;

    [Header("확인용")]
    [Tooltip("레이어에 꽂은 마스크. 어느 부위가 켜져 있는지 로그로 찍는다")]
    [SerializeField]
    private AvatarMask _aimMask;

    private Animator _animator;
    private int _aimLayerIndex = -1;
    private float _targetWeight;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("Animator가 없다.", this);
            return;
        }

        // 이름으로 찾는다. 없으면 -1이 돌아온다고 문서에 적혀 있다.
        _aimLayerIndex = _animator.GetLayerIndex(_aimLayerName);

        if (_aimLayerIndex < 0)
        {
            Debug.LogError($"'{_aimLayerName}' 레이어가 없다.", this);
            return;
        }

        _targetWeight = _animator.GetLayerWeight(_aimLayerIndex);
    }

    private void Update()
    {
        if (_aimLayerIndex < 0)
        {
            return;
        }

        float current = _animator.GetLayerWeight(_aimLayerIndex);

        if (Mathf.Approximately(current, _targetWeight))
        {
            return;
        }

        float step = _blendDuration <= 0f
            ? 1f
            : Time.deltaTime / _blendDuration;

        // 문서가 적어둔 유효 범위는 0과 1 사이다.
        float next = Mathf.Clamp01(
            Mathf.MoveTowards(current, _targetWeight, step));

        _animator.SetLayerWeight(_aimLayerIndex, next);
    }

    // 조준 입력에서 부른다. 마스크는 어디에 적용할지만 정하므로,
    // 얼마나 적용할지는 이쪽이 쥔다.
    public void SetAiming(bool isAiming)
    {
        _targetWeight = isAiming ? 1f : 0f;
    }

    // 마스크가 실제로 무엇을 켜고 있는지 이름으로 확인하는 자리다.
    // 몸통이 포함됐는지를 눈으로 찾지 않고 Body로 짚는다.
    [ContextMenu("마스크 상태 찍기")]
    private void LogMaskState()
    {
        if (_aimMask == null)
        {
            Debug.LogWarning("마스크가 비어 있다.", this);
            return;
        }

        for (int i = 0; i < (int)AvatarMaskBodyPart.LastBodyPart; i++)
        {
            AvatarMaskBodyPart part = (AvatarMaskBodyPart)i;
            Debug.Log($"{part} = {_aimMask.GetHumanoidBodyPartActive(part)}",
                this);
        }

        Debug.Log($"transformCount = {_aimMask.transformCount}", this);
    }
}
```

`_animator`와 `_aimMask`에 `?.`를 쓰지 않은 이유가 있다. 둘 다
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다.

반복의 끝을 `AvatarMaskBodyPart.LastBodyPart`로 둔 것이 의도적이다. 문서가
그 멤버를 "Total number of body parts."라고 적어뒀고, `AvatarMask`에는
**휴머노이드 부위 개수를 돌려주는 프로퍼티가 없다.** `transformCount`는
Transform 쪽 개수고, 휴머노이드 쪽 개수는 enum에서 가져온다.

`[ContextMenu]`를 붙인 이유도 하나다. 마스크 인스펙터의 몸 그림은 색으로
읽어야 하는데, **몸통이 켜졌는지는 그림에서 가장 헷갈리는 칸**이다. 이름으로
찍어보면 감이 아니라 값으로 확인된다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| Humanoid 아바타가 있다 | Humanoid 몸 그림 |
| Humanoid 아바타가 없다 | Transform 계층 (아바타 참조 + `Import Skeleton`) |
| 뼈 단위로 세밀하게 | Transform 계층 |
| 조준이 허리까지 돌아야 한다 | `Body` 포함 (코드로는 `AvatarMaskBodyPart.Body`) |
| 팔만 움직인다 | `LeftArm`·`RightArm`(+Fingers) |
| 상체 레이어를 얹는다 | `Override` + 마스크, 하체는 아래 레이어가 유지 |
| 흔들림을 더한다 | `Additive` (앞 레이어와 같은 프로퍼티가 있어야 한다) |
| 조준을 켜고 끈다 | `SetLayerWeight` (0과 1 사이) |
| 레이어를 지목한다 | `GetLayerIndex` + `-1` 검사 |
| 클립 자체에서 하체를 버린다 | 임포트 설정의 Mask |
| 손발 IK 커브를 섞는다 | 마스크의 IK 토글 |
| 조준 IK를 상체 마스크와 같이 쓴다 | 팔 부위 + 해당 `HandIK` 항목을 같이 켠다 |
| `OnAnimatorIK`를 부른다 | 레이어의 `IK Pass` |

판단 순서는 이렇게 두면 된다.

- **먼저 마스크를 거는 자리를 고른다.** 그 클립을 항상 부분만 쓸 거라면
  임포트 설정이고, 상황에 따라 켜고 끌 거라면 레이어다. 전자는
  [읽기 전용인 건 클립이 아니라 Animation 창의 뷰다](/posts/imported-clip-readonly/)에
  적어뒀다.
- **부위는 이름으로 확정한다.** "상체"는 문서의 단위가 아니다. 켤 부위를
  enum 이름으로 적어두고 시작하는 쪽이 나중에 덜 헤맨다.
- **마스크를 꽂은 뒤 가중치를 확인한다.** 마스크는 부위만 정한다. 적용량은
  별도 값이고 코드로 읽을 수 있다.
- **나머지 부위는 아래 레이어에 맡긴다.** 위 레이어는 자기가 제어하는
  부위에서만 우선한다. 하체 레이어를 새로 만들기 전에 베이스 레이어가 이미
  하체를 돌리고 있는지 본다.

### 쓰지 말아야 할 자리

- **Humanoid와 Transform을 둘 다 채우려는 것.** 문서는 둘을 선택지로 적고,
  조건이 "uses a Humanoid Avatar"냐 아니냐다.
- **Transform 목록이 비어 있다고 에셋이 고장났다고 보는 것.** 아바타를 꽂고
  `Import Skeleton`을 눌러야 계층이 나타난다.
- **"상체"를 토글 하나로 찾으려는 것.** 매뉴얼의 부위 목록은 여덟이고 그
  안에 상체라는 단위가 없다. 몸통은 enum의 `Body`다.
- **마스크를 꽂고 가중치를 확인하지 않는 것.** 마스크는 "on which to apply"만
  정한다. 적용량은 `SetLayerWeight`의 영역이고 범위는 0과 1 사이다.
- **레이어 인덱스를 코드에 숫자로 박는 것.** `GetLayerIndex`가 있고, 못
  찾으면 -1이 돌아온다.
- **하체 레이어를 습관처럼 만드는 것.** 위 레이어는 제어하는 부위에서만
  우선한다. 베이스 레이어가 전신을 돌리고 있으면 상체 레이어 하나로 끝난다.
- **`Additive`를 프로퍼티 확인 없이 쓰는 것.** 문서가 "must contain the same
  properties"라는 전제를 적어뒀다.
- **마스크의 IK 토글과 레이어의 `IK Pass`를 같은 것으로 보는 것.** 하나는
  커브를 섞을지, 하나는 콜백을 부를지다.
- **팔을 켰으니 그 손의 IK도 켜졌다고 보는 것.** enum에서 `LeftArm`과
  `LeftHandIK`는 별개 항목이고, 매뉴얼도 "also toggle"로 따로 적는다.

## 정리

- 마스크를 정의하는 방법은 **둘**이고 선택 기준이 적혀 있다 — "uses a
  Humanoid Avatar"면 몸 그림, 아니거나 뼈 단위 제어가 필요하면 Transform
  계층이다. 후자는 **아바타 참조와 `Import Skeleton`**이 먼저다.
- 초록이 포함, 빨강이 제외다. 문서가 "until it appears as green" / "until it
  appears red"로 적는다.
- **부위 목록이 두 곳에서 다르다.** 매뉴얼의 몸 그림 목록은 여덟이고
  `AvatarMaskBodyPart`는 열넷이다. **매뉴얼 목록에 `Body`가 없다.**
- 그래서 원문의 "상체만"과 "팔만"은 **같은 선택이 아니고, 둘 다 토글
  하나도 아니다.** 몸통 포함 여부는 코드에서 `AvatarMaskBodyPart.Body`로
  짚는다.
- 마스크의 이득에 **메모리와 CPU가 적혀 있다** — "body parts that are not
  active do not need their associated animation curves." / "the unused curves
  need not be calculated during playback". 연출 수단이자 데이터를 버리는
  수단이다.
- 레이어의 `Mask`는 **"the body parts on which to apply the animation"**이다.
  어디에 적용할지만 정한다.
- **`Weight`는 Animation Layers 페이지에 설명이 없다.** 문서화된 자리는
  `SetLayerWeight`/`GetLayerWeight`이고, 범위는 **"a value between 0 and 1"**
  이다. 기본값은 적혀 있지 않아 확인하지 못했다.
- **아래 레이어가 나머지를 채운다** — "The higher layers take precedence for
  the body parts they control." 이 규칙이 Animation Layers 본문이 아니라
  **용어 툴팁**에 있다. 그래서 하체 레이어를 따로 만들 필요가 대개 없다.
- `Override`는 "replacing the animation on previous layers", `Additive`는
  "add ... on top of"이고 후자는 **같은 프로퍼티를 전제**한다.
- IK가 들어간 칸이 둘이다. 마스크의 토글은 **IK 커브를 블렌딩에 포함할지**,
  레이어의 `IK Pass`는 **콜백을 부를지**다. 후자는 Animation Layers 페이지에
  아예 없다.
- 그리고 enum에서 **IK 목표 넷은 팔다리와 별개 항목**이다. 팔을 켜도 그 손의
  IK 목표는 따라오지 않으므로, 조준 IK와 상체 마스크를 같이 쓸 거라면 두
  항목을 같이 본다.

---

### 참고

- [Avatar Mask — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AvatarMask.html)
- [Animation Layers — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationLayers.html)
- [Mask animation clips — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationMaskOnImportedClips.html)
- [AvatarMask — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.html)
- [AvatarMaskBodyPart — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMaskBodyPart.html)
- [AvatarMask.GetHumanoidBodyPartActive — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.GetHumanoidBodyPartActive.html)
- [AvatarMask.SetHumanoidBodyPartActive — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.SetHumanoidBodyPartActive.html)
- [Animator.SetLayerWeight — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.SetLayerWeight.html)
- [Animator.GetLayerWeight — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetLayerWeight.html)
- [Animator.GetLayerIndex — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetLayerIndex.html)

이 글의 출발점이 된 자료는
[유니티 아바타 마스크](https://alpaca-code.tistory.com/46)
(UniCoti, 2022-08-15)이다. 에셋을 만들고 레이어에 꽂는 절차는 원문을 그대로
따라가면서, 각 항목을 현행 Unity 6.6 매뉴얼과 스크립팅 레퍼런스 양쪽에
대조했다. 확인 시점은 2026-10-12이다.
