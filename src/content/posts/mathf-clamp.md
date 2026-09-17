---
pubDatetime: 2026-09-17T14:00:00+09:00
title: "Clamp이 두 개다: 인자를 거꾸로 주면 한쪽만 예외를 던진다"
lang: ko
translationKey: mathf-clamp
featured: false
draft: false
tags:
  - Unity
  - C#
  - 수학
  - 카메라
description: "Mathf.Clamp 설명은 네 줄이면 끝난다. 문제는 그 네 줄 바깥이다. 인자를 거꾸로 줬을 때, NaN이 들어왔을 때, 그리고 각도를 클램프할 때 무슨 일이 생기는지 확인했다."
---

카메라 각도에 제한을 걸려고 내장 함수를 뒤지다가 `Mathf.Clamp`에 닿았고,
설명이 잘 정리된 글이라 스크랩해뒀었다. 공식 문서가 아니라 개인 블로그 글이다.

읽어보니 **내용은 맞다.** 네 줄이면 끝나는 함수다.

그런데 정작 **찾던 용도에는 그대로 쓰면 안 되는 함수**였다. `Mathf.Clamp`
자체는 문제가 없는데, 각도를 `transform`에서 읽어와 집어넣는 순간 깨진다.
왜 깨지는지를 말하려면 먼저 이 함수가 **무엇을 보장하고 무엇을 보장하지
않는지**부터 봐야 한다.

경계가 세 군데 나왔다. 인자를 거꾸로 줬을 때, `NaN`이 들어왔을 때, 그리고
각도를 클램프할 때다.

## 목차

## 네 줄짜리 설명은 맞다

원문의 설명이 이렇다.

> 만약 value가 min보다 작다면 min값으로 max보다 크다면 max값으로 min과
> max사이에 있다면 그대로 반환된다.

Unity의 C# 레퍼런스 소스를 열어보면 이 문장이 코드 한 줄과 정확히 일치한다.

```csharp
public static float Clamp(float value, float min, float max)
    => value < min ? min : value > max ? max : value;
```

삼항 연산자 두 개다. 블로그 글의 문장이 이 표현식을 그대로 한국어로 옮긴
것이고, **틀린 데가 없다.** 공식 문서의 설명도 같은 이야기를 한다.

> 주어진 값을 주어진 최소 float 값과 최대 float 값 사이로 클램프한다. 값이
> 최소·최대 범위 안에 있으면 그 값을 그대로 반환한다.

오버로드는 둘이고, 형제도 하나 있다.

```csharp
public static int Clamp(int value, int min, int max)
    => value < min ? min : value > max ? max : value;

public static float Clamp01(float value)
    => value < 0F ? 0F : value > 1F ? 1F : value;
```

`Clamp01`은 0과 1을 하드코딩한 판이다. 비율이나 알파값처럼 **0~1이 확정된
자리**에서는 이쪽이 의도가 분명하다.

여기까지가 네 줄로 끝나는 부분이다.

## 인자를 거꾸로 주면 — Unity와 .NET이 갈린다

`min`과 `max`를 바꿔 넣으면 어떻게 되나. 인자가 셋이고 둘이 같은 타입이라
**순서를 헷갈리기 쉬운 API**다.

Unity 문서에 한 줄이 있다.

> 최소값이 최대값보다 크면 **정의되지 않은 값**을 반환한다.

.NET에도 같은 이름의 함수가 있다. `System.Math.Clamp`다. 이쪽 문서는 다르게
적혀 있다.

> `ArgumentException` — max가 min보다 작습니다.

| | `Mathf.Clamp` (Unity) | `Math.Clamp` (.NET) |
|---|---|---|
| 정상 범위 | 같음 | 같음 |
| `min > max` | **정의되지 않은 값** | **`ArgumentException`** |
| `NaN` | 문서에 언급 없음 | **`NaN` 반환**이라고 명시 |

**같은 이름, 같은 의미, 다른 계약이다.** .NET 쪽은 잘못된 인자를 받으면 즉시
터뜨려서 알려주고, Unity 쪽은 조용히 뭔가를 돌려준다.

"정의되지 않은 값"이 실제로 뭔지는 앞의 구현을 보면 추적할 수 있다.
`min = 10`, `max = 5`로 거꾸로 넣어보자.

| `value` | `value < min ?` | `value > max ?` | 결과 |
|---|---|---|---|
| 3 | 참 | — | **10** |
| 7 | 참 | — | **10** |
| 12 | 거짓 | 참 | **5** |

**작은 값을 넣으면 큰 경계가, 큰 값을 넣으면 작은 경계가 나온다.** 뒤집힌
결과다. 게다가 어떤 입력에도 `value` 자체는 나오지 않는다.

