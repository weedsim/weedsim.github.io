---
pubDatetime: 2026-09-28T20:00:00+09:00
title: "Thousands of Players on Mirror? The Official Guide Says 200-300 Per Instance"
lang: en
translationKey: mirror-room-manager-setup
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - Server
  - C#
description: "The steps for wiring up a multiplayer room with NetworkRoomManager are worth following. But the scale claim in the intro is off by an order of magnitude from Mirror's own guide, and the way it pairs the four scene fields is the reverse of the source comments."
---

I clipped this while standing up a game server with Mirror and looking for
**what code belongs in the room**. It's a 2023 post walking through building a
room-and-gameplay scene structure with `NetworkRoomManager` — from creating an
empty object to wiring `StartHost()` to a button — flagging the easy mistakes
along the way with "**Important!**". The steps themselves are still worth
following.

What I was actually looking for, though — **what goes inside the room script** —
isn't in it. Both `RoomPlayer` and `GamePlayer` have empty bodies and end at
"put whatever you need in here later." So I filled that in myself under
"Where and Why You'd Use It" below.

On the procedure side, three things snag. **The scale claim in the intro**, **the
way the four scene fields are paired**, and **one of the "Important!" items
being optional in practice.**

## Table of Contents

## No Source for "Thousands"

Two sentences from the overview:

> Additionally, the Mirror network is said to be **on the scale of a few
> thousand concurrent connections**. It's said to be a server program capable
> of implementing **an MMORPG on the order of thousands of players.**

"It's said to be" leaves the source vague — and that figure isn't in Mirror's
documentation. What is there is close to the opposite. From Mirror's official
MMORPG guide:

> you can target about **200-300 CCU per Unity server instance**

**That's an order of magnitude apart.** The same document notes the headroom
above it:

> if your server runs at 10 Hz, that gives you 100 ms. With 6x more time to
> update, you can probably have **2-3x more CCU.**

At the most optimistic, 600–900 per instance. "Thousands" is a number you get
**as a total across several instances, not from one.** Mixing those two up
while designing a server causes trouble.

Here's what the same document says about using Unity as a server:

> Unity is the **slowest, most unstable solution for game servers.** But it's
> also the **most productive.**

> A lot of users want to make MMORPGs with Unity / Mirror. While Unity is not
> the best choice for game servers, it does bring great advantages.

That document also lists small MMOs built on Mirror — Inferna, Samutale, Naica.
**So "an MMORPG is possible" isn't false.** It just doesn't mean "thousands on
one instance."

> This is how many early MMOs achieved **500+ CCU already 15 years ago.**

As a table:

| | The clipping | Mirror's official guide |
|---|---|---|
| Unit of measure | Unspecified | **Per Unity server instance** |
| Concurrent users | "a few thousand" | **200-300 CCU** |
| After optimizing | — | 2-3x at 10 Hz (600-900) |
| MMORPG | "thousands-scale, doable" | Small MMOs exist; "not the best choice" |

## The Four Scene Fields Are Paired Backwards

Step 2 is scene assignment. The clipping says to fill four fields:

```
Offline Scene   - the title scene
Online Scene    - Game Room Scene
Room Scene      - Game Room Scene
Game Play Scene - Game Play Scene
```

And concludes:

> So in the end, **Online Scene and Room Scene get the same scene assigned.**

But the field comments in Mirror's source pair them the **other way around.**

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

The clipping attaches Online Scene to Room Scene; the correspondence Mirror
states is Online Scene ↔ `GameplayScene`. The direction is flipped.

There's a reason that mapping makes sense. **The room scene is where you come
back to.** The game ends and you return there, which is the same role the
offline slot plays. **The gameplay scene is where you go**, so it's the online
slot.

And `NetworkRoomManager` **changes scenes on its own.** There are two places in
the source that call `ServerChangeScene`.

| Call site | Target |
|---|---|
| `OnRoomServerPlayersReady()` | `ServerChangeScene(GameplayScene)` |
| `OnGUI()` (returning to the room) | `ServerChangeScene(RoomScene)` |

