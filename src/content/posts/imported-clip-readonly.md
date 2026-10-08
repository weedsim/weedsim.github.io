---
pubDatetime: 2026-10-08T20:00:00+09:00
title: "읽기 전용인 건 클립이 아니라 Animation 창의 뷰다"
lang: ko
translationKey: imported-clip-readonly
featured: false
draft: false
tags:
  - Unity
  - Animator
  - 애니메이션
  - 에디터
  - C#
description: "에셋스토어에서 받은 애니메이션이 ReadOnly로 떠서 수정 방법을 찾던 중 스크랩한 글이다. 복제가 답이라고 적혀 있다. 그런데 읽기 전용인 것은 클립이 아니라 창 하나였고, 수정이라 부를 만한 일의 상당수는 복제 없이 된다."
---

에셋스토어에서 받은 애니메이션을 수정하려는데 `ReadOnly`로 떠서 막혔다.
방법을 찾다 스크랩한 글이 이것이다. 본문이 세 문장쯤 되는 짧은 글이고,
FBX에 내장된 클립이 읽기 전용이니 `Ctrl+D`로 복사해서 쓰면 된다고 적혀 있다.
사진 세 장으로 그걸 보여준다.

절차는 동작한다. 그리고 **키프레임을 직접 고칠 거라면 그게 맞는 방법이다.**
다만 "수정"이라고 부를 만한 일이 전부 키프레임 편집은 아니고, 그중 상당수는
복제하지 않고 된다. 읽기 전용이 정확히 무엇을 막고 있는지부터 보면 그게
갈린다.

매뉴얼의 문장이 범위를 좁게 적어두고 있다.

> When viewing imported Animation keyframes, the Animation window provides a
> read-only view of the animation data.

주어가 **Animation window**다. 클립 에셋이 잠겨 있다는 말이 아니고, 그 창이
보여주는 뷰가 읽기 전용이라는 말이다. 그리고 유니티에는 **임포트된 클립에
데이터를 얹는 방법**을 다루는 문서 페이지가 셋이나 따로 있다. 이벤트, 커브,
마스크다. 세 페이지 모두 첫 문장이 같은 모양이다.

> You can attach animation events to imported animation clips in the Animation
> tab.

확인한 것은 다섯 가지다. **읽기 전용은 Animation 창의 뷰에 대한 설명이고
대상은 키프레임과 커브다**, **클립 범위·루프·루트 모션은 임포트 설정에서
복제 없이 바꾼다**, **이벤트·커브·마스크도 임포트 설정에서 얹는다**,
**문서가 적어둔 복사 절차는 `Ctrl+D`가 아니라 `Ctrl+C`/`Ctrl+V`다**, 그리고
**복제본은 원본과 연결이 끊긴 별개 에셋이라 에셋스토어 패키지가 갱신되면
스냅샷으로 남는다.**

이 블로그에 애니메이션 글이 둘 있다.
[CrossFade의 0.3f](/posts/animator-crossfade/)와
[IK Pass가 꺼져 있으면 IK 함수 여섯 개가 전부 무음이다](/posts/animator-members/)는
둘 다 **`Animator` 컴포넌트**를 다뤘다. 이 글은 그 컴포넌트가 재생할 **클립이
어디에 들어 있고 누가 그걸 다시 만드는지** 쪽이다. 다만 다른 글로 넘기지는
않는다. 필요한 설명과 예제 코드는 여기서 다시 전부 싣는다.

확인 시점은 **2026-10-08**이고, 기준은 Unity **6.6**이다.

## 목차

## 읽기 전용이 막는 것은 키프레임 편집이다

앞서 인용한 문장 바로 다음 줄이 무엇을 못 하는지 한정한다.

> You cannot edit this data, but you can edit a copy of the Animation data

여기서 "this data"는 앞 문장의 **imported Animation keyframes**다. 그러니까
읽기 전용이 막는 것은 **본의 키프레임과 커브를 Animation 창에서 직접
편집하는 일**이고, 그 이상이 아니다.

왜 막아두었는지도 생각해보면 당연하다. 그 클립은 `.fbx` 안에 들어 있는 서브
에셋이고, `.fbx`는 임포터가 원본 파일로부터 **다시 만들어내는** 대상이다.
창에서 키프레임을 고쳐 저장해도 다음 재임포트에서 날아갈 것이다. 그래서
유니티는 창을 잠그고, 대신 **재임포트를 견디는 자리**를 따로 뒀다. 그게
임포트 설정이다.

