---
pubDatetime: 2026-10-15T17:40:00+09:00
title: "페이지는 2023년이라고 적고, 받아보면 2020 LTS판이다"
lang: ko
translationKey: console-pc-optimization
featured: false
draft: false
tags:
  - Unity
  - 최적화
  - 메모리
  - 사운드
  - 물리
  - C#
description: "퀄리티 좋은 모델을 쓰면 낮은 사양 PC에서 안 돌아갈 수 있다는 생각이 들어 최적화를 공부하다 스크랩한 안내 페이지다. 페이지는 2023년 10월 19일이라고 적어두는데, Read now로 받은 PDF 표지에는 '2020 LTS edition'이라고 적혀 있다. 그 간극이 본문 어디에 남아 있는지 네 절을 골라 대조했다."
---

**퀄리티가 좋은 모델을 쓰기 시작하면서 생긴 걱정에서 출발했다.** 내 기기에서는
잘 돌아가는데, 사양이 낮은 PC에서 플레이하면 안 될 수도 있겠다는 생각이
들었다. 그래서 최적화를 공부하다가 이 페이지를 스크랩했다.

스크랩해둔 것은 **전자책 안내 페이지**다. Unity가 "PC와 콘솔을 위한 게임
최적화에 대한 80개 이상의 실행 가능한 팁"을 모았다고 소개하고, 아래에
양식을 받는 칸이 있다. 본문은 페이지에 없다.

안내 페이지가 날짜를 하나 적어둔다 — **2023년 10월 19일**이다. 영문 원문
페이지도 **"Oct 19, 2023"**으로 같다.

그런데 그 페이지에 양식 말고 **`Read now`** 링크가 하나 더 있다. 눌러보면
PDF가 바로 열리고, **표지에 다른 날짜가 적혀 있다.**

> Optimize your game performance for consoles and PC
>
> 2020 LTS edition
>
> UNITY FOR GAMES E-BOOK
>
> © 2021 Unity Technologies
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**표지가 "2020 LTS edition"이고 저작권 표시가 2021년이다.** 안내 페이지는
그 사실을 어디에도 적지 않는다. 한국어 페이지에도, 영문 페이지에도
"2020 LTS"라는 문자열이 없다.

그래서 이 글은 **그 간극이 본문에 어떻게 남아 있는지**를 본다. 80개가 넘는
항목을 다 대조할 수는 없으니, **앞선 글이 다루지 않은 절**에서 네 개를
골랐다 — 물리 타임스텝, GC, Memory Profiler, 오디오다.

## 목차

## 앞선 글이 파라미터로 추론한 그 전자책이다

먼저 이 문서가 처음 보는 것이 아니라는 점을 적어둬야 한다.
[파도 전선이 뭔가 했더니 wavefront였다](/posts/unity-gpu-optimization-page/)에서
Unity의 GPU 최적화 **웹 페이지**를 뜯어봤는데, 그 글이 페이지가 서 있는
시점을 **링크의 파라미터**로 추론했다 — 일부 링크에
`utm_content=optimize-game-performance-2020-lts-ebook`이 붙어 있었다.
거기서 "2020 LTS 시절 전자책을 웹 페이지로 옮긴 문서로 보인다"고 적었다.

**이번 클리핑이 그 전자책 본체다.** 추론이 아니라 표지에 적혀 있다. 그리고
파라미터의 문자열(`optimize-game-performance-2020-lts-ebook`)이 PDF의
파일명(`OptimizeGamePerformance_eBook_Final.pdf`)과 표지의
`2020 LTS edition`으로 각각 나뉘어 들어가 있다.

| 앞선 글이 본 것 | 이번에 확인한 것 |
|---|---|
| 웹 페이지의 링크 파라미터에 `2020-lts-ebook` | PDF 표지에 **`2020 LTS edition`** |
| URP 문서 링크가 `@10.5`, `@10.3` | 저작권 표시가 **© 2021** |
| "전자책을 웹 페이지로 옮긴 문서로 보인다"(추론) | 전자책 본체를 직접 열어 확인 |

