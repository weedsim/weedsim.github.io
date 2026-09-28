---
pubDatetime: 2026-09-28T20:00:00+09:00
title: "Mirror로 수천 명 동접? 공식 가이드는 인스턴스당 200~300을 말한다"
lang: ko
translationKey: mirror-room-manager-setup
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - 서버
  - C#
description: "NetworkRoomManager로 멀티플레이 방을 붙이는 절차는 따라 할 만하다. 다만 첫 문단의 규모 이야기가 Mirror 자체 가이드와 한 자릿수 다르고, 씬 네 칸을 짝짓는 방식이 소스 주석과 반대다."
---

Mirror로 게임 서버를 세우던 중에 **대기실에는 어떤 코드를 두어야 하는지**를
찾다가 스크랩한 글이다. `NetworkRoomManager`를 붙여 대기실–게임 씬 구조를
만드는 절차를 2023년에 정리한 글로, 빈 오브젝트 만들기부터 버튼에
`StartHost()` 붙이기까지 순서대로 따라가고 중간중간 "**중요!**"로 실수하기 쉬운
자리를 짚어준다. 절차 자체는 지금도 그대로 해볼 만하다.

다만 정작 찾던 것 — **대기실 스크립트 안에 무엇을 두나** — 은 이 글에 없다.
`RoomPlayer`도 `GamePlayer`도 본문이 비어 있고 "추후에 필요한 기능이 있다면
여기 넣으면 된다"로 끝난다. 그래서 그 자리에 무엇이 이미 준비되어 있는지는
아래 「어디에 왜 쓰나」에서 따로 채웠다.

절차 쪽에서 걸리는 건 세 군데다. **개요의 규모 이야기**, **씬 네 칸을 짝짓는
방식**, 그리고 **"중요!"로 강조한 항목 중 하나가 실제로는 선택**이라는 점이다.

## 목차

## "수천명"의 근거를 찾을 수 없다

개요의 두 문장이다.

> 추가로 Mirror 네트워크는 **동시 수천명 정도 접속 할 수 있는 규모**라고 한다.
> **수천명 단위의 MMORPG정도는 구현 가능한 서버 프로그램**이라고 한다.

"~라고 한다"로 출처를 흐려놨는데, Mirror 쪽 문서에서 이 수치를 찾을 수 없다.
찾을 수 있는 건 정반대에 가까운 숫자다. Mirror 공식 문서의 MMORPG 가이드다.

> Unity 서버 인스턴스 **하나당 대략 200~300 CCU**를 목표로 할 수 있다.

**한 자릿수가 다르다.** 같은 문서가 여기서 더 올릴 여지도 같이 적는다.

> 서버가 10Hz로 돈다면 100ms가 주어진다. 갱신에 6배의 시간이 생기니
> **CCU를 2~3배** 정도 더 가져갈 수 있을 것이다.

가장 낙관적으로 잡아도 인스턴스당 600~900이다. "수천명"은 **인스턴스 하나의
숫자가 아니라 여러 인스턴스로 쪼갠 뒤의 총합**일 때 나오는 숫자다. 서버를
설계할 때 이 둘을 섞으면 곤란해진다.

같은 문서가 Unity를 서버로 쓰는 것에 대해 적은 문장도 같이 옮겨둔다.

> Unity는 게임 서버로서 **가장 느리고 가장 불안정한 선택지**다. 다만 **가장
> 생산적**이기도 하다.

> MMORPG를 만들고 싶어 하는 사용자가 많다. Unity가 게임 서버로 최선의 선택은
> 아니지만, 큰 장점들을 가져다준다.

Mirror로 만들어진 소규모 MMO 사례(Inferna, Samutale, Naica)도 같은 문서에
있다. **"MMORPG가 가능하다"는 말 자체는 거짓이 아니다.** 다만 그 문장이
"인스턴스 하나로 수천 명"과 같은 뜻은 아니다.

> 이건 초기 MMO들이 **이미 15년 전에** 달성한 500+ CCU 수준이다.

숫자를 표로 정리하면 이렇다.

