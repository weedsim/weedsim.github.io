---
pubDatetime: 2026-10-09T17:30:00+09:00
title: "An Error Page Comes Back and result Still Isn't ConnectionError"
lang: en
translationKey: google-translate-tts
featured: false
draft: false
tags:
  - Unity
  - TTS
  - Sound
  - API
  - C#
description: "A 2022 post implementing TTS in Unity. It calls an internal address belonging to the Google Translate web UI. Whenever that address stops answering, this code can't tell. It checks one of five failure results, and the rest fall into the success branch."
---

I wanted to put TTS into a game project — **the kind that reads in-game
dialogue aloud instead of recording every line.** Looking for a way to do
that, I clipped this post. The flow is clean: take text and a language from
outside, assemble a URL, download the audio with `UnityWebRequest`, drop it
into an `AudioSource` and play. One coroutine and it's done. It's a 2022 post
and it still runs if you paste it in today.

The problems are **what it calls** and **what happens when that stops
working.**

Here is what it calls.

```text file="The post's prefix URL"
https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=
```

`translate.google.com`, with `client=tw-ob`. This is **the address the Google
Translate web page uses when you press its own speaker button**, not a public
API. Google's documented TTS product lives elsewhere. And the Google APIs
Terms of Service, section 2(c), says this.

> You will only access (or attempt to access) an API by the means described in
> the documentation of that API.

Access only by the means described in the documentation. But the terms aren't
the urgent part of this post. **The urgent part is that this code cannot tell
the day that address stops answering.**

Five things checked out. **`UnityWebRequest.Result` has five values and the
code checks only `ConnectionError`**, **`GetContent` can return `null` and the
code doesn't check for it**, **user text goes into the URL with no encoding —
the exact place the docs tell you to encode**, **`textlen=32` is a fixed
value**, and **the documented path requires the `cloud-platform` OAuth scope,
which can't live in a client.**

And one more, pointed at the goal. **Dialogue is text you already have at
build time, so there is no reason to synthesize it at runtime.** All five
problems above exist only in runtime synthesis.

This blog has two adjacent posts.
[Reading a Unity Gemini client](/en/posts/unity-gemini-client/) covered
**putting an API key in the client**, and
[Revisiting the DeepVoice AI asset](/en/posts/deepvoice-unity-asset/) covered
**what a TTS asset actually depends on.** This post sits somewhere else —
**the case where there isn't even a key to leak.** Having no key doesn't mean
it's safe; it means **there's no promise to keep.** It doesn't hand anything
off, though. Every explanation and code sample it needs is reproduced here in
full.

Checked on **2026-10-09** against Unity **6.6**.

## Table of contents

## The original code

Comments included, as written.

```csharp file="GoogleTTS.cs (original)"
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

The Korean comments in the sample are the original author's. What follows is
this code checked line by line against the current scripting reference.

## It checks one of five failures

`www.result` is compared only against `ConnectionError`, and everything else
goes to `else`. But `UnityWebRequest.Result` has **five** values.

| Value | What the docs say | Branch the original takes |
| --- | --- | --- |
| `InProgress` | "The request hasn't finished yet." | `else` (success) |
| `Success` | "The request succeeded." | `else` (success) |
| `ConnectionError` | "Failed to communicate with the server." | error log |
| `ProtocolError` | "The server returned an error response." | **`else` (success)** |
| `DataProcessingError` | "Error processing data." | **`else` (success)** |

`ConnectionError` means **communication with the server never happened** — the
network dropped, DNS didn't resolve. Conversely, **the server answering with
something that isn't audio** is `ProtocolError` or `DataProcessingError`.

And refusing the connection is **the least likely way** this address stops
answering. The server is alive and takes the request. Whether it refuses or
changes, if the result comes back as something other than audio, the
communication itself succeeded. So it isn't `ConnectionError`, and the code
goes into `else` and treats that response as MP3.

**I did not verify** what status code and body Google specifically returns.
It isn't a documented endpoint, so no document states its response shape. What
can be said here is the Unity-side fact — **a response arrived and it wasn't
audio, so the result is not `ConnectionError`.**

The receiving function doesn't hide the situation either.
`DownloadHandlerAudioClip.GetContent` has a one-line description.

> Returns the downloaded AudioClip, or `null`.

**It can return `null`.** The original drops that return value straight into
`mAudio.clip`. And there's a caution attached to declaring an `AudioType`.

> If you use the wrong format, the audio might not play correctly and Unity
> might throw an error.

You declared `AudioType.MPEG`; if HTML arrived, that is the "wrong format."

So the failure path runs like this.

```text file="Execution path when the response isn't audio"
request → server answers with something that isn't audio (comms succeeded)
        → www.result == ProtocolError or DataProcessingError
        → not ConnectionError, so the else branch
        → GetContent(www) → null
        → mAudio.clip = null; mAudio.Play();
        → no sound. no log either.
