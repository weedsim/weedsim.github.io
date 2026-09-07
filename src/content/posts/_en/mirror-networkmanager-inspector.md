---
pubDatetime: 2026-09-07T18:00:00+09:00
title: "Re-reading the Mirror NetworkManager Inspector: The Server Doesn't Use Network Address"
lang: en
translationKey: mirror-networkmanager-inspector
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - C#
description: "I checked a field-by-field table of the NetworkManager inspector against the tooltips in Mirror's source. Some groupings are off, and the Headless Start Mode options and the unit on Evaluation Interval are wrong."
---

I'd saved a [write-up](https://thenight-avicii.tistory.com/124) that lays out
the `NetworkManager` inspector field by field in tables. Open that inspector for
the first time and more than twenty fields land on you at once, so having a
one-line gloss on each is useful.

This time I checked the tables **against the `[Tooltip]` strings in Mirror's
source**, one field at a time. Most of it holds up, but a few groupings are off,
**two entries are outright wrong**, and the values the tooltips carry — the ones
the write-up didn't copy over — turned out to be the more useful half.

## Table of contents

## The inspector groups differ

The `[Header]` order in `NetworkManager.cs` is this.

Configuration → Auto-Start Options → **Sync Settings** → Network Info →
Security → Authentication → Scene Management → Player Object →
Snapshot Interpolation → Connection Quality → Interpolation UI

Three things sit somewhere else in the write-up.

| Field | Where the write-up puts it | Actual group |
| --- | --- | --- |
| Send Rate | Auto-Start Options | **Sync Settings** |
| Disconnect Inactive Connections / Timeout | Network Info | **Security** |
| Registered Spawnable Prefabs | its own section | **Player Object** |

**The write-up has no Sync Settings group at all.** Send Rate got folded into
the Auto-Start discussion, when in the inspector it's a separate group holding
two more fields the write-up never mentions: Unreliable Baseline Rate and
Unreliable Redundancy.

If you plan to read the article alongside the inspector, top to bottom, that
mismatch gets in the way.

## Headless Start Mode has no Host option

The write-up says:

> Do Nothing → doesn't auto-start
>
> Can be set to Host / Server / Client, etc.

**Host isn't one of the options.** The enum has three members.

```csharp
public enum HeadlessStartOptions { DoNothing, AutoStartServer, AutoStartClient }
```

The call site handles only those.

```csharp
if (Utils.IsHeadless())
{
    if (!Application.isEditor || editorAutoStart)
        switch (headlessStartMode)
        {
            case HeadlessStartOptions.AutoStartServer:
                StartServer();
                break;
            case HeadlessStartOptions.AutoStartClient:
                StartClient();
                break;
        }
}
```

Which makes sense on reflection. Headless is for a dedicated server build with
no display, and a host doubles as a client. **There's no reason to auto-start a
host with no screen.**

There's one more thing to read out of that `if`. **It does nothing in the editor
by default** — `editorAutoStart` is what extends Headless Start Mode into the
editor. The write-up describes Editor Auto Start as "whether to automatically
run a server or client in the Unity editor," but precisely, it's **a switch for
applying Headless Start Mode in the editor too.** It isn't a separate auto-start
setting.

## Evaluation Interval is in seconds, not ticks

The write-up's table:

> Evaluation Interval — how often quality is evaluated (**in ticks**)

The tooltip:

> Interval in **seconds** to evaluate connection quality.
> Set to 0 to disable connection quality evaluation.

**Seconds, and the default is 3.** Read as ticks, 3 would mean evaluating every
50ms at a Send Rate of 60 — off by a factor of 60 from the real 3 seconds. And
**setting it to 0 turns evaluation off entirely**, which the write-up doesn't
mention.

For Evaluation Method the write-up only offers "e.g. Simple = the default
latency evaluation." The tooltip splits the two by what they measure.

> Simple: based on rtt and jitter.
> Pragmatic: based on snapshot interpolation adjustment.

One watches RTT and jitter; the other watches how much snapshot interpolation is
being adjusted. Same word "quality," different subject.

## The server doesn't use Network Address

The write-up says:

> Network Address — the server address (e.g. localhost, 127.0.0.1, or an EC2 IP)

Not wrong, but **half of it is missing.** The tooltip's second sentence is the
important one.

> Network Address where the client should connect to the server.
> **Server does not use this for anything.**

This field is **where the client goes.** Put an EC2 IP here in a server build
and the server does not bind to that address. The docs point the same way.

> In client mode, the game attempts to connect to the network address
> specified.

Where the server actually listens is decided by **the transport component's
settings**, not by `NetworkManager`. The write-up's EC2 IP example is
unfortunate precisely because it evokes setting up a server, which is the
reading this field invites and doesn't support.

That an FQDN works is only in the docs — you can put something like
"game.example.com" straight in.

## Online Scene triggers on server start, not on connection

The write-up's table:

> Online Scene — the multiplayer scene to switch to **on successful connection
> to the server**

The tooltip anchors it differently.

> Scene that Mirror will switch to when the **server is started**. Clients will
> receive a Scene Message to load the server's current scene when they connect.

**The server switches when it starts**, and a client that connects is told
whichever scene the server is in right now. The outcome looks similar from the
client's seat, but the anchor is different: a client joining after the server has
already moved on gets **the server's scene at that moment**, not Online Scene.

For Offline Scene the tooltip says "when the client or server is **stopped**,"
which is broader than the write-up's "when the connection to the server drops."
Shutting the server down yourself counts.

