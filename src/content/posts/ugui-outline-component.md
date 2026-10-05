---
pubDatetime: 2026-10-05T18:05:00+09:00
title: "아웃라인은 셰이더가 아니라 정점 복제다"
lang: ko
translationKey: ugui-outline-component
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
description: "Outline 컴포넌트 문서를 스크랩했는데 Unity 5.3판이다. 그런데 현행 문서와 글자가 거의 같다. 안 바뀐 것이고, 그래서 Use Graphic Alpha의 설명이 프로퍼티 이름과 어긋나는 것도 그대로 남아 있다."
---

**텍스트에 윤곽선을 넣는 방법을 찾던 중** 스크랩한 글이다. 앞서
[TextMeshPro 인스펙터를 정리](/posts/tmp-inspector-settings/)하면서 텍스트
디자인을 잡았고, 그다음에 걸린 게 **글자 바깥에 두꺼운 테두리를 두르는
일**이었다. 이름이 `Outline`인 컴포넌트가 Add Component 메뉴에 바로 보이니
거기서 찾기 시작했다. Unity 매뉴얼의 그 페이지가 이 클리핑이다.

결론을 먼저 적으면 **이 컴포넌트는 「두껍게」에 가장 안 맞는 쪽이다.** 왜
그런지가 이 글의 내용이 된다.

페이지가 짧다. 설명 두 문장에 프로퍼티 세 개다. 그런데 `source`에 적힌 URL이
`docs.unity3d.com/kr/530/`다. **Unity 5.3판이다 — 2015년 말에 나온 버전이다.**

보통 이쯤 되면 "지금은 다르다"가 글의 내용이 된다. 이번은 그게 아니다. 현행
문서를 열어보면 **문장이 거의 같다.** 열 해 동안 이 페이지는 거의 그대로다.

그래서 걸리는 데가 그대로 남아 있다. 세 프로퍼티 중 마지막 줄이다.

> **Use Graphic Alpha** — 효과 컬러에 그래픽 컬러를 중첩(multiply)시킵니다.

컬러를 곱한다고 적혀 있다. 그런데 프로퍼티 이름은 `Use Graphic **Alpha**`다.
그리고 같은 프로퍼티를 API 레퍼런스는 이렇게 설명한다.

> Should the shadow inherit the **alpha** from the graphic?

**이름과 API는 알파라고 하고, 매뉴얼은 컬러라고 한다.** 하나 더 있다. 저
문장은 `Outline` 페이지만의 것이 아니다.

## 목차

## 10년 전 판본인데 글자가 거의 같다

먼저 판본 이야기를 정리하고 넘어가자. 스크랩본의 설명 문장이다.

> Outline 컴포넌트는 텍스트와 이미지같은 그래픽 컴포넌트에 간단한 외곽선 효과를
> 추가합니다. 그래픽 컴포넌트와 동일한 게임 오브젝트에 있어야 합니다.

현행 영문판이다.

> The Outline component adds a simple outline effect to graphic components such
> as Text or Image. It must be on the same GameObject as the graphic component.

**한 문장 한 문장 대응한다.** 프로퍼티 표도 같다.

| 프로퍼티 | 스크랩본 (5.3 한국어) | 현행 영문판 |
| --- | --- | --- |
| Effect Color | 외곽선 컬러입니다 | The color of the outline |
| Effect Distance | 외곽선 효과의 수평 및 수직 거리입니다 | The distance of the outline effect horizontally and vertically |
| Use Graphic Alpha | 효과 컬러에 그래픽 컬러를 중첩(multiply)시킵니다 | Multiplies the color of the graphic onto the color of the effect |

**번역은 정확하다.** 이 블로그에서 한국어 매뉴얼의 오역을 몇 번 다뤘는데, 이번은
그 경우가 아니다. 한국어판은 영문을 제대로 옮겼고, **옮긴 그 문장이 문제다.**
오역을 찾을 때와 찾는 자리가 다르다.

