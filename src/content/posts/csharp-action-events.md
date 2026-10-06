---
pubDatetime: 2026-10-06T20:00:00+09:00
title: "익명 함수를 못 지우는 건 익명이라서가 아니다"
lang: ko
translationKey: csharp-action-events
featured: false
draft: false
tags:
  - Unity
  - C#
  - 이벤트
  - 디자인 패턴
description: "Action으로 이벤트를 등록하는 2022년 글이다. 동작 설명은 정확한데, 「익명 함수는 삭제 불가」라는 주석이 이유를 가린다. 못 지우는 건 익명이기 때문이 아니라 같은 인스턴스를 들고 있지 않아서다."
---

**입력 이벤트 처리를 알아보다가 `Action` 자체를 자세히 보려고** 찾던 중 스크랩한
글이다. [InputAction을 직접 구독한 글](/posts/input-action-subscribe/)에서
`started`·`performed`·`canceled`에 메서드를 붙이고 떼는 것을 다뤘는데, **그
`+=`와 `-=`가 정확히 무엇을 하는지는 입력 쪽 문서가 설명해주지 않는다.** 그게
`Action`이고 델리게이트다.

2022년 글이고 `Action`의 기본 동작을 예제로 훑는다. **설명이 정확하다.** 여러
번 등록하면 여러 번 실행되고, 파라미터가 있는 메서드는 직접 못 넣고, 람다로
감싸면 들어가고, 외부 스크립트에서도 등록된다 — 확인해보면 다 맞는다. `event`
키워드 절과 중복 방지 절까지 붙어 있어서 입문 자료치고 범위가 넓다.

걸리는 건 주석 하나다.

```csharp
gameOverEvent -= gameOver; //빼는 것도 가능.
gameOverEvent -= () => gameOverMessage("Message 2"); // 익명 함수는 삭제 불가
```

**「익명 함수는 삭제 불가」.** 결과는 맞다. 저 줄은 아무것도 지우지 않는다.
그런데 이유가 익명이라서가 아니다. 그리고 이유를 바로잡으면 **지우는 방법이
바로 나온다.**

## 목차

## 익명 함수를 못 지우는 건 익명이라서가 아니다

`-=`는 `Delegate.Remove`로 가고, 그 함수가 무엇을 기준으로 찾는지는 문서에
적혀 있다.

> **Removes the last occurrence of the invocation list of a delegate** from the
> invocation list of another delegate.

> Returns `source` if `value` is `null` or if the invocation list of `value` is
> **not found** within the invocation list of `source`.

찾지 못하면 원본을 그대로 돌려준다. 그래서 에러가 나지 않는다 — 클리핑이
"등록되지 않은 함수를 빼도 에러가 발생하지 않는다"고 적은 그대로다.

그러면 "찾는다"의 기준이 문제다. `Delegate.Equals`의 설명이다.

> Determines whether the specified object and the current delegate are of the
> same type and share the **same targets, methods, and invocation list**.

> If the two methods being compared are instance methods and are **the same
> method on the same object**, the methods are considered equal.

**「같은 객체의 같은 메서드」**다. 여기서 핵심은 **메서드**다. 람다식은
컴파일되면서 각각 **별개의 메서드**가 된다. 소스에 똑같이 생긴 두 람다를
적으면 서로 다른 메서드 둘이 만들어진다.

```csharp
// 글자가 같아도 서로 다른 메서드로 컴파일된다.
gameOverEvent += () => gameOverMessage("Message 2");  // 메서드 A
gameOverEvent -= () => gameOverMessage("Message 2");  // 메서드 B를 찾는다
```

**빼려는 쪽이 넣은 쪽과 다른 메서드**이므로 목록에서 찾지 못하고, 문서대로
원본이 그대로 돌아온다. 익명이라는 성질이 금지하는 게 아니라, **비교가 성립하지
않는 것**이다.

