---
pubDatetime: 2026-10-01T21:30:00+09:00
title: "IsConnected가 Connecting을 보고 있다"
lang: ko
translationKey: unity-webrtc-video-streaming
featured: false
draft: false
tags:
  - Unity
  - C#
  - 네트워크
  - WebRTC
  - 직렬화
description: "시그널링 서버부터 카메라 송출까지 통째로 보여주는 튜토리얼이다. 그런데 IsConnected가 Connecting과 비교하고 있어서, 연결이 실제로 성립한 순간 Disconnect 버튼이 죽는다. RemoveTrack과 OnNegotiationNeeded에도 각각 구멍이 있다."
---

[앞선 WebRTC 글](/posts/unity-webrtc-signaling/)을 쓰고 나서, 같은 주제를 계속
찾아보던 중에 스크랩한 글이다. 앞 글에서 본 Unity WebRTC 공식 샘플은 **SDP와
ICE를 네트워크로 보내지 않는다** — `GetOtherPc()`로 같은 프로세스 안의 다른
객체에 직접 꽂는다. 그래서 개념은 잡히지만 두 대를 붙이는 방법은 안 나온다.

이 튜토리얼은 **정확히 그 빈칸을 채운다.** websocket-sharp으로 시그널링 서버를
만들고, Unity 쪽에서 `WebSocketClient`로 붙고, SDP와 ICE를 DTO로 직렬화해서
실제로 주고받고, `WebCamTexture`를 `VideoStreamTrack`에 실어 보낸다. 전체
프로젝트도 공개되어 있다.

구조는 맞다. 그런데 **연결 상태를 읽는 두 줄에서 기능이 뒤집힌다.**

```csharp
public bool CanConnect
    => _peerConnection?.ConnectionState == RTCPeerConnectionState.New ||
       _peerConnection?.ConnectionState == RTCPeerConnectionState.Disconnected;

public bool IsConnected => _peerConnection?.ConnectionState == RTCPeerConnectionState.Connecting;
```

`IsConnected`가 `Connecting`과 비교한다. **연결이 성립하면 `IsConnected`가
false가 된다.**

## 목차

## 앞선 글이 빈칸으로 남긴 자리를 채운다

먼저 맞는 쪽부터, 그리고 앞선 글과 이어지는 부분부터.

공식 샘플에 없던 시그널링이 여기 있다. 서버는 받은 메시지를 보낸 사람만 빼고
전부에게 되돌려주는 것뿐이고, 글이 그 한계를 스스로 적어둔다.

> This rudimentary functionality will suffice for connecting two peers, which is
> our current objective. However, for a real-world application, you would
> typically implement user authentication ... and ensure that only peers within
> the same session or call are connected.

정직하다. 그리고 **WebSocket 수신을 메인 스레드로 넘기는 처리가 들어 있다.**
이게 이 튜토리얼에서 가장 잘 된 부분이다.

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

`ConcurrentQueue`에 넣고 `Update`에서 꺼낸다. websocket-sharp의 콜백은 다른
스레드에서 오므로 거기서 Unity API를 부르면 안 되고, 이 코드는 그걸 안다.

`WebRTC.Initialize()`를 안 부르는 것도 맞다. [앞선 글](/posts/unity-webrtc-signaling/)에서
확인한 대로 그 메서드는 지금 없고, `WebRTC` 정적 클래스에 남은 건 `Update()`다.

> **Update()** — "Updates the texture data for all video tracks at the end of each
> frame."

영상 수신 쪽 처리도 맞다. `OnVideoReceived`를 한 번만 받아서 `RawImage`에 꽂는데,
그게 올바른 이유가 문서에 있다.

> **OnVideoReceived:** Event to be fired when the **first frame** of the video is
> received.

첫 프레임에만 오는 이벤트다. 이후 프레임은 같은 `Texture` 객체의 내용이 바뀌는
것이고, 그 갱신을 하는 게 위의 `WebRTC.Update()`다. 그래서 텍스처를 한 번
꽂아두면 계속 흐른다. 매 프레임 다시 꽂을 필요가 없다.

