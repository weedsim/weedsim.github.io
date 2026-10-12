---
pubDatetime: 2026-10-12T21:20:00+09:00
title: "LocalLow에 있는 건 dataPath가 아니라 persistentDataPath다"
lang: ko
translationKey: application-data-paths
featured: false
draft: false
tags:
  - Unity
  - C#
  - 데이터
  - 파일시스템
description: "JSON 세이브를 dataPath에 쓰고 있었던 터라 정확한 경로를 기억해두려고 스크랩한 글이다. 동적으로 만든 파일이 어디로 가는지 정리해뒀다. 그런데 dataPath와 persistentDataPath의 설명이 서로 바뀌어 적혀 있다. 경로 멤버는 셋이 아니라 다섯이고, 상대 경로는 둘 중 어느 쪽 기준도 아니다."
---

앞서 `PlayerPrefs` 레지스트리 경로를 확인한 뒤로, **설정 몇 개가 아닌 데이터는
JSON 파일로 저장**하기 시작했다. 그때 초기에 쓴 것이 `Application.dataPath`였고,
**정확한 경로를 기억해두려고** 찾던 중에 동적으로 생성되는 파일과 저장되는
데이터가 **어디로 가는지** 정리한 글을 스크랩해뒀다. 2021년 글이고, 앞머리에
글쓴이의 동기가 적혀 있다.

> 번들관련 공부를하다가 동적으로 생성되는 파일이나 저장되는 데이터들이 어디로
> 저장되는지 알아보았다.

질문이 정확하다. 그런데 **답 두 개가 서로 바뀌어 적혀 있다.**
`Application.dataPath`에 `AppData\LocalLow` 경로가 붙어 있고,
`Application.persistentDataPath`에 프로젝트의 `Assets` 폴더가 붙어 있다.
현행 문서는 **정확히 반대로** 적는다.

이 블로그에 저장 위치 글이 하나 있다.
[PlayerPrefs의 경로는 Company Name과 Product Name으로 조립된다](/posts/playerprefs-storage-path/)다.
그 글이 **레지스트리와 에디터·빌드 분리**를 다뤘으므로, 이 글은 클리핑의
1번(`PlayerPrefs`)은 짧게 짚고 **2번의 `Application` 경로 멤버들**을 본다.
겹치는 자리는 링크로 넘기지 않고 필요한 만큼 여기서 다시 싣는다.

확인한 것은 여섯 가지다. **`dataPath`와 `persistentDataPath`의 설명이 서로
바뀌어 있다**, **경로 멤버는 셋이 아니라 다섯이다**, **"읽기 전용"이 두 가지
뜻으로 쓰인다**, **`dataPath`는 안드로이드에서 폴더가 아니라 APK를 가리킨다**,
**`persistentDataPath`에는 번들 식별자에서 나온 GUID가 들어 있다**, 그리고
**상대 경로는 `persistentDataPath` 기준이 아니다.**

확인 시점은 **2026-10-12**이고, 기준은 Unity **6.6**이다.

## 목차

## PlayerPrefs 경로는 단말기가 아니라 에디터 것이다

클리핑의 1번은 레지스트리 경로다. 제목이 "단말기에 저장되는 PlayerPrefs
저장경로"인데, 경로에 `UnityEditor`가 들어 있다.

> \[레지스트리 편집기\] -> \[HKEY\_CURRENT\_USER\] -> \[SOFTWARE\] ->
> \[Unity\] -> \[UnityEditor\] -> \[DefaultCompany\] ->\["ProductName"\]

문서는 이 둘을 다른 항목으로 나눠 적는다. 빌드된 플레이어 쪽이다.

> Computer\HKEY_CURRENT_USER\Software\ExampleCompanyName\ExampleProductName in
> the Registry Editor.

그리고 에디터 플레이 모드 쪽이 따로 있다.

> Computer\HKEY_CURRENT_USER\Software\Unity\UnityEditor\ExampleCompanyName\ExampleProductName
> key.

**클리핑이 준 경로는 뒤쪽, 즉 에디터 것이다.** "단말기에 저장되는"이라는
제목과 어긋난다. 에디터에서 지운 값이 빌드본에 남아 있는 증상이 여기서
나오는데, 그 이야기는
[PlayerPrefs의 경로는 Company Name과 Product Name으로 조립된다](/posts/playerprefs-storage-path/)에
적어뒀다. 이 글은 여기서 멈추고 2번으로 간다.

