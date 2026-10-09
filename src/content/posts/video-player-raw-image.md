---
pubDatetime: 2026-10-09T21:00:00+09:00
title: "화질을 쥐고 있는 건 Color Format이 아니라 해상도와 Aspect Ratio다"
lang: ko
translationKey: video-player-raw-image
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - 비디오
  - 렌더링
description: "컷신을 동영상으로 돌리려고 UI에 동영상을 띄우는 글을 스크랩했다. 절차는 맞는데 화질이 나쁜 원인을 Color Format으로 지목하고, 끝났다는 사실을 아는 방법은 한 번도 안 나온다. 문서가 손잡이로 적어둔 것은 해상도와 Aspect Ratio이고, 렌더 텍스처를 아예 거치지 않는 모드가 따로 있다."
---

컷신을 라이브로 연출하는 대신 **동영상을 재생하는 방식**으로 기획했다. 동작
방법을 찾던 중에 UI에 동영상을 띄우는 글을 스크랩해뒀다. 절차가 짧고
분명하다 — `RawImage`를 하나 만들고, `Video Player`를 만들고,
`Render Texture`를 만들어서 둘을 같은 렌더 텍스처에 꽂는다. 비디오 플레이어가
렌더 텍스처에 그리고, `RawImage`가 그 렌더 텍스처를 그린다. 2022년 글이고
지금도 그대로 된다.

마지막에 설정 설명이 붙어 있는데, 그중 한 문장이 원인을 지목한다.

> 기본적으로 설정되어있는 colorFormat이 화질이 굉장히 안좋다.

그 앞에 이런 문장도 있다.

> 사이즈가 변하면서 발생한 문제일 수도 있는데 대부분은 Color Format이 문제이다.

**확률을 거꾸로 적어놨다.** 매뉴얼에서 `Render Texture`의 Color Format 기본값이
무엇인지도, 그게 화질에 나쁘다는 서술도 찾지 못했다. 반면 "크기가 변하면서
생기는 문제"에는 **전용 설정이 여섯 개 값으로 적혀 있다.** `Aspect Ratio`다.

그리고 한 겹 더 들어가면, **렌더 텍스처를 아예 거치지 않는 모드가 따로
있다.** 그 길로 가면 크기도 포맷도 Aspect Ratio도 물을 일이 없다.

컷신으로 쓸 생각으로 읽으면 빈 데가 하나 더 있다. **끝났다는 사실을 아는
방법이 한 번도 안 나온다.** 컷신은 재생되는 것이 목적이 아니라 끝나고
조작권을 돌려주는 것이 목적이다. 그 이벤트가 문서에 있다.

확인한 것은 일곱 가지다. **`Render Mode`에 `API Only`가 있고
`VideoPlayer.texture`를 그대로 쓸 수 있다**, **화질과 비율의 손잡이는
`Aspect Ratio`와 소스 해상도다**, **포맷 지원 여부는 알아보는 게 아니라
런타임에 물어보는 것이다**, **첫 프레임 문제에는 `Wait For First Frame`과
`Prepare()`가 있다**, **끝과 실패에는 `loopPointReached`와 `errorReceived`가
있다**, **오디오 출력 모드가 한 번도 언급되지 않는다**, 그리고
**URL 소스는 에셋 관리를 우회한다.**

이 블로그에 사운드 글이 둘 있다.
[음소거를 풀면 dB가 선형값 자리에 들어간다](/posts/unity-audiomixer-volume/)와
[스냅샷을 권하고, 코드가 스냅샷에서 빼낸다](/posts/audiomixer-groups-snapshots/)다.
이 글의 오디오 절이 그 둘과 맞물린다 — 동영상 소리는 **설정 하나로 유니티의
오디오 처리를 아예 우회할 수 있다.** 다만 다른 글로 넘기지는 않는다. 필요한
설명과 예제 코드는 여기서 다시 전부 싣는다.

확인 시점은 **2026-10-09**이고, 기준은 Unity **6.6**이다.

## 목차

## 렌더 텍스처를 거치는 이유는 코드를 안 쓰는 것이다

원문은 렌더 텍스처가 필요한 이유를 이렇게 설명한다.

> 비디오플레이어가 스스로 UI에 표현될 수가 없으니, 동영상을 렌더텍스쳐에
> 투영시킨 뒤 이 렌더텍스쳐를 UI에 그려주는 것이다.

구조에 대한 설명으로는 맞다. 다만 **"스스로 표현될 수 없다"가 선택지가
하나라는 뜻은 아니다.** `Render Mode`의 설명과 값이 다섯 개다.

> Choose how the video will render.

| 값 | 문서 설명 |
| --- | --- |
| Camera Far Plane | "Render the video on the Camera's far plane." |
| Camera Near Plane | "Render the video on the Camera's near plane." |
| Render Texture | "Render the video into a Render Texture" |
| Material Override | "Render the video into a selected Texture property of a GameObject" |
| API Only | "Render the video into the VideoPlayer.texture Scripting API property." |

