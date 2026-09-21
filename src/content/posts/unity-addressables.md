---
pubDatetime: 2026-09-21T18:00:00+09:00
title: "Release를 먼저 부르면 Completed는 무효해진 핸들을 받는다"
lang: ko
translationKey: unity-addressables
featured: false
draft: false
tags:
  - Unity
  - Addressables
  - C#
  - 메모리
description: "Addressables를 정리한 2023년 글을 현행 문서와 대조했다. 예제 코드의 해제 순서에 문제가 있고, 헤맸다는 중복 키 문제는 문서에 한 줄로 적혀 있다. 출발점이었던 언리얼의 소프트 참조와 나란히 놓으면 그 해제 문제가 더 분명해진다."
---

언리얼 엔진을 공부하다가 **런타임에 에셋을 불러오는 기능**이 있다는 걸 보고,
유니티에도 같은 게 있나 찾다가 닿은 2023년 글이다. Addressables를 **직접
써보고 정리한 기록**이라 밀도가 높다. 등록 절차, 로드와 해제, Resources와의
비교, 그리고 본인이 겪은 버그까지 들어 있다.

글머리에 "개인의 공부 정리용", "Unity 2021.3.15f1 기준"이라고 스스로 범위를
적어뒀다. 그래서 대조해볼 값어치가 있다. **지금 기준으로 어디가 맞고 어디가
움직였는지** 확인했다.

세 군데가 나왔다. 하나는 문서가 원문보다 더 세게 말해주는 곳이고, 하나는
원문이 헤맸다는 문제의 답이 문서에 한 줄로 있는 곳이고, 하나는 예제 코드
자체의 문제다. 마지막에 **출발점이었던 언리얼 쪽과 나란히** 놓아봤는데, 거기서
이 글의 첫 번째 문제가 더 분명해졌다.

## 목차

## 예제 코드의 `Release`가 너무 이르다

원문의 로드 예제를 그대로 옮기면 이렇다.

```csharp
void Start()
{
    // 마우스 커서 텍스처 바꾸기
    AsyncOperationHandle handle = Addressables.LoadAssetAsync<Texture2D>("Cursor_Mining");
    // 완료 시점에 실행할 내용 callback으로 등록
    handle.Completed += (op) =>
    {
        Cursor.SetCursor(handle.Result as Texture2D, Vector2.zero, CursorMode.Auto);
        Debug.Log("Complete");
    };
    // 해제
    Addressables.Release(handle);
}
```

세 줄이 순서대로 **같은 프레임에** 실행된다. 로드를 걸고, 콜백을 등록하고,
**해제한다.** `LoadAssetAsync`는 비동기이므로 이 시점에 로드는 아직 끝나지
않았다. 그런데 `Release`가 벌써 불린다.

문서가 `Release`의 효과를 이렇게 적어놨다.

> 오퍼레이션 핸들을 릴리스하면 그 오퍼레이션이 로드한 에셋들의 **참조 카운트가
> 감소하고, 오퍼레이션 핸들 객체 자체가 무효화(invalidate)된다.**

뒷부분이 문제다. 람다가 `handle`을 **캡처해서** 나중에 `handle.Result`를
읽는데, 그때 `handle`은 이미 무효화된 뒤다. 순서를 풀어 쓰면 이렇다.

| 시점 | 일어나는 일 |
|---|---|
| `Start()` 안 | 로드 시작 → 콜백 등록 → **`Release` 실행** |
| 몇 프레임 뒤 | 로드 완료 → `Completed` 발화 → **무효화된 핸들의 `Result` 접근** |

설령 값을 읽어낸다 해도 그 직후가 더 곤란하다. 참조 카운트가 0이 되면
텍스처는 해제되는데, 커서는 그 텍스처를 가리키고 있다.

원문도 바로 다음 문단에서 **"나중에 필요할 때 해제하려면 반환값을
`AsyncOperationHandle` 타입 변수에 저장해두는 것이 좋겠습니다"** 라고 적는다.
의도는 맞았고 **예제에서 줄 위치만 어긋난 것**으로 보인다. 다만 코드만 복사해
가면 그 의도가 따라오지 않는다.

`Release`는 **더 이상 이 에셋을 쓰지 않을 때** 불러야 한다. 커서 텍스처처럼
씬이 살아 있는 동안 계속 쓰는 리소스라면 `OnDestroy`가 그 자리다.

한 가지 더. 예제는 비제네릭 `AsyncOperationHandle`로 받아 `Result as Texture2D`로
캐스팅하는데, 문서가 제네릭 쪽을 권한다.