그 글이 다룬 것은 **GPU·배칭·컬링 절**이고, 거기서 Unity 6의 GPU Resident
Drawer와 GPU 오클루전 컬링이 빠져 있다는 것까지 적었다. **이 글은 그 절을
다시 다루지 않는다.** 아래 네 절은 그 글이 손대지 않은 쪽이다.

## 물리 타임스텝 절의 "더 작은 값"이 더 큰 값이다

물리 절에서 기본값을 적고 바로 다음에 조정을 설명하는데, 두 숫자가
어긋난다.

> the default value of 0.02 seconds (20 ms) is equivalent to 50 fps, or 50 Hz.
>
> Using a smaller value (like 0.1 s) sacrifices some physics simulation
> accuracy
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**0.1은 0.02보다 큰 값이다.** 기본값을 `0.02`로 적어둔 문서가 두 줄 뒤에
`0.1`을 "smaller value"라고 부른다. 방향이 거꾸로 적혀 있다.

내용 자체는 뒤집어 읽으면 맞는 이야기다. 타임스텝을 **크게** 하면 물리가
덜 자주 돌아서 비용이 줄고 정확도가 떨어진다. 그런데 문서가 그걸
"작은 값"이라고 쓰고 있으니, 읽는 사람이 **값을 줄이는 쪽으로** 손대게 된다.
값을 줄이면 물리가 더 자주 돌아서 **비용이 늘어난다** — 최적화 문서를 보고
반대 방향으로 가는 셈이다.

모바일 예시 줄에도 숫자가 안 맞는다.

> use 0.035 seconds for 30ps on mobile.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

`30ps`는 `30fps`의 오타로 보이고, `0.035`초는 초당 약 28.6회다. 30을 맞추려면
`0.0333…`이다. 문서가 반올림한 값을 든 것인지 다른 의도가 있는지는 적혀
있지 않다.

**기본값 `0.02` 자체는 현행 문서에서 확인하지 못했다.** `Time.fixedDeltaTime`
페이지는 **기본값을 적지 않는다.** 대신 다른 주의를 적어둔다.

> Note: To support high-precision simulation and prevent time drift in
> long-running games, Unity uses a more complex internal representation for
> time steps.
>
> When you set Time.fixedDeltaTime, the value is quantized to align with the
> internal high-resolution grid.
>
> — [Time.fixedDeltaTime](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Time-fixedDeltaTime.html)

**넣은 값이 그대로 보관되지 않는다.** 내부 격자에 맞춰 양자화되고, float로
다시 읽으면 **최하위 1비트만큼 다를 수 있다**고 같은 페이지가 적는다. 전자책
시점에는 없던 설명이다. 프로젝트 설정 쪽 페이지도 `Fixed Timestep`을
"A frame rate independent interval that dictates when physics calculations and
FixedUpdate events are performed."라고만 적고 **기본값은 적지 않는다.**

같은 설정의 다른 칸(`Maximum Allowed Timestep`)이 무엇을 묶는지는
[Unload(false)는 인스턴스를 내리지 않는다](/posts/unite-seoul-2025-optimization/)에서
따로 짚었다.

## Incremental GC는 이제 켜라고 할 것이 아니다

GC 절의 수집기 설명은 지금도 맞다. 전자책이 **"Unity uses the
Boehm-Demers-Weiser garbage collector"**라고 적고, 현행 매뉴얼도 같은 수집기를
이름만 짧게 부른다.

> Unity uses the Boehm garbage collector for both the Mono and IL2CPP.
>
> — [Garbage collection — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/dotnet-garbage-collection.html)

**5년 뒤에도 같은 수집기다.** 문제는 그 다음 항목이다. 전자책은 증분 수집을
**권하는 팁**으로 적는다.

> Use the Incremental Garbage Collector to split the GC workload
>
> Incremental GC can temporarily help mitigate garbage collection issues
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**"Use"** — 쓰라는 것이니 켜는 동작을 전제한다. 현행 매뉴얼은 그 자리를
이렇게 적는다.

> Enabled by default.
>
> This is the default garbage collection behavior in Unity.
>
> The web platform doesn't support incremental garbage collection.
>
> — [Garbage collection modes — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/performance-incremental-garbage-collection.html)

