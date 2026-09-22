---
pubDatetime: 2026-09-22T17:00:00+09:00
title: "Generate C# Class의 본체는 SetCallbacks다"
lang: ko
translationKey: input-generated-class
featured: false
draft: false
tags:
  - Unity
  - Input System
  - 입력
  - C#
description: "Input System을 설치부터 세 가지 제어 방식까지 훑는 2024년 글을 현행 문서와 대조했다. 예제 세 개에 전부 들어 있는 죽은 조건문이 하나 있고, 생성된 클래스는 정작 그걸 쓸 이유가 되는 기능을 안 쓰고 있다."
---

Input System을 자세히 들여다보던 중에 스크랩한 글이다. 특히 **Generate C#
Class**가 정확히 무엇을 해주는 기능인지를 중점적으로 보고 있었다. 설치부터
Input Action 에셋 설정, 세 가지 제어 방식까지 한 번에 훑는 글이라 전체 그림을
잡기에 좋았다.

그래서 이 글은 **처음부터 끝까지 다시 밟는다.** 다른 글에서 이미 다룬 내용도
링크로 넘기지 않고 예제 코드까지 그대로 다시 싣는다. 그 위에 원문과 현행
문서를 대조하면서 확인한 것들을 얹는다.

확인한 것은 세 가지다. **예제 세 개에 공통으로 들어 있는 죽은 조건문**,
**"Invoke C# Events"라고 이름 붙었지만 실제로는 그 기능이 아닌 예제**, 그리고
**생성된 클래스가 정작 자기 존재 이유를 안 쓰고 있는 것**.

## 목차

## 왜 Input System인가

기존 `Input` 클래스는 **폴링(polling)** 이다. 매 프레임 `Update`에서 지금 상태가
어떤지 물어봐야 한다.

```csharp
public float speed = 5f;

void Update()
{
    float horizontal = Input.GetAxis("Horizontal");
    float vertical = Input.GetAxis("Vertical");

    Vector3 movement = new Vector3(horizontal, 0, vertical);
    transform.Translate(movement * speed * Time.deltaTime);
}
```

입력이 없는 프레임에도 계속 물어본다. 그리고 `"Horizontal"`이라는 **문자열이
곧 바인딩**이라서, 키를 바꾸려면 Input Manager 설정을 바꾸거나 직접 스크립트를
짜야 한다.

Input System은 **액션(Action)** 을 가운데에 둔다. "W를 눌렀다"가 아니라
"Move가 발생했다"로 받고, 어떤 장치의 어떤 키가 Move에 묶이는지는 에셋 쪽에서
따로 정한다. 그래서 런타임에 바인딩을 바꾸는 것이 가능해진다.

| | Legacy Input Manager | Input System |
|---|---|---|
| 처리 방식 | 폴링 | 이벤트, 액션 중심 |
| 장치 지원 | 키보드·마우스·기본 게임패드 | 확장 가능한 장치 계층 |
| 런타임 바인딩 변경 | 사실상 불가 | 가능 |
| 멀티 디바이스 | 미지원 | 지원 |

## 설치와 Active Input Handling

Package Manager에서 **Input System**을 설치한다. 설치 직후 백엔드를 바꿀지
묻는 창이 뜨고, 문서는 이 과정을 이렇게 적는다.

> **이 과정에서 에디터가 재시작된다.**

설정 자체는 **Edit > Project Settings > Player > Other Settings > Active Input
Handling**에 있고, 셋 중 하나를 고른다.

- **Input Manager (Old)** — 기존 `Input` 클래스만 쓴다.
- **Input System Package (New)** — 새 시스템만 쓴다.
- **Both** — 둘 다 쓴다.

문서는 둘을 같이 켜는 것을 명시적으로 허용한다.

> 옛 시스템과 새 시스템을 **동시에** 켤 수 있다. 그러려면 **Active Input
> Handling**을 **Both**로 설정한다.

> 이 설정을 바꾸면 **적용을 위해 에디터를 재시작해야 한다.**

기존 프로젝트에 붙이는 중이라면 Both로 두고 옮겨가는 편이 안전하다. `Input`을
쓰는 코드가 한 줄이라도 남아 있는 상태에서 New로 바꾸면 그 줄이 런타임
예외가 된다.