> `Addressables`의 대부분의 메서드는 제네릭 `AsyncOperationHandle<T>` 구조체를
> 반환하며, 이는 `AsyncOperationHandle.Completed` 이벤트와
> `AsyncOperationHandle.Result` 객체에 대한 **타입 안전성**을 제공한다.

> 비제네릭 핸들을 **잘못된 타입의** 제네릭 핸들로 캐스팅하려 하면 런타임 예외가
> 발생한다.

`AsyncOperationHandle<Texture2D>`로 받으면 `Result`가 이미 `Texture2D`라
캐스팅이 필요 없다.

## "비동기만 지원한다"는 말은 2021년에 이미 틀렸다

원문이 단점을 꼽으면서 이렇게 적는다.

> 우선 비동기 로딩 방식만을 지원하므로, 동기적으로 로딩하려면 추가적인 코드
> 작성이 필요합니다.

**동기 로드용 API가 따로 있다.** `AsyncOperationHandle.WaitForCompletion()`이다.
문서 설명이 이렇다.

> 오퍼레이션의 `WaitForCompletion` 메서드를 호출하면, 양보(yield)하거나 이벤트를
> 기다리거나 `async await`을 쓰지 않고도 오퍼레이션이 끝나기를 기다릴 수 있다.

```csharp
opHandle = Addressables.LoadAssetAsync<GameObject>(address);
opHandle.WaitForCompletion(); // 오퍼레이션이 끝나면 반환한다

if (opHandle.Status == AsyncOperationStatus.Succeeded)
{
    Instantiate(opHandle.Result, transform);
}
```

시점이 중요하다. 이 기능은 **1.17.4-preview(2021-01-27)** 에 들어갔다.
체인지로그의 문장이 "AsyncOperationHandles에 `WaitForCompletion()`을 추가했다.
이를 통해 비동기 오퍼레이션을 동기적으로 실행할 수 있다"이다.

원문은 **2023년 7월**에 **Unity 2021.3.15f1** 기준으로 쓰였다. 그 시점에 이미
2년 넘게 존재하던 기능이다. 개인 공부 기록이니 놓칠 수 있는 일이지만,
**이 한 줄 때문에 "Addressables는 동기 로드가 안 되니 Resources를 쓰자"는
결론까지 가면** 판단이 달라진다.

다만 공짜는 아니다. 문서가 경고를 여러 개 붙여놨다.

| 주의 | 문서의 서술 |
|---|---|
| 프레임 끊김 | "**상당한 시간이 걸리는 오퍼레이션**, 예를 들어 데이터를 다운로드해야 하는 경우에는 `WaitForCompletion` 호출을 피하라" |
| 연쇄 대기 | 호출 시 **활성화된 모든 에셋 로드 오퍼레이션**이 완료되므로 예상치 못한 멈춤이 생길 수 있다 |
| 데드락 | `Awake`에서 씬 로딩 중에 호출하면 메인 스레드를 막아 다른 오퍼레이션이 끝나지 못한다. 연속된 씬을 이렇게 로드하면 **에디터나 플레이어가 데드락**에 걸릴 수 있다 |
| 플랫폼 | "**WebGL은 `WaitForCompletion`을 지원하지 않는다**" |

정리하면 **"동기 로드가 안 된다"가 아니라 "동기 로드는 되지만 비싸고, WebGL엔
없다"** 가 맞다. 판단의 근거가 바뀐다.

## 중복 키 문제는 문서에 한 줄로 있다

원문에서 제일 값어치 있는 부분은 본인이 겪은 버그 기록이다.

> 일부 무기의 이미지와 오디오를 같은 이름으로 등록하는 바람에 해당 무기들의
> sfx가 로드되지 않는 이슈가 발생했습니다. 별도의 예외가 발생하지도 않고 (…)
> 원인을 찾느라 한참 헤맸습니다.

그리고 **"단일 로드할 리소스의 키는 중복되지 않게 등록하는 것이 좋겠습니다"** 로
끝난다. 맞는 결론이고, 현행 문서가 이 동작을 명시하고 있다.

> **키가 두 개 이상의 에셋으로 해석되면, 가장 먼저 발견된 에셋만 로드된다.**

> 여러 에셋에 적용된 레이블로 이 메서드를 호출하면, Addressables는 **그중 가장
> 먼저 찾은 것**을 반환한다.

"예외가 발생하지 않는다"가 버그가 아니라 **설계된 동작**이라는 뜻이다. 키가
주소 하나만 가리키는 게 아니라 레이블도 될 수 있기 때문에, 여럿에 걸리는 건
정상 상황이고 그중 하나를 고른다.