마지막 값이 이 글의 출발점이다. `API Only`는 렌더 텍스처 에셋을 만들지 않고
**플레이어가 가진 텍스처를 그대로 내놓는다.** 그 텍스처의 설명이 이렇다.

> Internal texture in which video content is placed. (Read Only)

`RawImage`가 받는 것은 `Texture`다. 그러니 그 둘을 잇는 데 필요한 것은 한
줄이다 — `rawImage.texture = player.texture`. 렌더 텍스처 에셋도, 크기
설정도, Color Format도 없다. 텍스처를 `RawImage`에 꽂는 이 수법은
[IsConnected가 Connecting을 보고 있다](/posts/unity-webrtc-video-streaming/)에도
나온다. 그쪽은 소스가 파일이 아니라 네트워크다.

그럼 왜 원문은 렌더 텍스처를 쓰는가. **코드를 한 줄도 쓰지 않기
때문이다.** `Render Texture` 모드는 인스펙터에서 `Target Texture`에 에셋을
꽂으면 끝난다.

> Define the Render Texture where the Video Player component renders its
> images.

그리고 `RawImage`의 Texture 칸에 같은 에셋을 꽂는다. 스크립트가 없다.
입문 자료가 이 길을 고르는 이유가 분명하다.

대가도 분명하다. **중간에 고정 크기·고정 포맷의 버퍼가 하나 끼어든다.**
소스 동영상이 1920×1080이고 렌더 텍스처가 기본 256×256이면, 그 사이에서
리샘플링이 일어난다. 다음 절이 그 이야기다.

| | `Render Texture` 모드 | `API Only` 모드 |
| --- | --- | --- |
| 코드 | 없음 | 한 줄 |
| 중간 버퍼 | 렌더 텍스처 에셋 | 없음 |
| 크기를 정하는 쪽 | 내가 에셋에 적는다 | 소스 해상도 |
| Color Format | 내가 고른다 | 묻지 않는다 |
| Aspect Ratio | 적용된다 | 물을 일이 없다 |

## 화질 손잡이는 Aspect Ratio와 해상도다

원문이 Color Format을 지목한 그 증상 — 화질이 떨어지고 비율이 어긋나는 것 —
에 대해 문서가 적어둔 설정이 `Aspect Ratio`다.

> Set the aspect ratio of the images that fill the Camera Near Plane, Camera
> Far Plane, or Render Texture

**렌더 텍스처가 적용 대상에 적혀 있다.** 값이 여섯 개고, 넷은 비율을
지키고 하나는 안 지킨다.

| 값 | 문서 설명 | 비율 |
| --- | --- | --- |
| No Scaling | "Use no scaling. The video is centered on the destination rectangle." | — |
| Fit Vertically | "This option crops the left and right sides or leaves black areas on each side if necessary." | "The source aspect ratio is preserved." |
| Fit Horizontally | "This option crops the top and bottom regions or leaves black areas above and below if needed." | "The source aspect ratio is preserved." |
| Fit Inside | "Leaves black areas on the left and right or above and below as needed." | "The source aspect ratio is preserved." |
| Fit Outside | "Scale the source to fit the destination rectangle without leaving black areas on the left and right" | "The source aspect ratio is preserved." |
| Stretch | "Scale both horizontally or vertically to fit the destination rectangle." | **"The source aspect ratio isn't preserved."** |

16:9 동영상을 256×256 정사각형 렌더 텍스처에 넣으면 이 설정이 결과를
결정한다. `Stretch`면 찌그러지고, `Fit Inside`면 위아래에 검은 띠가 생기고,
`Fit Outside`면 좌우가 잘린다. **"화질이 안 좋다"로 느껴지는 것 중 상당
부분이 여기서 온다.**

크기 쪽은 더 단순하다. 소스의 해상도를 코드로 읽을 수 있다.

> The width of the images in the VideoClip, or URL, in pixels. (Read Only)

> The height of the images in the VideoClip, or URL, in pixels. (Read Only)

`VideoPlayer.width`와 `height`다. **준비가 끝난 뒤에 이 값으로 렌더 텍스처를
만들면 리샘플링이 사라진다.** 인스펙터에 숫자를 손으로 적을 이유가 없다.

그럼 Color Format은. 레퍼런스 페이지가 적는 것은 이것뿐이다.

> Set the GraphicsFormat of the color buffer of the Render Texture.

**기본값이 무엇인지, 그 기본값의 화질이 어떤지는 적혀 있지 않다.** sRGB나
Read/Write에 대한 언급도 그 페이지에 없다. 그래서 원문의 "기본 colorFormat이
화질이 굉장히 안 좋다"는 **틀렸다고 말할 근거도, 맞다고 말할 근거도 문서에서
찾지 못했다.** 제가 할 수 있는 말은 이것이다 — **문서가 손잡이로 적어둔
것은 해상도와 `Aspect Ratio`이고, Color Format은 그 목록에 없다.** 순서를
그렇게 두는 쪽이 맞다.

