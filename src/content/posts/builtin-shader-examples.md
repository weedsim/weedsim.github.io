---
pubDatetime: 2026-09-16T20:00:00+09:00
title: "빌트인 셰이더 예제 13개: 목록 아래로 갈수록 URP로 안 넘어온다"
lang: ko
translationKey: builtin-shader-examples
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - URP
  - 그래픽스
  - 렌더링
description: "Unity 공식 HLSL 셰이더 예제 13개는 전부 빌트인 전용이다. 위쪽 몇 개는 이름만 바꾸면 URP에서 돌고, 라이팅부터는 재작성이다. 예제별로 어디까지 넘어오는지 대조했고, 그 과정에서 앞 글에서 틀린 줄도 나왔다."
---

앞 글에서 Unity의 커스텀 셰이더 문서가 **URP와 빌트인으로 갈린다**는 이야기를
썼다. 이 클리핑은 그 갈림길의 **빌트인 쪽 가지**다. 손으로 쓴 HLSL 예제
열세 개가 표 하나에 들어 있다.

스크랩해둔 이유도 그것이었다. **URP와 비교해보려고** 빌트인 쪽을 같이
열어둔 것이다. Unity가 직접 쓴 예제라 품질이 확실하고, 단색부터 그림자·포그까지
순서대로 올라가서 비교 대상으로 삼기에 좋다.

문제는 **전부 빌트인 전용**이라는 것이다. 그래서 실제로 궁금한 건 하나다.
**이 중 몇 개가 URP로 넘어오는가.**

## 목차

## 먼저, 앞 글에서 틀린 줄을 고친다

이 페이지를 열자마자 걸린 게 있다. 예제 코드가 이렇게 시작한다.

```hlsl
Shader "Unlit/SingleColor"
{
    Properties
    {
        _Color ("Main Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            ...
```

**빌트인 예제인데 `HLSLPROGRAM`이다.** 앞 글에서 나는 빌트인과 URP의 차이를
정리하면서 "빌트인은 `CGPROGRAM`, URP는 `HLSLPROGRAM`"이라고 표에 적었다.
**틀렸다.** 열세 개 예제를 확인해봤는데 전부 `HLSLPROGRAM` / `ENDHLSL`이다.

제대로 된 구분은 ShaderLab 코드 블록 레퍼런스에 있다.

| 블록 | 문서의 서술 |
|---|---|
| `HLSLPROGRAM` · `HLSLINCLUDE` | **모든 렌더 파이프라인과 호환** |
| `CGPROGRAM` · `CGINCLUDE` | **빌트인 렌더 파이프라인에서만 호환** |

즉 `HLSLPROGRAM`은 URP 전용 표시가 아니라 **양쪽 다 되는 쪽**이고,
`CGPROGRAM`이 빌트인 전용이다. 문서도 서피스 셰이더를 쓰는 경우가 아니면
HLSL 쪽을 쓰라고 권한다.

그리고 여기에 덜 알려진 함정이 하나 붙어 있다.

> `CGPROGRAM`을 사용하면, Unity가 **여러 내장 셰이더 인클루드 파일을 기본으로
> 포함**시켜서 내장 변수와 함수를 쓸 수 있게 해준다.

> `CGPROGRAM`을 쓰는 셰이더는 **키워드를 `HLSLPROGRAM`으로 바꾸면 동작하지
> 않을 수 있다.**

옛 예제가 안 도는 이유가 키워드 자체가 아니라 **키워드가 뒤에 끌고 오던
것들**이라는 뜻이다. `CGPROGRAM`을 `HLSLPROGRAM`으로 바꾸면 자동 인클루드가
사라지니, 필요한 `#include`를 손으로 적어줘야 한다. 앞 글의 그 줄은
고쳐놓겠다.

## 13개가 다 빌트인 전용이다

목록은 이렇다. 위에서 아래로 갈수록 파이프라인에 의존하는 정도가 커진다.

