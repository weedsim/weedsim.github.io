---
pubDatetime: 2026-09-16T19:00:00+09:00
title: "커스텀 셰이더 문서의 표는 목차가 아니라 분기다"
lang: ko
translationKey: unity-custom-shaders
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - URP
  - 그래픽스
  - 최적화
description: "Unity의 Custom shaders 페이지에는 URP 줄과 빌트인 줄이 따로 있다. 인터넷에서 찾은 셰이더 코드가 컴파일조차 안 되는 이유가 대개 그 갈림이다. 양쪽의 실제 차이와, 아무도 안 누르는 Troubleshooting 줄 아래 있던 내용을 정리했다."
---

URP 글리치 패키지를 붙여 쓰다가 셰이더를 직접 손봐야겠다 싶어서, Unity
매뉴얼의 **Custom shaders** 페이지를 스크랩해뒀었다. 표 하나에 여섯 줄이 들어
있는 페이지다.

다시 열어보니 표에 이상한 게 있다. **같은 일을 하는 줄이 두 개**다.

> Custom shaders in the Universal Render Pipeline (URP)
> Custom shaders in the Built-In Render Pipeline

"URP에서 셰이더 쓰기"와 "빌트인에서 셰이더 쓰기"가 별개 항목으로 나뉘어 있다.
목차라면 이렇게 나눌 이유가 없다. **나뉘어 있다는 건 두 길이 다르다는
뜻**이고, 실제로 인터넷에서 찾은 셰이더 코드가 컴파일조차 안 되는 이유가 대개
여기다.

글리치 효과를 찾을 때도 같은 일을 겪었다. 검색해서 나오는 코드의 상당수가
빌트인 시절 것이라 그대로는 안 붙는다. 출발점이었던 패키지 자체의 이야기는
[포크 세 번 끝에 공식판이 나왔다](/posts/urp-glitch-package/)에 따로 써뒀고,
이 글은 그 갈림을 확인하고 내친김에 표에서 제일 안 누르게 되는 줄
(Troubleshooting) 아래까지 내려가 본 기록이다.

## 목차

## 표에 URP 줄과 빌트인 줄이 따로 있다

원문의 표는 여섯 줄이다.

| 페이지 | 설명 |
|---|---|
| Writing custom shaders | Shader Graph 또는 HLSL·ShaderLab으로 셰이더 만들기 |
| Optimize shaders | 런타임 성능, 특히 GPU 성능이 제한된 모바일 |
| **Custom shaders in URP** | URP에서 HLSL·ShaderLab 코드 쓰기 |
| **Custom shaders in the Built-In Render Pipeline** | 빌트인에서 HLSL·ShaderLab·**서피스 셰이더** 쓰기 |
| Troubleshooting shaders | 히칭·스톨, 큰 빌드 크기 같은 흔한 문제 해결 |
| Shader languages reference | ShaderLab과 HLSL 레퍼런스 |

세 번째와 네 번째 줄을 나란히 놓고 보면 차이가 보인다. **빌트인 줄에만
"서피스 셰이더"가 붙어 있다.** URP 줄에는 없다.

이게 우연이 아니라는 걸 확인하려고 서피스 셰이더 페이지를 열었다.

## 서피스 셰이더는 빌트인 전용이다

문서 첫 문장이 이미 조건을 달고 있다.

> **빌트인 렌더 파이프라인에서**, 서피스 셰이더는 조명과 상호작용하는 셰이더를
> 작성하는 간소화된 방법이다.

그리고 호환성 표가 명시적이다.

| 파이프라인 | 서피스 셰이더 | Shader Graph |
|---|---|---|
| URP | **아니오** | 예 |
| HDRP | **아니오** | 예 |
| 커스텀 SRP | **아니오** | **아니오** |
| 빌트인 | 예 | 예 |

두 줄을 같이 놓으면 그림이 분명해진다.

