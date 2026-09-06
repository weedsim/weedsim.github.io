---
pubDatetime: 2026-09-06T14:00:00+09:00
title: "문자 인코딩 정리: 유니코드는 2바이트가 아니다"
lang: ko
translationKey: character-encodings
featured: false
draft: false
tags:
  - 인코딩
  - 유니코드
  - UTF-8
  - 한글
  - C#
description: "ISO 8859-1부터 EUC-KR, CP949, UTF-8까지 정리한 글을 다시 봤다. 널리 퍼진 오해 세 개를 공식 문서와 직접 측정한 바이트로 바로잡고, 글자가 깨졌을 때 원인을 역추적하는 방법까지 정리했다."
---

Unity로 게임을 만들다가 C# 스크립트에 한글로 써둔 주석이 에디터에서 깨져
보이는 걸 발견했다. 원인과 해결 방법을 찾다가 문자 인코딩을 ISO 8859-1부터
EUC-KR, CP949, UTF-8까지 훑은
[글](https://velog.io/@mirrorkyh/iso-8859-1%EC%97%90-%EB%8C%80%ED%95%B4)을
스크랩해뒀었다. 한 페이지에 계보가 다 들어 있어서 개괄을 잡기에 좋다.

다만 여기에 **널리 퍼진 오해 세 개**가 그대로 들어 있다. 셋 다 이 글만의
문제가 아니라 한국어 자료에서 반복되는 것들이고, 그중 둘은 실제 버그로
이어진다. 공식 문서와 직접 측정한 바이트로 하나씩 짚었다.

## 목차

## 원문이 정리한 계보

먼저 맞는 부분부터. 원문이 잡은 흐름 자체는 정확하다.

- **ISO 8859-1** — 1바이트 256자. ASCII를 확장해 서유럽 언어를 담았다.
  191자가 그래픽 문자다. 동아시아 문자는 담을 수 없다.
- **EUC-KR** — 유닉스 계열에서 쓰인 한국어 인코딩. ASCII와 호환되고 한글은
  2바이트.
- **CP949 / MS 949** — 윈도우에서 쓰인 한국어 인코딩.
- **UTF-8** — 유니코드의 가변 길이 인코딩. 첫 128자가 ASCII와 같다.

"ASCII 호환"이라는 성질이 왜 중요한지, UTF-8이 왜 국제 환경의 기본이 됐는지도
바르게 짚는다. 문제는 세부다.

## 정정 1: 유니코드는 2바이트가 아니다

원문의 문장이다.

> 유니코드는 전 세계의 모든 문자를 2bytes로 매핑한 방식의 코드표를 의미하고

**아니다.** 유니코드 공식 FAQ의 서술을 그대로 옮긴다.

> In its first version, from 1991 to 1995, Unicode was a 16-bit encoding, but
> starting with Unicode 2.0 (July, 1996), the Unicode Standard has encoded
> characters in the range U+0000..U+10FFFF, which amounts to a **21-bit code
> space**.

**1996년에 이미 끝난 이야기다.** 초기 1~2년 동안만 16비트였고, 그 뒤로는
U+0000부터 U+10FFFF까지, 즉 **21비트** 공간이다. 2바이트로는 담기지 않는다.

이 오해가 왜 실제 버그가 되냐면, "한 글자 = 2바이트"라는 가정이 코드에
그대로 박히기 때문이다.

- **이모지와 일부 한자는 BMP 밖에 있다.** UTF-16에서는 이런 문자가
  **서로게이트 페어**, 즉 16비트 단위 **두 개**로 표현된다.
- C#의 `string.Length`, Java의 `String.length()`는 문자 수가 아니라 **UTF-16
  코드 유닛 수**를 센다. 이모지 하나가 길이 2로 나온다.
- 그래서 `substring`으로 문자열을 자르다가 서로게이트 페어 가운데를 끊으면
  글자가 깨진다. 닉네임 입력 제한, 채팅 말줄임 처리에서 자주 나온다.

"유니코드는 21비트 코드 공간이고, 2바이트로 담긴다는 보장은 없다"로 바꿔
기억하는 편이 안전하다.

## 정정 2: UTF-16은 UTF-8의 변형이 아니다

원문의 문장이다.

> UTF-16은 16bit 기반으로 저장하는 UTF-8의 변형이라고 보면 된다.

**둘은 부모-자식이 아니라 형제다.** 유니코드 FAQ는 UTF-8·UTF-16·UTF-32를
나란히 놓고 이렇게 정의한다.

> an algorithmic mapping from every Unicode code point to a unique byte
> sequence

셋 다 **같은 코드 포인트 표를 바이트로 옮기는 서로 다른 방법**이고, 어느
하나가 다른 하나에서 파생된 게 아니다. 차이는 기본 단위 크기다. UTF-8은
8비트, UTF-16은 16비트, UTF-32는 32비트 단위를 쓴다.

이 구분이 중요한 이유는, "UTF-8의 변형"이라고 생각하면 **UTF-16도 ASCII와
호환될 것 같다는 착각**으로 이어지기 때문이다. 그렇지 않다. UTF-16에서 `A`는
`41 00`(리틀 엔디언) 두 바이트이고, 널 바이트가 섞이므로 C 문자열이나
ASCII 전제 파서에 그대로 먹이면 깨진다.

## 정정 3: EUC-KR과 CP949는 포함 관계다

원문의 서술이다.

> MS 949는 EUC-KR과의 차이점이 있어, 두 인코딩 방식 간에는 완전한 호환성이
> 없습니다. 특히 MS 949는 한글 음절 조합 및 한글 자모 조합 규칙에 따라
> 한글을 표현하는데, EUC-KR과는 다른 방식을 사용합니다.

"다른 방식"이 아니다. **CP949는 EUC-KR을 확장한 상위 집합이다.**

> It is an extension of Wansung Code (KS C 5601:1987, encoded as EUC-KR) to
> include all 11172 non-partial Hangul syllables.

핵심 숫자는 이것이다.

- **EUC-KR(KS X 1001)** — 미리 조합된 한글 음절 **2,350자**만 코드가 있다.
- **CP949** — 현대 한글 음절 **11,172자** 전부를 담는다.

2,350자는 "자주 쓰는 것만" 고른 집합이라, 나머지 8,822자가 문제가 된다.
직접 바이트를 찍어보면 무슨 일이 일어나는지 바로 보인다.

| 글자 | EUC-KR | CP949 | UTF-8 |
| --- | --- | --- | --- |
| 가 | `b0a1` (2B) | `b0a1` (2B) | `eab080` (3B) |
| 한 | `c7d1` (2B) | `c7d1` (2B) | `ed959c` (3B) |
| 똠 | `a4d4a4a8a4c7a4b1` (**8B**) | `8c63` (2B) | `eb98a0` (3B) |
| 뷁 | `a4d4a4b2a4cea4aa` (**8B**) | `94ee` (2B) | `ebb781` (3B) |

`가`나 `한`처럼 2,350자 안에 있는 글자는 두 인코딩이 **완전히 같은 바이트**를
쓴다. 반면 `똠`은 EUC-KR에서 2바이트 코드가 없어서, `a4d4`로 시작하는
**8바이트 조합형 표현**으로 떨어진다. CP949는 확장 영역에 2바이트 코드를
따로 배정해 뒀다.

호환성이 **한 방향**이라는 것도 여기서 나온다.

```text
"똠방각하"를 CP949로 저장한 바이트: 8c63 b9e6 b0a2 c7cf
그 바이트를 EUC-KR로 읽으면      : �c방각하
```

뒤의 세 글자는 멀쩡한데 첫 글자만 깨진다. **EUC-KR 데이터는 CP949로 읽어도
문제가 없지만, 그 반대는 안 된다.** 90년대 한국 소프트웨어에서 특정 이름만
깨지던 현상의 정체가 이것이다.

## UTF-16이 한글에 유리하다는 건 절반만 맞다

원문의 서술이다.

> 한글의 경우 UTF-8로 저장할 경우 3bytes가 필요한데, UTF-16로는 2bytes면
> 가능해서 용량의 이점이 있다.

**글자 하나만 놓고 보면 맞다.** 문제는 실제 텍스트가 한글로만 되어 있지
않다는 것이다. `"한글 Hangul 123"`을 인코딩별로 재보면 이렇다.

| 인코딩 | 크기 |
| --- | --- |
| CP949 / EUC-KR | 15 바이트 |
| UTF-8 | 17 바이트 |
| UTF-16 | 26 바이트 |
| UTF-32 | 52 바이트 |

**UTF-16이 UTF-8보다 오히려 크다.** UTF-8은 ASCII를 1바이트로 처리하는데
UTF-16은 2바이트로 늘리기 때문이다. 공백, 숫자, 영문, 그리고 코드나 마크업의
태그·기호가 섞이면 그쪽 손해가 한글에서 아낀 1바이트씩을 금방 넘어선다.

원문도 뒤에서 "용량상의 큰 이점이 있다고 볼 수 없고"라고 스스로 물러서는데,
그 이유가 여기 있다. **순수 한글 본문이 아니면 대개 UTF-8이 더 작다.**

## 글자가 깨졌을 때 원인 역추적하기

원문에 없는 부분인데, 실무에서 필요한 건 사실 이쪽이다. 깨진 모양만 봐도
어디서 어긋났는지 좁힐 수 있다.

| 저장 | 읽기 | 결과 |
| --- | --- | --- |
| CP949 | UTF-8 | **에러** (`invalid continuation byte`) |
| UTF-8 | CP949 | `�븳湲� �뀒�뒪�듃` |
| UTF-8 | ISO 8859-1 | `íê¸ íì¤í¸` |
| CP949 | EUC-KR | 일부만 깨짐 (`�c방각하`) |

읽는 법은 이렇다.

- **한글이 다른 한글로 보인다** → UTF-8을 CP949로 읽고 있다. 한국 환경에서
  가장 흔하다.
- **`Ã`, `¬`, `í` 같은 라틴 문자가 줄줄이 나온다** → UTF-8을 ISO 8859-1이나
  Windows-1252로 읽고 있다. 서양 쪽 라이브러리를 거칠 때 나온다.
- **몇 글자만 콕 집어 깨진다** → CP949 데이터를 EUC-KR로 읽고 있다.
- **깨지는 게 아니라 예외가 난다** → 레거시 인코딩 데이터를 UTF-8로 읽고 있다.

마지막 항목의 비대칭이 유용하다. **UTF-8은 자기 검증적(self-validating)이다.**
바이트 배열 규칙이 엄격해서, 아무 바이트나 UTF-8로 해석하면 대개 규칙 위반이
걸려 예외가 난다. 반대로 CP949나 Latin-1은 거의 모든 바이트 조합을 무언가로
해석해버리므로 **조용히 깨진 글자**가 나온다.

그래서 실무 규칙 하나가 나온다. **예외가 나면 오히려 다행이다.** 조용히
깨지는 쪽이 훨씬 찾기 어렵다.

## Unity에서 한글 주석이 깨질 때

내가 이 자료를 찾게 된 상황이 이거였다. C# 스크립트에 한글로 써둔 주석이
Unity 에디터에서 깨져 보였다. 위의 진단표를 그대로 대보면 원인이 좁혀진다.

C# 컴파일러의 기본 동작이 문서에 명시되어 있다.

> The compiler first attempts to interpret all source files as UTF-8. If your
> source code files are in an encoding other than UTF-8 and use characters
> other than 7-bit ASCII characters, use the **CodePage** option to specify
> which code page should be used.

**소스 파일은 UTF-8로 간주된다.** 그런데 한국어 윈도우 환경의 편집기나 도구가
파일을 CP949로 저장하는 경우가 있고, 그러면 한글이 들어가는 순간 UTF-8 규칙에
맞지 않는 바이트가 되어 읽는 쪽에서 깨진다.

실제로 재현해보면 이렇다. `// 플레이어 이동 속도`를 CP949로 저장한 뒤
UTF-8로 읽으면 이렇게 나온다.

```text
// �÷��̾� �̵� �ӵ�
```

반대로 UTF-8 파일을 CP949로 읽으면 이렇게 나온다.

```text
// �뵆�젅�씠�뼱 �씠�룞 �냽�룄
```

**둘 중 어느 모양인지가 방향을 알려준다.** 앞쪽이면 파일이 CP949인데 UTF-8로
읽히는 것이고, 뒤쪽이면 파일은 UTF-8인데 읽는 쪽이 CP949를 가정하는 것이다.

해결은 파일을 UTF-8로 다시 저장하는 것이고, 확인할 곳은 세 군데다.

1. **기존 파일의 인코딩** — 편집기에서 "다른 인코딩으로 저장"으로 UTF-8로
   바꾼다. 여기서 함정이 하나 있다. **이미 깨져 보이는 상태로 저장하면 깨진
   채로 굳는다.** 원래 인코딩(CP949)으로 열어 글자가 제대로 보이는 것을 확인한
   뒤에 UTF-8로 저장해야 복구된다.
2. **새 파일의 기본 인코딩** — 편집기 기본값을 UTF-8로 바꿔둔다. 안 그러면
   다음 스크립트에서 같은 일이 반복된다.
3. **BOM을 붙일지** — UTF-8은 BOM이 없어도 되지만, `EF BB BF` 세 바이트가
   "이건 UTF-8이다"라는 표식이 되어 코드 페이지 추측을 막아준다. 윈도우
   환경에서 한글 주석이 반복해서 깨진다면 붙여보는 쪽이 해결이 빠르다. 다만
   BOM을 싫어하는 도구도 있으니 무조건은 아니다.

팀 프로젝트라면 재발 방지를 따로 걸어두는 게 낫다. 개인 편집기 설정에
의존하는 대신 `.editorconfig`에 못 박는 방법이 있다.

```editorconfig
[*.cs]
charset = utf-8
```

## C#에서 걸리는 지점

이 블로그 맥락에서 한 가지만 덧붙인다. `Encoding.Default`가 **런타임에 따라
다른 것을 반환한다.**

- **.NET Framework** — "Returns the encoding that corresponds to the system's
  active code page." 한국어 윈도우면 CP949다.
- **.NET Core / .NET 5 이상** — "Always returns a `UTF8Encoding` object."

즉 같은 `File.ReadAllText(path)` 한 줄이 **런타임에 따라 다르게 동작한다.**
레거시 도구에서 저장한 CP949 파일을 읽는 코드가 .NET Framework에서는 되고
.NET Core로 옮기면 깨지는 식이다.

해결은 간단하다. **인코딩을 명시하는 것**이다.

```csharp
// 추측하지 않는다
var text = File.ReadAllText(path, Encoding.UTF8);

// 레거시 파일을 읽어야 한다면 코드 페이지를 직접 지정
var legacy = File.ReadAllText(path, Encoding.GetEncoding(949));
```

.NET Core에서 `GetEncoding(949)`를 쓰려면
`CodePagesEncodingProvider`를 먼저 등록해야 한다는 점도 같이 걸린다.
기본 제공 인코딩 집합이 줄었기 때문이다.

## 정리

- **유니코드는 2바이트가 아니다.** 1996년 Unicode 2.0부터 U+0000..U+10FFFF,
  즉 21비트 공간이다. "한 글자 = 2바이트" 가정은 서로게이트 페어에서 깨진다.
- **UTF-16은 UTF-8의 변형이 아니다.** 셋 다 같은 코드 포인트를 바이트로
  옮기는 형제 관계이고, 단위 크기만 다르다. UTF-16은 ASCII 호환이 아니다.
- **CP949는 EUC-KR의 상위 집합이다.** "다른 방식"이 아니라 2,350자를
  11,172자로 확장한 것이다. 겹치는 글자는 바이트까지 같고, 호환은 한 방향뿐이다.
- EUC-KR에서 2,350자 밖의 한글은 **8바이트 조합형**으로 떨어진다. CP949는
  같은 글자를 2바이트로 담는다.
- **UTF-16이 한글에 작다는 건 글자 하나 기준이다.** 실제 텍스트에서는 ASCII
  때문에 대개 UTF-8이 더 작다.
- 깨진 모양으로 원인을 좁힐 수 있다. **UTF-8은 자기 검증적이라 예외를 내고,
  레거시 인코딩은 조용히 깨진다.**
- C#의 `Encoding.Default`는 .NET Framework에서 시스템 코드 페이지,
  .NET Core 이상에서 UTF-8이다. **인코딩은 명시할 것.**
- Unity에서 한글 주석이 깨지는 건 **C# 컴파일러가 소스를 UTF-8로 간주하는데
  파일이 CP949로 저장된** 경우다. 파일을 UTF-8로 다시 저장하되, **깨져 보이는
  상태로 저장하면 깨진 채로 굳는다.** 원래 인코딩으로 열어 확인한 뒤 바꿀 것.

## 참고

- [UTF-8, UTF-16, UTF-32 & BOM FAQ — Unicode](https://www.unicode.org/faq/utf_bom.html)
- [Unified Hangul Code — Wikipedia](https://en.wikipedia.org/wiki/Unified_Hangul_Code)
- [KS X 1001 — Wikipedia](https://en.wikipedia.org/wiki/KS_X_1001)
- [Encoding.Default — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.text.encoding.default)
- [C# compiler options: CodePage — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/advanced)
- 원문: [iso 8859-1, EUC-KR, MS 949, UTF-8](https://velog.io/@mirrorkyh/iso-8859-1%EC%97%90-%EB%8C%80%ED%95%B4)
