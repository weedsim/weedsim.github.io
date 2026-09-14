---
pubDatetime: 2026-09-14T18:00:00+09:00
title: "443 Isn't Only TCP"
lang: en
translationKey: tcp-udp-port-list
featured: false
draft: false
tags:
  - Network
  - TCP
  - UDP
  - Security
  - Game Server
description: "I checked Wikipedia's TCP/UDP port list against the IANA registry. UDP is missing from 443, the dynamic port range doesn't match what Linux actually uses, and the 1024 boundary isn't fixed."
---

Continuing from [the previous post](/en/posts/tcplistener-accepttcpclient/),
while studying C# sockets I saved the Korean Wikipedia
[list of TCP/UDP ports](https://ko.wikipedia.org/wiki/TCP/UDP%EC%9D%98_%ED%8F%AC%ED%8A%B8_%EB%AA%A9%EB%A1%9D).
Picking the number to hand a listener means knowing which numbers are already
spoken for. It splits port numbers into three ranges and tabulates the
well-known and registered ports — handy for confirming that 22 is SSH and 3306
is MySQL.

I checked it against the IANA registry. Most of it holds, but **three things are
off by today's standard.** And the values you actually need when choosing a port
aren't in the table at all.

## Table of contents

## Three ranges — but the real boundaries differ

The division the document opens with:

> - 0–1023: well-known ports
> - 1024–49151: registered ports
> - 49152–65535: dynamic ports

**Correct as IANA's division.** It goes wrong if you read it as "this is how my
system behaves." From the Linux kernel documentation on `ip_local_port_range`:

> Defines the local port range that is used by TCP and UDP to choose the local
> port. ... The default values are **32768 and 60999**.

| | IANA's definition | Linux default |
| --- | --- | --- |
| Dynamic (ephemeral) range | 49152–65535 | **32768–60999** |

**Linux takes ephemeral ports starting at 32768** — right in the middle of what
IANA calls the registered range. So **a server sitting on a port in the 40000s
can find another process on the same machine already holding that number as an
ephemeral port.** That's where "sometimes it starts, sometimes it says address
already in use" comes from.

Checking and changing it:

```bash
# Current ephemeral range
cat /proc/sys/net/ipv4/ip_local_port_range

# Narrow it so it doesn't collide with your server (frees the 40000s)
sudo sysctl -w net.ipv4.ip_local_port_range="49152 65535"
```

### The 1024 boundary isn't fixed either

The document's next sentence:

> On most Unix-like operating systems, opening a well-known port **requires root
> privileges.**

Half of it. The kernel documentation says two more things.

> Privileged ports require root **or CAP_NET_BIND_SERVICE** in order to bind to
> them.

> **ip_unprivileged_port_start** ... The default is 1024.

**`CAP_NET_BIND_SERVICE` works without being root.** And **1024 itself is a
setting.** That's what makes it possible to bind port 80 from a container or a
systemd unit without running as root. Knowing only "you must be root" leads to
running services as root when you didn't have to.

```bash
# Grant the capability to the binary (don't run it as root)
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/myserver

# Or lower the unprivileged start
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
```

## UDP is missing from 443

The document's row for 443:

> | 443 | TCP | | HTTPS — HTTP over Secure Socket Layer (SSL) (encrypted) | Official |

The UDP column is empty. **The IANA registry has both.**

| Registration | Service | Description | Reference |
| --- | --- | --- | --- |
| 443/tcp | https | http protocol over TLS/SSL | RFC 9110 |
| **443/udp** | **https** | **http protocol over TLS/SSL** | **RFC 9110** |
| 443/sctp | https | HTTPS | RFC 9260 |

**HTTP/3 uses 443/UDP.** It runs over QUIC, so the transport isn't TCP. Read the
table and memorize "443 is TCP," and you'll open only 443/TCP on the firewall
and then wonder why HTTP/3 never connects. **The browser falls back to TCP
quietly, so the symptom presents as nothing worse than "it's slow."**

In a port list, the TCP/UDP columns aren't "which one it's used with" but
**"which combinations are registered."** What actually flows is decided by the
protocol above.

## The places that say SSL

The same row describes it as "HTTP over **Secure Socket Layer (SSL)**." The rows
for 465, 636, 990, 992, 993 and 995 all read "~ over SSL" as well.

**It's TLS now.** SSL 2.0 and 3.0 were each prohibited by RFC, and the name
changed to TLS in 1999. What's interesting is the document's own link: the anchor
text reads "Secure Socket Layer (SSL)" while **the article it points to is
"Transport Layer Security."** It looks like the link was updated to the current
article and the label stayed behind.

IANA's own description hedges with "http protocol over **TLS/SSL**," so calling
the label outright wrong is a stretch. But **to someone learning this now it
reads as an instruction to check whether SSL is on.** What you actually check is
the TLS version.

## The status of 465 changed

The document records 465 like this:

> | 465 | TCP | | SMTP over SSL — conflicts with a Cisco protocol | **Unofficial, conflict** |

**It's official now.** The IANA registry carries two entries side by side:

- `urd` — URL Rendezvous Directory for SSM (the Cisco side; the "conflict")
- **`submissions`** — Message Submission over TLS protocol, **RFC 8314**,
  registered 2017-12-12

RFC 8314 explains the history itself:

> Historically, port 465 was briefly registered as the "smtps" port. This
> registration made no sense ... As a result, the registration was **revoked and
> was subsequently reassigned** to a different service.

Meanwhile mail software was already using 465 for submission, and the RFC
accepted that reality by registering it again under the name `submissions`.
**"Unofficial, conflict" is the state of things up to 2017.** Standing up a mail
server today, 465 is the implicit-TLS submission port and 587 is the STARTTLS
one.

That row shows one more thing. **A port registry is a record of agreement rather
than technology**, so it gets revoked and comes back. The "status" column is the
consensus at a moment, not a fixed fact.

## What to look at when choosing a port

This document tells you what a given port is. What you usually need runs the
other way — **which number do I open my server on.**

### Picking your server's port

- **Avoid 0–1023.** Without a specific reason you're only buying permission
  problems. For web, put a reverse proxy in front and let it hold 80 and 443.
- **Don't overlap the ephemeral range.** Linux defaults to 32768–60999, so
  choosing from **1024–32767**, outside it, causes fewer accidents. That's what
  the symptom in the first section turns on.
- **Avoid well-known service numbers.** Open a game server on 3306 or 6379 and
  port scanners will read it as MySQL or Redis and connect. Your logs get noisy
  and you land on vulnerability scanners' target lists.
- **Write it down.** Without one place listing the team's ports, two services
  pick the same number.

### Use 0 during development

The document's row for port 0 says "reserved; not used." **Zero means something
else when binding.** From the `TcpListener` documentation:

> Specify `Any` for the local IP address and **0 for the local port number if
> you want the underlying service provider to assign those values for you.**

**Bind to 0 and the OS picks a free port for you.** Fixing a number in test code
causes collisions under parallel execution; passing 0 and reading back the
assigned number makes that problem disappear.

```csharp
var listener = new TcpListener(IPAddress.Loopback, 0);
listener.Start();

// The port the OS actually assigned
int port = ((IPEndPoint)listener.LocalEndpoint).Port;
```

I wrote up the `TcpListener` side separately in
[the previous post](/en/posts/tcplistener-accepttcpclient/).

### Opening it isn't the same as reaching it

Deciding the port and being reachable from outside are different problems,
especially under containers. How publishing gets past the host firewall and so
on is in [the Docker post](/en/posts/docker-build-and-run/).

## Wrapping up

- **The dynamic range differs between IANA's definition (49152–) and Linux's
  default (32768–60999).** That's why a server in the 40000s intermittently gets
  "address already in use."
- **The 1024 boundary isn't fixed.** Besides root there's
  `CAP_NET_BIND_SERVICE`, and `ip_unprivileged_port_start` moves the boundary
  itself.
- **UDP is missing from 443.** IANA registers 443/udp and HTTP/3 uses it. Open
  only 443/TCP on a firewall and HTTP/3 falls back to TCP quietly.
- **"over SSL" means TLS today.** The document's own link points to "Transport
  Layer Security" while the label still says SSL.
- **465 isn't "unofficial, conflict" — it's official.** RFC 8314 registered it as
  `submissions` (2017-12-12), alongside Cisco's `urd`.
- To choose a port: **avoid 0–1023, stay out of the ephemeral range by picking
  from 1024–32767, and avoid well-known service numbers.**
- **Zero at bind time doesn't mean "not used" — it means "you pick."** Especially
  useful in tests.

A port list document is **built to go from number to name.** It's good for
checking what 22 is. But the thing you do more often runs the other way, and
what that needs — your OS's ephemeral range, the privilege boundary, what zero
means at bind time — isn't in the table. **Same subject, different question
answered.**

What struck me was the document's "status" column. That single row for 465
carries **the record of a registry being revoked and coming back.** Port numbers
are agreement rather than technology, so **when a document ages, the agreements
drift before the technology does.**

Pulling this table up while studying sockets, it comes to this. Choosing the
number in `new TcpListener(..., port)` needed **not a list of numbers but three
boundaries** — where privilege changes, what range my OS takes for ephemeral
ports, and what zero specially means. All three sat outside the table.

## References

- [Service Name and Transport Protocol Port Number Registry — IANA](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
- [RFC 8314 — Cleartext Considered Obsolete](https://datatracker.ietf.org/doc/html/rfc8314)
- [IP Sysctl — Linux kernel documentation](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html)
- [TcpListener Class — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener?view=net-10.0)
- Source: [TCP/UDP의 포트 목록 — Wikipedia (Korean)](https://ko.wikipedia.org/wiki/TCP/UDP%EC%9D%98_%ED%8F%AC%ED%8A%B8_%EB%AA%A9%EB%A1%9D)
