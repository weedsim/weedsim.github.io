---
pubDatetime: 2026-09-22T15:00:00+09:00
title: "플레이 타임은 DateTime이 아니라 TimeSpan이다"
lang: ko
translationKey: datetime-formatting
featured: false
draft: false
tags:
  - Unity
  - C#
  - .NET
  - 데이터
description: "타임 어택 게임의 경과 시간을 UI에 띄우려고 현재 시각 유틸리티를 스크랩했는데, 정작 필요한 건 다른 타입이었다. 경과 시간의 타입도, 읽어야 할 시계도, 포맷 문자열의 규칙도 다르다."
---

타임 어택 게임을 만들던 중이었다. **플레이 타임을 UI에 띄울 방법**을 찾다가
현재 시각을 다루는 2019년 글을 스크랩해뒀다. 목표가 한 줄로 적혀 있다.

> 목표 — 현재 시간을 표기하기 위한 유틸리티 작성

`DateTime.Now.ToString()`부터 포맷 지정, 유닉스 시간 변환까지 세 단계로
올라간다. 구성은 깔끔하다.

다시 열어보니 **찾던 것과 스크랩한 것이 다르다.** 이 글이 답하는 질문은
"지금 몇 시인가"이고, 타임 어택에 필요한 건 "**얼마나 지났는가**"다. 둘은
타입부터 다르다.

## 목차

## 시각과 경과 시간은 다른 타입이다

`DateTime`은 **시점**이다. 2026년 9월 22일 15시 47분 같은, 달력 위의 한 점.
타임 어택이 재는 건 시점이 아니라 **길이**다 — 3분 24초 71.

.NET에서 길이를 나타내는 타입은 따로 있다. `TimeSpan`이다. `DateTime`으로
길이를 다루려면 기준점을 하나 정해놓고 빼야 하는데, 그렇게 얻은 결과도 실은
`TimeSpan`이다.

```csharp
DateTime start = DateTime.Now;
// ...
TimeSpan elapsed = DateTime.Now - start;   // 뺄셈 결과가 TimeSpan이다
```

그러니 **처음부터 `TimeSpan`으로 다루는 게 맞다.** 그리고 여기에 옮겨 붙이다
바로 걸리는 규칙이 하나 있다.

### 포맷 문자열의 규칙이 다르다

`DateTime`에서 쓰던 감각으로 `timeSpan.ToString("mm:ss")`를 쓰면 의도대로
안 된다. 문서가 이유를 적어놨다.

> 사용자 지정 `TimeSpan` 형식 지정자는 **자리 표시자 구분 기호를 포함하지
> 않는다.** 일(day)과 시(hour), 시와 분, 초와 소수 초를 구분하는 기호 같은
> 것들 말이다. 대신 이 기호들은 **문자열 리터럴로** 사용자 지정 형식 문자열에
> 포함되어야 한다.

즉 콜론과 마침표를 **직접 이스케이프**해야 한다. 문서의 예가 이렇다.

```csharp
output = "Time of Travel: " + duration.ToString(@"dd\.hh\:mm\:ss");
// 01.12:24:02
```

작은따옴표로 감싸도 된다.

```csharp
fmt = "mm':'ss' minutes'";
// 32:45 minutes
```

규칙이 하나 더 있다. **지정자를 하나만 쓸 때는 `%`를 앞에 붙인다.** `"d"`,
`"h"`, `"m"`, `"s"`, `"f"`, `"F"`가 해당하고, 그냥 쓰면 표준 형식 문자열로
해석된다.

정리하면 타임 어택 타이머의 포맷은 이렇게 된다.

```csharp
@"mm\:ss\.ff"      // 03:24.71
@"h\:mm\:ss"       // 1:03:24  (한 시간을 넘길 수 있다면)
```

## 어느 시계를 읽을 것인가

타입이 정해지면 다음 질문은 **무엇으로 시간을 재는가**다. Unity의 `Time`
클래스에 후보가 셋 있고, 셋의 차이가 **일시정지를 어떻게 다룰지**를 결정한다.

| 속성 | 문서의 서술 | `timeScale` 영향 |
|---|---|---|
| `Time.time` | 애플리케이션 시작 이후 **현재 프레임 시작 시점**까지의 초 | **받음** |
| `Time.unscaledTime` | 이 프레임의 **`timeScale`과 무관한** 시간 | 안 받음 |
| `Time.realtimeSinceStartup` | 게임이 시작된 이후의 **실제 시간**(초) | 안 받음 |

