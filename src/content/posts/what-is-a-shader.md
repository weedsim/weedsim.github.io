---
pubDatetime: 2026-10-03T17:20:00+09:00
title: "정의가 설명한 건 셰이더가 아니라 픽셀 셰이더다"
lang: ko
translationKey: what-is-a-shader
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - 그래픽스
  - GPU
  - 렌더링
description: "셰이더가 무엇인지 정리한 2024년 글이다. 표기법 논증은 출처까지 들고 와서 정확한데, 정의 한 문장이 두 절 뒤의 구조 설명과 충돌한다. 거기 적힌 건 셰이더가 아니라 픽셀 셰이더다."
---

**툰 셰이더를 적용하다가** 스크랩한 글이다. [lilToon 파라미터를 정리한
글](/posts/liltoon-parameters/)에서 인스펙터 항목을 하나씩 대조했는데, 그걸
만지는 동안 **"셰이더가 정확히 무엇인가"**가 계속 뒤에 남아 있었다. 파라미터를
아는 것과 그 값이 어디로 들어가는지를 아는 건 다른 일이다.

원문은 2024년 글이고, 정의·표기·구조·머티리얼 네 절로 짧게 묶었다.

**이 글은 다른 클리핑들과 결이 다르다.** 표기 문제를 짚으면서 국립국어원의
외래어 표기법을 직접 인용하고, 머티리얼 설명에 Unity 공식 문서를 걸어둔다.
출처를 들고 오는 글이다.

그래서 걸리는 데가 적다. 그런데 **정의 한 문장이 두 절 뒤와 충돌한다.**

> **셰이더(Shader)** 는 컴퓨터 그래픽스 분야에서 **화면에 출력되는 색상, 명암,
> 조명 효과 등을 정의하고 처리하는 프로그램** 입니다.

> 셰이더는 크게 **버텍스 셰이더(Vertex Shader)** 와 **픽셀 셰이더(Pixel
> Shader)** 라는 두 가지 부분으로 구성되어 있습니다.

둘을 이어 읽으면 **버텍스 셰이더가 색상과 조명을 처리한다**는 말이 된다. 안
한다. 정의가 설명한 건 뒤쪽 하나뿐이다.

## 목차

## 표기 논증은 정확하다

먼저 잘 된 쪽부터. 이 글의 제목이기도 한 표기 문제다.

> 국립국어원에서 제시한 **한국어의 외래어 표기법** 에 따르면 **어말의 \[ʃ\]는
> '시'로 적고, 자음 앞의 \[ʃ\]는 '슈'로, 모음 앞의 \[ʃ\]는 뒤따르는 모음에 따라
> '샤', '섀', '셔', '셰', '쇼', '슈', '시'** 로 적어야 하기 때문에 **셰이더** 가
> 올바른 표기 방식입니다.

규정을 찾아보면 그대로다. 국립국어원이 같은 질문에 답할 때 인용하는 문장이
이것이다.

> 어말의 \[ʃ\]는 '시'로 적고 (예: flash → 플래시)
>
> 자음 앞의 \[ʃ\]는 '슈'로 (예: shrub → 슈러브)
>
> 모음 앞의 \[ʃ\]는 뒤따르는 모음에 따라 '샤', '섀', '셔', '셰', '쇼', '슈',
> '시'로 적는다 (예: shark → 샤크, shopping → 쇼핑)

`shader`는 `/ˈʃeɪdər/`다. \[ʃ\]가 **모음 앞**에 있고 뒤따르는 모음이
\[eɪ\]이므로, 세 번째 줄의 목록에서 '셰'가 걸린다. '셰' + '이' = **셰이**.

같은 규칙으로 나온 다른 단어들을 나란히 놓으면 일관성이 보인다.

| 영어 | \[ʃ\]의 위치 | 표기 |
| --- | --- | --- |
| flash | 어말 | 플래시 |
| shrub | 자음 앞 | 슈러브 |
| shark | 모음 앞 \[ɑː\] | 샤크 |
| shopping | 모음 앞 \[ɒ\] | 쇼핑 |
| shake | 모음 앞 \[eɪ\] | 셰이크 |
| **shader** | 모음 앞 \[eɪ\] | **셰이더** |

밀크셰이크를 '밀크쉐이크'라고 쓰지 않는 것과 같은 이유다. `shake`와 `shader`는
첫 음절이 같다.