하나만 더 적어둔다. 레지스트리에서 키 이름을 못 찾는 이유도 문서에 있다.

> Note that Windows uses the key names from the application's PlayerPrefs as a
> hashed identifier.

## 두 경로가 서로 바뀌어 적혀 있다

클리핑이 적은 두 줄과 현행 문서를 나란히 놓으면 이렇다.

| 멤버 | 클리핑 | 현행 문서 |
| --- | --- | --- |
| `dataPath` | `C:\Users\사용자이름\AppData\LocalLow\회사이름` | "Unity Editor: <path to project folder>/Assets" |
| `persistentDataPath` | `해당 프로젝트폴더 경로\Assets` | "%userprofile%\AppData\LocalLow\<companyname>\<productname>" |
| `streamingAssetsPath` | `해당 프로젝트 폴더` | "Create it in your project at **Assets/StreamingAssets**." |

**두 값이 정확히 맞바뀌어 있다.** `dataPath`의 설명은 이렇다.

> Contains the path to the game data folder on the target device (Read Only).

`persistentDataPath`는 이렇다.

> Contains the path to a persistent data directory (Read-only).

> This value is a directory path where you can store data that you want to
> retain between runs.

**"retain between runs"** — 실행 사이에 유지하고 싶은 데이터를 두는 곳이다.
동적으로 만든 세이브 파일이 가야 할 자리는 이쪽이고, 클리핑이 그 자리에
적어둔 `Assets` 폴더는 **빌드에는 아예 없다.**

여기서 JSON 세이브를 `dataPath`에 쓰면 무슨 일이 생기는지가 따라 나온다.
에디터에서 `dataPath`는 `<path to project folder>/Assets`이므로 **파일이
프로젝트 소스 트리 안에 생긴다.** 쓰기는 성공하고, 눈에도 보이고, 다시 읽히기도
한다. **에디터에서는 아무 문제가 없어 보인다는 것이 함정이다.** 그 파일은
사용자 데이터가 아니라 프로젝트의 에셋 자리에 있는 것이고, 버전 관리에
올라가며, 빌드에서 `dataPath`가 가리키는 곳은 같은 자리가 아니다 — 윈도우·리눅스
플레이어는 `<path to executablename_Data folder>`, 안드로이드는 APK, iOS와
UWP는 **읽기 전용**이라고 문서가 못 박아뒀다.

윈도우 쪽 항목이 이렇게 적혀 있다.

> Windows Editor and Windows Player: Application.persistentDataPath usually
> points to %userprofile%\AppData\LocalLow\<companyname>\<productname>.

클리핑이 `dataPath`에 붙여둔 그 경로다. 회사 이름까지만 적혀 있는 것도 짚을
만한데, 문서의 윈도우 항목에는 **제품 이름까지** 들어 있다. 회사 이름에서
끝나는 형태는 UWP 항목이다.

> UWP Apps: Application.persistentDataPath points to
> C:\Users\<user>\AppData\LocalLow\<company name>.

## 경로 멤버는 셋이 아니라 다섯이다

클리핑은 셋을 적는다. `Application` 클래스에는 **다섯**이 있다.

| 멤버 | 문서 설명 | 클리핑에 있나 |
| --- | --- | --- |
| `dataPath` | "Contains the path to the game data folder on the target device (Read Only)." | 있음(설명이 바뀜) |
| `persistentDataPath` | "Contains the path to a persistent data directory (Read-only)." | 있음(설명이 바뀜) |
| `streamingAssetsPath` | "The path to the StreamingAssets folder (Read Only)." | 있음 |
| `temporaryCachePath` | "Contains the path to a temporary data / cache directory (Read Only)." | **없음** |
| `consoleLogPath` | "Returns the path to the console log file, or an empty string if the current platform does not support log files." | **없음** |

`temporaryCachePath`에는 주의 사항이 하나 붙어 있다.

> This path is unique per Unity project, but it isn't unique for multiple
> concurrent instances of the same project.

> To obtain unique temporary paths, use FileUtil.GetUniqueTempPathInProject.

**같은 프로젝트를 여러 개 동시에 띄우면 겹친다.** 다운로드 캐시나 중간
산출물을 여기 쓰는 경우에 걸린다.

