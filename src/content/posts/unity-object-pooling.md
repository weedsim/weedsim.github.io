---
pubDatetime: 2026-10-01T17:00:00+09:00
title: "SetActive(false)는 코루틴을 멈추는 게 아니라 끝낸다"
lang: ko
translationKey: unity-object-pooling
featured: false
draft: false
tags:
  - Unity
  - C#
  - 최적화
  - 메모리
description: "클리핑의 ObjectPool 구현은 공식 API를 제대로 쓴다. 그런데 OnGet과 OnRelease가 SetActive 한 줄뿐이다. 매뉴얼이 반납할 때 되돌리라고 적어둔 여섯 가지 중 하나도 안 하고, SetActive(false)가 끝낸 코루틴은 다시 켜도 돌아오지 않는다."
---

예전 게임 개발 프로젝트에서 **오브젝트를 과도하게 만들고 지우다가 프레임
스파이크**를 겪은 적이 있다. 다음 프로젝트에서 같은 상황을 또 만났고, 이번에는
어떻게 풀어야 하는지 찾다가 스크랩한 글이다. 2022년 글이고, 짧다. 오브젝트
풀링이 왜 필요한지 두 문단으로 설명한 뒤 `UnityEngine.Pool`의 `ObjectPool<T>`를
감싼 `Pool`과 `PoolManager`를 통째로 붙여놨다.

**복사해서 쓰라고 내놓은 코드다.** 그래서 이 글도 그 코드를 한 줄씩 본다.

공식 API를 쓰는 방식은 정확하다. 생성자 인자 네 개를 다 채웠고, `maxSize`를
넘겼을 때 파괴하는 콜백도 제대로 연결했다. 걸리는 건 **`OnGet`과 `OnRelease`가
각각 한 줄이라는 것**이다.

```csharp
void OnGet(GameObject go)
{
    go.SetActive(true);
}
void OnRelease(GameObject go)
{
    go.SetActive(false);
}
```

유니티 매뉴얼은 이 두 자리를 **상태를 되돌리는 자리**로 설명한다. 되돌릴
목록도 적어뒀는데, 여섯 개 중 이 코드가 하는 건 하나다. 그리고 그 하나가
나머지 하나를 **되돌릴 수 없게** 만든다.

## 목차

## 공식 API를 쓴 부분은 정확하다

먼저 맞는 쪽부터. 클리핑이 `ObjectPool<T>`를 만드는 줄은 이렇다.

```csharp
_pool = new ObjectPool<GameObject>(OnCreate, OnGet, OnRelease, OnDestroy, maxSize:1000);
```

생성자 시그니처와 맞는다.

```csharp
public ObjectPool(Func<T> createFunc, Action<T> actionOnGet = null,
    Action<T> actionOnRelease = null, Action<T> actionOnDestroy = null,
    bool collectionCheck = true, int defaultCapacity = 10, int maxSize = 10000)
```

네 번째 인자까지 위치로 넘기고 `maxSize`만 이름으로 지정했다. 중간의
`collectionCheck`와 `defaultCapacity`는 기본값으로 간다.

`actionOnDestroy`를 채운 것도 맞다. 문서가 이 콜백의 역할을 못 박는다.

> **actionOnDestroy:** Called when the element could not be returned to the pool
> due to the pool reaching the maximum size.

그리고 `maxSize`의 설명은 이렇다.

> The maximum size of the pool. When the pool reaches the max size then any
> further instances returned to the pool will be **ignored and can be garbage
> collected.**

"가비지 컬렉션된다"는 표현은 순수 C# 객체 기준이다. `GameObject`는 네이티브
오브젝트라 참조를 놓는다고 사라지지 않는다. 그래서 `actionOnDestroy`에
`GameObject.Destroy`를 연결해야 하고, 클리핑은 **그걸 했다.**

```csharp
void OnDestroy(GameObject go)
{
    GameObject.Destroy(go);
}
```

`OnCreate`에서 이름의 `(Clone)`을 떼는 것도 의도가 분명하다.

```csharp
GameObject OnCreate()
{
    GameObject go = GameObject.Instantiate(_prefab);
    go.name = _prefab.name;
    return go;
}
```

`Instantiate`로 만든 오브젝트는 이름이 `Bullet(Clone)`이 된다. `PoolManager`가
`go.name`으로 풀을 찾기 때문에 여기서 원래 이름으로 되돌려 놓는 것이다. 이
설계 자체에 문제가 있는데, 그건 뒤에서 본다.

