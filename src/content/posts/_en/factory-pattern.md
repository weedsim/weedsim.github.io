---
pubDatetime: 2026-10-03T16:00:00+09:00
title: "The First Example Compares `pizza`, Not `type`"
lang: en
translationKey: factory-pattern
featured: false
draft: false
tags:
  - Java
  - C#
  - Design Pattern
description: "A 2016 write-up following Head First through the factory patterns. The concepts are textbook-correct, but all three code sections are broken — and they break the same way. Take the type as a string and there's nothing for the compiler to see."
---

I clipped this while studying **which design patterns matter when building
games.** It's a 2016 post that follows *Head First Design Patterns*' pizza store
example through **simple factory → factory method pattern → abstract factory
pattern.** It walks the book's path exactly, so it reads well as a map.

The pizza store example looks far from games, but the structure overlaps exactly.
The place where each branch makes a different pizza is **the place where each
stage spawns different enemies**, and the constraint that ingredients must come
from the same region is **the constraint that assets must come from the same
theme.** So this post's "Where and Why You'd Use It" is all Unity code.

**The concepts are textbook-correct.** It starts from the principle of "find the
part that can change and separate it from the part that doesn't," and goes all the
way to the dependency inversion principle. Nothing's wrong there.

The code is the problem. **All three sections are broken, and they break the same
way.**

```java
public Pizza createPizza (String type){
    Pizza pizza = null;
    if(pizza.equals("cheese")) pizza = new CheesePizza();
    ...
}
```

That's the third line of this post's first code example. The parameter is `type`,
but it compares **`pizza`**, and that `pizza` is initialized to `null` one line
above. The first line throws a `NullPointerException`.

And **this compiles.**

## Table of Contents

## The Concepts Are Textbook-Correct

What's right first. The starting point is accurate.

> Code like this means that when you have to change or extend something, you have
> to go back through the code and add or remove things.

And it raises that to a principle.

> **- The principle of finding the part that can change and separating it from the
> part that doesn't.**

Right. The pizza order sequence (`prepare` → `bake` → `cut` → `box`) doesn't
change, and which pizza gets made does. Pulling out only the part that changes is
the whole of this pattern.

Not counting the simple factory as a pattern is accurate too.

> **A simple factory can't really be called a design pattern.**
> **It's closer to an idiom that gets used a lot in programming.**

And when summarizing the difference between the two patterns at the end, it bolds
the word **composition.**

> **Abstract factory pattern**: creating an interface for making a family of
> products, and **composing** that interface so it can be used.

That's the crux, and the post touches it once and moves on. Its own code
demonstrates that difference and it never connects the two. More on that later.

The way it explains the dependency inversion principle is good. It flips the
arrows and shows you.

| Before | After |
| --- | --- |
| `PizzaStore` → `NYStyleCheesePizza` | `PizzaStore` → `Pizza` |
| `PizzaStore` → `ChicagoStyleCheesePizza` | `Pizza` ← `NYStyleCheesePizza` |
| `PizzaStore` → `NYStyleVeggiePizza` | `Pizza` ← `ChicagoStyleCheesePizza` |

> **The high-level component (PizzaStore) and the low-level components
> (NYStyleCheesePizza, ...) all come to depend on the abstract class Pizza.**

A correct explanation, and that one table conveys why the name has "inversion" in
it.

## The First Example Compares `pizza`, Not `type`

That's the code from the opening. Here it is whole.

```java
public class SimplePizzaFactory {
    public Pizza createPizza (String type){
        Pizza pizza = null;
        if(pizza.equals("cheese")) pizza = new CheesePizza();
        if(pizza.equals("pepper")) pizza = new PepperoniPizza();
        if(pizza.equals("clam")) pizza = new ClamPizza();
        if(pizza.equals("veggie")) pizza = new VeggiePizza();
        return pizza;
    }
}
```

It should compare `type`, and all four lines compare `pizza`. `pizza` is `null`,
so **the first `if` throws a `NullPointerException`.** This factory can't return a
pizza for any input.

