---
pubDatetime: 2026-10-13T15:40:00+09:00
title: "멈출 수 있는 건 '현재 설정된 클립'뿐이다"
lang: ko
translationKey: audiosource-play-oneshot
featured: false
draft: false
tags:
  - Unity
  - C#
  - 사운드
  - 최적화
description: "동영상에서 뽑은 사운드를 한 번만 재생하는 방법을 찾다가 스크랩하고, TTS 프로젝트의 대사·효과음 작업에서 다시 꺼내 본 글이다. Play()와 PlayOneShot()의 차이를 두 문단으로 정리해뒀다. 차이는 맞는데, 그 차이가 데려오는 결과가 빠져 있다. 문서는 Play·Pause·Stop을 한 클립의 삼종으로 묶고, PlayOneShot을 그 바깥에 둔다."
---

처음에는 **동영상에서 사운드를 따로 뽑아 재생하고 있었다.** 그걸 한 번만
재생하는 방법을 찾던 중에 `AudioSource.Play()`와 `AudioSource.PlayOneShot()`의
차이를 두 문단으로 정리한 글을 스크랩해뒀다. 그리고 나중에 **TTS 프로젝트에서
인게임 대사와 효과음 출력을 작업하면서 이 글을 다시 꺼내 봤다.** 2024년
글이고, 두 API 레퍼런스를 거의 그대로 옮겨왔다. 차이에 대한 서술이 맞다 — `Play()`는 이미 나던 소리를 끊고 다시
시작하고, `PlayOneShot()`은 끊지 않고 겹쳐 쌓인다.

틀린 데가 없다. 다만 **그 차이가 데려오는 결과가 빠져 있다.** 겹쳐 쌓이는
소리는 당신이 지정한 클립이 아니기 때문이다. `Stop()`의 문서가 멈추는 대상을
이렇게 적는다.

> The AudioSource.stop function stops the currently set Audio clip from
> playing.

**"현재 설정된 클립"**이다. 그러면 인자로 넘긴 클립은 어떻게 되는가. 그
질문에서 시작한다.

이 블로그에 소리 글이 넷 있고, 이 글이 다섯째다. 영역이 이렇게 갈린다 —
[음소거를 풀면 dB가 선형값 자리에 들어간다](/posts/unity-audiomixer-volume/)와
[스냅샷을 권하고, 코드가 스냅샷에서 빼낸다](/posts/audiomixer-groups-snapshots/)는
**믹서에서 음량을 다루는 쪽**,
[에러 페이지가 돌아와도 result는 ConnectionError가 아니다](/posts/google-translate-tts/)는
**런타임에 클립을 만드는 쪽**,
[화질을 쥐고 있는 건 Color Format이 아니라 해상도와 Aspect Ratio다](/posts/video-player-raw-image/)는
**동영상의 소리를 어디로 내보내는 쪽**이다. 이 글은 **`AudioSource`에서
재생을 시작하고 멈추는 쪽**을 본다. 겹치는 자리는 링크로 넘기지 않고 필요한
만큼 여기서 다시 싣는다.

확인한 것은 일곱 가지다. **문서가 두 함수를 다른 묶음에 넣고 셋째 선택지를
준다**, **`clip`에 대입하는 것만으로 이미 나던 소리가 멈춘다**, **`Stop`의
문서가 `PlayOneShot`을 언급하지 않는다**, **그런데 `isPlaying`은 one-shot에도
참이다**, **`PlayOneShot`의 두 번째 인자에 경고가 붙어 있다**, **독립 재생에는 culling
이라는 천장이 있다**, 그리고 **세 함수의 비용이 호출이 아니라 클립을 적재하는
쪽에 있다.**

확인 시점은 **2026-10-13**이고, 기준은 Unity **6.6**이다.

## 목차

## 문서가 둘을 다른 묶음에 넣는다

`PlayOneShot` 페이지의 마지막 줄이 다른 페이지를 가리킨다.

> For more information on how this method differs from AudioSource.Play, see
> AudioSource.

그 `AudioSource` 클래스 페이지에 세 줄이 나란히 있다.

> To play, pause, and stop a single audio clip, use Play, Pause and Stop.

> To play multiple sounds on one AudioSource, use PlayOneShot.

> To play a clip at a static position in 3D space, use PlayClipAtPoint.

**`Play` · `Pause` · `Stop`이 한 묶음이고, 그 묶음의 대상이 "a single audio
clip"이다.** `PlayOneShot`은 그 묶음 바깥에 있고, 설명이 "multiple sounds"다.
클리핑이 옮겨온 문장도 그 바깥에서 성립한다.