한 가지만 짚어두면, `WebRTC.Update()`는 **"all video tracks"**를 돈다. 전역
펌프다. `VideoManager`의 `Awake`에서 시작하므로 `VideoManager`가 둘이면 같은
펌프를 두 개 돌린다.

## IsConnected가 Connecting을 보고 있다

문서의 두 문장을 나란히 놓으면 끝난다.

> **Connecting** — "The peer connection is in the process of connecting."
>
> **Connected** — "The peer connection has been established."

"연결 중"과 "연결됨"이다. `IsConnected`는 앞의 것과 비교한다. 그래서 이름과
동작이 반대다 — **연결이 성립하는 순간 `IsConnected`가 false로 바뀐다.**

이게 두 군데로 번진다. 먼저 `Disconnect`다.

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

가드가 `IsConnected`다. **통화가 실제로 붙은 뒤에는 `Disconnect()`가 아무것도
안 하고 돌아온다.** 끊고 싶을 때만 안 끊긴다.

다음은 UI다.

```csharp
protected void Update()
{
    // Control buttons being clickable by the connection state
    _connectButton.interactable = _videoManager.CanConnect;
    _disconnectButton.interactable = _videoManager.IsConnected;
}
```

`Disconnect` 버튼의 활성 조건이 `IsConnected`다. **연결 중일 때만 눌릴 수 있고,
붙은 순간 회색이 된다.** 가드와 버튼이 같은 잘못된 조건을 쓰므로 증상이 두 겹
겹친다 — 누를 수도 없고, 눌러도 안 된다.

그리고 두 프로퍼티가 어느 쪽도 다루지 않는 상태가 둘 있다.

| 상태 | `CanConnect` | `IsConnected` | 결과 |
| --- | --- | --- | --- |
| New | ✓ | | Connect만 눌림 — 맞다 |
| Connecting | | ✓ | Disconnect만 눌림 — 의도와 반대 |
| Connected | | | **둘 다 회색** |
| Disconnected | ✓ | | Connect만 눌림 — 맞다 |
| Failed | | | **둘 다 회색** |
| Closed | | | **둘 다 회색** |

`Failed`와 `Closed`가 어느 목록에도 없다. 연결이 실패하면 **다시 시도할 버튼이
없다.** 그리고 어떻게든 `Close()`가 불렸다면 상태는 `Closed`가 되고, 거기서도
버튼이 둘 다 죽는다.

| 문서의 설명 | |
| --- | --- |
| Failed | "The peer connection has failed." |
| Closed | "The peer connection has been closed." |

`Disconnect`에 하나 더 있다. `Dispose()`를 부르고도 **`_peerConnection`을
null로 만들지 않는다.** `Update`는 매 프레임 `_peerConnection?.ConnectionState`를
읽으므로, 다음 프레임부터 이미 Dispose된 객체의 프로퍼티를 읽는다. `?.`는
null만 걸러낸다 — **Dispose된 객체는 null이 아니다.**

> **Dispose()** — "Disposes of RTCPeerConnection." ... "releases resources used by
> the RTCPeerConnection. This method closes the current peer connection and
> disposes of all transceivers."

해제된 핸들에 접근했을 때 Unity WebRTC가 무엇을 하는지는 확인하지 못했다.
예외일 수도, 조용히 쓰레기 값일 수도 있다. 확실한 건 **그 줄이 실행되어서는
안 된다는 것**이고, `_peerConnection = null` 한 줄이면 `?.`가 제 일을 한다.

## RemoveTrack은 sender를 지우지 않는다

카메라를 바꾸는 코드다. 주석이 "Remove previous track"이라고 적혀 있다.

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

`RemoveTrack`의 문서 설명을 그대로 읽으면 주석과 어긋난다.

> **RemoveTrack()** — "Tells the local end of the connection to stop sending media
> from the specified track, **without actually removing the corresponding
> RTCRtpSender from the list of senders.**"

**sender는 목록에 남는다.** 보내는 것만 멈춘다. 그래서 카메라를 세 번 바꾸면
`GetSenders()`가 돌려주는 목록이 세 개가 되고, 매번 그 전부를 다시 `RemoveTrack`
한다. 그리고 `AddTrack`은 매번 새 track을 더하므로 SDP의 m-line도 같이 늘어난다.