그래서 메서드 이름으로 넣은 쪽은 지워진다. `gameOver`는 `this`의 같은
메서드이므로 양쪽이 같은 대상을 가리킨다.

### 변수에 담으면 지워진다

이유가 "같은 인스턴스가 아니어서"라면 해법은 하나다. **인스턴스를 들고
있으면 된다.**

```csharp
using System;
using UnityEngine;

public class LambdaUnsubscribe : MonoBehaviour
{
    private const string MESSAGE = "Message 2";

    private Action _messageHandler;

    private void OnEnable()
    {
        // 람다를 필드에 담아둔다. 이 인스턴스가 비교의 기준이 된다.
        _messageHandler = () => Debug.Log($"Game Over : {MESSAGE}", this);

        GameEvents.GameOver += _messageHandler;
    }

    private void OnDisable()
    {
        if (_messageHandler == null)
        {
            return;
        }

        // 같은 인스턴스이므로 Delegate.Equals가 성립하고, 목록에서 빠진다.
        GameEvents.GameOver -= _messageHandler;
        _messageHandler = null;
    }
}
```

`_messageHandler`를 양쪽에서 쓰므로 **대상과 메서드가 같다.** 지워진다. 람다를
쓰면서 해제까지 하려면 이게 기본형이고, 클리핑의 주석을 "익명 함수는 삭제
불가"로 외우면 이 방법을 찾지 않게 된다.

변수에 담을 수 없는 자리라면 선택지가 둘이다. **해제가 필요 없도록 수명을
맞추거나**(뒤에서 볼 `event`와 짝 해제), 아니면 **람다를 쓰지 않고 메서드로
빼는 것**이다. 파라미터가 필요해서 람다를 쓴 경우라면 대개 후자가 깔끔하다.

## `-=`는 마지막 하나만 뺀다

문서의 첫 문장에 "last occurrence"가 있다. 여러 번 등록된 경우 어느 것을
빼는지까지 적어둔다.

> If the invocation list of `value` occurs **more than once** in the invocation
> list of `source`, **the last occurrence is removed.**

**한 번에 하나다.** 클리핑의 예제가 그 결과를 보여준다 — `gameOver`를 세 번
등록하고 한 번 빼서 두 번 실행된다. 글도 "3번 등록 후, 1번 제거하여서 2번
실행되었다"고 정확히 적는다.

그런데 마지막 절의 레시피가 이 사실과 같이 읽히면 조건이 붙는다.

> Action은 중복된 함수도 등록할 수 있다. 따라서 등록 전에 한 번 빼고 등록하면
> **간단히 중복을 방지**할 수 있다.

```csharp
gameOverEvent -= gameOver;
gameOverEvent += gameOver;
```

**이 패턴은 "등록 수를 1로 만드는 것"이 아니라 "등록 수를 유지하는 것"이다.**
`-=`가 하나만 빼고 `+=`가 하나를 더하니 합이 그대로다.

| 직전 상태 | `-=` 후 | `+=` 후 |
| --- | --- | --- |
| 0개 | 0개 (못 찾으면 원본 반환) | **1개** |
| 1개 | 0개 | **1개** |
| 3개 | 2개 | **3개** |

0개와 1개에서는 의도대로 1개가 된다. 이미 셋이면 셋으로 남는다. 즉 **모든
등록이 이 패턴을 통과할 때만** 중복이 안 쌓인다. 어딘가 한 군데라도 맨
`+=`로 등록하는 경로가 있으면 그 중복은 이 코드로 정리되지 않는다.

진짜로 하나만 보장해야 하면 등록 여부를 따로 들고 있어야 한다.

```csharp
using System;

public static class GameEvents
{
    private static Action _gameOver;

    public static event Action GameOver
    {
        add
        {
            // 이미 있으면 더하지 않는다. 등록 수가 1을 넘지 않는다.
            if (_gameOver != null && Array.IndexOf(_gameOver.GetInvocationList(), value) >= 0)
            {
                return;
            }

            _gameOver += value;
        }
        remove
        {
            _gameOver -= value;
        }
    }

    public static void RaiseGameOver()
    {
        _gameOver?.Invoke();
    }
}
```

