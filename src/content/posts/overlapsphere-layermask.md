---
pubDatetime: 2026-10-07T15:30:00+09:00
title: "1 << -1은 에러가 아니라 31번 레이어다"
lang: ko
translationKey: overlapsphere-layermask
featured: false
draft: false
tags:
  - Unity
  - 물리
  - C#
  - 최적화
description: "OverlapSphere로 주변을 탐색하는 2022년 글이다. 레이어를 이름으로 받아오는 것까지는 좋은데, 그 값을 직접 시프트한다. NameToLayer가 -1을 돌려주면 그 식은 예외 대신 31번 레이어를 가리킨다."
---

**맵에 배치한 함정 오브젝트를 플레이어가 가까워지면 활성화하려고** 방법을 찾던
중 스크랩한 글이다. 함정마다 트리거 콜라이더를 하나 더 달지 않고 **반경으로
판정**하고 싶었다. 그래서
[OverlapSphere의 기본값을 다룬 글](/posts/physics-overlapsphere/)을 쓰면서
모아둔 자료에 이 2022년 글을 더 얹었다.

앞 글은 이 함수의 숨은 인자 둘을 짚고 **"하드코딩한 `1 << 10` 대신 이름을
쓰라"**로 끝났다. 거기서 남겨둔 게 **마스크를 직접 만드는 쪽**이다. 함정이
플레이어만 보려면 결국 마스크를 써야 하므로, 그 자리를 이어서 봤다.

이 2022년 글은 그 조언을 따른다. 레이어 번호를 숫자로 적지 않고
`LayerMask.NameToLayer("Cube")`로 받아온다. **이름으로 쓰는 쪽이다.** 그런데
받아온 값을 손으로 시프트한다.

```csharp
LayerMask cubeLayer;

void Start()
{
    cubeLayer = LayerMask.NameToLayer("Cube");
}

void Update()
{
    int layerMask = (1 << cubeLayer);
    // ...
}
```

이름을 쓰면서 시프트를 남겨둔 이 조합에 **그 자리만의 실패 방식**이 있다.
`NameToLayer`가 무엇을 돌려주는지가 문서에 적혀 있다.

> Given a layer name, returns the layer index as defined by either a Builtin or
> a User Layer in the Tags and Layers manager. **Returns -1 if not found.**

**찾지 못하면 -1이다.** 그러면 `1 << -1`이 되는데, 이 식은 터지지 않는다.

## 목차

## `1 << -1`은 에러가 아니라 31번 레이어다

C# 문서가 시프트 횟수를 어떻게 계산하는지 적어둔다.

> If the type of `x` is `int` or `uint`, the **low-order *five* bits** of the
> right-hand operand define the shift count. That is, the shift count is
> computed from `count & 0x1F` (or `count & 0b_1_1111`).

**오른쪽 피연산자의 하위 5비트만 쓴다.** 그래서 음수를 넣어도 예외가 아니다.
문서가 예제까지 붙여둔다.

> ```csharp
> int count = -31;
> int c = 0b_0001;
> Console.WriteLine($"{c} << {count} is {c << count}");
> // Output:
> // 1 << -31 is 2
> ```

`-1 & 0x1F`은 **31**이다. 따라서 `1 << -1`은 `1 << 31`이고, `int`에서 그 값은
부호 비트가 켜진 `int.MinValue`다. 레이어 마스크로 읽으면 **31번 레이어 하나**를
가리킨다.

| 식 | 계산 | 마스크가 가리키는 것 |
| --- | --- | --- |
| `1 << 6` (Cube가 6번일 때) | `0x00000040` | 6번 레이어만 |
| `1 << -1` | `-1 & 0x1F = 31` → `1 << 31` | **31번 레이어만** |
| `~(1 << -1)` | `~int.MinValue = int.MaxValue` | **31번만 뺀 전부** |

31번이 왜 조용한 자리인지도 문서에 있다. `LayerMask` 클래스 설명이 레이어
구성을 적는다 — 32개 중 **앞의 8개가 내장이고 24개가 사용자용**이다. 즉
**31번은 마지막 사용자 레이어 칸**이고, 새 프로젝트에서는 비어 있다.