```

**The only symptom is "the TTS is quiet."** Not one line tells you why.
`www.error` lives in the error branch, and the code didn't go there.

The fix is to flip the comparison: anything that isn't `Success` is a failure.
The `InProgress`-in-the-else problem disappears with it.

## User text goes into the URL untouched

The second problem is the string assembly.

```csharp
mStrBuilder.Append(mPrefixURL);
mStrBuilder.Append(text);          // appended as-is
mStrBuilder.Append("&tl=");
```

`text` lands between `q=` and `&tl=` **with no encoding.** If it contains a
character that has special meaning in a URL, the request becomes a different
request.

Unity ships a function for exactly this spot. It's
`UnityWebRequest.EscapeURL`, and its description all but names this post's use
case.

> Escapes characters in a string to ensure they are URL-friendly.

> Certain text characters have special meanings when present in URLs.

> It is recommended that you use this function on any text supplied by a user
> before passing the text as a URL parameter.

> This will ensure that a malicious user can't manipulate the contents of the
> URL to attack the webserver.

**"any text supplied by a user"** — one of the uses the original lists in its
intro is reading chat aloud, and chat is text a user wrote.

One `&` splits it like this.

```text file="When a & arrives in the text"
text you wanted read:  coffee & donuts

without encoding:
  ...&q=coffee & donuts&tl=En-gb
  → q ends at "coffee ", and " donuts" becomes a nameless parameter

with EscapeURL:
  ...&q=coffee%20%26%20donuts&tl=En-gb
  → the & is carried inside q
```

Spaces are the same story. Put them in raw and you have a URL with spaces in
it; a `#` cuts everything after it into a fragment that never reaches the
server.

The docs' phrase "malicious user" isn't an exaggeration either. This code puts
user input straight into the URL of an outbound request. Right now that
outbound target is Google, so extra parameters are merely ignored — but point
the same pattern at your own server and your own server is the one receiving
them.

## textlen=32 is never updated

`textlen=32` is baked into the prefix URL. By its name it's the text length,
yet it's always 32 regardless of the actual text. Send three characters: 32.
Send a hundred: 32.

What that parameter does **cannot be checked.** It isn't a documented API, so
there's no parameter dictionary. That leaves two possibilities — the server
ignores it, or it's used somewhere and the value is wrong. Having no way to
know which is itself the cost of using this address.

For the same reason, the length limit is unknown. Whether a long line gets
truncated, rejected, or cut off somewhere — there's no document to consult. A
paid product writes all of that down.

## The previous clip stays when the clip is replaced

`GetContent` builds an `AudioClip` from the received data and returns it. The
original overwrites `mAudio.clip` with it. **It never destroys the previous
clip.**

```csharp
mAudio.clip = DownloadHandlerAudioClip.GetContent(www);
```

Read a hundred lines and a hundred runtime `AudioClip`s have been created.
What loses its references is eventually collected, but Unity objects **don't
vanish the moment C#'s GC runs.** A line destroying the previous clip right
before the swap is what's missing. All the more so for a frequently called use
like chat TTS.

