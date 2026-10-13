---
pubDatetime: 2026-10-13T14:30:00+09:00
title: "그리기 순서를 정하는 건 둘이 아니라 셋이다"
lang: ko
translationKey: sorting-layer-order
featured: false
draft: false
tags:
  - Unity
  - 2D
  - 렌더링
  - 카메라
  - C#
description: "인스펙터의 Tag와 Layer가 무엇을 하는 칸인지 찾다가 걸린 학습 일지다. Sorting Layer와 Order in Layer로 2D 그리기 순서를 설명한다. 둘 다 맞는데, 문서는 그 둘을 '더 높은 우선순위의 기준'이라 부르고 그 아래에 하나를 더 둔다. 그리고 레이어 이름을 잘못 적으면 조용히 Default로 간다."
---

시작은 조금 다른 데서였다. **인스펙터 맨 위의 `Tag`와 `Layer`가 각각 무엇을
하는 칸인지** 알아보려고 찾다가, 레이어를 설명한 글에 닿아서 스크랩해뒀다.
2D 그리기 순서를 `Sorting Layer`와 `Order in Layer` 둘로 설명한 학습 일지다.
2023년 글이고 짧다. 관찰이 정확하다 — 목록 위쪽 레이어가 먼저
그려져서 뒤에 깔리고, 같은 레이어 안에서는 `Order in Layer`가 낮을수록
뒤라는 것, 그리고 둘을 같이 쓰는 이유가 오브젝트가 수천 개로 늘었을 때의
관리라는 것까지.

틀린 데가 없다. 다만 **거기서 멈춘다.** 문서는 그 둘을 설명할 때 이런
표현을 쓴다.

> This is used for sorting Renderer components when other, higher priority,
> criterias fail to distinguish the render order.

**"더 높은 우선순위의 기준들이 순서를 가려내지 못할 때"** 쓰이는 것이 따로
있다는 뜻이다. 즉 기준이 둘이 아니고, 셋째가 있고, 그 셋째를 **고를 수
있다.** 같은 레이어에 같은 `Order in Layer`를 둔 두 스프라이트가 왜 어떤
때는 이쪽이 앞이고 어떤 때는 저쪽이 앞인지가 거기서 갈린다.

그리고 클리핑이 처음에 쓴 비유에 함정이 하나 있다.

> 포토샵의 레이어와 비슷한 개념이라고 생각하셔도 좋을 거 같아요.

이해하는 데는 좋은 비유다. 다만 유니티에는 **`Layer`라는 이름의 다른
것**이 하나 더 있고, 둘은 하는 일이 다르다.

이 블로그에 그 다른 `Layer`를 다룬 글이 있다.
[1 << -1은 에러가 아니라 31번 레이어다](/posts/overlapsphere-layermask/)다. 그
글은 **`LayerMask`로 물리 질의를 걸러내는 쪽**을 다뤘다. 이 글은 **그리기
순서를 정하는 쪽**을 본다. 이름이 비슷해서 섞이는 자리부터 짚는다.

확인한 것은 여섯 가지다. **문서가 기준을 "우선순위"로 부르고 셋째를 둔다**,
**`Layer`와 `Sorting Layer`는 문서의 정의부터 다르다**, **레이어의 `id`는
순서가 아니라고 문서가 못 박는다**, **이름을 잘못 적으면 조용히 Default로
간다**, **`Order in Layer`에는 범위가 있다**, 그리고 **여러 스프라이트로 된
캐릭터가 섞여 그려지는 문제에는 전용 컴포넌트가 있다.**

확인 시점은 **2026-10-13**이고, 기준은 Unity **6.6**이다.

## 목차

## 기준은 둘이 아니라 셋이고, 셋째는 설정이다

`Order in Layer`에 해당하는 속성의 설명이 이렇다.

> Renderer's order within a sorting layer.

**"within a sorting layer"** — 레이어 **안에서의** 순서다. 레이어가 먼저고
그 안에서 이 값이 쓰인다는 뜻이 한 구절에 들어 있다. 레이어 쪽에도 값이
있다.

> This is the relative value that indicates the sort order of this layer
> relative to the other layers.

`SortingLayer.value`다. 여기까지가 클리핑이 설명한 둘이다. 그런데 셋째
기준의 축을 정하는 속성 설명에 이 문장이 있다.

