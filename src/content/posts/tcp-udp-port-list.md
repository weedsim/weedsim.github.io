---
pubDatetime: 2026-09-14T18:00:00+09:00
title: "443은 TCP만이 아니다"
lang: ko
translationKey: tcp-udp-port-list
featured: false
draft: false
tags:
  - 네트워크
  - TCP
  - UDP
  - 보안
  - 게임 서버
description: "위키백과의 TCP/UDP 포트 목록을 IANA 등록부와 대조했다. 443에 UDP가 빠져 있고, 동적 포트 구간은 실제 리눅스 값과 다르고, 1024번 경계는 고정이 아니다."
---

[앞 글](/posts/tcplistener-accepttcpclient/)과 같은 흐름으로, C# 소켓을
공부하던 중에 위키백과 한국어판의 [TCP/UDP의 포트
목록](https://ko.wikipedia.org/wiki/TCP/UDP%EC%9D%98_%ED%8F%AC%ED%8A%B8_%EB%AA%A9%EB%A1%9D)을
스크랩해뒀었다. 리스너에 넣을 번호를 정하려면 어떤 번호가 이미 임자가 있는지
알아야 하니까. 포트 번호를 세 구간으로 나누고, 잘 알려진 포트와 등록된 포트를
표로 정리한 문서다. 22번이 SSH고 3306이 MySQL이라는 걸 확인하러 열기 좋다.

IANA 등록부와 대조해봤다. 대부분 맞는데 **세 군데가 지금 기준으로 어긋난다.**
그리고 표에는 없지만 실제로 포트를 고를 때 필요한 값이 따로 있다.

## 목차

## 세 구간, 그런데 실제 경계는 다르다

문서가 첫머리에 적은 구분이다.

> - 0번 ~ 1023번: 잘 알려진 포트 (well-known port)
> - 1024번 ~ 49151번: 등록된 포트 (registered port)
> - 49152번 ~ 65535번: 동적 포트 (dynamic port)

**IANA의 구분으로는 맞다.** 다만 이걸 "내 시스템이 실제로 그렇게 동작한다"로
읽으면 어긋난다. 리눅스 커널 문서의 `ip_local_port_range` 설명이다.

> Defines the local port range that is used by TCP and UDP to choose the local
> port. ... The default values are **32768 and 60999**.

| | IANA 정의 | 리눅스 기본값 |
| --- | --- | --- |
| 동적(임시) 포트 구간 | 49152 ~ 65535 | **32768 ~ 60999** |

**리눅스가 임시 포트로 쓰는 구간이 32768부터다.** IANA가 "등록된 포트"라고
부르는 구간 한가운데다. 그래서 **40000번대에 서버를 열어두면 같은 기계의 다른
프로세스가 임시 포트로 그 번호를 먼저 잡고 있을 수 있다.** 재부팅 뒤에 어떤
때는 뜨고 어떤 때는 "주소가 이미 사용 중"이 나는 증상이 여기서 나온다.

확인과 변경은 이렇게 한다.

```bash
# 현재 임시 포트 구간
cat /proc/sys/net/ipv4/ip_local_port_range

# 서버 포트와 겹치지 않게 좁히기 (예: 40000번대를 비운다)
sudo sysctl -w net.ipv4.ip_local_port_range="49152 65535"
```

### 1024번 경계도 고정이 아니다

문서의 다음 문장이다.

> 대부분의 유닉스 계열 운영 체제의 경우, 잘 알려진 포트를 열려면 **루트 권한이
> 있어야 한다.**

절반이다. 커널 문서는 두 가지를 더 말한다.

> Privileged ports require root **or CAP_NET_BIND_SERVICE** in order to bind to
> them.

> **ip_unprivileged_port_start** ... The default is 1024.

**루트가 아니어도 `CAP_NET_BIND_SERVICE`가 있으면 된다.** 그리고 **1024라는
경계 자체가 설정값**이다. 컨테이너나 systemd 유닛에서 80번을 열면서 루트로
돌리지 않는 구성이 이걸로 가능해진다. "루트여야 한다"로만 알고 있으면 서비스를
불필요하게 루트로 띄우게 된다.

```bash
# 바이너리에 권한만 준다 (루트로 실행하지 않는다)
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/myserver

# 또는 비특권 시작점을 내린다
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
```

## 443에 UDP가 빠져 있다

문서의 443번 행이다.

> | 443 | TCP | | HTTPS - 보안 소켓 레이어(SSL) 위의 HTTP (암호화 전송) | 공식 |

UDP 칸이 비어 있다. **IANA 등록부에는 둘 다 있다.**

| 등록 | 서비스 | 설명 | 참조 |
| --- | --- | --- | --- |
| 443/tcp | https | http protocol over TLS/SSL | RFC 9110 |
| **443/udp** | **https** | **http protocol over TLS/SSL** | **RFC 9110** |
| 443/sctp | https | HTTPS | RFC 9260 |

**HTTP/3이 443/UDP를 쓴다.** QUIC 위에서 도는 구조라 전송 계층이 TCP가
아니다. 표를 보고 "443은 TCP"라고 외워두면, 방화벽에서 443/TCP만 열어놓고
HTTP/3이 왜 안 붙는지 찾게 된다. **브라우저는 조용히 TCP로 폴백하므로
증상이 "느리다" 정도로만 나타난다.**

포트 목록에서 TCP/UDP 칸은 "둘 중 뭐로 쓰는지"가 아니라 **"어떤 조합이
등록되어 있는지"**를 보는 칸이다. 실제로 무엇이 오가는지는 그 위 프로토콜이
정한다.

## SSL이라고 적힌 자리들

같은 행의 설명이 "**보안 소켓 레이어(SSL, Secure Socket Layer)** 위의 HTTP"다.
465·636·990·992·993·995 행도 전부 "SSL 위의 ~"로 적혀 있다.

**지금은 TLS다.** SSL 2.0과 3.0은 각각 RFC로 사용이 금지됐고, 이름도 1999년에
TLS로 바뀌었다. 재밌는 건 문서 자신의 링크다 — 앵커 텍스트는 "보안 소켓
레이어(SSL)"인데 **링크가 가리키는 문서는 「전송 계층 보안」**이다. 옮겨 적을
때 링크만 최신 문서로 갱신되고 표기는 남은 것으로 보인다.

IANA 쪽 설명도 "http protocol over **TLS/SSL**"로 둘을 병기하고 있어서 이
표기가 완전히 틀렸다고 하긴 어렵다. 다만 **지금 새로 배우는 사람에게는 SSL이
켜져 있는지 확인하라는 말로 읽힌다.** 실제로 확인해야 하는 건 TLS 버전이다.

## 465의 상태가 바뀌었다

문서는 465를 이렇게 적어뒀다.

> | 465 | TCP | | SSL 위의 SMTP - Cisco 프로토콜과 충돌 | **비공식, 충돌** |

**지금은 공식이다.** IANA 등록부에 두 항목이 나란히 있다.

- `urd` — URL Rendezvous Directory for SSM (Cisco 쪽. 문서가 말한 "충돌")
- **`submissions`** — Message Submission over TLS protocol, **RFC 8314**,
  2017-12-12 등록

RFC 8314가 그 경위를 직접 설명한다.

> Historically, port 465 was briefly registered as the "smtps" port. This
> registration made no sense ... As a result, the registration was **revoked and
> was subsequently reassigned** to a different service.

그런데 그 사이 메일 소프트웨어들이 이미 465를 제출 포트로 쓰고 있었고, RFC가
그 현실을 받아들여 `submissions`라는 이름으로 다시 등록했다. **"비공식, 충돌"은
2017년까지의 상태다.** 지금 메일 서버를 세운다면 465는 암묵적 TLS 제출 포트로
쓰는 게 표준이고, 587은 STARTTLS 쪽이다.

이 행이 보여주는 게 하나 더 있다. **포트 등록부는 기술이 아니라 합의의 기록**이라
번복되고 되돌아온다. 표의 "상태" 칸은 그 시점의 합의이지 고정된 사실이 아니다.

## 포트를 고를 때 무엇을 보나

이 문서는 "어떤 포트가 무엇인지"를 알려준다. 실제로 필요한 건 대개 반대
방향이다 — **내 서버를 몇 번에 열 것인가.**

### 내 서버 포트 고르기

- **0~1023은 피한다.** 특별한 이유가 없으면 권한 문제만 생긴다. 웹이라면
  앞단에 리버스 프록시를 두고 80·443은 그쪽이 잡게 한다.
- **임시 포트 구간과 겹치지 않게 한다.** 리눅스 기본값이 32768~60999이므로,
  그 바깥인 **1024~32767 사이**에서 고르는 쪽이 사고가 적다. 앞 절의
  증상이 여기서 갈린다.
- **잘 알려진 서비스 번호는 피한다.** 3306이나 6379에 게임 서버를 열어두면
  포트 스캐너가 MySQL·Redis로 보고 붙는다. 로그가 지저분해지고, 취약점
  스캐너의 표적 목록에 들어간다.
- **문서에 적는다.** 팀에서 쓰는 포트를 한곳에 모아두지 않으면 두 서비스가
  같은 번호를 고른다.

### 개발 중에는 0번을 쓴다

문서의 0번 행은 "예약됨; 사용하지 않음"이다. **바인딩할 때의 0은 다른
뜻이다.** `TcpListener` 문서의 설명이다.

> Specify `Any` for the local IP address and **0 for the local port number if
> you want the underlying service provider to assign those values for you.**

**0으로 바인딩하면 OS가 비어 있는 포트를 골라준다.** 테스트 코드에서 서버를
띄울 때 번호를 고정하면 병렬 실행에서 충돌하는데, 0을 주고 실제 할당된 번호를
읽어 쓰면 그 문제가 사라진다.

```csharp
var listener = new TcpListener(IPAddress.Loopback, 0);
listener.Start();

// OS가 실제로 배정한 포트
int port = ((IPEndPoint)listener.LocalEndpoint).Port;
```

`TcpListener` 쪽 이야기는 [앞 글](/posts/tcplistener-accepttcpclient/)에서
따로 정리했다.

### 열었다고 닿는 건 아니다

포트를 정하는 것과 바깥에서 닿는 것은 다른 문제다. 컨테이너로 올릴 때 특히
그렇다. 호스트 방화벽을 통과하는 방식 등은
[Docker 글](/posts/docker-build-and-run/)에서 다뤘다.

## 정리

- **동적 포트 구간은 IANA 정의(49152~)와 리눅스 기본값(32768~60999)이
  다르다.** 40000번대 서버가 간헐적으로 "주소 사용 중"이 되는 이유다.
- **1024번 경계는 고정이 아니다.** 루트 외에 `CAP_NET_BIND_SERVICE`가 있고,
  `ip_unprivileged_port_start`로 경계 자체를 옮긴다.
- **443에 UDP가 빠져 있다.** IANA에 443/udp가 등록돼 있고 HTTP/3이 그걸
  쓴다. 방화벽에서 443/TCP만 열면 HTTP/3이 조용히 TCP로 폴백한다.
- **"SSL 위의 ~"는 지금 TLS다.** 문서의 링크도 「전송 계층 보안」을 가리키는데
  표기만 SSL로 남아 있다.
- **465는 "비공식, 충돌"이 아니라 공식이다.** RFC 8314가 `submissions`로
  등록했다(2017-12-12). Cisco의 `urd`와 나란히 있다.
- 포트를 고를 때는 **0~1023을 피하고, 임시 포트 구간(32768~)과 겹치지 않는
  1024~32767에서, 잘 알려진 서비스 번호를 피해** 고른다.
- **바인딩할 때의 0은 "사용하지 않음"이 아니라 "OS가 골라줘"다.** 테스트에서
  특히 쓸모 있다.

포트 목록 문서는 **번호에서 이름을 찾는 방향으로 만들어져 있다.** 22가 뭔지
확인하는 데는 좋다. 그런데 실제로 자주 하는 일은 반대 방향이고, 그쪽에
필요한 값 — 내 OS의 임시 포트 구간, 권한 경계, 0번 바인딩 — 은 이 표에
없다. **같은 주제인데 표가 답하는 질문이 다르다.**

그리고 이 문서의 "상태" 칸이 인상적이었다. 465 행 하나가 **등록부가 번복되고
되돌아온 기록**을 담고 있다. 포트 번호는 기술이 아니라 합의라서, **문서가
오래되면 기술보다 합의 쪽이 먼저 어긋난다.**

소켓을 공부하다 이 표를 편 입장에서 정리하면 이렇다. `new TcpListener(..., 포트)`의
그 숫자를 정하는 데 필요한 건 **번호 목록이 아니라 세 가지 경계**였다 — 권한이
갈리는 지점, 내 OS가 임시 포트로 쓰는 구간, 그리고 0번의 특별한 뜻. 셋 다 표
바깥에 있었다.

## 참고

- [Service Name and Transport Protocol Port Number Registry — IANA](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
- [RFC 8314 — Cleartext Considered Obsolete](https://datatracker.ietf.org/doc/html/rfc8314)
- [IP Sysctl — Linux kernel documentation](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html)
- [TcpListener 클래스 — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener?view=net-10.0)
- 원문: [TCP/UDP의 포트 목록 — 위키백과](https://ko.wikipedia.org/wiki/TCP/UDP%EC%9D%98_%ED%8F%AC%ED%8A%B8_%EB%AA%A9%EB%A1%9D)
