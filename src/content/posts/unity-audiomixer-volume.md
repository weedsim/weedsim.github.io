---
pubDatetime: 2026-09-30T18:30:00+09:00
title: "음소거를 풀면 dB가 선형값 자리에 들어간다"
lang: ko
translationKey: unity-audiomixer-volume
featured: false
draft: false
tags:
  - Unity
  - C#
  - 사운드
  - 수학
description: "AudioMixer로 볼륨을 조절하는 이유와 log 변환 설명은 정확하다. 그런데 음소거 해제 코드가 dB를 선형값 자리에 넣어서, 볼륨이 복구되는 대신 NaN이나 -Infinity가 들어간다."
---

설정 창을 만들던 중에 **`AudioSource`를 직접 하나씩 제어하는 것 말고 다른
방법이 있는지** 찾다가 스크랩한 글이다. 마스터·배경음·효과음 슬라이더를
`AudioMixer`로 만드는 방법을 2024년에 정리한 것으로, 왜 `AudioSource.volume`을
하나씩 만지면 안 되는지부터 시작해서 믹서 생성과 파라미터 노출, 그리고 로그
변환까지 간다.

**문제 설정이 정확하다.**

> 이 방법으로 구현한다면 게임에 존재하는 **모든 Audio Source의 Volume을 조절
> 해줘야 한다.** 그리고 마스터 볼륨은 배경음과 효과음 소리의 크기와 같이
> 조절하는 것이 아니라 따로 독립적으로 조절 해야 한다.

맞는 진단이고, 답으로 고른 `AudioMixer`도 맞다. 슬라이더의 `Min Value`를
0.0001로 두라는 조언과 그 이유도 정확하다.

걸리는 건 코드다. **음소거를 풀면 볼륨이 돌아오지 않는다.** 저장할 때는 dB로
읽고, 되돌릴 때는 그 값을 선형값 자리에 넣기 때문이다.

## 목차

## 로그 변환 설명은 정확하다

먼저 맞는 쪽부터. 클리핑이 슬라이더 최솟값의 이유를 이렇게 적는다.

> 이때, 슬라이더의 **Min Value를 0.0001로 설정해줘야한다.**

> 오디오 믹서는 **-80dB ~ 0dB** 로 구성되어 있기 때문에 **log(value) \* 20** 을
> 한다.

변환식이 맞다. 진폭을 데시벨로 바꾸는 식이 `dB = 20 × log₁₀(진폭)`이고, 그래서
이렇게 대응된다.

| 슬라이더 값 | `Mathf.Log10(v) * 20` |
|---|---|
| 1.0 | 0 dB |
| 0.5 | 약 -6.0 dB |
| 0.1 | -20 dB |
| 0.0001 | **-80 dB** |
| 0 | **-Infinity** |

**마지막 줄이 `Min Value`를 0으로 두면 안 되는 이유**다. `Mathf.Log10(0)`은
`-Infinity`이고, 그 값을 믹서에 넣으면 정상 범위를 벗어난다. 0.0001이 딱
-80 dB에 떨어지니 슬라이더 바닥이 믹서 바닥과 맞는다. **이 계산을 짚어둔 건
이 글의 잘한 부분이다.**

한 가지만 정정해두면, **인과가 반대로 적혀 있다.** "-80~0이기 때문에 log × 20을
한다"가 아니라, **`20 × log₁₀`이 진폭을 dB로 바꾸는 식이고**, 0.0001~1 구간이
거기에 넣었을 때 마침 -80~0으로 떨어지는 것이다. 순서를 바꾸면 다음 절이
설명된다.

## 0 dB는 상한이 아니라 경계다

클리핑은 범위를 "-80dB ~ 0dB"라고 적는데, 믹서의 실제 범위는 더 넓다. Unity
매뉴얼의 AudioGroup 인스펙터 설명이다.

> **감쇠는 –80dB(무음)까지, 게인은 +20dB까지 적용할 수 있다.**

`AudioMixer.SetFloat` 문서가 드는 볼륨 파라미터의 예시 범위도 같다.

> **-80f에서 20f까지**

**위쪽이 0이 아니라 +20이다.** 그러면 0 dB는 무엇인가. **감쇠와 게인이 갈리는
경계**다. `dB = 20 × log₁₀(진폭)`에 진폭 1.0을 넣으면 정확히 0이 나온다. 즉
0 dB는 **신호를 그대로 내보내는 지점**이고, 그 아래가 줄이는 쪽, 위가 키우는
쪽이다.