달라진 건 문장이 아니라 **페이지가 사는 곳**이다. 스크랩본의 URL은 엔진 매뉴얼
(`docs.unity3d.com/kr/530/Manual/`)인데, 현행 같은 페이지는
`docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/`에 있다. UGUI가 엔진
내장에서 **패키지로 분리**됐기 때문이다. 옛 경로를 그대로 열면 패키지 문서로
넘어간다.

컴포넌트를 추가하는 메뉴 경로도 바뀌었다. 어트리뷰트가 그걸 들고 있다.

| 패키지 버전 | `AddComponentMenu` |
| --- | --- |
| `com.unity.ugui@1.0` | `"UI/Effects/Outline"` |
| `com.unity.ugui@2.0` | `"UI (Canvas)/Effects/Outline"` |

**`UI`가 `UI (Canvas)`로 바뀌었다.** UI Toolkit이 들어오면서 캔버스 기반 UI를
구분해 적은 결과다. 2015년 글을 따라 **Add Component > UI > Effects**를 찾으면
그 항목이 없다.

## Outline의 프로퍼티는 전부 Shadow의 것이다

API 레퍼런스를 열면 클래스 선언 한 줄이 페이지 전체를 설명한다.

```csharp
[AddComponentMenu("UI (Canvas)/Effects/Outline", 81)]
public class Outline : Shadow, IMeshModifier
```

**`Outline`은 `Shadow`를 상속한다.** 상속 사슬 전체는 이렇다.

```text
object → Object → Component → Behaviour → MonoBehaviour
       → UIBehaviour → BaseMeshEffect → Shadow → Outline
```

그래서 레퍼런스의 "Inherited Members" 목록이 중요해진다. `Shadow`에서 그대로
물려받는 멤버가 여섯이다.

| 물려받는 멤버 | 종류 |
| --- | --- |
| `effectColor` | 프로퍼티 |
| `effectDistance` | 프로퍼티 |
| `useGraphicAlpha` | 프로퍼티 |
| `ApplyShadow(...)` | 메서드 |
| `ApplyShadowZeroAlloc(...)` | 메서드 |
| `OnValidate()` | 메서드 |

**클리핑이 적은 프로퍼티 세 개가 전부 여기 있다.** `Outline`이 자기 것으로
가진 건 생성자와 `ModifyMesh(VertexHelper)` 오버라이드 하나뿐이다.

이게 문서를 읽는 방법을 바꾼다. `Outline` 인스펙터에 보이는 칸들은 **아웃라인을
위해 설계된 칸이 아니다.** 그림자용으로 만들어진 칸을 그대로 쓰는 것이고, 그래서
API 레퍼런스의 설명문이 전부 "shadow"로 적혀 있다.

> **effectDistance** — How far is the shadow from the graphic.

`Outline` 컴포넌트의 프로퍼티인데 설명에 "the shadow"가 나온다. 오류가 아니라
**상속 때문에 그 설명이 그 자리에 있는 것**이다.

## 그래서 두 페이지가 설명을 공유하고, 공유된 줄이 틀렸다

상속을 알고 나면 매뉴얼의 두 페이지를 나란히 놓고 볼 이유가 생긴다. 같은 패키지
버전(`@2.0`)의 `Shadow` 페이지 첫 문장이다.

> The **Shadow** component adds a simple **outline** effect to graphic
> components such as Text or Image.

**Shadow 페이지가 자기를 아웃라인 효과라고 소개한다.** `Outline` 페이지의 첫
문장에서 컴포넌트 이름만 바꿔 넣은 모양이다.

그리고 프로퍼티 표를 겹쳐 보면 이렇게 된다.

| 프로퍼티 | `Outline` 페이지 | `Shadow` 페이지 |
| --- | --- | --- |
| Effect Color | The color of the outline | The color of the shadow |
| Effect Distance | The distance of the outline effect horizontally and vertically | The offset of the shadow expressed as a vector |
| Use Graphic Alpha | Multiplies the color of the graphic onto the color of the effect | Multiplies the color of the graphic onto the color of the effect |

위 두 줄은 각 페이지에 맞게 고쳐 썼고, **마지막 줄만 두 페이지가 글자까지
같다.** 그 한 줄이 이름과도 API와도 어긋나는 줄이다.

