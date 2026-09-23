---
pubDatetime: 2026-09-23T18:00:00+09:00
title: "OverlapCapsule의 point0·point1은 캡슐의 끝이 아니다"
lang: ko
translationKey: physics-overlapcapsule
featured: false
draft: false
tags:
  - Unity
  - 물리
  - C#
  - 최적화
description: "문서가 point0을 '캡슐 start 쪽 구의 중심'이라고 적는다. 끝점이 아니라 반구의 중심이다. 이걸 맨 끝으로 읽으면 캡슐이 반지름의 두 배만큼 커진다."
---

`Physics.OverlapSphere`를 찾아보다가 **Overlap 계열에 뭐가 더 있는지**
둘러보던 중에 스크랩한 글이다. 클리핑이 첫 줄부터 그 답을 준다.

> Overlap함수 종류로는, OverlapBox, OverlapSphere, OverlapCapsule 가 있습니다.

셋이고, 그중 `OverlapCapsule`의 `point0`·`point1`에 무엇을 넣어야 하는지를
다룬 2019년 글이다. 글쓴이도 같은 데서 막혔다고 적어뒀다.

> **OverlapCapsule 함수에 들어가는 매개변수중에서 point0, point1 두 인자가
> 어떻게 값을 넣어야하는지 궁금햇습니다. 구글링해도 딱히 사용법도 안올라와서
> 제가 해봣습니다.**

직접 해보고 정리한 글이라 예제가 구체적이고, 실제로 동작한다. 그런데
**그 결론 한 줄이 문서와 어긋난다.** 어긋나는 폭이 정확히 `radius`만큼이라,
반지름이 클수록 의도와 실제가 벌어진다.

## 목차

## 2019년 글이 맞게 짚은 것

먼저 맞는 쪽부터. 시그니처를 그대로 옮겨왔고, 지금 문서와 같다.

```csharp
public static Collider[] OverlapCapsule(
    Vector3 point0,
    Vector3 point1,
    float radius,
    int layerMask = AllLayers,
    QueryTriggerInteraction queryTriggerInteraction = QueryTriggerInteraction.UseGlobal);
```

Overlap 계열이 `OverlapBox` · `OverlapSphere` · `OverlapCapsule` 셋이라는
것도 맞고, 두 점의 **순서가 상관없다**는 것도 맞다. 원문 예제가
`OverlapCapsule(pos2, pos1, radius)`로 위쪽을 먼저 넘기는데, 캡슐은 두 구를
잇는 도형이라 어느 쪽을 먼저 주든 같은 모양이 나온다.

문제는 그다음 한 줄이다.

## `point0`·`point1`은 캡슐의 끝이 아니다

원문의 결론이다.

> **결론적의미는 캡슐의 맨위쪽 위치와 맨아래쪽 위치를 말하는겁니다.**

문서는 이렇게 적는다.

> **point0** — 캡슐의 `start` 쪽 **구의 중심**.

> **point1** — 캡슐의 `end` 쪽 **구의 중심**.

**"구의 중심"이지 "캡슐의 끝"이 아니다.** 캡슐은 두 구를 잇고 그 구들을
그대로 양 끝에 붙인 도형이다. 그러니 실제 캡슐은 `point0`에서 **바깥으로
`radius`만큼 더 나가고**, `point1` 쪽에서도 똑같이 더 나간다.

이건 Unity가 캡슐을 다루는 방식과 일관된다. `CapsuleCollider.height` 문서가
같은 이야기를 반대편에서 한다.

> **높이는 양 끝의 반구를 포함한 실제 높이다.**

즉 Unity에서 "캡슐의 높이"는 반구까지 포함한 값이고, `point0`/`point1`은 그
반구의 **중심**이다. 둘은 `radius`만큼 어긋나 있는 서로 다른 기준점이다.

## 그래서 실제 캡슐은 얼마나 커지나

식으로 쓰면 이렇다.

```
실제 총 높이 = |point1 - point0| + 2 × radius
```

