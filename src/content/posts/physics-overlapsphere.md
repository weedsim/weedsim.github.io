---
pubDatetime: 2026-09-17T23:00:00+09:00
title: "OverlapSphere는 Ignore Raycast 레이어를 무시하지 않는다"
lang: ko
translationKey: physics-overlapsphere
featured: false
draft: false
tags:
  - Unity
  - 물리
  - C#
  - 최적화
description: "같은 Physics 클래스인데 Raycast와 OverlapSphere의 기본 레이어 마스크가 다르다. 쿼리에서 빼두려고 Ignore Raycast에 올려둔 오브젝트가 OverlapSphere에는 그대로 잡힌다."
---

주변 적 탐지를 붙이려고 처음 찾아봤고, 나중에 근접 공격 판정 때문에 또
열었다. 자주 돌아오게 되는 문서라 스크랩해뒀던 2019년 글이다.
`Physics.OverlapSphere` 하나를 설명하는데, 요지가 명확하다.

> 중점과 반지름으로 가상의 원을 만들어 추출하려는 반경 이내에 들어와 있는
> 콜라이더들을 반환하는 함수

맞는 설명이다. 그런데 이 함수는 **인자 네 개 중 뒤의 둘이 기본값으로
숨어 있고**, 그 기본값이 옆에 있는 `Physics.Raycast`와 다르다.

그리고 호출할 때마다 배열이 새로 생긴다는 게 걸려서 `NonAlloc` 쪽을 찾아보던
참이기도 했다. 며칠 전
[Unity 코드 최적화 문서](/posts/unity-code-optimization/)를 정리하면서 그
함수를 예제에 썼는데, 그때 안 짚고 넘어간 것들이 여기 있다.

## 목차

## 2019년 글이 맞는 것과 헐거운 것

원문의 설명은 대체로 정확하다. 공식 문서와 대조하면 이렇다.

| 원문 | 문서 |
|---|---|
| "콜라이더들을 반환" | "구 안에 있거나 닿아 있는 모든 콜라이더가 담긴 **배열**을 반환한다" |
| "특정 레이어만 검출할 수도" | "레이어 마스크는 쿼리에 **포함할** 콜라이더 레이어를 정의한다" |
| "순간 판정이 필요할 때 아주 유용한" | — |

원문이 레이어 마스크를 두고 **"무시하는 것이 아니라 특정 레이어 검출"** 이라고
따로 강조해둔 게 눈에 띈다. 문서의 "포함할 레이어를 정의한다"와 같은 이야기고,
`Raycast`에서 마스크를 제외용으로 쓰던 습관 때문에 실제로 헷갈리는 지점이다.

헐거운 곳은 한 군데다.

> 레이어는 비트 연산 표기법을 사용해서 **10번째 레이어를 의미하는 `1 << 10`** 을
> 사용했으며

`1 << 10`은 **레이어 인덱스 10번**이다. 레이어는 0부터 세므로, 1부터 세는
"10번째"와는 한 칸 어긋난다. Unity의 내장 레이어가 0~7을 쓰고 사용자 레이어는
8번부터 시작하니, 인덱스 10은 사용자가 만든 **세 번째** 레이어다.

숫자가 맞느냐보다 중요한 건 **이 표기가 깨지기 쉽다**는 쪽이다. 레이어 순서를
바꾸거나 누가 중간에 하나 끼워 넣으면 `1 << 10`은 조용히 다른 레이어를
가리킨다. 이름으로 쓰는 쪽이 있다.

```csharp
// 깨지기 쉬움 — 레이어 순서가 바뀌면 조용히 다른 곳을 가리킨다
int mask = 1 << 10;

// 이름으로 — 레이어를 옮겨도 따라간다
int mask = LayerMask.GetMask("Enemy");
```

`LayerMask.GetMask`는 문서 설명이 이렇다 — "Tags and Layers 매니저에 정의된
내장 또는 사용자 레이어 이름들이 주어지면, 그 전부에 해당하는 **레이어 마스크를
반환**한다." 이름을 여러 개 넘길 수 있는 `params` 형태다.

