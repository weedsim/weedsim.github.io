---
pubDatetime: 2026-09-23T20:00:00+09:00
title: "PlayerPrefs의 경로는 Company Name과 Product Name으로 조립된다"
lang: ko
translationKey: playerprefs-storage-path
featured: false
draft: false
tags:
  - Unity
  - C#
  - 데이터
  - 윈도우
description: "저장 경로를 알려주는 짧은 글인데, 그 경로가 Player Settings 두 칸으로 조립된다는 게 요점이다. 그 두 칸을 바꾸면 저장한 데이터는 PlayerPrefs로 다시 못 읽는다."
---

설정 저장 기능을 붙여놓고 **값이 실제로 어디에 어떤 모양으로 저장되는지**를
확인하려다 스크랩한 글이다. `PlayerPrefs`가 윈도우에서 레지스트리 어디로
가는지를 알려주는 2022년 글로, 경로 세 줄과 `regedit` 여는 법이 전부인 짧은
글인데 "그래서 그게 어디 있냐"에는 바로 답이 나온다.

그런데 **그 경로에 `[company name]`과 `[product name]`이 들어 있다는 것
자체가 이 글의 진짜 내용**이다. 저장 위치가 프로젝트 설정 두 칸으로
조립된다는 뜻이고, 그러면 그 칸을 건드렸을 때 무슨 일이 생기는지가 따라온다.
클리핑은 경로만 주고 거기서 멈춘다.

그리고 클리핑이 올려둔 레지스트리 스크린샷에는 **키 이름이 이상하게 찍혀
있는데**, 왜 그런지는 설명이 없다.

## 목차

## 클리핑의 경로와 지금 문서의 경로

클리핑이 준 경로는 이렇다.

```
에디터:     HKEY_CURRENT_USER\Software\Unity\UnityEditor\[company name]\
에디터:     HKEY_CURRENT_USER\Software\[company name]\[project name]
Mac OS:     ~/Library/Preferences/unity.[company name].[product name].plist
```

현행 스크립팅 레퍼런스의 값과 나란히 놓으면 이렇다.

