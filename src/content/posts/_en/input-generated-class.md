---
pubDatetime: 2026-09-22T17:00:00+09:00
title: "The Point of Generate C# Class Is SetCallbacks"
lang: en
translationKey: input-generated-class
featured: false
draft: false
tags:
  - Unity
  - Input System
  - Input
  - C#
description: "A 2024 walkthrough of the Input System — from installation to three ways of driving it — checked against the current docs. All three of its samples carry the same dead conditional, and the generated class never uses the one feature that justifies generating it."
---

I clipped this one while going through the Input System in detail, with
**Generate C# Class** in particular on my mind — I wanted to know exactly what
that checkbox buys you. The post walks the whole path in one go: installation,
Input Action asset setup, and three different ways of driving it, which makes
it a good map of the territory.

So this post **walks the same path from start to finish.** Material I've
already covered elsewhere isn't handed off to a link — the sample code is
repeated here in full. On top of that I've layered what checking the original
against the current documentation turned up.

Three things turned up: a **dead conditional present in all three samples**, a
**sample labeled "Invoke C# Events" that isn't actually that feature**, and a
**generated class that never uses its own reason for existing**.

## Table of Contents

## Why the Input System

The old `Input` class is **polling**. Every frame, in `Update`, you ask what
the current state is.

```csharp
public float speed = 5f;

void Update()
{
    float horizontal = Input.GetAxis("Horizontal");
    float vertical = Input.GetAxis("Vertical");

    Vector3 movement = new Vector3(horizontal, 0, vertical);
    transform.Translate(movement * speed * Time.deltaTime);
}
```

It keeps asking on frames with no input at all. And `"Horizontal"` — a
**string — is the binding**, so changing a key means changing Input Manager
settings or writing your own script.

The Input System puts the **Action** in the middle instead. You receive "Move
happened," not "W was pressed," and which key on which device maps to Move is
decided separately, in the asset. That's what makes rebinding at runtime
possible.

| | Legacy Input Manager | Input System |
|---|---|---|
| Processing | Polling | Event-driven, action-centric |
| Device support | Keyboard, mouse, basic gamepad | Extensible device hierarchy |
| Runtime rebinding | Effectively impossible | Supported |
| Multiple devices | Unsupported | Supported |

## Installation and Active Input Handling

Install **Input System** from the Package Manager. A dialog asks whether to
switch the backends, and the docs describe that process this way.

> **The Editor restarts during this process.**

The setting itself lives at **Edit > Project Settings > Player > Other
Settings > Active Input Handling**, and you pick one of three.

- **Input Manager (Old)** — the classic `Input` class only.
- **Input System Package (New)** — the new system only.
- **Both** — both at once.

The docs explicitly allow running both.

> You can enable **both** the old **and** the new system at the same time. To
> do so, set **Active Input Handling** to **Both**.

> If you change this setting you must restart the Editor for it to take effect.

If you're retrofitting an existing project, staying on Both while you migrate
is the safer route. Switch to New with even one line still calling `Input` and
that line becomes a runtime exception.

## The Shape of an Input Action Asset

Create the asset from **Project window → + → Input Actions**. The original
renamed it to `PlayerInputSystem`, and I'll keep that name here. Double-click
to open the editor.

There are three layers.

- **Control Scheme** — a logical grouping of devices. `PC` (keyboard + mouse),
  `Gamepad`, and so on.
- **Action Map** — a bundle of actions. `PlayerMaps`, `UI` — split **by
  context**. The point is that you can enable and disable a whole map at once.
- **Action** — an individual input like `Move` or `Jump`. Actual keys attach
  below it as **Bindings**.

The original's setup: add Keyboard and Mouse to a `PC` control scheme, create a
`PlayerMaps` action map, rename the action to `Move`, delete the default
`<No Binding>`, and bind WASD with **Add Up\Down\Left\Right Composite**.

### The Three Action Types

The Action Type decides **how the action lets values through**. The API docs
put it precisely.

> **Value** — An action that reads a single value from its connected sources.
> If multiple bindings actuate at the same time, performs **disambiguation to
> detect the highest value contributor at any one time.**

> **Button** — An action that acts as a trigger. A button action has a
> **defined trigger point** that corresponds to `Performed`. After being
> performed, the action goes back to waiting state to await the next
> triggering.

> **Pass Through** — An action that has no specific type of behavior and
> instead acts as a **simple pass-through for any value change on any bound
> control.**

Three things separate them in practice.

