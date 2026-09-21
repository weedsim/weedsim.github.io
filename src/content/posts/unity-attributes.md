---
pubDatetime: 2026-09-21T20:00:00+09:00
title: "[MenuItem]은 Editor 폴더로 가야 하는데, MonoBehaviour는 거기 못 간다"
lang: ko
translationKey: unity-attributes
featured: false
draft: false
tags:
  - Unity
  - C#
  - 직렬화
  - 에디터
description: "애트리뷰트 열여덟 개를 정리한 2021년 글을 현행 문서와 대조했다. 대부분 맞는데, 한 예제는 요구가 서로 충돌하고, 하나는 문서가 쓰지 말라고 하며, 하나는 막아주는 범위가 생각보다 좁다."
---

애트리뷰트를 다섯 묶음으로 나눠 정리한 2021년 글이다. `[SerializeField]`부터
`[CreateAssetMenu]`까지 **열여덟 개**가 예제와 함께 들어 있다.

내가 쓰는 컨벤션이 `[Header]`·`[Tooltip]`·`[Range]`를 요구한다. 변수의
**용도를 설명하고 값의 범위를 지정하라**는 뜻이라 거의 모든 스크립트에 붙이고
있는데, 정작 **각각이 어디까지 해주는지** 확인한 적은 없었다. 그래서
대조해봤다.

대부분 맞다. 다만 세 군데가 걸렸다. 예제 하나는 **요구가 서로 충돌하고**,
하나는 **문서가 대놓고 쓰지 말라고 하며**, 하나는 **막아주는 범위가 생각보다
좁다.**

## 목차

## 열여덟 개짜리 목록은 대체로 맞다

먼저 확인한 것들이다. 원문의 서술이 현행 문서와 어긋나지 않는다.

| 애트리뷰트 | 원문의 요지 | 확인 |
|---|---|---|
| `[SerializeField]` | private·protected를 인스펙터에 노출 | 맞음 |
| `[System.Serializable]` | 클래스·구조체를 인스펙터에 펼침 | 맞음 |
| `[Header]` · `[Space]` · `[Tooltip]` | 인스펙터 구분과 설명 | 맞음 |
| `[Range(min, max)]` | 슬라이더로 범위 제한 | **조건부** |
| `[Multiline]` vs `[TextArea]` | 고정 줄 수 vs 유동 + 스크롤 | 맞음 |
| `[RequireComponent]` | 붙일 때 함께 추가 | 맞음 |
| `[DisallowMultipleComponent]` | 중복 부착 방지 | 맞음 |
| `[CreateAssetMenu]` | `ScriptableObject` 전용 | 맞음 |
| `[ExecuteInEditMode]` | 플레이 아닐 때도 호출 | **비권장** |

원문이 스스로 짚은 것 중에 특히 정확한 게 하나 있다. `[Range]`를 설명하면서
**코드로 범위 밖의 값을 넣으면 그대로 적용된다**고 실험 결과를 적어뒀는데,
이게 아래 세 번째 절의 내용이다.

## `[MenuItem]` 예제만 갈 곳이 없다

원문의 네 번째 묶음에 `[UnityEditor.MenuItem]`이 있다. 예제가 이렇다.

```csharp
public class SomeClass : MonoBehaviour
{
    public string _string;

    [UnityEditor.MenuItem("TestEditor/MenuItemTest")]
    static void MenuItemTest()
    {
        Debug.Log("MenuItemTest");
    }
}
```

에디터에서는 동작한다. 상단 메뉴바에 항목이 생기고 눌리면 로그가 찍힌다.
문제는 **이 클래스를 어디에 둘 것인가**다.

`MenuItem`은 **`UnityEditor` 네임스페이스**의 클래스다. 그리고 Unity 매뉴얼이
에디터 스크립트의 위치와 성질을 이렇게 적어놨다.

> **`Editor` 폴더** — 에디터 스크립트를 위해 예약되어 있다. 에디터에 작성
> 시점의 기능을 추가하지만 **런타임에 플레이어 빌드에서는 사용할 수 없다.**