| | 클리핑 | 현행 문서 |
|---|---|---|
| 윈도우 에디터 | `…\Unity\UnityEditor\[company name]\` | `…\Unity\UnityEditor\ExampleCompanyName\`**`ExampleProductName`** |
| 윈도우 스탠드얼론 | `…\Software\[company name]\`**`[project name]`** | `…\Software\ExampleCompanyName\`**`ExampleProductName`** |
| macOS 에디터 | (구분 없음) | `~/Library/Preferences/com.ExampleCompanyName.ExampleProductName.plist` |
| macOS 스탠드얼론 | `unity.[company name].[product name].plist` | `~/Library/Preferences/ExampleBundleIdentifier.plist` |

차이가 네 군데다.

- **두 줄 모두 "에디터:"로 시작한다.** 둘째 줄은 스탠드얼론 경로다. 단순
  오타인데, 경로만 보러 온 사람에게는 치명적이다.
- **스탠드얼론 경로의 마지막 조각이 `[project name]`으로 적혀 있다.** 문서가
  가리키는 것은 **Product Name**이다. 다른 값이다 — 뒤에서 따로 본다.
- **에디터 경로가 `[company name]\`에서 끝난다.** 문서는 그 아래
  `[product name]`까지 내려간다.
- **macOS는 에디터와 스탠드얼론 경로가 다른데** 클리핑은 하나만 준다. 게다가
  `unity.[company].[product].plist` 형태는 지금 문서에 없다.

윈도우만 에디터와 빌드를 구분해놓고 macOS는 안 구분한 게 눈에 걸린다. **둘 다
구분된다.**

문서가 다루는 나머지 플랫폼도 적어둔다.

```
Linux:       ~/.config/unity3d/ExampleCompanyName/ExampleProductName
Android:     /data/data/pkg-name/shared_prefs/pkg-name.v2.playerprefs.xml
iOS:         NSUserDefaults standardUserDefaults API
Windows UWP: %userprofile%\AppData\Local\Packages\[ProductPackageId]\LocalState\playerprefs.dat
WebGL:       브라우저의 IndexedDB (최대 1MB)
```

## 경로는 설정 두 칸으로 조립된다

`[company name]`과 `[product name]`은 **Player Settings의 맨 위 두 칸**이다.
그 두 칸의 설명이 이 글의 핵심을 대신 말해준다.

> **Company Name** — 회사 이름을 입력한다. **Unity는 이 값을 preferences
> 파일을 찾는 데 사용한다.**

> **Product Name** — 애플리케이션이 실행 중일 때 메뉴 바에 표시될 이름을
> 입력한다. **Unity는 이 값도 preferences 파일을 찾는 데 사용한다.**

"표시용 이름"으로 읽기 쉬운 칸인데, 문서가 **두 칸 모두 "저장소를 찾는 데
쓴다"**고 명시한다. 즉 **이 두 칸이 곧 저장 경로다.**

여기서 따라오는 결론이 하나 있다. **두 칸 중 하나라도 바꾸면, 그 전에
저장한 데이터는 PlayerPrefs로 다시 못 읽는다.** 데이터가 지워진 건 아니다.
이전 경로에 그대로 남아 있다. 다만 `PlayerPrefs.GetInt`가 보는 곳이 새
경로로 바뀌었을 뿐이다. **증상은 "세이브가 날아갔다"로 보인다.**

`Product Name`은 특히 위험하다. 메뉴 바와 창 제목에 나오는 이름이라
**출시 직전에 고치고 싶어지는 칸**이기 때문이다. 그 시점에 고치면 그때까지
테스트하며 쌓인 설정이 전부 안 보이게 된다.

그리고 이게 **클리핑이 `[project name]`이라고 적은 것이 왜 문제인지**이기도
하다. 프로젝트 폴더 이름과 Product Name은 처음엔 같을 수 있지만, 같아야 할
이유가 없다. 경로를 직접 찾아가려는 사람이 폴더 이름으로 뒤지면 못 찾는다.

## 레지스트리에서 키 이름을 못 찾는 이유

클리핑의 스크린샷에 값 이름이 이상한 꼬리표를 달고 찍혀 있다. 문서가 예로
드는 형태가 이렇다.

```
DeckBase_h3232628825
```

`PlayerPrefs.SetInt("DeckBase", 3)`으로 저장해도 레지스트리에 들어가는
이름은 `DeckBase`가 아니라 **`DeckBase_h` + 숫자**다. 문서가 이유를 적는다.

> 윈도우는 키 이름을 해시한다. **대소문자를 구분하는 키 이름을 허용하고,
> 이름 충돌을 막고, PlayerPrefs API를 통해 쓰도록 보장하기 위해서다.**

실질적인 결과가 셋이다.

- **레지스트리에서 키 이름으로 검색하면 안 나온다.** `DeckBase`로 찾으면
  0건이고, `DeckBase_h`로 찾아야 나온다.
- **`SetInt("Score", …)`와 `SetInt("score", …)`는 다른 키다.** 해시가 다르니
  대소문자가 구분된다. 키 이름을 문자열 리터럴로 여기저기 흩어놓으면 오타
  하나가 조용히 새 키를 만든다.
- **레지스트리를 손으로 고쳐서 값을 주입하기 어렵다.** 해시를 직접 만들어야
  한다. 문서 표현으로 "PlayerPrefs API 사용을 보장"한다는 게 이 이야기다.

첫 번째와 두 번째는 바로 대응책이 나온다. **키 이름을 상수로 모아둔다.**

```csharp
public static class PrefKeys
{
    public const string MASTER_VOLUME = "Audio.MasterVolume";
    public const string LANGUAGE = "Locale.Language";
    public const string LAST_STAGE = "Progress.LastStage";
}
```

## 에디터와 빌드는 서로 다른 저장소다

윈도우 경로 두 줄이 다르다는 것은 **에디터에서 저장한 값과 빌드에서 저장한
값이 섞이지 않는다**는 뜻이다.

| | 저장 위치 |
|---|---|
| 에디터 플레이 | `…\Software\Unity\UnityEditor\[company]\[product]` |
| 빌드 실행 | `…\Software\[company]\[product]` |

실무에서 걸리는 지점이 둘이다.

- **에디터에서 `DeleteAll`로 초기화해도 빌드본은 그대로다.** "지웠는데 왜
  남아 있지"의 답이 여기 있다. 반대도 마찬가지다.
- **"처음 실행" 경로를 테스트하려면 에디터 쪽 키를 지워야 한다.** 빌드본
  레지스트리를 지워봐야 에디터 플레이에는 영향이 없다.

macOS도 같은 구조다. 에디터는 `com.[company].[product].plist`, 스탠드얼론은
번들 식별자 기반 plist로 갈린다.

## 저장은 언제 일어나나

경로를 찾아갔는데 값이 없는 또 다른 이유가 있다. **아직 안 써졌을 수
있다.** `PlayerPrefs.Save` 문서다.

> Unity는 **`OnApplicationQuit()` 중에 preferences를 자동으로 저장한다.**
> Universal Windows Platform에서는 애플리케이션 일시 중단 시점에 쓴다.

그러니 에디터 플레이를 멈추지 않은 채로 `regedit`을 열면 방금 `SetInt`한
값이 안 보일 수 있다. 정상이다.

명시적으로 쓰고 싶으면 `Save()`를 부르면 되는데, 문서가 단서를 단다.

> **PlayerPrefs를 쓰는 작업은 끊김을 유발할 수 있으므로, 게임플레이 중에는
> 이 함수를 호출하지 않는 것이 권장된다.**

그래서 부르는 자리가 정해진다. **설정 화면을 닫을 때, 스테이지가 끝났을 때
같은 경계 지점**이다. 매 프레임이나 값이 바뀔 때마다가 아니다.

## 어디에 왜 쓰나

`PlayerPrefs`는 **작고, 잃어버려도 게임이 안 망가지는 값**을 위한 것이다.
문서의 첫 문장이 범위를 정해준다.

> PlayerPrefs는 게임 세션 사이에 Player의 환경설정을 저장하는 클래스다.
> **string, float, integer 값**을 사용자 플랫폼 레지스트리에 저장할 수 있다.

타입이 셋뿐이라는 것도 그대로 힌트다. 구조를 담으라고 만든 게 아니다.

### 설정값을 다루는 얇은 래퍼

```csharp
using UnityEngine;