`consoleLogPath`는 **지원하지 않는 플랫폼에서 빈 문자열이 온다**고 적혀
있다. 빈 문자열을 그대로 경로로 쓰면 어디에 쓰이는지 알 수 없는 곳에 파일이
생긴다. 이 "빈 문자열" 패턴은 아래에서 한 번 더 나온다.

## "읽기 전용"이 두 가지 뜻으로 쓰인다

클리핑은 `dataPath`와 `streamingAssetsPath`에 **읽기 전용**을 붙여뒀다. 문서를
보면 그 표기가 두 가지 다른 것을 가리킨다.

하나는 **C# 프로퍼티가 읽기 전용**이라는 뜻이다. 다섯 멤버의 설명에 전부
"(Read Only)"가 붙어 있다. 값을 대입할 수 없다는 말이다.

다른 하나는 **그 폴더가 읽기 전용**이라는 뜻인데, 이쪽은 플랫폼마다 다르다.
`dataPath`의 플랫폼 목록에서 그 말이 붙은 항목이 둘이다.

> iOS player: <path to player app bundle>/<AppName.app>/Data (this folder is
> read only, use Application.persistentDataPath to save data).

> UWP Apps: The absolute path to the player data folder (this folder is read
> only, use Application.persistentDataPath to save data)

**`Win/Linux player` 항목에는 이 단서가 없다.** 그러니 "`dataPath`는 읽기
전용"은 플랫폼에 따라 다른 이야기다. 반면 `StreamingAssets`는 매뉴얼이
런타임 전체에 대해 못을 박는다.

> At runtime the `StreamingAssets` location is read-only and you can't modify
> or write new files to it.

**클리핑이 `streamingAssetsPath`에 붙인 "읽기 전용"은 맞다.** `dataPath`에
붙인 쪽이 플랫폼 조건을 생략한 것이다.

## dataPath는 플랫폼마다 다른 것을 가리킨다

`dataPath`의 플랫폼 목록이 통째로 중요하다. 문서가 먼저 이렇게 적는다.

> The value depends on which platform you are running on:

| 플랫폼 | 문서가 적은 값 |
| --- | --- |
| Unity Editor | "<path to project folder>/Assets" |
| Mac player | "<path to player app bundle>/Contents" |
| iOS player | "<path to player app bundle>/<AppName.app>/Data" (읽기 전용) |
| Win/Linux player | "<path to executablename_Data folder>" |
| WebGL | "The absolute url to the player data file folder (without the actual data file name)" |
| Android | "Normally it points directly to the APK. If you are running a split binary build, it points to the OBB instead." |
| UWP Apps | "The absolute path to the player data folder" (읽기 전용) |

**안드로이드 항목이 폴더가 아니다.** APK를, split binary 빌드라면 OBB를
가리킨다. 압축 파일을 가리키는 문자열에 파일 이름을 이어 붙여 `File.Open`을
하는 코드는 거기서 끝난다.

WebGL 항목도 폴더가 아니라 **url**이다. 그리고 리눅스 항목에는 괄호가 하나
더 붙어 있다 — "(note that most Linux installations will be case-sensitive!)".

표기에 대한 단서도 있다.

> Note that the string returned on a PC will use a forward slash as a folder
> separator.