화면이 둘이고 하는 일이 다르다.

| 화면 | 어떻게 여나 | 임포트된 클립에 |
| --- | --- | --- |
| Animation 창 | Window > Animation > Animation | 키프레임·커브를 **못** 고친다 (뷰가 읽기 전용) |
| 임포트 설정 Animation 탭 | 프로젝트 창에서 `.fbx` 선택 → Inspector | 범위·루프·루트 모션을 바꾸고, 이벤트·커브·마스크를 **얹는다** |

## 임포트 설정에서 복제 없이 바뀌는 것들

Animation 탭의 레퍼런스 페이지가 있고, 제목이 그대로 "Animation tab"이다.
클립 하나를 고르면 나오는 설정들에 대해 이렇게 적는다.

> These settings define import options for the selected Animation Clip.

**import options**다. 즉 클립을 고치는 게 아니라 **클립을 만드는 방법**을
고치는 것이고, 그래서 재임포트를 견딘다. 자주 손대는 항목만 옮기면 이렇다.

| 항목 | 문서 설명 |
| --- | --- |
| Start | "Start frame of the clip." |
| End | "End frame of the clip." |
| Loop Time | "Play the animation clip through and restart when the end is reached." |
| Loop Pose | "Loop the motion seamlessly." |
| Cycle Offset | "Offset to the cycle of a looping animation, if it starts at a different time." |
| Root Transform Rotation | "Bake root rotation into the movement of the bones. Disable to store as root motion." |
| Root Transform Position (Y) | "Bake vertical root motion into the movement of the bones. Disable to store as root motion." |
| Root Transform Position (XZ) | "Bake horizontal root motion into the movement of the bones. Disable to store as root motion." |

에셋스토어 애니메이션에서 실제로 걸리는 것들이 여기 다 있다. 긴 클립 하나로
들어온 모션을 **Start/End로 잘라서** 여러 클립으로 쓰는 것, 걷기가 반복되지
않아서 **Loop Time**을 켜는 것, 캐릭터가 제자리에서만 움직여서
**Root Transform Position (XZ)의 Bake Into Pose를 끄는 것** — 전부 복제가
필요 없는 수정이다.

마지막 항목은 특히 오해하기 쉽다. "애니메이션이 앞으로 안 나간다"는 증상에
키프레임을 의심하기 쉬운데, 문서가 적은 대로 그건 루트 모션을 본의 움직임에
**구워 넣었는지**의 문제다. 끄면 루트 모션으로 저장된다.

## 이벤트·커브·마스크도 같은 탭에서 얹는다

클립을 만드는 방법을 고치는 것 말고, **데이터를 더 얹는** 쪽도 임포트 설정이
받는다. 전용 페이지가 세 개고 셋 다 문장 모양이 같다.

이벤트 페이지는 제목이 "Add events to animation clips."이고 절차가 이렇다.

> To add an event to an imported animation, expand the Events section to
> reveal the events timeline

> Position the playback head at the point where you want to add an event,
> then click Add Event.

> in the Function property, fill in the name of the function to call when the
> event is reached.

같은 페이지가 이벤트가 하는 일을 이렇게 요약한다.

> Events allow you to add additional data to an imported clip which determines
> when certain actions should occur

**"add additional data to an imported clip"** — 임포트된 클립에 데이터를
얹는다고 쓰여 있다. 클립 전체가 잠겨 있다면 성립할 수 없는 문장이다.

커브 페이지는 제목이 "Use curves to control the timing of animation clips"이고
첫 문장이 이렇다.

> You can attach animation curves to imported animation clips in the Animation
> tab.

추가는 "expand the Curves section at the bottom of the Animation tab" 후
플러스 아이콘이고, 편집은 이렇다.

> Double-clicking an animation curve brings up the standard Unity curve editor

커브 이름이 Animator Controller의 파라미터 이름과 같으면 그 파라미터를
커브가 몰고 간다.

> that parameter takes its value from the value of the curve at each point in
> the timeline

마스크 페이지는 제목이 "Mask animation clips"이고 하는 일이 이렇다.

> Masking allows you to discard some of the animation data within a clip

> To apply a mask to an imported animation clip, expand the Mask heading to
> reveal the Mask options.

에셋스토어 모션의 상체만 쓰고 하체는 버리고 싶을 때 쓰는 자리다. 마스크
정의는 재사용된다.

> This allows you to re-use a single mask definition for many clips.