## 포맷 지원 여부는 알아보는 게 아니라 물어보는 것이다

원문의 마지막 조언은 이렇다.

> 모바일에서 지원되는 포멧을 잘 알아보고 사용해야할 것이고 자신 없다면
> 화질을 좀 포기하더라고 그냥 기본상태를 사용하자.

플랫폼마다 지원 포맷이 다르다는 지적은 맞다. 다만 **"알아보고 쓴다"가 아니라
런타임에 물어보면 된다.** 그 API가 있다.

> public static bool IsFormatSupported([GraphicsFormat] format,
> [GraphicsFormatUsage] usage);

> Verifies that the specified graphics format is supported for the specified
> usage.

> bool Returns true if the format is supported for the specific usage. Returns
> false otherwise.

`SystemInfo.IsFormatSupported`다. 포맷과 **용도**를 같이 넘긴다. 용도를 받는
이유가 설명에 있다.

> If a specific usage is not supported by a format, the operation will fail.

같은 포맷이 샘플링은 되고 렌더 타깃으로는 안 될 수 있다는 뜻이다. 그래서
"이 포맷이 지원되나"가 아니라 "이 포맷이 **이 용도로** 지원되나"를 물어야
한다.

그리고 `API Only`로 가면 이 질문 자체가 없어진다. 내가 만드는 버퍼가 없으니
내가 고를 포맷도 없다.

## 첫 프레임 문제에는 전용 설정이 있다

원문은 `Play On Awake`를 이렇게 설명하고 대안을 제시한다.

> Play the video when the Scene launches.

이게 문서의 설명이고, 원문의 설명도 같은 내용이다. 그리고 체크를 풀고
스크립트로 재생하는 쪽을 권한다.

> 이 경우 스크립트를 통해서 클릭했을 때만 동영상이 재생되게 하는 등의 설정을
> 할 때 체크를 풀곤 한다.

쓰임새가 맞다. 다만 그 길에 함정이 하나 있고, 문서에 전용 설정이 있다.

> Wait for the first frame of the source video to be ready for display before
> playback starts.

`Wait For First Frame`이다. 이 설정이 없으면 재생을 시작한 시점에 첫 프레임이
아직 준비되지 않아, 렌더 텍스처에 **이전 내용이나 빈 화면**이 보일 수 있다.
그리고 준비 자체를 미리 시킬 수도 있다.

> Prepares the playback engine so that it's ready for playback.

> Returns whether the VideoPlayer has successfully prepared the content to be
> played.

> The VideoPlayer invokes this event when the video is ready for playback.

`Prepare()` · `isPrepared` · `prepareCompleted` 셋이다. 클릭하는 순간 바로
재생되기를 바란다면 **클릭을 기다리는 동안 `Prepare()`를 미리 불러두는 것**이
문서가 준 수단이다.

`API Only`로 가는 경우에는 이게 선택이 아니라 필수에 가깝다. 준비가 끝나기
전의 `VideoPlayer.texture`를 꽂아두면 받을 내용이 없다. **`prepareCompleted`
에서 꽂는 것이 안전한 순서다.**

그리고 `API Only`를 고를 거라면 반드시 알아야 할 줄이 `Stop()`에 있다.

> Stops the playback and sets the current time to 0.

> This also destroys all internal resources such as textures or buffered
> content.

**`Stop()`은 텍스처를 파괴한다.** `RawImage.texture`에 꽂아둔 그 텍스처다.
그래서 `Stop()` 뒤에 다시 재생하려면 `Prepare()`를 거쳐 **텍스처를 다시
꽂아야 한다.** 멈췄다 다시 틀기를 반복하는 UI라면 이 한 줄이 "두 번째부터
화면이 안 나온다"의 원인이 된다. 처음부터 다시 틀 때 `Stop()` → `Prepare()`
→ `prepareCompleted`에서 재할당 → `Play()` 순서로 두면 매번 같은 길을 탄다.

참고로 `Play On Awake`의 기본값은 켜짐이다. 스크립팅 레퍼런스의 예제 주석이
그렇게 적어두고 있다.

## 컷신에서 중요한 절반은 끝과 실패다

원문이 끝에 붙여둔 설정 설명은 전부 **재생을 시작하는 쪽**이다. 컷신은 끝이
더 중요하다. 영상이 끝나는 순간
조작권을 돌려주거나 다음 장면을 띄워야 하고, 그 신호를 받지 못하면 플레이어는
멈춘 화면을 보고 있게 된다.

스크립팅 레퍼런스의 이벤트 표에 여섯 개가 있다.

