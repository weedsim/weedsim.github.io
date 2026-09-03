---
pubDatetime: 2026-09-03T18:30:00+09:00
title: "Unity PlayerInput 정리: Behavior 하나가 코드를 통째로 바꾼다"
lang: ko
translationKey: unity-playerinput
featured: false
draft: false
tags:
  - Unity
  - Input System
  - 입력
  - C#
description: "PlayerInput의 API 레퍼런스는 프로퍼티 목록일 뿐이라 정작 필요한 걸 알려주지 않는다. Behavior 네 가지가 왜 서로 다른 코드를 요구하는지, 콜백이 왜 여러 번 오는지, 그리고 싱글플레이어에 이 컴포넌트가 필요한지를 정리했다."
---

게임 프로젝트에 Input System을 붙이면서 플레이어 오브젝트에 `PlayerInput`
컴포넌트를 추가했다. 자료들이 그렇게 하라고 해서 따라 한 것이었는데, 붙이고
나니 **이게 정확히 무엇을 해주기에 필요한 것인지**가 오히려 흐릿했다. 그래서
찾아보다가
[API 레퍼런스](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.12/api/UnityEngine.InputSystem.PlayerInput.html)를
스크랩해뒀었다.

다시 열어보니 80KB짜리 문서인데 클래스 설명은 딱 한 줄이다.

> Represents a separate player in the game complete with a set of actions
> exclusive to the player and a set of paired device.

나머지는 프로퍼티와 메서드 목록, 그리고 `MonoBehaviour`에서 물려받은 멤버들이
끝없이 이어진다. **무엇이 있는지는 알려주지만 어떻게 쓰는지는 알려주지
않는다.** 레퍼런스 문서니까 당연한 일이지만, 실제로 이 컴포넌트를 처음 붙일 때
막히는 지점은 목록에 없는 쪽에 있다.

그래서 매뉴얼과 대조해서 다시 정리했다. 결론부터 말하면 처음의 질문
— "이게 왜 필요한가" — 에 대한 답은 **"경우에 따라 필요 없다"**였다.
기준은 현재 최신인 **Input System 1.16.0**(2025-11-10)이고, 스크랩본의
1.12.0에서 달라진 부분은 마지막에 따로 모아뒀다.

## 목차

## PlayerInput은 두 가지 일을 한다

매뉴얼이 이 컴포넌트의 역할을 두 줄로 정리한다.

> Configuring how Actions map to methods or callbacks in the script that
> controls your player

> Handling local multiplayer scenarios such as player lobbies, device
> filtering, and screen-splitting

앞의 것만 보고 쓰는 경우가 많은데, **뒤의 것이 이 컴포넌트가 존재하는 이유에
더 가깝다.** 액션을 메서드에 연결하는 것만 필요하다면 굳이 이 컴포넌트를
거치지 않아도 되고, 그 이야기는 아래에서 따로 하겠다.

## Behavior 네 가지가 코드를 바꾼다

인스펙터의 `Behavior` 드롭다운은 알림 방식만 고르는 것처럼 보이지만,
**고르는 값에 따라 작성해야 하는 메서드 시그니처가 달라진다.** 여기가 처음
쓸 때 가장 많이 막히는 곳이다.

| Behavior | 전달 방식 | 작성할 메서드 |
| --- | --- | --- |
| Send Messages | `GameObject.SendMessage` | `void OnMove(InputValue value)` |
| Broadcast Messages | `GameObject.BroadcastMessage` | `void OnMove(InputValue value)` |
| Invoke Unity Events | 인스펙터에서 연결한 `UnityEvent` | `void OnMove(InputAction.CallbackContext context)` |
| Invoke C# Events | `PlayerInput`의 C# 이벤트 | `onActionTriggered` 등에 구독 |

매뉴얼의 표현은 이렇다.

> **Send Messages**: Uses `GameObject.SendMessage` on the GameObject that the
> PlayerInput component belongs to

> **Broadcast Messages**: Uses `GameObject.BroadcastMessage` on the GameObject
> that the PlayerInput component belongs to. This broadcasts the message down
> the GameObject hierarchy

> **Invoke CSharp Events**: Similar to `Invoke Unity Events`, except that the
> events are plain C# events available on the `PlayerInput` API.

값이 필요 없는 액션이면 인자 없이 받아도 된다.

```csharp
public void OnJump() { }
public void OnMove(InputValue value) { }
```

`Invoke Unity Events`와 `Invoke C# Events`는 인자 타입이 다르다.

```csharp
public void OnFire(InputAction.CallbackContext context) { }
```

### 여기서 실제로 물리는 것

**Send Messages는 문자열 이름으로 메서드를 찾는다.** 액션 이름이 `Move`면
`OnMove`를 호출한다. 즉 다음 상황들이 전부 **컴파일 타임에 안 잡힌다.**

- 액션 이름을 `Move`에서 `Movement`로 바꿨는데 스크립트의 `OnMove`를 그대로 둔 경우
- 오타로 `OnMOve`라고 쓴 경우
- 스크립트가 `PlayerInput`과 같은 게임오브젝트에 없는 경우

