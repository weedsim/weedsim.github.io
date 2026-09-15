---
pubDatetime: 2026-09-15T19:00:00+09:00
title: "Unity 코드 최적화 문서는 목차의 목차다: 두 층 내려가서 건진 규칙들"
lang: ko
translationKey: unity-code-optimization
featured: false
draft: false
tags:
  - Unity
  - 최적화
  - C#
  - 메모리
  - 멀티스레딩
description: "Unity 매뉴얼의 Code optimization 페이지는 링크 다섯 줄이 전부다. 그 다섯 중 넷이 또 목차였다. 끝까지 내려가서 실제로 코드를 바꾸게 만드는 항목만 추렸다."
---

유니티를 공부하다 보면 최적화 이야기가 계속 따라붙는데 어디서부터 봐야 할지
몰라서, 매뉴얼의 **Code optimization** 페이지를 스크랩해뒀었다. 제목이 그러니
출발점이겠거니 했다. 막상 열어보니 **읽을 게 없다.** 문단 하나와 링크 다섯
줄이 전부다.

그래서 링크를 타고 내려가봤다. **다섯 중 넷이 또 목차였다.** 실제로 코드를
바꾸게 만드는 문장은 두 번, 어떤 건 세 번 클릭해야 나온다.

이 글은 그 내려가기의 결과다. 목차를 요약하는 대신, **끝까지 내려가서 나온
잎사귀 중 실제로 손을 움직이게 한 것**만 추렸다. GPU 쪽 최적화 문서도 같은
구조였는데, 그건
[파도 전선이 뭔가 했더니 wavefront였다](/posts/unity-gpu-optimization-page/)에
따로 정리해뒀다. 이 글은 CPU와 메모리 쪽이다.

## 목차

## 페이지 자체는 다섯 줄이다

원문 전체가 이렇다. 문단 하나와 표 하나.

> 작성하는 모든 코드에서 성능을 고려하면 병목 없이 프로젝트를 확장할 수 있다.
> 성능을 개선하는 방법은 여러 가지가 있는데, 나쁜 관행을 피하는 것, 코드를
> 프로파일링하는 것, 적절한 디자인 패턴을 적용하는 것, 그리고 비동기 프로그래밍
> 같은 기법으로 작업을 여러 실행 스레드에 나누는 것 등이다.

| 항목 | 설명 |
|---|---|
| Unity programming best practices | Unity 애플리케이션 코드를 쓸 때 알아야 할 핵심 이슈와 모범 사례 |
| Asynchronous programming | `async`/`await`와 Unity 고유의 `Awaitable` 클래스 |
| Job system | 멀티코어 CPU를 활용하고 알고리즘을 병렬화 |
| Optimizing your code for managed memory | 관리 메모리에 맞춰 코드를 최적화하는 접근법 |
| Using unmanaged API for transform operations | `Transform` API의 대안인 `TransformHandle` API |

스크랩해둘 때는 이 표가 체크리스트처럼 보였다. 다시 보니 **디렉터리 목록**이다.

참고로 스크랩 당시(2025년 12월)와 지금 확인한 문서는 같은 URL인데, 지금은
**Unity 6.6(6000.6)** 매뉴얼이 걸린다. 버전 없는 `docs.unity3d.com/Manual/`
링크는 항상 최신을 가리키므로, 오래 보관하는 북마크로는 적절하지 않다.

## 한 층 내려가니 또 목차였다

다섯 개를 하나씩 눌러봤다. 결과는 이렇다.

| 자식 페이지 | 실제로 뭐였나 |
|---|---|
| Unity programming best practices | **내용 있음.** 섹션 8개 |
| Asynchronous programming | 목차 |
| Job system | 목차 (표 6줄) |
| Optimizing your code for managed memory | 목차 (표 3줄) |
| Using unmanaged API for transform operations | 랜딩 페이지 |

**다섯 중 하나만 글이다.** 나머지는 또 표다. 예를 들어 managed memory 페이지를
누르면 다시 세 개가 나온다 — Reference type management, Pooling and reusing
objects, Optimizing arrays. 여기서 한 번 더 눌러야 "`StringBuilder`를 써라"
같은 문장이 나온다.