| | 클리핑 | Mirror 공식 가이드 |
|---|---|---|
| 기준 단위 | 명시 없음 | **Unity 서버 인스턴스 1개당** |
| 동시 접속 | "수천명" | **200~300 CCU** |
| 최적화 후 | — | 10Hz 기준 2~3배 (600~900) |
| MMORPG | "수천명 단위 구현 가능" | 소규모 MMO 사례 있음, "최선의 선택은 아니다" |

## 씬 네 칸의 짝이 반대다

절차 2번, 씬 할당이다. 클리핑은 네 칸을 이렇게 채우라고 한다.

```
Offline Scene  - 타이틀 씬
Online Scene   - Game Room Scene
Room Scene     - Game Room Scene
Game Play Scene- Game Play Scene
```

그리고 이렇게 정리한다.

> 결국 **Online Scene과, Room Scene은 같은 씬이 할당되는것이다.**

그런데 Mirror 소스의 필드 주석은 짝을 **반대로** 맺는다.

```csharp
/// <summary>
/// The scene to use for the room. This is similar to the offlineScene of the NetworkManager.
/// </summary>
[Scene]
public string RoomScene;

/// <summary>
/// The scene to use for the playing the game from the room. This is similar to the
/// onlineScene of the NetworkManager.
/// </summary>
[Scene]
public string GameplayScene;
```

- **`RoomScene` ≈ `offlineScene`**
- **`GameplayScene` ≈ `onlineScene`**

클리핑은 `Online Scene`을 `Room Scene`에 붙였는데, Mirror가 말하는 대응은
`Online Scene`–`GameplayScene` 쪽이다. 방향이 뒤집혀 있다.

이 대응이 말이 되는 이유가 있다. **룸 씬은 "돌아오는 곳"**이다. 게임이 끝나면
거기로 복귀하고, 그래서 offline 자리와 성격이 같다. **게임플레이 씬은 "가는
곳"**이라 online 자리다.

그리고 `NetworkRoomManager`는 **씬 전환을 스스로 한다.** 소스에서
`ServerChangeScene`을 부르는 자리가 둘이다.

| 호출 위치 | 대상 |
|---|---|
| `OnRoomServerPlayersReady()` | `ServerChangeScene(GameplayScene)` |
| `OnGUI()` (룸으로 복귀) | `ServerChangeScene(RoomScene)` |

서버 시작 시 검사하는 것도 이 둘뿐이다.

```csharp
public override void OnStartServer()
{
    if (string.IsNullOrWhiteSpace(RoomScene))
    {
        Debug.LogError("NetworkRoomManager RoomScene is empty. Set the RoomScene in the inspector for the NetworkRoomManager");
        return;
    }
    if (string.IsNullOrWhiteSpace(GameplayScene))
    {
        Debug.LogError("NetworkRoomManager PlayScene is empty. Set the PlayScene in the inspector for the NetworkRoomManager");
        return;
    }
    OnRoomStartServer();
}
```

공식 문서의 `NetworkRoomManager` 항목에도 **Room Scene과 Gameplay Scene 둘만**
나온다.

> **Room Scene**: 룸에 사용할 씬.

> **Gameplay Scene**: 메인 게임 플레이에 사용할 씬.

Online Scene 항목은 없다. `NetworkRoomManager`가 `NetworkManager`를 상속하니
칸 자체는 인스펙터에 보이지만, **룸 매니저가 보는 칸은 아래 둘**이다.
[인스펙터를 따로 읽은 글](/posts/mirror-networkmanager-inspector/)에서 Online
Scene이 "연결이 아니라 서버 시작에 걸린다"는 걸 정리했는데, 룸 매니저에서는
그 위에 룸 매니저 자신의 전환이 얹힌다. **두 개가 같은 씬을 놓고 경쟁하게
만들 이유가 없다.**

## Transport는 "할당"까지 안 해도 된다

클리핑이 굵게 강조한 첫 번째 "중요!"다.

> 만약 RoomManager컴포넌트를 할당 했을 때 NetWork Info의 Transport가 none으로
> 되어 있다면! RoomManager에 Kcp Transport 컴포넌트를 추가 한 후, **자기 자신을
> 할당시켜주면 된다!** (없다면 게임 실행이 안될것이다!)

