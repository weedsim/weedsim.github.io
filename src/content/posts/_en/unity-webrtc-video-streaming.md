---
pubDatetime: 2026-10-01T21:30:00+09:00
title: "IsConnected Is Looking at Connecting"
lang: en
translationKey: unity-webrtc-video-streaming
featured: false
draft: false
tags:
  - Unity
  - C#
  - Network
  - WebRTC
  - Serialization
description: "A tutorial that shows the whole thing, from a signaling server to sending a camera feed. But IsConnected compares against Connecting, so the Disconnect button dies the moment the connection is actually established. RemoveTrack and OnNegotiationNeeded each have a hole too."
---

After writing [the earlier WebRTC post](/posts/unity-webrtc-signaling/) I kept
looking into the same topic, and clipped this. The official Unity WebRTC sample
in that post **doesn't send SDP and ICE over the network** — it plugs them
straight into another object in the same process via `GetOtherPc()`. So you get
the concepts, but not how to connect two machines.

This tutorial **fills exactly that gap.** It builds a signaling server with
websocket-sharp, connects from Unity with a `WebSocketClient`, serializes SDP and
ICE into DTOs and actually exchanges them, and puts a `WebCamTexture` on a
`VideoStreamTrack` to send it. The complete project is published too.

The structure is right. But **the function inverts in two lines that read the
connection state.**

```csharp
public bool CanConnect
    => _peerConnection?.ConnectionState == RTCPeerConnectionState.New ||
       _peerConnection?.ConnectionState == RTCPeerConnectionState.Disconnected;

public bool IsConnected => _peerConnection?.ConnectionState == RTCPeerConnectionState.Connecting;
```

`IsConnected` compares against `Connecting`. **When the connection is
established, `IsConnected` becomes false.**

## Table of Contents

## It Fills the Gap the Earlier Post Left Blank

What's right first, and what continues from the earlier post first.

The signaling the official sample lacked is here. The server does nothing but
relay each received message to everyone except the sender, and the post states
that limit itself.

> This rudimentary functionality will suffice for connecting two peers, which is
> our current objective. However, for a real-world application, you would
> typically implement user authentication ... and ensure that only peers within
> the same session or call are connected.

Honest. And **it includes handing WebSocket receives over to the main thread.**
That's the best-done part of this tutorial.

```csharp
private void OnMessage(object sender, MessageEventArgs e) => _receivedMessages.Enqueue(e.Data);

protected void Update()
{
    // Process received messages on the main thread - Unity functions can only be called from the main thread
    while (_receivedMessages.TryDequeue(out var message))
    {
        Debug.Log("WS Message Received: " + message);
        MessageReceived?.Invoke(message);
    }
}
```

It enqueues on a `ConcurrentQueue` and dequeues in `Update`. websocket-sharp's
callbacks arrive on other threads, so Unity APIs must not be called there, and
this code knows that.

Not calling `WebRTC.Initialize()` is right too. As confirmed in
[the earlier post](/posts/unity-webrtc-signaling/) that method is gone, and what
remains on the `WebRTC` static class is `Update()`.

> **Update()** — "Updates the texture data for all video tracks at the end of each
> frame."

The video-receiving side is right as well. It takes `OnVideoReceived` once and
plugs it into a `RawImage`, and the docs say why that's correct.

> **OnVideoReceived:** Event to be fired when the **first frame** of the video is
> received.

It fires only on the first frame. Later frames are the contents of that same
`Texture` object changing, and what does that updating is the `WebRTC.Update()`
above. So plug the texture in once and it keeps flowing. No need to re-plug it
every frame.

One thing to note: `WebRTC.Update()` walks **"all video tracks."** It's a global
pump. It's started in `VideoManager`'s `Awake`, so two `VideoManager`s mean two
copies of the same pump running.

## IsConnected Is Looking at Connecting

Put the two doc sentences side by side and it's over.