| dB | 진폭 배율 | 의미 |
|---|---|---|
| +20 | 10배 | 게인 상한 |
| 0 | 1배 | **원본 그대로 (경계)** |
| -6 | 약 0.5배 | 감쇠 |
| -80 | 0.0001배 | **무음 (하한)** |

여기서 따라오는 결론이 하나 있다. **증폭을 원하지 않는다면 상한을 0 dB로
두는 것이 맞다.** 선형값으로는 슬라이더 최대가 1.0이다.

**클리핑의 구성이 이미 그렇게 되어 있다.** 슬라이더가 0.0001~1이고 변환이
`20 × log₁₀`이니 도달 범위가 -80~0으로 떨어진다. 우연히 맞은 게 아니라
**볼륨 슬라이더로서 맞는 기본값**이다. 1을 넘겨 증폭하게 두면 원본이 이미 큰
소스에서 클리핑(파형이 잘려 생기는 왜곡)이 생길 수 있다.

**다만 그건 선택이지 믹서의 한계가 아니다.** 원본이 작게 녹음되어 "최대로
올려도 작다"가 되는 경우, 게인 쪽 +20 dB가 남아 있다. 그때 필요한 것은
슬라이더 범위를 늘리는 게 아니라 **변환식을 바꾸는 것**이다 — 예를 들어
슬라이더 0~1을 -80~+20에 선형 대응시키거나, 1.0을 0 dB에 두고 그 위를 따로
매핑한다. 어느 쪽이든 **0 dB가 어디에 오는지를 먼저 정해야** 한다.

## 음소거를 풀면 볼륨이 안 돌아온다

문제의 코드다.

```csharp
public void SetAudioVolume(EAudioMixerType audioMixerType, float volume)
{
    // 오디오 믹서의 값은 -80 ~ 0까지이기 때문에 0.0001 ~ 1의 Log10 * 20을 한다.
    audioMixer.SetFloat(audioMixerType.ToString(), Mathf.Log10(volume) * 20);
}

public void SetAudioMute(EAudioMixerType audioMixerType)
{
    int type = (int)audioMixerType;
    if (!isMute[type]) // 뮤트
    {
        isMute[type] = true;
        audioMixer.GetFloat(audioMixerType.ToString(), out float curVolume);
        audioVolumes[type] = curVolume;
        SetAudioVolume(audioMixerType, 0.001f);
    }
    else
    {
        isMute[type] = false;
        SetAudioVolume(audioMixerType,  audioVolumes[type] );
    }
}
```

**단위를 따라가면 된다.**

- `SetAudioVolume`의 `volume` 인자는 **선형값(0.0001~1)** 이다. 안에서
  `Log10 × 20`으로 dB로 바꾼다.
- `GetFloat`이 돌려주는 값은 **이미 dB**다. 믹서 파라미터의 값 그 자체다.
- 그런데 음소거 해제에서 그 **dB 값을 `SetAudioVolume`의 선형값 자리에**
  그대로 넣는다.

무슨 일이 생기는지 두 경우로 나눠보면 이렇다.

| 음소거 직전 볼륨 | 저장되는 값 | 해제 시 계산 | 결과 |
|---|---|---|---|
| 0 dB (최대) | `0` | `Mathf.Log10(0) * 20` | **`-Infinity`** |
| 0.5 (≈ -6 dB) | `-6.02` | `Mathf.Log10(-6.02) * 20` | **`NaN`** |

**둘 다 볼륨이 아니다.** 최대 볼륨이었으면 `-Infinity`가 들어가 계속 무음이고,
조금이라도 줄여둔 상태였으면 음수의 로그라 `NaN`이 들어간다.

음소거는 잘 되는데 해제가 안 되는 형태라, **"뮤트 버튼이 한 방향으로만
동작한다"**로 보인다. 원인은 믹서가 아니라 **한 함수 안에서 단위가 두 번
바뀌는 것**이다.

고치는 방법은 둘 중 하나다.

- **선형값을 저장한다.** 마지막으로 넘긴 `volume`을 그대로 기억해두면 변환이
  한 번뿐이다. 이쪽이 단순하다.
- **dB를 선형으로 되돌린다.** `Mathf.Pow(10f, dB / 20f)`가 역변환이다.
  `GetFloat`을 계속 쓰고 싶다면 이쪽.

## 뮤트는 -60 dB가 아니라 -80 dB다

같은 함수의 다른 줄이다.