> AudioSource.PlayOneShot does not cancel clips that are already being played
> by AudioSource.PlayOneShot and AudioSource.Play.

**끊지 않는다는 것은 끊을 수단이 없다는 뜻이기도 하다.** 클리핑이 말한
"독립적으로 재생된다"를 뒤집으면 그 문장이 나온다.

그리고 셋째 선택지가 있는데 클리핑에 없다.

> public static void PlayClipAtPoint(AudioClip clip, Vector3 position,
> float volume = 1.0F);

> Plays an AudioClip at a given position in world space.

> This function creates an audio source but automatically disposes of it once
> the clip has finished playing.

**`static`이고, 호출마다 오디오 소스를 만들어서 끝나면 스스로 치운다.**
소리를 낼 오브젝트가 그 전에 파괴되는 경우에 쓰는 자리다 — 터지는 적,
사라지는 아이템. 대가는 호출마다 소스를 하나 만든다는 것이다.

| 함수 | 재생 대상 | 문서가 적은 쓰임새 |
| --- | --- | --- |
| `Play` | `AudioSource.clip` | "a single audio clip" |
| `PlayOneShot` | 인자로 받은 클립 | "multiple sounds on one AudioSource" |
| `PlayClipAtPoint` | 인자로 받은 클립 | "at a static position in 3D space" |

## Play가 재생하는 건 '현재 설정된 클립'이다

`clip` 속성의 설명이 네 문장이고, 둘째와 셋째가 중요하다.

> The default AudioClip to play.

> AudioSource clip determines the audio clip that should play next.

> When you assign a new audio clip to clip, the old clip it replaces (if any)
> stops and is replaced by the new one.

> However, the new clip doesn't automatically play so you need to use
> AudioSource.Play (or similar) to play it.

**대입하는 것만으로 이미 나던 소리가 멈추고, 대입만으로는 새 소리가 나지
않는다.** 멈추는 쪽과 시작하는 쪽이 서로 다른 동작에 붙어 있다. 그래서
클리핑의 예제가 이렇게 생긴 것이다.

> audioSource.Clip = clip;
> audioSource.Play();

(원문의 대문자 `Clip`은 오타다. 속성 이름은 `clip`이다.) 그리고 `Play` 쪽
설명에 조건이 하나 붙어 있다.

> If AudioSource.clip is set to the same clip that is playing then the clip
> will sound like it is re-started.

**"같은 클립일 때"** 다시 시작한 것처럼 들린다는 것이다. 클리핑은 이 조건
없이 "Play함수를 새로 호출하면 클립이 다시 시작된 것처럼 들립니다"라고
적는데, 그 사이에 `clip`을 바꿨다면 들리는 것은 재시작이 아니라 **다른
소리**다. 같은 페이지가 전제도 적어둔다.

> AudioSource will assume any Play call will have a new audio clip to play.

## Stop이 멈추는 것도 '현재 설정된 클립'이다

`Stop`의 설명은 세 문장이다.

> Stops playing the clip.

> The AudioSource.stop function stops the currently set Audio clip from
> playing.

> The Audio clip plays from the beginning the next time you play it.

**"the currently set Audio clip"** — 앞 절에서 본 `clip` 속성이 가리키는 그
클립이다. `PlayOneShot`에 인자로 넘긴 클립은 `clip`에 대입된 적이 없다.

그 페이지가 참고로 가리키는 함수도 둘뿐이다.

> Additional resources: Play, Pause functions.

**`PlayOneShot`이 없다.** 그리고 `isVirtual` 속성이 두 종류를 이름으로
나눠 센다.

> True if all sounds played by the AudioSource, such as main sound started by
> Play() or playOnAwake, and one-shots are culled by the audio system.

**"main sound started by Play() or playOnAwake"와 "one-shots"**를 따로
적는다. 문서가 한 `AudioSource` 안에 두 종류의 소리가 있다고 보는 것이다.

여기까지가 확인한 문장들이다. 이어붙이면 "`Stop()`은 one-shot을 멈추지
않는다"가 되는데, **그렇게 한 문장으로 적어둔 자리는 찾지 못했다.** 그건 제
추론이다. 확인한 것은 이것이다 — **`Stop`은 "현재 설정된 클립"을 멈춘다고
적혀 있고, one-shot은 그 클립이 아니며, `Stop`의 참고 목록에 `PlayOneShot`이
없다.** 멈춰야 하는 소리라면 **`clip`에 올려두고 `Play`로 트는 쪽**이 문서가
보장하는 경로다.

