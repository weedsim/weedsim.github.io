---
pubDatetime: 2026-09-10T22:30:00+09:00
title: "파도 전선이 뭔가 했더니 wavefront였다"
lang: ko
translationKey: unity-gpu-optimization-page
featured: false
draft: false
tags:
  - Unity
  - 그래픽스
  - 렌더링
  - 최적화
  - GPU
description: "Unity의 GPU 최적화 how-to 한국어 페이지를 영문 원문과 대조했다. 용어가 한 문서 안에서 갈리고, 프레임 디버거 항목은 번역이 아니라 원문이 그렇게 적혀 있다."
---

Unity에 GPU 인스턴싱이라는 기능이 있다는 걸 알게 되어 공부하려고 찾아보던
중에 Unity 공식 사이트의 "PC 및 콘솔 게임을 위한 GPU 사용 관리"
[페이지](https://unity.com/kr/how-to/gpu-optimization)를 스크랩해뒀었다.
인스턴싱이 드로우 콜 배칭 절의 한 항목으로 들어 있고, 그 옆에 오버드로우,
컬링, 동적 해상도, LOD, 웨이브프론트 점유율까지 GPU 쪽 최적화 항목이 한 장에
모여 있다.

그런데 읽다가 "**파도 전선 점유율**"에서 멈췄다. 무슨 말인가 싶어 원문을
찾아보니 **wavefront**였다. 그러고 나서 페이지 맨 위를 다시 봤더니, 문서가
이미 경고하고 있었다.

## 목차

## 페이지가 먼저 한 경고

본문 시작 전에 이런 문단이 있다.

> 이 웹페이지는 이해를 돕기 위해 **기계 번역으로 제공됩니다.** 기계 번역으로
> 제공되는 콘텐츠에 대한 정확도나 신뢰도는 보장되지 않습니다. 번역된 콘텐츠의
> 정확도에 관해 의문이 있는 경우 **웹페이지의 공식 영어 원문을 참고해 주시기
> 바랍니다.**

그래서 원문을 옆에 놓고 대조했다. 결과가 세 갈래로 갈렸다. **번역이 만든
문제**, **원문이 원래 그런 것**, 그리고 **둘 다 낡은 것**이다.

## 파도 전선, 재료, 심도

번역 쪽부터. 눈에 걸린 것들이다.

| 원문 | 이 페이지 | 통용 표기 |
| --- | --- | --- |
| wavefront | **파도 전선** / 웨이브프론트 | 웨이브프론트 |
| Material | **재료** / 재질 | 머티리얼, 재질 |
| depth of field | **심도** | 피사계 심도 |
| geometry shader | **기하학 셰이더** / 지오메트리 셰이더 | 지오메트리 셰이더 |
| async compute | **비동기 계산** / 비동기 컴퓨트 | 비동기 컴퓨트 |
| Book of the Dead | **죽은 자의 책** | Book of the Dead |

가운데 칸에 표기가 둘씩 적힌 게 핵심이다. **한 문서 안에서 갈린다.**
웨이브프론트 절만 봐도 그렇다. 헤딩은 "좋은 **웨이브프론트** 점유율을
목표로 하십시오"인데, 바로 위 이미지 캡션은 "좋은 **파도 전선** 점유율 대
나쁜 파도 전선 점유율"이다. 같은 문단 안에서도 "정점 셰이더 파도 전선"과
"낮은 웨이브프론트 점유율"이 나란히 나온다.

지오메트리 셰이더 절도 마찬가지다. 헤딩은 "**지오메트리** 셰이더를 컴퓨트
셰이더로 교체하십시오"인데 본문 첫 줄이 "**기하학** 및 정점 셰이더는"으로
시작한다.

**읽는 데 지장이 있다는 게 아니라 검색이 안 된다는 게 문제다.** "파도 전선
점유율"로는 아무것도 안 나온다. 개념을 더 파고들려면 결국 원문 단어를 알아야
하는데, 그걸 알려주지 않는 번역이다.

`Book of the Dead`는 유니티 데모 제목이라 고유명사인데 "죽은 자의 책"으로
옮겨졌다. 이것도 그 데모를 찾으려면 원제를 따로 알아내야 한다.

`depth of field`가 "심도"가 된 건 뜻까지 흐려진 경우다. 피사계 심도를 줄여
쓰는 말이긴 하지만, "블룸 및 심도와 같은 전체 화면 효과"라고만 적혀 있으면
후처리 효과 이름으로 읽히지 않는다.

## 프레임 디버거 항목은 번역 탓이 아니다

이건 처음에 오역이라고 생각했다가 원문을 보고 생각을 바꾼 항목이다.

한국어 페이지의 문장이다.

> **참고**: 프레임 디버거는 **개별 드로우 콜이나 상태 변화를 표시하지
> 않습니다.** 자세한 드로우 콜 및 타이밍 정보를 제공할 수 있는 것은 네이티브
> **GPU Profilers** 뿐이지만, 프레임 디버거는 여전히 파이프라인 문제나 배치
> 문제를 디버깅하는 데 매우 유용할 수 있습니다.

영문 원문도 똑같다.

> The Frame Debugger does not show individual draw calls or state changes.

**번역은 충실하다. 원문이 그렇게 적혀 있다.** 그런데 같은 절 두 문단 위에는
이 문장이 있다.

> 프레임 디버거의 주요 장점 중 하나는 **드로우 콜을 장면의 특정 GameObject와
> 연관시킬 수 있다는 것**입니다.

드로우 콜을 특정 오브젝트와 연관시킬 수 있다는 말과, 개별 드로우 콜을 표시하지
않는다는 말이 **같은 절 안에 나란히 있다.** 유니티 매뉴얼은 앞쪽 편이다.

> ...pause the application on a particular frame and display the **list of
> rendering events** that constitute the frame. ... **step through each event**
> and display the graphical state of the scene at that point.

프레임을 구성하는 렌더링 이벤트 목록을 보여주고 하나씩 짚어가게 해준다. 그게
프레임 디버거의 기능 설명 전부다.

의도는 짐작이 간다. 뒤 문장이 "타이밍 정보는 네이티브 GPU 프로파일러만 준다"로
이어지니, **"드로우 콜별 GPU 타이밍은 못 본다"**는 뜻이었을 것이다. 그런데
적힌 대로 읽으면 프레임 디버거를 열 이유가 없어진다. **번역을 의심하고 원문을
찾았는데 원문이 같았던 경우**라, 이번에는 원문 참조가 답이 아니었다.

## 이 페이지가 서 있는 시점

페이지에 발행일이 없다. 대신 링크가 시점을 말해준다.

- SRP 배처 설명이 `blogs.unity3d.com/2019/02/28/...`로 걸려 있다.
- URP 문서 링크가 `com.unity.render-pipelines.universal@10.5`, `@10.3`이다.
  URP 10.x는 Unity 2020.3 LTS 대응 버전이다.
- 일부 링크의 파라미터가 `utm_content=optimize-game-performance-2020-lts-ebook`이다.

**2020 LTS 시절 전자책을 웹 페이지로 옮긴 문서**로 보인다. 그렇게 보면
내용의 성격도 이해가 된다. 항목 하나하나는 지금도 유효한데, **Unity 6에서
생긴 것이 통째로 빠져 있다.**

## Unity 6에서 빠진 두 가지

배칭 절이 SRP 배처, GPU 인스턴싱, 스태틱 배칭, 다이내믹 배칭 넷을 든다. Unity
6에는 이 위에 한 층이 더 있다.

| 기능 | 하는 일 | 전제 |
| --- | --- | --- |
| GPU Resident Drawer | `BatchRendererGroup`으로 자동 GPU 인스턴싱 | Forward+, SRP Batcher 켜짐, 컴퓨트 셰이더 지원 API |
| GPU Occlusion Culling | 컬링을 CPU 대신 GPU에서 | Render Graph, GPU Resident Drawer |

**GPU Resident Drawer**는 매뉴얼 표현으로 "automatically uses the
`BatchRendererGroup` API to draw GameObjects with GPU instancing, which reduces
the number of draw calls and frees CPU processing time"이다. 머티리얼마다
Enable Instancing을 체크하는 절차 없이 엔진이 알아서 묶는다. 켜는 순서는
Project Settings에서 BatchRendererGroup Variants를 Keep All로, URP 애셋에서
SRP Batcher를 켜고, GPU Resident Drawer를 Instanced Drawing으로, 렌더러의
Rendering Path를 Forward+로 두는 것이다. 빌드 시간이 늘어난다는 단서도
매뉴얼에 있다.

이 이야기는 [GPU 인스턴싱 셰이더 글](/posts/gpu-instancing-shader/)에서 따로
정리했다.

**GPU 오클루전 컬링**은 페이지의 서술을 정면으로 보완한다. 페이지는 오클루전
컬링을 "**베이킹된 프로세스**"라고 못 박고, 빌드 중에 데이터를 굽고 씬 로드
때 디스크에서 RAM으로 올린다고 설명한다. Unity 6 쪽은 이렇다.

> GPU occlusion culling means Unity uses the **GPU instead of the CPU** to
> exclude objects from camera rendering when they're occluded behind other
> objects.

베이킹 데이터가 아니라 현재·직전 프레임의 깊이 텍스처를 쓴다. 바운딩 구
근사와 다운샘플된 깊이 버퍼로 판정하므로 **가늘고 긴 물체는 가려진 것으로
잡히기 어렵고**, 가릴 게 별로 없는 씬에서는 셋업 비용 때문에 오히려 느려질 수
있다는 것까지 매뉴얼에 적혀 있다. 페이지의 "GPU에서 CPU로 작업을 옮기는 게
실제로 유익한지 프로파일러로 확인하라"는 조언이, Unity 6에서는 **반대 방향의
선택지까지 포함하는 문제**가 된 셈이다.

## 그래도 그대로인 것

낡은 건 위의 두 층이고, 항목 자체는 대부분 지금도 맞는다. 특히 이 하나는
지금도 자주 걸리는 함정이다.

```csharp
// 배치를 깨뜨린다 — 머티리얼이 복제되고 사본 참조가 돌아온다
var mat = _renderer.material;

// 공유 머티리얼을 읽는다 — 배치를 유지한다
var sharedMat = _renderer.sharedMaterial;
```

`Renderer.material`에 접근하는 순간 머티리얼이 복제되고, 그 오브젝트가 속해
있던 배치가 깨진다. 스크립트에서 색만 바꾸려다 배칭이 통째로 무너지는 경우가
여기서 나온다.

다이내믹 배칭의 기준도 그대로다 — **정점 300개 이하, 정점 속성 총 900개
이하**의 저폴리 메시가 충분히 있는 게 아니라면 켜지 말라는 것. 원문의
표현도 "Do *not* use this unless..."로 부정형이 먼저다.

`Camera.layerCullDistances`로 레이어별 컬링 거리를 두는 방법, 레이어 컬링이
프러스텀 컬링보다 먼저 돈다는 순서, 카메라 하나당 렌더링을 안 해도 CPU 시간을
쓴다는 지적, 동적 해상도와 LOD, 후처리를 프레임 예산의 고정 지분으로 잡으라는
조언 — 전부 유효하다.

## 정리

- 이 페이지는 **기계 번역이라고 스스로 밝히고 원문 참조를 권한다.** 실제로
  대조할 값이 있었다.
- **용어가 한 문서 안에서 갈린다.** wavefront가 "파도 전선"과 "웨이브프론트"로,
  Material이 "재료"와 "재질"로, geometry shader가 "기하학"과 "지오메트리"로.
  읽기보다 **검색이 막히는 게 문제다.**
- **프레임 디버거 항목은 번역 탓이 아니다.** 영문 원문이 "does not show
  individual draw calls"라고 적었고, **같은 절 두 문단 위와 유니티 매뉴얼이 둘
  다 반대**다.
- 링크의 URP 10.x, 2019년 블로그, `2020-lts-ebook` 파라미터가 **이 문서가 서
  있는 시점**을 말해준다.
- **Unity 6의 GPU Resident Drawer와 GPU 오클루전 컬링이 통째로 빠져 있다.**
  특히 오클루전 컬링을 "베이킹된 프로세스"로만 설명하는 부분은 지금 기준으로
  절반이다.
- **`Renderer.material` 대신 `sharedMaterial`**, 다이내믹 배칭 300/900,
  레이어별 컬링 거리, 동적 해상도, LOD는 그대로 유효하다.

기계 번역이라고 밝힌 문서를 볼 때 **원문을 옆에 두는 건 확실히 남는다.** 다만
이번에 배운 건 그 반대쪽이다. 가장 이상했던 문장이 원문에도 그대로 있었다.
**번역을 의심하는 것과 내용을 의심하는 것은 따로 해야 한다.** 앞엣것은
원문으로 풀리고, 뒤엣것은 매뉴얼로 풀린다.

GPU 인스턴싱을 배우러 와서 얻은 것도 그 결이다. 이 페이지가 알려주는 인스턴싱은
**머티리얼에서 Enable Instancing을 체크하는 데까지**이고, 그건 지금도 맞다.
다만 **그 위에 한 층이 더 생겼다는 건 여기에 없다.** 기능 하나를 공부하려고
개요 페이지를 여는 건 좋은 출발인데, **어느 시점의 개요인지**는 따로 확인해야
했다.

## 참고

- [PC 및 콘솔 게임을 위한 GPU 사용 관리 — Unity](https://unity.com/kr/how-to/gpu-optimization)
- [Manage GPU usage for PC and console games — Unity (원문)](https://unity.com/how-to/gpu-optimization)
- [Frame Debugger — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/FrameDebugger.html)
- [Enable the GPU Resident Drawer in URP — Unity 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-resident-drawer.html)
- [Enable GPU occlusion culling in URP — Unity 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-culling.html)
- [GPU 인스턴싱을 지원하는 셰이더 만들기](/posts/gpu-instancing-shader/)
