---
pubDatetime: 2026-09-22T14:00:00+09:00
title: "isGrounded는 센서가 아니라 지난 Move의 기록이다"
lang: ko
translationKey: character-controller-isgrounded
featured: false
draft: false
tags:
  - Unity
  - CharacterController
  - 물리
  - C#
description: "isGrounded가 제대로 동작하지 않아 레이캐스트로 바꿨다는 글을 현행 문서와 대조했다. 증상도 해법도 실재하는데, 문서를 보면 원인이 다른 데 있고 해법의 숫자에도 문제가 있다."
---

언덕처럼 평지가 아닌 지형에서 `CharacterController.isGrounded`가 제대로
동작하지 않는 상황을 만났다. 대처법을 찾다가 **같은 증상을 겪은 기록**을
발견해 스크랩해뒀다. 짧지만 겪은 순서가 그대로 남아 있어서 읽을 값어치가 있다.

> 프로젝트 작업중 Character Controller 의 속성인 isGrounded가 제대로 동작하지
> 않음을 확인하였다.

> 검색하여 알아낸 하나의 방법은 Character Controller의 Min Move Distance를
> 0으로 수정하는 것이였다. 전보다는 훨씬 좋은 판정을 가지게 됐지만, 울퉁불퉁한
> 내리막에서는 여전히 제대로 동작하지 않았다.

**증상이 똑같다.** 해법도 실제로 동작한다. 다만 대처법만 가져다 쓰기 전에
원인을 확인하고 싶어서 현행 문서와 대조해봤는데, **원인이 다른 데 있고**
최종 해법의 **숫자 하나가 의도보다 훨씬 관대했다.**

## 목차

## 증상은 맞고, 원인은 문서에 있다

`isGrounded`를 스크립팅 레퍼런스에서 찾으면 첫 줄이 이렇다.

> **지난 move 동안** CharacterController가 지면에 닿아 있었는가?

그리고 설명이 한 번 더 못 박는다.

> `CharacterController.Move` 또는 `CharacterController.SimpleMove` **가장 최근
> 호출 동안** CharacterController가 지면에 닿아 있었는지를 나타낸다.

**현재 상태를 묻는 센서가 아니다.** 지난 `Move` 호출이 무엇을 만났는지를
남겨둔 **기록**이다. 이름이 현재형이라 센서처럼 읽히는 게 문제의 절반이다.

그래서 이런 코드가 어긋난다.

```csharp
// isGrounded는 아래 Move가 아니라 "지난 프레임의 Move"를 말한다
if (controller.isGrounded && Input.GetButtonDown("Jump"))
{
    moveDirection.y = jumpForce;
}

moveDirection.y -= gravity * Time.deltaTime;
controller.Move(moveDirection * Time.deltaTime);
```

원문 코드의 구조가 이것이다. `isGrounded`를 읽는 시점과 그 값을 만든 `Move`
사이에 **한 프레임이 끼어 있다.** 그 사이에 중력이 한 번 더 더해지고, 캐릭터는
이미 조금 떠 있을 수 있다.

여기에 `Move`의 성질이 겹친다. 문서가 적어놨다.

> **`CharacterController.Move`는 중력을 사용하지 않는다.**

중력을 내가 매 프레임 더해서 넣어주는 구조라, **내리막에서는 캐릭터가 지면을
따라가지 못하고 매 프레임 살짝 뜬다.** 원문이 "울퉁불퉁한 내리막에서는 여전히
제대로 동작하지 않았다"고 적은 상황이 이 모양이다. `isGrounded`가 고장 난 게
아니라, **그 프레임의 `Move`가 실제로 지면에 닿지 않은 것**이다.

## Min Move Distance 0은 해법이 아니라 기본값이다

원문이 검색해서 찾은 첫 번째 방법이다. 문서를 보면 이건 **발견이 아니라
복구**다.

> 캐릭터가 이 거리보다 적게 움직이려 하면 **아예 움직이지 않는다.** 지터를
> 줄이는 데 쓸 수 있다.

> **대부분의 상황에서 이 값은 0으로 두어야 한다.**

문서가 직접 "0으로 두라"고 적어놨다. 즉 **0이 아닌 값이 들어가 있었던 것이
문제**였고, 0으로 되돌린 건 정상 설정으로 복귀한 것이다.

왜 이게 접지 판정에 영향을 주는지도 위 문장에 있다. 값이 0이 아니면 **작은
이동이 통째로 무시된다.** 지면에 내려앉는 마지막 몇 밀리미터가 그 "작은 이동"에
해당하면, `Move`는 아무것도 하지 않고 따라서 지면과의 접촉도 기록되지 않는다.