그런데 바로 다음 문장이 걸린다.

> **`Editor` 폴더 안의 MonoBehaviour 스크립트는 GameObject에 컴포넌트로 붙일
> 수 없다.**

**요구 두 개가 충돌한다.**

| 요구 | 결론 |
|---|---|
| `UnityEditor`를 쓰니까 → `Editor` 폴더로 | 그러면 MonoBehaviour로 못 붙인다 |
| MonoBehaviour니까 → 일반 폴더로 | 그러면 플레이어 빌드에 `UnityEditor`가 따라간다 |

에디터 어셈블리는 플레이어 빌드에서 쓸 수 없으므로, 일반 폴더에 둔 이 클래스는
**빌드 시점에 참조를 해결할 곳이 없다.** 에디터에서 잘 돌던 코드가 빌드에서
멈추는 전형적인 모양이다.

해법은 둘이다. 하나는 **전처리기로 잘라내는 것**이다.

```csharp
public class SomeClass : MonoBehaviour
{
    [SerializeField]
    private string _label;

#if UNITY_EDITOR
    [UnityEditor.MenuItem("TestEditor/MenuItemTest")]
    private static void MenuItemTest()
    {
        Debug.Log("MenuItemTest");
    }
#endif
}
```

`UNITY_EDITOR`는 매뉴얼의 플랫폼별 컴파일 예제에 나오는 심볼이고, 이렇게
감싸면 플레이어 빌드에서는 그 구간이 아예 컴파일되지 않는다. 다른 하나는
**에디터 코드를 별도 클래스로 떼어 `Editor` 폴더나 에디터 어셈블리에 두는
것**이다. 매뉴얼도 `Editor` 폴더의 대안으로 어셈블리 정의 에셋을 든다.
어셈블리를 나누는 이야기는
[Unity 코드 최적화 문서](/posts/unity-code-optimization/)의 컴파일 항목에도
나온다.

### `[ContextMenu]`는 같은 묶음이 아니다

원문은 `[MenuItem]`과 `[ContextMenu]`를 같은 묶음에 나란히 둔다. 쓰임이
비슷해 보이지만 **소속이 다르다.**

| | `[MenuItem]` | `[ContextMenu]` |
|---|---|---|
| 네임스페이스 | **`UnityEditor`** | **`UnityEngine`** |
| 메서드 | "**정적 함수만** 이 애트리뷰트를 쓸 수 있다" | "함수는 **정적이 아니어야** 한다" |
| 나타나는 곳 | 상단 메뉴바 | 컴포넌트 우클릭 메뉴 |
| MonoBehaviour에 두기 | **가드 필요** | 그냥 된다 |

`ContextMenu`가 `UnityEngine`에 있다는 게 핵심이다. **컴포넌트 하나에 대한
에디터용 동작이라면 `[ContextMenu]`가 맞는 도구**고, 가드도 필요 없다. 정적
메서드 요구가 정반대라는 것도 같이 기억해둘 만하다.

## `[Range]`가 막는 것은 인스펙터뿐이다

원문이 실험으로 찾아낸 부분이다.

> 코드에서 수정시 최초에 범위를 벗어나는 값을 입력했다면 초기화하는 부분에서
> 범위 이내로 수정해주지만 그 이후 변경되는 사항에 대해서는 그대로
> 적용됩니다.

문서를 보면 왜 그런지가 드러난다. 설명 문장은 이렇게 시작한다.

> float 또는 int 변수를 **특정 범위로 제한**하는 데 사용하는 애트리뷰트.

읽으면 값이 항상 그 범위에 머무를 것처럼 들린다. 그런데 이어지는 문장이
실제 동작을 말해준다.

> 이 애트리뷰트를 사용하면 float 또는 int가 인스펙터에서 기본 숫자 필드 대신
> **슬라이더로 표시된다.**