```csharp
SetAudioVolume(audioMixerType, 0.001f);
```

`Mathf.Log10(0.001) * 20`은 **-60 dB**다. 그런데 슬라이더의 `Min Value`는
0.0001, 즉 **-80 dB**로 맞춰뒀다.

무음은 -80 dB 쪽이다. 앞에서 인용한 매뉴얼 문장이 **–80dB에 "(무음)"을 괄호로
붙여놓았다.** 믹서에서 소리를 없앤다는 것은 그 값을 넣는다는 뜻이다.

**그래서 뮤트 버튼이 슬라이더를 바닥까지 내린 것보다 크다.** 20 dB 차이면
진폭으로 10배다. 조용한 장면에서는 들린다. 값 하나를 `0.0001f`로 맞추면 둘이
일치한다.

`SetAudioVolume(type, 0f)`로 쓰고 싶어질 수 있는데 그건 안 된다. 앞 표대로
`Log10(0)`은 `-Infinity`다. **믹서에서 무음은 0이 아니라 -80 dB**이고,
선형으로는 0.0001이다. 로그를 거치는 값에서 "완전히 0"이라는 자리는 없다.

## 문서가 금지한 자리에서 부르면 조용히 실패한다

`AudioMixer.SetFloat` 문서에 코드로는 안 보이는 단서가 셋 있다.

> 노출된 파라미터를 찾지 못했거나 **스냅샷을 편집 중인 경우 `false`를
> 반환한다.**

**반환값이 있다.** 클리핑의 코드는 이걸 버린다. 그래서 Exposed Parameters의
이름과 `EAudioMixerType.ToString()`이 한 글자라도 다르면 **아무 일도 안 일어나고
에러도 안 난다.** 열거형 이름을 바꾸는 순간 조용히 깨지는 구조다.

> **`Awake()`, `OnEnable()`, `RuntimeInitializeLoadType.AfterSceneLoad`에서
> 호출하면 안 된다.** 대신 `Start()`를 쓸 것.

**타이밍 제한이 문서에 적혀 있다.** 클리핑의 `AudioManager`는 `Awake`에서
`Instance`만 잡으니 그 자체는 괜찮은데, **저장해둔 볼륨을 시작할 때 적용하는
코드**는 보통 `Awake`나 `OnEnable`에 들어간다. 거기서 부르면 실패하고, 증상은
"설정은 저장됐는데 게임을 다시 켜면 볼륨이 기본값"이다.

> 이 함수를 호출하고 나면 **믹서 스냅샷이 더 이상 그 노출 파라미터를 제어하지
> 않으며**, 이후로는 `AudioMixer.SetFloat`으로만 파라미터를 수정할 수 있다.

스냅샷으로 오디오 연출을 하는 프로젝트라면 알아둬야 한다. `SetFloat`을 한 번
부른 파라미터는 **스냅샷의 손을 떠난다.**

`GetFloat` 쪽 문서도 같이 옮겨둔다.

> 지정한 **노출 파라미터가 존재하지 않으면 `false`를 반환한다.**

> `SetFloat`이 호출되지 않았거나 `ClearFloat`이 쓰인 경우, **현재 스냅샷 또는
> 전환 중인 값**을 반영한다.

## 어디에 왜 쓰나

`AudioMixer`는 **그룹 단위로 한 번에 거는 볼륨**이 필요할 때 쓴다. 클리핑의
진단대로 `AudioSource`를 하나씩 도는 방식은 개수가 늘면 성립하지 않고, 마스터
볼륨처럼 "다른 조절 위에 한 번 더 걸리는" 구조를 만들 수 없다.

### 고친 AudioManager

단위를 한 군데에서만 바꾸고, 반환값을 확인하고, 문서가 금지한 자리를 피한다.