선언을 보면 `RemoveTrack`이 결과를 돌려주는데, 튜토리얼은 그것도 버린다.

```csharp
public RTCErrorType RemoveTrack(RTCRtpSender sender)
```

없어진 track 쪽도 문제다. `new VideoStreamTrack(...)`로 만든 객체를 아무도
`Dispose`하지 않는다.

> **Dispose** — "Disposes of the `VideoStreamTrack` and releases the associated
> resources."

`VideoStreamTrack`은 `IDisposable`이고, 카메라를 바꿀 때마다 하나가 해제되지
않은 채 남는다. 드롭다운을 몇 번 만지면 그만큼 쌓인다.

고치는 방향은 둘 중 하나다.

| 방법 | 하는 일 |
| --- | --- |
| sender를 재사용한다 | 기존 sender의 track만 새 것으로 교체한다 |
| 만든 track을 들고 있는다 | 바꿀 때 이전 track을 `Dispose`한다 |

앞쪽이 WebRTC의 의도에 가깝다. sender가 목록에 남는 게 설계라면, **그 sender의
track을 바꾸는 것**이 정상 경로다. 그리고 그 메서드의 문서가 용례를 직접 적어놨다.

> **ReplaceTrack(MediaStreamTrack)** — "Replaces the current source track with a
> new MediaStreamTrack." ... **is often used to switch between two cameras.**

이 튜토리얼이 하려던 일이 문자 그대로 적혀 있다. 뒤쪽은 최소한 누수를 막는다.
아래 "어디에 왜 쓰나"에서 둘을 합친 코드를 쓴다.

## 카메라를 바꿔도 상대에게 안 간다

`AddTrack`의 문서에 한 문장이 더 있다.

> **AddTrack()** — "Adds a new media track to the set of tracks which is
> transmitted to the other peer. **Adding a track to a connection triggers
> renegotiation by firing an OnNegotiationNeeded event.**"

그리고 튜토리얼의 `OnNegotiationNeeded`는 이렇다.

```csharp
private void OnNegotiationNeeded()
{
    Debug.Log("SDP Offer <-> Answer exchange requested by the webRTC client.");
}
```

로그만 찍는다. 글도 그걸 안다.

> In this tutorial, we'll initiate the negotiation when the user clicks the
> `Connect` button. However, in a real-life application, negotiation process
> should be repeated whenever `OnNegotiationNeeded` event is triggered.

여기까지는 "튜토리얼이라 생략했다"로 읽힌다. 그런데 이 생략이 **이 튜토리얼
자체의 기능 하나를 못 쓰게 만든다.** 드롭다운으로 카메라를 바꾸는 기능이 UI에
있고, 그 경로가 `SetActiveCamera` → `AddTrack` → `OnNegotiationNeeded`다.

| 시점 | 카메라를 바꾸면 |
| --- | --- |
| 연결 전 | 다음 `CreateOffer`에 새 track이 담겨 정상 동작 |
| 연결 후 | `OnNegotiationNeeded`가 로그만 찍고 끝 — **상대 화면은 안 바뀐다** |

연결하기 전에 카메라를 고르면 멀쩡하고, 통화 중에 바꾸면 안 바뀐다. 같은 버튼이
타이밍에 따라 다르게 동작한다. 재협상을 붙이는 건 어렵지 않다 — 이미 있는
`CreateAndSendLocalSdpOffer` 코루틴을 `OnNegotiationNeeded`에서 부르면 된다.

```csharp
private void OnNegotiationNeeded()
{
    StartCoroutine(CreateAndSendLocalSdpOffer());
}
```

다만 양쪽이 동시에 offer를 보내면 충돌한다. 실제로는 어느 쪽이 offer를 내는지
정하는 규칙이 필요하고, 그건 이 글의 범위를 넘는다.

## int? 필드는 조용히 사라진다

ICE 후보를 실어 보내는 DTO다.

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

타입을 원본에 맞춘 건 자연스럽다. `RTCIceCandidate.SdpMLineIndex`가 실제로
`int?`다.

> **SdpMLineIndex** (`int?`) — "Returns the index of the m-line in SDP."

문제는 이 DTO를 직렬화하는 수단이다.

```csharp
var serializedPayload = JsonUtility.ToJson(obj);
```

