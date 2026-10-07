---
pubDatetime: 2026-10-07T17:40:00+09:00
title: "스냅샷을 권하고, 코드가 스냅샷에서 빼낸다"
lang: ko
translationKey: audiomixer-groups-snapshots
featured: false
draft: false
tags:
  - Unity
  - C#
  - 사운드
  - UI
description: "Audio Mixer 설정 절차를 정리한 2023년 글이다. 믹서를 쓰는 이유로 스냅샷을 들고, 바로 뒤의 코드가 그 세 파라미터를 스냅샷의 손에서 영구히 빼낸다. 문서에 한 줄로 적혀 있다."
---

**[앞선 AudioMixer 글](/posts/unity-audiomixer-volume/)을 쓰고 나서 이어서
찾아보던 중** 스크랩한 글이다. 앞 글에서 로그 변환과 dB 범위,
`SetFloat`·`GetFloat`의 계약까지는 봤는데, 믹서를 **어떻게 구성하는가**는 거기서
다루지 않았다.

이 2023년 글이 그쪽이다. **에디터에서 믹서를 만드는 절차**를 화면별로 짚는다 —
그룹 추가, `Expose`, Audio Source의 `Output` 지정, 슬라이더 연결까지다. 앞 글이
**값의 단위**에 대한 글이었다면 이쪽은 **절차와 구조**다. 겹치는 자리는 짚고
넘어가되, 새로 걸리는 데가 따로 있다.

클리핑은 믹서를 써야 하는 이유를 셋 든다. 세 번째가 이렇다.

> **동적 오디오 변경:** **스냅샷**과 노출된 매개변수를 사용하여 다양한 Audio Mix
> 설정 간에 부드러운 전환을 생성하고 …

그리고 네 절 뒤의 코드가 이렇다.

```csharp
m_AudioMixer.SetFloat("Master", Mathf.Log10(volume) * 20);
```

`SetFloat` 문서의 첫 문단에 한 줄이 있다.

> Once you call this function, **mixer snapshots will no longer control the
> exposed parameter**, and you can only modify the parameter using
> AudioMixer.SetFloat.

**스냅샷을 쓰라고 권한 뒤에, 그 세 파라미터를 스냅샷에서 빼내는 코드를 준다.**

## 목차

## 스냅샷을 권하고, 코드가 스냅샷에서 빼낸다

순서가 중요하다. 문서의 문장은 조건부가 아니다 — **"이 함수를 호출하고 나면"**
이다. 한 번 부르면 그 파라미터는 돌아오지 않는다.

그래서 클리핑의 세팅을 그대로 따라가면 이렇게 된다.

| 시점 | Master / BGM / SFX 볼륨을 쥐고 있는 쪽 |
| --- | --- |
| 씬 시작 직후 | 믹서의 스냅샷 |
| 슬라이더를 한 번 움직인 뒤 | **`SetFloat`만** |

**슬라이더를 한 칸 움직이는 것으로 스냅샷 기능이 그 세 값에 대해 끝난다.** 전투
진입 시 BGM을 줄이는 연출을 스냅샷으로 만들어뒀다면, 플레이어가 설정 창을 한
번 열었다 닫은 뒤에는 그 연출이 안 먹는다. 에러도 로그도 없다.

되돌리는 길로 같은 클래스의 `ClearFloat`이 있다. 다만 **그 페이지가 적는 것은
한 줄뿐**이다.

> Resets an exposed parameter to **its initial value**.

스냅샷 통제가 돌아온다는 말은 **이 페이지에 없다.** 근거는 옆 함수 쪽에 있다.
앞 글에서 인용한 `GetFloat` 문서의 문장이다.

> `SetFloat`이 호출되지 않았거나 **`ClearFloat`이 쓰인 경우**, 현재 스냅샷 또는
> 전환 중인 값을 반영한다.

