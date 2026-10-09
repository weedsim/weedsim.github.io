---
pubDatetime: 2026-10-09T17:30:00+09:00
title: "에러 페이지가 돌아와도 result는 ConnectionError가 아니다"
lang: ko
translationKey: google-translate-tts
featured: false
draft: false
tags:
  - Unity
  - TTS
  - 사운드
  - API
  - C#
description: "유니티에서 TTS를 구현한 2022년 글이다. 구글 번역 웹 UI의 내부 주소를 호출한다. 그 주소가 언제 막히든 이 코드는 알 수 없다. 실패 다섯 가지 중 하나만 보고 있고, 나머지는 성공 분기로 들어간다."
---

게임 개발 프로젝트에 TTS를 넣으려고 했다. **인게임 대사를 일일이 녹음하지
않고 읽히는 쪽**이다. 방법을 찾다 스크랩한 글이 이것이다. 흐름이 깔끔하다 —
외부에서 텍스트와 언어를 받아 URL을 합성하고, `UnityWebRequest`로 오디오를
받아 `AudioSource`에 꽂아 재생한다. 코루틴 하나로 끝난다. 2022년 글이고, 지금
붙여넣어도 돌아간다.

문제는 **무엇을 호출하는지**와 **안 돌아갈 때 어떻게 되는지**다.

호출 대상은 이 주소다.

```text file="원문의 prefix URL"
https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=
```

`translate.google.com`이고 `client=tw-ob`다. 구글 번역 **웹 페이지가 자기
스피커 버튼을 누를 때 쓰는 주소**이고, 공개된 API가 아니다. 구글의 문서화된
TTS 제품은 다른 데 있다. 그리고 Google APIs 약관 2(c)에 이렇게 적혀 있다.

> You will only access (or attempt to access) an API by the means described in
> the documentation of that API.

문서에 적힌 방법으로만 접근한다는 조항이다. 그런데 이 글에서 더 급한 건
약관이 아니다. **그 주소가 막히는 날 이 코드가 그걸 알아채지 못한다는 것**이다.

확인한 것은 다섯 가지다. **`UnityWebRequest.Result`는 값이 다섯 개인데
코드는 `ConnectionError` 하나만 본다**, **`GetContent`는 `null`을 돌려줄 수
있고 코드가 그걸 검사하지 않는다**, **사용자 텍스트를 URL 인코딩 없이 붙인다
— 문서가 하라고 적어둔 자리다**, **`textlen=32`가 고정값이다**, 그리고
**문서화된 경로는 OAuth 스코프가 `cloud-platform`이라서 클라이언트에 둘 수
없다.**

그리고 계기 쪽으로 한 가지 더. **대사는 빌드 시점에 이미 다 아는 텍스트라서,
런타임에 합성할 이유가 없다.** 위 다섯 가지가 전부 런타임 합성에서만 생기는
문제다.

이 블로그에 인접한 글이 둘 있다.
[Unity용 Gemini 클라이언트를 뜯어보다](/posts/unity-gemini-client/)는
**API 키를 클라이언트에 넣는 것**을, [DeepVoice AI 에셋 다시
보기](/posts/deepvoice-unity-asset/)는 **TTS 에셋이 실제로 무엇에
의존하는지**를 다뤘다. 이 글은 그 둘과 다른 자리다 — **노출될 키조차 없는
경우.** 키가 없다는 건 안전하다는 뜻이 아니라 **지켜줄 약속이 없다**는
뜻이다. 다만 다른 글로 넘기지는 않는다. 필요한 설명과 예제 코드는 여기서
다시 전부 싣는다.

확인 시점은 **2026-10-09**이고, 기준은 Unity **6.6**이다.

## 목차

## 원문 코드

주석까지 원문 그대로다.