풀링이 왜 필요한지에 대한 설명도 과장이 아니다. 매뉴얼이 같은 말을 한다.

> Object pooling reduces the overhead caused by repeatedly instantiating and
> destroying new object instances and limits the overall number of allocations
> and deallocations. This helps **minimize garbage collection (GC) overhead and
> reduce load on the CPU.**

## SetActive 한 줄이 상태 초기화 전부다

매뉴얼은 풀에서 꺼낸 오브젝트가 쓰이는 동안 상태가 변한다는 점부터 짚는다.

> Objects you retrieve from the pool can change their state during use... **It's
> important to reset this state when the object is returned to the pool**, so
> that when it's retrieved again later, it starts in the same state as on its
> first use.

그리고 반납할 때 보통 하는 일을 나열한다.

| 매뉴얼이 적어둔 항목 | 클리핑의 `OnRelease` |
| --- | --- |
| 코루틴 정지 | — |
| 이벤트 구독 해제 | — |
| 물리 상태 초기화 | — |
| 애니메이션 정리 | — |
| 파티클 시스템 정지 | — |
| GameObject 비활성화 | `SetActive(false)` |

여섯 중 하나다. 그런데 `SetActive(false)`가 **첫 줄도 같이 해버린다.** 그게
문제다. `GameObject.SetActive` 문서를 보면 이렇게 적혀 있다.

> Deactivating a GameObject disables each component, including attached
> renderers, colliders, rigidbodies, and scripts. ... **Deactivating a GameObject
> also stops all coroutines attached to it.**

"stops"다. "pauses"가 아니다. `SetActive(true)`로 다시 켜도 **정지된 코루틴은
이어서 돌지 않는다.** `OnEnable`은 다시 불리지만, 중간에 끊긴 코루틴을
살리는 코드는 아무 데도 없다.

이게 실제로 어떻게 나타나는지 보자. 흔한 총알 스크립트다.

```csharp
using System.Collections;
using UnityEngine;

public class Bullet : MonoBehaviour
{
    private const float LIFETIME = 3f;

    [Header("Movement")]
    [SerializeField, Range(1f, 50f), Tooltip("초당 이동 거리")]
    private float _speed = 20f;

    private void OnEnable()
    {
        StartCoroutine(DespawnAfterLifetime());
    }

    private void Update()
    {
        transform.Translate(Vector3.forward * (_speed * Time.deltaTime));
    }

    private IEnumerator DespawnAfterLifetime()
    {
        yield return new WaitForSeconds(LIFETIME);
        // 여기서 풀에 반납한다고 하자.
        gameObject.SetActive(false);
    }
}
```

이건 `OnEnable`에서 코루틴을 다시 시작하므로 멀쩡히 돈다. 문제는 코루틴을
`OnEnable`이 아닌 곳에서 시작할 때다.

```csharp
public void Fire(Vector3 direction)
{
    transform.forward = direction;
    StartCoroutine(DespawnAfterLifetime());   // OnEnable이 아니다.
}
```

맞고 사라지는 총알이라면 `Fire`가 끝나기 전에 충돌로 반납될 수 있다. 그 순간
`SetActive(false)`가 `DespawnAfterLifetime`을 끝낸다. 다음에 꺼냈을 때
`Fire`가 다시 불리면 새 코루틴이 시작되니 또 멀쩡해 보인다. **그런데 반납만
되고 다시 발사되지 않은 경로가 하나라도 있으면**, 그 오브젝트는 수명 타이머가
없는 채로 풀에 들어가 있다.

그래서 매뉴얼이 "코루틴 정지"를 목록 맨 앞에 둔 것이다. 자동으로 멈추니까
안 해도 된다는 뜻이 아니라, **멈추는 시점과 다시 시작하는 시점을 코드가
직접 쥐고 있어야 한다**는 뜻이다. 되돌릴 책임이 어디 있는지가 분명해야 한다.

나머지 다섯 개도 마찬가지다. 특히 두 가지가 바로 터진다.

| 안 되돌리면 | 다음에 꺼냈을 때 |
| --- | --- |
| `Rigidbody.linearVelocity` | 지난번 속도로 튀어나간다 |
| `transform.position` | 지난번 죽은 자리에서 나타난다 |
| 이벤트 구독 | 핸들러가 한 겹씩 쌓여 중복 호출된다 |
| `ParticleSystem` | 꺼낸 순간 지난번 파티클이 이어서 보인다 |
| `TrailRenderer` | 이전 위치에서 새 위치까지 선이 그어진다 |

