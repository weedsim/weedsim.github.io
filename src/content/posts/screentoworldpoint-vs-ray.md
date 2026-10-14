---
pubDatetime: 2026-10-14T21:10:00+09:00
title: "z를 거리로 읽는 함수와 그냥 버리는 함수가 따로 있다"
lang: ko
translationKey: screentoworldpoint-vs-ray
featured: false
draft: false
tags:
  - Unity
  - InputSystem
  - C#
  - 카메라
  - 입력
description: "FPS에서 커서를 숨겨 화면 중앙에 고정하고 그 지점에서 레이를 쏴 탄착점을 찾으려다 스크랩한 코드다. 원문은 z를 '카메라 기준으로 바꿔주는 보정'이라고 설명하는데, 문서는 그 z를 '결과 평면이 카메라에서 얼마나 떨어져 있는지'라고 적어둔다. 보정이 아니라 선택이고, 커서를 고정하면 그 값을 읽을 일조차 없어진다."
---

**FPS를 만들던 중에 스크랩한 코드다.** 커서를 숨겨서 화면 중앙에 고정해두고,
그 지점에서 레이를 쏴서 총알이 맞는 자리를 찾아야 했다. "화면의 한 점에서
월드 좌표를 얻는 방법"을 찾다가 이 글에 걸렸다.

결론부터 말하면 **그 목적에는 이 함수가 필요하지 않았다.** 커서를 중앙에
고정하는 순간 읽을 좌표가 고정되기 때문이고, 그 이야기는 아래에서 문서로
확인한다. 그래도 `Input.mousePosition`과 `ScreenToWorldPoint`는 결국 다른
자리에서 쓰게 되니 — 드래그, 배치, 2D 조작 — 이 글은 그 함수를 끝까지 파는
쪽으로 쓴다.

스크랩한 것은 마우스를 클릭한 자리의 월드 좌표를 얻는 여덟 줄짜리 코드다.
2018년 글이고, 짧은데도 필요한 걸 다 한다 — 화면 좌표를 읽고, `z`를 채우고,
월드 좌표로 바꾼다. **동작한다.** 영상까지 붙어 있고, perspective와
orthographic 양쪽에서 잘 따라간다.

그런데 가운데 한 줄의 **설명**이 문서와 다르다.

> 하지만 이렇게 얻는 좌표는 z 축의 문제가 있기 때문에 z 축을 카메라의 기준으로
> 바꿔주어야 합니다.

`z` 축에 **문제가 있는 게 아니다.** 문서는 그 값이 처음부터 무엇인지,
그리고 거기에 무엇을 넣으면 무슨 일이 일어나는지 둘 다 적어두고 있다.
`Input.mousePosition`의 `z`는 **항상 0**이고,
`Camera.ScreenToWorldPoint`의 `z`는 **결과 평면이 카메라에서 얼마나 떨어져
있는지**다. 그러니까 그 줄은 고장을 고치는 보정이 아니라, **점을 찍을 평면을
고르는 유일한 자리**다.

그리고 원문이 고른 값은 `farClipPlane`인데, 그건 문서 기준으로 **view
volume의 경계**다. 같은 계열 함수의 문서 예제는 같은 자리에
`nearClipPlane`을 쓴다.

파다 보니 `Camera`에서 화면 좌표를 받는 함수가 **z를 두 갈래로 대한다**는
것도 같이 나왔다. `ScreenToWorldPoint`와 `ViewportToWorldPoint`는 z를
**거리로 읽고**, `ScreenPointToRay`와 `ViewportPointToRay`는 **그냥
버린다.** 문서가 각각 "ignores the z coordinate", "position.z is ignored"로
적어뒀다. 인자 타입이 같아서 코드만 보면 구분이 안 되고, **FPS로 가는 길과
커서를 쓰는 길을 가르는 것이 정확히 이 구분**이다.

## 목차

## mousePosition의 z는 "문제"가 아니라 항상 0이다

`Input.mousePosition`이 `Vector3`인 이유가 문서에 적혀 있다.

> Input.mousePosition is a Vector3 for compatibility with functions that have
> Vector3 arguments.
>
> The z component of the Vector3 is always 0.
>
> — [Input.mousePosition](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)

**호환을 위한 모양**이다. 3차원 위치를 담고 있다가 z가 틀어진 게 아니라,
z 자리가 애초에 비어 있고 그 값이 0이다. 같은 페이지가 화면 좌표의 범위도
못 박아둔다.

> The bottom-left of the screen or window is at (0, 0).
>
> The top-right of the screen or window is at (Screen.width, Screen.height).

받는 쪽을 보면 그 0이 왜 쓸 수 없는 값인지가 바로 나온다.
`Camera.ScreenToWorldPoint`의 인자 설명이다.

> A 2D screen space point in pixels, plus a z coordinate for the distance from
> the camera in world units.
>
> — [Camera.ScreenToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)

`z`는 **카메라에서의 거리, 단위는 월드 유닛**이다. 그리고 같은 페이지가
그 거리가 들어가야 할 구간을 정해둔다.

> To make sure the world space point is part of the camera's view volume, the z
> coordinate you provide must be between the camera's nearClipPlane and
> farClipPlane.

`nearClipPlane`은 카메라보다 앞에 있으니, **0은 그 구간 밖이다.**
`mousePosition`을 그대로 넘기면 카메라와 near plane 사이의 점이 나온다.
문서는 그걸 "실패한다"고 적지 않는다 — **view volume 안에 있지 않을 뿐**이라고
적는다. 계산은 되고, 결과가 안 보이는 자리에 놓인다.

| 값 | 문서가 적어둔 것 | 그래서 |
|---|---|---|
| `Input.mousePosition.x`, `.y` | 픽셀, 왼아래 `(0, 0)` | 그대로 쓴다 |
| `Input.mousePosition.z` | "always 0" | 받는 함수가 거리로 읽으면 못 쓴다 |
| `ScreenToWorldPoint`의 `z` | "the distance from the camera in world units" | 내가 정해서 넣어야 한다 |
| 그 `z`의 허용 구간 | "between the camera's nearClipPlane and farClipPlane" | 0은 밖이다 |

원문의 `pos.z = Camera.main.farClipPlane;`은 그래서 **빼면 안 되는 줄**이다.
다만 그 줄이 하는 일이 "보정"은 아니다.

## z가 정하는 건 거리가 아니라 평면이다

`ScreenToWorldPoint`의 반환 설명이 "거리"보다 한 단어 더 많다.

> The world space point created by converting the screen space point at the
> provided distance z from the camera plane.
>
> — [Camera.ScreenToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)

**"from the camera plane"** — 카메라의 평면에서 z만큼이다. 같은 계열의
`ViewportToWorldPoint`는 이걸 더 노골적으로 쓴다.

> Note that ViewportToWorldPoint transforms an x-y screen position into a
> x-y-z position in 3D space.
>
> Provide the function with a vector where the x-y components of the vector are
> the screen coordinates and the z component is the distance of the resulting
> plane from the camera.
>
> — [Camera.ViewportToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportToWorldPoint.html)

