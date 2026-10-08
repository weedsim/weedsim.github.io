---
pubDatetime: 2026-10-08T19:30:00+09:00
title: "What Holds a Stretching Ragdoll Together Is projection, Not Strength"
lang: en
translationKey: ragdoll-joint-stability
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - Physics
  - Simulation
  - C#
description: "A ragdoll walkthrough blames bodies stretching like taffy on a low Strength value. But Strength is documented nowhere in the Unity manual, and stretching has a page of its own. That page points at something else."
---

I wanted characters to **fall by physics instead of playing a fixed death
animation** when they die, so that the way they collapse differs every time.
Looking for a way to do that I found out about ragdolls, and clipped a
walkthrough. The post is a 2024 repost, and the original source it names is a
Korean blog by 베르. It follows along in screenshots: open the wizard, slot in
the bones, set Total Mass to 45, and push the chest rigidbody with `AddForce`
to launch the character. The procedure still works exactly as written.

The problem is the one place it explains something. The post introduces the
`Strength` field this way. My translation from the Korean:

> The Strength value is the value for the force that helps the ragdoll keep
> its shape and not collapse.

And then it diagnoses a symptom:

> In games with ragdolls, the problem where a dead character's body stretches
> out like taffy and flails around is caused by this Strength value being low.

Trying to find a source for those two sentences I went through the manual, and
**I could not find any document that describes `Strength`.** I opened four
versions — the 4.5 legacy docs, 2018.3, 6.3 LTS and the current 6.6 — and none
of the four describes that field.

Yet "stretches out like taffy and flails around" is something Unity gives **a
page of its own**. And what that page points at is not `Strength`.

Five things checked out. **`Total Mass` and `Strength` are documented nowhere
in the manual**, **the prescription for stretching is `enableProjection`, and
that prescription has a stated cost**, **a mass ratio of ten is the line where
jitter starts**, **there are two cases where `AddForce` quietly does nothing**,
and **the death handling the docs describe is not swapping objects**.

The last item bears directly on the goal. To make the collapse differ every
time you need **that one frame** where control passes from animation to
physics — and all four of the earlier items go wrong in that frame.

This blog has a few physics posts already.
[What FreezePositionY freezes is world Y](/en/posts/rigidbody-constraints/)
covered Rigidbody constraints, and
[Bounciness and friction belong to a pair, not to an object](/en/posts/rigidbody-physics-material/)
covered the value two colliding colliders make together. This post is about
**a cluster of rigidbodies, chained by joints, failing to hold each other
together.** It doesn't hand anything off, though. Every explanation and code
sample it needs is reproduced here in full.

Checked on **2026-10-08** against Unity **6.6**. 6.6 is the current Supported
release, 6.7 is Beta and 6.3 is the LTS. The quotes below are from 6.6, and I
confirmed the same sentences in 6.3.

## Table of contents

## The wizard makes three kinds of component: colliders, rigidbodies, joints

First, what the wizard actually makes. The menu path is spelled out in the
manual.

> Select GameObject > 3D Object > Ragdoll… from the menu bar.

The original right-clicked in the Hierarchy and went to
`3D Object > Ragdoll...`, which is the same menu. And three kinds of thing get
made.

> Unity can then generate all colliders, rigidbody components, and joints
> that make up a ragdoll

**Colliders, rigidbodies, joints.** The third is this post's subject. The
joints are `CharacterJoint`, and the manual names their axes.

> For character joints made with the Ragdoll wizard, the following naming
> scheme applies:

In that table `Twist` is "Twists the limb." and `Swing 1` is "Limb's largest
swing axis." So one ragdoll is **a dozen or so rigidbodies chained together by
`CharacterJoint`s**. A body "stretching" means a link in that chain has come
apart.

There's one note about import settings too.

> If needed, disable Generate Colliders in the Import Settings dialog.

I could not find a basis in the manual for the original's recommendation to
use a T-pose. This page says nothing about pose. It may well come from
experience, and I'm not saying it's wrong. **It just isn't something the docs
vouch for.**

## Total Mass and Strength are documented nowhere in the manual

Besides the slots for bones, the wizard window has two numeric fields. The
original explains both. My translation:

> The Total Mass value is the value that sets the ragdoll's weight. Once you
> set it, each bone's weight is set to match the average human weight ratio
> per body part.

I looked for these two fields across four versions of the manual.

