---
pubDatetime: 2026-10-05T17:10:00+09:00
title: "Lite 버전은 셰이더 목록에 뜨지 않는다"
lang: ko
translationKey: liltoon-setup
featured: false
draft: false
tags:
  - 셰이더
  - 그래픽스
  - Unity
  - lilToon
  - VRChat
  - 최적화
description: "lilToon 공식 문서의 소개 페이지다. Lite 버전은 직접 설정하지 말고 변환해서 쓰라고 권하면서 이유로 '직관적'을 적는다. 실제 이유는 그 셰이더 이름이 Hidden/으로 시작해서 머티리얼 드롭다운에 아예 뜨지 않는 것이다."
---

**툰 셰이더를 적용하다가** 스크랩한 글이다. 앞서
[lilToon 파라미터를 항목별로 대조](/posts/liltoon-parameters/)했고, 그걸 만지다가
[셰이더가 무엇인지](/posts/what-is-a-shader/)까지 내려갔다. 이번은 **적용하는
방법 자체를 상세하게 찾던 중** 걸린 페이지다 — lilToon 공식 문서의
**「はじめに」(소개)**, 설치부터 셰이더 변종 목록까지 한 장에 담긴 입구다.

파라미터 글에서는 **인스펙터 항목**을 봤고, 이 글에서는 **그 인스펙터에 도달하기
전에 고르는 것들**을 본다. 설치 경로, 어떤 셰이더를 고를지, 어떤 Unity 버전에서
돌아가는지다. 파라미터 하나를 몰라서 막히는 일보다, **이 입구에서 잘못 고르고
한참 뒤에 알게 되는 일**이 비용이 크다.

걸리는 데가 하나 있다. 문서는 셰이더 변종 표의 마지막 줄에서 이렇게 권한다.

> Lite版から直接マテリアルを設定せず、通常版で作成したものを変換するとより直感的にマテリアル設定が可能です。
>
> (Lite판에서 직접 머티리얼을 설정하지 말고, 통상판으로 만든 것을 변환하면 더
> 직관적으로 머티리얼 설정이 가능합니다.)

이유로 적힌 게 **「직관적」**이다. 취향 문제처럼 읽힌다. 그런데 같은 표의 같은
줄에 적힌 셰이더 이름이 `Hidden/lilToonLite`다. **그 이름으로 시작하는 셰이더는
머티리얼 인스펙터의 셰이더 드롭다운에 아예 올라오지 않는다.** 변환을 권하는 건
더 직관적이라서가 아니라, 그게 사실상 유일한 경로이기 때문이다.

## 목차

## 설치 경로 셋은 결과가 다르다

STEP 1은 설치 방법 셋을 나열하고 **「어느 한 쪽이든」**(どれか一つ) 가라고 한다.

| 경로 | 받는 곳 | 갱신 |
| --- | --- | --- |
| `.unitypackage` | BOOTH에서 zip 다운로드 → Project 창에 드래그 | 수동. 새 버전을 다시 받아 다시 임포트 |
| VPM (VCC / ALCOM) | `vpm.json` 리포지터리를 등록 → 패키지 목록에서 설치 | 패키지 목록의 버전 중에서 고름 |
| UPM Git URL | Package Manager에 Git URL 입력 | Package Manager의 Update |

결과가 같지 않다. 셋이 갈리는 지점은 **설치 이후**다.

`.unitypackage`는 파일을 프로젝트에 풀어놓는 것뿐이다. 버전 정보가 프로젝트에
남지 않으니, 갱신은 "새 zip을 받아 다시 임포트"가 된다. 그래서 **이미 들어 있는
파일을 덮어쓴다.**

문서 자신이 그 문제를 다른 절에서 경고한다. 「lilToon을 이용한 제작물 배포」
항목이다.

> シェーダー本体と制作物を1つのunitypackageにまとめる方法は、ユーザーがインポート時に古いバージョンで上書きしてしまう問題が発生する可能性があるため非推奨です
>
> (셰이더 본체와 제작물을 하나의 unitypackage로 묶는 방법은, 사용자가 임포트할
> 때 **낡은 버전으로 덮어쓰는** 문제가 발생할 수 있어 비권장입니다.)

**STEP 1에서 "아무거나 고르라"고 한 그 경로가, 배포 절에서는 비권장의 이유가
된다.** 두 절이 모순은 아니다. 내가 설치할 때는 내가 버전을 알지만, 배포본에
끼워 넣으면 받는 쪽의 버전을 모르기 때문이다. 다만 **"어느 한 쪽이든"이라는
문장은 그 차이를 가린다.**

