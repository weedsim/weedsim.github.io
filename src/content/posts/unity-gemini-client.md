---
pubDatetime: 2026-08-28T15:00:00+09:00
title: "Unity용 Gemini 클라이언트를 뜯어보다: 클라이언트에 API 키를 넣는다는 것"
lang: ko
translationKey: unity-gemini-client
featured: false
draft: false
tags:
  - Unity
  - Gemini
  - AI
  - API
  - 보안
description: "asus4/google-gemini-unity는 Unity에서 Gemini API를 부르는 비공식 클라이언트다. 설치 절차와 의존성 체인을 정리하고, README가 안내하는 .env 방식이 배포 빌드에서 왜 성립하지 않는지, 그럼 무엇을 써야 하는지까지 짚었다."
---

Unity에 Gemini를 붙일 수 있는 라이브러리나 오픈소스가 있나 하고 찾아보다가
[asus4/google-gemini-unity](https://github.com/asus4/google-gemini-unity)를
스크랩해뒀었다. Gemini API의 비공식 Unity 클라이언트고, MIT 라이선스다.

만든 사람은 [asus4(Koki Ibukuro)](https://github.com/asus4)로,
[tf-lite-unity-sample](https://github.com/asus4/tf-lite-unity-sample)을 비롯해
Unity에 ML 런타임을 붙이는 작업을 오래 해온 쪽이다. 그래서 구현 자체를
의심할 이유는 별로 없다.

결론부터 말하면 "쓸 만한 게 있긴 하다". 다만 그대로 갖다 쓸 수 있느냐는
다른 문제다. README를 그대로 따라가면 **API 키를 클라이언트에 넣는 구조**가
되는데, 이건 프로토타입에서는 멀쩡하게 돌아가고 배포 시점에 터지는 종류의
설계다. 이 글은 패키지 정리 반, 그 지점에 대한 정리 반이다.

## 목차

## 무엇을 하는 패키지인가

README의 표현은 짧다.

> Non-official Google Gemini API client for Unity. Limited use cases are
> currently supported.

예제 씬으로 지원 범위를 짐작할 수 있다.

- **BasicChatExample** — 텍스트 생성과 스트리밍
- **VisionExample** — 이미지 이해
- **AudioExample** — 오디오 이해
- **FunctionCallingExample** — Gemini가 C# 함수를 호출
- **TextToSpeechExample** — 음성 합성

즉 Gemini API의 멀티모달 입력과 함수 호출을 Unity 쪽에서 쓸 수 있게 감싼
래퍼다. `package.json` 기준으로 Unity **2022.3** 이상이고, 의존하는 Unity
모듈은 audio, imageconversion, unitywebrequest, unitywebrequestaudio,
unitywebrequesttexture다. 통신은 `UnityWebRequest`로 하고 있다는 뜻이다.

README의 설치 줄과 `package.json`이 모두 **v0.2.8**을 가리킨다. 스크랩
시점(2025년 12월)의 README와 같은 버전이다. GitHub Releases는 비어 있고
태그만 있는 저장소라 릴리스 노트로 변화를 따라가기는 어렵다. 0.x대라는 것과
README가 스스로 "limited use cases"라고 적어둔 것을 같이 놓고 보면, 안정된
SDK라기보다 예제와 함께 읽는 참고 구현에 가깝다.

## 설치가 왜 이렇게 복잡한가

README의 설치 절차는 UPM 한 줄로 끝나지 않고 사전 작업이 붙는다. 이유는
이 패키지가 **System.Text.Json**에 의존하기 때문이다.

Unity 패키지 매니저(UPM)는 NuGet을 모른다. 그래서 .NET 라이브러리를 들이려면
중간에 다리가 하나 필요하고, 그 다리가 NuGetForUnity다. 그리고
NuGetForUnity와 UniTask는 Unity 공식 레지스트리에 없으니 OpenUPM을 스코프드
레지스트리로 등록해야 한다. 절차가 세 단계로 늘어나는 게 이 때문이다.

1. `Packages/manifest.json`에 OpenUPM을 스코프드 레지스트리로 추가하고
   NuGetForUnity를 의존성에 넣는다.
2. 메뉴에서 `NuGet` → `Manage NuGet Packages`를 열어 `System.Text.Json`을
   설치한다.
3. 그다음에야 이 패키지를 UPM으로 설치한다.

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

정리하면 이 패키지 하나를 넣기 위해 프로젝트에 들어오는 것은
**System.Text.Json + NuGetForUnity + UniTask + OpenUPM 레지스트리**다.
UniTask는 Unity에서 할당 없는 `async`/`await`를 쓰기 위한 사실상 표준에
가까운 라이브러리라 이미 있는 프로젝트도 많지만, 나머지는 이 패키지 때문에
새로 들어오는 것들이다. 사내 프로젝트에서 외부 레지스트리 추가에 절차가
걸려 있다면 여기서 먼저 막힌다.

### 문서와 실제가 어긋나는 곳

사소하지만 하나 짚어둔다. README의 예시는 NuGetForUnity를 `4.3.0`으로
적어두는데, 패키지의 `package.json`이 선언한 의존성은 `4.4.0`이다.

- [README](https://github.com/asus4/google-gemini-unity) —
  `"com.github-glitchenzo.nugetforunity": "4.3.0"`
- `package.json` — `com.github-glitchenzo.nugetforunity: 4.4.0`

UPM이 더 높은 쪽으로 해석하므로 실제로 깨지지는 않는다. 다만 README를 그대로
복사해 넣고 나서 매니페스트에 적힌 버전과 실제 설치된 버전이 다른 것을 보고
헷갈릴 수는 있다.

## 여기서 멈춰야 하는 지점

README의 API 키 안내는 이렇다.

> 1. Enable API key at Google Cloud
> 2. Put `.env` file in the project root with the following content:
>    `GOOGLE_API_KEY=abc123`

프로토타입을 굴리기에는 가장 간단한 방법이고, 그 목적에서는 문제가 없다.
문제는 이 구조를 그대로 두고 앱을 배포할 때다.

Gemini API 공식 문서는 이 부분을 단정적으로 쓴다.

> Never expose keys client-side in production: Do not hardcode API keys
> directly in web or mobile apps. Keys compiled in client-side code can be
> extracted by users.

> To secure client-side apps, run a backend proxy server to make the actual
> API calls.

여기서 중요한 건 `.env` 파일이 빌드에 포함되느냐 아니냐가 **논점이 아니라는
것**이다. 클라이언트가 Gemini API를 직접 호출한다면, 호출 시점에 키가
프로세스 안에 있어야 한다. 그러면 그 값은 어떤 형태로든 빌드 산출물 안에
들어 있다. Resources의 텍스트 에셋이든, ScriptableObject 필드든, 문자열
상수든, 난독화를 걸어둔 바이트 배열이든 마찬가지다. 저장 위치를 바꾸는 것은
난이도를 조금 올릴 뿐 성질을 바꾸지 못한다.

그리고 안드로이드 빌드라면 그 산출물은 기기에서 파일 하나로 꺼내올 수 있는
APK다. 앞 글에서 다뤘듯 APK는 그냥 파일이고, 설치된 앱에서 다시 뽑아낼 수
있다. 배포한 순간부터 키는 "내 것"이 아니다.

유출됐을 때 무슨 일이 생기는지도 분명하다. Gemini API 키는 Google Cloud
프로젝트에 묶여 있고 사용량만큼 과금된다. 키가 새면 **모르는 사람이 내
프로젝트 요금으로 호출한다.** 게임 안에서 쓰라고 넣어둔 키가 전혀 다른
서비스의 백엔드로 쓰이는 상황이 된다.

### 덧붙여, 키 발급 경로

README는 Google Cloud 콘솔에서 키를 만들라고 안내하는데, 지금 Gemini API의
표준 경로는 [Google AI Studio](https://aistudio.google.com/apikey)다. 공식
문서는 모든 Gemini API 키가 Google Cloud 프로젝트에 연결된다고 설명하면서도,
발급은 AI Studio에서 하도록 안내한다. 기존 Cloud 프로젝트가 있다면 AI
Studio로 import해서 쓰는 방식이다.

그리고 `.env`는 당연히 버전 관리에서 빼야 한다. `.gitignore`에 `.env`가
있는지부터 확인하고 시작하는 게 좋다.

## 그럼 무엇을 쓰나

선택지는 크게 둘이다.

### 백엔드 프록시

공식 문서가 권하는 기본형이다. 키는 서버에만 두고, 클라이언트는 내 서버에
요청하고, 서버가 Gemini API를 호출해서 결과를 돌려준다. 키가 클라이언트에
없으므로 추출될 것도 없다.

부수적으로 얻는 것도 있다. 사용자별 호출 제한, 프롬프트 검증, 모델 교체와
프롬프트 수정을 앱 업데이트 없이 하는 것, 비용 모니터링이 전부 서버 쪽에서
가능해진다. 대신 서버를 하나 운영해야 한다.

### Firebase AI Logic

서버를 직접 짜기 싫다면 Google이 그 프록시 역할을 대신 해주는 경로가 있다.
**Firebase AI Logic**이고, 여기에는 **공식 Unity SDK**가 있다.
2025년 5월 발표 기준 Unity 2021 LTS 이상, Android와 iOS를 지원한다.
([Introducing Unity support in Firebase AI Logic](https://firebase.blog/posts/2025/05/ai-logic-unity-androidxr/))

설치는 Firebase Unity SDK를 받아 `FirebaseAI`와 `FirebaseAppCheck` 패키지를
임포트하는 방식이다.
([Get started](https://firebase.google.com/docs/ai-logic/get-started))

핵심은 `FirebaseAppCheck`가 같이 들어간다는 점이다. App Check는 "이 요청이
정말 내 앱에서 온 것인가"를 검증하는 장치다. 공식 문서는 Firebase가 AI
Logic에 대해 App Check를 자동으로 적용한다고 설명하고, 기능을 실제 사용자에게
내보내기 전에 프로덕션 어테스테이션 공급자로 앱을 등록하라고 안내한다.

즉 클라이언트가 API를 직접 부르는 형태를 유지하되, 인증을 API 키가 아니라
앱 어테스테이션으로 바꾼 구조다. API 키 하나로 인증하는 방식의 근본 문제를
피해 가는 쪽이다.

비공식 클라이언트를 쓸 이유가 남는 경우는 있다. Firebase를 프로젝트에 넣고
싶지 않거나, 데스크톱·에디터 환경이라 Firebase Unity SDK의 지원 플랫폼
(Android/iOS)에서 벗어나거나, Gemini API의 특정 기능을 직접 다뤄야 하는
경우다. 그때는 위의 백엔드 프록시와 조합하는 게 맞다.

## IL2CPP 빌드에서 확인할 것

이건 이 패키지의 문제라기보다 **System.Text.Json을 Unity에 들일 때 공통으로
확인해야 하는 항목**이다.

System.Text.Json의 기본 경로는 리플렉션 기반이다. 그런데 IL2CPP는 AOT
컴파일이고, 코드 스트리핑도 함께 돈다. Microsoft 문서는 이 조합의 성질을
이렇게 설명한다.

> certain reflection APIs can't be used in Native AOT applications, so you
> must use source generation for those apps.

그래서 대안으로 소스 제너레이션을 둔다.

> As an alternative, `System.Text.Json` can use the C# source generation
> feature to improve performance, reduce private memory usage, and facilitate
> assembly trimming, which reduces app size.

실제로 Unity IL2CPP에서 System.Text.Json이 걸리는 사례는 .NET 런타임
저장소에도 이슈로 올라와 있다.
([dotnet/runtime#49772](https://github.com/dotnet/runtime/issues/49772))

이 패키지가 소스 제너레이션을 쓰는지는 소스를 직접 열어봐야 알 수 있고 나는
확인하지 않았다. 다만 순서는 분명하다. **에디터에서 잘 돌았다고 안심하지 말고,
실기기 IL2CPP 빌드에서 한 번 태워보고 판단할 것.** 에디터는 Mono라 리플렉션이
그냥 되기 때문에, 이 종류의 문제는 기기 빌드에서 처음 드러난다. 문제가 나면
`link.xml`로 스트리핑을 막거나 `JsonSerializerContext` 기반 경로로 바꾸는
쪽을 보게 된다.

## 그래서 이 패키지는 어디에 쓰나

정리하면 이렇게 갈린다.

- **프로토타입, 사내 도구, 에디터 확장** — 적합하다. 키가 내 PC 밖으로 나가지
  않고, 예제 씬 다섯 개가 Gemini의 기능 범위를 빠르게 확인시켜준다.
- **배포하는 게임·앱** — 이 구조 그대로는 안 된다. 백엔드 프록시를 두거나
  Firebase AI Logic으로 가야 한다.
- **참고 구현으로 읽기** — `UnityWebRequest`로 Gemini의 스트리밍과 멀티모달
  입력을 어떻게 다루는지 보기에는 좋은 코드다. MIT라 필요한 부분만 떼어
  프록시 클라이언트로 고쳐 쓰는 것도 가능하다.

## 정리

- `asus4/google-gemini-unity`는 Gemini API의 비공식 Unity 클라이언트다.
  Unity 2022.3+, MIT, 현재 v0.2.8이고 스스로 "limited use cases"라고 밝힌다.
- 설치에 System.Text.Json, NuGetForUnity, UniTask, OpenUPM 레지스트리가
  따라 들어온다. README와 `package.json`의 NuGetForUnity 버전이 다르지만
  UPM이 높은 쪽으로 해석해 실제로는 문제되지 않는다.
- README의 `.env` 방식은 프로토타입 전제다. 클라이언트가 API를 직접 호출하는
  한 키는 빌드 안에 있고, 저장 위치를 바꿔도 성질은 그대로다.
- 배포한다면 백엔드 프록시를 두거나, 공식 Unity SDK가 있는 Firebase AI Logic
  으로 간다. 후자는 인증을 API 키에서 App Check 어테스테이션으로 바꾼다.
- System.Text.Json은 IL2CPP에서 리플렉션 문제가 나올 수 있다. 에디터가 아니라
  실기기 빌드에서 확인할 것.

## 참고

- [asus4/google-gemini-unity](https://github.com/asus4/google-gemini-unity)
- [Using Gemini API keys — Google AI for Developers](https://ai.google.dev/gemini-api/docs/api-key)
- [Get started with the Gemini API using the Firebase AI Logic SDKs](https://firebase.google.com/docs/ai-logic/get-started)
- [Introducing Unity support in Firebase AI Logic](https://firebase.blog/posts/2025/05/ai-logic-unity-androidxr/)
- [Reflection versus source generation in System.Text.Json — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/reflection-vs-source-generation)
- [UniTask](https://github.com/Cysharp/UniTask) / [NuGetForUnity](https://github.com/GlitchEnzo/NuGetForUnity)