## Input Action 에셋의 구조

**Project 창 → + → Input Actions**로 에셋을 만든다. 원문은 이름을
`PlayerInputSystem`으로 바꿨고, 이 글도 그 이름을 그대로 쓴다. 더블클릭하면
편집 창이 뜬다.

구조는 세 층이다.

- **Control Scheme** — 장치를 묶은 논리 단위. `PC`(키보드+마우스),
  `Gamepad` 같은 식.
- **Action Map** — 액션들의 묶음. `PlayerMaps`, `UI`처럼 **상황별로** 나눈다.
  맵 단위로 켜고 끌 수 있다는 게 핵심이다.
- **Action** — `Move`, `Jump` 같은 개별 입력. 그 아래 **Binding**으로 실제
  키가 붙는다.

원문의 설정은 이렇다. Control Scheme `PC`에 Keyboard와 Mouse를 추가하고,
Action Map을 `PlayerMaps`로 만들고, Action 이름을 `Move`로 바꾼 뒤 기본
`<No Binding>`을 지우고 **Add Up\Down\Left\Right Composite**로 WASD를 묶는다.

### Action Type 세 가지

Action Type은 액션이 **어떤 식으로 값을 흘려보낼지**를 정한다. API 문서의
설명이 정확하다.

> **Value** — 연결된 소스에서 값 하나를 읽는 액션. 여러 바인딩이 동시에
> 작동하면 **어느 시점이든 가장 큰 기여를 하는 쪽을 골라내는 중재
> (disambiguation)** 를 수행한다.

> **Button** — 트리거로 동작하는 액션. 버튼 액션에는 `Performed`에 대응하는
> **정해진 트리거 지점**이 있다. 수행된 뒤에는 다시 대기 상태로 돌아가 다음
> 트리거를 기다린다.

> **Pass Through** — 특정한 동작 방식이 없고, **바인딩된 어떤 컨트롤의 어떤
> 값 변화든 그대로 통과**시키는 액션.

실무에서 갈리는 지점은 세 가지다.

| | Value | Button | Pass Through |
|---|---|---|---|
| 중재(disambiguation) | 한다 | 한다 | **안 한다** |
| 활성화 시 초기 상태 검사 | **한다** | 안 한다 | 안 한다 |
| 콜백 | started / performed / canceled | started / performed / canceled | **performed 위주** |
| 쓰는 곳 | 이동, 시점, 트리거 압력 | 점프, 발사 | 장치별 독립 입력, 제스처 |

**초기 상태 검사**가 Value의 특징이다. 액션을 켜는 순간 이미 키가 눌려 있으면,
추가로 움직이지 않아도 곧바로 started/performed가 온다. 이동처럼 "지금 상태"가
중요한 입력에 맞는다. Button은 이 검사를 건너뛴다 — 켜자마자 점프가 나가면
곤란하니까.

이동을 받을 거라서 원문은 Action Type을 **Value**, Control Type을 **Vector2**로
설정한다. 맞는 선택이다.

## 방식 1 — PlayerInput 컴포넌트 + Send Messages

오브젝트에 **PlayerInput** 컴포넌트를 붙이고, Actions에 `PlayerInputSystem`,
Default Scheme에 `PC`, Default Map에 `PlayerMaps`를 연결한다.

그다음 **Behavior**를 고른다. 원문은 "4가지"라고 쓰고 세 개만 나열하는데,
문서상 실제로 넷이다.

- **Send Messages** — "`PlayerInput` 컴포넌트가 붙어 있는 `GameObject`에 대해
  `GameObject.SendMessage`를 사용한다."
- **Broadcast Messages** — "`GameObject.BroadcastMessage`를 사용한다."
  (원문이 빠뜨린 항목이다. 자식 오브젝트까지 내려간다.)
- **Invoke Unity Events** — 메시지 종류마다 별도의 `UnityEvent`를 쓰고,
  인스펙터의 Events 폴드아웃에서 연결한다.
- **Invoke CSharp Events** — 인스펙터가 아니라 `PlayerInput` API로 노출되는
  평범한 C# 이벤트를 쓴다. `onActionTriggered`, `onDeviceLost`,
  `onDeviceRegained`가 여기 해당한다.