| 이벤트 | 문서 설명 |
| --- | --- |
| prepareCompleted | "The VideoPlayer invokes this event when the video is ready for playback." |
| started | "The VideoPlayer emits this event when the video starts to play." |
| frameReady | "The VideoPlayer invokes this event when a new frame is ready to be displayed." |
| loopPointReached | "The VideoPlayer emits this event when the video reaches the end of its playback." |
| seekCompleted | "Invoke after a seek operation completes." |
| errorReceived | "The VideoPlayer uses this callback to report various types of errors." |

컷신이 쓰는 것은 넷째와 여섯째다.

### 끝

`loopPointReached`의 설명이 네 문장이다. 앞의 셋을 먼저 본다.

> The VideoPlayer emits this event when the video reaches the end of its
> playback.

> If you set the VideoPlayer.isLooping property to true, this event makes the
> video play again.

> Otherwise the VideoPlayer stops.

**같은 이벤트가 `isLooping`에 따라 뜻이 달라진다.** 켜져 있으면 "되감는다"는
신호고, 꺼져 있으면 "끝났다"는 신호다. 컷신이라면 `Loop`를 꺼야 이 이벤트가
끝을 뜻한다. 네 번째 문장이 그 칸을 가리킨다.

> You can also set the Loop property in the Inspector window of the VideoPlayer
> component.

그 칸의 설명이 같은 말을 한다.

> Clear it to stop playing the video when it reaches the end.

핸들러 모양은 예제에 적힌 그대로다.

> void OnLoopPointReached(VideoPlayer vp)

넘어오는 인자의 설명은 "The instance of the VideoPlayer that invokes the
event."다. **어느 플레이어가 끝났는지가 들어온다.** 컷신 여러 개를 한
핸들러로 받는 구조라면 이 인자로 구분한다.

그런데 "Otherwise the VideoPlayer stops."를 앞 절의 `Stop()` 문서와 나란히
놓으면 걸리는 데가 있다. `Stop()`은 "This also destroys all internal resources
such as textures or buffered content."였다. **끝에 도달해서 멈추는 것이
`Stop()`을 부르는 것과 같은 일인지는 문서가 말하지 않는다.** 두 문장을
이어붙이면 "마지막 프레임이 화면에 남지 않을 수 있다"가 되는데, 그건 **제
추론이고 확인하지 않았다.** 확인한 것은 하나다 — 끝났다는 사실은
`loopPointReached`로 오고, **끝난 뒤 화면을 어떻게 둘지는 그 이벤트에서 직접
정하는 쪽이 추론에 기대지 않는다.** 페이드아웃이든 다음 장면 로드든 거기서
시작한다.

### 실패

끝을 아는 것만으로는 부족하다. **끝나지 않는 경우**가 있다. `errorReceived`가
무엇을 보고하는지 문서가 다섯 가지로 적어둔다.

> The types of errors the VideoPlayer reports include:

- "HTTP connection problems."
- "Issues finding the file."
- "Unsupported file types."
- "Permission issues."
- "Runtime issues."

둘째가 뒤에 나올 URL 소스 이야기와 바로 맞물린다. "bypasses asset
management"인 경로를 골랐으면 파일을 못 찾는 경우가 실제로 생긴다. 이벤트
설명은 이렇다.

> The VideoPlayer uses this callback to report various types of errors.

문서가 권하는 쓰임새도 적혀 있다.

> This is useful if you want to log errors and debug so that it's easier to
> diagnose issues.

핸들러는 인자가 둘이다.

> void OnErrorReceived(VideoPlayer vp, string message)

둘째 인자의 설명이 "The error message (string) the VideoPlayer reports."다.
구독하는 줄도 페이지에 그대로 있다.

> videoPlayer.errorReceived += OnErrorReceived;

여기서 **문서가 말하지 않는 것**이 하나 있다. 오류가 난 뒤에 재생이
계속되는지, `loopPointReached`가 그래도 오는지는 그 페이지에 없다. 확인하지
않았다. 그래서 **컷신의 끝을 `loopPointReached` 하나에만 걸어두면 안 된다.**
오류로 멈추고 그 이벤트가 오지 않으면, 다음으로 넘어가는 코드가 영원히
실행되지 않는다. **출구를 둘 두고 둘을 같은 자리로 모으는 쪽**이 안전하다.

### 재생이 시계보다 밀릴 때

끝과 실패 말고 하나 더 있다. 재생 위치가 게임 시계와 어긋나는 경우다. 전용
설정이 있다.

> When you enable this option, and the Video Player component detects drift
> between the playback position and the game clock,

> the Video Player skips ahead.

> When you disable this option, the Video Player doesn't correct for drift and
> systematically plays all frames.

`Skip On Drop`이다. 켜면 **프레임을 버려서 시계를 맞추고**, 끄면 **프레임을 다
틀어서 시계를 포기한다.** 녹음된 대사나 다음 장면의 타이밍이 얹혀 있는
컷신이면 앞쪽이고, 프레임 하나하나를 다 보여줘야 하는 영상이면 뒤쪽이다.

다만 스크립트로 이 값을 대입하기 전에 봐야 하는 칸이 따로 있다.