**이미 켜져 있다.** 그래서 이 팁은 할 일이 없는 항목이 됐고, 대신 **끄는
방법**이 설명 대상이 됐다. 같은 페이지가 끄는 자리를 적어둔다 —
`Project Settings > Player > Configuration`의 **`Incremental GC`** 설정이다.
모드 이름도 세 개로 정리됐다. `Incremental`, `Non-incremental`(stop-the-world),
`Manual`이다.

그리고 **웹 플랫폼은 증분 수집을 지원하지 않는다**는 예외가 붙었다. 콘솔·PC를
대상으로 쓴 전자책에는 있을 수 없던 문장이다.

| 항목 | 전자책(2020 LTS) | 현행 매뉴얼 |
|---|---|---|
| 수집기 | "Boehm-Demers-Weiser garbage collector" | "Boehm garbage collector for both the Mono and IL2CPP" |
| 증분 수집 | **"Use the Incremental Garbage Collector"** | **"Enabled by default."** |
| 설명의 방향 | 켜는 방법 | **끄는 방법**(`Project Settings > Player`) |
| 모드 이름 | 없음 | `Incremental` / `Non-incremental` / `Manual` |
| 플랫폼 예외 | 없음 | "The web platform doesn't support incremental" |

전자책이 그 아래 적어둔 한 줄은 지금도 유효하다 — **"the best long-term
course of action is to locate and stop frequent allocations that trigger
garbage collection."** 기본으로 켜져 있든 아니든, 할당을 줄이라는 쪽은
변하지 않았다. 그 "빈번한 할당"이 Unity API 쪽에서 어디서 생기는지는
[Unity 코드 최적화 문서는 목차의 목차다: 두 층 내려가서 건진 규칙들](/posts/unity-code-optimization/)에
적어뒀다 — 배열을 새로 만들어 돌려주는 API들이 그 목록이다.

## Memory Profiler는 더 이상 Preview가 아니다

프로파일링 절이 도구를 소개하면서 상태를 같이 적는다.

> This separate add-on (available as a Preview package in the Package Manager)
>
> can take a snapshot of your memory to help you identify problems like
> fragmentation and memory leaks.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**"Preview package"**다. Unity 6.6 매뉴얼의 같은 패키지 페이지는 다르게
적는다.

> Package version 1.1.12 is released for Unity Editor version 6000.6.
>
> — [Memory Profiler — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.memoryprofiler.html)

**`1.1.12`이고 `released`다.** 그 페이지에는 `preview`도 `experimental`도
쓰여 있지 않다. 패키지가 0.x preview에서 1.x 정식으로 올라간 것이고,
**전자책의 상태 표기가 그 전 시점에 멈춰 있다.**

이게 사소하지 않은 이유는, 상태 표기가 **쓸지 말지를 가르는 근거로 읽히기
때문**이다. "Preview라서 프로덕션에는 안 쓴다"는 판단을 2020 LTS 시절 문장을
근거로 내리게 된다. 지금은 정식 패키지다.

같은 절의 다른 도구 설명은 그대로 유효하다. **"The Profile Analyzer is
available via Unity's Package Manager."**도, Deep Profiling에 대한
**"Deep Profiling is resource-intensive and uses a lot of memory."**와
**"Use Call Stacks instead of Deep Profiling whenever possible."**도 지금
기준으로 바뀔 이유가 없는 문장들이다.

| 도구 | 전자책이 적은 상태 | 지금 |
|---|---|---|
| Memory Profiler | **"available as a Preview package"** | **`1.1.12` released** (6000.6) |
| Profile Analyzer | "available via Unity's Package Manager" | 그대로 |
| Deep Profiling | "resource-intensive and uses a lot of memory" | 그대로 |
| Heap Explorer | "a third-party Memory Profiler" | 서드파티라는 성격은 그대로 |

## 오디오 절의 숫자 둘은 지금도 그대로다

바뀐 것만 세면 글이 기울어진다. 오디오 절은 **숫자가 5년을 그대로 건너온**
쪽이다. 전자책이 스트리밍의 오버헤드를 숫자로 적는다.

> Streaming has a 200 KB overhead, so it is only suitable for sufficiently
> large AudioClips.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

현행 AudioClip 임포터 문서가 같은 숫자를 적는다.

> Streaming clips have an overhead of approximately 200KB, even without loaded
> audio data.
>
> — [Audio Clip — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)