And those two are the only fields checked when the server starts.

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

The official `NetworkRoomManager` component page lists **only Room Scene and
Gameplay Scene.**

> **Room Scene**: The scene to use for the room.

> **Gameplay Scene**: The scene to use for main game play.

There's no Online Scene entry. `NetworkRoomManager` inherits from
`NetworkManager`, so the field is visible in the Inspector, but **the fields the
room manager looks at are those two.** I went through the Inspector separately
in [another post](/posts/mirror-networkmanager-inspector/), where Online Scene
turns out to trigger on server start rather than on connection; in the room
manager, the room manager's own transitions sit on top of that. **There's no
reason to put two mechanisms in competition over the same scene.**

## You Don't Have to *Assign* the Transport

The clipping's first bolded "Important!":

> If, when you assign the RoomManager component, the Transport under Network
> Info shows none! Add a Kcp Transport component to the RoomManager, then
> **assign it to itself!** (Without it the game won't run!)

Half right. It's also true that the game won't run with no transport at all.
But **assigning is optional.** Here's `NetworkManager.InitializeSingleton()`:

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

**If a transport is merely present on the same object, it logs a warning and
picks it up automatically.** Only when there's none does it error and stop
initialization with `return false`. So "add the component" is required;
"drag it into the field" is how you silence the warning.

Assigning it is still better than living with a warning. But **separating "it
failed because I didn't assign it" from "it failed because the component isn't
there"** makes the console tell you which one immediately. Which transport to
pick is covered in [the NetworkManager doc post](/posts/mirror-networkmanager-doc/).

## `RoomManager.singleton` Is Not a `RoomManager`

The start button code:

```csharp
public void CreateRoom(){
    var manager = RoomManager.singleton;
    //방 설정 작업
    //추후에 여기에서 방에 대한 설정작업이 이루어질것이다.
    manager.StartHost();
}
```

Fine if all you call is `StartHost()`. But try doing the "room configuration"
the comment promises and you're stuck.

**`NetworkRoomManager` does not redeclare `singleton`.** There's no `singleton`
declaration in the source, and the class declaration is
`public class NetworkRoomManager : NetworkManager`. So `RoomManager.singleton`
is the inherited `NetworkManager.singleton`, and its **static type is
`NetworkManager`.**

Receive it with `var` and `manager` is typed `NetworkManager` too. Reaching a
room-only member like `minPlayers` requires a cast.

```csharp
public void CreateRoom()
{
    // singleton is typed NetworkManager. Downcast to reach room members.
    if (NetworkManager.singleton is not RoomManager manager)
    {
        Debug.LogError("The singleton is not a RoomManager.");
        return;
    }

    manager.minPlayers = 2;   // now the room-only member is reachable
    manager.StartHost();
}
```

Writing `RoomManager.singleton` still compiles, which makes it **an easy shape
to misread** — the static member it resolves to belongs to the base class.

Mirror itself casts. Here's the body of
`NetworkRoomPlayer.CmdChangeReadyState`:

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

**`NetworkManager.singleton as NetworkRoomManager`**, followed by a `null`
check. The framework's own code answers the question.

## Where and Why You'd Use It

`NetworkRoomManager` is a component with the whole **lobby → ready → start**
flow built in. Build it yourself and you write ready-state synchronization,
all-players-ready detection, and scene transition timing. In exchange, **the
scene structure is imposed.**

### Decide the Scale Before You Wire Anything

There's a number to settle before the steps: how many players one instance
takes.

| Goal | Shape |
|---|---|
| 4-16 per room | One instance. `maxConnections` is enough |
| Hundreds concurrent | Near one instance's ceiling (200-300). Profile it |
| Thousands concurrent | **Multiple instances**, plus a room-assignment layer |

What the clipping builds is the first row. **Whoever presses the button becomes
the host, and that process is the server**, so the room ends when that host
leaves. I covered that property in
[the prerequisites post](/posts/mirror-networking-basics/).

### Wiring Up the Room Manager

The clipping's procedure as code. The Inspector fields to fill are in the
comments.

```csharp
using Mirror;
using UnityEngine;

/// <summary>
/// Manages the room and gameplay scenes.
/// The Inspector fields to fill are Room Scene and Gameplay Scene.
/// Room Player Prefab and Player Prefab must carry a NetworkIdentity.
/// </summary>
public class RoomManager : NetworkRoomManager
{
    /// <summary>Called when everyone is ready. The spot just before the gameplay scene.</summary>
    public override void OnRoomServerPlayersReady()
    {
        // The base implementation calls ServerChangeScene(GameplayScene).
        base.OnRoomServerPlayersReady();
    }

    /// <summary>Where a room player's values are carried onto the game player.</summary>
    public override GameObject OnRoomServerCreateGamePlayer(
        NetworkConnectionToClient conn, GameObject roomPlayer)
    {
        // Nicknames, colors — anything chosen in the room is handed over here.
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

    /// <summary>Hook this to the title scene button's OnClick.</summary>
    public void CreateRoom()
    {
        if (NetworkManager.singleton is not RoomManager manager)
        {
            Debug.LogError("The singleton is not a RoomManager. Check there's only one in the scene.");
            return;
        }

        // OnValidate clamps this to maxConnections. A large value is silently reduced.
        manager.minPlayers = MIN_PLAYERS;
        manager.StartHost();
    }
}
```

That silent clamping of `minPlayers` lives in `OnValidate`.

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

The clipping's second "Important!" is the lower half of that code. **Without a
`NetworkIdentity`, the prefab reference is reset to `null`** and an error is
logged. The symptom of "the prefab won't stick" is that one
`roomPlayerPrefab = null;` line. The clipping got this one exactly right.

### What Belongs in the Room Script

The `RoomPlayer` the clipping creates has an empty body.

```csharp
public class RoomPlayer : NetworkRoomPlayer
{
     //Start와 Update는 지워도 된다.
     //추후에 필요한 기능이 있다면 여기 넣으면 된다.
}
```

It never says what "whatever you need" is — but **what `NetworkRoomPlayer`
already provides** is fixed. Straight from the official documentation:

| Member | Documentation |
|---|---|
| `readyToBegin` | "**Diagnostic** indicator that a player is Ready." |
| `index` | "**Diagnostic** index of the player, e.g. Player 1, Player 2, etc." |
| `showRoomGUI` | "Enable this to show the developer GUI for players in the room." |
| `OnClientEnterRoom()` | Virtual method called when a client enters the room |
| `OnClientExitRoom()` | Virtual method called when a client exits the room |
| `ReadyStateChanged()` | "Client Virtual SyncVar Hook" |
| `IndexChanged()` | "Client Virtual SyncVar Hook" |

Worth noting that the docs call `readyToBegin` and `index` **"Diagnostic."**
Both are `SyncVar`s with hooks, so you can drive UI from them, but that's the
label the documentation gives them.

```csharp
[SyncVar(hook = nameof(ReadyStateChanged))]
public bool readyToBegin;

[SyncVar(hook = nameof(IndexChanged))]
public int index;
```

So what's left to write in the room script is **display and input**. The ready
state itself already travels to the server via `CmdChangeReadyState`.

```csharp
using Mirror;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// One seat in the room. Handles displaying ready state and taking input.
/// NetworkRoomPlayer already handles the synchronization.
/// </summary>
public class RoomPlayer : NetworkRoomPlayer
{
    [Header("Room UI")]
    [SerializeField, Tooltip("This seat's name label")]
    private Text _nameLabel;

    [SerializeField, Tooltip("Ready indicator")]
    private Toggle _readyToggle;

    // Values chosen in the room that should reach the game scene go here.
    [SyncVar(hook = nameof(OnDisplayNameChanged))]
    public string displayName;

    public override void OnClientEnterRoom()
    {
        // We've entered the room. Where the UI gets attached.
        Refresh();
    }

    public override void ReadyStateChanged(bool oldReady, bool newReady)
    {
        // readyToBegin's SyncVar hook. Runs on every client.
        if (_readyToggle != null) { _readyToggle.isOn = newReady; }
    }

    /// <summary>Hook this to the ready button's OnClick.</summary>
    public void ToggleReady()
    {
        // Only send from our own seat. It's a Command, so it runs on the server.
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

The `displayName` decided here reaches the game player through the
`OnRoomServerCreateGamePlayer` in the `RoomManager` above. **That one method is
the path by which a room choice survives into the game scene.**

### Where Not to Use It

- **Targeting "thousands" on a single instance.** The official guide's figure is
  200-300.
- **Putting the room scene in Online Scene.** The fields the room manager reads
  are Room Scene and Gameplay Scene.
- **Reaching room-only members through `RoomManager.singleton`.** Its type is
  `NetworkManager`.
- **Treating the transport warning and error the same.** The warning means it
  was picked up; the error means initialization stopped.
- **Assigning a prefab with no `NetworkIdentity`.** `OnValidate` reverts the
  reference.
- **Aiming for scale with the host model.** The room ends when the host leaves.
- **Writing ready-state synchronization yourself.** `readyToBegin` and
  `CmdChangeReadyState` already exist.

## Wrapping Up

- **There's no basis in Mirror's docs for "thousands concurrent."** The official
  MMORPG guide says **"about 200-300 CCU per Unity server instance."** Even
  dropping to 10 Hz gives 2-3x, so 600-900.
- The same document also says **"Unity is the slowest, most unstable solution
  for game servers"** — followed by "but it's also the most productive."
- **The four scene fields are paired backwards.** The source comments read
  `RoomScene` ≈ `offlineScene`, `GameplayScene` ≈ `onlineScene`. The clipping
  attached Online Scene to Room Scene.
- **`NetworkRoomManager` changes scenes itself**:
  `ServerChangeScene(GameplayScene)` when everyone is ready,
  `ServerChangeScene(RoomScene)` on returning. Those two are also the only
  fields `OnStartServer` checks.
- **A transport is picked up automatically if it's present.** Assigning it
  silences a warning; only a missing component stops initialization.
- **`RoomManager.singleton` is typed `NetworkManager`**, because
  `NetworkRoomManager` doesn't redeclare `singleton`. Mirror's own
  `CmdChangeReadyState` casts it.
- **The clipping's `NetworkIdentity` warning is correct.** `OnValidate` resets
  the reference to `null`.
- **There's no reason for the room script to be empty.** `readyToBegin`,
  `index`, `OnClientEnterRoom` and `CmdChangeReadyState` are already there. What
  you write is display and input. The docs call the first two **"Diagnostic."**

As a step-by-step post it's well written, and the spots it marks "Important!"
really are the ones that catch people. But **one number in the overview changes
every design decision that follows it.** A structure built assuming thousands
fit on one instance and a structure built knowing you shard at 200-300 come out
different from the very start.

---

### References

- [Unity for MMORPGs — Mirror docs](https://mirror-networking.gitbook.io/docs/community-guides/unity-for-mmorpgs)
- [Network Room Manager — Mirror docs](https://mirror-networking.gitbook.io/docs/manual/components/network-room-manager)
- [NetworkRoomManager.cs — Mirror source](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Components/NetworkRoomManager.cs)
- [NetworkManager.cs — Mirror source](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)

The starting point for this post was [LKM0222 — \[Unity\] 유니티 멀티플레이를 위한 통신 구현 (Unity Mirror)](https://freeedeveloper.tistory.com/entry/Unity-%EC%9C%A0%EB%8B%88%ED%8B%B0-%EB%A9%80%ED%8B%B0%ED%94%8C%EB%A0%88%EC%9D%B4%EB%A5%BC-%EC%9C%84%ED%95%9C-%ED%86%B5%EC%8B%A0-%EA%B5%AC%ED%98%84-Unity-Mirror)
(2023-11-21). I followed its procedure as written and checked the scale figures
and the scene field correspondences against Mirror's official documentation and
source. Quotes from it are my translations; the Korean comments in the samples
are the author's.
