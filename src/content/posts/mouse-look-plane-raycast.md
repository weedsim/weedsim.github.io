---
pubDatetime: 2026-10-13T17:10:00+09:00
title: "바라볼 점을 정하는 건 레이가 아니라 평면이다"
lang: ko
translationKey: mouse-look-plane-raycast
featured: false
draft: false
tags:
  - Unity
  - InputSystem
  - C#
  - 입력
  - 카메라
description: "탑다운 조작을 쓰려고 방법을 찾던 중 스크랩한, 마우스 쪽을 바라보게 하는 짧은 코드다. 방법이 맞는데, 평면을 원점에 두고 높이를 따로 끼워 넣는 모양이 되었다. 평면을 오브젝트 위치에 두면 그 보정이 사라진다."
---

**탑다운 조작을 쓰려고** 방법을 찾던 중에, 원문의 예와 똑같이 마우스 커서
쪽을 바라보게 하는 짧은 코드를 스크랩해뒀다. 2023년 글이고 함수 하나에 주석이
꼼꼼하다. **방법이 맞다** — 화면 좌표에서
레이를 쏘고, 수학적인 평면과 교차시켜서 월드 좌표를 얻는다. `z`를 짐작해서
`ScreenToWorldPoint`에 넣는 흔한 실수를 하지 않았고, 교차에 실패했을 때를
`if`로 걸러낸다.

그런데 마지막 줄이 이렇다.

> transform.LookAt(new Vector3(_lookDir.x, transform.position.y, _lookDir.z));

**교차점을 얻어놓고 Y만 자기 위치로 바꿔 끼운다.** 왜 그래야 하는지는 주석에
없다. 그 보정이 필요한 이유가 두 함수의 문서에 나뉘어 적혀 있고, **평면을
만드는 자리를 한 줄 바꾸면 보정 자체가 사라진다.** 거기서 시작한다.

이 블로그에 입력 글이 넷 있고 전부 Input System 쪽이다. 가장 가까운 자리가
[InputAction을 직접 구독하기: 델리게이트로 다루는 입력의 수명](/posts/input-action-subscribe/)이다.
이 글의 클리핑은 **구형 Input Manager의 `Input` 클래스**를 쓰는데, 그 API
문서가 쓰지 말라고 적어둔 상태다. 그 이야기도 아래에 한 절로 있다.

확인한 것은 여섯 가지다. **레이는 근평면에서 출발하고 `z`는 무시된다**,
**`LookAt`이 기울어지는 조건이 문서에 적혀 있다**, **`Plane.Raycast`가 거짓을
돌려주는 경우가 둘이고 `enter` 값이 서로 다르다**, **`Input.mousePosition`은
문서가 새 프로젝트에서 쓰지 말라고 적어둔 API다**, **`Camera.main`에 대한
통념이 현행 문서와 다르다**, 그리고 **`LookAt`은 즉시 돌아가고 문서에 보간은
없다.**

확인 시점은 **2026-10-13**이고, 기준은 Unity **6.6**, Input System
**1.20**이다.

## 목차

## 레이는 화면에서 나오고, 점은 평면에서 나온다

첫 줄의 함수가 무엇을 돌려주는지부터 보자.

> Returns a ray going from camera through a screen point.

> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) pixel coordinates on the screen.

**근평면에서 출발한다**는 것과 **월드 공간**이라는 것이 적혀 있다. 인자
설명에 한 줄이 더 있다.

> A 3D point, with the x and y coordinates containing a 2D screen space point
> in pixels.

> Unity ignores the z coordinate.

**`z`는 무시된다.** 클리핑이 넘기는 `Input.mousePosition`도 마침 `z`가 항상
0이라 문제가 없다. 다만 이 두 문장이 함께 중요한 이유가 있다 — **레이만으로는
월드의 한 점이 정해지지 않는다.** 레이는 방향이고, 점은 그 레이를 어딘가에서
끊어야 나온다. 끊는 역할이 평면이다.