## 그런데 isPlaying은 one-shot에도 참이다

여기서 예상과 다른 것이 하나 나온다. 멈출 수 없다면 상태도 모를 것 같은데,
`isPlaying`은 그렇지 않다.

> Returns whether the AudioSource is currently playing an AudioResource(Read
> Only).

> AudioSource.isPlaying returns true if the AudioSource is playing any
> AudioResource, such as AudioClip or AudioRandomContainer.

> This includes if you use PlayOneShot() or if you play a video or timeline
> track through the AudioSource.

**one-shot도 포함된다고 명시돼 있다.** 그래서 정확히 이렇게 갈린다 — **소리가
나고 있는지는 알 수 있고, 무엇을 멈출지는 고를 수 없다.** `isPlaying`으로
"효과음이 끝났나"를 판정하려 하면, 다른 one-shot 하나가 아직 울리고 있는
동안 계속 참이 돌아온다.

주의 사항 셋이 더 붙어 있다.

> Note: AudioSource.isPlaying returns false when AudioSource.Pause() is
> called.

> Note: If you use AudioSource.Play() back again, it returns true.

> Note: If you use AudioSource.PlayDelayed to play your clip,
> AudioSource.isPlaying returns true during the delay.

**일시정지 중에는 거짓이고, 지연 재생의 대기 중에는 참이다.** `isPlaying`을
"재생 중"으로 읽으면 둘 다 직관과 어긋난다. 전자는 소리가 멈춰 있는데 거짓,
후자는 소리가 아직 안 나는데 참이다.

## PlayOneShot에는 두 번째 인자가 있다

클리핑의 예제는 `PlayOneShot(clip)` 한 가지 형태만 쓴다. 선언에 인자가 둘이다.

> public void PlayOneShot(AudioClip clip, float volumeScale = 1.0F);

> Plays an AudioClip, and scales the AudioSource volume by volumeScale.

**`AudioSource`의 볼륨에 곱해지는 배율**이다. 같은 발소리를 세기만 달리해서
쓸 때 쓰는 칸이고, 경고가 둘 붙어 있다.

> The scale of the volume. Unity automatically clamps negative scales to zero.

> Note: Scales larger than one might cause clipping.

**음수는 0으로 깎이고, 1을 넘기면 클리핑이 날 수 있다.** 즉 이 인자는
"볼륨을 키우는 손잡이"가 아니라 **"줄이는 손잡이"**로 쓰는 것이 안전하다.

이 값이 **선형 배율**이라는 점도 짚어둘 만하다. 믹서 쪽에서 음량을 다룰 때
단위가 dB로 바뀌고, 선형값을 그 자리에 넣으면 어떻게 되는지는
[음소거를 풀면 dB가 선형값 자리에 들어간다](/posts/unity-audiomixer-volume/)에
적어뒀다. **`volumeScale`과 믹서의 값은 같은 단위가 아니다.**

## 독립 재생에도 천장이 있다

클리핑의 "여러 번 호출해도 각각 독립적으로 재생됩니다"에는 끝이 있다.
`isVirtual`의 둘째 문장이 그 끝을 적는다.

> A sound is culled when its resulting volume is lower than the volumes of the
> N loudest voices, where N is the number of maximum audible sounds specified
> in the audio Project Settings or via AudioConfiguration.

**볼륨이 가장 큰 N개 안에 못 들면 culling된다.** N은 프로젝트 설정 값이다.
즉 one-shot을 무한히 쌓을 수 있는 것이 아니라, **쌓다 보면 조용한 것부터
사라진다.** 실패하지 않고 조용히 빠지는 쪽이라 증상이 "어떤 발소리가 가끔 안
들린다"로 나타난다.

앞 절의 `volumeScale`이 여기서 한 번 더 의미를 갖는다. **배율을 낮춘 소리가
먼저 culling 대상이 된다.** 중요한 소리를 작게 틀어두면 묻힌다.

## 세 함수의 비용은 호출이 아니라 그 앞에 있다

앞 절의 천장에 숫자가 있다고 했는데, 그 숫자가 어디 있는지부터 보자. 오디오
프로젝트 설정에 칸이 둘이다.

> Set the number of real voices that can play at the same time. At every frame,
> the loudest voice is picked.