절반은 맞다. 트랜스포트가 아예 없으면 실행이 안 되는 것도 맞다. 다만 **할당은
선택**이다. `NetworkManager.InitializeSingleton()`이 이렇게 되어 있다.

```csharp
if (transport == null)
    if (TryGetComponent(out Transport newTransport))
    {
        Debug.LogWarning($"No Transport assigned to Network Manager - Using {newTransport} found on same object.");
        transport = newTransport;
    }
    else
    {
        Debug.LogError("No Transport on Network Manager...add a transport and assign it.");
        return false;
    }
```

**같은 오브젝트에 트랜스포트가 붙어 있기만 하면 경고를 띄우고 자동으로
잡는다.** 없을 때만 에러가 나고 `return false`로 초기화가 멈춘다. 그러니
"컴포넌트를 붙인다"가 필수고, "칸에 끌어다 놓는다"는 경고를 없애는 일이다.

경고가 뜨는 걸 그냥 두느니 할당하는 편이 낫긴 하다. 다만 **"할당을 안 해서
안 되는 것"과 "컴포넌트가 없어서 안 되는 것"을 구분해두면** 콘솔을 볼 때
바로 갈린다. 어떤 트랜스포트를 고를지는
[NetworkManager 문서 글](/posts/mirror-networkmanager-doc/)에 정리해뒀다.

## `RoomManager.singleton`은 `RoomManager`가 아니다

시작 버튼 코드다.

```csharp
public void CreateRoom(){
    var manager = RoomManager.singleton;
    //방 설정 작업
    //추후에 여기에서 방에 대한 설정작업이 이루어질것이다.
    manager.StartHost();
}
```

`StartHost()`만 부를 거라면 문제없다. 그런데 주석이 예고하는 "방에 대한
설정작업"을 여기서 하려고 하면 막힌다.

**`NetworkRoomManager`는 `singleton`을 재선언하지 않는다.** 소스에
`singleton` 선언이 없고, 클래스 선언은 `public class NetworkRoomManager :
NetworkManager`다. 그래서 `RoomManager.singleton`은 상속된
`NetworkManager.singleton`이고, **정적 타입이 `NetworkManager`다.**

`var manager`로 받으면 `manager`의 타입도 `NetworkManager`가 된다. `minPlayers`
같은 룸 전용 멤버에 닿으려면 캐스팅해야 한다.

```csharp
public void CreateRoom()
{
    // singleton은 NetworkManager 타입이다. 룸 멤버를 쓰려면 내려받아야 한다.
    if (NetworkManager.singleton is not RoomManager manager)
    {
        Debug.LogError("RoomManager가 singleton이 아니다.");
        return;
    }

    manager.minPlayers = 2;   // 이제 룸 전용 멤버에 닿는다
    manager.StartHost();
}
```

`RoomManager.singleton`으로 적어도 컴파일은 된다. 그래서 **오해하기 딱
좋은 모양**인데, 가리키는 정적 멤버는 기반 클래스 쪽이다.

Mirror 자신도 캐스팅해서 쓴다. `NetworkRoomPlayer.CmdChangeReadyState`의
본문이다.

```csharp
[Command]
public void CmdChangeReadyState(bool readyState)
{
    readyToBegin = readyState;
    NetworkRoomManager room = NetworkManager.singleton as NetworkRoomManager;
    if (room != null)
    {
        room.ReadyStatusChanged();
    }
}
```

**`NetworkManager.singleton as NetworkRoomManager`** 로 내려받고 `null`까지
검사한다. 프레임워크 코드가 그렇게 쓰고 있다는 게 그대로 답이다.

## 어디에 왜 쓰나

`NetworkRoomManager`는 **대기실–준비–게임 시작**이라는 흐름을 통째로 내장한
컴포넌트다. 직접 만들면 준비 상태 동기화와 전원 준비 판정, 씬 전환 타이밍을
전부 짜야 한다. 그 대신 **씬 구조가 강제**된다.