UPM Git URL 경로는 Unity 문서가 조건을 따로 달아둔다.

> Install the Git client (minimum version 2.14.0) on your computer.

Windows에서는 Git 실행 파일 경로를 `PATH` 환경 변수에 추가해야 한다. 그리고 두
가지 주의가 붙는다.

> there's no guarantee about the package quality, stability, validity, or even
> whether the version stated in its `package.json` file respects Semantic
> Versioning rules.

> If the Git repository uses Git LFS, the imported package might contain pointer
> files instead of the actual content.

**레지스트리 경로와 달리 버전 규칙이 보증되지 않는다.** Git LFS를 쓰는
리포지터리면 실제 내용 대신 포인터 파일이 들어올 수 있다는 것도 레지스트리에서는
없는 함정이다. [Newtonsoft Json 설치를 다룬 글](/posts/unity-newtonsoft-json-install/)에서
Package Manager의 버전 칸을 비우는 이유를 봤는데, Git URL은 그 버전 칸 자체가
없는 경로다.

VRChat 아바타용이라면 선택은 사실 정해져 있다. 문서가 배포 절에서 **VCC 설치를
안내하라**고 권하는 쪽이고, VPM 경로만 셰이더 버전을 프로젝트 매니페스트에
남긴다.

## 셰이더 이름이 머티리얼 드롭다운을 결정한다

문서 마지막 표가 셰이더 변종 여섯 개를 나열한다. 이름을 그대로 적으면 이렇다.

| 이름 | 용도 (문서 요약) |
| --- | --- |
| `lilToon` | 메인 셰이더. 일반적인 용도에는 이것 |
| `_lil/[Optional] lilToonOverlay` | 머티리얼 위에 겹치는 투과 셰이더. 불필요한 패스가 제거돼 통상 투과를 겹치는 것보다 저부하 |
| `_lil/[Optional] lilToonOutlineOnly` | 윤곽선 전용. 하드 에지 모델에 법선이 매끄러운 메시를 따로 두고 할당하면 더 깨끗한 윤곽선 |
| `_lil/[Optional] lilToonFurOnly` | 퍼의 털 부분만 그림. 통상 셰이더에 겹치거나, 컷아웃 퍼와 투과 퍼를 조합할 때 |
| `_lil/lilToonMulti` | 셰이더 키워드를 쓰는 버전. 머티리얼을 대량으로 쓰면 빌드 크기가 커지기 쉬움 |
| `Hidden/lilToonLite` | 통상판의 외형을 어느 정도 유지하며 대폭 경량화 |

**이 이름들은 설명이 아니라 주소다.** Unity 문서가 그걸 명시한다. `Shader.Find`
페이지는 인자로 받는 이름을 이렇게 설명한다.

> the name you can see in the shader popup of any material, for example
> 'Standard', 'Unlit/Texture', 'Legacy Shaders/Diffuse' etc.

즉 `Shader "..."`에 적은 문자열이 **머티리얼의 셰이더 팝업에 보이는 그
경로**다. 슬래시는 서브메뉴가 된다.

### `Hidden/`으로 시작하면 목록에 없다

문서는 `Hidden/` 접두사가 무엇을 하는지 설명하지 않는다. **Unity 매뉴얼에도
없다.** 셰이더 이름 문법을 다루는 `ShaderLab` 페이지는 "Defines a Shader object
with a given name" 수준에서 끝난다.

동작은 에디터 소스에 있다. 머티리얼 인스펙터의 셰이더 드롭다운 목록을 만드는
`MaterialEditor.cs`의 `ShaderDropdownDataBuilder.EnumerateShaders`가 첫
필터로 이걸 한다.

```csharp
var shaders = ShaderUtil.GetAllShaderInfo();
foreach (var shader in shaders)
{
    var shaderName = shader.name;
    if (shaderName.StartsWith("Deprecated") || shaderName.StartsWith("Hidden"))
        continue;
    // ...
}
```

`continue`다. **서브메뉴로 접어두는 게 아니라 열거 자체에서 빠진다.** 그래서
`Hidden/lilToonLite`는 드롭다운을 아무리 뒤져도 없다.

세부가 하나 있다. 비교하는 문자열이 `"Hidden/"`이 아니라 **`"Hidden"`**이다.
슬래시가 없다. `HiddenThing`이라는 이름의 셰이더를 만들어도 같이 사라진다.
그리고 `StringComparison`을 주지 않았으므로 컬처에 의존하는 비교다 — 터키어
로케일의 `I` 문제 같은 자리인데, `Hidden`은 대문자 I가 없어서 실무에서 걸리지는
않는다.