그리고 글이 규정만 들고 끝내지 않는다. **공식 문서와 출간 서적이 어느 쪽으로
굳고 있는지까지 확인한다.** 규범과 실제 용례를 같이 보는 건 이런 글에서 드문
미덕이다.

## 머티리얼은 셰이더와 "비슷한 이유"가 아니다

머티리얼 절의 괄호 한 줄이다.

> (Material도 머티리얼, 메터리얼 등 표기 방식이 혼용되고 있지만 **셰이더와
> 비슷한 이유로** 머티리얼이라고 표기하겠습니다)

**비슷한 이유가 아니다.** 셰이더가 '셰이더'인 이유는 \[ʃ\] 규정이고,
`material`에는 **\[ʃ\] 소리가 없다.** `/məˈtɪəriəl/`이다. 앞 절에서 인용한 그
규정은 이 단어에 적용될 자리가 없다.

`material`의 표기가 갈리는 지점은 다른 데다. 첫 음절이 \[mə\]인데, 혼용되는
'메터리얼'은 **발음이 아니라 철자(`ma-te-`)를 읽은 결과**다. 외래어 표기법은
철자가 아니라 **발음을 기준으로** 적는 체계이므로, 둘이 갈리는 이유가 \[ʃ\]와는
무관하다.

| | 셰이더 vs 쉐이더 | 머티리얼 vs 메터리얼 |
| --- | --- | --- |
| 갈리는 소리 | \[ʃ\] | \[ə\] |
| 적용되는 규정 | 마찰음 \[ʃ\] 항목 | 모음 표기 |
| 혼용의 원인 | '쉐'라는 관습 표기 | 철자를 읽은 결과 |

결론은 같다 — **머티리얼이 맞다.** 다만 **같은 근거로 맞는 게 아니다.** 앞
절에서 규정을 정확히 인용한 글이라서, 이 괄호가 그 정확함에 기대 넘어간 자리로
읽힌다. 표기법 용례집에 `머티리얼`이 등재되어 있는지까지는 확인하지 못했다.

## 정의가 설명한 건 픽셀 셰이더다

도입부의 그 충돌이다. 정의 절과 구조 절을 다시 놓는다.

> 셰이더(Shader)는 ... **화면에 출력되는 색상, 명암, 조명 효과 등을 정의하고
> 처리하는 프로그램**입니다. 화면의 각 픽셀에 어떤 값을 부여할지 결정하고 ...

> 셰이더는 크게 **버텍스 셰이더**와 **픽셀 셰이더**라는 두 가지 부분으로
> 구성되어 있습니다.

정의가 "화면의 각 픽셀에 어떤 값을 부여할지 결정"이라고 적었는데, 두 절 뒤의
버텍스 셰이더 설명은 이렇다.

> **정점 위치를 계산하고 각 정점에 상응하는 텍스처 좌표를 전달**

**색도 명암도 조명도 없다.** 위치와 좌표다. 정의가 설명한 건 둘 중 뒤쪽 하나다.

Unity의 현행 문서는 범위를 훨씬 좁은 한 문장으로 잡는다.

> **A program that runs on the GPU**

이게 전부다. 무엇을 계산하는지는 정의에 들어가지 않는다. 그 자리에 들어가는 건
**어느 단계에서 도는지**이고, 단계마다 하는 일이 다르다.

| 셰이더 | 받는 것 | 내놓는 것 |
| --- | --- | --- |
| 버텍스 | 정점 하나 | 변환된 위치 + 보간할 속성 |
| 프래그먼트 / 픽셀 | 보간된 속성 | 색 후보 하나 |
| 컴퓨트 | 임의의 버퍼 | 임의의 버퍼 |

마지막 줄이 정의를 가장 분명하게 깨뜨린다. **컴퓨트 셰이더는 화면에 아무것도
출력하지 않는다.** 글은 컴퓨트 셰이더를 "심화 과정은 나중에" 하고 넘기는데,
그 하나가 "화면에 출력되는 색상을 처리하는 프로그램"이라는 정의의 반례다.

"두 가지 부분으로 구성"이라는 표현도 Unity 쪽 용어로는 어긋난다. 문서는 셰이더
오브젝트를 **담는 그릇**으로 설명한다.

> A Shader object is a Unity-specific way of working with shader programs; **it is
> a wrapper for shader programs** and other information.

> **It lets you define multiple shader programs in the same file**, and tell Unity
> how to use them.

