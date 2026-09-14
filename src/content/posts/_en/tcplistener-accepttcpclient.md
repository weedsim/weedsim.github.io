---
pubDatetime: 2026-09-14T17:00:00+09:00
title: "One Read Is Not One Message"
lang: en
translationKey: tcplistener-accepttcpclient
featured: false
draft: false
tags:
  - C#
  - .NET
  - Network
  - TCP
  - Game Server
description: "I saved the TcpListener.AcceptTcpClient documentation. Its example treats TCP as a stream of messages, and another page in the same doc set carries a fixed version of it."
---

While studying C# sockets I saved the [Korean MS Learn
page](https://learn.microsoft.com/ko-kr/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)
for `TcpListener.AcceptTcpClient` — an API reference with definition,
exceptions, example and remarks on one page.

Two things caught my eye reading it. **The example code treats TCP as
message-sized units**, and the Korean remarks **don't parse as sentences.** Two
different causes. The first matters more, so it goes first.

## Table of contents

## Where and why you'd use it

An API page explains the method only. **Where you'd actually reach for this**
isn't in there, so let's start there.

### Where it fits

- **Tools and internal channels.** A debug console that sends commands to a
  running game from the editor, a script that asks a build machine for status —
  cases where **you define the whole protocol.** No reason for HTTP, and there's
  one peer.
- **The admin port on a lobby or match server.** A channel an operator connects
  to for listing rooms or force-closing them. Opened on a separate port from
  game traffic.
- **Talking to devices or external programs.** The peer already speaks TCP. The
  protocol is fixed, so matching it directly is quickest.

What these share: **few peers, and a protocol you either define or inherit.**

### Where it doesn't

- **Real-time game synchronization.** Putting per-frame position and input
  directly on top of `TcpListener` isn't advisable. Retransmission and ordering
  make latency spike, and everything on top of it — prediction, interpolation,
  interest management — is yours to build.
  [Libraries like Mirror](/en/posts/mirror-networking-basics/) exist for that
  reason.
- **When web clients have to connect.** Browsers can't speak raw TCP. You need
  WebSocket or an HTTP layer.
- **When plain request-response would do.** `HttpListener` or ASP.NET Core come
  with authentication, routing and serialization.

## One Read is not one message

The receiving part of the documentation's example:

```csharp
i = stream.Read(bytes, 0, bytes.Length);

while (i != 0)
{
    data = System.Text.Encoding.ASCII.GetString(bytes, 0, i);
    Console.WriteLine(String.Format("Received: {0}", data));

    data = data.ToUpper();
    byte[] msg = System.Text.Encoding.ASCII.GetBytes(data);
    stream.Write(msg, 0, msg.Length);

    i = stream.Read(bytes, 0, bytes.Length);
}
```

**The result of one `Read` is taken directly as one message.** Whatever arrives
becomes a string, gets uppercased, and goes back. It's an echo server, so the
result looks plausible — but **TCP makes no such guarantee.** From the
`NetworkStream.Read` documentation:

> The `Read` operation reads **as much data as is available**, up to the number
> of bytes specified by the `count` parameter.

> The total number of bytes read into the buffer **between zero (0) and the
> requested count**.

You get whatever has arrived at that instant, not what you asked for. Which
breaks in two directions.

- **Too little.** The client sent 100 bytes in one call and `Read` hands back
  40. The other 60 arrive on the next `Read`.
- **Too much.** The client sends three short messages back to back and one
  `Read` returns all three glued together.

**TCP is a byte stream, not a message stream.** The boundaries are the sender's
job to insert. Local testing almost never shows it; crossing a real network or
growing the messages does. The kind of bug that's hard to trace back.

### Length prefixes make the boundary

The simplest fix is **putting the length in front of the body.** The receiver
fills exactly four bytes to read the length, then fills exactly that many.

```csharp
using System;
using System.Buffers.Binary;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

public static class FrameIO
{
    private const int HEADER_SIZE = 4;
    private const int MAX_FRAME_SIZE = 1 << 20;   // 1MB. No ceiling is an attack surface

    // Fill exactly count bytes. False if the stream ends first
    private static async Task<bool> FillAsync(
        NetworkStream stream, byte[] buffer, int count, CancellationToken token)
    {
        int read = 0;
        while (read < count)
        {
            int n = await stream.ReadAsync(buffer, read, count - read, token);
            if (n == 0) return false;   // the peer shut down gracefully
            read += n;
        }

        return true;
    }

    public static async Task<byte[]> ReadFrameAsync(
        NetworkStream stream, CancellationToken token)
    {
        byte[] header = new byte[HEADER_SIZE];
        if (!await FillAsync(stream, header, HEADER_SIZE, token)) return null;

        int length = BinaryPrimitives.ReadInt32LittleEndian(header);
        if (length < 0 || length > MAX_FRAME_SIZE)
        {
            throw new InvalidDataException($"Frame length out of range: {length}");
        }

        byte[] payload = new byte[length];
        if (!await FillAsync(stream, payload, length, token)) return null;

        return payload;
    }

    public static async Task WriteFrameAsync(
        NetworkStream stream, byte[] payload, CancellationToken token)
    {
        byte[] header = new byte[HEADER_SIZE];
        BinaryPrimitives.WriteInt32LittleEndian(header, payload.Length);

        await stream.WriteAsync(header, 0, HEADER_SIZE, token);
        await stream.WriteAsync(payload, 0, payload.Length, token);
    }
}
```

The while loop in `FillAsync` is the point. **The assumption that one `Read` may
not be enough** is written into the code. On current .NET,
`Stream.ReadExactlyAsync` does the same job and throws `EndOfStreamException`
when the stream ends early — but older profiles like Unity's don't have it, so
the loop above runs everywhere.

The reason for `MAX_FRAME_SIZE` is worth spelling out. Trust the length and call
`new byte[length]`, and **one number from the peer can demand server memory.**
Anywhere a received value sizes an allocation needs a ceiling.

On encoding: the example's `Encoding.ASCII` won't carry Korean. `Encoding.UTF8`
is the fix, and **that makes one character several bytes, which makes the length
prefix matter more.**

## This example takes one client at a time

The outer structure of the same example:

```csharp
while (true)
{
    TcpClient client = server.AcceptTcpClient();
    NetworkStream stream = client.GetStream();

    // ... stays here until this client is done ...

    client.Close();
}
```

`AcceptTcpClient()` takes one, and **stays inside the loop until that client
disconnects.** The next `AcceptTcpClient()` isn't called meanwhile. A second
client sits in the OS's backlog queue until the first finishes.

The docs don't hide this. From the `TcpListener` class remarks:

> The `TcpListener` class provides simple methods that listen for and accept
> incoming connection requests in **blocking synchronous mode**.

But **write a server from the example alone and you get a single-connection
server.** The echo test passes; two clients reveal it.

### Separate accepting from handling

The accept loop only accepts; per-client handling moves out.

```csharp
public static async Task RunAsync(int port, CancellationToken token)
{
    var server = new TcpListener(IPAddress.Any, port);
    server.Start();

    try
    {
        while (!token.IsCancellationRequested)
        {
            TcpClient client = await server.AcceptTcpClientAsync(token);

            // Don't wait. Go straight back to accepting
            _ = HandleClientAsync(client, token);
        }
    }
    finally
    {
        server.Stop();
    }
}

private static async Task HandleClientAsync(TcpClient client, CancellationToken token)
{
    using (client)
    using (NetworkStream stream = client.GetStream())
    {
        try
        {
            while (true)
            {
                byte[] frame = await FrameIO.ReadFrameAsync(stream, token);
                if (frame == null) break;   // clean shutdown

                byte[] reply = Handle(frame);
                await FrameIO.WriteFrameAsync(stream, reply, token);
            }
        }
        catch (Exception e) when (e is IOException || e is SocketException)
        {
            // One dropped connection must not take the whole server down
            Console.WriteLine($"Connection closed: {e.Message}");
        }
    }
}
```

Three things changed. **`HandleClientAsync` is launched without `await`** so the
accept loop returns immediately, **`using`** closes the client even on
exceptions, and **per-client exception handling** keeps one disconnect from
taking everything with it.

There's an `AcceptTcpClientAsync(CancellationToken)` overload, so a shutdown
signal can wake the accept loop. Stuck inside `AcceptTcpClient()` with no token,
bringing the server down cleanly gets awkward.

## No cleanup code — yet the next page has it

The example on the page I saved **never calls `server.Stop()`.** There's a
`client.Close()`, but at the end of the loop body rather than in a `finally`, so
an exception in `Read` or `Write` skips it.

And yet **the `TcpListener` class page in the same doc set carries a fixed
version of the example.** That one reads:

```csharp
using TcpClient client = server.AcceptTcpClient();
// ...
finally
{
    server.Stop();
}
```

A `using` declaration closes the client, and `finally` stops the listener.
**Only the method page's example is the old one.** Land on the method page from
a search and the old example is what you get.

This is why **opening the class page too pays off** when reading an API
reference. Two pages covering the same material, updated at different times.

## Why the Korean page doesn't read

Now the second problem. One line from the remarks:

> 메서드를 [TcpClient.GetStream] 사용하여 반환 [TcpClient] 된 의 기본 을
> [NetworkStream] 가져옵니다.

**It doesn't parse.** Fragments like "된 의 기본 을" are left dangling. The
English original makes the cause obvious.

> Use the `TcpClient.GetStream` method to obtain the underlying `NetworkStream`
> of the returned `TcpClient`.

**The linked words stayed in their English word-order positions.** Korean
attaches particles to the end of a word, so when the link anchor doesn't move,
the particles come loose and float. It looks like machine translation that
translated the sentence but couldn't move the links.

There's another instance:

> 제안보다 [TcpClient] 더 큰 유연성을 원하는 경우 를 사용하는 [AcceptSocket]
> 것이 좋습니다.

The English:

> If you want greater flexibility than a `TcpClient` **offers**, consider using
> `AcceptSocket`.

`offers` became **"제안"** — a proposal. Render "than what TcpClient offers" as
"than a proposal" and the thing being compared disappears.

The exception text goes the same way. "The listener has not been started with a
call to `Start()`" became "**`Start()`의 호출과 함께 수신기가 시작하지 않은
경우**." The meaning is "has never been started by calling `Start()`," but "along
with" makes it read as two things that should happen simultaneously.

**The more links a paragraph carries, the worse this gets** — and in an API
reference every type name is a link. When a Korean page suddenly stops reading,
switching the language to English is the fast move.

## Wrapping up

- **The result of one `Read` is not one message.** The docs say "as much data as
  is available." It can be short or run over. **You make the boundaries
  yourself**, with something like a length prefix.
- When a received length sizes a buffer, **put a ceiling on it.** Don't let the
  peer's number allocate your memory.
- The example's `Encoding.ASCII` won't carry Korean. UTF-8 makes one character
  several bytes, which makes framing matter more.
- **The example takes one client at a time.** Separate the accept loop from
  per-client handling and use `AcceptTcpClientAsync(CancellationToken)` so a
  shutdown signal can reach it.
- **The saved page's example has no `Stop()` and no `using`, while the class
  page in the same doc set has both.** Only the method page's example is old.
- The Korean page doesn't read because **inline links stay in English word-order
  positions and leave the particles stranded.** There are outright
  mistranslations too, like `offers` becoming "제안."
- `TcpListener` fits **tools, admin channels and device integration** — few
  peers, a protocol you control. Real-time game sync belongs to a library.

An API reference example is **written to show one method**, not to show how to
write a server. It shows exactly what `AcceptTcpClient` returns. The read loop
beside it is minimum code in service of that explanation — and that's what gets
copied.

So the most useful thing on this page wasn't the example but **one word:
"blocking method."** Follow why that word is there and the accept loop structure
and the cancellation token follow from it. **Copying the example and skipping
the prose is the easy habit, and this page rewards the opposite.**

Coming at it as someone opening a reference to learn sockets, what this page
answers is **what `AcceptTcpClient` returns**, and that's where it stops. The
questions after it — where the bytes break, how you take several peers at once,
how you clean up a dropped connection — are outside what one method's page can
answer. **Learning sockets from an API reference makes that boundary hard to
see.** It's the stretch where you understand every method and the server still
doesn't work.

## References

- [TcpListener.AcceptTcpClient — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)
- [TcpListener Class — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener?view=net-10.0)
- [TcpListener.AcceptTcpClientAsync — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener.accepttcpclientasync?view=net-10.0)
- [NetworkStream.Read — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.networkstream.read?view=net-10.0)
- [Stream.ReadExactlyAsync — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.io.stream.readexactlyasync?view=net-10.0)
- Source (Korean): [TcpListener.AcceptTcpClient 메서드](https://learn.microsoft.com/ko-kr/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)