원문이 "전보다는 훨씬 좋은 판정"이라고 한 게 정확한 관찰이다. **일부 원인이
제거된 것**이고, 남은 내리막 문제는 앞 절의 프레임 지연 쪽이다.

## 1.5미터 레이가 실제로 허용하는 것

최종 해법이 이 함수다.

```csharp
private bool IsGroundedUsingRay()
{
    if (controller.isGrounded) return true;

    var ray = new Ray(this.transform.position + Vector3.up * 0.1f, Vector3.down);
    var maxDistance = 1.5f;

    Debug.DrawRay(transform.position + Vector3.up * 0.1f, Vector3.down * maxDistance, Color.red);

    return Physics.Raycast(ray, maxDistance, _fieldLayer);
}
```

구조가 좋다. `isGrounded`가 `true`면 레이를 쏘지 않고 끝내니 비용이 낮고,
레이어 마스크를 명시해서 넘긴다. `Physics.Raycast`의 기본 마스크는
`DefaultRaycastLayers`라 명시하지 않으면 의도보다 넓게 잡힌다 —
[OverlapSphere 쪽 글](/posts/physics-overlapsphere/)에서 다룬 기본값 차이가
여기서도 유효하다.

그런데 **숫자를 계산해보면 판정 범위가 크다.**

레이는 `transform.position`보다 **0.1미터 위**에서 시작해서 아래로
**1.5미터** 간다. 즉 닿는 최저점은 피벗보다 **1.4미터 아래**다.
`CharacterController`의 피벗은 보통 발밑에 있으므로, 이 함수는
**발밑 1.4미터까지를 "접지"로 친다.**

| | 값 |
|---|---|
| 레이 시작 | 피벗 + 0.1 m |
| 최대 거리 | 1.5 m |
| 닿는 최저점 | 피벗 − 1.4 m |

사람 크기 캐릭터가 대략 1.8미터라면 **자기 키의 8할만큼 공중에 떠 있어도
점프가 된다.** 절벽에서 뛰어내린 직후에도, 떨어지는 도중에도 한동안 참이다.

원문이 이 거리로 문제를 해결한 건 사실이다. 다만 **해결한 방식이
"판정을 관대하게 만든 것"** 이고, 그 관대함이 어느 정도인지는 코드에
`1.5f`라고만 적혀 있다.

한 가지 짚어둘 건, 이 레이가 **캐릭터 자신의 콜라이더를 무시한다**는 점이다.
시작점이 캡슐 안쪽인데도 자기 자신에 걸리지 않는다. 문서에 이유가 있다.

> 레이캐스트는 **레이 시작점이 콜라이더 내부에 있는 경우 그 콜라이더를 감지하지
> 않는다.**

의도한 것인지 운이 좋았던 것인지는 알 수 없지만, 결과적으로 자기 제외 처리가
필요 없었던 이유가 이것이다.

## 점 하나로 바닥을 재는 문제

거리를 줄여도 남는 문제가 있다. **레이는 점 하나를 본다.**

캐릭터가 난간 끝에 서 있어서 캡슐의 절반만 바닥에 걸쳐 있다고 하자. 발 한가운데
에서 쏜 레이는 **허공을 지나간다.** 눈에는 서 있는데 판정은 공중이다. 반대로
얇은 기둥 위에 섰을 때는 가운데만 맞아서 통과한다.

바닥은 면적이니 **면적으로 재는 편**이 맞다. `Physics.SphereCast`가 그 도구다.

> 반지름 `radius`인 구를 `direction` 방향으로 `maxDistance`만큼 쓸어보낸다.
> 일반 레이캐스트의 정밀도가 부족할 때, 특히 특정 크기의 오브젝트가 공간을
> 지나갈 수 있는지 판단할 때 유용하다.

다만 여기에도 조건이 붙는다. 문서가 경고를 두 개 달아놨다.

> **`SphereCast`는 구가 콜라이더와 겹쳐 있는 경우 그 콜라이더를 감지하지
> 않는다.**

> 히트 노멀이 **항상 표면 노멀을 나타내지는 않는다.** 접촉점에서 구의 중심을
> 향하는 방향인 경우가 많다.

첫 번째가 실전에서 걸린다. **구를 발밑에서 시작하면 이미 바닥과 겹쳐서 감지가
안 된다.** 시작점을 캡슐 안쪽 위로 올려야 한다. 두 번째 때문에 **경사도
판정에 `SphereCast`의 노멀을 쓰면 안 된다.**