그래서 규칙은 이렇게 정리된다.

- **`LoadAssetAsync<T>`는 "하나만 달라"는 뜻이다.** 키가 여럿에 걸리면
  말없이 첫 번째를 준다.
- **여럿을 받으려면 `LoadAssetsAsync`다.** 문서가 단일과 복수를 나눠놓은 이유가
  이것이다.
- 없는 키는 예외가 나므로 금방 잡히지만, **여럿에 걸리는 키는 조용하다.**

원문이 한참 헤맸다는 그 증상 — 로드가 끝났는데 배열 일부가 `null` — 이
정확히 이 동작의 결과다.

## Resources 비교는 맞다, 문서가 더 세게 말한다

원문의 Resources 비판은 두 갈래다. 둘 다 맞고, Unity 매뉴얼의 표현이 오히려
더 단정적이다.

**첫째, 쓰지 않는 것까지 빌드에 들어간다.**

> `Resources` 폴더 안의 에셋은 **무엇에도 참조되지 않더라도 항상 플레이어
> 빌드에 포함된다.**

원문이 "10GB 중 1GB만 써도 10GB가 전부 포함된다"고 예를 든 그대로다. 매뉴얼은
여기에 하나를 더 붙인다.

> `Resources` 폴더에 에셋이 많으면 **애플리케이션을 빌드하고 시작하는 데 오랜
> 시간이 걸릴 수 있다.**

**빌드 용량만이 아니라 시작 시간**이다. 원문의 빌드 용량 비교 스크린샷에는
안 잡히는 비용이라 짚어둘 만하다. 매뉴얼은 콘텐츠가 많은 애플리케이션이라면
콘텐츠 디렉터리, 에셋 번들, **Addressables 패키지** 같은 대안을 고려하라고
직접 권한다.

**둘째, 경로 대신 키를 쓴다.**

원문의 표현이 정확하다 — 등록한 객체를 옮기면 경로가 자동으로 갱신되므로
"객체의 위치를 바꾸어도 로드하는 부분을 수정할 필요가 없습니다." 이쪽은 지금도
그대로다.

빌드에 무엇이 들어가는지를 관리하는 이야기는
[Unity 코드 최적화 문서](/posts/unity-code-optimization/) 쪽의 관리 메모리
항목과도 이어진다.

## 언리얼 쪽에서는 어떻게 하나

애초에 이 기능을 찾게 된 출발점이 언리얼이었으니, 나란히 놓아본다.

언리얼은 참조를 **하드와 소프트로 나눈다.** 문서의 정의가 이렇다.

> **하드 참조**는 오브젝트 A가 오브젝트 B를 참조하면서, **A가 로드될 때 B도
> 로드되게** 하는 참조다.

> **소프트 참조**는 오브젝트 A가 **오브젝트 경로의 문자열 형태** 같은 간접적인
> 수단으로 B를 참조하는 것이다.

Unity의 Resources 문제와 모양이 같다. 하드 참조는 **주인이 올라올 때 딸려
올라오고**, Resources 폴더의 에셋은 **참조되지 않아도 빌드에 들어간다.** 둘 다
해법이 같다 — **참조를 문자열로 간접화한다.** 언리얼은 `TSoftObjectPtr`,
Addressables는 키다.

`TSoftObjectPtr`에 대한 문서 설명도 익숙하다 — 프로퍼티를 **문자열로 저장**
하고, `IsPending()`으로 로드 여부를 확인할 수 있으며, **"쓰려고 할 때 직접
에셋을 로드해야 한다."**

로드하는 쪽은 `FStreamableManager`다. 문서의 예제를 그대로 옮기면 이렇다.

```cpp
Streamable.RequestAsyncLoad(ItemsToStream,
  FStreamableDelegate::CreateUObject(this,
    &UGameCheatManager::GrantItemsDeferred));
```

비동기 로드를 걸고 완료 델리게이트를 넘긴다. `LoadAssetAsync` + `Completed`와
같은 모양이다. 대응을 정리하면 이렇다.

| | 언리얼 | Addressables |
|---|---|---|
| 간접 참조 | `TSoftObjectPtr` / `FSoftObjectPath` | 키(주소) 문자열 |
| 비동기 로드 | `FStreamableManager::RequestAsyncLoad` | `Addressables.LoadAssetAsync<T>` |
| 완료 통지 | `FStreamableDelegate` | `AsyncOperationHandle.Completed` |
| 살아 있게 하는 것 | 하드 참조 (+ GC) | **핸들의 참조 카운트** |