"둘로 구성된 하나"가 아니라 **"여럿을 담는 하나"**다. 그래서 Pass가 여러 개일 수
있고, SubShader가 하드웨어별로 갈릴 수 있다.

> SubShaders let you separate your Shader object into parts that are compatible
> with different hardware, render pipelines, and runtime settings.

픽셀과 프래그먼트를 같은 말로 쓴 것도 한 겹 더 들어갈 자리인데,
[그래픽스 파이프라인을 정리한 글](/posts/graphics-pipeline/)에서 이미 봤다 —
프래그먼트는 픽셀 후보이고, 한 픽셀 자리에 여러 프래그먼트가 생긴다. 그래서
"각 픽셀의 최종 색상을 계산"이 아니라 **색 후보를 내놓고, 최종 픽셀은 다음
단계가 정한다.**

## 포스트 프로세스에도 버텍스 셰이더가 있다

픽셀 셰이더 절의 마지막 문장이다.

> **버텍스 셰이더와는 다르게**, 색상 값으로 계산하기 때문에 포스트 프로세스
> 효과와 2D 환경에서도 사용됩니다.

"버텍스 셰이더와는 다르게"가 틀렸다. **포스트 프로세스에도 2D에도 버텍스
셰이더가 있다.** 없을 수가 없다.

Vulkan 명세의 유효성 규칙이 그걸 못 박는다.

> If the pipeline requires pre-rasterization shader state the `stage` member of
> one element of `pStages` **must** be `VK_SHADER_STAGE_VERTEX_BIT` or
> `VK_SHADER_STAGE_MESH_BIT_EXT`

래스터라이즈를 하는 파이프라인은 **버텍스 셰이더나 메시 셰이더 중 하나를 반드시
가져야 한다.** 둘 다 없는 그래픽스 파이프라인은 만들 수 없다.
(메시 셰이더 쪽은 [앞선 글](/posts/graphics-pipeline/)에서 본 그 새 경로다.)

그러면 포스트 프로세스의 버텍스 셰이더는 무엇을 하나. **화면을 덮는 삼각형
하나(또는 사각형)의 정점 넷 이하를 변환한다.** 하는 일이 거의 없어서 눈에 안
띄는 것이고, 없는 게 아니다.

2D도 같다. 스프라이트는 사각형이고, 사각형은 정점 네 개다. 그 네 개가 화면
좌표로 가는 변환을 누군가 해야 한다.

| | 정점 수 | 버텍스 셰이더가 하는 일 |
| --- | --- | --- |
| 3D 캐릭터 | 수만 개 | 스키닝, 변환, 법선 전달 |
| 2D 스프라이트 | 4 | 변환, UV 전달 |
| 포스트 프로세스 | 3~4 | 전체 화면 좌표 생성 |

글이 말하려던 건 아마 **"픽셀 셰이더가 작업의 중심이 되는 경우"**일 것이다. 그건
맞다. 포스트 프로세스 셰이더를 쓸 때 손대는 건 거의 프래그먼트 쪽이다. 그런데
"버텍스 셰이더와는 다르게"로 쓰면 **없다는 말로 읽힌다.** 그리고 그렇게 알고
있으면, 셰이더 그래프나 HLSL로 포스트 프로세스 셰이더를 짤 때 `Vert` 함수가
왜 거기 있는지 설명이 안 된다.

## 인용한 Unity 문서가 4.6판이다

머티리얼 절이 Unity 공식 문서를 인용한다. **출처를 걸어둔 게 이 글의 장점인데,
그 링크가 가리키는 판이 문제다.**

> `https://docs.unity3d.com/460/Documentation/Manual/Materials.html`

주소의 `460`이 **Unity 4.6**이다. 2014년 판이고, 2024년 글이 인용한 것이다.
그 페이지의 문장은 이렇다.

> There is a close relationship between Materials and Shaders in Unity.
> **Shaders contain code that defines what kind of properties and assets to use.
> Materials allow you to adjust properties and assign assets.**

> A Shader is implemented through a Material

글이 옮긴 "셰이더는 사용할 속성과 종류를 정의하는 코드를 포함합니다 / 머티리얼은
이러한 속성을 조정하고 텍스처, 색상 등을 할당할 수 있도록 해줍니다"가 이
문장이다. **번역은 정확하다.** 다만 현행 문서는 선을 다르게 긋는다.

> **Material** — An asset that defines how a surface should be rendered.