What matters here isn't "there's a typo" but that **this typo compiles.**
`equals`'s signature allows it.

> **`public boolean equals(Object obj)`**

The parameter type is `Object`. So passing a `String` to a variable of type `Pizza`
isn't a type error. The compiler has no place to say "comparing a `Pizza` with a
`String` makes no sense." It just accepts it as code that will return `false`.

And the receiver is `null`, so it can't even return `false`. `Object`'s
specification records that boundary.

> For any non-null reference value `x`, `x.equals(null)` should return `false`.

**"non-null reference value `x`"** — that's the story for when `x` isn't null.
Here the `x` slot is null, so it ends before the comparison starts.

The fix is two characters.

```java
public class SimplePizzaFactory {
    public Pizza createPizza(String type) {
        Pizza pizza = null;
        if (type.equals("cheese")) pizza = new CheesePizza();
        if (type.equals("pepper")) pizza = new PepperoniPizza();
        if (type.equals("clam")) pizza = new ClamPizza();
        if (type.equals("veggie")) pizza = new VeggiePizza();
        return pizza;
    }
}
```

Something survives the fix. **Pass any string at all for `type` and `null` goes
out.** `createPizza("Cheese")`, `createPizza("치즈")`, and the mistyped
`createPizza("chese")` are all quietly `null`.

## The Typos All Land in the Same Hole

Gather the clipping's remaining typos and a single pattern shows up.

| Place | What's written | Intent |
| --- | --- | --- |
| `SimplePizzaFactory` | `"pepper"` | Pepperoni |
| `NYPizzaStore` | `"peper"` | Pepperoni |
| `ChicagoPizzaStore` | `"peper"` | Pepperoni |
| `NYPizzaStore` (abstract factory section) | `"peper"` | Pepperoni |

**Three spellings for the same concept.** And none of them is a compile error.
Code using `PizzaStore` that calls `orderPizza("pepperoni")` misses all four `if`s
and `createPizza` returns `null`. The next line blows up.

```java
public Pizza orderPizza (String type){
    Pizza pizza;
    pizza = createPizza(type);
    pizza.prepare();   // ← NPE here if createPizza returned null
    pizza.bake();
    pizza.cut();
    pizza.box();
    return pizza;
}
```

**The place the exception appears and the place the cause lives are different.**
The stack trace points at `orderPizza`'s `prepare()` line, and the real problem is
that the string the caller passed doesn't match the spelling inside `createPizza`.

The typos in class names are a different kind.

| What's written | Intent |
| --- | --- |
| `new Farlic()` | `Garlic` |
| `new ThinCrustdough()` | `ThinCrustDough` |
| `new Slicedpepperoni()` | `SlicedPepperoni` |
| `new FrozenClam()` / `new Freshclams()` | Names that don't pair up |

These **don't compile.** The types don't exist, so the compiler catches them
immediately. Within the same post **the typos split into two kinds** — a typo in a
type name surfaces at once, and a typo in a string runs all the way to runtime.

That difference is this design's cost. The post worked hard to get rid of `new`,
and in the process **it turned type information into a string.**
`new CheesePizza()` was code that wouldn't compile if you got the class name
wrong. `createPizza("cheese")` has no such net.

Turn `"cheese"` into an enum and the net comes back. And the pattern stays exactly
as it was — encapsulating the part that changes has nothing to do with strings.

## The Abstract Factory Section Doesn't Compile

The code in the section that moves on to the second pattern.

```java
public class NYPizzaStore extends PizzaStore {
    @Override
    public Pizza createPizza(String type){
        Pizza pizza = null;
        PizzaIngredientFactory ingredientFactory = new NYPizzaingredientFactory();
        if(type.equals("cheese")){
            pizza = new CheesePizza(ingredientFactory);
            pizza.setName(ingredientFactory.NY_STYLE+" Cheese Pizza");
        }
        // ...
    }
}
```

Two spots block.

**First, `ingredientFactory.NY_STYLE`.** `PizzaIngredientFactory` is declared in
the same post like this.