**"the distance of the resulting plane from the camera"** — z가 고르는 것은
점 하나가 아니라 **평면 하나**다. 화면의 한 점은 카메라에서 뻗어나가는
선이고, z가 그 선을 어디서 끊을지를 정한다.

여기서 이 함수의 한계가 같이 보인다. **고를 수 있는 평면이 카메라에
평행한 것뿐이다.** 바닥처럼 **내가 방향을 정한 평면** 위의 점을 원하면
이 함수로는 안 된다. 그 길은 따로 있고, 이전 글에서 다뤘다 —
[바라볼 점을 정하는 건 레이가 아니라 평면이다](/posts/mouse-look-plane-raycast/)에서
`Plane`을 직접 만들어 `Raycast`로 끊는다.

그러니까 평면의 방향을 정하는 주체가 함수마다 다르다.
`ScreenToWorldPoint`와 `ViewportToWorldPoint`에서는 **카메라**가 방향을
정하고 내가 거리만 고른다. `Plane.Raycast`에서는 내가 만든 `Plane`이
방향까지 정하고, `Physics.Raycast`에서는 씬에 놓인 콜라이더가 정하고,
`RectTransformUtility`에서는 그 `RectTransform`이 정한다. 이 글이 다루는
것은 **카메라가 방향을 쥐고 있는 앞의 둘**이다.

## farClipPlane은 view volume의 경계고, 문서 예제는 nearClipPlane을 쓴다

원문이 `z`에 넣은 값이 `farClipPlane`이다. 그 프로퍼티의 문서는 이렇다.

> The distance of the far clipping plane from the Camera, in world units.
>
> The far clipping plane is furthest point of the Camera's view frustum.
>
> The Camera cannot see geometry that is further this distance.
>
> — [Camera.farClipPlane](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-farClipPlane.html)

그리고 `ScreenToWorldPoint`는 z가 near와 far **"between"**이어야 한다고
적었다. `farClipPlane`을 그대로 넣으면 그 구간의 **끝**이다. 문서가 "far를
넣으면 안 된다"고 적어둔 건 아니다 — 다만 "between"이라고 적어둔 구간의
경계선이고, 카메라가 **더 멀리는 못 보는** 거리다. 거기 놓인 오브젝트는
클리핑되는 쪽과 맞닿아 있다. (여기까지가 문서가 적은 것이고, **부동소수점
오차로 어느 쪽으로 떨어질지는 문서가 말하지 않는다.**)

재밌는 건 같은 계열 함수의 **문서 예제가 고른 값**이다.
`ViewportToWorldPoint` 페이지의 예제는 `(1, 1, nearClipPlane)`을 넣어서
화면 오른쪽 위 구석의 월드 좌표를 구한다 — 같은 자리에 **near**를 쓴다.

| z에 넣는 값 | 결과가 놓이는 자리 | 쓸모 |
|---|---|---|
| `0` (= `mousePosition.z`) | 카메라와 near plane 사이 | view volume 밖 |
| `nearClipPlane` | 보이는 구간의 시작 | 문서 예제가 쓰는 값 |
| 내가 정한 거리 (예: `10f`) | 그 거리의 평면 | 게임 로직이 원하는 값 |
| `farClipPlane` | 보이는 구간의 끝 | 데모에서는 보이지만 경계선 |
| `farClipPlane`보다 큰 값 | view volume 밖 | 안 보인다 |

**데모가 멀쩡해 보이는 이유도 여기 있다.** 화면의 한 점을 지나는 선 위라면
어느 거리에 놓아도 **카메라에서 보기엔 커서와 겹친다.** far plane에 놓인
오브젝트도 커서를 정확히 따라간다. 그런데 그 오브젝트의 월드 위치는 카메라의
`farClipPlane` 거리에 있다. 데모로는 맞고, **게임 로직으로는 그 거리가 의미를
가지기 어렵다.**

## perspective와 orthographic에서 z가 하는 일이 다르다

원문은 마지막에 이렇게 적는다.

> 실행하시면 카메라의 설정이 perspective 이던 orthographic 이던 언제나 위치
> 값을 잘 받아서 사용할 수 있습니다.

**맞다.** 다만 두 경우에 `z`가 하는 일이 같지 않다. 문서가 두 view volume의
**모양**을 다르게 적어뒀다.

> The word frustum refers to a solid shape that looks like a pyramid with the
> top cut off parallel to the base.
>
> Both perspective and orthographic cameras have a limit on how far they can
> "see" from their current position.
>
> the viewing volume of an orthographic camera is defined by a rectangular box
> extending between the two clipping planes.
>
> — [Understanding the view frustum](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

perspective는 **잘린 피라미드**, orthographic은 **직육면체**다.
`Camera.orthographic`이 무엇이 그 모양을 정하는지도 적어둔다.

> Is the camera orthographic (true) or perspective (false)?
>
> When ortho is true, camera's viewing volume is defined by orthographicSize.
>
> When orthographic is false, camera's viewing volume is defined by fieldOfView.
>
> — [Camera.orthographic](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)

문서가 적은 이 두 모양에서 따라오는 결론은 이렇다 — **여기부터는 문서 문장이
아니라 그 모양에서 나오는 추론이다.** 직육면체는 near에서나 far에서나 단면이
같으므로, orthographic에서 `z`를 바꾸면 **깊이만 바뀌고 x·y는 그대로다.**
잘린 피라미드는 단면이 멀어질수록 커지므로, perspective에서 `z`를 바꾸면
**x·y까지 같이 벌어진다.** 그래서 원문처럼 `farClipPlane`을 넣었을 때
perspective에서는 오브젝트가 아주 멀리, 아주 크게 흩어진 좌표로 가고,
orthographic에서는 깊이만 멀어진다.

그리고 orthographic에는 문서가 적어둔 **대가**가 하나 붙는다.

> NOTE: Deferred rendering is not supported when using Orthographic projection.
>
> If the camera's projection mode is set to Orthographic, the camera will always
> use Forward rendering.
>
> — [Camera.orthographic](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)

**orthographic 카메라는 항상 Forward다.** 원문이 "양쪽에서 잘 된다"고 쓸 때
빠진 부분이고, 2D 쪽 그리기 순서를 카메라가 어떻게 가르는지는
[그리기 순서를 정하는 건 둘이 아니라 셋이다](/posts/sorting-layer-order/)에서
따로 다뤘다.

| 투영 | view volume 모양 | 무엇이 정하나 | z를 바꾸면 | 렌더링 경로 |
|---|---|---|---|---|
| Perspective | 잘린 피라미드 (frustum) | `fieldOfView` | 깊이와 x·y가 함께 | 제한 없음 |
| Orthographic | 직육면체 (rectangular box) | `orthographicSize` | 깊이만 | 항상 Forward |

## 같은 Vector3를 ScreenPointToRay에 넣으면 z는 버려진다

`Camera`에는 화면 좌표를 받는 함수가 하나 더 있고, **인자 타입이 똑같다.**
그런데 `z`를 대하는 태도가 정반대다.

> A 3D point, with the x and y coordinates containing a 2D screen space point in
> pixels.
>
> Unity ignores the z coordinate.
>
> — [Camera.ScreenPointToRay](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)

**"Unity ignores the z coordinate."** 같은 `Vector3`를 만들어서 한쪽에 넣으면
평면을 고르는 값이고, 다른 쪽에 넣으면 **무시된다.** `pos.z = ...` 줄을
`ScreenPointToRay` 호출로 복사해 오면 아무 일도 하지 않는다.

버리는 대신 어디서 시작하는지는 고정되어 있다.

> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) pixel coordinates on the screen.