[JsonUtility를 정리한 글](/posts/unity-jsonutility/)에서 규칙 하나를 세워뒀다 —
**인스펙터에 안 보이면 JSON에도 안 담긴다.** `int?`는 인스펙터에 안 보인다.

문서의 직렬화 가능 목록이 화이트리스트다.

> Primitive data types (int, float, double, bool, string, etc.). Enum types (32
> bits or smaller). Fixed-size buffers. Unity built-in types ... Custom structs
> with the `[Serializable]` attribute. References to objects that derive from
> UnityEngine.Object. Custom classes with the `[Serializable]` attribute.

`Nullable<int>`은 `[Serializable]`이 붙은 커스텀 구조체가 아니고, Unity 빌트인
타입 목록에도 없다. 목록에 없으면 안 담긴다. **문서가 `Nullable<T>`를 이름으로
금지하지는 않는다**는 점은 짚어둬야 한다 — 화이트리스트에서 추론한 결과이고,
직접 `ToJson` 결과를 찍어보는 편이 확실하다.

그러면 무슨 일이 생기나. 보내는 쪽 JSON에 `SdpMLineIndex` 키가 없고, 받는 쪽은
기본값인 `null`로 둔다. 그 값이 그대로 들어간다.

```csharp
var ice = new RTCIceCandidate(new RTCIceCandidateInit
{
    candidate = iceDto.Candidate,
    sdpMid = iceDto.SdpMid,
    sdpMLineIndex = iceDto.SdpMLineIndex   // 항상 null
});
```

**그런데 이 튜토리얼은 동작한다.** `sdpMid`가 같은 정보를 담고 있기 때문이다.

> **sdpMid** (`string`) — "The media stream identification for the candidate."
>
> **sdpMLineIndex** (`int?`) — "The index of the m-line in SDP."

둘 다 "이 후보가 어느 미디어에 속하는지"를 가리키고, 하나만 있어도 상대가
찾아낸다. 그래서 필드 하나가 매번 조용히 사라지는데 증상이 안 보인다.

증상이 없는 버그가 더 나쁜 이유는 **언제 드러날지 정할 수 없다**는 것이다.
`SdpMid`가 빈 후보가 하나 오거나, 누가 DTO를 정리하면서 중복이라 보고 `SdpMid`를
지우면, 그때 ICE가 안 붙는다. 고치는 방법은 한 줄이다 — **`int?`를 `int`로
바꾸고, 없음을 표현해야 한다면 `-1`을 쓴다.**

| 전 | 후 |
| --- | --- |
| `public int? SdpMLineIndex;` | `public int SdpMLineIndex;` |
| JSON에서 사라진다 | 값이 담긴다 |
| 받는 쪽은 항상 `null` | 받는 쪽은 보낸 값 |

## 어디에 왜 쓰나

### 고친 연결 상태와 버튼

상태를 세 개로 분리한다. 그리고 `Update`에서 매 프레임 묻는 대신
`OnConnectionStateChange`로 바꾼다.

```csharp
using System;
using Unity.WebRTC;
using UnityEngine;

namespace WebRTCTutorial
{
    public partial class VideoManager : MonoBehaviour
    {
        /// <summary>연결 상태가 바뀔 때 한 번만 알린다. 매 프레임 묻지 않는다.</summary>
        public event Action OnConnectionStateChanged;

        private RTCPeerConnection _peerConnection;

        /// <summary>새로 걸 수 있는 상태. 실패와 종료도 포함한다.</summary>
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

        /// <summary>문서: Connected가 "has been established"다. Connecting이 아니다.</summary>
        public bool IsConnected
            => _peerConnection != null
               && _peerConnection.ConnectionState == RTCPeerConnectionState.Connected;

        /// <summary>연결 중. 두 버튼을 모두 잠그는 자리.</summary>
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

            // Dispose된 객체는 null이 아니다. ?.가 걸러주지 못한다.
            _peerConnection = null;

            OnConnectionStateChanged?.Invoke();
        }
    }
}
```

`_peerConnection`을 null로 만들면 `CanConnect`도 false가 되므로, 다시 걸려면
새 `RTCPeerConnection`을 만드는 경로가 필요하다. 그 경로를 분리해 둔다.