> Whether frame-skipping to maintain synchronization can be controlled. (Read
> Only)

`canSetSkipOnDrop`이다. **바꿀 수 있는지 자체가 상황에 따라 다르다는 뜻으로
읽힌다** — 무엇에 따라 다른지는 문서가 적어두지 않았고, 확인하지 않았다.
그래서 코드에서는 이 칸을 먼저 본다. 같은 모양의 칸이 재생 속도 쪽에도 있다.

> Whether you can change the playback speed. (Read Only)

`canSetPlaybackSpeed`다. 컷신을 빨리 돌리는 치트나 디버그 기능을 붙일 거라면
이쪽도 같은 순서로 묻는다.

## 오디오는 한 번도 언급되지 않는다

원문은 `Play On Awake` · `Loop` · `Source` 셋을 설명하고 넘어간다. 소리가
있는 동영상이면 그다음에 반드시 만나는 칸이 빠져 있다.

> Define how the source's audio tracks are output.

`Audio Output Mode`고, 컴포넌트 레퍼런스에 값이 셋 적혀 있다.

| 값 | 문서 설명 |
| --- | --- |
| None | "Audio isn't played." |
| Audio Source | "Audio samples are sent to selected audio sources, enabling Unity's audio processing to be applied." |
| Direct | "Audio samples are sent directly to the audio output hardware, bypassing Unity's audio processing." |

**`Direct`는 유니티의 오디오 처리를 우회한다.** 이 한 줄의 결과가 크다.
`AudioMixer`로 BGM과 효과음 볼륨을 묶어둔 프로젝트에서, `Direct`로 나가는
동영상 소리는 **그 믹서를 통과하지 않는다.** 설정 화면의 볼륨 슬라이더가
동영상 소리에만 듣지 않는 증상이 거기서 나온다.

스크립팅 레퍼런스의 `VideoAudioOutputMode`에는 **넷**이 있다. 위 셋에
`APIOnly`가 더 있고 설명이 "Send the embedded audio to the associated
AudioSampleProvider."다. 인스펙터에 없는 값이니 코드로만 쓰는 경로다.

`Audio Source`를 고르면 "enabling Unity's audio processing to be applied"
라고 적힌 대로 믹서 경로를 탄다. 컷신에 자막·음량 조절을 걸 거라면 이쪽이다.
`AudioMixer`에서 볼륨을 다루는 단위와 그 함정은
[음소거를 풀면 dB가 선형값 자리에 들어간다](/posts/unity-audiomixer-volume/)에
적어뒀다.

## URL 소스는 에셋 관리를 우회한다

원문의 `Source` 설명은 이렇다.

> 만약 URL을 선택하면 동영상이 위치한 주소를 적어줘서 해당 위치를 탐색해서
> 동영상을 가져온다.

맞다. 문서도 두 갈래라고 적는다.

> The Video Player can play video sources from video clips or URLs.

> Reference your file as a URL to play files that aren't bundled with your
> application.

그런데 그 선택에 붙는 경고가 원문에 없다.

> As the URL option bypasses asset management, you must manually ensure that
> Unity is able to locate the source video.

**에셋 관리를 우회하므로 파일을 찾을 수 있게 만드는 것은 내 책임이다.**
빌드에 동영상을 같이 넣고 URL로 읽겠다면 자리가 정해져 있다.

> You can set the URL to use files placed in Unity's StreamingAssets folder

`StreamingAssets`고, 경로는 `Application.streamingAssetsPath`로 얻는다.
플랫폼별 제약도 적혀 있다.

> On native build platforms, you can set the URL to any file path

> the URL must point to a web URL because playback from the local file system

두 번째가 **WebGL**이다. 로컬 파일 시스템 재생이 안 되므로 웹 URL이어야
한다. 에디터에서 `file://`로 잘 돌던 것이 WebGL 빌드에서만 안 되는 경로가
이것이다.

클립 쪽에도 한 줄 있다. 동영상 파일은 크기 때문에 "addressable assets"나
AssetBundle로 돌릴 수 있다고 적혀 있다. 컷신 여러 개를 빌드에 통째로 넣으면
패키지가 그만큼 커진다.

## 어디에 왜 쓰나

### 동작하는 예제

`API Only`로 `RawImage`에 꽂는 형태다. 원문의 구조와 비교하면 렌더 텍스처
에셋이 사라지고 스크립트 하나가 생긴다.