```java
public interface PizzaIngredientFactory {
    public Dough createDough();
    public Sauce createSauce();
    public Cheese createCheese();
    public Veggies[] createVeggies();
    public Pepperoni createPepperoni();
    public Clams createClams();
}
```

**There's no member called `NY_STYLE`.** Six methods, nothing else. Even if there
were, it'd be an odd design — put `NY_STYLE` on the interface and the Chicago
factory carries that constant too. A region name is **a value each implementation
holds**, not a shared contract on the interface.

**Second, `pizza.setName(...)`.** Look at the `Pizza` abstract class's declaration
and `getname()` is there while `setName()` isn't.

```java
public abstract class Pizza {
    String name;
    // ...
    public String getname(){
        return this.name;
    }
}
```

`name` is a package-private field, so code in the same package can write
`pizza.name = ...`, which is why the book's original adds a `setName` or assigns
the field directly. The clipping didn't carry that intermediate step across.

Fixed, it looks like this. Putting the region name under the factory's
responsibility is the natural reading.

```java
public interface PizzaIngredientFactory {
    String getStyleName();   // values that differ per implementation come through a method
    Dough createDough();
    Sauce createSauce();
    Cheese createCheese();
    Veggies[] createVeggies();
    Pepperoni createPepperoni();
    Clams createClams();
}
```

```java
public abstract class Pizza {
    private String name;

    public void setName(String name) { this.name = name; }
    public String getName() { return this.name; }
    // ...
}
```

## Its Own Code Breaks Guideline 3

The post lists three guidelines for the dependency inversion principle. Here's the
third.

> **3. Don't override a method that's already implemented in the base class.**
>
> \- Overriding an already-implemented method means the base class wasn't properly
> abstracted in the first place.

And four screens above sits this code.

```java
public class ChicagoStyleCheesePizza extends Pizza {
    public ChicagoStyleCheesePizza() { /* ... */ }

    @Override
    public void cut() {
        System.out.println("Cutting the pizza into square slices");
    }
}
```

`Pizza.cut()` isn't an abstract method. It holds an implementation that cuts
diagonally, and the Chicago pizza overwrites it with squares. **That's the case
guideline 3 is talking about.**

The post does cushion the guidelines as "not rules you must always follow but a
direction to aim for." But this case isn't an ambiguous one that needs cushioning.
**The diagnosis the guideline gives fits exactly** — if the way of cutting differs
per region, there's no reason for `Pizza.cut()` to hold an implementation.

And **the post itself applies that prescription to another method.** In the
abstract factory section it changes `prepare()` like this.

```java
public abstract void prepare(); //changed to an abstract method.
```

`prepare()` got raised to abstract and `cut()` was left as an override. They're
the same situation — behavior that differs per region.

In C# terms the difference is clearer. Two sentences from the docs line up
directly.

> When a base class declares a method as `virtual`, a derived class **can**
> `override` the method with its own implementation.

> If a base class declares a member as `abstract`, that method **must be
> overridden** in any non-abstract class that directly inherits from that class.

`virtual` is "may overwrite" and `abstract` is "must overwrite." If every
implementation is going to differ, declaring it `abstract` so it **can't be
skipped** is the right call. Java has no `virtual` keyword and every instance
method already sits in that position, so the distinction shows up only as
**whether an implementation is present.**