Send Messages를 고르면 **액션 이름 앞에 `On`을 붙인 메서드**가 호출된다.
`Move` → `OnMove`. 원문 코드다.

```csharp
//MoveController 내부
//입력 액션 이름이 Move라면, OnMove라는 이름의 메서드가 호출됩니다.
//키가 눌릴 때 새로운 입력값이 생성되고, 키를 뗐을 때 값이 초기화(0, 0)되므로 두 번 호출됩니다
    enum Status
    {
        None,
        Move
    }

    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }

    void OnMove(InputValue value)
    {
        Vector2 input = value.Get<Vector2>();
        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;

            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("OnMove");
        }
    }
```

`SendMessage` 기반이라 **메서드 이름이 곧 계약**이다. 컴파일러는 이 이름이
맞는지 모른다. 액션 이름을 `Move`에서 `Movement`로 바꾸면 `OnMove`는 조용히
안 불린다.

`if (input != null)`이 눈에 걸리는데, 이건 뒤에서 따로 본다.

## 방식 2 — 액션을 직접 참조해서 구독

원문이 "Invoke C# Events" 항목 아래에 붙인 코드다.

```csharp
//MoveController 내부
    enum Status
    {
        None,
        Move
    }

    PlayerInput _playerInput;
    InputAction _moveAction;

    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    private void Awake()
    {
        _playerInput = GetComponent<PlayerInput>();
        _moveAction = _playerInput.actions["Move"];
        _moveAction.performed += OnMoveAction_performed;
    }
    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }
    private void OnMoveAction_performed(InputAction.CallbackContext context)
    {
        Vector2 input = context.ReadValue<Vector2>();

        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;
            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("OnMoveAction_performed");
        }
    }
```

동작하는 코드다. 다만 **이름표가 안 맞는다.** 문서가 말하는 Invoke CSharp
Events는 `PlayerInput`이 노출하는 `onActionTriggered` 같은 이벤트를 쓰는
방식인데, 이 코드는 `_playerInput.actions["Move"]`로 **액션 객체를 직접 꺼내서
그 액션의 `performed`에 붙는다.**

차이가 실제로 있다. 이 코드는 **Behavior 설정과 무관하게 동작한다.**
Behavior가 Send Messages로 되어 있어도 `performed`는 그대로 들어온다. 액션에
직접 붙었기 때문이다. 즉 이 예제는 Behavior의 한 갈래가 아니라 **Behavior를
우회하는 네 번째 길**이다.

여기에 문제도 하나 있다. `Awake`에서 `+=`만 하고 **어디에서도 `-=`하지
않는다.** `PlayerInput.actions`는 컴포넌트가 들고 있는 에셋 인스턴스라서,
구독을 남겨둔 채 컴포넌트가 사라지면 파괴된 객체의 메서드가 델리게이트 목록에
남는다. `OnEnable`/`OnDisable` 쌍으로 옮기는 게 맞다.

> 같이 보기 — 이 방식만 따로 파고든 글이 있다:
> [InputAction을 직접 구독하기](/posts/input-action-subscribe/),
> [PlayerInput의 Behavior 정리](/posts/unity-playerinput/).

## `Vector2`는 null이 될 수 없다

예제 셋에 전부 이 모양이 들어 있다.

```csharp
Vector2 input = value.Get<Vector2>();
if (input != null)
{
    _status = input != Vector2.zero ? Status.Move : Status.None;
    // ...
}
```

`input != null`을 **입력이 들어왔는지 확인하는 방어 코드**처럼 읽게 되는데,
그렇지 않다. `Vector2`는 스크립팅 레퍼런스가 **"struct in UnityEngine"** 이라고
적어둔 값 형식이다. 값 형식 변수는 null을 담을 수 없다.

그런데 이 코드는 컴파일된다. C# 문서가 이유를 적어놨다.

> **nullable 값 형식 `T?`** 는 값 형식 `T`가 지원하는 미리 정의된 단항·이항
> 연산자, 또는 **오버로드된 모든 연산자**를 지원한다. **리프팅된 연산자(lifted
> operators)** 라고도 한다.