**문서가 설명하는 메커니즘은 인스펙터 슬라이더 하나뿐이다.** 런타임에 코드로
대입하는 값을 제한한다는 말은 없다. 원문의 실험 결과가 이와 맞는다 — 인스펙터를
거쳐 직렬화된 초기값은 범위로 들어오지만, 그 뒤 `_range = 8;`은 그대로 8이
된다.

그래서 `[Range]`는 **기획자에게 주는 가드레일**이지 **코드에 대한 불변식**이
아니다. 코드 쪽에서도 보장이 필요하면 따로 막아야 한다.

```csharp
[Header("Speed")]
[SerializeField, Range(1f, 20f), Tooltip("이동 속도(m/s)")]
private float _moveSpeed = 5f;

public void SetSpeed(float value)
{
    // 인스펙터 밖에서 들어오는 값은 여기서 막는다.
    _moveSpeed = Mathf.Clamp(value, MIN_SPEED, MAX_SPEED);
}
```

`Mathf.Clamp`에도 그 나름의 함정이 있는데, 그건
[인자를 거꾸로 주면 한쪽만 예외를 던진다](/posts/mathf-clamp/)에 따로
정리해뒀다.

## `[ExecuteInEditMode]`는 문서가 쓰지 말라고 한다

원문은 이 애트리뷰트를 평범하게 소개한다 — "플레이 상태가 아닐때도 업데이트가
코드가 호출됩니다." 동작 설명은 맞다. 그런데 현행 스크립팅 레퍼런스에 문장이
하나 붙어 있다.

> 이 애트리뷰트는 **권장되지 않는다.** 프리팹 편집 모드에서의 편집과 호환되지
> 않기 때문이다. **권장되는 대안은 `ExecuteAlways`다.**

`ExecuteAlways` 쪽 설명은 이렇다.

> MonoBehaviour 파생 클래스가 런타임에 더해 **Edit 모드와 프리팹 편집
> 모드에서도** 실행되게 한다.

차이가 프리팹 편집 모드다. `ExecuteInEditMode`인 컴포넌트를 프리팹 모드에서
열어둔 채 플레이에 들어가면, Unity가 **프리팹이 잘못 수정되는 것을 막으려고
프리팹 편집 모드를 빠져나간다.** `ExecuteAlways`는 그러지 않는다.

원문이 2021년 8월 글이니 그때 기준으로는 자연스러운 소개다. 다만 지금
**새로 쓰는 코드라면 `ExecuteAlways`** 다.

## 숨기는 것과 직렬화하지 않는 것

원문이 `[NonSerialized]`와 `[HideInInspector]`를 나란히 놓고 차이를 이렇게
적는다 — 애트리뷰트를 붙이기 전에 인스펙터에서 바꿔둔 값이
`HideInInspector`는 남고 `NonSerialized`는 안 남는다고. **관찰은 정확하다.**
다만 이유를 한 줄로 당기면 더 쓸모가 있다.

`HideInInspector` 문서가 그 이유를 직접 말한다.

> 변수가 인스펙터에 나타나지 않도록 표시한다. 기본적으로 직렬화된 변수는
> private이더라도 인스펙터에 자동으로 나타난다. 이 애트리뷰트가 붙은 변수는
> **직렬화되면서 인스펙터에는 표시되지 않을 수 있다.**

즉 두 애트리뷰트는 **끄는 스위치가 다르다.**

| | 직렬화 | 인스펙터 표시 |
|---|---|---|
| (기본 public 필드) | 됨 | 보임 |
| `[HideInInspector]` | **됨** | 안 보임 |
| `[NonSerialized]` | **안 됨** | 안 보임 |
| `[SerializeField] private` | 됨 | 보임 |

`HideInInspector`는 **보여주기만 끈다.** 값은 여전히 씬이나 프리팹에 저장되고,
그래서 전에 설정해둔 값이 남는다. `NonSerialized`는 **저장 자체를 끄니까**
재생할 때마다 기본값으로 돌아온다.

