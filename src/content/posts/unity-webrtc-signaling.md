---
pubDatetime: 2026-09-28T19:00:00+09:00
title: "Unity WebRTC 샘플에는 시그널링이 없다"
lang: ko
translationKey: unity-webrtc-signaling
featured: false
draft: false
tags:
  - Unity
  - C#
  - 네트워크
  - WebRTC
description: "PeerConnection 샘플을 따라가며 개념을 잡는 2022년 글이다. 그런데 이 샘플에서 SDP와 ICE를 주고받는 자리는 네트워크가 아니라 GetOtherPc()라는 메서드 호출이고, 글이 첫 단계로 시키는 WebRTC.Initialize()는 지금 없다."
---

Mirror로 게임 서버를 세우던 중에 **"서버 방식 중에 P2P도 있다"**는 이야기를
듣고, 그게 정확히 무엇인지 알아보다 스크랩한 글이다.

출발점이 Mirror였던 게 오히려 도움이 됐다. Mirror의 구성은 **서버·클라이언트·
호스트** 셋인데, 그중 호스트도
[서버와 클라이언트를 한 프로세스에서 겸하는 것](/posts/mirror-networking-basics/)이지
P2P가 아니다. 권한은 여전히 한쪽에 있다. WebRTC는 층이 다르다 — 미디어가 두
피어 사이를 직접 흐른다. 그 차이를 정확히 잡으려고 본 글이다.

Unity WebRTC 패키지의 `PeerConnectionSample.cs`를 한 단계씩 따라가며 화면
공유가 어떤 개념으로 이뤄지는지 정리한 2022년 글이다. 글쓴이가 솔직하게 적어둔
출발점이 좋다.

> 네트워크 관련 지식이 많지 않아. 해당 샘플 파일을 이해하는데 초기 어려움이
> 많았다.

그래서 ICE, Candidate, SDP, 시그널링 같은 용어를 하나씩 풀어놓는데 **그
설명 자체는 정확하다.** 문제는 그 설명과 샘플 코드 사이에 있다.

**이 샘플에는 시그널링이 없다.** 글이 시그널링을 "두 단말 간 제어 정보를
교환하는 과정"이라고 맞게 설명해놓고, 정작 코드에서 그 교환을 하는 자리는
같은 프로세스 안의 **메서드 호출**이다. 그리고 글이 1번으로 시키는
`WebRTC.Initialize()`는 **지금 패키지에 존재하지 않는다.**

## 목차

## 지금도 그대로 맞는 것

먼저 유효한 쪽부터. 용어 설명이 정확하다.

> **Candidate**: Stun 서버를 이용해 획득한 IP 주소 및 포트 정보 등의 연결
> 가능한 네트워크 주소들을 말한다.

> **ICE**: 두 개의 단말이 P2P 연결되도록 도와주는 프레임워크이다.

> **SDP**: WebRTC에서 스트리밍 미디어의 해상도나 형식, 코덱 등의 멀티미디어
> 초기 인수를 설명하기 위해 채택한 프로토콜이다.

Offer → Answer 순서도 맞다. 현행 튜토리얼의 표현이 같은 이야기를 한다.

> 피어 사이에 SDP 교환이 일어난다. `CreateOffer`가 최초의 Offer SDP를
> 만든다. Offer SDP를 얻은 뒤 로컬과 리모트 피어 **양쪽**이 그 SDP를
> 설정한다. … `CreateAnswer`로 Answer SDP를 만들고, Offer SDP와 마찬가지로
> Answer SDP도 **양쪽 피어에 설정된다.**

"양쪽에 설정한다"는 게 핵심이고, 클리핑의 `OnCreateOfferSuccess` 코드가 정확히
그 순서다. `SetLocalDescription` → 상대에게 `SetRemoteDescription` →
상대가 `CreateAnswer`.

`StartCoroutine(WebRTC.Update())`도 그대로 유효하다. 현행 API 레퍼런스의
설명이다.

