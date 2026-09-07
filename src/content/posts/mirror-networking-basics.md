---
pubDatetime: 2026-09-07T18:00:00+09:00
title: "Mirror 사전 지식: 에셋스토어 배포본은 GitHub보다 1년 넘게 뒤처져 있다"
lang: ko
translationKey: mirror-networking-basics
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - C#
description: "Mirror를 붙이기 전에 알아둘 것들을 정리한 글을 다시 봤다. 개념 설명은 지금도 맞는데 첫 항목이 걸린다. 에셋스토어 배포본은 2025년 2월에 멈춰 있고 GitHub 릴리스는 계속 나오고 있다."
---

멀티 게임 개발 프로젝트에 Mirror를 이미 쓰고 있던 중에, 기초를 다시 짚어보려고
찾다가 스크랩해둔
[글](https://orakjaengi.tistory.com/entry/Mirror-Networking-%EC%9C%A0%EB%8B%88%ED%8B%B0-Mirror-Networking-%EC%82%AC%EC%A0%84-%EC%A7%80%EC%8B%9D)이다.
서버·클라이언트·호스트, `NetworkBehaviour`, `NetworkIdentity`, `NetworkManager`를
한 장에 정리한 구성이라 훑기에 좋다.

개념 설명은 2025년 1월 글인데도 지금 문서와 어긋나지 않는다. 다만 **첫 항목인
설치 경로가 문제**고, 원문이 한 줄로 지나간 것들 중에 근거가 소스에 남아 있어
확인해둘 만한 게 몇 개 있다.

## 목차

## 어디서 받을 것인가

원문의 첫 항목은 에셋스토어 링크다. Mirror 공식 사이트의 Download 메뉴도 같은
곳을 가리키므로 틀린 안내는 아니다. 문제는 그 배포본의 나이다.

| 경로 | 버전 | 최종 갱신 |
| --- | --- | --- |
| 에셋스토어 | 96.0.1 | 2025-02-27 |
| GitHub 릴리스 | v96.10.2 | 2026-06-20 |

**1년 4개월, 마이너 버전으로 10개 차이다.** 에셋스토어 페이지는 Unity
2021.3.35 이상을 요구한다고 적혀 있고 무료인 것도 그대로인데, 갱신만 멈춰
있다.

Mirror 문서의 Deprecations 페이지에 이런 문장이 있다.

> Some changes in this document may apply to an upcoming release to the Asset
> Store

**문서가 에셋스토어 배포본보다 앞서 있을 수 있다**는 뜻이다. 이게 실무에서
어떻게 나타나느냐면, 문서를 보고 따라 썼는데 그 API가 프로젝트에 없다. 이때
내 코드를 의심하기 전에 배포본 버전을 먼저 봐야 한다.

버전 차이가 기능만의 문제도 아니다. [앞 글](/posts/mirror-remote-actions/)에서
다룬 KCP 트랜스포트의 secure cookie 백포트처럼 보안 수정도 릴리스에 실린다.
1년치 릴리스를 건너뛰는 건 그만큼을 건너뛰는 것이다.

원문을 탓할 일은 아니다. 2025년 1월에는 에셋스토어 배포본이 두 달 전 것이었다.
**스크랩한 설치 안내는 스크랩한 시점의 것**이라는 게 이 항목의 교훈에 가깝다.

## 서버, 클라이언트, 호스트

원문의 정리는 정확하다. 서버가 게임 상태의 권한을 갖고, 클라이언트는 입력을
보내고 받은 데이터로 화면을 그리고, 호스트는 그 둘을 한 프로세스에서 겸한다.
시작하는 방법도 셋뿐이다.

```csharp
NetworkManager.singleton.StartServer();
NetworkManager.singleton.StartClient();
NetworkManager.singleton.StartHost();
```

원문은 호스트의 용도를 "소규모 멀티플레이, 로컬 테스트"로 분류하는데, **왜
그 용도로 밀리는지**는 적지 않았다. 두 가지 때문이다.

- **호스트 플레이어만 지연이 없다.** 호스트의 입력은 네트워크를 건너지 않는다.
  다른 플레이어는 RTT만큼 늦는다. 경쟁 요소가 있는 게임이라면 이 비대칭이
  그대로 유불리가 된다.
- **호스트가 나가면 세션이 끝난다.** 서버가 그 플레이어의 프로세스이기
  때문이다. 호스트 마이그레이션은 Mirror가 기본 제공하지 않는다.

대신 호스트 모드에도 좋은 성질이 하나 있다. `ClientRpc`가 호스트의 로컬
클라이언트에서도 호출되기 때문에, 호스트에서만 되는 코드를 만들기 어렵게
되어 있다. 그 이야기는 [Command와 RPC 글](/posts/mirror-remote-actions/)에서
따로 정리했다.

## `NetworkBehaviour`와 `NetworkIdentity`

원문의 문장은 이렇다.

> NetworkBehaviour 클래스를 상속한 클래스를 가진 오브젝트라면 **부모 오브젝트**
> 나 **해당 오브젝트** 가 Network Identity 컴포넌트를 가지고 있어야 합니다.

맞는 설명이고, **"부모"가 왜 허용되는지가 Mirror 소스에 주석으로 남아 있다.**

```csharp
// [RequireComponent(typeof(NetworkIdentity))] disabled to allow child NetworkBehaviours
[AddComponentMenu("")]
[HelpURL("https://mirror-networking.gitbook.io/docs/guides/networkbehaviour")]
public abstract class NetworkBehaviour : MonoBehaviour
```

`RequireComponent`를 **일부러 꺼놨다.** 켜져 있으면 자식 오브젝트에
`NetworkBehaviour`를 붙일 때마다 `NetworkIdentity`가 딸려 붙기 때문이다.
용례도 `NetworkIdentity` 쪽 주석에 있다 — "Some users need NetworkTransform on
child bones, etc."

반대 방향은 막혀 있다. `NetworkIdentity`는 중첩이 안 된다.

> Mirror does not support Network Identities on nested GameObjects. … ensure
> your parent GameObject is the only GameObject in the stack with a Network
> Identity.

**`NetworkIdentity`는 루트에 하나, `NetworkBehaviour`는 자식까지 여러 개.** 이
한 줄이 계층 구조를 짤 때의 규칙 전부다. 자식 쪽에서 식별자가 필요하면
`GetComponentInParent`로 올라가라는 것도 문서에 적혀 있다.

원문의 괄호 하나는 틀렸다. `Network Identity` 소개에 "(클래스에 상속해서
사용하셔도 됩니다.)"가 붙어 있는데, **`NetworkIdentity`는 상속할 수 없다.**