> **null을 허용하지 않는 값 형식 `T`는 해당 nullable 값 형식 `T?`로 암시적으로
> 변환된다.**

`Vector2`에는 `==` 연산자가 정의되어 있으니, 컴파일러가 그 연산자를
`Vector2?`로 리프팅하고 `input`을 `Vector2?`로 올려서 비교한다. **문법적으로는
성립하고, 결과는 언제나 참이다.**

컴파일러 경고 CS0472의 문구가 이 상황을 그대로 말해준다.

> `value2` 형식의 값은 `value3` 형식의 `null`과 같을 수 없으므로 식의 결과는
> 항상 `value1`입니다.

이 경고가 `Vector2`처럼 `==`를 직접 정의한 타입에서도 뜨는지는 문서가 말하지
않아서 단정하지 않겠다. **확실한 건 저 `if`가 절대 거짓이 되지 않는다**는
쪽이다. 한 줄 들여쓰기만 만들 뿐 아무것도 막지 않는다.

정작 필요한 판정은 **바로 다음 줄에 이미 있다.**

```csharp
_status = input != Vector2.zero ? Status.Move : Status.None;
```

`Vector2.zero`와 비교하는 이쪽이 "입력이 있는가"를 실제로 판정한다. 바깥
`if`는 지워도 동작이 같다.

`float`, `int`, `Vector3`도 같다. Unity 코드에서 null 검사가 의미를 갖는 건
`UnityEngine.Object`를 상속한 것들뿐이고, 그쪽은 또 `?.`를 쓰면 안 되는
별개의 이유가 있다.

## 방식 3 — Generate C# Class

이제 본론이다. Input Actions 에셋을 선택하고 인스펙터에서 **Generate C#
Class**를 체크한 뒤 Apply를 누른다. 문서 표현 그대로다.

> 이 옵션을 켜려면 `.inputactions` 에셋 인스펙터의 임포터 속성에서
> **Generate C# Class** 체크박스를 체크하고 **Apply**를 선택한다.

> 생성될 스크립트의 **경로, 클래스 이름, 네임스페이스**를 직접 정하거나 기본값을
> 그대로 둘 수 있다.

에셋과 같은 경로에 `PlayerInputSystem.cs`가 생긴다. 그리고 PlayerInput
컴포넌트는 지운다 — 이 방식은 컴포넌트를 쓰지 않는다.

액션 맵은 **직접 켜야 한다.** 문서가 분명히 적는다.

> 프로젝트 전역으로 지정되지 않은 Action Asset이나 직접 작성한 코드처럼 다른
> 곳에서 정의된 액션은 **비활성 상태로 시작하며, 입력에 반응하게 하려면 켜야
> 한다.**

> 액션은 개별로 켤 수도 있고, **액션을 담고 있는 Action Map을 켜서 한꺼번에**
> 켤 수도 있다.

맵 단위로 켜고 끌 수 있다는 점이 `UI`와 `PlayerMaps`를 나누는 이유가 된다.
UI가 떠 있는 동안 `PlayerMaps`를 끄면 같은 키가 캐릭터를 움직이지 않는다.

원문 코드다.

```csharp
PlayerInputSystem _playerInputSystem;
    enum Status
    {
        None,
        Move
    }
    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    private void Awake()
    {
        _playerInputSystem = new PlayerInputSystem();
    }
    private void OnEnable()
    {
        // 입력 Action Map 활성화
        _playerInputSystem.PlayerMaps.Enable();

        _playerInputSystem.PlayerMaps.Move.performed += Move_performed;
        _playerInputSystem.PlayerMaps.Move.started += Move_started;
        _playerInputSystem.PlayerMaps.Move.canceled += Move_canceled;
    }

    private void OnDisable()
    {
        // 입력 Action Map 비활성화
        _playerInputSystem.PlayerMaps.Disable();

        _playerInputSystem.PlayerMaps.Move.performed -= Move_performed;
        _playerInputSystem.PlayerMaps.Move.started -= Move_started;
        _playerInputSystem.PlayerMaps.Move.canceled -= Move_canceled;
    }

    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }
    private void Move_performed(InputAction.CallbackContext obj)
    {
        Vector2 input = obj.ReadValue<Vector2>();

        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;
            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("Move_performed");
        }
    }
    private void Move_started(InputAction.CallbackContext obj)
    {
        Debug.Log("Move_started");
    }
    private void Move_canceled(InputAction.CallbackContext obj)
    {
        Debug.Log("Move_canceled");
    }
```