문서 구조를 흉보려는 게 아니다. **스크랩한 페이지가 목차면, 스크랩한 시점에
아무것도 저장하지 않은 것과 같다**는 게 요점이다. 아래는 끝까지 내려가서
건진 것들이다.

## 건진 것 1 — Unity API가 배열을 새로 만들어 돌려준다

**Optimizing arrays** 페이지에 있다. 알고 있었어도 규모를 착각하기 쉬운
항목이다.

> 배열을 반환하는 Unity API는 접근할 때마다 새 복사본을 만든다. 타이트한 루프
> 안에서 반복 접근하면 CPU 핫스팟이 생기고, 관리 힙이 커진다.

문서의 예가 `Mesh.vertices`다. 루프 안에서 `mesh.vertices[i]`를 네 번 쓰면
**반복마다 배열 복사본이 네 개** 생긴다. 정점 1만 개짜리 메시면 1만 번 × 4다.

단계별로 이렇게 고친다.

```csharp
// 최악 — 반복마다 복사본 4개
for (int i = 0; i < mesh.vertices.Length; i++)
{
    total += mesh.vertices[i].x + mesh.vertices[i].y + mesh.vertices[i].z;
}

// 나음 — 복사본 1개
Vector3[] vertices = mesh.vertices;
for (int i = 0; i < vertices.Length; i++)
{
    total += vertices[i].x + vertices[i].y + vertices[i].z;
}

// 최선 — 복사본 0개, 리스트를 재사용
mesh.GetVertices(_vertices);
```

문서가 대체 API 표를 직접 제공한다.

| 할당하는 쪽 | 할당하지 않는 쪽 |
|---|---|
| `Physics.RaycastAll` | `Physics.RaycastNonAlloc` |
| `Animator.parameters` | `Animator.parameterCount` + `Animator.GetParameter` |
| `Renderer.sharedMaterials` | `Renderer.GetSharedMaterials` |
| `Input.touches.Length` | `Input.touchCount` + `Input.GetTouch(i)` |

규칙은 이름에 있다. **`Get` 접두사에 인자로 컬렉션을 받는 쪽이 채워 넣는
버전**이고, 속성처럼 생긴 쪽이 복사본을 주는 쪽이다.

배열 크기에 대한 기준선도 하나 있다. **1만 개를 넘으면** `Unity.Collections`의
`NativeArray`를 쓰라고 안내한다. GC 압력과 힙 단편화를 피하기 위해서다.

## 건진 것 2 — `Awaitable`은 `Task`와 세 군데가 다르다

**Asynchronous programming**을 두 번 눌러야 나오는 소개 페이지에 비교가 있다.
`Awaitable`을 그냥 "Unity판 Task"로 알고 있었는데, 셋 다 실무에서 걸리는
차이다.

**첫째, 할당.**

> `Awaitable` 인스턴스는 할당을 줄이기 위해 풀링된다.

`Task`는 반환하는 메서드를 호출할 때마다 할당이 생기고 GC 부담이 늘어난다는
게 문서의 대비다. 매 프레임 비동기 메서드를 부르는 구조라면 이 차이가 그대로
쌓인다.

**둘째, 재사용 금지.**

> 하나의 `Awaitable` 인스턴스를 두 번 이상 `await`하는 것은 결코 안전하지
> 않다. 그렇게 하면 예외나 데드락 같은 **정의되지 않은 동작**이 생길 수 있다.

풀링의 대가다. `Task`는 여러 번 `await`해도 같은 결과를 돌려주지만,
`Awaitable`은 그렇지 않다. 필드에 담아두고 여러 곳에서 기다리는 패턴을 그대로
옮기면 안 된다.

**셋째, 이어지는 시점.**

> 완료가 트리거되면 연속 실행(continuation)이 **동기적으로** 실행된다. 즉 코드가
> 같은 프레임에서 즉시 재개된다.

`Task`는 동기화 컨텍스트나 스레드 풀을 거쳐 비동기로 이어지느라 지연이 생기는
반면, `Awaitable`은 같은 프레임에 이어진다. 앞서
[Sentis 워크플로 글](/posts/sentis-workflow/)에서 `ReadbackAndCloneAsync()`를
`await`하는 코드를 썼는데, 그게 프레임을 늦추지 않는 근거가 이 문장이다.

