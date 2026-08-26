---
pubDatetime: 2026-08-26T12:00:00+09:00
title: "Unity 광고 미디에이션 정리: 워터폴이 끝나고 비딩만 남았다"
lang: ko
translationKey: unity-ads-mediation
featured: false
draft: false
tags:
  - Unity
  - LevelPlay
  - 광고
  - 수익화
  - 모바일
  - SDK
description: "미디에이션이 무엇이고 워터폴과 인앱 비딩이 어떻게 다른지, 그리고 클라이언트 개발자 입장에서 이 SDK가 빌드에 무엇을 붙이는지 정리했다."
---

모바일 게임이 돈을 어떻게 버는지가 궁금해서 이것저것 보다가, Unity 매뉴얼의
**Ads Mediation** 페이지를 스크랩해뒀었다. 한 장짜리 패키지 소개 페이지고
설명은 짧다. 기능 목록에 "인앱 비딩, 워터폴 광고 전략, A/B 테스트, 크로스
프로모션"이 나열되어 있는 정도다.

목록만 봐서는 각각이 뭔지 알 수 없어서 찾아보게 됐는데, 확인해보니 **그 목록
중 하나가 이미 폐지 단계에 들어가 있었다.** 그리고 패키지 버전은 그 사이
**1.0.0에서 9.5.1**이 됐다.

그래서 두 가지를 정리한다. 미디에이션이 대체 무엇인지, 그리고 지금 기준으로
뭐가 달라졌는지.

## 목차

## 미디에이션이 무엇인가

Unity 공식 문서의 정의가 간결하다.

> Unity LevelPlay는 앱 개발자가 **하나의 SDK로** 여러 광고 네트워크를 관리하고
> 최적화할 수 있게 해주는 수익화 솔루션이다. 여러 광고 네트워크에 앱의 광고
> 인벤토리를 열어주어, **네트워크들이 자기 광고를 내보내려고 경쟁하는 무대**를
> 만든다.

핵심은 "경쟁"이다. 광고 네트워크 하나만 붙이면 그 네트워크가 부르는 값이 곧
내 단가다. 여러 곳을 붙여 경쟁시키면 같은 노출을 더 비싸게 팔 수 있다.

미디에이션은 그 경쟁을 붙이는 중개 계층이고, 개발자 입장에서는 **네트워크마다
SDK를 따로 붙이지 않아도 되게 해주는 것**이기도 하다.

## 워터폴과 인앱 비딩

경쟁을 붙이는 방식이 두 가지다. 이게 이 글에서 가장 중요한 부분이다.

### 워터폴 — 줄 세워서 순서대로

네트워크를 **eCPM 순으로 정렬해두고 위에서부터 차례로 호출**하는 방식이다.

1. eCPM이 가장 높은 네트워크를 먼저 부른다
2. 그 네트워크가 채울 광고가 없으면 다음으로 내려간다
3. 채워질 때까지 반복

이름 그대로 물이 위에서 아래로 떨어지는 모양이다. eCPM은 노출 1,000회당 단가고,
퍼블리셔가 네트워크별·플레이스먼트별로 목표 가격대를 지정한다.

문제는 이게 **정적인 순서**라는 점이다. 실제 이번 노출에 어느 네트워크가 얼마를
낼 의향이 있는지와 무관하게, 미리 정해둔 줄대로 부른다. 그래서 운영이 까다롭다.
공식 문서의 권고만 봐도 그렇다.

- 가격대를 너무 촘촘히 두지 말 것 — **0.25달러 이내로 붙여두면** 복잡도가
  수익 이득을 거의 확실히 넘어선다
- 같은 eCPM 목표를 **3일에 한 번 넘게 바꾸지 말 것** — 안정화 시간이 필요하다
- 지역과 장르에 따라 단가가 크게 다르니 그것도 감안할 것

### 인앱 비딩 — 매번 실시간 경매

**노출이 생길 때마다 여러 네트워크가 동시에 입찰**하고, 가장 높이 부른 쪽이
가져간다. 줄 세워둔 순서가 아니라 그 순간의 실제 값으로 정해진다.

