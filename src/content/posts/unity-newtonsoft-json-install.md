---
pubDatetime: 2026-09-23T14:00:00+09:00
title: "Newtonsoft Json 설치: 버전 칸은 비우는 자리다"
lang: ko
translationKey: unity-newtonsoft-json-install
featured: false
draft: false
tags:
  - Unity
  - C#
  - JSON
  - 직렬화
  - 데이터
description: "com.unity.nuget.newtonsoft-json 설치 글을 따라가다 버전 칸이 걸렸다. 3.0.1을 적고 Update를 누르라는 2단계는 통째로 필요 없고, 하필 그 3.0.1이 IL2CPP 관련 수정 이전 버전이다."
---

**JSON 파일을 읽어와서 데이터로 쓰려면 어떻게 해야 하는지**를 알아보던 중에
스크랩한 글이다. 직렬화·역직렬화를 실제로 어떤 도구로 할 것인지까지 따라가다
보니 Newtonsoft Json(Json.NET)이 나왔고, 그러면 설치부터 해야 했다.

절차 자체는 짧다. Package Manager를 열고, **Add package by name**을 누르고,
`com.unity.nuget.newtonsoft-json`을 넣는다 — 여기까지는 그대로 따라 하면 된다.

걸린 건 그다음이다. 글은 **버전 칸에 `3.0.1`을 적으라**고 하고, 설치가 끝나면
**Update 버튼으로 최신 버전으로 올리라**고 한다. 그 두 단계가 왜 있는지
확인해봤더니, **둘 다 없어도 되는 단계**였다. 그리고 `3.0.1`은 하필 고르면
안 되는 숫자였다.

이 글은 설치 절차를 처음부터 다시 밟으면서, 절차마다 **왜 그렇게 생겼는지**를
붙인다. 읽어온 JSON을 어느 직렬화기로 다룰지 고르는 기준 자체는
[JsonUtility 글](/posts/unity-jsonutility/)에서 정리했다. 거기 결론이
"JSON 모양을 내가 정하면 JsonUtility, 남이 정하면 Newtonsoft"였고, **파일을
읽어오는 쪽은 대개 모양을 내가 정하지 않은 경우**다. 이 글은 그 뒤에 오는
이야기다.

## 목차

## 이 패키지는 목록에 없다

먼저 이름부터. 설치할 것은 `com.unity.nuget.newtonsoft-json`이고, Unity
문서가 이렇게 소개한다.

> 이것은 Newtonsoft Json을 위한 Unity 패키지이며 **Newtonsoft.Json 버전
> 13.0.2에 대응한다.**

문서 기준 최신은 **3.2.2**다. 패키지 버전(3.2.2)과 그 안에 든 Json.NET
버전(13.0.2)이 다르다는 점만 잡아두면 된다.

그런데 Package Manager 목록을 아무리 뒤져도 이 패키지는 안 나온다. **그래서
"Add package by name"이 필요한 것**이다. 클리핑이 참고 URL로 건 applejag
위키가 그 사정을 적어놨다. 2022년 3월 기준으로, 이 패키지는 **다른 Unity
패키지의 의존성으로 이미 들어와 있거나, Package Manager 창에서 숨겨져
있다**는 것이다. Unity가 나중에 공개 목록에 올릴 예정이었다고 덧붙어 있다.

절차만 외우면 "왜 검색이 안 되지"에서 막힌다. **목록에 없는 게 정상이다.**

## 버전 칸은 비우는 자리다

클리핑은 버전 칸에 `3.0.1`을 적으라고 한다. 이 숫자의 출처도 같은 applejag
위키다. 위키가 예시로 `3.0.1`을 썼고, 그게 그대로 옮겨졌다.

Unity 매뉴얼은 이 칸을 이렇게 설명한다.

> **버전 지정은 선택 사항이다.** 어느 버전을 설치할지 모르거나 **최신 호환
> 버전을 설치하고 싶다면 패키지 이름만 입력한다.**

> 최신 호환 버전이 최신 배포 패키지가 아닐 수도 있다. **릴리스된 패키지
> 버전과 그보다 새로운 pre-release 또는 experimental 버전이 둘 다 있으면,
> Package Manager는 릴리스 버전을 고른다** — 선택 항목인 **Version** 칸에
> 값을 직접 넣지 않는 한.

정리하면 이렇다. **비워두면 알아서 최신 릴리스가 들어온다.** pre-release가
잘못 딸려 올 걱정도 없다. 그러니 "`3.0.1`을 넣고 → Update를 누른다"는 두
단계는 **"비워둔다" 한 단계로 끝난다.**

