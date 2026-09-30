---
pubDatetime: 2026-09-30T18:00:00+09:00
title: "안드로이드에서 escape는 뒤로 가기 버튼이다"
lang: ko
translationKey: unity-application-quit
featured: false
draft: false
tags:
  - Unity
  - C#
  - 모바일
  - 에디터
description: "에디터에서 안 멈추니까 #if UNITY_EDITOR로 가르라는 조언은 정확하다. 그런데 이 스크립트를 그대로 안드로이드에 올리면 뒤로 가기 버튼이 종료 버튼이 되고, 문서는 애초에 안드로이드에서 이 함수를 권하지 않는다."
---

게임 개발 중에 **빌드한 게임을 종료하는 방법**과 **에디터에서 플레이 모드를
끄는 방법**을 찾다가 스크랩한 글이다. 질문이 둘인데 이 글은 그 둘을 한 번에
답한다 — `Application.Quit()`을 쓰고, 에디터에서는 안 멈추니까
`#if UNITY_EDITOR`로 갈라주라는 것이 2019년 글의 전부다. 짧다.

> 빌드한 어플리케이션에서는 정상적으로 종료가 실행되지만, 유니티 에디터에서는
> 게임 플레이가 멈추지 않는다. 따라서 에디터와 프로그램 실행을 구분지어서
> 코딩해줘야 한다.

**맞는 지적이고, 제시한 해법도 정확하다.** 그런데 예제가 종료 키로 고른 것이
`escape`다. 그 한 글자가 **안드로이드에서는 다른 물건**이 된다. 그리고 현행
문서는 **안드로이드에서 `Application.Quit`을 쓰지 말라고 적어놨다.**

## 목차

## 에디터 분기는 정확하다

먼저 맞는 쪽부터. 클리핑의 두 번째 코드다.

```csharp
public void ExitGame()
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit(); // 어플리케이션 종료
#endif
    }
```

현행 문서도 같은 전제를 확인해준다.

> **`Application.Quit` 호출은 에디터에서 무시된다.**

그래서 에디터에서 멈추려면 `EditorApplication.isPlaying`을 직접 끄는 것이
맞다.

그리고 **눈에 잘 안 띄지만 중요한 것을 하나 제대로 했다.** `using
UnityEditor;`를 파일 위에 두지 않고, `UnityEditor.EditorApplication`처럼
**전체 이름으로 적었다.** `UnityEditor` 네임스페이스는 플레이어 빌드에 포함되지
않아서, `using`을 위에 써두면 `#if`로 코드를 가려도 **빌드가 깨진다.** 전처리기
안에서 전체 이름으로 부르면 그 문제가 없다.

이 구분은 [애트리뷰트 글](/posts/unity-attributes/)에서도 다뤘다. `#if
UNITY_EDITOR`가 가리는 것은 **코드**이고, `using`은 그 바깥에 있다.

## 안드로이드에서 `escape`는 뒤로 가기 버튼이다

첫 번째 코드다.

```csharp
public class ExampleClass : MonoBehaviour {
    void Update() {
        if (Input.GetKey("escape"))
            Application.Quit();

    }
}
```

PC에서는 의도대로 돈다. 그런데 안드로이드 빌드에 그대로 올리면 얘기가
달라진다. Unity 문서가 **뒤로 가기 버튼을 읽는 방법**을 이렇게 적는다.

> 기본적으로 이 속성은 `false`로 설정되어 있으며, 이는 **뒤로 가기 버튼에
> 대응하는 것이 개발자의 책임**이라는 뜻이다.

그 "대응하는 방법"이 문제다.

> `false`일 때 개발자는 **`KeyCode.Escape`로 `Input.GetKey`를 호출해서**
> 뒤로 가기 버튼에 대응할 수 있다.

**안드로이드의 뒤로 가기 버튼이 `KeyCode.Escape`로 들어온다.** 그러니 위
스크립트를 올려두면, 사용자가 **메뉴를 닫으려고 뒤로 가기를 누를 때마다 게임이
종료된다.** 의도한 적 없는 동작이 기본값으로 붙는다.

