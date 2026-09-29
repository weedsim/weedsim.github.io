---
pubDatetime: 2026-09-29T15:00:00+09:00
title: "미할당 필드의 Fake Null은 에디터에서만 생긴다"
lang: ko
translationKey: unity-fake-null
featured: false
draft: false
tags:
  - Unity
  - C#
  - 메모리
description: "Fake Null의 원리 설명은 정확하다. 그런데 뒤에 붙은 '연산 비용 줄이기' 목록이 거의 전부 어긋난다. 같은 함수를 부르는 것을 더 싸다고 하고, 컴파일되지 않는 코드가 둘 있다."
---

게임 프로젝트를 만들며 공부하던 중에 **"Fake Null"이라는 게 있다**는 말을 듣고
찾아보다 스크랩한 글이다. 용어를 검색하면 상위에 나오는 종류의 글이고,
`UnityEngine.Object`의 Fake Null이 왜 생기는지를 2023년에 정리한 것이다. C++
네이티브 객체와 C# 래퍼의 수명이 다르다는 설명부터 시작해서, `==` 오버로딩,
`(object)` 캐스팅, `ReferenceEquals`까지 짚는다. **원리 설명은 정확하다.**

걸리는 건 뒤쪽 "연산 비용 줄이기" 목록이다. **여섯 항목 중 다섯이 어긋난다.**
같은 함수를 부르는 것을 더 싸다고 적고, **컴파일되지 않는 코드가 둘** 들어
있고, 마지막 "섞어 사용" 예제는 앞에서 자기가 설명한 원리와 전제가 반대다.

그리고 원리 쪽에도 빠진 단어가 하나 있다. Unity 공식 블로그가 미할당 필드를
설명하면서 붙여둔 **"에디터에서만"** 이다.

## 목차

## 메커니즘 설명은 정확하다

먼저 맞는 쪽부터. 클리핑의 요약이다.

> C++은 메모리를 포인터로 관리하고 C#은 가비지컬렉션이 메모리해제를 관리하며
> 이 차이점 때문에 Fake Null이 발생하게 된다.

Unity가 2014년에 쓴 공식 블로그가 같은 이야기를 한다.

> `GameObject`를 비롯해 `UnityEngine.Object`를 상속하는 모든 것의 **C++
> 객체 수명은 명시적으로 관리된다.** … C# 객체의 수명은 C# 방식으로,
> **가비지 컬렉터가 관리한다.**

> 이 객체를 null과 비교하면, 우리의 **커스텀 `==` 연산자가 이 경우에 "true"를
> 반환한다.** 실제 C# 변수는 정말로 null이 아닌데도 그렇다.

`(object)`로 캐스팅하면 오버로딩을 지나친다는 것도 맞다. 소스를 보면 이유가
바로 보인다. `UnityEngine.Object`의 비교는 전부 `CompareBaseObjects` 하나로
모인다.

```csharp
public static bool operator==(Object x, Object y) { return CompareBaseObjects(x, y); }

public static bool operator!=(Object x, Object y) { return !CompareBaseObjects(x, y); }

static bool CompareBaseObjects(UnityEngine.Object lhs, UnityEngine.Object rhs)
{
    bool lhsNull = ((object)lhs) == null;
    bool rhsNull = ((object)rhs) == null;

    if (rhsNull && lhsNull) return true;

    if (rhsNull) return !IsNativeObjectAlive(lhs);
    if (lhsNull) return !IsNativeObjectAlive(rhs);

    return lhs.m_EntityId == rhs.m_EntityId;
}
```

`IsNativeObjectAlive`가 네이티브 쪽을 확인하는 부분이고, 이게 **"예상보다
비싼" 이유**다. 블로그도 그렇게 적는다.

> `UnityEngine.Object`를 서로 비교하거나 null과 비교하는 것은 **예상보다
> 느리다.**

## 미할당 필드의 Fake Null은 에디터에서만이다

클리핑이 이렇게 적는다.

> Fake Null은 **\[SerializeField\]로 선언되어 유니티 에디터에서 아직 한번도
> 할당되지 않은 경우에도 Fake Null로 처리된다.**

맞는 말인데 **조건이 하나 빠졌다.** 블로그의 원문이다.

> MonoBehaviour에 필드가 있을 때, **에디터에서만**, 우리는 그 필드를 '진짜
> null'이 아니라 **'fake null' 객체로 설정한다.**

**"in the editor only"**가 붙어 있다. 왜 그렇게 하는지도 적혀 있다.

> 우리의 커스텀 `==` 연산자는 무언가가 이 fake null 객체 중 하나인지 **검사할
> 수 있고**, 그에 맞게 동작한다.

