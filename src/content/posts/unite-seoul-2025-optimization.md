---
pubDatetime: 2026-10-06T14:30:00+09:00
title: "Unload(false)는 인스턴스를 내리지 않는다"
lang: ko
translationKey: unite-seoul-2025-optimization
featured: false
draft: false
tags:
  - Unity
  - C#
  - 최적화
  - 메모리
  - 렌더링
description: "Unite Seoul 2025 최적화 세션 필기다. 스무 항목쯤을 문서와 하나씩 대조했다. 대부분 맞는데 다섯이 걸린다. 가장 위험한 건 AssetBundle.Unload의 인자 설명이 뒤집혀 있는 쪽이다."
---

**2025 유니티 컨퍼런스에서 나온 이야기를 찾아보던 중** 스크랩한 글이다. Unite
Seoul 2025의 최적화 세션을 보면서 적은 **영상 필기**다.

이 클리핑은 지금까지 다룬 것들과 형식이 다르다. 공식 문서도 블로그 글도 아니고,
**발표를 들으면서 받아 적은 메모**다. 그래서 읽는 방법도 달라야 한다. 문장
하나하나가 완성된 설명이 아니라 **"이걸 확인해봐라"는 목록**이다. 셰이더
배리언트부터 오버드로우까지 스무 항목쯤이 들어 있다.

그래서 그렇게 읽었다. 항목을 하나씩 문서와 대조했다. **대부분 맞는다.** 받아
적은 메모치고 정확도가 높고, 심지어 Unity 공식 블로그 링크를 세 개 걸어둔다.

걸린 건 다섯이다. 그중 하나는 **방향이 반대로 적혀 있어서** 그대로 따라가면
반대 결과가 나온다.

> AssetBundle.Unload(false); 로 에셋 번들을 내리면 **관련된 인스턴스가 같이
> 내려가기 때문에** Custom AssetBundle Provider 를 만들어서 제어하는 것도
> 가능하다.

`false`를 넘기면 인스턴스가 같이 내려간다고 적혀 있다. 문서는 그 반대를 적는다.

## 목차

## `Unload(false)`는 인스턴스를 내리지 않는다

`AssetBundle.Unload(bool unloadAllLoadedObjects)`는 인자 하나로 동작이 갈린다.
문서가 두 경우를 따로 적는다.

> **false** — tracking data structures and any memory buffers holding content of
> the AssetBundle are freed, but any instances of objects loaded from the bundle
> **remain intact**.

> **true** — all objects that were loaded from the bundle are **destroyed**. If
> any GameObjects in a Scene reference the destroyed assets, these references
> become missing.

**`false`는 인스턴스를 남기고, `true`가 파괴한다.** 필기는 `false` 쪽에
파괴하는 동작을 붙여 적었다. 두 경우를 맞바꿔 쓴 것으로 보인다.

이 인자를 거꾸로 알고 있으면 증상이 두 방향으로 나온다.

| 의도 | 쓴 인자 | 실제 결과 |
| --- | --- | --- |
| 메모리를 비우려고 | `Unload(false)` | 압축 버퍼만 빠지고 **로드한 오브젝트는 그대로 남는다** |
| 참조를 유지하려고 | `Unload(true)` | 씬이 참조하던 에셋이 **Missing으로 깨진다** |

앞쪽은 "번들을 내렸는데 메모리가 안 줄어든다"가 되고, 뒤쪽은 "머티리얼이
분홍색이 됐다"가 된다. **둘 다 원인을 엉뚱한 데서 찾게 되는 증상**이라 비용이
크다.

두 경우에 공통인 것도 문서가 적어둔다.

> no more objects can be loaded from from the bundle unless it is reloaded.

(원문의 `from from`은 문서 쪽 오타다.) 어느 쪽이든 **그 번들에서 새로 로드하는
건 끝난다.** `false`가 "가볍게 내리는 것"이 아니라, 로드 경로를 닫고 압축
데이터만 회수하는 동작이다.