정리하면 같은 프로퍼티에 대한 설명이 셋이고, 둘이 한쪽을 가리킨다.

| 출처 | 무엇을 곱한다고 하나 |
| --- | --- |
| 프로퍼티 이름 (`useGraphicAlpha`) | 알파 |
| API 레퍼런스 | 알파 ("inherit the alpha from the graphic") |
| 매뉴얼 두 페이지 | 컬러 ("Multiplies the color of the graphic") |

**2 대 1로 알파다.** 컴포넌트 소스를 직접 읽지 못했으니 단정하지는 않겠지만,
근거의 무게가 한쪽이다. 프로퍼티 이름은 API 표면이라 바꾸면 호환이 깨지는
쪽이고, 매뉴얼 문장은 바꿔도 아무것도 깨지지 않는 쪽이다. **둘이 어긋날 때
남아 있을 가능성이 높은 쪽은 이름이다.**

실무에서는 이렇게 읽으면 된다. 그래픽이 반투명한데 윤곽선만 불투명하게 남아
위화감이 생기면, 그때 켜는 칸이다. 그래픽을 페이드아웃시키는 UI에서 윤곽선이
혼자 안 사라지는 증상이 전형적이다.

### Effect Distance는 두 페이지에서 다르게 설명된다

위 표의 둘째 줄도 그냥 넘길 자리가 아니다. 같은 상속 프로퍼티인데 설명이 둘이고,
**둘이 담는 정보가 다르다.**

`Outline` 쪽은 "수평 및 수직 **거리**"다. `Shadow` 쪽은 "**벡터로 표현된
오프셋**"이다. 실제 타입은 `Vector2`이므로 **음수가 들어간다.** 거리라고만
읽으면 음수를 넣을 생각을 하지 않게 된다.

그림자에서는 이게 결정적이다. `(2, -2)`는 오른쪽 아래 그림자이고 `(-2, 2)`는
왼쪽 위다. 아웃라인에서는 부호가 결과를 바꾸지 않는 것처럼 보이지만, 그건
아웃라인이 **부호 조합을 다 쓰기 때문**이다. 그 이야기가 다음 절이다.

## 아웃라인은 셰이더가 아니라 정점 복제다

여기가 이 페이지에서 가장 중요한데, 매뉴얼에는 한 줄도 없는 부분이다.
`Shadow`에서 물려받은 메서드 설명이 메커니즘을 밝힌다.

> **ApplyShadow** — **Duplicate vertices** from start to end and turn them into
> shadows with the given offset.

**정점을 복제한다.** 그리고 `Outline`이 자기 것으로 가진 유일한 코드가
`ModifyMesh` 오버라이드이므로, 아웃라인은 **이 복제를 재료로 만들어진다.**
부모 클래스도 성격을 밝힌다.

> **BaseMeshEffect** — Base class for effects that modify the generated Mesh.

> **ModifyMesh(Mesh)** — called when the Graphic is populating the mesh.

**셰이더 단계가 아니라 메시 생성 단계다.** [셰이더가 무엇인지 본
글](/posts/what-is-a-shader/)에서 셰이더는 GPU에서 도는 프로그램이라고 정리했다.
`Outline`은 거기까지 가지 않는다. CPU에서 정점 리스트를 늘려서 GPU에 더 많은
삼각형을 보내는 쪽이다.

비용이 어디로 가는지가 그래서 갈린다. [그래픽스 파이프라인을 정리한
글](/posts/graphics-pipeline/)에서 정점 수가 많으면 버텍스 셰이더가 그만큼
돈다고 봤는데, 여기서는 **그 정점 수 자체를 CPU가 늘려서 보낸다.** 텍스트
한 글자가 쿼드 하나이므로, 글자 수에 그대로 비례한다.

클래스에 붙은 어트리뷰트도 읽을 값이 있다.

```csharp
[ExecuteAlways]
public abstract class BaseMeshEffect : UIBehaviour, IMeshModifier
```