### 포함과 제외에서 증상이 반대다

클리핑은 마스크를 두 형태로 쓴다. 레이어 이름이 틀렸을 때 두 형태의 증상이
갈린다.

```csharp
// 포함 — "Cube만 검출"
int layerMask = (1 << cubeLayer);

// 제외 — "Cube만 빼고 검출"
int layerMask = ~(1 << cubeLayer);
```

이름이 맞으면 둘 다 의도대로 돈다. 이름이 틀리면(철자가 다르거나 레이어를 아직
안 만들었거나) 이렇게 된다.

| | 이름이 맞을 때 | 이름이 틀렸을 때 |
| --- | --- | --- |
| `1 << cubeLayer` | Cube만 잡힌다 | **아무것도 안 잡힌다** (31번은 비어 있다) |
| `~(1 << cubeLayer)` | Cube만 빠진다 | **전부 잡힌다** — 31번만 빠지는데 거기는 비어 있다 |

**아래쪽이 위험하다.** 포함 형태는 "왜 안 잡히지"로 바로 드러나는데, 제외
형태는 **의도한 결과와 거의 같아 보인다.** Cube가 빠지지 않는 것만 다르고,
그 하나를 못 알아채면 마스크가 틀린 채로 계속 간다.

클리핑의 **최종 코드가 제외 형태**다. 레이어 이름 하나만 어긋나도 증상이
가려지는 쪽으로 끝난다.

### `GetMask`는 그 한 단계를 없앤다

`-1`이 문제가 되는 건 **받아온 값을 내가 시프트하기 때문**이다. 시프트를 안
하면 그 자리가 사라진다. `LayerMask.GetMask`의 선언과 설명이다.

```csharp
public static int GetMask(params string[] layerNames);
```

> Given a set of layer names as defined by either a Builtin or a User Layer in
> the Tags and Layers manager, returns **the equivalent layer mask** for all of
> them.

**이름을 넣으면 마스크가 나온다.** 인덱스를 거치지 않는다. `params`라서 여러
개를 한 번에 넘길 수 있고, 제외는 그 결과에 `~`를 붙인다.

```csharp
// 포함 — 이름에서 마스크까지 한 단계
int includeMask = LayerMask.GetMask("Cube");

// 여러 개도 된다
int enemiesMask = LayerMask.GetMask("Enemy", "Boss");

// 제외 — 마스크를 뒤집는다
int excludeMask = ~LayerMask.GetMask("Cube");
```

세 가지 쓰는 법을 나란히 두면 이렇게 갈린다.

| 쓰는 법 | 깨지는 조건 | 드러나는가 |
| --- | --- | --- |
| `1 << 6` | 레이어 순서가 바뀌면 다른 레이어를 가리킨다 | 조용하다 |
| `1 << NameToLayer("Cube")` | 이름이 틀리면 31번을 가리킨다 | 조용하다 (제외 형태에서 특히) |
| `LayerMask.GetMask("Cube")` | — | 시프트 단계가 없다 |

첫 줄은 [앞 글](/posts/physics-overlapsphere/)에서 다룬 자리다. 둘째 줄이 이
글의 자리이고, **이름을 쓰는 것만으로는 안전해지지 않는다**는 게 요지다.

정직하게 덧붙이면, **`GetMask`가 없는 이름을 받으면 어떻게 되는지는 문서에
없다.** 문서가 보증하는 건 "주어진 이름들에 해당하는 마스크를 돌려준다"까지다.
확실한 차이는 **`-1`이 시프트로 흘러드는 경로가 없다**는 것이고, 그게 이 자리를
고르는 이유다.

## `LayerMask` 타입에 레이어 번호가 들어 있다

같은 코드에 한 겹 더 있다. 변수의 타입이다.

```csharp
LayerMask cubeLayer;

void Start()
{
    cubeLayer = LayerMask.NameToLayer("Cube");
}
```

`NameToLayer`가 돌려주는 건 **인덱스**다. 그걸 `LayerMask` 타입 변수에 담았다.
그런데 `LayerMask`가 담는 것은 인덱스가 아니다. `value` 프로퍼티 설명이다.