**PC에서 돌아오는 문자열은 슬래시를 쓴다.** 클리핑이 적은
`C:\Users\…\AppData\LocalLow\…`는 탐색기에 보이는 모양이고, 코드가 받는
문자열은 그 모양이 아니다. 경로를 문자열로 비교하거나 `\`로 쪼개는 코드가
여기서 어긋난다. `persistentDataPath` 쪽에도 같은 취지의 주의가 있다.

> Note: The difference slashes indicate the different operating systems
> according to Path.DirectorySeparatorChar.

그리고 목록에 없는 플랫폼에 대해 문서가 **추측하지 말라고** 적는다.

> For any unlisted platform, run the example script on the target platform to
> find the dataPath location in the debug log.

## persistentDataPath에는 번들 식별자가 들어 있다

`persistentDataPath`에는 클리핑에 전혀 없는 이야기가 하나 붙어 있다.

> When you build the Unity application, a GUID is generated that is based on
> the Bundle Identifier.

> This GUID is part of `persistentDataPath`.

> If you keep the same Bundle Identifier in future versions, the application
> keeps accessing the same location on every update.

**번들 식별자를 바꾸면 경로가 바뀐다.** 다음 버전이 이전 세이브를 못 보게
된다는 뜻이다. 그 식별자가 어디서 오는지도 런타임에 읽을 수 있다.

> Returns the application identifier at runtime.

> On Apple platforms this is the 'bundleIdentifier' saved in the info.plist
> file.

> On Android it's the 'package' from the AndroidManifest.xml.

`Application.identifier`다. 이 구조가 앞서 쓴 `PlayerPrefs` 글과 같은
모양이다. 거기서는 **회사 이름과 제품 이름**을 바꾸면 저장한 값을 못 읽고,
여기서는 **번들 식별자**를 바꾸면 못 읽는다. **저장 위치가 프로젝트 설정의
문자열로 조립된다는 점이 같다.**

플랫폼별 항목에서 둘을 짚어둘 만하다. 먼저 모바일이다.

> When you publish on iOS and Android, `persistentDataPath` points to a public
> directory on the device.

> The files can only be erased by users directly and not by any app updates.

**앱 업데이트로는 지워지지 않는다.** 포맷이 바뀐 세이브를 업데이트가
알아서 치워주지 않는다는 뜻이고, 마이그레이션 코드를 직접 들고 있어야 한다는
뜻이다. 안드로이드의 실제 경로는
`/storage/emulated/<userid>/Android/data/<packagename>/files`이고, `adb`로
그 폴더를 꺼내고 심는 방법은
[adb 메모: Android Debug Bridge의 구조와 명령](/posts/adb-android-debug-bridge/)에
적어뒀다.

다른 하나는 **빈 문자열**이다.

> tvOS: `Application.persistentDataPath` is not supported and returns an empty
> string.

`Path.Combine`에 빈 문자열을 넘기면 예외가 아니라 **상대 경로**가 나온다. 그
상대 경로가 어디로 가는지가 다음 절이다.

## 상대 경로는 persistentDataPath 기준이 아니다

클리핑의 출발 질문이 "동적으로 생성되는 파일이 어디로 저장되는지"였다. 문서가
그 질문에 직접 답하는 자리가 있는데, 답이 직관과 다르다.

> Some Unity APIs (for example, ScreenCapture.CaptureScreenshot) interpret
> relative paths as relative to the project directory on Windows Editor and
> other non-mobile platforms, not relative to `persistentDataPath`.

> Therefore, screenshots or other files saved with a relative path end up in
> the project folder, not in `AppData/LocalLow` on Windows.

**상대 경로로 저장하면 프로젝트 폴더로 간다.** `persistentDataPath`가 아니다.
`ScreenCapture.CaptureScreenshot` 페이지가 같은 말을 더 자세히 적는다.

> **Mobile platforms (such as Android and iOS)**: `filename` is appended to the
> persistent data path.

> **Windows Editor, macOS Editor, and other non-mobile platforms**: `filename`
> is interpreted relative to the project directory

**같은 호출이 플랫폼에 따라 다른 폴더에 쓴다.** 모바일에서는 영구 데이터
경로에 이어 붙이고, 에디터와 비모바일에서는 프로젝트 폴더 기준이다. 그래서
문서가 해법을 못 박아둔다.

> To save files to the persistent data path, pass a full path:
> `System.IO.Path.Combine(Application.persistentDataPath, "filename.png")`.

**전체 경로를 넘긴다.** 상대 경로를 쓰지 않는 것이 유일한 수단이다.

같은 페이지에 안드로이드 전용 함정이 하나 더 있다.

> The `CaptureScreenshot` returns immediately on Android.

> The screen capture continues in the background.

> The resulting screen shot is saved in the file system after a few seconds.

**호출 직후에는 파일이 없다.** 찍고 바로 읽어서 업로드하는 코드가 안드로이드
에서만 실패하는 경로가 여기다.

## streamingAssetsPath는 두 플랫폼에서 경로가 아니다

클리핑은 `streamingAssetsPath`를 "해당 프로젝트 폴더"라고 적는다. 자리가 더
구체적이다.

> The `StreamingAssets` folder must be in the root of the `Assets` folder at
> `Assets/StreamingAssets`.

> Any files in this directory are copied without modification into the Player
> output.

**`Assets` 바로 아래여야 하고, 수정 없이 복사된다.** 그리고 빌드에서는 자리가
달라진다.

> In a built Player, the StreamingAssets location can differ from the project
> folder, so always use `Application.streamingAssetsPath`.

여기까지는 클리핑과 같은 방향이다. 어긋나는 것은 그다음이다.

> On most platforms `Application.streamingAssetsPath` is a directory accessible
> using regular file system APIs.

> On Android and the Web platform, it's impossible to access the streaming
> asset files directly via file system APIs because these platforms return a
> URL.

> Use the UnityWebRequest class to access the content instead.

**안드로이드와 웹에서는 돌아오는 것이 경로가 아니라 URL이다.** 스크립팅
레퍼런스가 같은 말을 조건까지 붙여 적는다.

> You cannot use synchronous filesystem APIs, such as the C#
> `System.IO.File` class, to access the `StreamingAssets` folder on the WebGL
> and Android platforms.

`System.IO.File`을 이름으로 지목한다. 즉 **에디터에서 잘 돌던
`File.ReadAllBytes`가 안드로이드 빌드에서만 안 되는 경로**가 이것이고, 대안이
`UnityWebRequest`다.
`UnityWebRequest`로 받은 결과를 어떻게 판정하는지는
[에러 페이지가 돌아와도 result는 ConnectionError가 아니다](/posts/google-translate-tts/)에
적어뒀다.

폴더 밖의 파일을 빌드에 넣는 길도 하나 적혀 있다.

> You can add streaming assets to the Player build without placing them in the
> `StreamingAssets` folder by using BuildPlayerProcessor.PrepareForBuild.

## 어디에 왜 쓰나

### 동작하는 예제

경로를 추측하지 않고 **찍어보고**, 저장은 전체 경로로만 하는 형태다. 문서가
"run the example script on the target platform to find the dataPath location in
the debug log"라고 적은 그 방식을 그대로 둔 것이다.

```csharp file="Scripts/Util/SavePathProbe.cs"
using System;
using System.IO;
using UnityEngine;