**세 페이지 중 어느 쪽도 복제를 전제하지 않는다.** 세 페이지 모두 임포트된
클립을 대상으로 적혀 있다.

## 복사본이 필요한 건 키프레임을 고칠 때다

그래도 키프레임을 직접 고쳐야 하는 경우가 있다. 손이 벽을 뚫는 프레임
하나를 잡거나, 발 위치를 옮기거나. 그때는 복사본이 필요하다. 그런데 매뉴얼이
적어둔 절차는 클리핑의 `Ctrl+D`가 아니다.

> To create a copy of Animation data from a read only FBX file, follow these
> steps:

> In the Project window, select the FBX file with the animation data that you
> want to copy.

> In the Animation window, select the properties to limit the amount of
> animation data being displayed.

> Select the keyframes that you want to copy.

> Press Ctrl+C (macOS: Cmd+C) to copy the selected keyframes.

> Create a new empty Animation Clip for the GameObject where you want to paste
> the copied keyframes.

> Press Ctrl-V (macOS: Cmd+V) to paste the copied keyframes.

**키프레임을 골라 새 빈 클립에 붙이는 절차**다. 클립 에셋을 통째로 복제하는
것과 다른 일이다. 전자는 내가 고른 프로퍼티만 가져오고, 후자는 클립을 통째로
뽑는다.

클리핑의 `Ctrl+D`가 틀렸다는 뜻은 아니다. 사진이 결과를 보여주고 있고 실제로
동작한다. **다만 문서가 그 방법을 적어둔 자리는 찾지 못했다.**

그리고 문서 쪽 절차에는 조건이 붙어 있다. 이 조건이 조용히 실패하는 쪽이다.

> For best results, the GameObject where you are pasting should have the same
> hierarchy and properties

> as the animation data you are copying.

계층이 다르면 어떻게 되는지도 적어뒀다.

> If the GameObject does not have the same properties, the animation data is
> copied,

> but the properties are drawn in yellow.

> Hovering over the name of the property displays the message `The GameObject
> or Component are missing`.

**복사는 되고 프로퍼티가 노란색으로 그려진다.** 에러가 아니다. 에셋스토어
모션을 자기 캐릭터 리그에 붙여넣을 때 본 이름이 하나라도 다르면 이 노란색을
보게 되고, 그 프로퍼티는 아무것도 움직이지 않는다.

## 에셋스토어 애니메이션이면 복제본이 스냅샷이 된다

복제의 대가를 짚어둘 필요가 있다. 에셋스토어에서 받은 에셋은 **패키지가
갱신된다.**

`.meta`에 대한 문서 문장이 관계를 설명한다.

> The metadata file which Unity creates during the import process, stored next
> to the original asset file,

> contains the asset’s import settings, and contains a GUID

> a GUID which allows Unity to connect the original asset file with the
> artifact in the asset database

임포트 설정은 원본 파일 옆의 `.meta`에 붙어 있고, GUID가 원본과 임포트
결과를 잇는다. 재임포트에 대해서는 이렇게 적는다.

> using the import settings and project settings saved in your project

그리고 임포트 설정에 넣은 이벤트에 대한 스크립팅 레퍼런스의 한 줄이 이것이다.

> AnimationEvents that will be added during the import process.

여기서 결론을 **두 문장을 이어서** 낼 수 있다. 임포트 설정은 FBX 옆에
붙어 있고 재임포트가 그 설정을 쓰므로, **패키지가 갱신되어 FBX가 교체되어도
임포트 설정에서 한 수정은 그 자리에 남는다.** 반대로 `Ctrl+D`로 뽑은
복제본은 `.fbx`와 아무 연결이 없는 별개 에셋이고, 패키지가 갱신되어도
**복제한 시점의 스냅샷으로 남는다.**

다만 이건 **문서 두 문장을 이어붙인 결론**이다. "패키지 갱신 후에도 임포트
설정이 유지된다"고 한 문장으로 적어둔 문서는 찾지 못했다. 그 선은 분명히
해두겠다. 패키지를 처음 갱신할 때 한 번 확인해보는 쪽이 맞다.

실무적으로는 이렇게 갈린다.

- 임포트 설정으로 끝낼 수 있는 수정이면 **거기서 끝내라.** 갱신을 견딘다.
- 키프레임을 고쳐야 하면 복사본이 필요하고, **그 순간부터 갱신을 손으로
  따라가야 한다.** 어느 복사본이 어느 버전에서 나왔는지 적어두는 쪽이 낫다.

## 매개변수에 대해 두 문서가 서로 다르게 적는다