/// <summary>
/// PlayerPrefs 접근을 한곳에 모은다. 키 문자열이 흩어지지 않게 하는 것이 목적.
/// </summary>
public static class GameSettings
{
    private const string MASTER_VOLUME = "Audio.MasterVolume";
    private const string LANGUAGE = "Locale.Language";

    private const float DEFAULT_VOLUME = 0.8f;
    private const string DEFAULT_LANGUAGE = "ko";

    public static float MasterVolume
    {
        // 기본값 인자를 빼먹으면 0이 온다. 소리가 안 나는 버그가 여기서 나온다.
        get => PlayerPrefs.GetFloat(MASTER_VOLUME, DEFAULT_VOLUME);
        set => PlayerPrefs.SetFloat(MASTER_VOLUME, Mathf.Clamp01(value));
    }

    public static string Language
    {
        get => PlayerPrefs.GetString(LANGUAGE, DEFAULT_LANGUAGE);
        set => PlayerPrefs.SetString(LANGUAGE, value);
    }

    /// <summary>설정 화면을 닫는 것처럼 경계가 되는 시점에만 부른다.</summary>
    public static void Commit()
    {
        PlayerPrefs.Save();
    }
}
```

`Get*`의 **두 번째 인자가 기본값**이다. 생략하면 숫자는 0, 문자열은 빈
문자열이 온다. 볼륨처럼 0이 유효한 값인 자리에서는 "저장된 적 없음"과
"0으로 저장됨"이 구분되지 않으므로, 기본값을 반드시 넘긴다. 구분이 꼭
필요하면 `PlayerPrefs.HasKey`로 본다.

### 키 이름은 바꿀 수 있다. 회사·제품 이름은 아니다

키 이름을 바꾸는 마이그레이션은 앱 안에서 가능하다. 같은 저장소 안의 일이기
때문이다.

```csharp
private const string PREFS_VERSION = "Prefs.Version";
private const int CURRENT_VERSION = 2;

