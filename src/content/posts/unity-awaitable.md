---
pubDatetime: 2026-10-07T16:00:00+09:00
title: "await Awaitable은 변수에 담을 값이 없다"
lang: ko
translationKey: unity-awaitable
featured: false
draft: false
tags:
  - Unity
  - C#
  - 멀티스레딩
  - 최적화
description: "Awaitable을 소개하는 2025년 글이다. 지적한 제약은 지금도 맞는데, 그 제약을 보여주는 예제 두 줄이 컴파일되지 않는다. 그리고 글이 아쉬워한 기능 중 둘은 문서에 멤버로 있다."
---

**비동기를 어떻게든 쓰고 싶어서 `async`/`await`를 붙여봤다가**, Unity가 권하는
형태가 따로 있다는 걸 알게 되어 찾던 중 스크랩한 글이다. `Task`로 먼저 짜놓고
돌리던 참이었는데 그 자리에 `Awaitable`이 있었다. 2025년 글이고 이 타입을 짧게
소개한다.

`Task`에서 넘어오는 쪽에 중요한 차이는 전에 한 번 다뤘다.
[Unity 코드 최적화 문서를 정리한 글](/posts/unity-code-optimization/)에서
`Awaitable`이 `Task`와 다른 세 군데 — **풀링, 재사용 금지, 동기적
연속 실행** — 을 문서 문장으로 짚었다. 이 클리핑은 그 위에서 **쓰는 쪽**을
보여준다. 제약, 백그라운드 전환, 취소, 코루틴과의 비교까지 네 절이다.

**지적이 대체로 정확하다.** 특히 `WhenAll`·`WhenAny`가 없다는 불만은 지금도
유효하고, 뒤에서 현행 멤버 목록으로 확인했다.

걸리는 건 **제약을 보여주는 그 예제**다.

```csharp
var awaitable = await Awaitable.EndOfFrameAsync();
await awaitable;
await awaitable;        // 안됨
```

글은 이 코드를 두고 "비록 컴파일 에러나 크래시가 나지는 않지만"이라고 적는다.
**첫 줄이 컴파일되지 않는다.**

## 목차

## `await Awaitable`은 변수에 담을 값이 없다

Unity가 타입을 둘로 나눠둔 게 이유다. 결과가 없는 쪽과 있는 쪽이다.

| 타입 | `await`한 결과 |
| --- | --- |
| `Awaitable` | 없다 |
| `Awaitable<T>` | `T` |

`Awaitable.EndOfFrameAsync()`가 돌려주는 것은 **제네릭이 아닌 `Awaitable`**이다.
그래서 `await Awaitable.EndOfFrameAsync()`는 값을 내놓지 않는다. 그걸 `var`에
대입하면 컴파일러가 막는다.

> Cannot assign 'expression' to an implicitly-typed variable.

**CS0815**다. `var`는 오른쪽에서 타입을 받아와야 하는데 받아올 타입이 없다.

의도한 코드는 `await`가 없는 쪽이다.

```csharp
// Awaitable 인스턴스를 변수에 담는다 — await를 붙이지 않는다.
Awaitable awaitable = Awaitable.EndOfFrameAsync();

await awaitable;
await awaitable;        // 여기가 '안 되는' 자리
```

**이렇게 쓰면 글이 말하려던 상황이 실제로 만들어진다.** 한 인스턴스를 두 번
기다리는 것이고, 그게 문서가 금지하는 동작이다 —
[앞 글](/posts/unity-code-optimization/)에서 인용한 "하나의 `Awaitable`
인스턴스를 두 번 이상 `await`하는 것은 결코 안전하지 않다"가 그 문장이다.

고친 코드가 중요한 이유는 **진단이 바뀌기 때문**이다. 원문대로 적으면 컴파일이
멈추니 런타임 동작을 볼 기회조차 없다. 글이 설명한 "두 번째 `await`이 즉시
반환된다"는 증상은 `await`를 뗀 형태에서만 나타난다.

