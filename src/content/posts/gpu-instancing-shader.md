---
pubDatetime: 2026-09-05T14:00:00+09:00
title: "GPU 인스턴싱 셰이더: 한국어 매뉴얼의 매크로 이름에 A가 빠져 있다"
lang: ko
translationKey: gpu-instancing-shader
featured: false
draft: false
tags:
  - Unity
  - 셰이더
  - 그래픽스
  - GPU
  - 렌더링
  - 최적화
description: "커스텀 셰이더에 GPU 인스턴싱을 붙이는 Unity 2021.3 매뉴얼을 지금 기준으로 다시 봤다. 한국어 페이지에 매크로 오타가 세 군데 있고, 렌더 파이프라인 호환성 표는 그 사이에 바뀌었다."
---

게임 개발 프로젝트를 하면서 GPU 인스턴싱을 알아보다가, 커스텀 셰이더에
인스턴싱 지원을 추가하는
[Unity 매뉴얼 페이지](https://docs.unity3d.com/kr/2021.3/Manual/gpu-instancing-shader.html)를
스크랩해뒀었다. 필요한 매크로를 표로 정리하고 서피스 셰이더와
버텍스/프래그먼트 셰이더 예제를 각각 붙여둔, 레퍼런스로 쓰기 좋은 페이지다.

다만 **2021.3 한국어 문서**라는 점에서 두 가지가 걸린다. 하나는 **매크로
이름에 오타가 세 군데 있다**는 것이고 — 그대로 복붙하면 조용히 안 먹는다 —
다른 하나는 **렌더 파이프라인 호환성 표가 지금은 다르다**는 것이다.

## 목차

## GPU 인스턴싱이 줄이는 것

같은 메시를 같은 머티리얼로 여러 번 그릴 때, 오브젝트마다 드로우 콜을 하나씩
쓰는 대신 **한 번의 드로우 콜로 여러 인스턴스를 그리는** 기법이다. 나무, 풀,
탄환, 적 무리처럼 같은 것이 많이 나오는 장면에서 CPU 쪽 드로우 콜 부하가
줄어든다.

기본적으로는 **트랜스폼만** 인스턴스마다 달라진다. 색이나 다른 값을 인스턴스별로
다르게 하려면 셰이더에 **인스턴스당 프로퍼티**를 직접 추가해야 하고, 이 문서가
다루는 게 바로 그 작업이다.

## 셰이더에 필요한 매크로

문서가 정리한 흐름은 네 단계다. **선언 → 셋업 → 전달 → 접근.**

| 매크로 | 역할 |
| --- | --- |
| `#pragma multi_compile_instancing` | 인스턴싱 배리언트를 생성. 버텍스/프래그먼트 셰이더에 필요하고 서피스 셰이더에서는 선택 |
| `UNITY_VERTEX_INPUT_INSTANCE_ID` | 입출력 구조체에 인스턴스 ID를 정의 |
| `UNITY_INSTANCING_BUFFER_START/END(name)` | 인스턴스당 상수 버퍼의 시작과 끝 |
| `UNITY_DEFINE_INSTANCED_PROP(type, name)` | 버퍼 안에 인스턴스당 프로퍼티 선언 |
| `UNITY_SETUP_INSTANCE_ID(v)` | 셰이더 함수가 인스턴스 ID에 접근할 수 있게 함. 버텍스 셰이더에서는 **맨 처음에** |
| `UNITY_TRANSFER_INSTANCE_ID(v, o)` | 입력 구조체의 ID를 출력 구조체로 복사 |
| `UNITY_ACCESS_INSTANCED_PROP(name, prop)` | 인스턴스당 프로퍼티 읽기 |

여기서 문서가 짚는 중요한 구분이 하나 있다. **커스텀 셰이더는 인스턴스당
데이터가 없어도 인스턴스 ID는 필요하다.** 월드 매트릭스가 제대로 동작하려면
ID가 있어야 하기 때문이다. 서피스 셰이더는 이걸 자동으로 설정해주지만
**버텍스/프래그먼트 셰이더는 직접 `UNITY_SETUP_INSTANCE_ID`를 써야 한다.**
인스턴싱을 켰는데 오브젝트가 전부 원점에 겹쳐 보인다면 대개 이게 빠진 것이다.

## 한국어 문서의 오타 세 군데

여기가 이 글을 쓰게 된 이유다. 한국어 페이지의 매크로 설명에 이런 표기가
나온다.

> 이 매크로를 사용하려면 **INSTNCING_ON** 셰이더 키워드를 활성화하십시오.

> 이 매크로를 **UNITY_INSTNCING_BUFFER_END** 와 함께 사용하여 ...

> 이 매크로를 **UNITY_INSTNCING_BUFFER_START** 와 함께 사용하여 ...

세 군데 모두 **`INSTA` 가 아니라 `INSTN`** 이다. A가 빠졌다. 영문 문서의 같은
문장은 이렇다.

> Defines an instance ID in the vertex shader input/output structure. To use
> this macro, enable the **INSTANCING_ON** shader keyword.

> Declares the start of a per-instance constant buffer named `bufferName`. Use
> this macro with **UNITY_INSTANCING_BUFFER_END** to wrap declarations of the
> properties that you want to be unique to each instance.

버퍼 매크로 쪽은 그나마 낫다. `UNITY_INSTNCING_BUFFER_START`라고 쓰면 컴파일이
안 되니 바로 드러난다. 문제는 **키워드 쪽**이다.

```hlsl
#ifdef INSTNCING_ON
    // 이 안의 코드는 영원히 컴파일되지 않는다
    uint id = v.instanceID;
#endif
```

`#ifdef`는 정의되지 않은 이름에 대해 **에러를 내지 않고 그냥 블록을
건너뛴다.** 컴파일도 되고 경고도 없다. 인스턴스 ID를 쓰는 코드가 통째로
사라진 채 셰이더가 돌아가고, 화면에서만 결과가 이상하다. 문서를 보고 그대로
옮겨 적었다면 원인을 찾는 데 한참 걸린다.

문서 본문 코드 예제는 정상 표기이므로, **표에 적힌 이름이 아니라 예제 코드
쪽을 믿는 게 안전하다.** 영문 페이지를 같이 열어두는 편이 더 낫다.

## 호환성 표가 지금은 다르다

스크랩본의 표는 이렇다.

| 기능 | 빌트인 | URP | HDRP | 커스텀 SRP |
| --- | --- | --- | --- | --- |
| 커스텀 GPU 인스턴스화된 셰이더 | 지원 | 지원 안 함 | 지원 안 함 | 지원 안 함 |

URP에서는 아예 안 된다고 읽힌다. Unity 6 문서의 서술은 다르다.

> GPU instancing is compatible with all Unity render pipelines, with the
> following limitations

그리고 그 제약이 무엇인지 구체적으로 적는다.

> If you use the Universal Render Pipeline (URP) or High Definition Render
> Pipeline (HDRP), GPU instancing works with custom shaders only if you disable
> the Scriptable Render Pipeline (SRP) Batcher.

**"안 된다"가 아니라 "SRP Batcher를 끄면 된다"**로 바뀌었다. 문서 제목도
`Creating custom shaders that support GPU instancing in the Built-In Render
Pipeline`으로 바뀌어서, 이 페이지가 빌트인 전용이라는 게 제목에서 드러난다.

## 진짜 트레이드오프는 SRP Batcher와의 관계다

그래서 URP를 쓴다면 판단이 하나 생긴다. 스크랩본에도 이미 경고가 하나 있다.

> **중요**: MaterialPropertyBlocks는 SRP 배처 호환성을 차단합니다.

두 개를 합치면 그림이 나온다.

- **GPU 인스턴싱** — 같은 메시·같은 머티리얼을 한 드로우 콜로. 인스턴스별
  차이는 `MaterialPropertyBlock`으로 넣는다.
- **SRP Batcher** — 머티리얼이 달라도 셰이더 배리언트가 같으면 상수 버퍼를
  GPU에 유지한 채 배칭한다. 대신 `MaterialPropertyBlock`을 쓰는 순간 그
  오브젝트는 배칭에서 빠진다.

즉 인스턴스마다 색을 다르게 하려고 `MaterialPropertyBlock`을 붙이는 순간,
**SRP Batcher 쪽 이득을 포기하게 된다.** URP에서 커스텀 인스턴싱 셰이더를
쓰려면 SRP Batcher 자체를 꺼야 한다는 위 서술과 같은 이야기다.

일반적으로는 **같은 메시가 아주 많을 때만** 인스턴싱이 이기고, 그 외에는 SRP
Batcher를 켜두는 쪽이 낫다. 어느 쪽이 이기는지는 결국 프로파일러로 재야 한다.

## Unity 6에는 손으로 안 짜는 길이 있다

이 문서를 그대로 따라가기 전에 확인할 게 하나 더 있다. Unity 6의
**GPU Resident Drawer**다.

> The GPU Resident Drawer automatically uses the `BatchRendererGroup` API to
> draw GameObjects with GPU instancing, which reduces the number of draw calls
> and frees CPU processing time.

**자동으로** 인스턴싱을 적용한다. 켜는 조건은 정해져 있다.

- 렌더링 경로가 **Forward+**
- Project Settings > Graphics에서 **BatchRendererGroup Variants**를 `Keep All`로
- URP 애셋에서 **SRP Batcher 활성화**, **GPU Resident Drawer**를 `Instanced
  Drawing`으로
- 컴퓨트 셰이더를 지원하는 그래픽스 API·플랫폼(OpenGL ES 제외)

제약도 있다. **Mesh Renderer 컴포넌트가 있는 게임 오브젝트**에만 적용되고,
아니면 인스턴싱 없이 일반 렌더링으로 돌아간다. 그리고 빌드 비용이 붙는다.

> Build times are longer because Unity compiles all the `BatchRendererGroup`
> shader variants into your build.

스크립트에서 직접 그린다면 `Graphics.RenderMeshInstanced`가 인스턴싱을
지원하는 API로 문서에 명시되어 있다. 스크랩본이 언급하는
`Graphics.DrawMeshInstancedIndirect` 계열은 이름이 `RenderMesh*`로 정리된
쪽을 먼저 보는 게 맞다.

## 멀티 패스에서는 첫 패스만 인스턴싱된다

문서가 조용히 지나가지만 실무에서 바로 물리는 항목이다.

> 멀티 패스 셰이더에 두 개 이상의 패스가 있는 경우 Unity는 첫 번째 패스만
> 인스턴스화합니다.

이후 패스는 오브젝트마다 렌더링되면서 머티리얼 변경을 강제하기 때문이다.
그리고 빌트인 렌더 파이프라인 포워드 경로에서는 이게 조명과 직접 엮인다.

> 다수의 광원에 영향을 받는 오브젝트를 효율적으로 인스턴스화할 수 없습니다.
> Unity는 기본 패스에 대해서만 인스턴싱을 효과적으로 사용할 수 있으며 추가
> 패스는 그렇지 않습니다.

**광원이 여러 개 닿는 오브젝트를 인스턴싱해봐야 기대만큼 안 줄어든다**는
뜻이다. 인스턴싱을 붙였는데 드로우 콜이 생각보다 안 빠졌다면 여기부터 볼 값이
있다.

## 정리

- GPU 인스턴싱은 같은 메시·같은 머티리얼을 한 드로우 콜로 그린다. 기본으로
  달라지는 건 트랜스폼뿐이고, 색 같은 값은 인스턴스당 프로퍼티로 직접 넣어야
  한다.
- 커스텀 셰이더는 인스턴스당 데이터가 없어도 **인스턴스 ID는 필요**하다. 서피스
  셰이더는 자동, 버텍스/프래그먼트 셰이더는 `UNITY_SETUP_INSTANCE_ID`를 직접
  써야 한다.
- **한국어 매뉴얼의 매크로 이름 세 군데에 A가 빠져 있다.** `INSTNCING_ON`,
  `UNITY_INSTNCING_BUFFER_START/END`. 특히 `#ifdef INSTNCING_ON`은 에러 없이
  블록을 통째로 건너뛰므로 원인 찾기가 어렵다. 표보다 예제 코드를, 그리고 영문
  페이지를 볼 것.
- 2021.3 표의 "URP 지원 안 함"은 지금 다르다. Unity 6 문서는 **모든 파이프라인과
  호환되며, URP·HDRP에서는 SRP Batcher를 꺼야 한다**고 적는다.
- `MaterialPropertyBlock`은 SRP Batcher 호환성을 깬다. 인스턴싱과 SRP Batcher는
  같이 못 챙기는 관계이므로 프로파일러로 결정할 것.
- Unity 6이면 **GPU Resident Drawer**로 손으로 짜지 않고 갈 수 있다. Forward+와
  `BatchRendererGroup Variants: Keep All`이 조건이고, Mesh Renderer에만 적용되며
  빌드 시간이 늘어난다.
- 멀티 패스는 **첫 패스만** 인스턴싱된다. 빌트인 포워드에서 광원이 여럿 닿는
  오브젝트는 기대만큼 줄지 않는다.

## 참고

- [GPU instancing shader reference for the Built-In Render Pipeline — Unity](https://docs.unity3d.com/6000.2/Documentation/Manual/gpu-instancing-birp-shader-modifications.html)
- [Introduction to GPU instancing — Unity](https://docs.unity3d.com/6000.5/Documentation/Manual/GPUInstancing.html)
- [Creating custom shaders that support GPU instancing in the Built-In Render Pipeline — Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/gpu-instancing-shader.html)
- [Enable the GPU Resident Drawer in URP — Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-resident-drawer.html)
- 원문: [GPU 인스턴싱을 지원하는 셰이더 생성 (2021.3 한국어)](https://docs.unity3d.com/kr/2021.3/Manual/gpu-instancing-shader.html)
