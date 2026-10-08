---
pubDatetime: 2026-10-08T17:10:00+09:00
title: "started와 performed 사이에 있는 건 press threshold다"
lang: ko
translationKey: input-action-phases
featured: false
draft: false
tags:
  - Unity
  - Input System
  - 입력
  - C#
description: "Input System 입문 글의 저자가 끝내 답을 못 찾고 남긴 질문이 있다. started와 performed가 왜 똑같이 동작하느냐는 것이다. 답은 프레임이 아니라 문턱값 두 개에 있고, 문서는 그 답을 적어놓은 페이지에서 자기 말을 뒤집는다."
---

앞선 Input System 글들에 이어 **같은 주제를 더 찾아보던 중에 스크랩한
글이다.** 2023년 커뮤니티에 올라온 입문 글로, Input Action 에셋을 만들고
**Generate C# Class**로 래퍼를 뽑고, 그걸 `GameInput` 클래스에 감싸서
플레이어가 구독하게 만드는 흐름을 스크린샷으로 따라간다. 절차 자체는 지금
봐도 멀쩡하다.

그런데 글 중간에 저자가 이렇게 적어놓고 넘어간다.

> 근데 Start랑 Perform이랑 차이가 없는거같음 둘다 GetKeydown역할을
> 수행하는데 뭔 차이인지 모르겠음

댓글에서 두 사람이 더 붙는다. 한 명은 "키보드에는 누름, 뗌밖에 없기 때문에
performed랑 started랑 동일한것"이라고 답하고, 다른 한 명은 전날 같은 걸로
막혔다며 "인터렉션 아무것도 안썼을 때 Canceled는 GetkeyUp이 아니야"라고
적는다. 세 사람이 같은 자리에서 막혔고, 아무도 문서의 어느 줄이 그걸
설명하는지는 찾지 못했다.

그 줄은 있다. 그리고 답은 **프레임이 아니라 문턱값(threshold) 두 개**다.
Button 액션의 `started`와 `performed`를 가르는 것은 **press threshold**이고,
`canceled`를 결정하는 것은 **release threshold**다. 키보드 키에서 둘이
겹쳐 보이는 이유도, 게임패드 트리거에서는 안 겹치는 이유도 거기서 나온다.

확인한 것은 네 가지다. **press threshold가 started와 performed를 가른다**,
**`canceled`는 0이 아니라 release threshold에서 온다**, **`InputActionPhase`
페이지가 `Started`를 쓴다고도 안 쓴다고도 적어놨다**, 그리고 **Press
인터랙션을 붙이면 `canceled`가 아예 사라진다**.