| Declaration | A subclass | If you skip it |
| --- | --- | --- |
| Method with an implementation (Java default / C# `virtual`) | may overwrite it | the base behavior is used |
| `abstract` method | must overwrite it | it doesn't compile |

The last column is the point. Raise `cut()` to `abstract` and **you can't compile a
new regional branch without deciding how it cuts.** The situation the post worried
about — "skipping the step where the pizza gets cut" — is blocked by the compiler.

## `new` Didn't Disappear, It Moved

The post's final summary has one name wrong.

> **Abstract method pattern**: making an abstract method in a single abstract class
> and having **subclasses implement that abstract method** to make the instances.

**There is no "abstract method pattern."** The content describes the factory method
pattern correctly. In the very place where the two patterns are set side by side to
sort out the difference, one of the names changed.

More of a shame than the name is **that the difference isn't written down.** The
post bolds "composition" and moves on, and that one word is what separates the two
patterns. The clipping's code shows it as it is.

```java
// Factory method — inheritance. The subclass decides which pizza gets made.
public class NYPizzaStore extends PizzaStore {
    @Override
    public Pizza createPizza(String type) { /* news up the NY style */ }
}
```

```java
// Abstract factory — composition. The object handed in decides which ingredients.
public class CheesePizza extends Pizza {
    private final PizzaIngredientFactory ingredientFactory;

    public CheesePizza(PizzaIngredientFactory ingredientFactory) {
        this.ingredientFactory = ingredientFactory;
    }
}
```

The top plugs the varying part in with `extends`; the bottom plugs it in through
**a constructor argument.** Different means to the same end.

| | Factory method | Abstract factory |
| --- | --- | --- |
| How the varying part is plugged in | Inheritance (`extends`) | Composition (constructor argument) |
| The unit that varies | A single product | A family of interlocking products |
| To add a new variant | Make one subclass | Make one factory implementation |
| Can it change at run time | No (the type is fixed) | Yes (hand it a different factory) |

The last row is where it splits in practice. Plug it in by inheritance and which
branch you are is **decided at compile time.** Plug it in by composition and a
config file or a user's choice can change it at run time.

And there's one thing the post never says to the end. **`new` didn't disappear.**
It moved. Follow where `new` sits through the clipping's code and it goes like
this.

| Stage | Where `new` lives |
| --- | --- |
| At first | Inside `orderPizza` — mixed in with the order sequence |
| Simple factory | `SimplePizzaFactory.createPizza` |
| Factory method | `NYPizzaStore.createPizza` — one per region |
| Abstract factory | `NYPizzaingredientFactory` — split into per-ingredient methods |

**What did moving it buy.** That the person changing the order sequence and the
person adding a pizza type **open different files.** That's what this pattern
actually sells, and it's exactly what the post's principle — separate what changes
from what doesn't — said.

So the test comes from there too. **If the two parts don't change for different
reasons at different rates, a factory has only added one more file.** That
`NYPizzaStore.createPizza` still calls `new NYPizzaingredientFactory()` directly in
the abstract factory section is the same story. The region-to-ingredient-factory
pairing doesn't change, so that `new` can stay there.

## Where and Why You'd Use It

### A Factory That Spawns Enemies

The same structure shows up where a game creates enemies. Start by using an enum
instead of a string.

```csharp
public enum EnemyKind
{
    Grunt,
    Archer,
    Brute,
}
```

```csharp
using UnityEngine;

public interface IEnemyFactory
{
    Enemy Create(EnemyKind kind, Vector3 position);
}
```

Move the clipping's `if`-chain to a C# switch expression and **the compiler tells
you about the case you missed.**

```csharp
using UnityEngine;

public class SwitchEnemyFactory : MonoBehaviour, IEnemyFactory
{
    [Header("Prefabs")]
    [SerializeField, Tooltip("The prefab for EnemyKind.Grunt")]
    private Enemy _gruntPrefab;

    [SerializeField] private Enemy _archerPrefab;
    [SerializeField] private Enemy _brutePrefab;

    public Enemy Create(EnemyKind kind, Vector3 position)
    {
        // Add a value to EnemyKind and forget to touch this, and you get a compiler warning.
        Enemy prefab = kind switch
        {
            EnemyKind.Grunt => _gruntPrefab,
            EnemyKind.Archer => _archerPrefab,
            EnemyKind.Brute => _brutePrefab,
            _ => throw new System.ArgumentOutOfRangeException(nameof(kind)),
        };

        return Instantiate(prefab, position, Quaternion.identity);
    }
}
```

The docs spell that warning out.

> In most cases, the compiler generates a warning if a `switch` expression
> doesn't handle all possible input values.

And the run-time guarantee is written down too.

> If none of a `switch` expression's patterns matches an input value, the runtime
> throws an exception. In .NET Core 3.0 and later versions, the exception is a
> `System.Runtime.CompilerServices.SwitchExpressionException`.

The clipping's `createPizza` **returned `null` on a miss and blew up at the
caller.** A switch expression **blows up right there.** Write `_ => throw`
yourself and you get a message with it. The place the exception appears and the
place the cause lives become the same.

There's also a way to remove the `if`-chain entirely. Pull the kind-to-prefab
pairing out as data and no `switch` is needed.

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "EnemyCatalog", menuName = "Game/Enemy Catalog")]
public class EnemyCatalog : ScriptableObject
{
    [Serializable]
    private struct Entry
    {
        public EnemyKind Kind;
        public Enemy Prefab;
    }