| Documentation | `Total Mass` | `Strength` |
| --- | --- | --- |
| 6.6 (current Supported) | not described | not described |
| 6.3 LTS | not described | not described |
| 2018.3 | not described | not described |
| 4.5 (legacy) | not described | not described |

All the 6.6 "Create a ragdoll" page says about the fields is to drag things
into them. It tells you what the inspector shows once you've slotted the bones
and created the ragdoll ("The inspector displays the following components:" —
Skinned Mesh Renderer, Box Collider, Rigidbody), and that's where it stops.

**So neither the original's Total Mass explanation nor its Strength
explanation has a primary source.** I'm not saying either is wrong. I'm saying
they **can't be checked.** The "average human weight ratio per body part" in
particular sounds plausible, but that ratio table isn't published anywhere.

There is one thing you can do here. **Read the numbers after you create it.**
Once the wizard finishes, every bone carries a Rigidbody, and each one's
`Mass` field shows the value that actually went in. No guessing needed. The
next section is about why you'd want to look.

## Stretching has a page of its own

Unity covers "stretches out like taffy" on a page called **Joint and ragdoll
stability**, a sibling of the ragdoll page in the docs tree. Stretching is
written there in so many words.

> This can result in stretching.

The claim is that when the solver fails to hold the ragdoll together under
extreme conditions, it stretches — and the prescription follows immediately.

> enable projection on the Joints using either ConfigurableJoint.projectionMode
> or CharacterJoint.enableProjection.

**`enableProjection`, not `Strength`.** The wizard makes `CharacterJoint`s, so
that's the one that applies here.

The same page has different prescriptions for different symptoms. What the
original bundles into one phrase, "stretches out and flails around," is
**three distinct symptoms** in the documentation.

| Symptom | What the docs point at |
| --- | --- |
| Stretching | Enable projection on the joints |
| Joints separating or moving erratically | Disable preprocessing |
| Connected rigidbodies jittering | Raise Default Solver Iterations |
| Bounces being inaccurate | Raise Default Solver Velocity Iterations |
| Bodies starting out overlapped | Lower `Rigidbody.maxDepenetrationVelocity` |

The jitter advice comes with concrete numbers.

> increasing the Default Solver Iterations value to between 10 and 20

And the prescription for separation and erratic movement:

> Disabling preprocessing can help prevent Joints from separating or moving
> erratically

Dig one layer under that one and the explanation is missing.
`Joint.enablePreprocessing`'s scripting reference only describes what happens
**when the flag is set.**

> Toggle preprocessing for this joint.

> When the flag is set, PhysX would ignore constraints that produce huge
> impulses

What happens when you turn it off isn't on that page. Neither is a default
value. The manual says "disabling it can help," and the API page says only
"when it's set, this happens." **You can stitch the two into an inference, but
the docs didn't write that inference down.** I'll stop at that line here.

There's one more caution about angles.

> Avoid small Joint angles of Angular Y Limit and Angular Z Limit.

Very narrow angle limits are unstable, so if you want an axis locked, set it
to 0 instead.

## projection isn't free

Is turning on `enableProjection` the end of it? The scripting reference spells
out the cost.

> public bool enableProjection;

> Brings violated constraints back into alignment even when the solver fails.

It pulls violated constraints back into place even when the solver fails —
which is why the stretching goes away. But the next sentence matters.

> Projection is not a physical process and does not preserve momentum or
> respect collision geometry.

**Not a physical process, does not preserve momentum, does not respect
collision geometry.** So projection isn't solving the physics better, it's
**dragging the result into place by hand.** An arm can come back through a
wall. The docs' own recommendation is subtle about it.

> It is best avoided if practical, but can be useful in improving simulation
> quality

> where joint separation results in unacceptable artifacts.

"Best avoided if practical" comes first. So there's an order. **Remove the
cause of the stretching first** — mass ratios, scale, solver iteration count —
and only turn projection on **as a last resort** when visible separation
remains. Explain it all with `Strength` alone and that order disappears.

## A mass ratio of ten is where jitter starts

On the cause side, the first number to look at is mass. The same stability
page gives the line as a figure.

> It's okay to have one Rigidbody with twice as much mass as another,

> when one mass is ten times larger than the other, the simulation can become
> jittery.

**Two times is fine, ten times jitters.** This is where the previous section's
"read the numbers" lands. Set Total Mass to 45 and the wizard divides that 45
across the bones, but how many times apart a torso and a wrist end up is
something you can't know before creating it. **Skimming each Rigidbody's
`Mass` after creation and looking at the max-to-min ratio** is the check you
can actually run.