### 규모를 먼저 정하고 붙이기

절차보다 먼저 정해야 하는 값이 있다. 인스턴스 하나가 받을 인원이다.

| 목표 | 구성 |
|---|---|
| 방 하나에 4~16명 | 인스턴스 하나. `maxConnections`로 충분 |
| 동시 수백 명 | 인스턴스 하나의 상한(200~300) 근처. 프로파일링 필요 |
| 동시 수천 명 | **인스턴스를 여러 개** 띄우고 방 배정 계층이 따로 필요 |

클리핑이 만드는 구조는 첫째 줄이다. **버튼을 누른 사람이 호스트가 되고 그
프로세스가 곧 서버**이므로, 그 호스트가 나가면 방이 끝난다. 이 성질은
[사전 지식 글](/posts/mirror-networking-basics/)에서 따로 정리했다.

### 방 매니저 붙이기

클리핑의 절차를 코드로 옮기면 이렇게 된다. 인스펙터에서 채울 칸을 주석으로
적어뒀다.

```csharp
using Mirror;
using UnityEngine;

/// <summary>
/// 대기실과 게임 씬을 관리한다.
/// 인스펙터에서 채울 칸은 Room Scene / Gameplay Scene 둘이다.
/// Room Player Prefab과 Player Prefab에는 NetworkIdentity가 붙어 있어야 한다.
/// </summary>
public class RoomManager : NetworkRoomManager
{
    /// <summary>전원이 준비되면 호출된다. 게임 씬으로 넘어가기 직전 자리.</summary>
    public override void OnRoomServerPlayersReady()
    {
        // 기본 구현이 ServerChangeScene(GameplayScene)을 부른다.
        base.OnRoomServerPlayersReady();
    }

    /// <summary>룸 플레이어를 게임 플레이어로 바꿀 때 값을 옮기는 자리.</summary>
    public override GameObject OnRoomServerCreateGamePlayer(
        NetworkConnectionToClient conn, GameObject roomPlayer)
    {
        // 닉네임·색상처럼 대기실에서 고른 값은 여기서 넘긴다.
        return base.OnRoomServerCreateGamePlayer(conn, roomPlayer);
    }
}
```

```csharp
using Mirror;
using UnityEngine;

public class TitleMenu : MonoBehaviour
{
    private const int MIN_PLAYERS = 2;

    /// <summary>타이틀 씬 버튼의 OnClick에 연결한다.</summary>
    public void CreateRoom()
    {
        if (NetworkManager.singleton is not RoomManager manager)
        {
            Debug.LogError("RoomManager가 singleton이 아니다. 씬에 하나만 두었는지 확인할 것.");
            return;
        }

        // OnValidate에서 maxConnections 이하로 잘린다. 큰 값을 넣어도 조용히 줄어든다.
        manager.minPlayers = MIN_PLAYERS;
        manager.StartHost();
    }
}
```

`minPlayers`가 조용히 잘리는 것은 `OnValidate`에 있다.

```csharp
public override void OnValidate()
{
    base.OnValidate();
    minPlayers = Mathf.Min(minPlayers, maxConnections);
    minPlayers = Mathf.Max(minPlayers, 0);
    if (roomPlayerPrefab != null)
    {
        NetworkIdentity identity = roomPlayerPrefab.GetComponent<NetworkIdentity>();
        if (identity == null)
        {
            roomPlayerPrefab = null;
            Debug.LogError("RoomPlayer prefab must have a NetworkIdentity component.");
        }
    }
}
```

클리핑의 두 번째 "중요!"가 이 코드의 아랫부분이다. **`NetworkIdentity`가 없으면
프리팹 참조가 `null`로 되돌려지고** 에러가 찍힌다. "제자리에 안 붙는다"는
증상의 정체가 이 `roomPlayerPrefab = null;` 한 줄이다. 이 항목은 클리핑이
정확히 짚었다.

### 대기실 스크립트에는 무엇을 두나

클리핑이 만든 `RoomPlayer`는 본문이 비어 있다.