    [Header("Catalog")]
    [SerializeField, Tooltip("One row per EnemyKind. Duplicates get filtered on build")]
    private Entry[] _entries;

    private Dictionary<EnemyKind, Enemy> _byKind;

    public Enemy GetPrefab(EnemyKind kind)
    {
        Build();

        if (!_byKind.TryGetValue(kind, out Enemy prefab))
        {
            Debug.LogError($"No prefab for {kind} in the catalog.");
            return null;
        }

        return prefab;
    }

    private void Build()
    {
        if (_byKind != null)
        {
            return;
        }

        _byKind = new Dictionary<EnemyKind, Enemy>(_entries.Length);
        foreach (Entry entry in _entries)
        {
            if (entry.Prefab == null)
            {
                Debug.LogError($"The prefab for the {entry.Kind} entry is empty.");
                continue;
            }

            _byKind[entry.Kind] = entry.Prefab;
        }
    }
}
```

The two trade differently. The `switch` side **has the compiler catch the missing
case**, and the catalog side **lets you add entries without touching code.** If an
enemy kind carries behavior that branches in code, `switch`; if only the data
differs, the catalog.

### ScriptableObject Instead of a Subclass

The clipping's factory method adds variants with
`NYPizzaStore extends PizzaStore`. Use the same structure in Unity and **adding a
variant becomes making one asset.**

`ScriptableObject` is that slot. The docs state its purpose this way.

> **Saving data as an asset in your project to use at runtime.**

Put a base class with an abstract factory method. It's the same slot as the
clipping's `abstract Pizza createPizza(String type)`.

```csharp
using UnityEngine;

/// <summary>
/// How a single enemy gets made is decided by the subclass.
/// The same role as PizzaStore's abstract createPizza.
/// </summary>
public abstract class EnemySpawnRule : ScriptableObject
{
    [Header("Identity")]
    [SerializeField, Tooltip("Name for logs and debugging")]
    private string _displayName;

    public string DisplayName => _displayName;

    public abstract Enemy Create(Vector3 position);
}
```

Make one asset per implementation. `CreateAssetMenu` puts it on the menu for you.

> **CreateAssetMenuAttribute** — Mark a ScriptableObject-derived type to be
> automatically listed in the Assets/Create submenu, so that instances of the type
> can be easily created and stored in the project as '.asset' files.

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "GruntRule", menuName = "Game/Spawn Rule/Grunt")]
public class GruntSpawnRule : EnemySpawnRule
{
    private const float DEFAULT_SPEED = 3f;

    [Header("Prefab")]
    [SerializeField] private Enemy _prefab;

    [Header("Stats")]
    [SerializeField, Range(1, 50)] private int _hp = 5;
    [SerializeField, Range(0.5f, 10f)] private float _speed = DEFAULT_SPEED;

    public override Enemy Create(Vector3 position)
    {
        Enemy enemy = Instantiate(_prefab, position, Quaternion.identity);
        enemy.Initialize(_hp, _speed);
        return enemy;
    }
}
```

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "ArcherRule", menuName = "Game/Spawn Rule/Archer")]
public class ArcherSpawnRule : EnemySpawnRule
{
    private const float ARCHER_SPEED = 2f;

    [Header("Prefab")]
    [SerializeField] private Enemy _prefab;
    [SerializeField] private Projectile _arrowPrefab;

    [Header("Stats")]
    [SerializeField, Range(1, 50)] private int _hp = 3;
    [SerializeField, Range(1f, 20f)] private float _range = 8f;