마지막 줄은 특히 눈에 띈다. 총알을 풀링했을 때 화면을 가로지르는 긴 꼬리가
생기는 건 거의 항상 `TrailRenderer.Clear()`를 안 불러서다.

[Unity 코드 최적화 문서를 따라 내려간 글](/posts/unity-code-optimization/)에서
이 목록을 매뉴얼 쪽에서 한 번 봤다. 그때는 "이런 걸 되돌려야 한다"는 목록
자체가 요점이었고, 이 글은 **그 목록을 안 지킨 코드가 구체적으로 어떻게
깨지는지**를 본다.

## 중복 반납을 막는 검사는 믿을 수 없다

클리핑의 `PoolManager.Push`는 이렇다.

```csharp
public bool Push(GameObject go)
{
    if (_pools.ContainsKey(go.name) == false)
        return false;

    _pools[go.name].Push(go);
    return true;
}
```

**같은 오브젝트가 두 번 들어오는 걸 막는 코드가 없다.** 총알이 벽과 적에 같은
프레임에 닿거나, 수명 코루틴과 충돌 처리가 같이 반납을 부르면 `Release`가 두
번 불린다.

`ObjectPool<T>`에 그걸 잡는 장치가 있긴 하다. 생성자의 `collectionCheck`다.

> **collectionCheck:** Collection checks are performed when an instance is
> returned back to the pool. An exception will be thrown if the instance is
> already in the pool. **Collection checks are only performed in the Editor.**

기본값이 `true`이고 클리핑은 건드리지 않았으니 켜져 있다. 그런데 문서의 마지막
문장이 문제다. **에디터에서만 돈다면, 빌드에서는 같은 인스턴스가 풀에 두 번
들어간다.** 그다음 `Get()`을 두 번 하면 서로 다른 두 호출자가 같은 총알 하나를
들고 각자 움직인다. 에디터에서 멀쩡했던 코드가 빌드에서만 깨지는 종류다.

그런데 공개된 소스를 보면 그 "에디터에서만"이 **코드에 없다.** `Release`는
이렇게 생겼다.

```csharp
public void Release(T element)
{
    if (m_CollectionCheck && (m_List.Count > 0 || m_FreshlyReleased != null))
    {
        if (ReferenceEquals(element, m_FreshlyReleased)) {
            throw new InvalidOperationException(
                "Trying to release an object that has already been released to the pool.");
        }
        for (int i = 0; i < m_List.Count; i++)
        {
            if (ReferenceEquals(element, m_List[i]))
                throw new InvalidOperationException(
                    "Trying to release an object that has already been released to the pool.");
        }
    }
    m_ActionOnRelease?.Invoke(element);
    if(m_FreshlyReleased == null)
    {
        m_FreshlyReleased = element;
    }
    else if (CountInactive < m_MaxSize)
    {
        m_List.Add(element);
    }
    else
    {
        CountAll--;
        m_ActionOnDestroy?.Invoke(element);
    }
}
```

`m_CollectionCheck`는 생성자에서 인자를 그대로 받아 넣을 뿐이고, 이 클래스
어디에도 `#if UNITY_EDITOR`가 없다. **문서는 에디터 전용이라고 하고, 소스에는
그 조건이 안 보인다.** 어느 쪽이 맞는지는 확인하지 못했다.

확인하지 못했다는 게 결론을 흐리지는 않는다. 두 경우 모두 나쁘다.

| 문서가 맞다면 | 소스가 맞다면 |
| --- | --- |
| 빌드에서 검사가 꺼진다 | 빌드에서 검사가 켜진다 |
| 같은 인스턴스를 둘이 나눠 쓴다 | 출고한 빌드에서 예외가 터진다 |
| 에디터에서 안 보이던 버그가 생긴다 | 에디터에서 잡았어야 할 예외가 유저에게 간다 |

**어느 쪽이든 풀의 검사에 기대면 안 된다.** 중복 반납은 호출하는 쪽에서
막아야 한다.

`Release`를 읽다 보면 하나 더 보인다. `m_FreshlyReleased`라는 **한 칸짜리
캐시**가 있다. 처음 반납된 것은 리스트가 아니라 이 칸에 들어가고, `Get()`은
리스트보다 이 칸을 먼저 본다. 방금 넣은 것을 바로 다시 꺼내는 경로가
리스트를 거치지 않는다는 뜻이다. `CountInactive`도 이 칸을 세어서 돌려준다.

