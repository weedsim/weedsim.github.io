---
pubDatetime: 2026-09-14T17:00:00+09:00
title: "Read 한 번이 메시지 하나가 아니다"
lang: ko
translationKey: tcplistener-accepttcpclient
featured: false
draft: false
tags:
  - C#
  - .NET
  - 네트워크
  - TCP
  - 게임 서버
description: "TcpListener.AcceptTcpClient 문서를 스크랩해뒀었다. 예제 코드가 TCP를 메시지 단위로 다루고, 같은 문서 세트의 다른 페이지에는 고쳐진 판이 올라가 있다."
---

C# 소켓을 공부하던 중에 `TcpListener.AcceptTcpClient`의 [MS Learn 한국어
페이지](https://learn.microsoft.com/ko-kr/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)를
스크랩해뒀었다. 정의·예외·예제·설명이 한 장에 있는 API 레퍼런스다.

읽다 보니 두 가지가 걸렸다. **예제 코드가 TCP를 메시지 단위로 다루고 있고**,
한국어 설명 문단이 **문장으로 읽히지 않는다.** 둘 다 원인이 다르다. 앞엣것이
더 중요하니 거기부터 간다.

## 목차

## 어디에 왜 쓰나

API 페이지는 메서드만 설명한다. 이걸 **직접 쓰는 자리**가 어디인지는 적혀
있지 않으니 먼저 정리해둔다.

### 직접 쓰는 자리

- **도구와 내부 채널.** 에디터에서 실행 중인 게임에 명령을 보내는 디버그
  콘솔, 빌드 머신에 상태를 물어보는 스크립트처럼 **프로토콜을 내가 다 정하는**
  경우다. HTTP를 씌울 이유가 없고 상대가 하나뿐이다.
- **로비·매치 서버의 관리 포트.** 운영자가 붙어서 방 목록을 보거나 강제
  종료를 거는 통로. 게임 트래픽과 분리된 별도 포트로 열어둔다.
- **장비·외부 프로그램 연동.** 상대가 이미 TCP로 말하는 경우다. 프로토콜이
  정해져 있으니 그대로 맞춰주는 쪽이 빠르다.

공통점은 **상대가 적고, 프로토콜을 내가 정하거나 이미 정해져 있다**는 것이다.

### 쓰지 말아야 할 자리

- **게임의 실시간 동기화.** 위치·입력처럼 매 프레임 오가는 것을 `TcpListener`
  위에 직접 올리는 건 권할 일이 아니다. 재전송·순서 보장 때문에 지연이
  튀고, 그 위에 필요한 것(예측, 보간, 관심 영역)을 전부 직접 만들어야 한다.
  [Mirror 같은 라이브러리](/posts/mirror-networking-basics/)가 있는 이유가
  그것이다.
- **웹 클라이언트가 붙어야 할 때.** 브라우저는 생 TCP로 못 붙는다.
  WebSocket이나 HTTP 계층이 필요하다.
- **그냥 요청-응답이면 될 때.** `HttpListener`나 ASP.NET Core 쪽이 인증·라우팅·
  직렬화를 다 갖고 있다.

## Read 한 번이 메시지 하나가 아니다

문서의 예제에서 데이터를 받는 부분이다.

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

**`Read` 한 번의 결과를 곧바로 하나의 메시지로 취급한다.** 받은 만큼을 바로
문자열로 바꾸고, 대문자로 바꿔서 돌려보낸다. 에코 서버라 이렇게 해도 결과가
그럴듯해 보이는데, **TCP는 그런 보장을 하지 않는다.** `NetworkStream.Read`
문서의 문장이다.

> The `Read` operation reads **as much data as is available**, up to the number
> of bytes specified by the `count` parameter.

> The total number of bytes read into the buffer **between zero (0) and the
> requested count**.

요청한 만큼이 아니라 **그 순간 도착해 있는 만큼**을 준다. 그래서 두 방향으로
어긋난다.

- **모자란다.** 클라이언트가 100바이트를 한 번에 보냈어도 `Read`가 40바이트만
  돌려줄 수 있다. 남은 60은 다음 `Read`에 온다.
- **넘친다.** 클라이언트가 짧은 메시지 세 개를 연달아 보내면 `Read` 한 번에
  세 개가 붙어서 온다.

**TCP는 바이트 스트림이지 메시지 스트림이 아니다.** 경계는 보내는 쪽이 직접
넣어야 한다. 로컬 테스트에서는 거의 안 드러나고, 네트워크를 타거나 메시지가
커지는 순간 나온다. 원인을 찾기 어려운 종류의 버그다.

### 길이 접두사로 경계를 만든다

가장 단순한 해법은 **본문 앞에 길이를 붙이는 것**이다. 받는 쪽은 먼저 4바이트를
정확히 채워 길이를 읽고, 그다음 그 길이만큼을 정확히 채운다.

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
    private const int MAX_FRAME_SIZE = 1 << 20;   // 1MB. 상한이 없으면 공격 경로가 된다

    // 정확히 count 바이트를 채운다. 스트림이 먼저 끝나면 false
    private static async Task<bool> FillAsync(
        NetworkStream stream, byte[] buffer, int count, CancellationToken token)
    {
        int read = 0;
        while (read < count)
        {
            int n = await stream.ReadAsync(buffer, read, count - read, token);
            if (n == 0) return false;   // 상대가 정상 종료했다
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
            throw new InvalidDataException($"프레임 길이가 범위를 벗어났다: {length}");
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

`FillAsync`의 while 루프가 핵심이다. **한 번의 `Read`로는 부족할 수 있다는
전제**가 코드에 들어가 있다. 최신 .NET이라면 `Stream.ReadExactlyAsync`가 같은
일을 해주고, 스트림이 먼저 끝나면 `EndOfStreamException`을 던진다. 다만 Unity
같은 구형 프로파일에는 없으므로 위 루프를 직접 쓰는 쪽이 어디서나 돈다.

`MAX_FRAME_SIZE`를 둔 이유도 적어둔다. 길이를 그대로 믿고
`new byte[length]`를 하면, **상대가 보낸 숫자 하나로 서버 메모리를 요구할 수
있다.** 받은 값으로 크기를 잡는 자리에는 상한이 있어야 한다.

인코딩도 짚어둔다. 예제의 `Encoding.ASCII`는 한글을 통과시키지 못한다.
`Encoding.UTF8`로 바꾸는 게 맞고, **그러면 한 글자가 여러 바이트가 되므로 길이
접두사가 더 필요해진다.**

## 이 예제는 한 번에 한 명만 받는다

같은 예제의 바깥 구조다.

```csharp
while (true)
{
    TcpClient client = server.AcceptTcpClient();
    NetworkStream stream = client.GetStream();

    // ... 이 클라이언트와의 통신이 끝날 때까지 여기 머무른다 ...

    client.Close();
}
```

`AcceptTcpClient()`로 한 명을 받고, **그 클라이언트가 끊을 때까지 루프 안에
머무른다.** 그동안 다음 `AcceptTcpClient()`는 불리지 않는다. 두 번째
클라이언트는 OS의 대기 큐에 쌓여 있다가 첫 번째가 끝나야 들어온다.

문서가 이걸 숨기지는 않는다. `TcpListener` 클래스 페이지의 설명이다.

> The `TcpListener` class provides simple methods that listen for and accept
> incoming connection requests in **blocking synchronous mode**.

다만 **예제만 보고 서버를 짜면 그대로 단일 접속 서버가 된다.** 에코 테스트는
통과하고, 두 명이 붙는 순간 드러난다.

### 받는 것과 처리하는 것을 분리한다

수락 루프는 받기만 하고, 클라이언트별 처리는 따로 떼어낸다.

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

            // 기다리지 않는다. 바로 다음 수락으로 돌아간다
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
                if (frame == null) break;   // 정상 종료

                byte[] reply = Handle(frame);
                await FrameIO.WriteFrameAsync(stream, reply, token);
            }
        }
        catch (Exception e) when (e is IOException || e is SocketException)
        {
            // 끊긴 연결 하나가 서버 전체를 내리면 안 된다
            Console.WriteLine($"연결 종료: {e.Message}");
        }
    }
}
```

세 가지가 바뀌었다. **`await` 없이 `HandleClientAsync`를 띄워서** 수락
루프가 바로 다음으로 돌아가고, **`using`으로** 예외가 나도 클라이언트가
닫히고, **클라이언트별로 예외를 잡아서** 한 명이 끊긴 것이 전체를 내리지
않는다.

`AcceptTcpClientAsync(CancellationToken)` 오버로드가 있어서 종료 신호로 수락
루프를 깨울 수 있다. 취소 토큰 없이 `AcceptTcpClient()`에 갇혀 있으면 서버를
깨끗하게 내리기가 까다로워진다.

## 정리하는 코드가 없다, 그런데 옆 페이지에는 있다

스크랩한 페이지의 예제는 **`server.Stop()`을 한 번도 부르지 않는다.**
`client.Close()`는 있지만 `finally`가 아니라 루프 본문 끝이라, `Read`나
`Write`에서 예외가 나면 건너뛴다.

그런데 **같은 문서 세트의 `TcpListener` 클래스 페이지에는 고쳐진 예제가 올라가
있다.** 그쪽은 이렇다.

```csharp
using TcpClient client = server.AcceptTcpClient();
// ...
finally
{
    server.Stop();
}
```

`using` 선언으로 클라이언트를 닫고, `finally`에서 리스너를 멈춘다. **메서드
페이지의 예제만 옛 판으로 남아 있는 셈이다.** 검색으로 메서드 페이지에 바로
닿으면 옛 예제를 보게 된다.

API 레퍼런스를 볼 때 **클래스 페이지도 한 번 열어보는 게 이래서 남는다.**
같은 내용을 다루는 페이지가 둘인데 갱신 시점이 다르다.

## 한국어 페이지가 읽히지 않는 이유

이제 두 번째 문제다. 설명 문단의 한 줄이다.

> 메서드를 [TcpClient.GetStream] 사용하여 반환 [TcpClient] 된 의 기본 을
> [NetworkStream] 가져옵니다.

**문장으로 안 읽힌다.** "된 의 기본 을" 같은 조각이 남아 있다. 영어 원문을
보면 이유가 분명하다.

> Use the `TcpClient.GetStream` method to obtain the underlying `NetworkStream`
> of the returned `TcpClient`.

**링크가 걸린 단어들이 영어 어순 자리에 그대로 남아 있다.** 한국어는 조사가
단어 뒤에 붙는데, 링크 앵커가 원래 위치에서 안 움직이니 조사만 떨어져 나와
떠돈다. 기계 번역이 문장은 번역하면서 링크 위치는 손대지 못한 결과로 보인다.

같은 자리가 하나 더 있다.

> 제안보다 [TcpClient] 더 큰 유연성을 원하는 경우 를 사용하는 [AcceptSocket]
> 것이 좋습니다.

영어는 이렇다.

> If you want greater flexibility than a `TcpClient` **offers**, consider using
> `AcceptSocket`.

`offers`가 **"제안"**이 됐다. "TcpClient가 제공하는 것보다"를 "제안보다"로
옮겨놓으니 비교 대상이 사라진다.

예외 설명도 마찬가지다. "The listener has not been started with a call to
`Start()`"가 "**`Start()`의 호출과 함께 수신기가 시작하지 않은 경우**"가 됐다.
"`Start()`를 호출해 시작한 적이 없는 경우"가 맞는 뜻인데, "~와 함께"로
옮겨놓으면 동시에 일어나야 하는 일처럼 읽힌다.

**API 레퍼런스에서 링크가 많이 걸리는 문단일수록 이 현상이 심하다.** 타입
이름이 전부 링크라서 그렇다. 한국어 페이지가 갑자기 안 읽히면 언어를 영어로
바꿔보는 게 빠르다.

## 정리

- **`Read` 한 번의 결과는 메시지 하나가 아니다.** 문서가 "as much data as is
  available"이라고 적는다. 모자랄 수도 넘칠 수도 있다. **경계는 길이 접두사
  같은 걸로 직접 만든다.**
- 길이를 받아 버퍼를 잡을 때는 **상한을 둔다.** 상대가 보낸 숫자로 메모리를
  잡게 두면 안 된다.
- 예제의 `Encoding.ASCII`는 한글을 통과시키지 못한다. UTF-8로 바꾸면 한 글자가
  여러 바이트가 되니 프레이밍이 더 필요해진다.
- **예제는 한 번에 한 명만 받는다.** 수락 루프와 클라이언트 처리를 분리하고,
  `AcceptTcpClientAsync(CancellationToken)`로 종료 신호를 받을 수 있게 한다.
- **스크랩한 페이지의 예제에는 `Stop()`도 `using`도 없는데, 같은 문서 세트의
  클래스 페이지에는 둘 다 있다.** 메서드 페이지 예제만 옛 판이다.
- 한국어 페이지가 안 읽히는 건 **인라인 링크가 영어 어순 자리에 남아 조사가
  떨어져 나오기 때문**이다. `offers`가 "제안"이 되는 식의 오역도 같이 있다.
- `TcpListener`를 직접 쓸 자리는 **도구·관리 채널·장비 연동**처럼 상대가 적고
  프로토콜을 내가 정하는 곳이다. 게임 실시간 동기화는 라이브러리 쪽이다.

API 레퍼런스의 예제는 **그 메서드 하나를 보여주려고 쓰인 것**이지 서버를 짜는
법을 보여주려고 쓰인 게 아니다. `AcceptTcpClient`가 무엇을 돌려주는지는
정확히 보여준다. 그 옆에 붙은 읽기 루프는 설명을 위한 최소 코드이고, 그게
그대로 복사된다.

그래서 이 문서에서 가장 쓸모 있었던 건 예제가 아니라 **"blocking method"라는
한 단어**였다. 그 단어가 왜 붙었는지를 따라가면 수락 루프 구조와 취소 토큰이
따라 나온다. **예제는 베끼고 설명은 건너뛰기 쉬운데, 이 페이지는 반대였다.**

소켓을 공부하려고 레퍼런스부터 편 입장에서 보면, 이 페이지가 답해주는 건
`AcceptTcpClient`가 **무엇을 돌려주는가**까지다. 그 뒤에 오는 질문들 —
바이트가 어디서 끊기는가, 여러 명을 어떻게 동시에 받는가, 끊긴 연결을 어떻게
치우는가 — 은 메서드 하나의 문서가 답할 수 있는 범위 밖이다. **API 레퍼런스로
소켓을 배우면 이 경계가 잘 안 보인다.** 메서드는 다 이해했는데 서버는 안 되는
구간이 여기다.

## 참고

- [TcpListener.AcceptTcpClient — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)
- [TcpListener 클래스 — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener?view=net-10.0)
- [TcpListener.AcceptTcpClientAsync — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.tcplistener.accepttcpclientasync?view=net-10.0)
- [NetworkStream.Read — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.net.sockets.networkstream.read?view=net-10.0)
- [Stream.ReadExactlyAsync — MS Learn](https://learn.microsoft.com/en-us/dotnet/api/system.io.stream.readexactlyasync?view=net-10.0)
- 원문(한국어): [TcpListener.AcceptTcpClient 메서드](https://learn.microsoft.com/ko-kr/dotnet/api/system.net.sockets.tcplistener.accepttcpclient?view=net-10.0)