`ClearFloat` 뒤에 읽은 값이 "현재 스냅샷 또는 전환 중인 값"을 반영한다면 통제가
스냅샷 쪽으로 돌아온 것이다 — **두 문장을 이어서 나오는 결론**이고, 한쪽 문서가
직접 적어둔 것은 아니다. 그래서 되돌리기에 기대는 설계보다 **파라미터를 나누는
쪽**을 권한다.

**둘을 같이 쓰려면 경계를 정해야 한다.** 세 갈래다.

| 방식 | 스냅샷이 만지는 파라미터 | 슬라이더가 만지는 파라미터 |
| --- | --- | --- |
| 섞지 않는다 | — | Master / BGM / SFX |
| 파라미터를 나눈다 | 전투용 BGM 덕킹 전용 파라미터 | Master / BGM / SFX |
| 넘겨준다 | 연출 중에만 | 평소에만 (`ClearFloat`으로 반납) |

가장 안전한 쪽은 **둘째**다. 사용자가 만지는 볼륨 파라미터와 연출용 파라미터를
처음부터 다른 이름으로 노출해두면, `SetFloat`이 스냅샷과 부딪히는 자리가 생기지
않는다. 스냅샷 전환 자체는 `AudioMixerSnapshot.TransitionTo`로 한다.

> Performs an interpolated transition towards this snapshot over the time
> interval specified.

클리핑이 "부드러운 전환"이라고 한 게 이 함수이고, `timeToReach`가 그 시간이다.
**글이 소개한 기능과 글이 준 코드가 같은 파라미터를 두고 다투는 구조**라는 게
이 절의 요지다.

## Master와 BGM은 둘 다 걸린다

클리핑의 그룹 구성이다.

> \[+\] 버튼을 눌러서 그룹을 추가해 주면 됩니다. 이때 **Master 자식으로 그룹이
> 분류되며** BGM그룹, SFX그룹으로 나누어 줍니다.

맞는 설명이다. 그리고 매뉴얼이 그 구조의 결과를 적는다.

> **All sounds route into the Master group.** The Master group contains
> categories for music, menu sounds, and all application sounds.

> With the exception of sends and returns, the Audio Mixer contains groups that
> accept any number of input signals, mix those signals, and produce **exactly
> one output**.

그리고 감쇠가 어디 걸리는지도 적혀 있다.

> The **Attenuation** (volume setting) is done here for an AudioGroup. The
> Attenuation can be applied anywhere in the effect stack.

**세 문장을 이어 붙이면 결론이 나온다.** BGM 그룹의 감쇠가 걸린 신호가 Master로
들어가고, 거기서 Master의 감쇠가 **한 번 더** 걸린다. 그룹마다 감쇠가 있고
출력은 하나이므로, 체인을 지나는 신호는 두 감쇠를 차례로 통과한다.

dB는 로그 단위라 **곱이 합으로 보인다.**

| Master | BGM | BGM이 실제로 받는 감쇠 | 진폭 배율 |
| --- | --- | --- | --- |
| 0 dB | 0 dB | 0 dB | 1배 |
| −6 dB | 0 dB | −6 dB | 약 0.5배 |
| 0 dB | −6 dB | −6 dB | 약 0.5배 |
| −6 dB | −6 dB | **−12 dB** | 약 0.25배 |
| −40 dB | −40 dB | **−80 dB** | 무음 |

**마지막 줄이 실무에서 물리는 자리다.** 두 슬라이더를 각각 중간쯤 내렸는데
소리가 아예 안 들린다. 각각은 "절반"인데 합이 바닥이다.

문서가 "감쇠가 누적된다"는 문장으로 적어두지는 않았다. 위 결론은 **라우팅
설명에서 나오는 것**이고, 그래서 근거를 세 문장으로 나눠 적었다.

### 세 슬라이더가 서로를 모른다

클리핑의 코드는 세 핸들러가 독립적이다.

```csharp
public void SetMasterVolume(float volume)
{
    m_AudioMixer.SetFloat("Master", Mathf.Log10(volume) * 20);
}

public void SetMusicVolume(float volume)
{
    m_AudioMixer.SetFloat("BGM", Mathf.Log10(volume) * 20);
}
```