코루틴과의 비교도 있다. `Awaitable` 쪽이 대체로 더 효율적이고 **특히 이터레이터가
null이 아닌 값을 반환하는 경우** 그렇지만, **동시에 여러 개를 돌리면 그 이점이
줄어든다**고 적어놨다.

## 건진 것 3 — `TransformHandle`, 관리되지 않는 Transform

다섯 번째 항목이 제일 낯설었다. `Transform` API의 대안이 있다는 이야기다.

> `TransformHandle`은 **관리되지 않는(unmanaged) 구조체**이며, 그래서 Burst
> 컴파일러와 완전히 호환된다.

`Transform`은 관리 객체라 Burst 컴파일된 코드에서 만질 수 없다. 그 제약을
푸는 게 `TransformHandle`이다. 얻는 방법은 두 가지다.

```csharp
// GameObject에서
TransformHandle handle = gameObject.transformHandle;

// Transform 컴포넌트에서
TransformHandle handle = transform.GetTransformHandle();
```

**구조체라는 점이 사용법을 바꾼다.** 속성을 고치려면 지역 변수에 먼저 담아야
한다. 문서가 이 점을 명시한다.

```csharp
// 속성 수정 — 지역 변수에 담고 고친다
TransformHandle handle = transformHandle;
handle.position = handle.position + Vector3.one;

// 메서드 호출은 직접 해도 된다
transformHandle.SetPositionAndRotation(Vector3.zero, Quaternion.identity);
```

유효성 확인도 다르다. **null 체크가 아니라 `IsValid()`** 를 쓴다.

```csharp
if (root.parent.IsValid())
{
    // 부모가 있다
}
```

여기서 **오해하기 쉬운 지점**이 하나 있다. Burst 호환이라고 해서 잡에서 쓸 수
있다는 뜻이 아니다.

> 이 구조체는 **스레드 안전하지 않으며**, `IJobParallelForTransform` 같은
> 인터페이스를 구현한 잡에서 접근하면 안전성 예외를 던진다.

Burst 호환은 **"메인 스레드에서 도는 Burst 컴파일 코드"** 한정이다. 병렬 잡에서
트랜스폼을 다루려면 `NativeArray<TransformHandle>`로 만든
`TransformAccessArray`를 써야 한다고 문서가 안내한다.

**버전을 확인해야 한다.** `TransformHandle`의 스크립팅 레퍼런스 페이지는
**6000.2에서 404**고, 6000.3부터 존재한다. 프로젝트가 6000.2면 이 API는
아직 없다.

## 어디에 왜 쓰나

위 세 항목은 결국 한 가지를 말한다. **프레임마다 도는 코드에서 무엇이 새로
할당되는가.** 실제로 손대는 자리는 이렇다.

### 매 프레임 도는 코드를 점검할 때

가장 자주 고치게 되는 형태다. 할당하는 API, 문자열 연결, 루프 안 `GetComponent`가
한 메서드에 같이 들어 있는 경우가 흔하다.

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 주변 적을 주기적으로 훑어 가장 가까운 대상을 고른다.
/// </summary>
public class TargetScanner : MonoBehaviour
{
    private const int MAX_HITS = 32;
    private const float SCAN_INTERVAL = 0.2f;

    [Header("Scan")]
    [SerializeField, Range(1f, 50f), Tooltip("탐지 반경(미터)")]
    private float _radius = 12f;

    [SerializeField, Tooltip("적만 포함한 레이어 마스크")]
    private LayerMask _targetMask;

    private readonly Collider[] _hits = new Collider[MAX_HITS];
    private readonly List<Transform> _candidates = new List<Transform>(MAX_HITS);

    private Transform _closest;
    private float _nextScanTime;

    public Transform Closest => _closest;

    private void Update()
    {
        if (Time.time < _nextScanTime)
        {
            return;
        }

        _nextScanTime = Time.time + SCAN_INTERVAL;
        Scan();
    }

    private void Scan()
    {
        // 결과 배열을 재사용한다. OverlapSphere였다면 매번 새 배열이 생긴다.
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _hits, _targetMask);

