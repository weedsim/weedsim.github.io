---
pubDatetime: 2026-09-07T18:00:00+09:00
title: "Mirror NetworkManager 인스펙터 다시 읽기: Network Address는 서버가 쓰지 않는다"
lang: ko
translationKey: mirror-networkmanager-inspector
featured: false
draft: false
tags:
  - Unity
  - Mirror
  - 네트워크
  - 멀티플레이어
  - C#
description: "NetworkManager 인스펙터를 항목별로 정리한 표를 소스의 툴팁과 대조했다. 그룹 배치가 어긋난 곳이 있고, Headless Start Mode의 선택지와 Evaluation Interval의 단위는 틀렸다."
---

`NetworkManager` 인스펙터를 항목별로 표로 정리한
[글](https://thenight-avicii.tistory.com/124)을 스크랩해뒀었다. 인스펙터를 처음
열면 항목이 스무 개 넘게 쏟아지는데 한글로 한 줄씩 붙어 있으니 훑기 좋다.

이번에는 원문의 표를 **Mirror 소스의 `[Tooltip]` 문자열과 하나씩 대조**해봤다.
대부분 맞는데, 그룹 배치가 어긋난 곳이 있고 **명백히 틀린 항목이 두 개** 있다.
그리고 툴팁에는 있는데 원문이 옮기지 않은 값들이 실무에서는 더 쓸모가 있었다.

## 목차

## 인스펙터 그룹부터 다르다

`NetworkManager.cs`의 `[Header]` 순서는 이렇다.

Configuration → Auto-Start Options → **Sync Settings** → Network Info →
Security → Authentication → Scene Management → Player Object →
Snapshot Interpolation → Connection Quality → Interpolation UI

원문의 절 순서와 세 군데가 어긋난다.

| 항목 | 원문이 둔 곳 | 실제 그룹 |
| --- | --- | --- |
| Send Rate | Auto-Start Options | **Sync Settings** |
| Disconnect Inactive Connections / Timeout | Network Info | **Security** |
| Registered Spawnable Prefabs | 독립 절 | **Player Object** |

원문에는 **Sync Settings 그룹 자체가 없다.** Send Rate가 Auto-Start 쪽 설명에
딸려 들어가 있는데, 인스펙터에서는 별도 그룹이고 그 안에 원문이 다루지 않은
항목이 두 개 더 있다. Unreliable Baseline Rate와 Unreliable Redundancy다.

글을 옆에 띄워두고 인스펙터를 위에서 아래로 훑을 생각이라면 이 차이가 걸린다.

## Headless Start Mode에 Host는 없다

원문의 설명이다.

> Do Nothing → 자동 시작 안 함
>
> Host / Server / Client 등으로 설정 가능

**Host는 선택지에 없다.** enum이 셋뿐이다.

```csharp
public enum HeadlessStartOptions { DoNothing, AutoStartServer, AutoStartClient }
```

호출부도 이 셋만 처리한다.

```csharp
if (Utils.IsHeadless())
{
    if (!Application.isEditor || editorAutoStart)
        switch (headlessStartMode)
        {
            case HeadlessStartOptions.AutoStartServer:
                StartServer();
                break;
            case HeadlessStartOptions.AutoStartClient:
                StartClient();
                break;
        }
}
```

생각해보면 당연하다. Headless는 화면 없는 전용 서버 빌드를 위한 옵션인데,
호스트는 클라이언트를 겸하는 모드다. **화면이 없는 호스트는 자동 시작할
이유가 없다.**

같이 볼 것이 하나 더 있다. 저 `if`문의 조건에서 보이듯 **에디터에서는 기본적으로
동작하지 않는다.** `editorAutoStart`를 켜야 에디터에서도 적용된다. 원문은 Editor
Auto Start를 "에디터에서 자동으로 서버나 클라이언트를 실행할지 여부"라고
적었는데, 정확히는 **Headless Start Mode를 에디터에도 적용할지**를 켜는
스위치다. 별개의 자동 시작 설정이 아니다.

## Evaluation Interval은 틱이 아니라 초다

원문의 표다.

> Evaluation Interval — 품질을 평가하는 주기 (**틱 단위**)

툴팁은 이렇다.

> Interval in **seconds** to evaluate connection quality.
> Set to 0 to disable connection quality evaluation.

**초 단위고, 기본값은 3이다.** 틱으로 읽으면 3틱, Send Rate 60 기준 50ms마다
평가한다는 뜻이 되어 실제(3초)와 60배 차이가 난다. 그리고 **0으로 두면 평가
자체가 꺼진다**는 것도 원문에 없다.

Evaluation Method도 원문은 "예: Simple = 기본 지연 평가 방식"이라고만 적었는데,
툴팁에는 둘의 근거가 갈려 있다.

> Simple: based on rtt and jitter.
> Pragmatic: based on snapshot interpolation adjustment.

RTT와 지터를 보는 쪽과, 스냅샷 보간이 얼마나 조정되고 있는지를 보는 쪽이다.
같은 "품질"이라도 재는 대상이 다르다.

## Network Address는 서버가 쓰지 않는다

원문의 설명이다.

> Network Address — 서버 주소 (예: localhost, 127.0.0.1, 또는 EC2 IP)

틀린 말은 아닌데 **절반이 빠졌다.** 툴팁의 두 번째 문장이 중요하다.

> Network Address where the client should connect to the server.
> **Server does not use this for anything.**

이건 **클라이언트가 접속할 곳**을 적는 칸이다. 서버 빌드에서 여기에 EC2 IP를
적어도 서버가 그 주소로 바인딩되지 않는다. 문서 쪽 표현도 같은 방향이다.

> In client mode, the game attempts to connect to the network address
> specified.

서버가 어디에 열리는지는 `NetworkManager`가 아니라 **트랜스포트 컴포넌트의
설정**에 달려 있다. 원문이 예시로 EC2 IP를 든 게 하필 서버를 세팅하는 맥락을
떠올리게 해서, 이 칸을 서버 쪽 설정으로 오해하기 쉬운 자리다.

FQDN도 된다는 건 문서에만 있다. "game.example.com" 같은 걸 그대로 넣을 수 있다.

## Online Scene은 연결이 아니라 서버 시작에 걸린다

원문의 표다.

> Online Scene — 서버 **연결 성공 시** 전환할 멀티플레이 씬

툴팁은 기준을 다르게 잡는다.

> Scene that Mirror will switch to when the **server is started**. Clients will
> receive a Scene Message to load the server's current scene when they connect.

**서버가 시작될 때** 서버가 이 씬으로 넘어가고, 클라이언트는 접속 시점에 "서버가
지금 있는 씬"을 받아서 따라간다. 클라이언트 입장에서 결과가 비슷해 보여도 기준이
다르다. 서버가 이미 다른 씬으로 넘어간 뒤에 들어온 클라이언트는 Online Scene이
아니라 **그 시점의 서버 씬**을 받는다.

Offline Scene 쪽도 툴팁은 "when the client or server is **stopped**"라고 한다.
원문의 "서버 연결이 끊겼을 때"보다 범위가 넓다. 내가 직접 서버를 내리는 경우도
포함된다.

Offline Scene Load Delay의 툴팁에는 용도가 적혀 있는데 이건 원문에 없다.

> Optional delay that can be used after disconnecting to show a
> 'Connection lost...' message or similar before loading the offline scene

**"연결이 끊겼습니다" 메시지를 보여줄 시간을 벌기 위한 것**이다. 단순한 대기가
아니라 목적이 있는 값이다.

## Registered Spawnable Prefabs는 유일한 등록 경로가 아니다

원문은 이렇게 못 박는다.

> → 여기 등록된 프리팹만 NetworkServer.Spawn() 가능

**아니다.** 문서에 다른 경로가 적혀 있다.

> You can add prefabs to the list shown in the inspector labelled Registered
> Spawnable Prefabs. You can also register prefabs via code, with the
> `NetworkClient.RegisterPrefab` method.

소스를 보면 인스펙터 목록이 하는 일이 그것뿐이다.

```csharp
foreach (GameObject prefab in spawnPrefabs.Where(t => t != null))
    NetworkClient.RegisterPrefab(prefab);
```

**인스펙터 칸은 `RegisterPrefab`을 대신 불러주는 편의 기능**이다. 프리팹이
동적으로 정해지거나 애드레서블로 로드하는 구조라면 코드로 등록하면 된다.
"인스펙터에 못 넣으면 스폰할 수 없다"고 알고 있으면 그 구조를 아예 시도하지
않게 된다.

## Player Spawn Method의 전제

원문의 설명이다.

> Player Spawn Method — 플레이어 스폰 방식 (Random, Round Robin 등)

맞지만 **전제가 빠졌다.** 툴팁은 무엇들 중에서 고르는지를 밝힌다.

> Round Robin or Random order of **Start Position** selection

`GetStartPosition()`의 첫 줄들이 전부다.

```csharp
public virtual Transform GetStartPosition()
{
    // first remove any dead transforms
    startPositions.RemoveAll(t => t == null);

    if (startPositions.Count == 0)
        return null;
    // ...
}
```

`startPositions`는 씬의 `NetworkStartPosition` 컴포넌트들이 채우는 목록이다.
**하나도 없으면 `null`을 돌려주고, Random이든 Round Robin이든 아무 일도
일어나지 않는다.** 플레이어가 전부 같은 자리에 겹쳐 나오는데 스폰 방식을
Random으로 바꿔봐도 그대로인 상황이 여기서 나온다. 고칠 곳은 이 드롭다운이
아니라 씬이다.

Auto Create Player도 기준이 미묘하게 다르다. 원문은 "서버 접속 시"라고 했는데
툴팁은 이렇다.

> Should Mirror automatically spawn the player **after scene change**?

## 원문이 값을 안 준 항목들

원문의 표는 "무엇인지"까지는 알려주는데 "얼마로 두면 되는지"는 대개 비어 있다.
툴팁에는 그게 들어 있는 항목이 있다. Send Rate가 대표적이다.

| 툴팁의 권장 | 예시로 든 게임 | 이유 |
| --- | --- | --- |
| 60–100Hz | Counter-Strike 같은 빠른 게임 | 지연 최소화 |
| 약 30Hz | WoW 같은 게임 | 연산 최소화 |
| 1–10Hz | EVE 같은 느린 게임 | — |

원문의 "예: 60 = 초당 60회 데이터 송신 (1틱 = 약 16ms)"는 값이 뭘 뜻하는지를
말할 뿐이고, **위 표는 어떤 값을 고를지를 말한다.** 기본값 60은 첫 줄에 해당하니
느린 게임이라면 내리는 게 맞다.

기본값도 정리해두면 인스펙터를 열었을 때 뭐가 건드려진 상태인지 알 수 있다.

| 항목 | 기본값 |
| --- | --- |
| Dont Destroy On Load | `true` |
| Run In Background | `true` |
| Send Rate | `60` |
| Max Connections | `100` |
| Disconnect Inactive Connections | **`false`** |
| Disconnect Inactive Timeout | `60`초 |
| Exceptions Disconnect | **`true`** |
| Evaluation Interval | `3`초 |

굵게 둔 둘이 오해하기 쉽다. **자동 끊기는 기본으로 꺼져 있고**, 예외 시 끊기는
**기본으로 켜져 있다.** 원문의 표만 보면 둘 다 그냥 "여부"라 어느 쪽이 기본인지
알 수 없다.

Exceptions Disconnect는 툴팁이 이유까지 적어놓은 드문 항목이다.

> For security, it is recommended to disconnect a player if a networked action
> triggers an exception. This could prevent components being accessed in an
> **undefined state, which may be an attack vector for exploits.**

원문의 "예외 발생 시 자동으로 연결을 끊을지 여부"에는 이 판단이 안 보인다.
예외가 난 뒤의 오브젝트 상태를 계속 만지게 두는 것이 공격 경로가 된다는 게
켜져 있는 이유다. [Command와 RPC 글](/posts/mirror-remote-actions/)에서 정리한
서버 측 값 검증과 같은 결의 이야기다.

## 정리

- 인스펙터 그룹이 원문과 세 군데 다르다. **Send Rate는 Sync Settings**,
  Disconnect Inactive 항목들은 **Security**, Registered Spawnable Prefabs는
  **Player Object** 안이다.
- **Headless Start Mode에 Host는 없다.** `DoNothing`, `AutoStartServer`,
  `AutoStartClient` 셋뿐이고, 에디터에는 `editorAutoStart`를 켜야 적용된다.
- **Evaluation Interval은 초 단위**(기본 3)다. 0이면 평가를 끈다.
- **Network Address는 클라이언트 전용이다.** 툴팁이 "Server does not use this
  for anything"이라고 못 박는다. 서버가 열리는 곳은 트랜스포트 설정이다.
- **Online Scene은 서버가 시작될 때** 걸린다. 늦게 들어온 클라이언트는 그 시점의
  서버 씬을 받는다.
- **Registered Spawnable Prefabs는 편의 기능**이다. 인스펙터 목록은 그냥
  `NetworkClient.RegisterPrefab`을 대신 불러줄 뿐이고, 코드로도 등록된다.
- **Player Spawn Method는 `NetworkStartPosition`이 하나도 없으면 아무 일도
  하지 않는다.** `GetStartPosition()`이 `null`을 반환한다.
- 기본값에서 헷갈리는 둘. **자동 끊기는 꺼져 있고(`false`), 예외 시 끊기는 켜져
  있다(`true`).**

인스펙터 정리 글은 항목 이름을 옮기기는 쉬운데 **툴팁을 옮기기는 번거롭다.**
그래서 대개 이름과 한 줄 요약만 남고, 단위·기본값·전제가 빠진다. 이 글에서 잡은
것들도 전부 그 자리에 있었다. 인스펙터 항목에 마우스를 올려두면 나오는 그
문장이다.

## 참고

- [Network Manager — Mirror](https://mirror-networking.gitbook.io/docs/manual/components/network-manager)
- [NetworkManager.cs — MirrorNetworking/Mirror](https://github.com/MirrorNetworking/Mirror/blob/master/Assets/Mirror/Core/NetworkManager.cs)
- [Mirror 사전 지식](/posts/mirror-networking-basics/)
- 원문: [\[Mirror\] NetworkManager](https://thenight-avicii.tistory.com/124)