이벤트까지 쓸 거라면 함수 모양을 알아야 하는데, 두 페이지가 어긋난다.

**첫째, 개수.** Animation 창 쪽 매뉴얼은 이렇게 쓴다.

> Note that Animation Events only support methods with a single parameter.

스크립팅 레퍼런스의 `AnimationEvent`는 이렇게 쓴다.

> Animation events support functions that take zero or one parameter.

**"single parameter"와 "zero or one"은 다른 말이다.** 매개변수 없는 핸들러를
쓸 수 있는지가 갈리고, 쓸 수 있다. 매뉴얼 쪽이 좁게 적힌 것이다.

**둘째, 타입 목록.** 임포트된 클립 페이지는 넷을 든다.

> There are four different parameter types: Float, Int, String or Object

Animation 창 페이지는 거기에 `AnimationEvent` 자체를 하나 더 든다. 여러 값을
한 번에 넘기려면 그 객체를 받으라는 것이고, 실제로 클래스 프로퍼티가 그렇게
생겼다.

| 프로퍼티 | 설명 |
| --- | --- |
| `functionName` | "The name of the function that will be called." |
| `floatParameter` | "Float parameter that is stored in the event and will be sent to the function." |
| `intParameter` | "Int parameter that is stored in the event and will be sent to the function." |
| `stringParameter` | "String parameter that is stored in the event and will be sent to the function." |
| `objectReferenceParameter` | "Object reference parameter that is stored in the event and will be sent to the function." |
| `time` | "The time at which the event will be fired off." |
| `messageOptions` | "Function call options." |
| `isFiredByAnimator` | "Returns true if this Animation event has been fired by an Animator component." |

**임포트 설정의 Events UI가 `AnimationEvent` 타입 매개변수를 제공하는지는
확인하지 못했다.** 두 페이지가 타입 목록을 다르게 적는다는 것까지가 문서로
말할 수 있는 선이다.

호출 방식은 클래스 설명에 적혀 있다.

> AnimationEvent lets you call a script function similar to SendMessage as
> part of playing back an animation.

**`SendMessage`와 비슷한 방식**이다. 이름으로 찾아 부르니 함수 이름을 오타
내도 컴파일러가 잡지 않는다. 받는 쪽의 조건은 이벤트 페이지에 있다.

> Make sure that any GameObject which uses this animation in its animator has
> a corresponding script attached

## 어디에 왜 쓰나

### 동작하는 예제

임포트 설정에서 할 수 있는 수정은 인스펙터 작업이라 코드가 없다. 코드가
필요한 쪽은 둘이다 — 이벤트를 받는 쪽, 그리고 같은 설정을 여러 FBX에 일괄로
넣는 쪽.

받는 쪽은 그냥 `MonoBehaviour`의 메서드다. 애니메이션을 재생하는 `Animator`가
붙은 **같은 게임오브젝트**에 있어야 한다.

```csharp file="Scripts/Character/FootstepReceiver.cs"
using UnityEngine;

public class FootstepReceiver : MonoBehaviour
{
    private const float DefaultVolume = 1f;

    [Header("발소리")]
    [Tooltip("임포트 설정의 Object 매개변수로 넘길 수도 있다")]
    [SerializeField]
    private AudioClip _defaultFootstep;

    [SerializeField]
    private AudioSource _audioSource;

    private void Awake()
    {
        if (_audioSource == null && !TryGetComponent(out _audioSource))
        {
            Debug.LogError("AudioSource가 없다.", this);
        }
    }

    // 매개변수 없는 핸들러. 레퍼런스가 "zero or one"이라고 적은 쪽.
    public void OnFootstep()
    {
        PlayFootstep(_defaultFootstep, DefaultVolume);
    }

    // Float 매개변수. 임포트 설정에서 세기를 발마다 다르게 줄 수 있다.
    public void OnFootstepWithVolume(float volume)
    {
        PlayFootstep(_defaultFootstep, volume);
    }

    // Object 매개변수. 왼발/오른발 소리를 클립으로 따로 넘기는 경우.
    public void OnFootstepWithClip(Object clip)
    {
        PlayFootstep(clip as AudioClip, DefaultVolume);
    }

    // AnimationEvent 매개변수. 여러 값을 한 번에 받는다.
    // 이 타입을 임포트 설정 UI가 제공하는지는 확인하지 않았다.
    public void OnFootstepDetailed(AnimationEvent animationEvent)
    {
        PlayFootstep(animationEvent.objectReferenceParameter as AudioClip,
                     animationEvent.floatParameter);
    }

    private void PlayFootstep(AudioClip clip, float volume)
    {
        if (clip == null || _audioSource == null)
        {
            return;
        }

        _audioSource.PlayOneShot(clip, volume);
    }
}
```