> Converts a **layer mask** value to an integer value.

**마스크다.** 컴파일이 되는 이유는 암시적 변환 때문이다.

> Implicitly converts an integer to a LayerMask.

`int`를 넣으면 그대로 `LayerMask`가 되고, 다시 `int`로 꺼내면 같은 값이 나온다.
그래서 `(1 << cubeLayer)`는 숫자상 의도대로 계산된다. **동작은 하고 타입만
거짓말을 한다.**

문제는 그 변수를 다른 곳에 넘길 때다. `LayerMask` 타입이니 마스크를 받는 자리에
그대로 들어간다.

```csharp
// Cube가 6번 레이어일 때, cubeLayer의 내용은 6이다.

// 의도대로 — 6번 비트를 세운다
Physics.OverlapSphere(pos, radius, 1 << cubeLayer);

// 컴파일된다. 그런데 마스크 6은 1번과 2번 레이어다.
Physics.OverlapSphere(pos, radius, cubeLayer);
```

**마스크 `6`은 이진수로 `110`이고, 1번(TransparentFX)과 2번(Ignore Raycast)
레이어를 가리킨다.** Cube와 아무 상관이 없다. 두 호출이 똑같이 컴파일되고
똑같이 조용하다.

인덱스를 들고 있을 거면 타입도 `int`여야 한다. 그게 읽는 사람에게 "여기엔
시프트가 필요하다"를 알려준다.

```csharp
// 인덱스를 들고 있다는 게 타입에 드러난다
private int _cubeLayerIndex;

// 마스크를 들고 있다 — 시프트 없이 바로 넘긴다
private LayerMask _cubeMask;
```

`GetMask`를 쓰면 애초에 아래쪽만 남는다.

## 이름으로 자기를 빼면 남의 것도 빠진다

클리핑이 자기 자신을 제외하는 방법이다.

```csharp
foreach (Collider col in colliders)
{
    if (col.name == "Sphere" /* 자기 자신은 제외 */) continue;

    changeMaterial(col.gameObject, detectedMat);
}
```

이 글의 테스트 장면 구성을 같이 보면 문제가 보인다. 글은 **"보라색 Sphere"에
스크립트를 붙이고, 주변에 Cube·Capsule·Sphere를 배치**한다고 적는다. 즉
**장면에 Sphere가 둘이다.** 검출 중심인 보라색 Sphere와, 검출 대상인 Sphere다.

`col.name == "Sphere"`는 **이름이 같은 전부**를 건너뛴다. 검출 대상 Sphere의
이름이 그냥 `Sphere`라면 그쪽도 같이 빠진다. 자기 자신을 뺀 게 아니라 **같은
이름을 전부 뺀 것**이다.

자기 자신인지는 이름이 아니라 참조로 본다.

```csharp
foreach (Collider col in colliders)
{
    // 같은 Transform이면 내 콜라이더다.
    if (col.transform == transform)
    {
        continue;
    }

    // 자식에 콜라이더가 있는 구조라면 이쪽.
    if (col.transform.IsChildOf(transform))
    {
        continue;
    }

    // ...
}
```