> public bool Raycast(Ray ray, out float enter);

> This function sets `enter` to the distance along the ray, where it intersects
> the plane.

그리고 그 거리를 점으로 바꾸는 함수가 따로 있다.

> Returns a point at `distance` units along the ray.

`Ray.GetPoint`다. 즉 순서가 **화면 좌표 → 레이 → (평면과의) 거리 → 점**이고,
**어느 평면을 고르느냐가 마지막 점을 결정한다.** 클리핑의 주석은 이 구조를
정확히 설명한다. 다음 절이 "어느 평면"에 대한 이야기다.

표기에 대해 짚어둘 것이 하나 있다. 두 페이지가 화면의 끝을 다르게 적는다.
`ScreenPointToRay`의 인자 설명은 이렇다.

> The upper right pixel of the screen is (screen width in pixels - 1, screen
> height in pixels - 1).

`Input.mousePosition` 쪽은 이렇다.

> The top-right of the screen or window is at (Screen.width, Screen.height).

**한 픽셀이 다르다.** 하나는 "오른쪽 위 픽셀"이고 하나는 "화면의 오른쪽 위"라
가리키는 것이 같지 않을 수 있는데, 두 서술을 한 문장으로 맞춰둔 자리는 찾지
못했다. 실무에서 한 픽셀이 문제가 되는 경우는 드물지만, 화면 경계를 직접
계산하는 코드라면 알아둘 만하다.

## 평면을 원점에 두면 높이를 다시 맞춰야 한다

클리핑이 평면을 이렇게 만든다.

> Plane _plane = new Plane(Vector3.up, Vector3.zero);

생성자 설명을 보면 두 인자가 무엇인지 분명하다.

> Resulting plane has normal `inNormal` and goes through a point `inPoint`.

> `inNormal` must be a normalized vector.

**법선이 `Vector3.up`이고 `Vector3.zero`를 지나는 평면** — 즉 `y = 0`이다.
클리핑의 주석도 그렇게 적는다. 다만 그 주석에 가정이 하나 섞여 있다.

> y=0인 평면 == 씬에서 오브젝트들이 배치되어 있는 평면

**이건 사실이 아니라 가정이다.** 캐릭터가 `y = 0`에 있을 때만 맞는다. 언덕
위에 있거나, 캡슐 콜라이더 때문에 피봇이 떠 있거나, 층이 있는 맵이면
교차점은 캐릭터보다 아래에서 잡힌다.

그러면 왜 기울어지는가. `LookAt`의 설명 네 문장 중 마지막이 그 답이다.

> Rotates the transform so the forward vector points at `worldPosition`.

> Then it rotates the transform to point its up direction vector in the
> direction hinted at by the `worldUp` vector.

> If you leave out the `worldUp` parameter, the function will use the world y
> axis.

> The up vector of the rotation will only match the `worldUp` vector if the
> forward direction is perpendicular to `worldUp`.

**forward가 `worldUp`에 수직일 때만 up이 `worldUp`과 일치한다.** 캐릭터가
`y = 1`에 있고 교차점이 `y = 0`이면 forward가 아래로 기울고, 그래서 캐릭터가
앞으로 숙인다. 클리핑의 마지막 줄은 **그 조건을 만족시키려고 Y를 자기
높이로 바꿔 끼운 것**이다. 보정의 정체가 이거다.

그런데 생성자를 다시 보면, 평면이 지나는 점을 **내가 고를 수 있다.**
`new Plane(Vector3.up, transform.position)`으로 두면 교차점이 처음부터
캐릭터와 같은 높이에서 잡힌다. forward가 `worldUp`에 수직이 되므로 **Y를 다시
끼워 넣을 이유가 없다.** 벡터를 새로 만드는 줄 하나가 사라지고, "왜 Y만
바꾸는가"라는 질문도 사라진다.

