---
pubDatetime: 2026-09-28T18:00:00+09:00
title: "InputField에 엔터가 안 먹는 이유: 조건문이 캐시를 본다"
lang: ko
translationKey: ugui-inputfield-name-entry
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - 입력
description: "키보드로도 마우스로도 이름을 입력하려고 쓴 코드인데, 키보드 쪽이 마우스를 한 번 누르기 전까지 동작하지 않는다. 조건문이 인풋필드가 아니라 Awake에서 캐시한 문자열을 보기 때문이다."
---

게임 프로젝트에 **로그인 기능**을 붙이면서 닉네임과 비밀번호를 입력받는 UI를
만들던 중에 스크랩한 글이다. 입력만이 아니라 **랭킹 판을 화면에 뿌리는 출력
쪽**도 같이 찾고 있었는데, 이 글이 마침 그 두 가지를 잇는다 — 이름을 입력받아
저장하고, 뒷글에서 그 값으로 랭킹을 만든다.

UGUI의 `InputField`로 플레이어 이름을 입력받는 방법을 정리한 2021년 글이다.
인풋필드의 구조를 짚고, 거기에 배경 이미지와 확인 버튼을 붙여 실제 이름 입력
창을 만드는 데까지 간다. 글쓴이가 코드를 쓴 이유를 이렇게 적어뒀다.

> 이 때 플레이어가 키보드로 이름을 입력한 뒤 마우스로 다시 손을 올려야만
> 하는..! 그게 싫어서 **키보드로의 버튼 입력과 마우스로 입력 버튼을 누르는
> 것을 전부 할 수 있는 스크립트를 작성했습니다.**

목적이 분명하다. 그런데 **그 코드의 키보드 경로는 마우스를 한 번 누르기
전까지 동작하지 않는다.** 손을 마우스로 가져가지 않으려고 쓴 코드가, 손을
한 번 마우스로 가져가야 열린다.

## 목차

## 인풋필드의 구조는 정확히 짚었다

먼저 맞는 쪽부터. 클리핑이 인풋필드가 왜 단순한지를 이렇게 설명한다.

> 정말로 입력값을 보여주는 것 외의 기능은 포함되지 않기 때문

맞는 관찰이다. `InputField` 오브젝트를 만들면 자식으로 **Placeholder**와
**Text** 두 개가 생기는데, 매뉴얼의 설명이 클리핑과 같은 이야기를 한다.

> **Placeholder** — Input Field에 텍스트가 없음을 보여주는 **선택적** "빈"
> Graphic.

> **Text** — 이 오브젝트를 Input Field의 *Text* 속성에 끌어다 놓으면 편집이
> 가능해진다. Text 컨트롤 자체의 *Text* 속성은 사용자가 입력하는 대로 바뀐다.

Placeholder가 **"선택적(optional)"** 이라는 게 문서 표현이다. 그래서 클리핑의
다음 조언도 맞다.

> 필수 요소는 아니므로 삭제해도 큰일이 나거나 하진 않습니다. 혹시 모를 참조
> 에러를 막기 위해서는 상위 오브젝트인 InputField의 인풋필드 컴포넌트에서
> Placeholder 값을 지워서 None으로 바꿔주시면 됩니다.

지우려면 컴포넌트의 참조도 같이 비우라는 것까지 짚은 건 좋다.

하나 덧붙이면, 지금 Unity에서 이 컴포넌트의 메뉴 경로는
`UI (Canvas)/Legacy/Input Field`다. **컴포넌트 메뉴에서 Legacy 아래로
들어가 있다.** 새로 만드는 프로젝트라면 TextMeshPro 쪽 `TMP_InputField`가
기본 선택지다. 클리핑도 "TMP를 쓸거냐 말거냐에 따라 선택도 가능하다"고
적어두긴 했는데, 지금은 선택의 무게가 달라졌다.

## 엔터는 한 번도 안 먹는다

클리핑의 코드다.