다만 **이걸 믿고 쓰면 안 된다.** 문서가 "정의되지 않았다"고 말한 이상 이건
계약이 아니라 현재 구현일 뿐이다. 요점은 다르다 — **거꾸로 넣어도 아무도 안
알려준다.** 값이 이상하게 나올 뿐이고, 원인을 `Clamp` 호출부에서 찾기까지
시간이 걸린다.

인자가 상수가 아니라 변수로 들어오는 자리라면 한 번 방어하는 게 싸다.

```csharp
// 경계 자체를 계산해서 넣는 자리라면
float lower = Mathf.Min(a, b);
float upper = Mathf.Max(a, b);
float result = Mathf.Clamp(value, lower, upper);
```

## NaN은 클램프되지 않는다

두 번째 구멍이다. 구현을 다시 보면 비교가 둘뿐이다.

```csharp
value < min ? min : value > max ? max : value
```

`NaN`은 **어떤 비교에서도 참이 되지 않는다.** `NaN < min`도 거짓,
`NaN > max`도 거짓이다. 그래서 두 삼항이 전부 빠지고 **마지막의 `value`가
그대로 나온다.**

`Mathf.Clamp(x, 0f, 1f)`에 여러 값을 넣어보면 이렇게 된다.

| 입력 | 결과 |
|---|---|
| `-5` | `0` |
| `0.5` | `0.5` |
| `5` | `1` |
| `float.PositiveInfinity` | `1` |
| `float.NaN` | **`NaN`** |

**무한대는 클램프되는데 `NaN`은 통과한다.** 무한대는 비교가 성립하기
때문이고, `NaN`은 성립하지 않기 때문이다.

이게 문제가 되는 이유는 **`Clamp`를 위생 처리(sanitize)로 착각하기 쉽기**
때문이다. "어차피 0~1로 묶으니까 안전하겠지" 하고 넘긴 값이 `NaN`이면, 그
`NaN`이 위치나 색상으로 흘러 들어가 오브젝트가 사라지거나 화면이 검게 나온다.
그때쯤이면 발생 지점에서 한참 떨어져 있다.

`NaN`이 만들어지는 흔한 자리는 **`0f / 0f`** 같은 부정형과 **음수의
`Mathf.Sqrt`** 다. 이런 계산이 위에 있다면 클램프가 아니라 검사를 붙여야 한다.

```csharp
if (float.IsNaN(value))
{
    value = fallback;
}
```

참고로 .NET 문서는 `NaN`이 들어오면 `NaN`을 반환한다고 **명시**해뒀다. 동작은
같은데 한쪽만 적어놨다. Unity 문서만 읽고 있으면 이 동작을 알 방법이 없다.

## 어디에 왜 쓰나

`Clamp`이 실제로 들어가는 자리는 크게 둘이다. **값의 범위를 지키는 곳**과
**입력을 가두는 곳**이다. 두 번째에서 자주 틀린다.

### 값의 범위를 지킬 때

체력이 가장 흔한 예다. `Clamp`과 `Clamp01`이 각각 어디에 맞는지가 드러난다.

```csharp
using System;
using UnityEngine;

/// <summary>
/// 체력을 0과 최대치 사이로 유지하고, UI가 쓸 비율을 함께 제공한다.
/// </summary>
public class Health : MonoBehaviour
{
    [Header("Health")]
    [SerializeField, Range(1f, 1000f), Tooltip("최대 체력")]
    private float _maxHealth = 100f;

    private float _current;

    /// <summary>체력바 fillAmount에 그대로 넣을 수 있는 0~1 값.</summary>
    public float Normalized => _maxHealth > 0f
        ? Mathf.Clamp01(_current / _maxHealth)
        : 0f;

    public event Action<float> OnHealthChanged;

    private void Awake()
    {
        _current = _maxHealth;
    }

    public void Apply(float delta)
    {
        // 회복과 피해를 한 메서드로 받는다. 경계는 여기 한 곳에서만 지킨다.
        _current = Mathf.Clamp(_current + delta, 0f, _maxHealth);
        OnHealthChanged?.Invoke(Normalized);
    }
}
```

몇 가지 의도가 있다.

- **경계를 한 곳에서만 지킨다.** 피해와 회복을 따로 만들면 양쪽에 클램프가
  생기고, 나중에 한쪽만 고치는 일이 생긴다.
- **`Normalized`에 `Clamp01`을 쓴 건 나눗셈 뒤이기 때문이다.** `_current`는
  이미 클램프됐지만, 부동소수 나눗셈이 `1.0000001`을 만들 수 있다.
- **`_maxHealth > 0f`를 먼저 본다.** 0이면 `0f / 0f`가 되고, 앞 절에서 본
  대로 **그 `NaN`은 `Clamp01`을 그냥 통과한다.**
- **`OnHealthChanged?.Invoke`의 `?.`는 괜찮다.** 순수 C# 이벤트이지 Unity
  오브젝트가 아니다.