> **Connecting** — "The peer connection is in the process of connecting."
>
> **Connected** — "The peer connection has been established."

"Connecting" and "connected." `IsConnected` compares against the former. So the
name and the behavior are opposites — **the moment the connection is established,
`IsConnected` flips to false.**

That spreads to two places. `Disconnect` first.

```csharp
public void Disconnect()
{
    if (!IsConnected)
    {
        return;
    }

    _peerConnection.Close();
    _peerConnection.Dispose();
}
```

The guard is `IsConnected`. **Once the call is actually up, `Disconnect()` does
nothing and returns.** It fails to disconnect in exactly the case where you want
to.

Then the UI.

```csharp
protected void Update()
{
    // Control buttons being clickable by the connection state
    _connectButton.interactable = _videoManager.CanConnect;
    _disconnectButton.interactable = _videoManager.IsConnected;
}
```

The Disconnect button's enabled condition is `IsConnected`. **It can only be
clicked while connecting, and greys out the moment it's up.** The guard and the
button use the same wrong condition, so the symptom doubles — you can't click it,
and clicking it wouldn't work.

And there are two states neither property covers.

| State | `CanConnect` | `IsConnected` | Result |
| --- | --- | --- | --- |
| New | ✓ | | Only Connect clickable — correct |
| Connecting | | ✓ | Only Disconnect clickable — the opposite of the intent |
| Connected | | | **Both greyed out** |
| Disconnected | ✓ | | Only Connect clickable — correct |
| Failed | | | **Both greyed out** |
| Closed | | | **Both greyed out** |

`Failed` and `Closed` are in neither list. If the connection fails, **there's no
button to retry.** And if `Close()` ever ran, the state becomes `Closed`, where
both buttons die again.

| The docs' wording | |
| --- | --- |
| Failed | "The peer connection has failed." |
| Closed | "The peer connection has been closed." |

There's one more in `Disconnect`. It calls `Dispose()` and **never nulls out
`_peerConnection`.** `Update` reads `_peerConnection?.ConnectionState` every
frame, so from the next frame on it reads a property off an already-disposed
object. `?.` only filters null — **a disposed object is not null.**

> **Dispose()** — "Disposes of RTCPeerConnection." ... "releases resources used by
> the RTCPeerConnection. This method closes the current peer connection and
> disposes of all transceivers."

What Unity WebRTC does when a released handle is accessed I couldn't confirm. It
might throw, or quietly return garbage. What's certain is **that line must not
run**, and one `_peerConnection = null` lets `?.` do its job.

## RemoveTrack Doesn't Remove the Sender

Here's the camera-switching code. The comment says "Remove previous track."

```csharp
public void SetActiveCamera(WebCamTexture activeWebCamTexture)
{
    // Remove previous track
    var senders = _peerConnection.GetSenders();
    foreach (var sender in senders)
    {
        _peerConnection.RemoveTrack(sender);
    }

    var videoTrack = new VideoStreamTrack(activeWebCamTexture);
    _peerConnection.AddTrack(videoTrack);

    Debug.Log("Sender video track was set");
}
```

Read `RemoveTrack`'s doc description as written and it contradicts the comment.

> **RemoveTrack()** — "Tells the local end of the connection to stop sending media
> from the specified track, **without actually removing the corresponding
> RTCRtpSender from the list of senders.**"

**The sender stays in the list.** Only the sending stops. So switch cameras three
times and the list `GetSenders()` returns holds three, and each time you
`RemoveTrack` all of them again. And `AddTrack` adds a new track every time, so
the SDP's m-lines grow along with it.

Looking at the declaration, `RemoveTrack` returns a result, and the tutorial
discards that too.

```csharp
public RTCErrorType RemoveTrack(RTCRtpSender sender)
```

The vanished tracks are a problem as well. Nobody `Dispose`s the objects made
with `new VideoStreamTrack(...)`.