```csharp
using UnityEngine;
using UnityEngine.UI;

public class ResultNameInput : MonoBehaviour
{
    public InputField playerNameInput;
    private string playerName = null;

    private void Awake()
    {
        playerName = playerNameInput.GetComponent<InputField>().text;
    }

    private void Update()
    {
        //키보드
        if (playerName.Length > 0 && Input.GetKeyDown(KeyCode.Return))
        {
            InputName();
        }
    }

    //마우스
    public void InputName()
    {
        playerName = playerNameInput.text;
        PlayerPrefs.SetString("CurrentPlayerName", playerName);
        GameManager.instance.ScoreSet(GameManager.instance.score, playerName);
    }
}
```

`playerName`이 **어디에서 바뀌는지**만 따라가면 된다. 두 곳이다.

- `Awake()` — 인풋필드가 아직 비어 있으니 `""`가 들어간다.
- `InputName()` — 여기서만 실제 입력값이 들어간다.

**플레이어가 타이핑하는 것은 `playerName`을 바꾸지 않는다.** 타이핑은
인풋필드의 `text`를 바꾸고, `playerName`은 그 값을 `Awake` 시점에 한 번
복사해둔 **캐시**다.

그런데 `Update`의 조건문은 그 캐시를 본다.

| 순서 | `InputField.text` | `playerName` | 엔터를 누르면 |
|---|---|---|---|
| 시작 | `""` | `""` | 조건 거짓 — 아무 일 없음 |
| "HY" 입력 | `"HY"` | `""` | **조건 거짓 — 아무 일 없음** |
| 마우스로 확인 버튼 | `"HY"` | `"HY"` | — (버튼이 직접 실행) |
| 그 뒤로 | `"HY…"` | `"HY"` | 조건 참 — 동작한다 |

**세 번째 줄을 지나야 두 번째 줄이 열린다.** 즉 키보드 경로는
**마우스로 버튼을 한 번 누른 뒤에야** 살아난다. 글쓴이가 없애려던 동작이
전제 조건이 되어 있는 셈이다.

글쓴이는 이 조건문을 이렇게 읽고 있었다.

> 이름(으로 추정되는)을 한 글자 이상 입력 + 엔터 입력으로 다 입력했군! 이라
> 판단하는거죠. 입력이 아무것도 안 됐으면 실행이 안 됩니다.

**"입력이 아무것도 안 됐으면 실행이 안 된다"는 결과는 맞다.** 다만 이유가
다르다. 의도는 "한 글자 이상 입력했는가"인데, 실제로 검사되는 것은
**"`InputName`이 한 번이라도 실행된 적이 있는가"**다.

## 고치는 방법 둘

### 캐시 대신 현재 값을 읽는다

최소 수정은 한 줄이다. 조건문에서 캐시가 아니라 **인풋필드를 직접 본다.**

```csharp
private void Update()
{
    if (_playerNameInput.text.Length > 0 && Input.GetKeyDown(KeyCode.Return))
    {
        Submit();
    }
}
```

이렇게 하면 `playerName` 필드는 조건 판정에 쓸 이유가 없어진다. 애초에
**상태를 두 군데 두었던 것이 원인**이므로, 필드를 없애고 필요할 때
`.text`를 읽는 쪽이 맞다.

여기서 문서의 단서 하나를 같이 알아둘 만하다.

> **text** — Input field의 현재 텍스트 값. **화면에 보이는 것과 반드시 같지는
> 않다.**

`contentType`을 `Password`로 두면 화면에는 `*`가 보이지만 `text`는 실제
문자열이다. "보이는 것"이 아니라 "값"을 읽는 API라는 뜻이다.

비밀번호 칸을 만든다면 이 구분이 중요하다. **`Password`가 가리는 것은 화면
뿐이고**, 값은 평문 그대로 메모리에 있다. 표시 방식을 바꾸는 설정이지 보안
설정이 아니다.

### `Update` 대신 `onEndEdit`

매 프레임 키를 보는 대신 인풋필드가 알려주게 할 수도 있다. 매뉴얼의 설명이다.