수동으로 가격대를 관리할 필요가 없고, 노출 하나하나의 값을 제대로 찾아낸다.

### 그리고 워터폴은 끝나는 중이다

이게 스크랩 당시와 지금의 가장 큰 차이다. 공식 문서 상단에 이렇게 붙어 있다.

> Waterfall placements are no longer supported being phased out. Starting
> August 11, 2026, you can no longer create new waterfall placements. Any
> placements not converted to bidding or archived by this date will no longer
> be editable, but will continue to serve ads.

정리하면 이렇다.

| 시점 | 상태 |
|---|---|
| 2026-08-11 이전 | 워터폴 플레이스먼트 신규 생성 가능 |
| **2026-08-11 이후** | **신규 생성 불가** |
| 그 시점까지 비딩으로 전환하거나 보관하지 않은 것 | **편집 불가.** 다만 **광고는 계속 서빙됨** |

즉 기존 플레이스먼트가 갑자기 죽지는 않는다. **다만 손을 댈 수 없게 된다.**
운영 중인 프로젝트가 있다면 확인해볼 만한 지점이다.

(참고로 인용한 첫 문장은 원문이 그대로 저렇다. `are no longer supported being
phased out`은 문장이 꼬여 있는데, 편집 흔적으로 보인다.)

## 버전과 문서 위치가 바뀌었다

스크랩한 페이지는 **Unity 2023.2 / 패키지 1.0.0** 기준이었다. 지금은 이렇다.

| | 스크랩 시점 | 현재 |
|---|---|---|
| 패키지 버전 | 1.0.0 | **9.5.1** |
| 패키지 ID | `com.unity.services.levelplay` | 동일 |
| 상세 문서 | `developers.is.com/monetization/` | `docs.unity.com/en-us/grow/levelplay/` |

패키지 ID는 그대로지만 **버전이 1.x에서 9.x로 건너뛰었다.** 상세 문서도
ironSource 도메인에서 Unity 도메인으로 옮겨왔다. 오래된 자료의 링크를 따라가면
엉뚱한 곳으로 간다.

지원 플랫폼은 이렇다.

- **Android** — 4.4 (API 레벨 19) 이상
- **iOS** — 13 이상, Xcode 16 이상
- **에디터** — 지원 버전 및 LTS 버전

## 클라이언트 개발자가 실제로 하는 일

여기부터가 실무다.

### 설치

패키지 매니저에서 **Ads Mediation**을 찾아 설치하거나, 패키지 이름으로 추가한다.

```text
com.unity.services.levelplay
```

### 초기화

네임스페이스는 `Unity.Services.LevelPlay`다.

```csharp
public void Start() {
    // 초기화 성공·실패 리스너 등록
    LevelPlay.OnInitSuccess += SdkInitializationCompletedEvent;
    LevelPlay.OnInitFailed += SdkInitializationFailedEvent;
    // SDK 초기화
    LevelPlay.Init("ThisIsYourAppKey");
}
```

**리스너를 `Init` 호출 전에 등록하는 순서**를 지켜야 한다. 초기화가 빨리
끝나버리면 나중에 붙인 핸들러는 이벤트를 놓친다.

`LevelPlay` 클래스에는 이런 것들이 더 있다.

| 멤버 | 용도 |
|---|---|
| `Init(appKey, userId = null)` | SDK 초기화 |
| `ValidateIntegration()` | 통합 상태 검증 |
| `LaunchTestSuite()` | 테스트 스위트 실행 |
| `SetPauseGame(bool)` | 광고 중 게임 일시정지 |
| `SetDynamicUserId(string)` | 리워드 콜백용 사용자 ID |
| `SetMetaData(key, value)` | 부가 플래그 설정 |
| `OnImpressionDataReady` | 노출 이벤트 — **백그라운드 스레드에서 호출됨** |
| `PluginVersion` / `UnityVersion` | 버전 문자열 |

`OnImpressionDataReady`가 백그라운드 스레드라는 점은 기억해둘 만하다. 여기서
Unity API를 직접 건드리면 안 된다.