```csharp file="Scripts/UI/VideoScreen.cs"
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityEngine.Video;

[RequireComponent(typeof(VideoPlayer))]
public class VideoScreen : MonoBehaviour
{
    [Header("참조")]
    [Tooltip("동영상을 그릴 RawImage")]
    [SerializeField]
    private RawImage _screen;

    [Tooltip("Audio Output Mode가 Audio Source일 때만 쓰인다")]
    [SerializeField]
    private AudioSource _audioSource;

    [Header("재생")]
    [Tooltip("켜면 준비가 끝나는 즉시 재생한다")]
    [SerializeField]
    private bool _playWhenReady = true;

    [Header("컷신이 끝났을 때")]
    [Tooltip("끝까지 재생되거나 오류로 멈추면 한 번 호출된다")]
    [SerializeField]
    private UnityEvent _onFinished;

    private VideoPlayer _player;
    private bool _finished;

    private void Awake()
    {
        if (!TryGetComponent(out _player))
        {
            Debug.LogError("VideoPlayer가 없다.", this);
            return;
        }

        // 렌더 텍스처 에셋을 쓰지 않는다. 플레이어의 texture를 직접 받는다.
        _player.renderMode = VideoRenderMode.APIOnly;

        // 재생 시작 전에 첫 프레임을 기다린다. 빈 화면이 스치는 것을 막는다.
        _player.waitForFirstFrame = true;

        // 컷신은 한 번만 돈다. isLooping이 켜져 있으면 loopPointReached가
        // "끝났다"가 아니라 "다시 돈다"는 신호가 된다.
        _player.isLooping = false;

        // 게임 시계와 어긋나면 프레임을 버려서 맞춘다. 다만 이 값을 바꿀 수
        // 있는지부터 묻는다 — canSetSkipOnDrop이 읽기 전용으로 따로 있다.
        if (_player.canSetSkipOnDrop)
        {
            _player.skipOnDrop = true;
        }

        // 직접 출력은 AudioMixer를 통과하지 않는다. 믹서를 쓸 거라면
        // AudioSource 모드로 둔다.
        if (_audioSource != null)
        {
            _player.audioOutputMode = VideoAudioOutputMode.AudioSource;
            _player.SetTargetAudioSource(0, _audioSource);
        }

        _player.playOnAwake = false;
        _player.prepareCompleted += HandlePrepareCompleted;
        _player.loopPointReached += HandleLoopPointReached;
        _player.errorReceived += HandleErrorReceived;
    }

    private void OnDestroy()
    {
        if (_player != null)
        {
            _player.prepareCompleted -= HandlePrepareCompleted;
            _player.loopPointReached -= HandleLoopPointReached;
            _player.errorReceived -= HandleErrorReceived;
        }
    }

    private void OnEnable()
    {
        // 클릭을 기다리는 동안 미리 준비해둔다.
        if (_player != null && !_player.isPrepared)
        {
            _player.Prepare();
        }
    }

    // texture는 준비가 끝난 뒤에 꽂는다. 그 전에는 받을 내용이 없다.
    private void HandlePrepareCompleted(VideoPlayer source)
    {
        if (_screen != null)
        {
            _screen.texture = source.texture;
        }

        Debug.Log($"소스 해상도 {source.width}x{source.height}, " +
                  $"{source.length:F1}초, {source.frameCount}프레임", this);

        if (_playWhenReady)
        {
            source.Play();
        }
    }

    // 끝까지 재생된 경우의 출구다.
    private void HandleLoopPointReached(VideoPlayer source)
    {
        Finish("재생 완료");
    }

    // 실패한 경우의 출구다. 이 길이 없으면 컷신에서 게임이 멈춘다.
    private void HandleErrorReceived(VideoPlayer source, string message)
    {
        Debug.LogError($"VideoPlayer 오류: {message}", this);
        Finish("오류");
    }

    // 두 출구가 같은 자리로 모인다. 한 번만 넘긴다.
    private void Finish(string reason)
    {
        if (_finished)
        {
            return;
        }

        _finished = true;
        Debug.Log($"컷신 종료({reason})", this);
        _onFinished?.Invoke();
    }

    // 버튼에서 부른다. Stop()이 텍스처를 파괴하므로 다시 준비해서
    // prepareCompleted에서 RawImage에 다시 꽂는 길을 탄다.
    public void PlayFromStart()
    {
        if (_player == null)
        {
            return;
        }

        _finished = false;
        _player.Stop();
        _player.Prepare();
    }
}
```

`_screen`·`_audioSource`·`_player`에 `?.`를 쓰지 않은 이유가 있다. 전부
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다. 그래서 `_onFinished`에만 `?.`를 썼다 —
`UnityEvent`는 `UnityEngine.Object`가 아니다.

`Debug.Log`로 소스 해상도를 찍는 줄을 일부러 남겼다. **렌더 텍스처를 쓸
거라면 그 숫자가 곧 만들어야 할 크기다.** 256×256을 그대로 두는 것과 이
숫자를 보고 맞추는 것의 차이가 앞 절에서 본 리샘플링이다.