> Set the number of virtual voices that the audio system manages.

`Max Real Voices`와 `Max Virtual Voices`다. **"At every frame, the loudest
voice is picked"** — 매 프레임 가장 큰 것을 고른다는 것이, 앞 절의 culling이
실제로 일어나는 방식이다. 가상 쪽에는 지침과 경고가 붙어 있다.

> This value should always be larger than the number of voices played by the
> game.

> If not, Unity displays warnings in the console.

**게임이 재생하는 보이스 수보다 커야 하고, 아니면 콘솔에 경고가 뜬다.**
`PlayOneShot`을 많이 쓰는 프로젝트에서 이 경고가 먼저 알려준다. culling된
소스의 비용을 줄이는 설정도 하나 있다.

> Enable to dynamically turn off effects and spatializers on AudioSources that
> are culled in order to save CPU.

`Virtualize Effect`다. **culling된 소스에서 이펙트와 스페이셜라이저를 끈다.**

여기까지가 "동시에 몇 개"의 비용이고, **더 큰 비용은 클립을 적재하는
쪽**이다. 오디오 클립 임포트 설정의 한 칸이 이 글의 두 함수를 **이름으로**
지목한다.

> Enable this setting to preload the audio data when the audio clip asset
> loads.

> If you call AudioSource.Play or AudioSource.PlayOneShot while this setting is
> disabled, Unity loads the clip dynamically which can cause playback delays on
> larger files.

> To prevent this, explicitly call AudioClip.LoadAudioData before playback to
> load the data into memory and AudioClip.UnloadAudioData to unload it when
> it's no longer needed.

`Preload Audio Data`다. **꺼져 있으면 `Play`나 `PlayOneShot`을 부르는 그
순간에 클립을 적재하고, 큰 파일에서 재생이 지연된다.** 그리고 문서가 대책을
함수 이름까지 적어준다. 기본값에 대한 단서도 있다.

> Because this is a per-platform setting, the default value depends on your
> target platform's audio configuration.

**플랫폼별 설정이고 기본값이 플랫폼에 따라 다르다.** 에디터에서 멀쩡하던 것이
특정 빌드에서만 끊기는 경로가 여기다.

대책으로 지목된 함수 쪽에 조건이 더 있다.

> Loads the asset data of an AudioClip into memory, so it will immediately be
> ready to play.

> It's recommended that you use AudioClip.LoadAudioData in methods like Start()
> of MonoBehaviour.

> It loads the AudioClip synchronously, unless AudioClip.loadInBackground is
> set to true.

> If you call it on an audio clip that is already loaded, it does nothing and
> returns true.

> It doesn't reload clips that have AudioClip.preloadAudioData set to true.

**기본이 동기 적재**라는 점이 중요하다. 그래서 문서가 `Start()` 같은 자리를
권한다 — 전투 중에 부르면 그 프레임이 멈춘다. 이미 적재된 클립에는 아무 일도
하지 않으니 **중복 호출을 걱정할 필요는 없다.**

비동기로 돌리면 재생 요청이 어떻게 되는지도 적혀 있다.

> Enable this setting to load the audio clip in the background, which prevents
> stalls on the main thread.

> Unity defers play requests on AudioClips that are still loading in the
> background until the clip loads fully.

> You can use the AudioClip.loadState property to query the load state.

**재생 요청이 버려지지 않고 미뤄진다.** 즉 비동기 적재 중에 `Play`를 부르면
소리가 안 나는 것이 아니라 **늦게 난다.** 그 상태를 읽는 속성이
`AudioClip.loadState`이고, 반환형은 `AudioDataLoadState`다.

마지막으로 `PlayClipAtPoint`다. 앞서 본 문장을 비용의 관점에서 다시 읽으면
이렇다.

> This function creates an audio source but automatically disposes of it once
> the clip has finished playing.

**호출마다 오디오 소스를 만든다.** 편한 대신 호출 빈도만큼 생성과 파괴가
생긴다는 뜻이다. 매 프레임 터지는 탄피 소리를 이걸로 내면 그만큼이 쌓인다.
그런 자리에는 **소스를 미리 몇 개 두고 돌려쓰는 쪽**이 낫다.