셋 다 에러 없이 조용히 아무 일도 일어나지 않는다. "입력이 안 먹는데 로그도
안 뜬다"의 상당수가 여기다. `Broadcast Messages`는 자식까지 훑기 때문에
스크립트 위치 문제는 피할 수 있지만, 이름 문제는 그대로다.

반대로 `Invoke Unity Events`는 인스펙터에서 연결하므로 이름 오타는 안 생기지만
**연결이 씬 파일에 저장된다.** 프리팹을 여러 개 두거나 씬을 갈아엎으면 연결이
끊기고, 이것도 조용히 안 불린다.

`Invoke C# Events`는 코드로 구독하므로 이 두 문제가 다 없다. 대신 액션마다
개별 이벤트가 있는 게 아니라 `onActionTriggered` 하나로 전부 들어오므로,
안에서 액션을 구분하는 코드를 직접 써야 한다.

## 한 번 눌러도 콜백은 여러 번 온다

`CallbackContext`를 받는 쪽(`Invoke Unity Events`, `Invoke C# Events`)을 쓸 때
반드시 걸리는 문제다. 액션은 단계를 거쳐 진행된다.

> Disabled, Waiting, Started, Performed, and Canceled

> The Started, Performed, and Canceled phases each have a callback associated
> with them.

즉 버튼 하나를 눌렀다 떼면 **콜백이 세 번 불릴 수 있다.** 발사 액션에
`Instantiate`를 그냥 붙여두면 총알이 한 번에 여러 발 나가는 이유가 이것이다.

해결은 단계를 직접 거르는 것이다.

```csharp
public void OnFire(InputAction.CallbackContext context)
{
    if (!context.performed) return;
    Fire();
}
```

누르는 순간과 떼는 순간을 나눠 쓰고 싶다면 `context.started`와
`context.canceled`를 각각 본다. 이동처럼 값이 계속 바뀌는 액션이라면
`context.ReadValue<Vector2>()`로 읽되, 매 프레임 필요한 값이라면
콜백으로 받아 저장해두고 `Update`에서 쓰는 편이 낫다.

`Send Messages` 쪽은 `InputValue`만 넘어오므로 이 문제를 덜 겪는다. 대신
어느 단계에서 불린 것인지 알 수 없어서, 단계별로 다르게 처리해야 하는
액션에는 부적합하다. **여기까지가 Behavior를 고르는 실질적인 기준이다.**

## 프로퍼티 중 실제로 손대는 것들

레퍼런스에 20개 넘는 프로퍼티가 나열되어 있지만, 실제로 자주 쓰는 건 몇 개
안 된다. 용도별로 묶으면 이렇다.

**액션 맵 전환** — UI를 열 때 게임플레이 입력을 끄는 용도로 쓴다.

- `actions` — 이 플레이어가 쓰는 `InputActionAsset`
- `defaultActionMap` / `currentActionMap`
- `SwitchCurrentActionMap(string)`

여기서 흔한 버그가 **돌아오는 걸 잊는 것**이다. 인벤토리를 열며 `UI` 맵으로
바꿨는데 닫을 때 `Player`로 되돌리지 않으면 캐릭터가 영영 안 움직인다.
여닫는 코드를 한 쌍으로 붙여두는 게 안전하다.

**컨트롤 스킴** — 키보드·게임패드 전환.

- `defaultControlScheme` / `currentControlScheme`
- `neverAutoSwitchControlSchemes`
- `onControlsChanged` — UI의 키 안내 아이콘을 바꿀 때 여기에 건다

**입력 켜고 끄기** — 컷신이나 사망 연출에서 쓴다.

- `ActivateInput()` / `DeactivateInput()`
- `inputIsActive`

**멀티플레이어·화면 분할**

- `playerIndex`, `splitScreenIndex`, `camera`, `devices`, `user`
- `all`, `GetPlayerByIndex(int)`, `FindFirstPairedToDevice(InputDevice)`

**UI 연결**

- `uiInputModule` — `InputSystemUIInputModule` 참조

## 로컬 멀티플레이어가 본체다

`PlayerInput`을 혼자 쓰면 절반만 쓰는 것이다. 짝이 되는
`PlayerInputManager`가 있고, 매뉴얼의 설명은 이렇다.

> automatically manages the creation and lifetime of `PlayerInput` instances
> as players join and leave the game

플레이어 프리팹을 지정해두면 — 그 프리팹 계층 안에 `PlayerInput`이 하나
있어야 한다 — 참가할 때마다 인스턴스를 만들어준다. 참가 방식은 세 가지다.

- **Join Players When Button Is Pressed** — 어느 플레이어에도 페어링되지 않은
  기기에서 버튼이 눌리면 참가시킨다.
- **Join Players When Join Action Is Triggered** — 아무 버튼이 아니라 지정한
  액션이 발동됐을 때만 참가시킨다.