```csharp
public int CountInactive { get { return m_List.Count + (m_FreshlyReleased != null ? 1 : 0); } }
```

## 딕셔너리 키가 Pop마다 문자열을 만든다

`PoolManager`는 풀을 **이름**으로 찾는다.

```csharp
Dictionary<string, Pool> _pools = new Dictionary<string, Pool>();

public GameObject Pop(GameObject prefab)
{
    if (_pools.ContainsKey(prefab.name) == false)
        CreatePool(prefab);

    return _pools[prefab.name].Pop();
}
```

여기서 `prefab.name`이 **두 번** 불린다. `Push`도 `go.name`을 두 번 부른다.
그리고 `name`은 필드가 아니다. `UnityEngine.Object`의 소스를 보면 이렇다.

```csharp
public string name
{
    get { return GetName(); }
    set { SetName(value); }
}

[FreeFunction("UnityEngineObjectBindings::GetName", HasExplicitThis = true)]
extern string GetName();

[FreeFunction("UnityEngineObjectBindings::SetName", HasExplicitThis = true)]
extern void SetName(string name);
```

네이티브 함수가 `string`을 돌려준다. 네이티브 쪽 문자열을 관리 힙의
`System.String`으로 옮기는 일이 매 호출마다 일어난다는 뜻이고, 그 결과물은
새 객체다. **유니티 문서에 이 사실이 적혀 있는 걸 찾지 못했으므로**, 이건
문서가 보장하는 동작이 아니라 소스에서 읽히는 구조로 받아들이는 게 맞다.
프로파일러에서 `GameObject.name` 위에 `GC.Alloc`이 찍히는지 직접 확인하는
편이 확실하다.

구조가 그렇다면 결론은 간단하다. **가비지를 줄이려고 만든 풀이, 꺼낼 때마다
문자열 두 개와 넣을 때마다 두 개를 만든다.** 초당 총알 200발을 쏘고 전부
회수한다면 초당 800개다.

문자열 키에는 다른 문제도 있다. **이름이 같은 다른 프리팹은 같은 풀을 쓴다.**
`Bullet`이라는 이름의 프리팹이 플레이어용과 적용으로 둘 있으면, 먼저 만들어진
풀이 두 프리팹의 요청을 전부 받는다. 적이 플레이어 총알을 쏜다.

그리고 누군가 인스턴스 이름을 바꾸면 `Push`가 조용히 `false`를 돌려준다.
반환값을 안 보는 호출부가 하나라도 있으면 그 오브젝트는 **활성 상태로 씬에
영원히 남는다.** 풀링을 넣은 이유가 사라진다.

키를 프리팹 **참조**로 바꾸면 세 문제가 한 번에 없어진다. `GameObject`는
참조 동등성으로 비교되므로 그대로 딕셔너리 키가 된다.

## 씬을 넘기면 풀이 파괴된 오브젝트를 들고 있다

`Pool`과 `PoolManager`는 `MonoBehaviour`가 아닌 평범한 C# 클래스다. 그래서
어디에 담아두느냐가 수명을 정한다. 보통은 씬이 바뀌어도 살아 있는 매니저
싱글톤에 넣는다. 그렇게 하면 **`PoolManager`는 살아남고, 풀이 들고 있던
`GameObject`들은 씬과 함께 파괴된다.**

`OnCreate`가 `Instantiate(_prefab)`만 부르고 부모를 지정하지 않기 때문에,
만들어진 오브젝트는 현재 씬의 루트에 놓인다. 씬을 떠나면 전부 파괴된다. 풀의
`m_List`에는 파괴된 오브젝트의 참조만 남는다.

다음에 `Pop()`을 하면 그 참조가 그대로 나오고, `OnGet`이 `go.SetActive(true)`를
부른다. 파괴된 오브젝트에 접근하는 코드다. `UnityCsReference`에 그때 쓰이는
메시지가 들어 있다.

> The object of type '...' **has been destroyed but you are still trying to
> access it.** Your script should either check if it is null or you should not
> destroy the object.