```csharp
public class RoomPlayer : NetworkRoomPlayer
{
     //Start와 Update는 지워도 된다.
     //추후에 필요한 기능이 있다면 여기 넣으면 된다.
}
```

"필요한 기능"이 무엇인지는 안 적혀 있는데, **`NetworkRoomPlayer`가 이미 갖고
있는 것**이 정해져 있다. 공식 문서의 설명 그대로다.

| 멤버 | 문서 설명 |
|---|---|
| `readyToBegin` | "플레이어가 Ready 상태임을 나타내는 **진단용** 지표" |
| `index` | "플레이어의 **진단용** 인덱스. 예: Player 1, Player 2 등" |
| `showRoomGUI` | "룸의 플레이어에 대한 개발자 GUI를 표시" |
| `OnClientEnterRoom()` | 클라이언트가 룸에 들어올 때 호출되는 가상 메서드 |
| `OnClientExitRoom()` | 클라이언트가 룸에서 나갈 때 호출되는 가상 메서드 |
| `ReadyStateChanged()` | "Client Virtual SyncVar Hook" |
| `IndexChanged()` | "Client Virtual SyncVar Hook" |

문서가 `readyToBegin`과 `index`를 **"진단용(Diagnostic)"** 이라고 부른다는 점은
짚어둘 만하다. 둘 다 `SyncVar`이고 훅이 달려 있어서 UI에 쓸 수 있지만, 문서가
붙인 이름은 그렇다.

```csharp
[SyncVar(hook = nameof(ReadyStateChanged))]
public bool readyToBegin;

[SyncVar(hook = nameof(IndexChanged))]
public int index;
```

그러니 대기실 스크립트에 새로 짤 것은 **표시와 입력**뿐이다. 준비 상태 자체는
`CmdChangeReadyState`가 이미 서버로 보낸다.

```csharp
using Mirror;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 대기실의 한 자리. 준비 상태 표시와 입력만 맡는다.
/// 동기화는 NetworkRoomPlayer가 이미 하고 있다.
/// </summary>
public class RoomPlayer : NetworkRoomPlayer
{
    [Header("Room UI")]
    [SerializeField, Tooltip("이 자리의 이름표")]
    private Text _nameLabel;

    [SerializeField, Tooltip("준비 표시")]
    private Toggle _readyToggle;

    // 대기실에서 고른 값 중 게임 씬으로 넘길 것은 여기 둔다.
    [SyncVar(hook = nameof(OnDisplayNameChanged))]
    public string displayName;

    public override void OnClientEnterRoom()
    {
        // 룸에 들어왔다. UI를 붙이는 자리.
        Refresh();
    }

    public override void ReadyStateChanged(bool oldReady, bool newReady)
    {
        // readyToBegin의 SyncVar 훅. 모든 클라이언트에서 불린다.
        if (_readyToggle != null) { _readyToggle.isOn = newReady; }
    }

    /// <summary>준비 버튼의 OnClick에 연결한다.</summary>
    public void ToggleReady()
    {
        // 내 자리에서만 보낸다. Command라 서버에서 실행된다.
        if (!isLocalPlayer) { return; }

        CmdChangeReadyState(!readyToBegin);
    }

    private void OnDisplayNameChanged(string oldName, string newName) => Refresh();

    private void Refresh()
    {
        if (_nameLabel != null) { _nameLabel.text = displayName; }
    }
}
```

여기서 정한 `displayName`을 게임 플레이어로 넘기는 자리가 위 `RoomManager`의
`OnRoomServerCreateGamePlayer`다. **대기실에서 고른 값이 게임 씬까지 살아남는
경로가 그 한 군데**다.

### 쓰지 말아야 할 자리

- **"수천 명"을 인스턴스 하나의 목표로 잡기.** 공식 가이드 수치는 200~300이다.
- **Online Scene에 룸 씬을 넣기.** 룸 매니저가 보는 칸은 Room Scene과
  Gameplay Scene이다.
- **`RoomManager.singleton`으로 룸 전용 멤버에 닿으려 하기.** 타입이
  `NetworkManager`다.