> "여기 이 MonoBehaviour에서 초기화되지 않은 필드에 접근하는 것 같습니다.
> 인스펙터를 써서 이 필드가 무언가를 가리키게 하세요"

**디버깅 메시지를 위한 장치**라는 뜻이다. 그래서 빌드에는 들어가지 않는다.

이 차이가 실무에서 어떻게 드러나는지 정리하면 이렇다.

| 상태 | `obj == null` | `ReferenceEquals(obj, null)` |
|---|---|---|
| 한 번도 할당 안 함 (에디터) | `true` | **`false`** (fake null 객체가 들어있다) |
| 한 번도 할당 안 함 (빌드) | `true` | **`true`** (진짜 null) |
| `Destroy` 직후 | `true` | `false` (래퍼가 살아 있다) |
| 정상 객체 | `false` | `false` |

**첫 줄과 둘째 줄이 다르다.** `ReferenceEquals`나 `(object)` 캐스팅으로 짠
분기는 **에디터에서 되던 것이 빌드에서 다르게 동작한다.** 클리핑도 "속도가
빠르다고 무조건 System.Object로 형변환 후 사용하는 것은 바람직하지 않다"고
경고하긴 하는데, 이유를 "SerializeField의 null은 무조건 Fake Null로 들어오기
때문"이라고만 적어서 **빌드에서는 그렇지 않다**는 절반이 빠져 있다.

## "연산 비용 줄이기" 목록을 하나씩

여섯 항목이 나열되어 있다. 하나씩 본다.

### 1. `if (gameObject)`는 `== null`과 같은 함수를 부른다

첫 항목이 이것이다.

> 1\. bool 타입으로 암시적 형변환 하여 사용하기
>
> `if (gameObject)`

**비용이 줄지 않는다.** 소스가 한 줄이다.

```csharp
public static implicit operator bool(Object exists)
{
    return !CompareBaseObjects(exists, null);
}
```

`==`가 부르는 `CompareBaseObjects(x, y)`와 **똑같은 함수에 `null`을 넣고 결과를
뒤집을 뿐**이다. 네이티브 확인도 그대로 일어난다.

읽기 좋아서 쓸 수는 있다. **비용을 줄이려고 쓰는 것이 아니다.**

### 2. `gameObject = null`은 컴파일되지 않는다

두 번째 항목의 코드다.

```csharp
Destroy(gameObject);
        gameObject = null;
```

`MonoBehaviour`의 `gameObject`는 `Component`에서 상속한 **읽기 전용
프로퍼티**다. 소스에 setter가 없다.

```csharp
public extern GameObject gameObject
{
    [FreeFunction("GetGameObject", HasExplicitThis = true)]
    get;
}
```

대입하는 순간 컴파일 에러다. 같은 문제가 목록 마지막에서 한 번 더 나온다.

```csharp
gameObject = gameObject ? gameObject : gameObject2;
```

**의도 자체는 맞다.** `Destroy` 뒤에 *내가 들고 있는 필드*를 `null`로 비워두면
그 뒤로는 진짜 null이 되니 검사도 싸지고 의미도 분명해진다. 다만 그 대상이
`gameObject`일 수는 없다. 내 클래스의 `_target` 같은 필드여야 한다.

덧붙이면 저 삼항 연산자는 `?.`(null 조건 연산자)가 아니라 **조건 연산자**이고,
조건 자리에서 암시적 `bool` 변환이 일어나므로 **Unity 검사를 제대로 한다.**
목록에 "싼 방법"으로 묶여 있지만 성격이 다르다.

### 3. `??`와 `?.`는 우회가 아니라 다른 검사다

클리핑은 `??`를 이렇게 소개한다.

```csharp
Destroy(go1);

go1 ?? go2; // go1이 null이면 go2 리턴, 아니라면 go1 그대로 리턴
```

**주석이 실제 동작과 다르다.** `Destroy(go1)` 뒤에 `go1`은 **진짜 null이
아니다.** 그러니 `??`는 `go2`가 아니라 **파괴된 `go1`을 그대로 돌려준다.**
블로그가 이 지점을 정확히 적어놨다.

> 이것은 `??` 연산자와 **일관성 없게 동작한다.** `??`도 null 검사를 하지만,
> 그쪽은 **순수한 C# null 검사**이고, **우리의 커스텀 null 검사를 부르도록
> 우회시킬 수 없다.**

"오버로딩한 연산자가 아니라서 Fake Null을 출력하지 않는다"는 클리핑의 설명은
기술적으로는 맞다. 그런데 그게 **장점처럼 "비용 줄이기" 목록에 들어가 있는
것**이 문제다. 파괴된 객체를 받아 쓰게 된다.