> This is used for sorting Renderer components when other, higher priority,
> criterias fail to distinguish the render order.

**"higher priority, criterias"** — 더 높은 우선순위의 기준들이 있고, 그것들이
순서를 못 가릴 때 쓰이는 기준이 따로 있다는 말이다. 그 기준이 **거리**다.
카메라 설정이 어떻게 재는지를 정한다.

> By default, perspective Cameras sort objects based on distance from Camera
> position to the object pivot; and orthographic Cameras sort based on distance
> along the view direction.

**투영 방식에 따라 기본 동작이 다르다.** 원근 카메라는 카메라 위치에서
오브젝트 피봇까지의 거리로, 직교 카메라는 시선 방향 거리로 정렬한다. 2D
프로젝트가 직교 카메라를 쓰는 것이 기본이니 **시선 방향 거리 = Z**가 셋째
기준이 된다. 같은 레이어 같은 `Order in Layer`인데 순서가 예상과 다르다면
볼 곳이 여기다.

그리고 문서가 2D에 대해 조언을 하나 적어뒀다.

> If you're making a 2D game with a perspective Camera, you might want to use
> TransparencySortMode.Orthographic sort mode so that objects are sorted based
> on distance along the Camera's view.

**원근 카메라로 2D를 만들 때는 정렬 모드를 바꾸라**는 것이다. 모드는 넷이다.

| 값 | 문서 설명 |
| --- | --- |
| Default | "Default transparency sorting mode." |
| Perspective | "Perspective transparency sorting mode." |
| Orthographic | "Orthographic transparency sorting mode." |
| CustomAxis | "Sort objects based on distance along a custom axis." |

마지막 값이 아이소메트릭 게임의 답이다. 문서가 축까지 적어준다.

> This is a useful technique in 2.5D games or isometric games where the
> SpriteRenderers need to be sorted along the vertical screen axis.

> For this specific use case, set the TransparencySortMode to
> TransparencySortMode.CustomAxis and set the axis to (0.0f, 1.0f, 0.0f).

**축을 `(0, 1, 0)`으로 두면 Y가 낮은 쪽이 앞**이 된다. 캐릭터가 아래로
내려올수록 앞에 그려지는 그 동작을, `Order in Layer`를 매 프레임 고쳐 쓰지
않고 카메라 설정 하나로 얻는다.

## 그 창에는 Layer라는 이름이 넷 중 셋에 붙어 있다

`Sorting Layer`를 찾아가면 도착하는 창이 `Tags and Layers`다. 매뉴얼이 그
창을 이렇게 소개한다.

> The Tags and Layers settings (main menu: Edit > Project Settings, then select
> the Tags and Layers category) allows you to set up Tags, Sorting Layers and
> Layers

그런데 페이지의 절은 **넷**이다 — Tags, Sorting Layers, Layers, 그리고
**Rendering Layers.** 셋에 "Layer"가 들어 있고 하는 일은 전부 다르다. 정의를
나란히 놓으면 이렇다.

| 칸 | 문서의 정의 |
| --- | --- |
| Tags | "Tags are marker values that you can use to identify objects in your project." |
| Sorting Layers | "Defines the overlay order of Sprites in the 2D system." |
| Layers | "Groups objects that share particular characteristics, primarily to restrict operations such as raycasting or rendering so they only apply to the relevant group of objects." |
| Rendering Layers | "Use Rendering Layers to configure which lights or decals affect which GameObjects." |

**`Sorting Layer`만 그리는 순서를 정한다.** `Layer`는 레이캐스트나 렌더링
같은 연산의 **대상을 제한**하고, `Rendering Layer`는 **어느 광원과 데칼이 어느
오브젝트에 영향을 주는지**를 정하며, `Tag`는 **오브젝트를 식별하는 표식**이다.
`Sorting Layer`를 바꿔도 물리 질의 결과는 그대로고, `Layer`를 바꿔도 그리는
순서는 그대로다.

`Rendering Layers`에는 조건이 붙어 있다.

> Lists the names of Rendering Layers if your project uses the Universal Render
> Pipeline (URP) or the High Definition Render Pipeline (HDRP).

> The Built-In Rendering Pipeline doesn't support Rendering Layers.