```csharp file="GoogleTTS.cs (원문)"
using System.Collections;
using UnityEngine;
using System.Text;
using UnityEngine.Networking;

public class GoogleTTS: MonoBehaviour
{
    //TTS에서 사용할 오디오 소스
    private AudioSource mAudio;
    //문자열을 계속 바꾸기에 빌더를 사용한다.
    private StringBuilder mStrBuilder;
    //구글 TTS를 이용할 오리지널 앞 주소
    private string mPrefixURL;

    void Start()
    {
        mPrefixURL = "https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=";
        mAudio = GetComponent<AudioSource>();
        mStrBuilder = new StringBuilder();
    }

    //외부에서 호출되며 문자열, 언어를 받아 코루틴을 실행시킨다.
    public void RunTTS(string text, SystemLanguage language = SystemLanguage.English)
    {
        StartCoroutine(DownloadTheAudio(text, language));
    }

    //오디오를 다운로드 받는다.
    IEnumerator DownloadTheAudio(string text, SystemLanguage language = SystemLanguage.English)
    {
        mStrBuilder.Clear();
        //텍스트 앞 Origin URL
        mStrBuilder.Append(mPrefixURL);
        //TTS로 변환할 텍스트
        mStrBuilder.Append(text);
        mStrBuilder.Replace('\n', '.');
        //언어 인식을 위한 태그 추가 &tl=
        mStrBuilder.Append("&tl=");
        //언어 식별
        switch (language)
        {
            case SystemLanguage.Korean:
                {
                    mStrBuilder.Append("Ko-kr");
                    break;
                }
            case SystemLanguage.English:
            default:
                {
                    mStrBuilder.Append("En-gb");
                    break;
                }
        }

        using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(mStrBuilder.ToString(), AudioType.MPEG))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.ConnectionError)
            {
                Debug.Log(www.error);
            }
            else
            {
                mAudio.clip = DownloadHandlerAudioClip.GetContent(www);
                mAudio.Play();
            }
        }
    }
}
```

아래는 이 코드를 현행 스크립팅 레퍼런스와 한 줄씩 대조한 결과다.

## 실패 다섯 가지 중 하나만 본다

`www.result`를 `ConnectionError`와만 비교하고, 나머지는 전부 `else`로
보낸다. 그런데 `UnityWebRequest.Result`는 값이 **다섯 개**다.

| 값 | 문서 설명 | 원문 코드가 가는 분기 |
| --- | --- | --- |
| `InProgress` | "The request hasn't finished yet." | `else` (성공) |
| `Success` | "The request succeeded." | `else` (성공) |
| `ConnectionError` | "Failed to communicate with the server." | 에러 로그 |
| `ProtocolError` | "The server returned an error response." | **`else` (성공)** |
| `DataProcessingError` | "Error processing data." | **`else` (성공)** |

`ConnectionError`는 **서버와 통신 자체가 안 된 경우**다. 네트워크가 끊겼거나
DNS가 안 풀렸거나. 반대로 **서버가 응답을 했는데 그게 오디오가 아닌 경우**는
`ProtocolError`나 `DataProcessingError`다.

그리고 이 주소가 응답을 멈추는 방식은 **연결 거부일 가능성이 가장 낮다.**
서버는 살아 있고 요청도 받는다. 거부든 변경이든 결과가 오디오가 아닌 무언가로
돌아오면, 통신 자체는 성공한 것이다. 그러니 `ConnectionError`가 아니고, 코드는
`else`로 들어가 그 응답을 MP3로 취급한다.

구글이 구체적으로 어떤 상태 코드와 본문을 돌려주는지는 **확인하지 않았다.**
문서화된 엔드포인트가 아니니 응답 규격을 적어둔 문서가 없다. 여기서 말할 수
있는 것은 유니티 쪽 사실뿐이다 — **응답이 왔고 그게 오디오가 아니면 그 결과는
`ConnectionError`가 아니다.**

받는 쪽 함수도 그 상황을 숨기지 않는다. `DownloadHandlerAudioClip.GetContent`
의 설명은 한 줄이다.

> Returns the downloaded AudioClip, or `null`.

**`null`을 돌려줄 수 있다.** 원문 코드는 그 반환값을 바로 `mAudio.clip`에
꽂는다. 그리고 `AudioType`을 선언할 때의 주의도 있다.

> If you use the wrong format, the audio might not play correctly and Unity
> might throw an error.

`AudioType.MPEG`라고 선언했는데 HTML이 왔으면 그게 "wrong format"이다.

그래서 실패 경로가 이렇게 흐른다.

```text file="응답이 오디오가 아닐 때의 실행 경로"
요청 → 서버가 오디오가 아닌 것으로 응답 (통신은 성공)
     → www.result == ProtocolError 또는 DataProcessingError
     → ConnectionError 가 아니므로 else 분기
     → GetContent(www) → null
     → mAudio.clip = null; mAudio.Play();
     → 아무 소리도 안 난다. 로그도 없다.
```