- **서피스 셰이더는 빌트인에만 있다.** URP·HDRP·커스텀 SRP 전부 "아니오"다.
  URP와 HDRP에서 커스텀 라이팅을 하려면 **대신** Shader Graph를 쓰거나 파이프라인
  셰이더 코드를 수정하라고 문서가 안내한다.
- **Shader Graph는 반대로 빌트인에서도 된다.** 예전에 SRP 전용이던 기억으로
  "Shader Graph는 URP/HDRP 전용"이라고 알고 있었는데, 지금 표는 빌트인도 "예"다.
  대신 **커스텀 SRP가 유일하게 "아니오"** 다.

블로그나 에셋스토어에서 가져온 셰이더가 URP에서 분홍색으로 나오는 경우, 첫 번째
용의자가 이것이다. `#pragma surface surf Standard` 로 시작하는 코드는
**URP에서 애초에 동작하지 않는다.** 문법 오류가 아니라 파이프라인이 다른 것이다.

## URP 셰이더가 반드시 갖춰야 하는 것

그럼 URP 셰이더는 어떻게 생겼나. 문서의 최소 예제가 이렇다.

```hlsl
Shader "Example/URPUnlitShaderBasic"
{
    Properties
    { }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
            };

            struct Varyings
            {
                float4 positionHCS  : SV_POSITION;
            };

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                return OUT;
            }

            half4 frag() : SV_Target
            {
                half4 customColor = half4(0.5, 0, 0, 1);
                return customColor;
            }
            ENDHLSL
        }
    }
}
```

빌트인 예제와 비교하면 **세 군데**가 다르다. 옛 튜토리얼을 옮겨 붙일 때
걸리는 지점이 정확히 이 셋이다.

| | 빌트인 | URP |
|---|---|---|
| 파이프라인 태그 | 없음 | `"RenderPipeline" = "UniversalPipeline"` |
| 블록 | `CGPROGRAM` … `ENDCG` | `HLSLPROGRAM` … `ENDHLSL` |
| 인클루드 | `UnityCG.cginc` | `.../ShaderLibrary/Core.hlsl` |

**`RenderPipeline` 태그**가 있어야 URP가 이 SubShader를 자기 것으로 인식한다.
없으면 URP가 쓰지 않는다.

**`UnityCG.cginc`는 URP 셰이더 라이브러리가 아니다.** `UnityObjectToClipPos`
같은 빌트인 함수 이름도 URP에서는 `TransformObjectToHClip`으로 바뀐다. 이름만
비슷하게 고치면 되는 게 아니라 **들어오는 헤더 자체가 다르다.**

변수 이름의 접미사도 눈여겨볼 만하다. `positionOS`(Object Space),
`positionHCS`(Homogeneous Clip Space)처럼 URP 셰이더 라이브러리는 **좌표계를
이름에 적는 관례**를 따른다. 규칙은 아니지만 공식 예제가 전부 이 형태라,
맞춰 쓰면 나중에 읽기 편하다.

## 아무도 안 누르는 줄 — Troubleshooting

표의 다섯 번째 줄은 "히칭·스톨, 큰 빌드 크기"라고 적혀 있다. 셰이더를 처음
쓸 때는 관심이 안 가는 항목인데, **결국 여기로 오게 된다.** 내려가 보니 네
갈래였다.

| 항목 | 내용 |
|---|---|
| Error and loading shaders | 정상 셰이더를 못 쓸 때 Unity가 쓰는 특수 셰이더 |
| Fixing hitches or stalls | 씬이 도는 중에 셰이더를 로드·컴파일해서 생기는 스톨 |
| Reducing the size or number of shaders | 컴파일되는 셰이더 수와 메모리 사용량 줄이기 |
| Debugging shaders | 디버그 심볼로 컴파일해서 분석하기 |

### 배리언트는 곱셈으로 늘어난다

두 번째와 세 번째의 뿌리가 같다. **셰이더 배리언트**다. 문서가 규칙을 한 줄로
적어놨다.

> Unity가 셰이더 프로그램에 대해 컴파일하는 배리언트의 수는 **키워드 집합들의
> 곱**이다. 즉 각 집합에서 하나씩 뽑은 모든 조합마다 배리언트 하나를 컴파일한다.