**빌트인 파이프라인에서는 그 칸이 동작하지 않는다.** 파이프라인이 에셋으로
갈리는 구조는
[렌더 파이프라인은 에셋이고, 빌트인은 그 칸이 비었을 때의 결과다](/posts/render-pipelines-overview/)에
적어뒀다.

그리고 Tag와 Layer에는 **서로 반대인 제약**이 하나씩 붙어 있다.

> You can't rename tags, but can remove them with the minus (-) button at the
> bottom-right of the list.

> You can't add more Layers but you can rename them.

**Tag는 추가할 수 있고 이름은 못 바꾼다. Layer는 이름을 바꿀 수 있고 추가는
못 한다.** 거꾸로 외우면 둘 다 막힌다. `Layer`에는 수정 자체가 막힌 칸도
있다.

> Layers marked as Builtin Layer are default layers used by Unity and can't be
> edited while layers marked as User Layer can be customized.

`Tag`를 코드에서 확인하는 함수에는 오버로드가 둘이다.

> public bool CompareTag(string tag);

> public bool CompareTag(TagHandle tag);

> This overload of the method, which takes a TagHandle, can be faster than the
> overload which takes a string, particularly if the same TagHandle can be
> reused for many calls.

**같은 태그를 여러 번 비교한다면 `TagHandle`을 재사용하는 쪽이 빠를 수 있다**고
적혀 있다. 다만 **문자열 비교가 메모리를 할당한다는 서술은 그 페이지에
없다.** 자주 돌아다니는 이야기지만 확인하지 못했으니 여기서는 문서가 적은
것까지만 적어둔다.

`Layer` 쪽을 비트 마스크로 다루는 이야기와 거기서 나오는 함정은
[1 << -1은 에러가 아니라 31번 레이어다](/posts/overlapsphere-layermask/)에
적어뒀다. 이 글에서는 그쪽을 건드리지 않는다.

## 목록의 순서가 값이고, id는 그 값이 아니다

클리핑은 목록의 위아래로 설명한다. 매뉴얼이 그 조작을 적어둔다.

> To reorder layers, drag the handle on the left-hand side of each layer item.

**드래그로 바꾼다.** 그러니 목록을 재정렬하는 것은 프로젝트 전체의 그리기
순서를 바꾸는 일이다. 레이어 하나를 중간에 끼워 넣으면 그 아래 전부가 밀린다.

코드에서 이 순서를 다룰 때 **반드시 피해야 하는 것**이 하나 있다. 문서가
`SortingLayer.id`에 직접 경고를 달아뒀다.

> This is the unique id assigned to the layer.

> It is not an ordered running value and it should not be used to compare with
> other layers to determine the sorting order.

**`id`는 순서가 아니다.** 비교에 쓰지 말라고 적혀 있다. 비교에 쓸 것이 따로
있다.

> Returns the final sorting layer value.

> To determine the sorting order between the various sorting layers, use this
> method to retrieve the final sorting value and use CompareTo to determine the
> order.

`SortingLayer.GetLayerValueFromID` · `GetLayerValueFromName`이고, 비교는
`CompareTo`로 하라고 적혀 있다. 기본 레이어에 대한 서술도 있다.

> There is always a default SortingLayer named "Default" which all sprites are
> added to initially.

> Layers can be ordered before or after the default layer.

**Default는 항상 있고, 다른 레이어를 그 앞이나 뒤에 둘 수 있다.** 즉 Default가
맨 뒤라는 보장이 없다.

## 이름을 잘못 적으면 조용히 Default로 간다

여기서 문장 셋이 맞물려 함정 하나를 만든다. 먼저 이름을 id로 바꾸는 함수다.

> Returns the id given the name.

> Will return 0 if an invalid name was given.

**잘못된 이름에 0이 돌아온다.** 예외가 아니다. 그다음 `Renderer`의 id
속성이다.

> Unique ID of the Renderer's sorting layer.

> ID of the default sorting layer is always 0.

**Default의 id가 항상 0이다.** 그리고 유효성 검사 함수는 이렇다.

> Returns true if the id provided is a valid layer id.