`Enable`/`Disable`을 `OnEnable`/`OnDisable`에 둔 것, 구독과 해제를 짝지은 것은
방식 2의 예제보다 낫다. 그런데 이 코드는 **생성된 클래스를 만들어놓고 정작
그 클래스가 주는 것을 안 쓴다.**

## 생성된 클래스의 본체는 `SetCallbacks`다

문서가 Generate C# Class의 목적을 이렇게 적는다.

> 이것은 **이름으로 액션과 액션 맵을 수동으로 찾을 필요를 없애고**, 콜백을
> 설정하는 더 쉬운 방법도 제공한다.

앞 문장(문자열 조회가 사라진다)은 잘 알려져 있다. **뒷 문장이 이 방식의 진짜
값어치**인데, 원문의 예제는 그걸 안 쓴다. 액션 하나에 `+=` 세 줄, `-=` 세
줄이다. 액션이 여섯 개면 서른여섯 줄이 되고, **등록과 해제 목록을 손으로
맞춰야 한다.** 하나 빠뜨리면 그대로 구독이 남는다.

공식 문서의 예제는 다르다.

```csharp
public class MyPlayerScript : MonoBehaviour, IGameplayActions
{
    MyPlayerControls controls;

    public void OnEnable()
    {
        if (controls == null)
        {
            controls = new MyPlayerControls();
            // Tell the "gameplay" action map that we want to get told about
            // when actions get triggered.
            controls.gameplay.SetCallbacks(this);
        }
        controls.gameplay.Enable();
    }

    public void OnDisable()
    {
        controls.gameplay.Disable();
    }

    public void OnUse(InputAction.CallbackContext context)
    {
        // 'Use' code here.
    }

    public void OnMove(InputAction.CallbackContext context)
    {
        // 'Move' code here.
    }
}
```

**`SetCallbacks(this)` 한 줄이 그 서른여섯 줄을 대신한다.** 액션 맵 이름에서
인터페이스(`IGameplayActions`)가 같이 생성되고, 그 인터페이스를 구현하면
**메서드가 곧 액션 목록**이 된다. 액션을 추가하면 인터페이스에 멤버가 늘고,
구현하지 않으면 **컴파일이 안 된다.**

차이를 정리하면 이렇다.

| | 손으로 `+=` | `SetCallbacks` |
|---|---|---|
| 액션당 줄 수 | 등록 3 + 해제 3 | 0 |
| 액션 추가 시 | 두 목록에 손으로 추가 | **인터페이스가 컴파일 에러로 알려준다** |
| 해제 누락 | 조용히 남는다 | 해당 없음 |
| 콜백 대상 교체 | 전부 다시 `-=`/`+=` | `SetCallbacks(다른 객체)` |

**문자열이 사라지는 것보다 이쪽이 크다.** 문자열 조회는 직접 구독 방식에서도
캐싱으로 줄일 수 있지만, "액션을 추가했는데 콜백 연결을 깜빡했다"를
**컴파일 타임에 잡아주는 건 생성된 인터페이스뿐**이다.

한 가지 덧붙이면, `SetCallbacks`로 받으면 `started`/`performed`/`canceled`가
**메서드 하나로 합쳐진다.** 셋을 구분해야 하면 `context.phase`를 본다.
원문처럼 셋을 따로 받고 싶다면 그건 `+=`가 맞는 선택이다. 다만 원문의
`Move_started`/`Move_canceled`는 `Debug.Log`만 하고 있어서, 그 이유로 셋을
나눈 것은 아니다.

## 생성된 클래스는 `IDisposable`이다

원문은 `Awake`에서 인스턴스를 만들고 끝이다.

```csharp
private void Awake()
{
    _playerInputSystem = new PlayerInputSystem();
}
```