> **On End Edit** — 사용자가 **제출하거나, 포커스를 잃게 하는 곳을 클릭해서**
> 텍스트 편집을 마쳤을 때 호출되는 UnityEvent.

인스펙터의 `On End Edit`에 메서드를 연결하거나 코드로 붙이면 된다.

```csharp
private void OnEnable()
{
    _playerNameInput.onEndEdit.AddListener(OnEndEdit);
}

private void OnDisable()
{
    _playerNameInput.onEndEdit.RemoveListener(OnEndEdit);
}

private void OnEndEdit(string value)
{
    // 인자로 확정된 문자열이 들어온다. 캐시를 볼 일이 없다.
    if (value.Length == 0) { return; }
    Submit();
}
```

다만 인용한 문장 그대로, **이 이벤트는 포커스를 잃을 때도 발생한다.** 다른
곳을 클릭해도 제출된다는 뜻이라, "엔터를 눌렀을 때만 제출"이 목표라면 이것만
쓰면 안 된다. API 레퍼런스에 `onSubmit`도 있지만 `onEndEdit`과 **설명 문구가
동일해서**, 둘이 어떻게 다른지는 문서만으로 단정하지 않겠다.

그래서 이 글의 예제는 **엔터 판정은 `Update`에 두고, 값은 `.text`에서 직접
읽는** 쪽을 쓴다. 문서로 확인되는 범위 안에서 원문의 의도에 가장 가깝다.

## `Input.GetKeyDown`은 Input System에서 예외를 던진다

원문 코드는 `Input.GetKeyDown(KeyCode.Return)`을 쓴다. 이게 프로젝트 설정에
따라 **런타임 예외**가 된다. Unity Issue Tracker에 그대로 실린 메시지다.

```
InvalidOperationException: You are trying to read Input using the
UnityEngine.Input class, but you have switched active Input handling to
Input System package in Player Settings.
```

Player Settings의 **Active Input Handling**이 `Input System Package (New)`면
구 `Input` 클래스가 이 예외를 던진다. 둘 다 쓰려면 `Both`로 둔다.

Input System 쪽으로 옮긴 프로젝트라면 키 판정도 그쪽으로 가는 게 맞다.

```csharp
using UnityEngine.InputSystem;

if (Keyboard.current != null && Keyboard.current.enterKey.wasPressedThisFrame)
{
    Submit();
}
```

그리고 구 `Input`을 계속 쓰든 아니든, **`KeyCode.Return`만 보면 숫자패드
엔터가 안 잡힌다.** 둘은 별개 값이다.

> **Return** — Return 키.

> **KeypadEnter** — 숫자 키패드 Enter.

## 어디에 왜 쓰나

이름 입력 창은 **"입력을 끝냈다"를 언제로 볼 것인가**가 전부인 UI다. 키보드와
마우스 두 경로를 다 열어두려면 그 판단이 한 군데 모여 있어야 한다.

### 이름 입력 창 하나