마지막 줄이 갈리는 지점이고, 여기서 이 글 첫 절의 버그가 더 선명해진다.
언리얼 문서의 문장을 보자.

> `StreamableManager`는 **델리게이트가 호출될 때까지** 자신이 로드한 에셋들에
> 하드 참조를 유지한다. 그래서 비동기로 로드하려던 오브젝트들이 델리게이트
> 호출 전에 가비지 컬렉트되지 않는다는 것을 안전하게 알 수 있다.
> **델리게이트 호출 이후에는 그 참조들을 놓기 때문에**, 계속 남아 있게 하려면
> 다른 곳에서 하드 참조를 잡아야 한다.

두 엔진 다 **"콜백 이후까지 살려두는 것은 내 책임"** 인데, 놓는 시점이 반대다.

- **언리얼은 콜백이 끝나면 자동으로 놓는다.** 그래서 **깜빡하고 안 잡으면**
  사라진다.
- **Addressables는 내가 `Release`를 부를 때까지 잡고 있다.** 그래서
  **너무 일찍 놓으면** 깨진다.

첫 절의 예제가 정확히 후자다. 언리얼의 감각으로 "일단 해제 호출을 적어두자"고
하면 안 되는 이유가 이것이다. Addressables에서 `Release`는 **정리 습관이
아니라 수명의 끝**을 뜻한다.

## 어디에 왜 쓰나

정리하면 **로드는 쉽고 해제가 어렵다.** 참조 카운트를 내가 맞춰야 하고,
문서도 못을 박는다.

> Unity는 참조된 에셋을 자동으로 로드하거나 해제하지 않는다. **`Addressables`
> API를 사용해 직접 로드하고 해제해야 한다.**

### 로드부터 해제까지 한 컴포넌트에서

핸들의 수명을 컴포넌트 수명에 묶으면 빠뜨릴 일이 줄어든다.

```csharp
using System;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

/// <summary>
/// 커서 텍스처를 Addressables로 로드하고, 컴포넌트가 사라질 때 함께 해제한다.
/// </summary>
public class CursorLoader : MonoBehaviour
{
    [Header("Addressables")]
    [SerializeField, Tooltip("Addressables에 등록한 키. 단일 로드이므로 중복되지 않아야 한다")]
    private string _cursorKey = "Cursor_Mining";

    // 제네릭 핸들로 받는다. Result가 이미 Texture2D라 캐스팅이 필요 없다.
    private AsyncOperationHandle<Texture2D> _handle;
    private bool _hasHandle;

    public event Action<Texture2D> OnCursorReady;

    private void Start()
    {
        _handle = Addressables.LoadAssetAsync<Texture2D>(_cursorKey);
        _hasHandle = true;
        _handle.Completed += HandleCompleted;
    }

    private void OnDestroy()
    {
        // 여기가 해제 자리다. 로드를 건 직후가 아니다.
        if (_hasHandle)
        {
            Addressables.Release(_handle);
            _hasHandle = false;
        }
    }

    private void HandleCompleted(AsyncOperationHandle<Texture2D> op)
    {
        if (op.Status != AsyncOperationStatus.Succeeded)
        {
            Debug.LogWarning(
                $"[{nameof(CursorLoader)}] '{_cursorKey}' 로드 실패. " +
                "키가 존재하는지 확인할 것.", this);
            return;
        }

        Cursor.SetCursor(op.Result, Vector2.zero, CursorMode.Auto);
        OnCursorReady?.Invoke(op.Result);
    }
}
```

몇 가지 의도를 적어둔다.

- **해제가 `OnDestroy`에 있다.** 커서 텍스처는 이 컴포넌트가 사는 동안 계속
  쓰이므로, 수명을 컴포넌트에 맞춘다.
- **제네릭 핸들을 쓴다.** 콜백 매개변수도
  `AsyncOperationHandle<Texture2D>`라서 `op.Result`가 바로 `Texture2D`다.
- **콜백에서 `Status`를 먼저 본다.** 없는 키는 예외가 나지만, 실패 경로를
  통과시키면 `Result`가 무엇인지 보장되지 않는다. 문서도 **실패한
  오퍼레이션이라도 핸들은 해제하는 것이 모범 사례**라고 적는다.
- **`?.`는 `OnCursorReady`에만 썼다.** 순수 C# 이벤트라서다. `_handle`은
  구조체이고 `Addressables`는 정적 클래스이므로 해당 없다.