**증상은 "TTS가 조용하다"뿐이다.** 원인을 알려주는 줄이 하나도 없다.
`www.error`는 에러 분기에만 있고, 그 분기로 가지 않았다.

고치는 방법은 비교 방향을 뒤집는 것뿐이다. `Success`가 아니면 실패로 본다.
`InProgress`가 `else`에 섞여 있는 문제도 같이 사라진다.

## 사용자 텍스트를 URL에 그대로 붙인다

두 번째 문제는 문자열 합성이다.

```csharp
mStrBuilder.Append(mPrefixURL);
mStrBuilder.Append(text);          // 그대로 붙는다
mStrBuilder.Append("&tl=");
```

`text`가 `q=`와 `&tl=` 사이에 **인코딩 없이** 들어간다. URL에서 특별한 뜻을
가진 글자가 그 안에 있으면 요청이 다른 요청이 된다.

유니티에 그 자리에 쓰라고 만들어둔 함수가 있다. `UnityWebRequest.EscapeURL`
이고, 설명이 이 글의 용도를 거의 지목한다.

> Escapes characters in a string to ensure they are URL-friendly.

> Certain text characters have special meanings when present in URLs.

> It is recommended that you use this function on any text supplied by a user
> before passing the text as a URL parameter.

> This will ensure that a malicious user can't manipulate the contents of the
> URL to attack the webserver.

**"any text supplied by a user"** — 원문이 도입부에서 든 용도가 바로 그것이다.
"채팅을 TTS로 읽어주기". 채팅은 사용자가 쓴 텍스트다.

`&` 하나가 들어오면 이렇게 갈린다.

```text file="채팅에 & 가 들어온 경우"
읽히길 바란 텍스트:  커피 & 도넛

인코딩 안 함:
  ...&q=커피 & 도넛&tl=Ko-kr
  → q 는 "커피 " 에서 끝나고, " 도넛" 은 이름 없는 파라미터가 된다

EscapeURL 적용:
  ...&q=%EC%BB%A4%ED%94%BC%20%26%20%EB%8F%84%EB%84%9B&tl=Ko-kr
  → q 안에 & 가 그대로 담긴다
```

공백도 마찬가지다. 그대로 넣으면 공백이 든 URL이 되고, `#`이 들어오면 그
뒤가 프래그먼트로 잘려 서버까지 가지 않는다.

문서가 "malicious user"라고 쓴 대목도 과장이 아니다. 이 코드는 사용자 입력을
그대로 외부 요청의 URL에 넣는다. 지금은 그 외부가 구글이라 추가 파라미터가
무시되는 정도지만, 같은 패턴을 자기 서버에 붙이면 그때는 자기 서버가 받는다.

## textlen=32는 갱신되지 않는다

prefix URL에 `textlen=32`가 박혀 있다. 이름대로면 텍스트 길이인데, 실제 텍스트
길이와 무관하게 늘 32다. 세 글자를 보내도 32, 백 글자를 보내도 32다.

이게 뭘 하는 파라미터인지는 **확인할 수 없다.** 문서화된 API가 아니니
파라미터 사전도 없다. 그래서 두 가지 중 하나다 — 서버가 무시하고 있거나,
아니면 어딘가에서 쓰이고 있고 그 값이 틀려 있다. 어느 쪽인지 알 방법이 없는
것 자체가 이 주소를 쓰는 비용이다.

같은 이유로 길이 제한도 알 수 없다. 긴 대사를 넣었을 때 잘리는지, 거부되는지,
어디서 끊기는지 — 참조할 문서가 없다. 유료 제품이면 그게 다 적혀 있다.

## 클립이 교체될 때 이전 클립은 남는다

`GetContent`는 받은 데이터로 `AudioClip`을 만들어 돌려준다. 원문 코드는 그걸
`mAudio.clip`에 덮어쓴다. **이전 클립을 파괴하지 않는다.**

```csharp
mAudio.clip = DownloadHandlerAudioClip.GetContent(www);
```

대사를 100번 읽어주면 런타임에 만들어진 `AudioClip`이 100개 생긴다. 참조가
끊긴 것은 결국 회수되지만, 유니티 오브젝트는 **C# GC만으로 즉시 사라지지
않는다.** 교체 직전에 이전 클립을 `Destroy`하는 한 줄이 필요하다. 채팅
TTS처럼 호출이 잦은 용도면 더 그렇다.

## 맞게 적은 것 하나