> **A material contains a reference to a Shader object.** If that Shader object
> defines material properties, then the material can also contain data such as
> colors or references to textures.

차이가 **방향**이다. 4.6판은 "A Shader is implemented **through** a Material" —
셰이더가 머티리얼을 통해 구현된다고 읽힌다. 현행판은 "A material **contains a
reference to** a Shader object" — 머티리얼이 셰이더를 가리킨다.

| | Unity 4.6 (글의 인용) | 현행 문서 |
| --- | --- | --- |
| 머티리얼의 정의 | 속성을 조정하게 해주는 것 | 표면을 어떻게 렌더할지 정의하는 에셋 |
| 둘의 관계 | 셰이더가 머티리얼을 통해 구현 | 머티리얼이 셰이더를 **참조** |
| 참조의 방향 | 모호 | 머티리얼 → 셰이더, 한 방향 |
| 속성 데이터 | "할당할 수 있다" | 셰이더가 속성을 정의한 경우에만 |

마지막 두 줄이 실무에서 쓰인다. **참조가 한 방향이라는 게 "셰이더 하나,
머티리얼 여럿"을 가능하게 한다.** 셰이더를 고치면 그걸 참조하는 머티리얼 전부가
바뀌고, 머티리얼을 고치면 그 하나만 바뀐다. 글의 레시피 비유가 가리키는 게
이것인데, 4.6판 문장으로는 방향이 안 보인다.

> 셰이더는 요리를 만드는 레시피이고, 머티리얼은 레시피를 실행할 때 쓰는 재료와
> 도구(텍스처, 값)를 정합니다.

비유는 좋다. 한 겹만 더하면 **레시피를 고치면 그 레시피로 만든 요리 전부가
바뀐다**는 게 따라온다.

## 어디에 왜 쓰나

### 셰이더 하나에 머티리얼 여럿

참조가 한 방향이라는 걸 실제로 쓰는 모양이다. 적의 피격 점멸을 만든다고 하자.
셰이더는 하나고 색만 다르다.

```
Assets/
  Shaders/
    Flashable.shader          ← 셰이더 하나
  Materials/
    Enemy_Grunt.mat           ← _FlashColor = 흰색
    Enemy_Archer.mat          ← _FlashColor = 노란색
    Enemy_Brute.mat           ← _FlashColor = 빨간색
```

셰이더의 점멸 로직을 고치면 **셋 다 바뀐다.** 색만 바꾸고 싶으면 머티리얼
하나만 건드린다. 문서가 적은 "A material contains a reference to a Shader
object"가 그 결과를 보증한다.

코드에서 값을 바꿀 때는 이름을 문자열로 쓰지 않는다.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class HitFlash : MonoBehaviour
{
    private const float FLASH_DURATION = 0.12f;

    // 문자열 대신 ID를 캐싱한다. 매 호출마다 해시를 다시 구하지 않는다.
    private static readonly int FLASH_AMOUNT_ID = Shader.PropertyToID("_FlashAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("피격 순간의 점멸 강도")]
    private float _flashAmount = 1f;

    private Renderer _renderer;
    private float _remaining;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();
    }

    public void Flash()
    {
        _remaining = FLASH_DURATION;
    }

    private void Update()
    {
        if (_remaining <= 0f)
        {
            return;
        }

        _remaining -= Time.deltaTime;
        float t = Mathf.Clamp01(_remaining / FLASH_DURATION);

        // Renderer.material은 이 렌더러만의 머티리얼을 만들어 쓴다. 아래 주의 참고.
        _renderer.material.SetFloat(FLASH_AMOUNT_ID, _flashAmount * t);
    }
}
```

`Shader.PropertyToID`를 쓰는 이유는 간단하다. `SetFloat("_FlashAmount", ...)`도
동작하지만, 그 문자열을 정수 ID로 바꾸는 일이 **호출마다** 일어난다. ID를
`static readonly`로 한 번 구해두면 그 일이 사라진다.

### `Renderer.material`이 머티리얼을 복제한다

위 코드에 주의가 하나 붙어 있다. `_renderer.material`을 읽는 순간 무슨 일이
일어나는지가 문서에 적혀 있다.

> Modifying `material` will change the material for this object only. If the
> material is used by any other renderers, **this will clone the shared material**
> and start using it from now on.

> This function automatically instantiates the materials and makes them unique to
> this renderer. **It is your responsibility to destroy the materials when the
> game object is being destroyed.**

**복제본이 생기고, 그걸 치우는 건 내 책임이다.** 적이 100마리면 머티리얼
100개가 생긴다. 그리고 머티리얼이 다르면 배치가 갈린다 — 점멸 하나 넣으려고
드로우 콜을 100개로 늘리는 셈이다.

[물리 재질을 다룬 글](/posts/rigidbody-physics-material/)에서 `Collider.material`
에 같은 함정이 있었다. 거기도 읽는 순간 복제된다. **Unity의 `material`
프로퍼티는 종류가 달라도 같은 성질을 갖는다.**

여기서 반사적으로 나오는 답이 `MaterialPropertyBlock`이다. 문서의 용도 설명이
딱 이 경우다.

> draw multiple objects with the same material, but slightly different
> properties. For example, if you want to slightly change the color of each mesh
> drawn.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class HitFlashNoClone : MonoBehaviour
{
    private const float FLASH_DURATION = 0.12f;

    private static readonly int FLASH_AMOUNT_ID = Shader.PropertyToID("_FlashAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f)] private float _flashAmount = 1f;

    private Renderer _renderer;
    private MaterialPropertyBlock _properties;
    private float _remaining;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();

        // 문서: 블록을 하나 만들어 재사용한다. 매번 new 하지 않는다.
        _properties = new MaterialPropertyBlock();
    }

    public void Flash()
    {
        _remaining = FLASH_DURATION;
    }

    private void Update()
    {
        if (_remaining <= 0f)
        {
            return;
        }

        _remaining -= Time.deltaTime;
        float t = Mathf.Clamp01(_remaining / FLASH_DURATION);

        _properties.SetFloat(FLASH_AMOUNT_ID, _flashAmount * t);
        _renderer.SetPropertyBlock(_properties);
    }
}
```