`_audioSource`와 `clip`에 `?.`를 쓰지 않은 이유가 있다. 둘 다
`UnityEngine.Object`이고, 인스펙터에서 비워둔 참조는 **null처럼 보이지만
C#의 null이 아닌 상태**가 될 수 있다. 그래서 `== null` 비교를 쓴다. 순수 C#
객체라면 `?.`가 맞다.

에셋스토어 패키지처럼 FBX가 수십 개 들어오는 경우, 같은 설정을 손으로
반복하는 대신 임포터를 코드로 만질 수 있다.

```csharp file="Assets/Editor/ClipImportStamper.cs"
using UnityEditor;
using UnityEngine;

// Editor 폴더에 둔다. 에디터 전용 어셈블리에서만 컴파일된다.
public static class ClipImportStamper
{
    private const string FunctionName = "OnFootstep";

    [MenuItem("Assets/Stamp Clip Import Settings", true)]
    private static bool ValidateStamp()
    {
        return Selection.activeObject != null
               && AssetImporter.GetAtPath(
                      AssetDatabase.GetAssetPath(Selection.activeObject))
                  is ModelImporter;
    }

    [MenuItem("Assets/Stamp Clip Import Settings")]
    private static void Stamp()
    {
        string path = AssetDatabase.GetAssetPath(Selection.activeObject);

        if (AssetImporter.GetAtPath(path) is not ModelImporter importer)
        {
            return;
        }

        ModelImporterClipAnimation[] clips = importer.clipAnimations;

        // clipAnimations가 비어 있으면 defaultClipAnimations를 받아 쓴다.
        if (clips.Length == 0)
        {
            clips = importer.defaultClipAnimations;
        }

        for (int i = 0; i < clips.Length; i++)
        {
            // 클립을 만드는 방법 쪽 설정.
            // lockRootPositionXZ 가 인스펙터의
            // Root Transform Position (XZ) > Bake Into Pose 다.
            clips[i].loopTime = true;
            clips[i].lockRootPositionXZ = false;

            // 클립에 얹는 데이터 쪽 설정
            clips[i].events = new[]
            {
                new AnimationEvent { time = 0.25f, functionName = FunctionName },
                new AnimationEvent { time = 0.75f, functionName = FunctionName },
            };
        }

        importer.clipAnimations = clips;

        // 임포트 설정을 .meta 에 쓰고 다시 임포트한다.
        importer.SaveAndReimport();

        Debug.Log($"{clips.Length}개 클립에 설정을 넣었다: {path}");
    }
}
```

마지막 줄이 실제로 하는 일은 레퍼런스에 적혀 있다.

> Save asset importer settings if asset importer is dirty.

그리고 재임포트는 이렇게 이어진다 — "Under the hood this calls
`AssetDatabase.ImportAsset`". 그 지점이 앞 절의
"added during the import process"가 실제로 일어나는 자리다.

### 무엇을 고르나

하려는 수정에서 자리로 가는 표다.

| 하려는 수정 | 어디서 | 복제 필요? |
| --- | --- | --- |
| 긴 모션을 여러 클립으로 자른다 | 임포트 설정 > Clips의 Start/End | 아니오 |
| 반복되게 만든다 | 임포트 설정 > Loop Time / Loop Pose | 아니오 |
| 제자리걸음을 전진하게 만든다 | Root Transform Position (XZ) 의 Bake Into Pose 해제 | 아니오 |
| 상체만 쓰고 하체는 버린다 | 임포트 설정 > Mask | 아니오 |
| 특정 시점에 함수를 부른다 | 임포트 설정 > Events | 아니오 |
| Animator 파라미터를 모션에 맞춰 몰고 간다 | 임포트 설정 > Curves | 아니오 |
| 본의 키프레임 값을 직접 고친다 | 키프레임을 `Ctrl+C`/`Ctrl+V`로 새 빈 클립에 | **예** |
| 클립을 통째로 떼어내 자유롭게 고친다 | 프로젝트 창에서 `Ctrl+D` | **예** |

판단 순서는 이렇게 두면 된다.

- **먼저 임포트 설정 탭을 열어본다.** 위 표에서 "아니오"인 항목이 생각보다
  많다. 에셋스토어 모션에서 겪는 문제 대부분이 범위·루프·루트 모션이다.