세 문장을 이어붙이면 결론이 나온다. 레이어 이름에 오타를 내면 `NameToID`가
0을 주고, 그 0은 **Default의 id**이며, `IsValid(0)`은 Default가 항상 있으므로
**참을 돌려준다.** 즉 **오타가 유효한 설정으로 통과한다.** 스프라이트는
의도한 레이어가 아니라 Default에 들어가고, 아무 경고도 없다.

이 결론은 세 페이지의 문장을 이어붙인 것이고, "오타는 Default로 간다"를 한
문장으로 적어둔 자리는 찾지 못했다. **확인한 것은 세 문장 각각이다.** 다만
결론이 맞다면 대책은 분명하다 — **`IsValid`로 막을 수 없으니 이름을 목록에서
찾아야 한다.** 목록은 문서가 내준다.

> Returns all the layers defined in this project.

`SortingLayer.layers`다. 아래 예제가 이 방식을 쓴다.

## Order in Layer에는 범위가 있다

클리핑은 `-2`, `-1` 같은 값을 쓴다. 음수가 되는 것은 맞고, 끝이 있다.

> The lower the number you give it, the further back the GameObject appears.

> The higher the number, the closer the GameObject looks to the Camera.

> Note: The value must be between -32768 and 32767.

**낮으면 뒤, 높으면 앞이고, 범위는 -32768에서 32767이다.** 클리핑의 "값이
낮을수록 뒤에 그려집니다"와 같은 말이다. 16비트 부호 있는 정수의 범위라,
Y 좌표에 100을 곱해서 순서로 쓰는 식의 코드는 이 끝에 닿을 수 있다. 그런
방식을 쓸 거라면 앞 절의 `CustomAxis`가 더 맞는 자리다.

문서가 쓰임새도 적어둔다.

> This is very effective when creating 2D scroller games, as you may want
> certain GameObjects on the same layer but certain parts to appear in front of
> others, for example, layering clouds and making them appear in front of the
> sky.

클리핑의 "파란 배경과 우거진 수풀" 예와 같은 구조다.

## 캐릭터가 서로 섞여 그려질 때

클리핑의 관리 이야기 — 오브젝트가 수천 개면 `Order in Layer`를 하나하나
맞추기 어렵다는 것 — 는 맞다. 그런데 레이어로 분류하는 것만으로 안 되는
경우가 하나 있고, 전용 컴포넌트가 있다.

> A common use case for having a SortingGroup is to create complex 2D
> characters that are made up of multiple SpriteRenderers.

> When several clones of such a character overlap, their individual body parts
> might not be sorted properly resulting in a visual glitch where the the body
> parts interleave.

> For example, the hands of two characters might be sorted in front of their
> bodies, where you would expect one entire character to be drawn in front of
> the other character.

**몸통과 손을 레이어로 나눠두면, 캐릭터 둘이 겹쳤을 때 A의 손이 B의 몸통
앞으로 간다.** 레이어가 캐릭터별이 아니라 부위별이기 때문이다. `SortingGroup`이
하는 일이 이렇다.

> Adding a SortingGroup component to a GameObject will ensure that all
> Renderers within the GameObject's descendants will be sorted and rendered
> together.

> The descendants of the SortingGroup are sorted using the same SortingLayer
> and Renderer.sortingOrder.

> However, they are only sorted against other descendants of the SortingGroup
> and not with any renderers outside of it.

**자손끼리만 정렬된다.** 그래서 부위 레이어를 캐릭터마다 재사용할 수 있다.

> This allows you to reuse the same SortingLayers (for example, "Hands",
> "Torso"...) to sort body parts while ensuring they never interleave with
> other clones of the character.

그룹 자신은 바깥의 다른 렌더러들과 같은 기준으로 정렬된다.

> The SortingGroups, together with other renderers, are sorted using the
> SortingLayer and Renderer.sortingOrder.

중첩도 된다.

> Additionally, they can be nested within other SortingGroups.

> This is useful if you have branches of descendants that should not be mixed
> up i.e. the "Left Hand" vs the "Right Hand" hierarchy branches.

중첩을 건너뛰는 스위치도 있다.

> Ignores any parent SortingGroup and sorts this and its descendant Renderers
> against other Renderers at the root level.

`sortAtRoot`다. 그리고 **상한이 적혀 있다.**

> The maximum number of sorting groups and renderers is 4096.

