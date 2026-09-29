---
pubDatetime: 2026-09-29T19:00:00+09:00
title: "일방통행 플랫폼은 방향이 아니라 각도다"
lang: ko
translationKey: unity-2d-one-way-platform
featured: false
draft: false
tags:
  - Unity
  - 2D
  - 물리
  - C#
description: "PlatformEffector2D를 찾아낸 것까지는 정확하다. 다만 이 컴포넌트가 실제로 판단하는 것은 '위에서 왔나 아래에서 왔나'가 아니라 충돌 법선이 호(arc) 안에 있느냐다. 그 각도를 모르면 가장자리에서 걸린다."
---

2D 플랫포머를 만들던 중 **공중 발판을 어떻게 처리해야 하는지** 찾다가 스크랩한
글이다. 글쓴이도 같은 자리에서 막혔다 — 2D 런게임의 공중 발판을 만들다가
"아래에서 점프하면 통과하고 위에서는 올라서야 하는데" 하고 멈춰서, 그 해법을
2023년에 정리한 것이다. 막힌 지점과 검색 과정까지 같이 적어둬서 읽기 좋다.
서로 다른 2D 프로젝트에서 같은 질문이 나온다는 것 자체가, 글쓴이 표현대로
이게 "국룰"이라는 뜻이기도 하다.

> 처음에는 이렇게 생각했다.
> 1\. 플레이어가 발 아래로 캐스팅을 쏴서 발판의 콜라이더를 온오프?
> 2\. 반대로 발판이 오버랩 검사를 해서 플레이어가 위에있을때만 콜라이더를 온?

둘 다 실제로 굴러가는 방법이고, 그걸 접고 **엔진에 이미 있는 컴포넌트를
찾아낸 것**이 이 글의 성과다. 정답은 `PlatformEffector2D`가 맞다.

다만 글이 알려주는 건 **체크박스 두 개를 켜라**까지다. 그래서 잘 되다가
가장자리에서 이상하게 걸리거나, 콜라이더가 둘인 캐릭터가 끼는 순간 손댈 데를
못 찾는다. **이 컴포넌트가 실제로 보는 것은 방향이 아니라 각도**이고, 그
각도가 인스펙터에 값으로 나와 있다.

## 목차

## 컴포넌트를 찾은 것까지는 정확하다

먼저 맞는 쪽부터. 설정 절차가 정확하다.

> 플랫폼에 콜라이더를 먼저 붙이고 콜라이더에 **Used By Effector**를 체크해준 후
> 이 컴포넌트를 붙이면 된다. 물론 **Use One Way**는 체크돼있어야 하지만
> 디폴트로 체크돼있다.

스크립팅 레퍼런스의 클래스 설명도 짧고 같은 이야기를 한다.

> **일방 충돌 등의 "플랫폼" 동작을 적용한다.**

그리고 결론에 적은 관찰도 맞다.

> Unity에서 2D와 3D의 제일 큰 차이점은 개인적인 생각으론 물리 시뮬레이션
> 쪽이다. … 콜라이더 컴포넌트도 2D전용 따로, 리지드바디도 따로, 레이를 쏘려해도
> Physics2D클래스로 따로 접근해야한다.

맞는 정리다. 2D 리지드바디 쪽 이야기는
[FreezePositionY 글](/posts/rigidbody-constraints/)에서 따로 다뤘다.

한 가지만 짚어두면, 클리핑이 건 문서 링크는 **Unity 5.3 한국어 매뉴얼**이다.
2015년 문서라 지금 API와 항목이 맞지 않는 데가 있다. 뒤에서 하나 나온다.

## 일방통행은 방향이 아니라 각도다

이 컴포넌트의 핵심 속성은 `Surface Arc`인데, 클리핑에 한 번도 안 나온다.
매뉴얼의 설명이다.

> **Surface Arc** — **로컬 'up'을 중심으로 한 호(arc)의 각도**가, 콜라이더의
> 통과를 허용하지 않는 표면을 정의한다. **이 호 바깥의 것은 일방 충돌 대상으로
> 간주된다.**

스크립팅 레퍼런스 쪽도 같다.

> **surfaceArc** — 이펙터의 **로컬 'up'을 중심으로** 플랫폼의 표면을 정의하는
> 호의 각도.

읽어보면 판정 기준이 "위에서 왔나 아래에서 왔나"가 아니다. **충돌 법선이 그
호 안에 들어오느냐**다. 그래서 다음이 따라온다.