Microsoft가 배포하는 Unity 분석기가 이 패턴들을 **Correctness 범주의 진단**으로
잡는다.

| 규칙 | 내용 |
|---|---|
| `UNT0007` | Null coalescing on Unity objects (`??`) |
| `UNT0008` | Null propagation on Unity objects (`?.`) |
| `UNT0023` | Coalescing assignment on Unity objects (`??=`) |
| `UNT0029` | Pattern matching with null on Unity objects |

**성능 항목이 아니라 정확성 항목이다.** 이 블로그의
[코드 최적화 문서 글](/posts/unity-code-optimization/)에서도 Unity가 금지
목록 첫 줄에 `ReferenceEquals`를 올려둔 걸 다뤘는데, 같은 이유다.

### 4. "섞어 사용" 예제는 전제가 뒤집혀 있다

마지막 항목이다.

```csharp
if(ReferenceEquals(gameObject, null) && gameObject == false)
        {
        }
```

붙어 있는 설명이 이렇다.

> Destory상태라면 **ReferenceEquals에선 true가 나오고** bool 타입으로 암시적
> 형변환 한 gameObject는 True로 나옴

**틀렸다.** `Destroy` 상태에서 `ReferenceEquals(obj, null)`은 **`false`**다.
C# 래퍼가 아직 살아 있기 때문이고, 그게 이 글 앞부분에서 클리핑 자신이
설명한 Fake Null의 정의다. 같은 글 안에서 전제가 뒤집혔다.

논리도 무의미해진다. `CompareBaseObjects`를 따라가보면 바로 나온다.

- `ReferenceEquals(obj, null)`이 `true` → 진짜 null이다.
- 그러면 `CompareBaseObjects(obj, null)`에서 `lhsNull`과 `rhsNull`이 둘 다
  참이라 **즉시 `true`를 반환**한다.
- 따라서 `(bool)obj`는 `!true` = `false`.

즉 **앞 조건이 참이면 뒤 조건은 항상 참**이다. `&&`로 묶은 두 번째 검사는
아무것도 걸러내지 않는다. 이 식은 `ReferenceEquals(gameObject, null)` 한
줄과 같다.

## 맞게 짚은 것: 한쪽만 null일 때가 가장 비싸다

목록은 어긋났지만, 그 바로 앞 문장은 정확하다.

> 가장 비싼 연산은 **한쪽만 Null일 경우**이다.

`CompareBaseObjects`의 분기가 그대로 근거다.

- 둘 다 null → `return true`. 네이티브 확인 **없음**.
- 한쪽만 null → `IsNativeObjectAlive(...)`. 네이티브 확인 **있음**.
- 둘 다 객체 → `m_EntityId` 비교. 네이티브 확인 **없음**.

**네이티브를 건드리는 건 한쪽만 null인 가지 하나**다. 그리고 우리가 실제로
제일 많이 쓰는 `obj == null`이 정확히 그 가지다. 클리핑이 출처 없이 적은
문장인데, 소스가 뒷받침한다.

다만 같이 적힌 "`if(go == null)` 연산은 `GetComponent` 연산보다 비싸다"는
**확인하지 못했다.** Unity 블로그가 말하는 건 "예상보다 느리다"까지이고,
`GetComponent`와 비교한 서술은 찾지 못했다. 단정하지 않겠다.

## 어디에 왜 쓰나

Fake Null을 알고 나면 오히려 규칙이 단순해진다. **`UnityEngine.Object`에는
`== null` 하나만 쓴다.**

### 기본은 `== null` 하나다

```csharp
using UnityEngine;

public class TargetTracker : MonoBehaviour
{
    [Header("Target")]
    [SerializeField, Tooltip("추적할 대상")]
    private Transform _target;

    private void Update()
    {
        // Unity 오브젝트의 표준 검사. 파괴된 대상도, 미할당도 여기서 걸린다.
        if (_target == null)
        {
            return;
        }

        transform.LookAt(_target);
    }

    /// <summary>대상을 파괴하고 내 참조도 비운다.</summary>
    public void DestroyTarget()
    {
        if (_target == null)
        {
            return;
        }

        Destroy(_target.gameObject);

        // 내가 들고 있는 필드는 비울 수 있다. 여기서부터는 진짜 null이다.
        _target = null;
    }
}
```

`_target = null`이 클리핑의 두 번째 항목이 하려던 것이다. **`gameObject`가
아니라 내 필드**여야 컴파일된다. 그리고 이렇게 비워두면 그 뒤의 검사는 진짜
null 검사가 되므로, 의도한 "비용 줄이기"도 여기서 자연히 이뤄진다.

`??`나 `?.`로 바꾸고 싶어지는 자리도 이렇게 쓴다.