## 어디에 왜 쓰나

정리하면 접지 판정에 쓸 수 있는 재료가 셋이다 — `Move`가 돌려주는 값,
스윕 쿼리, 그리고 시간.

### `Move`가 이미 알려주는 것

원문이 놓친 게 하나 있다. `Move`는 `void`가 아니다.

> `public CollisionFlags Move(Vector3 motion);`

> 충돌 방향을 나타내는 `CollisionFlags`를 반환한다 — `None`, `Sides`,
> `Above`, `Below`.

**이미 호출하고 있는 메서드가 그 프레임의 결과를 돌려준다.** `isGrounded`의
한 프레임 지연을 피하는 가장 싼 방법이 이것이다.

```csharp
CollisionFlags flags = _controller.Move(_velocity * Time.deltaTime);

// 이 프레임의 결과다. 다음 프레임의 isGrounded가 아니다.
bool touchedGround = (flags & CollisionFlags.Below) != 0;
```

### 점 대신 발자국으로

`SphereCast`를 쓸 때는 앞 절의 겹침 조건을 피해야 한다. 캡슐 반지름보다 조금
작은 구를, **캡슐 안쪽 위에서** 아래로 쓸어보낸다.

```csharp
using UnityEngine;

/// <summary>
/// CharacterController의 접지 판정을 발자국 크기로 검사한다.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class GroundProbe : MonoBehaviour
{
    private const float SKIN_MARGIN = 0.05f;

    [Header("Probe")]
    [SerializeField, Range(0.01f, 0.5f), Tooltip("발밑 몇 미터까지를 접지로 볼지")]
    private float _probeDistance = 0.15f;

    [SerializeField, Tooltip("바닥으로 인정할 레이어")]
    private string[] _groundLayers = { "Ground" };

    [SerializeField, Range(0f, 89f), Tooltip("이 각도를 넘는 경사는 바닥으로 치지 않는다")]
    private float _maxSlopeAngle = 45f;

    private CharacterController _controller;
    private int _mask;

    public bool IsGrounded { get; private set; }

    private void Awake()
    {
        _controller = GetComponent<CharacterController>();
        _mask = LayerMask.GetMask(_groundLayers);
    }

    public void Probe()
    {
        // 구를 캡슐 바닥보다 위에서 출발시킨다. 겹쳐 있으면 감지되지 않는다.
        float radius = _controller.radius - SKIN_MARGIN;
        Vector3 origin = transform.position
            + _controller.center
            - Vector3.up * (_controller.height * 0.5f - _controller.radius);

        float distance = _probeDistance + SKIN_MARGIN;

        if (!Physics.SphereCast(origin, radius, Vector3.down,
                out RaycastHit hit, distance, _mask, QueryTriggerInteraction.Ignore))
        {
            IsGrounded = false;
            return;
        }

        // SphereCast의 노멀은 표면 노멀이 아닐 수 있다. 레이로 다시 확인한다.
        if (Physics.Raycast(hit.point + Vector3.up * SKIN_MARGIN, Vector3.down,
                out RaycastHit surface, SKIN_MARGIN * 2f, _mask, QueryTriggerInteraction.Ignore))
        {
            IsGrounded = Vector3.Angle(surface.normal, Vector3.up) <= _maxSlopeAngle;
            return;
        }

        IsGrounded = true;
    }
}
```

몇 가지 의도를 적어둔다.

- **거리를 0.15미터로 뒀다.** 원문의 1.5미터는 관대함을 거리로 산 것이고,
  관대함이 필요하면 다음 절처럼 **시간으로 사는 편**이 낫다.
- **구를 캡슐 바닥보다 위에서 출발시킨다.** 겹치면 감지가 안 된다는 문서 조건
  때문이다.
- **경사 판정은 별도 레이로 한다.** `SphereCast`의 노멀은 표면 노멀이 아닐 수
  있다고 문서가 경고한다.
- **`QueryTriggerInteraction.Ignore`를 명시했다.** 트리거가 기본으로 잡히는
  건 [앞 글](/posts/physics-overlapsphere/)에서 확인한 대로다.

### 관대함은 거리가 아니라 시간으로