| # | 예제 | 무엇을 하나 |
|---|---|---|
| 1 | Single color | 단색 출력 |
| 2 | Checkerboard pattern | 체커보드 패턴 |
| 3 | Simple unlit | 조명 없는 텍스처 |
| 4 | Mesh normals | 노멀을 색으로 |
| 5 | Reflections | 하늘 반사 |
| 6 | Normal map texture | 텍스처로 반사 |
| 7 | Tri-planar texturing | 세 축 투영 |
| 8 | Simple diffuse lighting | 단순 디퓨즈 라이팅 |
| 9 | Ambient light | 앰비언트 |
| 10 | Shadow casting | 그림자 드리우기 |
| 11 | Receiving shadows | 그림자 받기 |
| 12 | Fog | 포그 |
| 13 | Visualizing vertex data | 정점 데이터 시각화 |

페이지 첫 문장이 범위를 못 박는다.

> 이 섹션은 **빌트인 렌더 파이프라인과 호환되는** 손으로 작성한 커스텀 셰이더의
> 예제 소스 코드를 담고 있다.

그러니 URP 프로젝트에서 이걸 열었다면, 읽을 수는 있어도 **붙여넣을 수는
없다.** 어디까지 붙고 어디부터 안 붙는지가 아래다.

## 위쪽 절반 — 치환으로 끝난다

1~4번과 13번은 **좌표 변환과 텍스처 샘플링밖에 안 한다.** 파이프라인이 제공하는
건 행렬뿐이라 이름만 바꾸면 된다.

| 빌트인이 쓰는 것 | URP 대응 |
|---|---|
| `appdata_base` | 직접 선언한 `Attributes` 구조체 |
| `UnityObjectToClipPos(v.vertex)` | `TransformObjectToHClip(IN.positionOS.xyz)` |
| `UnityObjectToWorldNormal(v.normal)` | `GetVertexNormalInputs(IN.normalOS).normalWS` |
| `sampler2D _MainTex;` + `tex2D(...)` | `TEXTURE2D`·`SAMPLER` + `SAMPLE_TEXTURE2D(...)` |
| `fixed4` | `half4` |
| `#include "UnityCG.cginc"` | `#include ".../ShaderLibrary/Core.hlsl"` |

거기에 **`RenderPipeline` 태그를 추가**하면 끝이다.

`appdata_base`가 URP에 없다는 게 처음엔 불편한데, 실은 이쪽이 낫다. 빌트인
예제의 언릿 셰이더는 `appdata_base`를 받으면서 `texcoord`만 쓰는데, 구조체에는
노멀과 다른 UV도 들어 있다. **직접 선언하면 쓰는 것만 넘긴다.**

`fixed`는 옛 저정밀도 타입이다. 최적화 문서가 **월드 좌표와 텍스처 좌표를 뺀
모든 변수에 `half`** 를 쓰라고 하니, 옮기면서 `half`로 바꾸면 된다.

## 라이팅부터가 재작성이다

8번부터 성격이 바뀐다. **파이프라인이 넘겨주는 데이터**를 쓰기 시작하기
때문이다. 빌트인 디퓨즈 예제를 보자.

```hlsl
Pass
{
    Tags {"LightMode"="ForwardBase"}

    HLSLPROGRAM
    #pragma vertex vert
    #pragma fragment frag
    #include "UnityCG.cginc"
    #include "UnityLightingCommon.cginc"
    ...
    half3 worldNormal = UnityObjectToWorldNormal(v.normal);
    half nl = max(0, dot(worldNormal, _WorldSpaceLightPos0.xyz));
    o.diff = nl * _LightColor0;
```

URP에는 **`_WorldSpaceLightPos0`도 `_LightColor0`도 없다.** `ForwardBase`라는
`LightMode`도 URP의 패스 태그가 아니다. 대응을 놓으면 이렇다.

| 빌트인 | URP |
|---|---|
| `Tags {"LightMode"="ForwardBase"}` | `Tags {"LightMode"="UniversalForward"}` |
| `#include "UnityLightingCommon.cginc"` | `#include ".../ShaderLibrary/Lighting.hlsl"` |
| `_WorldSpaceLightPos0.xyz` | `GetMainLight().direction` |
| `_LightColor0` | `GetMainLight().color` |
| `nl * _LightColor0` 직접 계산 | `LightingLambert(lightColor, lightDir, normalWS)` |
| `ShadeSH9(half4(worldNormal,1))` | `SampleSH(normalWS)` |
| `UNITY_SAMPLE_TEXCUBE(unity_SpecCube0, ...)` + `DecodeHDR(...)` | `GlossyEnvironmentReflection(...)` |