> **Dispose** — "Disposes of the `VideoStreamTrack` and releases the associated
> resources."

`VideoStreamTrack` is `IDisposable`, and every camera switch leaves one
unreleased. Fiddle with the dropdown a few times and that many pile up.

There are two directions for a fix.

| Approach | What it does |
| --- | --- |
| Reuse the sender | Replace only that sender's track with the new one |
| Keep the track you made | `Dispose` the previous track when switching |

The first is closer to WebRTC's intent. If the sender staying in the list is by
design, **changing that sender's track** is the normal path. And that method's
docs write out the use case directly.

> **ReplaceTrack(MediaStreamTrack)** — "Replaces the current source track with a
> new MediaStreamTrack." ... **is often used to switch between two cameras.**

What this tutorial was trying to do, written out literally. The second at least
stops the leak. The "Where and Why You'd Use It" section below combines both.

## Switch the Camera and It Doesn't Reach the Other Peer

`AddTrack`'s docs have one more sentence.

> **AddTrack()** — "Adds a new media track to the set of tracks which is
> transmitted to the other peer. **Adding a track to a connection triggers
> renegotiation by firing an OnNegotiationNeeded event.**"

And the tutorial's `OnNegotiationNeeded` is this.

```csharp
private void OnNegotiationNeeded()
{
    Debug.Log("SDP Offer <-> Answer exchange requested by the webRTC client.");
}
```

It only logs. The post knows that.

> In this tutorial, we'll initiate the negotiation when the user clicks the
> `Connect` button. However, in a real-life application, negotiation process
> should be repeated whenever `OnNegotiationNeeded` event is triggered.

So far that reads as "omitted because it's a tutorial." But this omission
**makes one of the tutorial's own features unusable.** Switching cameras from the
dropdown is in the UI, and that path is `SetActiveCamera` → `AddTrack` →
`OnNegotiationNeeded`.

| When | Switching the camera |
| --- | --- |
| Before connecting | The new track goes into the next `CreateOffer` — works |
| After connecting | `OnNegotiationNeeded` logs and stops — **the other screen doesn't change** |

Pick a camera before connecting and it's fine; change it mid-call and it doesn't
change. The same button behaves differently depending on timing. Adding
renegotiation isn't hard — call the `CreateAndSendLocalSdpOffer` coroutine that
already exists from `OnNegotiationNeeded`.

```csharp
private void OnNegotiationNeeded()
{
    StartCoroutine(CreateAndSendLocalSdpOffer());
}
```

Though if both sides send an offer at once they collide. In practice you need a
rule for which side offers, and that's beyond this post.

## An int? Field Quietly Disappears

Here's the DTO that carries ICE candidates.

```csharp
namespace WebRTCTutorial.DTO
{
    /// <summary>
    /// DTO (Data Transfer Object) to send/receive ICE Candidate through the network. This DTO maps to <see cref="RTCIceCandidate"/>
    /// </summary>
    [System.Serializable]
    public class ICECanddidateDTO
    {
        public string Candidate;
        public string SdpMid;
        public int? SdpMLineIndex;
    }
}
```

Matching the type to the original is natural. `RTCIceCandidate.SdpMLineIndex`
really is `int?`.

> **SdpMLineIndex** (`int?`) — "Returns the index of the m-line in SDP."

The problem is what serializes this DTO.

```csharp
var serializedPayload = JsonUtility.ToJson(obj);
```

[The post on JsonUtility](/posts/unity-jsonutility/) set out one rule — **if it
isn't visible in the Inspector, it isn't in the JSON either.** `int?` isn't
visible in the Inspector.

The docs' list of serializable types is a whitelist.

> Primitive data types (int, float, double, bool, string, etc.). Enum types (32
> bits or smaller). Fixed-size buffers. Unity built-in types ... Custom structs
> with the `[Serializable]` attribute. References to objects that derive from
> UnityEngine.Object. Custom classes with the `[Serializable]` attribute.