    public override Enemy Create(Vector3 position)
    {
        Enemy enemy = Instantiate(_prefab, position, Quaternion.identity);
        enemy.Initialize(_hp, ARCHER_SPEED);

        // Assembly only the archer needs. This is why that branch belongs on the creation side.
        if (enemy.TryGetComponent(out RangedAttack ranged))
        {
            ranged.Configure(_arrowPrefab, _range);
        }

        return enemy;
    }
}
```

The consuming side needs neither an enum nor a `switch`. **It's one array of asset
references.**

```csharp
using UnityEngine;

public class WaveTable : MonoBehaviour
{
    [Header("Waves")]
    [SerializeField, Tooltip("Drag Spawn Rule assets in from the Inspector")]
    private EnemySpawnRule[] _rules;

    [SerializeField, Range(1, 60)] private int _countPerRule = 5;

    public void SpawnAll(Vector3 origin)
    {
        foreach (EnemySpawnRule rule in _rules)
        {
            if (rule == null)
            {
                Debug.LogError($"{name} has an empty entry in _rules.");
                continue;
            }

            for (int i = 0; i < _countPerRule; i++)
            {
                rule.Create(origin);
            }
        }
    }
}
```

The cell in the clipping's table that said "Can it change at run time — No (the
type is fixed)" flips here. **`extends` is writing code; an asset reference is
putting a value in a field.** Adding an enemy kind ends at "one script plus one
asset," and a designer rearranges the per-difficulty waves in the Inspector.

### The Theme Decides the Asset Family

This is why the abstract factory shows up in the clipping.

> Each branch is following the laid-down procedure fine, but some branches are
> swapping small ingredients for cheaper ones to cut costs and keep the margin. Is
> there a way to control the quality of the raw ingredients too??

The goal is to stop **ingredients getting mixed up.** The place that overlaps
exactly in a game is **the stage theme.** An ice stage mustn't get lava floors, and
a desert enemy mustn't appear in the snow.

Bundle the product family into one interface. The same shape as the clipping's
`PizzaIngredientFactory`.

```csharp
using UnityEngine;

/// <summary>
/// The product family one stage theme puts out. The four have to match as a set.
/// The same role as PizzaIngredientFactory.
/// </summary>
public abstract class StageThemeFactory : ScriptableObject
{
    public abstract string ThemeName { get; }

    public abstract GameObject CreateFloorTile(Vector3 position);
    public abstract Enemy CreateMinion(Vector3 position);
    public abstract ParticleSystem CreateHitEffect(Vector3 position);
    public abstract AudioClip GetAmbientLoop();
}
```

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "IceTheme", menuName = "Game/Stage Theme/Ice")]
public class IceThemeFactory : StageThemeFactory
{
    private const float ICE_FRICTION = 0f;

    [Header("Prefabs")]
    [SerializeField] private GameObject _floorPrefab;
    [SerializeField] private EnemySpawnRule _minionRule;
    [SerializeField] private ParticleSystem _hitEffectPrefab;

    [Header("Audio")]
    [SerializeField] private AudioClip _ambientLoop;

    [Header("Physics")]
    [SerializeField, Tooltip("Make it friction 0 with Friction Combine set to Minimum")]
    private PhysicsMaterial _iceMaterial;

    public override string ThemeName => "Ice";

    public override GameObject CreateFloorTile(Vector3 position)
    {
        GameObject tile = Instantiate(_floorPrefab, position, Quaternion.identity);

        // Where assembly happens. If it's only a reference bundle, no factory is needed.
        if (tile.TryGetComponent(out Collider floorCollider))
        {
            floorCollider.sharedMaterial = _iceMaterial;
        }

        return tile;
    }

    public override Enemy CreateMinion(Vector3 position)
    {
        return _minionRule.Create(position);
    }

    public override ParticleSystem CreateHitEffect(Vector3 position)
    {
        return Instantiate(_hitEffectPrefab, position, Quaternion.identity);
    }

    public override AudioClip GetAmbientLoop()
    {
        return _ambientLoop;
    }
}
```