| | Value | Button | Pass Through |
|---|---|---|---|
| Disambiguation | Yes | Yes | **No** |
| Initial state check on enable | **Yes** | No | No |
| Callbacks | started / performed / canceled | started / performed / canceled | **mostly performed** |
| Used for | Movement, look, trigger pressure | Jump, fire | Per-device input, gestures |

The **initial state check** is what makes Value distinct. If a key is already
held when the action is enabled, started/performed arrive immediately without
any further movement. That fits input where the *current state* matters, like
movement. Button skips the check — you don't want a jump firing the instant the
map turns on.

Since this is movement, the original sets Action Type to **Value** and Control
Type to **Vector2**. That's the right call.

## Approach 1 — PlayerInput Component + Send Messages

Add the **PlayerInput** component to the object and wire Actions to
`PlayerInputSystem`, Default Scheme to `PC`, Default Map to `PlayerMaps`.

Then pick a **Behavior**. The original says "four" and lists three; per the
docs there really are four.

- **Send Messages** — "Uses `GameObject.SendMessage` on the `GameObject` that
  the `PlayerInput` component belongs to."
- **Broadcast Messages** — "Uses `GameObject.BroadcastMessage`." (The one the
  original left out. It reaches child objects too.)
- **Invoke Unity Events** — a separate `UnityEvent` per message type, wired
  from the Events foldout in the Inspector.
- **Invoke CSharp Events** — plain C# events exposed through the `PlayerInput`
  API rather than the Inspector: `onActionTriggered`, `onDeviceLost`,
  `onDeviceRegained`.

With Send Messages, the method called is **the action name prefixed with
`On`**. `Move` → `OnMove`. The original's code:

```csharp
//MoveController 내부
//입력 액션 이름이 Move라면, OnMove라는 이름의 메서드가 호출됩니다.
//키가 눌릴 때 새로운 입력값이 생성되고, 키를 뗐을 때 값이 초기화(0, 0)되므로 두 번 호출됩니다
    enum Status
    {
        None,
        Move
    }

    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }

    void OnMove(InputValue value)
    {
        Vector2 input = value.Get<Vector2>();
        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;

            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("OnMove");
        }
    }
```

Because it rides on `SendMessage`, **the method name is the contract**, and the
compiler has no idea whether it's right. Rename the action from `Move` to
`Movement` and `OnMove` quietly stops being called.

That `if (input != null)` catches the eye. I'll come back to it.

## Approach 2 — Referencing the Action Directly

Here's the code the original files under "Invoke C# Events."

```csharp
//MoveController 내부
    enum Status
    {
        None,
        Move
    }

    PlayerInput _playerInput;
    InputAction _moveAction;

    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    private void Awake()
    {
        _playerInput = GetComponent<PlayerInput>();
        _moveAction = _playerInput.actions["Move"];
        _moveAction.performed += OnMoveAction_performed;
    }
    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }
    private void OnMoveAction_performed(InputAction.CallbackContext context)
    {
        Vector2 input = context.ReadValue<Vector2>();

        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;
            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("OnMoveAction_performed");
        }
    }
```

The code works. **The label doesn't fit, though.** Invoke CSharp Events, as the
docs describe it, means using the events `PlayerInput` exposes — such as
`onActionTriggered`. This code instead pulls **the action object out via
`_playerInput.actions["Move"]` and attaches to that action's `performed`.**

The difference is real. This code **works regardless of the Behavior setting.**
Leave Behavior on Send Messages and `performed` still arrives, because the
subscription is on the action itself. So this sample isn't one of the Behavior
branches — it's a **fourth path that goes around Behavior entirely**.

There's a problem here too. `Awake` only does `+=`, and **nothing ever does
`-=`.** `PlayerInput.actions` is the asset instance the component holds, so if
the component disappears with the subscription still in place, a destroyed
object's method stays in the delegate list. Moving it to an
`OnEnable`/`OnDisable` pair is the fix.