## One thing it got right

The original explains why it uses a single audio source. My translation from
the Korean:

> Having TTS overlap on one audio source could be inconvenient, so it's built
> so that calling Play() on the single audio source generally stops the
> previous audio.

**This is right.** The `AudioSource.Play` reference says this.

> If AudioSource.clip is set to the same clip that is playing then the clip
> will sound like it is re-started.

> AudioSource will assume any Play call will have a new audio clip to play.

Call `Play` and whatever was running on that source starts over. Reuse one
source and TTS doesn't overlap. Intent and means line up.

Using a `StringBuilder` isn't a bad choice either, though the effect is small.
One request means about five `Append` calls and a final `ToString()` that
allocates a new string anyway. The gain isn't on the scale of "improving the
problems of String." Not a wrong choice — **a low-impact one.**

## If the dialogue is fixed, there's no reason to call at runtime

A step back is in order here. The starting point of this post was **reading
in-game dialogue aloud without recording it.** If that's the case, the text to
be read already exists at build time. There's a dialogue table, the count is
fixed, and no new lines appear mid-play.

Which removes the reason to synthesize at runtime. **Synthesize once before
the build, keep the audio files, and bring them in as project assets.** The
motivation the original gives — reading a character's lines without recording
them separately — is met exactly that way. And every problem flagged in the
sections above disappears.

| Runtime synthesis | Build-time synthesis |
| --- | --- |
| Five failure branches to handle | No request to fail at runtime |
| A credential has to live somewhere | No credential ships in the build |
| A network round trip before first playback | Plays immediately |
| Doesn't work offline | Works offline |
| Refetches the same line on every playback | Synthesized once |
| A changed address stalls a shipped build | No effect |

There's one more thing you gain. An MP3 received at runtime is an `AudioClip`
built from bytes, so it has **no import settings.** Audio brought into the
project as an asset does have them. The reference page is titled "Audio Clip
Import Settings reference", and it has these fields.

> Choose the method Unity uses to load audio assets at runtime

That's `Load Type`, with three options — "Decompress audio files as soon as
they're loaded.", "Keep audio compressed in memory and decompress while
playing.", "Decode continuous audio."

> Choose the format for the sound to use at runtime.

That's `Compression Format`. Here is what it says about the Vorbis/MP3 option.

> Choose this compression to create smaller files but lower quality audio
> compared to PCM audio.

`Quality` is "Determine the amount of compression to apply to a compressed
clip.", and you can set these per platform.

> In this panel, you can configure the audio clip's settings for various
> platforms.

Put a few hundred lines of dialogue on mobile and these fields decide your
size and memory. **A runtime download uses none of them.**

There are cases where build-time synthesis doesn't fit, clearly. **Text the
player typed** (chat, names), **sentences assembled at runtime**, or dialogue
so voluminous that shipping all of it as audio bloats the package. The next
section is the answer for those.

## If you need runtime, the documented path requires the cloud-platform scope

So what do you use. Google's documented TTS product is Cloud Text-to-Speech.

> Cloud Text-to-Speech converts text or Speech Synthesis Markup Language
> (SSML) input into audio data of natural human speech.

Synthesis is one REST method.

> POST https://texttospeech.googleapis.com/v1/text:synthesize

> Synthesizes speech synchronously: receive results after all text input has
> been processed.

And here comes the important line — that method's authorization requirement.

> Requires the following OAuth scope:

The scope listed is `https://www.googleapis.com/auth/cloud-platform`.

**That's a whole-project scope.** Not a TTS-only scope. Hold that credential
and what you can do to the GCP project doesn't stop at TTS. Which is why
**it cannot sit in a client you build and ship.** A game client calling
`texttospeech.googleapis.com` directly isn't a workable structure.

That narrows the structure to one shape. **The client calls my server, and my
server calls Google.** The credential lives only on the server. The address
the client sees is my endpoint, and what that endpoint returns is audio bytes.
With that, the original's flow — receive with `UnityWebRequest`, drop into an
`AudioSource` — **can be used as it is.** What changes is the address and the
error handling.