`Nullable<int>` isn't a custom struct carrying `[Serializable]`, and it isn't in
the Unity built-in type list. Not on the list means not serialized. It's worth
noting that **the docs don't prohibit `Nullable<T>` by name** — this is inferred
from the whitelist, and printing the `ToJson` result yourself is the sure way.

So what happens. The sending side's JSON has no `SdpMLineIndex` key, and the
receiving side leaves it at its default of `null`. That value goes straight
through.

```csharp
var ice = new RTCIceCandidate(new RTCIceCandidateInit
{
    candidate = iceDto.Candidate,
    sdpMid = iceDto.SdpMid,
    sdpMLineIndex = iceDto.SdpMLineIndex   // always null
});
```

**And yet this tutorial works.** Because `sdpMid` carries the same information.

> **sdpMid** (`string`) — "The media stream identification for the candidate."
>
> **sdpMLineIndex** (`int?`) — "The index of the m-line in SDP."

Both point at which media this candidate belongs to, and with only one of them
the other side still finds it. So a field vanishes silently every time and no
symptom shows.

A bug with no symptom is worse because **you don't get to decide when it
surfaces.** One candidate arrives with an empty `SdpMid`, or someone tidying the
DTO decides `SdpMid` is redundant and deletes it — that's when ICE stops
connecting. The fix is one line: **change `int?` to `int`, and if you need to
express absence, use `-1`.**

| Before | After |
| --- | --- |
| `public int? SdpMLineIndex;` | `public int SdpMLineIndex;` |
| Disappears from the JSON | The value is carried |
| The receiver always gets `null` | The receiver gets what was sent |

## Where and Why You'd Use It

### Fixed Connection State and Buttons

Split the state into three. And replace the per-frame question in `Update` with
`OnConnectionStateChange`.

```csharp
using System;
using Unity.WebRTC;
using UnityEngine;

namespace WebRTCTutorial
{
    public partial class VideoManager : MonoBehaviour
    {
        /// <summary>Fires once when the state changes. No asking every frame.</summary>
        public event Action OnConnectionStateChanged;

        private RTCPeerConnection _peerConnection;

        /// <summary>States you can dial from. Failed and Closed included.</summary>
        public bool CanConnect
        {
            get
            {
                if (_peerConnection == null)
                {
                    return false;
                }

                RTCPeerConnectionState state = _peerConnection.ConnectionState;
                return state == RTCPeerConnectionState.New
                    || state == RTCPeerConnectionState.Disconnected
                    || state == RTCPeerConnectionState.Failed
                    || state == RTCPeerConnectionState.Closed;
            }
        }

        /// <summary>Docs: Connected is "has been established". Not Connecting.</summary>
        public bool IsConnected
            => _peerConnection != null
               && _peerConnection.ConnectionState == RTCPeerConnectionState.Connected;

        /// <summary>Connecting. The place where both buttons lock.</summary>
        public bool IsConnecting
            => _peerConnection != null
               && _peerConnection.ConnectionState == RTCPeerConnectionState.Connecting;

        public void Disconnect()
        {
            if (_peerConnection == null)
            {
                return;
            }

            _peerConnection.Close();
            _peerConnection.Dispose();

            // A disposed object is not null. ?. can't filter it out.
            _peerConnection = null;

            OnConnectionStateChanged?.Invoke();
        }
    }
}
```

Nulling `_peerConnection` makes `CanConnect` false too, so dialing again needs a
path that creates a new `RTCPeerConnection`. Keep that path separate.