`_onFinished`를 `UnityEvent`로 둔 이유도 분명하다. **끝난 뒤에 무엇을 할지는
컷신마다 다르다** — 다음 씬을 로드하든, 입력을 다시 켜든, 페이드를 걸든
인스펙터에서 붙인다. 중요한 건 그 자리가 **하나**라는 것이다. 끝과 실패가 서로
다른 곳으로 가면 실패한 컷신에서만 다음 단계가 빠진다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| UI에 동영상 하나, 코드 없이 | `Render Texture` 모드 + `RawImage` |
| UI에 동영상, 화질을 잃지 않고 | `API Only` + `RawImage.texture` |
| 컷신 위에 스킵 버튼·자막을 올린다 | Canvas 안의 `RawImage` (`API Only`) |
| 컷신만 띄우고 UI를 겹치지 않는다 | `Camera Near Plane` + `Alpha` |
| 컷신을 배경으로 깔고 그 앞에서 논다 | `Camera Far Plane` |
| 컷신이 끝나면 다음으로 넘긴다 | `loopPointReached` + `errorReceived` 둘 다 |
| 컷신은 한 번만 돈다 | `Loop` 끄기 (켜져 있으면 끝 신호가 되감기 신호다) |
| 재생이 게임 시계보다 밀린다 | `Skip On Drop` (`canSetSkipOnDrop` 먼저 확인) |
| 3D 오브젝트 표면에 재생 | `Material Override` |
| 소리를 믹서로 묶는다 | `Audio Output Mode` = `Audio Source` |
| 소리를 그냥 내보낸다 | `Direct` (믹서를 통과하지 않는다) |
| 빌드에 동영상을 넣는다 | `Video Clip` 또는 `StreamingAssets` + URL |
| 빌드 밖의 동영상 | URL (파일을 찾는 책임은 내 쪽) |
| WebGL | 웹 URL만 (로컬 파일 시스템 재생 불가) |