문서의 예가 구체적이다. 색 세 개(RED/GREEN/BLUE)와 품질 네 개(LOW/MEDIUM/
HIGH/ULTRA)면 3 × 4 = **12개**. 여기까지는 별것 아닌데 다음 문장이 규모를
보여준다.

> 키워드 집합이 열 개면 **1024개**의 배리언트가 나온다.

그리고 이 현상에 이름을 붙여뒀다 — **조합 폭발(combinatorial explosion)**.
빌드 시간이 길어지고 빌드 크기가 커지는 원인의 상당 부분이 이것이다.

### `multi_compile`과 `shader_feature`의 차이

배리언트를 만드는 지시자가 둘인데, **딱 한 문장으로 갈린다.**

| 지시자 | 문서의 서술 |
|---|---|
| `#pragma shader_feature` | 빌드의 **머티리얼이 실제로 쓰는** 키워드 조합만 컴파일하고, 나머지 배리언트는 제거한다 |
| `#pragma multi_compile` | 빌드의 머티리얼이 쓰든 말든 **상관없이** 컴파일한다 |
| `#pragma dynamic_branch` | 분기를 **하나의 컴파일된 프로그램 안에** 남긴다 |

`multi_compile`을 쓰면 **런타임에 스크립트로 키워드를 켜고 끌 수 있는 대신**
전부 컴파일된다. 문서가 든 예가 키워드 세 개짜리 집합 여덟 개 —
**6,000개가 넘는** 배리언트다.

기준은 이렇게 잡으면 된다. **머티리얼에서 체크박스로 켜는 옵션이면
`shader_feature`, 런타임에 코드로 바꿔야 하면 `multi_compile`.** 습관적으로
`multi_compile`을 쓰면 안 쓰는 조합까지 전부 빌드에 실린다.

`dynamic_branch`는 성격이 다르다. 배리언트를 늘리지 않고 **키워드를 0 또는 1의
유니폼 정수로 바꿔서** 드로 콜마다 GPU에 보낸다. 배리언트 수를 줄이는 대신
셰이더 안에서 분기 비용을 내는 쪽이다.

### URP는 일부를 알아서 걷어낸다

URP를 쓰면 손을 덜 대도 되는 부분이 있다.

> URP 에셋에서 기능을 비활성화하면, URP가 관련 셰이더 배리언트를 자동으로
> 제외(스트립)한다.

문서가 드는 예가 디렉셔널 라이트의 **Cast Shadows**다. 이걸 끄면 관련 그림자
배리언트가 빌드에서 빠진다. **URP 에셋의 체크박스가 그대로 빌드 크기**라는
뜻이다. 쓰지 않는 기능을 켜둔 채로 두면 그만큼 실린다.

### 스톨은 컴파일 시점의 문제다

히칭 쪽은 원인이 조금 다르다. 배리언트를 **처음 쓰는 순간** 셰이더와 PSO를
컴파일하느라 멈춘다.

**PSO(파이프라인 상태 객체)** 는 컴파일된 셰이더 코드와 관련 GPU 상태를 묶은
것이다. 해법은 미리 만들어두는 것이다.

> 셰이더를 컴파일하고 PSO를 **필요해지기 전에** 만들어서, 그래픽스 드라이버가
> 디스크에 캐시하게 한다.

API가 그래픽스 API에 따라 갈린다.

| 대상 | API |
|---|---|
| DirectX 12 · Metal · Vulkan | `GraphicsStateCollection.BeginTrace` / `EndTrace` / `SendToEditor`, `WarmUp`, `WarmUpProgressively` |
| 그 외 | `Experimental.Rendering.ShaderWarmup`, `Shader.WarmupAllShaders`, `ShaderVariantCollection.WarmUp` |

