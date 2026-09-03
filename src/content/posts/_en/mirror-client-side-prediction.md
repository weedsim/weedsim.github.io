---
pubDatetime: 2026-09-03T19:00:00+09:00
title: "Mirror's Client-Side Prediction: Rewinding Without Physics.Simulate"
lang: en
translationKey: mirror-client-side-prediction
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - Network
  - Multiplayer
  - Physics
description: "Why prediction is needed and how it works, and what Mirror gave up by not resimulating the whole physics scene. Also: the docs stopped in March 2024 while the code kept moving."
---

I'm using Mirror on a multiplayer game project. Having wired it up and run
with it for a while, I got curious about **how network synchronisation
actually works** underneath, and one of the things I read while looking into
that was Mirror's
[Client Side Prediction docs](https://mirror-networking.gitbook.io/docs/manual/general/client-side-prediction).
It explains client-side prediction — the technique that makes a networked game
respond to input immediately — from scratch, using a billiards demo.

The explanation is good. It walks through why you need it, why every naive fix
breaks, and what structure you inevitably end up with. But reading it today,
three things are worth flagging: **the explanation of determinism is
imprecise**, **Smooth mode has a silently-failing trap**, and above all **the
document itself stopped in March 2024**.

## Table of contents

## When you need prediction, and when you don't

The problem is simple. Under server authority, a client input goes:

- Client sends `[Command] CmdApplyForce(force)` to the server (50 ms)
- Server runs `Rigidbody.AddForce(force)`
- Server syncs the new positions back to the client (50 ms)
- The client sees the result **100 ms later**

The first thing the docs stress is that this isn't always a problem.

> if this is not a problem in your game, then you **don't need prediction!**

Card games, strategy games and 2000s MMOs were fine waiting 50 ms. Shooters,
VR and physics games like billiards, on the other hand, feel that delay
directly in the controls. **Prediction isn't free, so the first job is deciding
whether you need it.**

## The order in which the naive fixes break

What makes the doc good is that it doesn't jump to the answer — it walks the
wrong paths first.

**1. Apply it immediately on the client only** → neither the server nor other
clients know about it.

**2. Apply it locally and send it to the server** → the two physics
simulations diverge. This is the core problem.

**3. Hard-correct to server state when it arrives** → the state that arrives is
already 100 ms old. The client has moved on, so it's (1) always mismatched and
(2) visibly snapped backwards on every correction.

At which point the answer is visible: **the client has to remember its own
past.**

## Getting the determinism story right

The doc explains why #2 breaks like this:

> most Physics engines (including Unity's PhysX) are **not deterministic**

So far so good. The next part is the problem.

> The reason for it is that 'floating-point' operations aren't deterministic.
> If we calculate `Rigidbody.position += Vector2.up` on two different
> machines, we get ever so slightly different results.

**The conclusion is right but the stated cause isn't.** IEEE 754 requires
addition, subtraction, multiplication, division and square root to be correctly
rounded. Given the same inputs at the same precision and rounding mode, a plain
addition like `position += Vector2.up` produces the same value on any machine.
Floating-point arithmetic **itself** is not nondeterministic.

The real cause is a layer below. Unity's own wording lands on it exactly:

> 2D physics in Unity can be deterministic on the same machine, but not across
> different machines.

> Different compilers and different processors implement floating point math
> differently, which affects the results of the simulation.

It's the *implementation* that diverges, not the definition of the operation.
Whether the compiler contracts a multiply-add into an FMA, how wide the SIMD
lanes are, which approximation is used for transcendentals like `sin` and
`cos`, and — for a physics engine — **what order the solver's threads
accumulate in**, all change the result.

This may read as pedantry, but the difference is practical.

- **A replay on the same machine with the same build does reproduce.** Unity
  offers "reloading the same Scene on the same machine" as the way to get a
  deterministic simulation. If floating point were nondeterministic in itself,
  that wouldn't work either.
- **It's also why fixed-point or soft-float approaches to determinism work at
  all.** Pin the implementation yourself and the platform differences go away.
  The doc is right that "fixed-point numbers ... effectively need twice as many
  operations" — but the reason the approach is available is that the cause
  lives in the implementation layer.

The doc's practical conclusion — don't rely on cross-platform determinism —
stands as written.

## How prediction actually works

The solution is for the client to keep a history of positions.

- The client runs `AddForce` immediately
- *The client saves its position every 50 ms*
- The command goes to the server (50 ms) → the server runs it → state syncs
  back (50 ms)
- The client compares against **its history from 100 ms ago**

Now it doesn't matter whether server state arrives after 50 ms or 150 ms — you
pull the matching point out of the history and compare.

Corrections work by fixing the past and re-applying the deltas on top. If the
ball was at `(1,2,0)` and has since moved a bit forward and a bit right, you
correct the past to `(1.1,2,0)` and replay "a bit forward" and "a bit right"
over it. The doc's summary is exact:

> Prediction works by **keeping** a history, **correcting** the past and
> **rewinding** the deltas on top.

## What Mirror did differently

Conventional prediction **rewinds and resimulates the whole physics scene** on
a correction, calling `Physics.Simulate()` repeatedly to replay 100 ms ago,
50 ms ago, 25 ms ago in turn. It's the most correct approach, and it's heavy on
CPU and doesn't scale as scenes grow.

Mirror doesn't do that.

> Mirror's prediction runs without `Physics.Simulate()`.

Instead it **recomputes the Rigidbody's position, rotation, velocity and
angular velocity directly in C#** — rewinding by hand, outside the physics
engine.

The reason is in the doc too. It was developed with a studio building physics
scenes with thousands of predicted Rigidbodies, where `Physics.Simulate()` was
never an option at that scale. The premise they leaned on: **even with
thousands in the scene, the local player only touches a few at a time.**

Which gives the approach its character:

> Our algorithm **sacrifices accuracy for performance!**

> Mirror's prediction works **really well** for **large physics scenes** where
> the player only **interacts** **with a few objects** at a time.

For a destruction game where you interact with thousands at once, the premise
breaks. The doc says as much: "It may or may not work for your game."

Worth noting the time this took, which the doc states plainly: four months to
get the billiards demo good enough, then another three porting it to a real
game while adding support for all collider types, joints and Rigidbodies on
child objects. **A useful number for gauging what "rewind physics by hand"
actually costs.**

## Wiring it up, and the Smooth mode trap

Attaching it is short. Add `PredictedRigidbody` to the prefab, simulate
immediately on the client, and send the command to the server.

```csharp
void HandleClick()
{
    // the way to get the Rigidbody that is safe in Smooth mode too
    Rigidbody rb = GetComponent<PredictedRigidbody>().predictedRigidbody;
    rb.AddForce(force);   // simulate on the client
    CmdAddForce(force);   // and tell the server
}

[Command]
void CmdAddForce(Vector3 force)
{
    // on the server the Rigidbody always stays on the original object
    GetComponent<Rigidbody>().AddForce(force);
}
```

The catch is the smoothing mode. There are two.

- **Smooth** — the Rigidbody and Colliders move onto an invisible ghost object
  while the Renderer stays on the original and interpolates behind it. Very
  smooth, at the cost of creating and destroying ghosts.
- **Fast** — everything stays on the original object. Snappier and harsher,
  but significantly faster.

Choose `Smooth` and **the components aren't on the original object while
predicting.** The doc lists this outright.

> `GetComponent<Rigidbody>()` won't always be available while predicting.
>
> `GetComponent<Collider>()` won't always be available while predicting.
>
> `OnCollisionEnter/Exit()` won't always be called while predicting.
>
> `OnTriggerEnter/Exit()` won't always be called while predicting.

None of this throws — it's the **silently does nothing** class of problem. A
`GetComponent<Rigidbody>()` returning `null` is the merciful case; a collision
callback that never fires leaves no log at all. Hence the doc's guidance to go
through `PredictedRigidbody.predictedRigidbody`, and to move collision code
onto the *other* object and recover the original via
`PredictedRigidbody.IsPredicted`.

### There's an error in the doc's example code

The collision callback example reads:

> ```
> void OnCollisionEnter(Collider collider)
> ```

**`OnCollisionEnter` takes a `Collision`, not a `Collider`.** Unity's docs
draw the distinction explicitly.

> In contrast to OnTriggerEnter, OnCollisionEnter is passed the Collision class
> and not a Collider.

This is annoying because Unity dispatches these callbacks by name. Get the
signature wrong and it still compiles — **the callback simply never fires.**
And this is the very section explaining how to fix collision callbacks not
firing, so copy-pasting it reproduces the symptom you came to solve.

The same snippet's `if` is also missing a closing parenthesis. That one is a
compile error, so it surfaces immediately. Together they suggest the example
was never compiled.

Pull the other collider out of the `Collision` instead:

```csharp
void OnCollisionEnter(Collision collision)
{
    if (PredictedRigidbody.IsPredicted(collision.collider,
                                       out PredictedRigidbody original))
    {
        Debug.Log($"Collided with {collision.collider} which belongs to {original}");
    }
}
```

## Reading this document in 2026

This is the important part. The doc still opens with:

> Mirror is currently experimenting with various Prediction algorithms. This is
> all purely experimental, we don't recommend using this just yet.

And the body is stopped in **March 2024**. On stacked objects it says "As of
March 2024, they generally sync well, but don't properly come to rest just
yet"; predicted player movement "has not yet been tested whatsoever"; and the
closing line is "Prediction will remain our focus for the rest of the year
2024."

Mirror itself kept moving. The changelog is up to **v97.0.0**, carrying fixes
like `Predicted Rigidbody no longer resets ghost objects`.

So: **the code updates and the documentation doesn't follow.** Concluding "it's
still experimental, can't use it" from this page alone is as risky as assuming
it behaves the way the page describes. If you're evaluating it seriously, read
the repository's changelog, `PredictedRigidbody.cs` and
`Examples/BilliardsPredicted` rather than the doc.

## What to use if you need prediction now

Even if you're already on Mirror, the surrounding landscape is worth knowing.
The Unity options, laid out:

- **Mirror's `PredictedRigidbody`** — experimental. Rigidbody only, and
  predicted player movement is untested per the docs. The low-level algorithm
  in `Prediction.cs` is generic enough for other types, but the doc is blunt:
  "you *will* have to do some work."
- **Netcode for GameObjects** — no full prediction, but a lighter-weight
  **anticipation** model. The official wording is clear:

  > Netcode for GameObjects doesn't support full client-side prediction and
  > reconciliation, but it does support client anticipation

  `AnticipatedNetworkVariable<T>` and `AnticipatedNetworkTransform` separate
  the server-authoritative value from the one on screen, and if you want full
  rollback you write it into the `OnReanticipate` callback yourself.
- **FishNet** — ships a separate prediction system, resimulation-based for
  outside forces and collisions.
- **Netcode for Entities** — full prediction and rollback if you're on the DOTS
  stack, at the cost of taking your project structure to ECS.

The deciding question is **what you're predicting**. For physics object
interaction Mirror's approach is genuinely interesting; if player movement is
the core, going by Mirror's docs alone is premature.

## Summary

- Prediction is only needed when input latency is actually a problem. The doc
  leads with that.
- Running physics on both client and server diverges. The cause isn't
  floating-point arithmetic itself but **differences in compiler and processor
  implementations**. Replays on the same machine and build do reproduce.
- Prediction's structure is: keep a history → correct the past → replay the
  deltas.
- Mirror skips `Physics.Simulate()` and rewinds Rigidbodies directly in C#. It
  trades accuracy for performance, and assumes **big scenes where you touch few
  objects at once**.
- `Smooth` mode moves the Rigidbody and Colliders onto a ghost. `GetComponent`
  and collision callbacks silently stop working.
- The doc's `OnCollisionEnter(Collider)` example is wrong; the parameter is
  `Collision`.
- The doc stopped in March 2024 while the code reached v97.0.0. Evaluate from
  the repository, not the page.

## References

- [Client Side Prediction — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/client-side-prediction)
- [Change Log — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/changelog)
- [Determinism with 2D Physics — Unity Support](https://support.unity.com/hc/en-us/articles/360015178512-Determinism-with-2D-Physics)
- [Collider.OnCollisionEnter — Unity](https://docs.unity3d.com/ScriptReference/Collider.OnCollisionEnter.html)
- [Client anticipation — Netcode for GameObjects](https://docs-multiplayer.unity3d.com/netcode/current/advanced-topics/client-anticipation/)
- [Prediction — Fish-Networking](https://fish-networking.gitbook.io/docs/guides/features/prediction)