| | 원점에 둔 평면 | 오브젝트 위치에 둔 평면 |
| --- | --- | --- |
| 교차점의 높이 | 항상 `y = 0` | 오브젝트와 같은 높이 |
| Y 보정 | 필요하다 | 필요 없다 |
| 캐릭터가 언덕에 있을 때 | 교차점이 발밑보다 아래 | 발밑과 같은 평면 |
| 층이 있는 맵 | 아래층 기준으로 잡힌다 | 현재 층 기준 |

## Raycast가 거짓을 돌려주는 경우가 둘이다

클리핑의 `if`는 맞는 처리다. 다만 문서는 거짓이 되는 경우를 **둘로** 나눠
적고, `enter`에 들어가는 값이 서로 다르다.

> If the ray is parallel to the plane, function returns `false` and sets
> `enter` to zero.

> If the ray is pointing in the opposite direction than the plane, function
> returns `false` and sets `enter` to the distance along the ray (negative
> value).

**평행이면 0, 반대 방향이면 음수 거리**다. 둘 다 거짓이라 `if` 하나로
걸러지지만, **어느 쪽인지 알면 원인이 갈린다.**

- **평행**은 카메라가 평면과 나란히 놓인 경우다. 탑다운에서는 보기 어렵고,
  카메라를 지면 높이로 내리는 연출에서 나온다.
- **반대 방향**은 탑다운에서도 실제로 생긴다. 커서가 지평선 위를 가리키면
  레이가 `y = 0` 평면에서 멀어지는 쪽을 향한다.

거짓일 때 클리핑의 코드는 **회전을 그냥 건너뛴다.** 그게 안전한 선택이지만,
증상은 "커서를 화면 위쪽으로 올리면 캐릭터가 안 돌아간다"로 나타난다. 조용히
멈추는 쪽이라 원인을 찾기 어렵다. 로그를 한 번 찍어두면 그 자리에서 끝난다.

## mousePosition은 문서가 쓰지 말라고 적어둔 API다

`Input.mousePosition` 페이지의 설명이 이렇게 시작한다.

> The current mouse position in pixel coordinates. (Read Only).

> Note: This API is part of the legacy Input Manager.

> The recommended best practice is that you don't use this API in new
> projects.

> For new projects, use the Input System package.

**문서가 새 프로젝트에서 쓰지 말라고 직접 적어둔다.** 이 블로그의 입력 글
넷이 전부 Input System 쪽인 것도 같은 이유다. 대체 경로의 이름은 이렇다.

> An input device representing a mouse.

> The mouse that was added or updated last or null if there is no mouse
> connected to the system.

`Mouse`와 `Mouse.current`이고, **마우스가 없으면 `null`**이라고 적혀 있다.
좌표는 상위 클래스에 있다.

> Base class for pointer-style devices moving on a 2D screen.

> The current pointer coordinates in window space.

`Pointer.position`이고 타입이 `Vector2Control`이다. 즉 한 줄로 바꾸면
`Mouse.current.position.ReadValue()`가 `Input.mousePosition` 자리에 들어간다.
**`Vector2`가 돌아오므로 `ScreenPointToRay`에 넘길 때 `Vector3`로 올라간다**
— 어차피 `z`는 무시되니 문제가 없다.

백엔드 설정도 짚어둘 만하다.

> In the Other Settings section, set Active Input Handling to select a back
> end:

> Input Manager (Old): Builds have the ENABLE_LEGACY_INPUT_MANAGER=1 C#
> #define.

> Input System Package (New): Builds have the ENABLE_INPUT_SYSTEM=1 C#
> #define.

> Both: Builds have both of the C# #define.

**설정마다 `#define`이 다르고, 셋 중 하나를 고른다.** 패키지를 설치할 때
묻는 질문의 결과도 적혀 있다.

> Select Yes to enable the Input System back ends and disable the Input
> Manager back ends.

