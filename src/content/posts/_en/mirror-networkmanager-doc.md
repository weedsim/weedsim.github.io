---
pubDatetime: 2026-09-08T17:00:00+09:00
title: "I Scraped the Official Docs, and They Name a Method That Doesn't Exist"
lang: en
translationKey: mirror-networkmanager-doc
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - C#
description: "This clipping is Mirror's own Network Manager documentation. With no source to check it against, I checked it against the code — and found a method name that doesn't exist and a sentence that reads backwards."
---

I saved this one as a reference while wiring Mirror into a project, so it's a
different kind of clipping. Not a blog post but **Mirror's official Network
Manager documentation**
[page](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
itself.

Which leaves nothing to check it against — this *is* the source. So this time I
**checked the documentation against Mirror's code.** For something I intend to
use as a reference, that seems worth doing. Three results. The docs name **a
method that doesn't exist**, one sentence reads backwards from what actually
happens, and one rule the docs warn about **Mirror never checks for.**

## Table of contents

## A method name that isn't there

From the docs' Customization section:

> When implementing these functions, be sure to take care of the functionality
> that the default implementations provide. For example, in `OnServerAddPlayer`,
> the function **`NetworkServer.AddPlayer`** must be called to activate the
> player game object for the connection.

**There is no `NetworkServer.AddPlayer`.** The real name is this one.

```csharp
// actual signatures (NetworkServer.cs)
public static bool AddPlayerForConnection(NetworkConnectionToClient conn, GameObject player);
public static bool AddPlayerForConnection(NetworkConnectionToClient conn, GameObject player, uint assetId);
```

The default implementation calls that name too.

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

The name `AddPlayer` does exist in Mirror. **On a different class, doing the
opposite thing.**

```csharp
// NetworkClient.cs
/// <summary>Sends AddPlayer message to the server, indicating that we want to join the world.</summary>
public static bool AddPlayer()
```

That's the client telling the server it wants to join. Different direction,
different job from `AddPlayerForConnection`, which is the server registering a
player against a connection. The docs' `NetworkServer.AddPlayer` is **the two
names crossed.**

Type it verbatim and it won't compile, so you find out quickly. The catch is
that the name is real. Type `AddPlayer` and the IDE offers
`NetworkClient.AddPlayer()`, and being `public static`, **it compiles** in
server-side code. It goes wrong quietly at runtime instead.

Nor is it a name left over from UNET. The UNET manual says this in the same
place:

> Note that the function `NetworkServer.AddPlayerForConnection()` must be called
> for the newly created player GameObject, so that it is spawned and associated
> with the client's connection.

The value of this item is the broader point: **being the official documentation
doesn't make the API names right.**

What the sentence is actually saying matters, though. **When you override, you
take on what the default implementation was doing.** The one above does four
things — picks a start position, instantiates the prefab, gives it a debuggable
name, and registers it as the connection's player. Drop that last line and the
object exists while belonging to **nobody.**

## Both sides: picking a class, then joining

The fastest way to see how the two names divide is to put them in one flow. Say
you pick a class in the lobby, confirm, and enter with that class's prefab.

First, the message they exchange.

```csharp
using Mirror;

public struct SelectClassMessage : NetworkMessage
{
    // Weaver doesn't serialize properties. It has to be a public field
    public int classIndex;
}
```

### Server side

Derive from `NetworkManager` and override `OnServerAddPlayer`. Keep all four
things the default did, swapping only the prefab for the selected one.

```csharp
using System.Collections.Generic;
using Mirror;
using UnityEngine;

public class LobbyNetworkManager : NetworkManager
{
    private const int DEFAULT_CLASS_INDEX = 0;

    [Header("Spawn")]
    [SerializeField, Tooltip("Player prefab per class. Indices match the client's selection")]
    private GameObject[] _classPrefabs;

    // connectionId -> the class index that connection picked
    private readonly Dictionary<int, int> _selectedClass = new Dictionary<int, int>();

    public override void OnStartServer()
    {
        base.OnStartServer();
        NetworkServer.RegisterHandler<SelectClassMessage>(OnSelectClassReceived);
    }

    // Called on the server when a client calls NetworkClient.AddPlayer()
    public override void OnServerAddPlayer(NetworkConnectionToClient conn)
    {
        GameObject prefab = _classPrefabs[GetValidatedClassIndex(conn)];

        Transform startPos = GetStartPosition();
        GameObject player = startPos != null
            ? Instantiate(prefab, startPos.position, startPos.rotation)
            : Instantiate(prefab);

        player.name = $"{prefab.name} [connId={conn.connectionId}]";

        // Drop this line and the object exists belonging to nobody
        NetworkServer.AddPlayerForConnection(conn, player);
    }

    public override void OnServerDisconnect(NetworkConnectionToClient conn)
    {
        _selectedClass.Remove(conn.connectionId);

        // The default implementation calls NetworkServer.DestroyPlayerForConnection
        base.OnServerDisconnect(conn);
    }

    private void OnSelectClassReceived(NetworkConnectionToClient conn, SelectClassMessage msg)
    {
        _selectedClass[conn.connectionId] = msg.classIndex;
    }

    private int GetValidatedClassIndex(NetworkConnectionToClient conn)
    {
        // The selection may not have arrived yet. Fall back to the default
        if (!_selectedClass.TryGetValue(conn.connectionId, out int index))
            return DEFAULT_CLASS_INDEX;

        // The client chose this value, so the server re-checks the range
        return Mathf.Clamp(index, 0, _classPrefabs.Length - 1);
    }
}
```

`RegisterHandler`'s signature, with authentication required **by default**:

> `public static void RegisterHandler<T>(Action<NetworkConnectionToClient, T> handler, bool requireAuthentication = true) where T : struct, NetworkMessage`

That one `Mathf.Clamp` is there for the reason I set out in the
[design patterns post](/en/posts/mirror-network-design-patterns/). The client
decides the index, and **whether that value is valid is the server's job.** An
index outside the array just throws.

### Client side

First, **turn off Auto Create Player** in the inspector. Leave it on and the
manager adds a player the moment you connect, leaving no room to pick a class.
The default implementation:

```csharp
public virtual void OnClientConnect()
{
    if (!clientLoadedScene)
    {
        if (!NetworkClient.ready)
            NetworkClient.Ready();

        if (autoCreatePlayer)
            NetworkClient.AddPlayer();   // Auto Create Player is this branch
    }
}
```

Unchecking it keeps `Ready()` and skips only `AddPlayer()` — no override needed.
Then call it yourself from the confirm button.

```csharp
using Mirror;
using UnityEngine;

public class CharacterSelectUI : MonoBehaviour
{
    private const int NONE_SELECTED = -1;

    [Header("Selection")]
    [SerializeField, Tooltip("Confirm button. Inactive until a class is picked")]
    private GameObject _confirmButton;

    private int _selectedIndex = NONE_SELECTED;

    private void OnEnable()
    {
        _selectedIndex = NONE_SELECTED;
        _confirmButton.SetActive(false);
    }

    // Wire each class button's OnClick with its index
    public void SelectClass(int classIndex)
    {
        _selectedIndex = classIndex;
        _confirmButton.SetActive(true);
    }

    public void ConfirmSelection()
    {
        if (_selectedIndex == NONE_SELECTED) return;
        if (!NetworkClient.isConnected) return;

        // 1. Send the chosen class first
        NetworkClient.Send(new SelectClassMessage { classIndex = _selectedIndex });

        // 2. Become ready if we aren't
        if (!NetworkClient.ready)
            NetworkClient.Ready();

        // 3. Now ask to join. This triggers OnServerAddPlayer on the server
        NetworkClient.AddPlayer();

        gameObject.SetActive(false);
    }
}
```

### Where the two names split

Laid out this way, it's clear why `NetworkServer.AddPlayer` can't exist.

- **`NetworkClient.AddPlayer()`** — the client **asks** to join. It takes no
  arguments, which is why something like a chosen class has to go ahead of it as
  its own message.
- **`NetworkServer.AddPlayerForConnection(conn, player)`** — the server
  **registers** an object it created as that connection's player. Which
  connection has to be an argument, hence `ForConnection` in the name.

**The side that asks and the side that registers are different, and registering
needs a connection.** The docs' `NetworkServer.AddPlayer` sits between the two,
which leaves it no way to exist on either.

## What the default start position is

The ternary in that code fills in the half I left open in
[the earlier post](/en/posts/mirror-networkmanager-inspector/).
`GetStartPosition()` returns `null` when the scene has no `NetworkStartPosition`
at all — and **what happens then** is right here.

```csharp
Transform startPos = GetStartPosition();
GameObject player = startPos != null
    ? Instantiate(playerPrefab, startPos.position, startPos.rotation)
    : Instantiate(playerPrefab);
```

`Instantiate` with no arguments. So it spawns **at the prefab's own transform
position and rotation.** The docs say the same.

> The Network Manager will spawn Player Prefab at their defined transform
> position and rotation by default

A prefab's saved position is usually the origin, so every player lands on top of
everyone else. That single line is why switching Player Spawn Method to Random
changes nothing. The fix is putting `NetworkStartPosition` components in the
scene, or moving the prefab's transform.

## The transport is the real branch point

The part of this page I hadn't covered in the earlier posts is transports.

> Mirror uses a separate component (derived from the Transport class) to connect
> across the network. The new default Transport is **KCP** (which uses UDP, not
> TCP).

`NetworkManager` doesn't connect anything itself. **Swapping the transport
component is how you change protocol** — drop a different component on the
object and assign it to the Transport field.

The one the docs single out is Multiplex.

> Bridging transport to allow a server to handle clients on different transports
> concurrently, for example desktop clients using Telepathy together with WebGL
> clients using Websockets.

**One server accepting two transports at once.** Desktop builds come in over
TCP, browser builds over WebSockets, same server. Which means whether to support
WebGL stops being a question that splits your server setup.

The built-in transports:

| Transport | Purpose |
| --- | --- |
| KCP | the default. UDP-based |
| Telepathy | TCP |
| Simple Web Sockets | WebGL browser clients |
| Multiplexer | different transports on one server at once |
| Latency Simulation | testing against simulated latency and loss |
| Encryption | a middleman layer that encrypts another transport |

The last two **aren't on this page.** Its transport paragraph stops at "TCP,
UDP, WebGL, Steam, and many more" and gives Multiplex as the example. The list
grew on the separate Transports page.

Encryption existing is worth knowing. I covered the UDP spoofing case against
the KCP transport in the [Commands and RPCs post](/en/posts/mirror-remote-actions/);
this says a layer like that can be slotted in. Latency Simulation is for finding
out early what breaks under real latency after working fine locally.

## The server listens on every interface, not localhost

This sentence in the docs invites the wrong reading.

> In server or host mode, the game listens for incoming connections on
> `localhost` which includes the local network IP address of the server machine.

`localhost` normally means `127.0.0.1` and nothing else, in which case it
**cannot include the local network IP.** The sentence contradicts itself. What
actually gets bound is the transport's business, and the default KCP does this:

```csharp
// DualMode (IPv6)
socket.Bind(new IPEndPoint(IPAddress.IPv6Any, port));
// IPv4
socket.Bind(new IPEndPoint(IPAddress.Any, port));
```

**Every interface.** `IPAddress.Any` is `0.0.0.0` — connections arriving on any
address the machine holds. That's probably what the docs meant, but the word
`localhost` makes it read as the opposite.

The port lives on the transport, not on `NetworkManager`. KCP defaults to 7777.

```csharp
[FormerlySerializedAs("Port")]
public ushort port = 7777;
```

The earlier post established that **the server doesn't use Network Address**;
this is the other half. The client decides where to connect via
`NetworkManager`'s Network Address, and **the server opens on the transport's
Port.** Having those two values on different components is what makes this
confusing at first.

## Prefab registration depends on how many NetworkManagers you keep

This paragraph doesn't surface much elsewhere.

> If you have one Network Manager that is persisted through scenes via Don't
> Destroy On Load (DDOL), you need to register **all** prefabs to it which might
> be spawned in any scene. If you have a separate Network Manager in each scene,
> you only need to register the prefabs relevant for that scene.

**Two setups, different registration scope.** Carry one through with DDOL and
every scene's spawnables have to be registered on that one; keep one per scene
and each only needs its own.

But the same page also warns:

> You can only ever have one active Network Manager in each scene because it's a
> singleton.

Read together, the condition becomes clear. **The per-scene setup only works if
DDOL is off.** Otherwise you end up with two active managers in the next scene.
And turning DDOL off brings the problem the page warns about elsewhere.

> You should normally make sure the Network Manager persists between Scenes,
> otherwise the network connection is broken upon a scene change.

**Keeping the connection means DDOL, and DDOL means registering every prefab in
one place.** The "one per scene, only its own prefabs" branch is for
architectures where reconnecting on every scene change is acceptable. The docs
set the two options side by side, leaving that constraint scattered across
paragraphs.

## A rule the docs give and Mirror doesn't enforce

From the page's opening note:

> Do not place the Network Manager component on a networked game object (one
> which has a Network Identity component), because Mirror disables these when the
> Scene loads.

Put `NetworkManager` on an object that gets disabled at scene load and the
manager goes down with it. Sound warning — and **Mirror doesn't check for it.**
There are only two places `OnValidate` looks at `NetworkIdentity`, and both are
about the player prefab.

```csharp
if (playerPrefab != null && !playerPrefab.TryGetComponent(out NetworkIdentity _))
{
    Debug.LogError("NetworkManager - Player Prefab must have a NetworkIdentity.");
    playerPrefab = null;
}
```

For the prefab it **logs an error and reverts the value to `null`.** Whether
`NetworkManager` itself shares an object with a `NetworkIdentity`, nobody looks
at. Get it wrong and it just quietly doesn't come up.

**A rule that lives in the docs and not in the code**, so whether you read that
sentence is the whole difference. That's the kind of thing saving the official
page pays for.

## Wrapping up

- The docs' **`NetworkServer.AddPlayer` doesn't exist.** The real name is
  `NetworkServer.AddPlayerForConnection(conn, player)`. Official documentation
  doesn't guarantee current API names.
- Override `OnServerAddPlayer` and **you take on the four things the default did.**
  Skip the final registration and the object exists belonging to nobody.
- With no start position, players spawn at **the prefab's own transform.** The
  ternary in the default implementation is that branch.
- **Swapping the transport is how you change protocol**, and Multiplex lets one
  server take desktop and browser clients at once. The built-in list also has
  Latency Simulation and Encryption, neither on this page.
- **The server listens on every interface, not `localhost`.** KCP binds
  `IPAddress.Any` / `IPv6Any`. The port is on the transport (7777 by default);
  Network Address is a client-side value.
- **DDOL means registering every scene's spawn prefabs in one place.** The
  per-scene manager setup only works with DDOL off, which costs you the
  connection across scene changes.
- **"Don't put `NetworkManager` on a `NetworkIdentity` object" lives only in the
  docs.** The player prefab gets checked and reverted; this doesn't get checked
  at all.

As a reference this page still holds up. But having checked it, **the docs also
lag the code.** A method name that no longer exists is still in there, the
transport list grew on a different page, and where the server opens was
described less accurately by a sentence than by one line of `Bind`.

So the scope of the reference shifted a little. **The docs are for "where to
look"; "what exactly this is" comes from opening the class the docs point at.**
All three findings here came out that way.

## References

- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [Transports — Mirror](https://mirror-networking.gitbook.io/docs/manual/transports)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [NetworkServer.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkServer.cs)
- [KcpServer.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Transports/KCP/kcp2k/highlevel/KcpServer.cs)
- [Re-reading the Mirror NetworkManager inspector](/en/posts/mirror-networkmanager-inspector/)