각자 자기 파라미터만 쓴다. 구조상 맞는 코드이고, **합산은 믹서가 한다.** 문제는
UI 쪽의 기대다. 사용자는 세 슬라이더를 **독립적인 세 값**으로 읽는데, 들리는
결과는 Master와 나머지의 **합**이다.

Master를 "전체 배율"로 쓰려면 그 성질을 UI가 드러내야 한다. 실무에서 쓰는 모양
둘이다.

- **Master를 0 dB에 고정하고 노출하지 않는다.** 사용자에게는 BGM·SFX 둘만
  준다. 합산이 일어날 자리가 없어진다.
- **Master의 범위를 좁게 둔다.** 예를 들어 −20~0 dB. 바닥까지 내려도 나머지
  슬라이더를 무음으로 끌고 내려가지 않는다.

둘 다 "Master 슬라이더를 0.0001까지 내릴 수 있게 두지 않는다"는 말이다.

## `Min Value` 0.001은 바닥이 −60 dB다

슬라이더 설정에 대한 마지막 지시다.

> 슬라이드 세팅까지 다했으면 마지막으로 슬라이더 **MinValue을 0.001**로
> 해줍니다.

`Min Value`를 0으로 두면 안 된다는 판단은 맞다. `Mathf.Log10(0)`은
`-Infinity`다. 그런데 **숫자가 한 자리 다르다.**

| `Min Value` | `Mathf.Log10(v) * 20` | 믹서에서 |
| --- | --- | --- |
| 0.001 | **−60 dB** | 아주 작게 들린다 |
| 0.0001 | **−80 dB** | 무음 (하한) |

[앞 글](/posts/unity-audiomixer-volume/)에서 같은 숫자를 다뤘다. 거기서는
**뮤트 버튼이 0.001을 넣는 것**이 문제였고, 여기서는 **슬라이더 바닥이
0.001**이다. 나타나는 증상이 반대다 — 저쪽은 "뮤트가 슬라이더 바닥보다 크다"였고
이쪽은 **"슬라이더를 끝까지 내려도 안 꺼진다"**다.

20 dB 차이면 진폭으로 10배다. 조용한 장면에서는 들린다. 설정 창에서 BGM을
완전히 끄려는 사용자가 슬라이더를 바닥까지 내렸는데 음악이 남아 있는 상태가
된다.

`0.0001`로 두면 바닥이 믹서의 하한과 맞는다. 클리핑의 변환식은 그대로 두고 **이
한 자리만 고치면 되는 자리**다.

## `slider.value`를 코드로 넣으면 금지 구간을 밟는다

클리핑의 연결 방식이다.

```csharp
private void Awake()
{
    m_MusicMasterSlider.onValueChanged.AddListener(SetMasterVolume);
    m_MusicBGMSlider.onValueChanged.AddListener(SetMusicVolume);
    m_MusicSFXSlider.onValueChanged.AddListener(SetSFXVolume);
}
```

`AddListener`를 `Awake`에서 하는 것 자체는 문제가 없다. 걸리는 건 **그다음에
보통 추가하는 코드**다. 저장해둔 볼륨을 슬라이더에 되돌려 놓는 줄이다.

```csharp
// 자연스러워 보이는 다음 줄
m_MusicBGMSlider.value = PlayerPrefs.GetFloat("BGM", 1f);
```

`Slider`에는 메서드가 하나 따로 있다.

> **SetValueWithoutNotify** — Set the value of the slider **without invoking
> onValueChanged callback.**

**이 메서드가 존재한다는 것이, `value` 대입은 콜백을 부른다는 뜻이다.** 그러면
위 한 줄이 `SetMusicVolume`을 부르고, 그 안에서 `SetFloat`이 불린다. **`Awake`
안에서다.**

`SetFloat` 문서가 금지한 자리가 거기다.

> `MonoBehaviour.Awake`, `MonoBehaviour.OnEnable`,
> `RuntimeInitializeLoadType.AfterSceneLoad`