> **Update()** — **매 프레임 끝에** 모든 비디오 트랙의 텍스처 데이터를
> 갱신한다.

## `WebRTC.Initialize()`는 이제 없다

클리핑의 3번 단계, 그러니까 **코드로 쓰는 첫 줄**이다.

```csharp
private void Awake()
{
    //WebRTC 초기화.
    WebRTC.Initialize();
}
```

2022년에는 맞는 코드였다. 클리핑이 참고로 건 `com.unity.webrtc@2.4` 튜토리얼이
그렇게 시킨다.

> WebRTC를 초기화해서 사용하려면 `WebRTC.Initialize` 메서드를 호출하라.

그런데 지금은 없다. 체인지로그에 그대로 적혀 있다.

> **[3.0.0-pre.6] - 2023-07-16**
>
> **WebRTC** 클래스에서 Obsolete 메서드 제거.
> * `WebRTC.Initialize`
> * `WebRTC.Dispose`

**Obsolete가 아니라 제거**다. 현행 3.0.0(2025-09-12) API 레퍼런스의 `WebRTC`
클래스 정적 멤버 목록에도 둘 다 없다. 남아 있는 것은 `Update`,
`ExecutePendingTasks`, `ConfigureNativeLogging`, 그래픽 포맷 조회 계열 정도다.

2022년 글을 그대로 따라 치면 **첫 줄부터 컴파일이 안 된다.** 흔한 경우이긴
한데, 이 글의 경우 그 첫 줄이 "이것부터 해야 한다"로 강조된 자리라 더 걸린다.

| | 클리핑(2022, @2.4) | 현행(@3.0.0) |
|---|---|---|
| `WebRTC.Initialize()` | 필수 | **제거됨** |
| `WebRTC.Dispose()` | 종료 시 호출 | **제거됨** |
| `StartCoroutine(WebRTC.Update())` | 영상에 필요 | 그대로 있음 |
| `RTCPeerConnection.Close()` | 종료 시 호출 | 그대로 있음 |

## 클리핑이 옮기지 않은 절반: 정리 코드

같은 @2.4 튜토리얼에는 **정리 코드가 같이 있었다.**

> 끝날 때 `RTCDataChannel`과 `RTCPeerConnection`에 대해 `Close` 메서드를
> 반드시 호출해야 한다. 마지막으로 객체를 폐기한 뒤 `WebRTC.Dispose`를
> 호출하라.

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

클리핑은 `Awake`의 `Initialize`만 가져오고 **이 블록을 통째로 빼놨다.**
"WebRTC 부분만 연구"라는 취지로 테스트 버튼 코드를 뺀 것과 달리, 이건 WebRTC
자체의 수명 관리다.

지금은 `WebRTC.Dispose()`가 없으니 저 코드 그대로는 못 쓰지만, **`Close()`는
그대로 남아 있고 여전히 필요하다.** 현행 API 레퍼런스다.

> **Close()** — 현재 peer connection을 닫는다.

> **Dispose()** — `RTCPeerConnection`을 폐기한다.

`RTCPeerConnection`은 `IDisposable`을 구현한다. 네이티브 자원을 쥐고 있는
객체라, 씬을 옮기거나 연결을 끊을 때 남겨두면 그대로 쌓인다.

## 이 샘플에는 시그널링이 없다

여기가 본론이다. 클리핑은 시그널링을 이렇게 설명한다.

> 시그널링이란 WebRTC 통신에 사용할 프로토콜과 미디어 코덱, 데이터 전송 방법
> 등을 포함한 통신 규격을 교환하기 위해 **두 단말 간 제어 정보를 교환하는
> 과정**을 말한다.

맞는 설명이다. 그런데 그 "교환"이 코드에서 어떻게 되어 있는지 보자. 클리핑이
실은 코드다.

```csharp
var otherPc = GetOtherPc(pc);
var op2 = otherPc.SetRemoteDescription(ref desc);
```