| | 클리핑의 절차 | 실제로 필요한 것 |
|---|---|---|
| 이름 칸 | `com.unity.nuget.newtonsoft-json` | 같다 |
| 버전 칸 | `3.0.1` 입력 | **비운다** |
| 설치 후 | Update 버튼으로 최신화 | 필요 없음 |

## 하필 3.0.1이 안 좋은 숫자다

단계가 하나 더 붙는 정도면 취향 문제로 볼 수도 있다. 그런데 `3.0.1`은
**멈춰 있으면 곤란한 버전**이다. 클리핑이 이 패키지의 장점으로 내세운 것이
"IL2CPP 빌드 지원"인데, 정작 그 부분이 `3.0.1` **이후**에 손봐졌다.

체인지로그를 순서대로 보면 이렇다.

| 버전 | 날짜 | 내용 |
|---|---|---|
| 2.0.0 | 2020-04-20 | **IL2CPP 컴파일 플랫폼 타깃을 위해** AOT 호환성 도입 |
| 3.0.1 | 2022-02-21 | 클리핑이 적으라는 버전 |
| 3.1.0 | 2023-02-28 | **AOT·에디터 DLL을 Newtonsoft.Json 13.0.2에 맞춰 갱신** |
| 3.2.0 | 2023-04-19 | 어셈블리 strong name을 위한 **public key token 수정**, Newtonsoft의 timeout 설정 지원 |
| 3.2.1 | 2023-04-27 | **netstandard 2.0으로 컴파일할 때의 DLL 문제 수정** |

`3.0.1`에 머무르면 저 아래 세 줄이 전부 빠진다. **IL2CPP로 빌드하는 AOT
DLL이 구버전 Json.NET이고, 어셈블리 strong name이 틀린 상태고, netstandard
2.0 컴파일 문제가 남아 있는 조합**이다. 설치 직후에 Update를 반드시
누르라고 한 것도 그래서겠지만, 애초에 버전 칸을 비우면 그 위험 구간을 지나갈
일이 없다.

## 설치하기 전에 이미 있는지 본다

이 패키지는 **다른 패키지가 끌고 들어오는 경우가 많다.** 그래서 설치 전에
확인하는 게 순서다. 확인할 파일은 `Packages/packages-lock.json`이다. Unity
매뉴얼의 설명이다.

> 이 파일은 **프로젝트에 대한 Package Manager의 의존성 해석 결과**를 담는다.

직접 넣은 것뿐 아니라 **간접 의존성까지 기록된다.** 그래서 이 파일을 열어
이름으로 찾아보면 된다.

```bash
# 프로젝트 루트에서
grep -n "com.unity.nuget.newtonsoft-json" Packages/packages-lock.json
```

여기 이미 잡혀 있으면 설치 자체가 필요 없다. 없을 때만 Add package by
name으로 넣는다.

그리고 **같이 있으면 안 되는 것**이 둘 있다.

- **`jillejr.newtonsoft.json-for-unity`** — 공식 패키지가 나오기 전에 쓰던
  applejag의 포팅 패키지다. 위키가 **"두 패키지는 공존할 수 없다"**고 못
  박는다. 먼저 제거해야 한다. 다만 컨버터 패키지
  `jillejr.newtonsoft.json-for-unity.converters`는 Unity 쪽에 대응물이 없어서
  그대로 둬도 된다고 한다.
- **`Assets` 아래의 `Newtonsoft.Json.dll`** — 에셋스토어 패키지가 자기
  쓰려고 DLL을 같이 넣어두는 경우가 있다. 이러면 같은 타입이 두 어셈블리에
  존재하게 된다.

## IL2CPP에서 진짜 걸리는 것은 스트리핑이다

패키지 버전을 맞춰도 IL2CPP에서 한 번 더 걸리는 자리가 있다. Newtonsoft는
JSON을 읽어 **리플렉션으로 타입을 만들고 멤버를 채운다.** 그런데 빌드 시
링커는 안 쓰는 코드를 지운다.

Unity 매뉴얼이 이 조합을 정확히 적어놨다.

> 애너테이션은 **코드가 리플렉션을 통해 다른 코드를 참조할 때 특히
> 유용하다. Unity 링커가 리플렉션 사용을 항상 감지하지는 못하기 때문이다.**

`[Preserve]` 속성 문서도 같은 이야기다.