### 테스트 스위트

기기에서 통합 상태와 네트워크 설정을 확인할 수 있는 도구가 있다.

```csharp
// SDK 초기화 전에 활성화
LevelPlay.SetMetaData("is_test_suite", "enable");

// 초기화 성공 후 실행
LevelPlay.LaunchTestSuite();
```

`SetMetaData`는 **초기화 전**, `LaunchTestSuite`는 **초기화 성공 후**다.
순서가 반대면 동작하지 않는다.

### 빌드에 무엇이 붙는가

이게 클라이언트 개발자에게 가장 중요한 부분이다. 미디에이션 SDK는 자기 혼자
들어오지 않는다. **광고 네트워크마다 어댑터와 의존성이 따라온다.**

- **어댑터** — v8.8.1부터 Unity Ads와 ironSource Ads 어댑터가 기본 설치된다.
- **Android 의존성** — `Assets > Mobile Dependency Manager > Android Resolver >
  Resolve`로 네트워크 의존성을 내려받는다. 컴파일 시 Gradle 파일에 추가된다
  (MDR 8.10.0 이상에서 자동).
- **Android 권한** — Android 13(API 33) 이상에서 광고 ID 권한이 붙는다.

  ```xml
  <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
  ```

- **iOS Info.plist** — SKAdNetwork ID가 자동으로 추가된다 (v9.1.0 이상, LevelPlay
  Network Manager 경유).

네트워크를 늘릴수록 이 목록이 길어진다. **빌드 크기, 의존성 충돌, 권한 고지**가
전부 여기서 나온다. 광고를 붙인다는 건 SDK 하나를 넣는 일이 아니라 **의존성
트리를 하나 들이는 일**이다.

광고 포맷별(리워드·전면·배너) 구현은 각각 별도 문서로 나뉘어 있다.

## 정리

- 미디에이션은 **여러 광고 네트워크를 경쟁시키는 중개 계층**이고, 개발자에게는
  네트워크별 SDK를 각각 붙이지 않아도 되게 해주는 것이기도 하다.
- 경쟁 방식이 둘이었다. **워터폴**은 eCPM 순으로 줄 세워 순차 호출,
  **인앱 비딩**은 매 노출마다 실시간 경매.
- **워터폴은 2026년 8월 11일부터 신규 생성이 막혔다.** 기존 것은 계속 서빙되지만
  편집할 수 없다. 사실상 비딩만 남는다.
- 패키지는 **1.0.0에서 9.5.1**이 됐고 상세 문서도 Unity 도메인으로 옮겨왔다.
  오래된 자료의 링크와 버전은 믿으면 안 된다.
- 코드에서 지켜야 할 순서가 있다. **리스너 등록 → `Init`**, 그리고
  **`SetMetaData` → 초기화 → `LaunchTestSuite`**.
- 그리고 실제 부담은 API가 아니라 **빌드에 딸려 오는 것들**이다. 어댑터,
  Gradle 의존성, `AD_ID` 권한, SKAdNetwork ID.

---

### 참고

- [Ads Mediation — Unity 매뉴얼](https://docs.unity3d.com/6000.1/Documentation/Manual/com.unity.services.levelplay.html)
- [Unity Package integration — Unity LevelPlay 문서](https://docs.unity.com/en-us/grow/levelplay/sdk/unity/package-integration)
- [Introduction to Unity LevelPlay](https://docs.unity.com/en-us/grow/levelplay/platform/get-started/introduction)
- [Waterfall strategy](https://docs.unity.com/en-us/grow/ads/waterfall-strategy)
- [Class LevelPlay — API 레퍼런스](https://docs.unity3d.com/Packages/com.unity.services.levelplay@9.4/api/Unity.Services.LevelPlay.LevelPlay.html)

이 글의 출발점이 된 자료는 Unity 매뉴얼의 **Ads Mediation** 페이지(2023.2 판)다.
항목 구성을 참고했고, 버전·API·정책은 현행 문서로 다시 대조했다. 확인 시점은
2026-08-26이다.