원문이 오디오 소스를 하나만 쓴 이유를 이렇게 적어뒀다.

> 하나의 오디오 소스로 TTS가 중첩으로 일어나면 불편할 수 있으므로 하나의
> 오디오 소스로 Play()를 통해 이전의 오디오 는 일반적으로 정지되게
> 구성하였다.

**이건 맞다.** `AudioSource.Play`의 레퍼런스가 이렇게 적는다.

> If AudioSource.clip is set to the same clip that is playing then the clip
> will sound like it is re-started.

> AudioSource will assume any Play call will have a new audio clip to play.

`Play`를 부르면 그 소스에서 돌던 것이 새로 시작된다. 소스 하나를 돌려쓰면
TTS가 겹치지 않는다. 의도와 수단이 맞다.

`StringBuilder`를 쓴 선택도 나쁘지 않다. 다만 효과는 크지 않다. 요청 한 번에
`Append`가 다섯 번쯤이고 마지막에 `ToString()`이 새 문자열을 만든다. 이득은
"String의 문제를 개선"이라고 할 만한 규모가 아니다. 틀린 선택이 아니라
**영향이 작은 선택**이다.

## 대사가 고정이면 런타임에 부를 이유가 없다

여기서 한 발 물러날 필요가 있다. 이 글의 출발점은 **인게임 대사를 녹음하지
않고 읽히는 것**이었다. 그렇다면 읽힐 텍스트는 빌드 시점에 이미 다 있다.
대사표가 있고, 개수가 정해져 있고, 플레이 중에 새로 생기지 않는다.

그러면 런타임에 합성할 이유가 사라진다. **빌드 전에 한 번 합성해서 오디오
파일로 받아두고, 그걸 프로젝트 에셋으로 넣으면 된다.** 원문이 든 동기 —
"캐릭터의 대사를 따로 녹음하지 않고 읽어주는 기능" — 은 그것으로 그대로
달성된다. 그리고 앞 절들에서 짚은 문제가 전부 사라진다.

| 런타임 합성 | 빌드 시점 합성 |
| --- | --- |
| 실패 분기 다섯 가지를 다뤄야 한다 | 런타임에 실패할 요청이 없다 |
| 자격증명이 어딘가에 있어야 한다 | 빌드에 자격증명이 들어가지 않는다 |
| 첫 재생까지 네트워크 왕복이 있다 | 즉시 재생된다 |
| 오프라인에서 안 된다 | 오프라인에서 된다 |
| 같은 대사를 재생마다 다시 받는다 | 한 번 합성한다 |
| 주소가 바뀌면 출시된 빌드가 멈춘다 | 영향 없다 |

얻는 게 하나 더 있다. 런타임에 받은 MP3는 바이트에서 만들어진 `AudioClip`이라
**임포트 설정이 없다.** 프로젝트에 에셋으로 넣은 오디오는 임포트 설정을
가진다. 레퍼런스 페이지 제목이 "Audio Clip Import Settings reference"이고,
칸이 이렇게 있다.

> Choose the method Unity uses to load audio assets at runtime

`Load Type`이고 세 가지다 — "Decompress audio files as soon as they're
loaded.", "Keep audio compressed in memory and decompress while playing.",
"Decode continuous audio."

> Choose the format for the sound to use at runtime.

`Compression Format`이다. Vorbis/MP3 쪽 설명이 이렇다.

> Choose this compression to create smaller files but lower quality audio
> compared to PCM audio.

`Quality`는 "Determine the amount of compression to apply to a compressed
clip."이고, 플랫폼별로 따로 줄 수도 있다.

> In this panel, you can configure the audio clip's settings for various
> platforms.

대사 수백 줄을 모바일에 넣는다면 이 칸들이 용량과 메모리를 결정한다.
**런타임 다운로드는 그 칸을 하나도 쓰지 못한다.**

빌드 시점 합성이 안 맞는 경우도 분명히 있다. **플레이어가 입력한
텍스트**(채팅·이름), **런타임에 조립되는 문장**, 또는 대사가 너무 많아 전부
오디오로 넣으면 패키지가 커지는 경우다. 그때는 다음 절이 답이다.

## 런타임이 필요하면 문서화된 경로는 스코프가 cloud-platform이다

그럼 무엇을 쓰나. 구글의 문서화된 TTS 제품은 Cloud Text-to-Speech다.

> Cloud Text-to-Speech converts text or Speech Synthesis Markup Language
> (SSML) input into audio data of natural human speech.