`add`/`remove` 접근자를 직접 쓰면 등록 시점에 검사를 끼울 수 있다.
`GetInvocationList()`로 목록을 받아 같은 델리게이트가 있는지 보는 식이다.
**다만 등록이 O(n)이 된다.** 구독자가 수십 개를 넘으면 맨 `+=` 쪽이 맞고,
중복은 호출하는 쪽의 규율로 막는 편이 낫다.

## void만 된다는 규칙이 람다에서 풀린다

클리핑이 절 하나를 들여 강조하는 규칙이다.

> Action에는 return 타입이 없는(void) 함수만 등록 가능하다.

메서드 이름을 그대로 넣는 경우에는 맞다. `Action` 문서도 그렇게 적는다.

> The encapsulated method must correspond to the method signature defined by
> this delegate. This means the encapsulated method must have **no parameters
> and no return value.**

그런데 같은 문단이 괄호로 한 줄을 더 붙인다.

> (In C#, the method must return `void`. … **It can also be a method that
> returns a value that is ignored.**)

**반환값을 무시하는 메서드도 된다**는 것이다. C# 표준의 익명 함수 변환 규칙이
그 조건을 정확히 적어둔다.

> If the body of `F` is an expression, and either `D` has a void return type …
> then … the body of `F` is a valid expression … that would be permitted as a
> ***statement_expression***.

메서드 호출은 반환 타입과 무관하게 statement expression이다. 그래서 식 본문
람다 안에 넣으면 **반환값이 있는 메서드도 `Action`에 들어간다.**

```csharp
private bool TrySpendCoins(int amount)
{
    return true;
}

private void Start()
{
    // 이름을 그대로 넣으면 컴파일되지 않는다. 반환 타입이 맞지 않는다.
    // GameEvents.GameOver += TrySpendCoins;

    // 람다로 감싸면 컴파일된다. bool이 조용히 버려진다.
    GameEvents.GameOver += () => TrySpendCoins(10);
}
```

클리핑은 **파라미터를 넘기려고** 람다를 도입한다. 그 람다가 같은 문으로
**반환값 검사도 건너뛰게 한다.** `TrySpendCoins`가 `false`를 돌려줘도 아무도
보지 않는다.

성공·실패를 돌려주는 메서드를 이벤트에 꽂을 때 생기는 전형적인 사고다.
돌려받을 값이 있으면 `Action`이 아니라 `Func<T>`이고, 이벤트에서 결과를 받을
수 없으면 **그 메서드를 이벤트 핸들러로 쓰는 설계 자체를 다시 봐야 한다.**
`Action` 문서도 그 갈림길을 적어둔다.

> To reference a method that has no parameters and returns a value, use the
> generic `Func<TResult>` delegate instead.

## 등록된 게 없으면 호출이 터진다

클리핑의 호출부다.

```csharp
void OnMouseDown()
{
    gameOverEvent();
    stringEvent("Action<string>!!");
}
```

예제 안에서는 돈다. `Start`에서 같은 스크립트가 자기 메서드를 등록해두기
때문이다. **등록이 하나도 없으면 두 줄 다 `NullReferenceException`이다.**
델리게이트 필드의 기본값이 `null`이고, 빈 호출 목록 같은 것은 없다.

그리고 등록이 있었다가 없어지는 경로도 있다. 앞에서 본 `Delegate.Remove`의
마지막 문장이다.

> Returns a **null reference** if the invocation list of `value` is equal to the
> invocation list of `source`

**마지막 하나를 빼면 다시 `null`이 된다.** 0개로 줄어든 델리게이트는 "비어
있는 상태"가 아니라 `null`이다. 그래서 구독자가 다 떠난 뒤의 호출이 같은
예외로 떨어진다.