**`200KB`가 그대로다.** ADPCM 비율도 맞는다 — 전자책이
**"a fixed 3.5:1 compression ratio"**라고 적고, 매뉴얼이 **"The compression
ratio is 3.5 times smaller than PCM"**이라고 적는다.

다만 **문서가 말하지 않는 것**을 전자책이 말하는 자리가 있다. 샘플레이트
권장값이다.

> For PC/console platforms, 44100Hz is ideal. 48000Hz is usually unnecessary.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**현행 AudioClip 문서는 권장 샘플레이트를 적지 않는다.** 그러니 이 숫자는
문서의 규정이 아니라 **전자책 저자들의 권고**다. 그 구분이 중요하다 — 문서에
있는 숫자와 사람이 권한 숫자를 같은 무게로 인용하면 안 된다.

그리고 그 칸의 선택지가 지금은 셋이다.

> Preserve Sample Rate: Choose this setting to keep the sample rate unmodified
> (default).
>
> Optimize Sample Rate: Optimize the sample rate automatically according to the
> highest frequency content analyzed.
>
> — [Audio Clip — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)

**`Optimize Sample Rate`가 생겼다.** 내용을 분석해서 자동으로 맞춘다. 전자책이
"플랫폼별로 이 값을 써라"로 적어둔 자리에, 지금은 **값을 고르지 않는 선택지**가
하나 더 있다. 기본값은 `Preserve Sample Rate`다.

전자책이 "Check Load in Background."로 한 줄 적어둔 그 설정이 실제로 어느
API와 묶여 있는지 — `Preload Audio Data`와 `LoadAudioData`, 그리고
`loadInBackground`가 동기/비동기를 가르는 자리 — 는
[멈출 수 있는 건 '현재 설정된 클립'뿐이다](/posts/audiosource-play-oneshot/)에서
문서 문장으로 짚어뒀다.

| 오디오 항목 | 전자책 | 현행 문서 |
|---|---|---|
| 스트리밍 오버헤드 | "200 KB overhead" | **"approximately 200KB"** — 그대로 |
| ADPCM 압축비 | "fixed 3.5:1" | "3.5 times smaller than PCM" — 그대로 |
| `Force To Mono` | 스테레오가 불필요하면 켜라 | "mix multi-channel audio down to a mono track" |
| `Load In Background` | 체크하라 | "prevents stalls on the main thread" |
| 권장 샘플레이트 | "44100Hz is ideal" | **문서는 적지 않는다** |
| 샘플레이트 모드 | 값을 고르는 칸 | `Preserve`(기본) / `Optimize` / `Override` |

## 어디에 왜 쓰나

이 전자책은 **지금도 읽을 가치가 있다.** 80개가 넘는 항목 중 대부분은
방향이 바뀌지 않았고, 오디오 절처럼 숫자까지 그대로인 데가 있다. 쓸 때
필요한 것은 **읽는 순서**다 — 표지의 `2020 LTS edition`을 먼저 보고, 숫자와
상태 표기가 나오는 문장마다 현행 문서를 한 번 열어보는 식이다.

처음 걱정했던 쪽 — **낮은 사양에서 안 돌아갈까** — 에 대해 이 전자책이 답을
주는 자리는 프로파일링 절이다. 모델의 폴리곤 수를 줄이는 것보다 먼저
**지금 어디서 시간이 가는지**를 봐야 하고, 전자책은 그 판정을 **어느 마커에
시간이 머무는가**로 가른다.

> If the render thread spends time in Camera.Render, your application is
> CPU-bound
>
> If the render thread spends time in Gfx.PresentFrame, your application is
> GPU-bound
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**모델이 무거운 게 원인이라고 짐작하기 전에 어느 쪽인지 먼저 가린다.**
무거운 모델이 GPU만 먹는다고 보기도 어렵다 — 드로우 콜과 배칭 쪽은 CPU에
걸리고, 그쪽은 앞선 글이 다룬 절이다.

### 동작하는 예제

전자책이 가장 먼저 세우는 기준이 **프레임 예산**이다. 그 숫자는 산술이라
지금도 그대로다.