다만 문서가 **"일부 API는 실험적이며 프로덕션에 쓸 준비가 되지 않았다"** 고
적어뒀다. 네임스페이스에 `Experimental`이 그대로 들어 있는 것도 같은
이야기다. 붙이기 전에 대상 플랫폼과 Unity 버전을 확인해야 한다.

## 어디에 왜 쓰나

위의 것들이 실제로 만나는 자리는 대개 하나다. **머티리얼 값을 코드로 바꾸는
효과**를 만들 때다. 피격 시 깜빡이기, 아이템 강조, 디졸브 같은 것들.

### 셰이더 쪽 — 프로퍼티와 키워드를 뚫는다

앞의 최소 예제에 프로퍼티 두 개와 키워드 하나를 붙인 형태다.

```hlsl
Shader "Example/URPHighlight"
{
    Properties
    {
        _BaseMap("Base Map", 2D) = "white" {}
        _BaseColor("Base Color", Color) = (1, 1, 1, 1)
        _HighlightColor("Highlight Color", Color) = (1, 1, 0, 1)
        _HighlightAmount("Highlight Amount", Range(0, 1)) = 0
        [Toggle(_RIM_ON)] _RimEnabled("Enable Rim", Float) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            // 머티리얼 체크박스로만 켜는 옵션이므로 shader_feature.
            // 런타임에 코드로 켜야 한다면 multi_compile이어야 한다.
            #pragma shader_feature_local_fragment _RIM_ON

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
                float3 normalOS     : NORMAL;
                float2 uv           : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionHCS  : SV_POSITION;
                float2 uv           : TEXCOORD0;
                half3  normalWS     : TEXCOORD1;
                float3 positionWS   : TEXCOORD2;
            };

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            // SRP 배처 호환을 위해 머티리얼 프로퍼티는 이 블록 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                half4  _BaseColor;
                half4  _HighlightColor;
                half   _HighlightAmount;
            CBUFFER_END

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                VertexPositionInputs positions = GetVertexPositionInputs(IN.positionOS.xyz);
                VertexNormalInputs   normals   = GetVertexNormalInputs(IN.normalOS);
                OUT.positionHCS = positions.positionCS;
                OUT.positionWS  = positions.positionWS;
                OUT.normalWS    = half3(normals.normalWS);
                OUT.uv          = TRANSFORM_TEX(IN.uv, _BaseMap);
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 albedo = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv) * _BaseColor;

            #ifdef _RIM_ON
                half3 viewDirWS = half3(GetWorldSpaceNormalizeViewDir(IN.positionWS));
                half  rim = half(1.0) - saturate(dot(normalize(IN.normalWS), viewDirWS));
                albedo.rgb += _HighlightColor.rgb * rim * _HighlightAmount;
            #else
                albedo.rgb = lerp(albedo.rgb, _HighlightColor.rgb, _HighlightAmount);
            #endif

                return albedo;
            }
            ENDHLSL
        }
    }
}
```

문서에서 가져온 판단이 세 개 들어 있다.

- **`shader_feature`를 골랐다.** 이 토글은 머티리얼에서만 켜는 것이라, 런타임
  제어가 필요 없으면 안 쓰는 조합이 빌드에서 빠지는 쪽이 낫다. 접미사 `_local`은
  키워드 범위를 이 셰이더로 한정하고, `_fragment`는 프래그먼트 단계에만 영향을
  준다는 표시다. 문서가 `_vertex`·`_fragment`·`_hull`·`_domain`·`_geometry`·
  `_raytracing`과 `_local`을 **조합할 수 있다**고 적어놨다.
- **좌표 변환은 URP의 내장 메서드를 썼다.** `GetVertexPositionInputs`,
  `GetVertexNormalInputs`, `GetWorldSpaceNormalizeViewDir` 전부 URP 문서의
  내장 셰이더 메서드 목록에 있는 것들이다.
- **`half`를 기본으로 썼다.** 최적화 페이지의 규칙이 그렇다. 다만
  `positionWS`와 `uv`는 `float`으로 뒀다 — 예외가 정확히 그 둘이다.