필기가 이 항목에 걸어둔 Unity 블로그 링크는 Addressables로 메모리를 줄이는
글이고, 거기서 다루는 `PersistentManager.Remapper`와 `SerializedFile`도 필기에
그대로 적혀 있다. 그 두 영역이 번들 개수에 따라 커진다는 설명과 **"최소한으로
필요한 번들들을 로드해야 한다"**는 결론은 맞다.
[Addressables를 다룬 글](/posts/unity-addressables/)에서 본 로드 단위 이야기와
같은 자리다.

## 0이 비활성화를 뜻하지 않는 자리 둘

필기에서 숫자 `0`을 "꺼짐"으로 읽은 데가 두 곳 있다. 둘 다 문서는 다른 뜻으로
적는다.

### 셰이더 청크 개수

Dynamic Shader Loading 항목이다.

> 기본값은 청크갯수가 0으로 설정(**비활성화**)되어 있다.
>
> 청크 갯수를 늘리고 청크 사이즈는 작은 값부터 시작해서 테스트 해보길 권장한다.

문서의 설명은 이렇다.

> Use **Default chunk count** to limit how many decompressed chunks Unity keeps
> in memory. The default is `0`, which means **there's no limit**.

스크립팅 API 쪽은 더 직접적이다.

> The default value is `0`, which means Unity **loads and decompresses all the
> chunks** into memory.

**0은 비활성화가 아니라 상한 없음이다.** 그리고 비활성화된 것이 "기능"도
아니다. 청크로 나누는 동작은 돌아가고 있고, **메모리에 몇 개까지 들고 있을지의
상한만 안 걸린 상태**다.

그래서 "청크 개수를 늘려라"는 조언도 방향이 뒤집힌다. 0에서 올리는 건 상한을
**새로 거는** 것이고, 숫자를 키우면 상한이 느슨해진다. 메모리를 줄이려면
**작은 값부터** 넣어봐야 한다 — 필기가 청크 사이즈에 대해 적은 그 조언이
개수 쪽에도 해당한다.

`0`이 "끄기"처럼 보이는데 실제로는 제한 없음인 구조는 전에도 봤다.
[Docker 자원 제한을 다룬 글](/posts/docker-resource-limits/)에서
`--memory-swap=0`이 스왑을 끄지 않고 **지정하지 않은 것으로 취급**되던 자리와
같은 모양이다. **상한 값에서 0은 보통 "없음"이고, "없음"은 "0"이 아니라
"무제한"이다.**

### 레이어별 그림자 컬링 거리

컬링 항목에 API 두 개가 이름만 적혀 있다.

> - Camera.layerCullDistances,
> - Light.layerShadowCullDistances,

둘 다 실재하는 API이고 용도도 맞다. 다만 `Light.layerShadowCullDistances`에는
문서가 조건을 세 개 달아둔다.

| 조건 | 문서 |
| --- | --- |
| 광원 종류 | "Directional lights only." |
| 배열 길이 | float 배열 **정확히 32개**를 넣어야 한다 |
| 값 0의 뜻 | 해당 레이어의 **현재 동작을 유지**한다 (끄는 게 아니다) |

여기서도 0이 "끔"이 아니다. 전체를 끄려면 `null`을 넣는다 — 문서가 그걸 32개의
0을 넣은 것과 같다고 적는다. 즉 **0은 "이 레이어는 건드리지 않음"**이다.

둘을 같이 쓸 때의 규칙도 적혀 있다. 같은 레이어에 둘 다 값이 있으면 **둘 중 더
작은 거리**가 그림자 컬링 거리가 된다. 카메라 쪽만 줄여놓고 그림자가 안 줄어든다
싶으면 이쪽을 보면 된다.

## Update When Offscreen은 기본이 꺼져 있다

스키닝 항목이다.

> Skinned Mesh Renderer > UpdateWhenOffscreen 이 **기본으로 켜져있는데**,
> 비활성화 하면 안보일때 메쉬를 업데이트 하지 않는다.

매뉴얼의 인스펙터 레퍼런스는 반대로 적는다.

