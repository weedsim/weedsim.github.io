---
pubDatetime: 2026-10-15T18:30:00+09:00
title: "Height Map은 디스플레이스먼트가 아니라 패럴랙스다"
lang: ko
translationKey: tessellation-displacement
featured: false
draft: false
tags:
  - 그래픽스
  - 렌더링
  - 셰이더
  - GPU
  - Unity
description: "면접에서 테셀레이션 이야기를 듣고 그게 뭔지 찾다가 스크랩한 입문 글이다. 테셀레이션과 디스플레이스먼트를 한 쌍으로 묶은 건 Microsoft 문서가 그렇게 적는 그대로다. 그런데 Unity에서 그 짝으로 보이는 칸, Standard 셰이더의 Height Map은 디스플레이스먼트가 아니다 — 문서가 패럴랙스 매핑이라고 적는다."
---

**면접 중에 테셀레이션 이야기를 듣고 스크랩한 것이다.** 그 자리에서는 단어만
알아듣고 넘어갔고, 끝난 뒤에 그게 정확히 무엇인지 찾아보다가 이 글에 걸렸다.

스크랩해둔 것은 테셀레이션을 **입문자용으로** 풀어 쓴 글이다. 글머리에
주의를 두 개 달아두고 시작한다 — 전문 분야이고, 실시간으로 발전하는 기술이라
틀린 부분이 있을 수도 있다고. 그 전제를 적어둔 글이니 틀린 데를 찾는 것이
목적이 아니다.

**큰 그림은 맞게 세워져 있다.** 물체는 삼각형으로 표현되고, 꼭짓점을 기준으로
인식되니 구가 각져 보이고, 테셀레이션은 면을 더 잘게 나눈다. 그리고 가장
중요한 한 줄을 정확히 짚는다.

> 단순히 테셀레이션 만으로는 그리 큰효과가 없는데 왜 테셀레이션 기술이 쓰일까?
>
> 그래서 테셀레이션과 같이 사용되는 기술은 디스플레이스먼트맵이다.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**이 짝짓기가 맞다.** 뒤에서 확인하는데, Microsoft의 Direct3D 11 문서가 같은
짝을 명시적으로 적어둔다. 입문 글이 핵심을 비껴가지 않았다.

어긋난 데는 **그 옆의 두 단어**다. 노멀 맵이 무엇을 저장하는지, 그리고
범프 맵이 무엇인지. 그리고 Unity로 넘어오면 하나가 더 생긴다 — **Standard
셰이더에서 "Height Map"이라고 적힌 칸은 디스플레이스먼트가 아니다.**

## 목차

## 노멀 맵이 저장하는 건 밝기가 아니라 방향이다

원문이 노멀 맵을 한 줄로 설명한다.

> 노말맵: 물체의 X부분은 더밝게 출력하고 Y는 더 어둡게 출력해서 입체감을 주는
> 방식
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**밝기를 출력하는 방식**으로 적혀 있다. Unity 문서는 저장되는 것을 다르게
적는다.