합성은 REST 메서드 하나다.

> POST https://texttospeech.googleapis.com/v1/text:synthesize

> Synthesizes speech synchronously: receive results after all text input has
> been processed.

여기서 중요한 줄이 나온다. 그 메서드의 인증 요건이다.

> Requires the following OAuth scope:

적혀 있는 스코프는 `https://www.googleapis.com/auth/cloud-platform`이다.

**프로젝트 전체 범위 스코프다.** TTS만 쓰는 스코프가 아니다. 그 자격증명을
들고 있으면 그 GCP 프로젝트에 대해 할 수 있는 일이 TTS에서 끝나지 않는다.
그래서 **빌드에 넣어 배포하는 클라이언트에 둘 수 없다.** 게임 클라이언트가
직접 `texttospeech.googleapis.com`을 부르는 구조는 성립하지 않는다.

구조는 하나로 좁혀진다. **클라이언트는 내 서버를 부르고, 내 서버가 구글을
부른다.** 자격증명은 서버에만 둔다. 클라이언트가 보는 주소는 내 엔드포인트고,
그 엔드포인트가 반환하는 것은 오디오 바이트다. 그러면 `UnityWebRequest`로
받아 `AudioSource`에 꽂는 원문의 흐름은 **그대로 쓸 수 있다.** 바꿔야 하는
것은 주소와 에러 처리뿐이다.

같은 결론에 다른 경로로 닿은 글이
[Unity용 Gemini 클라이언트를 뜯어보다](/posts/unity-gemini-client/)에 있다.
그쪽은 키가 빌드에 들어가는 문제였고, 여기는 **스코프가 너무 넓어서** 애초에
넣을 수 없는 경우다.

가격은 적지 않겠다. 제가 읽은 문서 페이지에 **문자 단위 무료 한도가 적혀
있지 않았다.** "$300 in free credit"과 "20+ always-free products"라는 문구는
있지만 TTS에 묶인 수치가 아니다. 쓸 거라면 가격 페이지를 직접 봐야 한다.

로컬에서 도는 선택지도 있다. 플랫폼 내장 TTS(안드로이드·iOS·윈도우)를
플러그인으로 부르는 방식이고, 네트워크가 필요 없고 자격증명도 없다. 대신
목소리 품질과 사용 가능한 언어가 기기에 달린다. 에셋스토어 TTS 에셋들이
실제로 무엇에 의존하는지는
[DeepVoice AI 에셋 다시 보기](/posts/deepvoice-unity-asset/)에 적어뒀다.

## 어디에 왜 쓰나

### 동작하는 예제

원문의 구조를 유지하면서 위 다섯 가지를 고친 형태다. **주소는 내가 통제하는
엔드포인트**로 둔다 — 그게 이 글의 결론이기 때문이다. 프로토타입에서 구글
번역 주소를 그대로 꽂아 쓸 수는 있지만, 그때도 에러 처리와 인코딩은 있어야
증상을 볼 수 있다.