### `GetAwaiter`는 "못 하는" 게 아니라 문서에 없다

같은 절의 두 번째 제약이다.

> awaitable의 GetAwaiter()를 하면 안됨

그리고 본문에서는 이렇게 쓴다.

> GetAwaiter를 직접 호출할 수 없기 때문에 직접 WhenAll에 해당하는 확장 메서드를
> 만들기도 곤란한 문제점이 있다

**"할 수 없다"와 "하면 안 된다"가 섞여 있다.** 글 자신의 예제가 그 메서드를
호출하고 있으니 호출은 된다. `await`가 동작하려면 그 메서드가 있어야 하기도
하다.

현행 문서의 멤버 목록을 보면 사정이 보인다. `Awaitable`에 적혀 있는 것은
프로퍼티 `IsCompleted`, 메서드 `Cancel`, 그리고 정적 메서드 일곱 개다.
**`GetAwaiter`는 목록에 없다.** 즉 공개되어 있지만 문서화된 표면이 아니다.

그래서 정확한 서술은 이렇게 된다. **호출은 되고, 결과가 보장되지 않는다.** 그
이유는 글이 "정확히 확인할 수는 없지만 유사한 원인"이라고 추측한 그대로이고,
문서에 한 줄로 적혀 있다.

> instances of the `Awaitable` class are **pooled** and therefore not safe to
> `await` multiple times in the same method.

**풀링이다.** 끝난 인스턴스는 풀로 돌아가고 다른 호출이 그걸 다시 꺼낸다. 내가
들고 있던 참조가 가리키는 대상이 더 이상 내 작업이 아니므로, 두 번째 `await`도
`GetAwaiter().OnCompleted()`도 기준이 사라진다. 추측이 아니라 문서에 적힌
설계다.

## `WhenAll`과 `WhenAny`는 6.2에도 없다

글의 불만은 이것이다.

> 대표적인 예를 들면 복잡한 비동기 작업을 처리할 때 자주 사용하게 되는
> WhenAll, WhenAny가 지원되지 않는 것이 있는데

**지금도 그렇다.** 현행 문서의 정적 메서드가 일곱 개다.

| 정적 메서드 | 하는 일 |
| --- | --- |
| `NextFrameAsync` | 다음 프레임에 이어진다 |
| `EndOfFrameAsync` | 프레임 끝에 이어진다 |
| `FixedUpdateAsync` | `FixedUpdate` 타이밍에 이어진다 |
| `WaitForSecondsAsync` | 지정한 초 뒤에 이어진다 |
| `MainThreadAsync` | 메인 스레드로 돌아간다 |
| `BackgroundThreadAsync` | 스레드풀 백그라운드 스레드로 넘어간다 |
| `FromAsyncOperation` | 기존 `AsyncOperation`에서 `Awaitable`을 만든다 |

**조합 메서드가 하나도 없다.** 그리고 2023.1 문서의 같은 목록도 **똑같이 일곱
개**다. 도입 이후 정적 멤버가 늘지 않았다는 뜻이고, 글이 2025년에 적은 불만이
그대로 유지되고 있다.

글이 "현재 기능은 위의 간단한 예시 코드에 있는 것들이 거의 전부"라고 한 것도
거의 맞다. 다만 그 예시 코드에 없는 게 셋 있는데, 그중 둘이 글이 아쉬워한
자리를 메운다.

## 문서에 있고 글에 없는 멤버 셋

`IsCompleted`, `Cancel`, `FromAsyncOperation`이다.

### 취소 모델이 둘이고 문서는 동등하다고 적는다

글의 취소 절은 `destroyCancellationToken` 하나만 다룬다. 토큰을 메서드에
넘기는 방식이고, 정확한 설명이다. 그런데 `Awaitable`에는 인스턴스 메서드가
따로 있다.