- **호는 이펙터의 로컬 up을 기준으로 잡힌다.** 플랫폼을 회전시키면 호도 같이
  돈다. 경사 발판이 의도대로 도는 이유가 이것이다.
- **각도를 좁히면 막히는 범위가 좁아진다.** 기본값 180°는 위쪽 절반 전체다.
  좁히면 비스듬히 스치는 접촉은 통과가 된다.
- **각도를 넓히면 평범한 벽이 된다.** 360°에 가까워질수록 모든 방향에서 막는다.

"가장자리에서 가끔 안 올라가진다" 같은 증상이 여기서 나온다. 발판 모서리에
비스듬히 닿으면 **법선이 호 밖으로 나가서 통과 처리**된다. 버그가 아니라
설정값이다.

| 원하는 동작 | Surface Arc |
|---|---|
| 기본 일방통행 | 180° (위쪽 절반) |
| 모서리에서도 확실히 걸리게 | 180°보다 넓게 |
| 스치는 접촉은 통과시키기 | 180°보다 좁게 |
| 사실상 일반 콜라이더 | 360°에 가깝게 |

그리고 각도를 **돌릴 수도** 있다. 스크립팅 레퍼런스의 속성이다.

> **rotationalOffset** — 로컬 'up'으로부터의 회전 오프셋 각도.

천장에 붙는 일방통행(아래에서만 뚫고 올라가고 위에서는 못 내려오는)을 만들려면
이 값을 180으로 둔다. **클리핑이 링크한 5.3 매뉴얼 페이지에는 이 항목이
없다.** 지금 스크립팅 API에는 있다.

## 클리핑이 안 짚은 체크박스 둘

### `Use One Way Grouping`

콜라이더가 둘 이상인 캐릭터에서 **끼는 현상**의 답이다. 매뉴얼 설명이 용도까지
적어놨다.

> 일방 동작에 의해 비활성화된 **모든 접촉이 모든 콜라이더에 대해 작동하도록
> 보장한다.** **플랫폼을 통과하는 오브젝트에 콜라이더가 여러 개 있고** 그것들이
> 하나의 그룹으로 함께 동작해야 할 때 유용하다.

몸통 콜라이더와 발 콜라이더를 따로 둔 캐릭터, 무기 히트박스가 붙은 캐릭터가
여기 걸린다. **한 콜라이더는 통과하는데 다른 하나가 막히면** 캐릭터가 발판에
반쯤 박힌다. 체크박스 하나다.

### `Use Collider Mask` / `Collider Mask`

클리핑이 처음에 걱정한 것이 "연산"이었는데, 이쪽이 스크립트 없이 대상을
줄이는 방법이다.

> **Use Collider Mask** — Collider Mask 속성을 사용할지 지정한다. 선택하지
> 않으면 **전역 충돌 매트릭스**가 모든 콜라이더의 기본값으로 사용된다.

> **Collider Mask** — 이펙터와 상호작용할 **특정 레이어를 선택**하는 데 쓰는
> 마스크.

전역 충돌 매트릭스를 건드리지 않고 **이 발판만** 플레이어 레이어에 반응하게
할 수 있다. 적이나 투사체는 그냥 지나가게 두고 싶을 때 쓰는 자리다.

나머지 셋도 정리해둔다.

| 속성 | 설명 |
|---|---|
| `Side Arc` | 이펙터의 로컬 'left'·'right'를 중심으로 측면을 정의하는 호. 이 안의 법선이 '측면' 동작 대상 |
| `Use Side Friction` | 플랫폼 측면에 마찰을 쓸지 |
| `Use Side Bounce` | 플랫폼 측면에 바운스를 쓸지 |

측면 마찰을 끄는 게 기본값인 이유가 있다. **점프해서 발판 옆면에 붙었을 때
미끄러져 내려오지 않고 매달리는 것**을 막기 위해서다.

## 아래키로 내려오기 — 영상 대신 문서로

클리핑이 여기서 멈춘다.

> 만약 플랫폼게임에서 흔한패턴인 **"아래방향키를 누르면 내려오기"** 를
> 구현할려면 위 영상을 참고하면 될것같다.

영상으로 넘긴 그 부분이 실제로는 가장 자주 필요해지는 기능이다. 문서에 있는
방법으로 짜면 이렇게 된다.