```csharp
// 잘못: 파괴된 _target이 그대로 돌아온다
// Transform current = _target ?? _fallback;

// 맞게: Unity 검사를 거친다
Transform current = _target != null ? _target : _fallback;

// 잘못: 파괴된 오브젝트에 접근한다
// _target?.gameObject.SetActive(false);

// 맞게
if (_target != null) { _target.gameObject.SetActive(false); }
```

한 가지 예외는 **순수 C# 객체**다. `UnityEngine.Object`를 상속하지 않는
클래스에는 `?.`도 `??`도 정상이다. 이 구분은 글로 써두면 코드 리뷰에서
바로 갈린다.

```csharp
private PlayerInputSystem _input;      // 순수 C# 객체 → ?. 가능
private Transform _target;             // UnityEngine.Object → ?. 금지

private void OnDestroy()
{
    _input?.Dispose();                 // 이쪽은 맞다
    // _target?.gameObject ...         // 이쪽은 쓰면 안 된다
}
```

### 쓰지 말아야 할 자리

- **`ReferenceEquals`나 `(object)` 캐스팅으로 Unity 오브젝트 검사.** 파괴된
  객체를 못 거르고, **미할당 필드는 에디터와 빌드에서 결과가 다르다.**
- **`??`, `??=`, `?.`, `is null` 패턴.** 분석기가 정확성 문제로 잡는다.
- **`if (obj)`를 비용 절감으로 쓰기.** `== null`과 같은 함수를 부른다.
- **`gameObject`나 `transform`에 대입하기.** 읽기 전용 프로퍼티다.
- **매 프레임 `== null`을 반복해서 부르기.** 줄이고 싶다면 검사를 없애는 게
  아니라 **횟수를 줄이거나 필드를 `null`로 비워** 진짜 null로 만든다.

## 정리

- **원리 설명은 정확하다.** 네이티브 C++ 객체와 C# 래퍼의 수명이 달라서 생기고,
  `==` 오버로딩이 그 차이를 가려준다.
- **미할당 필드의 fake null은 "에디터에서만"이다.** 블로그 원문이
  **"in the editor only"**라고 못 박는다. 빌드에서는 진짜 null이다.
- 그래서 **`ReferenceEquals`·`(object)` 기반 분기는 에디터와 빌드가 갈린다.**
- **`if (gameObject)`는 비용을 줄이지 않는다.** 소스가
  `!CompareBaseObjects(exists, null)` 한 줄이다. `==`와 같은 함수다.
- **`gameObject = null`은 컴파일되지 않는다.** `Component.gameObject`는 getter만
  있다. 비우려면 내가 선언한 필드여야 한다.
- **`??`는 파괴된 객체를 그대로 돌려준다.** 블로그 표현으로 "커스텀 null
  검사를 부르도록 **우회시킬 수 없다**". 분석기 `UNT0007`·`UNT0008`·`UNT0023`·
  `UNT0029`가 **정확성** 범주로 잡는다.
- **"섞어 사용" 예제의 전제가 뒤집혀 있다.** `Destroy` 상태에서
  `ReferenceEquals`는 `false`다. 그 결과 두 번째 조건은 아무것도 걸러내지
  않는다.
- **"한쪽만 null일 때가 가장 비싸다"는 맞다.** `CompareBaseObjects`에서 네이티브
  확인이 일어나는 가지가 거기뿐이다.
- **"`GetComponent`보다 비싸다"는 확인하지 못했다.** 블로그는 "예상보다
  느리다"까지만 말한다.

Fake Null을 설명하는 앞부분과 최적화를 말하는 뒷부분이 **서로 다른 글처럼
읽힌다.** 앞에서 "`==`가 네이티브를 확인해준다"고 설명해놓고, 뒤에서는 그
확인을 건너뛰는 방법들을 이점으로 나열한다. **건너뛰면 빨라지는 게 맞지만,
빨라지는 이유가 곧 틀리는 이유다.**

---

### 참고

- [Custom == operator, should we keep it? — Unity 블로그](https://unity.com/blog/engine-platform/custom-operator-should-we-keep-it)
- [UnityEngineObject.bindings.cs — UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Scripting/UnityEngineObject.bindings.cs)
- [Component.bindings.cs — UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Scripting/Component.bindings.cs)
- [Microsoft.Unity.Analyzers 진단 목록](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/index.md)

이 글의 출발점이 된 자료는 [usingsystem — \[Unity\] 유니티 오브젝트 Fake Null과 Null 처리](https://usingsystem.tistory.com/347)
(2023-07-13)이다. 원리 설명을 그대로 따라가면서, 뒤에 붙은 최적화 목록의 각
항목을 Unity 공식 블로그와 UnityCsReference 소스로 대조했다.