```csharp file="Scripts/Audio/TextToSpeechPlayer.cs"
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

[RequireComponent(typeof(AudioSource))]
public class TextToSpeechPlayer : MonoBehaviour
{
    private const int MaxTextLength = 200;

    [Header("엔드포인트")]
    [Tooltip("자격증명은 서버에만 둔다. 클라이언트는 이 주소만 안다.")]
    [SerializeField]
    private string _endpoint = "https://tts.example.com/speak";

    [Header("재생")]
    [SerializeField]
    private AudioSource _audioSource;

    private readonly StringBuilder _urlBuilder = new StringBuilder();
    private Coroutine _running;

    // Start이 아니라 Awake다. 다른 스크립트의 Awake에서 Speak가 불려도
    // 참조가 비어 있지 않게 한다.
    private void Awake()
    {
        if (_audioSource == null && !TryGetComponent(out _audioSource))
        {
            Debug.LogError("AudioSource가 없다.", this);
        }
    }

    public void Speak(string text, SystemLanguage language = SystemLanguage.English)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return;
        }

        if (text.Length > MaxTextLength)
        {
            text = text.Substring(0, MaxTextLength);
        }

        // 앞 요청이 아직 돌고 있으면 버린다. 소스가 하나뿐이라
        // 늦게 도착한 오디오가 새 오디오를 덮는 것을 막는다.
        if (_running != null)
        {
            StopCoroutine(_running);
        }

        _running = StartCoroutine(DownloadAndPlay(text, language));
    }

    private IEnumerator DownloadAndPlay(string text, SystemLanguage language)
    {
        _urlBuilder.Clear();
        _urlBuilder.Append(_endpoint);
        _urlBuilder.Append("?lang=");
        _urlBuilder.Append(ToLanguageTag(language));
        _urlBuilder.Append("&text=");

        // 문서가 "any text supplied by a user"에 쓰라고 적어둔 자리다.
        _urlBuilder.Append(UnityWebRequest.EscapeURL(text.Replace('\n', '.')));

        using (UnityWebRequest request =
                   UnityWebRequestMultimedia.GetAudioClip(_urlBuilder.ToString(),
                                                          AudioType.MPEG))
        {
            yield return request.SendWebRequest();

            // Success가 아니면 실패다. ConnectionError만 보면
            // ProtocolError와 DataProcessingError가 성공으로 들어온다.
            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"TTS 실패 [{request.result}] " +
                                 $"{request.responseCode} {request.error}", this);
                yield break;
            }

            AudioClip clip = DownloadHandlerAudioClip.GetContent(request);

            // 문서가 "or null"이라고 적어뒀다.
            if (clip == null)
            {
                Debug.LogWarning("응답이 오디오가 아니다.", this);
                yield break;
            }

            ReplaceClip(clip);
        }

        _running = null;
    }

    private void ReplaceClip(AudioClip clip)
    {
        if (_audioSource == null)
        {
            return;
        }

        AudioClip previous = _audioSource.clip;

        _audioSource.clip = clip;
        _audioSource.Play();

        // 런타임에 만들어진 클립은 교체할 때 직접 파괴한다.
        if (previous != null)
        {
            Destroy(previous);
        }
    }

    private static string ToLanguageTag(SystemLanguage language)
    {
        switch (language)
        {
            case SystemLanguage.Korean:
                return "ko-KR";
            case SystemLanguage.Japanese:
                return "ja-JP";
            case SystemLanguage.English:
            default:
                return "en-GB";
        }
    }
}
```