> An application targeting 30 fps should always take less than 33.33 ms per
> frame
>
> a target of 60 fps leaves 16.66 ms per frame.
>
> We recommend that you use frame time in milliseconds instead.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

예산을 ms로 계산해서 **넘긴 프레임만 세는** 컴포넌트다. 목표 프레임레이트를
직접 적지 않고 런타임에서 읽어오게 했다.

```csharp file="Scripts/Diagnostics/FrameBudgetWatcher.cs"
using Unity.Profiling;
using UnityEngine;

public class FrameBudgetWatcher : MonoBehaviour
{
    private const float MillisecondsPerSecond = 1000f;

    [Header("예산")]
    [Tooltip("targetFrameRate가 -1일 때 쓸 목표. 전자책 기준은 30 또는 60이다")]
    [Min(1)]
    [SerializeField]
    private int _fallbackTargetFps = 60;

    [Header("보고")]
    [Tooltip("몇 초마다 집계를 남길지")]
    [Min(1f)]
    [SerializeField]
    private float _reportInterval = 5f;

    [Tooltip("켜면 예산을 넘긴 프레임마다 한 줄씩 남긴다")]
    [SerializeField]
    private bool _logEveryOverrun;

    // Begin/End는 ConditionalAttribute가 붙어 있어서 릴리스 빌드에서
    // 컴파일 단계에 사라진다고 문서가 적는다.
    private static readonly ProfilerMarker Marker =
        new ProfilerMarker("FrameBudgetWatcher.Tick");

    private float _budgetMs;
    private float _elapsed;
    private int _frames;
    private int _overruns;
    private float _worstMs;

    private void Start()
    {
        _budgetMs = MillisecondsPerSecond / ResolveTargetFps();
        Debug.Log($"프레임 예산 {_budgetMs:F2} ms", this);
    }

    private int ResolveTargetFps()
    {
        // 문서가 "Accepts an integer > 0, or special value -1 (default)"
        // 라고 적는다. -1이면 목표가 설정되지 않은 것이다.
        int target = Application.targetFrameRate;
        if (target > 0) { return target; }

        // vSyncCount가 0이 아니면 targetFrameRate는 무시된다고 문서가 적는다.
        // 그 경우 실제 상한은 디스플레이가 정하므로 여기서 단정하지 않고
        // 인스펙터 값을 쓴다.
        return _fallbackTargetFps;
    }

    private void Update()
    {
        using (Marker.Auto())
        {
            // timeScale에 영향받지 않는 실제 경과 시간을 본다.
            float frameMs = Time.unscaledDeltaTime * MillisecondsPerSecond;

            _frames++;
            _elapsed += Time.unscaledDeltaTime;

            if (frameMs > _worstMs) { _worstMs = frameMs; }

            if (frameMs > _budgetMs)
            {
                _overruns++;

                if (_logEveryOverrun)
                {
                    Debug.Log($"예산 초과 {frameMs:F2} ms", this);
                }
            }

            if (_elapsed >= _reportInterval) { Report(); }
        }
    }

    private void Report()
    {
        float ratio = _frames > 0 ? (float)_overruns / _frames : 0f;

        Debug.Log(
            $"{_frames}프레임 중 {_overruns}개 초과 ({ratio:P1}), " +
            $"최악 {_worstMs:F2} ms / 예산 {_budgetMs:F2} ms", this);

        _elapsed = 0f;
        _frames = 0;
        _overruns = 0;
        _worstMs = 0f;
    }
}
```

세 가지를 짚어둘 만하다.

**하나 — 목표를 상수로 박지 않았다.** 문서가 기본값을 적어둔다.

> Accepts an integer > 0, or special value -1 (default).
>
> — [Application.targetFrameRate](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-targetFrameRate.html)

**기본이 `-1`이다.** 아무것도 설정하지 않은 프로젝트에서 `targetFrameRate`를
읽으면 `-1`이 나오고, 그 값으로는 예산을 계산할 수 없다. 그래서 인스펙터
값으로 떨어진다. 같은 페이지가 **`vSyncCount`가 0이 아니면 `targetFrameRate`는
무시된다**고도 적으니, 실제 상한을 코드로 단정하지 않았다.