**near plane에서 시작한다.** 그래서 z를 받을 필요가 없다 — 거리를 고르는
일이 `Raycast` 쪽으로 넘어간 것이다. 그 길에서 평면을 직접 만들어 끊는
방법은 앞에서 링크한 글에 있다.

| 함수 | 인자의 z | 시작점 | 거리를 정하는 주체 |
|---|---|---|---|
| `Camera.ScreenToWorldPoint` | 카메라에서의 거리 | — | 내가 넣은 z |
| `Camera.ViewportToWorldPoint` | 결과 평면까지의 거리 | — | 내가 넣은 z |
| `Camera.ScreenPointToRay` | "Unity ignores the z coordinate" | near plane | `Raycast`의 교차 |

## 커서를 화면 중앙에 고정하면 mousePosition이 필요 없어진다

FPS에서 조준점은 화면 중앙에 붙어 있고 커서는 보이지 않는다. 그 상태를
만드는 프로퍼티의 문서가 **읽을 좌표까지 같이 정해버린다.**

> Determines whether the hardware pointer is locked to the center of the view,
> constrained to the window, or not constrained at all.
>
> A locked cursor is positioned in the center of the view and cannot be moved.
>
> The cursor is invisible in this state, regardless of the value of
> Cursor.visible.
>
> — [Cursor.lockState](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)

두 문장이 각각 하나씩 일을 덜어준다. **"cannot be moved"** — 움직이지
않는 값을 매 프레임 읽을 이유가 없다. **"invisible ... regardless of the
value of Cursor.visible"** — 숨기려고 `Cursor.visible = false`를 따로 쓸
필요도 없다. `Locked`면 그것만으로 안 보인다. 열거형 쪽 설명은 더 짧다.

> Locked: Locks the cursor to the center of the Game view.
>
> Confined: Confine cursor to the game window.
>
> None: Cursor behavior is unmodified.
>
> — [CursorLockMode](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CursorLockMode.html)

그러면 "화면 중앙"을 좌표로 어떻게 적나. `Screen.width / 2`를 쓰는 길도
있지만, 해상도에 안 묶이는 쪽이 따로 있다.

> Returns a ray going from camera through a viewport point.
>
> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) coordinates on the viewport (position.z is
> ignored).
>
> Viewport coordinates are normalized and relative to the camera.
>
> The bottom-left of the camera is (0,0); the top-right is (1,1).
>
> — [Camera.ViewportPointToRay](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportPointToRay.html)

**정규화 좌표라서 중앙이 `(0.5f, 0.5f)`로 고정이다.** 해상도가 바뀌어도,
창 크기가 바뀌어도 그대로다. 그리고 이쪽도 **`position.z is ignored`**다 —
`ScreenPointToRay`와 같은 태도고, `ScreenToWorldPoint` 계열만 z를 읽는다.

문서는 커서를 잠그는 일 자체에 대해서도 주의를 세 개 적어둔다.

> Note: Locking the cursor prevents the user from interacting with UI elements.
>
> The recommended best practice is to only lock or confine the cursor because of
> a user's action, such as pressing a button.
>
> The cursor state can be changed by the operating system or the Editor.
>
> In the Editor, the cursor loses focus in Game mode when you press Escape or
> when you switch an application.
>
> — [Cursor.lockState](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)

