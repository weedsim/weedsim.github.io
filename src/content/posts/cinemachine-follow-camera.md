---
pubDatetime: 2026-09-03T17:30:00+09:00
title: "Cinemachine Follow Camera 뜯어보기: Binding Mode는 회전 모드가 아니다"
lang: ko
translationKey: cinemachine-follow-camera
featured: false
draft: false
tags:
  - Unity
  - Cinemachine
  - 카메라
description: "레이싱·러너 게임의 추적 카메라를 만드는 Follow Camera를 Cinemachine 3 기준으로 정리했다. Binding Mode가 실제로 무엇을 정하는지, 그리고 흔히 오해되는 마우스 입력·Target Offset을 공식 문서로 바로잡았다."
---

러너 게임을 하나 만들고 있다. 카메라를 Cinemachine으로 붙이려고 자료를
찾다가 [이 글](https://gus6615.tistory.com/114)을 스크랩해뒀었다. 레이싱
게임이나 Temple Run 같은 러너 게임의 시점, 그러니까 **마우스 입력을 받지
않고 타겟만 쫓아가는 카메라**를 만드는 내용이라 목적에 정확히 맞았다.

절차는 짧다. 가상 카메라 하나 만들고, 타겟 붙이고, 오프셋 하나 조정하면
끝난다. 그런데 그 뒤에 이어지는 Binding Mode 설명을 공식 문서와 대조해보니
설명 방향이 어긋나 있었다. **Binding Mode를 "카메라가 어떻게 회전하느냐"로
읽고 있는데, 실제로는 회전 모드가 아니다.** 이 오해가 퍼져 있으면 모드를
바꿔가며 원하는 그림을 못 찾고 헤매게 되므로, 그 부분을 중심으로 다시
정리했다.

기준은 **Cinemachine 3.1** 문서다.

## 목차

## Follow Camera는 무엇으로 되어 있나

메뉴 경로는 이렇다.

> GameObject > Cinemachine > Targeted Cameras > Follow Camera

이렇게 만들면 `CinemachineCamera` 하나에 제어 모듈 두 개가 붙는다.

- **Cinemachine Follow** — Position Control(위치 제어)
- **Cinemachine Rotation Composer** — Rotation Control(회전 제어)

여기서 이미 구조가 드러난다. Cinemachine 3의 카메라는 **위치를 정하는 모듈과
회전을 정하는 모듈이 분리**되어 있고, 이 프리셋은 그중 한 조합일 뿐이다.
원문이 "제어 모듈"이라고 부른 게 이것이다.

타겟은 `Tracking Target` 하나만 지정하면 된다. 공식 문서의 표현은 이렇다.

> The CinemachineCamera automatically positions the Unity camera relative to
> this GameObject at all times, and rotates the camera to look at the
> GameObject.

원문이 한 설정도 딱 두 가지다. 캐릭터의 카메라 루트 오브젝트를
`Tracking Target`에 할당하고, `Cinemachine Follow`의 `Follow Offset` Z를
`-3`으로 두는 것. 오프셋 기본값이 `(0, 0, -10)`이라 타겟 뒤 10미터에
서 있는데, 이걸 3미터로 당긴 것이다.

그리고 원문이 덧붙인 주의 하나는 그대로 유효하다. **이전에 만들어둔 가상
카메라가 있으면 꺼야 한다.** Cinemachine은 활성화된 카메라들 중 우선순위로
하나를 고르므로, 안 끄면 새로 만든 게 안 잡힐 수 있다.

## Binding Mode는 회전 모드가 아니다

원문은 Binding Mode를 "어떻게 추적할 것인지에 대한 모드"라고 소개한 뒤,
각 모드를 회전 여부와 마우스 입력으로 설명한다. 여기가 어긋나는 지점이다.

공식 문서의 정의는 한 문장이다.

> The binding mode defines the coordinate space Unity uses to interpret the
> camera offset from the target and to apply the damping.

즉 Binding Mode가 정하는 것은 **`Follow Offset`을 어느 좌표계에서 해석할
것인가**다. "카메라가 회전한다/안 한다"는 그 좌표계 선택에서 따라 나오는
결과지, 모드가 직접 지정하는 항목이 아니다.

이 관점으로 보면 여섯 모드가 한 줄로 정렬된다. 타겟의 회전을 **얼마나
가져다 쓸 것인가**의 스펙트럼이다.

| Binding Mode | 오프셋을 해석하는 좌표계 | 공식 정의 |
| --- | --- | --- |
| Lock To Target | 타겟의 로컬 프레임 전체 | "When the target rotates, the camera rotates with it to maintain the offset and to maintain the same view of the target." |
| Lock To Target No Roll | 타겟 로컬, 롤만 제거 | "Makes the CinemachineCamera use the local frame of the Follow target, with roll set to 0." |
| Lock To Target With World Up | 타겟 로컬, 요(yaw)만 사용 | "This binding mode ignores all target rotations except yaw." |
| Lock To Target On Assign | 할당 시점의 타겟 프레임을 스냅숏 | "This offset remains constant in world space." |
| World Space | 월드 좌표 | "The camera will not change position when the target rotates." |
| Lazy Follow | 카메라 로컬 | "This mode emulates the action a human camera operator would take when instructed to follow a target." |

위에서 아래로 갈수록 타겟의 회전을 덜 반영한다. `Lock To Target`은 타겟이
구르면 카메라도 같이 구르고, `World Space`는 타겟이 아무리 돌아도 카메라
위치가 그대로다.

`Lock To Target On Assign`을 원문은 "타겟을 향해 이동하지만 회전은 하지
않습니다"로 설명하는데, 정확히는 **할당·활성화 시점의 타겟 방향을 한 번
찍어두고 그 오프셋을 월드 공간에 고정**하는 것이다. 회전을 아예 안 쓰는 게
아니라 한 번만 쓴다.

`Lazy Follow`도 "지연된 반응이 추가되어"로 설명되어 있는데, 단순히 딜레이를
넣은 게 아니다. 오프셋과 댐핑을 **카메라 로컬 공간**에서 해석하는 별개의
모드이고, 그래서 타겟이 어느 방향을 보든 카메라는 거리와 높이를 유지하며
따라간다. 사람 카메라 감독의 움직임을 흉내 낸다는 설명이 붙는 이유다.

### 마우스 입력으로 회전하는 모드는 없다

원문은 `Lock To Target With World Up`, `Lock To Target No Roll`,
`Lock To Target` 세 모드에 대해 "마우스 입력을 통해 회전합니다"라고 적어뒀다.
**이건 성립하지 않는다.** Binding Mode가 무엇이든 `Cinemachine Follow`는
입력을 읽지 않는다.

Cinemachine의 입력 처리는 아예 다른 층에 있다. 공식 문서의 표현이다.

> Cinemachine cameras don't directly process user input. Instead, they expose
> axes that are meant to be *driven*, either by script, animation, or by user
> input.

즉 카메라를 마우스로 돌리려면 **입력 축을 노출하는 컴포넌트**(`Cinemachine
Orbital Follow`, `Cinemachine Pan Tilt` 같은 것)를 쓰고, 거기에
`Cinemachine Input Axis Controller`를 붙여 축을 구동해야 한다. Follow +
Rotation Composer 조합에는 그런 축이 없다.

그래서 원문이 처음에 내건 조건 3번 — **"마우스의 입력에 영향을 받지
않습니다"** — 은 Binding Mode를 잘 골라서 달성되는 게 아니라, **이 프리셋에
입력 경로 자체가 없어서** 처음부터 만족되는 것이다. 오히려 나중에 마우스로
돌리고 싶어지면 컴포넌트를 바꿔야 한다는 뜻이기도 하다.

### 러너와 레이싱에는 어느 모드인가

목적에 맞춰 정리하면 이렇다.

- **러너(Temple Run류)** — 캐릭터가 코너에서 방향을 트는 구조라면 타겟의
  요(yaw)를 따라가는 `Lock To Target With World Up`이 기본값에 가깝다. 반대로
  좌우 레인 이동이 회전이 아니라 평행 이동뿐이라면 타겟이 돌아도 카메라가
  안 도는 `World Space`, 또는 거리와 높이만 유지하며 붙는 `Lazy Follow` 쪽이
  깔끔하다. **레인 이동만 있는데 요를 따라가게 해두면**, 캐릭터가 살짝
  기울어질 때마다 화면이 같이 흔들려서 멀미가 난다.
- **레이싱** — 차가 코너를 돌 때 카메라도 같이 돌아야 하므로 마찬가지로
  `Lock To Target With World Up`이 출발점이다. 롤까지 따라가는
  `Lock To Target`을 쓰면 차가 기울거나 뒤집힐 때 화면이 같이 뒤집힌다.
- **회전이 격한 타겟** — 모드보다 `Rotation Damping`을 먼저 본다. 타겟이
  급격히 돌 때 카메라가 휙 도는 문제는 모드를 바꿔서가 아니라 댐핑으로
  잡는 편이 낫다.

러너라면 Rotation Composer 쪽도 같이 봐야 한다. 캐릭터가 화면 정중앙에
고정되어 있으면 앞이 안 보이므로, `Screen Position`을 아래쪽으로 내려 진행
방향의 시야를 넓히고 `Dead Zone`으로 좌우 레인 이동에 카메라가 일일이
반응하지 않게 하는 조합이 흔하다.

## Rotation Composer가 하는 일

원문이 "Follow는 카메라 자체의 회전을 담당하지 않으므로 Rotation Composer를
함께 써야 한다"고 정리한 부분은 맞다. 공식 설명은 이렇다.

> This CinemachineCamera Rotation Control behaviour rotates the camera to face
> the Look At target. It also applies offsets, damping, and composition rules.

주요 프로퍼티를 공식 정의로 옮기면 이렇다.

- **Screen Position** — 타겟을 화면 어디에 둘지. "The camera adjusts to
  position the tracked object here."
- **Dead Zone** — "The camera will not adjust when the target is within this
  range of the Screen Position." 이 안에서는 카메라가 반응하지 않는다.
- **Hard Limits** — "The camera will not allow the target to be outside of the
  hard limits." 타겟이 아무리 빨라도 이 밖으로 못 나간다.
- **Damping** — "How responsively the camera frames the target in horizontal
  and vertical directions."
- **Lookahead Time** — 타겟의 움직임으로 미래 위치를 추정해 미리 따라간다.
  `Lookahead Smoothing`은 예측이 튀는 걸 눌러주는 대신 지연이 늘고,
  `Lookahead Ignore Y`는 Y축 이동을 예측에서 뺀다.
- **Center On Activate** — "Rotates the camera to put the target at the center
  of the dead zone when the camera becomes live."

### Target Offset은 카메라를 옮기지 않는다

원문은 Rotation Composer의 `Target Offset`을 "타겟으로부터의 X, Y, Z 상대적
거리 / 타겟의 위치를 기준으로 카메라 위치 조정"이라고 설명했는데, **카메라
위치를 조정하는 값이 아니다.** 공식 정의는 이렇다.

> Offset from the center of the Look At target, in target-local space.

Rotation Composer는 회전 제어 모듈이므로, 이 값은 **카메라가 바라보는
지점**을 타겟 로컬 공간에서 옮긴다. 캐릭터의 발밑이 아니라 머리 위쪽을 보게
하고 싶을 때 쓰는 값이다. 카메라의 위치를 옮기는 건 `Cinemachine Follow` 쪽의
`Follow Offset`이다.

이름이 비슷해서 헷갈리기 쉬운데, **`Follow Offset`은 카메라가 서는 자리,
`Target Offset`은 카메라가 보는 자리**로 외워두면 안 섞인다.

## 같은 이름의 Damping이 두 개다

두 모듈 모두 `Damping`을 가지고 있어서 이것도 헷갈리는 지점이다. 하는 일이
다르다.

- **Follow의 Position Damping** — "How responsively the camera tries to
  maintain the offset in the x, y, and z axes." 카메라가 정해진 자리로
  얼마나 빨리 붙는가.
- **Follow의 Rotation Damping** — "How responsively the camera tracks the
  target's pitch, yaw, and roll." 타겟의 회전을 얼마나 빨리 따라가는가.
  Binding Mode가 오프셋을 해석하는 좌표계를 정한다는 정의를 그대로 따라가면,
  이 값은 **오프셋 프레임이 타겟 회전에 묶인 모드에서 의미가 있다.**
  `World Space`처럼 타겟 회전을 안 쓰는 모드에서는 돌릴 프레임 자체가 없다.
- **Rotation Composer의 Damping** — 화면 안에서 타겟을 얼마나 빨리 원하는
  구도에 맞추는가. 카메라의 위치가 아니라 시선의 반응 속도다.

카메라가 굼뜨게 느껴질 때 어느 쪽을 건드려야 하는지가 여기서 갈린다.
**따라오는 게 느리면 Follow 쪽, 화면 중앙에 오는 게 느리면 Composer 쪽**이다.

## Cinemachine 2 자료를 볼 때

이 주제로 한국어 자료를 찾으면 Cinemachine 2 기준 글이 많이 섞여 나온다.
컴포넌트 이름이 통째로 바뀌었기 때문에 이름부터 안 맞는다. 3.1 문서의
매핑은 이렇다.

| Cinemachine 2 | Cinemachine 3 |
| --- | --- |
| CinemachineVirtualCamera | CinemachineCamera |
| CinemachineTransposer | CinemachineFollow |
| CinemachineComposer | CinemachineRotationComposer |
| CinemachineFramingTransposer | CinemachinePositionComposer |
| CinemachineOrbitalTransposer | CinemachineOrbitalFollow |
| CinemachinePOV | CinemachinePanTilt |

네임스페이스도 `Cinemachine`에서 `Unity.Cinemachine`으로 바뀌었다. 그리고
구조 자체가 달라졌는데, 3부터는 파이프라인 컴포넌트가 숨겨진 자식
오브젝트가 아니라 **카메라 게임오브젝트에 직접 붙는다.** 2 시절 스크린샷에
보이던 숨은 자식이 3에는 없다.

원문은 2024년 12월 글이고 이미 Cinemachine 3 이름을 쓰고 있어서 이 부분은
그대로 따라가도 된다.

## 정리

- Follow Camera 프리셋 = `CinemachineCamera` + `Cinemachine Follow`(위치) +
  `Cinemachine Rotation Composer`(회전). 위치와 회전 모듈이 분리된 게
  Cinemachine 3의 구조다.
- **Binding Mode는 회전 모드가 아니라 `Follow Offset`을 해석할 좌표계를
  정하는 값이다.** 타겟 회전을 얼마나 가져다 쓰는지의 스펙트럼으로 보면
  여섯 모드가 한 줄로 정렬된다.
- **어떤 Binding Mode도 마우스 입력으로 회전하지 않는다.** Cinemachine
  카메라는 입력을 직접 처리하지 않고 축을 노출할 뿐이며, 마우스로 돌리려면
  `Orbital Follow`·`Pan Tilt` 같은 컴포넌트와
  `Cinemachine Input Axis Controller`가 필요하다.
- Rotation Composer의 **`Target Offset`은 카메라가 보는 지점**을 옮긴다.
  카메라가 서는 자리는 Follow의 `Follow Offset`이다.
- `Damping`이 두 모듈에 다 있다. 따라오는 속도는 Follow, 프레이밍 속도는
  Composer.
- Cinemachine 2 자료는 컴포넌트 이름부터 다르다. `Transposer` → `Follow`,
  `Composer` → `Rotation Composer` 매핑을 알고 봐야 한다.

## 참고

- [Cinemachine Follow component — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineFollow.html)
- [Binding Modes — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.0/manual/CinemachineBindingModes.html)
- [Cinemachine Rotation Composer — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineRotationComposer.html)
- [Cinemachine Input Axis Controller — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineInputAxisController.html)
- [Follow and frame a character — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/setup-follow-camera.html)
- [What's new in Cinemachine 3 — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/whats-new.html)
- 원문: [\[Cinemachine\] 타겟 기반 시점 구현](https://gus6615.tistory.com/114)