**둘 — `ProfilerMarker`의 비용에 대한 설명이 둘 다 맞다.** 전자책은
**"Each ProfilerMarker adds a tiny bit of overhead (about 10ns, depending on
the platform)"**라고 적는데, 현행 문서는 다른 각도를 적는다.

> Methods Begin and End are marked with ConditionalAttribute. They are
> conditionally compiled away and thus have zero overhead in non-Development
> (Release) builds.
>
> — [ProfilerMarker](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Unity.Profiling.ProfilerMarker.html)

**릴리스 빌드에서는 비용이 0이다.** 전자책의 10ns는 프로파일링이 켜진
상태의 이야기고, 두 문장이 충돌하지 않는다. 다만 전자책만 읽고 "마커를
아껴야 한다"로 가면 릴리스에서 사라진다는 쪽을 놓친다.

**셋 — `Time.unscaledDeltaTime`을 쓴다.** 예산은 실제 벽시계 기준이어야 한다.
`timeScale`을 0.5로 둔 느린 화면에서 `deltaTime`은 절반이 되지만, 프레임이
걸린 실제 시간은 그대로다.

### 무엇을 고르나

| 하고 싶은 일 | 쓸 것 | 근거 문장 |
|---|---|---|
| 프레임 예산을 정하기 | ms로 환산해서 보기 | "use frame time in milliseconds instead" |
| 30fps 목표 | `33.33 ms` | "should always take less than 33.33 ms per frame" |
| 60fps 목표 | `16.66 ms` | "a target of 60 fps leaves 16.66 ms per frame" |
| CPU/GPU 바운드 판정 | 렌더 스레드가 어디에 머무는지 | "Gfx.PresentFrame, your application is GPU-bound" |
| 코드 블록 계측 | `ProfilerMarker` | "the most efficient way of profiling your code" |
| 메모리 스냅샷 | Memory Profiler **정식 패키지** | "Package version 1.1.12 is released" |
| 증분 GC | **설정할 것이 없다** | "Enabled by default." |
| 스트리밍 클립 판단 | 200KB보다 충분히 큰지 | "overhead of approximately 200KB" |
| 샘플레이트를 고민하기 싫을 때 | `Optimize Sample Rate` | "automatically according to the highest frequency content" |

전자책을 읽는 순서는 이렇게 둔다.

1. **표지를 먼저 본다.** `2020 LTS edition`이다. 안내 페이지의 2023년은
   게시 날짜이고 판본이 아니다.
2. **상태 표기가 나오면 멈춘다.** `Preview`, `experimental` 같은 단어는
   5년 전 상태다. 패키지 페이지를 열어 지금 버전을 본다.
3. **숫자가 나오면 출처를 가린다.** 문서에 있는 숫자(200KB, 3.5:1)와 저자의
   권고(44100Hz)는 무게가 다르다.
4. **"Use ~"로 시작하는 팁은 기본값을 확인한다.** 증분 GC처럼 이미 켜져
   있는 것이 있다.

### 쓰지 말아야 할 자리

- **안내 페이지의 2023년을 판본으로 읽는 자리.** 표지는 `2020 LTS edition`
  이고 저작권 표시는 2021년이다.
- **물리 타임스텝 절의 "smaller value (like 0.1 s)"를 그대로 따르는 자리.**
  기본값 `0.02`보다 큰 값이다. 방향이 거꾸로 적혀 있다.
- **`Time.fixedDeltaTime`에 넣은 값이 그대로 보관된다고 보는 자리.** 문서가
  내부 격자에 **양자화**되고 float로 읽으면 1비트 다를 수 있다고 적는다.
- **"Preview라서 안 쓴다"를 이 전자책 문장으로 판단하는 자리.** Memory
  Profiler는 `1.1.12 released`다.
- **증분 GC를 켜러 가는 자리.** 이미 기본이다. 할 일은 끌지 말지를 정하는
  것이다.
- **웹 빌드에서 증분 GC를 전제하는 자리.** 문서가 지원하지 않는다고 적는다.
- **44100Hz를 "문서가 정한 값"으로 인용하는 자리.** 현행 AudioClip 문서는
  권장 샘플레이트를 적지 않는다.
- **`deltaTime`으로 프레임 예산을 재는 자리.** `timeScale`이 섞인다.
- **GPU·배칭·컬링 절을 이 글에서 찾는 자리.** 그쪽은 앞선 글이 웹 페이지판으로
  이미 다뤘다.