정작 문서가 안내하는 안드로이드의 답은 따로 있다. 같은 속성을 `true`로 두는
것이다.

> `true`로 설정하면 **안드로이드에서는 애플리케이션을 최소화**하고, UWP에서는
> 애플리케이션을 일시 중단한다.

종료가 아니라 **최소화**다. 홈 버튼을 누른 것과 같은 상태가 된다.

## 문서는 안드로이드에서 이 함수를 권하지 않는다

`Application.Quit` 문서의 플랫폼별 주석을 모으면 이렇다.

> **안드로이드** — 일관성 없는 사용자 경험을 막기 위해 **`Application.Quit`으로
> 자체적인 종료 방식을 만드는 것은 권장되지 않는다.** 대신
> `Activity.moveTaskToBack`을 쓰라.

> **iOS** — iOS 플레이어에서 `Application.Quit` 메서드를 호출하면 **사용자에게
> 애플리케이션이 크래시한 것처럼 보일 수 있다.** 대부분의 경우 애플리케이션의
> 종료는 사용자의 재량에 맡겨야 한다.

> **웹** — 웹 플랫폼에서 `Application.Quit`은 웹 플레이어를 멈추지만
> **웹 페이지 프런트엔드에는 영향을 주지 않는다.**

정리하면 이렇다.

| 플랫폼 | `Application.Quit()` |
|---|---|
| Windows / macOS / Linux | 의도대로 종료된다 |
| 에디터 | **무시된다** |
| 안드로이드 | **권장되지 않는다.** 최소화(`moveTaskToBack`)가 문서의 답 |
| iOS | **크래시처럼 보일 수 있다.** 종료는 사용자에게 맡기라 |
| 웹 | 플레이어만 멈추고 페이지는 그대로 |

**"종료 스크립트"가 제대로 의미를 갖는 플랫폼은 데스크톱뿐**이라는 뜻이다.
모바일에서 "게임 종료" 메뉴가 잘 안 보이는 데는 이유가 있었다.

참고로 클리핑이 링크한 문서는 **Unity 5.3 한국어 API 페이지**다. 그 링크
미리보기에 iOS 주석이 이미 들어 있는데, 본문은 그 이야기를 하지 않는다.

데스크톱에서는 종료 코드를 넘길 수도 있다.

> **exitCode** — Windows, Mac, Linux에서 플레이어 애플리케이션이 종료될 때
> 반환할 선택적 종료 코드. 기본값은 0이다.

## 그럼 모바일에서는 어떻게 종료하나 — 다음 숙제

문서가 "권장하지 않는다"까지만 말하고 대안은 한 줄로 넘긴다. 그럼 정말 종료가
필요할 때는 무엇을 부르나. **iOS는 답이 이미 나와 있고, 안드로이드는 아직
열려 있다.**

### iOS — 애플이 "API가 없다"고 적어놨다

Unity 문서가 iOS 항목에서 링크하는 곳이 애플의 기술 문답이다. 답이 분명하다.

> **iOS 애플리케이션을 우아하게 종료하기 위해 제공되는 API는 없다.**

> **`exit` 함수를 호출하지 마라.** `exit`을 호출하는 애플리케이션은 홈 화면으로
> 애니메이션되며 우아하게 종료되는 대신 사용자에게 **크래시한 것처럼 보인다.**

> `exit`을 호출하면 `-applicationWillTerminate:`와 유사한
> `UIApplicationDelegate` 메서드들이 호출되지 않기 때문에 **데이터가 저장되지
> 않을 수 있다.**

Unity 문서의 "크래시한 것처럼 보일 수 있다"가 그대로 여기서 온 문장이다. 즉
iOS에서 할 일은 종료 방법을 찾는 것이 아니라 **종료 버튼을 만들지 않는
것**이다. 저장이 목적이라면 종료 시점이 아니라 일시 중지 시점에 둔다.