핵심은 `Physics2D.IgnoreCollision`이다.

> `public static void IgnoreCollision(Collider2D collider1, Collider2D collider2, bool ignore = true);`

> 충돌 감지 시스템이 `collider1`과 `collider2` 사이의 **모든 충돌/트리거를
> 무시하게 만든다.**

그리고 문서가 붙여둔 단서가 중요하다.

> **영구적이지 않다.** 즉 무시 상태는 씬을 저장할 때 에디터에 저장되지 않는다.

거기에 더해 **둘 중 하나라도 비활성화되면 무시 상태가 사라져서 다시 걸어줘야
한다.** 오브젝트 풀링을 쓰는 런게임이라면 이 문장이 그대로 버그가 된다.
발판을 껐다 켜는 순간 무시가 풀린다.

```csharp
using System.Collections;
using UnityEngine;

/// <summary>
/// 아래 방향키로 일방통행 발판을 통과해 내려온다.
/// 플레이어에 붙인다.
/// </summary>
[RequireComponent(typeof(Collider2D))]
public class OneWayDropper : MonoBehaviour
{
    private const float DROP_DURATION = 0.35f;

    [Header("Drop")]
    [SerializeField, Range(0.1f, 1f), Tooltip("충돌을 무시하는 시간(초)")]
    private float _dropDuration = DROP_DURATION;

    [SerializeField, Tooltip("일방통행 발판이 올라가 있는 레이어")]
    private LayerMask _platformLayers;

    private Collider2D _collider;
    private Collider2D _standingOn;
    private bool _isDropping;

    private void Awake()
    {
        TryGetComponent(out _collider);
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // 지금 밟고 있는 발판을 기억해둔다. 통과시킬 대상이 이것이다.
        if (IsPlatform(collision.collider))
        {
            _standingOn = collision.collider;
        }
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.collider == _standingOn)
        {
            _standingOn = null;
        }
    }

    /// <summary>입력 쪽에서 부른다.</summary>
    public void RequestDrop()
    {
        if (_isDropping || _standingOn == null)
        {
            return;
        }

        StartCoroutine(DropThrough(_standingOn));
    }

    private IEnumerator DropThrough(Collider2D platform)
    {
        _isDropping = true;

        Physics2D.IgnoreCollision(_collider, platform, true);

        yield return new WaitForSeconds(_dropDuration);

        // 문서: 영구적이지 않고, 한쪽이 비활성화되면 상태가 사라진다.
        // 그래서 되돌리기 전에 아직 살아 있는지 확인한다.
        if (platform != null)
        {
            Physics2D.IgnoreCollision(_collider, platform, false);
        }

        _isDropping = false;
    }

    private bool IsPlatform(Collider2D other)
    {
        return (_platformLayers.value & (1 << other.gameObject.layer)) != 0;
    }
}
```

`platform != null` 검사가 필요한 이유가 문서의 "영구적이지 않다" 문장이다.
풀에 반납되어 비활성화된 발판을 다시 건드리면 의미가 없고, Unity 오브젝트라
**`?.`가 아니라 `!= null`로 검사해야 한다.**

`rotationalOffset`을 180으로 돌리는 방법도 있는데, 그건 **그 발판을 밟고 있는
모두에게 적용된다.** 멀티플레이나 적이 같이 올라선 상황이면 `IgnoreCollision`
쪽이 맞다.

## 어디에 왜 쓰나

`PlatformEffector2D`는 **점프해서 올라가는 발판**이 필요한 모든 2D 게임의
기본값이다. 클리핑의 출발점이던 "캐스팅으로 콜라이더 온오프"를 직접 짜는
것보다 낫다 — 매 프레임 판정 대신 **물리 엔진이 접촉 시점에 법선으로
판단**하기 때문이다.

### 공중 발판 한 벌

인스펙터에서 채울 것과 그 이유를 정리하면 이렇다.

| 항목 | 값 | 이유 |
|---|---|---|
| Collider 2D → Used By Effector | 체크 | 이게 없으면 이펙터가 콜라이더를 못 잡는다 |
| Use One Way | 체크 | 일방 동작 자체 |
| Surface Arc | 180 (기본) | 위쪽 절반을 막는다 |
| Use One Way Grouping | **체크** | 플레이어 콜라이더가 둘 이상이면 필수 |
| Use Collider Mask | 필요 시 | 발판마다 대상 레이어를 따로 두고 싶을 때 |
| Use Side Friction | 해제 | 옆면에 매달리는 것을 막는다 |

