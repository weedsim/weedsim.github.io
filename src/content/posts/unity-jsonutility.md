---
pubDatetime: 2026-09-06T17:00:00+09:00
title: "Unity JsonUtility 정리: 제약은 JSON이 아니라 직렬화기에서 온다"
lang: ko
translationKey: unity-jsonutility
featured: false
draft: false
tags:
  - Unity
  - C#
  - JSON
  - 직렬화
  - 데이터
description: "JsonUtility의 제약 목록을 외우는 대신 하나의 규칙으로 정리했다. 인스펙터에 안 보이면 JSON에도 안 담긴다. 그리고 문서에 없는 가장 위험한 항목인 다형성 문제까지."
---

Unity로 게임을 만들다가 **JSON 데이터를 읽어와야 할 일**이 생겼다. 그래서
Unity의 JSON 직렬화 매뉴얼을 찾아 스크랩해뒀었다. `JsonUtility.ToJson`,
`FromJson`, `FromJsonOverwrite` 세 개를 설명하고 지원 타입과 성능을 짚는
한 페이지짜리 문서다.

이 문서는 **"안 되는 것"의 목록**을 준다. Dictionary가 안 되고, 최상위 배열이
안 되고, 필드만 직렬화되고, 비구조화 JSON이 안 된다는 식이다. 그런데 목록만
보면 왜 하필 그것들이 안 되는지 알 수 없어서, 목록에 없는 제약을 만나면
다시 막힌다.

사실 문서 안에 열쇠가 되는 문장이 하나 있다. 그걸 중심으로 다시 정리했다.
**목록을 외우는 대신 규칙 하나로 예측할 수 있게** 하는 게 이 글의 목표다.
그리고 미리 말해두면, **읽어오는 쪽이 목적이라면 JsonUtility가 정답이 아닐
가능성이 높다.** 왜 그런지도 같은 규칙에서 나온다.

## 목차

## 기본 사용법

세 개가 전부다.

```csharp
[Serializable]
public class SaveData
{
    public int level;
    public float timeElapsed;
    public string playerName;
}

// 직렬화
string json = JsonUtility.ToJson(myObject);
// {"level":1,"timeElapsed":47.5,"playerName":"Dr Charles Francis"}

// 역직렬화 (새 인스턴스)
myObject = JsonUtility.FromJson<SaveData>(json);

// 역직렬화 (기존 인스턴스에 덮어쓰기)
JsonUtility.FromJsonOverwrite(json, myObject);
```

문서가 짚는 매칭 규칙도 명확하다. **JSON에 있는데 클래스에 없는 필드는
무시되고, 클래스에 있는데 JSON에 없는 필드는 기존 값이 유지된다.**

그래서 `FromJsonOverwrite`가 "패치" 용도로 쓰인다. 필드 일부만 담긴 JSON을
덮어씌우면 나머지는 그대로 남는다. 설정 변경분만 서버에서 내려받아 적용하는
식의 패턴에 맞는다.

그리고 규칙이 하나 있다.

> JSON을 `MonoBehaviour` 또는 `ScriptableObject` 의 서브클래스로 역직렬화하는
> 경우 FromJsonOverwrite를 반드시 사용해야 합니다. FromJson은 지원되지 않고
> 예외를 발생시킵니다.

당연하다면 당연하다. `MonoBehaviour`는 `new`로 만들 수 없으니 `FromJson`이
새 인스턴스를 반환할 방법이 없다.

## 제약은 JSON이 아니라 Unity 직렬화기에서 온다

여기가 핵심이다. 문서의 이 한 문장이 나머지를 전부 설명한다.

> 사용자가 전달하는 오브젝트는 스탠다드 Unity 시리얼라이저에 공급되어
> 처리되므로, **인스펙터에서 적용되는 규칙과 제한이 동일하게 적용됩니다.**

`JsonUtility`는 자체 JSON 엔진이 아니다. **Unity가 씬과 프리팹을 저장할 때
쓰는 그 직렬화기에 JSON이라는 출력 포맷을 붙인 것**이다. 그래서 제약이
JSON의 성질과 아무 상관이 없다. JSON 자체는 중첩 객체도, 이종 배열도, null도
전부 표현할 수 있다. 못 하는 건 Unity 직렬화기다.

여기서 규칙 하나가 나온다.

> **인스펙터에 안 보이면 JSON에도 안 담긴다.**

이 규칙이 문서의 목록보다 유용한 건, 목록에 없는 경우까지 예측하기 때문이다.
필드를 인스펙터에서 볼 수 있으면 JSON으로 나가고, 아니면 안 나간다. 확인도
쉽다. 그냥 인스펙터를 보면 된다.

## 실제로 걸리는 것들

Unity 직렬화 규칙 문서에서 해당 항목들을 가져오면 이렇다.

### 프로퍼티는 직렬화되지 않는다

> Unity doesn't serialize properties.