private static void MigrateIfNeeded()
{
    int saved = PlayerPrefs.GetInt(PREFS_VERSION, 1);
    if (saved >= CURRENT_VERSION) { return; }

    // v1: "volume" → v2: "Audio.MasterVolume"
    if (PlayerPrefs.HasKey("volume"))
    {
        PlayerPrefs.SetFloat("Audio.MasterVolume", PlayerPrefs.GetFloat("volume"));
        PlayerPrefs.DeleteKey("volume");
    }

    PlayerPrefs.SetInt(PREFS_VERSION, CURRENT_VERSION);
    PlayerPrefs.Save();
}
```

**반면 Company Name이나 Product Name을 바꾼 경우는 이 방법이 안 통한다.**
`PlayerPrefs` API는 항상 *현재* 설정이 가리키는 경로만 본다. 이전 경로의
데이터는 `HasKey`로도 안 잡힌다. 손대려면 레지스트리나 plist를 직접 읽어야
하고, 그건 플랫폼별 코드다.

그러니 **순서를 바꾸는 쪽이 답이다.** Company Name과 Product Name은
**저장 기능을 붙이기 전에 확정한다.** 표시용 이름이 아니라 저장 경로라고
생각하면 우선순위가 맞는다.

### 쓰지 말아야 할 자리

- **민감한 데이터.** 문서가 직접 경고한다 — "Unity는 PlayerPrefs를 로컬
  레지스트리에 **암호화 없이** 저장한다. **민감한 데이터를 저장하는 데
  PlayerPrefs를 쓰지 마라.**"
- **치트로 곤란해지는 값.** 암호화가 없다는 건 그대로 열어서 고칠 수 있다는
  뜻이다. 재화나 능력치를 여기 두면 안 된다.
- **구조가 있는 데이터.** 타입이 셋뿐이다. 세이브 데이터라면 JSON으로
  직렬화해 파일로 쓰는 쪽이 맞다. 무엇으로 직렬화할지는
  [JsonUtility 글](/posts/unity-jsonutility/)에 정리해뒀다.
- **큰 데이터.** WebGL은 **1MB**가 상한이다.
- **게임플레이 중 잦은 `Save()`.** 문서가 끊김을 경고한다.
- **바뀔 수 있는 이름을 경로로 삼기.** 위 절 그대로다.

## 정리

- **저장 경로는 `[company name]`과 `[product name]`으로 조립된다.** Player
  Settings 문서가 두 칸 모두 **"preferences 파일을 찾는 데 사용한다"**고
  적는다.
- **그 두 칸을 바꾸면 이전 데이터는 PlayerPrefs로 못 읽는다.** 지워진 게
  아니라 API가 다른 곳을 볼 뿐이고, 증상은 "세이브가 날아갔다"로 보인다.
- 클리핑의 스탠드얼론 경로 마지막 조각은 `[project name]`이 아니라
  **Product Name**이다. 폴더 이름으로 뒤지면 못 찾는다.
- 클리핑은 두 줄 모두 "에디터:"로 적었는데, **둘째 줄은 스탠드얼론**이다.
- **macOS도 에디터와 스탠드얼론이 갈린다.** 에디터는
  `com.[company].[product].plist`, 스탠드얼론은 번들 식별자 기반이다.
- **윈도우는 키 이름을 해시한다** (`DeckBase_h3232628825`). 레지스트리에서
  이름으로 검색되지 않고, 대소문자가 구분되며, 손으로 주입하기 어렵다.
- **에디터와 빌드는 다른 저장소다.** 한쪽에서 `DeleteAll` 해도 다른 쪽은
  그대로다.
- **쓰기는 `OnApplicationQuit`에 자동으로 일어난다.** `Save()`는 경계
  지점에서만 부른다 — 문서가 게임플레이 중 호출을 권하지 않는다.
- **암호화가 없다.** 문서가 민감한 데이터를 넣지 말라고 직접 말한다.

경로를 묻는 글이 경로만 주고 끝나는 게 아쉬웠다. **경로에 변수 두 개가
들어 있다면, 그 변수를 바꿨을 때 무슨 일이 생기는지가 경로만큼 중요하다.**

---

### 참고

- [PlayerPrefs — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/PlayerPrefs.html)
- [PlayerPrefs.Save — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/PlayerPrefs.Save.html)
- [Player Settings — Unity 매뉴얼](https://docs.unity3d.com/Manual/class-PlayerSettings.html)

이 글의 출발점이 된 자료는 [원소랑 — \[Unity\] PlayerPref 레지스트리 저장 경로](https://m.blog.naver.com/sorang226/222765279318)
(2022-06-08)이다. 경로 목록을 그대로 따라가면서 현행 스크립팅 레퍼런스와
대조했고, 경로에 들어가는 두 값이 어디서 오는지를 Player Settings 문서에서
확인했다.