`[ExecuteAlways]`다. 플레이를 누르지 않아도 효과가 보이는 이유가 이것이고,
[애트리뷰트를 다룬 글](/posts/unity-attributes/)에서 `[ExecuteInEditMode]`의
권장 대안으로 문서가 든 그 어트리뷰트다. **에디터에서 보이는 모양이 곧 빌드에서
나오는 모양**이라는 편의가 여기서 온다.

### 몇 벌을 만드는지는 문서에 없다

정직하게 적자면, **복제본이 몇 개인지는 문서에 없다.** `ApplyShadow`가 "정점을
복제한다"고만 하고, `Outline.ModifyMesh`가 그걸 몇 번 부르는지는 API 레퍼런스에
적히지 않는다.

문서로 말할 수 있는 건 여기까지다. 다만 구조에서 나오는 추론이 하나 있다.
`effectDistance`는 **`Vector2` 하나**이고, 아웃라인은 사방에 보인다. 오프셋 한
벌로는 한 방향만 두꺼워진다 — 그게 `Shadow`다. 하나의 `Vector2`에서 사방을
얻으려면 **부호 조합**이 필요하다.

| 오프셋 | 메우는 자리 |
| --- | --- |
| `(+x, +y)` | 오른쪽 위 |
| `(+x, -y)` | 오른쪽 아래 |
| `(-x, +y)` | 왼쪽 위 |
| `(-x, -y)` | 왼쪽 아래 |

네 벌이면 원본까지 **다섯 배**가 된다. 이건 추론이고, 문서가 보증하는 건
"복제한다"까지다. 실제 수치가 필요하면 Profiler의 UI 모듈에서 `Outline`을 켜고
끄며 정점 수를 비교하는 쪽이 정확하다.

중요한 건 숫자가 아니라 **차수**다. 글자 하나에 쿼드 하나가 아니라 여러 개가
된다는 사실이 바뀌지 않는다. 글자 수가 많은 텍스트에 `Outline`을 붙이는 게 왜
부담인지가 거기 있다.

## TMP의 윤곽선은 머티리얼에 있다

같은 효과를 다른 층에서 만드는 방법이 있다.
[TextMeshPro 인스펙터를 정리한 글](/posts/tmp-inspector-settings/)에서 봤듯,
TMP의 윤곽선은 **컴포넌트가 아니라 머티리얼의 속성**이다. 셰이더 속성 묶음
이름이 그대로 `Outline`이다.

> **Outline** — Adds a colored and/or textured outline to the text.

그게 가능한 이유는 SDF 폰트 에셋이 거리 정보를 들고 있기 때문이다.

> SDF font assets contain contour distance information.

**윤곽까지의 거리를 알고 있으니 셰이더가 윤곽을 계산할 수 있다.** 정점을 늘릴
필요가 없다.

둘을 나란히 두면 이렇게 갈린다.

| | UGUI `Outline` 컴포넌트 | TMP 머티리얼의 `Outline` |
| --- | --- | --- |
| 사는 층 | 메시 생성 (CPU) | 셰이더 (GPU) |
| 정점 수 | 늘어난다 | 그대로 |
| 적용 범위 | 그 게임오브젝트 하나 | **그 머티리얼을 쓰는 전부** |
| 대상 | `Text`, `Image` 등 모든 `Graphic` | TMP 텍스트 |

마지막 두 줄이 교환 관계다. TMP 쪽이 싸지만 **범위가 머티리얼 단위**다. 제목
하나에만 윤곽선을 주려고 머티리얼의 `Outline Width`를 올리면 그 머티리얼을 쓰는
모든 텍스트가 같이 바뀐다. 앞 글에서 짚은 자리이고, 해법은 머티리얼 프리셋을
따로 두는 것이다.

그리고 **`Outline` 컴포넌트는 `Image`에도 붙는다.** TMP 머티리얼 쪽은 텍스트
전용이다. 스프라이트에 테두리를 둘러야 하면 선택지가 다시 좁아진다.

## 어디에 왜 쓰나

### 선택된 칸만 테두리를 줄 때

목록에서 선택된 항목에 테두리를 주는 경우다. 대상이 `Image`이고 개수가 적으면
`Outline`이 적절한 자리다. 필드 타입을 `Shadow`로 두면 `Outline`과 `Shadow`를
같은 코드로 다룰 수 있다 — 상속이 주는 실용적인 이득이다.