Newtonsoft에서 넘어오면 가장 먼저 걸린다. 자동 프로퍼티도 마찬가지다.

```csharp
public int Level { get; set; }     // JSON에 안 나온다
public int level;                  // 나온다
[SerializeField] private int hp;   // 나온다
```

`static`, `const`, `readonly`도 제외된다. 세이브 데이터 클래스를 `readonly`로
불변하게 만들어두면 통째로 빈 객체가 된다.

### Dictionary와 중첩 컨테이너가 안 된다

> Unity doesn't support serialization of multilevel types (multidimensional
> arrays, jagged arrays, dictionaries, and nested container types).

`Dictionary<,>`만이 아니라 **다차원 배열과 중첩 컨테이너 전부**다. 게임에서
자주 쓰는 것들이 여기 걸린다.

```csharp
public int[,] grid;                  // 안 된다
public List<List<int>> rows;         // 안 된다
public Dictionary<string,int> stats; // 안 된다
```

타일 맵이나 격자 데이터를 그대로 담으려다 막히는 지점이다. 우회는 **1차원으로
펴서 담고 폭을 따로 저장**하거나, `List` 두 개를 나란히 두는 방식이다.

### 최상위 배열이 안 된다

> Unity does not support passing other types directly to the API, such as
> primitive types or arrays.

`[{...},{...}]` 형태의 JSON을 그대로 못 받는다. 서버 API 응답이 배열로
내려오는 경우가 흔한데 여기서 막힌다. 우회는 래퍼 클래스다.

```csharp
[Serializable]
public class Wrapper<T> { public T[] items; }

// 서버가 [{...},{...}] 를 주면 앞뒤를 감싼다
string wrapped = "{\"items\":" + json + "}";
var list = JsonUtility.FromJson<Wrapper<Item>>(wrapped).items;
```

문자열을 손으로 붙이는 게 마음에 안 든다면, 그건 JsonUtility를 쓸 자리가
아니라는 신호이기도 하다.

### null이 표현되지 않는다

문서에 없는 항목인데 실무에서 자주 만난다. Unity 직렬화기는 커스텀 클래스
참조에 null을 담지 못한다. **null 대신 필드가 비어 있는 객체를 넣는다.**

```csharp
public class Player { public Weapon weapon; }   // weapon = null

// ToJson 결과
{"weapon":{"name":"","damage":0}}
```

"장비를 안 낀 상태"를 null로 표현해두면, 저장했다 불러온 뒤에는 **이름이 빈
문자열인 무기를 낀 상태**가 된다. null 체크로 분기하는 코드가 전부 어긋난다.
"없음"을 표현해야 한다면 별도 플래그나 센티널 값을 두는 편이 안전하다.

### 다형성이 조용히 깨진다

**문서에 없는 것 중 가장 위험한 항목이다.** Unity 직렬화 규칙 문서의 서술이다.

> Unity only serializes the fields that belong to the parent class. When Unity
> deserializes the class instance, it instantiates the parent class instead of
> the derived class.

인벤토리를 이렇게 짰다고 하자.

```csharp
[Serializable] public class Item { public string name; }
[Serializable] public class Weapon : Item { public int damage; }

public class Inventory { public List<Item> items; }
```

`Weapon`을 넣어 저장하면 **`damage`가 사라지고**, 불러오면 **`Weapon`이 아니라
`Item`이 돌아온다.** 예외도 경고도 없다. 캐스팅하는 쪽에서 `null`이 나오거나
데이터가 비어 있는 것으로만 드러난다.

인벤토리, 스킬 목록, 퀘스트 조건처럼 **기반 클래스 컬렉션에 파생 타입을 담는
구조**는 게임에서 아주 흔하다. 그래서 이 항목 하나 때문에 JsonUtility를
포기하게 되는 경우가 많다.

## 문서에 없는 탈출구: `[SerializeReference]`

위 두 항목(null, 다형성)에는 답이 있다. 직렬화 규칙 문서가 짚는다.

- null 표현 — "Using `[SerializeReference]` allows null values."
- 다형성 — "Using `[SerializeReference]` supports polymorphism correctly."

```csharp
[SerializeReference] public List<Item> items;   // Weapon이 Weapon으로 돌아온다
```

JSON 매뉴얼에는 이 속성이 한 번도 나오지 않는다. 두 페이지를 같이 봐야
보이는 셈이다. 다만 참조 기반이라 출력 형태와 비용이 달라지므로, 무조건
붙이기보다 필요한 필드에만 쓰는 게 맞다.

## 성능 주장은 어느 시점 것인가

문서의 성능 절은 이렇게 시작한다.

> Benchmark tests indicate that JsonUtility is significantly faster than
> popular .NET JSON solutions, even though this class provides fewer features
> in some cases.