The stage takes only a theme. Not taking the four separately is the point.

```csharp
using UnityEngine;

public class StageBuilder : MonoBehaviour
{
    private const int TILE_COUNT = 32;
    private const float TILE_SIZE = 2f;

    [Header("Theme")]
    [SerializeField, Tooltip("Change the theme and floors, enemies, effects and music change together")]
    private StageThemeFactory _theme;

    [Header("References")]
    [SerializeField] private AudioSource _ambientSource;

    private void Start()
    {
        if (_theme == null)
        {
            Debug.LogError($"{name}'s _theme is empty.");
            return;
        }

        for (int i = 0; i < TILE_COUNT; i++)
        {
            _theme.CreateFloorTile(transform.position + Vector3.right * (i * TILE_SIZE));
        }

        _theme.CreateMinion(transform.position + Vector3.forward * 5f);

        _ambientSource.clip = _theme.GetAmbientLoop();
        _ambientSource.Play();

        Debug.Log($"Built the {_theme.ThemeName} stage.");
    }
}
```

**There's one field, so nothing can get mixed.** Put the ice theme in and floors,
enemies, effects and music come as a bundle. What the clipping worried about —
"swapping small ingredients for cheaper ones" — becomes structurally impossible.

One line to draw, though. **If the four are only references, a data bundle is
enough and you don't need a factory.**

```csharp
using UnityEngine;

/// <summary>
/// If there's nothing to assemble, this is the end of it. No abstract methods, no subclasses.
/// </summary>
[CreateAssetMenu(fileName = "StageThemeData", menuName = "Game/Stage Theme Data")]
public class StageThemeData : ScriptableObject
{
    [Header("Prefabs")]
    public GameObject FloorPrefab;
    public Enemy MinionPrefab;
    public ParticleSystem HitEffectPrefab;

    [Header("Audio")]
    public AudioClip AmbientLoop;
}
```

The fork is **whether the making involves logic.** A line that plugs a physics
material into an ice floor makes the factory worth it. If all four lines are
`Instantiate(reference)`, the `StageThemeData` above is the end of it, and adding
an abstract class plus three subclasses only added cost.

### Turning It Into a Factory That Pulls From a Pool

This is where the factory's worth becomes plain. You can make it so **the caller
doesn't have to know** whether `Create` calls `Instantiate` or pulls from a pool.

Drop in the pool from [the post on object pooling](/posts/unity-object-pooling/).

```csharp
using UnityEngine;

public class PooledEnemyFactory : MonoBehaviour, IEnemyFactory
{
    [Header("References")]
    [SerializeField] private EnemyCatalog _catalog;

    public Enemy Create(EnemyKind kind, Vector3 position)
    {
        Enemy prefab = _catalog.GetPrefab(kind);

        if (prefab == null)
        {
            return null;
        }

        // Pull from the pool instead of Instantiate. The calling code doesn't change.
        GameObject instance = PoolManager.Instance.Pop(prefab.gameObject);

        if (instance == null)
        {
            return null;
        }

        instance.transform.position = position;
        return instance.TryGetComponent(out Enemy enemy) ? enemy : null;
    }
}
```

The side using `IEnemyFactory` doesn't change by one line.

```csharp
using UnityEngine;

public class WaveSpawner : MonoBehaviour
{
    private const float SPAWN_RADIUS = 12f;

    [Header("References")]
    [SerializeField, Tooltip("Plug in SwitchEnemyFactory or PooledEnemyFactory")]
    private MonoBehaviour _factorySource;

    private IEnemyFactory _factory;

    private void Awake()
    {
        // Interfaces don't show in the Inspector, so take a MonoBehaviour and cast.
        _factory = _factorySource as IEnemyFactory;

        if (_factory == null)
        {
            Debug.LogError($"{name}'s _factorySource is not an IEnemyFactory.");
        }
    }

    public void SpawnWave(EnemyKind kind, int count)
    {
        for (int i = 0; i < count; i++)
        {
            Vector2 offset = Random.insideUnitCircle * SPAWN_RADIUS;
            _factory.Create(kind, transform.position + new Vector3(offset.x, 0f, offset.y));
        }
    }
}
```