이 메시지를 만드는 함수의 이름이 `TryThrowEditorNullExceptionObject`다. 이름에
`Editor`가 들어 있으니 빌드에서는 다른 경로로 갈 가능성이 높은데, 거기까지는
확인하지 못했다. [Fake Null을 다룬 글](/posts/unity-fake-null/)에서 본 것처럼,
유니티의 "파괴됐지만 참조는 남아 있는" 상태는 에디터와 빌드가 다르게 보이는
구간이 있다.

막는 방법은 둘 중 하나이고, **클리핑의 코드는 둘 다 안 한다.**

| 방법 | 하는 일 |
| --- | --- |
| 루트를 `DontDestroyOnLoad`로 | 풀의 오브젝트가 씬과 같이 안 죽는다 |
| 씬이 바뀔 때 `Clear()` | 풀이 들고 있던 참조를 버린다 |

첫 번째가 되는 이유는 문서에 있다.

> If the target Object is a component or GameObject, **Unity also preserves all
> of the Transform's children.** Object.DontDestroyOnLoad only works for root
> GameObjects or components on root GameObjects.

풀 전용 루트를 하나 만들어 `DontDestroyOnLoad`를 걸고, 만든 오브젝트를 전부 그
밑에 붙이면 씬을 넘어도 살아남는다. 루트는 **반드시 최상위 오브젝트**여야
한다는 조건이 같은 문장에 붙어 있다.

두 번째는 `Clear()`다.

> **Clear:** Removes all pooled items. If the pool contains a destroy callback
> then it will be called for each item that is in the pool.

클리핑의 `Pool`에는 `Clear`를 밖으로 내보내는 메서드가 없다. 필드가
`IObjectPool<GameObject>`로 선언되어 있는데, 이 인터페이스가 가진 멤버는
`CountInactive`, `Clear`, `Get`, `Release` 넷뿐이다. `ObjectPool<T>`의
`CountAll`, `CountActive`, `Dispose`는 이 필드로 못 부른다.

## 어디에 왜 쓰나

### 고친 Pool

프리팹 쪽에 되돌릴 자리를 만든다. 인터페이스가 아니라 `MonoBehaviour`를
상속한 추상 클래스로 둔 건, `TryGetComponent`가 인터페이스 타입에서도 되는지
문서가 말하지 않기 때문이다. 컴포넌트 타입이면 확실하다.

```csharp
using UnityEngine;

public abstract class PooledObject : MonoBehaviour
{
    /// <summary>풀에서 꺼내진 직후. 코루틴을 다시 시작하는 자리.</summary>
    public virtual void OnSpawned() { }

    /// <summary>풀에 반납되기 직전. SetActive(false)보다 먼저 불린다.</summary>
    public virtual void OnDespawned() { }
}
```

총알은 이렇게 된다. 매뉴얼의 여섯 항목이 전부 `OnDespawned`에 들어간다.

```csharp
using System.Collections;
using UnityEngine;

public class Bullet : PooledObject
{
    private const float LIFETIME = 3f;

    [Header("Movement")]
    [SerializeField, Range(1f, 50f), Tooltip("초당 이동 거리")]
    private float _speed = 20f;

    [Header("Effects")]
    [SerializeField] private TrailRenderer _trail;
    [SerializeField] private ParticleSystem _sparks;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        // Update 안에서 찾지 않는다. 한 번만 캐싱한다.
        if (!TryGetComponent(out _rigidbody))
        {
            Debug.LogError($"{name}에 Rigidbody가 없다.");
        }
    }

    public override void OnSpawned()
    {
        // SetActive(false)가 끝낸 코루틴은 되살아나지 않는다. 여기서 다시 건다.
        StartCoroutine(DespawnAfterLifetime());
    }

    public override void OnDespawned()
    {
        // 1. 코루틴 정지 — 수명이 다 되기 전에 반납된 경우를 위해.
        StopAllCoroutines();

        // 2. 물리 상태 초기화 — 안 하면 지난번 속도로 튀어나간다.
        _rigidbody.linearVelocity = Vector3.zero;
        _rigidbody.angularVelocity = Vector3.zero;

        // 3. 파티클 정지 — 안 하면 꺼낸 순간 지난번 파티클이 이어서 보인다.
        _sparks.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        // 4. 트레일 초기화 — 안 하면 죽은 자리에서 새 자리까지 선이 그어진다.
        _trail.Clear();
    }

    private IEnumerator DespawnAfterLifetime()
    {
        yield return new WaitForSeconds(LIFETIME);
        PoolManager.Instance.Push(gameObject);
    }
}
```