> See also — I've written about this approach on its own:
> [Subscribing to InputAction directly](/posts/input-action-subscribe/),
> [PlayerInput's Behavior](/posts/unity-playerinput/).

## `Vector2` Can Never Be null

All three samples carry this shape.

```csharp
Vector2 input = value.Get<Vector2>();
if (input != null)
{
    _status = input != Vector2.zero ? Status.Move : Status.None;
    // ...
}
```

You read `input != null` as **defensive code checking whether input arrived**.
It isn't. `Vector2` is a value type — the scripting reference labels it
**"struct in UnityEngine"** — and a value-type variable cannot hold null.

Yet the code compiles. The C# docs say why.

> A **nullable value type `T?`** supports the predefined unary and binary
> operators, **or any overloaded operators**, that are supported by the value
> type `T`. These are known as **lifted operators**.

> A **non-nullable value type `T` is implicitly convertible to its
> corresponding nullable value type `T?`.**

`Vector2` defines `==`, so the compiler lifts that operator to `Vector2?`,
promotes `input` to `Vector2?`, and compares. **It's syntactically valid, and
the result is always true.**

Compiler warning CS0472 states the situation in so many words.

> The result of the expression is always `value1` since a value of type
> `value2` is never equal to `null` of type `value3`.

Whether that warning actually fires for a type like `Vector2` that defines its
own `==` isn't something the docs state, so I won't claim it either way. **What
is certain is that the `if` can never be false.** It adds a level of
indentation and blocks nothing.

The check you actually want is **already on the very next line.**

```csharp
_status = input != Vector2.zero ? Status.Move : Status.None;
```

Comparing against `Vector2.zero` is what really answers "is there input?" Delete
the outer `if` and the behavior is identical.

The same goes for `float`, `int`, and `Vector3`. In Unity code a null check only
means something for types deriving from `UnityEngine.Object` — and those come
with their own separate reason not to use `?.`.

## Approach 3 — Generate C# Class

Now for the main event. Select the Input Actions asset, tick **Generate C#
Class** in the Inspector, and hit Apply. The docs, verbatim:

> To enable this option, tick the **Generate C# Class** checkbox in the importer
> properties in the Inspector of the `.inputactions` Asset, then select
> **Apply**.

> You can optionally choose a **path name, class name, and namespace** for the
> generated script, or keep the default values.

`PlayerInputSystem.cs` appears next to the asset. And the PlayerInput component
gets deleted — this approach doesn't use it.

The action map has to be **enabled yourself.** The docs are clear.

> For actions defined elsewhere, such as in an Action Asset not assigned as
> project-wide, or defined your own code, they **begin in a disabled state, and
> you must enable them before they will respond to input.**

> You can enable actions individually, or **as a group by enabling the Action
> Map which contains them.**

Being able to toggle a whole map is exactly why you split `UI` from
`PlayerMaps`. Disable `PlayerMaps` while UI is up and the same keys stop moving
the character.

The original's code:

```csharp
PlayerInputSystem _playerInputSystem;
    enum Status
    {
        None,
        Move
    }
    Vector3 _direction;
    float _speed = 4f;
    Status _status = Status.None;

    private void Awake()
    {
        _playerInputSystem = new PlayerInputSystem();
    }
    private void OnEnable()
    {
        // 입력 Action Map 활성화
        _playerInputSystem.PlayerMaps.Enable();

        _playerInputSystem.PlayerMaps.Move.performed += Move_performed;
        _playerInputSystem.PlayerMaps.Move.started += Move_started;
        _playerInputSystem.PlayerMaps.Move.canceled += Move_canceled;
    }

    private void OnDisable()
    {
        // 입력 Action Map 비활성화
        _playerInputSystem.PlayerMaps.Disable();

        _playerInputSystem.PlayerMaps.Move.performed -= Move_performed;
        _playerInputSystem.PlayerMaps.Move.started -= Move_started;
        _playerInputSystem.PlayerMaps.Move.canceled -= Move_canceled;
    }

    void Update()
    {
        if (_status == Status.Move)
        {
            transform.rotation = Quaternion.LookRotation(_direction);
            transform.Translate(Vector3.forward * _speed * Time.deltaTime);
        }
    }
    private void Move_performed(InputAction.CallbackContext obj)
    {
        Vector2 input = obj.ReadValue<Vector2>();

        if (input != null)
        {
            _status = input != Vector2.zero ? Status.Move : Status.None;
            _direction = new Vector3(input.x, 0f, input.y);
            Debug.Log("Move_performed");
        }
    }
    private void Move_started(InputAction.CallbackContext obj)
    {
        Debug.Log("Move_started");
    }
    private void Move_canceled(InputAction.CallbackContext obj)
    {
        Debug.Log("Move_canceled");
    }
```

Putting `Enable`/`Disable` in `OnEnable`/`OnDisable` and pairing subscribe with
unsubscribe is better than the Approach 2 sample. But this code **generates the
class and then doesn't use what the class gives you.**

## The Point of the Generated Class Is `SetCallbacks`

Here's how the docs state the purpose of Generate C# Class.

> This **removes the need to manually look up Actions and Action Maps using
> their names**, and also provides an easier way to set up callbacks.

The first half — string lookups disappear — is well known. **The second half is
where the real value is**, and the original's sample skips it. One action costs
three `+=` lines and three `-=` lines. Six actions is thirty-six lines, and
**the two lists have to be kept in sync by hand.** Miss one and the
subscription just stays.

The official sample looks different.

```csharp
public class MyPlayerScript : MonoBehaviour, IGameplayActions
{
    MyPlayerControls controls;

    public void OnEnable()
    {
        if (controls == null)
        {
            controls = new MyPlayerControls();
            // Tell the "gameplay" action map that we want to get told about
            // when actions get triggered.
            controls.gameplay.SetCallbacks(this);
        }
        controls.gameplay.Enable();
    }

    public void OnDisable()
    {
        controls.gameplay.Disable();
    }

    public void OnUse(InputAction.CallbackContext context)
    {
        // 'Use' code here.
    }

    public void OnMove(InputAction.CallbackContext context)
    {
        // 'Move' code here.
    }
}
```

**One line of `SetCallbacks(this)` replaces those thirty-six.** An interface
(`IGameplayActions`) is generated alongside, named after the action map, and
implementing it makes **the methods the action list**. Add an action and the
interface gains a member; don't implement it and **it doesn't compile.**

The difference laid out:

| | Manual `+=` | `SetCallbacks` |
|---|---|---|
| Lines per action | 3 subscribe + 3 unsubscribe | 0 |
| Adding an action | Add to both lists by hand | **The interface tells you with a compile error** |
| Missed unsubscribe | Stays, silently | Not applicable |
| Swapping the callback target | Redo every `-=`/`+=` | `SetCallbacks(other)` |

**This matters more than losing the strings.** String lookups can be reduced by
caching even in the direct-subscription approach, but "I added an action and
forgot to wire the callback" is caught **at compile time only by the generated
interface.**

One caveat: receiving through `SetCallbacks` **merges
`started`/`performed`/`canceled` into a single method.** If you need to tell
them apart, check `context.phase`. If you genuinely want them separate the way
the original does, `+=` is the right choice — though the original's
`Move_started`/`Move_canceled` only call `Debug.Log`, so that isn't why they're
split.

## The Generated Class Is `IDisposable`

The original creates the instance in `Awake` and stops there.

```csharp
private void Awake()
{
    _playerInputSystem = new PlayerInputSystem();
}
```

But the generated class has something to clean up. `DefaultInputActions`, which
Unity ships and which is generated the same way, is declared like this.

```csharp
public class DefaultInputActions : IInputActionCollection2, IInputActionCollection,
    IEnumerable<InputAction>, IEnumerable, IDisposable
```

**`IDisposable` is in there, and there's a `public void Dispose()`.** Cleaning
it up when the component goes away is the right move.

```csharp
private void OnDestroy()
{
    _playerInputSystem?.Dispose();
}
```

`_playerInputSystem` is a plain C# object, not a `UnityEngine.Object`, so `?.`
is fine here. For a Unity object it would have to be `if (obj != null)`.

## Where and Why You'd Use It

To put it plainly: **you use the generated class in order to get the
interface.** Write the code on that premise and it comes out like this.

### Generated Class + Receiving via the Interface

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// Handles movement by receiving the generated PlayerInputSystem class's
/// callbacks through its interface.
/// </summary>
public class MoveController : MonoBehaviour, PlayerInputSystem.IPlayerMapsActions
{
    [Header("Movement")]
    [SerializeField, Range(1f, 20f), Tooltip("Movement speed (m/s)")]
    private float _speed = 4f;

    private PlayerInputSystem _input;
    private Vector3 _direction;

    private void Awake()
    {
        _input = new PlayerInputSystem();
        // Add an action and this interface gains a member; skip it and it won't compile.
        _input.PlayerMaps.SetCallbacks(this);
    }

    private void OnEnable()
    {
        _input.PlayerMaps.Enable();
    }

    private void OnDisable()
    {
        _input.PlayerMaps.Disable();
    }

    private void OnDestroy()
    {
        // The generated class is IDisposable.
        _input?.Dispose();
    }

    private void Update()
    {
        if (_direction == Vector3.zero)
        {
            return;
        }

        transform.rotation = Quaternion.LookRotation(_direction);
        transform.Translate(Vector3.forward * _speed * Time.deltaTime);
    }

    // Interface implementation. started / performed / canceled all land here.
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 input = context.ReadValue<Vector2>();
        // Vector2 is a struct. A null check is meaningless; check for the zero vector.
        _direction = new Vector3(input.x, 0f, input.y);
    }
}
```

What I changed from the original, and why:

- **`SetCallbacks(this)` is called once, in `Awake`.** There's no need to call
  it again on every `OnEnable`. Only enable/disable stays in
  `OnEnable`/`OnDisable`.
- **`Dispose` in `OnDestroy`.** The generated class is `IDisposable`.
- **The null check is gone.** It means nothing for `Vector2`; the zero-vector
  test is the real condition, and the `if` in `Update` is where it belongs.
- **The status enum is gone.** The original keeps `Status.None`/`Status.Move`,
  but whether `_direction` is zero answers the same question. Don't keep state
  in two places.
- **`_speed` is a `[SerializeField]`.** The original hardcodes
  `float _speed = 4f;`, so you can't touch it in the Inspector. `[Range]`
  bounds it and cuts down on typos.

### Choosing Among the Three

| Approach | String lookups | Adding an action | In depth |
|---|---|---|---|
| PlayerInput Behavior | Send Messages depends on method names | Method names must match | [Behavior](/posts/unity-playerinput/) |
| `actions["Move"]` direct subscription | **Yes** | Add subscription code by hand | [Direct subscription](/posts/input-action-subscribe/) |
| Generate C# Class + `SetCallbacks` | None | **Compile error tells you** | This post |

If you need local multiplayer, `PlayerInput` is the real answer — device
assignment and `PlayerInputManager` live there. **For single-player and a
code-centric approach, the generated class** is the safest, because the action
list and the code are bound together by the compiler.

### Where Not to Use It

- **Null checks on value types.** `Vector2`, `float`, `int` all count.
- **Generating the class and then wiring `+=` by hand.** That throws away half
  of what generating it bought you. The only exception is needing the phases
  separately.
- **Skipping `Dispose`.** `IDisposable` is right there in the declaration.
- **Calling `SetCallbacks` on every `OnEnable`.** Once is enough.
- **`+=` in `Awake` with no `-=` anywhere.** That's the Approach 2 sample.

## Wrapping Up

- **Changing Active Input Handling restarts the Editor.** Both is the safe
  setting mid-migration.
- **There are three Action Types: Value / Button / Pass Through.** Only Value
  does an initial state check on enable, and Pass Through skips disambiguation.
  Movement is Value.
- **PlayerInput has four Behaviors.** The original left out Broadcast Messages.
- **The original's "Invoke C# Events" sample isn't that Behavior.** It pulls the
  action out and subscribes directly, so it works regardless of the Behavior
  setting — but it never unsubscribes.
- **`Vector2` is a struct and can never be null.** `if (input != null)` compiles
  thanks to lifted operators and is **always true**. The real test is the
  comparison against `Vector2.zero`.
- **The value of Generate C# Class is `SetCallbacks` and the generated
  interface.** In the docs' words, it "removes the need to manually look up
  Actions and Action Maps using their names, and also **provides an easier way
  to set up callbacks**."
- **The interface turns the compiler into your watchdog.** Add an action and a
  member appears; don't implement it and the build fails. With hand-written
  `+=`, a miss is silent.
- **The generated class is `IDisposable`.** `DefaultInputActions` declares it,
  and `Dispose` in `OnDestroy` covers it.
- **Enabling is still on you.** `Enable`/`Disable` in `OnEnable`/`OnDisable` is
  the same across all three approaches.

Posts that line up three approaches side by side show you **how to use each**
but rarely **why you'd pick one**. If the reason for the generated class is
remembered only as "the strings go away," you end up skipping the very thing
that delivers it: `SetCallbacks`.

---

### References

- [Input Action Assets — Input System docs](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/ActionAssets.html)
- [Actions — Input System docs](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Actions.html)
- [PlayerInput component — Input System docs](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/PlayerInput.html)
- [Installation — Input System docs](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Installation.html)
- [InputActionType — Input System API](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/api/UnityEngine.InputSystem.InputActionType.html)
- [DefaultInputActions — Input System API](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.9/api/UnityEngine.InputSystem.DefaultInputActions.html)
- [Vector2 — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Vector2.html)
- [Nullable value types — C# docs](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types)
- [Compiler Warning CS0472](https://learn.microsoft.com/en-us/dotnet/csharp/misc/cs0472)

The starting point for this post was [usingsystem — \[Unity\] InputSystem 사용방법(PlayerInputComponent와 Generate C# Class)](https://usingsystem.tistory.com/555)
(2024-12-27). I followed its setup steps and sample code as written — the
Korean comments in the samples are the author's — and checked each claim against
the current Input System documentation.