### 안드로이드 — 아직 확인하지 않았다

안드로이드는 사정이 다르다. 문서가 대안으로 제시한 `Activity.moveTaskToBack`은
**최소화**이지 종료가 아니고, "권장하지 않는다" 다음에 진짜 종료 경로는 나오지
않는다.

확인해야 할 것을 적어둔다. **아래는 아직 1차 출처로 확인하지 않은 목록**이고,
따로 파본 뒤에 글을 하나 더 쓸 생각이다.

- `AndroidJavaObject`로 현재 Activity를 잡아 `finish()`를 부르는 경로가 실제로
  어떻게 동작하는지
- `System.exit` / `Process.killProcess` 계열이 Unity 플레이어의 수명 주기와
  어떻게 맞물리는지
- `Application.Quit`이 안드로이드에서 내부적으로 무엇을 호출하는지
- 구글 플레이 쪽에 앱이 스스로를 종료하는 것에 대한 정책이나 UX 권고가 있는지

**추측으로 채우지 않겠다.** 지금 문서로 확인된 것은 "권장하지 않는다"와
"대신 최소화하라"까지다.

## `GetKey`는 누르고 있는 동안 계속 참이다

첫 코드의 다른 문제다. `Input.GetKey`는 **누르고 있는 동안 매 프레임 참**이라,
`Update`에서 이렇게 쓰면 `Application.Quit()`이 초당 수십 번 불린다.

종료는 어차피 한 번이면 되니 눈에 띄는 증상은 없다. 다만 **확인 대화상자를
붙이는 순간** 창이 프레임마다 뜬다. 눌린 순간 한 번만 반응하는
`Input.GetKeyDown`이 맞다.

그리고 문자열 대신 `KeyCode`를 쓰는 편이 낫다. 오타가 컴파일 에러가 된다.

```csharp
// 원문
if (Input.GetKey("escape"))

// 눌린 순간 한 번, 오타는 컴파일 에러
if (Input.GetKeyDown(KeyCode.Escape))
```

하나 더. **구 `Input` 클래스는 프로젝트 설정에 따라 예외를 던진다.** Player
Settings의 Active Input Handling이 `Input System Package (New)`면 이 줄이
런타임에 터진다.

```
InvalidOperationException: You are trying to read Input using the
UnityEngine.Input class, but you have switched active Input handling to
Input System package in Player Settings.
```

둘 다 쓰려면 `Both`로 두고, Input System으로 넘어간 프로젝트라면 키 판정도
그쪽으로 옮긴다. 이 이야기는
[InputField 글](/posts/ugui-inputfield-name-entry/)에서도 다뤘다.

## 종료를 막거나 정리하려면

"정말 종료할까요?"를 붙이거나 종료 직전에 저장을 하려면 이벤트가 따로 있다.

> Player 애플리케이션이 **종료하려고 할 때** Unity가 이 이벤트를 발생시킨다.

`Application.wantsToQuit`은 **취소가 가능한 시점**이다. 문서 표현으로
`false`를 반환하면 **"종료 과정이 취소된다."**

여기에도 플랫폼 단서가 붙는다.

> **iOS/iPadOS에서는 반환값이 효과가 없다.** `Application.wantsToQuit`은
> iOS/iPadOS에서 종료를 막을 수 없다.

> **안드로이드 플랫폼에서는 이 이벤트가 항상 발생하지는 않는다.** 애플리케이션이
> 일시 중지되면 디바이스 액티비티가 더 이상 보이지 않기 때문이다.

> 에디터에서 Play 모드를 빠져나갈 때는 **이 이벤트의 반환값이 무시된다.**

안드로이드와 Meta Quest에서는 `OnApplicationFocus`나 `OnApplicationPause`를
쓰라고 문서가 권한다. **"종료 직전에 저장"이라는 설계 자체가 모바일에서는
성립하지 않는다**는 뜻이다. 모바일의 저장 시점은 종료가 아니라 **일시 중지**다.

## 어디에 왜 쓰나