> **Update When Offscreen** — Enable this option to calculate the bounding
> volume at every frame, even when the mesh is not visible by any Camera.

> The property is **disabled by default, for performance reasons.**

**기본이 꺼짐이고, 그 이유가 성능이다.** 이미 최적화된 기본값이라 끄러 갈 것이
없다.

그러면 이 칸을 **켜야 하는** 경우는 언제인가. 문서의 `Bounds` 설명이 답한다.
Unity는 메시 임포트 시점에 바운드를 미리 계산해두고, 이 옵션을 켜면 **매 프레임
다시 계산해서 그 값을 덮어쓴다.** 본이 크게 움직여서 미리 계산된 바운드를 벗어나
**보여야 할 메시가 사라지는** 증상이 있을 때 켜는 칸이다.

즉 성능 항목이 아니라 **정확도 항목**이고, 기본값이 이미 성능 쪽에 서 있다.
필기의 결론("비활성화하면 업데이트하지 않는다")은 동작 설명으로는 맞지만, **할
일이 없는 항목을 할 일로 적었다.**

### 본 수 제한은 문서가 임포트 쪽을 권한다

같은 항목의 앞 문장이다.

> Quality Settings > Skin weight or SkinnedMeshRenderer > Quality 에서 최대
> 영향을 주는 본 갯수를 제한 해서 성능을 올릴 수 있다.

경로와 효과가 맞다. 선택지도 문서와 맞는다.

| 설정 | 뜻 |
| --- | --- |
| Auto | Quality Settings > Skin Weights의 전역 제한을 쓴다 |
| 1 Bone / 2 Bones / 4 Bones | 정점당 본 수의 런타임 상한 |

빠진 건 문서가 그 바로 아래에 붙여둔 권고다.

> for performance reasons, it's better to set the number of bones that affect a
> vertex **on import**, rather than using a runtime cap.

**런타임 상한보다 임포트 설정이 먼저**라는 것이다. 런타임 캡은 이미 들어온
데이터를 매 프레임 깎는 쪽이고, 임포트 설정은 데이터 자체를 줄인다. 그리고
한 가지 더 — 정점당 **네 개를 넘는** 본 영향이 필요하면 컴포넌트에서는 지정할
수 없고 `Auto`로 두어야 한다.

## 배리언트는 2의 거듭제곱이 아니라 집합의 곱이다

셰이더 배리언트 항목의 첫 줄이다.

> 쉐이더에 키워드가 추가될 때 마다 **2의 지수형태로** 증가한다.
>
> 키워드가 켜진 쉐이더, 안켜진 쉐이더를 각각 경우의 수로 빌드를 해야되니
> 배리언트가 증가하는 것

두 번째 문장이 첫 문장의 조건을 말해준다. **켜짐/꺼짐 두 가지인 키워드**라면
2의 거듭제곱이 맞다. 문서가 적는 일반 규칙은 그보다 넓다.

> The number of shader variants that Unity compiles for a shader program is the
> **product of the keyword sets**; that is to say, Unity compiles one variant
> for every combination that includes one element from each set.

**집합의 곱**이다. 한 집합에 상호배타적인 키워드를 셋 넣으면 그 집합은 ×3(또는
암묵적 "없음"까지 ×4)이 되고, 2의 거듭제곱에서 벗어난다. 실무에서 에셋스토어
셰이더를 열었을 때 숫자가 예상보다 큰 이유가 거기 있다 — 필기가 "에셋스토어에서
구매한 쉐이더의 경우 주의할 필요가 있다"고 적은 그 자리다.

차수를 보려면 집합으로 세야 한다.

| 키워드 구성 | 배리언트 수 |
| --- | --- |
| 토글 10개 | 2¹⁰ = **1,024** |
| 3개짜리 집합 8개 | 3⁸ = **6,561** |
| 토글 4개 + 4개짜리 집합 2개 | 2⁴ × 4² = **256** |