### 결과가 아니라 원인을 가둔다

자주 보는 실수가 이거다. 매 프레임 **위치를 클램프**해서 이동 범위를 제한하는
방식.

```csharp
// 흔하지만 문제가 있는 방식
private void Update()
{
    transform.position += _velocity * Time.deltaTime;

    Vector3 p = transform.position;
    p.x = Mathf.Clamp(p.x, MIN_X, MAX_X);
    transform.position = p;
}
```

동작은 한다. 다만 경계에 닿았을 때 **속도는 그대로 살아 있다.** 벽에 붙어
있는 동안에도 `_velocity`가 계속 누적되고, 반대 방향 입력이 들어와도
쌓여 있던 값이 먼저 소모되느라 **즉시 떨어지지 않는다.** 물리 오브젝트라면
[FreezePositionY가 얼리는 건 월드 Y다](/posts/rigidbody-constraints/)에서
다룬 제약 조건 쪽이 더 맞는 자리이기도 하다.

원인 쪽을 가두면 이 문제가 없다.

```csharp
// 결과가 아니라 입력을 가둔다
private void Update()
{
    float next = transform.position.x + _velocity.x * Time.deltaTime;
    float clamped = Mathf.Clamp(next, MIN_X, MAX_X);

    if (!Mathf.Approximately(next, clamped))
    {
        _velocity.x = 0f;   // 경계에 닿았으니 속도를 죽인다
    }

    Vector3 p = transform.position;
    p.x = clamped;
    transform.position = p;
}
```

**클램프가 값을 바꿨다는 사실 자체가 정보다.** 그걸 버리지 않고 "경계에
닿았다"는 신호로 쓰면 된다.

### 쓰지 말아야 할 자리

- **위생 처리 대용.** 앞 절대로 `NaN`은 통과한다.
- **각도.** 다음 절이다.
- **경계가 변수로 들어오는데 순서를 검증하지 않는 자리.** `min > max`면
  아무도 안 알려준다.

## 각도를 클램프하면 안 되는 이유

카메라 피치를 제한하는 코드는 거의 모든 프로젝트에 있다. 그리고 **가장
직관적인 형태가 동작하지 않는다.**

```csharp
// 이렇게 하면 안 된다
float pitch = transform.eulerAngles.x;
pitch = Mathf.Clamp(pitch, -30f, 60f);
transform.eulerAngles = new Vector3(pitch, _yaw, 0f);
```

`Clamp`은 잘못이 없다. 문제는 **`eulerAngles`가 무엇을 돌려주는가**다. 문서가
분명히 적어놨다.

> 각도는 **360도로 나눈 나머지**로 표현된다. 예를 들어 1, 361, -17999를
> 지정하면 모두 같은 각도가 된다.

> 어떤 회전이든 오일러 각으로 표현하는 방법이 하나 이상 있기 때문에, **읽어낸
> 값이 대입한 값과 상당히 다를 수 있다.**

즉 위를 30도 올려다본 상태(-30도)를 읽으면 **-30이 아니라 330**이 나온다.
그리고 `Mathf.Clamp(330f, -30f, 60f)`는 규칙대로 **60**을 돌려준다. 카메라가
한순간에 아래로 튄다.

경고가 하나 더 있다.

> `eulerAngles`의 축 하나를 따로 설정하지 마라(예: `eulerAngles.x = 10;`).
> 드리프트와 의도치 않은 회전으로 이어진다. 새 값으로 설정할 때는 **한 번에
> 전부** 설정하라.

정리하면 각도를 `transform`에서 읽어와 클램프하는 접근은 **두 군데에서**
틀린다. 읽은 값의 범위가 다르고, 축을 따로 건드리면 안 된다.

해법은 **각도를 내가 들고 있는 것**이다.

```csharp
using UnityEngine;

/// <summary>
/// 마우스 입력으로 시점을 돌리되, 피치 각도를 직접 보관하고 클램프한다.
/// </summary>
public class LookController : MonoBehaviour
{
    private const float MIN_PITCH = -30f;
    private const float MAX_PITCH = 60f;

    [Header("Look")]
    [SerializeField, Range(0.1f, 10f), Tooltip("마우스 감도(도/픽셀)")]
    private float _sensitivity = 2f;

    // 진실의 원본. transform에서 되읽지 않는다.
    private float _pitch;
    private float _yaw;

    private void Awake()
    {
        // yaw는 0~360이 그대로 의미를 가지므로 받아와도 된다.
        _yaw = transform.eulerAngles.y;
        // pitch는 음수 범위가 필요하므로 eulerAngles에서 받지 않는다.
        _pitch = 0f;
    }

    public void Look(Vector2 delta)
    {
        _yaw += delta.x * _sensitivity;
        _pitch -= delta.y * _sensitivity;
        _pitch = Mathf.Clamp(_pitch, MIN_PITCH, MAX_PITCH);

        // 축을 따로 대입하지 말라는 경고에 맞춰 한 번에 넣는다.
        transform.eulerAngles = new Vector3(_pitch, _yaw, 0f);
    }
}
```

