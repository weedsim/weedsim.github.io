---
pubDatetime: 2026-09-28T19:00:00+09:00
title: "There Is No Signaling in the Unity WebRTC Sample"
lang: en
translationKey: unity-webrtc-signaling
featured: false
draft: false
tags:
  - Unity
  - C#
  - Network
  - WebRTC
description: "A 2022 walkthrough of the PeerConnection sample. But the place where SDP and ICE are exchanged isn't a network — it's a call to GetOtherPc() — and the WebRTC.Initialize() the post opens with no longer exists."
---

I clipped this while standing up a game server with Mirror and hearing that
**"P2P is one of the server approaches too"** — I wanted to know exactly what
that meant.

Coming at it from Mirror actually helped. Mirror gives you three roles —
**server, client, host** — and even the host is
[one process playing both server and client](/posts/mirror-networking-basics/),
not P2P. Authority still sits on one side. WebRTC operates on a different
layer: the media flows directly between two peers. I wanted that distinction
pinned down.

This is a 2022 post that walks step by step through the Unity WebRTC package's
`PeerConnectionSample.cs` to explain how screen sharing works. The author's
honest starting point is a good one.

> I don't have much networking knowledge. I had a lot of trouble understanding
> this sample file at first.

So it unpacks ICE, Candidate, SDP and signaling one at a time, and **those
explanations are accurate.** The problem sits between the explanations and the
sample code.

**There is no signaling in this sample.** The post correctly defines signaling
as "the process of exchanging control information between two endpoints," and
then the place the code performs that exchange is a **method call** inside the
same process. And the `WebRTC.Initialize()` it lists as step one **doesn't
exist in the package any more.**

## Table of Contents

## What Still Holds

Start with what's valid. The terminology is right.

> **Candidate**: the reachable network addresses — IP address and port
> information obtained using a STUN server, and so on.

> **ICE**: a framework that helps two endpoints establish a P2P connection.

> **SDP**: the protocol WebRTC adopted to describe the initial multimedia
> parameters of streaming media — resolution, format, codec and so on.

The Offer → Answer order is right too. The current tutorial says the same
thing.

> SDP exchanges happen between peers. `CreateOffer` creates the initial Offer
> SDP. After getting the Offer SDP, **both** the local and remote peers set the
> SDP … Once the Offer SDP is set, call `CreateAnswer` to create an Answer SDP.
> Like the Offer SDP, the Answer SDP is set **on both the local and remote
> peers.**

"Set on both" is the key, and the clipping's `OnCreateOfferSuccess` follows
exactly that order: `SetLocalDescription` → `SetRemoteDescription` on the other
peer → the other peer's `CreateAnswer`.

`StartCoroutine(WebRTC.Update())` is still valid too. From the current API
reference:

> **Update()** — Updates the texture data for all video tracks **at the end of
> each frame.**

## `WebRTC.Initialize()` No Longer Exists

The clipping's step 3 — the **first line of code** it has you write.

```csharp
private void Awake()
{
    //WebRTC 초기화.
    WebRTC.Initialize();
}
```

In 2022 that was correct. The `com.unity.webrtc@2.4` tutorial the post links to
as a reference says so.

> Call the `WebRTC.Initialize` method to initialize and use WebRTC.

It's gone now. The changelog states it plainly.

> **[3.0.0-pre.6] - 2023-07-16**
>
> Remove Obsolete methods in **WebRTC** class.
> * `WebRTC.Initialize`
> * `WebRTC.Dispose`

**Removed, not obsolete.** Neither appears in the static member list of the
`WebRTC` class in the current 3.0.0 (2025-09-12) API reference. What remains is
`Update`, `ExecutePendingTasks`, `ConfigureNativeLogging`, and the
graphics-format queries.

Type the 2022 post in as written and **it fails to compile on line one.** A
common enough situation, but it stings more here because that line is presented
as "do this first."

| | The clipping (2022, @2.4) | Current (@3.0.0) |
|---|---|---|
| `WebRTC.Initialize()` | Required | **Removed** |
| `WebRTC.Dispose()` | Call on shutdown | **Removed** |
| `StartCoroutine(WebRTC.Update())` | Needed for video | Still there |
| `RTCPeerConnection.Close()` | Call on shutdown | Still there |

## The Half the Clipping Didn't Carry Over: Cleanup

That same @2.4 tutorial **also had cleanup code.**

> When finished, `Close` method must be called for `RTCDataChannel` and
> `RTCPeerConnection`. Finally, after the object is discarded, call
> `WebRTC.Dispose`.

```csharp
private void OnDestroy()
{
    sendChannel.Close();
    receiveChannel.Close();
    localConnection.Close();
    remoteConnection.Close();
    WebRTC.Dispose();
}
```

The clipping took the `Initialize` in `Awake` and **left this block out
entirely.** Unlike dropping the test-button code — which it says it did on
purpose, to study "only the WebRTC parts" — this *is* WebRTC's own lifetime
management.

`WebRTC.Dispose()` is gone now, so that exact code won't run, but **`Close()`
is still there and still needed.** From the current API reference:

> **Close()** — Closes the current peer connection.

> **Dispose()** — Disposes of `RTCPeerConnection`.

`RTCPeerConnection` implements `IDisposable`. It holds native resources, so
leaving one behind on a scene change or a dropped connection just accumulates.

## There Is No Signaling in This Sample

Here's the core. The clipping defines signaling like this:

> Signaling is **the process of exchanging control information between two
> endpoints** in order to exchange the communication specification — the
> protocol, media codecs, data transport method and so on — to be used for
> WebRTC communication.

Correct. Now look at how that "exchange" appears in the code. This is the
clipping's own sample.

```csharp
var otherPc = GetOtherPc(pc);
var op2 = otherPc.SetRemoteDescription(ref desc);
```

```csharp
GetOtherPc(pc).AddIceCandidate(candidate);
```

**`GetOtherPc(pc)` is where the signaling channel would be.** It fetches the
opposite `RTCPeerConnection` object inside the same process and calls a method
on it directly. No transport, no serialization, no remote device. `pc1` and
`pc2` are **two variables in one program.**

That's why the sample runs without a signaling server — not because it does
signaling without one, but because **it arranges a situation where none is
needed.** Which makes this line in the clipping cement the wrong model.

> understanding first how screen, video and audio are shared like a network
> **without a server**

**Media flowing P2P** and **needing no server to establish the connection** are
two different claims. The media really is P2P, but making that P2P happen means
getting SDP and ICE candidates to the other side **somehow**. MDN puts it
plainly.

> **WebRTC doesn't specify a transport mechanism for the signaling
> information.** You can use anything you like, from WebSocket to `fetch()` to
> carrier pigeons to exchange the signaling information between the two peers.

"Doesn't specify" means **build it yourself.** It does not mean you can go
without.

## What You Still Need to Connect Two Machines

This is what you hit immediately after understanding the sample, so it's worth
writing down. Two things must be exchanged. MDN describes each.

> When starting the signaling process, an **offer** is created by the user
> initiating the call. This offer includes a session description, **in SDP
> format**, and needs to be delivered to the receiving user … The callee
> responds to the offer with an **answer** message, also containing an SDP
> description.

> Two peers need to **exchange ICE candidates** to negotiate the actual
> connection between them. Every ICE candidate describes a method that the
> sending peer is able to use to communicate.

And that server doesn't need to understand any of it.

> It's important to note that the server doesn't need to understand or
> interpret the signaling data content … the content of the message going
> through the signaling server is, in effect, a **black box**.

So **any channel that carries SDP strings and ICE candidates verbatim** will
do. What moving from the sample to a real connection requires, as a table:

| | Sample (two local objects) | Two real devices |
|---|---|---|
| Delivering SDP | A `GetOtherPc()` method call | **A signaling channel is required** |
| Delivering ICE candidates | `GetOtherPc().AddIceCandidate()` | **Through the same channel** |
| Discovering the public address | Not needed (same host) | A STUN server |
| When P2P is blocked | N/A | A TURN server to relay |

STUN and TURN go in `RTCConfiguration`'s `iceServers`. From the current API:

> **iceServers** — List of `RTCIceServer` objects, each describing **one server
> which may be used by the ICE agent.**

Which also explains why the sample runs without configuring any: both peers are
on the same host, so host candidates alone are enough.

## Where and Why You'd Use It

What the sample teaches is the **call order**. What it lacks is the **layer
that carries those calls to the other side.** Separate that layer from the
start and the move from sample to real connection touches one place.

### Leaving the Signaling Slot as an Interface

```csharp
using System;
using Unity.WebRTC;

/// <summary>
/// The layer that carries SDP and ICE candidates to the peer.
/// The implementation decides the transport.
/// </summary>
public interface ISignalingChannel
{
    event Action<RTCSessionDescription> DescriptionReceived;
    event Action<RTCIceCandidate> CandidateReceived;

    void SendDescription(RTCSessionDescription description);
    void SendCandidate(RTCIceCandidate candidate);
}
```

An implementation that behaves exactly like the sample is **one method call**.
This is what `GetOtherPc()` was doing.

```csharp
/// <summary>Hands straight to the peer in the same process. Same behavior as the sample.</summary>
public sealed class LoopbackSignalingChannel : ISignalingChannel
{
    public event Action<RTCSessionDescription> DescriptionReceived;
    public event Action<RTCIceCandidate> CandidateReceived;

    private LoopbackSignalingChannel _peer;

    public void Bind(LoopbackSignalingChannel peer)
    {
        _peer = peer;
        peer._peer = this;
    }

    // In a real implementation this becomes a WebSocket send.
    public void SendDescription(RTCSessionDescription description)
        => _peer.DescriptionReceived?.Invoke(description);

    public void SendCandidate(RTCIceCandidate candidate)
        => _peer.CandidateReceived?.Invoke(candidate);
}
```

The connection code stays the same whichever implementation is plugged in.