**새 백엔드를 켜면 구형 백엔드가 꺼진다.** 그 상태에서 `UnityEngine.Input`
호출이 정확히 어떻게 되는지는 **그 페이지에 적혀 있지 않고, 확인하지
못했다.** 확인한 것은 "구형 백엔드가 꺼진다"와 "`#define`이 설정마다 다르다"
까지다. 자주 돌아다니는 "예외가 난다"는 이야기는 여기서 적지 않는다.

## Camera.main에 대한 통념이 현행 문서와 다르다

클리핑은 `Camera.main`을 매 호출마다 읽는다. 여기에 대한 흔한 조언이
"`FindGameObjectWithTag`를 돌리니까 캐싱하라"인데, **현행 문서의 서술이
다르다.**

> The first enabled Camera component that is tagged "MainCamera" (Read Only).

> If there is no enabled Camera component with the "MainCamera" tag, this
> property is null.

> Internally, Unity caches all GameObjects with the "MainCamera" tag.

> When you access this property, Unity returns the first valid result from its
> cache.

> Accessing this property has a small CPU overhead, comparable to calling
> GameObject.GetComponent.

> Where CPU performance is important, consider caching this property.

**유니티가 내부적으로 캐시한다**고 적혀 있다. 비용은 "comparable to calling
GameObject.GetComponent"고, 그래서 권고가 "매 프레임 쓰면 안 된다"가 아니라
**"성능이 중요한 자리라면 캐싱을 고려하라"**다. 매 프레임 회전 함수에서
읽는다면 캐싱하는 쪽이 맞지만, **이유를 `FindGameObjectWithTag`로 설명하는
것은 현행 문서와 맞지 않는다.**

더 급한 문장은 둘째다. **태그가 없으면 `null`이다.** 클리핑의
`Camera.main.ScreenPointToRay(...)`는 그 경우 `NullReferenceException`이고,
씬을 새로 만들어 카메라 태그를 잃어버린 상태에서 바로 나온다. 그 페이지의
참고 항목이 "Additional resources: Tags"인 것도 그래서다. 인스펙터의 `Tag`가
무엇을 하는 칸인지는
[그리기 순서를 정하는 건 둘이 아니라 셋이다](/posts/sorting-layer-order/)에
적어뒀다.

## LookAt은 즉시 돌아간다

문서에 보간이 없다. `LookAt`의 설명은 "Rotates the transform so the forward
vector points at `worldPosition`."이고, **그 프레임에 끝난다.** 탑다운
슈터에서 캐릭터가 커서를 따라 즉시 꺾이는 느낌이 그래서 나온다.

회전 속도를 주려면 `LookAt` 대신 목표 회전을 만들어 보간한다. 그 형태는
[FreezePositionY가 얼리는 건 월드 Y다](/posts/rigidbody-constraints/)의 예제에
`Quaternion.LookRotation` + `Quaternion.RotateTowards` 조합으로 들어 있다.
이 글에서는 그쪽을 다시 설명하지 않고, **아래 예제에 선택지로만 넣어둔다.**

짚어둘 것은 `LookAt`에도 둘째 인자가 있다는 점이다.

> public void LookAt(Vector3 worldPosition, Vector3 worldUp = Vector3.up);

> Vector specifying the upward direction.

기본값이 `Vector3.up`이고, 앞 절에서 본 "forward가 수직일 때만 일치한다"는
조건이 이 인자에 걸린다. **평면을 오브젝트 위치에 두면 그 조건이 저절로
만족되므로 이 인자를 건드릴 일이 없다.**

## 평면 대신 콜라이더를 쓰는 길이 따로 있다

같은 "마우스가 가리키는 월드 좌표"를 얻는 길이 하나 더 있다. 평면이 아니라
**콜라이더**를 맞히는 쪽이다. 같은 `Ray`를 넘기는데 받는 함수가 다르다.