> Instead, invoke this method in `MonoBehaviour.Start` or any event function
> Unity calls afterwards

그리고 그 결과를 문서가 이렇게 적는다 — **"can result in unexpected
behavior."**

증상은 특정하기 쉽다. **설정은 저장됐는데 게임을 다시 켜면 볼륨이 기본값이다.**
`SetFloat`이 조용히 실패하고 반환값은 아무도 안 본다. 앞 글에서 `SetFloat`의
반환값을 버리는 코드를 짚었는데, **이 경로에서는 그 반환값이 유일한 단서다.**

고치는 방법은 둘이다.

| 방법 | 효과 |
| --- | --- |
| 초기화를 `Start`로 옮긴다 | 금지 구간을 벗어난다 |
| `SetValueWithoutNotify`를 쓴다 | 콜백이 안 돌아서 `SetFloat`이 불리지 않는다 |

**둘을 같이 쓰는 게 맞다.** `Start`에서 `SetValueWithoutNotify`로 슬라이더를
맞춰두고, 믹서에는 따로 한 번 `SetFloat`을 부른다. 콜백에 기대어 두 가지를
동시에 하려 하면 순서가 꼬인다.

`AddListener`의 짝인 `RemoveListener`가 없는 것도 같이 적어둔다. 설정 패널이
씬과 수명을 같이하면 실무에서 문제가 되지 않지만, 패널을 켜고 끄는 구조라면
등록이 쌓인다. 등록과 해제를 짝으로 두는 이유는
[Action으로 이벤트를 등록한 글](/posts/csharp-action-events/)에 있다. `UnityEvent`
쪽도 같은 성질이고, 인스펙터에서 연결하는 방법과의 비교는
[InputField를 다룬 글](/posts/ugui-inputfield-name-entry/)에 있다.

## 성능 주장은 문서가 뒷받침하지 않는다

믹서를 써야 하는 이유의 두 번째다.

> **효율적인 리소스 관리:** 유사한 Audio Source를 Audio 그룹으로 그룹화하여
> 볼륨을 제어하고 효과를 적용하고 전체적으로 조정할 수 있습니다. **Audio
> Source개별적으로 처리하는 성능 오버헤드를 줄입니다.**

앞 문장은 맞다. 그룹화해서 한 번에 조정하는 것이 믹서의 용도다. **뒤 문장의
근거를 문서에서 찾지 못했다.**

믹서 소개 페이지에는 CPU나 `AudioSource` 처리 비용에 대한 문장이 없다. 오히려
Audio Profiler 문서는 **믹싱 자체를 비용 쪽에** 놓는다.

> **DSP CPU** — the amount of CPU your project uses by **mixing**, audio
> effects, and decompression of non-streamed sounds …

**믹싱이 DSP CPU를 쓰는 항목으로 적혀 있다.** 그룹을 추가하는 것은 신호가
지나갈 노드를 추가하는 것이고, 소리를 내는 `AudioSource`의 수가 줄어드는 것이
아니다.

정확하게 다시 적으면 이렇다. **효과(effect)를 소스마다 거는 대신 그룹에 한 번
거는 쪽이 싸다.** 리버브를 열 개 소스에 각각 걸면 열 번 돌고, 그룹에 걸면 한 번
돈다. 그게 그룹화가 주는 절약이고, **소스 자체의 처리가 줄어드는 것과는 다른
이야기**다.

| 주장 | 성립 여부 |
| --- | --- |
| 그룹으로 볼륨·효과를 한 번에 조정한다 | 맞음 |
| 효과를 소스마다 거는 것보다 그룹에 거는 쪽이 싸다 | 성립. 다만 클리핑이 적은 문장은 아니다 |
| `AudioSource` 개별 처리 오버헤드가 줄어든다 | **문서에 근거가 없다** |

실제로 오디오 비용을 보려면 Profiler의 Audio 모듈에서 DSP CPU와 Streaming CPU를
읽는 쪽이다. 최적화 문서를 훑은 이야기는
[Unity 코드 최적화 문서를 정리한 글](/posts/unity-code-optimization/)에 있다.

