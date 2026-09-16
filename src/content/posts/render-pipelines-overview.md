---
pubDatetime: 2026-09-16T21:00:00+09:00
title: "렌더 파이프라인은 에셋이고, 빌트인은 그 칸이 비었을 때의 결과다"
lang: ko
translationKey: render-pipelines-overview
featured: false
draft: false
tags:
  - Unity
  - 렌더링
  - 그래픽스
  - URP
  - GPU
description: "Unity의 렌더 파이프라인 소개 문서를 읽었다. 셋 중 하나를 고르는 문제로 알고 있었는데, 문서를 따라가 보니 빌트인은 고르는 게 아니라 아무것도 배정하지 않았을 때 남는 것이었다."
---

앞의 세 글이 계속 **URP와 빌트인의 갈림**을 맴돌았다. 셰이더 문서가 둘로
갈리고, 예제가 한쪽에서만 돌고, 매크로 이름이 다르고. 그럴 때마다 "파이프라인이
다르니까"로 넘어갔는데, **그 파이프라인이라는 게 정확히 뭔지**는 짚고 넘어간
적이 없었다.

스크랩해둔 것도 그 순간이었다. 셰이더 문서를 따라 내려가다가 **파이프라인
자체가 궁금해져서** 한 층 위로 올라간 것이다. Unity 매뉴얼의
**Introduction to render pipelines**인데, 앞의 것들과 달리 목차가 아니라
실제 설명이 들어 있는 페이지다.

읽고 나서 바뀐 게 하나 있다. **빌트인을 "고른다"고 생각했던 것**이 틀렸다.

## 목차

## 그래픽스 파이프라인과 렌더 파이프라인은 다른 것이다

먼저 이름부터 정리하고 가야 한다. 전에
[그래픽스 파이프라인 정리](/posts/graphics-pipeline/)를 쓴 적이 있는데, 그건
**정점이 픽셀이 되기까지 GPU 안에서 벌어지는 일**이었다. 버텍스 셰이더,
래스터라이저, 프래그먼트 셰이더 같은 단계들.

이 문서가 말하는 렌더 파이프라인은 **한 층 위**다. 용어집의 정의가 이렇다.

> 씬의 내용을 가져다 화면에 표시하는 **일련의 작업**. Unity는 미리 만들어진
> 렌더 파이프라인 중에서 고르거나, 직접 작성할 수 있다.

"직접 작성할 수 있다"가 차이다. **GPU 안의 그래픽스 파이프라인은 내가 못
바꾸지만, 엔진이 프레임마다 도는 렌더 파이프라인은 바꿀 수 있다.** 관계를
그리면 이렇다.

| 층 | 무엇을 하나 | 내가 건드릴 수 있나 |
|---|---|---|
| 렌더 파이프라인 | 프레임마다 무엇을 어떤 순서로 그릴지 | **C#으로 가능** (SRP) |
| └ 그래픽스 파이프라인 | 드로 콜 하나가 정점에서 픽셀이 되기까지 | 셰이더 코드로만 |

두 이름이 헷갈리는 게 이상한 일이 아니다. 영어로도 둘 다 pipeline이고,
용어집 정의도 "일련의 작업"으로 비슷하게 시작한다.

여담으로, 이 클리핑은 용어집 링크가 통째로 날아가면서 첫 문장이
**"A takes the objects in a and displays them on-screen."** 로 저장돼 있었다.
주어와 목적어가 사라진 문장이다. 원문 문제가 아니라 스크랩 과정의 문제이고,
같은 날 스크랩한 다른 클리핑은 용어집 설명이 그대로 들어가 있다. 스크랩한
자료를 나중에 쓸 때 원문을 다시 열어봐야 하는 이유가 이런 데 있다.

## 세 단계 — 컬링, 렌더링, 포스트 프로세싱

문서가 렌더 파이프라인의 동작을 세 단계로 적어놨다.

| 단계 | 문서의 서술 |
|---|---|
| 1. 컬링 | 씬의 어떤 오브젝트를 표시할지 결정한다 |
| 2. 렌더링 | 오브젝트를 **올바른 조명과 함께 픽셀 버퍼에** 그린다 |
| 3. 포스트 프로세싱 | 픽셀 버퍼를 수정해 화면에 낼 최종 프레임을 만든다 |