원문 예제에 대입해본다. `radius = 5f`, 두 점은 `Tr.position.y`에서
`±ConstHeight`다.

| | 의도한 것 | 실제 캡슐 |
|---|---|---|
| 두 점 사이 거리 | `2 × ConstHeight` | `2 × ConstHeight` |
| 총 높이 | `2 × ConstHeight` | **`2 × ConstHeight + 10`** |
| `ConstHeight = 1`이면 | 2 | **12** |
| `ConstHeight = 5`이면 | 10 | **20** |

`ConstHeight`가 반지름보다 작으면 **캡슐이 사실상 구 두 개**가 된다.
`ConstHeight = 1`일 때 의도한 높이는 2인데 실제는 12이니, 여섯 배다. 주변
적 탐지에 이걸 쓰면 "왜 뒤에 있는 적까지 잡히지"가 된다.

반대로 가는 경우도 있다. `|point1 - point0|`를 원하는 높이로 그대로 넣으면
항상 `2 × radius`만큼 크게 잡힌다. **정확한 높이를 원한다면 두 점 사이
거리는 `height - 2 × radius`여야 한다.**

두 점이 같으면(`point0 == point1`) 두 구가 겹쳐서 **그냥 구**가 된다.
`OverlapSphere`와 같은 판정이 되는 셈이다. 높이가 `2 × radius` 이하인
캡슐을 만들 수 없는 것도 같은 이유다.

## `CapsuleCollider`에서 두 점 만들어내기

실전에서 `point0`/`point1`을 손으로 적는 경우는 드물다. 대개 이미 있는
`CapsuleCollider`나 캐릭터 규격에서 만들어낸다. 위 관계를 그대로 코드로
옮기면 이렇다.

```csharp
using UnityEngine;

public static class CapsuleGeometry
{
    /// <summary>
    /// CapsuleCollider에서 OverlapCapsule에 넘길 두 구의 중심을 구한다.
    /// direction이 Y축(기본값)이고 스케일이 균등한 경우를 전제한다.
    /// </summary>
    public static void GetPoints(
        CapsuleCollider capsule, out Vector3 point0, out Vector3 point1)
    {
        Transform t = capsule.transform;
        Vector3 center = t.TransformPoint(capsule.center);

        // height는 반구 두 개를 포함한 값이다.
        // 구 중심 사이의 거리는 거기서 지름을 뺀 것이고, 음수가 될 수 없다.
        float halfSpan = Mathf.Max(0f, capsule.height * 0.5f - capsule.radius);

        Vector3 axis = t.up;
        point0 = center - axis * halfSpan;
        point1 = center + axis * halfSpan;
    }
}
```

`Mathf.Max`가 붙은 이유가 앞 절의 마지막 문장이다. `height`가
`2 × radius`보다 작으면 `halfSpan`이 음수가 되는데, 그러면 두 점이 뒤집혀서
의미가 없다. 0으로 막으면 두 점이 겹쳐 구가 되고, 그게 기하학적으로 맞는
답이다.

## 나머지 인자 둘은 기본값으로 숨어 있다

원문 예제는 인자를 셋만 넘긴다.

```csharp
Collider[] colls = Physics.OverlapCapsule(pos2, pos1, radius);
```

뒤의 둘은 기본값으로 들어간다. 이 기본값이 직관과 다른 자리가 둘 있다.

**레이어 마스크는 `AllLayers`다.** `Physics.Raycast`의 기본값인
`DefaultRaycastLayers`와 다르다. `DefaultRaycastLayers`는 `Ignore Raycast`
레이어를 빼지만, `AllLayers`는 빼지 않는다. **쿼리에서 제외하려고 `Ignore
Raycast`에 올려둔 오브젝트가 `OverlapCapsule`에는 그대로 잡힌다.** 이
차이는 [OverlapSphere 글](/posts/physics-overlapsphere/)에서 따로 파고들었다.

