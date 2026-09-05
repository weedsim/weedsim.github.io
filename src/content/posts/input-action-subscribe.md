---
pubDatetime: 2026-09-05T17:00:00+09:00
title: "InputAction을 직접 구독하기: 델리게이트로 다루는 입력의 수명"
lang: ko
translationKey: input-action-subscribe
featured: false
draft: false
tags:
  - Unity
  - Input System
  - 입력
  - C#
description: "PlayerInput의 Behavior 대신 InputAction을 코드에서 직접 구독하는 방식을 정리했다. 등록과 해제를 짝으로 두는 이유, 액션을 누가 활성화하는가, 그리고 문자열로 액션을 찾는 것의 비용까지."
---

Input System을 쓰면서 `InputAction`을 코드에서 직접 구독하는 방식을 정리한
[글](https://22joon.tistory.com/27)을 스크랩해뒀었다. 연습용 프로젝트에서
실제로 쓰고 있는 코드를 통째로 붙여둔 글이라, 문서보다 이쪽이 감이 빨리 온다.

앞서 [PlayerInput 컴포넌트](/posts/unity-playerinput/)를 정리하면서 인스펙터의
`Behavior` 값이 작성할 메서드 시그니처를 바꾼다는 이야기를 했는데, 이 글은 그
네 가지 중 어느 것도 쓰지 않는 쪽이다. **`PlayerInput`은 액션 에셋과 디바이스
관리용으로만 두고, 처리는 C# 이벤트로 직접 한다.** 실무에서 흔한 조합이고,
그래서 따로 정리할 값이 있다.

## 목차

## 이 방식이 무엇인가

핵심은 두 줄이다.

```csharp
public PlayerInput input;
private InputAction _normalMoveAction;

private void Awake()
{
    this._normalMoveAction = this.input.actions["Move"];
}
```

`PlayerInput`이 들고 있는 `InputActionAsset`에서 이름으로 `InputAction`을 꺼내
필드에 캐싱한다. 그 뒤로는 `PlayerInput`을 거치지 않고 이 액션에 직접 붙는다.

```csharp
private void OnEnable()
{
    this._normalMoveAction.performed += this.OnMove;
    this._normalMoveAction.canceled += this.StopMove;
}

private void OnDisable()
{
    this._normalMoveAction.performed -= this.OnMove;
    this._normalMoveAction.canceled -= this.StopMove;
}
```

`Behavior`를 `Invoke C# Events`로 두면 `onActionTriggered` 하나로 모든 액션이
들어와서 안에서 분기해야 하는데, 이 방식은 **액션별로 따로 붙일 수 있다.**
`Send Messages`처럼 메서드 이름이 문자열로 매칭되는 것도 아니다. 대신
액션을 꺼낼 때 문자열을 한 번 쓰는데, 그 이야기는 아래에서 따로 하겠다.

## 등록과 해제를 짝으로

원문이 코드 뒤에 붙인 한 줄이 이 글에서 제일 중요한 부분이다.

> 결국 InputAction또한 Delegate 기반이니, Scene 전환 등의 이유로 오브젝트가
> 파괴될 때, Delegate 등록을 반드시 해제하게 만드는 것이 좋다.

맞는 말이고, 코드도 그렇게 되어 있다. 왜 중요한지 조금 더 풀면 이렇다.

`InputAction`은 **오브젝트보다 오래 산다.** 액션 에셋은 씬에 속하지 않으므로,
씬을 바꿔서 `PlayerController`가 파괴돼도 액션 객체 자체는 그대로 남는다.
그 액션의 델리게이트에 파괴된 오브젝트의 메서드가 걸려 있으면, 다음 입력에
`MissingReferenceException`이 나거나, 더 나쁘게는 파괴된 오브젝트가 참조를
붙잡고 있어 GC가 안 된다.

그리고 **`OnEnable`/`OnDisable` 쌍을 고른 것도 의도가 맞다.**

- `Awake`/`OnDestroy` 쌍은 오브젝트가 비활성화된 동안에도 구독이 살아 있다.
  UI를 열면서 플레이어를 꺼뒀는데 입력이 계속 들어오는 상황이 여기서 나온다.
- `OnEnable`/`OnDisable`은 활성 상태와 구독 상태가 정확히 같이 간다. 오브젝트
  풀링으로 껐다 켜도 자동으로 맞는다.

캐싱을 `Awake`에서 하고 구독을 `OnEnable`에서 하는 분리도 자연스럽다.
`Awake`는 한 번만 돌고 `OnEnable`은 켜질 때마다 돌기 때문이다.

## 액션을 누가 활성화하는가

이 방식으로 옮기다가 가장 많이 막히는 지점이다. **`InputAction`은 기본적으로
꺼져 있다.** 공식 문서의 표현이다.

> For actions defined elsewhere, such as in an Action Asset not assigned as
> project-wide, or defined your own code, they begin in a disabled state, and
> you must enable them before they will respond to input.

원문 코드에 `Enable()` 호출이 없는데도 동작하는 이유는 **`PlayerInput`이
액션 맵을 켜주기 때문**이다. 즉 `PlayerInput` 컴포넌트를 떼는 순간 같은 코드가
아무 반응도 안 하게 된다. 구독은 멀쩡히 걸려 있는데 액션이 꺼져 있으니
콜백이 안 불리는 것이다.

`PlayerInput` 없이 액션 에셋만 직접 들고 쓴다면 이렇게 켠다.

```csharp
_normalMoveAction.Enable();      // 액션 하나만
// 또는
_gameplayActionMap.Enable();     // 맵 통째로
```

예외가 하나 있다. **프로젝트 전역 액션(project-wide actions)으로 지정한
에셋은 기본으로 켜져 있다.**

> If you have an Action Asset assigned as project-wide, the actions it contain
> are enabled by default and ready to use.

정리하면 "액션이 켜져 있는가"의 책임자가 셋 중 하나다. `PlayerInput`,
프로젝트 전역 액션 설정, 아니면 내 코드. **입력이 안 먹으면 구독보다 이쪽을
먼저 의심하는 게 빠르다.**

## started / performed / canceled를 언제 쓰나

원문은 Interaction 때문에 헤맸다고 적고 참고 링크를 걸어뒀다. 이 부분을
정리해두면 위 코드가 왜 `performed`와 `canceled` 두 개만 쓰는지도 설명된다.

액션에는 세 콜백이 있다.

```csharp
action.started   += ctx => { };  // 액션이 시작됨
action.performed += ctx => { };  // 액션이 수행됨
action.canceled  += ctx => { };  // 액션이 취소됨
```

언제 불리는지는 **Action Type**에 따라 다르다.

- **Value** — 바인딩된 컨트롤을 계속 감시하고 **값이 바뀔 때마다** 콜백을
  발생시킨다. 활성화 시점에 초기 상태 검사를 해서, 이미 눌려 있는 컨트롤이
  있으면 그때도 콜백이 뜬다.
- **Button** — Value와 비슷하지만 `ButtonControl`에만 바인딩된다. 그리고
  **초기 상태 검사를 하지 않는다.** 이전부터 눌려 있던 버튼 때문에 액션이
  발동되는 걸 막기 위해서다.
- **Pass Through** — 충돌 해소(conflict resolution) 과정을 건너뛰고, 바인딩된
  아무 컨트롤의 변화에나 콜백을 낸다.

WASD를 Vector2 컴포지트로 묶은 Move 액션은 보통 **Value**다. 그래서 키를
누르고 있는 동안 값이 바뀔 때마다 `performed`가 오고, 손을 다 떼서 값이
기본값으로 돌아가면 `canceled`가 온다. **원문 코드가 `performed`에서 방향을
받고 `canceled`에서 0으로 되돌리는 건 이 성질에 정확히 맞는 구조다.**

`canceled`가 헷갈리는 이유도 여기 있다. 버튼처럼 "뗐다"는 뜻이 아니라
**"액션이 기본 상태로 돌아갔다"**는 뜻이고, 그게 Action Type에 따라 다르게
해석된다.

## 문자열로 액션을 찾는 것의 비용

```csharp
this._normalMoveAction = this.input.actions["Move"];
```

간단하고 잘 동작하지만, 이 줄에는 **컴파일 타임 검증이 없다.** 액션 이름을
`Move`에서 `Movement`로 바꾸거나 오타를 내면 컴파일은 통과하고 런타임에
터진다. 앞선 PlayerInput 글에서 `Send Messages`가 메서드를 이름으로 찾아
조용히 실패한다고 적었는데, 결이 같은 문제다.

Input System은 이 문제에 대한 답을 갖고 있다. 액션 에셋 인스펙터의
**Generate C# Class**를 켜면 래퍼 클래스를 만들어준다. 문서의 표현이다.

> allow you to refer to your actions in a type-safe manner from code. This
> means you can avoid looking up your actions by string.

쓰는 모양은 이렇다.

```csharp
private MyPlayerControls _controls;

private void Awake()
{
    _controls = new MyPlayerControls();
}

private void OnEnable()
{
    _controls.gameplay.Enable();
    _controls.gameplay.SetCallbacks(this);   // 인터페이스로 한 번에
}
```

액션 이름이 프로퍼티가 되므로 이름을 바꾸면 컴파일 에러가 난다. 그리고
`Enable()`도 여기서 명시적으로 부르게 되니, 앞 절의 "누가 켜주는가" 문제도
같이 사라진다. **액션이 몇 개 넘어가는 프로젝트라면 이쪽으로 가는 게 맞다.**

## 값을 매 프레임 쓸 거라면 구독이 필요 없을 수도

원문 코드는 콜백에서 `moveVec`에 저장해두고 `Update`의 `MovePlayer()`에서
쓴다. 이동처럼 매 프레임 필요한 값에는 맞는 패턴이다.

다만 그 목적이라면 더 짧은 길도 있다. 문서가 콜백의 대안으로 폴링을 든다.

```csharp
private void Update()
{
    Vector2 moveValue = _normalMoveAction.ReadValue<Vector2>();
    // ...
}
```

이러면 `performed`/`canceled` 구독과 해제가 통째로 없어지고, 값이 0으로
돌아가는 처리도 알아서 된다. 반대로 점프나 발사처럼 **순간에 반응해야 하는
액션**은 폴링으로 만들면 프레임을 놓칠 수 있으니 콜백이 맞다.

정리하면 이렇게 갈린다.

- **연속적인 값**(이동, 시점) → `Update`에서 `ReadValue`
- **순간적인 사건**(점프, 발사, 상호작용) → `started`/`performed` 구독

원문처럼 콜백으로 받아 저장했다가 `Update`에서 쓰는 방식도 물론 유효하다.
같은 프레임 안에서 값이 여러 번 바뀌는 것까지 잡고 싶을 때는 오히려 이쪽이다.

## 예제 코드에서 눈에 띄는 것

원문이 실제 프로젝트 코드를 그대로 붙인 덕에 볼 게 몇 개 더 있다.

**싱글턴 검사 순서.** `Awake`가 이런 순서다.

```csharp
private void Awake()
{
    this._normalMoveAction = this.input.actions["Move"];
    Init();
    if (Inst != null && Inst != this)
    {
        Destroy(gameObject);
        return;
    }
    Inst = this;
}
```

중복 인스턴스도 액션을 캐싱하고 `Init()`까지 돌린 뒤에 파괴된다. `Destroy`는
프레임 끝에 처리되므로 그 사이 `OnEnable`이 돌아 구독까지 걸린다. 파괴될 때
`OnDisable`이 돌아 해제되니 결과적으로는 맞아떨어지지만, **중복 검사를 맨
앞에 두면 애초에 이 경로가 안 생긴다.**

**`MovePlayer()`의 이 줄**은 그대로는 컴파일되지 않는다.

```csharp
this.sprite.transform.position += moveSpeedMultiplier * Time.deltaTime;
```

`Vector3`에 `float`을 더하고 있고, 정작 콜백에서 받아둔 `moveVec`과
`moveSpeed`가 안 쓰인다. 옮기는 과정에서 일부가 빠진 것으로 보인다. 코드 블록
자체도 클래스 닫는 중괄호 없이 끝난다. **참고할 때는 구조를 보고, 그대로
복사하지는 않는 게 맞다.**

## 1.0에서 지금까지

원문이 건 공식 문서 링크는 Input System **1.0.2** 기준이다. 현재 최신은
**1.16.0**이고, 그 사이 이 글의 방식에 영향을 주는 변화가 하나 있다.

**프로젝트 전역 액션**이 생겼다. 에셋 하나를 프로젝트 전역으로 지정해두면
참조를 들고 다닐 필요 없이 API로 바로 접근하고, 기본으로 켜져 있다.

```csharp
InputSystem.actions.FindAction("Move");
```

즉 지금 같은 코드를 새로 쓴다면 선택지가 셋이다.

- **`PlayerInput.actions["Move"]`** — 원문의 방식. 로컬 멀티플레이어나 디바이스
  페어링이 필요하면 여전히 이쪽이다.
- **생성 C# 클래스** — 액션이 많고 타입 안전이 중요하면.
- **프로젝트 전역 액션** — 플레이어가 하나뿐인 프로젝트의 기본 워크플로.

## 정리

- `PlayerInput`의 `Behavior`를 쓰지 않고 `actions["이름"]`으로 `InputAction`을
  꺼내 C# 이벤트로 직접 구독하는 방식이다. 액션별로 따로 붙일 수 있는 게 장점.
- **등록과 해제를 짝으로 두는 것**이 이 방식의 핵심이다. 액션은 오브젝트보다
  오래 살기 때문이다. `OnEnable`/`OnDisable` 쌍이 활성 상태와 구독 상태를
  일치시켜 준다.
- **액션은 기본적으로 꺼져 있다.** 원문 코드가 `Enable()` 없이 도는 건
  `PlayerInput`이 켜주기 때문이고, 컴포넌트를 떼면 조용히 멈춘다. 프로젝트
  전역 액션은 예외로 기본 활성이다.
- `started`/`performed`/`canceled`가 언제 오는지는 **Action Type**이 결정한다.
  Value는 초기 상태 검사를 하고, Button은 하지 않는다. Move가 Value이므로
  `performed`+`canceled` 조합이 맞다.
- `actions["Move"]`는 컴파일 타임 검증이 없다. **Generate C# Class**로
  타입 안전하게 갈 수 있고, 그러면 `Enable()`도 명시적이 된다.
- 연속적인 값은 `Update`에서 `ReadValue`, 순간적인 사건은 콜백. 목적에 따라
  구독 자체가 필요 없을 수 있다.

## 참고

- [Responding to actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/RespondingToActions.html)
- [Actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/Actions.html)
- [Input Action Assets — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ActionAssets.html)
- [Project-wide actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ProjectWideActions.html)
- 원문: [Input System](https://22joon.tistory.com/27)