종료 버튼은 **데스크톱 빌드의 기능**이고, 모바일에서는 다른 것으로 바꿔야 한다.
그 분기를 한 군데에 모아두면 UI 쪽은 그냥 한 메서드만 부르면 된다.

### 플랫폼별로 갈라지는 종료 하나

```csharp
using UnityEngine;

/// <summary>
/// 종료 버튼 하나에 연결한다. 플랫폼별 차이는 전부 여기서 흡수한다.
/// </summary>
public class QuitController : MonoBehaviour
{
    [Header("Input")]
    [SerializeField, Tooltip("키보드로도 종료를 받을지")]
    private bool _acceptEscapeKey = true;

    private void Update()
    {
        if (!_acceptEscapeKey)
        {
            return;
        }

        // 안드로이드에서 Escape는 뒤로 가기 버튼이다. 그쪽은 아래에서 따로 다룬다.
#if UNITY_ANDROID && !UNITY_EDITOR
        return;
#else
        // 누르고 있는 동안이 아니라 눌린 순간 한 번.
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            RequestQuit();
        }
#endif
    }

    /// <summary>종료 버튼의 OnClick에 연결한다.</summary>
    public void RequestQuit()
    {
#if UNITY_EDITOR
        // 에디터에서는 Quit이 무시되므로 Play 모드를 직접 끈다.
        // using을 파일 위에 두면 플레이어 빌드가 깨진다. 전체 이름으로 부른다.
        UnityEditor.EditorApplication.isPlaying = false;

#elif UNITY_ANDROID
        // 문서: Application.Quit으로 자체 종료를 만드는 것은 권장되지 않는다.
        // 뒤로 가기 버튼이 앱을 최소화하게 맡긴다.
        Input.backButtonLeavesApp = true;

#elif UNITY_IOS
        // 문서: 사용자에게 크래시처럼 보일 수 있다. 종료는 사용자 재량에 맡긴다.
        Debug.Log("iOS에서는 종료 버튼을 노출하지 않는다.");

#elif UNITY_WEBGL
        // 문서: 플레이어만 멈추고 웹 페이지에는 영향이 없다.
        Debug.Log("WebGL에서는 종료 버튼 대신 다른 동선을 준다.");

#else
        Application.Quit();
#endif
    }
}
```

`#elif`로 나눈 가지마다 **문서의 어느 문장 때문인지**를 주석으로 남겨뒀다.
나중에 "여기 왜 이렇게 되어 있지"가 되지 않게 하는 게 목적이다.

iOS와 WebGL 가지가 로그만 찍는 것이 이상해 보일 수 있는데, **그게 문서가
권하는 동작**이다. 그 플랫폼에서는 종료 버튼을 UI에서 빼는 쪽이 맞다.

### 확인 대화상자를 붙이려면

"정말 종료하시겠습니까?"는 `wantsToQuit`으로 붙인다. 버튼에서 부르는 경로와
OS가 종료를 시작한 경로를 **둘 다 잡는다**는 게 이점이다.

```csharp
using UnityEngine;

public class QuitConfirmation : MonoBehaviour
{
    private bool _confirmed;

    private void OnEnable()
    {
        Application.wantsToQuit += OnWantsToQuit;
    }

    private void OnDisable()
    {
        Application.wantsToQuit -= OnWantsToQuit;
    }

    private bool OnWantsToQuit()
    {
        if (_confirmed)
        {
            return true;
        }

        ShowDialog();

        // false를 반환하면 종료 과정이 취소된다.
        return false;
    }

    /// <summary>대화상자에서 "예"를 눌렀을 때.</summary>
    public void Confirm()
    {
        _confirmed = true;
        Application.Quit();
    }

    private void ShowDialog()
    {
        // 확인 UI를 띄운다.
    }
}
```

**모바일에서는 이 설계를 쓰지 않는다.** 문서가 안드로이드에서 이벤트가 항상
오지는 않는다고 하고, iOS에서는 반환값 자체가 무시된다. 모바일의 저장은
`OnApplicationPause` 쪽에 둔다.