```csharp
using Unity.WebRTC;
using UnityEngine;

namespace WebRTCTutorial
{
    public partial class VideoManager
    {
        private const string STUN_URL = "stun:stun.l.google.com:19302";

        /// <summary>Builds a fresh peer connection. Also called when redialing after a hang-up.</summary>
        private void CreatePeerConnection()
        {
            var config = new RTCConfiguration
            {
                iceServers = new[]
                {
                    new RTCIceServer { urls = new[] { STUN_URL } }
                },
            };

            _peerConnection = new RTCPeerConnection(ref config);

            _peerConnection.OnNegotiationNeeded += OnNegotiationNeeded;
            _peerConnection.OnIceCandidate += OnIceCandidate;
            _peerConnection.OnTrack += OnTrack;

            // Receive it as an event instead of polling every frame.
            _peerConnection.OnConnectionStateChange += _ => OnConnectionStateChanged?.Invoke();
        }

        // As settled in the earlier post, what you create you release in pairs.
        private void OnDestroy()
        {
            if (_peerConnection == null)
            {
                return;
            }

            _peerConnection.OnNegotiationNeeded -= OnNegotiationNeeded;
            _peerConnection.OnIceCandidate -= OnIceCandidate;
            _peerConnection.OnTrack -= OnTrack;

            _peerConnection.Close();
            _peerConnection.Dispose();
            _peerConnection = null;
        }
    }
}
```

The original code has no `OnDestroy` on `VideoManager`. `WebSocketClient`
unsubscribes and closes its socket in its own `OnDestroy`, while `VideoManager`
leaves both the `RTCPeerConnection` and the `_webSocketClient.MessageReceived`
subscription as they are. It's the same spot where
[the earlier post](/posts/unity-webrtc-signaling/) found the official sample's
cleanup code missing from the clipping.

The UI side becomes this.

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WebRTCTutorial
{
    public class ConnectionButtons : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private VideoManager _videoManager;
        [SerializeField] private Button _connectButton;
        [SerializeField] private Button _disconnectButton;

        private void Awake()
        {
            _connectButton.onClick.AddListener(_videoManager.Connect);
            _disconnectButton.onClick.AddListener(_videoManager.Disconnect);

            // Don't read it every frame in Update. Redraw only when it changes.
            _videoManager.OnConnectionStateChanged += Refresh;
            Refresh();
        }

        private void OnDestroy()
        {
            _videoManager.OnConnectionStateChanged -= Refresh;
        }

        private void Refresh()
        {
            // Lock both while connecting. The original left only Disconnect open then.
            _connectButton.interactable = _videoManager.CanConnect;
            _disconnectButton.interactable = _videoManager.IsConnected;
        }
    }
}
```

### Fixed Camera Switching

Reuse the sender, and hold the track you made so you can release it when
switching.

```csharp
using Unity.WebRTC;
using UnityEngine;

namespace WebRTCTutorial
{
    public partial class VideoManager
    {
        private VideoStreamTrack _localVideoTrack;
        private RTCRtpSender _videoSender;