URP 문서의 서술을 그대로 옮기면, `GetMainLight()`는 **"씬의 메인 라이트를
반환"** 하고 `LightingLambert`는 **"램버트 모델로 계산한 표면 노멀의 디퓨즈
라이팅을 반환"** 한다. 즉 **변수를 읽어 직접 계산하던 것이, 함수를 호출해
받는 것으로 바뀐다.**

이게 단순 치환이 아닌 이유는 **구조가 다르기 때문**이다. 빌트인은 전역 변수
몇 개를 노출하고 계산은 셰이더에 맡긴다. URP는 라이트를 `Light` 구조체로
싸서 함수로 준다. 줄 단위로 대응시킬 수는 없고, 계산 자체를 다시 짜야 한다.

반사도 마찬가지다. 빌트인 예제는 큐브맵을 직접 샘플링하고 HDR 디코드까지
손으로 한다. URP의 `GlossyEnvironmentReflection`은 **"오브젝트가 리플렉션
프로브 볼륨 안에 있으면 프로브를, 아니면 스카이박스를 샘플링"** 하고 프로브
블렌딩까지 처리한다. 한 함수가 예제 전체를 대신한다.

## 그림자와 포그 — 매크로가 통째로 다르다

10~12번이 가장 안 넘어온다. **매크로 이름이 아예 다른 세계**다.

빌트인의 그림자 캐스터 패스가 이렇다.

```hlsl
Pass
{
    Tags {"LightMode"="ShadowCaster"}

    HLSLPROGRAM
    #pragma vertex vert
    #pragma fragment frag
    #pragma multi_compile_shadowcaster
    #include "UnityCG.cginc"

    struct v2f {
        V2F_SHADOW_CASTER;
    };

    v2f vert(appdata_base v)
    {
        v2f o;
        TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
        return o;
    }

    float4 frag(v2f i) : SV_Target
    {
        SHADOW_CASTER_FRAGMENT(i)
    }
    ENDHLSL
}
```

`V2F_SHADOW_CASTER`, `TRANSFER_SHADOW_CASTER_NORMALOFFSET`,
`SHADOW_CASTER_FRAGMENT` — 셋 다 `UnityCG.cginc`의 매크로다. **URP에는
없다.** URP에서는 `LightMode`가 `"ShadowCaster"`인 패스를 직접 쓰고,
바이어스는 `ApplyShadowBias(positionWS, normalWS, lightDirection)`로 건다.

그림자를 **받는** 쪽은 차이가 더 크다. 빌트인 예제는 `AutoLight.cginc`의
매크로 세 개 — `SHADOW_COORDS(1)`, `TRANSFER_SHADOW(o)`,
`SHADOW_ATTENUATION(i)` — 와 `#pragma multi_compile_fwdbase`를 쓴다.
URP는 함수다.

| 빌트인 | URP |
|---|---|
| `SHADOW_COORDS(1)` (구조체 멤버 선언) | `float4 shadowCoord`를 직접 선언 |
| `TRANSFER_SHADOW(o)` | `GetShadowCoord(vertexInputs)` 또는 `TransformWorldToShadowCoord(positionWS)` |
| `SHADOW_ATTENUATION(i)` | `GetMainLight(shadowCoord).shadowAttenuation` 또는 `MainLightRealtimeShadow(shadowCoord)` |
| `#pragma multi_compile_fwdbase` | `#pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN` |

포그는 사정이 조금 다르다. 빌트인 예제는 `UNITY_FOG_COORDS(1)`,
`UNITY_TRANSFER_FOG(o,o.position)`, `UNITY_APPLY_FOG(i.fogCoord, color)`와
`#pragma multi_compile_fog`를 쓴다. URP에도 대응 함수가 있기는 한데,
**URP 내장 셰이더 메서드 문서에 포그 항목이 없다.** 문서화된 분류는 좌표 변환,
카메라, 라이팅, 간접광, 그림자까지다. 포그만 목록에 없다.