`_audioSource`와 `clip`에 `?.`를 쓰지 않은 이유가 있다. 둘 다
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` / `!= null` 비교를
쓴다. 순수 C# 객체라면 `?.`가 맞다.

초기화를 `Start`에서 `Awake`로 옮긴 것도 이유가 있다. 원문은 `mPrefixURL`과
`mStrBuilder`를 `Start`에서 만든다. 다른 스크립트의 `Awake`에서 `RunTTS`가
불리면 `mStrBuilder`가 아직 `null`이다. 호출 순서에 의존하지 않게 `Awake`로
내렸다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| **대사표가 있고 빌드 시점에 다 안다** | **빌드 전에 합성해 오디오 에셋으로** 넣는다 |
| 대사가 너무 많아 다 넣으면 패키지가 커진다 | 내 서버 경유 + 서버에만 자격증명 |
| 런타임에 조립되는 문장을 읽어준다 | 내 서버 경유 + 서버에만 자격증명 |
| 사용자 입력(채팅·이름)을 읽어준다 | 서버 경유 + `EscapeURL` + 길이 제한 + 내용 필터 |
| 네트워크 없이 동작해야 함 | 플랫폼 내장 TTS를 플러그인으로 |
| 에디터에서 흐름만 확인하는 프로토타입 | 아무 주소나. 단 에러 처리와 인코딩은 넣는다 |

**첫 줄이 이 글의 용도다.** 인게임 대사를 녹음하지 않고 읽히는 것이라면 빌드
시점에 끝난다. 아래로 내려갈수록 런타임에 남겨야 하는 이유가 생기는 순서다.

사용자 입력 줄은 인코딩 하나로 끝나지 않는다는 점도 짚어둔다. 길이 제한과
내용 필터가 서버 쪽에 있어야 한다. 외부 서비스에 그대로 흘려보내는 텍스트에
무엇이 섞여 들어올지는 클라이언트가 정할 수 없다.

### 쓰지 말아야 할 자리

- **출시 빌드에서 `translate.google.com/translate_tts`를 부르는 것.** 문서화된
  접근 방법이 아니고(약관 2(c)), 응답 규격을 적어둔 문서도 없다.
- **`result == ConnectionError`로만 실패를 판정하는 것.** `Success`가 아니면
  실패로 본다. 값이 다섯 개다.
- **`GetContent`의 반환값을 null 검사 없이 `clip`에 꽂는 것.** 문서가
  "or `null`"이라고 적어뒀다.
- **사용자 텍스트를 `EscapeURL` 없이 URL에 붙이는 것.** 문서가 그 함수를
  "any text supplied by a user"에 쓰라고 적었다.
- **클라이언트에 `cloud-platform` 스코프 자격증명을 넣는 것.** TTS만 쓰는
  스코프가 아니다.
- **`clip`을 덮어쓰면서 이전 클립을 그냥 두는 것.** 런타임에 만든 클립은
  교체할 때 파괴한다.
- **빌드 시점에 아는 대사를 런타임에 합성하는 것.** 실패 처리·자격증명·지연·
  오프라인 문제를 전부 사들이면서, 오디오 임포트 설정은 하나도 못 쓴다.

## 정리

- 원문이 부르는 주소는 **구글 번역 웹 UI의 내부 주소**(`client=tw-ob`)다.
  문서화된 API가 아니고, 약관 2(c)는 "by the means described in the
  documentation"만 허용한다. 응답 규격을 적어둔 문서도 없다.
- **`UnityWebRequest.Result`는 값이 다섯 개**이고 코드는 `ConnectionError`
  하나만 본다. 서버가 **응답을 하면서** 오디오가 아닌 것을 주는 경우는
  `ProtocolError`나 `DataProcessingError`이고, 둘 다 성공 분기로 들어간다.
- 그 분기에서 `GetContent`는 **"or `null`"**을 돌려주고, 코드는 그걸 그대로
  `clip`에 꽂은 뒤 `Play()`한다. **증상은 침묵뿐, 로그는 없다.**
- 사용자 텍스트가 **URL 인코딩 없이** 들어간다. `UnityWebRequest.EscapeURL`의
  설명이 "any text supplied by a user"에 쓰라고 적어둔 바로 그 자리다.
- `textlen=32`는 **고정값**이고, 무엇을 하는 파라미터인지 확인할 문서가 없다.
  길이 제한도 같은 이유로 알 수 없다.
- 교체되는 `AudioClip`을 파괴하지 않아 **런타임 클립이 쌓인다.**
- 오디오 소스를 하나만 쓴 선택은 **맞다.** `AudioSource.Play`가 호출마다 새
  클립을 가정한다고 레퍼런스에 적혀 있다.
- 문서화된 Cloud Text-to-Speech는 `text:synthesize`에 **`cloud-platform`
  스코프**를 요구한다. 프로젝트 전체 범위라서 **클라이언트에 둘 수 없다.**
- 그래서 결론은 용도에 따라 갈린다. **대사가 빌드 시점에 다 있으면 런타임에
  부를 이유가 없다** — 미리 합성해 에셋으로 넣으면 위의 문제가 전부 사라지고,
  오디오 임포트 설정(`Load Type` · `Compression Format` · 플랫폼별 재정의)을
  쓸 수 있다. 빌드 시점에 모르는 텍스트만 런타임에 남기고, 그건 서버를 경유
  한다.

---

### 참고

- [UnityWebRequest.Result — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequest.Result.html)
- [UnityWebRequest.EscapeURL — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequest.EscapeURL.html)
- [UnityWebRequestMultimedia.GetAudioClip — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequestMultimedia.GetAudioClip.html)
- [DownloadHandlerAudioClip.GetContent — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.DownloadHandlerAudioClip.GetContent.html)
- [AudioType — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioType.html)
- [AudioSource.Play — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Play.html)
- [Audio Clip Import Settings reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Google APIs Terms of Service](https://developers.google.com/terms)
- [Cloud Text-to-Speech 문서](https://docs.cloud.google.com/text-to-speech/docs)
- [text:synthesize — Cloud Text-to-Speech REST 레퍼런스](https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize)

이 글의 출발점이 된 자료는
[\[유니티\] TTS(Text-To-Speech) 목소리 구현](https://bonnate.tistory.com/108)
(bonnate, 2022-08-05)이다. 예제 코드와 설계 의도는 원문을 그대로 옮겼고,
코드 안의 한국어 주석도 원문 저자의 것이다. 각 줄을 현행 Unity 6.6 스크립팅
레퍼런스와 구글의 문서·약관에 대조했다. 확인 시점은 2026-10-09이다.