컷신을 어느 길로 띄울지는 **그 위에 무엇을 올릴 것인가**로 갈린다. 카메라
평면 쪽 설명은 전부 씬 오브젝트를 기준으로 적혀 있다 — 앞이냐("the video plays
in front of the objects in your Scene") 뒤냐("the video plays in the background
of the Scene"). **Canvas의 UI가 그 평면보다 앞인지 뒤인지는 그 페이지에 없고,
확인하지 않았다.** 반면 `RawImage`로 들여오면 동영상이 Canvas 계층의 한 요소가
되므로 스킵 버튼과 자막은 그냥 형제 요소로 쌓는다. **겹칠 것이 있으면 Canvas
안으로 들여오는 쪽이 그 전후를 따질 필요가 없다.** 그리고 `Alpha`는 카메라
평면 전용이다 — "This property is available only when Render Mode is Camera Far
Plane or Camera Near Plane."

렌더 텍스처를 쓸지 말지는 이렇게 판단하면 된다.

- **스크립트를 하나도 쓰지 않을 생각이면** 렌더 텍스처가 유일한 길이다.
  그때는 **크기를 소스 해상도에 맞추고 `Aspect Ratio`를 명시해라.** 둘 다
  기본값으로 두면 화질과 비율이 동시에 어긋난다.
- **스크립트를 한 줄 쓸 수 있으면** `API Only`가 단순하다. 중간 버퍼가 없고,
  크기·포맷·비율을 물을 일이 없다.
- **어느 쪽이든 `prepareCompleted`를 쓰는 편이 안전하다.** 특히 `API Only`는
  준비 전 `texture`가 비어 있다.
- **컷신이라면 끝을 반드시 받아라.** `loopPointReached`와 `errorReceived`
  둘 다다. 하나만 걸면 실패했을 때 다음으로 넘어가지 못한다.

### 쓰지 말아야 할 자리

- **화질 문제를 Color Format부터 의심하는 것.** 문서가 손잡이로 적어둔 것은
  해상도와 `Aspect Ratio`다. Color Format의 기본값이 나쁘다는 서술은 찾지
  못했다.
- **렌더 텍스처 크기를 256×256으로 둔 채 1080p 동영상을 넣는 것.** 소스
  해상도는 `VideoPlayer.width`/`height`로 읽을 수 있다.
- **모바일 지원 포맷을 검색으로 해결하려는 것.**
  `SystemInfo.IsFormatSupported`에 포맷과 용도를 넘겨 물어본다.
- **`AudioMixer`로 볼륨을 묶어둔 프로젝트에서 `Direct`를 그대로 두는 것.**
  문서가 "bypassing Unity's audio processing"이라고 적었다. 슬라이더가
  동영상에만 안 듣는다.
- **준비 전에 `VideoPlayer.texture`를 `RawImage`에 꽂는 것.** 받을 내용이
  없다. `prepareCompleted`를 기다린다.
- **`Stop()` 뒤에 텍스처를 다시 꽂지 않는 것.** 문서가 "This also destroys
  all internal resources such as textures"라고 적었다. 두 번째 재생부터
  화면이 비어 보인다.
- **컷신의 끝을 `loopPointReached` 하나에만 걸어두는 것.** 오류로 멈춘 뒤에도
  그 이벤트가 오는지는 문서에 적혀 있지 않다. `errorReceived`도 같은 자리로
  모은다.
- **컷신인데 `Loop`를 켜둔 것.** 그러면 `loopPointReached`는 "끝났다"가 아니라
  "다시 돈다"는 신호다. 문서가 "this event makes the video play again."이라고
  적었다.
- **`skipOnDrop`을 바로 대입하는 것.** `canSetSkipOnDrop`이 "(Read Only)"로
  따로 있다. 바꿀 수 있는지부터 묻는다.
- **URL 소스를 쓰면서 파일 위치를 플랫폼별로 확인하지 않는 것.** "bypasses
  asset management"이고, WebGL은 로컬 파일 시스템 재생이 안 된다.

## 정리

- `Render Mode`는 값이 **다섯 개**고, 그중 `API Only`가 "Render the video
  into the VideoPlayer.texture Scripting API property."다. `RawImage`에
  그 텍스처를 그대로 꽂으면 **렌더 텍스처 에셋이 필요 없다.**
- 원문이 렌더 텍스처를 쓰는 이유는 **코드를 한 줄도 안 쓰기 때문**이다.
  대가는 중간에 끼는 고정 크기·고정 포맷 버퍼다.
- 화질과 비율의 손잡이는 **`Aspect Ratio`**(값 여섯 개, 넷은 비율 유지,
  `Stretch`는 "The source aspect ratio isn't preserved.")와 **소스
  해상도**(`VideoPlayer.width`/`height`)다.
- **Color Format의 기본값이 나쁘다는 서술은 문서에서 찾지 못했다.** 맞다고도
  틀렸다고도 말하지 않겠다. 다만 문서가 적어둔 손잡이 목록에 그 칸은 없다.
- 포맷 지원은 **`SystemInfo.IsFormatSupported(format, usage)`**로 묻는다.
  용도를 함께 넘겨야 하는 이유가 "If a specific usage is not supported by a
  format, the operation will fail."에 적혀 있다.
- 첫 프레임 문제에는 **`Wait For First Frame`**이 있고, 미리 준비하려면
  **`Prepare()` · `isPrepared` · `prepareCompleted`**가 있다. `API Only`에서는
  거의 필수다.
- **`Audio Output Mode`가 원문에 없다.** `Direct`는 "bypassing Unity's audio
  processing"이라 `AudioMixer`를 통과하지 않는다. 믹서를 쓸 거면
  `Audio Source`다. 인스펙터에는 값이 셋이고 enum에는 `APIOnly`까지 넷이다.
- **`Stop()`은 "destroys all internal resources such as textures"**다.
  `API Only`로 `RawImage`에 꽂아둔 텍스처가 그때 사라진다. 다시 틀 때는
  `Prepare()`를 거쳐 재할당한다.
- 컷신이 **끝났다는 사실은 `loopPointReached`**로 온다. 그 뜻이 `isLooping`에
  따라 갈린다 — 꺼져 있으면 "Otherwise the VideoPlayer stops.", 켜져 있으면
  "this event makes the video play again."이다.
- **`errorReceived`가 보고하는 것이 다섯 가지**고 그중 하나가 "Issues finding
  the file."다. 끝을 `loopPointReached` 하나에만 걸면 실패한 컷신에서 다음
  단계가 안 온다. 오류 뒤에 그 이벤트가 오는지는 문서에 없다.
- **`Skip On Drop`은 시계를 맞추려고 프레임을 버린다.** 스크립트로 대입하기
  전에 `canSetSkipOnDrop`을 본다.
- **URL 소스는 "bypasses asset management"**다. 빌드에 넣으려면
  `StreamingAssets`, WebGL은 웹 URL만 된다.

---

### 참고

- [Video Player 컴포넌트 레퍼런스 — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-VideoPlayer.html)
- [Use video sources — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/video-sources-reference.html)
- [Render Texture 에셋 레퍼런스 — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-RenderTexture.html)
- [VideoPlayer — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer.html)
- [VideoRenderMode — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoRenderMode.html)
- [VideoAudioOutputMode — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoAudioOutputMode.html)
- [VideoPlayer.Stop — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer.Stop.html)
- [VideoPlayer.loopPointReached — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer-loopPointReached.html)
- [VideoPlayer.errorReceived — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer-errorReceived.html)
- [SystemInfo.IsFormatSupported — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SystemInfo.IsFormatSupported.html)

이 글의 출발점이 된 자료는
[\[유니티\] 비디오플레이어로 UI에서 동영상 재생하기](https://coding-of-today.tistory.com/174)
(TODAYCODE, 2022-01-06)이다. 절차와 설정 설명은 원문을 그대로 따라가면서,
각 항목을 현행 Unity 6.6 매뉴얼과 스크립팅 레퍼런스 양쪽에 대조했다. 원문에
없는 끝·실패 쪽은 스크립팅 레퍼런스의 이벤트 표에서 가져왔다. 확인 시점은
2026-10-09이다.