## 기본 레이어 마스크가 `Raycast`와 다르다

여기가 이 글을 쓰게 만든 부분이다. 선언을 보자.

```csharp
public static Collider[] OverlapSphere(Vector3 position,
                                       float radius,
                                       int layerMask = AllLayers,
                                       QueryTriggerInteraction queryTriggerInteraction
                                           = QueryTriggerInteraction.UseGlobal);
```

`layerMask`의 기본값이 **`AllLayers`** 다. 그런데 같은 `Physics` 클래스의
`Raycast`는 이렇다.

```csharp
int layerMask = DefaultRaycastLayers,
```

두 상수가 다르다. 문서가 `DefaultRaycastLayers`를 이렇게 설명한다.

> **ignore raycast 레이어를 제외한** 모든 레이어.

정리하면 이렇다.

| 함수 | 기본 `layerMask` | Ignore Raycast 레이어가 |
|---|---|---|
| `Physics.Raycast` | `DefaultRaycastLayers` | **빠진다** |
| `Physics.OverlapSphere` | `AllLayers` | **잡힌다** |
| `Physics.OverlapSphereNonAlloc` | `AllLayers` | **잡힌다** |

**"Ignore Raycast" 레이어에 올려두면 물리 쿼리에서 빠질 것**이라고 생각하기
쉬운데, 그건 `Raycast` 계열에만 해당한다. 이름이 Ignore **Raycast**이니
따지고 보면 이름값을 하는 셈인데, 실무에서는 "쿼리에서 빼두는 레이어"로
쓰는 경우가 많아서 어긋난다.

시각 효과용 콜라이더나 클릭 판정을 피하려고 그 레이어에 올려둔 오브젝트가
**주변 탐색에는 그대로 걸린다.** 마스크를 명시하지 않았다면 그렇다.

교훈은 단순하다. **`OverlapSphere`에서 `layerMask`를 생략하지 않는다.**

## 트리거도 기본으로 잡힌다

네 번째 인자도 기본값에 숨어 있다.
`QueryTriggerInteraction.UseGlobal`은 프로젝트 설정의 전역값을 따른다는
뜻이고, 그 전역값은 Physics 설정의 **Queries Hit Triggers**다. 매뉴얼의
설명이 분명하다.

> 레이캐스트, 스피어캐스트, 스피어 테스트 같은 물리 히트 테스트가 **트리거로
> 표시된 콜라이더와 교차할 때 히트를 반환**하게 하려면 이 옵션을 활성화한다.
> 개별 레이캐스트가 이 동작을 재정의할 수 있다. **기본적으로 이 설정은
> 활성화되어 있다.**

즉 **기본 상태에서 트리거가 결과에 들어온다.** 아이템 획득 범위나 이벤트
영역처럼 트리거로 만들어둔 콜라이더가 "주변 적 탐색"에 섞여 나온다.

레이어로 이미 걸러내고 있다면 대개 문제가 안 되지만, 같은 레이어에 트리거와
솔리드 콜라이더가 섞여 있다면 인자로 명시하는 편이 낫다.

```csharp
Physics.OverlapSphere(center, radius, mask, QueryTriggerInteraction.Ignore);
```

한 가지 더. 문서는 **반환 순서에 대해 아무 말도 하지 않는다.** 가까운 순으로
정렬되어 있다고 가정하면 안 된다. 가장 가까운 것을 찾으려면 직접 골라야 한다.

## 어디에 왜 쓰나

원문이 든 예가 좋다 — "주변 동료 몬스터가 공격당했을 때 같이 공격 태세로
전환". 한 점 주변을 **한 번에** 훑는 판정이 필요한 자리다. 근접 공격 범위,
폭발 피해, 어그로 전파, 상호작용 가능한 물체 찾기.

### 근접 공격 판정 — 단순한 판