## 대조하고 넘어간 것들

절차 설명은 거의 다 맞는다.

| 클리핑의 주장 | 확인 |
| --- | --- |
| `[Create] - [Audio Mixer]`로 만들고 처음엔 Master만 있다 | 맞음 |
| `[+]`로 추가한 그룹은 Master의 자식이 된다 | 맞음. 매뉴얼이 "All sounds route into the Master group" |
| Attenuation의 Volume을 우클릭해 `Expose`한다 | 맞음 |
| Exposed Parameters의 이름을 바꿔 쓴다 | 맞음. 그 이름이 `SetFloat`의 첫 인자다 |
| Audio Source의 `Output`에 그룹을 지정한다 | 맞음 |
| 슬라이더의 `Min Value`를 0으로 두면 안 된다 | 맞음. `Log10(0)`이 `-Infinity`다 |

**노출 파라미터의 이름을 바꾸는 절차를 따로 짚어둔 게 좋다.** 기본 이름은
사람이 읽을 수 있는 형태가 아니고, 그 문자열이 그대로 `SetFloat`의 키가 된다.
앞 글에서 봤듯 이름이 한 글자라도 다르면 `SetFloat`이 `false`를 돌려주고 아무
일도 일어나지 않는다.

> Returns false if the exposed parameter was not found or snapshots are
> currently being edited.

**반환값에 두 가지 실패가 섞여 있다는 것도 읽어둘 값이 있다.** 이름을 못 찾은
경우와 **스냅샷을 편집 중인 경우**다. 후자는 에디터에서 믹서 창을 열어둔 채
플레이할 때 걸릴 수 있는 자리다.

## 어디에 왜 쓰나

### 설정 패널 하나

앞의 네 가지를 다 반영한 모양이다. 저장은 `PlayerPrefs`로 하고, 초기화는
`Start`에서, 슬라이더는 알림 없이 맞춘다.

```csharp
using UnityEngine;
using UnityEngine.Audio;
using UnityEngine.UI;

public class AudioSettingsPanel : MonoBehaviour
{
    private const float MIN_LINEAR = 0.0001f;   // -80 dB. 믹서의 하한
    private const float MAX_LINEAR = 1f;        //   0 dB
    private const float DEFAULT_LINEAR = 1f;

    private const string KEY_BGM = "volume.bgm";
    private const string KEY_SFX = "volume.sfx";

    [Header("Mixer")]
    [SerializeField, Tooltip("노출 파라미터를 가진 믹서")]
    private AudioMixer _mixer;

    [Header("Sliders")]
    [SerializeField, Tooltip("배경음 슬라이더. Min Value는 0.0001")]
    private Slider _bgmSlider;

    [SerializeField, Tooltip("효과음 슬라이더. Min Value는 0.0001")]
    private Slider _sfxSlider;

    // Awake가 아니라 Start다. SetFloat이 Awake에서 금지되어 있다.
    private void Start()
    {
        float bgm = PlayerPrefs.GetFloat(KEY_BGM, DEFAULT_LINEAR);
        float sfx = PlayerPrefs.GetFloat(KEY_SFX, DEFAULT_LINEAR);

        // 슬라이더는 알림 없이 맞춘다. 콜백이 돌면 SetFloat이 두 번 불린다.
        _bgmSlider.SetValueWithoutNotify(Mathf.Clamp(bgm, MIN_LINEAR, MAX_LINEAR));
        _sfxSlider.SetValueWithoutNotify(Mathf.Clamp(sfx, MIN_LINEAR, MAX_LINEAR));

        // 믹서에는 따로 한 번 적용한다.
        Apply("BGM", bgm);
        Apply("SFX", sfx);

        _bgmSlider.onValueChanged.AddListener(OnBgmChanged);
        _sfxSlider.onValueChanged.AddListener(OnSfxChanged);
    }

    private void OnDestroy()
    {
        // 등록한 만큼 해제한다.
        if (_bgmSlider != null)
        {
            _bgmSlider.onValueChanged.RemoveListener(OnBgmChanged);
        }

        if (_sfxSlider != null)
        {
            _sfxSlider.onValueChanged.RemoveListener(OnSfxChanged);
        }
    }

    private void OnBgmChanged(float linear)
    {
        Apply("BGM", linear);
        PlayerPrefs.SetFloat(KEY_BGM, linear);
    }

    private void OnSfxChanged(float linear)
    {
        Apply("SFX", linear);
        PlayerPrefs.SetFloat(KEY_SFX, linear);
    }

    private void Apply(string parameterName, float linear)
    {
        float clamped = Mathf.Clamp(linear, MIN_LINEAR, MAX_LINEAR);
        float decibels = Mathf.Log10(clamped) * 20f;

        // 반환값을 본다. 이름이 틀리면 여기서만 드러난다.
        if (!_mixer.SetFloat(parameterName, decibels))
        {
            Debug.LogWarning($"노출 파라미터 '{parameterName}'을 찾지 못했다", this);
        }
    }
}
```