- **트랜스포트 경고와 에러를 같게 보기.** 경고는 자동으로 잡았다는 뜻이고,
  에러는 초기화가 멈췄다는 뜻이다.
- **프리팹에 `NetworkIdentity` 없이 할당 시도.** `OnValidate`가 참조를
  되돌린다.
- **호스트 방식으로 대규모를 노리기.** 호스트가 나가면 방이 끝난다.
- **준비 상태 동기화를 직접 짜기.** `readyToBegin`과 `CmdChangeReadyState`가
  이미 있다.

## 정리

- **"동시 수천명"의 근거를 Mirror 문서에서 찾을 수 없다.** 공식 MMORPG
  가이드는 **"Unity 서버 인스턴스 하나당 대략 200~300 CCU"**라고 적는다.
  10Hz로 낮춰도 2~3배, 즉 600~900 선이다.
- 같은 문서가 **"Unity는 게임 서버로서 가장 느리고 가장 불안정한 선택지"**
  라고도 적는다. 그 뒤에 "가장 생산적"이 붙는다.
- **씬 네 칸의 짝이 반대로 적혀 있다.** 소스 주석은 `RoomScene` ≈
  `offlineScene`, `GameplayScene` ≈ `onlineScene`이다. 클리핑은 Online Scene을
  Room Scene에 붙였다.
- **`NetworkRoomManager`는 씬 전환을 스스로 한다.** 전원 준비 시
  `ServerChangeScene(GameplayScene)`, 룸 복귀 시 `ServerChangeScene(RoomScene)`.
  `OnStartServer`가 검사하는 것도 이 둘뿐이다.
- **트랜스포트는 붙이기만 하면 자동으로 잡힌다.** 할당은 경고를 없애는 일이고,
  컴포넌트가 아예 없을 때만 초기화가 멈춘다.
- **`RoomManager.singleton`의 타입은 `NetworkManager`다.** `NetworkRoomManager`가
  `singleton`을 재선언하지 않는다.
- **프리팹의 `NetworkIdentity` 경고는 클리핑이 맞게 짚었다.** `OnValidate`가
  참조를 `null`로 되돌린다.
- **대기실 스크립트가 빌 이유는 없다.** `readyToBegin`, `index`,
  `OnClientEnterRoom`, `CmdChangeReadyState`가 이미 있다. 새로 짤 것은 표시와
  입력뿐이다. 문서는 앞의 둘을 **"진단용"** 이라고 부른다.

절차를 따라가는 글로는 잘 쓰였다. 짚어야 할 자리를 "중요!"로 표시해둔 것도
실제로 걸리는 자리들이다. 다만 **개요의 숫자 한 줄이 그 뒤의 모든 설계 판단을
바꾼다.** 인스턴스 하나에 수천 명이 들어간다고 생각하고 짠 구조와, 200~300에서
쪼개야 한다고 알고 짠 구조는 처음부터 다른 모양이 된다.

---

### 참고

- [Unity for MMORPGs — Mirror 문서](https://mirror-networking.gitbook.io/docs/community-guides/unity-for-mmorpgs)
- [Network Room Manager — Mirror 문서](https://mirror-networking.gitbook.io/docs/manual/components/network-room-manager)
- [NetworkRoomManager.cs — Mirror 소스](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Components/NetworkRoomManager.cs)
- [NetworkManager.cs — Mirror 소스](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)

이 글의 출발점이 된 자료는 [LKM0222 — \[Unity\] 유니티 멀티플레이를 위한 통신 구현 (Unity Mirror)](https://freeedeveloper.tistory.com/entry/Unity-%EC%9C%A0%EB%8B%88%ED%8B%B0-%EB%A9%80%ED%8B%B0%ED%94%8C%EB%A0%88%EC%9D%B4%EB%A5%BC-%EC%9C%84%ED%95%9C-%ED%86%B5%EC%8B%A0-%EA%B5%AC%ED%98%84-Unity-Mirror)
(2023-11-21)이다. 절차를 그대로 따라가면서 규모 수치와 씬 필드의 대응을 Mirror
공식 문서·소스와 대조했다.