> **Cancel** — Cancels the awaitable. If the awaitable is being awaited, the
> awaiter receives a `System.OperationCanceledException`.

그리고 둘의 관계를 문서가 못 박는다.

> some methods returning an `Awaitable` also accept a CancellationToken. **Both
> cancelation models are equivalent.**

**두 모델이 동등하다.** 토큰을 미리 넘길 수 없는 상황 — 이미 시작된 작업을
바깥에서 끊어야 할 때 — 에는 인스턴스를 들고 있다가 `Cancel()`을 부르면 된다.
받는 쪽의 예외는 같은 `OperationCanceledException`이라 `catch` 코드가 달라지지
않는다.

```csharp
private Awaitable _running;

private async Awaitable StartLongWaitAsync()
{
    _running = Awaitable.WaitForSecondsAsync(10f);

    try
    {
        await _running;
        Debug.Log("정상 완료");
    }
    catch (OperationCanceledException)
    {
        // 토큰으로 끊어도, Cancel()로 끊어도 여기로 온다.
        Debug.Log("취소됨");
    }
    finally
    {
        _running = null;
    }
}

public void AbortNow()
{
    // 이미 시작된 작업을 바깥에서 끊는다.
    _running?.Cancel();
}
```

`_running?.Cancel()`에 `?.`를 쓴 이유는 `Awaitable`이 Unity 오브젝트가 아니기
때문이다. [Fake Null을 다룬 글](/posts/unity-fake-null/)의 주의는
`UnityEngine.Object`에만 해당한다.

### `AsyncOperation`에서 건너오는 길이 있다

`FromAsyncOperation`의 선언이다.

```csharp
public static Awaitable FromAsyncOperation(AsyncOperation op,
                                           CancellationToken cancellationToken);
```

> Creates an Awaitable from an existing AsyncOperation object.

**기존 `AsyncOperation`을 `Awaitable`로 감싼다.** `SceneManager.LoadSceneAsync`,
`Resources.LoadAsync`, 그리고 `AsyncOperation`을 돌려주는 Unity API 전반이
여기로 들어온다.

이게 글의 다른 절과 맞물린다. 글은 백그라운드 스레드 절에서 이렇게 경고한다.

> Addressables등의 유니티 메서드는 거의 전부 메인 스레드에서 실행하지 않으면
> 오류가 발생하기 때문에 리소스 로딩 등의 목적으로 사용할 때는 주의하여야 한다

맞는 경고다. 그리고 **그 자리에 쓸 멤버가 같은 클래스에 있다.** 리소스 로딩을
백그라운드로 밀어내는 게 아니라, 메인 스레드에서 `AsyncOperation`을 시작하고
그걸 `await`하는 쪽이다. [Addressables를 다룬 글](/posts/unity-addressables/)에서
본 로딩 핸들도 같은 모양으로 기다릴 수 있다.

`IsCompleted`는 폴링용 프로퍼티다. `await` 없이 완료 여부만 보고 싶을 때 쓰는
자리이고, 글의 범위에서는 쓸 일이 없어서 빠진 것으로 보인다.

## 백그라운드로 넘어가면 쓸 수 없는 것들이 있다

글의 병렬 처리 예제다.

```csharp
await Awaitable.BackgroundThreadAsync();
Debug.Log("작업 스레드로 이동");
Thread.Sleep(5000);

await Awaitable.MainThreadAsync();
Debug.Log("메인 스레드로 복귀");
```

동작하는 코드이고 설명도 맞다. 문서가 적는 `BackgroundThreadAsync`의 성질이다.

> Resumes execution on a ThreadPool background thread. **Completes immediately
> when called from a background thread.**

그런데 글이 적지 않은 제약이 **나머지 메서드 쪽에** 붙어 있다.
`NextFrameAsync`의 설명이다.

> This method **can only be called from the main thread** and always completes
> on main thread.