실무에서 갈리는 기준은 이렇다. **에디터에서 건드리면 안 되지만 값은
보존해야 하는 것**(런타임에 계산해 캐싱해두는 참조 같은 것)은
`[SerializeField] [HideInInspector]`, **애초에 저장할 이유가 없는 것**은
`[NonSerialized]`다.

무엇이 직렬화되는지의 규칙 자체가 인스펙터에 무엇이 보이는지를 결정한다는
이야기는 [JsonUtility 쪽](/posts/unity-jsonutility/)에서 같은 직렬화기를
두고 한 번 다뤘다.

## 어디에 왜 쓰나

애트리뷰트는 **기획자·아티스트와 같은 인스펙터를 보는 비용**을 줄이는 도구다.
코드가 아니라 협업의 문제다.

### 컨벤션이 요구하는 최소 세트

내가 쓰는 컨벤션이 요구하는 조합을 한 컴포넌트에 모으면 이렇다.

```csharp
using UnityEngine;

/// <summary>
/// 인스펙터에 노출되는 설정을 한곳에 모은 이동 컴포넌트.
/// </summary>
[RequireComponent(typeof(CharacterController))]
[DisallowMultipleComponent]
[AddComponentMenu("Player/Player Mover")]
public class PlayerMover : MonoBehaviour
{
    private const float MIN_SPEED = 0.5f;
    private const float MAX_SPEED = 20f;

    [Header("Movement")]
    [SerializeField, Range(MIN_SPEED, MAX_SPEED), Tooltip("이동 속도(m/s)")]
    private float _moveSpeed = 5f;

    [SerializeField, Range(0f, 720f), Tooltip("회전 속도(도/초)")]
    private float _turnSpeed = 360f;

    [Space]
    [Header("Debug")]
    [SerializeField, Tooltip("체크하면 이동 벡터를 기즈모로 그린다")]
    private bool _drawGizmos;

    // 저장은 하되 인스펙터에서는 건드리지 못하게 한다.
    [SerializeField, HideInInspector]
    private Vector3 _lastMoveDirection;

    // 저장할 이유가 없는 런타임 상태.
    [System.NonSerialized]
    public bool IsSprinting;

    private CharacterController _controller;

    private void Awake()
    {
        _controller = GetComponent<CharacterController>();
    }

    [ContextMenu("Reset Speeds")]
    private void ResetSpeeds()
    {
        _moveSpeed = 5f;
        _turnSpeed = 360f;
    }
}
```

몇 가지 의도를 적어둔다.

- **클래스 애트리뷰트 셋이 계약을 적는다.** `RequireComponent`는 의존성을,
  `DisallowMultipleComponent`는 중복 부착 금지를, `AddComponentMenu`는 메뉴
  위치를 인스펙터에 그대로 드러낸다.
- **`[Range]`의 경계를 `const`로 뺐다.** 애트리뷰트 인자는 컴파일 타임 상수여야
  하니 `const`만 가능한데, 덕분에 코드 쪽 `Mathf.Clamp`과 **같은 숫자를**
  쓰게 된다. 매직 넘버를 피하라는 컨벤션과도 맞는다.
- **`[ContextMenu]`를 썼다.** `[MenuItem]`이 아니다. 이 컴포넌트 하나에 대한
  동작이고, `UnityEngine`이라 가드가 필요 없다. 메서드가 정적이 아니어야
  한다는 요구도 이 자리에 맞는다.
- **`HideInInspector`와 `NonSerialized`를 의도대로 나눠 썼다.** 앞 절의 표가
  그 기준이다.

### 에디터 전용 코드를 안전하게 두는 법

프로젝트 전역에 걸친 도구라면 `[MenuItem]`이 맞다. 다만 **MonoBehaviour와
같은 파일에 두지 않는다.**