가장 먼저 쓰게 되는 형태다. 공격 모션의 특정 프레임에서 한 번 호출한다.

```csharp
using UnityEngine;

/// <summary>
/// 공격 모션 중 한 번 호출되어 범위 안의 대상에게 피해를 준다.
/// </summary>
public class MeleeAttack : MonoBehaviour
{
    [Header("Attack")]
    [SerializeField, Tooltip("판정의 중심. 보통 무기나 손 본")]
    private Transform _origin;

    [SerializeField, Range(0.1f, 5f), Tooltip("판정 반경(미터)")]
    private float _radius = 1.5f;

    [SerializeField, Range(1f, 999f), Tooltip("피해량")]
    private float _damage = 10f;

    [SerializeField, Tooltip("판정할 레이어 이름")]
    private string[] _targetLayers = { "Enemy" };

    private int _mask;

    private void Awake()
    {
        _mask = LayerMask.GetMask(_targetLayers);
    }

    /// <summary>애니메이션 이벤트에서 호출한다.</summary>
    public void Strike()
    {
        Collider[] hits = Physics.OverlapSphere(
            _origin.position, _radius, _mask, QueryTriggerInteraction.Ignore);

        foreach (Collider hit in hits)
        {
            if (hit.TryGetComponent(out IDamageable target))
            {
                target.TakeDamage(_damage);
            }
        }
    }
}
```

이 정도면 충분히 동작한다. 마스크와 트리거 처리를 명시했으니 앞 절의 함정도
피했다. **공격할 때만 한 번 호출된다면 여기서 멈춰도 된다.**

문제는 호출 빈도가 올라갈 때다. 문서가 `OverlapSphere`에 대해 직접 적어놨다 —
**"메모리를 할당한다"**, 그리고 대안으로 `Physics.OverlapSphereNonAlloc`을
가리킨다.

### 같은 코드를 NonAlloc으로

바꿀 곳은 세 군데다. 버퍼를 필드로 올리고, 반환값의 의미가 바뀌고, 순회
방식이 바뀐다.

```csharp
public class MeleeAttack : MonoBehaviour
{
    private const int BUFFER_SIZE = 16;

    // ... 위와 같은 직렬화 필드 ...

    // 1) 결과를 담을 버퍼를 한 번만 할당하고 재사용한다.
    private readonly Collider[] _hits = new Collider[BUFFER_SIZE];

    private int _mask;

    public void Strike()
    {
        // 2) 반환값이 배열이 아니라 "버퍼에 담긴 개수"다.
        int count = Physics.OverlapSphereNonAlloc(
            _origin.position, _radius, _hits, _mask, QueryTriggerInteraction.Ignore);

        if (count == _hits.Length)
        {
            Debug.LogWarning(
                $"[{nameof(MeleeAttack)}] 버퍼 {BUFFER_SIZE}개가 가득 찼다. " +
                "결과가 잘렸을 수 있다.", this);
        }

        // 3) foreach를 쓰면 안 된다. count까지만 돈다.
        for (int i = 0; i < count; i++)
        {
            if (_hits[i].TryGetComponent(out IDamageable target))
            {
                target.TakeDamage(_damage);
            }
        }
    }
}
```

세 번째가 **옮길 때 가장 자주 틀리는 자리**다.

```csharp
// 틀림 — 버퍼 전체를 돈다
foreach (Collider hit in _hits) { ... }

// 맞음 — 이번 호출이 채운 만큼만 돈다
for (int i = 0; i < count; i++) { ... }
```

버퍼는 재사용되므로 **`count` 뒤쪽에는 지난 호출이 남긴 참조가 그대로 있다.**
`foreach`로 돌면 이미 범위를 벗어난 적을 다시 때린다. 컴파일도 되고 대개
동작도 해서, 적이 몰렸다 흩어진 뒤에야 증상이 나온다.

두 판을 나란히 놓으면 이렇다.