**Master 슬라이더가 없다.** 앞 절의 합산 때문이고, Master는 믹서에서 0 dB로
두고 노출하지 않는다. 사용자가 조절하는 것은 BGM과 SFX 둘이다.

`Mathf.Clamp`를 `Apply` 안에서 한 번 더 하는 이유는 저장된 값이 슬라이더 범위를
벗어나 있을 수 있기 때문이다. 슬라이더의 `Min Value`를 나중에 바꾸거나, 다른
버전에서 저장한 값이 들어오는 경우다. `PlayerPrefs`가 값을 어디에 두는지는
[저장 경로를 다룬 글](/posts/playerprefs-storage-path/)에 있다.

### 스냅샷과 같이 쓸 때

연출용 파라미터를 따로 노출해두는 쪽이다. 사용자 볼륨과 부딪히지 않는다.

```csharp
using UnityEngine;
using UnityEngine.Audio;

public class CombatAudioMood : MonoBehaviour
{
    private const float TRANSITION_SECONDS = 0.5f;

    [Header("Snapshots")]
    [SerializeField, Tooltip("평상시 스냅샷")]
    private AudioMixerSnapshot _normal;

    [SerializeField, Tooltip("전투 중 스냅샷. BGM을 덕킹한다")]
    private AudioMixerSnapshot _combat;

    public void EnterCombat()
    {
        // 사용자 볼륨 파라미터는 건드리지 않는다. 스냅샷은 별도 파라미터를 움직인다.
        if (_combat == null)
        {
            return;
        }

        _combat.TransitionTo(TRANSITION_SECONDS);
    }

    public void ExitCombat()
    {
        if (_normal == null)
        {
            return;
        }

        _normal.TransitionTo(TRANSITION_SECONDS);
    }
}
```

**스냅샷이 움직이는 파라미터와 슬라이더가 움직이는 파라미터를 처음부터
분리해두는 것**이 이 코드의 전제다. 같은 파라미터를 두 쪽이 노리면 `SetFloat`을
한 번 부른 뒤로 스냅샷이 손을 뗀다.

### 쓰지 말아야 할 자리

- **스냅샷으로 쓸 파라미터에 `SetFloat`을 부르는 것.** 한 번이면 끝이다.
  `ClearFloat`에 기대기보다 파라미터를 나누는 쪽이 낫다.
- **슬라이더 `Min Value`를 0.001로 두는 것.** 바닥이 −60 dB다. 무음은 0.0001,
  곧 −80 dB다.
- **슬라이더 `Min Value`를 0으로 두는 것.** `Log10(0)`은 `-Infinity`다.
- **`Awake`에서 저장값을 슬라이더에 대입하는 것.** 콜백이 돌면서 `SetFloat`이
  금지 구간에서 불린다. `Start`로 옮기고 `SetValueWithoutNotify`를 쓴다.
- **Master를 사용자 슬라이더로 바닥까지 열어두는 것.** 자식 그룹의 감쇠와
  합산되어 둘 다 중간인데 무음이 되는 구간이 생긴다.
