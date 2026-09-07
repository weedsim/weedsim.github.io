---
pubDatetime: 2026-09-07T19:00:00+09:00
title: "Mirror 설계 패턴 글의 예제가 씬 전환에서 깨지는 이유"
lang: ko
translationKey: mirror-network-design-patterns
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - C#
  - 게임 서버
description: "Mirror의 올바른 설계 패턴을 정리한 글을 확인했다. 큰 그림은 맞는데 마지막 예제가 SceneManager.LoadScene을 부른다. 늦게 들어온 클라이언트가 엉뚱한 씬을 받는다."
---

Mirror가 목적이 아니라 **서버와 네트워크를 어떻게 설계하는지** 자체가 궁금해서
찾아보던 중에 걸린
[글](https://thenight-avicii.tistory.com/221)이다. 요청과 응답을 어디에 두고
상태를 어디서 바꿀지를 Command / ClientRpc / TargetRpc / SyncVar 네 가지로
나누고, 로비에서 준비 버튼을 누르면 게임이 시작되는 전체 흐름까지 붙여놨다.
특정 라이브러리의 사용법이 아니라 **역할을 어떻게 가르는지**를 보여주는
구성이라 그 목적에 맞았다.

큰 그림은 맞다. 다만 **"올바른 패턴"이라는 제목으로 제시된 마지막 예제 하나가
실제로 문제를 일으킨다.** 그리고 단정적으로 적힌 규칙 중 둘은 지금 Mirror에서
사실이 아니다.

## 목차

## 큰 그림은 맞다

원문의 한 줄 요약은 이렇다.

> 🔁 **"데이터는 SyncVar로, 행동은 Command → Rpc로"**

방향 정리도 정확하다. 클라이언트의 요청은 `[Command]`, 모두에게 알릴 것은
`[ClientRpc]`, 한 명에게만 보낼 것은 `[TargetRpc]`, 값 자체가 따라와야 하면
`SyncVar`. 넷의 역할이 겹치지 않게 나뉘어 있고, "행동"과 "데이터"를 가르는
기준도 실제로 쓸 만하다.

아래는 그 골격을 부정하는 이야기가 아니라, **골격에 맞춰 짠 예제가 어디서
새는지**에 대한 이야기다.

## `TargetRpc`의 연결 인자는 필수가 아니다

원문은 이렇게 적는다.

> - **서버 → 특정 클라이언트만** 실행
> - 첫 번째 인자로 NetworkConnection **필수**

```csharp
[TargetRpc]
void TargetSendErrorMessage(NetworkConnection conn, string msg) { }
```

**필수가 아니다.** 문서의 규칙은 조건문이다.

> If the first parameter of your TargetRpc method is a `NetworkConnection` then
> that's the connection that will receive the message regardless of context. If
> the first parameter is any other type, then the owner client of the object
> with the script containing your TargetRpc will receive the message.

즉 연결 인자를 **빼면 그 오브젝트의 소유자에게 간다.** 문서의 `TargetHealed`
예제가 그 형태다.

```csharp
[TargetRpc]
void TargetShowMessage(string msg) { }   // 이 오브젝트의 소유자에게 간다
```

이게 왜 중요하냐면, 플레이어 오브젝트에 붙은 스크립트에서 **그 플레이어에게**
보내는 게 `TargetRpc`의 가장 흔한 용도이기 때문이다. 그 경우 연결을 구해다
넘기는 코드가 통째로 필요 없다. "필수"라고 알고 있으면 `connectionToClient`를
찾아 넘기는 군더더기를 매번 쓰게 된다.

인자 타입도 현재 예제 기준으로는 `NetworkConnectionToClient`다. 그쪽은
[Command와 RPC 글](/posts/mirror-remote-actions/)에서 따로 정리했다.

## `SyncVar`는 클라이언트도 쓸 수 있다

원문의 단정이다.

> ❗ SyncVar는 **서버에서만 값 변경 가능**
>
> 클라이언트가 변경하려면 → \[Command\]로 서버에 요청 → 서버에서 변경

기본값 기준으로는 맞다. 하지만 Mirror에는 방향을 바꾸는 설정이 있다.

```csharp
public enum SyncDirection { ServerToClient, ClientToServer }

[Tooltip("Server Authority calls OnSerialize on the server and syncs it to clients.\n\nClient Authority calls OnSerialize on the owning client, syncs it to server, which then broadcasts it to all other clients.\n\nUse server authority for cheat safety.")]
[HideInInspector] public SyncDirection syncDirection = SyncDirection.ServerToClient;
```

`NetworkBehaviour`마다 있는 값이고 기본은 `ServerToClient`다. `ClientToServer`로
두면 **소유한 클라이언트가 직접 쓰고, 서버가 그걸 받아 나머지에게 뿌린다.**
조건이 둘 다 필요하다 — 방향이 `ClientToServer`이고, **그 오브젝트를 그
클라이언트가 소유해야 한다.**

다만 툴팁의 마지막 줄이 결론을 대신한다.

> **Use server authority for cheat safety.**

그러니 원문의 조언 자체는 여전히 좋은 조언이다. 틀린 건 **"가능하지 않다"고
쓴 부분**이다. 할 수 있는데 권하지 않는 것과, 할 수 없는 것은 다르다. 전자는
"닉네임처럼 남이 조작해도 상관없는 값은 방향을 돌려도 된다"는 판단으로 이어질 수
있고, 후자로 알고 있으면 그 선택지가 없다.

## 씬 전환이 문제다

여기가 실제로 깨지는 자리다. 원문의 마지막 예제다.

```csharp
[Server]
public void CheckAllReady()
{
    if (allReady)
        RpcStartGame();
}

[ClientRpc]
public void RpcStartGame()
{
    SceneManager.LoadScene("GameScene");
}
```

**동작하는 것처럼 보인다.** 그 순간 접속해 있는 클라이언트는 전부 RPC를 받고
전부 씬을 넘긴다. 문제는 그 다음에 들어오는 사람이다.

`NetworkManager`의 `networkSceneName` 주석이 이걸 정확히 짚는다.

> The name of the current network scene. set by NetworkManager when changing the
> scene. **new clients will automatically load this scene. Loading a scene
> manually won't set it.**

새로 접속한 클라이언트는 `networkSceneName`을 보고 씬을 따라간다. 그런데
`SceneManager.LoadScene`으로 직접 넘기면 **그 값이 갱신되지 않는다.** 서버와
기존 클라이언트는 GameScene에 있는데, 나중에 들어온 클라이언트는 여전히 로비
씬을 받는다. 서로 다른 씬에 앉아 있으니 스폰도 동기화도 어긋난다.

써야 할 것은 따로 있다.

> **ServerChangeScene** — Change the server scene and all client's scenes across
> the network. Called automatically if onlineScene or offlineScene are set, but
> it can be called from user code to switch scenes again while the game is in
> progress.

"게임 진행 중에 다시 씬을 바꾸려고 유저 코드에서 불러도 된다"고 명시되어 있다.
지금 상황이 정확히 그것이다. 고치면 RPC가 아예 필요 없어진다.

```csharp
[Server]
public void CheckAllReady()
{
    if (!allReady) return;
    NetworkManager.singleton.ServerChangeScene("GameScene");
}
```

**서버가 한 번 부르면 접속해 있는 클라이언트 전부와 이후 들어올 클라이언트까지
같은 씬을 보게 된다.** 원문의 방식은 "지금 있는 사람들에게 씬을 로드하라고
방송"하는 것이고, 이쪽은 "네트워크의 현재 씬을 바꾸는" 것이다. 결과가 겹쳐
보이지만 범위가 다르다.

원문이 왜 이렇게 됐는지는 짐작이 간다. **`ClientRpc`는 "모두에게 알린다"는
목적에 딱 맞는 도구**라서, 씬 전환도 그 틀에 넣으면 자연스러워 보인다. 그런데
씬 전환은 Mirror가 이미 자기 상태로 관리하는 대상이라 그 틀 밖에 있다.

## "흔한 실수" 표가 섞여 있다

원문의 마지막 표다. 네 항목이 나란히 ❌로 적혀 있는데, **성격이 다른 것들이
섞여 있다.**

| 원문의 항목 | 실제 성격 |
| --- | --- |
| SyncVar 값을 클라이언트에서 바꿈 | 기본 설정에서는 안 되지만 `SyncDirection`으로 바꿀 수 있다 |
| Command를 로컬 플레이어 아닌 오브젝트에서 호출 | `requiresAuthority = false`라는 문서화된 예외가 있다 |
| TargetRpc에서 Command 호출 | 막히지 않는다. 설계 조언이다 |
| ClientRpc 안에서 다시 Command 호출 | 막히지 않는다. 설계 조언이다 |

앞의 둘은 문서에 예외가 적혀 있는 규칙이고, 뒤의 둘은 컴파일러도 런타임도 막지
않는 조언이다. 원문은 뒤의 둘에 "호출 실패할 수 있음", "순환 호출 위험"이라고
적었는데, **왜 그런지가 없으면 규칙으로 기억할 수도 판단으로 쓸 수도 없다.**

`ClientRpc` 안에서 `Command`를 부르는 게 위험한 이유는 문법이 아니라 구조다.
서버가 뿌린 것을 받아 다시 서버로 되돌리면, 그걸 받은 서버가 또 뿌리게 짜기
쉽다. 클라이언트 수만큼 곱해져서 돌아온다. **금지 사항이라기보다 되먹임
루프를 만들기 쉬운 자리**로 알아두는 게 맞다.

`requiresAuthority = false`는 [Command와 RPC 글](/posts/mirror-remote-actions/)에서
따로 다뤘다. 소유하지 않은 오브젝트의 Command를 부르는 정식 경로이고, 대신
호출자 검사가 한 쌍으로 붙어야 한다.

## `[Server]`와 `[ServerCallback]`

원문 예제가 `[Server]`를 쓰는데 설명이 없다. 짝이 되는 속성이 넷이고 차이는
경고를 내느냐 하나다.

| 속성 | 의미 |
| --- | --- |
| `[Server]` | "Only a server can call the method (throws a warning when called on a client)." |
| `[ServerCallback]` | "Same as **Server** but does not throw a warning when called on client." |
| `[Client]` | "Only a Client can call the method (throws a warning when called on the server)." |
| `[ClientCallback]` | "Same as **Client** but does not throw a warning when called on server." |

**둘 다 실행을 막는 건 같고, 경고 로그만 다르다.** `Update`처럼 양쪽에서 매
프레임 도는 함수에 `[Server]`를 붙이면 클라이언트 콘솔이 경고로 가득 찬다.
그런 자리에 `[ServerCallback]`을 쓴다. 원문의 `CheckAllReady()`는 서버에서만
불리는 게 맞으니 `[Server]`가 적절하다 — 잘못 불렀을 때 알고 싶은 자리다.

## 이 설계도에 빠진 것

원문의 `Command` 예제다.

```csharp
[Command]
void CmdRequestReady()
{
    isReady = true;      // 서버에서만 작동할 로직
    RpcSetReadyUI();     // 클라이언트에 알림
}
```

준비 상태 토글이라 이 예제 자체는 문제가 없다. 다만 원문의 흐름도 — 버튼 →
Command → 상태 변경 → Rpc — 에는 **검사가 들어갈 자리가 그려져 있지 않다.**
"행동은 Command → Rpc로"라는 요약에 검증 단계가 없다.

준비 버튼이야 무해하지만, 같은 틀에 공격이나 구매를 넣으면 클라이언트가 보낸
값을 서버가 그대로 실행하는 구조가 된다. Command가 서버에서 실행된다는 것과
안전하다는 것은 다르다는 이야기는 [앞 글](/posts/mirror-remote-actions/)에
정리했다. 이 설계도에 한 단계를 더 넣는다면 그 자리다.

## 정리

- 방향 구분과 "데이터는 SyncVar, 행동은 Command → Rpc"라는 골격은 맞다.
- **`TargetRpc`의 연결 인자는 필수가 아니다.** 빼면 그 오브젝트의 소유자에게
  간다. 플레이어 본인에게 보내는 흔한 경우엔 인자가 필요 없다.
- **`SyncVar`를 클라이언트가 쓸 수 없는 게 아니다.**
  `SyncDirection.ClientToServer` + 소유권이면 된다. 툴팁이 "Use server
  authority for cheat safety"라고 덧붙일 뿐이다.
- **`RpcStartGame()` 안의 `SceneManager.LoadScene`은 실제로 깨진다.** 직접 로드는
  `networkSceneName`을 갱신하지 않아서 **늦게 들어온 클라이언트가 이전 씬을
  받는다.** `NetworkManager.singleton.ServerChangeScene()`을 쓴다.
- "흔한 실수" 네 항목 중 둘은 **문서화된 예외가 있는 규칙**이고 둘은 **막히지
  않는 설계 조언**이다. 같은 ❌로 묶여 있으면 구분이 안 된다.
- `[Server]`와 `[ServerCallback]`은 **실행 차단은 같고 경고 로그만 다르다.**

설계 패턴 글의 어려운 점이 여기 다 있다. **방향을 나누는 부분은 문서만 봐도
쓸 수 있는데, 그 방향에 안 들어가는 것들 — 씬 전환처럼 프레임워크가 이미 자기
상태로 관리하는 것 — 이 문제를 낸다.** 네 개의 상자를 만들어놓으면 모든 걸
그 안에 넣고 싶어진다.

## 참고

- [Remote Actions — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/communications/remote-actions)
- [Attributes — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [NetworkBehaviour.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkBehaviour.cs)
- [Mirror NetworkManager 인스펙터 다시 읽기](/posts/mirror-networkmanager-inspector/)
- 원문: [Mirror 네트워크 설계의 올바른 패턴](https://thenight-avicii.tistory.com/221)