풀은 이렇게 바뀐다. 이름을 `Create`에서 한 번만 쓰고, `Clear`를 밖으로
내보내고, 만든 오브젝트를 전용 루트 밑에 붙인다.

```csharp
using UnityEngine;
using UnityEngine.Pool;

public sealed class Pool
{
    private const int DEFAULT_CAPACITY = 16;
    private const int MAX_SIZE = 1000;

    private readonly GameObject _prefab;
    private readonly Transform _root;
    private readonly ObjectPool<GameObject> _pool;

    public Pool(GameObject prefab, Transform root)
    {
        _prefab = prefab;
        _root = root;

        _pool = new ObjectPool<GameObject>(
            createFunc: Create,
            actionOnGet: OnGet,
            actionOnRelease: OnRelease,
            actionOnDestroy: DestroyElement,
            collectionCheck: true,
            defaultCapacity: DEFAULT_CAPACITY,
            maxSize: MAX_SIZE);
    }

    public GameObject Pop()
    {
        return _pool.Get();
    }

    public void Push(GameObject go)
    {
        _pool.Release(go);
    }

    /// <summary>풀을 버릴 때, 들고 있던 오브젝트까지 파괴한다.</summary>
    public void Clear()
    {
        _pool.Clear();
    }

    private GameObject Create()
    {
        GameObject go = Object.Instantiate(_prefab, _root);
        // 이름은 여기서 한 번만 만진다. 딕셔너리 키로는 안 쓴다.
        go.name = _prefab.name;
        return go;
    }

    private void OnGet(GameObject go)
    {
        go.SetActive(true);
        if (go.TryGetComponent(out PooledObject pooled))
        {
            pooled.OnSpawned();
        }
    }

    private void OnRelease(GameObject go)
    {
        // 비활성화보다 먼저 부른다. SetActive(false) 뒤에는 코루틴이 이미 끝났다.
        if (go.TryGetComponent(out PooledObject pooled))
        {
            pooled.OnDespawned();
        }
        go.transform.SetParent(_root, worldPositionStays: false);
        go.SetActive(false);
    }

    private void DestroyElement(GameObject go)
    {
        Object.Destroy(go);
    }
}
```

### 고친 PoolManager

키를 프리팹 참조로 바꾸고, **꺼낸 인스턴스를 기록하는 딕셔너리를 하나 더**
둔다. 이 하나가 중복 반납과 이름 충돌을 같이 막는다.

```csharp
using System.Collections.Generic;
using UnityEngine;

public sealed class PoolManager : MonoBehaviour
{
    private const string ROOT_NAME = "@PoolRoot";

    public static PoolManager Instance { get; private set; }

    // 키가 문자열이 아니라 프리팹 참조다. name을 안 부른다.
    private readonly Dictionary<GameObject, Pool> _pools = new();

    // 지금 밖에 나가 있는 인스턴스. 중복 반납을 여기서 막는다.
    private readonly Dictionary<GameObject, Pool> _activeInstances = new();

    private Transform _root;

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        // 문서: DontDestroyOnLoad는 최상위 오브젝트에만 통한다.
        //       그리고 자식 전부가 같이 보존된다.
        _root = new GameObject(ROOT_NAME).transform;
        DontDestroyOnLoad(_root.gameObject);
    }

    public GameObject Pop(GameObject prefab)
    {
        if (prefab == null)
        {
            Debug.LogError("Pop에 null 프리팹이 들어왔다.");
            return null;
        }

        if (!_pools.TryGetValue(prefab, out Pool pool))
        {
            pool = new Pool(prefab, _root);
            _pools.Add(prefab, pool);
        }

        GameObject go = pool.Pop();
        _activeInstances[go] = pool;
        return go;
    }

    public bool Push(GameObject go)
    {
        if (go == null)
        {
            return false;
        }

        // 꺼낸 기록이 없으면 이미 반납됐거나 이 풀이 만든 게 아니다.
        // 풀의 collectionCheck에 기대지 않는다. 문서는 에디터 전용이라고 한다.
        if (!_activeInstances.TryGetValue(go, out Pool pool))
        {
            Debug.LogWarning($"{go.name}은(는) 이 풀이 꺼내준 오브젝트가 아니거나 이미 반납됐다.");
            return false;
        }

        _activeInstances.Remove(go);
        pool.Push(go);
        return true;
    }

    /// <summary>풀을 통째로 비운다. 들고 있던 오브젝트도 파괴된다.</summary>
    public void Clear()
    {
        foreach (Pool pool in _pools.Values)
        {
            pool.Clear();
        }

        _pools.Clear();
        _activeInstances.Clear();
    }
}
```