A post that reached the same conclusion by a different route is
[Reading a Unity Gemini client](/en/posts/unity-gemini-client/). There the
problem was a key going into the build; here it's a scope **so broad you can't
put it in at all.**

I won't quote prices. The documentation page I read **states no free
per-character allowance.** There are the phrases "$300 in free credit" and
"20+ always-free products", but neither is a figure tied to TTS. If you're
going to use it, read the pricing page directly.

There's a local option too. Calling the platform's built-in TTS (Android, iOS,
Windows) through a plugin — no network, no credential. In exchange, voice
quality and available languages depend on the device. What Asset Store TTS
assets actually depend on is written up in
[Revisiting the DeepVoice AI asset](/en/posts/deepvoice-unity-asset/).

## Where and why you'd use it

### A working example

The original's structure kept, with the five items above fixed. **The address
is an endpoint I control** — that being this post's conclusion. You can paste
the Google Translate address in for a prototype, but even then the error
handling and encoding have to be there for you to see the symptoms.

```csharp file="Scripts/Audio/TextToSpeechPlayer.cs"
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

[RequireComponent(typeof(AudioSource))]
public class TextToSpeechPlayer : MonoBehaviour
{
    private const int MaxTextLength = 200;

    [Header("Endpoint")]
    [Tooltip("The credential lives only on the server. The client knows this URL.")]
    [SerializeField]
    private string _endpoint = "https://tts.example.com/speak";

    [Header("Playback")]
    [SerializeField]
    private AudioSource _audioSource;

    private readonly StringBuilder _urlBuilder = new StringBuilder();
    private Coroutine _running;

    // Awake, not Start, so the references aren't empty if another
    // script's Awake calls Speak.
    private void Awake()
    {
        if (_audioSource == null && !TryGetComponent(out _audioSource))
        {
            Debug.LogError("There is no AudioSource.", this);
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

        // Drop the previous request if it's still running. With a single
        // source, late audio would otherwise overwrite the new audio.
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

        // The spot the docs name for "any text supplied by a user".
        _urlBuilder.Append(UnityWebRequest.EscapeURL(text.Replace('\n', '.')));

        using (UnityWebRequest request =
                   UnityWebRequestMultimedia.GetAudioClip(_urlBuilder.ToString(),
                                                          AudioType.MPEG))
        {
            yield return request.SendWebRequest();

            // Anything that isn't Success is a failure. Check only
            // ConnectionError and Protocol/DataProcessingError read as success.
            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"TTS failed [{request.result}] " +
                                 $"{request.responseCode} {request.error}", this);
                yield break;
            }

            AudioClip clip = DownloadHandlerAudioClip.GetContent(request);

            // The docs say "or null".
            if (clip == null)
            {
                Debug.LogWarning("The response was not audio.", this);
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

        // A clip created at runtime gets destroyed by hand on replacement.
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

There's a reason `_audioSource` and `clip` don't use `?.`. Both are
`UnityEngine.Object`, and a reference left empty in the inspector can end up
in a state that **looks like null without being C#'s null.** So the
comparisons are `== null` and `!= null`. For a plain C# object `?.` is right.

Moving initialization from `Start` to `Awake` has a reason too. The original
creates `mPrefixURL` and `mStrBuilder` in `Start`. If another script's `Awake`
calls `RunTTS`, `mStrBuilder` is still `null`. Moving it down to `Awake`
removes the dependence on call order.

### How to choose

| Situation | What to use |
| --- | --- |
| **You have a dialogue table and know it all at build time** | **Synthesize before the build** and bring it in as audio assets |
| So much dialogue that shipping it all bloats the package | Via my server + credential on the server only |
| Sentences assembled at runtime | Via my server + credential on the server only |
| Reading user input (chat, names) | Via server + `EscapeURL` + length cap + content filter |
| Must work without a network | The platform's built-in TTS through a plugin |
| A prototype just to see the flow | Any address. But put the error handling and encoding in |

**The first row is this post's use case.** Reading in-game dialogue without
recording it is finished at build time. Going down the rows, each one adds a
reason to keep something at runtime.

The user-input row doesn't end with encoding, either. A length cap and a
content filter have to live on the server. What ends up mixed into text you
pass straight to an outside service isn't something the client gets to decide.

### Where not to use it

- **Calling `translate.google.com/translate_tts` from a shipped build.** Not a
  documented means of access (terms 2(c)), and no document states its response
  shape.
- **Judging failure by `result == ConnectionError` alone.** Anything that
  isn't `Success` is a failure. There are five values.
- **Dropping `GetContent`'s return into `clip` with no null check.** The docs
  say "or `null`".
- **Putting user text into a URL without `EscapeURL`.** The docs name that
  function for "any text supplied by a user".
- **Putting a `cloud-platform` scope credential in a client.** It isn't a
  TTS-only scope.
- **Overwriting `clip` and leaving the previous one.** A clip created at
  runtime gets destroyed on replacement.
- **Synthesizing at runtime what you already know at build time.** You buy the
  failure handling, the credential, the latency and the offline problem, and
  you get to use none of the audio import settings.

## Summary

- The address the original calls is **an internal address of the Google
  Translate web UI** (`client=tw-ob`). Not a documented API, and terms 2(c)
  permits only "by the means described in the documentation". No document
  states its response shape either.
- **`UnityWebRequest.Result` has five values** and the code checks only
  `ConnectionError`. The case where the server **answers** with something that
  isn't audio is `ProtocolError` or `DataProcessingError`, and both land in
  the success branch.
- In that branch `GetContent` returns **"or `null`"**, and the code drops it
  into `clip` and calls `Play()`. **The symptom is silence, with no log.**
- User text goes in **with no URL encoding.** `UnityWebRequest.EscapeURL`'s
  description names "any text supplied by a user" as exactly that spot.
- `textlen=32` is a **fixed value**, and there's no document to check what the
  parameter does. The length limit is unknown for the same reason.
- The replaced `AudioClip` is never destroyed, so **runtime clips pile up.**
- Using a single audio source is **right.** The reference states that
  `AudioSource.Play` assumes a new clip on every call.
- The documented Cloud Text-to-Speech requires the **`cloud-platform` scope**
  on `text:synthesize`. Being whole-project, **it can't sit in a client.**
- So the conclusion splits by use. **If the dialogue is all there at build
  time, there is no reason to call at runtime** — synthesize ahead and bring
  it in as assets, and the problems above all disappear while the audio import
  settings (`Load Type`, `Compression Format`, per-platform overrides) become
  available. Leave only build-time-unknown text at runtime, and route that
  through a server.

---

### References

- [UnityWebRequest.Result — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequest.Result.html)
- [UnityWebRequest.EscapeURL — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequest.EscapeURL.html)
- [UnityWebRequestMultimedia.GetAudioClip — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.UnityWebRequestMultimedia.GetAudioClip.html)
- [DownloadHandlerAudioClip.GetContent — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Networking.DownloadHandlerAudioClip.GetContent.html)
- [AudioType — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioType.html)
- [AudioSource.Play — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Play.html)
- [Audio Clip Import Settings reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Google APIs Terms of Service](https://developers.google.com/terms)
- [Cloud Text-to-Speech documentation](https://docs.cloud.google.com/text-to-speech/docs)
- [text:synthesize — Cloud Text-to-Speech REST reference](https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize)

The starting point for this post was
[\[유니티\] TTS(Text-To-Speech) 목소리 구현](https://bonnate.tistory.com/108)
(bonnate, 2022-08-05), in Korean. The sample code and the design intent are
carried over as written, and the Korean comments inside the code are the
original author's. I checked each line against the current Unity 6.6 scripting
reference and against Google's documentation and terms. Checked on 2026-10-09.