그리고 한 줄이 더 붙는다.

> 렌더 파이프라인은 Unity가 새 프레임을 만들 때마다 이 단계들을 반복한다.

각 단계가 무엇을 가리키는지 조금 더 풀면 이렇다.

**컬링**은 안 보이는 걸 빼는 일이다. 문서가 두 가지를 든다 — 시야 밖을
쳐내는 **프러스텀 컬링**, 다른 물체에 가려진 것을 쳐내는 **오클루전 컬링**.
그릴 필요가 없는 것을 그리지 않는 게 가장 싼 최적화라, 이 단계가 맨 앞이다.

**렌더링**이 앞서 말한 그래픽스 파이프라인이 도는 자리다. 여기서 "올바른
조명과 함께"라는 표현이 중요하다. 조명 계산을 어떻게 할지 — 포워드냐 디퍼드냐,
라이트를 몇 개까지 받느냐 — 가 파이프라인마다 다르고, **셰이더가 파이프라인을
타는 이유가 여기 있다.** URP 셰이더가 `GetMainLight()`를 부를 수 있는 건 URP가
그 데이터를 그렇게 넘겨주기로 정해놨기 때문이다.

**포스트 프로세싱**은 다 그린 픽셀 버퍼를 손보는 단계다. 문서가 예로 컬러
그레이딩과 블룸을 든다. 글리치 같은 화면 효과도 대개 이 자리에 붙는다.

## 빌트인은 선택이 아니라 기본값이다

여기가 이 글을 쓰게 만든 부분이다.

문서는 "Unity가 세 가지 미리 만들어진 렌더 파이프라인을 제공한다"고 쓴다. URP,
HDRP, 빌트인. 그러면 셋 중 하나를 고르는 것처럼 읽힌다. 그런데 **실제로 어느
것이 도는지를 정하는 규칙**을 찾아보면 그림이 다르다.

> 퀄리티 설정 창의 각 퀄리티 레벨에 대해, Unity는 **Render Pipeline Asset**에
> 배정된 것을 사용한다. 이 속성이 비어 있으면, 대신 그래픽스 설정 창의
> **Default Render Pipeline Asset**에 배정된 것을 사용한다.

> **Render Pipeline Asset과 Default Render Pipeline이 둘 다 설정되어 있지
> 않으면, Unity는 빌트인 렌더 파이프라인을 사용한다.**

정리하면 이렇다.

| 순위 | 보는 곳 |
|---|---|
| 1 | 퀄리티 설정의 해당 레벨 `Render Pipeline Asset` |
| 2 | 그래픽스 설정의 `Default Render Pipeline Asset` |
| 3 | **둘 다 비었으면 빌트인** |

**빌트인은 에셋이 없다.** URP와 HDRP는 프로젝트에 파일로 존재하는
`RenderPipelineAsset`을 배정해서 켜는 것이고, 빌트인은 그 칸이 비었을 때
남는 상태다. "세 가지 중 하나"라기보다 **두 개의 에셋과 하나의 기본값**이다.

빌트인 문서의 표현도 이 쪽에 가깝다.

> Unity의 빌트인 렌더 파이프라인은 Unity의 **더 오래된** 렌더 파이프라인이다.
> Scriptable Render Pipeline에 기반하지 않지만, 렌더링 경로를 골라 설정할 수
> 있고 커맨드 버퍼와 콜백으로 기능을 확장할 수 있다.

"deprecated"나 "legacy"라는 말은 없다. 현행 문서에서 여전히 **Supported**다.
다만 "더 오래된"과 "SRP에 기반하지 않는다"가 위치를 말해준다.

앞 글들에서 URP 셰이더에 `"RenderPipeline" = "UniversalPipeline"` 태그가 필요한
이유도 이걸로 설명된다. **파이프라인이 배정된 물건이니 이름으로 지목할 수
있는 것**이고, 빌트인은 지목할 이름이 없어서 태그도 없다.

## SRP가 파는 것은 기능이 아니라 C#이다

그럼 SRP는 무엇인가. 문서의 정의가 짧다.