        public void SetActiveCamera(WebCamTexture activeWebCamTexture)
        {
            if (_peerConnection == null || activeWebCamTexture == null)
            {
                Debug.LogError("Not ready to call SetActiveCamera.");
                return;
            }

            var newTrack = new VideoStreamTrack(activeWebCamTexture);

            if (_videoSender == null)
            {
                // First track. AddTrack raises OnNegotiationNeeded.
                _videoSender = _peerConnection.AddTrack(newTrack);
            }
            else
            {
                // Docs: RemoveTrack does not remove the sender from the list.
                //       So change the sender's track instead of removing and adding.
                //       No m-line is added, so no renegotiation is needed either.
                _videoSender.ReplaceTrack(newTrack);
            }

            // End the previous track here. Without this, one piles up per switch.
            if (_localVideoTrack != null)
            {
                _localVideoTrack.Dispose();
            }

            _localVideoTrack = newTrack;
        }
    }
}
```

`ReplaceTrack` leaves the sender in place and changes only the source, so no
m-line is added and **switching cameras needs no renegotiation.** The previous
section's `OnNegotiationNeeded` problem simply doesn't arise on this path. Only
the first `AddTrack` needs renegotiation, and that happens before `Connect`.

`_localVideoTrack` has to be released in `OnDestroy` as well. Add a line to the
`OnDestroy` above.

```csharp
private void OnDestroy()
{
    if (_localVideoTrack != null)
    {
        _localVideoTrack.Dispose();
        _localVideoTrack = null;
    }

    // ... peer connection cleanup is the same as the code above
}
```

### Where Not to Use It

**Shipping this signaling server as is.** It relays received messages to everyone
connected. Two people works; three and their SDPs mix. The post itself writes
that authentication and session separation are needed.

**Leaving `FindObjectOfType` in.** The tutorial uses it in two places and both
times comments that it should be avoided in production. Wiring it in the
Inspector with `[SerializeField]` is cheaper, and shows up immediately when a
reference is empty.

**Calling Unity APIs from a WebRTC callback.** This tutorial hands **incoming**
WebSocket messages to the main thread through a `ConcurrentQueue`, then does
**outgoing** directly inside a WebRTC callback.

```csharp
private void OnIceCandidate(RTCIceCandidate candidate)
{
    SendIceCandidateToOtherPeer(candidate);
    Debug.Log("Sent Ice Candidate to the other peer THREAD  " + Thread.CurrentThread.ManagedThreadId);
}
```

Printing the thread ID in the log means the author suspected this spot too. That
path goes into `JsonUtility.ToJson` — a Unity API. **Which thread Unity WebRTC's
callbacks arrive on I couldn't find in the docs.** If it's the main thread
there's no problem; if not, it's a place you mustn't go. The asymmetry itself —
one side through a queue, the other not — is the signal worth checking. The way
to check is that log line as written.

**Expecting STUN alone to connect anywhere.** The config has one Google STUN
server. The post draws its own line.

> Keep in mind that even within a home network, a peer-to-peer connection might
> not be established due to specific network configurations.

As seen in [the earlier post](/posts/unity-webrtc-signaling/), behind a symmetric
NAT you need TURN, and TURN is a server traffic passes through, which eats into
P2P's cost advantage.

## Wrapping Up

This tutorial fills the spot the official sample left empty. A signaling server,
the WebSocket connection, DTO serialization, the SDP/ICE exchange and camera
sending are all there, and the complete project is published. Handing WebSocket
receives to the main thread is particularly well done.

Where it breaks is **the two lines that read the connection state.**
`IsConnected` is looking at `Connecting`, so in the docs' own words it goes false
the moment the connection "has been established." `Disconnect`'s guard and the
button's enabled condition use the same condition, so **once it's up you can't
hang up.** `Failed` and `Closed` are in neither property, so a failure leaves no
button to retry with.

The other three are one doc line each. `RemoveTrack` is "without actually
removing the corresponding RTCRtpSender," so senders pile up. `AddTrack` raises
renegotiation and that handler only logs, so a mid-call camera switch never
reaches the other peer. `int? SdpMLineIndex` isn't on Unity's serializer
whitelist so it vanishes every time, and `SdpMid` carries the same information,
so **no symptom shows.**

That last one bothers me most. The other three surface when you press a button;
that one **doesn't let you decide when it surfaces.**

---

### References

- [RTCPeerConnectionState — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnectionState.html)
- [RTCPeerConnection — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnection.html)
- [RTCIceCandidate — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCIceCandidate.html)
- [VideoStreamTrack — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.VideoStreamTrack.html)
- [WebRTC static class — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.WebRTC.html)
- [Serialization rules — Unity Manual](https://docs.unity3d.com/Manual/script-serialization-rules.html)

The starting point for this post was [GetStream — Video Streaming in Unity with WebRTC](https://getstream.io/resources/projects/webrtc/platforms/unity-streaming/).
I followed the code it carries, from the signaling server through to
`UIManager`, line by line, checking the connection-state decisions, the track
replacement and the DTO serialization against the current Unity WebRTC API
reference and Unity's serialization rules.