| 함수 | 비용이 생기는 자리 | 문서가 준 대책 |
| --- | --- | --- |
| `Play` | `Preload Audio Data`가 꺼져 있으면 호출 시점에 적재 | `LoadAudioData`를 `Start()` 같은 자리에서 |
| `PlayOneShot` | 쌓이는 보이스 수 (매 프레임 가장 큰 것만 남는다) | `Max Real`/`Virtual Voices` · `Virtualize Effect` |
| `PlayClipAtPoint` | 호출마다 오디오 소스 생성·파괴 | 문서에 없다. 소스를 돌려쓰는 쪽 |

표의 마지막 칸은 **문서가 대책을 적어두지 않은 자리**다. 소스를 돌려쓰라는
것은 제 판단이고, `PlayClipAtPoint` 페이지에 그런 권고는 없다.

적재 쪽의 나머지 칸들 — `Load Type` · `Compression Format` · `Quality` — 은
런타임에 만든 클립에는 아예 없는 설정이라서 위에 링크한 TTS 글에 적어뒀다.
하나만 숫자로 짚어두면, `Streaming`에는 이런 단서가 붙어 있다.

> Streaming clips have an overhead of approximately 200KB, even without loaded
> audio data.

## 간격은 코루틴이 아니라 전용 함수로

클리핑의 두 예제는 `yield return new WaitForSeconds(...)`로 간격을 만든다.
동작은 하는데, 문서가 그 자리에 쓸 함수를 둘 준다. 먼저 `Play`의 인자
설명이다.

> Deprecated. Delay in number of samples, assuming a 44100Hz sample rate
> (meaning that Play(44100) will delay the playing by exactly 1 sec).

> The delay parameter is deprecated, please use the newer
> AudioSource.PlayDelayed function instead which specifies the delay in
> seconds.

**`Play(delay)`는 폐기됐다.** 대체는 이쪽이다.

> public void PlayDelayed(float delay);

> Plays the clip with a delay specified in seconds.

그리고 정확도가 필요한 경우가 따로 있다.

> Note: The AudioSource.PlayScheduled API will give you more accurate control
> over when the audio clip is played.

> Plays the clip at a specific time on the absolute time-line that
> AudioSettings.dspTime reads from.

> This is the preferred way to stitch AudioClips in music players because it is
> independent of the frame rate and gives the audio system enough time to
> prepare the playback of the sound to fetch it from media where the opening
> and buffering takes a lot of time (streams) without causing sudden CPU
> spikes.

**프레임 레이트와 무관하다**는 것이 핵심이다. `WaitForSeconds`는 프레임에
묶여 있어서 음악을 이어붙이는 데는 맞지 않는다. 인자 설명에 여유 시간까지
적혀 있다.

> Absolute start time in seconds on the AudioSettings.dspTime timeline.

> Schedule a time slightly in the future (~100-200ms) so the audio system can
> prepare playback.

과거 시각을 넘기면 어떻게 되는지도 적혀 있다.

> If `time` is less than the current AudioSettings.dspTime, playback starts as
> soon as possible (typically immediately), not at that past instant.

> Any audio that would have played while `time` was in the past is not
> reproduced.

**예외가 아니라 즉시 재생이고, 지나간 구간은 재생되지 않는다.**

## 어디에 왜 쓰나

### 동작하는 예제

문서의 묶음을 그대로 구조로 옮긴 형태다. **멈춰야 하는 소리와 겹쳐도 되는
소리를 서로 다른 `AudioSource`에 둔다.**