`Push`가 `false`를 돌려주는 경로마다 로그를 남기는 게 중요하다. 원래 코드의
조용한 `return false`는 **오브젝트가 씬에 영원히 남는 길**이었다.

### 쓰지 말아야 할 자리

**한 번만 만드는 오브젝트.** 플레이어, 보스, UI 패널처럼 씬당 하나씩만 있는
것을 풀에 넣을 이유가 없다. 풀은 생성·파괴 비용을 분산하는 장치이고, 한 번만
만드는 것에는 분산할 비용이 없다.

**상태가 큰 오브젝트.** 되돌려야 할 항목이 많을수록 풀링의 이득이 줄고 버그
확률이 는다. `OnDespawned`가 서른 줄이 됐다면, 그냥 `Instantiate`하고
`Destroy`하는 쪽이 싸고 안전할 수 있다. 실제로 재는 게 먼저다.

**메인 스레드 밖.** 매뉴얼이 못 박아뒀다.

> Like many other core Unity APIs, the `UnityEngine.Pool` APIs are **not
> thread-safe, and can only be called safely from the main thread.**

**프리팹 종류가 매우 많은 경우.** 프리팹마다 풀이 하나씩 생기고 각 풀이
`maxSize`까지 들고 있을 수 있다. 종류가 수백 개면 비활성 오브젝트가
메모리에 그만큼 쌓인다. `maxSize`를 종류별로 다르게 주거나, 안 쓰는 풀을
`Clear()`로 정리하는 정책이 같이 있어야 한다.

## 정리

클리핑의 코드는 `ObjectPool<T>`를 **쓰는 법**은 맞게 보여준다. 생성자 인자
네 개, `actionOnDestroy`에 `GameObject.Destroy` 연결, `(Clone)` 떼기까지
의도가 분명하다.

비어 있는 건 `OnGet`과 `OnRelease`다. 매뉴얼이 "반납할 때 상태를 되돌리는
것이 중요하다"고 적고 여섯 가지를 나열한 그 자리에 `SetActive` 한 줄이 있다.
그리고 그 한 줄이 **코루틴을 멈추는 게 아니라 끝낸다** — 문서의 단어가
"stops"다. 다시 켜도 안 돌아온다.

나머지 셋은 설계다. 중복 반납을 막는 장치가 호출부에 없고 풀 쪽 검사는
문서와 소스가 엇갈린다. 딕셔너리 키가 `GameObject.name`이라 꺼내고 넣을
때마다 네이티브에서 문자열을 가져오고, 이름이 같은 프리팹끼리 풀을 공유한다.
풀이 씬보다 오래 살면서 오브젝트는 씬과 같이 죽는다.

세 번째와 네 번째는 고치기 쉽다. **키를 프리팹 참조로 바꾸고, 꺼낸 인스턴스를
딕셔너리에 기록하고, 전용 루트를 `DontDestroyOnLoad`로 둔다.** 첫 번째는
고치기 쉽지 않고, 그래서 매뉴얼이 목록으로 적어둔 것이다.

---

### 참고

- [Pooling and reusing objects — Unity 매뉴얼](https://docs.unity3d.com/6000.4/Documentation/Manual/performance-reusable-code.html)
- [ObjectPool\<T0\> — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Pool.ObjectPool_1.html)
- [ObjectPool\<T0\> 생성자 — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Pool.ObjectPool_1-ctor.html)
- [GameObject.SetActive — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/GameObject.SetActive.html)
- [Object.DontDestroyOnLoad — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Object.DontDestroyOnLoad.html)
- [GameObject.TryGetComponent — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/GameObject.TryGetComponent.html)
- [UnityCsReference — Unity-Technologies/UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference)

이 글의 출발점이 된 자료는 [usingsystem — \[Unity\]\[개념,방법\] 오브젝트 풀링(ObjectPool) 이란?](https://usingsystem.tistory.com/49)
(2022-08-25)이다. 거기 실린 `Pool`과 `PoolManager` 구현을 한 줄씩 따라가면서,
`ObjectPool<T>`의 계약과 상태 초기화 항목을 현행 매뉴얼·스크립팅 레퍼런스와
공개 소스에 대조했다.