> public static bool Raycast(Ray ray, out RaycastHit hitInfo,
> float maxDistance = Mathf.Infinity, int layerMask = DefaultRaycastLayers,
> QueryTriggerInteraction queryTriggerInteraction =
> QueryTriggerInteraction.UseGlobal);

> bool Returns true when the ray intersects any collider, otherwise false.

> If true is returned, `hitInfo` will contain more information about where the
> closest collider was hit.

그리고 점은 거리를 거치지 않고 바로 나온다.

> The impact point in world space where the ray hit the collider.

`RaycastHit.point`다. `Plane.Raycast`는 거리를 돌려줘서 `GetPoint`로 점을
만들어야 했는데, 이쪽은 **맞은 지점이 곧 결과**다.

둘이 서로 대체재가 아니다. 전제가 다르다.

| | `Plane.Raycast` (이 글) | `Physics.Raycast` |
| --- | --- | --- |
| 필요한 것 | 평면 하나 (법선 + 지나는 점) | 씬에 있는 **콜라이더** |
| 점을 얻는 방법 | 거리 → `Ray.GetPoint` | `RaycastHit.point` |
| 거짓이 되는 때 | 평행이거나 반대 방향 | 콜라이더를 못 맞혔을 때 |
| 높이를 정하는 쪽 | 내가 평면으로 정한다 | 맞은 지형이 정한다 |
| 필터 | 없다 | `layerMask`·트리거 설정 |
| 비용 | 평면 하나와 산술 | 물리 질의 |

**지형의 실제 높이를 따라가야 하면 콜라이더 쪽이 맞다.** 계단이나 경사에서
커서가 가리키는 지점의 높이가 그대로 나온다. 반대로 **캐릭터가 도는 평면을
고정하고 싶으면 이 글의 방식**이 맞다 — 지형이 울퉁불퉁해도 회전은 수평으로
유지된다.

콜라이더 쪽에는 전제가 둘 더 붙어 있다. 하나는 필터다.

> A Layer mask that is used to selectively filter which colliders are
> considered when casting a ray.

기본값이 `DefaultRaycastLayers`인데, 그 기본값이 무엇을 빼고 무엇을 넣는지는
이 블로그의
[OverlapSphere는 Ignore Raycast 레이어를 무시하지 않는다](/posts/physics-overlapsphere/)에
적어뒀다. 다른 하나는 출발점이다.

> Raycasts will not detect Colliders for which the Raycast origin is inside the
> Collider.

**레이의 출발점이 콜라이더 안이면 그 콜라이더는 감지되지 않는다.** 앞 절에서
본 대로 `ScreenPointToRay`의 레이는 **카메라 근평면에서 출발**하므로, 카메라가
어떤 콜라이더 안에 들어가 있는 구도라면 그 콜라이더를 지나쳐 버린다. 평면
방식에는 없는 조건이다.

콜라이더로 월드 좌표를 얻는 쪽은 그 자체로 글감이라 여기서는 비교까지만
한다. 같은 주제의 클리핑이 하나 더 남아 있어서 **그 길은 그 글에서 다룬다.**

## 어디에 왜 쓰나

### 동작하는 예제

클리핑의 구조를 그대로 두고 세 군데를 바꿨다 — **평면을 오브젝트 위치에
두고**, **`Camera.main`을 캐싱하고**, **입력을 Input System에서 읽는다.**
세 번째는 문서가 구형 API를 쓰지 말라고 적어둔 것을 따른 것이다.

