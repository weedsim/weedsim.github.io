---
pubDatetime: 2026-08-26T12:00:00+09:00
title: "Unity Ads Mediation: Waterfall Is Ending, Only Bidding Is Left"
lang: en
translationKey: unity-ads-mediation
featured: false
draft: false
tags:
  - Unity
  - LevelPlay
  - Advertising
  - Monetization
  - Mobile
  - SDK
description: "What mediation is, how waterfall differs from in-app bidding, and what this SDK actually drags into your build as a client developer."
---

While poking around out of curiosity about how mobile games make money, I had
clipped the **Ads Mediation** page from the Unity manual. It's a one-page
package overview and the description is short. The feature list amounts to
little more than "in-app bidding, waterfall ad strategy, A/B testing, cross
promotion."

The list alone doesn't tell you what any of those actually are, so I went
looking — and it turned out that **one item on that list had already entered
its phase-out.** Meanwhile the package version had gone **from 1.0.0 to 9.5.1**.

So this post covers two things: what mediation actually is, and what has
changed as of now.

## Table of contents

## What mediation is

The definition in Unity's official documentation is concise.

> Unity LevelPlay is a monetization solution that lets app developers manage
> and optimize multiple ad networks with just one SDK. Unity LevelPlay gives
> multiple ad networks access to an app's advertising inventory, creating an
> arena in which the networks must compete for their ad to be served.

The key word is "compete." If you integrate only one ad network, whatever that
network bids is your rate. Bring several in and make them compete, and you can
sell the same impression for more.

Mediation is the brokering layer that sets up that competition, and from a
developer's point of view it's also **what saves you from integrating a
separate SDK for every network**.

## Waterfall and in-app bidding

There are two ways to run that competition. This is the most important part of
this post.

### Waterfall — line them up and call them in order

This approach **sorts the networks by eCPM and calls them one at a time from
the top**.

1. Call the network with the highest eCPM first
2. If that network has no ad to fill, drop down to the next one
3. Repeat until it fills

Just as the name says, the shape is water falling from top to bottom. eCPM is
the rate per 1,000 impressions, and the publisher sets a target price tier per
network and per placement.

The problem is that this is a **static order**. Regardless of how much any
network is actually willing to pay for this particular impression, the calls
follow the line you fixed in advance. That makes it tricky to operate. You can
see as much just from the recommendations in the official docs.

- Don't pack the price tiers too tightly — **put them within $0.25 of each
  other** and the complexity will almost certainly outweigh the revenue gain
- Don't change the same eCPM target **more than once every three days** — it
  needs time to stabilize
- Rates vary a lot by region and by genre, so factor that in too

### In-app bidding — a real-time auction every time

**Every time an impression comes up, multiple networks bid at once**, and the
highest bidder takes it. It's decided by the actual value at that moment, not
by the order you lined up in advance.

There are no price tiers to manage by hand, and it properly finds the value of
each individual impression.

### And waterfall is on its way out

This is the biggest difference between when I clipped that page and now. The
official docs carry this at the top.

> Waterfall placements are no longer supported being phased out. Starting
> August 11, 2026, you can no longer create new waterfall placements. Any
> placements not converted to bidding or archived by this date will no longer
> be editable, but will continue to serve ads.

To summarize:

| Point in time | Status |
|---|---|
| Before 2026-08-11 | New waterfall placements can be created |
| **On or after 2026-08-11** | **No new placements can be created** |
| Anything not converted to bidding or archived by that date | **Not editable.** But **ads keep serving** |

So existing placements don't suddenly die. **You just can't touch them
anymore.** If you have a project in production, this is worth checking.

(For the record, the first sentence of that quote reads exactly like that in
the original. `are no longer supported being phased out` is a tangled sentence
— it looks like an editing leftover.)

## The version and the docs location have changed

The page I clipped was based on **Unity 2023.2 / package 1.0.0**. Here's where
it stands now.

| | When I clipped it | Now |
|---|---|---|
| Package version | 1.0.0 | **9.5.1** |
| Package ID | `com.unity.services.levelplay` | Same |
| Detailed docs | `developers.is.com/monetization/` | `docs.unity.com/en-us/grow/levelplay/` |

The package ID is unchanged, but **the version jumped from 1.x to 9.x.** The
detailed docs also moved from the ironSource domain to the Unity domain. Follow
a link from older material and you'll end up somewhere entirely wrong.

Supported platforms are as follows.

- **Android** — 4.4 (API level 19) or higher
- **iOS** — 13 or higher, Xcode 16 or higher
- **Editor** — supported versions and LTS versions

## What a client developer actually does

This is where the practical work starts.

### Installation