이 블로그에 Input System 글이 이미 셋 있다.
[PlayerInput 컴포넌트의 Behavior](/posts/unity-playerinput/)는 어느 Behavior가
어떤 코드를 요구하는지를 다뤘고,
[InputAction을 직접 구독하기](/posts/input-action-subscribe/)는 등록과 해제의
수명을 다뤘고, [Generate C# Class](/posts/input-generated-class/)는 생성된
클래스의 `SetCallbacks`를 다뤘다. 이 글은 그 아래 한 층이다 — **세 콜백이
언제 불리는지를 결정하는 단계(phase) 기계와 그 기계를 움직이는 수치.**
다만 다른 글로 넘기지는 않는다. 필요한 설명과 예제 코드는 여기서 다시
전부 싣는다.

확인 시점은 **2026-10-08**이고, 기준은 Input System **1.20**이다.

## 목차

## 세 콜백은 순서가 아니라 단계다

먼저 용어를 맞춰야 한다. `started` · `performed` · `canceled`는 "먼저 오는
콜백 / 나중에 오는 콜백"이 아니다. 액션이 지나가는 **단계(phase)**에 각각
붙어 있는 콜백이다.

```csharp
action.started   += ctx => { };
action.performed += ctx => { };
action.canceled  += ctx => { };
```

단계는 `InputActionPhase` 열거형이다. 스크립팅 레퍼런스가 각 값을 이렇게
설명한다.

> The action is enabled and waiting for input on its associated controls.

`Waiting`이다. 그리고 같은 페이지가 이어서 적는다.

> This is the phase that an action goes back to once it has been Performed or
> Canceled.

즉 단계는 일직선이 아니고 **고리**다. `Waiting`에서 출발해 `Started`를 거쳐
`Performed`나 `Canceled`로 가고, 다시 `Waiting`으로 돌아온다. 한 번 누르고
떼는 동안 이 고리를 한 바퀴 돈다.

어느 단계로 가는지는 **Action Type**이 정한다. 액션에 아무 인터랙션도
붙이지 않았을 때의 동작을 문서는 "default interaction"이라고 부르고, 전용
페이지를 따로 두고 있다.

> Different Action types have different default Interactions.

세 타입의 기본 동작을 그 페이지의 표현 그대로 옮기면 이렇다.

| Action Type | `started` | `performed` | `canceled` |
| --- | --- | --- | --- |
| Value | "Control(s) changed value away from the default value." | "Control(s) changed value." | "Control(s) are no longer actuated." |
| Button | "Button started being pressed but has not necessarily crossed the press threshold yet." | "Button was pressed to at least the button press threshold." | "Button was released." |
| Pass Through | "not used" | "Control changed value." | "Action is disabled." |

표의 Button 행 첫 칸을 다시 읽어보자. `started`는 **"버튼이 눌리기 시작했고,
press threshold를 꼭 넘었다는 뜻은 아니다"**라고 적혀 있다. 원문 저자가 찾던
답이 이 한 칸 안에 들어 있다.

## Button의 started와 performed를 가르는 건 press threshold다

Button 액션에서 두 콜백이 갈라지는 지점은 이렇게 정리된다.

- `started` — 컨트롤이 **기본값에서 벗어났을 때**
- `performed` — 컨트롤이 **press threshold에 도달했을 때**

문서가 `performed` 칸에 적은 문장이 그대로 이것이다.

> Button was pressed to at least the button press threshold.

그 문턱값은 설정에서 온다.

> The default value of the button press threshold is defined in the input
> settings.

> However, an individual control can override this value.

설정의 기본값은 스크립팅 레퍼런스에 적혀 있다. `InputSettings`의
`defaultButtonPressPoint`다.

> The default value threshold for when a button is considered pressed.

> The default value is 0.5.

**0.5**다. 그러면 원문 저자가 본 현상이 설명된다. 키보드 키는 눌리거나
안 눌리거나 둘 중 하나고, 값이 0에서 1로 **한 번에** 간다. "기본값에서
벗어났다"와 "0.5를 넘었다"가 **같은 입력 이벤트 안에서** 일어난다. 그래서
`started`와 `performed`가 같은 프레임에 찍힌다.

댓글에서 "키보드에는 누름, 뗌밖에 없기 때문에"라고 답한 사람의 직관이
맞았다. 다만 이유가 "키보드에 두 상태밖에 없어서"보다는 **"0과 1 사이에
0.5를 지나는 중간 과정이 없어서"**가 정확하다. 차이는 아날로그 컨트롤에서
드러난다.

게임패드 트리거를 천천히 당기면 값이 0 → 0.1 → 0.3 → 0.5 → 0.8로 올라간다.
이때는

- 0.1에서 `started`
- 0.5를 넘는 순간 `performed`

로 **두 콜백이 다른 프레임에 온다.** 같은 코드, 같은 액션인데 디바이스에
따라 타이밍이 갈린다. 키보드로만 테스트하고 "둘은 똑같다"고 결론 내린 코드가
패드에서 어긋나는 경로가 이것이다.

Value 액션은 또 다르다. 스크립팅 레퍼런스가 `Started` 항목에서 못 박아둔다.

> For Value actions, Started will immediately be followed by Performed.

Value는 문턱값을 기다리지 않는다. 기본값에서 벗어나는 순간 `started`와
`performed`가 붙어서 온다. 그리고 Pass Through는 `Started`를 아예 안 쓴다.

> PassThrough does not use the Started phase and instead goes straight to
> Performed.

원문의 Walk 액션은 Button 타입이었다. 그래서 "press threshold" 쪽 설명이
적용된다.

## canceled는 0이 아니라 release threshold에서 온다

댓글의 두 번째 사람이 적은 말은 이것이었다.

> 인터렉션 아무것도 안썼을 때 Canceled는 GetkeyUp이 아니야

결론만 보면 맞다. 다만 문서가 말하는 이유는 따로 있다. Button 행의
`canceled` 칸은 짧다.

> Button was released.

그런데 그 "released"의 정의가 뒤에 붙는다.

> If the button was pressed above the press threshold, the button has now
> fallen to or below the release threshold.

문턱값이 **하나 더** 있다. `InputSettings.buttonReleaseThreshold`다.

> The percentage of defaultButtonPressPoint at which a button that was pressed
> is considered released again.

> This is a percentage rather than a fixed value.

중요한 대목은 **percentage**라는 단어다. 이건 절대값이 아니라 press
threshold에 대한 비율이다. press threshold가 0.5일 때 release threshold가
비율 r이면, 버튼은 **0이 아니라 `0.5 × r`로 떨어질 때** 떼진 것으로
간주된다. 아날로그 트리거를 끝까지 놓지 않고 살짝만 풀어도 `canceled`가
찍힐 수 있다는 뜻이다.

이 비율의 기본값은 **`InputSettings` 페이지에 적혀 있지 않다.** 숫자를
추측해서 쓰지 않겠다. 필요하면 Project Settings의 Input System 패키지 설정에서
직접 확인하는 쪽이 맞다.

같은 두 문턱 위에 서 있는 API가 하나 더 있다. 원문이 "Press는 이벤트 없이
`IsPressed()` 함수가 마련되어 있어서"라고 적으며 쓴 그 함수다. 스크립팅
레퍼런스의 설명이다.

> Check whether the current actuation of the action has crossed the press
> threshold

> has not yet fallen back below the release threshold

`IsPressed()`는 **"press threshold를 넘었고 아직 release threshold 아래로
안 떨어졌다"**를 묻는 함수다. `performed`와 `canceled`를 가르는 바로 그 두
수치가 이 함수의 정의 자체다. 같은 페이지가 덧붙인다.

> The same press threshold rules apply to APIs such as

이어지는 목록에 `WasPressedThisFrame()`과 `WasReleasedThisFrame()`이 있다.
폴링 API 전체가 같은 규칙 위에 있다.

참고로 `triggered` 프로퍼티도 같은 계열이다.

> Equivalent to WasPerformedThisFrame().

그리고 `WasCompletedThisFrame()`은 단계 전이를 직접 본다.

> Check whether phase transitioned from Performed to any other phase value at
> least once in the current frame.

## 같은 페이지가 started를 쓴다고도, 안 쓴다고도 적어놨다

여기서 문서가 꼬인다. `InputActionPhase`의 `Started` 항목에 이 문장이
있다.

> This phase will only be invoked if there are interactions on the respective
> control binding.

인터랙션이 없으면 `Started` 단계는 **아예 안 불린다**는 말이다. 바로
다음 줄도 같은 주장이다.

> Without any interactions, an action will go straight from Waiting into
> Performed and back into Waiting

이 말이 맞다면 원문 저자는 `started`에 등록한 함수가 한 번도 불리지 않는
걸 봤어야 한다. 그런데 저자는 `started`와 `performed`가 **둘 다** 불리는
걸 보고 "차이가 없는 것 같다"고 적었다.

같은 페이지를 더 내려가면 반대로 적혀 있다.

> By default, an action is started as soon as a control moves away from its
> default value.

그리고 Button 액션에 대해 이렇게 덧붙인다.

> which, however, does not yet have to mean that the button press threshold
> has been reached

**같은 페이지의 같은 항목 안에서 앞뒤가 다르다.** 앞은 "인터랙션이 없으면
`Started`가 없다", 뒤는 "기본적으로 컨트롤이 기본값에서 벗어나면 started
된다"다.

어느 쪽이 맞는지는 매뉴얼이 가른다. default interaction 페이지의 Button
행은 `started` 칸을 **비워두지 않았다.** 트리거 조건을 명시해놓았고, 그게
"기본값에서 벗어남"이다. Value 행도 마찬가지고, 아예 `started`를 안 쓰는
타입은 Pass Through 하나뿐이라고 "not used"라고 적어뒀다. 원문 저자가
관측한 것과도 이쪽이 맞는다.

즉 **뒤쪽 문장이 맞고, 앞쪽 두 문장이 틀렸다.** 세 사람이 같은 자리에서
막힌 것도 이상한 일이 아니다. 질문에 대한 답을 찾아 스크립팅 레퍼런스를
열면 "인터랙션 없으면 started는 안 불린다"는 문장을 먼저 만난다.

매뉴얼 쪽 서술도 완전히 깔끔하지는 않다. 인터랙션 소개 페이지는 이렇게
적는다.

> a button action's default interaction is to immediately perform the action
> when the button is pressed.

"immediately"라고 쓰면 키보드에서는 맞지만 아날로그 트리거에서는 느슨하다.
같은 페이지의 다음 문장에는 오타도 하나 있다.

> An action with no explicit interaction applied behaves according the default
> interaction for its action type.

`according` 뒤에 `to`가 빠져 있다. 이 글을 쓰는 2026-10-08 기준 1.20
문서에 그대로 남아 있다.

## Press 인터랙션을 붙이면 canceled가 사라진다

"started와 performed가 헷갈리니 인터랙션을 명시해서 분명하게 하자" — 그
방향으로 가면 함정이 하나 있다.

인터랙션은 바인딩에 걸 수도 있고 액션 전체에 걸 수도 있다.

> Applying Interactions directly to an Action is equivalent to applying them
> to all bindings for the Action.

둘 다 걸었다면 순서가 정해져 있다.

> This means that the Input System applies the binding's Interactions first,
> and then the Action's Interactions.

문제는 **Press 인터랙션의 기본값**이다. 내장 인터랙션 페이지가 적은
파라미터는 두 개다.

| 파라미터 | 타입 | 기본값 |
| --- | --- | --- |
| `pressPoint` | `float` | `InputSettings.defaultButtonPressPoint` |
| `behavior` | `PressBehavior` | `PressOnly` |

그리고 `behavior` 값별 트리거 조건이 이렇다.

| behavior | `started` | `performed` | `canceled` |
| --- | --- | --- | --- |
| `PressOnly` (기본) | "Control magnitude crosses pressPoint" | "Control magnitude crosses pressPoint" | "not used" |
| `ReleaseOnly` | "Control magnitude crosses pressPoint" | "Control magnitude goes back below pressPoint" | "not used" |
| `PressAndRelease` | "Control magnitude crosses pressPoint" | "Control magnitude crosses pressPoint" 또는 "Control magnitude goes back below pressPoint" | "not used" |

세 행 모두 `canceled`가 **"not used"**다. 아무것도 모르고 Press 인터랙션을
얹으면, 지금까지 `canceled`에서 처리하던 "뗐을 때" 로직이 **조용히 죽는다.**
컴파일 에러도 경고도 없다. 구독은 그대로 걸려 있고 그 델리게이트가 영원히
안 불릴 뿐이다.

그리고 `PressOnly`에서는 `started`와 `performed`의 트리거가 **문자 그대로
같은 조건**이다. 문턱값으로 벌어져 있던 간격마저 0이 된다. 명시해서 분명하게
만들려던 시도가 오히려 두 콜백을 완전히 붙여놓는다.

여기서 원문의 다른 문장 하나도 정정된다. 원문은 Press를 이렇게 설명했다.

> 이건 따로 이벤트 없이 IsPressed() 함수가 마련되어 있어서 GameInput에서
> return 해주기만 하면 됨

"따로 이벤트가 없다"는 틀렸다. **`ReleaseOnly`가 바로 그 이벤트다.**
`performed`가 "Control magnitude goes back below pressPoint"에서 오니, 떼는
순간을 이벤트로 받고 싶으면 이걸 쓰면 된다. `PressAndRelease`는 누를 때와
뗄 때 모두 `performed`를 낸다 — 다만 `performed` 하나로 두 사건이 들어오니,
둘을 구분해야 하면 `IsPressed()`나 값을 같이 봐야 한다.

Hold 인터랙션도 같은 표에 있다. 비교해두면 `canceled`가 왜 "취소"라는
이름인지가 보인다.

> Control magnitude held above pressPoint for >= duration.

이게 Hold의 `performed`다. 그리고 `canceled`는 이렇다.

> Control magnitude goes back below pressPoint before duration (that is, the
> button was not held long enough)

**"성공하지 못했다"**는 뜻이다. `duration`의 기본값은
`InputSettings.defaultHoldTime`이고, 레퍼런스가 수치를 적어뒀다.

> The default hold time is 0.4 seconds.

Button의 `canceled`가 "뗐다"로 읽히는 건 기본 인터랙션 한정의 특수한
경우다. 단계의 이름이 `Canceled`인 이유는 Hold 쪽에 있다.

## NormalizeVector2를 또 걸 필요가 없을 수 있다

원문은 이동 액션을 만들면서 Processors를 이렇게 설명한다.

> 우린 방향만 필요하므로 normalized를 설정해주면 뱉어내는 값이 알아서
> normalized되서 튀어나옴 스크립트에서 따로 안해줘도됨

두 가지를 짚을 수 있다.

첫째, **`normalized`라는 이름의 프로세서는 없다.** 내장 프로세서 목록에
이름이 비슷한 게 둘 있고, 피연산자 타입이 다르다.

| 표시 이름 | 피연산자 | 하는 일 |
| --- | --- | --- |
| `Normalize` | `float` | "Normalizes input values in the range [`min`..`max`] to unsigned normalized form [0..1] if `min` is >= `zero`," |
| `NormalizeVector2` | `Vector2` | "Normalizes input vectors to be of unit length (1). This is the same as calling `Vector2.normalized`." |

`Normalize`는 `min`·`max`·`zero` 파라미터를 받는 **범위 재매핑**이고,
벡터를 단위 길이로 만드는 것은 `NormalizeVector2`다. Vector2 액션에
`Normalize`를 걸려고 하면 애초에 목록에 나오지 않는다.

둘째, 원문의 설정에서는 **그 프로세서가 필요 없을 수 있다.** 원문은 바인딩을
"up down left right"로 잡았다. 그게 2D Vector 컴포지트고, 이 컴포지트에는
`mode` 필드가 있다.

> Determines how X and Y of the resulting `Vector2` are formed from input
> values.

스크립팅 레퍼런스의 코드 예제가 `mode = 0`에 달아놓은 주석이 이렇다.

> DigitalNormalized composite (the default)

그리고 그 모드의 동작이 이렇다.

> will return a normalized direction vector

**기본 모드가 이미 정규화한다.** WASD로 묶은 컴포지트에 `NormalizeVector2`를
또 걸면 이미 길이 1인 벡터를 다시 길이 1로 만드는 일이다. 틀린 설정은
아니지만 하는 일이 없다.

프로세서가 일을 하는 경우는 따로 있다. 게임패드 스틱처럼 **컴포지트를 거치지
않고 아날로그 컨트롤에 직접 바인딩한** 경우다. 스틱은 원형 범위 안의 임의
길이 벡터를 내보내므로 거기서는 `NormalizeVector2`가 실제로 길이를 1로
깎는다. 같은 액션에 WASD 컴포지트와 스틱을 같이 바인딩했다면, 스틱 쪽만
길이가 1이 아닌 상태가 되므로 **액션 레벨에 `NormalizeVector2`를 걸어
양쪽을 맞추는 선택**이 의미를 가진다.

## 콜백 바깥으로 context를 들고 나가지 마라

마지막으로 댓글의 증상 하나가 남았다.

> 떼는 순간만 True가 아니라 떼고 있으면 계속 True가 박힘

원문 저자는 "이벤트 형식이라 뗀 순간만 받아오게 될거임"이라고 답했고, 그
답이 맞다. 다만 왜 그런 차이가 나는지는 `CallbackContext`의 레퍼런스에
적혀 있다.

> You should not use or keep this struct outside of the callback.

그리고 `phase` 프로퍼티의 설명이 결정적이다.

> Current phase of the action. Equivalent to accessing phase on action.

`context.phase`는 **콜백 시점의 스냅샷이 아니다.** 액션의 `phase`를 그대로
읽는다. `started` · `performed` · `canceled` 프로퍼티도 각각 "방금 시작/수행/
취소되었는가"로 설명되어 있을 뿐, 콜백이 끝난 뒤의 값에 대해서는 문서가
아무 약속도 하지 않는다. 그래서 "구조체를 콜백 바깥으로 가지고 나가지
말라"고 적혀 있는 것이다.

여기서 선을 분명히 긋자. **위 증상이 정확히 어떤 코드에서 나온 것인지는
문서로 확인할 수 없다.** 댓글에는 코드가 없다. 문서로 말할 수 있는 것은
두 가지다 — 콜백 안에서 `ctx.canceled`를 보는 것은 "지금 취소되었다"는
뜻이고, `context`를 저장해두고 나중에 읽는 것은 **문서가 하지 말라고 적어둔
사용법**이다. "계속 True"처럼 읽히는 값은 후자 쪽에서 나오기 쉽다.

안전한 모양은 둘로 갈린다.

- **순간적인 사건** — 콜백에서 처리한다. `canceled`에 등록한 함수는 떼는
  그 한 번만 불린다.
- **지속적인 상태** — `Update`에서 `IsPressed()`나 `ReadValue`로 **액션에
  직접 묻는다.** `context`를 들고 다니지 않는다.

## 어디에 왜 쓰나

### 동작하는 예제

원문과 같은 구조로 간다. **Generate C# Class**로 뽑은 래퍼를 `GameInput`이
감싸고, 플레이어는 `GameInput`의 이벤트만 구독한다.

생성되는 클래스 이름은 **액션 에셋의 파일명에서 온다.** 원문은 에셋을
`PlayerInput`이라고 두었는데, 그 이름은 Input System이 제공하는 컴포넌트
`UnityEngine.InputSystem.PlayerInput`과 **글자가 똑같다.** 컴파일이 깨지는지
여기서 확인하지는 않았으니 단정하지 않겠다. 다만 문서 예제들이 에셋 이름을
`MyPlayerControls`처럼 두는 데는 이유가 있고, 아래 예제도 에셋을
`PlayerControls`로 둔 것으로 적는다.

먼저 입력을 모아두는 쪽이다.

```csharp file="Scripts/Input/GameInput.cs"
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class GameInput : MonoBehaviour
{
    public event Action OnWalkStarted;
    public event Action OnWalkPerformed;
    public event Action OnWalkCanceled;

    private PlayerControls _controls;

    public Vector2 MoveDirection =>
        _controls.Player.Move.ReadValue<Vector2>();

    // 지속 상태는 액션에 직접 묻는다. press/release threshold가 판정한다.
    public bool IsWalkPressed => _controls.Player.Walk.IsPressed();

    private void Awake()
    {
        _controls = new PlayerControls();
    }

    private void OnEnable()
    {
        _controls.Player.Enable();

        _controls.Player.Walk.started   += HandleWalkStarted;
        _controls.Player.Walk.performed += HandleWalkPerformed;
        _controls.Player.Walk.canceled  += HandleWalkCanceled;
    }

    private void OnDisable()
    {
        _controls.Player.Walk.started   -= HandleWalkStarted;
        _controls.Player.Walk.performed -= HandleWalkPerformed;
        _controls.Player.Walk.canceled  -= HandleWalkCanceled;

        _controls.Player.Disable();
    }

    private void OnDestroy()
    {
        _controls.Dispose();
    }

    // ctx는 이 메서드 안에서만 쓴다. 필드에 저장하지 않는다.
    private void HandleWalkStarted(InputAction.CallbackContext ctx)
    {
        OnWalkStarted?.Invoke();
    }

    private void HandleWalkPerformed(InputAction.CallbackContext ctx)
    {
        OnWalkPerformed?.Invoke();
    }

    private void HandleWalkCanceled(InputAction.CallbackContext ctx)
    {
        OnWalkCanceled?.Invoke();
    }
}
```

받는 쪽이다.

```csharp file="Scripts/Player/PlayerMover.cs"
using UnityEngine;

public class PlayerMover : MonoBehaviour
{
    private const float WalkSpeedMultiplier = 0.4f;

    [Header("참조")]
    [SerializeField]
    private GameInput _gameInput;

    [Header("이동")]
    [Tooltip("초당 이동 거리")]
    [SerializeField]
    private float _moveSpeed = 5f;

    private bool _isWalking;

    private void OnEnable()
    {
        if (_gameInput == null)
        {
            Debug.LogError($"{nameof(_gameInput)}이 비어 있다.", this);
            return;
        }

        _gameInput.OnWalkStarted   += HandleWalkStarted;
        _gameInput.OnWalkCanceled  += HandleWalkCanceled;
    }

    private void OnDisable()
    {
        if (_gameInput == null)
        {
            return;
        }

        _gameInput.OnWalkStarted   -= HandleWalkStarted;
        _gameInput.OnWalkCanceled  -= HandleWalkCanceled;
    }

    private void Update()
    {
        Vector2 direction = _gameInput.MoveDirection;
        float speed = _isWalking ? _moveSpeed * WalkSpeedMultiplier : _moveSpeed;

        Vector3 delta = new Vector3(direction.x, 0f, direction.y)
                        * (speed * Time.deltaTime);

        transform.Translate(delta, Space.World);
    }

    private void HandleWalkStarted()
    {
        _isWalking = true;
    }

    private void HandleWalkCanceled()
    {
        _isWalking = false;
    }
}
```

`_gameInput`에 `?.`를 쓰지 않은 이유가 있다. `GameInput`은
`MonoBehaviour`이므로 `UnityEngine.Object`이고, 인스펙터에서 할당하지 않은
필드는 **null처럼 보이지만 C#의 null이 아닌 상태**가 될 수 있다. 그래서
`== null` 비교를 쓴다. 순수 C# 객체에는 `?.`가 맞고, 위 `GameInput` 안에서
`OnWalkStarted?.Invoke()`로 쓴 것이 그 경우다.

여기서 `started`와 `canceled`만 구독했다. 키보드만 쓸 거라면 `performed`로
바꿔도 결과가 같다. **하지만 패드 트리거를 걷기 키로 바인딩할 가능성이
있으면 둘은 다른 코드가 된다.** 눌리기 시작하는 순간부터 걷기 상태로 보고
싶으면 `started`, 확실히 눌렸다고 판정된 뒤부터면 `performed`다.

### 무엇을 고르나

사건별로 정리하면 이렇다.

| 하고 싶은 것 | 쓸 것 |
| --- | --- |
| 눌리기 시작한 순간 (문턱 전) | `started` |
| 확실히 눌렸다고 판정된 순간 | `performed` |
| 떼진 순간 (기본 인터랙션 Button) | `canceled` |
| 떼진 순간을 인터랙션으로 명시 | Press 인터랙션 + `ReleaseOnly`의 `performed` |
| 지금 눌려 있는가 | `IsPressed()` |
| 이번 프레임에 수행됐는가 | `WasPerformedThisFrame()` 또는 `triggered` |
| 값이 매 프레임 필요 (이동 등) | `Update`에서 `ReadValue<Vector2>()` |
| 길게 누르기 | Hold 인터랙션. 성공은 `performed`, 중도 포기는 `canceled` |

Action Type 선택은 이렇게 갈린다.

- **Button** — 문턱값 판정이 필요한 입력. 점프, 발사, 걷기 토글.
  `started`와 `performed`가 아날로그 컨트롤에서 갈라진다.
- **Value** — 값이 계속 바뀌는 입력. 이동, 조준. `started` 직후 `performed`가
  오고, 값이 바뀔 때마다 `performed`가 다시 온다.
- **Pass Through** — 중간 처리를 건너뛰고 원시 값 변화를 그대로 받고 싶을 때.
  `started`가 없다.

### 쓰지 말아야 할 자리

- **`started`와 `performed`가 같다고 전제한 코드.** 키보드에서만 참이다.
  패드 바인딩이 추가되는 순간 깨진다.
- **`canceled`를 `GetKeyUp`으로 치환한 주석과 변수명.** `canceled`는
  "기본 상태로 돌아갔다"는 뜻이고, Hold에서는 "실패했다"는 뜻이다.
  `OnKeyUp` 같은 이름을 붙이면 다음 사람이 Hold를 붙였을 때 읽을 수 없는
  코드가 된다.
- **`canceled`에 로직을 걸어둔 액션에 Press 인터랙션 추가.** 세 behavior
  모두 `canceled`가 "not used"다.
- **`CallbackContext`를 필드에 저장하는 것.** 문서가 하지 말라고 적어뒀다.
  지속 상태가 필요하면 액션에 직접 묻는다.
- **2D Vector 컴포지트에 `NormalizeVector2` 추가를 "필수 설정"으로 적는
  문서.** 기본 모드가 이미 정규화한다.

## 정리

- `started` · `performed` · `canceled`는 콜백 순서가 아니라 **단계에 붙은
  콜백**이다. 단계는 `Waiting`에서 출발해 다시 `Waiting`으로 돌아오는 고리다.
- Button 액션에서 `started`는 **기본값에서 벗어날 때**, `performed`는
  **press threshold에 도달할 때** 온다. 기본 문턱값은 **0.5**다.
- 키보드 키는 0에서 1로 한 번에 가므로 둘이 같은 프레임에 찍힌다.
  **아날로그 트리거에서는 갈라진다.** 원문 저자가 본 "차이 없음"의 정체다.
- `canceled`의 기준은 0이 아니라 **release threshold**이고, 그건 press
  threshold에 대한 **비율**이다. 기본 비율 값은 문서에 적혀 있지 않다.
- `IsPressed()`는 그 두 문턱으로 정의된 함수다.
  `WasPressedThisFrame()` · `WasReleasedThisFrame()`도 같은 규칙 위에 있다.
- `InputActionPhase` 페이지는 **같은 항목 안에서 앞뒤가 다르다.**
  "인터랙션이 없으면 `Started`가 안 불린다"는 앞쪽 문장이 틀렸고, 매뉴얼의
  default interaction 표가 맞다.
- **Press 인터랙션은 세 behavior 모두 `canceled`가 "not used"다.** 명시하려고
  붙이면 떼는 처리가 조용히 죽는다. 떼는 순간을 이벤트로 받으려면
  `ReleaseOnly`의 `performed`다.
- 2D Vector 컴포지트의 기본 모드는 **DigitalNormalized**이고 이미 정규화한다.
  `NormalizeVector2`는 스틱처럼 컴포지트를 거치지 않는 아날로그 바인딩에서
  일을 한다. `Normalize`는 `float`용이라 애초에 다른 프로세서다.
- `CallbackContext`는 **콜백 바깥으로 들고 나가지 않는다.** `phase`는
  스냅샷이 아니라 액션의 현재 단계를 읽는다.

---

### 참고

- [Default interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/default-interactions.html)
- [Built-in interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/built-in-interactions.html)
- [Introduction to interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/introduction-interactions.html)
- [Apply interactions to actions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/apply-interactions-actions.html)
- [InputActionPhase — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputActionPhase.html)
- [InputAction — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputAction.html)
- [InputAction.CallbackContext — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputAction.CallbackContext.html)
- [InputSettings — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputSettings.html)
- [Built-in processors — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/built-in-processors.html)
- [Vector2Composite — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Composites.Vector2Composite.html)

이 글의 출발점이 된 자료는 인디 게임 개발 마이너 갤러리에 올라온
[유니티 new inputsystem 관하여](https://gall.dcinside.com/mgallery/board/view/?id=game_dev&no=124088)
(ㅇㅇ, 2023-04-16)다. 설정 절차는 원문을 그대로 따라가면서, 원문과 댓글이
남긴 질문 세 개를 현행 Input System 1.20 매뉴얼과 스크립팅 레퍼런스 양쪽에
대조했다. 확인 시점은 2026-10-08이다.