Microsoft 문서가 `event` 설명에서 권하는 호출 형태가 바로 이것이다.

> ```csharp
> // Raise the event in a thread-safe manner using the ?. operator.
> SampleEvent?.Invoke(this, new SampleEventArgs("Hello"));
> ```

`?.Invoke()`다. 주석이 이유까지 적어둔다 — null 검사와 호출 사이에 구독자가
빠져나가는 경우까지 막는다.

여기서 한 가지를 구분해둘 값이 있다. **이 블로그에서 `?.`를 쓰지 말라고 한
적이 있다.** [Fake Null을 다룬 글](/posts/unity-fake-null/)에서 Unity 오브젝트는
파괴된 뒤에도 관리 측 참조가 남아서 `?.`가 그 상태를 걸러내지 못한다고 봤다.

| 대상 | `?.` |
| --- | --- |
| `MonoBehaviour`, `GameObject` 등 `UnityEngine.Object` | **쓰지 않는다.** 파괴됐어도 `?.`를 통과한다 |
| `Action`, `event`, 일반 C# 객체 | **쓴다.** Microsoft 문서가 권하는 형태다 |

**규칙이 타입에 달려 있다.** 델리게이트는 Unity의 가짜 null 규칙을 타지 않는
평범한 C# 객체라, `== null`을 손으로 쓸 이유가 없다.

## `event`가 막는 건 호출만이 아니다

클리핑의 `event` 절은 정확하다.

> 하지만 event 키워드를 추가하면 외부에서 접근이 불가능하다. … 아래와 같이
> 등록은 가능하지만 실행은 오직 ActionCube에서만 가능하다.

C# 문서도 같은 선을 긋는다.

> Events are multicast delegates that you can **only invoke from within the
> class** (or derived classes) or struct where you declare them (the publisher
> class).

> Event users can **add or remove** their event handlers on an event.

외부에서 할 수 있는 건 `+=`와 `-=` 둘뿐이다. 그런데 **막히는 것이 호출
하나가 아니다.** `public Action`이었을 때 외부에서 할 수 있던 일을 세어보면
이렇다.

| 외부에서 하는 일 | `public Action` | `public event Action` |
| --- | --- | --- |
| `+=` 등록 | 가능 | 가능 |
| `-=` 해제 | 가능 | 가능 |
| 호출 | **가능** | 불가 |
| `= null` 대입 | **가능** | 불가 |
| 다른 델리게이트로 덮어쓰기 | **가능** | 불가 |

**네 번째 줄이 조용한 쪽이다.** `ac.gameOverEvent = null;` 한 줄로 등록된
구독자 전부가 사라진다. 호출은 안 하고 대입만 하는 코드라면 에러도 로그도
없이 이벤트가 죽는다. 클리핑이 든 "컴파일 에러"는 호출 쪽 이야기인데,
`event`를 붙이면 이 대입도 같이 막힌다.

그래서 공개 델리게이트는 거의 항상 `event`를 붙이는 쪽이 맞다. 붙이지 않을
이유는 **내가 `= null`로 전부 비울 필요가 있을 때**뿐이고, 그건 보통 설계가
잘못된 신호다.

## 구독에는 해제가 있어야 한다

클리핑의 두 번째 스크립트다.

```csharp
public class ActionSphere : MonoBehaviour
{
    public ActionCube ac;

    void Start()
    {
        ac.gameOverEvent += gameOverSphere;
    }
}
```

**등록만 있고 해제가 없다.** 예제로는 충분하지만, 여기엔 한 방향이 숨어
있다. 등록하는 순간 **큐브가 스피어를 참조하게 된다.** 스피어가 큐브를
참조하는 게 아니다.

