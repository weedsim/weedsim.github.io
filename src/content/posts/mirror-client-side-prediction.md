---
pubDatetime: 2026-09-03T19:00:00+09:00
title: "Mirror의 클라이언트 사이드 예측: Physics.Simulate 없이 되감기"
lang: ko
translationKey: mirror-client-side-prediction
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - 물리
description: "예측이 왜 필요하고 어떻게 동작하는지, 그리고 Mirror가 물리 씬 전체를 재시뮬레이션하지 않는 대신 무엇을 포기했는지 정리했다. 문서가 2024년 3월에 멈춰 있다는 점과 그 사이 코드는 계속 움직였다는 점도 함께."
---

멀티플레이 게임 프로젝트에 Mirror를 적용해서 쓰고 있다. 붙여서 돌리다 보니
그 아래에서 **네트워크 동기화가 실제로 어떤 식으로 이뤄지는지**가 궁금해졌고,
그래서 찾아본 자료 중 하나로 Mirror의
[Client Side Prediction 문서](https://mirror-networking.gitbook.io/docs/manual/general/client-side-prediction)를
스크랩해뒀었다. 네트워크 게임에서 입력에 즉각 반응하게 만드는 기법인
클라이언트 사이드 예측을, 당구(Billiards) 예제로 처음부터 설명하는 글이다.

설명이 좋다. 왜 필요한지, 순진한 해법이 왜 전부 깨지는지, 그래서 결국 어떤
구조로 가게 되는지를 순서대로 밟는다. 다만 지금 이 문서를 읽는다면 짚고
가야 할 게 세 가지 있다. **결정론에 대한 설명이 부정확한 것**, **Smooth
모드에 조용히 실패하는 함정이 있다는 것**, 그리고 무엇보다 **문서 자체가
2024년 3월에 멈춰 있다는 것**이다.

## 목차

## 예측이 필요한 경우와 필요 없는 경우

문제는 단순하다. 서버 권위 구조에서 클라이언트가 입력을 넣으면 이렇게 된다.

- 클라이언트가 서버로 `[Command] CmdApplyForce(force)` 전송 (50ms)
- 서버가 `Rigidbody.AddForce(force)` 실행
- 서버가 갱신된 위치를 클라이언트로 동기화 (50ms)
- 클라이언트는 **100ms 뒤에야** 결과를 본다

문서가 먼저 강조하는 건 이게 항상 문제는 아니라는 점이다.

> if this is not a problem in your game, then you **don't need prediction!**

카드 게임, 전략 게임, 2000년대 MMO는 50ms 기다려도 괜찮았다. 반대로 슈터,
VR, 당구 같은 물리 게임은 이 지연이 그대로 조작감으로 드러난다. **예측은
공짜가 아니므로, 필요한지부터 판단하는 게 먼저다.**

## 순진한 해법이 전부 깨지는 순서

문서가 좋은 건 바로 정답으로 가지 않고 틀린 길을 먼저 밟는다는 점이다.

**1. 클라이언트에서만 즉시 적용한다** → 서버도 다른 클라이언트도 모른다.

**2. 로컬에도 적용하고 서버에도 보낸다** → 물리 결과가 갈라진다. 이게 핵심
문제다.

**3. 서버 상태가 오면 그걸로 하드 보정한다** → 도착한 상태는 이미 100ms 전
것이다. 클라이언트는 그 사이 앞으로 나갔으므로 (1) 항상 어긋나 있고
(2) 보정할 때마다 공이 눈에 띄게 뒤로 튄다.

여기까지 오면 답이 보인다. **클라이언트가 자기 과거를 기억하고 있어야 한다.**

## 결정론 이야기를 정확히 하기

2번이 깨지는 이유를 문서는 이렇게 설명한다.

> most Physics engines (including Unity's PhysX) are **not deterministic**

여기까지는 맞다. 문제는 그다음이다.

> The reason for it is that 'floating-point' operations aren't deterministic.
> If we calculate `Rigidbody.position += Vector2.up` on two different
> machines, we get ever so slightly different results.

**결론은 맞지만 원인 설명이 부정확하다.** IEEE 754는 덧셈·뺄셈·곱셈·나눗셈·
제곱근을 정확히 반올림하도록 규정한다. 같은 입력에 같은 정밀도와 반올림
모드라면 `position += Vector2.up` 같은 단순 덧셈은 어느 기계에서 하든 같은
값이 나온다. 부동소수점 연산 **자체**가 비결정적인 게 아니다.

실제 원인은 그 아래층에 있다. Unity의 공식 설명이 이 지점을 정확히 짚는다.

> 2D physics in Unity can be deterministic on the same machine, but not across
> different machines.

> Different compilers and different processors implement floating point math
> differently, which affects the results of the simulation.

즉 **연산의 정의가 아니라 구현이 갈린다.** 컴파일러가 곱셈과 덧셈을 FMA로
합치는지, SIMD 폭이 얼마인지, 초월함수(`sin`, `cos`)를 어떤 근사로 계산하는지,
그리고 물리 엔진이라면 **솔버가 멀티스레드로 도는 순서**까지가 전부 결과를
바꾼다.

말장난처럼 보이지만 실질적인 차이가 있다.

- **같은 기계, 같은 빌드의 리플레이는 재현된다.** Unity도 "reloading the same
  Scene on the same machine"을 결정적 시뮬레이션의 방법으로 든다. 부동소수점
  자체가 비결정적이라면 이것도 성립하지 않아야 한다.
- **고정소수점이나 소프트 플로트로 결정론을 만드는 접근이 성립하는 이유**도
  여기 있다. 구현을 내가 고정하면 플랫폼 차이가 사라진다. 문서가 "fixed-point
  numbers ... effectively need twice as many operations"라며 비용을 지적한
  부분은 맞지만, 그게 가능한 이유는 원인이 구현층에 있기 때문이다.

문서의 실무적 결론 — 크로스 플랫폼 결정론에 기대지 말 것 — 은 그대로 유효하다.

## 예측의 실제 구조

해법은 클라이언트가 위치 히스토리를 들고 있는 것이다.

- 클라이언트가 즉시 `AddForce` 실행
- *클라이언트가 50ms마다 위치를 저장*
- 서버로 커맨드 전송 (50ms) → 서버도 실행 → 상태 동기화 (50ms)
- 클라이언트는 **100ms 전 히스토리와** 비교한다

이렇게 하면 서버 상태가 50ms 뒤에 오든 150ms 뒤에 오든 상관없다. 해당 시점의
히스토리를 꺼내 비교하면 된다.

보정은 과거를 고친 뒤 그 위에 델타를 다시 얹는 방식이다. 공이 `(1,2,0)`에
있었고 그 뒤로 조금 앞·오른쪽으로 움직였다면, 과거를 `(1.1,2,0)`으로 고치고
그 위에 '조금 앞'과 '조금 오른쪽'을 다시 적용한다. 문서의 요약이 정확하다.

> Prediction works by **keeping** a history, **correcting** the past and
> **rewinding** the deltas on top.

## Mirror가 남들과 다르게 한 것

전통적인 예측 구현은 보정할 때 **물리 씬 전체를 되감고 다시 시뮬레이션**한다.
`Physics.Simulate()`를 여러 번 호출해 100ms 전, 50ms 전, 25ms 전을 차례로
다시 돌리는 식이다. 가장 정확하지만 CPU를 크게 먹고 씬이 커지면 감당이 안 된다.

Mirror는 이걸 안 한다.

> Mirror's prediction runs without `Physics.Simulate()`.

대신 `Rigidbody`의 position·rotation·velocity·angularVelocity를 **C# 코드로
직접 재계산**한다. 물리 엔진 밖에서 손으로 되감는 것이다.

이 선택의 배경도 문서에 적혀 있다. 수천 개의 예측 대상 Rigidbody가 있는 물리
씬을 만들려던 스튜디오와 함께 개발했고, 그 규모에서는 `Physics.Simulate()`가
애초에 선택지가 아니었다는 것이다. 대신 이런 전제를 깔았다. **씬에 수천 개가
있어도 로컬 플레이어가 동시에 건드리는 건 몇 개뿐이다.**

그래서 성질이 이렇게 정리된다.

> Our algorithm **sacrifices accuracy for performance!**

> Mirror's prediction works **really well** for **large physics scenes** where
> the player only **interacts** **with a few objects** at a time.

파괴 연출처럼 수천 개와 동시에 상호작용하는 게임이라면 전제가 깨진다.
문서도 "It may or may not work for your game"이라고 적어뒀다.

참고로 이 구현에 들어간 시간이 문서에 그대로 나온다. 당구 예제를 쓸 만하게
만드는 데 4개월, 실제 게임에 이식하며 콜라이더·조인트·자식 Rigidbody 지원을
붙이는 데 다시 3개월이다. **손으로 물리를 되감는다는 게 어느 정도 일인지**를
보여주는 숫자다.

## 붙이는 법, 그리고 Smooth 모드의 함정

붙이는 것 자체는 짧다. 프리팹에 `PredictedRigidbody`를 붙이고, 클라이언트에서
즉시 시뮬레이션하면서 서버로도 보내면 된다.

```csharp
void HandleClick()
{
    // Smooth 모드에서도 안전하게 Rigidbody를 얻는 방법
    Rigidbody rb = GetComponent<PredictedRigidbody>().predictedRigidbody;
    rb.AddForce(force);   // 클라이언트에서 즉시
    CmdAddForce(force);   // 서버에도 알린다
}

[Command]
void CmdAddForce(Vector3 force)
{
    // 서버에서는 Rigidbody가 항상 원본 오브젝트에 남아 있다
    GetComponent<Rigidbody>().AddForce(force);
}
```

문제는 스무딩 모드다. 두 가지가 있다.

- **Smooth** — Rigidbody와 Collider를 보이지 않는 고스트 오브젝트로 옮기고,
  렌더러는 원본에 남아 고스트를 부드럽게 따라간다. 결과가 매끄럽지만 고스트를
  만들고 없애는 비용이 든다.
- **Fast** — 전부 원본 오브젝트에 남는다. 더 딱딱해 보이지만 훨씬 빠르다.

`Smooth`를 고르면 **예측 중에는 컴포넌트가 원본 오브젝트에 없다.** 문서가
직접 나열한다.

> `GetComponent<Rigidbody>()` won't always be available while predicting.
>
> `GetComponent<Collider>()` won't always be available while predicting.
>
> `OnCollisionEnter/Exit()` won't always be called while predicting.
>
> `OnTriggerEnter/Exit()` won't always be called while predicting.

이건 예외가 나는 게 아니라 **조용히 아무 일도 안 일어나는** 종류의 문제다.
`GetComponent<Rigidbody>()`가 `null`을 반환하면 그나마 낫고, 충돌 콜백이 안
불리는 건 로그도 안 남는다. 그래서 문서는 `PredictedRigidbody`를 거쳐
`predictedRigidbody`로 접근하라고 안내한다. 충돌 콜백은 상대 오브젝트 쪽으로
코드를 옮기고 `PredictedRigidbody.IsPredicted`로 원본을 되찾는 방식이다.

### 문서의 예제 코드에 오류가 있다

충돌 콜백 예제가 이렇게 되어 있다.

> ```
> void OnCollisionEnter(Collider collider)
> ```

**`OnCollisionEnter`의 인자 타입은 `Collider`가 아니라 `Collision`이다.**
Unity 문서가 이 둘을 명시적으로 구분한다.

> In contrast to OnTriggerEnter, OnCollisionEnter is passed the Collision class
> and not a Collider.

이게 성가신 이유는 Unity의 이 콜백들이 이름 기반으로 호출되기 때문이다.
시그니처가 맞지 않으면 컴파일은 통과하는데 **콜백이 영영 안 불린다.** 하필
이 절이 "충돌 콜백이 안 불리는 문제를 해결하는 법"을 설명하는 자리라, 그대로
복붙하면 원래 겪던 증상이 그대로 재현된다.

같은 스니펫의 `if` 문에는 닫는 괄호도 하나 빠져 있다. 이쪽은 컴파일 에러라
바로 드러난다. 두 가지를 합쳐 보면 이 예제는 컴파일해본 코드가 아닌 것으로
보인다.

`Collision`에서 상대 콜라이더를 꺼내 쓰면 된다.

```csharp
void OnCollisionEnter(Collision collision)
{
    if (PredictedRigidbody.IsPredicted(collision.collider,
                                       out PredictedRigidbody original))
    {
        Debug.Log($"Collided with {collision.collider} which belongs to {original}");
    }
}
```

## 2026년에 이 문서를 읽을 때

여기가 가장 중요하다. 이 문서는 지금도 첫 문단에서 이렇게 말한다.

> Mirror is currently experimenting with various Prediction algorithms. This is
> all purely experimental, we don't recommend using this just yet.

그리고 본문 곳곳이 **2024년 3월**에 멈춰 있다. 쌓인 오브젝트에 대해 "As of
March 2024, they generally sync well, but don't properly come to rest just
yet"라고 적혀 있고, 예측 기반 플레이어 이동은 "has not yet been tested
whatsoever"이며, 마지막 문장은 "Prediction will remain our focus for the rest
of the year 2024"다.

반면 Mirror 자체는 계속 움직였다. 현재 체인지로그는 **v97.0.0**까지 와 있고
`Predicted Rigidbody no longer resets ghost objects` 같은 수정이 들어간다.

정리하면 **코드는 갱신되는데 문서가 안 따라오는 상태**다. 이 문서만 보고
"아직 실험 단계니까 못 쓴다"고 판단하는 것도, 반대로 "설명대로 동작하겠지"라고
믿는 것도 위험하다. 실제로 검토한다면 문서가 아니라 저장소의 체인지로그와
`PredictedRigidbody.cs`, 그리고 `Examples/BilliardsPredicted`를 직접 봐야
한다.

## 예측이 필요하면 지금 뭘 쓰나

이미 Mirror를 쓰고 있더라도 주변 지형은 알아둘 값이 있다. Unity에서
선택지를 정리하면 이렇다.

- **Mirror `PredictedRigidbody`** — 실험 단계. Rigidbody 전용이고, 플레이어
  이동은 문서 기준 미검증이다. 저수준 알고리즘(`Prediction.cs`)은 범용이라
  다른 타입에도 쓸 수 있지만 "you *will* have to do some work"라고 문서가
  못 박는다.
- **Netcode for GameObjects** — 완전한 예측은 없고 그보다 가벼운 **anticipation**을
  제공한다. 공식 설명이 명확하다.

  > Netcode for GameObjects doesn't support full client-side prediction and
  > reconciliation, but it does support client anticipation

  `AnticipatedNetworkVariable<T>`와 `AnticipatedNetworkTransform`으로 서버
  권위 값과 화면에 보이는 값을 분리하고, 전체 롤백이 필요하면
  `OnReanticipate` 콜백에 직접 구현해 넣는 구조다.
- **FishNet** — 예측 기능을 별도로 제공하고, 외력이나 충돌에 대한 재시뮬레이션
  기반이다.
- **Netcode for Entities** — DOTS 스택이라면 완전한 예측·롤백을 갖추고 있다.
  대신 프로젝트 구조를 ECS로 가져가야 한다.

판단 기준은 결국 **무엇을 예측할 것인가**다. 물리 오브젝트 상호작용이면
Mirror의 접근이 흥미롭고, 플레이어 이동이 핵심이면 지금 Mirror 문서만 보고
가기는 이르다.

## 정리

- 예측은 조작 지연이 실제로 문제가 될 때만 필요하다. 문서가 먼저 이걸 짚는다.
- 로컬과 서버에서 물리를 각각 돌리면 갈라진다. 원인은 부동소수점 연산 자체가
  아니라 **컴파일러와 프로세서의 구현 차이**다. 같은 기계·같은 빌드의 재현은
  성립한다.
- 예측의 구조는 히스토리 보관 → 과거 보정 → 델타 재적용이다.
- Mirror는 `Physics.Simulate()`를 쓰지 않고 Rigidbody를 C#으로 직접 되감는다.
  정확도를 성능과 맞바꾼 선택이고, **씬은 크지만 동시에 만지는 건 적은** 게임을
  전제로 한다.
- `Smooth` 모드는 Rigidbody와 Collider를 고스트로 옮긴다. `GetComponent`와
  충돌 콜백이 조용히 안 먹는다.
- 문서의 `OnCollisionEnter(Collider)` 예제는 잘못됐다. 인자는 `Collision`이다.
- 문서는 2024년 3월에 멈춰 있고 코드는 v97.0.0까지 갔다. 검토한다면 저장소를
  직접 볼 것.

## 참고

- [Client Side Prediction — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/client-side-prediction)
- [Change Log — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/changelog)
- [Determinism with 2D Physics — Unity Support](https://support.unity.com/hc/en-us/articles/360015178512-Determinism-with-2D-Physics)
- [Collider.OnCollisionEnter — Unity](https://docs.unity3d.com/ScriptReference/Collider.OnCollisionEnter.html)
- [Client anticipation — Netcode for GameObjects](https://docs-multiplayer.unity3d.com/netcode/current/advanced-topics/client-anticipation/)
- [Prediction — Fish-Networking](https://fish-networking.gitbook.io/docs/guides/features/prediction)