```csharp file="Scripts/Audio/SfxPlayer.cs"
using UnityEngine;

public class SfxPlayer : MonoBehaviour
{
    [Header("소스")]
    [Tooltip("멈추고 되감아야 하는 소리. clip에 올리고 Play로 튼다")]
    [SerializeField]
    private AudioSource _controlled;

    [Tooltip("겹쳐도 되는 짧은 효과음. PlayOneShot만 쓴다")]
    [SerializeField]
    private AudioSource _oneShots;

    [Header("볼륨 배율")]
    [Tooltip("1을 넘기면 클리핑이 날 수 있다고 문서가 적었다")]
    [Range(0f, 1f)]
    [SerializeField]
    private float _oneShotScale = 1f;

    // 겹쳐도 되는 소리. 멈출 수 없는 대신 서로를 끊지 않는다.
    public void PlayOverlapping(AudioClip clip)
    {
        if (_oneShots == null || clip == null)
        {
            return;
        }

        _oneShots.PlayOneShot(clip, _oneShotScale);
    }

    // 멈춰야 하는 소리. clip에 올려야 Stop이 그 소리를 가리킨다.
    public void PlayStoppable(AudioClip clip)
    {
        if (_controlled == null || clip == null)
        {
            return;
        }

        // 대입만으로 이전 클립이 멈춘다. 다만 새 클립이 자동으로 나지는
        // 않으므로 Play를 따로 부른다.
        _controlled.clip = clip;
        _controlled.Play();
    }

    public void StopStoppable()
    {
        if (_controlled == null)
        {
            return;
        }

        // 이 Stop이 멈추는 것은 '현재 설정된 클립'이다. 위의 one-shot들은
        // 대상이 아니다.
        _controlled.Stop();
    }

    // 프레임에 묶이지 않는 간격이 필요할 때. 문서가 100~200ms 여유를 권한다.
    public void PlayStoppableAfter(AudioClip clip, double leadSeconds)
    {
        if (_controlled == null || clip == null)
        {
            return;
        }

        _controlled.clip = clip;
        _controlled.PlayScheduled(AudioSettings.dspTime + leadSeconds);
    }

    // 소리를 낼 오브젝트가 곧 파괴되는 경우. 호출마다 소스를 하나 만든다.
    public static void PlayDetached(AudioClip clip, Vector3 position,
        float volume = 1f)
    {
        if (clip == null)
        {
            return;
        }

        AudioSource.PlayClipAtPoint(clip, position, volume);
    }

    // isPlaying은 one-shot에도 참이다. "효과음이 끝났나"의 답이 아니다.
    [ContextMenu("재생 상태 찍기")]
    private void LogState()
    {
        if (_controlled != null)
        {
            Debug.Log($"controlled.isPlaying = {_controlled.isPlaying}", this);
        }

        if (_oneShots != null)
        {
            Debug.Log($"oneShots.isPlaying = {_oneShots.isPlaying} "
                + $"(one-shot 포함), isVirtual = {_oneShots.isVirtual}", this);
        }
    }
}
```

`_controlled`·`_oneShots`·`clip`에 `?.`를 쓰지 않은 이유가 있다. 전부
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다.

**소스를 둘로 나눈 것이 이 코드의 전부다.** 하나로 합치면 `Stop()`을 부를 때
무엇이 멈추는지가 코드에서 안 보인다. 문서가 `Play`·`Pause`·`Stop`을 "a
single audio clip"의 삼종으로 묶어둔 것을 구조로 옮기면 그 모호함이 사라진다.

`_oneShotScale`을 `[Range(0f, 1f)]`로 가둔 것도 의도다. 문서가 1을 넘기면
클리핑이 날 수 있다고 적었으니 **인스펙터에서 넘길 수 없게** 두는 쪽이
낫다. 다만 `[Range]`가 막는 것은 인스펙터뿐이고 코드 대입은 막지 않는다 —
그 이야기는
[`[MenuItem]`은 Editor 폴더로 가야 하는데, MonoBehaviour는 거기 못 간다](/posts/unity-attributes/)에
적어뒀다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| 멈추거나 되감아야 하는 소리 | `clip` 대입 + `Play` (`Stop`이 그걸 가리킨다) |
| 겹쳐 쌓여도 되는 짧은 효과음 | `PlayOneShot` |
| 같은 효과음을 세기만 달리해서 | `PlayOneShot(clip, volumeScale)` |
| 소리를 낼 오브젝트가 곧 사라진다 | `PlayClipAtPoint` (소스를 만들고 스스로 치운다) |
| 초 단위 지연 | `PlayDelayed` (`Play(delay)`는 폐기) |
| 음악을 이어붙인다 | `PlayScheduled` + `AudioSettings.dspTime` |
| 프레임과 무관한 정확도 | `PlayScheduled` (100~200ms 여유) |
| 소리가 나는지만 알면 된다 | `isPlaying` (one-shot 포함) |
| 특정 효과음이 끝났는지 | `isPlaying`으로는 알 수 없다 |
| 소리가 묻히는 증상 | `isVirtual`과 프로젝트 설정의 최대 가청 수 |
| 음량을 믹서로 묶는다 | `volumeScale`이 아니라 `AudioMixer` (단위가 다르다) |
| 큰 클립의 첫 재생이 끊긴다 | `Preload Audio Data` 또는 `LoadAudioData` |
| 적재를 미리 해둔다 | `LoadAudioData`를 `Start()` 같은 자리에서 (동기다) |
| 메인 스레드를 막지 않는다 | `Load In Background` (재생 요청은 미뤄진다) |
| 적재 상태를 읽는다 | `AudioClip.loadState` |
| 보이스가 모자라다는 경고 | `Max Virtual Voices`를 재생 수보다 크게 |
| culling된 소스의 CPU | `Virtualize Effect` |
| `PlayClipAtPoint`를 자주 부른다 | 소스를 미리 두고 돌려쓰는 쪽 (문서에 대책 없음) |