그래서 스피어가 파괴되어도 큐브의 호출 목록에는 그 항목이 남는다. 목록의
항목은 대상 객체를 붙들고 있으므로 **관리 측 객체가 회수되지 않고**, 다음
호출에서 파괴된 컴포넌트의 메서드가 실행된다. 그 안에서 Unity 쪽을 건드리면
거기서 터진다 — 앞 절의 가짜 null과 같은 뿌리다.

[InputAction을 직접 구독한 글](/posts/input-action-subscribe/)에서 등록과 해제를
짝으로 두는 이유를 다뤘다. 거기는 **자기가 자기 액션을 구독**하는 경우였고,
여기는 **남의 델리게이트에 내 메서드를 넣는** 경우다. 후자가 더 위험하다.
수명을 쥐고 있는 쪽이 내가 아니기 때문이다.

짝을 맞추는 자리는 `OnEnable`/`OnDisable`이다.

```csharp
using UnityEngine;

public class ActionSphere : MonoBehaviour
{
    [Header("Publisher")]
    [SerializeField, Tooltip("이벤트를 가진 큐브")]
    private ActionCube _cube;

    private void OnEnable()
    {
        // Unity 오브젝트이므로 ?. 대신 == null로 본다.
        if (_cube == null)
        {
            return;
        }

        _cube.GameOver += OnGameOver;
    }

    private void OnDisable()
    {
        if (_cube == null)
        {
            return;
        }

        // 등록한 곳과 같은 수의 해제를 둔다.
        _cube.GameOver -= OnGameOver;
    }

    private void OnGameOver()
    {
        Debug.Log("GameOverSphere!!", this);
    }
}
```

`Start`/`OnDestroy`가 아니라 `OnEnable`/`OnDisable`을 쓴 이유가 있다. 문서가
`Start`의 횟수를 못 박는다.

> Start is called **exactly once in the lifetime of the script** and always
> after MonoBehaviour.Awake.

`OnEnable` 쪽은 다르다.

> When **activating the GameObject** (or one of its inactive parent GameObjects)
> at runtime, if the script component is already enabled.