```csharp
using System.Collections;
using UnityEngine;
using Unity.WebRTC;

public class PeerSession : MonoBehaviour
{
    private RTCPeerConnection _pc;
    private ISignalingChannel _signaling;

    public void Setup(ISignalingChannel signaling)
    {
        _signaling = signaling;

        var config = new RTCConfiguration
        {
            // Local loopback connects with this empty. Across devices, STUN is needed.
            iceServers = new[]
            {
                new RTCIceServer { urls = new[] { "stun:stun.l.google.com:19302" } },
            },
        };

        _pc = new RTCPeerConnection(ref config);

        // Push each candidate down the channel. The sample called the peer directly here.
        _pc.OnIceCandidate = candidate => _signaling.SendCandidate(candidate);
        _pc.OnNegotiationNeeded = () => StartCoroutine(Negotiate());

        _signaling.CandidateReceived += candidate => _pc.AddIceCandidate(candidate);
    }

    private IEnumerator Negotiate()
    {
        var offer = _pc.CreateOffer();
        yield return offer;
        if (offer.IsError) { yield break; }

        // Same order as the sample: set it locally first, then send it.
        var desc = offer.Desc;
        var setLocal = _pc.SetLocalDescription(ref desc);
        yield return setLocal;
        if (setLocal.IsError) { yield break; }

        _signaling.SendDescription(desc);
    }

    private void OnDestroy()
    {
        // Close and Dispose remain. WebRTC.Dispose was removed in 3.0.
        if (_pc != null)
        {
            _pc.Close();
            _pc.Dispose();
            _pc = null;
        }
    }
}
```

Worth noting that `WebRTC.Initialize()` appears nowhere. In the current package
it isn't a function you call.

### Pairing Up the Cleanup

- **Every `new RTCPeerConnection` needs a `Close()` and a `Dispose()`.** The
  `IDisposable` on the class is the signal.
- **Don't call `WebRTC.Dispose()`.** It was removed in 3.0.
- **Start `StartCoroutine(WebRTC.Update())` only once.** The clipping's
  `videoUpdateStarted` flag does exactly that — that part you can follow as
  written.

### Where Not to Use It

- **Carrying the sample's `GetOtherPc()` shape into a real connection.** That
  spot is the network.
- **Filing WebRTC away as "needs no server."** The media is P2P, but
  **establishing the connection needs a channel.**
- **Calling `WebRTC.Initialize()`.** It's removed.
- **Changing scenes without `Close()`.** Native resources stay behind.
- **Attempting a cross-device connection with no `iceServers`.** Off the same
  host, host candidates alone often won't connect.

## Wrapping Up

- **There is no signaling in this sample.** The place SDP and ICE candidates
  are exchanged is `GetOtherPc(pc)` — **a method call inside the same
  process.**
- **"Without a server" is half right.** The media is P2P, but establishing the
  connection needs a channel carrying SDP and ICE candidates. In MDN's words,
  **"WebRTC doesn't specify a transport mechanism for the signaling
  information."**
- **`WebRTC.Initialize()` and `WebRTC.Dispose()` were removed.** The changelog
  entry `[3.0.0-pre.6] - 2023-07-16` reads "Remove Obsolete methods." The first
  line the post has you write no longer compiles.
- **`WebRTC.Update()` is still there** — "updates the texture data for all video
  tracks at the end of each frame."
- **`RTCPeerConnection.Close()` and `Dispose()` are still there too.** They were
  in the @2.4 tutorial's cleanup block that the clipping didn't carry over, and
  they're still needed.
- **The terminology and the Offer/Answer order are still correct.** What needs
  fixing is the API names, and the mental picture of *where* the exchange
  actually happens.

Learning the concepts by following a sample is a good approach. But this sample
is **a teaching aid that shows WebRTC's call order with the network erased.**
Not knowing that, and moving on to "so this is how I connect two machines,"
means starting with the piece you actually have to build left out entirely.

If you opened this doc to compare server topologies, here's the conclusion.
**P2P isn't "the approach with no server" — it's "the approach where media
doesn't go through a server."** A server to establish the connection is still
required, STUN comes in behind NAT, and TURN relaying comes in when P2P is
blocked. Game state synchronization, which needs one side to hold authority,
and media, which just needs to flow between two peers, are chosen on different
grounds to begin with.

---

### References

- [WebRTC package manual — Tutorial (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/manual/tutorial.html)
- [WebRTC package changelog (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/changelog/CHANGELOG.html)
- [WebRTC class — package API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.WebRTC.html)
- [RTCPeerConnection — package API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnection.html)
- [RTCConfiguration — package API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCConfiguration.html)
- [WebRTC package manual — Tutorial (2.4, the version the clipping referenced)](https://docs.unity3d.com/Packages/com.unity.webrtc@2.4/manual/tutorial.html)
- [Signaling and video calling — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

The starting point for this post was [앤디가이 — \[unity\] WebRTC 사용법](https://wonjuri.tistory.com/entry/unity-WebRTC-%EC%82%AC%EC%9A%A9%EB%B2%95)
(2022-06-07). I followed its step-by-step walk through the sample, checked each
API's current status against the package documentation and changelog, and
traced where signaling actually happens using the code the clipping itself
quotes. Quotes from it are my translations.