> Scriptable Render Pipeline은 **C# 스크립트로 렌더링 명령을 스케줄하고
> 설정할 수 있게 해주는 얇은 API 계층**이다.

구성 요소는 둘이다.

| 이름 | 문서의 서술 |
|---|---|
| `RenderPipelineAsset` | 어떤 Render Pipeline Instance를 쓸지, 어떻게 설정할지에 대한 데이터를 담은 **프로젝트 안의 에셋** |
| Render Pipeline Instance | `RenderPipeline`을 상속하고 `Render()` 메서드를 오버라이드한 클래스의 인스턴스 |

즉 **에셋이 "무엇을 쓸지"를 들고 있고, 인스턴스가 "어떻게 그릴지"를 들고
있다.** 인스펙터에서 URP 에셋의 체크박스를 끄면 빌드 크기가 줄어드는 것도
(앞 글에서 셰이더 배리언트 스트리핑으로 봤던 그 동작) 이 구조 덕분이다.
설정이 에셋에 있으니 빌드 시점에 읽을 수 있다.

그리고 이 페이지에서 제일 인상적이었던 한 문장이 이거다.

> 이 수준의 커스터마이징은 **Unity 엔진의 C++ 소스 코드 접근 권한을 구매하면**
> 빌트인 렌더 파이프라인에서도 가능하다.

빌트인이 "커스터마이징 옵션이 제한적"인 이유가 **기술적 한계가 아니라 접근
권한**이라는 뜻이다. 컬링·렌더링·포스트 프로세싱을 바꾸려면 빌트인에서는
C++ 소스를 사야 하고, SRP에서는 **패키지에 들어 있는 C#을 그냥 읽으면 된다.**

SRP가 추가한 게 새로운 그래픽 기능이 아니라 **열람권**이라는 관점으로 보면,
왜 URP가 빌트인과 목표 플랫폼이 거의 같은데도 따로 존재하는지가 설명된다.

## 그래서 무엇을 고르나

문서의 Choose a render pipeline 페이지가 대상 용도를 이렇게 적는다.

| 파이프라인 | 문서가 적은 대상 |
|---|---|
| URP | 모든 플랫폼, **특히 TBDR 플랫폼과 무선 VR 플랫폼**에서 렌더링 확장성이 필요한 프로젝트 |
| HDRP | 고사양 플랫폼에서 **포토리얼리즘과 고충실도** 렌더링이 필요한 프로젝트 |
| 빌트인 | 모든 플랫폼에서 렌더링 확장성이 필요한 프로젝트 |

**URP와 빌트인의 설명이 거의 같다.** 둘 다 "모든 플랫폼에서의 렌더링 확장성"
이다. 즉 **목표가 차이가 아니고**, 차이는 앞 절의 확장성 쪽에 있다. 문서도
URP를 "빌트인보다 확장하기 쉽다"고 적는다.

제약은 명확한 게 둘이다.

> **URP와 HDRP를 동시에 사용할 수 없다.**

HDRP는 플랫폼도 좁다. 기능 비교 표에서 **닌텐도 스위치·iOS·안드로이드가 전부
"아니오"** 다. 레이트레이싱과 DLSS는 반대로 HDRP에만 있다.

여기서 하나 의외였던 게 있다. **다중 디렉셔널 라이트 그림자**는 비교 표에서
**빌트인이 "예", URP와 HDRP가 둘 다 "아니오"** 다. 더 새로운 파이프라인이
항상 상위 집합인 건 아니라는 뜻이다. 옮기기 전에 **쓰고 있는 기능이 표에서
어느 칸인지**를 확인해야 한다.

그리고 제일 중요한 경고.

> 프로젝트를 한 렌더 파이프라인에서 다른 것으로 바꾸는 일은 **매우 시간이
> 많이 걸릴 수 있다.** 특히 개발이 많이 진행된 프로젝트라면 더 그렇다.

앞의 세 글이 셰이더 하나 옮기는 이야기였다는 걸 생각하면 짐작이 간다. 셰이더,
머티리얼, 포스트 프로세싱 볼륨, 라이팅 설정이 전부 파이프라인에 묶여 있다.