클리핑이 말한 "수천 개"가 이 숫자 근처다. 오브젝트가 그만큼 많은 프로젝트면
이 줄을 먼저 읽어두는 쪽이 낫다.

거리를 재는 **점**도 고를 수 있다.

> Determines the position of the Sprite used for sorting the Renderer.

| 값 | 문서 설명 |
| --- | --- |
| Center | "The center of the Sprite is used as the point for sorting the Renderer." |
| Pivot | "The pivot of the Sprite is used as the point for sorting the Renderer." |

`SpriteRenderer.spriteSortPoint`다. 발밑을 피봇으로 잡은 캐릭터 스프라이트라면
`Pivot`이 의도한 결과를 준다. 셋째 기준이 "거리"라는 점을 생각하면,
**무엇까지의 거리인지**를 정하는 칸이 이것이다.

## 어디에 왜 쓰나

### 동작하는 예제

레이어 이름을 **목록에서 찾아 검증하고** 순서를 범위 안으로 가두는 형태다.
앞 절에서 본 "오타가 유효하게 통과한다"를 막는 것이 이 코드의 목적이다.

```csharp file="Scripts/Rendering/SortingAssigner.cs"
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class SortingAssigner : MonoBehaviour
{
    // 문서가 적어둔 유효 범위다.
    private const int MIN_ORDER = -32768;
    private const int MAX_ORDER = 32767;

    [Header("정렬")]
    [Tooltip("Tags and Layers에 등록된 Sorting Layer 이름")]
    [SerializeField]
    private string _sortingLayerName = "Default";

    [Tooltip("같은 레이어 안에서의 순서. 낮을수록 뒤")]
    [SerializeField]
    private int _sortingOrder;

    private Renderer _renderer;

    private void Awake()
    {
        if (!TryGetComponent(out _renderer))
        {
            Debug.LogError("Renderer가 없다.", this);
        }
    }

    private void OnEnable()
    {
        Apply();
    }

    public void Apply()
    {
        if (_renderer == null)
        {
            return;
        }

        // IsValid로는 오타를 못 잡는다. NameToID가 0을 주고 0은 Default의
        // id이며 Default는 항상 유효하다. 그래서 목록에서 이름을 찾는다.
        if (!HasLayer(_sortingLayerName))
        {
            Debug.LogError(
                $"'{_sortingLayerName}' Sorting Layer가 없다. Default로 가지 "
                + "않게 여기서 멈춘다.", this);
            return;
        }

        _renderer.sortingLayerName = _sortingLayerName;
        _renderer.sortingOrder =
            Mathf.Clamp(_sortingOrder, MIN_ORDER, MAX_ORDER);
    }

    private static bool HasLayer(string layerName)
    {
        if (string.IsNullOrEmpty(layerName))
        {
            return false;
        }

        foreach (SortingLayer layer in SortingLayer.layers)
        {
            if (layer.name == layerName)
            {
                return true;
            }
        }

        return false;
    }

    // 레이어 둘의 앞뒤를 코드로 비교한다. id로 비교하면 안 된다고 문서가
    // 적어뒀고, 비교에 쓸 값과 방법까지 적어뒀다.
    public static int CompareLayers(string back, string front)
    {
        int backValue = SortingLayer.GetLayerValueFromName(back);
        int frontValue = SortingLayer.GetLayerValueFromName(front);
        return backValue.CompareTo(frontValue);
    }

    // id가 아니라 value를 봐야 한다는 것을 눈으로 확인하는 자리다.
    [ContextMenu("Sorting Layer 목록 찍기")]
    private void LogLayers()
    {
        foreach (SortingLayer layer in SortingLayer.layers)
        {
            Debug.Log($"name={layer.name} id={layer.id} value={layer.value}",
                this);
        }
    }
}
```

`_renderer`에 `?.`를 쓰지 않은 이유가 있다. `UnityEngine.Object`이고,
인스펙터에서 비워둔 참조는 **null처럼 보이지만 C#의 null이 아닌 상태**가 될
수 있다. 그래서 `== null` / `!= null` 비교를 쓴다. 순수 C# 객체라면 `?.`가
맞다.

`sortingLayerName`에 대입하는 쪽을 고른 것도 의도다. `sortingLayerID`로
넣으려면 `NameToID`를 거쳐야 하고, 그 함수가 **오타에 0을 돌려준다.** 이미
`HasLayer`로 이름을 확인했으니 이름을 그대로 넘기는 쪽이 경로가 하나 짧다.