        _candidates.Clear();
        for (int i = 0; i < count; i++)
        {
            _candidates.Add(_hits[i].transform);
        }

        _closest = FindClosest(_candidates, transform.position);
    }

    private static Transform FindClosest(List<Transform> candidates, Vector3 origin)
    {
        Transform best = null;
        float bestSqr = float.MaxValue;

        // LINQ의 OrderBy(...).First()를 쓰면 정렬용 할당이 생긴다.
        for (int i = 0; i < candidates.Count; i++)
        {
            float sqr = (candidates[i].position - origin).sqrMagnitude;
            if (sqr < bestSqr)
            {
                bestSqr = sqr;
                best = candidates[i];
            }
        }

        return best;
    }
}
```

문서에서 가져온 규칙이 네 개 들어 있다.

- **결과 배열과 리스트를 필드에 두고 재사용한다.** 할당 없는 API는 담을 그릇을
  내가 주는 형태다.
- **`Update`를 매 프레임 다 돌지 않는다.** 문서가 "활성 `Update` 함수 수를
  최소화하라"고 하고, 중앙 업데이트 매니저나 플레이어 루프 커스터마이즈를
  대안으로 든다. 여기서는 간격만 뒀다.
- **런타임 코드에서 LINQ를 쓰지 않는다.** 문서 표현 그대로 "런타임 코드에서
  LINQ 사용을 피하라"이고, `Update`/`FixedUpdate`에서는 특히 그렇다.
- **거리 비교는 `sqrMagnitude`로 한다.** 제곱근을 생략할 수 있는 자리다.

### 오브젝트를 계속 만들고 부술 때

**Pooling and reusing objects** 페이지가 `UnityEngine.Pool`을 안내한다.
`ObjectPool<T>`, `PooledObject<T>`, `CollectionPool<T>`가 이름으로 나온다.

여기서 문서가 강조하는 건 풀링 자체가 아니라 **상태 초기화**다.

> 오브젝트를 풀에 반환할 때 이 상태를 초기화하는 것이 중요하다. 그래야 나중에
> 다시 꺼냈을 때 처음 사용했을 때와 같은 상태에서 시작한다.

그리고 초기화해야 할 것들을 나열한다 — **코루틴 정지, 이벤트 구독 해제, 물리
상태 초기화, 애니메이션 정리, 파티클 시스템 정지.** 풀링 버그가 대부분 이
목록에서 나온다. 특히 이벤트 구독 해제를 빠뜨리면 같은 오브젝트가 재사용될
때마다 핸들러가 겹쳐 붙는다.

`UnityEngine.Pool`도 **스레드 안전하지 않고 메인 스레드에서만 안전하게 호출할
수 있다**고 못 박아뒀다.

### 쓰지 말아야 할 자리

- **프로파일링 없이 고치는 자리.** 문서의 첫 문단도 프로파일링을 나쁜 관행
  회피와 나란히 놓는다. 위 항목들은 전부 "여기가 병목이라고 확인된 뒤"의
  이야기다.
- **뜨겁지 않은 코드.** 초기화 한 번 도는 자리에서 `Mesh.vertices`를 한 번 읽는
  건 문제가 아니다. 문서의 경고도 전부 **타이트한 루프**와 **매 프레임**이라는
  조건이 붙어 있다.

## 문서가 못 박은 금지 항목들

**Unity programming best practices** 페이지는 다섯 개 중 유일하게 내용이 있는
페이지다. "하지 마라"로 끝나는 문장만 모으면 이렇다.

| 하지 말 것 | 문서가 붙인 이유 |
|---|---|
| Unity 오브젝트 검사에 `ReferenceEquals` | 파괴된 오브젝트를 걸러내려면 `if (obj == null)`을 쓸 것 |
| 런타임 코드의 C# 파이널라이저 | 별도 스레드에서 비결정적으로 돌고, 아예 안 돌 수도 있음 |
| 정적 필드에 큰 에셋의 강한 참조 | 씬을 넘어 살아남음 |
| 씬 언로드를 넘겨 컴포넌트를 캐싱 | 파괴될 수 있음 |
| 런타임 코드의 LINQ | 할당 |
| 반복되는 문자열 연결 | 중간 문자열이 전부 쓰레기가 됨 |
| 메인 스레드에서 `Task.Result` / `Task.Wait` | 데드락 |
| 백그라운드 스레드에서 GameObject·Transform·Component 참조 | 코어 런타임이 단일 스레드 |

첫 줄이 내가 쓰는 컨벤션과 정확히 같은 이야기다. Unity 오브젝트는
`UnityEngine.Object`의 `==` 오버로드로 "파괴됨"을 null처럼 보고하는데,
`ReferenceEquals`나 `?.`는 그 오버로드를 우회한다. 그래서 **Unity 오브젝트에는
`if (obj != null)`을 쓰고, 순수 C# 객체에만 `?.`를 쓴다.**

문자열 쪽 설명도 구체적이다. `{ "A", "B", "C", "D", "E" }`를 이어 붙이면
`"A"`, `"AB"`, `"ABC"`, `"ABCD"`, `"ABCDE"` **다섯 개**가 만들어지는데 필요한
건 마지막 하나다. 대안으로 `System.Text.StringBuilder`, 그리고 UI라면 **점수와
라벨을 애초에 다른 텍스트 오브젝트로 분리**해 연결 자체를 없애는 방법을 든다.

박싱에 대한 설명도 한 줄 짚어둘 만하다.

> Unity의 가비지 컬렉터는 **세대별(generational)이 아니라서**, 박싱이 만들어내는
> 작고 잦은 임시 할당을 효율적으로 쓸어내지 못한다.

.NET 습관으로 "작은 할당은 0세대에서 싸게 정리된다"고 생각하면 안 된다는
뜻이다. 클로저와 `params` 수정자도 같은 이유로 성능 민감한 코드에서 피하라고
안내한다.

## 정리

- **스크랩한 페이지가 목차면 아무것도 저장하지 않은 것이다.** Code optimization은
  링크 다섯 줄이고, 그중 넷이 또 목차다.
- **배열을 반환하는 Unity API는 접근할 때마다 복사본을 만든다.** 루프 밖으로
  빼거나, `Get~(리스트)` 형태의 채워 넣는 API로 바꾼다. 1만 개를 넘으면
  `NativeArray`.
- **`Awaitable`은 풀링되고, 두 번 `await`하면 안 되고, 같은 프레임에 이어진다.**
  `Task`를 그대로 옮기면 두 번째 항목에서 터진다.
- **`TransformHandle`은 관리되지 않는 구조체다.** 지역 변수에 담아 수정하고,
  `IsValid()`로 확인한다. Burst 호환은 **메인 스레드 한정**이고, 병렬 잡에는
  `TransformAccessArray`. 6000.2에는 없다.
- **금지 목록의 첫 줄이 `ReferenceEquals`다.** Unity 오브젝트의 null 체크는
  `==`를 거쳐야 한다.
- **GC가 세대별이 아니다.** 박싱·클로저·`params`가 만드는 작은 쓰레기가 싸게
  정리되지 않는다.

문서를 한 층씩 내려가면서 든 생각은 하나다. 최적화 문서의 상위 페이지는
**무엇을 검색해야 하는지**를 알려주고, 실제 규칙은 늘 잎사귀에 있다. 목차를
스크랩할 게 아니라 잎사귀를 스크랩해야 했다.

---

### 참고

- [Code optimization — Unity 매뉴얼](https://docs.unity3d.com/Manual/scripting-optimization.html)
- [Unity programming best practices](https://docs.unity3d.com/Manual/programming-best-practices.html)
- [Optimizing arrays](https://docs.unity3d.com/Manual/performance-optimizing-arrays.html)
- [Reference type management](https://docs.unity3d.com/Manual/performance-reference-types.html)
- [Introduction to asynchronous programming with Awaitable](https://docs.unity3d.com/Manual/async-awaitable-introduction.html)
- [Introduction to TransformHandle API](https://docs.unity3d.com/Manual/class-TransformHandle.html)
- [Pooling and reusing objects](https://docs.unity3d.com/Manual/performance-reusable-code.html)

스크랩 시점은 2025년 12월이고, 인용과 코드는 작성 시점의 **Unity 6.6(6000.6)**
매뉴얼로 다시 대조했다.