Offline Scene Load Delay has its purpose written into the tooltip, and that's
absent from the write-up.

> Optional delay that can be used after disconnecting to show a
> 'Connection lost...' message or similar before loading the offline scene

**It exists to buy time for a "connection lost" message.** It isn't a bare wait;
it has a job.

## Registered Spawnable Prefabs isn't the only path

The write-up states it flatly:

> → only prefabs registered here can be NetworkServer.Spawn()'d

**No.** The docs name another path.

> You can add prefabs to the list shown in the inspector labelled Registered
> Spawnable Prefabs. You can also register prefabs via code, with the
> `NetworkClient.RegisterPrefab` method.

And in the source, that list does exactly one thing.

```csharp
foreach (GameObject prefab in spawnPrefabs.Where(t => t != null))
    NetworkClient.RegisterPrefab(prefab);
```

**The inspector field is a convenience that calls `RegisterPrefab` for you.** If
your prefabs are decided at runtime or loaded through Addressables, register
them in code. Believing "if it can't go in the inspector, it can't be spawned"
means never trying that structure in the first place.

## What Player Spawn Method assumes

The write-up says:

> Player Spawn Method — how players spawn (Random, Round Robin, etc.)

True, but **the premise is missing.** The tooltip says what it's choosing among.

> Round Robin or Random order of **Start Position** selection

The opening lines of `GetStartPosition()` are the whole story.

```csharp
public virtual Transform GetStartPosition()
{
    // first remove any dead transforms
    startPositions.RemoveAll(t => t == null);

    if (startPositions.Count == 0)
        return null;
    // ...
}
```

`startPositions` is filled by the `NetworkStartPosition` components in the
scene. **With none, it returns `null` and neither Random nor Round Robin does
anything.** That's the situation where all your players spawn stacked on the
same spot and flipping the method to Random changes nothing. The thing to fix is
the scene, not the dropdown.

Auto Create Player is anchored slightly differently too. The write-up says "on
connecting to the server"; the tooltip says:

> Should Mirror automatically spawn the player **after scene change**?

## The fields the write-up gave no values for

The write-up's tables tell you what each field *is*, but mostly leave *what to
set it to* blank. For some fields the tooltip has that. Send Rate is the clearest
case.

| Tooltip's recommendation | Example game | Reason |
| --- | --- | --- |
| 60–100Hz | fast paced, like Counter-Strike | minimize latency |
| around 30Hz | games like WoW | minimize computations |
| 1–10Hz | slow paced, like EVE | — |

The write-up's "e.g. 60 = 60 sends per second (1 tick ≈ 16ms)" says what the
number means; **the table above says which number to pick.** The default of 60
lands on the first row, so a slower game should be turning it down.

Defaults are worth collecting too, so you can tell what's already been touched
when you open an inspector.

| Field | Default |
| --- | --- |
| Dont Destroy On Load | `true` |
| Run In Background | `true` |
| Send Rate | `60` |
| Max Connections | `100` |
| Disconnect Inactive Connections | **`false`** |
| Disconnect Inactive Timeout | `60`s |
| Exceptions Disconnect | **`true`** |
| Evaluation Interval | `3`s |

The two in bold are the easy ones to get backwards. **Auto-disconnect is off by
default, and disconnect-on-exception is on.** From the write-up's tables both
read as a plain "whether to…", with no way to tell which way they start.

Exceptions Disconnect is a rare field whose tooltip includes the reasoning.

> For security, it is recommended to disconnect a player if a networked action
> triggers an exception. This could prevent components being accessed in an
> **undefined state, which may be an attack vector for exploits.**

"Whether to disconnect on an exception" carries none of that judgment. Leaving
an object's post-exception state reachable is the attack path, and that's why
it ships on. Same family as the server-side validation I wrote up in the
[Commands and RPCs post](/en/posts/mirror-remote-actions/).

## Wrapping up

- Three groupings differ from the write-up. **Send Rate is under Sync
  Settings**, the Disconnect Inactive fields are under **Security**, and
  Registered Spawnable Prefabs sits inside **Player Object**.
- **Headless Start Mode has no Host option** — `DoNothing`, `AutoStartServer`,
  `AutoStartClient` only, and it needs `editorAutoStart` to apply in the editor.
- **Evaluation Interval is in seconds** (default 3). Zero disables evaluation.
- **Network Address is client-only.** The tooltip states "Server does not use
  this for anything." Where the server listens is the transport's setting.
- **Online Scene triggers when the server starts.** A late-joining client gets
  the server's scene as of that moment.
- **Registered Spawnable Prefabs is a convenience.** The inspector list just
  calls `NetworkClient.RegisterPrefab`, which you can call yourself.
- **Player Spawn Method does nothing without a `NetworkStartPosition`** —
  `GetStartPosition()` returns `null`.
- The two confusing defaults: **auto-disconnect is off (`false`),
  disconnect-on-exception is on (`true`).**

Inspector round-ups are easy to write for the field names and tedious to write
for the tooltips. So what survives is usually the name and a one-line gloss,
while the units, the defaults, and the assumptions drop out. Everything this
post caught was sitting in that same place — the sentence that appears when you
hover the field.

## References

- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [Mirror prerequisites](/en/posts/mirror-networking-basics/)
- Source: [\[Mirror\] NetworkManager](https://thenight-avicii.tistory.com/124)