### 쓰지 말아야 할 자리

- **안드로이드에서 `KeyCode.Escape`를 종료에 묶기.** 뒤로 가기 버튼이다.
- **모바일에 "게임 종료" 버튼을 그대로 두기.** 안드로이드는 권장되지 않고
  iOS는 크래시처럼 보인다.
- **`using UnityEditor;`를 파일 상단에 두기.** `#if`로 코드를 가려도 플레이어
  빌드가 깨진다.
- **`GetKey`로 종료를 받기.** 누르고 있는 동안 계속 참이다. 대화상자를 붙이면
  드러난다.
- **모바일 저장 로직을 `wantsToQuit`에 두기.** 항상 오지 않는다.
  `OnApplicationPause`가 맞다.
- **Input System 프로젝트에서 구 `Input` 쓰기.** 예외가 난다.

## 정리

- **에디터 분기는 정확하다.** 문서가 **"`Application.Quit` 호출은 에디터에서
  무시된다"**고 적고, `EditorApplication.isPlaying`을 끄는 게 맞는 대응이다.
- **`UnityEditor`를 전체 이름으로 부른 것도 맞다.** `using`을 파일 위에 두면
  `#if`로 가려도 플레이어 빌드가 깨진다.
- **안드로이드에서 `KeyCode.Escape`는 뒤로 가기 버튼이다.** 문서가 뒤로 가기
  대응 방법으로 그 키를 직접 안내한다. 그대로 올리면 **뒤로 가기가 종료
  버튼**이 된다.
- **안드로이드의 문서적 답은 `Input.backButtonLeavesApp = true`**다. 종료가
  아니라 **최소화**다.
- **문서는 안드로이드에서 `Application.Quit`을 권하지 않는다.** iOS에서는
  **"크래시한 것처럼 보일 수 있다"**고 적는다. 웹에서는 페이지에 영향이 없다.
- 즉 **"종료 스크립트"가 온전히 성립하는 곳은 데스크톱뿐**이다.
- **`GetKey`가 아니라 `GetKeyDown`**이다. 문자열보다 `KeyCode`가 낫다.
- **종료를 막거나 정리하려면 `Application.wantsToQuit`**인데, iOS에서는 반환값이
  무시되고 안드로이드에서는 이벤트가 항상 오지 않는다. 모바일은
  `OnApplicationPause` 쪽이다.
- **iOS는 애플이 못을 박아놨다.** "우아하게 종료하기 위해 제공되는 API는
  없다"이고 `exit`은 크래시처럼 보인다. **안드로이드의 진짜 종료 경로는
  아직 확인하지 않았다** — 따로 파서 글을 하나 더 쓸 자리다.

짧은 글이라 짧게 끝나는 게 자연스럽다. 다만 이 글이 고른 예제 키가 하필
`escape`였고, **그 키가 플랫폼마다 다른 물건을 가리킨다.** 데스크톱에서
"종료"였던 한 줄이 안드로이드에서는 "뒤로 가기"가 된다. 종료라는 동작 자체가
플랫폼마다 다른 의미를 갖는다는 걸 그 한 글자가 보여준다.

---

### 참고

- [Application.Quit — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Application.Quit.html)
- [Application.wantsToQuit — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Application-wantsToQuit.html)
- [Input.backButtonLeavesApp — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Input-backButtonLeavesApp.html)
- [KeyCode — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/KeyCode.html)
- [QA1561: How do I programmatically quit my iOS application? — Apple](https://developer.apple.com/library/archive/qa/qa1561/_index.html)

이 글의 출발점이 된 자료는 [유알 — \[Unity3D\] 게임 종료 스크립트](https://m.blog.naver.com/os2dr/221536765981)
(2019-05-13)이다. 에디터 분기라는 해법을 그대로 따라가면서, 예제가 고른 키와
`Application.Quit`의 플랫폼별 동작을 현행 스크립팅 레퍼런스와 대조했다.