```csharp
using Unity.WebRTC;
using UnityEngine;

namespace WebRTCTutorial
{
    public partial class VideoManager
    {
        private const string STUN_URL = "stun:stun.l.google.com:19302";

        /// <summary>peer connection을 새로 만든다. 끊은 뒤 다시 걸 때도 이걸 부른다.</summary>
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

            // 매 프레임 폴링하는 대신 이벤트로 받는다.
            _peerConnection.OnConnectionStateChange += _ => OnConnectionStateChanged?.Invoke();
        }

        // 앞선 글에서 정리한 대로, 만든 것은 짝을 지어 해제한다.
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

원래 코드에는 `VideoManager`의 `OnDestroy`가 없다. `WebSocketClient`는 자기
`OnDestroy`에서 구독을 풀고 소켓을 닫는데, `VideoManager`는 `RTCPeerConnection`도
`_webSocketClient.MessageReceived` 구독도 그대로 두고 끝난다.
[앞선 글](/posts/unity-webrtc-signaling/)에서 공식 샘플의 정리 코드가 클리핑에서
빠졌던 것과 같은 자리다.

UI 쪽은 이렇게 바뀐다.

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

            // Update에서 매 프레임 읽지 않는다. 바뀔 때만 다시 그린다.
            _videoManager.OnConnectionStateChanged += Refresh;
            Refresh();
        }

        private void OnDestroy()
        {
            _videoManager.OnConnectionStateChanged -= Refresh;
        }

        private void Refresh()
        {
            // 연결 중에는 둘 다 잠근다. 원래 코드는 이때 Disconnect만 열어뒀다.
            _connectButton.interactable = _videoManager.CanConnect;
            _disconnectButton.interactable = _videoManager.IsConnected;
        }
    }
}
```

### 고친 카메라 교체