`LogLayers`를 넣은 이유는 하나다. `id`와 `value`가 **다른 숫자**라는 것은
찍어보면 바로 보이고, 문서 문장만 읽고는 넘어가기 쉽다.

### 무엇을 고르나

| 상황 | 쓸 것 |
| --- | --- |
| 배경 · 지형 · 캐릭터처럼 묶음이 분명하다 | `Sorting Layer` |
| 같은 묶음 안에서 앞뒤 | `Order in Layer` (낮을수록 뒤) |
| 둘이 같은데 순서가 흔들린다 | 거리 — 카메라의 정렬 모드와 Z |
| 원근 카메라로 2D를 만든다 | `TransparencySortMode.Orthographic` |
| 아이소메트릭 · 2.5D에서 Y로 정렬 | `CustomAxis` + 축 `(0, 1, 0)` |
| 거리를 재는 기준점을 바꾼다 | `SpriteRenderer.spriteSortPoint` |
| 여러 스프라이트로 된 캐릭터 | `SortingGroup` |
| 부모 그룹을 무시해야 한다 | `SortingGroup.sortAtRoot` |
| 레이어 둘의 앞뒤를 코드로 비교 | `GetLayerValueFromName` + `CompareTo` |
| 레이어 이름을 코드로 검증 | `SortingLayer.layers`에서 이름 찾기 |
| 물리 질의 대상을 거른다 | `Sorting Layer`가 아니라 `Layer` |
| 오브젝트를 식별한다 | `Tag` (코드에서는 `CompareTag`) |
| 광원·데칼의 영향 범위를 가른다 | `Rendering Layer` (URP·HDRP만) |

판단 순서는 이렇게 두면 된다.

- **묶음은 레이어로, 묶음 안은 순서값으로.** 클리핑의 결론이 맞다. 수천
  개짜리 씬에서 순서값만으로 관리하는 쪽이 비효율이라는 지적도 맞다.
- **순서가 흔들리면 둘이 아니라 셋째를 보라.** 같은 레이어 같은 순서값이면
  남은 기준은 거리이고, 거리를 어떻게 재는지는 카메라 설정이다.
- **Y로 정렬하고 싶으면 매 프레임 순서값을 고치지 마라.** 문서가 `CustomAxis`
  와 축 값까지 적어뒀다.
- **코드로 레이어를 다루면 이름을 먼저 검증하라.** `IsValid`는 오타를 잡지
  못한다.

### 쓰지 말아야 할 자리

- **`SortingLayer.id`로 앞뒤를 비교하는 것.** 문서가 "It is not an ordered
  running value and it should not be used to compare"라고 적었다. 비교는
  `GetLayerValueFromName` + `CompareTo`다.
- **`IsValid`만으로 레이어 이름을 검증하는 것.** 오타는 `NameToID`에서 0이
  되고, 0은 Default의 id다. 목록에서 이름을 찾아야 한다.
- **Default가 맨 뒤라고 가정하는 것.** 문서가 "Layers can be ordered before
  or after the default layer"라고 적었다.
- **Y 좌표에 배수를 곱해 `Order in Layer`로 넣는 것.** 범위가 -32768에서
  32767이다. 큰 맵에서 끝에 닿는다. `CustomAxis`가 그 자리다.
- **`Sorting Layer`로 물리 질의를 거르려는 것.** 그쪽은 `Layer`고, 문서의
  정의가 "primarily to restrict operations such as raycasting"이다.
- **Tag를 나중에 이름만 고치려는 것.** 문서가 "You can't rename tags"라고
  적었다. 반대로 `Layer`는 "You can't add more Layers but you can rename
  them"이다.
- **빌트인 파이프라인에서 `Rendering Layer`를 쓰려는 것.** 문서가 "doesn't
  support Rendering Layers"라고 적었다.
- **부위별 레이어만으로 캐릭터를 쌓는 것.** 캐릭터 둘이 겹치면 손과 몸통이
  섞인다. `SortingGroup`이 그 문제를 위해 있다.
- **`SortingGroup`을 무제한으로 쓰는 것.** "The maximum number of sorting
  groups and renderers is 4096"이다.