- **`SetFloat`의 반환값을 버리는 것.** 이름 오타와 스냅샷 편집 중이 둘 다 조용히
  실패로 돌아온다.
- **그룹화가 `AudioSource` 처리 비용을 줄인다고 읽는 것.** 문서에 근거가 없다.
  절약되는 쪽은 소스마다 걸던 **효과**다.

## 정리

- **글이 권한 기능을 글이 준 코드가 막는다.** `SetFloat` 문서가 "이 함수를
  호출하고 나면 스냅샷이 더는 그 노출 파라미터를 제어하지 않는다"고 적는다.
  슬라이더를 한 칸 움직이는 것으로 세 파라미터가 스냅샷에서 빠진다.
- **`ClearFloat`이 되돌리는 길이지만 문서가 거기까지 적지 않는다.** 그 페이지는
  "초기값으로 되돌린다"까지고, 스냅샷 복귀는 `GetFloat` 문서와 이어서 나오는
  결론이다. 그래서 사용자 볼륨과 연출용 파라미터를 **처음부터 다른 이름으로**
  노출해두는 쪽이 낫다.
- **Master와 자식 그룹의 감쇠가 차례로 걸린다.** "모든 소리는 Master로
  라우팅된다"와 "그룹마다 감쇠가 있고 출력은 하나"를 이으면 나오는 결론이다.
  −40 dB와 −40 dB가 겹치면 −80 dB, 곧 무음이다.
- **그래서 Master를 사용자 슬라이더로 열지 않는 쪽이 안전하다.** 0 dB에 고정하고
  BGM·SFX만 준다.
- **`Min Value` 0.001은 −60 dB다.** 한 자리 차이로 슬라이더 바닥이 무음에
  닿지 않는다. 0.0001이 −80 dB다.
- **`slider.value` 대입은 `onValueChanged`를 부른다.** `SetValueWithoutNotify`가
  따로 있는 게 그 증거다. `Awake`에서 대입하면 `SetFloat`이 문서가 금지한
  구간에서 불린다.
- **성능 주장은 문서가 뒷받침하지 않는다.** 믹서 소개 페이지에 CPU 문장이 없고,
  Audio Profiler 문서는 **믹싱을 DSP CPU 항목으로** 적는다. 절약되는 것은
  소스마다 걸던 효과 쪽이다.
- **절차 설명은 거의 다 맞는다.** 특히 노출 파라미터의 이름을 바꾸라고 짚어둔
  게 좋다. 그 문자열이 그대로 `SetFloat`의 키다.

---

### 참고

- [오디오 믹서 소개 — Unity 매뉴얼](https://docs.unity3d.com/Manual/AudioMixerOverview.html) ·
  [AudioGroup 인스펙터](https://docs.unity3d.com/Manual/AudioMixerInspectors.html)
- [AudioMixer.SetFloat — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Audio.AudioMixer.SetFloat.html) ·
  [AudioMixer.GetFloat](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.GetFloat.html) ·
  [AudioMixer.ClearFloat](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.ClearFloat.html)
- [AudioMixerSnapshot.TransitionTo — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Audio.AudioMixerSnapshot.TransitionTo.html)
- [Slider — UGUI API 레퍼런스](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Slider.html)
- [Audio Profiler 모듈 — Unity 매뉴얼](https://docs.unity3d.com/Manual/ProfilerAudio.html)
- [Mathf.Log10 — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Mathf.Log10.html)

이 글의 출발점이 된 자료는
[VR하는소년 — 유니티 Audio Mixer 사용방법](https://wlsdn629.tistory.com/entry/unity-audio-mixer-guide)
(2023-06-14)이다. 값의 단위와 `SetFloat`·`GetFloat`의 계약은
[앞 글](/posts/unity-audiomixer-volume/)에서 다뤘고, 이 글에서는 **절차와 그룹
구조**를 현행 매뉴얼과 스크립팅 레퍼런스 양쪽에 대조했다. 확인 시점은
2026-10-07이다.