**`Start`는 생애 한 번, `OnEnable`은 활성될 때마다다.** 오브젝트 풀은 파괴하지
않고 비활성화만 하므로, `Start`에서 등록하고 `OnDestroy`에서만 해제하면 **풀에
들어가 있는 동안에도 구독이 살아 있다.** 델리게이트 호출은 `activeInHierarchy`나
`enabled`를 보지 않는다. 그래서 풀에서 쉬고 있는 적의 핸들러가 그대로 실행된다.
[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 본 **"비활성화는
파괴가 아니다"**가 여기서도 같은 모양으로 나온다.

## 어디에 왜 쓰나

### 전역 이벤트 허브 하나

클리핑처럼 **다른 오브젝트를 인스펙터로 물려주는 방식**은 두 가지가 걸린다.
참조가 끊기면 조용히 아무 일도 안 하고, 씬이 커지면 누가 누구를 참조하는지
추적이 안 된다. 발행자를 한 군데로 모으면 둘 다 사라진다.

```csharp
using System;

/// 게임 전역 이벤트. 발행은 이 클래스만 한다.
public static class GameEvents
{
    // event를 붙여 외부의 호출과 대입을 막는다.
    public static event Action GameOver;
    public static event Action<string> GameOverMessage;
    public static event Action<int> ScoreChanged;

    public static void RaiseGameOver()
    {
        // 구독자가 없으면 null이다. ?.Invoke()로 호출한다.
        GameOver?.Invoke();
    }

    public static void RaiseGameOverMessage(string message)
    {
        GameOverMessage?.Invoke(message);
    }

    public static void RaiseScoreChanged(int score)
    {
        ScoreChanged?.Invoke(score);
    }
}
```

`static event`에는 함정이 하나 붙는다. **씬을 넘어가도 목록이 비워지지
않는다.** 해제를 빠뜨리면 다음 씬까지 구독이 따라가고, 거기서 파괴된 객체의
메서드가 호출된다. 그래서 전역 허브를 쓰는 쪽은 `OnEnable`/`OnDisable` 짝을
더 엄격하게 지켜야 한다.

구독하는 쪽은 이렇게 된다. 클리핑의 큐브·스피어 예제를 같은 모양으로 옮긴
것이다.

```csharp
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class ActionCube : MonoBehaviour
{
    private const int GAME_OVER_SCORE = 100;

    [Header("Message")]
    [SerializeField, Tooltip("클릭 시 보낼 메시지")]
    private string _message = "Action<string>!!";

    private void OnEnable()
    {
        GameEvents.GameOver += OnGameOver;
        GameEvents.GameOverMessage += OnGameOverMessage;
    }

    private void OnDisable()
    {
        GameEvents.GameOver -= OnGameOver;
        GameEvents.GameOverMessage -= OnGameOverMessage;
    }

    // OnMouseDown은 Collider가 있어야 호출된다. RequireComponent로 묶어뒀다.
    private void OnMouseDown()
    {
        GameEvents.RaiseGameOver();
        GameEvents.RaiseGameOverMessage(_message);
        GameEvents.RaiseScoreChanged(GAME_OVER_SCORE);
    }

    private void OnGameOver()
    {
        Debug.Log("Cube Game Over", this);
    }

    // 람다로 감싸지 않는다. 파라미터가 맞는 Action<string>을 쓰면 메서드로 들어간다.
    private void OnGameOverMessage(string message)
    {
        Debug.Log($"Game Over : {message}", this);
    }
}
```

클리핑이 `stringEvent += (str) => gameOverMessage(str);`로 쓴 자리를 메서드
이름으로 바꿨다. **파라미터 개수와 타입이 맞으면 람다가 필요 없고**, 람다를
빼면 해제가 그냥 된다. 이 글의 첫 절이 가리킨 문제가 여기서 사라진다.

### 원문 코드에서 고친 것

| 원문 | 고친 것 | 이유 |
| --- | --- | --- |
| `public Action gameOverEvent;` | `public static event Action GameOver;` | 외부의 호출과 `= null` 대입을 막는다 |
| `void gameOver()` | `private void OnGameOver()` | 컨벤션. 메서드는 PascalCase, 접근 수식어 명시 |
| `gameOverEvent();` | `GameOver?.Invoke();` | 구독자가 없으면 `null`이다 |
| `stringEvent += (str) => gameOverMessage(str);` | `GameOverMessage += OnGameOverMessage;` | 시그니처가 맞으므로 람다가 불필요하고, 해제가 가능해진다 |
| `Start`에서만 등록 | `OnEnable`/`OnDisable` 짝 | 풀링과 씬 전환에서 중복·누수를 막는다 |
| `public ActionCube ac;` | `[SerializeField] private ActionCube _cube;` | 컨벤션. 공개 필드 대신 직렬화 필드 |

`gameOverEvent += gameOver;`를 세 번 적은 예제는 **동작을 보여주려고 일부러
쓴 것**이라 고칠 대상이 아니다. 실무 코드에서 같은 모양이 나왔다면 그건 풀링이나
씬 전환으로 등록이 누적된 결과일 가능성이 높다.

### 쓰지 말아야 할 자리

- **「익명 함수는 삭제 불가」로 외우는 것.** 변수에 담으면 지워진다. 못 지우는
  건 같은 인스턴스가 아니어서다.
- **`-=` 한 번으로 중복을 정리하려는 것.** 마지막 하나만 빠진다. 모든 등록이
  같은 경로를 지나야 1개가 유지된다.
- **반환값이 있는 메서드를 람다로 감싸 이벤트에 넣는 것.** 컴파일은 되고 값은
  버려진다. 결과가 필요하면 `Func<T>`이거나, 이벤트가 아닐 자리다.
- **`Action`을 `?.` 없이 호출하는 것.** 구독자가 없거나 다 빠지면 `null`이다.
- **델리게이트에 `== null`을 손으로 쓰는 것.** Unity 오브젝트가 아니므로 `?.`가
  정상 동작한다. 반대로 Unity 오브젝트에는 `?.`를 쓰지 않는다.
- **`public Action`을 그대로 공개하는 것.** `= null` 한 줄로 전부 날아간다.
  `event`를 붙인다.
- **`Start`에서 등록하고 `OnDestroy`에서만 해제하는 것.** 풀링은 파괴하지 않고
  비활성화한다. `OnEnable`/`OnDisable`이 짝이다.

## 정리

- **익명 함수를 못 지우는 건 익명이라서가 아니다.** `Delegate.Equals`가
  「같은 객체의 같은 메서드」를 보고, 따로 적은 두 람다는 서로 다른 메서드로
  컴파일된다. **변수에 담아두면 지워진다.**
- **`-=`는 마지막 하나만 뺀다.** 문서가 "the last occurrence is removed"라고
  적는다. 그래서 「빼고 다시 넣기」는 중복을 없애는 게 아니라 **개수를
  유지한다.** 0개와 1개에서만 의도대로 동작한다.
- **「void만 등록 가능」은 이름을 그대로 넣을 때의 규칙이다.** C# 표준이
  식 본문 람다를 statement expression 조건으로 허용하므로, 람다로 감싸면
  반환값 있는 메서드도 들어가고 그 값은 버려진다.
- **구독자가 없으면 `null`이다.** 마지막 하나를 빼면 다시 `null`이 되고,
  Microsoft 문서가 권하는 호출 형태는 `?.Invoke()`다.
- **`?.` 규칙이 타입에 달려 있다.** Unity 오브젝트에는 쓰지 않고, 델리게이트에는
  쓴다. 두 규칙이 반대 방향이다.
- **`event`가 막는 건 호출만이 아니다.** `= null` 대입도 막는다. 그쪽이 더
  조용히 망가지는 경로다.
- **등록하면 발행자가 구독자를 참조한다.** 방향이 반대라서, 해제를 빠뜨리면
  파괴된 객체가 호출 목록에 남는다. 짝은 `OnEnable`/`OnDisable`이다.

---

### 참고

- [Action 델리게이트 — .NET API 레퍼런스](https://learn.microsoft.com/en-us/dotnet/api/system.action)
- [Delegate.Remove — .NET API 레퍼런스](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.remove) ·
  [Delegate.Equals](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.equals)
- [event 키워드 — C# 레퍼런스](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/event)
- [람다 식 — C# 레퍼런스](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions)
- [익명 함수 변환 — C# 표준 §10.7.1](https://github.com/dotnet/csharpstandard/blob/draft-v8/standard/conversions.md)
- [Delegate.GetInvocationList — .NET API 레퍼런스](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.getinvocationlist)
- [MonoBehaviour.Start — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.Start.html) ·
  [MonoBehaviour.OnEnable](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnEnable.html) ·
  [MonoBehaviour.OnMouseDown](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnMouseDown.html)

이 글의 출발점이 된 자료는
[피로물든딸기 — 유니티 - Action으로 이벤트 등록하기](https://bloodstrawberry.tistory.com/890)
(2022-07-29)이다. 예제의 동작 설명을 .NET API 레퍼런스와 C# 표준에 대조하고,
삭제·중복·null 처리에서 이유가 가려진 자리를 다시 적었다. 입력 쪽 구독의 수명은
[InputAction을 직접 구독한 글](/posts/input-action-subscribe/)에,
생성 클래스의 콜백 등록은
[Generate C# Class를 다룬 글](/posts/input-generated-class/)에 있다. 이벤트로
어셈블리 경계를 넘는 이야기는
[어셈블리 정의 파일을 다룬 글](/posts/assembly-definition-files/)에 있다.
