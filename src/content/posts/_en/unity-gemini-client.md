---
pubDatetime: 2026-08-28T15:00:00+09:00
title: "Reading a Unity Gemini Client: What It Means to Put an API Key in the Client"
lang: en
translationKey: unity-gemini-client
featured: false
draft: false
tags:
  - Unity
  - Gemini
  - AI
  - API
  - Security
description: "asus4/google-gemini-unity is an unofficial client for calling the Gemini API from Unity. The install steps and the dependency chain, why the .env approach the README describes doesn't hold up in a shipped build, and what to use instead."
---

Looking around for a library or open-source project that would let me wire
Gemini into Unity, I ended up clipping
[asus4/google-gemini-unity](https://github.com/asus4/google-gemini-unity).
It's an unofficial Unity client for the Gemini API, MIT licensed.

It's written by [asus4 (Koki Ibukuro)](https://github.com/asus4), who has been
attaching ML runtimes to Unity for a long time —
[tf-lite-unity-sample](https://github.com/asus4/tf-lite-unity-sample) among
others. So there isn't much reason to doubt the implementation itself.

The short answer to my question is "yes, something usable exists." Whether you
can take it as-is is a different matter. Follow the README literally and you
end up **putting the API key in the client**, which is the kind of design that
runs fine in a prototype and blows up at release. This post is half a write-up
of the package and half a write-up of that point.

## Table of contents

## What the package does

The README puts it briefly.

> Non-official Google Gemini API client for Unity. Limited use cases are
> currently supported.

The example scenes give you a sense of the coverage.

- **BasicChatExample** — text generation and streaming
- **VisionExample** — image understanding
- **AudioExample** — audio understanding
- **FunctionCallingExample** — Gemini calling C# functions
- **TextToSpeechExample** — speech synthesis

So it's a wrapper that exposes the Gemini API's multimodal input and function
calling to Unity. `package.json` puts the minimum at Unity **2022.3**, and the
Unity modules it depends on are audio, imageconversion, unitywebrequest,
unitywebrequestaudio and unitywebrequesttexture — meaning the transport is
`UnityWebRequest`.

Both the README's install line and `package.json` point at **v0.2.8**, the
same version as in the README when I clipped it (December 2025). GitHub
Releases is empty and the repository only carries tags, so release notes
aren't a way to follow what's changed. Between the 0.x version and the
README's own "limited use cases," this reads less like a stable SDK and more
like a reference implementation you read alongside the examples.

## Why installation takes three steps

The install isn't a single UPM line; there's setup in front of it. The reason
is that this package depends on **System.Text.Json**.

Unity's package manager (UPM) doesn't know about NuGet. Getting a .NET library
in therefore needs a bridge, and that bridge is NuGetForUnity. NuGetForUnity
and UniTask in turn aren't in Unity's official registry, so OpenUPM has to be
registered as a scoped registry. That's why the procedure stretches to three
steps.

1. Add OpenUPM as a scoped registry in `Packages/manifest.json` and put
   NuGetForUnity in the dependencies.
2. From the menu, open `NuGet` → `Manage NuGet Packages` and install
   `System.Text.Json`.
3. Only then install this package via UPM.

```json
"scopedRegistries": [
  {
    "name": "package.openupm.com",
    "url": "https://package.openupm.com",
    "scopes": [
      "com.cysharp.unitask",
      "com.github-glitchenzo.nugetforunity"
    ]
  }
],
"dependencies": {
  "com.github.asus4.google-gemini": "https://github.com/asus4/google-gemini-unity.git?path=Packages/com.github.asus4.google-gemini#v0.2.8"
}
```

Put another way, adding this one package brings **System.Text.Json +
NuGetForUnity + UniTask + an external registry** into the project. UniTask is
close to a de facto standard for allocation-free `async`/`await` in Unity and
plenty of projects already have it, but the rest arrive because of this
package. If your organisation has a process gate on adding external
registries, that's where you stop first.

### Where the docs and the package disagree

Minor, but worth noting. The README's example pins NuGetForUnity at `4.3.0`,
while the dependency declared in the package's `package.json` is `4.4.0`.

- [README](https://github.com/asus4/google-gemini-unity) —
  `"com.github-glitchenzo.nugetforunity": "4.3.0"`
- `package.json` — `com.github-glitchenzo.nugetforunity: 4.4.0`

UPM resolves to the higher one, so nothing actually breaks. It can be
confusing, though, to copy the README verbatim and then find the version in
your manifest differs from what's installed.

## The point where you have to stop

The README's API key instructions read:

> 1. Enable API key at Google Cloud
> 2. Put `.env` file in the project root with the following content:
>    `GOOGLE_API_KEY=abc123`

For getting a prototype running that's the simplest thing available, and for
that purpose it's fine. The problem is leaving this structure in place and
shipping the app.

The official Gemini API docs are categorical about it.

> Never expose keys client-side in production: Do not hardcode API keys
> directly in web or mobile apps. Keys compiled in client-side code can be
> extracted by users.

> To secure client-side apps, run a backend proxy server to make the actual
> API calls.

The important thing here is that whether the `.env` file ends up in the build
**is not the question**. If the client calls the Gemini API directly, the key
has to be inside the process at the moment of the call. Which means the value
is in the build output in some form — a text asset in Resources, a field on a
ScriptableObject, a string constant, an obfuscated byte array. Changing where
it's stored raises the difficulty a little; it doesn't change the nature of
the thing.

And for an Android build, that output is an APK you can pull off a device as a
single file. As covered in the previous post, an APK is just a file, and it
can be retrieved from an installed app. From the moment you ship, the key is
not exclusively yours.

What happens when it leaks is equally clear. A Gemini API key is tied to a
Google Cloud project and billed by usage. If the key gets out, **strangers
make calls on your project's bill.** A key you put in for use inside your game
becomes the backend of a completely different service.

### An aside on where keys come from

The README tells you to create the key in the Google Cloud console, but the
standard route for the Gemini API today is
[Google AI Studio](https://aistudio.google.com/apikey). The official docs
explain that every Gemini API key is associated with a Google Cloud project
while still directing you to AI Studio to issue one; if you already have a
Cloud project, you import it into AI Studio.

And `.env` obviously has to stay out of version control. Checking that
`.gitignore` covers `.env` is the place to start.

## So what do you use instead?

Broadly, two options.

### A backend proxy

The baseline the official docs recommend. The key lives only on the server,
the client calls your server, and the server calls the Gemini API and returns
the result. There's nothing to extract from the client because the key isn't
there.

You get some things incidentally, too: per-user rate limits, prompt
validation, swapping models and editing prompts without an app update, and
cost monitoring all become possible server-side. The cost is that you have a
server to operate.

### Firebase AI Logic

If you'd rather not write that server yourself, Google offers a path where it
plays the proxy role for you: **Firebase AI Logic**, which has an **official
Unity SDK**. As of the May 2025 announcement it supports Unity 2021 LTS and
onward on Android and iOS.
([Introducing Unity support in Firebase AI Logic](https://firebase.blog/posts/2025/05/ai-logic-unity-androidxr/))

Installation means downloading the Firebase Unity SDK and importing the
`FirebaseAI` and `FirebaseAppCheck` packages.
([Get started](https://firebase.google.com/docs/ai-logic/get-started))

The key detail is that `FirebaseAppCheck` comes along with it. App Check is
the mechanism that verifies "did this request really come from my app." The
official docs state that Firebase automatically enforces App Check for
Firebase AI Logic, and advise registering your app with a production
attestation provider before releasing the feature to end users.

In other words, it keeps the shape where the client calls the API directly,
but swaps the credential from an API key to app attestation — sidestepping the
underlying problem with authenticating by a single API key.

There are still reasons to reach for the unofficial client: you don't want
Firebase in the project, you're on desktop or in the editor and therefore
outside the Firebase Unity SDK's supported platforms (Android/iOS), or you
need to work with a specific Gemini API capability directly. In that case,
pair it with the backend proxy above.

## What to check in an IL2CPP build

This is less a problem with this package than a **standard checklist item for
bringing System.Text.Json into Unity at all**.

System.Text.Json's default path is reflection-based. IL2CPP, meanwhile, is
AOT-compiled and runs code stripping alongside. Microsoft's docs describe the
property of that combination like this:

> certain reflection APIs can't be used in Native AOT applications, so you
> must use source generation for those apps.

Hence source generation as the alternative.

> As an alternative, `System.Text.Json` can use the C# source generation
> feature to improve performance, reduce private memory usage, and facilitate
> assembly trimming, which reduces app size.

System.Text.Json running into trouble specifically under Unity IL2CPP has been
filed on the .NET runtime repository as well.
([dotnet/runtime#49772](https://github.com/dotnet/runtime/issues/49772))

Whether this package uses source generation is something you'd have to open
the source to find out, and I haven't checked. The ordering is clear, though:
**don't take "it worked in the editor" as reassurance — put it through an
IL2CPP build on a real device before deciding.** The editor runs Mono, where
reflection simply works, so this class of problem first surfaces in a device
build. If it does, the options you'll be looking at are blocking stripping
with `link.xml` or moving to a `JsonSerializerContext`-based path.

## So where does this package fit?

It splits about like this.

- **Prototypes, internal tools, editor extensions** — a good fit. The key
  never leaves your machine, and the five example scenes show you Gemini's
  feature range quickly.
- **A shipped game or app** — not in this shape. Put a backend proxy in front
  of it, or go with Firebase AI Logic.
- **Reading it as a reference implementation** — it's good code for seeing how
  Gemini's streaming and multimodal input are handled over `UnityWebRequest`.
  Being MIT, lifting the parts you need and reworking them into a proxy client
  is also on the table.

## Summary

- `asus4/google-gemini-unity` is an unofficial Unity client for the Gemini
  API: Unity 2022.3+, MIT, currently v0.2.8, and self-described as covering
  limited use cases.
- Installing it brings System.Text.Json, NuGetForUnity, UniTask and the
  OpenUPM registry along. The README and `package.json` disagree on the
  NuGetForUnity version, but UPM resolves to the higher one so it doesn't
  actually bite.
- The README's `.env` approach assumes a prototype. As long as the client
  calls the API directly, the key is in the build, and moving where it's
  stored doesn't change that.
- To ship, put a backend proxy in front, or use Firebase AI Logic, which has
  an official Unity SDK. The latter swaps the credential from an API key to
  App Check attestation.
- System.Text.Json can hit reflection problems under IL2CPP. Verify on a real
  device build, not in the editor.

## References

- [asus4/google-gemini-unity](https://github.com/asus4/google-gemini-unity)
- [Using Gemini API keys — Google AI for Developers](https://ai.google.dev/gemini-api/docs/api-key)
- [Get started with the Gemini API using the Firebase AI Logic SDKs](https://firebase.google.com/docs/ai-logic/get-started)
- [Introducing Unity support in Firebase AI Logic](https://firebase.blog/posts/2025/05/ai-logic-unity-androidxr/)
- [Reflection versus source generation in System.Text.Json — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/reflection-vs-source-generation)
- [UniTask](https://github.com/Cysharp/UniTask) / [NuGetForUnity](https://github.com/GlitchEnzo/NuGetForUnity)