**트리거도 기본으로 잡힌다.** `QueryTriggerInteraction.UseGlobal`은 프로젝트
설정을 따르겠다는 뜻이고, 그 설정인 Queries Hit Triggers는 **기본으로 켜져
있다.**

> 이 옵션을 켜면 Raycast, SphereCast, SphereTest 같은 물리 히트 테스트가
> **Trigger로 표시된 콜라이더와 교차할 때 히트를 반환한다.**

둘 다 명시하면 이렇게 된다.

```csharp
[SerializeField] private LayerMask _targetLayers;

Collider[] hits = Physics.OverlapCapsule(
    point0, point1, radius,
    _targetLayers,
    QueryTriggerInteraction.Ignore);
```

## NonAlloc은 "메모리가 덜 쌓인다"가 아니다

원문이 `NonAlloc`을 이렇게 설명한다.

> OverlapCapsuleNonAlloc는 할당한 충돌체들을 반환하지않고 충돌한 갯수를
> 반환합니다. 그러므로 OverlapCapsule 사용할때보다 **메모리 누적이 덜되기
> 때문에** 게임부하에 덜주게 됩니다.

방향은 맞다. 문서 표현은 더 단호하다.

> `Physics.OverlapCapsule`과 같지만 **관리 힙에 아무것도 할당하지 않는다.**

"덜"이 아니라 **0**이다. 대신 조건이 붙는데, 원문에 없는 그 조건이 실제로
버그를 만든다. `OverlapSphereNonAlloc` 문서가 분명하게 적어놨다.

> **공간이 부족해도 버퍼를 늘리려 하지 않는다. 버퍼가 가득 차면 버퍼의
> 길이가 반환된다.**

**넘친 콜라이더는 조용히 버려진다.** 예외도 경고도 없다. 반환값이 버퍼
길이와 같으면 그건 "딱 맞았다"가 아니라 **"더 있었을 수도 있다"**로 읽어야
한다.

```csharp
private const int MAX_HITS = 16;
private readonly Collider[] _hits = new Collider[MAX_HITS];

private int ScanCapsule(Vector3 point0, Vector3 point1, float radius)
{
    int count = Physics.OverlapCapsuleNonAlloc(
        point0, point1, radius, _hits, _targetLayers, QueryTriggerInteraction.Ignore);

    // 가득 찼다 = 잘렸을 수 있다. 전수 판정이 필요한 로직이면 버퍼를 키워야 한다.
    if (count == MAX_HITS)
    {
        Debug.LogWarning($"OverlapCapsule 결과가 버퍼({MAX_HITS})를 채웠다. 잘렸을 수 있다.");
    }

    return count;
}
```

그리고 **버퍼를 매 프레임 새로 만들면 `NonAlloc`을 쓰는 의미가 없다.**
`readonly` 필드로 한 번만 만들어 재사용해야 한다.

## 어디에 왜 쓰나

캡슐 판정이 구보다 나은 자리는 분명하다. **세로로 긴 판정 범위**다. 구는
반지름을 키우면 사방으로 같이 커지지만, 캡슐은 한 축으로만 늘릴 수 있다.
키 큰 캐릭터의 몸 전체, 계단 위아래를 함께 보는 탐지, 세로로 긴 무기의
타격 범위가 그런 경우다.

### 캡슐로 전방 근접 판정하기