```csharp
GetOtherPc(pc).AddIceCandidate(candidate);
```

**`GetOtherPc(pc)`가 시그널링 채널 자리다.** 같은 프로세스 안에서 반대쪽
`RTCPeerConnection` 객체를 꺼내 직접 메서드를 부른다. 전송도, 직렬화도,
상대 기기도 없다. `pc1`과 `pc2`는 **한 프로그램 안의 변수 두 개**다.

그래서 이 샘플은 시그널링 서버 없이 돌아간다. 시그널링을 안 해서가 아니라
**시그널링이 필요 없는 상황을 만들어놨기 때문**이다. 클리핑의 이 문장이
그래서 오해를 굳힌다.

> 서버 없이 네트워크처럼 화면, 영상, 음성이 공유되는 원리를 먼저 이해하고

WebRTC에서 **미디어가 P2P로 흐르는 것**과 **연결을 맺는 데 서버가 필요 없는
것**은 다른 이야기다. 미디어는 P2P가 맞지만, 그 P2P를 성립시키려면 SDP와 ICE
후보를 상대에게 **어떻게든** 전달해야 한다. MDN의 표현이 분명하다.

> **WebRTC는 시그널링 정보를 위한 전송 메커니즘을 규정하지 않는다.** WebSocket
> 이든 `fetch()`든 전서구든, 두 피어 사이에 시그널링 정보를 교환할 수 있는
> 것이라면 무엇이든 쓸 수 있다.

"규정하지 않는다"는 말은 **알아서 만들라**는 뜻이다. 없어도 된다는 뜻이
아니다.

## 두 대를 붙이려면 무엇이 더 필요한가

샘플을 이해한 다음에 바로 부딪히는 자리라 정리해둔다. 교환해야 하는 것이
둘이다. MDN이 각각을 이렇게 적는다.

> 시그널링 과정을 시작할 때, 통화를 거는 쪽이 **offer**를 만든다. 이 offer에는
> **SDP 형식의 세션 기술**이 담기며 받는 쪽에 전달되어야 한다. … 받는 쪽은
> 역시 SDP 기술을 담은 **answer** 메시지로 응답한다.

> 두 피어는 실제 연결을 협상하기 위해 **ICE 후보를 교환해야 한다.** 각 ICE
> 후보는 보내는 피어가 통신에 사용할 수 있는 방법 하나를 기술한다.

그리고 그 서버는 내용을 알 필요가 없다.

> 시그널링 서버가 내용을 이해하거나 해석할 필요는 없다는 점이 중요하다. …
> 시그널링 서버를 지나가는 메시지의 내용은 사실상 **블랙박스**다.

즉 **SDP 문자열과 ICE 후보를 그대로 실어 나르기만 하면 되는 아무 채널**이면
된다. 샘플을 실제 연결로 옮길 때 필요한 것을 표로 정리하면 이렇다.

| | 샘플(로컬 두 객체) | 실제 두 기기 |
|---|---|---|
| SDP 전달 | `GetOtherPc()` 메서드 호출 | **시그널링 채널이 필요** |
| ICE 후보 전달 | `GetOtherPc().AddIceCandidate()` | **같은 채널로 전달** |
| 공인 주소 파악 | 불필요(같은 호스트) | STUN 서버 |
| P2P가 막힐 때 | 해당 없음 | TURN 서버로 중계 |

STUN·TURN은 `RTCConfiguration`의 `iceServers`에 넣는다. 현행 API 설명이다.

> **iceServers** — `RTCIceServer` 객체의 목록. 각 객체는 **ICE 에이전트가
> 사용할 수 있는 서버 하나**를 기술한다.

샘플이 이 설정 없이도 도는 이유도 같다. 두 피어가 같은 호스트에 있어서
호스트 후보만으로 붙기 때문이다.

## 어디에 왜 쓰나

샘플에서 배울 것은 **호출 순서**이고, 샘플에 없는 것은 **그 호출을 상대에게
실어 나르는 층**이다. 그래서 처음부터 그 층을 분리해두면 샘플에서 실제
연결로 넘어갈 때 고칠 곳이 한 군데로 모인다.