## 정리

- 안내 페이지는 **2023년 10월 19일**이라고 적고, `Read now`로 받은 PDF
  표지는 **`2020 LTS edition`**, 저작권 표시는 **© 2021**이다. 두 페이지
  어디에도 판본이 적혀 있지 않다.
- 이 전자책이 [파도 전선이 뭔가 했더니 wavefront였다](/posts/unity-gpu-optimization-page/)에서
  **링크 파라미터로 추론했던** 그 문서다. 이번에는 표지로 확인했다.
- 물리 절이 기본값을 `0.02`로 적고 두 줄 뒤에 **`0.1`을 "smaller value"라고
  부른다.** 방향이 거꾸로다. 모바일 예시의 `30ps`는 오타로 보이고 `0.035`초는
  약 28.6Hz다.
- **`0.02`라는 기본값 자체는 현행 문서에서 확인하지 못했다.**
  `Time.fixedDeltaTime`과 Time 설정 페이지 둘 다 기본값을 적지 않는다.
  대신 **양자화** 주의가 새로 붙었다.
- GC 수집기는 그대로다 — **"Boehm garbage collector for both the Mono and
  IL2CPP"**. 하지만 증분 수집은 **"Enabled by default."**이므로, 전자책의
  "Use the Incremental Garbage Collector"는 **할 일이 없는 팁**이 됐다.
  모드 이름과 끄는 자리(`Project Settings > Player`), 그리고 **웹 플랫폼
  미지원** 예외가 새로 생겼다.
- Memory Profiler는 **"Preview package"가 아니라 `1.1.12` released**다.
  상태 표기는 쓸지 말지를 가르는 근거로 읽히므로 가장 먼저 확인할 자리다.
- 오디오 절은 숫자가 그대로다 — **스트리밍 `200KB`**, **ADPCM `3.5:1`**.
  반면 **권장 샘플레이트(`44100Hz`)는 현행 문서에 없는** 저자 권고이고,
  샘플레이트 칸에는 **`Optimize Sample Rate`**가 새로 생겼다.
- 프레임 예산 숫자(`33.33 ms` / `16.66 ms`)는 산술이라 유효하다. 다만
  `Application.targetFrameRate`의 **기본값이 `-1`**이고 `vSyncCount`가
  우선하므로, 목표를 코드로 단정하면 안 된다.
- `ProfilerMarker`는 전자책의 "10ns"와 현행 문서의 **"zero overhead in
  non-Development (Release) builds"**가 충돌하지 않는다. 둘 다 적어둘 값이다.

---

### 참고

- [콘솔 및 PC 게임 성능 최적화 — Unity (한국어 안내 페이지)](https://unity.com/kr/resources/optimize-your-console-and-pc-game-performance)
- [Optimize your console and PC game performance — Unity (영문 안내 페이지)](https://unity.com/resources/optimize-your-console-and-pc-game-performance)
- [Optimize your game performance for consoles and PC — 2020 LTS edition (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)
- [Time.fixedDeltaTime — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Time-fixedDeltaTime.html)
- [Time 설정 — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-TimeManager.html)
- [Garbage collection — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/dotnet-garbage-collection.html)
- [Garbage collection modes — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/performance-incremental-garbage-collection.html)
- [Memory Profiler — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.memoryprofiler.html)
- [Audio Clip — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Application.targetFrameRate — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-targetFrameRate.html)
- [ProfilerMarker — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Unity.Profiling.ProfilerMarker.html)

원문 클리핑은 Unity의 한국어 안내 페이지
[콘솔 및 PC 게임 성능 최적화](https://unity.com/kr/resources/optimize-your-console-and-pc-game-performance)다.
스크랩된 것은 소개 문단과 관련 리소스 카드뿐이고 본문은 없다. 그래서 이 글은
같은 페이지의 **`Read now` 링크로 PDF를 직접 열어** 본문을 읽고, 네 절을 골라
현행 문서와 대조했다. **양식은 작성하지 않았다** — 본문을 받는 데 필요하지
않았다. 그 사실 자체가 이 페이지에서 처음 확인한 것이기도 하다.