- **레이어 목록을 가볍게 재정렬하는 것.** 드래그 한 번이 프로젝트 전체의
  그리기 순서를 바꾼다.

## 정리

- 클리핑의 두 기준은 **맞다.** 레이어가 묶음을, `Order in Layer`가 그 안의
  앞뒤를 정한다 — 속성 설명이 **"Renderer's order within a sorting layer"**다.
- 다만 문서는 그 둘을 **"other, higher priority, criterias"**로 부르고, 그것들이
  순서를 못 가릴 때 쓰이는 **셋째 기준**을 둔다. 그 기준이 거리다.
- 거리를 어떻게 재는지는 카메라 설정이다. **원근 카메라는 피봇까지의 거리,
  직교 카메라는 시선 방향 거리**가 기본이고, 모드가 넷이다.
- **아이소메트릭·2.5D는 `CustomAxis` + `(0.0f, 1.0f, 0.0f)`**를 문서가 직접
  권한다. `Order in Layer`를 매 프레임 고쳐 쓰는 대신이다.
- `Tags and Layers` 창의 절은 **넷**이고 그중 셋에 "Layer"가 붙어 있다.
  **`Sorting Layer`만 그리는 순서를 정한다** — `Layer`는 "restrict operations
  such as raycasting or rendering", `Rendering Layer`는 "which lights or decals
  affect which GameObjects", `Tag`는 "marker values ... to identify objects"다.
- **Tag와 Layer의 제약이 서로 반대다.** Tag는 추가 가능·이름 변경 불가,
  Layer는 이름 변경 가능·추가 불가다. `Rendering Layer`는 **빌트인
  파이프라인에서 지원되지 않는다.**
- **`SortingLayer.id`는 순서가 아니다.** 문서가 비교에 쓰지 말라고 적고,
  대신 `GetLayerValueFromName` + `CompareTo`를 준다.
- **레이어 이름 오타는 조용히 Default로 간다.** `NameToID`가 0을 주고,
  Default의 id가 0이며, `IsValid(0)`은 참이다. 세 문장을 이어붙인 결론이고
  한 문장으로 적힌 자리는 못 찾았다. 대책은 `SortingLayer.layers`에서 이름을
  찾는 것이다.
- `Order in Layer`의 범위는 **-32768에서 32767**이다. 좌표를 곱해 넣는 방식은
  이 끝에 닿는다.
- 여러 스프라이트로 된 캐릭터가 섞여 그려지는 문제에는 **`SortingGroup`**이
  있다. 자손끼리만 정렬되므로 부위 레이어를 캐릭터마다 재사용할 수 있고,
  중첩되며, **상한이 4096**이다.
- 거리를 재는 **점**도 고를 수 있다 — `spriteSortPoint`의 `Center`와 `Pivot`
  이다.

---

### 참고

- [Tags and Layers — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-TagManager.html)
- [GameObject.CompareTag — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/GameObject.CompareTag.html)
- [SortingLayer — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SortingLayer.html)
- [Renderer.sortingLayerID — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingLayerID.html)
- [Renderer.sortingLayerName — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingLayerName.html)
- [Renderer.sortingOrder — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingOrder.html)
- [SortingGroup — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rendering.SortingGroup.html)
- [SpriteRenderer.spriteSortPoint — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SpriteRenderer-spriteSortPoint.html)
- [SpriteSortPoint — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SpriteSortPoint.html)
- [Camera.transparencySortMode — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-transparencySortMode.html)
- [Camera.transparencySortAxis — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-transparencySortAxis.html)
- [TransparencySortMode — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/TransparencySortMode.html)

이 글의 출발점이 된 자료는
[유니티 학습 일지 #3 | Sorting Layer 와 Order in Layer](https://bigchoiiistudio.tistory.com/5)
(bigchoiii, 2023-04-24)이다. 두 기준의 설명과 둘을 같이 쓰는 이유는 원문을
그대로 따라가면서, 각 항목을 현행 Unity 6.6 매뉴얼과 스크립팅 레퍼런스 양쪽에
대조했다. 원문에 없는 셋째 기준과 `SortingGroup` 쪽은 스크립팅 레퍼런스에서
가져왔다. 확인 시점은 2026-10-13이다.