판단 순서는 이렇게 두면 된다.

- **멈출 일이 있는가부터 묻는다.** 있으면 `clip` + `Play`다. `PlayOneShot`은
  멈추는 경로가 문서에 없다.
- **겹쳐도 되는가.** 발소리·타격음처럼 겹치는 것이 자연스러우면
  `PlayOneShot`이고, 그때는 **멈추기를 포기하는 대가**를 받아들이는 것이다.
- **소스를 나눈다.** 두 종류를 한 소스에 섞으면 `Stop()`의 대상이 코드에서
  안 보인다.
- **간격이 필요하면 전용 함수를 본다.** `WaitForSeconds`는 프레임에 묶이고,
  문서가 `PlayDelayed`와 `PlayScheduled`를 준다.
- **비용은 호출이 아니라 그 앞을 본다.** 끊김은 적재에서, 묻힘은 보이스
  수에서 온다. 둘 다 호출 쪽 코드를 고쳐서 해결되지 않는다.

### 쓰지 말아야 할 자리

- **`PlayOneShot`으로 튼 소리를 `Stop()`으로 멈추려는 것.** `Stop`의 문서가
  대상을 "the currently set Audio clip"이라고 적고, 참고 목록에
  `PlayOneShot`이 없다.
- **`isPlaying`으로 특정 효과음의 종료를 판정하는 것.** 문서가 "This includes
  if you use PlayOneShot()"이라고 적었다. 다른 one-shot이 울리는 동안 계속
  참이다.
- **`isPlaying`을 "소리가 들리는 중"으로 읽는 것.** `Pause` 중에는 거짓이고
  `PlayDelayed`의 대기 중에는 참이다.
- **`volumeScale`을 1보다 크게 주는 것.** 문서가 "Scales larger than one
  might cause clipping"이라고 적었다. 음수는 0으로 깎인다.
- **`volumeScale`과 믹서 값을 같은 단위로 보는 것.** 전자는 선형 배율이다.
- **one-shot을 제한 없이 쌓는 것.** 가장 큰 N개 밖으로 밀리면 culling된다.
  조용한 소리부터 사라진다.
- **`Play(delay)`를 쓰는 것.** 폐기됐고, 단위가 44100Hz 기준 샘플 수다.
  `PlayDelayed`가 초 단위다.
- **`PlayScheduled`에 과거 시각을 넘기는 것.** 예외가 아니라 즉시 재생이고,
  지나간 구간은 재생되지 않는다.
- **`clip`에 대입하고 소리가 날 것으로 기대하는 것.** 문서가 "the new clip
  doesn't automatically play"라고 적었다. 대입은 멈추고, `Play`가 시작한다.
- **큰 클립을 `Preload Audio Data` 없이 재생하는 것.** 문서가 `Play`와
  `PlayOneShot`을 이름으로 지목해 "can cause playback delays on larger
  files"라고 적었다. 기본값이 플랫폼마다 다르다.
- **`LoadAudioData`를 전투 중에 부르는 것.** `loadInBackground`가 아니면
  **동기 적재**다. 문서가 `Start()` 같은 자리를 권한다.
- **비동기 적재 중에 소리가 안 났다고 보는 것.** 문서가 "defers play
  requests"라고 적었다. 버려지는 게 아니라 늦게 난다.
- **`Max Virtual Voices` 경고를 무시하는 것.** 문서가 재생 수보다 커야 하고
  아니면 콘솔에 경고가 뜬다고 적었다.
- **`PlayClipAtPoint`를 매 프레임 수준으로 부르는 것.** 호출마다 오디오 소스를
  만든다. 이 자리의 대책은 문서에 없다.

## 정리

- 클리핑의 차이 서술은 **맞다.** `Play`는 끊고 다시 시작하고,
  `PlayOneShot`은 "does not cancel clips that are already being played"다.
- 그 차이의 결과가 빠져 있었다. 문서는 **`Play`·`Pause`·`Stop`을 "a single
  audio clip"의 삼종으로 묶고**, `PlayOneShot`을 "multiple sounds"로 그 바깥에
  둔다. 셋째 선택지 **`PlayClipAtPoint`**도 같은 줄에 있다.