`material`을 한 번도 읽지 않으므로 복제가 생기지 않는다. **그런데 이 답은
파이프라인을 봐야 한다.** 같은 문서에 경고가 붙어 있다.

> this is **not compatible with SRP Batcher**. Using this in the Universal Render
> Pipeline (URP), High Definition Render Pipeline (HDRP) or a custom render
> pipeline based on the Scriptable Render Pipeline (SRP) **will likely result in a
> drop in performance.**

**URP에서는 복제를 피하려고 쓴 수단이 더 느려진다.** 그리고 이유가 SRP Batcher의
전제에 있다. 그 문서의 권고가 정반대 방향이다.

> use as few shader variants as possible. **You can still use as many different
> materials with the same shader as you want.**

> All material content now persists in GPU memory

SRP Batcher가 묶는 단위는 **머티리얼이 아니라 셰이더 배리언트**다. 그래서
**같은 셰이더를 쓰는 머티리얼이 여러 개인 건 괜찮다** — 오히려 그게 이
배처가 상정한 모양이다. 머티리얼마다의 값은 GPU 쪽 상수 버퍼에 남아 있고,
`MaterialPropertyBlock`은 그 전제를 깨뜨린다.

| 파이프라인 | 개체별 값을 주는 방법 | 피할 것 |
| --- | --- | --- |
| 빌트인 | `MaterialPropertyBlock` | `material` 복제로 머티리얼을 늘리기 |
| URP / HDRP | 머티리얼을 따로 두기 (같은 셰이더) | `MaterialPropertyBlock` |

**답이 뒤집힌다.** [렌더 파이프라인을 정리한 글](/posts/render-pipelines-overview/)
에서 빌트인이 "고르는 게 아니라 아무것도 배정하지 않았을 때 남는 것"이라고
봤는데, 그 칸이 비었는지 아닌지가 여기서 **최적화의 방향까지** 바꾼다.

URP에서 적 셋의 점멸 색을 다르게 하고 싶다면, 앞 절의 머티리얼 셋이 그대로
답이다. 복제를 피하려고 `MaterialPropertyBlock`으로 가는 게 아니라, **애초에
`material`을 읽지 않고 머티리얼을 에셋으로 셋 만들어 꽂는다.**

### 쓰지 말아야 할 자리

**정의를 "픽셀 색을 정하는 프로그램"으로 외우는 것.** 이 글의 정의가 그 모양이고,
컴퓨트 셰이더를 만나면 설명이 멈춘다. Unity 문서의 한 줄로 두는 쪽이 길게
쓸모 있다 — **"A program that runs on the GPU."** 무엇을 하는지는 **어느 단계에
꽂히는지**가 정한다.