`multi_compile`이 주 원인이라는 필기의 지적도 맞다.
[커스텀 셰이더를 다룬 글](/posts/unity-custom-shaders/)에서 `shader_feature`와
갈리는 한 문장을 봤다 — `shader_feature`는 **빌드의 머티리얼이 실제로 쓰는**
조합만 컴파일하고 나머지를 제거하지만, `multi_compile`은 쓰든 말든 컴파일한다.
**런타임에 코드로 바꿀 옵션이 아니면 `shader_feature`**가 기본값이어야 한다.

## FixedUpdate 횟수를 묶는 건 TimeStep이 아니다

필기의 진단은 정확하다.

> 기본적으로 FixedTimeUpdate는 이전 프레임에서 렉이 발생했을때 현재 프레임에서
> 보상하기 위해 여러번 발생하게 된다.

처방이 둘인데, 둘 다 에둘러 간다.

> 따라서 TimeStep을 Update와 동일하게 맞춰주거나, (기본값은 FixedTimeStep이
> 0.02라서 50프레임 기준이다) 스크립트로 수동호출하는 방식을 고려할 수 있다.

0.02초가 50Hz라는 건 맞다. 그런데 **고정 타임스텝을 가변인 `Update`에 "동일하게
맞춘다"는 것은 성립하지 않는다.** `Update`는 프레임마다 간격이 달라지고
`FixedUpdate`는 고정이다. 값을 키우면 물리 스텝이 드물어지는 효과가 있을 뿐이다.

횟수를 직접 묶는 설정이 따로 있다. `Time.maximumDeltaTime`이다.

> The maximum value of Time.deltaTime in any given frame. This is a time in
> seconds that limits the increase of Time.time between two frames.

> **Bounds the maximum number of times** Unity executes
> MonoBehaviour.FixedUpdate in a frame to `Time.maximumDeltaTime /
> Time.fixedDeltaTime`.

**한 프레임의 `FixedUpdate` 호출 수 상한이 이 둘의 비로 정해진다.** 프로젝트
세팅에서는 **Project Settings > Time > Maximum Allowed Timestep**이고, 문서는
이 칸을 "프레임 레이트가 낮을 때 최악의 경우를 제한하는 간격"이라고 설명한다.

제약도 하나 있다.

> maximumDeltaTime cannot be set lower than Time.fixedDeltaTime.

**`fixedDeltaTime`보다 작게는 못 내려간다.** 그래서 이 비의 최솟값이 1이고,
"한 프레임에 `FixedUpdate` 한 번"이 내릴 수 있는 바닥이다.

세 값의 관계를 정리하면 이렇다.

| 설정 | 인스펙터 | 바꾸면 |
| --- | --- | --- |
| `Time.fixedDeltaTime` | Fixed Timestep | 물리 스텝의 **간격**이 바뀐다 |
| `Time.maximumDeltaTime` | Maximum Allowed Timestep | 한 프레임의 **호출 수 상한**이 바뀐다 |
| `Physics.simulationMode` | Physics > Simulation Mode | **누가 호출하는지**가 바뀐다 |

필기가 점검 항목으로 적은 `FixedTimeStep`과 `Simulation Mode`는 각각 첫 줄과
셋째 줄이고, **가운데 줄이 빠져 있다.** 히칭 뒤에 물리가 몰아서 도는 증상을
직접 막는 건 가운데 줄이다.

## 레거시 Animation은 문서가 쓰지 말라고 한다

애니메이터 항목에 이런 조언이 있다.

> 애니메이터자체로도 부하가 있기 때문에 작은 클립 (애니메이션 커브가 400 이하)만
> 재생할 꺼라면 애니메이터 보다는 **레거시Animation 컴포넌트를 사용하는게
> 성능적으로 이득**이다.

성능 수치는 발표자의 측정이라 내가 검증할 수 없다. 커브 400개라는 기준도 문서에
없는 숫자다. 다만 **그 컴포넌트에 대해 문서가 하는 말은 확인할 수 있다.**

> This is the **Legacy Animation** component, which was used on GameObjects for
> animation purposes prior to the introduction of the Mecanim Animation system.

> This component is retained in Unity for **backwards compatibility**. For new
> projects, **use the Animator component**.

