---
pubDatetime: 2026-10-14T22:00:00+09:00
title: "영상이 가르치는 세 단계가 이 에셋이 교체된 세 이유다"
lang: ko
translationKey: unitychan-toon-shader
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - 그래픽스
  - 렌더링
  - URP
  - 최적화
description: "툰 셰이더를 올릴 예시 모델로 유니티짱을 쓰면서 방법을 찾다 스크랩한 2022년 영상이다. 지금 저장소를 열면 '유지보수나 릴리스 계획 없이 제공된다'고 적혀 있고, 후속 패키지 문서가 교체 사유 셋을 적어둔다 — 설치 방식, 파이프라인, 라이선스. 그 셋이 영상의 챕터 번호와 겹친다."
---

**툰 셰이더를 올려볼 예시 모델로 유니티짱을 쓰고 있었다.** 셀 셰이딩이
어떻게 나오는지 보기에 이만한 캐릭터가 없어서였고, 그 모델에 툰 셰이더를
적용하는 방법을 찾다가 이 영상을 스크랩했다. 2022년 3월에 올라온, 유니티재팬의
**유니티짱 툰쉐이더 V2**(UTS2)로 캐릭터를 카툰렌더링하는 흐름을 다섯 챕터로
나눠서 보여주는 소개 영상이다. 설명란에 챕터 목록이 그대로 적혀 있다.