sender를 재사용하고, 만든 track을 들고 있다가 교체할 때 해제한다.

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
                Debug.LogError("SetActiveCamera를 부를 준비가 안 됐다.");
                return;
            }

            var newTrack = new VideoStreamTrack(activeWebCamTexture);

            if (_videoSender == null)
            {
                // 첫 track. AddTrack은 OnNegotiationNeeded를 띄운다.
                _videoSender = _peerConnection.AddTrack(newTrack);
            }
            else
            {
                // 문서: RemoveTrack은 sender를 목록에서 지우지 않는다.
                //       그래서 지우고 더하는 대신 sender의 track을 바꾼다.
                //       m-line이 늘지 않으므로 재협상도 필요 없다.
                _videoSender.ReplaceTrack(newTrack);
            }

            // 이전 track은 여기서 끝낸다. 안 하면 카메라를 바꿀 때마다 하나씩 쌓인다.
            if (_localVideoTrack != null)
            {
                _localVideoTrack.Dispose();
            }

            _localVideoTrack = newTrack;
        }
    }
}
```

`ReplaceTrack`은 sender를 그대로 두고 소스만 바꾸므로 m-line이 늘지 않고,
**카메라를 바꿔도 재협상이 필요 없다.** 앞 절의 `OnNegotiationNeeded` 문제가 이 경로에서는 아예 생기지 않는다.
첫 `AddTrack`에서만 재협상이 필요하고, 그건 `Connect` 전에 일어난다.

`_localVideoTrack`을 `OnDestroy`에서도 해제해야 한다. 위의 `OnDestroy`에 한 줄을
더한다.

```csharp
private void OnDestroy()
{
    if (_localVideoTrack != null)
    {
        _localVideoTrack.Dispose();
        _localVideoTrack = null;
    }

    // ... peer connection 정리는 앞의 코드와 같다
}
```

### 쓰지 말아야 할 자리

**이 시그널링 서버를 그대로 배포하기.** 받은 메시지를 접속한 모두에게
되돌려준다. 두 명이면 동작하고 세 명이면 서로의 SDP가 섞인다. 글도 인증과 세션
분리가 필요하다고 적어뒀다.

**`FindObjectOfType`을 그대로 두기.** 튜토리얼이 두 군데에서 쓰면서 두 번 다
"프로덕션에서는 피하라"고 주석을 달아뒀다. `[SerializeField]`로 인스펙터에서
꽂는 쪽이 싸고, 참조가 비었을 때 바로 드러난다.

**WebRTC 콜백에서 Unity API를 부르는 것.** 이 튜토리얼은 **수신** WebSocket
메시지를 `ConcurrentQueue`로 메인 스레드에 넘기면서, **송신**은 WebRTC 콜백에서
바로 한다.

```csharp
private void OnIceCandidate(RTCIceCandidate candidate)
{
    SendIceCandidateToOtherPeer(candidate);
    Debug.Log("Sent Ice Candidate to the other peer THREAD  " + Thread.CurrentThread.ManagedThreadId);
}
```

로그에 스레드 ID를 찍어둔 것부터가 글쓴이도 이 자리를 의심했다는 뜻이다. 그
경로는 `JsonUtility.ToJson`으로 들어간다 — Unity API다. **Unity WebRTC의 콜백이
어느 스레드에서 오는지는 문서에서 찾지 못했다.** 메인 스레드라면 문제가 없고,
아니라면 들어가면 안 되는 자리다. 한쪽은 큐를 거치고 다른 쪽은 안 거치는
비대칭 자체가 확인해볼 신호다. 확인하는 방법은 저 로그 그대로다.

**STUN만으로 어디서든 붙을 거라 기대하기.** 설정에 Google STUN 하나뿐이다. 글이
스스로 선을 긋는다.

> Keep in mind that even within a home network, a peer-to-peer connection might
> not be established due to specific network configurations.

[앞선 글](/posts/unity-webrtc-signaling/)에서 본 것처럼 대칭 NAT 뒤에서는 TURN이
필요하고, TURN은 트래픽이 지나가는 서버라 P2P의 비용 이점이 줄어든다.

## 정리

이 튜토리얼은 공식 샘플이 비워둔 자리를 채운다. 시그널링 서버, WebSocket 연결,
DTO 직렬화, SDP/ICE 교환, 카메라 송출이 전부 있고 전체 프로젝트도 공개되어
있다. WebSocket 수신을 메인 스레드로 넘기는 처리는 특히 잘 됐다.

깨지는 자리는 **연결 상태를 읽는 두 줄**이다. `IsConnected`가 `Connecting`을
보고 있어서, 문서의 표현대로 "has been established"가 된 순간 false가 된다.
`Disconnect`의 가드와 버튼의 활성 조건이 같은 조건을 쓰므로 **붙은 뒤에는 끊을
수 없다.** `Failed`와 `Closed`는 두 프로퍼티 어디에도 없어서, 실패하면 다시
시도할 버튼이 없다.

나머지 셋은 문서 한 줄씩이다. `RemoveTrack`은 "without actually removing the
corresponding RTCRtpSender"라 sender가 쌓이고, `AddTrack`은 재협상을 띄우는데
그 핸들러가 로그만 찍어서 통화 중 카메라 교체가 상대에게 안 간다.
`int? SdpMLineIndex`는 Unity 직렬화기 화이트리스트에 없어서 매번 사라지는데,
`SdpMid`가 같은 정보를 담고 있어 **증상이 안 보인다.**

마지막 게 제일 신경 쓰인다. 다른 셋은 눌러보면 드러나는데, 그건 **언제 드러날지
정할 수 없다.**

---

### 참고

- [RTCPeerConnectionState — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnectionState.html)
- [RTCPeerConnection — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnection.html)
- [RTCIceCandidate — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCIceCandidate.html)
- [VideoStreamTrack — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.VideoStreamTrack.html)
- [WebRTC 정적 클래스 — Unity WebRTC API](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.WebRTC.html)
- [직렬화 규칙 — Unity 매뉴얼](https://docs.unity3d.com/Manual/script-serialization-rules.html)

이 글의 출발점이 된 자료는 [GetStream — Video Streaming in Unity with WebRTC](https://getstream.io/resources/projects/webrtc/platforms/unity-streaming/)
이다. 시그널링 서버부터 `UIManager`까지 실린 코드를 한 줄씩 따라가면서, 연결
상태 판정과 track 교체, DTO 직렬화를 현행 Unity WebRTC API 레퍼런스와 Unity
직렬화 규칙에 대조했다.