```csharp
[DisallowMultipleComponent]
[DefaultExecutionOrder(-1)]
[AddComponentMenu("Network/Network Identity")]
[HelpURL("https://mirror-networking.gitbook.io/docs/components/network-identity")]
public sealed class NetworkIdentity : MonoBehaviour
```

`sealed`다. 한 오브젝트에 두 개 붙이는 것도 `[DisallowMultipleComponent]`로
막혀 있다. 상속해서 확장할 대상이 아니라 **붙이기만 하는 표식**에 가깝다.

## netId는 런타임 안에서만 유일하다

원문은 이렇게 적는다.

> 네트워크 상에서 같은 Network Identity마다 **고유한 netId** 가 있기 때문에
> 서로 다른 클라이언트에서도 netId를 통해 네트워크 상에서 같은 오브젝트인지
> 아닌지 구별이 가능합니다.

맞다. 다만 소스의 주석은 단서를 하나 더 붙인다.

> The unique network Id of this object (**unique at runtime**).

**세션 안에서만 유일하다.** 서버가 1부터 증가시키며 발급하고, 서버를 내렸다
올리면 `ResetNextNetworkId()`로 다시 1부터 시작한다. 그러니 netId를 저장하거나
DB 키로 쓰면 안 된다. 다음 세션의 다른 오브젝트가 같은 번호를 받는다.

식별자가 셋이고 역할이 다르다는 것도 같이 알아두면 헷갈리지 않는다.

| 식별자 | 무엇을 가리키나 | 언제 정해지나 |
| --- | --- | --- |
| `netId` | 네트워크에 살아 있는 이 인스턴스 | 스폰될 때 서버가 발급 |
| `sceneId` | 씬에 미리 배치된 오브젝트 | 씬에 저장될 때 |
| `assetId` | 스폰에 쓸 프리팹 | 프리팹 등록 시점 |

원격 호출의 인자로 `GameObject`는 되고 `Transform`은 안 되는 이유도 여기서
나온다. 건너가는 건 오브젝트가 아니라 `netId`이고, 컴포넌트에는 그게 없다.

## Network Manager와 HUD

원문은 `NetworkManager`의 특징으로 "**테스트** 용 HUD UI를 제공합니다"라고 적는다.
문서는 더 분명하게 못 박는다.

> It is not, however, intended to be included in finished games. … you should
> create your own UI later on, to allow your players to find and join games

**HUD는 위의 세 메서드를 버튼 세 개로 바꿔놓은 것뿐이다.** 접속 UI를 나중에
직접 만들어야 한다는 걸 알고 시작하는 편이 낫다.

원문이 빼놓은 항목이 하나 있는데, 초반에 반드시 만나는 것이다.

> You should normally make sure the Network Manager persists between Scenes,
> otherwise the network connection is broken upon a scene change. To do this,
> ensure the Don't Destroy On Load checkbox is ticked.

로비에서 게임 씬으로 넘기는 순간 연결이 끊기면 대개 이 체크박스다.

## Network Room Manager

원문은 `NetworkRoomManager`의 특징으로 "**로비 씬과 게임 씬** 을 분리하여
관리"를 들고, 비교표에서 "로비 씬과 게임 씬 분리 **필수**"라고 적는다.
**"필수"가 과장이 아니다.** 소스에서 서버 시작 단계에 검사한다.

> NetworkRoomManager RoomScene is empty. Set the RoomScene in the inspector for
> the NetworkRoomManager

> NetworkRoomManager PlayScene is empty. Set the PlayScene in the inspector for
> the NetworkRoomManager