```csharp
using UnityEngine;
using UnityEngine.Audio;

public enum AudioChannel
{
    Master,
    BGM,
    SFX,
}

/// <summary>
/// AudioMixer의 노출 파라미터를 선형 볼륨(0.0001~1)으로 다룬다.
/// dB 변환은 이 클래스 안에서만 일어난다.
/// </summary>
public class AudioManager : MonoBehaviour
{
    /// <summary>믹서의 하한. Mathf.Log10(MIN_VOLUME) * 20 == -80dB.</summary>
    private const float MIN_VOLUME = 0.0001f;
    private const float MAX_VOLUME = 1f;

    [Header("Mixer")]
    [SerializeField, Tooltip("Master / BGM / SFX 파라미터가 노출된 믹서")]
    private AudioMixer _audioMixer;

    // 선형값으로 들고 있는다. dB를 저장하면 되돌릴 때 변환이 두 번 된다.
    private readonly float[] _volumes = { MAX_VOLUME, MAX_VOLUME, MAX_VOLUME };
    private readonly bool[] _muted = new bool[3];

    private void Start()
    {
        // 문서: Awake / OnEnable에서 SetFloat을 호출하면 안 된다. Start에서 적용한다.
        for (int i = 0; i < _volumes.Length; i++)
        {
            Apply((AudioChannel)i);
        }
    }

    /// <summary>슬라이더의 OnValueChanged에 연결한다. volume은 0.0001~1.</summary>
    public void SetVolume(AudioChannel channel, float volume)
    {
        _volumes[(int)channel] = Mathf.Clamp(volume, MIN_VOLUME, MAX_VOLUME);
        _muted[(int)channel] = false;

        Apply(channel);
    }

    /// <summary>음소거 토글. 버튼의 OnClick에 연결한다.</summary>
    public void ToggleMute(AudioChannel channel)
    {
        _muted[(int)channel] = !_muted[(int)channel];

        Apply(channel);
    }

    public float GetVolume(AudioChannel channel) => _volumes[(int)channel];

    public bool IsMuted(AudioChannel channel) => _muted[(int)channel];

    private void Apply(AudioChannel channel)
    {
        int index = (int)channel;

        // 음소거는 하한값이다. 슬라이더 바닥과 같은 -80dB가 된다.
        float linear = _muted[index] ? MIN_VOLUME : _volumes[index];

        // 단위 변환은 여기 한 줄뿐이다. dB = 20 * log10(진폭).
        float decibel = Mathf.Log10(linear) * 20f;

        // 문서: 파라미터를 못 찾거나 스냅샷 편집 중이면 false다. 버리지 않는다.
        if (!_audioMixer.SetFloat(channel.ToString(), decibel))
        {
            Debug.LogError(
                $"믹서에 '{channel}' 파라미터가 노출되어 있지 않다. " +
                "Exposed Parameters의 이름과 열거형 이름을 맞출 것.");
        }
    }
}
```

바뀐 것을 정리하면 이렇다.

- **저장을 선형값으로 한다.** `GetFloat`으로 dB를 읽어 보관하지 않으니 역변환이
  필요 없다. 음소거 해제가 그냥 마지막 값을 다시 적용하는 일이 된다.
- **음소거를 `MIN_VOLUME`으로 맞췄다.** 슬라이더 바닥과 같은 -80 dB다.
- **`SetFloat`의 반환값을 검사한다.** 이름이 어긋나면 콘솔에 남는다.
- **`Start`에서 적용한다.** 문서가 `Awake`·`OnEnable`을 금지한다.
- **변환이 한 줄뿐이다.** 단위가 섞이는 자리를 없앤 게 이 수정의 요지다.

### 저장한 볼륨을 적용하는 자리

설정은 보통 다시 켜도 남아야 한다. 어디에 저장할지는
[PlayerPrefs 글](/posts/playerprefs-storage-path/)에서 정리했는데, 거기 예제가
마침 `Audio.MasterVolume`이었다. 그 글이 **어디에 저장되는지**를 다뤘다면,
여기서는 **무엇을 저장해야 하는지**가 갈린다.

**저장하는 값은 선형값(0~1)이어야 한다.** dB를 저장하면 읽어올 때마다 어느
단위인지 확인해야 하고, 이 글의 버그가 바로 그 혼동에서 나왔다.

```csharp
using UnityEngine;

public class AudioSettingsLoader : MonoBehaviour
{
    private const string MASTER_KEY = "Audio.Master";
    private const float DEFAULT_VOLUME = 0.8f;

    [SerializeField] private AudioManager _audioManager;

    private void Start()
    {
        // Awake가 아니라 Start다. SetFloat이 Awake에서 실패한다.
        // 기본값 인자를 빼먹으면 0이 와서 -Infinity가 된다.
        float master = PlayerPrefs.GetFloat(MASTER_KEY, DEFAULT_VOLUME);

        _audioManager.SetVolume(AudioChannel.Master, master);
    }

    /// <summary>설정 창을 닫을 때처럼 경계가 되는 시점에 부른다.</summary>
    public void Save()
    {
        PlayerPrefs.SetFloat(MASTER_KEY, _audioManager.GetVolume(AudioChannel.Master));
        PlayerPrefs.Save();
    }
}
```