```csharp file="Scripts/Player/MouseLook.cs"
using UnityEngine;
using UnityEngine.InputSystem;

public class MouseLook : MonoBehaviour
{
    [Header("회전")]
    [Tooltip("0이면 즉시 돌아간다. 크면 초당 그 각도만큼 돌아간다")]
    [Min(0f)]
    [SerializeField]
    private float _turnSpeed;

    [Header("진단")]
    [Tooltip("평면과 교차하지 못한 프레임을 로그로 남긴다")]
    [SerializeField]
    private bool _logMisses;

    private Camera _camera;

    private void Awake()
    {
        // 문서가 "consider caching this property"라고 적었다. 그리고 태그가
        // 없으면 null이므로 여기서 한 번 확인한다.
        _camera = Camera.main;

        if (_camera == null)
        {
            Debug.LogError("MainCamera 태그가 붙은 카메라가 없다.", this);
        }
    }

    private void Update()
    {
        Rotate();
    }

    private void Rotate()
    {
        if (_camera == null)
        {
            return;
        }

        // 구형 Input.mousePosition 대신 Input System에서 읽는다. 마우스가
        // 없으면 current가 null이라고 문서에 적혀 있다.
        Mouse mouse = Mouse.current;

        if (mouse == null)
        {
            return;
        }

        Vector2 screenPoint = mouse.position.ReadValue();
        Ray cameraRay = _camera.ScreenPointToRay(screenPoint);

        // 평면을 원점이 아니라 '내 위치'에 둔다. 그러면 교차점이 처음부터
        // 같은 높이에서 잡혀서 Y를 다시 끼워 넣을 필요가 없다.
        Plane groundPlane = new Plane(Vector3.up, transform.position);

        if (!groundPlane.Raycast(cameraRay, out float rayLength))
        {
            // 평행이면 enter가 0, 반대 방향이면 음수 거리다. 둘 다 여기로
            // 온다. 조용히 넘기면 "위쪽을 가리키면 안 돌아간다"가 된다.
            if (_logMisses)
            {
                Debug.Log($"평면과 교차하지 못했다. enter = {rayLength}", this);
            }

            return;
        }

        Vector3 lookPoint = cameraRay.GetPoint(rayLength);
        Vector3 direction = lookPoint - transform.position;

        // 커서가 발밑에 겹치면 방향이 0에 가까워진다. LookRotation에 0을
        // 넘기지 않도록 여기서 끊는다.
        if (direction.sqrMagnitude < 0.0001f)
        {
            return;
        }

        if (_turnSpeed <= 0f)
        {
            // 즉시. 평면이 같은 높이에 있으므로 Y 보정이 없다.
            transform.LookAt(lookPoint);
            return;
        }

        Quaternion target = Quaternion.LookRotation(direction, Vector3.up);
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation, target, _turnSpeed * Time.deltaTime);
    }
}
```

`_camera`에 `?.`를 쓰지 않은 이유가 있다. `UnityEngine.Object`이고,
인스펙터에서 비워둔 참조는 **null처럼 보이지만 C#의 null이 아닌 상태**가 될
수 있다. 그래서 `== null` / `!= null` 비교를 쓴다. `Mouse`는 순수 C#
객체지만 같은 모양으로 맞췄다.

`out float rayLength`를 `if` 안에 선언한 것이 의도다. 클리핑은 변수를 미리
선언하는데, **거짓일 때의 `enter` 값도 의미가 있으므로** 선언을 호출 자리에
붙여두면 로그에서 바로 쓸 수 있다.

`_turnSpeed`를 `0`으로 두면 `LookAt`을 타고, 양수면 보간을 탄다. **둘을 한
함수에 둔 것은 둘이 서로 다른 느낌이기 때문**이다. 어느 쪽이 맞는지는 게임이
정한다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| 화면 좌표에서 월드 방향 | `Camera.ScreenPointToRay` (근평면에서 출발) |
| 레이를 끊어 점으로 | `Plane.Raycast` + `Ray.GetPoint` |
| 캐릭터와 같은 높이의 점 | `new Plane(Vector3.up, transform.position)` |
| 지면이 `y = 0`으로 고정이다 | `new Plane(Vector3.up, Vector3.zero)` |
| 세 점으로 평면을 만든다 | `Plane(a, b, c)` (위에서 보아 시계 방향) |
| 즉시 바라본다 | `transform.LookAt` |
| 회전 속도를 준다 | `Quaternion.LookRotation` + `RotateTowards` |
| 마우스 좌표 (신규) | `Mouse.current.position.ReadValue()` |
| 마우스 좌표 (구형) | `Input.mousePosition` — 문서가 비권장 |
| 카메라 참조 | `Camera.main`을 한 번 캐싱 + null 확인 |
| 교차 실패의 원인 구분 | `enter`가 0인지 음수인지 |
| 지형의 실제 높이를 따라간다 | `Physics.Raycast` + `RaycastHit.point` |
| 회전 평면을 수평으로 고정한다 | `Plane.Raycast` (이 글의 방식) |
| 특정 레이어만 맞힌다 | `Physics.Raycast`의 `layerMask` |