```csharp
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 인풋필드에 이름을 받아 확정한다. 엔터와 확인 버튼 두 경로를 모두 지원한다.
/// </summary>
public class NameEntryPanel : MonoBehaviour
{
    private const int NAME_LIMIT = 12;
    private const string DEFAULT_NAME = "NONAME";

    [Header("References")]
    [SerializeField, Tooltip("이름을 입력받을 인풋필드")]
    private InputField _playerNameInput;

    [SerializeField, Tooltip("확인 버튼. 비어 있으면 비활성화된다.")]
    private Button _confirmButton;

    private void Awake()
    {
        // Awake에서 text를 캐시하지 않는다. 그 시점의 값은 항상 비어 있다.
        _playerNameInput.characterLimit = NAME_LIMIT;
    }

    private void OnEnable()
    {
        _playerNameInput.onValueChanged.AddListener(OnValueChanged);
        OnValueChanged(_playerNameInput.text);

        // 창이 열리면 바로 타이핑할 수 있게 한다.
        _playerNameInput.ActivateInputField();
    }

    private void OnDisable()
    {
        _playerNameInput.onValueChanged.RemoveListener(OnValueChanged);
    }

    private void Update()
    {
        if (!IsSubmitPressed()) { return; }

        // 캐시가 아니라 인풋필드의 현재 값을 본다.
        if (_playerNameInput.text.Length == 0) { return; }

        Submit();
    }

    /// <summary>확인 버튼의 OnClick에 연결한다.</summary>
    public void Submit()
    {
        string typed = _playerNameInput.text.Trim();
        string playerName = typed.Length > 0 ? typed : DEFAULT_NAME;

        PlayerPrefs.SetString("CurrentPlayerName", playerName);
        // 씬을 넘기기 전이라면 여기서 명시적으로 쓴다.
        PlayerPrefs.Save();

        // 이후 처리(랭킹 계산, 씬 전환)는 호출부에 맡긴다.
    }

    private void OnValueChanged(string value)
    {
        // 비어 있으면 버튼을 잠근다. 상태가 화면에 드러나므로 디버깅이 쉬워진다.
        if (_confirmButton != null)
        {
            _confirmButton.interactable = value.Trim().Length > 0;
        }
    }

    private static bool IsSubmitPressed()
    {
        // 숫자패드 엔터는 별개 KeyCode다.
        return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter);
    }
}
```

몇 가지 의도를 적어둔다.

- **`Awake`에서 `text`를 캐시하지 않는다.** 그 시점 값은 비어 있고, 캐시가
  바로 이 글의 버그였다.
- **`characterLimit`을 코드에서 정한다.** 매뉴얼 표현으로 "인풋필드에 입력할
  수 있는 **최대 문자 수**"다. 이름 칸이 무한히 길어질 이유가 없다.
- **빈 입력에 기본 이름을 준다.** 글쓴이가 남긴 숙제 — "Length가 0일때
  플레이어 이름을 뭐라 할지?를 주는 코드가 또 있어야 할 것 같아요" — 가 이
  자리다. `Trim()`까지 해야 공백만 친 경우도 걸린다.
- **`onValueChanged`로 버튼을 잠근다.** 못 누르는 이유가 화면에 보인다.
- **`ActivateInputField()`로 포커스를 준다.** 문서 표현으로 "InputField를
  활성화해 이벤트 처리를 시작하는 함수"다. 창이 뜨자마자 타이핑할 수 있으면
  마우스를 아예 안 거친다 — 글쓴이의 원래 목표에 하나 더 가까워진다.
- **`PlayerPrefs.Save()`를 명시적으로 부른다.** 쓰기는 기본적으로
  `OnApplicationQuit`에 일어나므로, 씬을 넘기거나 이 창을 닫는 경계에서 한 번
  불러둔다. 저장 위치와 타이밍은
  [PlayerPrefs 글](/posts/playerprefs-storage-path/)에 정리했다.

### 원문 코드에서 고친 것

- **조건문이 캐시 대신 `.text`를 본다.** 이 글의 본론이다.
- **`playerName` 필드를 없앴다.** 인풋필드가 이미 값을 들고 있는데 같은 값을
  한 벌 더 두면 둘이 어긋난다. 상태를 두 군데 두지 않는다.
- **`playerNameInput.GetComponent<InputField>()`를 지웠다.**
  `playerNameInput`이 이미 `InputField`다. 자기 자신을 다시 찾는 호출이다.
- **`public` 필드를 `[SerializeField] private`로 바꿨다.** 인스펙터에는
  그대로 보이면서 외부에서 대입할 수는 없게 된다.
- **숫자패드 엔터를 같이 본다.**
- **빈 입력과 공백 입력을 처리한다.**
- **`PlayerPrefs.Save()`를 부른다.**
- **`GameManager.instance` 호출을 뺐다.** 입력 창이 랭킹 계산과 씬 전환까지
  직접 하면 재사용이 안 된다. 확정만 하고 나머지는 호출부에 넘긴다.

### 쓰지 말아야 할 자리