**`_pitch`가 진실의 원본이고 `transform`은 출력일 뿐이다.** 되읽지 않으니
360도 나머지 문제가 생기지 않고, `Vector3`를 통째로 대입하니 축 분리 경고에도
걸리지 않는다.

이미 존재하는 각도에서 출발해야 하는 상황이라면 `Mathf.DeltaAngle`이 있다.

> 두 각도 사이의 **최단 차이**를 계산한다. 반환값은 -180(미포함)과
> 180(포함) 사이다.

330과 0의 차이를 330이 아니라 **-30**으로 돌려주는 함수다. 각도를 다루는
코드에서 `-`를 그냥 쓰면 안 되는 이유가 여기 있다.

카메라 자체를 Cinemachine에 맡긴 경우라면 클램프는 대개 컴포넌트 설정 쪽에
있다. 그쪽 이야기는
[Cinemachine Follow Camera 뜯어보기](/posts/cinemachine-follow-camera/)에
정리해뒀다.

## Clamp 가족 — 가두기와 감기

경계에 닿았을 때 무엇을 할지가 함수마다 다르다.

| 함수 | 문서의 서술 | 경계에서 |
|---|---|---|
| `Mathf.Clamp` | 값을 min과 max 사이로 클램프 | **멈춘다** |
| `Mathf.Clamp01` | 0과 1 사이로 | **멈춘다** |
| `Mathf.Repeat` | "t를 루프시켜 length보다 크지 않고 0보다 작지 않게" | **감긴다** |

체력이나 시야각처럼 **경계가 벽인 값**은 `Clamp`이고, 방향이나 타일 좌표처럼
**경계가 이음매인 값**은 `Repeat`다. 각도를 `Clamp`으로 다루려다 문제가 생기는
것도 결국 각도가 후자이기 때문이다.

## 정리

- **네 줄짜리 설명은 맞다.** 구현이 삼항 연산자 두 개고, 블로그 글의 설명이
  그것과 정확히 일치한다.
- **`min > max`에서 Unity와 .NET이 갈린다.** .NET의 `Math.Clamp`은
  `ArgumentException`을 던지고, Unity의 `Mathf.Clamp`은 **"정의되지 않은 값"**
  을 조용히 돌려준다. 경계가 변수라면 `Mathf.Min`/`Mathf.Max`로 한 번 정리하는
  게 싸다.
- **`NaN`은 클램프되지 않는다.** 비교가 전부 거짓이라 그대로 통과한다. 무한대는
  걸리는데 `NaN`은 안 걸린다. `Clamp`은 위생 처리가 아니다.
- **결과 말고 원인을 가둔다.** 위치를 매 프레임 클램프하면 속도가 살아남는다.
  클램프가 값을 바꿨다는 사실을 "경계에 닿았다"는 신호로 쓰는 편이 낫다.
- **`transform.eulerAngles`를 읽어 클램프하면 안 된다.** 360도 나머지라
  -30이 330으로 읽히고, 축을 따로 대입하지 말라는 경고도 있다. **각도는 내가
  필드로 들고 클램프한다.**
- **경계가 벽이면 `Clamp`, 이음매면 `Repeat`.** 각도는 후자다.

단순한 함수일수록 문서가 짧고, 짧은 문서는 **무엇을 보장하지 않는지**를 잘
말하지 않는다. 이 함수에서는 그게 "정의되지 않은 값"이라는 한 줄과, 아예
언급되지 않은 `NaN`이었다.

---

### 참고

- [Mathf.Clamp — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Mathf.Clamp.html)
- [UnityCsReference — Mathf.cs](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Math/Mathf.cs)
- [Math.Clamp — .NET API 문서](https://learn.microsoft.com/en-us/dotnet/api/system.math.clamp)
- [Transform.eulerAngles](https://docs.unity3d.com/ScriptReference/Transform-eulerAngles.html)
- [Mathf.DeltaAngle](https://docs.unity3d.com/ScriptReference/Mathf.DeltaAngle.html)
- [Mathf.Repeat](https://docs.unity3d.com/ScriptReference/Mathf.Repeat.html)

이 글의 출발점이 된 자료는 [코딩하는 돼징 — Unity - Mathf.Clamp](https://code-piggy.tistory.com/entry/MathfClamp)
(2023-09-15)이다. 설명 자체는 현행 구현과 일치했고, 위의 경계 사례들은 공식
레퍼런스와 C# 레퍼런스 소스로 따로 확인했다.