| | `OverlapSphere` | `OverlapSphereNonAlloc` |
|---|---|---|
| 결과를 받는 법 | 반환값이 `Collider[]` | **인자로 준 버퍼에 채움** |
| 반환값 | 배열 | **개수(`int`)** |
| 할당 | **호출마다 새 배열** | 없음 |
| 순회 | `foreach` 가능 | **`count`까지만 `for`** |
| 결과가 넘칠 때 | 전부 담긴다 | **조용히 잘린다** |

마지막 줄이 `NonAlloc`이 대가로 받는 것이다. 문서 표현이 이렇다.

> 공간이 부족해도 **버퍼를 늘리려 시도하지 않는다.** 버퍼가 가득 차면 **버퍼의
> 길이가 반환된다.**

반환값은 "버퍼에 저장된 콜라이더의 개수"다. 그러니 **반환값이 버퍼 길이와
같으면, 딱 맞게 찼는지 넘쳐서 잘렸는지 구분할 수 없다.** 위 코드에 경고를
넣은 이유다.

앞서 최적화 글에서 `MAX_HITS = 32`짜리 버퍼를 쓰는 예제를 썼는데, 그 숫자가
위험할 수 있는 지점이 정확히 여기다. 반경이 넓거나 적이 몰리는 구간에서
32개가 차면 나머지는 없는 것처럼 동작한다. 대처는 둘 중 하나다 — **최악의
경우를 넉넉히 잡거나**(버퍼는 한 번만 할당하므로 32를 64로 키우는 비용은 거의
없다), **가득 찬 경우를 감지해 알리거나.**

### 주변 적 탐지 — 반복 호출에서

근접 공격은 가끔 호출되지만, 적 탐지는 주기적으로 돈다. `NonAlloc`이 실제로
값을 하는 쪽은 이쪽이다.

```csharp
using UnityEngine;

/// <summary>
/// 반경 안의 적을 주기적으로 훑어 가장 가까운 대상을 고른다.
/// </summary>
[RequireComponent(typeof(Rigidbody))]
public class EnemyProbe : MonoBehaviour
{
    private const int BUFFER_SIZE = 32;

    [Header("Probe")]
    [SerializeField, Range(1f, 50f), Tooltip("탐지 반경(미터)")]
    private float _radius = 10f;

    [SerializeField, Tooltip("탐지할 레이어 이름")]
    private string[] _targetLayers = { "Enemy" };

    private readonly Collider[] _hits = new Collider[BUFFER_SIZE];

    private int _mask;
    private Rigidbody _rigidbody;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();
        // 이름으로 마스크를 만든다. 레이어 순서가 바뀌어도 따라간다.
        _mask = LayerMask.GetMask(_targetLayers);
    }

    public Transform FindNearest()
    {
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _hits, _mask, QueryTriggerInteraction.Ignore);

        Transform best = null;
        float bestSqr = float.MaxValue;
        Vector3 origin = transform.position;

        for (int i = 0; i < count; i++)
        {
            Collider hit = _hits[i];

            // 자기 자신을 뺀다. 자식 콜라이더도 같은 리지드바디를 가리킨다.
            if (hit.attachedRigidbody == _rigidbody)
            {
                continue;
            }

            // 문서에 정렬 보장이 없으므로 직접 고른다.
            float sqr = (hit.transform.position - origin).sqrMagnitude;
            if (sqr < bestSqr)
            {
                bestSqr = sqr;
                best = hit.transform;
            }
        }

        return best;
    }
}
```

두 가지만 덧붙인다.

- **자기 자신은 `attachedRigidbody`로 판별한다.** 콜라이더가 자식 오브젝트에
  붙어 있으면 `hit.transform`은 자기 자신이 아니지만 `attachedRigidbody`는
  같다.
- **가장 가까운 것은 직접 고른다.** 문서에 반환 순서에 대한 보장이 없다.

### 쓰지 말아야 할 자리