```csharp
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Graphic))]
public class SelectionOutline : MonoBehaviour
{
    private const float DEFAULT_THICKNESS = 2f;

    [Header("Outline")]
    // Outline은 Shadow를 상속하므로 Shadow 타입 필드에 담을 수 있다.
    [SerializeField, Tooltip("같은 게임오브젝트의 Outline 컴포넌트")]
    private Shadow _effect;

    [SerializeField, Tooltip("선택됐을 때의 테두리 색")]
    private Color _selectedColor = Color.white;

    [SerializeField, Range(0f, 8f), Tooltip("테두리 두께")]
    private float _thickness = DEFAULT_THICKNESS;

    private void Awake()
    {
        // Outline은 그래픽과 같은 게임오브젝트에 있어야 한다. 문서의 요구다.
        if (_effect == null && !TryGetComponent(out _effect))
        {
            return;
        }

        _effect.effectColor = _selectedColor;

        // Vector2다. 거리가 아니라 오프셋이므로 부호가 있다.
        _effect.effectDistance = new Vector2(_thickness, _thickness);

        // 그래픽이 반투명해질 때 테두리도 같이 흐려지게 한다.
        _effect.useGraphicAlpha = true;
    }

    public void SetSelected(bool selected)
    {
        if (_effect == null)
        {
            return;
        }

        // 컴포넌트를 끄면 ModifyMesh가 안 불려서 복제 정점이 사라진다.
        _effect.enabled = selected;
    }
}
```

`SetSelected`에서 `enabled`를 끄는 게 핵심이다. 색의 알파를 0으로 만들어
숨기면 **정점은 그대로 남는다.** 보이지 않는 정점에도 비용이 든다.

### 캔버스에 깔린 효과를 세어본다

문제는 보통 하나가 아니라 **쌓인 개수**다. 프리팹을 여러 사람이 만들다 보면
텍스트마다 `Outline`이 붙어 있는 상태가 된다. `BaseMeshEffect`가 public abstract
클래스이므로 한 번에 훑을 수 있다.

```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class MeshEffectAudit : MonoBehaviour
{
    private const int WARN_THRESHOLD = 10;

    [Header("Scope")]
    [SerializeField, Tooltip("검사할 루트. 비우면 이 오브젝트 아래 전부")]
    private Transform _root;

    private void Start()
    {
        Transform scope = _root != null ? _root : transform;

        // 비활성 오브젝트까지 포함한다. 꺼져 있다가 켜지는 패널이 많다.
        BaseMeshEffect[] effects = scope.GetComponentsInChildren<BaseMeshEffect>(true);
        Dictionary<string, int> counts = new Dictionary<string, int>();

        foreach (BaseMeshEffect effect in effects)
        {
            // Outline은 Shadow의 자식이므로 GetType()으로 봐야 구분된다.
            string typeName = effect.GetType().Name;
            counts.TryGetValue(typeName, out int count);
            counts[typeName] = count + 1;

            if (effect is Outline)
            {
                Debug.Log($"outline on {effect.name}", effect);
            }
        }

        foreach (KeyValuePair<string, int> pair in counts)
        {
            if (pair.Value >= WARN_THRESHOLD)
            {
                Debug.LogWarning($"{pair.Key} x{pair.Value} — 정점 복제가 누적된다");
                continue;
            }

            Debug.Log($"{pair.Key} x{pair.Value}");
        }
    }
}
```

`effect is Outline`과 `GetType().Name`을 같이 쓴 이유가 있다. `Outline`은
`Shadow`의 자식이므로 **`effect is Shadow`는 `Outline`도 참으로 만든다.** 둘을
수로 구분하려면 타입 이름을 봐야 한다. 상속 사슬을 모르면 세는 코드가 틀린다.

### 쓰지 말아야 할 자리

- **글자 수가 많은 텍스트.** 정점이 글자 수에 비례해 늘어난다. 로그 창, 대사
  박스, 설명문처럼 긴 텍스트는 TMP 머티리얼 쪽이 맞다.