```csharp
using UnityEngine;

/// <summary>
/// 캐릭터 정면에 세로로 긴 캡슐을 만들어 그 안의 대상을 찾는다.
/// </summary>
[RequireComponent(typeof(CapsuleCollider))]
public class CapsuleMeleeSensor : MonoBehaviour
{
    private const int MAX_HITS = 16;

    [Header("Range")]
    [SerializeField, Range(0.1f, 3f), Tooltip("캡슐의 반지름(m)")]
    private float _radius = 0.6f;

    [SerializeField, Range(0.2f, 6f), Tooltip("반구를 포함한 캡슐의 총 높이(m)")]
    private float _height = 2f;

    [SerializeField, Range(0f, 5f), Tooltip("캐릭터 앞으로 밀어낼 거리(m)")]
    private float _forwardOffset = 1f;

    [Header("Filter")]
    [SerializeField] private LayerMask _targetLayers;

    private readonly Collider[] _hits = new Collider[MAX_HITS];
    private CapsuleCollider _body;

    private void Awake()
    {
        TryGetComponent(out _body);
    }

    /// <summary>범위 안에서 찾은 대상 수를 반환한다.</summary>
    public int Scan()
    {
        GetQueryPoints(out Vector3 point0, out Vector3 point1);

        int count = Physics.OverlapCapsuleNonAlloc(
            point0, point1, _radius, _hits, _targetLayers, QueryTriggerInteraction.Ignore);

        if (count == MAX_HITS)
        {
            Debug.LogWarning($"{name}: 캡슐 판정이 버퍼를 채웠다. 잘렸을 수 있다.");
        }

        for (int i = 0; i < count; i++)
        {
            // 자기 자신은 건너뛴다. 캡슐이 몸을 감싸고 있으면 반드시 걸린다.
            if (_hits[i].transform.root == transform.root) { continue; }

            if (_hits[i].TryGetComponent(out Damageable target))
            {
                target.ApplyHit();
            }
        }

        return count;
    }

    /// <summary>
    /// 두 구의 중심을 구한다. _height는 반구를 포함한 값이므로
    /// 중심 사이 거리는 거기서 지름을 뺀 것이다.
    /// </summary>
    private void GetQueryPoints(out Vector3 point0, out Vector3 point1)
    {
        float halfSpan = Mathf.Max(0f, _height * 0.5f - _radius);

        Vector3 origin = transform.position
            + transform.forward * _forwardOffset
            + transform.up * (_height * 0.5f);

        point0 = origin - transform.up * halfSpan;
        point1 = origin + transform.up * halfSpan;
    }

    private void OnDrawGizmosSelected()
    {
        // 두 구를 따로 그린다. 이게 실제로 판정되는 범위다.
        GetQueryPoints(out Vector3 point0, out Vector3 point1);
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(point0, _radius);
        Gizmos.DrawWireSphere(point1, _radius);
    }
}
```

`OnDrawGizmosSelected`를 굳이 넣은 이유가 이 글의 요지다. **두 구를 그려보면
캡슐이 두 점보다 위아래로 더 나간다는 게 눈에 보인다.** 숫자로 헷갈릴 일을
기즈모가 한 번에 정리해준다.

### 원문 코드에서 고친 것

원문 코드는 이랬다.

```csharp
void Update()
    {

        //반경
    float radius = 5f;

        //캡슐의 맨아래 위치
        Vector3 pos1 = new Vector3(Tr.position.x, Tr.position.y-ConstHeight, Tr.position.z);
        //캡슐의 맨위 위치
        Vector3 pos2 = new Vector3(Tr.position.x, Tr.position.y + ConstHeight, Tr.position.z);

        Collider[] colls = Physics.OverlapCapsule(pos2, pos1, radius);

        for (int i = 0; i < colls.Length; i++)
        {

            _player = colls[i].GetComponent<Player_Script>();

            if(_player != null)
            {
               //...
            }
        }


    }
```

고친 것과 이유다.

- **주석의 "캡슐의 맨아래/맨위 위치"를 바로잡았다.** 그 자리는 **반구의
  중심**이고, 실제 캡슐은 거기서 `radius`만큼 더 나간다.
- **`Update`에서 매 프레임 호출하지 않는다.** 근접 공격 판정은 입력이 있을
  때만 필요하다. 매 프레임 필요한 탐지라면 간격을 두고 돌린다.
- **`GetComponent` 대신 `TryGetComponent`.** 원문은 못 찾았을 때도 결과를
  `_player` 필드에 대입해버려서, 직전 프레임의 참조가 덮어써진다.