실무적으로는 **패키지 소스를 직접 열어 확인해야 한다**는 뜻이다. 옮길 항목
중에 유일하게 공식 문서만으로는 대응을 못 찾는 자리다.

## 어디에 왜 쓰나

정리하면 **넘어오는 정도가 목록 순서대로 줄어든다.**

| 예제 | URP로 옮기면 |
|---|---|
| 1~4, 13 (단색·패턴·언릿·노멀·정점) | **이름 치환** |
| 5~7 (반사·노멀맵·트라이플래너) | 치환 + 반사 함수로 **묶기** |
| 8~9 (디퓨즈·앰비언트) | **재작성** |
| 10~12 (그림자·포그) | **재작성**, 포그는 문서 밖 |

### 빌트인 예제를 URP로 옮기는 절차

실제로 옮길 때는 순서를 정해두면 헤매지 않는다.

1. **`SubShader`에 `"RenderPipeline" = "UniversalPipeline"` 태그를 넣는다.**
   이게 없으면 URP가 아예 쓰지 않는다.
2. **인클루드를 바꾼다.** `UnityCG.cginc` → `Core.hlsl`. 라이팅을 쓰면
   `Lighting.hlsl`도.
3. **`appdata_*`를 직접 선언한 구조체로 바꾼다.** 쓰는 필드만 넣는다.
4. **함수 이름을 바꾼다.** `UnityObjectToClipPos` → `TransformObjectToHClip`,
   `UnityObjectToWorldNormal` → `GetVertexNormalInputs(...).normalWS`.
5. **텍스처 선언을 매크로로 바꾼다.** `sampler2D`/`tex2D` →
   `TEXTURE2D`/`SAMPLER`/`SAMPLE_TEXTURE2D`.
6. **`fixed`를 `half`로 바꾼다.**
7. **여기서 컴파일이 되면 1~7번 예제다.** 라이팅·그림자가 남았다면 치환이
   아니라 재작성이므로, 빌트인 코드를 고치는 대신 **URP 예제에서 다시 시작하는
   편이 빠르다.**

7번이 요점이다. 8번 이후를 줄 단위로 옮기려고 붙잡고 있으면 시간만 쓴다.

### 그래도 이 예제들을 읽을 이유

URP 프로젝트라도 이 페이지를 읽을 값어치는 있다. **파이프라인이 무엇을 대신
해주는지가 여기서 드러나기 때문**이다.

URP의 `GetMainLight()` 한 줄이 무엇을 감추고 있는지는, 빌트인 예제에서
`_WorldSpaceLightPos0`과 `_LightColor0`을 직접 읽어 `dot`을 때리는 코드를 보고
나면 분명해진다. `GlossyEnvironmentReflection` 한 줄도 마찬가지다 — 빌트인
예제의 `UNITY_SAMPLE_TEXCUBE` + `DecodeHDR` 두 줄이 그 안에 들어 있다.

정점이 픽셀이 되기까지 어디서 무엇이 끼어드는지는
[그래픽스 파이프라인 정리](/posts/graphics-pipeline/)에 정리해뒀고, URP 쪽에서
셰이더를 새로 쓰는 출발점은
[커스텀 셰이더 문서의 표는 목차가 아니라 분기다](/posts/unity-custom-shaders/)
쪽이다.

### 옮기지 말아야 할 것

- **서피스 셰이더.** 이 페이지의 예제는 전부 손으로 쓴 HLSL이라 해당 없지만,
  같은 빌트인 문서의 다른 구석에는 `#pragma surface`가 있다. 그건 URP에
  대응이 없다.
- **`UsePass "Legacy Shaders/VertexLit/SHADOWCASTER"`.** 그림자 받기 예제
  마지막 줄이 이것인데, 레거시 빌트인 셰이더를 이름으로 끌어다 쓰는 구문이다.
  URP에는 그 셰이더가 없다.
- **`fixed`를 그대로 둔 채 옮기는 것.** 컴파일은 될지 몰라도 최적화 문서의
  권장은 `half`다.