public class SavePathProbe : MonoBehaviour
{
    [Header("세이브")]
    [Tooltip("persistentDataPath 아래에 만들 하위 폴더 이름")]
    [SerializeField]
    private string _saveFolderName = "Saves";

    [Tooltip("세이브 파일 이름. 확장자까지 적는다")]
    [SerializeField]
    private string _saveFileName = "slot0.json";

    private void Start()
    {
        LogPaths();
    }

    // 플랫폼마다 값이 다르다. 추측하지 말고 대상 기기에서 찍어본다.
    [ContextMenu("경로 찍기")]
    private void LogPaths()
    {
        Debug.Log($"dataPath            = {Application.dataPath}", this);
        Debug.Log($"persistentDataPath  = {Application.persistentDataPath}", this);
        Debug.Log($"streamingAssetsPath = {Application.streamingAssetsPath}", this);
        Debug.Log($"temporaryCachePath  = {Application.temporaryCachePath}", this);
        Debug.Log($"consoleLogPath      = {Application.consoleLogPath}", this);
        Debug.Log($"identifier          = {Application.identifier}", this);
    }

    // 상대 경로를 쓰지 않는다. 문서가 전체 경로를 넘기라고 적었다.
    public string GetSaveFilePath()
    {
        string root = Application.persistentDataPath;

        // tvOS에서는 빈 문자열이 온다고 문서에 적혀 있다. 빈 문자열을
        // Combine에 넘기면 예외가 아니라 상대 경로가 나온다.
        if (string.IsNullOrEmpty(root))
        {
            Debug.LogWarning("persistentDataPath가 비어 있다.", this);
            return string.Empty;
        }

        return Path.Combine(root, _saveFolderName, _saveFileName);
    }

    public bool TryWriteSave(string json)
    {
        string path = GetSaveFilePath();

        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        try
        {
            string directory = Path.GetDirectoryName(path);

            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            File.WriteAllText(path, json);
            return true;
        }
        catch (Exception exception)
        {
            // 경로가 맞아도 권한이나 용량으로 실패할 수 있다.
            Debug.LogError($"세이브 실패: {exception.Message}", this);
            return false;
        }
    }