판단 순서는 이렇게 두면 된다.

- **평면을 어디에 둘지 먼저 정한다.** 그게 교차점의 높이를 정하고, 높이가
  `LookAt`의 기울기를 정한다. 보정 코드는 평면 선택의 결과다.
- **거짓 분기를 비워두지 않는다.** 조용히 넘기면 "위쪽을 가리키면 안
  돌아간다"가 되고, 원인을 찾기 어렵다.
- **카메라는 한 번 받아둔다.** 문서의 권고가 "캐싱을 고려하라"이고, 태그가
  없으면 `null`이다.
- **입력은 새 패키지로 읽는다.** 문서가 구형 API를 새 프로젝트에서 쓰지 말라고
  적었다.
- **평면이냐 콜라이더냐는 "높이를 누가 정하는가"로 가른다.** 회전을 수평으로
  두고 싶으면 평면, 지형 높이를 따라가야 하면 콜라이더다.

### 쓰지 말아야 할 자리

- **`y = 0` 평면을 "씬의 바닥"으로 가정하는 것.** 캐릭터가 그 높이에 있을
  때만 맞다. 평면이 지나는 점은 생성자 인자로 고를 수 있다.
- **교차점의 Y만 바꿔 끼우는 것.** 동작은 하지만 평면을 잘못 둔 것의
  보정이다. 평면을 옮기면 그 줄이 사라진다.
- **`Plane.Raycast`의 거짓을 한 가지로 보는 것.** 평행이면 `enter`가 0,
  반대 방향이면 음수 거리다.
- **거짓일 때 아무 로그도 남기지 않는 것.** 증상이 "가끔 안 돌아간다"로
  나타난다.
- **`Camera.main`이 `FindGameObjectWithTag`를 돈다고 설명하는 것.** 현행
  문서는 내부 캐시를 쓰고 비용이 `GetComponent` 수준이라고 적는다.
- **`Camera.main`을 null 확인 없이 바로 쓰는 것.** 태그가 없으면 `null`이다.
- **새 프로젝트에서 `Input.mousePosition`을 쓰는 것.** 문서가 "The recommended
  best practice is that you don't use this API in new projects"라고 적었다.
- **`Mouse.current`를 null 확인 없이 쓰는 것.** 마우스가 없으면 `null`이라고
  적혀 있다.
- **`ScreenPointToRay`에 넘기는 `z`에 의미를 두는 것.** "Unity ignores the z
  coordinate"다.
- **`LookAt`에 보간을 기대하는 것.** 그 프레임에 끝난다. 속도를 주려면 목표
  회전을 만들어 보간한다.
- **평면 방식과 콜라이더 방식을 같은 것으로 보는 것.** 전자는 평면 하나만
  있으면 되고 후자는 콜라이더가 필요하다. 높이를 정하는 쪽도 다르다.
- **`Physics.Raycast`로 바꾸면서 출발점을 생각하지 않는 것.** 문서가
  "Raycasts will not detect Colliders for which the Raycast origin is inside
  the Collider"라고 적었고, 이 레이는 카메라 근평면에서 출발한다.

## 정리