여기까지 맞춰보면 문서의 그 권고가 다시 읽힌다. **"Lite판에서 직접 머티리얼을
설정하지 말라"는 건 권고가 아니라 사실 서술에 가깝다.** 드롭다운에서 고를 수가
없다. 대신 lilToon은 [최적화 페이지](https://lilxyzw.github.io/lilToon/ja_JP/other/optimization.html)에
**변환 기능**을 둔다 — Lite판, Multi판, MToon(VRM용)으로 바꾸는 버튼이다. 그
버튼이 `Hidden/`을 우회하는 경로다.

### `_lil/`은 접두사가 아니라 서브메뉴다

같은 표에서 넷은 `_lil/`로 시작한다. 문서는 이렇게 말한다.

> "\_lil"内にあるシェーダーは特殊なものなので、基本的には通常の"lilToon"を選択してください
>
> (`_lil` 안에 있는 셰이더는 특수한 것이므로, 기본적으로는 통상의 `lilToon`을
> 선택해 주세요.)

**「_lil 안에 있는」**이라는 표현이 정확하다. 접두사가 특별한 뜻을 갖는 게 아니고,
슬래시 앞부분이 메뉴 폴더 이름이 된다. `_lil`이라는 이름은 알파벳 앞에 오도록
밑줄을 붙인 관례일 뿐이다.

같은 `EnumerateShaders`가 그다음 줄에서 슬래시 유무로 목록을 나눈다.

```csharp
if (shaderName.StartsWith("Legacy Shaders/")) { legacy.Add(shaderName); continue; }

if (!shaderName.Contains("/")) { unnested.Add(shaderName); continue; }

normal.Add(shader.name);
```

슬래시가 **없는** 이름은 `unnested`로 따로 모인다. 그리고 두 리스트는 각각
정렬돼 `normal` → `unnested` 순으로 나온다. 즉 `lilToon`은 서브메뉴 안이 아니라
**최상위 항목**이고, `_lil/...` 넷은 `_lil` 서브메뉴 안에 들어간다.

문서의 "기본적으로 통상의 `lilToon`을 선택"은 그래서 **"서브메뉴에 들어가지
말고 최상위에 있는 걸 고르라"**는 말이다.

### 목록에 떴다고 쓸 수 있는 건 아니다

`EnumerateShaders`의 나머지 분기도 읽어둘 값이 있다. 컴파일 실패와 미지원이
따로 분류된다.

```csharp
if (shader.hasErrors) { failed.Add(shaderName); continue; }
if (!shader.supported) { notSupported.Add(shaderName); continue; }
```

`notSupported`와 `failed`는 목록에서 제거되지 않고 **별도 분류로 표시**된다.
이게 lilToon의 셰이더 모델 표와 연결된다.

| 변종 | 셰이더 모델 |
| --- | --- |
| 통상판 | SM4.0 · ES3.0 |
| 경량판 | SM3.0 · ES2.0 |
| 퍼 | SM4.0 · ES3.1+AEP · ES3.2 |
| 테셀레이션 | SM5.0 · ES3.1+AEP · ES3.2 |

테셀레이션은 SM5.0을 요구한다. 그 요구를 만족하지 못하는 빌드 타깃에서는
드롭다운에 **뜨긴 뜨는데 미지원으로 표시된다.** 목록에 이름이 보이는 것과 그게
동작하는 것은 다른 이야기다.

## 지원 목록이 가리키는 시점

「対応状況」(응답 상태) 절은 네 묶음으로 되어 있다. 그중 렌더 파이프라인
목록이 이렇다.

> - ビルトインレンダーパイプライン
> - ライトウェイトレンダーパイプライン
> - ユニバーサルレンダーパイプライン
> - ハイデフィニションレンダーパイプライン

둘째 줄이 **Lightweight Render Pipeline**, 곧 LWRP다. 셋째 줄이 URP다. **둘이
같이 적혀 있다.** 그런데 Unity 공식 문서의 이행 가이드는 한 문장으로 시작한다.

> The Universal Render Pipeline (URP) replaces the Lightweight Render Pipeline
> (LWRP) in Unity 2019.3.

**2019.3에서 URP가 LWRP를 대체했다.**
[렌더 파이프라인을 정리한 글](/posts/render-pipelines-overview/)에서 봤듯 파이프라인은
에셋으로 지정하는 것이고, LWRP 에셋은 그 버전부터 존재하지 않는다. 그리고 같은
페이지의 Unity 버전 목록은 `2022.3`, `2023.1～2023.3`이다. **지원한다고 적힌 가장 낮은 버전이
2022.3이라서, LWRP를 쓸 수 있는 프로젝트가 그 범위 안에 하나도 없다.** 같은
페이지의 두 목록이 서로를 부정한다.

이게 단순한 방치는 아니다. lilToon의 개발자 문서
([셰이더의 구조](https://lilxyzw.github.io/lilToon/ja_JP/dev/shader_structure.html))를
보면 파이프라인 대응이 어떻게 구현됐는지 나온다.

> パイプライン対応（Built-in/LWRP/URP/HDRP）もスクリプトで`lil_pipeline.hlsl`を書き換えることで実装されています
>
> (파이프라인 대응(Built-in/LWRP/URP/HDRP)도 스크립트로 `lil_pipeline.hlsl`을
> **다시 써서** 구현되어 있습니다.)

**내부 매크로 이름 쪽에 `LWRP`가 남아 있다.** 지원 목록의 그 줄은 셰이더 소스의
분기 이름을 그대로 옮긴 결과로 보인다. 코드에 남은 이름이 문서의 지원 목록으로
새어 나온 자리다.

버전 목록 쪽도 한 줄이 걸린다. `2023.3`이다. Unity는 그 버전 번호를 출하하지
않았다.

> Unity 6 represents the beginning of the next generation of the Unity Engine
> and is the new official version name for what was previously referred to as
> Unity 2023 LTS.

**2023 LTS가 될 예정이던 스트림이 Unity 6이라는 이름으로 나왔다.** 2023.1과
2023.2는 테크 스트림으로 실제 출하됐지만, 2023.3은 정식 릴리스 번호로 존재하지
않는다. 지원 목록의 마지막 줄은 베타 번호를 가리키고 있는 셈이다.

그러면 실제로 무엇이 검증된 버전인가. 같은 절의 「동작 확인 환경」이 답한다.

> Unity 2022.3.22f1(ビルトインRP / URP 14.0.8 / HDRP 14.0.8)

이 숫자가 어디서 왔는지는 VRChat 문서를 보면 바로 나온다.

> The current Unity version used by VRChat is 2022.3.22f1

> It is safe to remain on VRChat's supported version of the Unity editor
> (`2022.3.22f1`). Upgrading your version will result in content not loading
> once uploaded to VRChat

**`2022.3.22f1`은 VRChat이 요구하는 바로 그 버전이다.** 소수점 뒤까지 같다.
lilToon의 지원 목록은 Unity의 현행 릴리스가 아니라 **VRChat의 에디터 버전에
고정**되어 있다. 아바타용 셰이더로서는 합리적인 선택이고, 문서를 읽는 쪽에서는
**"Unity 6에서 되나?"의 답이 그 목록에 없다**는 뜻이 된다.

## Multi가 키워드로 치르는 비용

셰이더 변종 표에서 설명이 가장 짧으면서 함의가 큰 줄이 `_lil/lilToonMulti`다.

> シェーダーキーワードを利用するバージョンです。マテリアルを大量に使用する場合などにビルドサイズが大きくなりやすいため注意が必要です。
>
> (셰이더 키워드를 이용하는 버전입니다. 머티리얼을 **대량으로 사용하는 경우**
> 빌드 크기가 커지기 쉬우므로 주의가 필요합니다.)

왜 키워드가 머티리얼 개수와 빌드 크기를 잇는지는
[커스텀 셰이더 글](/posts/unity-custom-shaders/)에서 본 규칙 그대로다. 배리언트는
키워드 집합의 **곱**으로 늘어나고, Unity 문서는 결과를 이렇게 적는다.

> A large number of variants can result in increased build times, file sizes,
> runtime memory usage, and loading times.

여기서 새로 걸리는 건 **통상판은 키워드를 쓰지 않는다**는 쪽이다. 앞서 본 개발자
문서의 그 문장이 메커니즘을 알려준다 — 파이프라인 분기를 **스크립트로 HLSL
파일을 다시 써서** 만든다. 기능 온·오프도 같은 방식이다. lilToon의
[셰이더 설정](https://lilxyzw.github.io/lilToon/ja_JP/other/settings.html)
페이지는 그 설정이 **전 머티리얼 공통**이고, 거기서 기능을 끄면 **셰이더에서
제거된다**고 설명한다.

두 방식을 나란히 두면 교환 관계가 보인다.

| | 통상판 | `lilToonMulti` |
| --- | --- | --- |
| 기능 온·오프 | 셰이더 설정 (전 머티리얼 공통, 소스에서 제거) | 머티리얼별 셰이더 키워드 |
| 머티리얼마다 다른 기능 조합 | 안 됨 — 설정이 전역 | 됨 |
| 머티리얼이 늘 때 배리언트 | 늘지 않음 | 조합마다 늘어남 |
| 빌드 크기 | 켠 기능만큼 | 쓰는 키워드 조합만큼 |

**통상판은 유연성을 포기하고 배리언트 수를 고정했고, Multi는 그 반대다.**
문서의 "머티리얼을 대량으로 사용하는 경우 주의"는 이 교환의 Multi 쪽 비용을
가리킨 것이다.

여기서 한 가지는 바로잡아야 한다. Multi가 Unity 표준 키워드(`_NORMALMAP`,
`_EMISSION`, `_METALLICGLOSSMAP` 등)를 재활용하는 이유로 개발자 문서는
**키워드 고갈 방지**를 든다. 그게 실제 제약이었던 시기가 있다. Unity 2020.3
매뉴얼은 이렇게 적었다.

> There is a limit of 384 global shader keywords, and Unity uses around 60 of
> them internally (therefore lowering the available number). Each individual
> shader has a limit of 64 local keywords.

그런데 lilToon이 지원한다고 적은 **2022.3** 매뉴얼의 같은 페이지는 숫자가
다르다.

> Unity can use up to 4,294,967,294 global shader keywords. Individual shaders
> and compute shaders can use up to 65,534 local shader keywords.

**384에서 42억으로 바뀌었다.** 지원 버전 범위 안에서는 전역 키워드 개수가 더는
희소 자원이 아니다. 남아 있는 제약은 다른 줄이다.

> If a shader uses more than 128 keywords in total, it incurs a small runtime
> performance penalty; therefore, it is best to keep the number of keywords low.

즉 지금 Multi를 고를 때 재는 것은 **고갈이 아니라 128개 선과 배리언트 수**다.
그리고 머티리얼을 여럿 두는 것 자체는 비용이 아니다 —
[셰이더가 무엇인지 본 글](/posts/what-is-a-shader/)에서 SRP Batcher 문서가
그렇게 못 박았다. 배치를 가르는 건 머티리얼 개수가 아니라 **셰이더 배리언트**다.
Multi의 비용이 머티리얼 개수에 비례하는 이유가 정확히 거기에 있다. 머티리얼이
늘어서 비싼 게 아니라, **머티리얼마다 키워드 조합이 달라져서** 비싸진다.

## 용어 표를 다시 적는다

소개 페이지는 「登場する用語」(등장하는 용어) 표로 시작한다. 3DCG를 처음
다루는 쪽을 위한 여덟 줄이다. 그런데 이 표가 한국어 2차 자료에서 가장 많이
망가지는 자리다. 내가 받은 번역본은 이랬다.

| 번역본 | 원문 | 바른 표기 |
| --- | --- | --- |
| 재료 | マテリアル | **머티리얼** |
| 질감 | テクスチャ | **텍스처** |
| 일반 지도 | ノーマルマップ | **노멀 맵** |
| 매트 캡 | マットキャップ | **매트캡** |
| 모피 / 털털 | ファー | **퍼** |
| 북 셰이더 | 本シェーダー | **본 셰이더(이 셰이더)** |

`マテリアル`이 **재료**가 된 건 영어 *material*의 다른 뜻을 거쳐 간 결과다.
`ノーマルマップ`은 normal(일반) + map(지도)로 분해돼 **일반 지도**가 됐다.
가장 알아보기 힘든 건 마지막 줄이다. 라이선스 절의 `本シェーダー`는 **「이
셰이더」**인데, `本`을 책으로 읽어 **북 셰이더**가 됐다.

[파라미터 글](/posts/liltoon-parameters/)에서 **「림 라이트의 벌금」**을 다뤘다.
`細さ`(가늘기) → *fine* → 벌금으로 두 번 건너간 경로였다. 같은 종류의 사고가
용어 표에서도 난다.

이 번역본에는 종류가 다른 사고도 하나 있다. STEP 2 본문 중간에 이런 문장이
끼어 있다.

> 위원회는 당사국이 모든 아동에게 적절한 음식, 의복, 보호소, 의료 및 의료
> 서비스를 포함하여 적절하고 적절한 의료 서비스를 제공할 수 있도록 필요한 모든
> 조치를 취할 것을 권고합니다.

셰이더 문서다. 원문 STEP 2에는 대응하는 문장이 없다 — 아동권리위원회 권고문에
가까운 문장이 **없는 자리에 생성됐다.** 기계 번역의 오역과는 다른 층의 문제다.
**오역은 원문을 잘못 옮긴 것이고, 이건 원문에 없는 것이 들어온 것이다.**
용어가 틀린 건 대조하면 복구되지만, 이쪽은 원문을 봐야 존재 자체를 알 수 있다.

바른 용어로 다시 적으면 표는 이렇게 된다.

| 용어 | 설명 (원문 기준) |
| --- | --- |
| 머티리얼 | 사물이 어떻게 보일지를 정하는 데이터 |
| 텍스처 | 이미지. 사물의 색을 정하는 등 여러 곳에 쓰인다 |
| UV | 텍스처를 붙일 위치를 정하는 데이터 |
| 마스크 | 처리를 적용할 부분을 지정하는 텍스처 |
| 노멀 맵 | 표면에 요철이 있는 것처럼 보이게 하는 텍스처 |
| 매트캡 | 빛의 반사를 그려 넣은 텍스처 |
| 림 라이트 | 역광처럼 빛이 돌아 들어와 윤곽만 밝아지는 라이트 |
| 스텐실 | 화면상에서 수행되는 마스크 표현 |

머티리얼과 텍스처의 관계는
[셰이더가 무엇인지 본 글](/posts/what-is-a-shader/)의 Unity 문서 정의와 같은
선을 긋는다 — 머티리얼은 **"표면을 어떻게 렌더링할지 정의하는 에셋"**이고 그
안에 셰이더 참조가 있다. 소개 페이지의 「사물이 어떻게 보일지를 정하는 데이터」는
그 정의를 한 줄로 줄인 것이다.

텍스처 할당 위치 표도 같이 고쳐 적어둔다. 번역본의 **「일반지도 설정 → 일반지도
→ 일반지도」** 같은 줄은 인스펙터에서 찾을 수 없다.

| 텍스처 종류 | 인스펙터 경로 |
| --- | --- |
| 메인 텍스처 | 기본 색상 설정 → 메인 컬러 → 텍스처 |
| 노멀 맵 | 노멀 맵 설정 → 노멀 맵 → 노멀 맵 |
| 아웃라인 마스크 | 윤곽선 설정 → 윤곽선 → 마스크와 두께 |
| 섀도 마스크 | 그림자 설정 → 그림자 → 마스크와 강도 |
| 매트캡 | 매트캡 설정 → 매트캡 → 매트캡 |
| 매트캡 마스크 | 매트캡 설정 → 매트캡 → 마스크 |
| 림 라이트 마스크 | 림 라이트 설정 → 림 라이트 → 색상 / 마스크 |
| 이미션 (마스크) | 발광 설정 → 발광 텍스처 → 색상 |

## 어디에 왜 쓰나

### 머티리얼이 어떤 변종을 쓰는지 확인한다

아바타 하나에 머티리얼이 열 개를 넘어가면, 어느 게 통상판이고 어느 게 변환된
Lite인지 인스펙터로 하나씩 확인하기 번거롭다. 셰이더 이름이 곧 분류이므로
코드로 훑을 수 있다.

```csharp
using System;
using UnityEngine;

public class ShaderVariantReport : MonoBehaviour
{
    private const string HIDDEN_PREFIX = "Hidden/";
    private const string SUBMENU_PREFIX = "_lil/";
    private const string LILTOON_NAME = "lilToon";

    [Header("Targets")]
    [SerializeField, Tooltip("검사할 렌더러. 비우면 자식에서 전부 모은다")]
    private Renderer[] _targets;

    private void Start()
    {
        if (_targets == null || _targets.Length == 0)
        {
            // 비활성 오브젝트까지 포함한다.
            _targets = GetComponentsInChildren<Renderer>(true);
        }

        foreach (Renderer target in _targets)
        {
            // sharedMaterials를 읽는다. materials를 읽으면 전부 복제된다.
            foreach (Material material in target.sharedMaterials)
            {
                if (material == null)
                {
                    continue;
                }

                string shaderName = material.shader.name;
                Debug.Log($"{target.name} / {material.name} → {shaderName} [{Classify(shaderName)}]", target);
            }
        }
    }

    private static string Classify(string shaderName)
    {
        // StringComparison을 명시한다. Unity 에디터 소스는 이걸 생략하고 있다.
        if (shaderName.StartsWith(HIDDEN_PREFIX, StringComparison.Ordinal))
        {
            return "드롭다운에 없는 셰이더";
        }

        if (shaderName.StartsWith(SUBMENU_PREFIX, StringComparison.Ordinal))
        {
            return "_lil 서브메뉴";
        }

        if (shaderName == LILTOON_NAME)
        {
            return "통상판";
        }

        return "lilToon 아님";
    }
}
```

`material == null` 비교가 `?.`가 아닌 이유는
[Fake Null을 다룬 글](/posts/unity-fake-null/)에 있다. Unity 오브젝트는 파괴된
뒤에도 관리 측 참조가 남아 있어서, `?.`는 그 상태를 걸러내지 못한다.

`sharedMaterials` 쪽도 의도가 있다. `materials`를 읽으면 렌더러의 머티리얼이
전부 복제된다. **읽기만 하는 코드가 머티리얼을 늘리는 것**은 앞 글에서
`Renderer.material`로 본 그 함정이고, 여기서는 읽기만 하면 되므로 공유본을
본다.

### 품질에 따라 Lite로 바꿀 때

Lite판은 드롭다운에 없으므로, 런타임 전환은 **에디터에서 미리 변환해 둔
머티리얼을 교체하는** 모양이 된다. 셰이더를 바꿔 끼우는 게 아니다 — 통상판과
Lite판은 프로퍼티 집합이 다르기 때문이다.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class QualityMaterialSwap : MonoBehaviour
{
    private const int DEFAULT_LITE_THRESHOLD = 2;

    [Header("Materials")]
    [SerializeField, Tooltip("통상판으로 만든 머티리얼")]
    private Material _normalMaterial;

    [SerializeField, Tooltip("에디터에서 Lite로 변환해 둔 머티리얼")]
    private Material _liteMaterial;

    [Header("Switch")]
    [SerializeField, Range(0, 5), Tooltip("이 품질 레벨 이하에서 Lite를 쓴다")]
    private int _liteThreshold = DEFAULT_LITE_THRESHOLD;

    private void Awake()
    {
        if (!TryGetComponent(out Renderer targetRenderer))
        {
            return;
        }

        bool useLite = QualitySettings.GetQualityLevel() <= _liteThreshold;
        Material selected = useLite ? _liteMaterial : _normalMaterial;

        if (selected == null)
        {
            return;
        }

        // 복제는 material을 '읽을' 때 일어난다. 여기서는 에셋을 그대로 대입한다.
        targetRenderer.sharedMaterial = selected;
    }
}
```

**두 머티리얼을 인스펙터 참조로 들고 있는 게 핵심이다.** 이름으로 찾는 길도
있지만 그쪽은 빌드에서 걸린다. `Shader.Find` 문서의 경고다.

> A shader might be not included into the player build if nothing references it.
> In that case, Shader.Find will work only in the Editor, and will result in the
> pink error shader in a build.

**에디터에서는 되고 빌드에서는 분홍색이 된다.** 문서가 제시하는 해법 셋 중
첫째가 "씬에서 쓰는 머티리얼이 참조하게 하라"인데, 위 코드의 `[SerializeField]`
머티리얼 참조가 바로 그 조건을 만든다. 나머지 둘은
`ProjectSettings/Graphics`의 **Always Included Shaders**에 넣는 것과, 셰이더나
머티리얼을 `Resources` 폴더에 두는 것이다.

### 쓰지 말아야 할 자리

- **런타임에 셰이더만 바꿔 끼우는 것.** 통상판과 Lite판은 프로퍼티 집합이
  다르다. `material.shader = liteShader`로 바꾸면 겹치지 않는 값이 기본값으로
  떨어진다. 머티리얼 단위로 교체한다.
- **`Hidden/` 셰이더를 `Shader.Find`로만 참조하는 것.** 위의 분홍색 자리다.
  인스펙터 참조나 Always Included Shaders를 같이 둔다.
- **머티리얼 개수를 줄이려고 Multi로 통합하는 것.** 방향이 반대다. Multi는
  머티리얼이 많을 때 **불리한** 쪽이고, 머티리얼을 여럿 두는 것 자체는 같은
  셰이더라면 비용이 아니다.
- **`.unitypackage`로 설치해 두고 버전을 추적하려는 것.** 프로젝트에 버전이
  남지 않는다. VRChat 작업이면 VPM 경로를 쓴다.
- **지원 목록의 `2023.3`을 보고 Unity 6에서 된다고 읽는 것.** 그 번호는 Unity
  6으로 이름이 바뀐 스트림의 베타 번호다. 검증된 건 `2022.3.22f1` 하나다.

## 정리

- **`Hidden/`은 숨기는 게 아니라 열거에서 빼는 것이다.** `EnumerateShaders`가
  `StartsWith("Hidden")`에서 `continue`한다. `Hidden/lilToonLite`가 드롭다운에
  없는 이유이고, 문서가 **변환을 권하는 실제 이유**다. 문서에 적힌 이유는
  「직관적」이다.
- **`_lil/`은 접두사가 아니라 메뉴 경로다.** 슬래시 있는 이름과 없는 이름이
  따로 모이므로, `lilToon`은 최상위에 있고 특수 넷은 서브메뉴에 들어간다.
- **지원 목록의 두 줄이 서로를 부정한다.** URP는 2019.3에서 LWRP를 대체했고,
  같은 페이지가 지원하는 최저 버전은 2022.3이다. LWRP 줄은 내부 매크로 이름이
  새어 나온 자리로 보인다.
- **`2023.3`은 출하되지 않은 번호다.** Unity 2023 LTS가 Unity 6이라는 이름으로
  나왔다. 실제 검증된 환경은 `2022.3.22f1`이고, 그건 **VRChat이 요구하는 바로
  그 버전**이다.
- **통상판과 Multi는 유연성과 배리언트를 맞바꾼다.** 통상판은 전역 셰이더 설정
  으로 기능을 소스에서 제거하고, Multi는 머티리얼별 키워드를 쓴다. 문서의 빌드
  크기 경고는 후자의 비용이다.
- **키워드 고갈은 2022.3에서 더는 제약이 아니다.** 2020.3 문서의 384개가 42억
  개로 바뀌었다. 남은 선은 셰이더당 **128개**와 배리언트 수다.
- **설치 경로 셋은 결과가 다르다.** "어느 한 쪽이든"이라는 문장이 그 차이를
  가리는데, 문서 자신이 배포 절에서 덮어쓰기 문제로 그 차이를 경고한다.

---

### 참고

- [はじめに — lilToon 공식 문서 (일본어)](https://lilxyzw.github.io/lilToon/ja_JP/first.html)
- [シェーダー設定](https://lilxyzw.github.io/lilToon/ja_JP/other/settings.html) ·
  [最適化](https://lilxyzw.github.io/lilToon/ja_JP/other/optimization.html) ·
  [シェーダーの構造](https://lilxyzw.github.io/lilToon/ja_JP/dev/shader_structure.html)
- [MaterialEditor.cs — UnityCsReference (`ShaderDropdownDataBuilder.EnumerateShaders`)](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Editor/Mono/Inspector/MaterialEditor.cs)
- [Shader.Find — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Shader.Find.html)
- [Shader keywords — Unity 2022.3 매뉴얼](https://docs.unity3d.com/2022.3/Documentation/Manual/shader-keywords.html) ·
  [Shader keywords — Unity 2020.3 매뉴얼 (384개 시절)](https://docs.unity3d.com/2020.3/Documentation/Manual/shader-keywords.html)
- [Shader variants — Unity 매뉴얼](https://docs.unity3d.com/Manual/shader-variants.html)
- [Upgrading from LWRP to URP — URP 문서](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/upgrade-lwrp-to-urp.html)
- [Install a UPM package from a Git URL — Unity 매뉴얼](https://docs.unity3d.com/Manual/upm-ui-giturl.html)
- [Unity 6 is here: See what's new — Unity 블로그](https://unity.com/blog/unity-6-features-announcement)
- [Current Unity Version — VRChat Creator Docs](https://creators.vrchat.com/sdk/upgrade/current-unity-version/)
- [lilxyzw/lilToon — GitHub (MIT)](https://github.com/lilxyzw/lilToon)

이 글의 출발점이 된 자료는 lilToon 공식 문서의
[はじめに](https://lilxyzw.github.io/lilToon/ja_JP/first.html) 페이지를 한국어로
옮긴 스크랩이다. 용어와 설치 절차는 일본어 원문과 다시 대조했고, 셰이더 이름이
드롭다운에서 어떻게 처리되는지는 Unity 에디터 소스에서 확인했다.
