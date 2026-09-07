---
pubDatetime: 2026-09-07T19:00:00+09:00
title: "Why the Example in a Mirror Design-Patterns Guide Breaks on Scene Change"
lang: en
translationKey: mirror-network-design-patterns
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - C#
  - Game Server
description: "I checked a write-up on Mirror's correct design patterns. The big picture holds up, but its last example calls SceneManager.LoadScene — and a client that joins later ends up in the wrong scene."
---

Mirror wasn't the point. I was looking into **how you design a server and its
network** in general when I came across this
[write-up](https://thenight-avicii.tistory.com/221). It divides where requests
and responses go and where state changes into four buckets — Command,
ClientRpc, TargetRpc, SyncVar — and attaches a full flow, from pressing Ready in
a lobby to the game starting. It isn't a how-to for one library so much as a
demonstration of **how to split responsibilities**, which is what I was after.

The big picture holds up. But **one example presented under the heading "correct
patterns" actually causes a problem**, and two of the rules stated flatly aren't
true of Mirror today.

## Table of contents

## The big picture holds up

The write-up's one-line summary:

> 🔁 **"Data goes through SyncVar; actions go Command → Rpc"**

The direction breakdown is accurate too. Client requests are `[Command]`,
anything everyone should hear is `[ClientRpc]`, anything for one person is
`[TargetRpc]`, and a value that needs to follow along is a `SyncVar`. The four
roles don't overlap, and the line it draws between "action" and "data" is a
usable one.

What follows isn't an argument against that skeleton — it's about **where the
examples built on it leak.**

## The TargetRpc connection argument isn't required

The write-up says:

> - Runs on **the server → one specific client**
> - A NetworkConnection **is required** as the first argument

```csharp
[TargetRpc]
void TargetSendErrorMessage(NetworkConnection conn, string msg) { }
```

**It isn't required.** The rule in the docs is a conditional.

> If the first parameter of your TargetRpc method is a `NetworkConnection` then
> that's the connection that will receive the message regardless of context. If
> the first parameter is any other type, then the owner client of the object
> with the script containing your TargetRpc will receive the message.

So leaving the connection out sends it **to that object's owner.** The docs'
`TargetHealed` example has that shape.

```csharp
[TargetRpc]
void TargetShowMessage(string msg) { }   // goes to this object's owner
```

This matters because sending **to that player** from a script on the player
object is the most common use of `TargetRpc` by far. In that case the code that
fetches and passes a connection isn't needed at all. Believing it's required
means writing that `connectionToClient` plumbing every single time.

The argument's type, in current examples, is `NetworkConnectionToClient`. I
covered that part in the [Commands and RPCs post](/en/posts/mirror-remote-actions/).

## A client can write a SyncVar

The write-up asserts:

> ❗ SyncVars **can only be changed on the server**
>
> For a client to change one → request the server via \[Command\] → change it on
> the server

True by default. But Mirror has a setting that flips the direction.

```csharp
public enum SyncDirection { ServerToClient, ClientToServer }

[Tooltip("Server Authority calls OnSerialize on the server and syncs it to clients.\n\nClient Authority calls OnSerialize on the owning client, syncs it to server, which then broadcasts it to all other clients.\n\nUse server authority for cheat safety.")]
[HideInInspector] public SyncDirection syncDirection = SyncDirection.ServerToClient;
```

It's per-`NetworkBehaviour` and defaults to `ServerToClient`. Set it to
`ClientToServer` and **the owning client writes directly, with the server taking
it and broadcasting to everyone else.** Two conditions are needed: the direction
must be `ClientToServer`, **and that client must own the object.**

That said, the tooltip's last line stands in for the conclusion.

> **Use server authority for cheat safety.**

So the write-up's advice is still good advice. What's wrong is the part that
says it **isn't possible.** Being able to do something you're advised against is
not the same as not being able to do it. The first leaves room for a judgment
call — "a nickname is a value nobody gains from spoofing, so flipping the
direction is fine" — and the second removes the option entirely.

## The scene change is the problem

Here's where it actually breaks. The write-up's final example:

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

**It looks like it works.** Every client connected at that moment receives the
RPC and every one of them changes scene. The problem is whoever comes next.

The comment on `NetworkManager`'s `networkSceneName` states it precisely.

> The name of the current network scene. set by NetworkManager when changing the
> scene. **new clients will automatically load this scene. Loading a scene
> manually won't set it.**

A newly connected client follows `networkSceneName`. Change scene directly with
`SceneManager.LoadScene` and **that value is never updated.** The server and the
existing clients are in GameScene while a late joiner still gets the lobby
scene. Sitting in different scenes, spawning and synchronization both come
apart.

There's a different tool for this.

> **ServerChangeScene** — Change the server scene and all client's scenes across
> the network. Called automatically if onlineScene or offlineScene are set, but
> it can be called from user code to switch scenes again while the game is in
> progress.

"Called from user code to switch scenes again while the game is in progress" is
exactly this situation. Fixed, the RPC disappears entirely.

```csharp
[Server]
public void CheckAllReady()
{
    if (!allReady) return;
    NetworkManager.singleton.ServerChangeScene("GameScene");
}
```

**One call on the server puts every connected client and every future one in the
same scene.** The write-up's version broadcasts "load this scene" to the people
who are here; this one changes what the network's current scene *is*. The
outcomes overlap, but the scope doesn't.

I can guess how the write-up got there. **`ClientRpc` is exactly the right tool
for "tell everyone"**, so folding a scene change into that frame looks natural.
But a scene change is something Mirror already tracks as its own state, which
puts it outside the frame.

## The "common mistakes" table mixes two kinds of thing

The write-up's last table lists four items side by side, all marked ❌. **They
aren't the same kind of item.**

| The write-up's item | What it actually is |
| --- | --- |
| Changing a SyncVar on the client | Not possible by default, but `SyncDirection` changes that |
| Calling a Command on a non-local-player object | `requiresAuthority = false` is a documented exception |
| Calling a Command from a TargetRpc | Nothing blocks it. This is design advice |
| Calling a Command again inside a ClientRpc | Nothing blocks it. This is design advice |

The first two are rules with documented exceptions; the last two are advice that
neither the compiler nor the runtime enforces. The write-up labels those two
"may fail to be called" and "risk of circular calls" — but **without a reason,
that can't be remembered as a rule or applied as a judgment.**

Calling a `Command` inside a `ClientRpc` is risky structurally, not
syntactically. Take what the server broadcast and send it back to the server,
and it's easy to write the server broadcasting again in response. It comes back
multiplied by the number of clients. **Less a prohibition than a place where
it's easy to build a feedback loop.**

`requiresAuthority = false` I covered in the
[Commands and RPCs post](/en/posts/mirror-remote-actions/). It's the sanctioned
path for calling a Command on an object you don't own, and it comes paired with
a check on who called it.

## `[Server]` and `[ServerCallback]`

The write-up's example uses `[Server]` without explaining it. There are four
paired attributes and the difference is one thing: whether a warning is logged.

| Attribute | Meaning |
| --- | --- |
| `[Server]` | "Only a server can call the method (throws a warning when called on a client)." |
| `[ServerCallback]` | "Same as **Server** but does not throw a warning when called on client." |
| `[Client]` | "Only a Client can call the method (throws a warning when called on the server)." |
| `[ClientCallback]` | "Same as **Client** but does not throw a warning when called on server." |

**Both block execution identically; only the log differs.** Put `[Server]` on
something like `Update` that runs every frame on both sides and the client
console fills with warnings — that's where `[ServerCallback]` goes. The
write-up's `CheckAllReady()` is only ever meant to run on the server, so
`[Server]` is right: that's a place you want to be told.

## What's missing from this blueprint

The write-up's `Command` example:

```csharp
[Command]
void CmdRequestReady()
{
    isReady = true;      // logic that should only run on the server
    RpcSetReadyUI();     // notify clients
}
```

It's a ready toggle, so the example itself is fine. But the flow it diagrams —
button → Command → state change → Rpc — **has no place drawn in it for a
check.** "Actions go Command → Rpc" has no validation step.

A ready button is harmless, but put an attack or a purchase in the same frame
and you get a structure where the server executes whatever value the client
sent. That running on the server isn't the same as being safe is what I wrote up
in the [earlier post](/en/posts/mirror-remote-actions/). If this blueprint gets
one more stage, that's where it goes.

## Wrapping up

- The direction split and "data through SyncVar, actions Command → Rpc" is a
  sound skeleton.
- **TargetRpc's connection argument isn't required.** Omit it and it goes to the
  object's owner — which covers the common case of messaging the player
  themselves.
- **It's not that a client can't write a SyncVar.**
  `SyncDirection.ClientToServer` plus ownership does it. The tooltip just adds
  "Use server authority for cheat safety."
- **`SceneManager.LoadScene` inside `RpcStartGame()` genuinely breaks.** Loading
  directly never sets `networkSceneName`, so **a late joiner gets the previous
  scene.** Use `NetworkManager.singleton.ServerChangeScene()`.
- Of the four "common mistakes", two are **rules with documented exceptions**
  and two are **unenforced design advice.** Grouped under one ❌, you can't tell
  them apart.
- `[Server]` and `[ServerCallback]` **block execution the same way; only the
  warning differs.**

The hard part of writing design-pattern guides is all right here. **The part
that splits things by direction you can write straight from the docs; what
causes trouble is what doesn't fit into those directions — a scene change, say,
which the framework already tracks as its own state.** Build four boxes and
everything starts looking like it belongs in one.

## References

- [Remote Actions — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/communications/remote-actions)
- [Attributes — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [NetworkBehaviour.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkBehaviour.cs)
- [Re-reading the Mirror NetworkManager inspector](/en/posts/mirror-networkmanager-inspector/)
- Source: [Correct patterns for Mirror network design](https://thenight-avicii.tistory.com/221)