그리고 `Time.timeScale`은 "**실제 시간 대비 게임 내 시간이 흐르는 비율**"이다.

**타임 어택이라면 대개 `Time.time`이 맞다.** 일시정지를 `Time.timeScale = 0`으로
구현했을 때 타이머도 같이 멈춰야 하기 때문이다. 메뉴를 열어둔 동안 기록이
올라가면 안 된다.

반대로 **일시정지 중에도 흘러야 하는 것**이 있다면 `unscaledTime`이다. UI
애니메이션이나 "3초 뒤 자동 재개" 같은 것들.

`realtimeSinceStartup`은 성격이 또 다르다. 프레임과 무관한 실제 시간이라
**로딩 구간처럼 프레임이 갱신되지 않는 동안에도 흐른다.** 프로파일링에는
맞지만 게임 기록에는 과하다.

한 가지 짚어둘 것은, `Time.time`이 **"현재 프레임 시작 시점"** 이라는 점이다.
한 프레임 안에서 몇 번을 읽어도 같은 값이 나온다. 타이머에는 오히려 그쪽이
낫다 — 같은 프레임의 표시와 판정이 어긋나지 않는다.

`DateTime.Now`를 두 번 빼서 재는 방식은 이 셋 어디에도 해당하지 않는다.
**기기 시계를 읽기 때문에** 플레이어가 시계를 바꾸면 기록이 바뀌고, 자동
시각 동기화가 한 번 튀어도 기록이 튄다. 타임 어택 기록을 걸 값으로는
쓸 수 없다.

## `DateTime`이 맞는 자리 — 기록을 남길 때

그렇다고 `DateTime`이 필요 없는 건 아니다. **"이 기록을 언제 세웠는가"** 는
시점이고, 그건 `DateTime`의 일이다. 원문의 내용이 유효해지는 자리도 여기다.

다만 원문 코드를 그대로 가져가면 세 군데가 걸린다.

**첫째, 포맷 문자열이 되읽기를 막는다.**

```csharp
return DateTime.Now.ToString(("yyyy-MM-dd HH:mm:ss tt"));
```

`HH`는 이미 24시간제인데 `tt`(AM/PM 지정자)를 붙였다. 화면에는
`2026-09-22 15:47:21 오후`처럼 찍힌다. 그리고 문서가 더 강한 말을 해뒀다.

> AM/PM 지정자가 포함된 문자열을 **파싱할 때**는 `H`나 `HH`(24시간제) 대신
> `h`나 `hh`(12시간제) 시 지정자를 사용하라. **24시간제 지정자는 파싱
> 연산에서 AM/PM 지정자와 호환되지 않으며, `FormatException`을 던진다.**

기록을 저장했다가 되읽는 순간 예외가 난다.

**둘째, 문화권을 따른다.**

> `ToString(String)` 메서드는 **현재 문화권의 형식 규칙**을 사용하는 특정
> 형식으로 날짜와 시간 값의 문자열 표현을 반환한다.

`tt`가 한국어 기기에서는 "오후", 영어 기기에서는 "PM"이다. 인수 없는
`ToString()`은 구분자와 순서까지 바뀐다. 보여줄 때는 맞는 동작이지만
**저장할 때는 버그**다.

**셋째, 에포크 변환에 전용 API가 있다.** 원문은 손으로 뺀다.

```csharp
TimeSpan time = (DateTime.UtcNow - new DateTime(1970,1,1));
```

(참고로 원문의 이 함수와 아래 함수는 **선언되지 않은 식별자**를 써서
컴파일되지 않는다. `t`와 `expiredTime`이 각각 `time`과 `milliSecond`여야
한다.)

.NET에 이미 있다.

> `public long ToUnixTimeMilliseconds();`
> **1970-01-01T00:00:00.000Z 이후 경과한 밀리초 수**를 반환한다. 이 메서드는
> **먼저 현재 인스턴스를 UTC로 변환한 뒤** 유닉스 시간의 밀리초 수를 반환한다.