> `PreserveAttribute`는 **바이트코드 스트리핑이 클래스·메서드·필드·프로퍼티를
> 제거하는 것을 막는다.**

> 예를 들어 **리플렉션으로 메서드를 호출하거나 특정 클래스의 객체를 생성하는
> 경우** 이런 일이 생길 수 있다.

에디터에서는 잘 되던 역직렬화가 **IL2CPP 빌드에서만 필드가 비거나 예외가
나면** 이걸 의심한다. 증상이 "설치가 잘못됐다"처럼 보이지만 설치와는 무관하다.

막는 방법은 둘이다. 타입 단위로 막으려면 `[Preserve]`를 붙인다.

```csharp
using UnityEngine.Scripting;

[Preserve]
public class SaveData
{
    public string PlayerName;
    public int Level;
}
```

어셈블리 단위로 막으려면 `link.xml`을 둔다. 매뉴얼 표현이다.

> 프로젝트에 **`link.xml`이라는 이름의 .xml 파일**을 넣어 **특정 어셈블리 또는
> 어셈블리의 일부를 보존**할 수 있다.

```xml
<!-- Assets/link.xml -->
<linker>
  <!-- Newtonsoft가 리플렉션으로 채우는 내 데이터 타입들이 있는 어셈블리 -->
  <assembly fullname="Assembly-CSharp" preserve="all"/>
</linker>
```

`preserve="all"`은 그 어셈블리를 통째로 남긴다. 편하지만 빌드 용량이
늘어나므로, 실제로 걸린 타입만 `[Preserve]`로 막는 쪽이 먼저다.

## 어디에 왜 쓰나

설치를 마쳤으면 이제 JsonUtility로 막히던 자리가 열린다. **막히던 것들이
그대로 되는지**를 코드로 확인해두는 게 설치 검증도 된다.

### JsonUtility가 못 하던 것들

```csharp
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

public class NewtonsoftSmokeTest : MonoBehaviour
{
    private void Start()
    {
        // 1) Dictionary — JsonUtility는 아예 못 담는다.
        var scores = new Dictionary<string, int> { ["ko"] = 10, ["en"] = 7 };
        string dictJson = JsonConvert.SerializeObject(scores);
        Debug.Log(dictJson);                                  // {"ko":10,"en":7}

        // 2) 최상위 배열 — 래퍼 클래스 없이 바로 된다.
        int[] ids = JsonConvert.DeserializeObject<int[]>("[1,2,3]");
        Debug.Log(ids.Length);                                // 3

        // 3) null — 빈 객체로 바뀌지 않고 null 그대로 온다.
        var item = JsonConvert.DeserializeObject<Item>("{\"Name\":null}");
        Debug.Log(item.Name == null);                         // True

        // 4) 프로퍼티 — 필드가 아니어도 직렬화된다.
        string propJson = JsonConvert.SerializeObject(new Item { Name = "sword" });
        Debug.Log(propJson);                                  // {"Name":"sword"}
    }

    [Serializable]
    private class Item
    {
        public string Name { get; set; }
    }
}
```

`JsonUtility`에서 이 넷이 각각 왜 막히는지는
[JsonUtility 글](/posts/unity-jsonutility/)에 정리해뒀다. 요약하면 전부
**"인스펙터에 안 보이면 JSON에도 안 담긴다"** 한 줄에서 나온다.

### 다형성은 되지만 조건이 붙는다

JsonUtility에서 **조용히 깨지던** 다형성은 Newtonsoft에서 된다. 다만 옵션을
켜야 하고, 그 옵션에 경고가 달려 있다.

```csharp
private static readonly JsonSerializerSettings PolymorphicSettings = new()
{
    // 타입 정보를 $type 필드로 함께 기록한다. 이게 없으면 기반 클래스로만 돌아온다.
    TypeNameHandling = TypeNameHandling.Auto,
};

string json = JsonConvert.SerializeObject(items, PolymorphicSettings);
var restored = JsonConvert.DeserializeObject<List<Weapon>>(json, PolymorphicSettings);
```

Newtonsoft 문서의 경고다.

> **애플리케이션이 외부 소스에서 받은 JSON을 역직렬화할 때 `TypeNameHandling`은
> 주의해서 사용해야 한다.** `None` 이외의 값으로 역직렬화할 때는 들어오는
> 타입을 **커스텀 `SerializationBinder`로 검증해야 한다.**