**`Use One Way Grouping`을 켜두는 쪽**을 기본으로 삼기를 권한다. 안 켜서 생기는
증상이 "가끔 낀다"라서, 나중에 원인을 찾기가 특히 어렵다.

### 각도를 손봐야 하는 경우

- **경사 발판** — 플랫폼을 회전시키면 호도 같이 돈다. 따로 할 게 없다.
- **천장 일방통행** — `rotationalOffset`을 180으로.
- **모서리에서 자꾸 통과한다** — Surface Arc를 넓힌다.
- **비스듬히 뛰어올랐는데 걸린다** — Surface Arc를 좁힌다.

증상을 값 하나에 대응시켜두면, 이 컴포넌트는 더 이상 "되거나 안 되는 체크박스"가
아니게 된다.

### 쓰지 말아야 할 자리

- **콜라이더에 `Used By Effector`를 안 켜고 이펙터만 붙이기.** 아무 일도 안
  일어난다.
- **플레이어 콜라이더가 여럿인데 `Use One Way Grouping`을 끄기.** 반쯤 박힌다.
- **`IgnoreCollision`을 걸고 되돌리지 않기.** 영구적이지는 않지만 그 세션
  동안은 남는다.
- **오브젝트 풀링과 `IgnoreCollision`을 섞으면서 비활성화를 신경 안 쓰기.**
  한쪽이 꺼지면 상태가 사라진다.
- **모든 발판에 `rotationalOffset`을 돌려 내려오기를 구현하기.** 그 발판 위의
  모두에게 적용된다.
- **매 프레임 캐스팅으로 직접 구현하기.** 클리핑이 접은 그 방법이고, 접은 게
  맞다.

## 정리

- **정답 컴포넌트를 찾아낸 것은 정확하다.** `PlatformEffector2D`가 맞고,
  `Used By Effector` + `Use One Way`가 최소 설정인 것도 맞다.
- **판정 기준은 방향이 아니라 각도다.** 매뉴얼 표현으로 **"로컬 'up'을 중심으로
  한 호의 각도가 통과를 허용하지 않는 표면을 정의"** 하고, **"이 호 바깥은
  일방 충돌 대상"** 이다.
- 그래서 **가장자리에서 통과해버리는 건 버그가 아니라 Surface Arc 값**이다.
- **`rotationalOffset`으로 호를 돌릴 수 있다.** 천장 일방통행이 여기서 나온다.
  클리핑이 링크한 5.3 매뉴얼에는 이 항목이 없다.
- **`Use One Way Grouping`이 "가끔 낀다"의 답이다.** 통과하는 오브젝트에
  콜라이더가 여러 개일 때 함께 동작하게 한다.
- **`Use Collider Mask`로 전역 충돌 매트릭스 대신 발판별 레이어 선택**이 된다.
- **아래키로 내려오기는 `Physics2D.IgnoreCollision`으로 짤 수 있다.** 다만
  문서가 **"영구적이지 않다"**고 적고, 한쪽이 비활성화되면 상태가 사라진다.
  풀링을 쓰면 여기서 걸린다.

체크박스로 끝나는 기능이라 글도 체크박스에서 끝나기 쉽다. **그런데 이
컴포넌트의 인스펙터에 값으로 노출된 항목이 여덟 개**이고, 그중 절반은 "잘
되다가 가끔 이상한" 증상에 정확히 대응한다. 켜는 법보다 **켠 다음에 이상할 때
어디를 보는지**가 더 오래 쓰인다.

---

### 참고

- [PlatformEffector2D — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/PlatformEffector2D.html)
- [Platform Effector 2D — Unity 매뉴얼](https://docs.unity3d.com/Manual/class-PlatformEffector2D.html)
- [Physics2D.IgnoreCollision — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics2D.IgnoreCollision.html)

이 글의 출발점이 된 자료는 [Oniboogie — \[Unity2D\] 공중 플랫폼(일방통행 플랫폼) 만들기](https://trialdeveloper.tistory.com/64)
(2023-01-25)이다. 컴포넌트를 찾아가는 과정을 그대로 따라가면서, 그 컴포넌트가
실제로 무엇을 보고 판단하는지를 현행 매뉴얼·스크립팅 레퍼런스와 대조했다.