**이 문장에는 시점도, 대상도, 방법도 없다.** 스크랩본은 2018.4 문서인데
현재 Unity 6 문서에도 같은 문장이 그대로 있다. 즉 최소 8년째 같은 주장이
검증 없이 유지되고 있다. 비교 대상이던 ".NET JSON 솔루션"들이 그 사이 크게
바뀌었다는 점을 감안하면, **이 문장을 근거로 선택하지는 않는 게 맞다.**

반면 같은 절의 GC 관련 서술은 구체적이고 지금도 쓸모가 있다.

- `ToJson()` — 반환 문자열에만 GC 할당
- `FromJson()` — 반환 오브젝트와 하위 오브젝트에만 할당
- `FromJsonOverwrite()` — 실제로 쓰이는 필드에만 할당. **덮어쓰는 필드가 전부
  값 타입이면 GC 할당이 없다.**

마지막 항목이 실질적이다. 매 프레임 갱신되는 데이터를 받아 쓰는 상황이라면
`FromJson`으로 매번 새 객체를 만드는 대신 `FromJsonOverwrite`로 재사용하는
쪽이 GC 압력을 줄인다. 백그라운드 스레드에서 호출해도 된다는 것도 문서에
명시돼 있다.

## 그럼 언제 무엇을 쓰나

- **JsonUtility** — 내가 정의한 클래스를 내가 저장하고 내가 읽을 때. 세이브
  파일, 설정, 에디터 툴의 중간 데이터. 의존성이 없고 GC가 적다.
- **Newtonsoft Json.NET** — Unity가 공식 패키지로 배포한다
  (`com.unity.nuget.newtonsoft-json`, Newtonsoft.Json 13.0.2 기준). Dictionary,
  다형성, null, 최상위 배열, 그리고 비구조화 JSON 탐색이 전부 된다. **남이
  정의한 JSON을 받아야 한다면 사실상 이쪽이다.**
- **System.Text.Json** — .NET 표준 쪽. Unity에서는 NuGetForUnity를 거쳐야
  들어오고, IL2CPP에서 리플렉션 경로가 걸릴 수 있다는 점을 확인해야 한다.
  이 조합의 함정은 [Unity용 Gemini 클라이언트 글](/posts/unity-gemini-client/)에서
  따로 정리했다.

판단 기준을 한 줄로 줄이면 이렇다. **JSON의 모양을 내가 정하면 JsonUtility,
남이 정하면 Newtonsoft.**

도입부에서 말한 것도 이 이야기다. **"읽어온다"는 건 대개 JSON의 모양을 내가
정하지 않았다는 뜻이다.** 서버 응답이든 외부 데이터 파일이든, 최상위가
배열일 수 있고, 키가 동적일 수 있고, 값이 null일 수 있고, 타입에 따라 필드
구성이 달라질 수 있다. 위에서 본 제약이 전부 그 지점에서 걸린다.

반대로 내가 만든 세이브 파일을 다시 읽는 것이라면 모양을 내가 정한 것이므로
JsonUtility가 잘 맞는다. **같은 "읽기"라도 출처가 어디냐가 기준이다.**

## 정리

- `JsonUtility`는 자체 JSON 엔진이 아니라 **Unity 직렬화기에 JSON 출력을 붙인
  것**이다. 그래서 제약이 JSON의 성질과 무관하다.
- 규칙 하나로 예측할 수 있다. **인스펙터에 안 보이면 JSON에도 안 담긴다.**
- 프로퍼티는 직렬화되지 않는다. `static`·`const`·`readonly`도 제외된다.
- `Dictionary`만이 아니라 **다차원 배열과 중첩 컨테이너 전부**가 안 된다.
  격자 데이터는 1차원으로 펴야 한다.
- 최상위 배열은 래퍼 클래스로 감싸야 한다.
- **null이 표현되지 않는다.** 커스텀 클래스 참조는 null 대신 빈 객체가 되어
  null 체크가 어긋난다.
- **다형성이 조용히 깨진다.** 파생 타입을 기반 클래스 컬렉션에 담으면 파생
  필드가 사라지고 기반 클래스 인스턴스가 돌아온다. 예외도 경고도 없다.
- 위 두 가지의 답은 `[SerializeReference]`인데, **JSON 매뉴얼에는 나오지
  않는다.**
- 성능 주장은 시점·대상·방법이 없고 8년째 같은 문장이다. 반면 GC 서술은
  구체적이고, `FromJsonOverwrite`는 값 타입만 덮어쓸 때 할당이 없다.
- **JSON 모양을 내가 정하면 JsonUtility, 남이 정하면 Newtonsoft.**

## 참고

- [JSON Serialization — Unity](https://docs.unity3d.com/6000.3/Documentation/Manual/json-serialization.html)
- [Script serialization rules — Unity](https://docs.unity3d.com/6000.3/Documentation/Manual/script-serialization-rules.html)
- [Newtonsoft Json Unity Package](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/manual/index.html)
- 원문: [JSON 직렬화 (2018.4 한국어)](https://docs.unity3d.com/kr/2018.4/Manual/JSONSerialization.html)