> Normal maps are a special kind of texture that allow you to add surface
> detail such as bumps, grooves, and scratches to a model.
>
> each pixel, called a texel, represents a deviation in surface normal
> direction
>
> each pixel represents the difference in direction the surface should face
>
> — [Normal map (Bump mapping) — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**텍셀마다 들어 있는 것은 "방향의 차이"다.** 밝기가 아니다. 노멀 맵은 RGB
텍스처이고, 세 채널이 색이 아니라 **법선 벡터의 성분**으로 읽힌다.

그러면 밝기 차이는 어디서 나오나. **결과로 나온다.** 같은 페이지가 그
인과를 적어둔다.

> would only be apparent due to the way lighting appears on the surface,
> because these modified normals are used in the lighting calculations
>
> — [Normal map (Bump mapping) — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**바뀐 법선이 조명 계산에 들어가고, 그래서 밝기가 달라 보인다.** 원문은
그 순서를 뒤집어서, **결과(밝기)를 저장 내용으로** 적었다. 입체감이 생기는
이유를 "밝게/어둡게 출력하기 때문"으로 설명하면, 왜 광원 방향을 바꾸면
음영이 같이 따라 도는지가 설명되지 않는다.

| | 원문이 적은 것 | Unity 문서가 적은 것 |
|---|---|---|
| 텍셀에 담긴 값 | 더 밝게 / 더 어둡게 | "a deviation in surface normal direction" |
| 텍스처 종류 | 명시 없음 | RGB 텍스처 (방향의 차이) |
| 밝기 차이의 지위 | **원인** | **결과** — "these modified normals are used in the lighting calculations" |
| 지오메트리 | 명시 없음 | "does not affect the actual polygonal nature of the mesh" |

마지막 줄이 이 글 전체의 축이다. 같은 페이지가 **"does not affect the actual
polygonal nature of the mesh, only how the lighting is calculated on the
surfaces."**라고 적고, 비스듬히 보면 **"will reveal the true nature of the
flat surface"**라고 덧붙인다. 노멀 맵이 **단독으로는 모양을 바꾸지 않는다**는
점은 다른 셰이더에서도 같고, lilToon의 노멀 맵 항목이 영향을 주는 범위는
[lilToon 파라미터 정리: 공식 문서를 대조한 한국어 레퍼런스](/posts/liltoon-parameters/)에
적어뒀다.

## 범프 맵은 기법이 아니라 분류다

원문이 두 기법을 나란히 든다.

> 이때 테셀레이션과 관계가 깊은 입체감을 위한 2가지 방법이 있다. 범프맵과
> 노말맵이다.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**범프맵과 노말맵을 둘로 세운다.** Unity 문서의 분류는 그렇지 않다.

> Normal maps and height maps are both kinds of bump map
>
> A height map is a simple black and white texture, where each pixel
> represents how much that point on the surface should appear to be raised
>
> Unity can also accept Height Maps for bump mapping, but they must be
> converted to Normal Maps on import in order to use them.
>
> — [Normal map (Bump mapping) — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**범프 맵이 상위 분류이고, 노멀 맵과 하이트 맵이 그 아래 둘이다.** 원문은
상위 분류와 하위 항목을 같은 줄에 나란히 놓았다. 그리고 세 번째 문장이
중요하다 — Unity는 하이트 맵을 범프 매핑에 받아주지만 **임포트 시점에 노멀
맵으로 변환해야** 쓸 수 있다. 밝기로 저장된 맵이 들어와도 결국 **방향으로
바뀌어서** 쓰인다는 뜻이다.

그래서 원문이 노멀 맵을 밝기로 설명한 것은 **하이트 맵의 저장 형식을 노멀
맵의 이름으로 부른 것**에 가깝다. 두 개념이 범프 맵이라는 한 우산 아래에
있어서 섞이기 쉬운 자리다.

| 용어 | Unity 문서의 위치 | 저장 형식 |
|---|---|---|
| Bump map | **상위 분류** | — |
| Normal map | 범프 맵의 한 종류 | RGB, 방향의 차이 |
| Height map | 범프 맵의 한 종류 | **"simple black and white texture"**, 밝을수록 높음 |
| 임포트 | — | 하이트 맵은 **노멀 맵으로 변환**해서 쓴다 |

## Height Map은 디스플레이스먼트가 아니라 패럴랙스다

여기가 Unity로 넘어올 때 생기는 간극이다. 원문은 디스플레이스먼트맵을
이렇게 인용한다.

> displacement mapping은 일일이 모델링하기 힘든 굴곡들을 displacement map으로
> 적용된 이미지의 밝고, 어두움을 기준으로 형성해주는 기법이다. 밝은 곳은
> 튀어나오고, 어두운 곳은 들어가도록 모델링한다.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**"밝은 곳은 튀어나오고"** — 실제로 모양이 바뀐다는 설명이다. 그 설명을
들고 Unity의 Standard 셰이더를 열면, 밝을수록 높은 그레이스케일 맵을 받는
칸이 하나 있다. 이름이 **Height Map**이다. 그 칸의 문서는 이렇게 시작한다.

> Height mapping (also known as parallax mapping) is a similar concept to
> normal mapping
>
> actually shifts the areas of the visible surface texture around, to achieve
> a kind of surface-level occlusion effect
>
> — [Height map — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)

**패럴랙스 매핑이다.** 바뀌는 것은 지오메트리가 아니라 **보이는 텍스처의
위치**다. 그래서 같은 페이지가 한계를 못 박는다.

> the silhouette of the model will never be modified, because ultimately the
> effect is drawn onto the surface
>
> — [Height map — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)

**실루엣은 절대 바뀌지 않는다.** 표면 위에 그려지는 효과이기 때문이다. 즉
원문이 설명한 디스플레이스먼트 — 꼭짓점을 실제로 밀어 올리는 것 — 를
기대하고 Standard 셰이더의 Height Map에 맵을 꽂으면 **윤곽이 그대로다.**
안쪽 질감은 그럴듯해지는데 모델의 외곽선은 평평하다.

문서는 이 둘의 관계도 적어둔다. 노멀 매핑은 조명만 바꾸고, 하이트 매핑은
거기서 한 걸음 더 나가 보이는 텍스처를 밀어준다. 그리고 **보통 노멀 맵과
함께 쓴다**고 적는다. 비용에 대한 주의도 한 줄 있다 — 노멀 매핑보다 복잡하고
비싸다는 것이다.

| 기법 | 무엇이 바뀌나 | 실루엣 | Unity의 칸 |
|---|---|---|---|
| Normal map | 조명 계산 | 안 바뀜 | Normal Map |
| Height map (패럴랙스) | **보이는 텍스처의 위치** | **"never be modified"** | Height Map |
| Displacement | **꼭짓점 위치** | 바뀜 | Standard 셰이더에 없음 |

**세 번째 줄에 해당하는 칸이 Standard 셰이더에는 없다.** 원문이 말한
디스플레이스먼트는 테셀레이션과 묶여 있는 기능이고, 그건 Standard 셰이더의
체크박스가 아니라 **다른 셰이더를 골라야** 나온다. 아래에서 그 경로를 본다.

## 테셀레이션과 디스플레이스먼트를 묶은 건 맞다

원문이 **DirectX 11부터**라고 적은 것도 맞다.

> DirectX11 부터 테셀레이션을 지원하는 모듈이 사용되었어서
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

Microsoft 문서가 단계를 셋으로 적고 "new"라고 쓴다.

> The Direct3D 11 pipeline implements tessellation using three new pipeline
> stages:
>
> Hull-Shader Stage: A programmable shader stage that produces a geometry
> patch (and patch constants) that correspond to each input patch
>
> Tessellator Stage: A fixed function pipeline stage that creates a sampling
> pattern of the domain that represents the geometry patch
>
> Domain-Shader Stage: A programmable shader stage that calculates the vertex
> position that corresponds to each domain sample
>
> — [Tessellation Stages — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)

**프로그래머블 둘 사이에 고정 단계 하나**가 끼어 있는 구조다. 이 세 단계가
파이프라인 어디에 앉아 있는지는
[그래픽스 파이프라인 정리: 정점이 픽셀이 되기까지](/posts/graphics-pipeline/)에
단계 번호까지 적어뒀다. 여기서 볼 것은 **왜 쓰는가**이고, 같은 페이지가
디스플레이스먼트를 **이름으로** 거론한다.

> tessellation implemented by hardware can generate an incredible amount of
> visual detail (including support for displacement mapping) without adding
> the visual detail to the model sizes
>
> The tessellation technique implemented in the Direct3D 11 pipeline also
> supports displacement mapping, which can produce stunning amounts of surface
> detail.
>
> — [Tessellation Stages — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)

**원문의 짝짓기가 문서의 짝짓기와 같다.** "테셀레이션 혼자서는 의미가 없고
디스플레이스먼트와 합쳐져야 효과가 난다"는 설명은 입문 글이 지어낸 것이
아니라, 하드웨어 테셀레이션을 도입한 쪽이 이익으로 적어둔 항목이다.

같은 페이지가 이익을 셋 더 적는다 — **메모리와 대역폭 절약**, **연속적
또는 시점 의존 LOD**, 그리고 **"performing expensive computations at lower
frequency"**다. 저해상도 모델만 보내고 디테일은 GPU에서 만드는 구조라서
그렇다.

## Unity에서 그걸 쓰는 길은 파이프라인마다 다르다

그럼 Unity에서는 어디서 켜나. **파이프라인마다 다르고, 가장 많이 알려진
길이 가장 좁다.**

빌트인에서는 서피스 셰이더의 지시어다.

> Tessellation is indicated by tessellate:FunctionName modifier.
>
> Surface shaders can optionally compute phong tessellation to smooth model
> surface even without any displacement mapping.
>
> the shader is automatically compiled into the Shader Model 4.6 target
>
> Only triangle domain - no quads, no isoline tessellation.
>
> — [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)

**`tessellate:` 한 줄이다.** 그리고 제약이 셋 붙는다 — 셰이더 모델 **4.6**로
자동 컴파일되므로 오래된 타깃이 떨어져 나가고, **삼각형 도메인만** 지원하고,
그리고 **서피스 셰이더라는 것 자체**가 제약이다. 같은 페이지가 그걸 적어둔다 —
**"The Universal Render Pipeline (URP) doesn't support surface shaders"**이고,
호환성 표에서 HDRP와 커스텀 SRP도 미지원이다. 그 표를 읽는 방법은
[커스텀 셰이더 문서의 표는 목차가 아니라 분기다](/posts/unity-custom-shaders/)에
적어뒀고, 빌트인 셰이더 예제 중 어느 것이 URP로 넘어오고 어느 것이 안
넘어오는지는
[빌트인 셰이더 예제 13개: 목록 아래로 갈수록 URP로 안 넘어온다](/posts/builtin-shader-examples/)에
세어뒀다.

더 걸리는 것은 같은 페이지가 달고 있는 공지다 — 빌트인 렌더 파이프라인이
**deprecated**이고 Unity 6.7 LTS 수명 주기까지 지원된다는 문장이다. 그 공지를
어디서 확인했는지는
[인스펙터에 띄우는 건 Exposed가 아니라 Show In Inspector다](/posts/shadergraph-exposed/)에
적어뒀다.

HDRP에는 전용 셰이더와 옵션이 있다.

> The Tessellation options control how Unity tessellates your Material's
> surface and smooths geometry.
>
> None: HDRP only uses the displacement map to tessellate the mesh.
>
> Phong: HDRP applies Phong tessellation to the mesh.
>
> Max Displacement: Maximun possible world displacement in meter for the
> Material.
>
> — [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)

**`None` 모드의 설명이 이 글의 요점을 그대로 말한다** — "HDRP only uses the
displacement map to tessellate the mesh." 디스플레이스먼트 맵이 테셀레이션을
구동하는 입력이다. Standard 셰이더의 Height Map과는 역할이 다르다. 같은
페이지가 **Tessellation Factor는 Lit Tessellation / Layered Lit Tessellation
셰이더에서만** 쓸 수 있다고 적고, Master Stack에서는 입력으로 나타난다고
덧붙인다. 그리고 **데칼 메시는 테셀레이션을 지원하지 않는다.**

| 경로 | 켜는 방법 | 제약 |
|---|---|---|
| 빌트인 + 서피스 셰이더 | `tessellate:FunctionName` | SM 4.6, 삼각형 도메인만, **URP·HDRP 미지원** |
| 빌트인 자체 | — | **deprecated** (6.7 LTS까지 지원) |
| HDRP | Lit Tessellation / Layered Lit Tessellation | 그 셰이더들에서만, 데칼 메시 제외 |
| HDRP Master Stack | Tessellation Factor가 **입력으로** 노출 | Max Displacement는 Master Stack 전용 |
| Standard 셰이더 | **없다** | Height Map은 패럴랙스다 |

## 비용은 켜기만 해도 든다

원문은 비용을 다루지 않는다. 입문 글이니 당연한데, 실제로 켜볼 때 가장 먼저
걸리는 문장이 HDRP 문서에 있다.

> Enabling the Tessellation option have an extra GPU cost, even if the
> tessellationFactor is 0.0 or 1.0.
>
> To maintain good performance on the Xbox One or PlayStation 4, do not use
> values greater than 15.
>
> — [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)

**계수를 0이나 1로 둬도 추가 비용이 든다.** "일단 켜두고 값을 0으로 두면
공짜"가 아니다. 그리고 숫자가 하나 적혀 있다 — Xbox One과 PlayStation 4
기준으로 **15을 넘기지 말 것**. 같은 페이지가 테셀레이션을 쓰지 않는
셰이더로 **LOD를 하나 더 두라**고 권한다.

빌트인 쪽에도 비용 이야기가 있다. 거리 기반 테셀레이션에 대한 주의와,
컬링하는 변형 함수다.

> Purely distance based tessellation is effective only when triangle sizes are
> quite similar.
>
> For performance reasons, call the UnityEdgeLengthBasedTessCull function
> instead, which performs patch frustum culling.
>
> — [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)

**삼각형 크기가 고르지 않으면 거리 기반은 어긋난다** — 작은 삼각형이 과하게
쪼개지고 큰 삼각형은 덜 쪼개진다. 그리고 패치 단위 프러스텀 컬링을 하는
함수가 따로 있고, 같은 페이지가 그 쪽이 **셰이더를 조금 더 비싸게 만들지만**
화면 밖 부분의 GPU 작업을 아낀다고 적는다.

## 어디에 왜 쓰나

테셀레이션은 **저해상도 메시를 보내고 디테일은 GPU에서 만들** 때 쓴다.
지형, 벽면의 벽돌·바위처럼 **실루엣까지 울퉁불퉁해야 하는** 표면이 대상이다.
실루엣이 평평해도 되면 노멀 맵이 훨씬 싸고, 안쪽 질감만 더 그럴듯하면
되면 Height Map(패럴랙스)이 그 중간이다. **셋을 같은 효과의 강도 차이로
보면 안 된다** — 바뀌는 대상이 각각 조명, 텍스처 위치, 꼭짓점이다.

처음 이 단어를 들었던 자리를 생각하면, **이 구분이 답의 깊이를 가른다.**
"면을 잘게 나누는 기술"까지는 검색 한 번으로 나오는 설명이고, 그 다음
질문은 "그래서 그걸 왜 하느냐"다. 거기서 디스플레이스먼트가 나와야 하고,
이어서 "Unity에서 어떻게 쓰느냐"로 가면 파이프라인별 경로와 비용 이야기가
된다. **세 층이 다 문서에 적혀 있다.**

### 동작하는 예제

이 주제에서 코드로 확인할 수 있는 것은 두 가지다. **메시의 정점 수는
테셀레이션과 무관하다**는 것, 그리고 **지금 머티리얼에 어떤 텍스처 칸이
있는지**다. 둘을 한 컴포넌트로 묶었다.

프로퍼티 이름을 상수로 박지 않았다. **Standard 셰이더의 프로퍼티 이름을
현행 문서에서 확인하지 못했으므로** 이름을 짐작해 적는 대신, 셰이더가 들고
있는 프로퍼티를 **열거해서** 출력한다.

```csharp file="Scripts/Graphics/SurfaceDetailProbe.cs"
using System.Text;
using UnityEngine;
using UnityEngine.Rendering;

[RequireComponent(typeof(Renderer))]
public class SurfaceDetailProbe : MonoBehaviour
{
    [Header("보고")]
    [Tooltip("켜면 텍스처 프로퍼티를 전부 남긴다. 끄면 꽂혀 있는 것만")]
    [SerializeField]
    private bool _listEmptySlots;

    [Tooltip("이름에 이 조각이 들어간 프로퍼티를 따로 표시한다")]
    [SerializeField]
    private string[] _highlight = { "Normal", "Bump", "Parallax", "Height" };

    private void Start()
    {
        Probe();
    }

    [ContextMenu("지금 확인")]
    private void Probe()
    {
        if (!TryGetComponent(out Renderer meshRenderer))
        {
            Debug.LogError("Renderer가 붙어 있지 않다.", this);
            return;
        }

        ReportMesh();

        // 세기만 하므로 sharedMaterial을 읽는다. material을 읽으면 인스턴스가
        // 생긴다.
        Material material = meshRenderer.sharedMaterial;
        if (material == null)
        {
            Debug.LogWarning("머티리얼이 비어 있다.", this);
            return;
        }

        ReportTextureProperties(material);
    }

    private void ReportMesh()
    {
        if (!TryGetComponent(out MeshFilter filter)) { return; }

        Mesh mesh = filter.sharedMesh;
        if (mesh == null) { return; }

        // 문서는 "Returns the number of vertices in the Mesh"라고만 적는다.
        // 테셀레이션은 GPU 단계에서 일어나므로 이 숫자에 반영되지 않는다.
        Debug.Log(
            $"메시 정점 {mesh.vertexCount}개 — 테셀레이션은 여기 안 보인다",
            this);
    }

    private void ReportTextureProperties(Material material)
    {
        Shader shader = material.shader;
        if (shader == null) { return; }

        StringBuilder builder = new StringBuilder();
        builder.AppendLine($"셰이더: {shader.name}");

        // 이름을 짐작하지 않고 셰이더가 들고 있는 것을 열거한다.
        int count = shader.GetPropertyCount();

        for (int i = 0; i < count; i++)
        {
            if (shader.GetPropertyType(i) != ShaderPropertyType.Texture)
            {
                continue;
            }

            string name = shader.GetPropertyName(i);
            Texture assigned = material.GetTexture(name);

            if (assigned == null && !_listEmptySlots) { continue; }

            string mark = IsHighlighted(name) ? " <-" : string.Empty;
            string value = assigned != null ? assigned.name : "(비어 있음)";

            builder.AppendLine($"  {name} = {value}{mark}");
        }

        Debug.Log(builder.ToString(), this);
    }

    private bool IsHighlighted(string propertyName)
    {
        foreach (string piece in _highlight)
        {
            if (string.IsNullOrEmpty(piece)) { continue; }

            if (propertyName.Contains(piece)) { return true; }
        }

        return false;
    }
}
```

세 가지를 짚어둘 만하다.

**하나 — 정점 수는 테셀레이션을 보여주지 않는다.** 문서가 `Mesh.vertexCount`를
**"Returns the number of vertices in the Mesh (Read Only)."**라고만 적는다.
테셀레이션은 Tessellator 단계에서 일어나고, 그 단계가 만든 정점은 메시
에셋에 없다. **"테셀레이션을 켰는데 정점 수가 그대로"는 정상이다.**

**둘 — 프로퍼티를 열거한다.** 문서가 셋을 다 적어둔다 —
`GetPropertyCount`는 **"Returns the number of properties in this Shader."**,
`GetPropertyName(int)`은 이름을, `GetPropertyType(int)`은
`ShaderPropertyType`을 돌려준다. 둘 다 **없는 인덱스면
`ArgumentOutOfRangeException`을 던진다**고 적혀 있어서, 루프를 `GetPropertyCount`
범위로 묶었다. 이렇게 하면 **셰이더마다 다른 이름**(빌트인·URP·HDRP·lilToon이
다 다르다)을 내가 틀리게 적을 일이 없다.

**셋 — `_highlight`가 판정이 아니라 표시다.** 이름에 `Height`가 들어 있다고
그게 패럴랙스인지 디스플레이스먼트인지 코드가 알 수는 없다. 그 칸이 무엇을
하는지는 **그 셰이더의 문서**에 있다. 그래서 화살표만 붙이고, 판단은 사람이
한다.

### 무엇을 고르나

| 하고 싶은 일 | 쓸 것 | 근거 문장 |
|---|---|---|
| 조명만 울퉁불퉁하게 | Normal map | "only how the lighting is calculated on the surfaces" |
| 안쪽 질감에 가림까지 | Height map (패럴랙스) | "shifts the areas of the visible surface texture around" |
| **실루엣까지** 바꾸기 | 테셀레이션 + 디스플레이스먼트 | "also supports displacement mapping" |
| 빌트인에서 테셀레이션 | 서피스 셰이더 `tessellate:` | "Tessellation is indicated by tessellate:FunctionName" |
| 디스플레이스먼트 없이 매끄럽게 | `tessphong:` (Phong) | "even without any displacement mapping" |
| HDRP에서 | Lit Tessellation / Layered Lit Tessellation | "only available in the Layered Lit Tessellation Shader and Lit Tessellation Shader" |
| 콘솔에서 계수 정하기 | 15 이하 | "do not use values greater than 15" |
| 화면 밖을 아끼기 | `UnityEdgeLengthBasedTessCull` | "performs patch frustum culling" |
| 테셀레이션을 끄는 LOD | LOD를 하나 더 | 문서가 권한다 |

판단 순서는 이렇게 둔다.

1. **실루엣이 바뀌어야 하나?** 아니면 노멀 맵에서 멈춘다. 가장 싸다.
2. **안쪽 가림만 필요하나?** Height Map(패럴랙스)이 그 자리다. 실루엣은
   안 바뀐다.
3. **실루엣이 바뀌어야 하면 셰이더부터 고른다.** Standard 셰이더에는 그 칸이
   없다. 파이프라인에 맞는 테셀레이션 셰이더로 간다.
4. **켜기 전에 비용을 받아들인다.** 계수를 0으로 둬도 추가 비용이 있다고
   문서가 적는다.

### 쓰지 말아야 할 자리

- **노멀 맵을 "밝게/어둡게 출력하는 맵"으로 이해하는 자리.** 텍셀에 든 것은
  **방향의 차이**다. 밝기는 조명 계산의 결과다.
- **범프 맵과 노멀 맵을 두 기법으로 나란히 두는 자리.** 문서 기준으로
  범프 맵이 상위 분류다.
- **하이트 맵을 그대로 범프로 쓰려는 자리.** Unity는 **임포트 시점에 노멀
  맵으로 변환**해야 쓴다고 적는다.
- **Standard 셰이더의 Height Map에 디스플레이스먼트를 기대하는 자리.**
  문서가 **"the silhouette ... will never be modified"**라고 적는다.
- **테셀레이션만 켜고 효과를 기다리는 자리.** 원문이 맞게 짚었고 Microsoft
  문서도 디스플레이스먼트와 묶어서 적는다.
- **URP에서 서피스 셰이더로 테셀레이션을 켜려는 자리.** 문서가 URP는
  서피스 셰이더를 지원하지 않는다고 적는다.
- **새 프로젝트를 빌트인 + 서피스 셰이더 테셀레이션으로 세우는 자리.**
  같은 페이지가 빌트인을 deprecated로 적어뒀다.
- **계수를 0으로 두면 공짜라고 보는 자리.** "even if the tessellationFactor
  is 0.0 or 1.0" 추가 비용이 있다.
- **삼각형 크기가 고르지 않은 메시에 거리 기반만 쓰는 자리.** 문서가
  크기가 비슷할 때만 효과적이라고 적는다.
- **`Mesh.vertexCount`로 테셀레이션 결과를 세려는 자리.** GPU 단계의
  산출물은 메시 에셋에 없다.

## 정리

- 원문이 **테셀레이션과 디스플레이스먼트를 한 쌍으로 묶은 것은 맞다.**
  Microsoft 문서가 하드웨어 테셀레이션의 이익으로 **"also supports
  displacement mapping"**을 이름까지 들어 적는다. **DirectX 11**도 맞다 —
  "three new pipeline stages"다.
- 노멀 맵의 텍셀에 담긴 것은 **"a deviation in surface normal direction"**,
  즉 **방향의 차이**다. 밝기 차이는 **"these modified normals are used in the
  lighting calculations"**의 **결과**다. 원문은 그 순서를 뒤집었다.
- **범프 맵은 상위 분류**다 — "Normal maps and height maps are both kinds of
  bump map". 하이트 맵은 **"simple black and white texture"**이고, Unity는
  그걸 **노멀 맵으로 변환**해서 쓴다.
- **Standard 셰이더의 Height Map은 패럴랙스 매핑이다** — "Height mapping
  (also known as parallax mapping)". 보이는 텍스처를 밀어주는 것이고,
  **"the silhouette ... will never be modified"**다. 디스플레이스먼트에
  해당하는 칸은 Standard 셰이더에 **없다.**
- Unity에서 테셀레이션을 켜는 길은 파이프라인마다 다르다. 빌트인은 서피스
  셰이더 **`tessellate:`**(SM 4.6, 삼각형 도메인만)이고 **URP·HDRP는 서피스
  셰이더를 지원하지 않는다.** 그 빌트인 자체가 **deprecated**다.
- HDRP는 **Lit Tessellation / Layered Lit Tessellation** 셰이더에서만
  Tessellation Factor를 쓸 수 있고, Master Stack에서는 입력으로 나온다.
  `None` 모드 설명이 **"HDRP only uses the displacement map to tessellate
  the mesh."**다.
- **켜기만 해도 비용이 든다** — "even if the tessellationFactor is 0.0 or
  1.0". 콘솔 기준 **15 이하**를 권하고, 테셀레이션 없는 **LOD를 하나 더**
  두라고 한다.
- 거리 기반 테셀레이션은 **삼각형 크기가 비슷할 때만** 효과적이고, 화면 밖을
  아끼려면 **`UnityEdgeLengthBasedTessCull`**이 따로 있다.
- **`Mesh.vertexCount`에는 테셀레이션이 반영되지 않는다.** GPU 단계가 만든
  정점은 메시 에셋에 없다.

---

### 참고

- [Normal map (Bump mapping) — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)
- [Height map — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)
- [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)
- [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)
- [Tessellation Stages — Microsoft Learn (Direct3D 11)](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)
- [Mesh.vertexCount — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Mesh-vertexCount.html)
- [Shader.GetPropertyCount — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyCount.html)
- [Shader.GetPropertyName — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyName.html)
- [Shader.GetPropertyType — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyType.html)
- [Rendering.ShaderPropertyType — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rendering.ShaderPropertyType.html)

원문 클리핑은 jhnambi의 티스토리 글
[테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)(2022-11-20)이다.
입문자를 위해 쓴 글이고, **틀린 부분이 있을 수도 있다는 주의를 스스로 달아둔**
글이다. 그 전제를 존중해서, 이 글은 틀린 데를 세는 대신 **용어 두 개를 문서의
정의로 바꿔 끼우고**, 거기서 Unity로 넘어올 때 생기는 간극 하나를 더했다.
테셀레이션과 디스플레이스먼트를 묶은 큰 그림은 원문이 맞게 짚었다 — 그게
이 글이 확인한 것 중 가장 중요한 항목이다.