This is what the clipping's principle actually hands back. **The change that adds
pooling doesn't touch `WaveSpawner`.** One file changed: the factory.

Had `WaveSpawner` called `Instantiate` directly, the work of adding pooling would
spread to every piece of code that calls the spawner. The situation the post
pointed at from the start.

> Code like this means that when you have to change or extend something, you have
> to go back through the code and add or remove things.

### Where Not to Use It

**Putting a factory on something with one kind.** With one enemy kind, calling
`Instantiate` directly reads better. A factory starts paying **when a branch
appears.** When one appears — not when one is "planned."

**Taking the type as a string.** Every accident in this post came from there.
Whether it's an enum or a `ScriptableObject` reference, take it as **something that
won't compile if you misspell it.** If there's a boundary where strings come in from
outside (a server response, a config file), convert to an enum once at that
boundary and travel as an enum everywhere inside.

**Putting a base implementation on a method whose implementations all differ.**
Guideline 3's case. If every subclass is going to overwrite the method, declare it
`abstract`. Not compiling when one is skipped is cheaper than discovering the skip
at run time.

**Putting state on a factory `ScriptableObject`.** An asset is one object shared by
every scene. Put "how many have been spawned so far" in a factory SO's field and in
the Editor that value survives after you stop playing while in a build it doesn't.
The docs record that difference.

> In the Unity Editor, you can save data to ScriptableObjects in Edit mode and
> Play mode. In a standalone Player at runtime, **you can only read saved data
> from the ScriptableObject assets.**

**The Editor and the build behave differently.** Keep the factory SO as read-only
configuration and put the counting in a scene-side `MonoBehaviour`.

**Using an abstract factory to "keep it changeable later."** It's worth something
only when the product family actually changes **as a set.** The pizza example is
persuasive because dough, sauce and cheese **have to be used with others from the
same region.** For three values that can be chosen independently, a single config
object does it, not a factory interface.

## Wrapping Up

This post's conceptual explanation is textbook-correct. It starts from separating
what changes from what doesn't, draws a line saying a simple factory isn't a
pattern, and goes as far as showing the dependency inversion principle's arrow
directions. Read it and you know what to search for.

All three code sections are broken. The first example compares `pizza` instead of
`type` and gives a **`NullPointerException`**; the abstract factory section
**doesn't compile**, on an `NY_STYLE` that isn't on the interface and a `setName`
that isn't declared; and one pattern name in the summary became **"abstract method
pattern."** And in the same post that writes down guideline 3,
`ChicagoStyleCheesePizza` overrides `Pizza.cut()`.

They all break the same way. **Take the type as a string and there's nothing for
the compiler to see.** That `pizza.equals("cheese")` compiles, that mixing
`"peper"` and `"pepper"` has no consequence, and that a miss sends out `null` so it
**blows up at the caller** — one root. The net `new CheesePizza()` had,
`createPizza("cheese")` threw away.

The point is that there was no reason to throw it away. Take an enum and the
pattern stays as it is and the net comes back. **Encapsulating the part that
changes and expressing that part as a string have nothing to do with each other.**

---

### References

- [Object.equals — Java SE 21 API Specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)
- [JEP 441: Pattern Matching for switch — OpenJDK](https://openjdk.org/jeps/441)
- [switch expression — C# language reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression)
- [ScriptableObject — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-ScriptableObject.html)
- [CreateAssetMenuAttribute — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/CreateAssetMenuAttribute.html)
- [Inheritance: abstract and virtual — C# docs](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance)

The starting point for this post was [램쥐뱅 — 디자인패턴 - 팩토리 패턴 (factory pattern)](https://jusungpark.tistory.com/14)
(2016-05-12), and the book it follows is *Head First Design Patterns*. I followed
its three stages of code line by line, split the typos that compile from the ones
that don't, and checked the enum-side alternative against the Java and C# language
docs.