- **`half(1.0)`처럼 캐스트로 썼다.** `1.0h` 접미사 대신이다. 이것도 문서 규칙이다.

### C# 쪽 — 머티리얼을 복제하지 않고 값을 넣는다

셰이더 프로퍼티를 코드로 건드릴 때 두 가지를 조심한다.

```csharp
using UnityEngine;

/// <summary>
/// 피격 시 머티리얼의 하이라이트 값을 잠깐 올렸다 되돌린다.
/// </summary>
[RequireComponent(typeof(Renderer))]
public class HitFlash : MonoBehaviour
{
    private const float FLASH_DURATION = 0.15f;

    // 문자열을 매번 해싱하지 않도록 ID를 캐싱한다.
    private static readonly int HIGHLIGHT_AMOUNT_ID = Shader.PropertyToID("_HighlightAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("피격 순간의 하이라이트 세기")]
    private float _peak = 1f;

    private Renderer _renderer;
    private MaterialPropertyBlock _propertyBlock;
    private float _flashEndTime;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();
        _propertyBlock = new MaterialPropertyBlock();
    }

    public void Flash()
    {
        _flashEndTime = Time.time + FLASH_DURATION;
        enabled = true;
    }

    private void Update()
    {
        float remaining = _flashEndTime - Time.time;
        float amount = remaining <= 0f
            ? 0f
            : _peak * (remaining / FLASH_DURATION);

        // renderer.material을 건드리면 머티리얼 사본이 생긴다.
        // 프로퍼티 블록은 그 사본 없이 이 렌더러에만 값을 덮어쓴다.
        _renderer.GetPropertyBlock(_propertyBlock);
        _propertyBlock.SetFloat(HIGHLIGHT_AMOUNT_ID, amount);
        _renderer.SetPropertyBlock(_propertyBlock);

        if (remaining <= 0f)
        {
            enabled = false;
        }
    }
}
```

두 가지만 짚어둔다.

- **`Shader.PropertyToID`로 ID를 캐싱한다.** 문자열을 매 프레임 넘기면 그때마다
  해싱한다. 애니메이터 파라미터에 `Animator.StringToHash`를 쓰는 것과 같은
  이유다.
- **`renderer.material` 대신 `MaterialPropertyBlock`을 쓴다.** 스크립팅
  레퍼런스가 `Renderer.material`에 대해 이렇게 적어놨다 — **"이 함수는
  머티리얼을 자동으로 인스턴스화해 이 렌더러 전용으로 만든다"**, 그리고
  **"게임 오브젝트가 파괴될 때 머티리얼을 파괴하는 것은 당신의 책임이다."**
  적이 100마리면 머티리얼 사본이 100개 생기고, 정리도 내 몫이다. 문서가
  프로퍼티 블록을 대안으로 권하지는 않지만, 저 두 문장을 읽고 나면 값 하나
  바꾸자고 사본을 만들 이유가 없다.

`Update`가 끝나면 스스로 `enabled = false`로 꺼지게 해둔 것도 의도다. 꺼진
컴포넌트의 `Update`는 호출되지 않는다.

### 쓰지 말아야 할 자리

- **Shader Graph로 되는 일에 HLSL을 쓰는 것.** 표를 보면 URP·HDRP·빌트인
  전부 Shader Graph가 "예"다. 코드로 써야 할 이유(버전 관리에서 diff를 보고
  싶다, 그래프로 표현이 안 된다)가 분명할 때만 손으로 쓰는 게 낫다.
- **`multi_compile`을 기본값으로 쓰는 것.** 런타임에 안 바꿀 옵션이면
  `shader_feature`다. 앞의 6,000개짜리 예가 그 결과다.
- **모바일에서 `discard`와 `ColorMask`.** 최적화 페이지가 둘 다 피하라고
  직접 적어뒀다.

## 최적화 페이지에서 건진 규칙

표의 두 번째 줄이다. 짧지만 바로 적용되는 항목이 모여 있다.

> 월드 공간 좌표와 텍스처 좌표를 제외한 **모든 변수에 `float` 대신 `half`** 를
> 써라.