- **`Awake`에서 `text`를 캐시하기.** 그 시점 값은 비어 있다.
- **같은 값을 필드와 컴포넌트 양쪽에 두기.** 조건문이 어느 쪽을 보는지 헷갈리는
  순간 이 글의 버그가 난다.
- **`Input.GetKeyDown`을 Input System 프로젝트에서 쓰기.** 예외가 난다.
- **`KeyCode.Return`만 보기.** 숫자패드 엔터가 빠진다.
- **`onEndEdit` 하나로 "엔터 제출"을 구현하기.** 포커스를 잃을 때도 발생한다.
- **새 프로젝트에서 굳이 이 컴포넌트를 고르기.** 컴포넌트 메뉴에서 Legacy
  아래에 있다.
- **비밀번호를 `PlayerPrefs`에 넣기.** `contentType`을 `Password`로 둬도
  저장은 평문이다. `PlayerPrefs` 문서가 직접 말한다.

> Unity는 PlayerPrefs를 로컬 레지스트리에 **암호화 없이** 저장한다.
> **민감한 데이터를 저장하는 데 PlayerPrefs를 쓰지 마라.**

## 정리

- **원문 코드의 키보드 경로는 마우스 버튼을 한 번 누른 뒤에야 열린다.**
  `Update`의 조건문이 인풋필드가 아니라 `Awake`에서 캐시한 문자열을 보기
  때문이다.
- 실제로 검사되는 것은 "한 글자 이상 입력했는가"가 아니라
  **"`InputName`이 실행된 적이 있는가"**다.
- **최소 수정은 조건문에서 `.text`를 직접 읽는 것**이고, 근본 수정은
  **캐시 필드를 없애는 것**이다.
- **`text`는 화면에 보이는 것과 다를 수 있다.** 문서가 직접 그렇게 적는다.
- **`onEndEdit`은 제출뿐 아니라 포커스를 잃을 때도 발생한다.** 매뉴얼 표현
  그대로다. `onSubmit`은 API 레퍼런스에 설명이 같게 적혀 있어 차이를 단정하지
  않았다.
- **Placeholder는 선택 요소다.** 지워도 되고, 지울 거면 컴포넌트의 참조도
  비운다.
- **`Input.GetKeyDown`은 Active Input Handling이 Input System일 때 예외를
  던진다.** 둘 다 쓰려면 `Both`.
- **`KeyCode.Return`과 `KeyCode.KeypadEnter`는 별개다.**
- **이 컴포넌트는 컴포넌트 메뉴에서 Legacy 아래에 있다.**
- **`contentType = Password`는 화면만 가린다.** `text`는 평문이고, 그 값을
  `PlayerPrefs`에 넣으면 안 된다.

원문이 코드를 쓴 동기는 정확했다. **"키보드에서 마우스로 손을 옮기기 싫다"는
건 실제로 이름 입력 창에서 가장 거슬리는 지점**이고, 그래서 두 경로를 모두
연 것도 맞는 설계다. 걸린 것은 설계가 아니라 **값을 어디서 읽느냐** 한 줄
이었다.

---

### 참고

- [InputField — Unity UI 패키지 API](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.InputField.html)
- [Input Field — Unity UI 패키지 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-InputField.html)
- [KeyCode — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/KeyCode.html)
- [PlayerPrefs.Save — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/PlayerPrefs.Save.html)
- [Unity Issue Tracker — UnityEngine.Input 사용 시 InvalidOperationException](https://issuetracker.unity.com/issues/13441/error-invalidoperationexception-you-are-trying-to-read-input-using-the-unityengineinput-class-but-you-have-switched-active-input-handling-to-input-system-package-in-player-settings-is-present-when-usi)

이 글의 출발점이 된 자료는 [김시루시루르 — \[Unity UGUI\] InputField 인풋 필드 + α (플레이어 이름 입력)](https://drybone-developer.tistory.com/94)
(2021-12-06)이다. 인풋필드 구성 설명과 예제 코드를 그대로 따라가면서, 코드의
실행 순서를 짚고 각 API의 동작을 현행 문서와 대조했다.