`PlayerPrefs.GetFloat`의 **기본값 인자를 빼먹으면 0이 온다.** 그러면
`Mathf.Log10(0)`으로 `-Infinity`가 되어, "처음 실행하면 소리가 안 난다"가 된다.
`Clamp`로 막아두긴 했지만 기본값을 넘기는 쪽이 의도가 분명하다.

### 쓰지 말아야 할 자리

- **`GetFloat`으로 읽은 dB를 선형값 자리에 넣기.** 이 글의 본론이다. `NaN`이나
  `-Infinity`가 된다.
- **음소거 값을 `0f`로 주기.** `Log10(0)`이 `-Infinity`다. 하한은 0.0001이다.
- **음소거와 슬라이더 바닥을 다른 값으로 두기.** 0.001과 0.0001은 20 dB
  차이다.
- **`Awake`·`OnEnable`에서 `SetFloat` 부르기.** 문서가 금지한다.
- **`SetFloat`의 반환값 버리기.** 이름이 어긋나면 조용히 아무 일도 안 일어난다.
- **`AudioSource.volume`을 하나씩 돌기.** 클리핑의 진단이 맞다.
- **스냅샷으로 연출하면서 같은 파라미터에 `SetFloat` 쓰기.** 한 번 부르면
  스냅샷이 그 파라미터를 놓는다.

## 정리

- **문제 설정과 로그 변환 설명은 정확하다.** 슬라이더 `Min Value`를 0.0001로
  두는 이유(`Log10(0)`이 `-Infinity`)까지 제대로 짚었다.
- 다만 **인과가 반대로 적혀 있다.** `20 × log₁₀`은 진폭→dB 변환식이고,
  0.0001~1이 거기 들어가 -80~0이 되는 것이다.
- **0 dB는 상한이 아니라 경계다.** 매뉴얼 표현으로 **"감쇠는 –80dB(무음)까지,
  게인은 +20dB까지"** 이고, 0 dB는 진폭 1배 — 원본 그대로다. **증폭을 원치
  않으면 상한을 0 dB(슬라이더 1.0)로 두는 것이 맞고**, 클리핑의 구성이 이미
  그렇다.
- **음소거 해제가 dB를 선형값 자리에 넣는다.** 최대 볼륨이었으면
  `-Infinity`, 줄여둔 상태였으면 **`NaN`**이 들어간다. 볼륨이 복구되지 않는다.
- **뮤트 값이 -60 dB다.** 무음은 매뉴얼이 괄호로 적어둔 **-80 dB**이고,
  슬라이더 바닥도 거기다. 20 dB 차이는 진폭 10배다. `0.0001f`로 맞추면
  일치한다.
- **`SetFloat`은 `false`를 반환할 수 있다.** 파라미터를 못 찾거나 스냅샷 편집
  중일 때다. 코드가 그 값을 버린다.
- **`Awake`·`OnEnable`에서 부르면 안 된다고 문서가 적는다.** 저장한 볼륨을
  시작 시 적용하는 코드가 여기 걸린다.
- **`SetFloat`을 한 번 부르면 스냅샷이 그 파라미터를 제어하지 않는다.**

단위가 섞이는 버그는 실행해도 예외가 안 나서 오래 산다. 이 코드도 **음소거는
멀쩡히 되기 때문에** 절반은 동작하는 것처럼 보인다. 값이 `NaN`이 되는 자리가
어디인지는 로그를 찍기 전까지 안 보이고, **변환을 한 군데로 모으면 그 자리가
아예 생기지 않는다.**

---

### 참고

- [AudioMixer.SetFloat — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.SetFloat.html)
- [AudioMixer.GetFloat — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.GetFloat.html)
- [오디오 믹서 개요 — Unity 매뉴얼](https://docs.unity3d.com/Manual/AudioMixerOverview.html)
- [AudioGroup 인스펙터 — Unity 매뉴얼](https://docs.unity3d.com/Manual/AudioMixerInspectors.html)
- [Mathf.Log10 — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Mathf.Log10.html)

이 글의 출발점이 된 자료는 [Deff_a — \[Unity/C#\] AudioMixer를 이용한 볼륨 조절](https://deff-dev.tistory.com/147)
(2024-06-26)이다. 믹서 설정 절차와 로그 변환 설명을 그대로 따라가면서, 예제
코드의 단위 흐름과 `SetFloat`·`GetFloat`의 계약을 현행 스크립팅 레퍼런스와
대조했다.