`OnStartServer()`에서 걸린다. 인스펙터를 안 채우면 권장 사항을 어긴 게 아니라
서버가 시작되지 않는다. 룸 플레이어 프리팹도 `OnValidate`에서 검사한다.

```csharp
if (roomPlayerPrefab != null)
{
    NetworkIdentity identity = roomPlayerPrefab.GetComponent<NetworkIdentity>();
    if (identity == null)
    {
        roomPlayerPrefab = null;
        Debug.LogError("RoomPlayer prefab must have a NetworkIdentity component.");
    }
}
```

같은 `OnValidate`에서 `minPlayers`가 `maxConnections` 이하로, 그리고 0 이상으로
잘린다. 인스펙터에 큰 수를 넣어도 조용히 줄어드니 값이 안 맞으면 여기를 본다.

| 항목 | `NetworkManager` | `NetworkRoomManager` |
| --- | --- | --- |
| 로비 | 직접 구현 | 내장 |
| 씬 | 단일 씬 가능 | Room / Gameplay 둘 다 필수 |
| 준비 상태 | 없음 | `CmdChangeReadyState`, `allPlayersReady` |
| 최소 인원 | 없음 | `minPlayers` (`maxConnections`로 클램프) |

## 에디터에서 둘 이상 띄우기

원문은 도움이 되는 페이지로 ParrelSync를 링크한다. 지금도 살아 있는 선택지다
(최신 릴리스 1.5.3, 2024-06-16). README의 설명은 "another Unity editor window
opened and mirror the changes from the original project"다. 원본 프로젝트를
비추는 두 번째 에디터를 띄우는 방식이다.

2025년 1월 이후로 선택지가 하나 늘었다. Unity의 **Multiplayer Play Mode**
패키지다. 한 프로젝트 안에서 가상 플레이어를 만드는 방식이고, 에디터
플레이어는 본체 포함 최대 4개, 로컬 빌드도 최대 4개까지 붙는다. 요구
버전은 Unity 6000.0.50f1 이상이다.

다만 **Mirror 문서와 Unity 문서 어느 쪽도 둘의 조합을 명시하지 않는다.** 내가
찾은 범위에서는 그렇다. 그러니 "Unity 6면 MPPM을 쓰면 된다"까지 가지 말고,
프로젝트에서 한 번 확인하고 결정하는 게 맞다.

## 정리

- **에셋스토어 배포본(96.0.1, 2025-02-27)은 GitHub 릴리스(v96.10.2,
  2026-06-20)보다 1년 넘게 뒤처져 있다.** 문서대로 썼는데 API가 없으면 내
  코드보다 배포본 버전을 먼저 의심한다.
- 호스트가 "소규모·테스트용"인 이유는 **호스트만 지연이 없고, 호스트가 나가면
  세션이 끝나기 때문**이다.
- **`NetworkIdentity`는 루트에 하나, `NetworkBehaviour`는 자식까지 여러 개.**
  Mirror가 `RequireComponent`를 일부러 꺼둔 결과다.
- **`NetworkIdentity`는 `sealed`다.** 상속해서 확장할 수 없다.
- **`netId`는 런타임 안에서만 유일하다.** 저장하거나 DB 키로 쓰면 안 된다.
  씬 오브젝트는 `sceneId`, 프리팹은 `assetId`로 역할이 갈린다.
- HUD는 문서가 "not intended to be included in finished games"라고 못 박는다.
  씬을 넘기며 연결이 끊기면 Don't Destroy On Load를 본다.
- `NetworkRoomManager`의 씬 분리는 권장이 아니라 **`OnStartServer()`에서 막는
  검사**다.
- 에디터 다중 실행은 ParrelSync 외에 Multiplayer Play Mode가 생겼다. 단
  Mirror와의 조합을 명시한 문서는 못 찾았다.

쓰던 중에 기초를 다시 짚어본 결과가 이렇다. **개념은 다시 봐도 그대로였고,
바뀐 건 그걸 어디서 받느냐였다.** 사전 지식으로 정리된 글에서 먼저 상하는 건
개념이 아니라 설치 안내다. 1년 8개월이 지나도 설명은 멀쩡한데 첫 줄의 링크만
그동안 1년 4개월치 릴리스만큼 뒤로 밀려 있었다.

## 참고

- [Network Identity — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-identity)
- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [Network Manager HUD — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager-hud)
- [Network Room Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-room-manager)
- [Deprecations — Mirror](https://mirror-networking.gitbook.io/docs/manual/general/deprecations)
- [Releases — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/releases)
- [Mirror — Unity Asset Store](https://assetstore.unity.com/packages/tools/network/mirror-129321)
- [ParrelSync](https://github.com/VeriorPies/ParrelSync)
- [About Multiplayer Play Mode — Unity](https://docs.unity3d.com/Packages/com.unity.multiplayer.playmode@1.6/manual/index.html)
- 원문: [\[Mirror Networking\] 유니티 Mirror Networking 사전 지식](https://orakjaengi.tistory.com/entry/Mirror-Networking-%EC%9C%A0%EB%8B%88%ED%8B%B0-Mirror-Networking-%EC%82%AC%EC%A0%84-%EC%A7%80%EC%8B%9D)
