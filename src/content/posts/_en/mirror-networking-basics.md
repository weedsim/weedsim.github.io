---
pubDatetime: 2026-09-07T18:00:00+09:00
title: "Mirror Prerequisites: The Asset Store Build Is Over a Year Behind GitHub"
lang: en
translationKey: mirror-networking-basics
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - C#
description: "I revisited a write-up covering what to know before adding Mirror. The concepts still hold up, but the first item doesn't: the Asset Store build stopped in February 2025 while GitHub releases kept coming."
---

I was already using Mirror in a multiplayer game project and went looking to
re-check the fundamentals, which is how I ended up saving this
[write-up](https://orakjaengi.tistory.com/entry/Mirror-Networking-%EC%9C%A0%EB%8B%88%ED%8B%B0-Mirror-Networking-%EC%82%AC%EC%A0%84-%EC%A7%80%EC%8B%9D).
It puts server/client/host, `NetworkBehaviour`, `NetworkIdentity`, and
`NetworkManager` on a single page, which makes it a good sweep.

The conceptual material holds up against the current docs even though it's from
January 2025. But **the first item — where to install from — is a problem**,
and several things the source passes over in one line have their justification
sitting in Mirror's own code.

## Table of contents

## Where to get it

The source's first item is an Asset Store link. Mirror's official site points
its Download menu at the same place, so it isn't bad advice. The problem is the
age of that build.

| Source | Version | Last updated |
| --- | --- | --- |
| Asset Store | 96.0.1 | 2025-02-27 |
| GitHub releases | v96.10.2 | 2026-06-20 |

**Sixteen months, ten minor versions apart.** The Asset Store page still lists
Unity 2021.3.35 or later and it's still free — only the updates stopped.

Mirror's Deprecations page carries this line.

> Some changes in this document may apply to an upcoming release to the Asset
> Store

That means **the docs can run ahead of the Asset Store build.** In practice
this shows up as following the documentation and finding the API isn't in your
project. Before suspecting your own code, check the build version.

The gap isn't only about features. Security fixes ship in releases too — like
the secure cookie backport for the KCP transport I covered in
[an earlier post](/en/posts/mirror-remote-actions/). Skipping a year of
releases means skipping that as well.

None of this is the author's fault. In January 2025 the Asset Store build was
two months old. The lesson here is closer to this: **an installation pointer
you saved is only as current as the day you saved it.**

## Server, client, host

The source gets this right. The server holds authority over game state, the
client sends input and draws what it receives, and the host does both in one
process. There are only three ways to start.

```csharp
NetworkManager.singleton.StartServer();
NetworkManager.singleton.StartClient();
NetworkManager.singleton.StartHost();
```

The source classifies the host as being for "small-scale multiplayer, local
testing" but doesn't say **why it gets pushed into that role.** Two reasons.

- **Only the host player has no latency.** The host's input never crosses the
  network. Everyone else is behind by their RTT. In anything competitive, that
  asymmetry becomes a direct advantage.
- **When the host leaves, the session ends.** The server *is* that player's
  process. Mirror doesn't ship host migration.

Host mode does have one good property in exchange. `ClientRpc` is invoked on
the host's local client too, which makes it hard to write code that only works
on the host. I wrote that part up separately in the
[Commands and RPCs post](/en/posts/mirror-remote-actions/).

## `NetworkBehaviour` and `NetworkIdentity`

The source puts it this way.

> If an object has a class inheriting from NetworkBehaviour, then either the
> **parent object** or **that object** must have a Network Identity component.

That's correct, and **why the "parent" case is allowed is written as a comment
in Mirror's source.**

```csharp
// [RequireComponent(typeof(NetworkIdentity))] disabled to allow child NetworkBehaviours
[AddComponentMenu("")]
[HelpURL("https://mirror-networking.gitbook.io/docs/guides/networkbehaviour")]
public abstract class NetworkBehaviour : MonoBehaviour
```

`RequireComponent` was **deliberately turned off.** With it on, every
`NetworkBehaviour` you add to a child object would drag a `NetworkIdentity`
along. The use case is in the `NetworkIdentity` source comments: "Some users
need NetworkTransform on child bones, etc."

The reverse direction is blocked. `NetworkIdentity` cannot be nested.

> Mirror does not support Network Identities on nested GameObjects. … ensure
> your parent GameObject is the only GameObject in the stack with a Network
> Identity.

**One `NetworkIdentity` at the root, as many `NetworkBehaviour`s as you like
down the children.** That one line is the whole rule for laying out a
hierarchy. The docs also say that a child needing the identifier should reach
up with `GetComponentInParent`.

One parenthetical in the source is wrong. Its Network Identity section adds
"(you may also inherit it in your class)" — but **`NetworkIdentity` cannot be
inherited.**

```csharp
[DisallowMultipleComponent]
[DefaultExecutionOrder(-1)]
[AddComponentMenu("Network/Network Identity")]
[HelpURL("https://mirror-networking.gitbook.io/docs/components/network-identity")]
public sealed class NetworkIdentity : MonoBehaviour
```

It's `sealed`. Putting two on one object is blocked by
`[DisallowMultipleComponent]` as well. It isn't something to extend — it's
closer to **a marker you attach and nothing else.**

## netId is unique only at runtime

The source writes:

> Because every Network Identity has a **unique netId** on the network,
> different clients can use the netId to tell whether they're looking at the
> same object.

Correct. The source comment adds one more qualifier, though.

> The unique network Id of this object (**unique at runtime**).

**It's unique within a session only.** The server hands them out incrementing
from 1, and bringing the server down and back up restarts at 1 via
`ResetNextNetworkId()`. So don't persist a netId or use it as a database key —
a different object in the next session will get that number.

It also helps to know there are three identifiers with different jobs.

| Identifier | What it points at | When it's decided |
| --- | --- | --- |
| `netId` | this live instance on the network | issued by the server on spawn |
| `sceneId` | an object placed in the scene ahead of time | when the scene is saved |
| `assetId` | the prefab to spawn | at prefab registration |

This is also why `GameObject` works as a remote action argument and `Transform`
doesn't. What crosses is the `netId`, and a component doesn't have one.

## Network Manager and the HUD

The source lists "provides a **test** HUD UI" as a `NetworkManager` feature.
The docs are blunter.

> It is not, however, intended to be included in finished games. … you should
> create your own UI later on, to allow your players to find and join games

**The HUD is just those three methods turned into three buttons.** Better to
start out knowing you'll be building the connection UI yourself.

There's one item the source skips that you will hit early.

> You should normally make sure the Network Manager persists between Scenes,
> otherwise the network connection is broken upon a scene change. To do this,
> ensure the Don't Destroy On Load checkbox is ticked.

If the connection drops the moment you move from the lobby to the game scene,
it's usually this checkbox.

## Network Room Manager

The source lists "separating the **lobby and game scenes**" as a
`NetworkRoomManager` feature, and its comparison table marks scene separation
as **required**. **"Required" is not an overstatement.** The source code checks
it at server start.

> NetworkRoomManager RoomScene is empty. Set the RoomScene in the inspector for
> the NetworkRoomManager

> NetworkRoomManager PlayScene is empty. Set the PlayScene in the inspector for
> the NetworkRoomManager

It trips in `OnStartServer()`. Leave the inspector fields empty and you haven't
broken a recommendation — the server doesn't start. The room player prefab gets
checked in `OnValidate` too.

```csharp
if (roomPlayerPrefab != null)
{
    NetworkIdentity identity = roomPlayerPrefab.GetComponent<NetworkIdentity>();
    if (identity == null)
    {
        roomPlayerPrefab = null;
        Debug.LogError("RoomPlayer prefab must have a NetworkIdentity component.");
    }
}
```

The same `OnValidate` clamps `minPlayers` to at most `maxConnections` and at
least 0. Type a big number into the inspector and it quietly shrinks, so if the
value doesn't match what you set, look here.

| Item | `NetworkManager` | `NetworkRoomManager` |
| --- | --- | --- |
| Lobby | build it yourself | built in |
| Scenes | a single scene works | Room and Gameplay both required |
| Ready state | none | `CmdChangeReadyState`, `allPlayersReady` |
| Minimum players | none | `minPlayers` (clamped to `maxConnections`) |

## Running more than one editor

The source links ParrelSync under helpful pages. It's still a live option
(latest release 1.5.3, 2024-06-16). Its README describes it as "another Unity
editor window opened and mirror the changes from the original project" — a
second editor reflecting the original project.

Since January 2025 there's one more option: Unity's **Multiplayer Play Mode**
package. It creates virtual players inside a single project, supporting up to
four editor players including the main one, plus up to four local builds. It
requires Unity 6000.0.50f1 or later.

That said, **neither Mirror's docs nor Unity's state that the two work
together** — not as far as I could find. So don't jump to "on Unity 6, just use
MPPM." Verify it in your project first and decide from there.

## Wrapping up

- **The Asset Store build (96.0.1, 2025-02-27) is over a year behind the GitHub
  releases (v96.10.2, 2026-06-20).** If you follow the docs and the API isn't
  there, suspect the build version before your own code.
- The host is "small-scale and for testing" because **only the host has no
  latency, and when the host leaves the session ends.**
- **One `NetworkIdentity` at the root, `NetworkBehaviour`s down the children.**
  That follows from Mirror deliberately disabling `RequireComponent`.
- **`NetworkIdentity` is `sealed`.** It can't be inherited and extended.
- **`netId` is unique only at runtime.** Don't persist it or use it as a
  database key. Scene objects use `sceneId`, prefabs use `assetId`.
- The docs say the HUD is "not intended to be included in finished games." If
  the connection drops across a scene change, check Don't Destroy On Load.
- `NetworkRoomManager`'s scene separation isn't a recommendation — it's **a
  check that stops `OnStartServer()`.**
- For multiple editors there's now Multiplayer Play Mode alongside ParrelSync,
  though I found no doc confirming it with Mirror.

That's what re-checking the fundamentals mid-project turned up. **The concepts
were still the concepts; what had changed was where you get the thing.** In a
prerequisites write-up, the first part to spoil isn't the explanation — it's
the installation pointer. Twenty months on, the explanations were fine and only
the link in the first line had fallen sixteen months of releases behind.

## References

- [Network Identity — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-identity)
- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [Network Manager HUD — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager-hud)
- [Network Room Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-room-manager)
- [Deprecations — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/deprecations)
- [Releases — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/releases)
- [Mirror — Unity Asset Store](https://assetstore.unity.com/packages/tools/network/mirror-129321)
- [ParrelSync](https://github.com/VeriorPies/ParrelSync)
- [About Multiplayer Play Mode — Unity](https://docs.unity3d.com/Packages/com.unity.multiplayer.playmode@1.6/manual/index.html)
- Source: [\[Mirror Networking\] Unity Mirror Networking Prerequisites](https://orakjaengi.tistory.com/entry/Mirror-Networking-%EC%9C%A0%EB%8B%88%ED%8B%B0-Mirror-Networking-%EC%82%AC%EC%A0%84-%EC%A7%80%EC%8B%9D)