**문서는 새 프로젝트에서 쓰지 말라고 한다.** 발표의 조언과 문서의 안내가 정면으로
갈린다.

둘 다 틀리지 않았을 수 있다. 성능만 보면 발표가 맞고, 유지보수와 지원을 보면
문서가 맞다. 그래서 이 항목은 **"어느 쪽이 맞나"가 아니라 "무엇을 포기하는지
알고 고르라"**가 결론이다. 필기만 읽으면 뒤쪽을 모른 채 고르게 된다.

같은 항목의 다른 문장들은 문서와 충돌하지 않는다. 애니메이터가 잡 시스템으로
도는 것, 특정 이벤트가 메인 스레드로 강제하는 것, Playable로 그룹을 묶어
`Animator.Update`를 직접 돌리는 것 — 전부 실재하는 경로다.
[CrossFade를 다룬 글](/posts/animator-crossfade/)에서 본 전이 처리도 그
애니메이터 쪽 비용 안에 있다.

## 대조하고 넘어간 것들

걸리지 않은 항목이 훨씬 많다. 확인한 것들을 문서 문장과 함께 남겨둔다.

| 필기의 주장 | 확인 |
| --- | --- |
| 레이캐스트 기본 distance가 무한대 | 맞음. `maxDistance` 기본값이 `Mathf.Infinity` |
| 레이어마스크로 대상을 줄여라 | 맞음. 단 기본값은 전체가 아니라 `DefaultRaycastLayers`다 |
| `Object.InstantiateAsync`로 비동기 처리 가능 | 맞음. "the last stage involving integration and awake calls is executed on the main thread" |
| `GarbageCollector.GCMode`로 GC 비활성화 가능 | 맞음. "Continuous allocations after disabling the garbage collector will result in a continuous increase in memory usage" |
| `Object.name` 같은 복사본 반환 멤버 주의 | 맞음 |
| UI는 동적·정적 요소를 분리 | 맞음 |
| 투명 영역이 제거된 메시로 오버드로우 최적화 | 맞음 |

두 줄은 한 겹 더 붙여둘 값이 있다.

**레이어마스크의 기본값**은 "전부"가 아니다. `DefaultRaycastLayers`이고, 여기엔
빌트인 `Ignore Raycast` 레이어가 빠져 있다. 줄이라는 조언은 맞지만, 출발점이
이미 전체가 아니다. 구체적인 사용법은
[OverlapSphere를 다룬 글](/posts/physics-overlapsphere/)에 있다.