- **`OverlapCapsule` 대신 `OverlapCapsuleNonAlloc` + 재사용 버퍼.** 매
  프레임 배열이 새로 생기지 않는다.
- **레이어 마스크와 트리거 처리를 명시했다.** 기본값은 `AllLayers`이고
  트리거를 포함한다.
- **자기 자신을 걸러낸다.** 몸을 감싸는 캡슐이면 자기 콜라이더가 반드시
  잡힌다.

### 쓰지 말아야 할 자리

- **`point0`/`point1`에 원하는 높이의 양 끝을 그대로 넣기.** `2 × radius`만큼
  커진다.
- **`height`를 그대로 두 점 사이 거리로 쓰기.** 같은 이유다.
  `height - 2 × radius`가 맞다.
- **`Update`에서 무조건 호출.** 판정이 필요한 순간에만 부른다.
- **`NonAlloc`의 반환값을 검사하지 않기.** 버퍼가 가득 차면 조용히 잘린다.
- **`NonAlloc` 버퍼를 메서드 안에서 새로 만들기.** 그러면 할당이 그대로다.
- **캡슐이 필요 없는데 캡슐 쓰기.** 두 점이 같으면 구다. 그 경우
  `OverlapSphere`가 의도를 더 잘 드러낸다.

## 정리

- **`point0`·`point1`은 "구의 중심"이다.** 문서 표현 그대로 "캡슐의 start /
  end 쪽 구의 중심"이고, **캡슐의 끝이 아니다.**
- **실제 총 높이는 `|point1 - point0| + 2 × radius`다.** 원하는 높이가 있다면
  두 점 사이 거리는 `height - 2 × radius`여야 한다.
- 이건 Unity의 일관된 규약이다. `CapsuleCollider.height` 문서도 **"양 끝의
  반구를 포함한 실제 높이"**라고 적는다.
- **두 점이 같으면 구가 된다.** 높이가 `2 × radius` 이하인 캡슐은 없다.
- **두 점의 순서는 상관없다.** 원문이 위쪽을 먼저 넘기는 것도 문제없다.
- **레이어 마스크 기본값은 `AllLayers`다.** `Raycast`의
  `DefaultRaycastLayers`와 달라서 `Ignore Raycast`가 걸러지지 않는다.
- **트리거는 기본으로 잡힌다.** Queries Hit Triggers가 기본으로 켜져 있다.
- **`NonAlloc`은 "덜 할당"이 아니라 "관리 힙에 아무것도 할당하지 않는다"다.**
  대신 **버퍼를 늘리지 않고, 가득 차면 나머지를 조용히 버린다.**

글쓴이가 문서를 읽고 막힌 지점("구의 중심? 무슨 말인가 했었죠")이 정확했다.
그 표현이 실제로 불친절하다. 다만 **직접 해보고 내린 결론이 "맨 위와 맨
아래"였고, 그게 문서 표현과 `radius`만큼 어긋났다.** 반지름이 작으면 티가
안 나고, 원문처럼 `5f`쯤 되면 캡슐이 10만큼 길어진다.

---

### 참고

- [Physics.OverlapCapsule — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics.OverlapCapsule.html)
- [Physics.OverlapCapsuleNonAlloc — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics.OverlapCapsuleNonAlloc.html)
- [Physics.OverlapSphereNonAlloc — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [CapsuleCollider.height — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/CapsuleCollider-height.html)
- [Physics.queriesHitTriggers — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics-queriesHitTriggers.html)
- [Physics Manager — Unity 매뉴얼](https://docs.unity3d.com/Manual/class-PhysicsManager.html)

이 글의 출발점이 된 자료는 [송호정 — \[Unity\] Physics.OverlapCapsule 함수 사용법](https://dallcom-forever2620.tistory.com/40)
(2019-09-19)이다. 예제 코드와 설명을 그대로 따라가면서, `point0`/`point1`의
의미를 현행 스크립팅 레퍼런스와 대조했다.