```csharp
// Assets/Editor/LevelTools.cs  ← Editor 폴더
using UnityEditor;
using UnityEngine;

public static class LevelTools
{
    [MenuItem("Tools/Snap Selection To Ground")]
    private static void SnapSelectionToGround()
    {
        Debug.Log($"{Selection.gameObjects.Length}개 선택됨");
    }
}
```

`MonoBehaviour`가 아니라 **평범한 정적 클래스**라 "컴포넌트로 못 붙인다"는
제약에 걸리지 않고, `Editor` 폴더에 있으니 플레이어 빌드에도 따라가지 않는다.
앞 절의 충돌이 여기서는 생기지 않는다.

### 쓰지 말아야 할 자리

- **MonoBehaviour 안의 맨몸 `[UnityEditor.MenuItem]`.** 이 글의 출발점이다.
  가드를 씌우거나 클래스를 분리한다.
- **`[Range]`를 런타임 불변식으로 믿는 것.** 인스펙터 밖에서 들어오는 값은
  따로 막아야 한다.
- **새 코드에 `[ExecuteInEditMode]`.** 문서가 `ExecuteAlways`를 권한다.
- **`[HideInInspector]`로 "저장 안 되게" 하려는 것.** 그건
  `[NonSerialized]`다.

## 정리

- **열여덟 개 중 대부분은 2021년 설명 그대로 유효하다.** 인스펙터 꾸미기 계열은
  손댈 게 없다.
- **`[MenuItem]`은 `UnityEditor`, `[ContextMenu]`는 `UnityEngine`.** 같은
  묶음처럼 보이지만 하나는 플레이어 빌드에 갈 수 없고 하나는 간다. 정적 메서드
  요구도 정반대다.
- **MonoBehaviour에 `[MenuItem]`을 두면 요구가 충돌한다.** `Editor` 폴더의
  MonoBehaviour는 컴포넌트로 못 붙고, 일반 폴더의 `UnityEditor` 참조는
  플레이어 빌드에서 해결되지 않는다. `#if UNITY_EDITOR`로 감싸거나 클래스를
  분리한다.
- **`[Range]`가 문서에서 보장하는 건 인스펙터 슬라이더뿐이다.** 코드로 넣는
  값은 그대로 들어간다. 원문의 실험 결과가 맞다.
- **`[ExecuteInEditMode]`는 문서가 직접 비권장으로 적어뒀다.** 프리팹 편집
  모드와 호환되지 않는다. 대안은 `ExecuteAlways`.
- **`[HideInInspector]`는 표시만 끄고 직렬화는 남긴다.** 저장까지 끄는 건
  `[NonSerialized]`다.

애트리뷰트는 한 줄짜리라 **무엇을 켜는지**는 쉽게 외워지는데 **무엇을 끄지
않는지**는 잘 안 보인다. 이 글에서 걸린 세 가지가 전부 그 모양이었다 —
막아주는 줄 알았던 범위, 따라오지 않을 줄 알았던 네임스페이스, 바뀐 줄 몰랐던
권장 사항.

---

### 참고

- [RangeAttribute — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/RangeAttribute.html)
- [MenuItem](https://docs.unity3d.com/ScriptReference/MenuItem.html)
- [ContextMenu](https://docs.unity3d.com/ScriptReference/ContextMenu.html)
- [ExecuteInEditMode](https://docs.unity3d.com/ScriptReference/ExecuteInEditMode.html)
- [ExecuteAlways](https://docs.unity3d.com/ScriptReference/ExecuteAlways.html)
- [HideInInspector](https://docs.unity3d.com/ScriptReference/HideInInspector.html)
- [Special folder names — Unity 매뉴얼](https://docs.unity3d.com/Manual/SpecialFolders.html)
- [Platform dependent compilation](https://docs.unity3d.com/Manual/PlatformDependentCompilation.html)

이 글의 출발점이 된 자료는 [자가라o — \[Unity\] Attribute 애트리뷰트](https://zagara.tistory.com/16)
(2021-08-13)이다. 항목 구성을 따라가며 현행 스크립팅 레퍼런스·매뉴얼과 대조했다.