    public bool TryReadSave(out string json)
    {
        json = string.Empty;
        string path = GetSaveFilePath();

        if (string.IsNullOrEmpty(path) || !File.Exists(path))
        {
            return false;
        }

        try
        {
            json = File.ReadAllText(path);
            return true;
        }
        catch (Exception exception)
        {
            Debug.LogError($"세이브 읽기 실패: {exception.Message}", this);
            return false;
        }
    }
}
```

`Path.Combine`을 쓴 이유가 있다. 문서가 `Path.DirectorySeparatorChar`를 이름
으로 언급하고, PC에서 돌아오는 문자열은 슬래시를 쓴다고 적었다. **구분자를
직접 이어 붙이면 플랫폼에 따라 모양이 어긋난다.**

`StreamingAssets`를 읽는 코드를 여기 안 넣은 것도 의도다. 안드로이드와
웹에서는 `System.IO.File`로 읽을 수 없고 `UnityWebRequest`를 써야 한다고
문서가 적었다. **같은 클래스 안에 두면 플랫폼에서 반쪽만 동작하는 코드가 된다.**

`try`/`catch`를 둘러둔 이유는 경로와 결과가 다른 문제이기 때문이다. 경로를
맞게 조립해도 **권한이나 용량으로 실패**할 수 있다. 경로를 찍어보는 것과
쓰기가 성공했는지 확인하는 것은 별개다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| 실행 사이에 유지할 데이터 | `persistentDataPath` ("retain between runs") |
| 빌드에 같이 넣고 읽기만 | `streamingAssetsPath` |
| 안드로이드·웹에서 그 파일 읽기 | `UnityWebRequest` (경로가 아니라 URL이 온다) |
| 다시 만들어도 되는 캐시 | `temporaryCachePath` |
| 같은 프로젝트를 동시에 여러 개 띄운다 | `temporaryCachePath`는 겹친다 |
| 설정값 몇 개 | `PlayerPrefs` (레지스트리·plist·IndexedDB) |
| 로그 파일 위치 | `consoleLogPath` (지원 안 하면 빈 문자열) |
| 세이브 경로 조립 | `Path.Combine` + 전체 경로 |
| 스크린샷을 영구 경로에 | `Path.Combine(Application.persistentDataPath, …)` |
| 안드로이드에서 스크린샷 직후 읽기 | 기다려야 한다 ("after a few seconds") |
| 목록에 없는 플랫폼 | 대상 기기에서 찍어본다 |
| 번들 식별자를 바꾼다 | 경로가 바뀐다. 마이그레이션을 준비한다 |

판단 순서는 이렇게 두면 된다.

- **쓸 것인지 읽을 것인지부터 가른다.** 쓸 거라면 `persistentDataPath`다.
  `dataPath`는 플랫폼에 따라 폴더가 아니거나 읽기 전용이다.
- **경로는 찍어보고 시작한다.** 문서가 목록에 없는 플랫폼에 대해 직접 그렇게
  적어뒀다. 블로그 글의 경로를 그대로 믿는 것이 이 클리핑이 틀린 방식이다.
- **상대 경로를 쓰지 않는다.** 같은 호출이 모바일과 에디터에서 다른 폴더에
  쓴다. 전체 경로를 넘기는 것이 문서가 준 해법이다.
- **번들 식별자와 회사·제품 이름은 저장 위치의 일부다.** 바꿀 일이 생기면
  마이그레이션이 같이 따라온다.

### 쓰지 말아야 할 자리

- **`dataPath`에 세이브를 쓰는 것.** iOS와 UWP 항목에 "this folder is read
  only, use Application.persistentDataPath to save data"가 적혀 있다.
- **에디터에서 잘 되는 것을 근거로 `dataPath`를 두는 것.** 에디터의
  `dataPath`는 프로젝트의 `Assets`라서 쓰기가 성공한다. 그 성공이 빌드에서
  보장되지 않는다.
- **`dataPath`를 폴더로 가정하는 것.** 안드로이드에서는 APK를, split binary
  빌드에서는 OBB를 가리킨다.
- **상대 경로로 파일을 저장하는 것.** 비모바일에서는 프로젝트 폴더로 간다.
  `AppData/LocalLow`가 아니다.
- **구분자를 `\`로 직접 이어 붙이는 것.** PC에서 돌아오는 문자열은 슬래시를
  쓴다고 문서가 적었다.
- **`StreamingAssets`를 `System.IO.File`로 읽는 것.** 안드로이드와 WebGL에서는
  URL이 돌아온다. `UnityWebRequest`를 쓴다.
- **빈 문자열을 그대로 `Path.Combine`에 넘기는 것.** tvOS의
  `persistentDataPath`와 미지원 플랫폼의 `consoleLogPath`가 빈 문자열이다.
- **`temporaryCachePath`를 인스턴스별 작업 폴더로 쓰는 것.** 같은 프로젝트를
  동시에 여러 개 띄우면 겹친다고 적혀 있다.
- **번들 식별자를 가볍게 바꾸는 것.** GUID가 경로의 일부라서 이전 세이브를 못
  보게 된다.
- **안드로이드에서 스크린샷을 찍고 바로 읽는 것.** 호출은 즉시 돌아오고 파일은
  몇 초 뒤에 생긴다.

## 정리

- **클리핑의 두 줄이 맞바뀌어 있다.** `dataPath`는 에디터에서
  "<path to project folder>/Assets"이고, `AppData\LocalLow`는
  `persistentDataPath`의 윈도우 값이다.
- `persistentDataPath`의 정의가 **"a directory path where you can store data
  that you want to retain between runs"**다. 세이브가 갈 자리다.
- **경로 멤버는 다섯이다.** 클리핑이 적은 셋에 `temporaryCachePath`와
  `consoleLogPath`가 더 있다. 앞의 것은 **동시 실행에서 겹치고**, 뒤의 것은
  **미지원 플랫폼에서 빈 문자열**이다.
- **"읽기 전용"이 두 가지 뜻이다.** 다섯 프로퍼티 전부 "(Read Only)"지만,
  **폴더가** 읽기 전용이라고 적힌 것은 `dataPath`의 iOS·UWP 항목과
  `StreamingAssets`다. `Win/Linux player`에는 그 단서가 없다.
- `dataPath`는 안드로이드에서 **"Normally it points directly to the APK"**고
  split binary 빌드면 OBB다. 폴더가 아니다.
- **PC에서 돌아오는 문자열은 슬래시를 쓴다**고 문서가 적는다. 탐색기에 보이는
  백슬래시 표기와 다르다.
- `persistentDataPath`에는 **번들 식별자에서 나온 GUID가 들어 있다.** 식별자를
  바꾸면 이전 세이브를 못 본다. 회사·제품 이름이 `PlayerPrefs` 경로의
  일부인 것과 같은 구조다.
- iOS·안드로이드에서 그 폴더는 공개 디렉터리고 **"can only be erased by users
  directly and not by any app updates"**다. 마이그레이션은 내 책임이다.
- **상대 경로는 `persistentDataPath` 기준이 아니다.** 비모바일에서는 프로젝트
  폴더로 간다. 해법은 문서가 적어둔 그대로 **전체 경로를 넘기는 것**이다.
- `streamingAssetsPath`는 **안드로이드와 웹에서 URL이 온다.**
  `System.IO.File`을 쓸 수 없고 `UnityWebRequest`를 쓴다.
- **JSON 세이브를 `dataPath`에 쓰면 에디터에서만 멀쩡해 보인다.** 그 자리가
  프로젝트의 `Assets`이기 때문이다. 빌드에서 같은 속성이 가리키는 곳은
  `_Data` 폴더거나 APK거나 읽기 전용 폴더다.
- **클리핑의 `PlayerPrefs` 경로는 에디터 것이다.** 빌드본은
  `…\Software\[company]\[product]`로 따로 간다.

---

### 참고

- [Application — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application.html)
- [Application.dataPath — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-dataPath.html)
- [Application.persistentDataPath — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-persistentDataPath.html)
- [Application.streamingAssetsPath — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-streamingAssetsPath.html)
- [Application.temporaryCachePath — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-temporaryCachePath.html)
- [Application.identifier — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-identifier.html)
- [PlayerPrefs — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/PlayerPrefs.html)
- [ScreenCapture.CaptureScreenshot — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/ScreenCapture.CaptureScreenshot.html)
- [Streaming Assets — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StreamingAssets.html)

이 글의 출발점이 된 자료는
[\[유니티\] 유니티 PlayerPrefs 저장경로/ Application.dataPath/](https://funfunhanblog.tistory.com/378)
(HJH0825, 2021-05-03)이다. 경로 목록을 그대로 따라가면서 현행 Unity 6.6
스크립팅 레퍼런스와 매뉴얼 양쪽에 대조했고, 바뀐 두 항목은 문서의 문장을
그대로 인용해 바로잡았다. 확인 시점은 2026-10-12이다.