- **매 프레임 호출.** 문서가 `OverlapSphere`에 대해 할당을 경고한다. 매
  프레임이 필요하면 `NonAlloc` 판이고, 그조차도 간격을 두는 편이 낫다.
- **이동 제한.** 반경 안에 있는지 확인하는 것과 못 나가게 막는 것은 다른
  문제다. 후자는 물리 제약 쪽이고,
  [FreezePositionY가 얼리는 건 월드 Y다](/posts/rigidbody-constraints/)에
  정리해뒀다.
- **가까운 순 정렬을 가정하는 것.** 문서에 순서에 대한 보장이 없다.

한 가지 더. 오브젝트가 아주 많은 구간에서 이 판정을 여러 개 돌려야 한다면
**`OverlapSphereCommand`** 가 있다. 문서 설명이 "잡(job) 중에 비동기로 수행할
오버랩 스피어 커맨드를 설정하는 데 쓰는 구조체"이고, `ScheduleBatch`로 여러
개를 한 번에 돌린다. 하나씩 `for`로 부르는 것보다 이쪽이 맞는 자리가 있다.

## 정리

- **2019년 글의 설명은 맞다.** 특히 레이어 마스크가 "무시하는 게 아니라 검출할
  레이어"라는 강조가 문서와 일치한다.
- **`1 << 10`은 인덱스 10번이고, 1부터 세는 "10번째"와 한 칸 어긋난다.** 그보다
  중요한 건 이 표기가 레이어 순서 변경에 깨진다는 것이다.
  **`LayerMask.GetMask("Enemy")`** 를 쓴다.
- **기본 마스크가 `Raycast`와 다르다.** `Raycast`는 `DefaultRaycastLayers`라
  Ignore Raycast 레이어가 빠지지만, **`OverlapSphere`는 `AllLayers`라 그대로
  잡힌다.** 마스크를 생략하지 않는다.
- **트리거도 기본으로 잡힌다.** Queries Hit Triggers가 기본 활성이다. 필요하면
  `QueryTriggerInteraction.Ignore`를 명시한다.
- **반환 순서는 보장되지 않는다.** 가까운 순으로 정렬돼 있다고 가정하지 않는다.
- **`NonAlloc`으로 옮길 때 `foreach`를 남겨두면 안 된다.** 버퍼는 재사용되므로
  `count` 뒤쪽에 지난 호출의 참조가 남아 있다. 반드시 `count`까지만 돈다.
- **`NonAlloc`은 조용히 자른다.** 반환값이 버퍼 길이와 같으면 잘렸는지 알 수
  없다. 넉넉히 잡거나, 가득 찬 경우를 경고로 잡는다.

인자 네 개 중 둘이 기본값이라 세 줄짜리 호출로 보이는데, **그 기본값이
`Raycast`와 다르다**는 게 이 함수의 실제 함정이었다. 짧게 쓸 수 있는 API일수록
생략된 자리에 뭐가 들어가는지 한 번은 봐야 한다.

---

### 참고

- [Physics.OverlapSphere — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphere.html)
- [Physics.OverlapSphereNonAlloc](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [Physics.DefaultRaycastLayers](https://docs.unity3d.com/ScriptReference/Physics.DefaultRaycastLayers.html)
- [Physics.Raycast](https://docs.unity3d.com/ScriptReference/Physics.Raycast.html)
- [LayerMask.GetMask](https://docs.unity3d.com/ScriptReference/LayerMask.GetMask.html)
- [Physics 설정 — Queries Hit Triggers](https://docs.unity3d.com/Manual/class-PhysicsManager.html)
- [OverlapSphereCommand](https://docs.unity3d.com/ScriptReference/OverlapSphereCommand.html)

이 글의 출발점이 된 자료는 [dbxxrud — \[Unity 3D\] Physics.OverlapSphere](https://a-game-developer0724.tistory.com/54)
(2019-11-02)이다. 설명은 현행 문서와 대조했고, 기본값과 버퍼 동작은 스크립팅
레퍼런스에서 따로 확인했다.