> 접미사 대신 **캐스트**를 써라. 예를 들어 `2.0h` 대신 `half(2.0)`.

접미사가 불필요한 float 변환을 유발해 셰이더 실행이 느려진다는 게 이유다.
나머지는 이렇다.

| 규칙 | 이유 |
|---|---|
| 계산을 프래그먼트에서 **버텍스 셰이더로** 옮긴다 | 픽셀마다 도는 비용을 줄인다 |
| `pow`·`log`·`sin` 대신 **룩업 텍스처** | 함수 호출이 비싸다 |
| `normalize`·`dot`은 **Unity HLSL 함수**를 쓴다 | 직접 구현하지 말 것 |
| 모바일에서 `discard`와 `ColorMask` 회피 | — |
| 프래그먼트에서 **깊이 버퍼에 쓰지 않는다** | 얼리 뎁스 테스트를 살리기 위해 |

마지막 항목이 특히 값이 크다. 프래그먼트 셰이더가 깊이를 쓰면 GPU가 **그리기
전에 가려진 픽셀을 버리는 최적화**를 포기해야 한다. 정점이 픽셀이 되기까지의
순서는
[그래픽스 파이프라인 정리](/posts/graphics-pipeline/)에 정리해뒀다.

## 정리

- **표에 URP 줄과 빌트인 줄이 따로 있는 게 이 페이지의 핵심 정보다.** 목차가
  아니라 분기다.
- **서피스 셰이더는 빌트인 전용이다.** URP·HDRP·커스텀 SRP 전부 "아니오".
  `#pragma surface`로 시작하는 코드는 URP에서 안 돈다.
- **Shader Graph는 빌트인에서도 된다.** 안 되는 건 커스텀 SRP뿐이다.
- **URP 셰이더는 세 가지가 다르다** — `RenderPipeline` 태그, `HLSLPROGRAM`,
  그리고 `Core.hlsl`. `UnityCG.cginc`를 인클루드한 코드는 옮겨 붙일 수 없다.
- **배리언트는 키워드 집합의 곱이다.** 집합 열 개면 1024개, 세 개짜리 여덟
  개면 6,000개가 넘는다. 문서의 표현이 조합 폭발이다.
- **런타임에 안 바꿀 옵션은 `shader_feature`.** `multi_compile`은 쓰든 안 쓰든
  전부 컴파일한다. URP 에셋의 체크박스도 그대로 빌드 크기다.
- **`half`가 기본, 예외는 월드 좌표와 텍스처 좌표.** 접미사 대신 캐스트.

스크랩할 때는 이 페이지가 "셰이더 시작하기"로 보였다. 다시 읽으니 **"어느
파이프라인에 있는지 먼저 확인하라"** 는 페이지였다. 표가 여섯 줄인 게 아니라,
두 갈래가 섞여 여섯 줄로 보인 것이다.

---

### 참고

- [Custom shaders — Unity 매뉴얼 6000.2](https://docs.unity3d.com/6000.2/Documentation/Manual/Shaders.html)
- [Surface Shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-SurfaceShaders.html)
- [Custom shaders in URP](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/writing-custom-shaders-urp.html)
- [Shader variants](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-variants.html)
- [How Unity compiles branching shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-conditionals-choose-a-type.html)
- [Prewarm shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-prewarm.html)
- [Transform positions in a custom URP shader — 내장 셰이더 메서드](https://docs.unity3d.com/6000.1/Documentation/Manual/urp/use-built-in-shader-methods-transformations.html)
- [Optimize shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-ShaderPerformance.html)
- [Renderer.material — 스크립팅 레퍼런스](https://docs.unity3d.com/ScriptReference/Renderer-material.html)

스크랩 시점은 2025년 12월이고, 원문 링크가 **6000.2로 고정**되어 있어 인용은
그 버전 문서를 그대로 썼다. 버전이 박힌 링크는 이렇게 나중에 대조하기 좋다.