`WaitForSecondsAsync`도 같다 — 메인 스레드에서만 호출할 수 있고 완료도 메인
스레드다. 두 절을 이어 읽으면 **섞으면 안 되는 조합**이 보인다.

| 위치 | 쓸 수 있는 것 | 쓸 수 없는 것 |
| --- | --- | --- |
| 메인 스레드 | 일곱 개 전부 | — |
| 백그라운드 스레드 | `MainThreadAsync`, `BackgroundThreadAsync` | `NextFrameAsync`, `EndOfFrameAsync`, `FixedUpdateAsync`, `WaitForSecondsAsync` |

**프레임과 시간에 걸린 넷은 메인 스레드 전용이다.** 백그라운드로 넘어간 뒤에
"1초 쉬자"고 `WaitForSecondsAsync`를 부르면 제약을 넘는 것이고, 거기서는
`Thread.Sleep`이 맞다 — 글의 예제가 실제로 그렇게 쓰고 있다. **예제는 맞고
이유가 적혀 있지 않다.**

그리고 "스레드풀 백그라운드 스레드"라는 점도 읽어둘 값이 있다. 글이 한
`Thread.Sleep(5000)`은 그 **풀의 스레드 하나를 5초 동안 점유한다.** 글이
"외부 I/O등 초 단위로 걸리는 무거운 작업"에 적합하다고 한 범위에서는
괜찮지만, 같은 패턴을 여러 개 동시에 돌리면 풀을 말리는 쪽이 된다.

## `destroyCancellationToken`에는 캐시 조건이 붙어 있다

글의 취소 예제는 정확하다. 토큰을 넘기고, `OperationCanceledException`을
`catch`하고, 취소되면 그 아랫줄이 실행되지 않는다는 설명까지 맞는다.

문서에 한 줄이 더 있다.

> You must **cache** the `destroyCancellationToken` **before** you destroy the
> MonoBehaviour object.

**파괴 전에 캐시해두라는 것이다.** 이 프로퍼티는 `MonoBehaviour`의 멤버이므로,
파괴된 뒤에 읽으려 하면 그 접근 자체가 문제가 된다. 글의 예제는 `Awake`에서
호출된 메서드가 시작 시점에 한 번 읽으므로 괜찮다.

걸리는 건 **`await` 뒤에 읽는 형태**다.

```csharp
// 위험 — await 뒤에 다시 읽는다. 그 사이에 파괴됐을 수 있다.
private async Awaitable LoopRiskyAsync()
{
    while (true)
    {
        await Awaitable.WaitForSecondsAsync(1f, destroyCancellationToken);
    }
}

// 안전 — 시작할 때 한 번 캐시해둔다.
private async Awaitable LoopSafeAsync()
{
    CancellationToken token = destroyCancellationToken;

    while (true)
    {
        await Awaitable.WaitForSecondsAsync(1f, token);
    }
}
```

위쪽은 반복마다 프로퍼티를 다시 읽는다. 토큰이 취소되면 `await`가 예외를
던지고 빠져나가니 대개는 문제가 안 되지만, **문서가 캐시를 요구하는 쪽을
따르는 편이 싸다.** 지역 변수 한 줄이다.

글의 예제에 한 가지 더 붙일 데가 있다.

```csharp
public void Awake()
{
    AwaitLongtime();
}
```

**반환값을 받지 않고 호출한다.** 의도적인 fire-and-forget이고 흔한 형태인데,
이러면 그 메서드 안에서 `catch`하지 못한 예외를 **아무도 보지 않는다.** 글의
예제는 `try`/`catch`가 메서드 안에 있으니 취소는 잡힌다. 다만 다른 예외까지
덮으려면 `catch` 범위를 그에 맞춰 두어야 하고, 호출 쪽에서 `_ =`로 버리는
것임을 표시해두면 읽는 사람이 의도를 안다.