**포스트 프로세스 셰이더에 버텍스 셰이더가 없다고 알고 있는 것.** Vulkan 명세가
금지한다. 셰이더 그래프의 전체 화면 패스나 HLSL 템플릿에 `Vert` 함수가 있는
이유가 그것이고, 거기 손댈 일이 없다는 것과 없다는 것은 다르다.

**`Renderer.material`을 읽고 해제를 잊는 것.** 문서가 "It is your
responsibility to destroy the materials"라고 적는다. 개체별 값이 필요하면
파이프라인을 먼저 본다 — 빌트인은 `MaterialPropertyBlock`, URP·HDRP는 머티리얼을
에셋으로 따로 두는 쪽이다. 전부 같은 값이면 `sharedMaterial`이다.

**셰이더 코드를 찾아 붙이기 전에 렌더 파이프라인을 확인하지 않는 것.**
[커스텀 셰이더 문서를 본 글](/posts/unity-custom-shaders/)에서 본 그
갈림이다. 인터넷의 셰이더가 컴파일조차 안 되는 이유가 대개 빌트인과 URP의
차이이고, "셰이더란 무엇인가"를 아는 것과 **내 프로젝트에서 도는 셰이더를 쓰는
것**은 다른 문제다.

## 정리

이 글은 출처를 들고 오는 글이다. 표기 논증에 국립국어원 규정을 걸고, 머티리얼
설명에 Unity 문서를 걸었다. `shader`의 \[ʃ\]가 모음 앞이라 '셰'가 되는 과정도
규정대로 맞다 — `shake`가 '셰이크'인 것과 같은 자리다.

걸리는 건 셋이다. **정의가 픽셀 셰이더만 설명한다.** "화면에 출력되는 색상,
명암, 조명"은 두 절 뒤에 나오는 버텍스 셰이더가 하는 일이 아니고, 글이 미뤄둔
컴퓨트 셰이더는 화면에 출력조차 하지 않는다. Unity 문서의 정의는
**"A program that runs on the GPU"** 한 줄이다.

**"버텍스 셰이더와는 다르게 포스트 프로세스와 2D에서 쓰인다"는 틀렸다.**
Vulkan 명세가 래스터라이즈하는 파이프라인에 버텍스 셰이더나 메시 셰이더를
**반드시** 요구한다. 포스트 프로세스의 버텍스 셰이더는 정점 셋을 변환하는
작은 일을 하고, 작다는 것과 없다는 것은 다르다.

**머티리얼 표기의 근거가 셰이더와 다르다.** `material`에는 \[ʃ\]가 없으니 앞
절의 규정이 적용될 자리가 없다. 결론은 같고 근거만 다른데, 규정을 정확히
인용한 글이라서 그 괄호가 더 눈에 띈다.

그리고 인용한 Unity 문서가 **4.6판**이다. 번역은 정확하지만 현행 문서는 선을
다르게 긋는다 — 머티리얼이 셰이더를 **참조한다**고 방향까지 적는다. 그 한
방향이 "셰이더 하나, 머티리얼 여럿"을 설명하고, 글의 레시피 비유가 가리키던
자리다.

---

### 참고

- [외래어 표기법 — 국립국어원 한국어 어문 규범](https://kornorms.korean.go.kr/regltn/regltnView.do?regltn_code=0003)
- [셰이더 오브젝트 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-objects.html)
- [머티리얼 소개 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/materials-introduction.html)
- [Renderer.material — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Renderer-material.html)
- [MaterialPropertyBlock — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MaterialPropertyBlock.html)
- [SRP Batcher — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/SRPBatcher.html)
- [VkGraphicsPipelineCreateInfo — Vulkan 명세](https://docs.vulkan.org/refpages/latest/refpages/source/VkGraphicsPipelineCreateInfo.html)
- [Materials and Shaders — Unity 4.6 매뉴얼 (글이 인용한 판)](https://docs.unity3d.com/460/Documentation/Manual/Materials.html)

이 글의 출발점이 된 자료는 [SuHong — 셰이더? 쉐이더? Shader 란 무엇인가](https://suhonglog.tistory.com/140)
(2024-11-17)이다. 표기 논증을 국립국어원 규정과 다시 맞춰보고, 정의와 구조
설명의 범위를 현행 Unity 문서와 Vulkan 명세에 대조했다.