반환형이 `double`이 아니라 **`long`** 이라 정밀도가 깎이지 않고,
`DateTimeOffset`은 오프셋을 타입 안에 들고 있어 원문의 `Kind` 혼선
(`UtcNow`에서 `Unspecified`를 빼는 쪽과 `DateTimeKind.Utc`를 명시하는 쪽이 한
파일에 공존)도 생기지 않는다.

## 어디에 왜 쓰나

정리하면 타임 어택에 필요한 건 셋이다 — **재는 것은 `Time.time`, 다루는
타입은 `TimeSpan`, 남기는 것은 `long` 타임스탬프.**

### 타임 어택 타이머

```csharp
using System;
using TMPro;
using UnityEngine;

/// <summary>
/// 한 판의 경과 시간을 재고 UI에 표시한다.
/// </summary>
public class RunTimer : MonoBehaviour
{
    // TimeSpan 포맷은 구분 기호를 직접 이스케이프해야 한다.
    private const string TIME_FORMAT = @"mm\:ss\.ff";

    [Header("UI")]
    [SerializeField, Tooltip("경과 시간을 표시할 텍스트")]
    private TMP_Text _label;

    private float _startTime;
    private float _finishedElapsed;
    private bool _isRunning;
    private int _lastShownHundredths = -1;

    /// <summary>현재 경과 시간. 멈춘 뒤에는 최종 기록을 유지한다.</summary>
    public TimeSpan Elapsed => TimeSpan.FromSeconds(
        _isRunning ? Time.time - _startTime : _finishedElapsed);

    public event Action<TimeSpan> OnFinished;

    public void Begin()
    {
        // timeScale = 0으로 일시정지하면 이 시계도 같이 멈춘다.
        _startTime = Time.time;
        _isRunning = true;
    }

    public void Finish()
    {
        if (!_isRunning)
        {
            return;
        }

        _finishedElapsed = Time.time - _startTime;
        _isRunning = false;
        OnFinished?.Invoke(Elapsed);
    }

    private void Update()
    {
        if (!_isRunning)
        {
            return;
        }

        TimeSpan elapsed = Elapsed;

        // 표시값이 바뀔 때만 문자열을 새로 만든다.
        int hundredths = (int)(elapsed.TotalSeconds * 100.0);
        if (hundredths == _lastShownHundredths)
        {
            return;
        }

        _lastShownHundredths = hundredths;
        _label.text = elapsed.ToString(TIME_FORMAT);
    }
}
```

몇 가지 의도를 적어둔다.

- **`Time.time`을 쓴다.** `timeScale = 0`으로 일시정지하면 타이머도 멈춘다.
  일시정지 중에도 흘러야 한다면 `Time.unscaledTime`으로 바꾸면 되고,
  **그 한 줄이 곧 설계 결정**이다.
- **`Elapsed`가 `TimeSpan`을 돌려준다.** `float`를 그대로 넘기면 받는 쪽마다
  초인지 밀리초인지를 다시 정해야 한다.
- **포맷 상수에 `@`와 역슬래시가 있다.** 앞 절의 규칙이고, 빼면 `mm`과 `ss`가
  엉뚱하게 해석된다.
- **표시값이 바뀔 때만 `ToString`을 부른다.** 다만 백분의 일 초까지 찍으면
  초당 100번 바뀌므로 60fps에서는 거의 매 프레임 새로 만든다. **초 단위로
  표시한다면** 이 가드가 실제로 대부분의 할당을 없앤다. 매 프레임 문자열을
  만드는 비용 이야기는
  [코드 최적화 쪽](/posts/unity-code-optimization/)에 정리해뒀다.
- **`OnFinished?.Invoke`의 `?.`는 괜찮다.** 순수 C# 이벤트다.

### `deltaTime`을 누적하는 방식

앞 코드는 **뺄셈**이다 — 시작 시각을 기억해두고 지금과의 차를 구한다. 다른
방법은 매 프레임 `Time.deltaTime`을 **누적**하는 것이다.

```csharp
_elapsedSeconds += Time.deltaTime;
```

문서에 따르면 `Time.deltaTime`은 "**마지막 프레임에서 현재 프레임까지의
간격(초)**"이고, `Time.time`과 마찬가지로 `timeScale`의 영향을 받는다. 그래서
**`timeScale = 0`이면 `deltaTime`도 0**이 되어 누적이 멈춘다. 일시정지에서
타이머가 멈추는 건 두 방식 모두 같다.