그런데 생성된 클래스는 정리할 것이 있다. Unity가 기본 제공하는
`DefaultInputActions`가 같은 방식으로 생성된 클래스인데, 선언이 이렇다.

```csharp
public class DefaultInputActions : IInputActionCollection2, IInputActionCollection,
    IEnumerable<InputAction>, IEnumerable, IDisposable
```

**`IDisposable`이 들어 있고 `public void Dispose()`가 있다.** 컴포넌트가
사라질 때 같이 정리해주는 게 맞다.

```csharp
private void OnDestroy()
{
    _playerInputSystem?.Dispose();
}
```

`_playerInputSystem`은 `UnityEngine.Object`가 아닌 순수 C# 객체라 `?.`를 써도
된다. Unity 오브젝트였다면 `if (obj != null)`이어야 한다.

## 어디에 왜 쓰나

정리하면 **생성된 클래스는 인터페이스를 받으려고 쓰는 것**이다. 그 전제로
코드를 짜면 이렇게 된다.

### 생성된 클래스 + 인터페이스로 받기

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// 생성된 PlayerInputSystem 클래스의 콜백을 인터페이스로 받아 이동을 처리한다.
/// </summary>
public class MoveController : MonoBehaviour, PlayerInputSystem.IPlayerMapsActions
{
    [Header("Movement")]
    [SerializeField, Range(1f, 20f), Tooltip("이동 속도(m/s)")]
    private float _speed = 4f;

    private PlayerInputSystem _input;
    private Vector3 _direction;

    private void Awake()
    {
        _input = new PlayerInputSystem();
        // 액션이 늘면 이 인터페이스에 멤버가 늘고, 구현 안 하면 컴파일이 안 된다.
        _input.PlayerMaps.SetCallbacks(this);
    }

    private void OnEnable()
    {
        _input.PlayerMaps.Enable();
    }

    private void OnDisable()
    {
        _input.PlayerMaps.Disable();
    }

    private void OnDestroy()
    {
        // 생성된 클래스는 IDisposable이다.
        _input?.Dispose();
    }

    private void Update()
    {
        if (_direction == Vector3.zero)
        {
            return;
        }

        transform.rotation = Quaternion.LookRotation(_direction);
        transform.Translate(Vector3.forward * _speed * Time.deltaTime);
    }