`$type`에 적힌 이름대로 타입을 만들어준다는 뜻이니, **서버 응답처럼 남이 주는
JSON에 그대로 켜면 안 된다.** 내 세이브 파일처럼 출처가 나인 데이터에 쓰는
것이 안전한 쓰임이다.

### 버전을 프로젝트에 고정하고 싶다면

Package Manager로 설치하면 결과가 `Packages/manifest.json`에 적힌다. 팀
전체가 같은 버전을 쓰게 하려면 이 파일을 직접 손대는 쪽이 확실하다.

```json
{
  "dependencies": {
    "com.unity.nuget.newtonsoft-json": "3.2.2"
  }
}
```

다만 **이건 "낡은 버전으로 고정"이 아니라 "지금 최신으로 고정"이어야
한다.** 위 표의 이유 그대로다.

### 쓰지 말아야 할 자리

- **버전 칸에 낡은 숫자 적기.** 비우면 최신 릴리스가 들어온다.
- **확인 없이 설치하기.** `packages-lock.json`에 이미 있을 수 있다.
- **`jillejr.newtonsoft.json-for-unity`와 같이 두기.** 공존하지 않는다.
- **남이 주는 JSON에 `TypeNameHandling` 켜기.** 바인더 검증이 먼저다.
- **내가 모양을 정하는 세이브 파일에 굳이 도입하기.** 그 자리는 JsonUtility가
  의존성 없이 잘 한다.

## 정리

- 패키지 이름은 `com.unity.nuget.newtonsoft-json`, 문서 기준 최신은 **3.2.2**,
  내용물은 **Newtonsoft.Json 13.0.2**다.
- **Package Manager 목록에 안 뜨는 게 정상이다.** 그래서 Add package by
  name을 쓴다.
- **버전 칸은 비운다.** 매뉴얼이 "패키지 이름만 입력하면 최신 호환 버전"이라고
  적고 있고, pre-release가 딸려 오지도 않는다.
- **`3.0.1`은 피한다.** 그 뒤로 AOT·에디터 DLL 갱신(3.1.0), strong name
  수정(3.2.0), netstandard 2.0 컴파일 수정(3.2.1)이 있었다.
- 설치 전에 **`Packages/packages-lock.json`을 먼저 본다.** 간접 의존성까지
  기록되므로 이미 들어와 있는지 여기서 확인된다.
- **`jillejr.newtonsoft.json-for-unity`와는 공존할 수 없다.** 컨버터 패키지는
  남겨도 된다.
- **IL2CPP에서 필드가 비면 스트리핑을 의심한다.** 링커는 리플렉션을 항상
  감지하지 못한다. `[Preserve]` 또는 `link.xml`로 막는다.
- **`TypeNameHandling`은 출처가 나인 데이터에만.** 외부 JSON에는 바인더
  검증이 필요하다.

설치 글이 짧은 건 설치가 실제로 짧기 때문이다. 다만 짧은 절차일수록 **숫자
하나가 그대로 복사되어 오래 남는다.** `3.0.1`은 2022년 문서의 예시값이었는데,
지금은 그 숫자를 적는 순간 IL2CPP 수정 세 개를 건너뛰게 된다.

---

### 참고

- [Newtonsoft Json Unity Package — Unity 문서](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/manual/index.html)
- [Newtonsoft Json 패키지 체인지로그](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/changelog/CHANGELOG.html)
- [Install a package by name — Unity 매뉴얼](https://docs.unity3d.com/Manual/upm-ui-quick.html)
- [Lock files — Unity 매뉴얼](https://docs.unity3d.com/Manual/upm-conflicts-auto.html)
- [Preserving code using annotations — Unity 매뉴얼](https://docs.unity3d.com/6000.3/Documentation/Manual/managed-code-stripping-preserving.html)
- [PreserveAttribute — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Scripting.PreserveAttribute.html)
- [TypeNameHandling — Newtonsoft.Json 문서](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_TypeNameHandling.htm)
- [Install official via UPM — applejag 위키](https://github.com/applejag/Newtonsoft.Json-for-Unity/wiki/Install-official-via-UPM)

이 글의 출발점이 된 자료는 [달시_Dalsi — \[Unity\] Newtonsoft Json 설치 방법](https://data-pandora.tistory.com/entry/Unity-newtonsoft-json-%EC%84%A4%EC%B9%98-%EB%B0%A9%EB%B2%95)
(2025-02-23)이다. 설치 절차는 그대로 따라가면서, 버전 칸과 그 숫자의 출처를
Unity 문서·체인지로그와 대조했다.