**UI와 같이 못 쓴다**는 것, **사용자 동작 없이 잠그지 말라**는 것, 그리고
**OS나 에디터가 상태를 바꿀 수 있다**는 것. 세 번째가 실무에서 제일 자주
문다 — 에디터에서 Esc를 누르거나 알트탭을 하면 잠금이 풀린다. 그래서 잠금을
한 번 걸어두고 잊는 코드는 틀리고, 포커스가 돌아올 때 상태를 다시 확인해야
한다. (`Confined`는 **"only supported on Windows and Linux standalone
builds"**라고 같은 페이지가 적어둔다.)

| 조준 방식 | 좌표를 어디서 얻나 | 해상도 의존 | 커서 |
|---|---|---|---|
| 커서를 따라가는 조준 (RTS·탑다운) | `Pointer.position` | 픽셀 | 보인다 |
| 화면 중앙 고정 (FPS) | `(0.5f, 0.5f)` 상수 | 없음 | `Locked` → 안 보인다 |
| 화면 중앙을 픽셀로 | `Screen.width / 2` 등 | 있음 | — |
| 조준점 UI를 따로 둔 경우 | 그 `RectTransform` | 레이아웃 | 보인다 |

## 돌아오는 길에는 z가 거리로 담겨 나온다

반대 방향 함수를 보면 이 설계가 한 벌로 맞춰져 있다는 게 보인다.

> Transforms position from world space into screen space.
>
> Screen space is defined in pixels.
>
> The z coordinate is the distance from the camera in world units.
>
> If position is outside the Camera's viewing volume, Unity returns a screen
> position that's off-screen.
>
> — [Camera.WorldToScreenPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.WorldToScreenPoint.html)

**나올 때도 z에 거리가 담긴다.** 즉 `WorldToScreenPoint`의 결과를 손대지 않고
`ScreenToWorldPoint`에 그대로 돌려주면 왕복이 성립한다 — z 자리에 이미 맞는
거리가 들어 있으니까. 반대로 `mousePosition`은 그 z 자리가 비어 있는
`Vector3`라서 왕복의 절반만 들고 오는 셈이다.

마지막 문장도 눈여겨볼 만하다. 볼 수 없는 위치를 넣어도 **예외가 아니라
화면 밖 좌표**가 돌아온다. `ScreenToWorldPoint`가 view volume 밖의 z에
대해서도 값을 내는 것과 같은 태도다.

| 방향 | 함수 | z의 역할 | 범위 밖일 때 |
|---|---|---|---|
| 화면 → 월드 | `ScreenToWorldPoint` | 내가 넣는 거리 | view volume 밖의 점 |
| 월드 → 화면 | `WorldToScreenPoint` | 돌려받는 거리 | "a screen position that's off-screen" |

## GetMouseButton은 "클릭"이 아니라 "누르고 있음"이다

원문 제목은 "마우스 클릭 좌표값"이고, 코드는 `Input.GetMouseButton(0)`을 쓴다.
그 둘이 같은 말이 아니다.

> Returns whether the given mouse button is held down.
>
> The return is true when the mouse button is pressed down, and false when
> released.
>
> — [Input.GetMouseButton](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButton.html)

**누르고 있는 동안 매 프레임 참이다.** 누른 순간 한 번만 원하면 다른 함수가
있다.

> Returns true during the frame the user pressed the given mouse button.
>
> It will not return true until the user has released the mouse button and
> pressed it again.
>
> Call this function from the MonoBehaviour.Update function, since the state
> gets reset each frame.
>
> — [Input.GetMouseButtonDown](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButtonDown.html)

원문 영상은 오브젝트가 커서를 **계속 따라다니는** 모양이니
`GetMouseButton`이 그 데모에 맞는 선택이다. 틀린 게 아니고, **제목의
"클릭"과 코드가 가리키는 동작이 다를 뿐**이다. 그 구분을 모르면 "클릭한
자리"를 기록하는 코드에 `GetMouseButton`을 그대로 옮겨 쓰게 된다.

그리고 두 페이지와 `Input.mousePosition`이 **같은 문장**을 달고 있다.

> Note: This API is part of the legacy Input Manager.
>
> The recommended best practice is that you don't use this API in new projects.
>
> For new projects, use the Input System package.

원문 코드에서 쓰는 세 가지가 전부 이 문장이 붙은 API다. Input System의
대응물은 이렇다.

> The current pointer coordinates in window space.
>
> — [Pointer.position](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)

> Whether the pointer is pressed down.
>
> For mice (Mouse), it means that the left button is pressed.
>
> — [Pointer.press](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)

> Whether the press started this frame.
>
> — [ButtonControl.wasPressedThisFrame](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

`isPressed` 쪽은 임계값을 기준으로 판정한다는 설명이 붙어 있다.

> A button is considered pressed if its value is equal to or greater than its
> button press threshold.
>
> — [ButtonControl.isPressed](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

그 임계값이 `started`와 `performed` 사이를 가르는 이야기는
[started와 performed 사이에 있는 건 press threshold다](/posts/input-action-phases/)에서
다뤘다. `wasPressedThisFrame`·`wasReleasedThisFrame`에는 **맨 처음 호출할
때의 주의사항**이 문서에 따로 적혀 있으니, 입력을 놓치면 안 되는 자리라면
그 문단을 직접 읽어보는 게 좋다.

갈아타면서 한 가지가 더 걸린다. `Pointer.position`이 내주는 값은
**`Vector2`**다. 그걸 `ScreenToWorldPoint`에 바로 넣으면 암묵적 변환으로
**z가 0이 된다** — 이름만 바뀐 같은 함정이다. z는 손으로 채워야 한다.

| 쓰던 것 | 문서가 적어둔 것 | Input System 쪽 |
|---|---|---|
| `Input.mousePosition` | "z component ... is always 0" | `Pointer.position` (`Vector2`) |
| `Input.GetMouseButton(0)` | "held down" | `Mouse.leftButton.isPressed` / `Pointer.press` |
| `Input.GetMouseButtonDown(0)` | "during the frame the user pressed" | `Mouse.leftButton.wasPressedThisFrame` |

## UI 위에서는 RectTransform의 평면을 쓰는 길이 있다

"평면을 고른다"는 이야기가 세 번째로 돌아온다. UI 위를 누른 자리를 월드
좌표로 알고 싶을 때는 전용 유틸리티가 있다.

> Transform a screen space point to a position in world space that is on the
> plane of the given RectTransform.
>
> — [RectTransformUtility.ScreenPointToWorldPointInRectangle](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RectTransformUtility.ScreenPointToWorldPointInRectangle.html)

**그 `RectTransform`이 놓인 평면**이 기준이다. 카메라에 평행한 평면도 아니고
내가 만든 `Plane`도 아니다. 반환값의 의미가 특히 중요하다.

> Returns true if the plane of the RectTransform is hit, regardless of whether
> the point is inside the rectangle.

**사각형 밖이어도 참이다.** 평면에 닿았는지만 본다. "버튼 위를 눌렀는가"로
쓰면 틀린다. 카메라 인자도 조건이 붙는다.

> The cam parameter should be the camera associated with the screen point.
>
> For a RectTransform in a Canvas set to Screen Space - Overlay mode, the cam
> parameter should be null.

`Screen Space - Overlay`에서는 **`null`을 넣어야 한다.** `Camera.main`을
습관처럼 넣으면 안 되는 자리다. 이벤트 핸들러 안에서라면 문서가 꺼낼 곳도
알려준다.

> the correct camera can be obtained by using PointerEventData.enterEventCamera
> (for hover functionality) or PointerEventData.pressEventCamera (for click
> functionality).

Canvas 안에서 좌표가 어떻게 자라는지는
[Content가 늘어나는 방향을 정하는 건 Anchor가 아니라 Pivot이다](/posts/ugui-scroll-view-content/)에서
다뤘다.

## 히트스캔으로 넘어가면 기본값 셋이 발목을 잡는다

조준점에서 레이를 쏘는 것까지는 `ViewportPointToRay` 한 줄이다. 그 레이로
무엇에 맞았는지 보는 쪽에 기본값이 숨어 있다. 선언을 그대로 보면 보인다.

> public static bool Raycast(Ray ray,
> out RaycastHit hitInfo,
> float maxDistance = Mathf.Infinity,
> int layerMask = DefaultRaycastLayers,
> QueryTriggerInteraction queryTriggerInteraction = QueryTriggerInteraction.UseGlobal);
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

**세 자리가 다 기본값을 갖고 있고, 셋 다 생략하면 가장 비싼 선택이 된다.**

`maxDistance`의 기본값이 `Mathf.Infinity`다. 문서는 그 인자를 **"The max
distance the ray should check for collisions."**라고만 적는다. 성능에 대한
문장은 이 페이지에 **없다** — 다만 사거리가 있는 총에 무한 사거리 레이를
쏘는 건 의도와 다르다. 사거리를 넣으면 그 사거리 밖은 애초에 검사 대상이
아니게 된다.

`layerMask`의 기본값은 `DefaultRaycastLayers`인데, **그게 어떤 레이어를
포함하는지는 이 페이지가 설명하지 않는다.** 이름만 보고 "기본 레이어"라고
읽으면 틀린다. 그 이름이 실제로 무엇을 거르고 무엇을 안 거르는지는
[OverlapSphere는 Ignore Raycast 레이어를 무시하지 않는다](/posts/physics-overlapsphere/)에서
따로 확인했다. 플레이어 자기 몸, 투명 벽, 데칼처럼 **맞아선 안 되는 것**이
마스크 없이 통과하면 탄착점이 총구 바로 앞에 생긴다.

`queryTriggerInteraction`의 기본값은 전역 설정을 따른다.

> Specifies whether queries (raycasts, spherecasts, overlap tests, etc.) hit
> Triggers by default.
>
> This can be overridden on a per-query level by specifying the
> QueryTriggerInteraction parameter.
>
> — [Physics.queriesHitTriggers](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics-queriesHitTriggers.html)

**전역 설정 하나가 모든 쿼리의 동작을 바꾼다.** 문서는 기본값을 적지 않으니
프로젝트에서 직접 확인해야 하고, 총알 판정만큼은 쿼리 단위로 명시하는 게
안전하다. 트리거 볼륨(사운드 존, 이벤트 트리거)에 총알이 맞으면 안 된다.

그리고 레이가 **어디서 시작하는지**에 걸리는 조건이 하나 더 있다.

> Raycasts will not detect Colliders for which the Raycast origin is inside the
> Collider.
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

`ViewportPointToRay`가 내주는 레이는 **near plane에서 시작한다.** 1인칭
카메라가 캐릭터 콜라이더 안에 들어가 있으면 그 콜라이더는 애초에 검출되지
않는다 — 자기 몸에 맞는 문제가 이 조건 때문에 저절로 안 생기는 경우가 있고,
반대로 **벽에 붙어 섰을 때 벽이 검출되지 않는** 경우도 같은 조건이다. 마스크로
막은 게 아니라 기하 때문에 안 잡히는 것이니, 마스크를 믿고 있으면 위치가
바뀔 때 깨진다.

마지막으로 **어느 함수에서 쏘는지**다. 같은 페이지의 Notes에 한 줄이 있다.

> In all these examples FixedUpdate is used rather than Update.
>
> Refer to Order of execution for event functions to understand the difference
> between Update and FixedUpdate,
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

문서 예제가 `Update`가 아니라 `FixedUpdate`를 쓴다고 **밝혀서** 적어뒀다.
입력은 `Update` 주기로 들어오고 물리는 `FixedUpdate` 주기로 돈다. 사격 입력을
받은 프레임에 바로 쏘고 싶으면 `Update`에서 쏘게 되는데, 그러면 그 시점의
콜라이더 위치가 직전 물리 스텝의 위치라는 것을 알고 있어야 한다. 문서는
어느 쪽이 맞다고 적지 않고 **차이를 알고 고르라고 적는다.**

| 인자 / 자리 | 기본값 | 생략하면 | 히트스캔에서 |
|---|---|---|---|
| `maxDistance` | `Mathf.Infinity` | 무한 사거리 | 총의 사거리를 넣는다 |
| `layerMask` | `DefaultRaycastLayers` | 문서가 내용을 안 밝힘 | 명시한다 |
| `queryTriggerInteraction` | `UseGlobal` | 전역 설정에 끌려감 | 쿼리 단위로 명시 |
| 레이의 origin | near plane | 안에 든 콜라이더는 미검출 | 조건을 알고 쓴다 |
| 호출 위치 | — | — | `Update`/`FixedUpdate` 차이를 알고 고른다 |

## 맞은 자리를 클라이언트가 정하면 안 된다

여기까지는 전부 **한 대의 기기 안에서** 맞는 이야기다. 멀티플레이어가 되면
같은 코드의 의미가 바뀐다. 조준점에서 레이를 쏘아 "여기 맞았다"를 계산하는
주체가 클라이언트이기 때문이다. Mirror 문서가 이 지점을 직접 다룬다.

> Mirror is server authoritative by default.
>
> As rule of thumb, never trust the client!
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

그리고 **조준을 예시로 들어서** 적어둔다.

> an Aim Bot can pretend to move the cursor onto another player more quickly
>
> since the server trusts the client with moving the cursor, it opens up for
> cheating with no easy solution
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

**"no easy solution"**이라고 적혀 있다. 과장하지 말자 — 이 글이 다루는
좌표 변환 코드를 어떻게 쓰든 에임봇이 막히지는 않는다. 문서가 말하는 것은
**어디까지를 클라이언트에게 맡기느냐**가 선택이고, 그 선택이 남는 위험을
정한다는 쪽이다.

실무에서 선을 긋는 자리는 이렇게 갈린다. 클라이언트가 보내는 것이
**"내가 맞춘 대상과 데미지"**면 그 값을 믿는 것이고, **"내가 본 방향과
시각"**이면 서버가 다시 계산할 수 있다. 후자를 고르면 이 글의 레이 계산이
서버에서 한 번 더 돌아간다 — 그래서 `ViewportPointToRay`처럼 **카메라에
의존하는 함수**를 서버 쪽 판정에 그대로 쓸 수 없다는 제약이 따라온다.
서버에는 그 클라이언트의 카메라가 없으니, 넘어가는 것은 화면 좌표가 아니라
**월드 공간의 방향 벡터**여야 한다.

보내는 값을 서버가 그냥 받아 쓰는 것도 아니다.

> we need to validate any input
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

방향 벡터라도 검증할 게 남는다 — 정규화되어 있는지, 사거리가 총의 사거리를
넘지 않는지, 발사 간격이 연사 속도를 넘지 않는지. 어느 쪽이 서버에서
실행되는지는 애트리뷰트가 정하는데, 그게 곧 안전을 뜻하지는 않는다.

> Command: Call this from a client to run this function on the server.
>
> Server: Only a server can call the method (throws a warning when called on a
> client).
>
> — [Attributes — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)

`[Command]`가 붙으면 **서버에서 실행되지만 인자는 클라이언트가 채운다.**
그 구분을 짚은 글이 따로 있다 —
[Mirror의 Command와 RPC: 서버에서 실행된다는 게 안전하다는 뜻은 아니다](/posts/mirror-remote-actions/).

| 클라이언트가 보내는 것 | 서버가 하는 일 | 남는 위험 |
|---|---|---|
| "대상 A를 맞췄고 데미지 30" | 그대로 적용 | 임의의 대상·수치를 주장할 수 있다 |
| "이 방향으로 쐈다" (월드 방향) | 레이를 다시 쏜다 | 조준 자체의 조작(에임봇) |
| "이 화면 좌표에서 쐈다" | 재계산 불가 | 서버에 그 카메라가 없다 |
| 발사 시각·간격 | 연사 속도와 대조 | 시계 조작 — 서버 시각 기준으로 본다 |

## 어디에 왜 쓰나

`ScreenToWorldPoint`는 화면의 한 점을 **카메라에서 정해진 거리만큼 앞**에
놓고 싶을 때 쓴다. 커서를 따라다니는 마커, 드래그로 끌고 다니는 2D
오브젝트, 화면 구석에 맞춰 배치하는 이펙트 — 평면의 방향이 카메라와 같아도
되는 경우다. 바닥·벽처럼 **방향이 정해진 면** 위의 점이 필요하면 이 함수가
아니고, FPS처럼 **조준점이 화면 중앙에 고정**이면 좌표를 읽을 일조차 없다.

### 동작하는 예제

두 길을 한 스크립트에 넣었다. `_aimAtScreenCenter`를 켜면 커서를 잠그고
**뷰포트 중앙에서 레이를 쏴 콜라이더에 맞은 점**을 쓴다(FPS 히트스캔).
끄면 **커서 위치를 지정한 깊이의 평면에 찍는다**(원문의 길). `z`는
`farClipPlane`이 아니라 인스펙터에서 정하는 거리이고, 런타임에 near~far
구간으로 다시 가둔다.

```csharp file="Scripts/Input/ScreenPointAimer.cs"
using UnityEngine;
using UnityEngine.InputSystem;

public class ScreenPointAimer : MonoBehaviour
{
    private const float MinDepth = 0.01f;
    private const float ViewportCenter = 0.5f;

    [Header("대상")]
    [Tooltip("맞은 자리로 옮길 표식")]
    [SerializeField]
    private Transform _marker;

    [Header("조준")]
    [Tooltip("켜면 커서를 중앙에 잠그고 뷰포트 중앙에서 쏜다(FPS). 끄면 커서 위치를 쓴다")]
    [SerializeField]
    private bool _aimAtScreenCenter;

    [Header("평면 모드 — 커서 위치를 쓸 때")]
    [Tooltip("카메라에서 몇 월드 유닛 앞의 평면에 찍을지. 런타임에 near~far로 가둔다")]
    [Min(MinDepth)]
    [SerializeField]
    private float _depth = 10f;

    [Tooltip("켜면 누르고 있는 동안 계속 따라간다. 끄면 누른 프레임에만 옮긴다")]
    [SerializeField]
    private bool _followWhileHeld;

    [Header("히트스캔 모드 — 중앙 조준일 때")]
    [Tooltip("총의 사거리. 기본값 Mathf.Infinity를 그대로 쓰지 않는다")]
    [Min(MinDepth)]
    [SerializeField]
    private float _range = 100f;

    [Tooltip("맞아야 하는 레이어만 켠다. DefaultRaycastLayers에 맡기지 않는다")]
    [SerializeField]
    private LayerMask _hittableLayers = ~0;

    [Header("로그")]
    [Tooltip("켜면 찍은 월드 좌표를 남긴다")]
    [SerializeField]
    private bool _logPlacement;

    private Camera _camera;

    private void Awake()
    {
        // UnityEngine.Object에는 ?. 를 쓰지 않는다. 파괴된 객체가 null이
        // 아닌 것처럼 보이는 경우를 비교 연산자가 처리해준다.
        _camera = Camera.main;
        if (_camera == null)
        {
            Debug.LogError("MainCamera 태그가 붙은 활성 카메라가 없다.", this);
        }

        if (_marker == null)
        {
            Debug.LogError("_marker가 비어 있다.", this);
        }
    }

    private void OnEnable()
    {
        ApplyCursorState();
    }

    private void OnApplicationFocus(bool hasFocus)
    {
        // 문서가 "The cursor state can be changed by the operating system or
        // the Editor"라고 적어뒀다. 포커스가 돌아올 때 다시 걸어준다.
        if (hasFocus) { ApplyCursorState(); }
    }

    private void ApplyCursorState()
    {
        // Locked는 Cursor.visible 값과 무관하게 커서를 숨긴다.
        Cursor.lockState = _aimAtScreenCenter
            ? CursorLockMode.Locked
            : CursorLockMode.None;
    }

    private void Update()
    {
        if (_camera == null || _marker == null) { return; }

        if (_aimAtScreenCenter)
        {
            UpdateCenterAim();
            return;
        }

        UpdateCursorPlacement();
    }

    private void UpdateCenterAim()
    {
        Mouse mouse = Mouse.current;
        if (mouse == null || !mouse.leftButton.wasPressedThisFrame) { return; }

        // 뷰포트 좌표는 정규화라서 중앙이 해상도와 무관하게 (0.5, 0.5)다.
        // 세 번째 성분은 문서가 ignored라고 적어둔 자리다.
        Ray aimRay = _camera.ViewportPointToRay(
            new Vector3(ViewportCenter, ViewportCenter, 0f));

        // maxDistance·layerMask·트리거 처리를 전부 명시한다.
        bool hit = Physics.Raycast(
            aimRay,
            out RaycastHit hitInfo,
            _range,
            _hittableLayers,
            QueryTriggerInteraction.Ignore);

        if (!hit)
        {
            // 빗나간 경우에도 탄착점이 필요하면 사거리 끝을 쓴다.
            Place(aimRay.GetPoint(_range), "사거리 끝");
            return;
        }

        Place(hitInfo.point, hitInfo.collider.name);
    }

    private void UpdateCursorPlacement()
    {
        Mouse mouse = Mouse.current;
        if (mouse == null) { return; }

        bool pressed = _followWhileHeld
            ? mouse.leftButton.isPressed
            : mouse.leftButton.wasPressedThisFrame;
        if (!pressed) { return; }

        // position은 Vector2다. 그대로 Vector3에 넣으면 z가 0이 되고,
        // 0은 nearClipPlane보다 앞이라 view volume 밖이다.
        Vector2 screenPoint = mouse.position.ReadValue();

        // [Min]은 인스펙터 전용이다. 코드로 대입한 값은 막지 못하므로
        // 런타임에 다시 가둔다.
        float depth = Mathf.Clamp(
            _depth, _camera.nearClipPlane, _camera.farClipPlane);

        Vector3 screenPointWithDepth =
            new Vector3(screenPoint.x, screenPoint.y, depth);

        Place(_camera.ScreenToWorldPoint(screenPointWithDepth), $"깊이 {depth}");
    }

    private void Place(Vector3 worldPoint, string reason)
    {
        _marker.position = worldPoint;

        if (_logPlacement)
        {
            Debug.Log($"{reason} → world = {worldPoint}", this);
        }
    }
}
```

`Mathf.Clamp`를 쓴 자리에 대해 한 가지. `[Min]`은 **인스펙터에서만** 값을
막는다. 다른 스크립트가 `_depth`에 음수를 대입하면 그대로 들어가므로,
실제 가드는 런타임 쪽이어야 한다. `Clamp`가 인자 순서에 따라 어떻게
달라지는지는 [Clamp이 두 개다: 인자를 거꾸로 주면 한쪽만 예외를 던진다](/posts/mathf-clamp/)에
적어뒀다 — 여기서는 `nearClipPlane < farClipPlane`이 보장되므로 순서 문제가
없다.

`Camera.main`을 `Awake`에서 한 번만 읽는 이유는 문서가 적어둔 비용 때문이다.

> Accessing this property has a small CPU overhead, comparable to calling
> GameObject.GetComponent.
>
> Where CPU performance is important, consider caching this property.
>
> — [Camera.main](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)

원문 코드는 `Update` 안에서 `Camera.main`을 **두 번** 읽는다. 이 프로퍼티에
대한 통념과 현행 문서가 어떻게 다른지는
[바라볼 점을 정하는 건 레이가 아니라 평면이다](/posts/mouse-look-plane-raycast/)에서
따로 짚었다.

### 무엇을 고르나

| 하고 싶은 일 | 쓸 것 | 왜 |
|---|---|---|
| 카메라에서 d만큼 앞의 평면에 찍기 | `ScreenToWorldPoint(new Vector3(x, y, d))` | z가 그 평면을 고른다 |
| 정규화 좌표(0~1)로 같은 일 | `ViewportToWorldPoint` | 왼아래 `(0,0)`, 오른위 `(1,1)` |
| 바닥처럼 방향이 정해진 평면 위의 점 | `ScreenPointToRay` + `Plane.Raycast` | 평면의 방향을 내가 정한다 |
| 실제 콜라이더에 닿은 점 | `ScreenPointToRay` + `Physics.Raycast` | `RaycastHit.point` |
| UI(`RectTransform`) 평면 위의 점 | `ScreenPointToWorldPointInRectangle` | 그 `RectTransform`의 평면 |
| 월드 점이 화면 어디에 보이는지 | `WorldToScreenPoint` | 반환 z가 카메라에서의 거리 |
| 조준점이 **화면 중앙 고정**(FPS) | `ViewportPointToRay((0.5f, 0.5f, 0f))` | 해상도와 무관한 상수 |
| 그때 커서 숨기기 | `Cursor.lockState = CursorLockMode.Locked` | `Cursor.visible`과 무관하게 숨는다 |
| 누른 **순간** 한 번 | `wasPressedThisFrame` | "the press started this frame" |
| 누르고 **있는 동안** 매 프레임 | `isPressed` / `Pointer.press` | "currently pressed" |
| 레이 수천 개를 한꺼번에 | `RaycastCommand` | 잡으로 배치 실행 |

판단 순서는 이렇게 둔다.

1. **평면의 방향을 내가 정해야 하나?** 그렇다면 `ScreenToWorldPoint`가
   아니다. `Plane.Raycast`나 `Physics.Raycast`로 간다.
2. **카메라에 평행한 평면이면 충분한가?** 그렇다면 z에 **의미 있는 거리**를
   넣는다. `farClipPlane`은 의미 있는 거리가 아니다.
3. **그 거리를 인스펙터로 빼고 런타임에 가둔다.** near~far 밖의 z는 조용히
   보이지 않는 결과를 낸다.
4. **조준점이 화면 중앙에 고정인가?** 그렇다면 좌표를 읽지 말고
   `(0.5f, 0.5f)`를 쓴다. 커서는 `Locked`로 잠근다.
5. **입력은 Input System으로 읽는다.** 세 API 전부 문서가 새 프로젝트에는
   쓰지 말라고 적어뒀다.
6. **멀티플레이어면 판정 주체를 먼저 정한다.** 클라이언트가 보내는 것을
   좌표가 아니라 **월드 방향**으로 두면 서버가 다시 계산할 수 있다.

### 더 가져갈 길

지금 돌아가는 코드에서 한 걸음씩 더 가는 순서다. 아래 셋은 **문서가
지원한다고 적어둔 것**과 **설계 선택**을 구분해서 적었다.

**하나 — 폴링을 콜백으로 바꾼다.** 예제는 `Update`에서 매 프레임 버튼을
본다. Input System의 액션을 쓰면 눌린 프레임에만 호출되고, 버튼 하나가
`started`·`performed`·`canceled`로 갈라진다. 그 경계가 어디서 결정되는지는
[started와 performed 사이에 있는 건 press threshold다](/posts/input-action-phases/)에
적어뒀다.

**둘 — 레이가 많아지면 배치로 돌린다.** 산탄·관통·AI 시야처럼 한 프레임에
레이가 수십~수천 개 나가면 전용 구조체가 있다.

> Struct used to set up a raycast command to be performed asynchronously during
> a job.
>
> When you use this struct to schedule a batch of raycasts, they will be
> performed asynchronously and in parallel
>
> Since the results are written asynchronously the results buffer cannot be
> accessed until the job has been completed.
>
> — [RaycastCommand](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastCommand.html)

**결과를 같은 프레임에 바로 읽을 수 없다**는 제약이 따라온다. 총 한 자루의
히트스캔 한 발에는 과하고, **맞은 뒤 한 프레임 늦어도 되는** 판정이 많을 때
의미가 있다. 결과 버퍼 읽는 규칙도 문서가 정해뒀다 — **"The results for a
command at index N in the command buffer are stored at index N * maxHits in the
results buffer."**이고, **"the loop should stop when the first invalid result is
found."**다. 그리고 프로파일러에는 **"Only BatchQuery.ExecuteRaycastJob is
logged"**라고 적혀 있으니, 쿼리 개수를 프로파일러에서 세려는 계획은 세우지
않는 게 좋다.

**셋 — 판정을 서버로 옮긴다.** 위에서 다룬 선 긋기다. 클라이언트는 월드
방향과 발사 시각만 보내고, 서버가 `Physics.Raycast`를 다시 돌린다. 카메라에
의존하는 `ViewportPointToRay`는 이 단계에서 **클라이언트 쪽에만** 남는다.

### 쓰지 말아야 할 자리

- **`Input.mousePosition`을 그대로 넘기는 자리.** z가 0이고, 0은
  `nearClipPlane`보다 앞이다. 문서가 요구하는 구간 밖이다.
- **`farClipPlane`을 기본값처럼 쓰는 자리.** 데모에서는 커서와 겹쳐 보이지만
  오브젝트는 카메라가 더 멀리는 못 보는 거리에 놓인다.
- **`ScreenPointToRay`에 z를 채워 넣는 자리.** "Unity ignores the z
  coordinate."
- **바닥·벽 위의 점을 구하는 자리.** 카메라에 평행한 평면밖에 못 고른다.
- **버튼 위를 눌렀는지 판정하는 자리에
  `ScreenPointToWorldPointInRectangle`.** 사각형 밖이어도 참을 돌려준다.
- **`Screen Space - Overlay` Canvas에 `Camera.main`을 넘기는 자리.** 문서가
  `null`을 넣으라고 적어뒀다.
- **Deferred를 기대하면서 orthographic으로 두는 자리.** 문서가 지원되지
  않는다고 적어뒀고, 항상 Forward가 된다.
- **새 프로젝트의 `Input.GetMouseButton` / `Input.mousePosition`.** 세
  페이지가 같은 문장으로 권하지 않는다고 적어뒀다.
- **조준점이 화면 중앙에 고정인데 커서 좌표를 읽는 자리.** 문서가 잠긴
  커서는 **"cannot be moved"**라고 적어뒀다. 읽을 값이 고정이다.
- **커서를 잠근 채로 UI를 띄우는 자리.** 문서가 **"Locking the cursor
  prevents the user from interacting with UI elements."**라고 적어뒀다.
- **잠금을 한 번 걸고 잊는 자리.** OS와 에디터가 상태를 바꾼다. 포커스가
  돌아올 때 다시 확인해야 한다.
- **`Cursor.visible = false`를 `Locked`와 같이 쓰는 자리.** `Locked`면
  `Cursor.visible` 값과 무관하게 안 보인다.
- **히트스캔에서 `maxDistance`·`layerMask`를 생략하는 자리.** 기본값이
  무한 사거리와 내용이 밝혀지지 않은 마스크다.
- **클라이언트가 계산한 "맞은 대상과 데미지"를 서버가 그대로 적용하는
  자리.** Mirror 문서의 표현은 **"never trust the client!"**다.
- **화면 좌표를 서버로 보내는 자리.** 서버에는 그 클라이언트의 카메라가
  없어서 재계산할 수 없다.
- **`RaycastCommand`의 결과를 같은 프레임에 읽으려는 자리.** 잡이 끝나기
  전에는 버퍼를 읽을 수 없다고 문서가 적어뒀다.

## 정리

- `Input.mousePosition`의 z는 고장이 아니라 **"always 0"**이다. `Vector3`인
  이유도 문서가 호환이라고 적어뒀다.
- `ScreenToWorldPoint`의 z는 **"the distance from the camera in world
  units"**이고, near와 far **사이**여야 한다. 0은 그 밖이다.
- 그 z가 고르는 것은 거리가 아니라 **평면**이다 — `ViewportToWorldPoint`가
  "the distance of the resulting plane from the camera"라고 적어뒀다.
  그리고 그 평면은 **카메라에 평행한 것뿐**이다.
- `farClipPlane`은 구간의 **경계**다. 문서 예제는 같은 자리에
  `nearClipPlane`을 쓴다.
- perspective는 **잘린 피라미드**, orthographic은 **직육면체**다. 그래서
  z를 바꿀 때 전자는 x·y까지 벌어지고 후자는 깊이만 바뀐다. orthographic은
  **항상 Forward**로 렌더링된다.
- 같은 `Vector3`를 `ScreenPointToRay`에 넣으면 **"Unity ignores the z
  coordinate."** 레이는 near plane에서 시작한다.
- 돌아오는 길인 `WorldToScreenPoint`는 **z에 거리를 담아서** 돌려준다.
  범위 밖이면 예외가 아니라 화면 밖 좌표다.
- `GetMouseButton`은 **"held down"**이고 `GetMouseButtonDown`이 **"during
  the frame the user pressed"**다. 제목의 "클릭"에 맞는 쪽은 후자다.
- UI 평면 위의 점은 `ScreenPointToWorldPointInRectangle`이고, **사각형
  밖이어도 참**을 돌려준다. `Screen Space - Overlay`에서는 카메라에 `null`을
  넣는다.
- **커서를 `Locked`로 잠그면 좌표를 읽을 일이 없어진다.** 문서가
  **"positioned in the center of the view and cannot be moved"**이고
  **"invisible ... regardless of the value of Cursor.visible"**이라고
  적어뒀다. 중앙은 `ViewportPointToRay((0.5f, 0.5f, 0f))`로 적고, 이쪽도
  z는 **"ignored"**다.
- 잠금은 **사용자 동작으로만** 걸고, **OS·에디터가 바꿀 수 있다**는 것을
  전제로 포커스 복귀 때 다시 확인한다. UI와는 같이 못 쓴다.
- 히트스캔으로 가면 `Physics.Raycast`의 **기본값 셋**이 문제가 된다 —
  `Mathf.Infinity` 사거리, 내용이 밝혀지지 않은 `DefaultRaycastLayers`,
  전역 설정을 따르는 트리거 처리. 셋 다 명시한다.
- 레이의 origin은 near plane이고, **"Raycasts will not detect Colliders for
  which the Raycast origin is inside the Collider."**다. 마스크로 막은 게
  아니라 기하 때문에 안 잡히는 경우를 구분해야 한다.
- 문서 예제가 `FixedUpdate`를 쓴다고 **밝혀서** 적어뒀다. 입력 주기와 물리
  주기가 다르다는 것을 알고 고르라는 뜻이다.
- 멀티플레이어에서는 **"never trust the client!"**다. 클라이언트가 보내는
  것을 화면 좌표가 아니라 **월드 방향**으로 두면 서버가 재계산할 수 있다.
  에임봇 자체는 Mirror 문서도 **"no easy solution"**이라고 적는다.
- 레이가 아주 많아지면 `RaycastCommand`로 배치 실행하되, **결과를 같은
  프레임에 읽을 수 없다**는 제약을 받아들여야 한다.

---

### 참고

- [Camera.ScreenToWorldPoint — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)
- [Camera.ViewportToWorldPoint — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportToWorldPoint.html)
- [Camera.WorldToScreenPoint — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.WorldToScreenPoint.html)
- [Camera.ScreenPointToRay — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)
- [Camera.farClipPlane — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-farClipPlane.html)
- [Camera.nearClipPlane — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-nearClipPlane.html)
- [Camera.orthographic — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)
- [Camera.main — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)
- [Understanding the view frustum — Unity 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)
- [Camera component — Unity 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-Camera.html)
- [Input.mousePosition — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)
- [Input.GetMouseButton — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButton.html)
- [Input.GetMouseButtonDown — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButtonDown.html)
- [RectTransformUtility.ScreenPointToWorldPointInRectangle — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RectTransformUtility.ScreenPointToWorldPointInRectangle.html)
- [Cursor.lockState — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)
- [CursorLockMode — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CursorLockMode.html)
- [Camera.ViewportPointToRay — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportPointToRay.html)
- [Physics.Raycast — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)
- [Physics.queriesHitTriggers — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics-queriesHitTriggers.html)
- [RaycastCommand — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastCommand.html)
- [Cheats & Anticheats — Mirror 문서](https://mirror-networking.gitbook.io/docs/security/cheating)
- [Attributes — Mirror 문서](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)
- [Pointer — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)
- [ButtonControl — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

원문 클리핑은 라마 탄 참새의 네이버 블로그 글
[지랄하는 프로그래머 #06 \[Unity3D/유니티 3D\] 마우스 클릭 좌표값 얻어오기](https://m.blog.naver.com/bsheep91/221320005889)(2018-07-16)다.
여덟 줄로 할 일을 다 하는 코드고, `z`를 비워둔 채 넘기는 흔한 실수를 하지
않는다. 이 글은 그 코드가 맞다는 걸 확인한 뒤, 가운데 한 줄의 **설명**을
현행 문서와 대조한 기록이다. 문서는 그 자리를 보정이라고 부르지 않고,
**결과 평면을 고르는 거리**라고 부른다.

찾던 목적 — FPS에서 중앙 고정 조준점으로 탄착점을 구하는 일 — 에는 결국 이
함수가 쓰이지 않았다. 커서를 잠그면 좌표가 상수가 되고, 상수를 넣는 길은
`ViewportPointToRay` 쪽이기 때문이다. **찾던 답이 아니었다는 것까지가
확인의 결과다.**