    // 인터페이스 구현. started / performed / canceled가 모두 여기로 온다.
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 input = context.ReadValue<Vector2>();
        // Vector2는 구조체다. null 검사는 의미가 없고, 0 벡터인지를 본다.
        _direction = new Vector3(input.x, 0f, input.y);
    }
}
```

원문에서 바꾼 것과 이유를 적어둔다.

- **`SetCallbacks(this)`를 `Awake`에서 한 번만 부른다.** `OnEnable`마다 다시
  부를 필요가 없다. 활성화·비활성화만 `OnEnable`/`OnDisable`에 남긴다.
- **`OnDestroy`에서 `Dispose`한다.** 생성된 클래스가 `IDisposable`이다.
- **null 검사를 없앴다.** `Vector2`에는 의미가 없고, 0 벡터 판정이 실제
  조건이다. `Update`의 `if`가 그 자리다.
- **상태 enum을 없앴다.** 원문은 `Status.None`/`Status.Move`를 두는데,
  `_direction`이 0인지로 같은 판정이 된다. 상태를 두 군데에 두지 않는다.
- **`_speed`를 `[SerializeField]`로 뺐다.** 원문은 `float _speed = 4f;`
  하드코딩이라 인스펙터에서 못 만진다. `[Range]`로 범위를 막아두면 값 실수도
  줄어든다.

### 세 방법 중 무엇을 고르나

| 방식 | 문자열 조회 | 액션 추가 시 | 자세히 |
|---|---|---|---|
| PlayerInput Behavior | Send Messages는 메서드 이름에 의존 | 메서드 이름을 맞춰야 | [Behavior 정리](/posts/unity-playerinput/) |
| `actions["Move"]` 직접 구독 | **있음** | 구독 코드를 손으로 추가 | [직접 구독](/posts/input-action-subscribe/) |
| Generate C# Class + `SetCallbacks` | 없음 | **컴파일 에러로 알려줌** | 이 글 |

로컬 멀티플레이어가 필요하면 `PlayerInput` 쪽이 본체다. 장치 배정과
`PlayerInputManager`가 거기 붙어 있다. **단일 플레이어이고 코드 중심으로 가고
싶다면 생성된 클래스**가 가장 안전하다 — 액션 목록과 코드가 컴파일러로 묶이기
때문이다.

### 쓰지 말아야 할 자리

- **값 형식에 null 검사.** `Vector2`, `float`, `int` 모두 해당한다.
- **생성된 클래스를 만들어놓고 `+=`로 손 연결.** 그러면 생성한 값어치의 절반이
  없어진다. 단계를 구분해야 하는 경우만 예외다.
- **`Dispose` 생략.** `IDisposable`이 붙어 있다.
- **`SetCallbacks`를 `OnEnable`마다 호출.** 한 번이면 된다.
- **`Awake`에서 `+=`하고 어디서도 `-=`하지 않기.** 방식 2의 예제가 그렇다.

## 정리

- **Active Input Handling을 바꾸면 에디터가 재시작된다.** 이관 중이라면 Both가
  안전하다.
- **Action Type은 Value / Button / Pass Through 셋이다.** Value만 활성화 시
  초기 상태 검사를 하고, Pass Through는 중재를 하지 않는다. 이동은 Value다.
- **PlayerInput의 Behavior는 넷이다.** 원문이 빠뜨린 Broadcast Messages가 있다.
- **원문의 "Invoke C# Events" 예제는 그 Behavior가 아니다.** 액션을 직접 꺼내
  구독하는 코드라서 Behavior 설정과 무관하게 동작한다. 대신 `-=`가 없다.
- **`Vector2`는 구조체라 null이 될 수 없다.** `if (input != null)`은 리프팅된
  연산자 덕에 컴파일만 되고 **항상 참**이다. 실제 판정은 `Vector2.zero`와의
  비교 쪽이다.
- **Generate C# Class의 값어치는 `SetCallbacks`와 생성된 인터페이스다.**
  문서 표현으로 "이름으로 찾을 필요를 없애고, **콜백을 설정하는 더 쉬운
  방법도 제공**한다".
- **인터페이스가 컴파일러를 감시자로 만든다.** 액션을 추가하면 멤버가 늘고,
  구현하지 않으면 빌드가 안 된다. 손으로 `+=`하면 누락이 조용하다.
- **생성된 클래스는 `IDisposable`이다.** `DefaultInputActions`의 선언이 그렇고,
  `OnDestroy`에서 `Dispose`하면 된다.
- **활성화는 여전히 내 몫이다.** `Enable`/`Disable`을 `OnEnable`/`OnDisable`에
  두는 건 세 방식 모두 같다.

세 가지 방법을 나란히 소개하는 글은 **각각을 어떻게 쓰는지**는 보여주는데
**왜 그것을 고르는지**는 잘 안 보인다. 생성된 클래스의 이유가 "문자열이
없어져서"라고만 남으면, 정작 그 이유를 실현하는 `SetCallbacks`를 건너뛰게
된다.

---

### 참고

- [Input Action Assets — Input System 문서](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/ActionAssets.html)
- [Actions — Input System 문서](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Actions.html)
- [PlayerInput 컴포넌트 — Input System 문서](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/PlayerInput.html)
- [Installation — Input System 문서](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Installation.html)
- [InputActionType — Input System API](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/api/UnityEngine.InputSystem.InputActionType.html)
- [DefaultInputActions — Input System API](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.9/api/UnityEngine.InputSystem.DefaultInputActions.html)
- [Vector2 — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Vector2.html)
- [Nullable value types — C# 문서](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types)
- [Compiler Warning CS0472](https://learn.microsoft.com/en-us/dotnet/csharp/misc/cs0472)

이 글의 출발점이 된 자료는 [usingsystem — \[Unity\] InputSystem 사용방법(PlayerInputComponent와 Generate C# Class)](https://usingsystem.tistory.com/555)
(2024-12-27)이다. 설정 절차와 예제 코드는 원문을 그대로 따라가면서, 각 주장을
현행 Input System 문서와 대조했다.