### 시그널링 자리를 인터페이스로 비워두기

```csharp
using System;
using Unity.WebRTC;

/// <summary>
/// SDP와 ICE 후보를 상대에게 실어 나르는 층. 전송 수단은 구현이 정한다.
/// </summary>
public interface ISignalingChannel
{
    event Action<RTCSessionDescription> DescriptionReceived;
    event Action<RTCIceCandidate> CandidateReceived;

    void SendDescription(RTCSessionDescription description);
    void SendCandidate(RTCIceCandidate candidate);
}
```

샘플을 그대로 쓰는 구현은 **메서드 호출 하나**로 끝난다. 이게 곧
`GetOtherPc()`가 하던 일이다.

```csharp
/// <summary>같은 프로세스 안의 상대에게 바로 넘긴다. 샘플과 같은 동작.</summary>
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

    // 실제 구현이라면 여기가 WebSocket send가 된다.
    public void SendDescription(RTCSessionDescription description)
        => _peer.DescriptionReceived?.Invoke(description);

    public void SendCandidate(RTCIceCandidate candidate)
        => _peer.CandidateReceived?.Invoke(candidate);
}
```

연결 쪽 코드는 어느 구현이 꽂히든 같다.

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
            // 로컬 루프백이면 비워도 붙는다. 기기 간이면 STUN이 필요하다.
            iceServers = new[]
            {
                new RTCIceServer { urls = new[] { "stun:stun.l.google.com:19302" } },
            },
        };

        _pc = new RTCPeerConnection(ref config);

        // 후보가 생길 때마다 채널로 흘려보낸다. 샘플은 이 자리에서 상대를 직접 불렀다.
        _pc.OnIceCandidate = candidate => _signaling.SendCandidate(candidate);
        _pc.OnNegotiationNeeded = () => StartCoroutine(Negotiate());

        _signaling.CandidateReceived += candidate => _pc.AddIceCandidate(candidate);
    }

    private IEnumerator Negotiate()
    {
        var offer = _pc.CreateOffer();
        yield return offer;
        if (offer.IsError) { yield break; }

        // 샘플과 같은 순서: 내 쪽에 먼저 설정하고, 상대에게 보낸다.
        var desc = offer.Desc;
        var setLocal = _pc.SetLocalDescription(ref desc);
        yield return setLocal;
        if (setLocal.IsError) { yield break; }

        _signaling.SendDescription(desc);
    }

    private void OnDestroy()
    {
        // Close와 Dispose는 남아 있다. WebRTC.Dispose는 3.0에서 제거됐다.
        if (_pc != null)
        {
            _pc.Close();
            _pc.Dispose();
            _pc = null;
        }
    }
}
```

`WebRTC.Initialize()`가 어디에도 없다는 점을 확인해두면 좋다. 현행
패키지에서는 부를 함수가 아니다.

### 정리를 짝지어 두기

- **`new RTCPeerConnection`이 있으면 `Close()` + `Dispose()`가 있어야 한다.**
  `IDisposable`이 붙어 있다는 게 그 신호다.
- **`WebRTC.Dispose()`는 부르지 않는다.** 3.0에서 제거됐다.
- **`StartCoroutine(WebRTC.Update())`는 한 번만 시작한다.** 클리핑의
  `videoUpdateStarted` 플래그가 그 일을 한다 — 그 부분은 그대로 따라 해도
  된다.

### 쓰지 말아야 할 자리

- **샘플의 `GetOtherPc()` 구조를 실제 연결에 그대로 가져가기.** 그 자리가
  네트워크다.
- **"WebRTC는 서버가 필요 없다"로 정리하기.** 미디어는 P2P가 맞지만 **연결을
  맺는 데는 채널이 필요하다.**
- **`WebRTC.Initialize()` 쓰기.** 제거됐다.
- **`Close()` 없이 씬 넘기기.** 네이티브 자원이 남는다.
- **`iceServers` 없이 기기 간 연결 시도.** 같은 호스트가 아니면 호스트
  후보만으로는 안 붙는 경우가 많다.

## 정리

- **이 샘플에는 시그널링이 없다.** SDP와 ICE 후보를 주고받는 자리가
  `GetOtherPc(pc)`라는 **같은 프로세스 안의 메서드 호출**이다.
- **"서버 없이"는 절반만 맞다.** 미디어는 P2P지만, 연결을 맺으려면 SDP와 ICE
  후보를 나르는 채널이 필요하다. MDN 표현으로 **"WebRTC는 시그널링 정보를 위한
  전송 메커니즘을 규정하지 않는다."**
- **`WebRTC.Initialize()`와 `WebRTC.Dispose()`는 제거됐다.** 체인지로그
  `[3.0.0-pre.6] - 2023-07-16`에 "Obsolete 메서드 제거"로 적혀 있다. 글이
  시키는 첫 줄이 지금은 컴파일되지 않는다.
- **`WebRTC.Update()`는 그대로 있다.** "매 프레임 끝에 모든 비디오 트랙의
  텍스처 데이터를 갱신한다."
- **`RTCPeerConnection.Close()`와 `Dispose()`도 그대로다.** 클리핑이 옮기지
  않은 @2.4 튜토리얼의 정리 블록에 있던 내용이고, 여전히 필요하다.
- **용어 설명과 Offer/Answer 순서는 지금도 맞다.** 고칠 것은 API 이름과,
  "교환"이 실제로 어디서 일어나는가에 대한 그림이다.

샘플을 따라 하며 개념을 잡는 방식 자체는 좋은 접근이다. 다만 이 샘플은
**네트워크를 지운 상태로 WebRTC의 호출 순서만 보여주는 교보재**다. 그
사실을 모르고 "이대로 두 대를 붙이면 되겠다"로 넘어가면, 정작 만들어야 할
것이 통째로 빠진 채로 시작하게 된다.

서버 방식을 비교하려고 이 문서를 열었다면 결론은 이렇다. **P2P는 "서버가
없는 방식"이 아니라 "미디어가 서버를 거치지 않는 방식"이다.** 연결을 맺는
서버는 여전히 있어야 하고, NAT 뒤라면 STUN이, P2P가 막히면 TURN 중계까지
붙는다. 한쪽이 권한을 갖는 구조가 필요한 게임 상태 동기화와, 두 피어 사이를
직접 흐르면 되는 미디어는 애초에 고르는 기준이 다르다.

---

### 참고

- [WebRTC 패키지 매뉴얼 — Tutorial (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/manual/tutorial.html)
- [WebRTC 패키지 체인지로그 (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/changelog/CHANGELOG.html)
- [WebRTC 클래스 — 패키지 API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.WebRTC.html)
- [RTCPeerConnection — 패키지 API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCPeerConnection.html)
- [RTCConfiguration — 패키지 API (3.0.0)](https://docs.unity3d.com/Packages/com.unity.webrtc@3.0/api/Unity.WebRTC.RTCConfiguration.html)
- [WebRTC 패키지 매뉴얼 — Tutorial (2.4, 클리핑이 참고한 버전)](https://docs.unity3d.com/Packages/com.unity.webrtc@2.4/manual/tutorial.html)
- [Signaling and video calling — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

이 글의 출발점이 된 자료는 [앤디가이 — \[unity\] WebRTC 사용법](https://wonjuri.tistory.com/entry/unity-WebRTC-%EC%82%AC%EC%9A%A9%EB%B2%95)
(2022-06-07)이다. 샘플을 단계별로 따라가는 구성을 그대로 밟으면서, 각 API의
현재 상태를 현행 패키지 문서·체인지로그와 대조했고, 시그널링이 코드 어디에서
일어나는지를 클리핑이 실은 코드로 확인했다.