**`Object.name`** 항목은 이 블로그에서 한 번 파본 자리다.
[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 `GameObject.name`이
`[FreeFunction]` 외부 호출이라 **접근할 때마다 네이티브 문자열을 관리 측
문자열로 새로 만든다**는 것까지 확인했는데, 그게 공식 문서에는 할당으로 적혀
있지 않다. 필기가 "복사본 반환 멤버"라고 묶어둔 그 성질이다.

**GC 비활성화**는 모드가 둘이 아니라 셋이다. 필기는 `Disabled`만 언급하는데
`Manual`이 따로 있다 — 자동 호출만 끄고 수동 수집은 남긴다. 문서의 권고도
구체적이다: 수명이 긴 할당에만 쓰고, 새 콘텐츠를 로드하기 전에 되돌려 수동으로
회수하라는 것이다. 필기의 "추천하긴 어려움"보다 **조건부로 쓸 자리가 적혀 있는
쪽**이다.

IL2CPP 스트리핑 항목도 한 줄 보탤 데가 있다. 필기는 "많은 개발사들이 이 옵션을
올렸다가 실제 사용하는 코드가 삭제되버려서 사용하지 않는 경향이 있다"고 하는데,
IL2CPP에서는 **끌 수가 없다.**

| 레벨 | 문서 설명 |
| --- | --- |
| Disabled | "Unity doesn't remove any code." **Mono 전용**이고 Mono의 기본값 |
| Minimal | `UnityEngine`과 .NET 클래스 라이브러리만 훑는다. **IL2CPP의 기본값** |
| Low | 위에 더해 사용자 어셈블리도 훑되, 씬에서 참조되지 않는 경우에만 |
| Medium | 전 어셈블리를 부분적으로 훑고, 규칙을 적용해 더 많은 패턴을 제거한다 |
| High | 전 어셈블리를 광범위하게 훑는다. "prioritizes size reduction more than code stability" |

**IL2CPP의 바닥이 `Minimal`이다.** 그래서 "안 쓰는 경향"의 실제 상태는 끈 게
아니라 기본값에 머문 것이고, 필기가 권하는 `Medium`은 두 칸 위다. `link.xml`로
보존 범위를 지정하는 방법은
[Newtonsoft Json 설치를 다룬 글](/posts/unity-newtonsoft-json-install/)에서
다뤘다.

UGUI 항목의 `Canvas.cullTransparentMesh`는 이름이 조금 다르다. 실제로는
`CanvasRenderer.cullTransparentMesh`이고 — 필기도 "캔버스 렌더러에는"이라고
본문에 적어뒀다 — 설명은 이렇다.

> Indicates whether geometry emitted by this renderer can be ignored when the
> vertex color alpha is close to zero for every vertex of the mesh.

버전별 기본값 변경은 **문서에 적혀 있지 않다.** 마이그레이션한 프로젝트라면
확인해보라는 필기의 조언은 유효하지만, 근거를 문서에서 찾을 수는 없었다.

## 어디에 왜 쓰나

### 프로젝트의 실제 값을 찍어본다

이 필기의 쓸모는 항목마다 **내 프로젝트의 현재 값**을 확인하게 만드는 데 있다.
그중 숫자로 나오는 것들은 코드로 한 번에 찍을 수 있다.

```csharp
using UnityEngine;

public class OptimizationSettingsReport : MonoBehaviour
{
    private const int FIXED_UPDATE_WARN = 4;

    [Header("Report")]
    [SerializeField, Tooltip("씬 시작 시 설정값을 로그로 남긴다")]
    private bool _reportOnStart = true;

    private void Start()
    {
        if (!_reportOnStart)
        {
            return;
        }

        ReportTime();
        ReportSkinning();
    }

    private static void ReportTime()
    {
        float fixedStep = Time.fixedDeltaTime;
        float maxStep = Time.maximumDeltaTime;

        // 문서가 적은 상한 식: maximumDeltaTime / fixedDeltaTime
        int maxCalls = Mathf.FloorToInt(maxStep / fixedStep);

        Debug.Log($"fixedDeltaTime {fixedStep:F4}s ({1f / fixedStep:F0}Hz)");
        Debug.Log($"maximumDeltaTime {maxStep:F4}s");
        Debug.Log($"frame당 FixedUpdate 상한 {maxCalls}회");

        if (maxCalls >= FIXED_UPDATE_WARN)
        {
            Debug.LogWarning($"히칭 뒤 물리가 한 프레임에 최대 {maxCalls}번 몰린다");
        }
    }

    private static void ReportSkinning()
    {
        // 전역 본 수 상한. 컴포넌트의 Quality가 Auto면 이 값을 쓴다.
        Debug.Log($"QualitySettings.skinWeights {QualitySettings.skinWeights}");

        SkinnedMeshRenderer[] renderers =
            FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None);

        int offscreenUpdating = 0;

        foreach (SkinnedMeshRenderer renderer in renderers)
        {
            // 기본값은 false다. true면 누가 켠 것이다.
            if (renderer.updateWhenOffscreen)
            {
                offscreenUpdating++;
                Debug.Log($"updateWhenOffscreen on {renderer.name}", renderer);
            }
        }

        Debug.Log($"SkinnedMeshRenderer {renderers.Length}개 중 {offscreenUpdating}개가 화면 밖에서도 갱신된다");
    }
}
```

`updateWhenOffscreen`을 **세는 방향이 중요하다.** 기본값이 꺼짐이므로 켜져 있는
쪽이 예외고, 예외에는 이유가 있어야 한다. 필기대로 "기본이 켜짐"이라고 알고
있으면 전부 끄러 다니게 되는데, 실제로는 **켠 사람을 찾는 작업**이다.

`FindObjectsByType`은 Unity 6의 이름이다. 구버전의 `FindObjectsOfType`은
사용이 권장되지 않는다.

### 번들을 내리는 코드를 한 군데로 모은다

`Unload`의 인자는 거꾸로 알면 증상이 엉뚱한 데서 나온다. 호출을 흩어놓지 않고
의도가 이름에 드러나는 함수로 감싸두면, 적어도 **어느 쪽을 의도했는지 코드에
남는다.**

```csharp
using System.Collections.Generic;
using UnityEngine;

public class BundleRegistry : MonoBehaviour
{
    [Header("Logging")]
    [SerializeField, Tooltip("내릴 때 로그를 남긴다")]
    private bool _verbose = true;

    private readonly Dictionary<string, AssetBundle> _bundles =
        new Dictionary<string, AssetBundle>();

    public void Register(string key, AssetBundle bundle)
    {
        if (bundle == null || string.IsNullOrEmpty(key))
        {
            return;
        }

        _bundles[key] = bundle;
    }

    /// 압축 데이터만 회수한다. 이미 로드한 오브젝트는 그대로 살아 있다.
    /// 이 번들에서 새로 로드하는 것은 이 호출로 끝난다.
    public void ReleaseCompressedData(string key)
    {
        if (!_bundles.TryGetValue(key, out AssetBundle bundle) || bundle == null)
        {
            return;
        }

        if (_verbose)
        {
            Debug.Log($"[bundle] {key} — 압축 데이터만 해제, 인스턴스 유지");
        }

        bundle.Unload(false);
        _bundles.Remove(key);
    }

    /// 이 번들에서 로드한 오브젝트까지 파괴한다.
    /// 씬이 그 에셋을 참조하고 있으면 참조가 끊긴다.
    public void DestroyLoadedObjects(string key)
    {
        if (!_bundles.TryGetValue(key, out AssetBundle bundle) || bundle == null)
        {
            return;
        }

        if (_verbose)
        {
            Debug.LogWarning($"[bundle] {key} — 로드한 오브젝트까지 파괴한다");
        }

        bundle.Unload(true);
        _bundles.Remove(key);
    }
}
```

**함수 이름이 인자를 대신한다.** `Unload(false)`가 코드에 그대로 박혀 있으면
읽는 사람이 매번 어느 쪽인지 떠올려야 하지만, `ReleaseCompressedData`와
`DestroyLoadedObjects`는 이름이 결과를 말한다. 인자 하나로 동작이 반대가 되는
API는 이렇게 감싸두는 편이 안전하다.

### 쓰지 말아야 할 자리

- **`Unload(false)`를 "안전한 해제"로 쓰는 것.** 로드 경로가 닫히는 건 양쪽이
  같다. 메모리가 안 줄어드는 건 인스턴스가 남아서다.
- **청크 개수를 0에서 키워서 메모리를 줄이려는 것.** 0이 이미 무제한이다.
  줄이려면 작은 값을 넣는다.
- **`updateWhenOffscreen`을 끄러 다니는 것.** 기본이 꺼짐이다. 켜져 있으면
  바운드 문제 때문에 누가 켠 것일 수 있으니 이유를 먼저 본다.
- **`Light.layerShadowCullDistances`에 0을 넣어 끄려는 것.** 0은 현재 동작
  유지다. 끄려면 `null`이고, 배열은 정확히 32개여야 한다.
- **배리언트를 토글 개수로만 세는 것.** 상호배타 키워드 집합이 있으면 2의
  거듭제곱을 벗어난다.
- **`Fixed Timestep`을 올려서 히칭 뒤의 물리 몰림을 막으려는 것.** 호출 수
  상한은 `Maximum Allowed Timestep` 쪽이다.
- **필기의 수치를 그대로 인용하는 것.** 커브 400개, 스트리핑 20% 같은 숫자는
  발표자의 측정이고 문서에 없다. 내 프로젝트에서 재는 게 맞다.

## 정리

- **`AssetBundle.Unload(false)`는 인스턴스를 남긴다.** 파괴하는 쪽은 `true`다.
  필기는 두 경우를 맞바꿔 적었고, 거꾸로 알면 "메모리가 안 줄어든다"와
  "참조가 깨졌다"가 각각 다른 원인으로 보인다.
- **셰이더 청크 개수 0은 비활성화가 아니라 무제한이다.** 문서는 "there's no
  limit", API는 "loads and decompresses all the chunks"라고 적는다. 줄이려면
  작은 값을 넣는다.
- **`Light.layerShadowCullDistances`의 0도 끄는 값이 아니다.** 현재 동작
  유지이고, 끄려면 `null`이다. Directional 전용이고 배열은 32개 고정이다.
- **`Update When Offscreen`은 기본이 꺼져 있다.** 문서가 "disabled by default,
  for performance reasons"라고 적는다. 성능 항목이 아니라 바운드 정확도 항목이다.
- **본 수는 런타임 캡보다 임포트 설정이 먼저다.** 문서가 그렇게 권한다.
- **배리언트는 2의 거듭제곱이 아니라 키워드 집합의 곱이다.** 토글만 있을 때 둘이
  같아진다. 에셋스토어 셰이더에서 숫자가 커지는 이유가 거기 있다.
- **`FixedUpdate` 호출 수의 상한은 `Maximum Allowed Timestep`이다.** 고정
  타임스텝을 가변 `Update`에 맞출 수는 없다.
- **레거시 `Animation`은 문서가 새 프로젝트에 쓰지 말라고 한다.** 발표의 성능
  조언과 문서의 안내가 갈리므로, 무엇을 포기하는지 알고 고를 항목이다.
- **나머지는 대체로 맞는다.** 받아 적은 메모치고 정확도가 높고, 걸린 다섯도
  대부분 **숫자 0의 의미와 기본값**에서 나왔다.

---

### 참고

- [AssetBundle.Unload — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/AssetBundle.Unload.html)
- [Control how much memory shaders use — Unity 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/shader-memory.html) ·
  [PlayerSettings.SetDefaultShaderChunkCount](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/PlayerSettings.SetDefaultShaderChunkCount.html)
- [Skinned Mesh Renderer 컴포넌트 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-SkinnedMeshRenderer.html) ·
  [SkinnedMeshRenderer.updateWhenOffscreen](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/SkinnedMeshRenderer-updateWhenOffscreen.html)
- [Light.layerShadowCullDistances — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Light-layerShadowCullDistances.html)
- [Shader variants — Unity 매뉴얼](https://docs.unity3d.com/Manual/shader-variants.html)
- [Time.maximumDeltaTime — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Time-maximumDeltaTime.html) ·
  [Time 설정 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-TimeManager.html)
- [Legacy Animation 컴포넌트 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-Animation.html)
- [Object.InstantiateAsync — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Object.InstantiateAsync.html) ·
  [GarbageCollector.GCMode](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Scripting.GarbageCollector.GCMode.html)
- [Managed Stripping Level 설정 — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/managed-code-stripping-configure.html)
- [Physics.Raycast — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.Raycast.html) ·
  [CanvasRenderer.cullTransparentMesh](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/CanvasRenderer-cullTransparentMesh.html)

이 글의 출발점이 된 자료는
[맨텀 — \[영상 필기\]\[Unite Seoul 2025\] Unity 프로젝트 개발 시 반드시 체크해야 할 최적화 관련 기능 공유](https://mentum.tistory.com/968)
(2025-05-13)이다. 필기에 적힌 항목을 하나씩 현행 Unity 문서와 대조했고, 수치가
발표자의 측정인 항목은 검증 대상에서 제외했다. UGUI 쪽 오버드로우와 정점 비용은
[Outline 컴포넌트를 다룬 글](/posts/ugui-outline-component/)에, 레이아웃 시스템
부하는 [레이아웃 그룹을 다룬 글](/posts/ugui-layout-group/)에 있다.