```csharp
private void Awake()
{
    // 반환을 버린다는 것을 명시한다.
    _ = AwaitLongtimeAsync();
}
```

## 코루틴과의 비교는 맞는다

글의 마지막 절은 `Awaitable`이 코루틴보다 나은 네 경우를 든다. 넷 다 성립한다.

| 글의 주장 | 확인 |
| --- | --- |
| GameObject에 묶이지 않은 작업 | 맞음. 코루틴은 `MonoBehaviour`에서 시작하고 그 수명을 탄다 |
| 반환값을 받아 연속으로 이어갈 때 | 맞음. 코루틴은 `IEnumerator`라 값을 돌려줄 자리가 없다 |
| 취소를 명시적으로 하고 싶을 때 | 맞음. `CancellationToken`과 `Cancel()` 두 모델이 있다 |
| 다른 async 메서드와의 호환성 | 맞음. `Awaitable`은 C#의 awaitable 패턴을 따른다 |

첫째 줄에 한 겹 덧붙일 데가 있다. 글은 "코루틴의 경우 씬 어딘가에 최소한 한
개의 활성화된 GameObject가 필요하다"고 적는데, **활성화 조건이 시작 시점만의
문제가 아니다.**

[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 확인한 문서
문장이 그 자리다 — `SetActive(false)`는 그 오브젝트에 붙은 **코루틴을 전부
멈춘다.** 풀로 돌려보낸 오브젝트의 코루틴은 거기서 끝나고, 다시 꺼내도
이어지지 않는다. `Awaitable`은 그 규칙을 타지 않는다. 비활성화와 무관하게
계속 진행되고, 끊고 싶으면 **내가 끊어야 한다.**

**장점과 책임이 같은 문장에서 나온다.** GameObject에 묶이지 않는다는 것은,
GameObject가 사라져도 알아서 멈추지 않는다는 뜻이기도 하다. 그래서 글이 다룬
`destroyCancellationToken`이 선택이 아니라 기본값이 된다.

이 블로그에서 `Awaitable`을 실제로 쓴 코드는
[Sentis 워크플로 글](/posts/sentis-workflow/)에 있다. `async Awaitable`로 추론
결과를 기다리는 형태이고, 연속 실행이 같은 프레임에서 이어진다는 성질에
기대고 있다.

## 어디에 왜 쓰나

### 코루틴의 `yield`를 그대로 옮긴다

대기 종류별 대응이 거의 일대일이다.

| 코루틴 | `Awaitable` |
| --- | --- |
| `yield return null` | `await Awaitable.NextFrameAsync()` |
| `yield return new WaitForEndOfFrame()` | `await Awaitable.EndOfFrameAsync()` |
| `yield return new WaitForFixedUpdate()` | `await Awaitable.FixedUpdateAsync()` |
| `yield return new WaitForSeconds(1f)` | `await Awaitable.WaitForSecondsAsync(1f)` |
| `yield return asyncOperation` | `await Awaitable.FromAsyncOperation(op, token)` |
| `yield break` | `return` |
| `StopCoroutine` | 토큰 취소 또는 `Cancel()` |

`WaitForSecondsRealtime`에 해당하는 것이 목록에 없다는 게 눈에 띈다. 시간
배율을 무시하는 대기가 필요하면 그건 직접 만들어야 한다.

옮긴 모양은 이렇게 된다. 함정이 일정 시간 뒤에 재무장하는 코드다.

```csharp
using System;
using System.Threading;
using UnityEngine;

public class TrapRearm : MonoBehaviour
{
    private const float DEFAULT_COOLDOWN = 3f;

    [Header("Cooldown")]
    [SerializeField, Range(0.1f, 30f), Tooltip("발동 후 재무장까지의 시간")]
    private float _cooldown = DEFAULT_COOLDOWN;

    [SerializeField, Tooltip("재무장 상태")]
    private bool _isArmed = true;

    // 파괴 전에 캐시해둔다. 문서의 요구다.
    private CancellationToken _destroyToken;

    private void Awake()
    {
        _destroyToken = destroyCancellationToken;
    }

    public void Trigger()
    {
        if (!_isArmed)
        {
            return;
        }

        _isArmed = false;

        // 반환을 버린다는 것을 명시한다.
        _ = RearmAsync();
    }

    private async Awaitable RearmAsync()
    {
        try
        {
            await Awaitable.WaitForSecondsAsync(_cooldown, _destroyToken);

            _isArmed = true;
            Debug.Log("재무장", this);
        }
        catch (OperationCanceledException)
        {
            // 오브젝트가 파괴되어 취소됐다. 되돌릴 상태가 없으면 비워둔다.
        }
    }
}
```

코루틴으로 짰다면 `StartCoroutine`이 필요하고, **오브젝트가 비활성화되면 쿨다운이
멈춰서 영원히 재무장되지 않는다.** 풀에서 꺼내 쓰는 함정이라면 그게 바로 버그가
된다. `Awaitable`은 비활성화와 무관하게 흐르므로 그 증상이 없다.

### `WhenAll`이 없을 때

조합 메서드가 없어도 **"동시에 시작하고 모두 기다리는" 모양은 만들 수 있다.**
C#의 `async` 메서드는 첫 `await`까지 동기적으로 실행되므로, 호출만 해두면 그
자리에서 시작된다.

```csharp
private async Awaitable LoadAllAsync()
{
    // await를 붙이지 않는다. 호출하는 순간 셋 다 시작된다.
    Awaitable a = LoadStageAsync();
    Awaitable b = LoadAudioAsync();
    Awaitable c = WarmUpShadersAsync();

    // 하나씩 기다린다. 각 인스턴스를 '한 번만' await하므로 규칙을 지킨다.
    await a;
    await b;
    await c;

    Debug.Log("셋 다 끝났다");
}
```

**각 인스턴스를 한 번씩만 `await`한다.** 앞 절의 재사용 금지에 걸리지 않는
형태다. 가장 오래 걸리는 쪽이 전체 시간을 정하니 결과도 `WhenAll`과 같다.

다만 `WhenAll`과 다른 데가 하나 있다. **`a`가 예외를 던지면 그 자리에서
빠져나가고, `b`와 `c`는 아무도 기다리지 않는 상태로 계속 돈다.**
`Task.WhenAll`은 전부 끝난 뒤에 예외를 모아 돌려주는데, 이 형태는 그렇지
않다. 실패를 묶어 처리해야 하면 각 메서드 안에서 `catch`하고 결과를
`Awaitable<bool>` 같은 형태로 돌려받는 쪽이 낫다.

`WhenAny`에 해당하는 것은 이 방식으로 만들 수 없다. 먼저 끝난 쪽을 알아야
하는데 `await`가 순서를 고정하기 때문이다. 그 시나리오가 필요하면 글이
말한 대로 UniTask나 `Task`를 쓰는 편이 맞다 —
[TcpListener를 다룬 글](/posts/tcplistener-accepttcpclient/)의 코드가 `Task`와
토큰을 쓰는 쪽이다.

### 쓰지 말아야 할 자리

- **`var x = await Awaitable...`.** `await`의 결과에 타입이 없다. 인스턴스를
  담으려면 `await`를 떼고 `Awaitable x = ...`로 쓴다.
- **같은 `Awaitable` 인스턴스를 두 번 `await`하는 것.** 풀링된 객체라 두 번째
  대기의 대상이 내 작업이 아닐 수 있다.
- **필드에 담아 여러 곳에서 기다리는 것.** 같은 이유다. `Task`에서 옮겨온
  패턴이면 특히 걸린다.
- **백그라운드 스레드에서 프레임·시간 대기를 부르는 것.** 넷은 메인 스레드
  전용이다. 거기서는 `Thread.Sleep`이나 `Task.Delay`다.
- **백그라운드에서 Unity API를 만지는 것.** 글의 경고가 맞다. 리소스 로딩은
  메인 스레드에서 시작해 `FromAsyncOperation`으로 기다린다.
- **`destroyCancellationToken`을 `await` 뒤에 다시 읽는 것.** 문서가 파괴 전
  캐시를 요구한다. 지역 변수에 받아둔다.
- **GameObject 수명에 맞춰 알아서 멈출 것으로 기대하는 것.** 코루틴의 성질이고
  `Awaitable`은 그러지 않는다. 토큰을 넘긴다.

## 정리

- **`await Awaitable`은 값을 내놓지 않는다.** 제네릭이 아닌 `Awaitable`은 결과가
  없고, 그래서 `var awaitable = await Awaitable.EndOfFrameAsync();`는 CS0815로
  멈춘다. 글이 보여주려던 상황은 `await`를 뗀 형태에서만 만들어진다.
- **`GetAwaiter`는 "할 수 없는" 게 아니라 문서에 없다.** 글의 예제도 호출하고
  있다. 호출은 되고 결과가 보장되지 않으며, 이유는 문서가 적은 **풀링**이다.
- **`WhenAll`·`WhenAny`는 지금도 없다.** 현행 정적 메서드가 일곱 개이고,
  2023.1의 목록과 같다. 글의 불만이 그대로 유효하다.
- **글에 없는 멤버가 셋이다.** `Cancel`은 토큰과 **동등한** 두 번째 취소
  모델이고, `FromAsyncOperation`은 `AsyncOperation`을 기다리는 길이며,
  `IsCompleted`는 폴링용이다. 앞의 둘이 글이 아쉬워한 자리를 메운다.
- **프레임·시간 대기 넷은 메인 스레드 전용이다.** 문서가 "can only be called
  from the main thread"라고 적는다. 백그라운드로 넘어간 뒤에는 쓸 수 없고,
  글의 예제가 `Thread.Sleep`을 쓴 이유가 그것이다.
- **`destroyCancellationToken`은 파괴 전에 캐시해야 한다.** 문서의 요구이고,
  `await` 뒤에 다시 읽는 형태를 피하면 된다.
- **코루틴과의 비교 네 가지는 다 맞는다.** 덧붙이면 `SetActive(false)`가
  코루틴을 멈추는 것과 달리 `Awaitable`은 계속 흐른다. **GameObject에 묶이지
  않는다는 장점이 곧 내가 끊어야 한다는 책임이다.**

---

### 참고

- [Awaitable — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.html) ·
  [Awaitable (2023.1)](https://docs.unity3d.com/2023.1/Documentation/ScriptReference/Awaitable.html)
- [Awaitable.Cancel](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.Cancel.html) ·
  [Awaitable.FromAsyncOperation](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.FromAsyncOperation.html)
- [Awaitable.NextFrameAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.NextFrameAsync.html) ·
  [Awaitable.WaitForSecondsAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.WaitForSecondsAsync.html) ·
  [Awaitable.BackgroundThreadAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.BackgroundThreadAsync.html)
- [MonoBehaviour.destroyCancellationToken — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour-destroyCancellationToken.html)
- [컴파일러 오류 CS0815 — C# 레퍼런스](https://learn.microsoft.com/en-us/dotnet/csharp/misc/cs0815)

이 글의 출발점이 된 자료는
[leffe. — 유니티 6 Awaitable 소개](https://tearsinrain.tistory.com/21)
(2025-03-20)이다. `Awaitable`이 `Task`와 다른 세 가지는
[Unity 코드 최적화 문서를 정리한 글](/posts/unity-code-optimization/)에서 먼저
다뤘고, 이 글에서는 **쓰는 쪽**을 현행 스크립팅 레퍼런스에 대조했다. 확인
시점은 2026-10-07이다.
