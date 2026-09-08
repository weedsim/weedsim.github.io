---
pubDatetime: 2026-09-08T17:00:00+09:00
title: "공식 문서를 스크랩했더니: Mirror 문서에 없는 메서드가 하나 적혀 있다"
lang: ko
translationKey: mirror-networkmanager-doc
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - C#
description: "이번 스크랩은 Mirror의 Network Manager 공식 문서 그 자체다. 대조할 원문이 없으니 문서를 소스와 대봤더니, 존재하지 않는 메서드 이름과 실제와 다르게 읽히는 문장이 나왔다."
---

프로젝트에 Mirror를 붙이면서 레퍼런스로 저장해둔 것이라 이번 스크랩은 좀
다르다. 블로그 글이 아니라 **Mirror의 Network Manager 공식 문서**
[페이지](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
그 자체다.

그러면 "원문이 맞는지" 대조할 대상이 없다. 이게 원문이니까. 그래서 이번에는
**문서를 Mirror 소스와 대봤다.** 레퍼런스로 쓸 문서라면 그 정도는 해볼 만하다.
결과가 셋이다. 문서에 **존재하지 않는 메서드 이름**이 하나 있고, 실제 동작과
다르게 읽히는 문장이 하나 있고, 문서가 경고하지만 **Mirror가 검사하지는 않는**
항목이 하나 있다.

## 목차

## 문서에 없는 메서드 이름

문서의 Customization 절 문장이다.

> When implementing these functions, be sure to take care of the functionality
> that the default implementations provide. For example, in `OnServerAddPlayer`,
> the function **`NetworkServer.AddPlayer`** must be called to activate the
> player game object for the connection.

**`NetworkServer.AddPlayer`라는 메서드는 없다.** 실제 이름은 이쪽이다.

```csharp
// 실제 시그니처 (NetworkServer.cs)
public static bool AddPlayerForConnection(NetworkConnectionToClient conn, GameObject player);
public static bool AddPlayerForConnection(NetworkConnectionToClient conn, GameObject player, uint assetId);
```

기본 구현도 이 이름을 부른다.

```csharp
public virtual void OnServerAddPlayer(NetworkConnectionToClient conn)
{
    Transform startPos = GetStartPosition();
    GameObject player = startPos != null
        ? Instantiate(playerPrefab, startPos.position, startPos.rotation)
        : Instantiate(playerPrefab);

    player.name = $"{playerPrefab.name} [connId={conn.connectionId}]";
    NetworkServer.AddPlayerForConnection(conn, player);
}
```

`AddPlayer`라는 이름 자체는 Mirror에 있다. **다른 클래스에 있고, 하는 일이
반대다.**

```csharp
// NetworkClient.cs
/// <summary>Sends AddPlayer message to the server, indicating that we want to join the world.</summary>
public static bool AddPlayer()
```

클라이언트가 서버에게 "들어가겠다"고 요청하는 메서드다. 서버가 플레이어를
연결에 등록하는 `AddPlayerForConnection`과는 방향도 역할도 다르다. 문서의
`NetworkServer.AddPlayer`는 **둘을 섞어놓은 이름**이다.

그대로 치면 컴파일이 안 되니 금방 알게 되긴 한다. 문제는 이름이 실재한다는
점이다. `AddPlayer`까지 입력하면 IDE가 `NetworkClient.AddPlayer()`를 제시하고,
`public static`이라 서버 쪽 코드에 써도 **컴파일은 된다.** 런타임에 조용히
어긋난다.

UNET 시절 이름이 남은 것도 아니다. UNET 매뉴얼도 같은 자리에서 이렇게 쓴다.

> Note that the function `NetworkServer.AddPlayerForConnection()` must be called
> for the newly created player GameObject, so that it is spawned and associated
> with the client's connection.

**공식 문서라고 API 이름까지 정확한 건 아니라는 것**이 이 항목의 쓸모다.

문장 자체가 말하는 내용은 중요하다. **오버라이드할 때 기본 구현이 하던 일을
직접 챙겨야 한다.** 위 기본 구현은 네 가지를 한다 — 시작 위치를 고르고,
프리팹을 인스턴스화하고, 디버깅용 이름을 붙이고, 연결에 플레이어로 등록한다.
마지막 줄을 빼먹으면 오브젝트는 생기는데 **아무의 플레이어도 아닌 상태**로
남는다.

## 양쪽 예시: 직업을 고르고 들어가기

두 이름이 실제로 어떻게 갈리는지는 한 흐름에 놓고 보는 게 빠르다. 로비에서
직업을 고르고 확정하면 그 직업의 프리팹으로 입장하는 경우를 만들어보자.

먼저 주고받을 메시지다.

```csharp
using Mirror;

public struct SelectClassMessage : NetworkMessage
{
    // Weaver는 프로퍼티를 직렬화하지 않는다. public 필드여야 한다
    public int classIndex;
}
```

### 서버 쪽

`NetworkManager`를 상속해 `OnServerAddPlayer`를 오버라이드한다. 기본 구현이
하던 네 가지를 그대로 챙기면서 프리팹만 선택값으로 바꾼다.

```csharp
using System.Collections.Generic;
using Mirror;
using UnityEngine;

public class LobbyNetworkManager : NetworkManager
{
    private const int DEFAULT_CLASS_INDEX = 0;

    [Header("Spawn")]
    [SerializeField, Tooltip("직업별 플레이어 프리팹. 인덱스는 클라이언트의 선택값과 맞춘다")]
    private GameObject[] _classPrefabs;

    // connectionId -> 그 연결이 고른 직업 인덱스
    private readonly Dictionary<int, int> _selectedClass = new Dictionary<int, int>();

    public override void OnStartServer()
    {
        base.OnStartServer();
        NetworkServer.RegisterHandler<SelectClassMessage>(OnSelectClassReceived);
    }

    // 클라이언트가 NetworkClient.AddPlayer()를 부르면 서버에서 이 메서드가 불린다
    public override void OnServerAddPlayer(NetworkConnectionToClient conn)
    {
        GameObject prefab = _classPrefabs[GetValidatedClassIndex(conn)];

        Transform startPos = GetStartPosition();
        GameObject player = startPos != null
            ? Instantiate(prefab, startPos.position, startPos.rotation)
            : Instantiate(prefab);

        player.name = $"{prefab.name} [connId={conn.connectionId}]";

        // 이 줄이 빠지면 오브젝트만 생기고 아무의 플레이어도 아니다
        NetworkServer.AddPlayerForConnection(conn, player);
    }

    public override void OnServerDisconnect(NetworkConnectionToClient conn)
    {
        _selectedClass.Remove(conn.connectionId);

        // 기본 구현이 NetworkServer.DestroyPlayerForConnection을 부른다
        base.OnServerDisconnect(conn);
    }

    private void OnSelectClassReceived(NetworkConnectionToClient conn, SelectClassMessage msg)
    {
        _selectedClass[conn.connectionId] = msg.classIndex;
    }

    private int GetValidatedClassIndex(NetworkConnectionToClient conn)
    {
        // 선택이 아직 안 왔을 수 있다. 그때는 기본값으로 들어간다
        if (!_selectedClass.TryGetValue(conn.connectionId, out int index))
            return DEFAULT_CLASS_INDEX;

        // 클라이언트가 보낸 값이므로 서버가 범위를 다시 본다
        return Mathf.Clamp(index, 0, _classPrefabs.Length - 1);
    }
}
```

`RegisterHandler`의 시그니처는 이렇고, 인증 요구가 **기본으로 켜져 있다.**

> `public static void RegisterHandler<T>(Action<NetworkConnectionToClient, T> handler, bool requireAuthentication = true) where T : struct, NetworkMessage`

`Mathf.Clamp` 한 줄이 있는 이유는 [설계 패턴 글](/posts/mirror-network-design-patterns/)에서
정리한 것과 같다. 인덱스를 정하는 건 클라이언트이고, **그 값이 타당한지는
서버가 봐야 한다.** 배열 범위를 벗어난 값이 오면 그냥 예외가 난다.

### 클라이언트 쪽

먼저 인스펙터에서 **Auto Create Player를 꺼야 한다.** 켜져 있으면 접속하자마자
매니저가 알아서 플레이어를 넣어버려서, 직업을 고를 틈이 없다. 기본 구현이
이렇게 되어 있다.

```csharp
public virtual void OnClientConnect()
{
    if (!clientLoadedScene)
    {
        if (!NetworkClient.ready)
            NetworkClient.Ready();

        if (autoCreatePlayer)
            NetworkClient.AddPlayer();   // 이 분기를 끄는 것이 Auto Create Player다
    }
}
```

체크만 풀면 `Ready()`까지는 그대로 하고 `AddPlayer()`만 건너뛴다.
오버라이드할 필요가 없다. 그다음 확정 버튼에서 직접 부른다.

```csharp
using Mirror;
using UnityEngine;

public class CharacterSelectUI : MonoBehaviour
{
    private const int NONE_SELECTED = -1;

    [Header("Selection")]
    [SerializeField, Tooltip("확정 버튼. 직업을 고르기 전에는 비활성")]
    private GameObject _confirmButton;

    private int _selectedIndex = NONE_SELECTED;

    private void OnEnable()
    {
        _selectedIndex = NONE_SELECTED;
        _confirmButton.SetActive(false);
    }

    // 직업 버튼의 OnClick에 인덱스를 넣어 연결한다
    public void SelectClass(int classIndex)
    {
        _selectedIndex = classIndex;
        _confirmButton.SetActive(true);
    }

    public void ConfirmSelection()
    {
        if (_selectedIndex == NONE_SELECTED) return;
        if (!NetworkClient.isConnected) return;

        // 1. 고른 직업을 먼저 보낸다
        NetworkClient.Send(new SelectClassMessage { classIndex = _selectedIndex });

        // 2. 준비 상태가 아니면 맞춘다
        if (!NetworkClient.ready)
            NetworkClient.Ready();

        // 3. 이제 입장을 요청한다. 서버의 OnServerAddPlayer가 불린다
        NetworkClient.AddPlayer();

        gameObject.SetActive(false);
    }
}
```

### 두 이름이 갈리는 자리

이렇게 놓고 보면 왜 `NetworkServer.AddPlayer`가 있을 수 없는지가 분명해진다.

- **`NetworkClient.AddPlayer()`** — 클라이언트가 "들어가겠다"고 **요청**한다.
  인자가 없다. 그래서 고른 직업 같은 건 별도 메시지로 먼저 보내야 한다.
- **`NetworkServer.AddPlayerForConnection(conn, player)`** — 서버가 만든
  오브젝트를 **그 연결의 플레이어로 등록**한다. 어느 연결인지가 인자에 있어야
  하니 이름에 `ForConnection`이 붙는다.

**요청하는 쪽과 등록하는 쪽이 다르고, 등록에는 연결이 필요하다.** 문서의
`NetworkServer.AddPlayer`는 그 사이에 있는 이름이라 어느 쪽으로도 존재할 수
없다.

## 스폰 위치의 기본값

위 코드의 삼항 연산자가 [앞 글](/posts/mirror-networkmanager-inspector/)에서
남겨둔 절반을 채워준다. `GetStartPosition()`은 씬에 `NetworkStartPosition`이
하나도 없으면 `null`을 반환하는데, **그때 어떻게 되는가**가 여기 있다.

```csharp
Transform startPos = GetStartPosition();
GameObject player = startPos != null
    ? Instantiate(playerPrefab, startPos.position, startPos.rotation)
    : Instantiate(playerPrefab);
```

인자 없는 `Instantiate`다. 즉 **프리팹 자신의 transform 위치와 회전으로
생성된다.** 문서도 같은 말을 한다.

> The Network Manager will spawn Player Prefab at their defined transform
> position and rotation by default

프리팹의 저장된 위치가 대개 원점이라 플레이어가 전부 겹쳐 나온다. Player Spawn
Method를 Random으로 바꿔도 그대로인 이유가 이 한 줄이다. 고칠 곳은 씬에
`NetworkStartPosition`을 놓는 것이거나, 프리팹의 transform이다.

## 트랜스포트가 진짜 분기점이다

이 문서에서 내가 앞선 글들에 담지 않았던 부분이 트랜스포트다.

> Mirror uses a separate component (derived from the Transport class) to connect
> across the network. The new default Transport is **KCP** (which uses UDP, not
> TCP).

`NetworkManager`는 연결을 직접 하지 않는다. **트랜스포트 컴포넌트를 갈아끼우는
것이 프로토콜을 바꾸는 방법**이고, 오브젝트의 Transport 칸에 다른 컴포넌트를
넣으면 끝이다.

문서가 특히 짚는 게 Multiplex다.

> Bridging transport to allow a server to handle clients on different transports
> concurrently, for example desktop clients using Telepathy together with WebGL
> clients using Websockets.

**한 서버가 두 트랜스포트를 동시에 받는다.** 데스크톱 빌드는 TCP로, 브라우저
빌드는 WebSocket으로 같은 서버에 붙는다. WebGL을 붙일지 말지가 서버 구성을
가르는 문제가 아니게 된다는 뜻이다.

내장 트랜스포트를 정리하면 이렇다.

| 트랜스포트 | 용도 |
| --- | --- |
| KCP | 기본. UDP 기반 |
| Telepathy | TCP |
| Simple Web Sockets | WebGL 브라우저 클라이언트 |
| Multiplexer | 서로 다른 트랜스포트를 한 서버에서 동시에 |
| Latency Simulation | 지연·손실을 흉내 내는 테스트용 |
| Encryption | 다른 트랜스포트를 감싸 암호화하는 중간 계층 |

뒤의 둘은 **이 문서 페이지에 안 나온다.** 문서의 트랜스포트 문단은 "TCP, UDP,
WebGL, Steam, and many more"까지만 적고 Multiplex를 예로 든다. 목록은 별도
Transports 페이지에서 자란 셈이다.

Encryption이 있다는 건 알아둘 만하다. [Command와 RPC 글](/posts/mirror-remote-actions/)에서
KCP 트랜스포트의 UDP 스푸핑 사례를 다뤘는데, 그런 층을 하나 끼울 수 있는
구조라는 뜻이다. Latency Simulation은 로컬에서 다 잘 되던 게 실제 지연에서
무너지는 걸 미리 보는 용도다.

## 서버는 localhost가 아니라 전 인터페이스에 연다

문서의 이 문장이 오해를 부른다.

> In server or host mode, the game listens for incoming connections on
> `localhost` which includes the local network IP address of the server machine.

`localhost`는 보통 `127.0.0.1`만 가리키는 말이고, 그렇다면 **로컬 네트워크
IP를 포함할 수가 없다.** 문장이 스스로 어긋난다. 실제로 무엇에 바인딩하는지는
트랜스포트가 정하고, 기본인 KCP는 이렇다.

```csharp
// DualMode(IPv6)
socket.Bind(new IPEndPoint(IPAddress.IPv6Any, port));
// IPv4
socket.Bind(new IPEndPoint(IPAddress.Any, port));
```

**전 인터페이스다.** `IPAddress.Any`는 `0.0.0.0`이고, 그 머신이 가진 모든 주소로
들어오는 연결을 받는다. 문서가 말하려던 것도 결과적으로는 이것 같은데, 표현이
`localhost`라 정반대로 읽힌다.

포트는 `NetworkManager`가 아니라 트랜스포트 쪽에 있다. KCP의 기본값은 7777이다.

```csharp
[FormerlySerializedAs("Port")]
public ushort port = 7777;
```

앞 글에서 **Network Address는 서버가 쓰지 않는다**는 것을 짚었는데, 그 나머지
절반이 여기다. 클라이언트는 `NetworkManager`의 Network Address로 접속할 곳을
정하고, **서버는 트랜스포트의 Port로 열린다.** 두 값이 서로 다른 컴포넌트에
있다는 게 처음에 헷갈리는 지점이다.

## 프리팹 등록은 NetworkManager를 몇 개 두느냐에 달렸다

문서의 이 문단은 다른 데서 잘 안 보인다.

> If you have one Network Manager that is persisted through scenes via Don't
> Destroy On Load (DDOL), you need to register **all** prefabs to it which might
> be spawned in any scene. If you have a separate Network Manager in each scene,
> you only need to register the prefabs relevant for that scene.

**두 가지 구성이 있고 등록 범위가 다르다.** DDOL로 하나를 끌고 다니면 전 씬의
스폰 대상을 전부 그 하나에 등록해야 하고, 씬마다 따로 두면 그 씬 것만 넣으면
된다.

그런데 같은 페이지에 이런 주의도 있다.

> You can only ever have one active Network Manager in each scene because it's a
> singleton.

둘을 같이 읽으면 조건이 분명해진다. **씬마다 따로 두는 구성은 DDOL을 끄는
경우에만 성립한다.** 안 그러면 다음 씬에서 두 개가 동시에 활성인 상태가 된다.
그리고 DDOL을 끄면 문서가 다른 곳에서 경고한 문제가 따라온다.

> You should normally make sure the Network Manager persists between Scenes,
> otherwise the network connection is broken upon a scene change.

**연결을 유지하려면 DDOL이고, DDOL이면 프리팹을 전부 한곳에 등록해야 한다.**
"씬마다 따로 두면 그 씬 것만" 쪽은 씬 전환마다 재접속해도 되는 구조에서나
쓸 수 있다. 문서가 두 선택지를 나란히 놓기만 해서, 이 제약이 문단 사이에
흩어져 있다.

## 문서가 경고하지만 Mirror는 검사하지 않는다

문서 초반의 주의사항이다.

> Do not place the Network Manager component on a networked game object (one
> which has a Network Identity component), because Mirror disables these when the
> Scene loads.

씬 로드 시 비활성화되는 오브젝트에 `NetworkManager`를 얹으면 매니저째 꺼진다는
뜻이다. 타당한 경고인데, **Mirror는 이걸 검사하지 않는다.** `OnValidate`에서
`NetworkIdentity`를 확인하는 자리는 두 군데뿐이고 둘 다 플레이어 프리팹
쪽이다.

```csharp
if (playerPrefab != null && !playerPrefab.TryGetComponent(out NetworkIdentity _))
{
    Debug.LogError("NetworkManager - Player Prefab must have a NetworkIdentity.");
    playerPrefab = null;
}
```

프리팹 쪽은 **에러를 찍고 값을 `null`로 되돌리기까지 한다.** 반면
`NetworkManager` 자신이 `NetworkIdentity`와 같은 오브젝트에 있는지는 아무도 안
본다. 잘못 놓으면 조용히 안 뜬다.

**문서에만 있고 코드에는 없는 규칙**이라 이 문장을 읽었는지 여부가 그대로
차이가 된다. 공식 문서를 스크랩해둔 값이 이런 데서 나온다.

## 정리

- 문서의 **`NetworkServer.AddPlayer`는 존재하지 않는다.** 실제 이름은
  `NetworkServer.AddPlayerForConnection(conn, player)`다. 공식 문서라고 API
  이름까지 최신인 건 아니다.
- `OnServerAddPlayer`를 오버라이드하면 **기본 구현이 하던 네 가지를 직접
  챙겨야 한다.** 마지막 등록을 빼면 오브젝트만 생기고 아무의 플레이어도 아니다.
- 시작 위치가 없으면 **프리팹 자신의 transform**으로 생성된다. 기본 구현의
  삼항 연산자가 그 분기다.
- **트랜스포트를 갈아끼우는 것이 프로토콜을 바꾸는 방법**이고, Multiplex는 한
  서버가 데스크톱과 브라우저 클라이언트를 동시에 받게 한다. 내장 목록에
  Latency Simulation과 Encryption도 있는데 이 페이지에는 없다.
- **서버는 `localhost`가 아니라 전 인터페이스에 연다.** KCP가
  `IPAddress.Any` / `IPv6Any`로 바인딩한다. 포트는 트랜스포트 쪽(기본 7777)에
  있고, Network Address는 클라이언트 쪽 값이다.
- **DDOL이면 모든 씬의 스폰 프리팹을 한곳에 등록**해야 한다. 씬마다 매니저를
  두는 구성은 DDOL을 끄는 경우에만 성립하고, 그러면 씬 전환에서 연결이 끊긴다.
- **`NetworkManager`를 `NetworkIdentity` 오브젝트에 두지 말라는 규칙은 문서에만
  있다.** 플레이어 프리팹은 검사해서 되돌리는데, 이쪽은 검사가 없다.

레퍼런스로 삼기에 이 페이지는 여전히 좋다. 다만 대보고 나니 **문서도 코드보다
느리다.** 없는 메서드 이름이 남아 있고, 트랜스포트 목록은 다른 페이지에서 더
자랐고, 서버가 어디에 여는지는 문장보다 `Bind` 한 줄이 정확했다.

그래서 레퍼런스의 범위가 좀 달라졌다. **문서는 "어디를 봐야 하는지"까지 맡고,
"정확히 무엇인지"는 그 문서가 가리키는 클래스를 여는 쪽**이다. 이 글에서 잡은
셋이 전부 그렇게 나왔다.

## 참고

- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [Transports — Mirror](https://mirror-networking.gitbook.io/docs/manual/transports)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [NetworkServer.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkServer.cs)
- [KcpServer.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Transports/KCP/kcp2k/highlevel/KcpServer.cs)
- [Mirror NetworkManager 인스펙터 다시 읽기](/posts/mirror-networkmanager-inspector/)