- **알파를 0으로 만들어 숨기는 것.** `ModifyMesh`는 그대로 돌고 정점도 그대로
  남는다. 숨길 거면 컴포넌트를 끈다.
- **그래픽과 다른 게임오브젝트에 붙이는 것.** 문서가 같은 게임오브젝트에 있어야
  한다고 적는다. 자식에 붙여도 아무 일도 일어나지 않는다.
- **`Effect Distance`를 거리로만 읽는 것.** `Vector2`이고 음수가 들어간다.
  `Shadow`로 쓸 때는 부호가 방향이다.
- **`Outline`과 `Shadow`를 `is Shadow`로 구분하는 것.** 상속 관계라 둘 다
  참이다.
- **같은 그래픽에 여러 겹을 올려 두껍게 만드는 것.** 복제가 곱으로 늘어난다.
  두께가 필요하면 셰이더 기반 쪽으로 간다.

## 정리

- **스크랩본은 5.3판인데 현행 문서와 문장이 거의 같다.** 번역도 정확하다. 이번
  글에서 걸리는 건 번역이 아니라 **원문 그 자체**다.
- **`Use Graphic Alpha`의 설명이 이름과 API와 어긋난다.** 매뉴얼은 컬러를
  곱한다고 하고, 프로퍼티 이름과 API 레퍼런스는 알파라고 한다. 2 대 1이다.
- **그 문장은 `Outline`과 `Shadow` 두 페이지에 글자까지 같다.** 다른 줄들은 각
  페이지에 맞게 고쳐 썼는데 그 줄만 공유되어 있고, 공유된 줄이 어긋난 줄이다.
- **`Shadow` 페이지는 자기를 "아웃라인 효과"라고 소개한다.** 두 페이지가
  보일러플레이트를 나눠 쓴 흔적이다.
- **`Outline`은 `Shadow`를 상속한다.** 프로퍼티 셋과 메서드 셋이 전부 물려받은
  것이고, 자기 것은 `ModifyMesh` 오버라이드 하나다. API 설명문이 "the shadow"로
  적힌 이유가 그것이다.
- **아웃라인은 셰이더가 아니라 정점 복제다.** `ApplyShadow`가 "Duplicate
  vertices"라고 적고, `BaseMeshEffect`는 "effects that modify the generated
  Mesh"다. 비용이 GPU 쪽 계산이 아니라 **CPU가 보내는 정점 수**로 간다.
- **복제본의 개수는 문서에 없다.** 부호 조합으로 네 벌을 추론할 수 있지만,
  정확한 수치가 필요하면 Profiler로 재는 쪽이 맞다.
- **TMP의 윤곽선은 머티리얼에 있다.** SDF가 윤곽 거리를 들고 있어서 셰이더가
  계산한다. 싸지만 **범위가 머티리얼 단위**이고, `Image`에는 못 쓴다.

---

### 참고

- [Outline — UGUI 패키지 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-Outline.html) ·
  [Shadow](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-Shadow.html) ·
  [UI Effect Components](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/comp-UIEffects.html)
- [Outline — UGUI API 레퍼런스](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Outline.html) ·
  [Shadow](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Shadow.html) ·
  [BaseMeshEffect](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/api/UnityEngine.UI.BaseMeshEffect.html)
- [Distance Field 셰이더 — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.ugui@3.0/manual/TextMeshPro/ShadersDistanceField.html)
- [Signed Distance Field 폰트 에셋 — TextMesh Pro 매뉴얼](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/FontAssetsSDF.html)
- [아웃라인 — Unity 5.3 한국어 매뉴얼 (스크랩본의 판)](https://docs.unity3d.com/kr/530/Manual/script-Outline.html)

같은 UGUI 묶음의 앞선 글로
[레이아웃 그룹](/posts/ugui-layout-group/)과
[InputField](/posts/ugui-inputfield-name-entry/)가 있다. 이 글의 출발점이 된
자료는 Unity 5.3 한국어 매뉴얼의 아웃라인 페이지이고, 설명과 프로퍼티 표를 현행
UGUI 패키지 매뉴얼·API 레퍼런스에 대조했다.