## 어디에 왜 쓰나

이 문서 자체로 코드를 쓰지는 않는다. 다만 **지금 어떤 파이프라인이 도는지를
코드로 확인해야 하는 상황**은 실제로 생긴다. 파이프라인마다 다른 셰이더나
에셋을 쓰는 경우, 또는 팀원이 잘못된 에셋으로 씬을 열었을 때다.

### 지금 어떤 파이프라인인지 확인하기

```csharp
using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// 현재 활성 렌더 파이프라인을 확인하고, 기대와 다르면 경고를 남긴다.
/// </summary>
public class RenderPipelineGuard : MonoBehaviour
{
    private const string EXPECTED_ASSET_NAME = "UniversalRP-HighQuality";

    [Header("Expectation")]
    [SerializeField, Tooltip("비워두면 빌트인 렌더 파이프라인을 기대한다는 뜻")]
    private RenderPipelineAsset _expectedAsset;

    private void Awake()
    {
        // 퀄리티 설정 → 그래픽스 설정 순으로 해석된 결과. 둘 다 비면 null.
        RenderPipelineAsset active = GraphicsSettings.currentRenderPipeline;

        if (active == null)
        {
            Debug.LogWarning(
                $"[{nameof(RenderPipelineGuard)}] 활성 파이프라인이 빌트인이다. " +
                $"{EXPECTED_ASSET_NAME} 에셋이 배정되지 않았다.", this);
            return;
        }

        if (_expectedAsset != null && active != _expectedAsset)
        {
            Debug.LogWarning(
                $"[{nameof(RenderPipelineGuard)}] 기대: {_expectedAsset.name}, " +
                $"실제: {active.name}", this);
        }
    }
}
```

몇 가지를 짚어둔다.

- **`GraphicsSettings.currentRenderPipeline`이 해석된 결과다.** 문서의 설명이
  "현재 퀄리티 레벨의 활성 렌더 파이프라인을 정의하는 `RenderPipelineAsset`"
  이다. 퀄리티 설정과 그래픽스 설정 중 어느 쪽이 이겼는지 따질 필요 없이 이
  하나면 된다.
- **`null`이면 빌트인이다.** 앞 절의 규칙이 그대로 드러나는 자리다. 빌트인은
  에셋이 없으니 참조도 없다.
- **`active == null` 비교는 안전하다.** `RenderPipelineAsset`은
  `ScriptableObject`, 즉 `UnityEngine.Object`라 `==` 오버로드를 타야 한다.
  같은 이유로 여기에 `?.`를 쓰면 안 된다.
- **`RenderPipelineManager.currentPipeline`은 `Awake`에서 쓰면 안 된다.**
  문서가 **한 프레임을 렌더링한 뒤에야 갱신된다**고 적어놨다. 파이프라인
  *인스턴스*가 필요하면 첫 프레임 이후에 읽어야 한다.

### 런타임에 바꿀 때

에셋을 코드로 갈아끼울 수도 있다. 대상은 두 곳이다.

```csharp
// 전역 기본값
GraphicsSettings.defaultRenderPipeline = _targetAsset;

// 현재 퀄리티 레벨 (이쪽이 우선한다)
QualitySettings.renderPipeline = _targetAsset;
```

우선순위가 있으니 **퀄리티 설정 쪽에 값이 남아 있으면 그래픽스 설정을 바꿔도
안 바뀐다.** 안 바뀐다고 헤맬 자리가 여기다.

문서의 경고도 그대로 옮겨둔다.

> 활성 렌더 파이프라인을 바꿀 때는, 프로젝트의 에셋과 코드가 새 파이프라인과
> **호환되는지 반드시 확인해야 한다.** 그렇지 않으면 오류나 의도치 않은
> 시각적 결과가 생길 수 있다.

품질 프리셋을 바꾸는 정도(URP 고품질 ↔ 저품질)라면 쓸 만하지만, URP ↔ 빌트인을
런타임에 오가는 건 실질적으로 무리다. 셰이더가 안 따라온다.

### 고르기 전에 확인할 것

파이프라인을 정하는 시점에 문서에서 확인할 수 있는 것들이다.

