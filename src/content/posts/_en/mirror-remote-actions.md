---
pubDatetime: 2026-09-06T19:00:00+09:00
title: "Mirror's Commands and RPCs: Running on the Server Doesn't Mean It's Safe"
lang: en
translationKey: mirror-remote-actions
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - C#
  - Security
description: "I revisited a write-up on Mirror's Command, ClientRpc, and TargetRpc. The prefix rule and argument types differ from today's docs, and more importantly, the example code carries a pattern that defeats server authority."
---

I was in the middle of wiring Mirror into a multiplayer game project. While
working out how an action on one client travels through the server and reaches
the other clients — and how you actually write that path in code — I saved a
[write-up](https://bakcoding.github.io/mirror/network-mirror-015-guide-Communications-rpc/)
covering Mirror's remote actions: Command, ClientRpc, and TargetRpc. It's a
Korean translation of the official guide with examples attached, which makes it
a good way to get the three directions straight.

It's from 2022, though, so **the prefix rule and argument types differ from the
current docs** — and there's something more important than that. **The example
code carries a pattern that defeats server authority.** That's less the
author's fault than a consequence of copying the official example verbatim, but
it's the wrong thing to copy, so it's worth flagging.

## Table of contents

## Three directions

Remote actions are split by direction.

| Attribute | Direction | Receiver |
| --- | --- | --- |
| `[Command]` | Client → Server | That object on the server |
| `[ClientRpc]` | Server → Client | **All observers** of that object |
| `[TargetRpc]` | Server → Client | **One specified connection** |

All three **look like local function calls but do not run locally.** As the
source puts it, the naming is "a hint when reading the code that calls the
method" — in reality the arguments are serialized and cross the network.

Two things the source points out about `ClientRpc` are worth keeping.

- **It is invoked on the local client in host mode too.** Even in the same
  process as the server, it behaves the way it does on a remote client. That
  property keeps you from writing code that only works on the host.
- **It only reaches observers.** Clients outside network visibility won't get
  it. `[ClientRpc(includeOwner = false)]` lets you exclude the owner as well.

The rule for how `TargetRpc` picks its destination is clear too. **If the first
argument is a connection type, it goes to that connection; otherwise it goes to
the object's owner.**

## The prefix is a convention, not a requirement

The source contradicts itself. Early on it says:

> Add the \[Command\] custom attribute and **optionally** a Cmd prefix for the
> naming convention.

But in the very next paragraph:

> Command functions **must** have the prefix Cmd

**The second one is wrong.** The current Mirror docs say "should."

> Command functions **should** have the prefix 'Cmd' and cannot be static.
> This is a hint when reading code

The same goes for `Rpc` on `ClientRpc` and `Target` on `TargetRpc` — they're
recommended conventions. Nothing blocks compilation.

Back in the UNET days the prefix genuinely was enforced, and plenty of material
still carries that memory. Today it's **notation for the person reading the
code**. That's no reason to skip it, though. `DropCube()` and `CmdDropCube()`
mean completely different things at the call site, so it's better for the name
to say so. The constraint that they cannot be `static`, on the other hand, is
still real.

## The first argument type of `TargetRpc`

The source's example looks like this.

```csharp
[TargetRpc]
public void TargetDoMagic(NetworkConnection target, int damage) { }
```

The current Mirror docs use **`NetworkConnectionToClient`** in their example.
The prose in the docs still says `NetworkConnection`, so the documentation
itself is mixed — but the code is the part to follow. Since this goes from the
server to a client, "a connection toward a client" is also the more accurate
type semantically.

## Running on the server doesn't mean it's safe

This is the part I most wanted to write down. Look at the source's `CmdMagic`
example.

```csharp
[Command]
void CmdMagic(GameObject target, int damage)
{
    target.GetComponent<Player>().health -= damage;
    // ...
}
```

Being a Command, this code **runs on the server.** So it looks safe. But look
at where `damage` came from. **The client sent it.**

A Command only moves *where* the code runs to the server; **what values it runs
with is still decided by the client.** A client with patched memory sends
`CmdMagic(target, 999999)` and the server executes it as given. You've built a
server-authoritative structure and ended up with no authority.

`CmdHealMe` in the same example has the same shape. That one is safe because
`health += 10` hardcodes the value in server code — and **that difference isn't
incidental, it's the whole design point.**

It comes down to this.

- **What the client may send** — intent. "I attacked," "I picked this target,"
  "I used this skill."
- **What the server must decide** — outcome. Damage, cooldown, whether the
  target is in range, whether the resources for that skill exist.

Fixed, it looks like this.

```csharp
[Command]
void CmdCastSpell(GameObject target, int spellId)
{
    // the client only sends "what was cast"
    if (!CanCast(spellId)) return;              // resource / cooldown check
    if (!InRange(target)) return;               // range check

    int damage = GetSpellDamage(spellId);       // the server decides damage
    target.GetComponent<Player>().health -= damage;
}
```

The official example isn't written this way **because its purpose is to explain
the API.** Add the validation code and you can no longer see what `[Command]`
does. The problem is that the example gets copied straight into projects, and
the source carried the same example along.

Mirror's authority model backs up this distinction.

> When a client has authority over an object it means that they can call
> Commands and that the object will automatically be destroyed when the client
> disconnects.

**The question authority answers is "who owns this object," not "is this value
valid."** The latter is mine to write.

For what it's worth, the ownership check itself isn't an absolute line of
defense either. In 2023 security researchers showed that in Mirror's KCP
transport, UDP spoofing let you **impersonate another player and invoke their
Commands**, because connection identity relied on a hash of IP and port. Mirror
has since backported secure cookies and worked on encrypted transports — but as
grounds for the claim that **server-side value validation is necessary
regardless**, it's more than enough.

## The door `requiresAuthority = false` opens

The source introduces this option with only this much:

> A way to skip the authority check
>
> ```
> [Command(requiresAuthority = false)]
> ```

That's correct, and it's **half of it.** Turning this on lets you call Commands
on objects you don't own. You need it for shared doors, shop NPCs, world
switches — objects nobody owns.

The catch is that **at that moment Mirror stops checking who called it.** So I
have to, and the tool for it is in the docs.

> You can include an optional `NetworkConnectionToClient sender = null`
> parameter in the Command method signature and Mirror will fill in the
> sending client for you.

The docs' example is exactly that usage.

```csharp
[Command(requiresAuthority = false)]
public void CmdSetDoorState(NetworkConnectionToClient sender = null)
{
    bool hasDoorKey = sender.identity.GetComponent<PlayerState>().hasDoorKey;
    // ...
}
```

**`requiresAuthority = false` and the `sender` check belong together as a
pair.** Turn on the first without the second and any client can invoke any
object's Commands. The source presenting only the first and omitting the second
is the last item this post corrects.

## What can and cannot be passed as an argument

The source's closing line:

> Arguments to Remote Actions cannot be sub-components of a game object, such
> as script instances or Transforms.

The current docs say the same: arguments "cannot be sub-components of game
objects, such as script instances or Transforms."

Yet the examples pass a `GameObject target`. That looks like a contradiction,
but it isn't. **`GameObject` and `NetworkIdentity` can be passed; their
sub-components cannot.** What crosses the network isn't the object itself but
its `netId`, and the receiving side uses that id to find the object in its own
world. A `Transform` or a `MonoBehaviour` I wrote has no such identifier, so
there's no way to send it.

Hence the practical rule. **If you need a component, pass the `GameObject` or
`NetworkIdentity` and call `GetComponent` on the receiving side.** That's
exactly what the source's examples do.

## Traffic

One warning the source raises still holds.

> Sending commands from the client every frame can generate a lot of network
> traffic, so be careful.

Call a Command unconditionally in `Update` and you're sending dozens per
second. Continuous input like movement isn't something you push through a
Command every frame — it's a problem you solve with state synchronization or
prediction. I wrote that part up separately in
[client-side prediction in Mirror](/en/posts/mirror-client-side-prediction/).

## Wrapping up

- Remote actions are split by direction: `Command` (client → server),
  `ClientRpc` (server → all observers), `TargetRpc` (server → one specified
  connection).
- **The `Cmd`/`Rpc`/`Target` prefixes are recommended conventions, not
  requirements.** The source contradicts itself within a single section,
  saying "optionally" and then "must have." The constraint against `static` is
  real.
- `TargetRpc`'s first argument is **`NetworkConnectionToClient`** per the
  current examples.
- **A Command running on the server is not the same as it being safe.** Only
  the execution site moves to the server; the arguments are still the client's.
  **The client sends intent; the server computes the outcome.**
- Authority answers "who owns this object," not "is this value valid."
- **`requiresAuthority = false` is paired with a `sender` check.** Mirror fills
  in the caller through `NetworkConnectionToClient sender = null`.
- `GameObject` and `NetworkIdentity` work as arguments; a `Transform` or a
  script instance does not, because what crosses is the `netId`.
- Calling a Command unconditionally in `Update` blows up traffic.

Picking which of the three to use is settled by the table above. The place that
takes more work is what comes after. **Whether to trust a value that arrived at
the server is not something the framework decides for you.**

## References

- [Remote Actions — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/communications/remote-actions)
- [Authority — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/authority)
- [Impersonating Other Players with UDP Spoofing in Mirror — Include Security](https://blog.includesecurity.com/2023/04/impersonating-local-unity-players-with-udp-spoofing-in-mirror/)
- Source: [Mirror Guide Communications - Remote Actions](https://bakcoding.github.io/mirror/network-mirror-015-guide-Communications-rpc/)