여기부터는 문서가 아니라 내 판단이다. 원문이 1.5미터로 얻으려 한 건
**"발이 떨어진 직후에도 점프가 먹히는 감각"** 이었을 것이다. 그런데 그걸
**거리로 사면 지형에 따라 값이 달라진다.** 발밑에 절벽이 있으면 1.4미터가
전부 허용 구간이고, 바로 아래 바닥이 있으면 아무 의미가 없다.

같은 것을 시간으로 사면 지형과 무관하다.

```csharp
private const float COYOTE_TIME = 0.12f;

private float _lastGroundedTime;

private void Update()
{
    _probe.Probe();

    if (_probe.IsGrounded)
    {
        _lastGroundedTime = Time.time;
    }

    bool canJump = Time.time - _lastGroundedTime <= COYOTE_TIME;
}
```

접지 판정 자체는 **엄격하게 유지**하고, 관대함은 `COYOTE_TIME` 한 곳에 모인다.
숫자의 의미가 "발밑 몇 미터"가 아니라 "발이 떨어지고 몇 초"라서 **조정 기준이
플레이 감각**이 된다.

### 쓰지 말아야 할 자리

- **`isGrounded`를 현재 상태로 읽는 것.** 지난 `Move`의 기록이다.
- **Min Move Distance를 0이 아닌 값으로 두는 것.** 문서가 0을 권한다.
- **접지 거리를 늘려서 점프 감각을 맞추는 것.** 지형에 따라 값이 달라진다.
- **`SphereCast`의 노멀로 경사 판정.** 표면 노멀이 아닐 수 있다.
- **발밑에서 시작하는 `SphereCast`.** 겹치면 감지되지 않는다.

이동 자체를 물리에 맡기는 선택지도 있는데, 그쪽 제약 조건 이야기는
[FreezePositionY가 얼리는 건 월드 Y다](/posts/rigidbody-constraints/)에
정리해뒀다.

## 정리

- **`isGrounded`는 "지난 `Move` 동안 닿았는가"다.** 현재를 묻는 센서가 아니라
  직전 호출의 기록이고, 읽는 시점과 한 프레임 어긋난다.
- **`Move`는 중력을 적용하지 않는다.** 중력을 직접 더하는 구조라 내리막에서
  매 프레임 살짝 뜬다. 원문의 증상이 이것이다.
- **Min Move Distance 0은 문서가 권하는 기본값이다.** "대부분의 상황에서 이
  값은 0으로 두어야 한다." 0이 아니었던 게 문제였다.
- **원문의 레이는 발밑 1.4미터까지를 접지로 친다.** 문제를 푼 건 맞지만
  판정을 크게 관대하게 만든 방식이다.
- **`Move`의 반환값 `CollisionFlags.Below`가 그 프레임의 답이다.** 이미
  호출하는 메서드에서 공짜로 나온다.
- **점보다 면적이 낫고, `SphereCast`에는 조건이 둘 있다.** 겹치면 감지 안
  되고, 노멀이 표면 노멀이 아닐 수 있다.

증상을 고친 코드와 원인을 설명하는 문서가 따로 놀 때가 있다. 원문은 증상을
정확히 관찰했고 동작하는 해법에 도달했는데, **`isGrounded`가 무엇을 재는
값인지**를 확인하는 단계가 빠져 있었다. 나도 그 코드를 그대로 가져다 썼다면
1.5라는 숫자가 어디서 왔는지 모른 채 썼을 것이다. 같은 증상을 만났을 때
먼저 볼 것은 대처법이 아니라 **그 값이 무엇을 재는지 적힌 한 줄**이었다.

---

### 참고

- [CharacterController.isGrounded — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/CharacterController-isGrounded.html)
- [CharacterController.Move](https://docs.unity3d.com/ScriptReference/CharacterController.Move.html)
- [CharacterController.minMoveDistance](https://docs.unity3d.com/ScriptReference/CharacterController-minMoveDistance.html)
- [CharacterController.skinWidth](https://docs.unity3d.com/ScriptReference/CharacterController-skinWidth.html)
- [Physics.Raycast](https://docs.unity3d.com/ScriptReference/Physics.Raycast.html)
- [Physics.SphereCast](https://docs.unity3d.com/ScriptReference/Physics.SphereCast.html)

이 글의 출발점이 된 자료는 [rohyunsang — Unity CharacterController isGrounded 판정 개선](https://velog.io/@rohyunsang/Unity-CharacterController-isGrounded-%ED%8C%90%EC%A0%95-%EA%B0%9C%EC%84%A0)
이다. 증상과 해법을 그대로 두고, 원인과 숫자를 현행 스크립팅 레퍼런스로
대조했다.