- **`clip`에 대입하는 것만으로 이전 클립이 멈춘다.** 다만 "the new clip
  doesn't automatically play"다. 멈추는 쪽과 시작하는 쪽이 다른 동작이다.
- `Play`의 "다시 시작한 것처럼 들린다"에는 **조건**이 붙어 있다 — "If
  AudioSource.clip is set to the same clip that is playing".
- **`Stop`이 멈추는 것은 "the currently set Audio clip"**이고, 참고 목록에
  `PlayOneShot`이 없으며, `isVirtual`은 "main sound"와 "one-shots"를 따로
  센다. 세 문장을 이어붙이면 "`Stop`은 one-shot을 멈추지 않는다"가 되지만
  **그렇게 적힌 한 문장은 못 찾았다.**
- **그런데 `isPlaying`은 one-shot에도 참이다** — "This includes if you use
  PlayOneShot()". 소리가 나는지는 알 수 있고 무엇을 멈출지는 고를 수 없다.
  `Pause` 중에는 거짓, `PlayDelayed` 대기 중에는 참이다.
- **`PlayOneShot`의 두 번째 인자는 볼륨 배율**이고, 음수는 0으로 깎이며 1을
  넘기면 클리핑이 날 수 있다. 줄이는 손잡이로 쓰는 것이 안전하다.
- **독립 재생에는 천장이 있다.** 가장 큰 N개 밖의 소리는 culling되고, N은
  프로젝트 설정 값이다. 작게 틀어둔 중요한 소리가 먼저 묻힌다.
- 간격은 `WaitForSeconds`가 아니라 **`PlayDelayed`(초 단위)와
  `PlayScheduled`(`dspTime`, 프레임 레이트 무관, 100~200ms 여유)**다.
  `Play(delay)`는 폐기됐다.
- **세 함수의 비용은 호출이 아니라 그 앞에 있다.** `Preload Audio Data`가
  꺼져 있으면 문서가 **`Play`와 `PlayOneShot`을 이름으로 지목해** "playback
  delays on larger files"를 경고하고, 대책으로 `LoadAudioData` ·
  `UnloadAudioData`를 준다. 그 함수는 **기본이 동기 적재**라서 `Start()` 같은
  자리를 권한다.
- `Load In Background`를 켜면 **재생 요청이 미뤄진다** — 버려지지 않는다.
  상태는 `AudioClip.loadState`로 읽는다.
- 보이스 쪽은 **`Max Real Voices`가 "At every frame, the loudest voice is
  picked"**이고, `Max Virtual Voices`가 재생 수보다 작으면 **콘솔 경고**가
  뜬다. `Virtualize Effect`는 culling된 소스의 이펙트를 끈다.
- **`PlayClipAtPoint`는 호출마다 오디오 소스를 만든다.** 편한 대신 빈도만큼
  생성·파괴가 쌓인다. 이 자리의 대책은 문서에 없어서 소스를 돌려쓰는 쪽을
  권하는 것은 제 판단이다.

---

### 참고

- [AudioSource — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.html)
- [AudioSource.Play — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Play.html)
- [AudioSource.PlayOneShot — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayOneShot.html)
- [AudioSource.PlayClipAtPoint — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayClipAtPoint.html)
- [AudioSource.PlayDelayed — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayDelayed.html)
- [AudioSource.PlayScheduled — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayScheduled.html)
- [AudioSource.Stop — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Stop.html)
- [AudioSource.clip — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-clip.html)
- [AudioSource.isPlaying — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-isPlaying.html)
- [AudioSource.isVirtual — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-isVirtual.html)
- [AudioClip.LoadAudioData — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioClip.LoadAudioData.html)
- [AudioClip.loadState — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioClip-loadState.html)
- [Audio Clip Import Settings reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Audio settings reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioManager.html)

이 글의 출발점이 된 자료는
[유니티(Unity) 오디오 소스(AudioSource) 플레이 함수 Play()와 PlayOneShot() 차이](https://learnandcreate.tistory.com/2641)
(디지털콘텐츠크리에이터, 2024-10-15)이다. 두 함수의 차이 서술은 원문을 그대로
따라가면서, 각 항목을 현행 Unity 6.6 스크립팅 레퍼런스에 대조했다. 원문에 없는
`Stop`·`isPlaying`·`isVirtual`·예약 재생 쪽은 같은 레퍼런스에서 가져왔다.
확인 시점은 2026-10-13이다.