차이는 **그 외의 경우**에 나온다.

| | 누적 (`+= deltaTime`) | 뺄셈 (`Time.time - 시작`) |
|---|---|---|
| `timeScale = 0` 일시정지 | 멈춤 | 멈춤 |
| 슬로모션(`timeScale = 0.5`) | 절반 속도로 쌓임 | 절반 속도로 흐름 |
| **`timeScale`을 안 쓰는 일시정지** | **플래그로 멈출 수 있다** | 멈출 수 없다 |
| 중간 일시정지·재개 | 그냥 된다 | 시작 시각을 다시 잡아야 한다 |
| 부동소수 오차 | **쌓인다** | 두 값의 차라 안 쌓인다 |

세 번째 줄이 누적 방식의 값어치다. 일시정지를 `timeScale`이 아니라 **상태
전환이나 입력 차단으로** 구현했다면, `Time.time`은 계속 흐르므로 뺄셈 쪽은
멈추지 않는다. 누적은 그냥 더하기를 멈추면 된다.

```csharp
using System;
using TMPro;
using UnityEngine;

/// <summary>
/// deltaTime을 누적해 경과 시간을 잰다. 일시정지 구현 방식과 무관하게 멈출 수 있다.
/// </summary>
public class AccumulatingRunTimer : MonoBehaviour
{
    private const string TIME_FORMAT = @"mm\:ss\.ff";

    [Header("UI")]
    [SerializeField, Tooltip("경과 시간을 표시할 텍스트")]
    private TMP_Text _label;

    // float이 아니라 double로 둔다. 매 프레임 더하는 값이라 오차가 쌓인다.
    private double _elapsedSeconds;
    private bool _isRunning;
    private int _lastShownHundredths = -1;

    public TimeSpan Elapsed => TimeSpan.FromSeconds(_elapsedSeconds);

    public event Action<TimeSpan> OnFinished;

    public void Begin()
    {
        _elapsedSeconds = 0.0;
        _isRunning = true;
    }

    /// <summary>timeScale을 건드리지 않고 타이머만 멈춘다.</summary>
    public void SetPaused(bool paused)
    {
        _isRunning = !paused;
    }

    public void Finish()
    {
        if (!_isRunning)
        {
            return;
        }

        _isRunning = false;
        OnFinished?.Invoke(Elapsed);
    }

    private void Update()
    {
        if (!_isRunning)
        {
            return;
        }

        // deltaTime은 timeScale의 영향을 받는다. 슬로모션이면 그만큼 느리게 쌓인다.
        _elapsedSeconds += Time.deltaTime;

        int hundredths = (int)(_elapsedSeconds * 100.0);
        if (hundredths == _lastShownHundredths)
        {
            return;
        }

        _lastShownHundredths = hundredths;
        _label.text = Elapsed.ToString(TIME_FORMAT);
    }
}
```

누적기를 **`double`로 둔 게 의도**다. `float`로 두면 60fps 기준 10분에
3만 번 넘게 더하게 되는데, 그만큼 반올림 오차가 쌓인다. 기록을 백분의 일
초까지 비교하는 타임 어택이라면 무시하기 애매한 크기다. `double`로 바꾸는
비용은 없다시피 하니 그냥 `double`을 쓰면 된다.

**둘 중 무엇이 맞는지는 일시정지를 어떻게 구현했느냐로 갈린다.** `timeScale`로
게임 전체를 얼리는 구조면 뺄셈 쪽이 간단하고 오차도 없다. 타이머만 따로
제어해야 하거나 일시정지가 `timeScale`과 무관하다면 누적 쪽이다.

### 기록을 저장할 때

기록 하나는 **길이와 시점** 두 개로 이루어진다. 저장 형식은 둘 다 정수가
편하다.

```csharp
[Serializable]
public class RunRecord
{
    public long elapsedMilliseconds;   // 기록 — 길이
    public long achievedAt;            // 세운 시점 — 유닉스 밀리초
}

// 저장
var record = new RunRecord
{
    elapsedMilliseconds = (long)timer.Elapsed.TotalMilliseconds,
    achievedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
};

// 표시
TimeSpan best = TimeSpan.FromMilliseconds(record.elapsedMilliseconds);
DateTimeOffset when = DateTimeOffset.FromUnixTimeMilliseconds(record.achievedAt);
string line = $"{best.ToString(TIME_FORMAT)}  ({when.ToLocalTime():yyyy-MM-dd})";
```