- 클리핑의 방법은 **맞다.** 화면 좌표 → 레이 → 평면과의 거리 → 점 순서이고,
  레이는 **"starting on the near plane of the camera"**이며 `z`는 무시된다.
- 그래서 **마지막 점을 정하는 것은 레이가 아니라 평면**이다. 생성자가
  "goes through a point `inPoint`"라고 적는 대로, 평면이 지나는 점은 내가
  고른다.
- 클리핑의 Y 보정은 **`LookAt`의 조건을 만족시키려는 것**이다 — "The up
  vector of the rotation will only match the `worldUp` vector if the forward
  direction is perpendicular to `worldUp`."
- **평면을 `transform.position`에 두면 그 보정이 사라진다.** 교차점이 처음부터
  같은 높이에서 잡힌다.
- 클리핑 주석의 "y=0인 평면 == 씬에서 오브젝트들이 배치되어 있는 평면"은
  **사실이 아니라 가정**이다. 언덕·층·떠 있는 피봇에서 어긋난다.
- `Plane.Raycast`의 거짓은 **둘**이다. 평행이면 `enter`가 **0**, 반대
  방향이면 **음수 거리**다. 탑다운에서 후자는 커서가 지평선 위를 가리킬 때
  실제로 생긴다.
- **`Input.mousePosition`은 문서가 비권장으로 적어둔 API다** — "This API is
  part of the legacy Input Manager." / "don't use this API in new projects".
  대체는 `Mouse.current.position`(`Vector2Control`, "window space")이고
  `Mouse.current`는 **마우스가 없으면 null**이다.
- 백엔드는 `Active Input Handling`에서 고르고 설정마다 `#define`이 다르다.
  새 백엔드를 켜면 **구형 백엔드가 꺼진다.** 그 상태의 `UnityEngine.Input`
  호출이 어떻게 되는지는 그 페이지에 없어서 확인하지 못했다.
- **`Camera.main`은 내부 캐시를 쓴다**고 현행 문서가 적는다. 비용은
  "comparable to calling GameObject.GetComponent"고 권고는 "consider caching".
  더 급한 건 **태그가 없으면 `null`**이라는 쪽이다.
- **`LookAt`은 즉시 돌아간다.** 문서에 보간이 없다. 회전 속도가 필요하면
  목표 회전을 만들어 보간하는 쪽이다.
- 같은 좌표를 **콜라이더로 얻는 길이 따로 있다.** `Physics.Raycast`는
  "Returns true when the ray intersects any collider"이고 점이
  `RaycastHit.point`로 바로 나온다. **높이를 지형이 정하는 쪽**이라 이 글의
  방식과 쓰는 자리가 갈린다. 출발점이 콜라이더 안이면 감지되지 않는다는
  조건도 그쪽에만 있다.

---

### 참고

- [Camera.main — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)
- [Camera.ScreenPointToRay — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)
- [Plane 생성자 — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Plane-ctor.html)
- [Plane.Raycast — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Plane.Raycast.html)
- [Ray.GetPoint — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Ray.GetPoint.html)
- [Transform.LookAt — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Transform.LookAt.html)
- [Physics.Raycast — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)
- [RaycastHit.point — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastHit-point.html)
- [Input.mousePosition — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)
- [Mouse — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Mouse.html)
- [Pointer — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)
- [Installation — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/Installation.html)

이 글의 출발점이 된 자료는
[\[유니티/C#\] 마우스 위치로 바라보기](https://jinsso.tistory.com/15)
(진서박, 2023-07-12)이다. 레이와 평면으로 월드 좌표를 얻는 구조는 원문을
그대로 따라가면서, 각 항목을 현행 Unity 6.6 스크립팅 레퍼런스와 Input System
1.20 문서에 대조했다. 원문에 없는 평면 위치·거짓 분기·입력 API 쪽은 같은
문서에서 가져왔다. 확인 시점은 2026-10-13이다.