### 동기 로드가 필요할 때

앞 절의 경고를 감안한 형태다. **작고 로컬에 있는 에셋**에 한정한다.

```csharp
AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>(key);
handle.WaitForCompletion();

if (handle.Status == AsyncOperationStatus.Succeeded)
{
    Instantiate(handle.Result, transform);
}
```

**WebGL 빌드가 대상에 있다면 이 경로를 쓰면 안 된다.** 문서가 지원하지 않는다고
명시한다. 원격에서 내려받아야 하는 콘텐츠에도 쓰지 말라고 한다.

### 쓰지 말아야 할 자리

- **`Start`에서 로드하고 같은 `Start`에서 해제하는 것.** 이 글의 출발점이다.
- **중복될 수 있는 키로 `LoadAssetAsync<T>` 호출.** 조용히 첫 번째를 준다.
  여럿이 정상이라면 `LoadAssetsAsync`다.
- **씬 로딩 중 `Awake`에서 `WaitForCompletion`.** 문서가 데드락 가능성을
  직접 경고한다.
- **소규모 프로젝트에 무조건 도입.** 원문의 마지막 판단이 합리적이다 — 예비
  리소스가 많지 않다면 얻는 게 크지 않다.

## 정리

- **`Release`는 핸들을 무효화한다.** 로드를 건 직후에 부르면, 나중에 발화하는
  `Completed`가 무효해진 핸들을 읽는다. 해제는 **더 이상 안 쓸 때**다.
- **비제네릭 대신 `AsyncOperationHandle<T>`.** 문서가 타입 안전성을 이유로
  권하고, 잘못된 타입 캐스팅은 런타임 예외다.
- **동기 로드는 2021년부터 된다.** `WaitForCompletion`이 1.17.4-preview에
  들어갔다. 대신 프레임 끊김·연쇄 대기·데드락 위험이 있고 **WebGL은
  미지원**이다.
- **키가 여럿에 걸리면 첫 번째만 로드된다.** 문서에 적힌 설계된 동작이고,
  예외가 안 나서 조용하다. 여럿을 받으려면 `LoadAssetsAsync`다.
- **Resources 비판은 맞다.** 매뉴얼 표현이 더 단정적이고
  (**"참조되지 않더라도 항상 포함된다"**), 빌드 용량 외에 **시작 시간**까지
  든다.
- **로드와 해제는 전부 내 책임이다.** 문서가 자동으로 해주지 않는다고 못을
  박는다.
- **언리얼과는 놓는 시점이 반대다.** 언리얼의 `StreamableManager`는 델리게이트
  호출 후 참조를 놓으므로 **안 잡으면** 사라지고, Addressables는 내가 놓을
  때까지 잡고 있으므로 **일찍 놓으면** 깨진다.

원문은 스스로 "공부 정리용"이라 적어둔 글이고, 실제로 겪은 버그까지 남겨둔
덕에 대조할 거리가 많았다. 앞서
[CrossFade 글](/posts/animator-crossfade/)에서도 비슷한 모양을 봤는데, 패턴이
같다. **오래된 기술 글은 대개 틀려서가 아니라, 그 사이 조건이 움직여서**
다시 봐야 한다.

---

### 참고

- [Load assets — Addressables 3.1 문서](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/load-assets.html)
- [Asynchronous operation handles](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/AddressableAssetsAsyncOperationHandle.html)
- [Synchronous loading — WaitForCompletion](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/SynchronousAddressables.html)
- [Addressables 1.17 체인지로그](https://docs.unity3d.com/Packages/com.unity.addressables@1.17/changelog/CHANGELOG.html)
- [Loading Resources at Runtime — Unity 매뉴얼](https://docs.unity3d.com/Manual/LoadingResourcesatRuntime.html)
- [Special folder names](https://docs.unity3d.com/Manual/SpecialFolders.html)
- [Asynchronous Asset Loading — Unreal Engine 문서](https://dev.epicgames.com/documentation/en-us/unreal-engine/asynchronous-asset-loading-in-unreal-engine)
- [Referencing Assets — Unreal Engine 문서](https://dev.epicgames.com/documentation/en-us/unreal-engine/referencing-assets-in-unreal-engine)

이 글의 출발점이 된 자료는 [sam0308 — \[Unity\] Addressable 기능](https://sam0308.tistory.com/71)
(2023-07-27, Unity 2021.3.15f1 기준)이다. 원문이 Addressables 1.x 시절 글이고,
인용과 동작은 현행 **3.1** 문서로 다시 대조했다.