Worth seeing alongside that: the ratio has nothing to do with the Total Mass
value. Raise 45 to 90 and **the ratio is unchanged.** That's why making the
whole thing heavier doesn't fix jitter.

The same page cautions about scale.

> Try to avoid scaling different from 1 in the Transform containing Rigidbody
> or the Joint.

Plenty of projects import a character model and then size it with the
Transform scale — and that line catches them the moment a ragdoll goes on.

Finally, there's one prohibition about driving joint-connected bodies from
code.

> Never use direct Transform access with Kinematic Rigidbody components
> connected by Joints

## Kilograms is right. The sentence only exists in one place, though

The reason the original gives for setting Total Mass to 45 is this. My
translation:

> Since Unity says the default unit of the Mass value is 1 for 1 kg

**That's right.** And it has one source. The Rigidbody **component reference**
says it.

> Define the mass of the GameObject (in kilograms).

> Mass is set to 1 by default.

What's interesting is that the same fact **cannot be found in the scripting
reference.** Here's all the `Rigidbody.mass` page says.

> The mass of the rigidbody.

> Different Rigidbodies with large differences in mass can make the physics
> simulation unstable.

No unit. Instead there's a warning that mass differences destabilize the
simulation — and **no number.** The numbers (two times, ten times) exist only
on the stability page. You have to open three pages to assemble one picture.

That's why this post read the manual and the scripting reference as a pair.
Read only one side and you finish without the unit, or without the line.

## Two cases where AddForce quietly does nothing

Here is the original's code. The comment is as written.

```csharp file="RagDollPhysics.cs (original)"
using UnityEngine;

public class RagDollPhysics: MonoBehaviour
{
    [SerializeField]
    Rigidbody spineRigidBody;

    // Update is called once per frame
    void Update ()
    {
        if(Input.GetKeyDown(KeyCode.Space))
        {
            spineRigidBody.AddForce(new Vector3(0f, 10000f, 10000f));
        }
    }
}
```

It works. But the `AddForce` reference lists **two conditions under which the
force is simply ignored**, and a ragdoll steps on both of them in practice.

> Also, the Rigidbody cannot be kinematic.

> If a GameObject is inactive, AddForce has no effect.

First, **it must not be kinematic.** If your structure animates the character
and hands over to a ragdoll at the moment of death, the bone rigidbodies are
kinematic right up until then. Call `AddForce` **before** flipping
`isKinematic = false` and nothing happens. No error, no warning.

Second, **an inactive object gets no effect.** The pattern the original
recommends later — "keep a separate ragdoll object and activate it to swap" —
touches exactly this condition. The order of activating and applying force
starts to matter.

The force mode is worth a note too. The declaration shows the default.

> public void AddForce(Vector3 force, ForceMode mode = ForceMode.Force);

The default is `ForceMode.Force`. And here's when it's applied.

> The physics system applies the effects during the next simulation run

`ForceMode.Force` is **a continuous force that accumulates until the next
simulation step.** The original's code calls it from `Update`, though. `Update`
runs per frame; the simulation runs on the fixed step. A single `GetKeyDown`
is true for exactly one frame, so this code calls once and is done — it works
out. **But put a "while held" style condition in the same place and the number
of calls accumulated into one step varies with frame rate.** If the intent is
one instantaneous launch, `ForceMode.Impulse` is the way to write that intent
down.

For reference, applying a force wakes a sleeping body.

> By default the Rigidbody's state is set to awake once a force is applied

## What the docs describe isn't swapping objects

The original closes by recommending an operational pattern. My translation:

> You make a ragdoll object like this, then while the normal character with
> animation moves around, when the character dies you turn off the normal
> character object's active state and turn on the ragdoll object's to swap
> them; this is used often.

It's a widely used pattern and it has advantages. But **it isn't the method
the Unity docs write down.** `Rigidbody.isKinematic`'s scripting reference
names ragdolls explicitly and recommends something else.

> Kinematic rigidbodies are also particularly useful for making characters
> which are normally driven by an animation,

> but on certain events can be quickly turned into a ragdoll by setting
> isKinematic to false.

**Keep one object and flip `isKinematic`.** The example on that page shows the
transition as two methods, and what gets flipped is not one value but two.
`EnableRagdoll()` puts `rb.isKinematic = false` next to
`rb.detectCollisions = true` with this comment:

> Let the rigidbody take control and detect collisions.

The other side, `DisableRagdoll()`, pairs `rb.isKinematic = true` with
`rb.detectCollisions = false` and says:

> Let animation control the rigidbody and ignore collisions.

What kinematic cuts off is on the same page.

> If isKinematic is enabled, Forces, collisions or joints will not affect the
> rigidbody anymore.

**Forces, collisions and joints, all cut.** So during animation the joints do
nothing at all, and the instant `isKinematic` goes false the whole joint chain
starts working at once. That transition frame is where the stretching and
jitter from the earlier sections are most likely to blow up.

One thing is missing from that example too. **There's no line disabling the
`Animator`.** The example only writes "animation control" in a comment and
never touches an animation component. Leave the `Animator` on while setting
`isKinematic = false` and the animator keeps trying to write bone transforms
while physics writes the same transforms. The example below disables the
`Animator` explicitly. **That line isn't in the docs, so I'm flagging it as an
inference.**

If you do go with swapping objects, it's worth knowing what deactivation
does. I wrote about that in
[SetActive(false) doesn't pause a coroutine, it ends it](/en/posts/unity-object-pooling/).

Last, the original's performance advice. My translation:

> Ragdoll performance is on the somewhat heavy side, because the physics for
> all of the character's limbs and the torso's joints all have to be computed.

The direction is right. And for the advice to "turn physics off after a few
seconds," the documented means is **flipping `isKinematic` back to true.** As
quoted above, forces, collisions and joints are all cut, which makes it the
most direct switch for stopping the computation.

## Where and why you'd use it

### A working example

Written the way the docs describe: **one object plus an `isKinematic`
transition.** Collect the bone rigidbodies and flip them together.

```csharp file="Scripts/Character/RagdollController.cs"
using UnityEngine;

public class RagdollController : MonoBehaviour
{
    // The instantaneous launch force. Measured for ForceMode.Impulse.
    private const float DeathImpulse = 12f;

    [Header("References")]
    [Tooltip("Left empty, these are gathered from children in Awake")]
    [SerializeField]
    private Rigidbody[] _boneBodies;

    [SerializeField]
    private Rigidbody _spineBody;

    [Header("Transition")]
    [Tooltip("Seconds before physics is switched off after going ragdoll")]
    [SerializeField]
    private float _settleSeconds = 4f;

    private Animator _animator;
    private bool _isRagdoll;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("There is no Animator.", this);
        }

        if (_boneBodies == null || _boneBodies.Length == 0)
        {
            _boneBodies = GetComponentsInChildren<Rigidbody>();
        }

        // While alive, animation owns the transforms.
        SetRagdoll(false);
    }

    public void Die(Vector3 direction)
    {
        if (_isRagdoll)
        {
            return;
        }

        SetRagdoll(true);

        // Apply force *after* clearing kinematic. Reverse it and it's ignored.
        if (_spineBody != null)
        {
            _spineBody.AddForce(direction.normalized * DeathImpulse,
                                ForceMode.Impulse);
        }

        Invoke(nameof(FreezeRagdoll), _settleSeconds);
    }

    private void SetRagdoll(bool isRagdoll)
    {
        _isRagdoll = isRagdoll;

        // This line is not in the docs' example. It keeps the animator and
        // physics from fighting over the same transforms.
        if (_animator != null)
        {
            _animator.enabled = !isRagdoll;
        }

        foreach (Rigidbody body in _boneBodies)
        {
            if (body == null)
            {
                continue;
            }

            body.isKinematic = !isRagdoll;
            body.detectCollisions = isRagdoll;
        }
    }

    // Switch physics off once motion has settled — the original's perf advice.
    private void FreezeRagdoll()
    {
        foreach (Rigidbody body in _boneBodies)
        {
            if (body == null)
            {
                continue;
            }

            body.isKinematic = true;
            body.detectCollisions = false;
        }
    }
}
```

There's a reason `_animator` and `body` don't use `?.`. Both are
`UnityEngine.Object`, and a reference left empty in the inspector can end up
in a state that **looks like null without being C#'s null.** So the
comparisons are `== null` and `!= null`. For a plain C# object `?.` is right.

The stability settings aren't code — you touch them in the inspector and in
project settings. The order is the order the docs imply: **cause first.**

```text file="Order to check when a ragdoll stretches"
1. Skim the Mass on each bone Rigidbody
   -> is the max-to-min ratio under ten? (two is fine)
2. Is the Scale 1 on the Transform holding the Rigidbody / Joint?
3. Project Settings > Physics > Default Solver Iterations
   -> if it jitters, 10 to 20
4. Are there very narrow angles in Angular Y / Z Limit?
   -> lock with 0 instead
5. If visible separation still remains
   -> Enable Projection on the CharacterJoint
      (turn it on knowing it does not preserve momentum)
```

### How to choose

Symptom to prescription. All of these come from the stability page.

| Symptom | Where to look |
| --- | --- |
| The body stretches | Mass ratio, scale -> `enableProjection` last |
| Joints separate or move erratically | Preprocessing |
| Connected bodies jitter | Default Solver Iterations 10-20, mass ratio |
| Bounces are inaccurate | Default Solver Velocity Iterations 10-20 |
| They start out interpenetrating | Lower `Rigidbody.maxDepenetrationVelocity` |
| Unstable at narrow angles | Lock the angle with 0 |

Death handling splits like this.

- **One object plus an `isKinematic` flip** — the method the docs write down.
  Position and pose carry straight over, and reviving uses the same switch.
  Disabling the `Animator` stays your code's responsibility.
- **Two objects swapped** — the method the original recommends. You can tune a
  dedicated ragdoll prefab separately. In exchange you own the activation
  order and the pose sync, and `AddForce` doesn't reach an inactive object.

### Where not to use it

- **`AddForce` before `isKinematic = false`.** The docs say "the Rigidbody
  cannot be kinematic." It's ignored silently.
- **`AddForce` on an inactive object.** "If a GameObject is inactive, AddForce
  has no effect."
- **Trying to fix jitter with Total Mass.** Making the whole thing heavier
  leaves **the ratio unchanged.**
- **Scaling the Transform that holds a `Rigidbody` or `Joint`.** The docs tell
  you to stay at 1 there.
- **Leaving projection on as a default.** It's a correction that doesn't
  preserve momentum, and the docs themselves write "best avoided if
  practical."
- **Driving joint-connected kinematic bodies through `transform`.** "Never use
  direct Transform access..."

## Summary

- What the wizard makes is **colliders, rigidbodies and joints**, and the
  joints are `CharacterJoint`. Stretching is a link in that chain coming
  apart.
- **`Total Mass` and `Strength` are described in none of 4.5, 2018.3, 6.3 or
  6.6.** The original's two explanations aren't so much wrong as
  **uncheckable.**
- The prescription for stretching is **`CharacterJoint.enableProjection`**,
  written on a dedicated page, Joint and ragdoll stability. `Strength` does
  not appear on it.
- **projection has a stated cost:** "not a physical process and does not
  preserve momentum or respect collision geometry." The documented order is
  cause removal first, projection last.
- The jitter line is given as a figure. **Two times is fine, ten times
  jitters.** Raising Total Mass does not change the ratio.
- **Kilograms is right.** But that sentence only exists in the component
  reference; `Rigidbody.mass`'s scripting reference has no unit. The numeric
  line lives on yet another page.
- There are **two cases where `AddForce` is silently ignored**: when the body
  is kinematic, and when the object is inactive. Death handling steps on both.
- The death handling the docs write down is **an `isKinematic` flip, not an
  object swap**, and it flips `detectCollisions` **as a pair.** Even that
  example has no line disabling the `Animator`.

---

### References

- [Ragdoll physics — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/ragdoll-physics-section.html)
- [Create a ragdoll — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/wizard-RagdollWizard.html)
- [Joint and Ragdoll stability — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/RagdollStability.html)
- [Rigidbody component reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-Rigidbody.html)
- [CharacterJoint.enableProjection — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CharacterJoint-enableProjection.html)
- [Joint.enablePreprocessing — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Joint-enablePreprocessing.html)
- [Rigidbody.isKinematic — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-isKinematic.html)
- [Rigidbody.AddForce — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-AddForce.html)
- [Rigidbody.mass — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody-mass.html)
- [Create a ragdoll — Unity 6.3 LTS Manual](https://docs.unity3d.com/6000.3/Documentation/Manual/wizard-RagdollWizard.html)

The starting point for this post was
[\[유니티\] Ragdoll 사용법 스크랩 (제일 이해하기 쉬웠음)](https://plzlotto1st.tistory.com/59)
(l\_\_j\_\_h, 2024-01-31). That post is itself a repost, and the original source
it names in the body is [베르의 프로그래밍 노트](https://wergia.tistory.com/67?category=748455).
Every Korean sentence quoted above comes from that body text, and the
translations are mine. I followed the procedure as written and checked each
explanation against both the current Unity 6.6 manual and the scripting
reference. Checked on 2026-10-08.