## 예제 안에서 표기가 갈린다

옮기려고 열세 개를 훑다 보니 예제끼리 손이 안 맞는 지점이 보였다. 같은 일을
하는 코드가 페이지마다 다르게 적혀 있다.

**클립 공간 변환이 두 가지다.**

```hlsl
// Single color 예제
return mul(UNITY_MATRIX_MVP, vertex);

// Simple diffuse lighting 예제
o.vertex = UnityObjectToClipPos(v.vertex);
```

같은 변환인데 한쪽은 행렬을 직접 곱하고 한쪽은 헬퍼 함수를 쓴다. 둘 다 현행
문서에 살아 있다.

**반사 예제에는 목록에 없는 이름이 있다.**

```hlsl
float3 worldPos = mul(_Object2World, vertex).xyz;
```

`_Object2World`인데, **현행 빌트인 셰이더 변수 레퍼런스에는 이 이름이 없다.**
그 페이지가 싣고 있는 건 `unity_ObjectToWorld`와 `unity_WorldToObject`다.
예제만 옛 이름을 쓰고 있는 셈이다.

두 경우 다 "이 예제가 틀렸다"는 말은 아니다. 지금도 컴파일은 될 것이다. 다만
**예제를 그대로 베끼면 문서의 레퍼런스 페이지와 다른 이름을 쓰게 된다.**
옮기는 김에 레퍼런스 쪽 이름으로 맞추는 게 낫다.

## 정리

- **`HLSLPROGRAM`은 모든 파이프라인에서 되고, `CGPROGRAM`이 빌트인 전용이다.**
  앞 글에 반대로 적었던 줄을 고쳤다. 실제 함정은 `CGPROGRAM`이 **인클루드를
  자동으로 끌고 온다**는 것이고, 그래서 키워드만 바꾸면 안 돌 수 있다.
- **예제 13개는 전부 빌트인 전용이다.** 페이지 첫 문장이 그렇게 적혀 있다.
- **1~4·13번은 이름 치환으로 끝난다.** `appdata_base`, `UnityObjectToClipPos`,
  `sampler2D`/`tex2D`, `fixed`를 각각 바꾸고 `RenderPipeline` 태그를 붙인다.
- **8번(라이팅)부터는 재작성이다.** 빌트인은 전역 변수를 노출하고, URP는
  `GetMainLight()`처럼 함수로 준다. 구조가 달라 줄 단위 대응이 안 된다.
- **10~12번(그림자·포그)은 매크로 체계가 통째로 다르다.** 특히 **포그는 URP
  내장 메서드 문서에 항목 자체가 없다.**
- **예제끼리 표기가 갈린다.** `UNITY_MATRIX_MVP`와 `UnityObjectToClipPos`가
  섞여 있고, 반사 예제의 `_Object2World`는 현행 변수 레퍼런스 목록에 없다.

이 열세 개를 URP용으로 바꾸려고 붙잡는 건 대체로 헛수고다. 대신
**파이프라인이 무엇을 대신 해주고 있는지**를 보여주는 자료로는 여전히 값이
있다. `GetMainLight()` 한 줄이 감추고 있는 게 여기 펼쳐져 있다.

---

### 참고

- [HLSL shader examples in the Built-in Render Pipeline — Unity 매뉴얼 6000.2](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples.html)
- [Shader code blocks in ShaderLab reference](https://docs.unity3d.com/6000.4/Documentation/Manual/shader-shaderlab-code-blocks.html)
- [Simple diffuse lighting shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-simple-diffuse-lighting.html)
- [Shadow casting shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-shadow-casting.html)
- [Receiving shadows shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-receive-shadows.html)
- [Use lighting in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-lighting.html)
- [Use shadows in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-shadows.html)
- [Use indirect lighting in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-indirect-lighting.html)
- [Built-in shader variables reference](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-UnityShaderVariables.html)

스크랩 시점은 2025년 12월이고, 원문 링크가 **6000.2로 고정**되어 있어 예제
코드는 그 버전 문서를 그대로 인용했다. ShaderLab 코드 블록 레퍼런스만 해당
버전에 페이지가 없어 6000.4를 썼다.