- **Join Players Manually** — 자동 참가 없이 `JoinPlayer`를 직접 호출한다.

화면 분할도 여기서 처리한다. 켜두면 활성 플레이어 수에 맞춰 화면을 자동으로
나누고, 그러려면 플레이어 프리팹에 카메라가 붙어 있어야 한다. `PlayerInput`의
`camera`와 `splitScreenIndex`가 이때 쓰이는 값들이다. 인원 상한은
`Limit Number of Players`와 `Max Player Count`로 잡는다.

**디바이스 페어링, 참가·이탈 처리, 화면 분할** — 이 세 가지를 직접 짜는 것과
비교하면 컴포넌트를 붙이는 쪽이 확실히 싸다. 로컬 멀티플레이어를 만든다면
`PlayerInput`은 쓰는 게 맞다.

## 싱글플레이어에도 필요한가

여기가 처음의 질문에 대한 답이다. 로컬 멀티플레이어가 아니라면 이야기가
달라진다. Input System 매뉴얼이 권하는 기본 워크플로는 `PlayerInput`이
아니다.

> Unless you have specific project requirements that require more than one
> Action Asset, the recommended workflow is to use a single Action Asset
> assigned as the project-wide actions.

프로젝트 전역 액션(Project-wide Actions)으로 지정해두면 에셋 참조를 들고
다닐 필요 없이 API로 바로 접근한다.

```csharp
InputSystem.actions.FindAction("Move");
```

`PlayerInput`이 해주던 것 중 싱글플레이어에서 실제로 필요한 건 "액션을
메서드에 연결"뿐인데, 그건 액션의 `performed`에 직접 구독해도 된다. 정리하면
판단 기준은 이렇다.

- **로컬 멀티플레이어, 화면 분할, 기기별 페어링이 필요하다** → `PlayerInput` +
  `PlayerInputManager`
- **플레이어가 하나뿐이다** → 프로젝트 전역 액션 + 직접 구독. `PlayerInput`을
  써도 되지만, `SendMessage` 기반의 이름 매칭이나 인스펙터 연결이 주는
  취약함을 굳이 떠안을 이유는 없다
- **입력을 여러 오브젝트가 나눠 받아야 한다** → `Broadcast Messages`가
  편해 보이지만, 이건 이벤트 버스를 직접 두는 쪽이 추적하기 쉽다

## 1.12에서 지금까지

스크랩본은 **1.12.0** 기준이고 현재 최신은 **1.16.0**(2025-11-10)이다.
`PlayerInput` 자체의 API가 크게 바뀌지는 않았고, 관련 수정은 주로 버그
수정이다.

- `defaultActionMap`이 `None`으로 설정되어 있을 때 기본 액션 맵에서 자동으로
  전환되어 버리던 문제 수정
- `defaultActionMap` 드롭다운이 비어 있지 않고 첫 액션 맵을 기본값으로 잡도록 수정
- `InputActionReference` 관련 수정 여러 건(캐시된 액션이 갱신되지 않던 문제,
  에셋 삭제 시 인스펙터에 깨진 참조가 반영되지 않던 문제 등)

즉 1.12 기준으로 쓴 코드가 1.16에서 안 돌아갈 일은 거의 없다. 다만 위 두 건은
"인스펙터에서 분명히 설정했는데 다르게 동작한다"류의 증상이라, 옛 버전에서
겪었던 이상 동작이라면 버전부터 확인해볼 값이 있다.

## 정리

- `PlayerInput`은 액션-메서드 연결과 로컬 멀티플레이어 처리를 한다. 후자가
  이 컴포넌트의 본체다.
- **`Behavior` 값이 작성할 메서드 시그니처를 결정한다.** Send/Broadcast는
  `InputValue`, Unity Events와 C# Events는 `InputAction.CallbackContext`다.
- `Send Messages`는 이름 기반 리플렉션이라 오타·이름 변경·스크립트 위치가
  전부 조용히 실패한다. `Invoke Unity Events`는 씬에 저장된 연결이 끊기면
  마찬가지로 조용히 실패한다.
- 액션은 `Started`, `Performed`, `Canceled` 세 단계에 각각 콜백이 있다.
  `CallbackContext`를 쓴다면 `context.performed`로 걸러야 한 번만 실행된다.
- 액션 맵을 바꿨으면 되돌리는 코드를 한 쌍으로 붙인다.
- 싱글플레이어라면 프로젝트 전역 액션 + 직접 구독이 매뉴얼이 권하는 기본
  워크플로다.
- 현재 최신은 1.16.0. 1.12에서 `PlayerInput` API가 깨진 변경은 없다.

## 참고

- [The Player Input component — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/PlayerInput.html)
- [The Player Input Manager component — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/PlayerInputManager.html)
- [Responding to actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/RespondingToActions.html)
- [Project-wide actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ProjectWideActions.html)
- [Input System changelog — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/changelog/CHANGELOG.html)
- 원문: [Class PlayerInput — Input System 1.12.0](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.12/api/UnityEngine.InputSystem.PlayerInput.html)