**문자열로 저장하지 않는 게 요점이다.** 문화권도 포맷도 끼어들지 않고,
Unity의 직렬화 규칙 페이지가 나열하는 필드 타입 목록에 `long`은 정수형으로
그냥 들어간다(`DateTime`은 그 목록에 없다). 직렬화기가 무엇을 받아주는지가
저장 형식을 정한다는 이야기는
[JsonUtility 쪽 글](/posts/unity-jsonutility/)에서 한 번 다뤘다.

### 쓰지 말아야 할 자리

- **`DateTime.Now` 뺄셈으로 기록 재기.** 기기 시계는 플레이어가 바꿀 수 있고
  자동 동기화로도 튄다.
- **`TimeSpan` 포맷에서 구분 기호를 그냥 쓰는 것.** `"mm:ss"`가 아니라
  `@"mm\:ss"`다.
- **경과 시간을 `DateTime`에 담는 것.** 24시간을 넘기는 순간 날짜로 넘어간다.
  길이는 `TimeSpan`이다.
- **`HH`와 `tt`를 같이 쓰는 것.** 출력이 중복되고 파싱이 안 된다.

## 정리

- **시점은 `DateTime`, 길이는 `TimeSpan`.** 타임 어택이 재는 건 길이다.
  `DateTime`끼리 빼도 결과는 `TimeSpan`이다.
- **`TimeSpan` 포맷은 구분 기호를 리터럴로 넣어야 한다.** 문서 표현 그대로
  "자리 표시자 구분 기호를 포함하지 않는다". `@"mm\:ss\.ff"`처럼 쓴다.
  지정자 하나만 쓸 때는 `%`를 붙인다.
- **`Time.time`은 `timeScale`을 받고 `unscaledTime`·`realtimeSinceStartup`은
  안 받는다.** 어느 것을 고르느냐가 곧 "일시정지하면 타이머도 멈추는가"다.
- **`deltaTime` 누적도 `timeScale`에서 같이 멈춘다.** 다만 `timeScale`을 쓰지
  않는 일시정지까지 다루려면 누적 쪽이라야 하고, 그때 누적기는 `float`이 아니라
  `double`로 둔다.
- **기기 시계로 기록을 재면 안 된다.** `DateTime.Now`는 플레이어가 바꿀 수
  있는 값을 읽는다.
- **`DateTime`은 "언제 세웠는가"에 쓴다.** 그 자리에서도 `HH`+`tt`는 파싱을
  막고, `ToString`은 문화권을 따른다.
- **저장은 정수 둘로.** 길이는 밀리초 `long`, 시점은
  `DateTimeOffset.ToUnixTimeMilliseconds()`.

찾던 것과 스크랩한 것이 어긋나는 경우가 있다. "시간을 UI에 띄우는 법"으로
검색하면 현재 시각 유틸리티가 먼저 나오는데, **타임 어택이 필요한 건 시계가
아니라 스톱워치였다.** 질문을 "몇 시인가"에서 "얼마나 지났는가"로 바꾸고
나서야 타입이 정해졌다.

---

### 참고

- [Custom TimeSpan format strings — .NET 문서](https://learn.microsoft.com/en-us/dotnet/standard/base-types/custom-timespan-format-strings)
- [Custom date and time format strings](https://learn.microsoft.com/en-us/dotnet/standard/base-types/custom-date-and-time-format-strings)
- [DateTime.ToString](https://learn.microsoft.com/en-us/dotnet/api/system.datetime.tostring)
- [DateTimeOffset.ToUnixTimeMilliseconds](https://learn.microsoft.com/en-us/dotnet/api/system.datetimeoffset.tounixtimemilliseconds)
- [Time — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Time.html)
- [Serialization rules — Unity 매뉴얼](https://docs.unity3d.com/Manual/script-serialization-rules.html)

이 글의 출발점이 된 자료는 [김잉장 — \[Unity\] DataTime을 사용하여 현재 시간 표시하기](https://icat2048.tistory.com/445)
(2019-11-19)이다. 원문은 현재 시각을 다루는 글이고, 경과 시간 쪽은 .NET과
Unity 문서로 따로 확인했다.