- **거기서 안 되면 복사본을 만든다.** 그리고 그때부터 그 복사본은 **내
  책임**이다. 패키지 갱신을 따라가지 않는다.
- **복사본을 "ReadOnly 해제"라고 부르지 않는다.** 해제가 아니라 별개 에셋
  생성이다.

### 쓰지 말아야 할 자리

- **범위·루프·루트 모션을 고치려고 클립을 복제하는 것.** 임포트 설정에서
  되는 일이고, 복제하면 패키지 갱신과의 연결만 잃는다.
- **이벤트를 넣겠다고 클립을 복제하는 것.** 전용 페이지가 있다.
- **"애니메이션이 앞으로 안 나간다"에 키프레임부터 의심하는 것.**
  Root Transform Position (XZ)의 Bake Into Pose를 먼저 본다.
- **계층이 다른 리그에 키프레임을 붙여넣고 넘어가는 것.** 복사는 되고
  프로퍼티가 노란색으로 그려진다. 에러가 아니다.
- **함수 이름을 코드에서 바꾸고 임포트 설정을 안 고치는 것.** `SendMessage`
  방식이라 컴파일러가 잡지 않는다.
- **매개변수를 두 개 받는 핸들러.** 레퍼런스가 "zero or one"이라고 적었다.
  여러 값이 필요하면 `AnimationEvent`를 받는다.

## 정리

- **읽기 전용인 것은 클립이 아니라 Animation 창의 뷰다.** 문서의 주어가
  "the Animation window"이고, 못 고치는 대상은 **키프레임과 커브**다.
- 클립을 만드는 방법은 **임포트 설정 Animation 탭**에서 바꾼다. 레퍼런스가
  그 설정들을 **"import options"**라고 부르고, 그래서 재임포트를 견딘다.
  Start/End · Loop Time · Root Transform의 Bake Into Pose가 전부 여기다.
- **이벤트·커브·마스크도 임포트된 클립에 얹는다.** 전용 페이지가 세 개고,
  셋 다 복제를 전제하지 않는다.
- 복사본이 필요한 것은 **본의 키프레임을 직접 고칠 때**다. 그리고 문서가
  적어둔 절차는 `Ctrl+D`가 아니라 **`Ctrl+C`/`Ctrl+V`**로 키프레임을 새 빈
  클립에 붙이는 쪽이다.
- 그 절차에는 조건이 있다. 계층이 다르면 **복사는 되고 프로퍼티가 노란색으로
  그려진다.** 에러가 아니라서 지나치기 쉽다.
- **복제본은 `.fbx`와 연결이 끊긴 별개 에셋이다.** 에셋스토어 패키지가
  갱신되면 복제본은 그 시점의 스냅샷으로 남는다. (임포트 설정 쪽이 갱신을
  견딘다는 것은 문서 두 문장을 이어붙인 결론이고, 한 문장으로 적힌 문서는 못
  찾았다.)
- 이벤트 함수의 매개변수 개수를 두 문서가 다르게 적는다. 매뉴얼은
  "only ... a single parameter", 레퍼런스는 **"zero or one"**. 후자가 맞다.

---

### 참고

- [Animation from external sources — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationsImport.html)
- [Animation tab — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AnimationClip.html)
- [Animation Events on Imported Clips — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationEventsOnImportedClips.html)
- [Use curves to control the timing of animation clips — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationCurvesOnImportedClips.html)
- [Mask animation clips — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationMaskOnImportedClips.html)
- [Animation Events (Animation window) — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/script-AnimationWindowEvent.html)
- [Contents of the Asset Database — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/asset-database-contents.html)
- [AnimationEvent — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AnimationEvent.html)
- [ModelImporterClipAnimation — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/ModelImporterClipAnimation.html)
- [AssetImporter.SaveAndReimport — Unity 6.6 스크립팅 레퍼런스](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AssetImporter.SaveAndReimport.html)

이 글의 출발점이 된 자료는
[\[유니티\] ReadOnly 해제](https://sungjun0531.tistory.com/69)
(김조성준, 2024-01-22)다. 본문이 세 문장짜리 짧은 글이라 인용한 문장은 그
전부에 가깝다. 절차 자체는 그대로 따라가면서, 그 전제와 대안을 현행 Unity
6.6 매뉴얼과 스크립팅 레퍼런스 양쪽에 대조했다. 확인 시점은 2026-10-08이다.
