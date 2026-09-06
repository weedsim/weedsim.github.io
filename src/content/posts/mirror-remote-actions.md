---
pubDatetime: 2026-09-06T19:00:00+09:00
title: "Mirror의 Command와 RPC: 서버에서 실행된다는 게 안전하다는 뜻은 아니다"
lang: ko
translationKey: mirror-remote-actions
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - C#
  - 보안
description: "Mirror의 Command, ClientRpc, TargetRpc를 정리한 글을 다시 봤다. 접두사 규칙과 인자 타입이 지금과 다르고, 무엇보다 예제 코드가 서버 권위를 무력화하는 패턴을 그대로 담고 있다."
---

멀티 게임 개발 프로젝트에 Mirror를 붙여 쓰던 중이었다. 클라이언트에서 뭔가를
하면 그게 서버를 거쳐 다른 클라이언트까지 어떤 경로로 가는지, 그리고 그 경로를
코드로 어떻게 쓰는지 알아보다가 원격 호출 — Command, ClientRpc, TargetRpc — 를
정리한
[글](https://bakcoding.github.io/mirror/network-mirror-015-guide-Communications-rpc/)을
스크랩해뒀었다. 공식 가이드를 한국어로 옮기고 예제까지 붙인 글이라 세 개의
방향을 잡기에 좋다.

다만 2022년 글이라 **접두사 규칙과 인자 타입이 지금과 다르고**, 그보다
중요한 게 하나 더 있다. **예제 코드가 서버 권위를 무력화하는 패턴을 그대로
담고 있다.** 원문 잘못이라기보다 공식 문서 예제를 그대로 옮긴 결과인데,
그대로 따라 쓰면 곤란한 자리라 짚어둔다.

## 목차

## 세 가지 방향

원격 호출은 방향으로 나뉜다.

| 속성 | 방향 | 받는 쪽 |
| --- | --- | --- |
| `[Command]` | 클라이언트 → 서버 | 서버의 해당 오브젝트 |
| `[ClientRpc]` | 서버 → 클라이언트 | 그 오브젝트의 **모든 관찰자** |
| `[TargetRpc]` | 서버 → 클라이언트 | **지정한 연결 하나** |

세 가지 다 **로컬 함수 호출처럼 보이지만 로컬에서 실행되지 않는다.** 원문의
표현대로 "메서드를 호출하는 코드를 읽을 때의 힌트"일 뿐이고, 실제로는 인자가
직렬화되어 네트워크를 건너간다.

`ClientRpc`에 대해 원문이 짚는 것 중 유용한 게 두 가지 있다.

- **호스트 모드에서도 로컬 클라이언트에서 호출된다.** 서버와 같은
  프로세스여도 동작이 원격 클라이언트와 같다. 호스트에서만 되는 코드를
  만들지 않게 해주는 성질이다.
- **관찰자에게만 간다.** 네트워크 가시성 밖의 클라이언트는 못 받는다.
  `[ClientRpc(includeOwner = false)]`로 소유자를 뺄 수도 있다.

`TargetRpc`의 대상 결정 규칙도 명확하다. **첫 인자가 연결 타입이면 그
연결로 가고, 아니면 그 오브젝트의 소유자에게 간다.**

## 접두사는 규칙이지 강제가 아니다

원문 안에서 서술이 엇갈린다. 앞에서는 이렇게 적는다.

> \[Command\] 사용자 지정 속성을 추가하고 **선택적으로** 명명 규칙을 위한
> Cmd 접두사를 추가한다.

그런데 바로 다음 문단에서는 이렇게 적는다.

> Commands 함수에는 접두사 Cmd가 **있어야 하며**

**뒤쪽이 틀렸다.** 현재 Mirror 문서의 표현은 "should"다.

> Command functions **should** have the prefix 'Cmd' and cannot be static.
> This is a hint when reading code

`ClientRpc`의 `Rpc`, `TargetRpc`의 `Target`도 마찬가지로 권장 규칙이다.
컴파일이 막히지 않는다.

옛 UNET 시절에는 접두사가 실제로 강제였고, 그 기억이 남아 있는 자료가 많다.
지금은 **읽는 사람을 위한 표기 규칙**이다. 그렇다고 안 붙일 이유는 없다.
`DropCube()`와 `CmdDropCube()`는 호출부에서 완전히 다른 의미이므로, 이름에
드러나는 편이 낫다. 반면 `static`이 될 수 없다는 제약은 지금도 진짜다.

## `TargetRpc`의 첫 인자 타입

원문 예제는 이렇게 되어 있다.

```csharp
[TargetRpc]
public void TargetDoMagic(NetworkConnection target, int damage) { }
```

현재 Mirror 문서의 예제는 **`NetworkConnectionToClient`**를 쓴다. 문서 본문의
설명 문장에는 여전히 `NetworkConnection`이 남아 있어서 문서 자체도 섞여
있는데, 코드 쪽을 따르는 게 맞다. 서버에서 클라이언트로 보내는 것이므로
"클라이언트로 향하는 연결"이라는 타입이 의미상으로도 정확하다.

## 서버에서 실행된다는 게 안전하다는 뜻은 아니다

여기가 이 글에서 제일 하고 싶은 이야기다. 원문의 `CmdMagic` 예제를 보자.

```csharp
[Command]
void CmdMagic(GameObject target, int damage)
{
    target.GetComponent<Player>().health -= damage;
    // ...
}
```

Command이므로 이 코드는 **서버에서 실행된다.** 그래서 안전해 보인다. 그런데
`damage` 값이 어디서 왔는지 보자. **클라이언트가 보낸 것이다.**

Command는 "어디서 실행되는가"를 서버로 옮겨줄 뿐, **"어떤 값으로 실행되는가"는
여전히 클라이언트가 정한다.** 메모리를 조작한 클라이언트가
`CmdMagic(target, 999999)`를 보내면 서버는 그대로 실행한다. 서버 권위 구조를
써놓고 권위가 없는 상태다.

같은 예제의 `CmdHealMe`도 마찬가지 성질이다. 이쪽은 `health += 10`으로 값이
서버 코드에 박혀 있어서 안전한데, **그 차이가 우연이 아니라 설계의 핵심**이다.

정리하면 이렇게 된다.

- **클라이언트가 보내도 되는 것** — 의도. "공격했다", "이 대상을 골랐다",
  "이 스킬을 썼다".
- **서버가 정해야 하는 것** — 결과. 피해량, 쿨다운, 사거리 안인지, 그 스킬을
  쓸 자원이 있는지.

고치면 이런 모양이 된다.

```csharp
[Command]
void CmdCastSpell(GameObject target, int spellId)
{
    // 클라이언트는 "무엇을 시전했는지"만 보낸다
    if (!CanCast(spellId)) return;              // 자원·쿨다운 검사
    if (!InRange(target)) return;               // 사거리 검사

    int damage = GetSpellDamage(spellId);       // 피해량은 서버가 정한다
    target.GetComponent<Player>().health -= damage;
}
```

공식 문서 예제가 이렇게 안 되어 있는 건 **API 설명이 목적이기 때문**이다.
검증 코드를 넣으면 `[Command]`가 무엇을 하는지가 안 보인다. 문제는 그 예제가
그대로 복사되어 프로젝트에 들어간다는 것이고, 원문도 같은 예제를 옮겼다.

Mirror의 권위 모델도 이 구분을 뒷받침한다.

> When a client has authority over an object it means that they can call
> Commands and that the object will automatically be destroyed when the client
> disconnects.

**권위가 답해주는 질문은 "이 오브젝트를 누가 소유하는가"이지 "이 값이
타당한가"가 아니다.** 후자는 내가 짜야 한다.

참고로 소유권 확인 자체도 절대적인 방어선은 아니다. 2023년에 보안 연구자들이
Mirror의 KCP 트랜스포트에서 UDP 스푸핑으로 **다른 플레이어를 사칭해 Command를
호출할 수 있다**는 것을 보였다. 당시 연결 식별이 IP·포트 해시에 의존했기
때문이다. 이후 Mirror는 secure cookie를 백포트했고 암호화 트랜스포트를
작업했지만, **서버 측 값 검증은 그런 것과 무관하게 필요하다**는 근거로는
충분하다.

## `requiresAuthority = false`가 여는 문

원문은 이 옵션을 이렇게만 소개한다.

> 권한 확인을 생략할 수 있는 방법
>
> ```
> [Command(requiresAuthority = false)]
> ```

맞는 설명이지만 **절반이다.** 이 옵션을 켜면 소유하지 않은 오브젝트에도
Command를 부를 수 있게 된다. 공용 문, 상점 NPC, 월드 스위치처럼 아무도
소유하지 않은 오브젝트를 다룰 때 필요하다.

문제는 **그 순간 "누가 불렀는가"를 Mirror가 검사해주지 않는다는 것**이다.
그래서 내가 확인해야 하고, 도구도 문서에 있다.

> You can include an optional `NetworkConnectionToClient sender = null`
> parameter in the Command method signature and Mirror will fill in the
> sending client for you.

문서의 예제가 정확히 그 용법이다.

```csharp
[Command(requiresAuthority = false)]
public void CmdSetDoorState(NetworkConnectionToClient sender = null)
{
    bool hasDoorKey = sender.identity.GetComponent<PlayerState>().hasDoorKey;
    // ...
}
```

**`requiresAuthority = false`와 `sender` 검사는 한 쌍으로 다뤄야 한다.**
앞의 것만 켜고 뒤를 빼면, 아무 클라이언트나 아무 오브젝트의 Command를 부를 수
있는 상태가 된다. 원문이 앞의 것만 소개하고 뒤를 뺀 게 이 글에서 정정할
마지막 항목이다.

## 인자로 넘길 수 있는 것과 없는 것

원문의 마지막 문장이다.

> Remote Actions에 대한 인수는 스크립트 인스턴스 또는 Transform과 같은 게임
> 오브젝트의 하위 구성 요소가 될 수 없다.

현재 문서도 같다. 인자는 "cannot be sub-components of game objects, such as
script instances or Transforms"다.

그런데 예제에서는 `GameObject target`을 넘긴다. 모순처럼 보이지만 아니다.
**`GameObject`와 `NetworkIdentity`는 넘길 수 있고, 그 하위 컴포넌트는 안
된다.** 네트워크를 건너는 건 오브젝트 자체가 아니라 `netId`이고, 받는 쪽은
그 id로 자기 세계의 오브젝트를 찾는다. `Transform`이나 내가 만든
`MonoBehaviour`에는 그런 식별자가 없으니 보낼 방법이 없다.

그래서 실무 규칙이 나온다. **컴포넌트가 필요하면 `GameObject`나
`NetworkIdentity`를 넘기고 받는 쪽에서 `GetComponent`를 한다.** 원문 예제가
하는 것도 정확히 그것이다.

## 트래픽

원문이 짚은 경고 하나는 지금도 유효하다.

> 프레임마다 클라이언트에서 명령을 보내기 때문에 많은 네트워크 트래픽이
> 발생할 수 있으니 주의해야 한다.

`Update`에서 조건 없이 Command를 부르면 초당 수십 개가 나간다. 이동처럼
연속적인 입력은 Command로 매 프레임 보내는 게 아니라, 상태 동기화나 예측
쪽으로 푸는 문제다. 그 이야기는
[Mirror의 클라이언트 사이드 예측](/posts/mirror-client-side-prediction/)에서
따로 정리했다.

## 정리

- 원격 호출은 방향으로 나뉜다. `Command`(클라 → 서버),
  `ClientRpc`(서버 → 모든 관찰자), `TargetRpc`(서버 → 지정한 연결 하나).
- **접두사 `Cmd`/`Rpc`/`Target`은 권장 규칙이지 강제가 아니다.** 원문이 한
  문단 안에서 "선택적"과 "있어야 하며"로 엇갈린다. `static`이 될 수 없다는
  제약은 진짜다.
- `TargetRpc`의 첫 인자는 현재 예제 기준 **`NetworkConnectionToClient`**다.
- **Command가 서버에서 실행된다는 것과 안전하다는 것은 다르다.** 실행 위치만
  서버로 옮겨질 뿐 인자는 클라이언트가 정한다. **클라이언트는 의도를 보내고,
  결과는 서버가 계산해야 한다.**
- 권위는 "이 오브젝트를 누가 소유하는가"에 답할 뿐 "이 값이 타당한가"에는
  답하지 않는다.
- **`requiresAuthority = false`는 `sender` 검사와 한 쌍이다.** Mirror가
  `NetworkConnectionToClient sender = null`로 호출자를 채워준다.
- 인자로 `GameObject`·`NetworkIdentity`는 되고 `Transform`이나 스크립트
  인스턴스는 안 된다. `netId`로 건너가기 때문이다.
- `Update`에서 무조건 Command를 부르면 트래픽이 폭증한다.

세 개 중 무엇을 쓸지는 위의 표만 보면 정해진다. 정작 손이 더 가야 하는 곳은 그
다음이다. **서버로 넘어온 값을 믿을지 말지는 프레임워크가 정해주지 않는다.**

## 참고

- [Remote Actions — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/communications/remote-actions)
- [Authority — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/authority)
- [Impersonating Other Players with UDP Spoofing in Mirror — Include Security](https://blog.includesecurity.com/2023/04/impersonating-local-unity-players-with-udp-spoofing-in-mirror/)
- 원문: [Mirror Guide Communications - Remote Actions](https://bakcoding.github.io/mirror/network-mirror-015-guide-Communications-rpc/)