- **대상 플랫폼이 HDRP 표에서 "아니오"인지.** 모바일이나 스위치가 들어 있으면
  HDRP는 후보에서 빠진다.
- **지금 쓰는 기능이 비교 표의 어느 칸인지.** 다중 디렉셔널 라이트 그림자처럼
  **빌트인에만 있는 것**도 있다.
- **URP와 HDRP는 동시에 못 쓴다.**
- **바꾸는 비용을 개발 단계로 환산할 것.** 문서가 "특히 개발이 많이 진행된
  프로젝트"라고 조건을 붙여놨다.

### 쓰지 말아야 할 자리

- **"최신이니까 URP"라는 이유만으로 옮기는 것.** 목표 플랫폼 설명이 빌트인과
  거의 같다. 옮겨서 얻는 건 대체로 **확장성**이지 화질이 아니다.
- **에셋이 배정되지 않은 채로 URP 셰이더를 붙이는 것.** 이 경우 활성
  파이프라인은 빌트인이고, `"RenderPipeline" = "UniversalPipeline"` 태그가 붙은
  SubShader는 쓰이지 않는다. 셰이더를 의심하기 전에
  [분기 이야기](/posts/unity-custom-shaders/)의 태그부터 확인하는 게 빠르다.

## 정리

- **그래픽스 파이프라인과 렌더 파이프라인은 층이 다르다.** 앞의 것은 드로 콜
  하나가 정점에서 픽셀이 되는 과정이고, 뒤의 것은 프레임마다 도는 컬링 →
  렌더링 → 포스트 프로세싱이다.
- **세 단계는 프레임마다 반복된다.** 컬링이 맨 앞인 이유는 안 그리는 게 제일
  싸기 때문이다.
- **빌트인은 고르는 게 아니라 남는 것이다.** 퀄리티 설정 → 그래픽스 설정 순으로
  보고 **둘 다 비어 있으면** 빌트인이다. URP 셰이더에 파이프라인 태그가 필요한
  이유도 이 구조다.
- **SRP가 파는 것은 기능이 아니라 열람권이다.** 같은 수준의 커스터마이징이
  빌트인에서도 가능한데, 문서 말로는 **C++ 소스 코드 접근 권한을 구매하면**
  이다.
- **URP와 빌트인은 문서상 대상이 거의 같다.** 차이는 확장성 쪽이고,
  **다중 디렉셔널 라이트 그림자**처럼 빌트인에만 있는 기능도 있다.
- **코드로는 `GraphicsSettings.currentRenderPipeline` 하나면 된다.** `null`이면
  빌트인이고, `RenderPipelineManager.currentPipeline`은 첫 프레임 뒤에야 값이
  찬다.

앞의 세 글에서 "파이프라인이 다르니까"로 넘겼던 자리에 이제 답이 들어간다.
**파이프라인은 프로젝트에 배정된 에셋이고, 그 에셋이 프레임마다 무엇을 어떤
순서로 그릴지를 C#으로 들고 있다.** 셰이더가 파이프라인을 타는 것도, 옮기는
비용이 큰 것도 전부 거기서 나온다.

---

### 참고

- [Introduction to render pipelines — Unity 매뉴얼 6000.1](https://docs.unity3d.com/6000.1/Documentation/Manual/render-pipelines-overview.html)
- [Choose a render pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/choose-a-render-pipeline.html)
- [Render pipeline feature comparison](https://docs.unity3d.com/6000.1/Documentation/Manual/render-pipelines-feature-comparison.html)
- [Change or detect the active render pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/srp-setting-render-pipeline-asset.html)
- [Scriptable Render Pipeline fundamentals](https://docs.unity3d.com/6000.1/Documentation/Manual/scriptable-render-pipeline-introduction.html)
- [Built-In Render Pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/built-in-render-pipeline.html)
- [GraphicsSettings.currentRenderPipeline — 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Rendering.GraphicsSettings-currentRenderPipeline.html)

스크랩 시점은 2025년 12월이고, 원문 링크가 **6000.1로 고정**되어 있어 인용은
그 버전 문서를 기준으로 했다. 같은 날 스크랩한 셰이더 쪽 클리핑들은 6000.2를
가리키고 있었다.