그리고 `name`은 이 자리에 쓰기에 비싸다.
[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 `GameObject.name`이
접근할 때마다 네이티브 문자열을 관리 측 문자열로 새로 만든다는 것을 확인했는데,
**이 코드는 그 접근이 `Update`의 루프 안에 있다.** 검출된 콜라이더 수만큼 매
프레임 문자열이 생긴다. 참조 비교는 할당이 없다.

## 검출은 있고 해제가 없다

클리핑의 `Update`는 검출된 콜라이더의 머티리얼을 바꾼다.

```csharp
void changeMaterial(GameObject go, Material changeMat)
{
    Renderer rd = go.GetComponent<MeshRenderer>();
    Material[] mat = rd.sharedMaterials;
    mat[0] = changeMat;
    rd.materials = mat;
}
```

**되돌리는 코드가 없다.** 반경 안에 들어오면 빨개지고, 나가도 그대로다. 글이
"Radius가 커질수록 멀리 있는 오브젝트가 DetectedMat(Red)로 변경되는 것을 알 수
있다"고 적은 그대로이고, 반경을 줄이면 색이 돌아오지 않는다.

반경을 조절해보는 **데모로는 충분하다.** 다만 "주변 탐색"을 실제로 쓰는 자리는
들어옴과 나감이 다 필요하다. 함정이라면 **가까워지면 켜고 멀어지면 꺼야**
하는데, 이 코드로는 한 번 켜진 함정이 꺼지지 않는다. 트리거의
`OnTriggerEnter`/`OnTriggerExit`에 대응하는 것을 직접 만들어야 한다는 뜻이고,
방법은 **프레임 사이의 차이를 보는 것**이다.

```csharp
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class ProximityTracker : MonoBehaviour
{
    private const int BUFFER_SIZE = 32;

    [Header("Detection")]
    [SerializeField, Range(0.1f, 20f), Tooltip("탐색 반지름")]
    private float _radius = 3f;

    [SerializeField, Tooltip("탐색할 레이어. 인스펙터에서 고른다")]
    private LayerMask _targetMask;

    private readonly Collider[] _buffer = new Collider[BUFFER_SIZE];
    private readonly HashSet<Collider> _current = new HashSet<Collider>();
    private readonly HashSet<Collider> _previous = new HashSet<Collider>();

    private void FixedUpdate()
    {
        _current.Clear();

        // NonAlloc으로 버퍼를 재사용한다. 반환값은 채워진 개수다.
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _buffer, _targetMask);

        for (int i = 0; i < count; i++)
        {
            Collider col = _buffer[i];

            // 이름이 아니라 참조로 자기 자신을 건너뛴다.
            if (col.transform == transform || col.transform.IsChildOf(transform))
            {
                continue;
            }

            _current.Add(col);

            // 이전 프레임에 없었으면 '들어옴'이다.
            if (!_previous.Contains(col))
            {
                OnEntered(col);
            }
        }

        foreach (Collider col in _previous)
        {
            // 파괴된 콜라이더가 섞여 있을 수 있다. Unity 오브젝트라 == null로 본다.
            if (col == null)
            {
                continue;
            }

            // 이번 프레임에 없으면 '나감'이다.
            if (!_current.Contains(col))
            {
                OnExited(col);
            }
        }

        // 다음 프레임의 기준으로 current를 옮긴다.
        _previous.Clear();
        _previous.UnionWith(_current);
    }

    private void OnEntered(Collider col)
    {
        Debug.Log($"entered {col.name}", col);
    }

    private void OnExited(Collider col)
    {
        Debug.Log($"exited {col.name}", col);
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.green;

        // 솔리드가 아니라 와이어다. 안쪽이 보여야 쓸모가 있다.
        Gizmos.DrawWireSphere(transform.position, _radius);
    }
}
```

`_previous`를 돌면서 `col == null`을 먼저 보는 이유가 있다. 집합에 담아둔
콜라이더가 그 사이에 파괴될 수 있고, Unity 오브젝트는 파괴된 뒤에도 관리 측
참조가 남는다. **`?.`가 아니라 `== null`인 것도 그래서다.**

`Update`가 아니라 `FixedUpdate`에 둔 것도 의도다. 물리 쿼리는 물리 상태를
읽으니 물리 스텝에 맞추는 편이 결과가 안정적이다.

머티리얼을 바꾸는 쪽은 따로 둘 값이 있다.
[셰이더가 무엇인지 본 글](/posts/what-is-a-shader/)에서 `Renderer.material`을
읽는 순간 머티리얼이 복제되고 **치우는 건 내 책임**이라는 문서 문장을 봤다.
매 프레임 머티리얼 배열을 다시 대입하는 클리핑의 형태는 그 경계에 가깝다.
들어옴·나감 한 번씩만 바꾸면 그 호출 자체가 프레임당 0회가 된다.

## 대조하고 넘어간 것들

걸리지 않은 것들이 더 많다. 확인한 것을 남겨둔다.

| 클리핑의 주장 | 확인 |
| --- | --- |
| `OnDrawGizmosSelected`는 선택된 경우만 Gizmos를 그린다 | 맞음. 문서가 "Gizmos are drawn only when the object is selected" |
| 자기 자신도 검출되므로 예외 처리가 필요하다 | 맞음 |
| 매번 검출하는 것은 성능에 영향을 미친다 | 맞음 |
| layerMask는 레이어를 비트로 판단한다 | 맞음 |
| `~` 비트 연산으로 특정 레이어를 제외할 수 있다 | 맞음 |

`OnDrawGizmosSelected` 쪽은 문서가 예시까지 같은 걸 든다.

> For example an explosion script could draw a sphere showing the explosion
> radius.

**폭발 반경을 구로 그리는 것**이 이 콜백의 교과서 용례다. 클리핑이 탐색 반경에
쓴 것과 같은 자리다.

"매번 검출하는 것은 성능에 영향을 미치기 때문에 실제로는 이벤트나 충돌이
발생할 경우에 사용한다"는 문장도 정확한 지적이다. 다만 `Update`에서 꼭 돌려야
하는 경우라면 **호출 횟수보다 할당 쪽이 먼저 걸린다.** `OverlapSphere`는 호출마다
배열을 새로 만들고, `OverlapSphereNonAlloc`은 내가 준 버퍼를 채운다. 그 비교는
[앞 글](/posts/physics-overlapsphere/)에서 코드까지 나란히 두고 다뤘고,
[Unity 코드 최적화 문서](/posts/unity-code-optimization/)에도 같은 함수가 예제로
나온다.

캡슐 모양으로 같은 일을 하는 함수는
[OverlapCapsule을 다룬 글](/posts/physics-overlapcapsule/)에 있다. 마스크를
만드는 이야기는 그쪽에도 그대로 해당한다.

## 어디에 왜 쓰나

### 마스크는 인스펙터에서 고른다

코드에서 이름이나 번호로 마스크를 만드는 것보다 나은 선택지가 하나 더 있다.
`LayerMask` 타입을 `[SerializeField]`로 두면 **인스펙터가 레이어 드롭다운을
그려준다.**

```csharp
[SerializeField, Tooltip("탐색할 레이어")]
private LayerMask _targetMask;
```

이쪽이 좋은 이유는 **문자열이 코드에서 사라지는 것**이다. 레이어 이름을 바꿔도
코드를 고칠 일이 없고, 철자를 틀릴 자리도 없다. 앞 절의 `-1` 문제가 생길 경로가
아예 없어진다.

세 가지를 정리하면 이렇다.

| 방법 | 레이어 이름이 코드에 | 틀렸을 때 |
| --- | --- | --- |
| `[SerializeField] LayerMask` | 없다 | 고를 수 없으니 틀릴 자리가 없다 |
| `LayerMask.GetMask("Cube")` | 있다 | 시프트 단계는 없다 |
| `1 << NameToLayer("Cube")` | 있다 | 31번을 가리킨다 |

코드에서 마스크를 조합해야 하는 경우에만 둘째 줄을 쓰고, 기본은 첫째 줄이다.

### 탐색 결과를 이벤트로 넘긴다

위의 `ProximityTracker`는 들어옴·나감을 `Debug.Log`로 끝냈다. 실제로는 그
시점에 다른 쪽이 반응해야 한다. 탐색하는 쪽과 반응하는 쪽을 직접 참조로 묶지
않으려면 이벤트로 넘긴다.

```csharp
using System;
using UnityEngine;

public class ProximityEvents : MonoBehaviour
{
    // event를 붙여 외부의 호출과 = null 대입을 막는다.
    public event Action<Collider> Entered;
    public event Action<Collider> Exited;

    public void RaiseEntered(Collider col)
    {
        // 구독자가 없으면 null이다. 델리게이트이므로 ?. 를 쓴다.
        Entered?.Invoke(col);
    }

    public void RaiseExited(Collider col)
    {
        Exited?.Invoke(col);
    }
}
```

`?.Invoke()`와 `event`를 쓰는 이유는
[Action으로 이벤트를 등록한 글](/posts/csharp-action-events/)에 있다. 구독하는
쪽은 `OnEnable`/`OnDisable`에서 등록과 해제를 짝으로 둔다 — 탐색 대상이 풀에서
나왔다 들어가는 오브젝트라면 특히 그렇다.

### 쓰지 말아야 할 자리

- **`1 << LayerMask.NameToLayer(...)`.** 이름이 틀리면 31번 레이어를 가리키고
  예외가 없다. `GetMask`나 인스펙터의 `LayerMask`를 쓴다.
- **`LayerMask` 타입에 레이어 인덱스를 담는 것.** 암시적 변환 때문에 컴파일은
  된다. 인덱스라면 타입도 `int`여야 한다.
- **제외 마스크(`~`)만 테스트하고 넘기는 것.** 이름이 틀려도 결과가 정상처럼
  보인다. 포함 형태로 한 번 돌려보면 바로 드러난다.
- **이름으로 자기 자신을 거르는 것.** 같은 이름을 가진 전부가 빠진다.
  `col.transform == transform`으로 본다.
- **`Update` 루프 안에서 `name`을 읽는 것.** 접근마다 문자열이 만들어진다.
- **들어옴만 처리하고 나감을 두지 않는 것.** 상태가 한쪽으로만 간다. 프레임
  사이의 차이를 봐야 둘이 생긴다.
- **`Gizmos.DrawSphere`로 탐색 반경을 그리는 것.** 솔리드라 안쪽이 안 보인다.
  반경을 보려면 `DrawWireSphere`다.

## 정리

- **`1 << -1`은 예외가 아니다.** C# 문서가 시프트 횟수를 `count & 0x1F`로
  계산한다고 적는다. `-1`은 31이 되고, `1 << 31`은 **31번 레이어**를 가리키는
  마스크다.
- **`NameToLayer`는 못 찾으면 -1을 돌려준다.** 문서에 적혀 있고, 그 값이
  시프트로 흘러들면 위의 결과가 된다.
- **제외 형태에서 증상이 가려진다.** `~(1 << -1)`은 31번만 뺀 전부라서 의도한
  결과와 거의 같아 보인다. 클리핑의 최종 코드가 그 형태다.
- **31번은 마지막 사용자 레이어다.** 문서가 32개 중 앞의 8개를 내장으로 적는다.
  새 프로젝트에서 비어 있으니 조용하다.
- **`GetMask`는 시프트 단계를 없앤다.** 이름에서 마스크가 바로 나온다. 없는
  이름을 받을 때의 동작은 문서에 없지만, `-1`이 흘러들 경로가 사라지는 건
  확실하다.
- **`LayerMask`에 인덱스를 담으면 타입이 거짓말을 한다.** 암시적 변환으로
  컴파일되고, 마스크를 받는 자리에 그대로 넘어간다. 인덱스 6은 마스크로 읽으면
  1번과 2번 레이어다.
- **이름으로 자기를 빼면 같은 이름 전부가 빠진다.** 이 글의 장면에는 Sphere가
  둘이다. 참조로 비교한다.
- **검출만 있고 해제가 없다.** 데모로는 충분하지만, 들어옴·나감을 다 쓰려면
  프레임 사이의 차이를 봐야 한다.

---

### 참고

- [Physics.OverlapSphere — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.OverlapSphere.html) ·
  [Physics.OverlapSphereNonAlloc](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [LayerMask — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.html) ·
  [LayerMask.NameToLayer](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.NameToLayer.html) ·
  [LayerMask.GetMask](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.GetMask.html)
- [비트 및 시프트 연산자 — C# 레퍼런스](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators)
- [MonoBehaviour.OnDrawGizmosSelected — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnDrawGizmosSelected.html) ·
  [Gizmos.DrawWireSphere](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Gizmos.DrawWireSphere.html)
- [Transform.IsChildOf — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Transform.IsChildOf.html)

이 글의 출발점이 된 자료는
[피로물든딸기 — 유니티 - OverlapSphere로 주변 콜라이더 탐색하기](https://bloodstrawberry.tistory.com/877)
(2022-07-21)이다. 같은 함수를 다룬
[앞 글](/posts/physics-overlapsphere/)에서는 기본 인자를 봤고, 이 글에서는
**마스크를 직접 만드는 쪽**을 Unity 스크립팅 레퍼런스와 C# 연산자 문서에
대조했다.