Find **Ads Mediation** in the Package Manager and install it, or add it by
package name.

```text
com.unity.services.levelplay
```

### Initialization

The namespace is `Unity.Services.LevelPlay`.

```csharp
public void Start() {
    // Register the init success/failure listeners
    LevelPlay.OnInitSuccess += SdkInitializationCompletedEvent;
    LevelPlay.OnInitFailed += SdkInitializationFailedEvent;
    // Initialize the SDK
    LevelPlay.Init("ThisIsYourAppKey");
}
```

You have to respect **the ordering: register the listeners before calling
`Init`**. If initialization finishes quickly, a handler attached afterwards
misses the event.

The `LevelPlay` class has more members than that.

| Member | Purpose |
|---|---|
| `Init(appKey, userId = null)` | Initialize the SDK |
| `ValidateIntegration()` | Verify integration status |
| `LaunchTestSuite()` | Launch the test suite |
| `SetPauseGame(bool)` | Pause the game while an ad is showing |
| `SetDynamicUserId(string)` | User ID for reward callbacks |
| `SetMetaData(key, value)` | Set additional flags |
| `OnImpressionDataReady` | Impression event — **invoked on a background thread** |
| `PluginVersion` / `UnityVersion` | Version strings |

The fact that `OnImpressionDataReady` is on a background thread is worth
remembering. You must not touch the Unity API directly from there.

### Test suite

There's a tool for checking integration status and network settings on device.

```csharp
// Enable before initializing the SDK
LevelPlay.SetMetaData("is_test_suite", "enable");

// Launch after initialization succeeds
LevelPlay.LaunchTestSuite();
```

`SetMetaData` goes **before initialization**, `LaunchTestSuite` **after
initialization succeeds**. Reverse the order and it won't work.

### What gets attached to the build

This is the most important part for a client developer. The mediation SDK
doesn't come in alone. **Every ad network brings an adapter and dependencies
along with it.**

- **Adapters** — as of v8.8.1, the Unity Ads and ironSource Ads adapters are
  installed by default.
- **Android dependencies** — download the network dependencies with
  `Assets > Mobile Dependency Manager > Android Resolver > Resolve`. They get
  added to the Gradle files at compile time (automatic in MDR 8.10.0 and
  above).
- **Android permissions** — on Android 13 (API 33) and above, the advertising
  ID permission is attached.

  ```xml
  <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
  ```

- **iOS Info.plist** — SKAdNetwork IDs are added automatically (v9.1.0 and
  above, via the LevelPlay Network Manager).

The more networks you add, the longer this list gets. **Build size, dependency
conflicts, and permission disclosures** all come out of here. Adding ads isn't
a matter of dropping in one SDK — it's **taking on a whole dependency tree**.

Implementation for each ad format (rewarded, interstitial, banner) is split
into its own separate document.

## Summary

- Mediation is **a brokering layer that makes multiple ad networks compete**,
  and for the developer it's also what saves you from integrating a separate
  SDK for each network.
- There were two ways to run that competition. **Waterfall** lines networks up
  by eCPM and calls them in sequence; **in-app bidding** runs a real-time
  auction for every impression.
- **As of August 11, 2026, new waterfall placements are blocked.** Existing
  ones keep serving but can't be edited. In practice, only bidding is left.
- The package went **from 1.0.0 to 9.5.1**, and the detailed docs moved to the
  Unity domain. Don't trust the links and versions in older material.
- There's an ordering to respect in code: **register listeners → `Init`**, and
  **`SetMetaData` → initialize → `LaunchTestSuite`**.
- And the real burden isn't the API but **what tags along into the build**:
  adapters, Gradle dependencies, the `AD_ID` permission, SKAdNetwork IDs.

---

### References

- [Ads Mediation — Unity Manual](https://docs.unity3d.com/6000.1/Documentation/Manual/com.unity.services.levelplay.html)
- [Unity Package integration — Unity LevelPlay docs](https://docs.unity.com/en-us/grow/levelplay/sdk/unity/package-integration)
- [Introduction to Unity LevelPlay](https://docs.unity.com/en-us/grow/levelplay/platform/get-started/introduction)
- [Waterfall strategy](https://docs.unity.com/en-us/grow/ads/waterfall-strategy)
- [Class LevelPlay — API reference](https://docs.unity3d.com/Packages/com.unity.services.levelplay@9.4/api/Unity.Services.LevelPlay.LevelPlay.html)

The starting point for this post was the **Ads Mediation** page in the Unity
manual (the 2023.2 edition). I used its structure as a reference, then
re-checked the versions, APIs, and policy against the current documentation.
Verified as of 2026-08-26.