> 01 00:00 설치하기
>
> 02 01:00 툰쉐이더 모습
>
> 03 02:00 적용해보기
>
> 04 07:17 데포르메 스타일
>
> 05 09:33 최적화 및 라이센스
>
> — [카툰렌더링으로 캐릭터를 예쁘게 꾸미자🥰UnityChanToonShader V2 — 골드메탈](https://www.youtube.com/watch?v=qoYrqHV-prk)

지금 그 에셋 저장소를 열면 README 첫 문단이 **후속 패키지로 넘어갔다**고
말한다. 그리고 후속 패키지 문서는 **왜 넘어갔는지를 세 가지로 적어둔다.**
세 가지가 각각 위 챕터의 01, 03, 05에 들어맞는다 — 설치하는 방법,
파이프라인, 라이선스다.

**영상이 틀린 건 아니다.** 2022년의 UTS2를 2022년 기준으로 정확히 가르친다.
다만 그 세 챕터는 지금 **같은 방식으로 따라갈 수 없다.** 어느 챕터가 왜
막혔는지를 1차 출처로 하나씩 확인한 기록이다.

## 목차

## 저장소가 스스로 "유지보수 계획이 없다"고 적어뒀다

영상 설명란의 📦 에셋 링크는 지금도 열린다. 다만 열리는 브랜치가
`release/legacy/2.0`이고, README가 이렇게 시작한다.

> We appreciate your interest in Unity-Chan Toon Shader 2.0.
>
> It's important to note that this package has been succeeded by Unity Toon
> Shader, and is provided as is, without any maintenance or release plan.
>
> Therefore, we are unable to monitor bug reports, accept feature requests, or
> review pull requests for this package.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

**버그 리포트를 보지 않고, 기능 요청을 받지 않고, 풀 리퀘스트를 검토하지
않는다**고 적혀 있다. 아카이브된 저장소는 아니라서 링크가 죽지도 않고
읽기도 쓰기도 된다 — 그래서 **겉보기로는 멀쩡한 에셋처럼 보인다.** README가
대안으로 포크를 권한다.

지원 범위도 README에 숫자로 적혀 있다.

> Unity 2019.4.31f1 through Unity 2020.3.34f1, Unity 2021.3.3f1, and Unity
> 2022.1.1f1 have been tested.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

**테스트된 가장 최신 버전이 2022.1.1f1이다.** 영상이 올라온 2022년 3월의
직후까지다. 그리고 README가 렌더링 환경을 한 줄로 못 박는다 — **"This
package uses a forward rendering environment."**

## 교체 사유 셋이 영상의 챕터 셋과 겹친다

후속 패키지는 **Unity Toon Shader**(패키지 이름 `com.unity.toonshader`)다.
그 문서의 개요 페이지가 UTS2와의 관계를 적으면서 **교체 사유를 셋 나열한다.**

> Unity Toon Shader is the successor to Unity-chan Toon Shader ver 2.0 (UTS2)
>
> UTS2 was designed solely for the Built-in Render Pipeline
>
> could not be installed through the Package Manager window
>
> had a different license from other Unity software
>
> — [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)

세 항목을 영상의 챕터와 나란히 놓으면 이렇게 된다.

| 영상 챕터 | 후속 문서가 적은 교체 사유 | 지금 달라진 것 |
|---|---|---|
| 01 설치하기 | "could not be installed through the Package Manager window" | Package Manager로 이름만 넣으면 된다 |
| 02 툰쉐이더 모습 | — | 사유로 거론되지 않는다 |
| 03 적용해보기 | "designed solely for the Built-in Render Pipeline" | 세 파이프라인 전부 |
| 04 데포르메 스타일 | — | 사유로 거론되지 않는다 |
| 05 최적화 및 라이센스 | "had a different license from other Unity software" | Unity Companion License로 바뀜 |

**02와 04는 사유에 안 들어간다.** 셰이더가 어떻게 생겼고 어떤 스타일을 낼
수 있는지는 교체와 무관한 이야기고, 그 부분은 영상이 지금도 쓸모가 있다.
막힌 것은 **에셋을 들여오고, 어느 파이프라인에 올리고, 어떤 조건으로
쓰는가** 셋이다.

후속 패키지가 그 셋을 어떻게 해결했는지는 그쪽 문서가 직접 적는다.

> The Unity Toon Shader (UTS3) is a set of toon shaders designed to meet the
> needs of creators
>
> compatible with all render pipelines: the Built-in Render Pipeline, the
> Universal Render Pipeline (URP), the High Definition Render Pipeline (HDRP)
>
> Feature availability varies between pipelines and between 3D/2D projects.
>
> — [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)

마지막 줄을 빠뜨리면 안 된다. **"compatible with all render pipelines"와
"Feature availability varies"가 같은 페이지에 같이 있다.** 셰이더가 올라가는
것과 기능이 다 되는 것은 다른 이야기다.

## 챕터 01 설치하기 — 이제 Package Manager 한 줄이다

영상의 첫 챕터는 GitHub에서 받아 프로젝트에 넣는 절차다. 후속 패키지의 설치
문서는 그 절차를 지우고 네 단계로 줄인다.

> Make sure Git is installed on your system.
>
> Click the + button, then select Add package by name.
>
> Enter com.unity.toonshader
>
> You can also specify a particular version, for example:
> com.unity.toonshader@0.9.4-preview
>
> — [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)

**`Add package by name`에 `com.unity.toonshader`를 넣는다.** 버전을 `@`로
붙여 고정할 수도 있다. 그리고 전제가 하나 있다 — **Git이 시스템에 설치되어
있어야 한다.** 패키지 이름으로 추가하는데 Git이 필요하다는 건 이 문서가
직접 적은 조건이다.

같은 페이지에 한 문장이 더 있다.

> The Unity Toon Shader is a preview/experimental package.
>
> — [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)

**지금도 preview다.** 변경 로그의 최신 항목이 `0.13.4-preview`이고 날짜가
**2026-02-18**이다. 즉 **관리는 되고 있는데 1.0이 아니다.** 2022년의 에셋을
대체한 것이 2026년에도 0.x라는 사실은, 영상을 따라가려던 사람에게 그냥
"새 걸 쓰세요"로 끝날 이야기가 아니다.

| | UTS2 (영상의 대상) | Unity Toon Shader (후속) |
|---|---|---|
| 들여오는 방법 | 저장소에서 받아 프로젝트에 넣기 | Package Manager → `Add package by name` |
| 전제 | — | Git 설치 |
| 최신 표기 | `UTS2/Legacy(Built-in) v2.0.9` | `0.13.4-preview` (2026-02-18) |
| 상태 | "without any maintenance or release plan" | "preview/experimental package" |
| 테스트된 Unity | 2019.4.31f1 ~ 2022.1.1f1 | 최소 요구 버전 6.0 (0.13.0에서 올림) |

마지막 줄은 변경 로그에 그대로 적혀 있다 — `0.13.0-preview`(2025-12-04)의
항목이 **"package: raise minimum Unity version requirement to 6.0"**이다.
패키지 버전을 고르는 일이 에디터 버전을 고르는 일과 묶여 있다는 점은
[인스펙터에 띄우는 건 Exposed가 아니라 Show In Inspector다](/posts/shadergraph-exposed/)에서
Shader Graph를 두고 겪은 것과 같은 모양이다.

## 챕터 03 적용해보기 — 드롭다운 이름과 파이프라인이 둘 다 달라졌다

영상의 세 번째 챕터는 머티리얼을 만들고 툰쉐이더를 골라 적용하는 부분이다.
후속 패키지에서 그 드롭다운에 뜨는 이름이 다르다.

> In the Inspector, you choose Toon > Toon or Toon > Toon (Tessellation) from
> the Shader drop-down.
>
> — [Getting Started with Unity Toon Shader — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/GettingStarted.html)

**`Toon > Toon`과 `Toon > Toon (Tessellation)`** 둘이다. 같은 페이지가 이
두 셰이더가 Built-in·URP·HDRP에서 동작한다고 적는다. 드롭다운의 이름이
셰이더 파일 안의 문자열로 결정되고, 그 문자열이 서브메뉴를 만든다는
구조 자체는
[Lite 버전은 셰이더 목록에 뜨지 않는다](/posts/liltoon-setup/)에서 lilToon을
두고 자세히 뜯어봤다. 여기서 중요한 건 **옛 영상의 화면에 보이는 항목
이름으로 지금 목록을 찾으면 안 맞는다**는 것이다.

이미 UTS2로 만들어둔 머티리얼이 있으면 다시 만들 필요는 없다. 전용
변환기가 있다.

> The Unity Toon Shader Converter handles not only the Unity Toon Shader
> materials, but also Unity-chan Toon Shader and Univeral Toon Shader
> materials.
>
> Window -> Rendering -> Unity Toon Shader Converter
>
> Please make sure to back up the project since this converting process is
> irreversible.
>
> — [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)

**되돌릴 수 없으니 백업하라**고 문서가 먼저 적는다. 그리고 조건이 하나 더
붙는다.

> Unity-Chan Toon Shader materials saved with older than 2.0.6 have to be
> re-saved using 2.0.7 or newer.
>
> — [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)

**2.0.6보다 오래된 머티리얼은 먼저 2.0.7 이상으로 다시 저장해야 한다.**
즉 변환 경로가 `옛 UTS2 → 최신 UTS2 → UTS3` 두 단계가 되는 경우가 있다.
영상이 2022년 3월이고 그 시점의 UTS2 버전을 쓰고 있었다면 이 조건을 먼저
확인해야 한다.

(같은 페이지가 `Universal`을 **`Univeral`**로 적어뒀다. 현행 문서의 오타다.)

## "빌트인 전용이었다"는 설명과 저장소의 릴리스 목록

위에서 인용한 교체 사유 중 첫 줄이 **"UTS2 was designed solely for the
Built-in Render Pipeline"**이었다. 그런데 UTS2 저장소의 릴리스 목록에는
Universal 줄이 따로 있다.

| 릴리스 제목 | 계열 |
|---|---|
| `UTS/Universal 2.5.1` | Universal |
| `UTS2/Legacy(Built-in) v2.0.9` | Legacy (Built-in) |
| `UTS/Universal 2.5.0` | Universal |
| `UTS/Legacy(Built-in) 2.0.8` | Legacy (Built-in) |

**모순처럼 보이지만 아니다.** 변환기 문서가 다루는 소스를 세 가지로 적었고,
그 셋이 `Unity Toon Shader` · `Unity-chan Toon Shader` · `Universal Toon
Shader`다. 즉 **그 저장소는 이름이 다른 두 셰이더 계열을 같이 배포했고,
후속 문서는 그 둘을 다른 셰이더로 센다.** "UTS2"가 가리키는 것은
`Legacy(Built-in)` 쪽이고, Universal 쪽은 `Universal Toon Shader`라는
별개 이름을 갖는다.

**여기까지는 문서가 적은 것이다.** 두 계열이 코드를 얼마나 공유하는지,
Universal 계열이 어느 URP 버전까지 맞는지는 **문서가 말하지 않는다.**
릴리스 제목과 변환기의 소스 목록만으로 확인할 수 있는 선이 여기다.
파이프라인이 무엇이고 빌트인이 어떤 상태인지는
[렌더 파이프라인은 에셋이고, 빌트인은 그 칸이 비었을 때의 결과다](/posts/render-pipelines-overview/)에
적어뒀다.

## 챕터 05 라이선스 — 근거가 되는 페이지가 사라졌다

영상의 마지막 챕터가 "최적화 및 라이센스"다. 라이선스 쪽이 지금 가장
곤란하다. UTS2의 README는 조건을 이렇게 밝힌다.

> Unity-Chan Toon Shader 2.0 is provided under the Unity-Chan License 2.0
> terms.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

**Unity-Chan License 2.0**이고, 그 조건을 보라고 유니티짱 가이드라인 페이지를
링크한다. 그 링크를 눌러봤다.

| URL | 결과 |
|---|---|
| `unity-chan.com/contents/guideline_en/` (README의 링크) | **302 → `unity3d.jp/unity-chan`** |
| `unity-chan.com/download/index.php` (영상의 모델 링크) | **302 → `unity3d.jp/unity-chan`** |

두 URL이 같은 곳으로 간다. 그리고 그 도착지는 유니티짱 페이지가 아니다 —
일본어 Unity 페이지이고, **라이선스 이름도 버전도 조건도 적혀 있지 않다.**
메뉴의 "ダウンロード"는 `unity.com/ja/download`, 즉 에디터 받는 곳으로 간다.

**정리하면 이렇다. 에셋은 "Unity-Chan License 2.0 조건으로 제공된다"고
적혀 있는데, 그 조건의 원문이 저장소가 가리키는 주소에 더 이상 없다.**
이건 404가 아니라 302라서, 링크를 눌러본 사람도 "뭔가 바뀌었네" 정도로
지나치기 쉽다.

후속 패키지 쪽은 다른 라이선스다.

> Unity Companion License for Unity-dependent projects
>
> — [License — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/license/LICENSE.html)

후속 패키지 저장소는 **소스 코드가 Unity Companion License, 유니티짱 에셋이
Unity-Chan License**라고 나눠서 적는다. 교체 사유의 셋째 줄 "had a different
license from other Unity software"가 이 변화를 가리킨다.

**나는 변호사가 아니고, 이 글은 법률 조언이 아니다.** 여기서 확인한 것은
세 가지뿐이다 — README가 적은 라이선스 이름, 그 조건 원문이 있던 주소가
지금 다른 곳으로 리다이렉트된다는 것, 후속 패키지가 다른 라이선스 이름을
쓴다는 것. **쓸 생각이라면 조건 원문을 직접 확보해서 읽어야 한다.**
라이선스 조건은 요약으로 판단할 것이 아니다.

최적화 쪽은 더 단순하다. **UTS2 README에서 성능에 대한 문장은 찾지 못했다.**
렌더링 환경이 forward라는 한 줄이 있을 뿐이다. 영상의 최적화 내용이
무엇이었든 그걸 뒷받침할 현행 1차 출처가 없으니, 이 글은 그 부분을 적지
않는다.

## 영상의 나머지 링크 둘은 각자 다르게 삭았다

설명란의 세 링크 중 에셋 링크만 살아 있다. 나머지 둘은 상태가 서로 다르다.

| 링크 | 상태 |
|---|---|
| 📦 에셋 (GitHub) | 열린다. 단 `release/legacy/2.0`에 "no maintenance" 공지 |
| 🚀 유니티짱 모델 (`unity-chan.com`) | **302 → `unity3d.jp/unity-chan`**, 모델 없음 |
| ⛰️ 배경 (Asset Store) | **스토어에서 deprecated** |

세 번째는 에셋 스토어가 직접 적는다.

> This asset has been deprecated from the Unity Asset Store.
>
> — [Shader Calibration Scene — Unity Asset Store](https://assetstore.unity.com/packages/templates/tutorials/shader-calibration-scene-25422)

같은 페이지가 **더 이상 구매할 수 없고 퍼블리셔 지원도 없다**고 덧붙이며,
이미 보유한 사람은 계속 쓸 수 있고 My Assets에도 남는다고 적는다. 즉
**영상을 지금 처음 보는 사람은 배경 에셋을 받을 수 없다.**

세 링크가 삭은 방식이 셋 다 다른 게 핵심이다. 하나는 **살아 있지만 공지가
붙었고**, 하나는 **리다이렉트로 내용이 사라졌고**, 하나는 **배포가
중단됐다.** 어느 쪽도 404가 아니라서, 링크 검사 도구로는 셋 다 "정상"으로
나온다.

**이 글을 쓰게 된 출발점이 두 번째 줄이다.** 툰 셰이더를 올릴 예시 모델로
유니티짱을 골랐는데, 그 모델을 받던 주소가 지금은 모델이 없는 페이지로
간다. 이미 받아둔 파일이 있으면 계속 쓸 수 있지만, **그 파일이 어떤 조건으로
제공됐는지를 확인할 주소가 같이 사라졌다** — 앞 절에서 확인한, UTS2 README가
라이선스 조건으로 가리키던 그 주소와 같은 곳이다.

## 어디에 왜 쓰나

툰 셰이더는 캐릭터를 셀 셰이딩으로 그릴 때 쓴다. 이 글이 확인한 것은
**어느 구현을 고를지와 그 구현이 지금 어떤 상태인지**다. 프로젝트에
이미 UTS2 머티리얼이 있으면 변환기 경로가 있고, 새로 시작하면 후속 패키지
쪽이 Package Manager 한 줄이다. 같은 자리에 쓰는 다른 선택지인 lilToon의
파라미터는
[lilToon 파라미터 정리: 공식 문서를 대조한 한국어 레퍼런스](/posts/liltoon-parameters/)에
따로 적어뒀다.

### 동작하는 예제

이 주제에서 코드로 옮길 수 있는 부분은 **지금 씬의 머티리얼이 어떤 셰이더를
쓰고 있는지 세는 일**이다. 변환기를 돌리기 전에 대상이 몇 개인지 알아야
하고, 돌린 뒤에 남은 것이 없는지 확인해야 한다.

```csharp file="Scripts/Rendering/ShaderUsageAudit.cs"
using System.Collections.Generic;
using System.Text;
using UnityEngine;

public class ShaderUsageAudit : MonoBehaviour
{
    [Header("찾을 접두사")]
    [Tooltip("셰이더 이름이 이 중 하나로 시작하면 '옛 것'으로 센다")]
    [SerializeField]
    private string[] _legacyPrefixes =
    {
        "UnityChanToonShader",
        "Toon/Legacy",
    };

    [Header("동작")]
    [Tooltip("켜면 비활성 오브젝트의 Renderer까지 센다")]
    [SerializeField]
    private bool _includeInactive = true;

    [Tooltip("켜면 셰이더 이름별 개수를 전부 남긴다")]
    [SerializeField]
    private bool _logEveryShader;

    private void Start()
    {
        Audit();
    }

    [ContextMenu("지금 세기")]
    private void Audit()
    {
        // 문서가 "If you don't specify this parameter, this function doesn't
        // include inactive objects in the results"라고 적는다. 기본값에
        // 맡기지 않고 명시한다. sortMode 오버로드는 obsolete다.
        Renderer[] renderers = _includeInactive
            ? FindObjectsByType<Renderer>(FindObjectsInactive.Include)
            : FindObjectsByType<Renderer>(FindObjectsInactive.Exclude);

        Dictionary<string, int> counts = new Dictionary<string, int>();
        int legacyCount = 0;

        foreach (Renderer renderer in renderers)
        {
            // 세기만 하므로 sharedMaterials를 읽는다. material을 읽으면
            // 인스턴스가 생기고, sharedMaterial을 고치면 프로젝트에 저장된
            // 설정까지 바뀐다고 문서가 적는다. 둘 다 여기선 필요 없다.
            Material[] materials = renderer.sharedMaterials;

            foreach (Material material in materials)
            {
                if (material == null) { continue; }

                Shader shader = material.shader;
                if (shader == null) { continue; }

                // 이 이름이 머티리얼의 셰이더 드롭다운에 보이는 문자열이다.
                string shaderName = shader.name;

                counts.TryGetValue(shaderName, out int previous);
                counts[shaderName] = previous + 1;

                if (IsLegacy(shaderName))
                {
                    legacyCount++;
                    Debug.Log($"옛 셰이더: {shaderName} — {renderer.name}",
                        renderer);
                }
            }
        }

        Report(counts, renderers.Length, legacyCount);
    }

    private bool IsLegacy(string shaderName)
    {
        foreach (string prefix in _legacyPrefixes)
        {
            if (string.IsNullOrEmpty(prefix)) { continue; }

            if (shaderName.StartsWith(prefix)) { return true; }
        }

        return false;
    }

    private void Report(
        Dictionary<string, int> counts, int rendererCount, int legacyCount)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendLine(
            $"Renderer {rendererCount}개, 옛 셰이더 머티리얼 {legacyCount}개");

        if (_logEveryShader)
        {
            foreach (KeyValuePair<string, int> pair in counts)
            {
                builder.AppendLine($"  {pair.Value,4}  {pair.Key}");
            }
        }

        Debug.Log(builder.ToString(), this);
    }
}
```

두 가지를 짚어둘 만하다.

**하나 — `Shader.Find`를 쓰지 않았다.** 이름으로 셰이더를 찾는 API가 있는데
안 쓴 이유가 문서에 있다.

> Note that a shader might be not included into the player build if nothing
> references it.
>
> In that case, Shader.Find will work only in the Editor, and will result in
> the pink error shader in a build.
>
> Because of that, it is advisable to use shader references instead of finding
> them by name.
>
> — [Shader.Find](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.Find.html)

**에디터에서만 되고 빌드에서는 분홍색이 된다.** 반대로 이 예제가 하는
일은 이미 머티리얼이 들고 있는 셰이더를 **읽는** 것이라 그 문제가 없다.
같은 페이지가 `name`이 무엇인지도 적어둔다 — **"name is the name you can
see in the shader popup of any material"**. 그래서 `shader.name`과 영상에
보이는 드롭다운 항목을 바로 비교할 수 있다.

**둘 — 비활성 포함 여부를 기본값에 맡기지 않았다.** 문서가 기본 동작을
밝힌다.

> Whether to include components attached to inactive GameObjects.
>
> If you don't specify this parameter, this function doesn't include inactive
> objects in the results.
>
> — [Object.FindObjectsByType](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Object.FindObjectsByType.html)

변환 대상을 세는 일에서 **비활성 오브젝트를 빠뜨리면 숫자가 틀린다.** 그리고
같은 페이지에 걸리는 점이 둘 더 있다. `sortMode`를 받는 오버로드들이
**obsolete**로 표시되어 있고, 문서가 그 이유로 **`InstanceID`가 `EntityId`로
대체되기 때문에 기존 정렬 순서를 유지할 수 없다**고 적는다. 또 하나는
**에셋은 반환되지 않는다**는 것 — 프로젝트 폴더에 있고 씬에 안 올라간
머티리얼은 이 방법으로 안 세어진다. 문서가 그 경우에는
`Resources.FindObjectsOfTypeAll`을 쓰라고 안내한다.

### 무엇을 고르나

| 상황 | 고를 것 | 근거 문장 |
|---|---|---|
| 새로 시작한다 | Unity Toon Shader (`com.unity.toonshader`) | "compatible with all render pipelines" |
| 들여오는 방법 | Package Manager → `Add package by name` | "Enter com.unity.toonshader" |
| 이미 UTS2 머티리얼이 있다 | `Window > Rendering > Unity Toon Shader Converter` | "handles ... Unity-chan Toon Shader" |
| 변환 전에 할 일 | 프로젝트 백업 | "this converting process is irreversible" |
| 2.0.6보다 오래된 머티리얼 | 먼저 2.0.7+로 재저장 | "have to be re-saved using 2.0.7 or newer" |
| 빌트인에 계속 머물러야 한다 | UTS2를 포크 | README가 포크를 권한다 |
| 머티리얼 셰이더를 코드로 세기 | `material.shader.name` | "the name you can see in the shader popup" |
| 씬에 없는 에셋까지 세기 | `Resources.FindObjectsOfTypeAll` | `FindObjectsByType`은 에셋을 반환하지 않는다 |

판단 순서는 이렇게 둔다.

1. **에디터 버전을 먼저 본다.** 후속 패키지는 `0.13.0`에서 최소 요구를
   Unity 6.0으로 올렸다. 그보다 낮으면 패키지 버전을 내려 고정해야 한다.
2. **preview를 받아들일 수 있는지 정한다.** 설치 문서가 스스로
   "preview/experimental package"라고 적는다.
3. **파이프라인별 기능 차이를 확인한다.** "compatible with all render
   pipelines"와 "Feature availability varies"가 같은 페이지에 있다.
4. **라이선스 원문을 확보한다.** README가 가리키는 주소에 지금 조건이
   없다. 요약으로 판단하지 말고 원문을 찾아 읽는다.

### 쓰지 말아야 할 자리

- **2022년 영상의 설치 절차를 그대로 따라가는 자리.** 후속 패키지는
  Package Manager로 들어간다.
- **영상 화면의 드롭다운 항목 이름으로 지금 목록을 찾는 자리.** 후속
  패키지는 `Toon > Toon`과 `Toon > Toon (Tessellation)`이다.
- **백업 없이 변환기를 돌리는 자리.** 문서가 **"irreversible"**이라고
  적는다.
- **2.0.6보다 오래된 머티리얼을 바로 변환하는 자리.** 먼저 2.0.7 이상으로
  재저장해야 한다.
- **"모든 파이프라인 호환"만 읽고 기능이 전부 된다고 보는 자리.** 같은
  페이지가 기능 차이를 명시한다.
- **UTS2에 버그를 리포트하는 자리.** README가 보지 않는다고 적어뒀다.
- **라이선스 조건을 블로그 요약으로 판단하는 자리.** 조건 원문이 저장소가
  가리키는 주소에 없다.
- **영상의 모델·배경 링크를 지금 따라가는 자리.** 하나는 리다이렉트, 하나는
  스토어에서 deprecated다.
- **빌드에서 `Shader.Find`로 셰이더를 찾는 자리.** 참조가 없으면 분홍색이
  된다고 문서가 적는다.
- **`FindObjectsByType`으로 프로젝트의 모든 머티리얼을 세려는 자리.**
  에셋은 반환되지 않는다.

## 정리

- UTS2 저장소는 열리지만 브랜치가 `release/legacy/2.0`이고, README가
  **"provided as is, without any maintenance or release plan"**이라고 적는다.
  버그 리포트·기능 요청·PR을 보지 않는다.
- 테스트된 Unity 범위가 **2019.4.31f1 ~ 2022.1.1f1**이고, 렌더링 환경은
  **forward**다.
- 후속 패키지 문서가 교체 사유를 셋 적는다 — **Package Manager로 설치할 수
  없었고, 빌트인 전용이었고, 라이선스가 달랐다.** 그 셋이 영상의 챕터
  01·03·05에 각각 들어맞는다. 02와 04는 사유에 안 들어간다.
- 후속 패키지는 `com.unity.toonshader`이고, `Add package by name`으로
  넣는다. **Git 설치가 전제**이고, 설치 문서가 스스로
  **"preview/experimental package"**라고 적는다. 최신은
  **`0.13.4-preview` (2026-02-18)**다.
- `0.13.0`(2025-12-04)에서 **최소 요구 Unity를 6.0으로 올렸다.**
- 드롭다운 항목이 **`Toon > Toon`**과 **`Toon > Toon (Tessellation)`**이고,
  Built-in·URP·HDRP에서 동작한다. 다만 같은 페이지가 **"Feature
  availability varies"**라고 적는다.
- 머티리얼 변환기가 있다 — **`Window > Rendering > Unity Toon Shader
  Converter`**. **"irreversible"**이니 백업하고, **2.0.6보다 오래된 머티리얼은
  2.0.7+로 재저장**해야 한다.
- "빌트인 전용"과 저장소의 `UTS/Universal` 릴리스는 **모순이 아니다.**
  변환기 문서가 소스를 셋으로 적고, 그중 `Universal Toon Shader`가 별개
  이름이다. 두 계열의 코드 공유 범위는 **문서가 말하지 않는다.**
- 라이선스는 README가 **Unity-Chan License 2.0**이라고 적지만, 그 조건을
  가리키는 `unity-chan.com` 주소가 **302로 다른 페이지**로 가고 거기에
  조건이 없다. 후속 패키지는 **Unity Companion License for Unity-dependent
  projects**다. **원문을 직접 확보해서 읽어야 한다.**
- 영상의 세 링크가 **각자 다른 방식으로** 삭았다 — 공지 붙은 저장소,
  리다이렉트, 스토어 deprecated. 셋 다 404가 아니다.
- 코드로는 `material.shader.name`을 읽어 센다. `Shader.Find`는 참조가 없으면
  **빌드에서 분홍색**이 되고, `FindObjectsByType`은 **비활성을 기본으로
  제외**하며 **에셋을 반환하지 않는다.**

---

### 참고

- [UnityChanToonShaderVer2_Project — GitHub](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)
- [Releases — UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project/releases)
- [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)
- [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)
- [Getting Started with Unity Toon Shader — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/GettingStarted.html)
- [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)
- [Changelog — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/changelog/CHANGELOG.html)
- [License — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/license/LICENSE.html)
- [com.unity.toonshader — GitHub](https://github.com/Unity-Technologies/com.unity.toonshader)
- [Shader Calibration Scene — Unity Asset Store](https://assetstore.unity.com/packages/templates/tutorials/shader-calibration-scene-25422)
- [Shader.Find — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.Find.html)
- [Object.FindObjectsByType — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Object.FindObjectsByType.html)
- [Renderer.sharedMaterial — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

원문 클리핑은 골드메탈의 유튜브 영상
[카툰렌더링으로 캐릭터를 예쁘게 꾸미자🥰UnityChanToonShader V2 \[유니티 에셋 A11\]](https://www.youtube.com/watch?v=qoYrqHV-prk)(2022-03-01)이다.
스크랩된 것은 설명란과 챕터 목록뿐이라 영상 내용을 인용하지는 않았고,
**설명란의 링크 셋과 챕터 다섯 개를 좌표로 삼아** 1차 출처를 대조했다.
영상은 2022년의 UTS2를 정확히 가르친다. 그 사이에 저장소가 공지를 달고,
후속 패키지가 생기고, 링크 셋이 각자 다르게 삭았다는 것까지가 이 글이
확인한 내용이다.
