---
pubDatetime: 2026-08-25T13:00:00+09:00
title: "adb Notes: The Architecture and Commands of Android Debug Bridge"
lang: en
translationKey: adb-android-debug-bridge
featured: false
draft: false
tags:
  - Android
  - adb
  - Unity
description: "Notes on adb for debugging Android builds, from architecture to commands, based on SDK Platform Tools 37.0.1, plus where decade-old guides go wrong."
---

Debugging an Android build comes down to how well you know `adb`. Reading
logs, pushing builds, attaching the profiler, pulling save files — it all
goes through this one tool.

But search for `adb` in Korean and the first thing you get is posts written
around 2014. Android was growing fast back then, so plenty of material got
written up, and not much has come along since to replace it. The problem is
that those posts are **only half right**. The parts explaining the
architecture still hold a decade later, but the command lists and terminal
output will leave you stuck if you follow them today.

So I started over. This is based on **SDK Platform Tools 37.0.1** (July 2026)
and the current official docs. At the end I've collected the specific places
where the old material gets it wrong.

## Table of contents

## adb is not a single program

Android Debug Bridge ships in the SDK Platform Tools package, at
`<android_sdk>/platform-tools/`.

Typing `adb` in a terminal looks like running one executable, but there are
actually **three processes** involved.

- **Client** — on your development machine. A new one spawns and disappears
  every time you type an `adb` command. All it does is hand the command to
  the server.
- **Server** — a background process resident on your development machine. It
  manages the list of connected devices and relays between clients and daemons.
- **Daemon (`adbd`)** — the process running on the device or emulator. This is
  what actually executes the commands.

The server binds to local TCP port **5037**, and every client talks to it
there. If the server isn't running when you first start a client, the client
starts it for you.

Knowing this structure clears up one thing in practice: **why
`adb kill-server && adb start-server` works when a device won't show up in
the list**.

```bash
adb kill-server
adb start-server
adb server-status   # 서버 버전과 상태 확인
```

What's broken is usually neither the USB cable nor the device — it's the
device-list state the server on your PC was holding. The client spawns fresh
for every command, so restarting it accomplishes nothing, and the daemon
lives on the device, so you can't touch it directly. **Only the middle layer
holds state.**

### Transports

There are two paths for the server and daemon to connect over.

- **USB** — a cable
- **TCP** — the same network

Wireless connections use mDNS to discover devices. This part has been
changing right up until recently. platform-tools 37.0.0 switched the default
mDNS backend to `libadbmdns`, and **37.0.1 removed the `openscreen` backend
entirely**, so the `ADB_MDNS_OPENSCREEN` environment variable now has no
effect at all.

## Which device does the command go to?

With only one device connected there's nothing to think about, but the moment
you have a physical device and an emulator running side by side it becomes a
problem.

```bash
adb -d shell            # 연결된 USB 기기 하나
adb -e shell            # 실행 중인 에뮬레이터 하나
adb -s emulator-5554 shell   # 시리얼로 지정
```

`-d` and `-e` only work **when there's exactly one device in that category**;
with more than one they error out. If you're going to work with several
devices attached, treat `-s` as the default.

If typing `-s` every time gets old, you can pin it with an environment
variable. Passing `-s` alongside it still wins, though.

```bash
export ANDROID_SERIAL=emulator-5554
```

### Listing and state

```bash
adb devices          # 시리얼과 상태
adb devices -l       # 모델명·기기 설명까지
adb get-state        # device / offline / no device
adb get-serialno     # 시리얼 문자열
```

A device showing up as `offline` in `adb devices` means the cable is
connected but the handshake with the daemon hasn't finished. You commonly see
this when you haven't tapped the USB debugging prompt on the device yet.

The useful one in scripts is `wait-for-device`. It blocks the next command
until boot finishes.

```bash
adb wait-for-device shell
```

Leave it out and hit `adb shell` mid-boot and all you'll get is an error.
It's essential in CI when you chain commands right after launching an
emulator.

## Connecting wirelessly

Wireless is the area the old material misses entirely.

You need **Android 11 (API 30) or higher**, and **Android 13 (API 33) or
higher** for TV and WearOS. Turn on wireless debugging in the device's
developer options, bring up the pairing code, then:

```bash
adb pair 192.168.0.10:37115   # 기기 화면의 페어링 코드 입력
adb connect 192.168.0.10:5555
adb disconnect 192.168.0.10:5555
```

`pair` only needs to happen once; after that `connect` is enough. The thing
people mix up most often is that the pairing port and the connection port are
different.

Starting with platform-tools 37.0.0 paired with Android 17, **adb Wi-Fi 2.0**
comes in and automatically reconnects to paired devices on the same network.

**Android 10 and below** has no pairing. You connect over USB once and then
switch to TCP mode.

```bash
adb tcpip 5555
adb connect 192.168.0.10:5555
```

## Installing and uninstalling apps

```bash
adb install app.apk
adb install -r app.apk       # 데이터 유지하고 재설치
adb install -t app.apk       # 테스트 APK 허용
adb install -g app.apk       # 매니페스트 권한 전부 부여
adb install -d app.apk       # 버전 코드 다운그레이드 허용
```

Here are the flags that come up most.

| Flag | Meaning |
|---|---|
| `-r` | Reinstall. Keeps app data |
| `-t` | Allow installing a test APK |
| `-g` | Grant every permission declared in the manifest |
| `-d` | Allow a version code downgrade |
| `--user <id>` | Install for one specific user only |
| `--wait` | Wait until the install finishes |
| `--incremental` | Stream the APK while running the app |

`-g` is handy for QA builds — no tapping through permission prompts one at a
time. `-d` is what you use when rolling back to an older version to reproduce
something.

Split APKs (the multiple APKs that come out of an App Bundle) have their own
commands.

```bash
adb install-multiple base.apk split_config.arm64_v8a.apk ...
adb install-multi-package app1.apk app2.apk
```

Uninstalling looks like this.

```bash
adb uninstall com.example.game
adb uninstall -k com.example.game            # 앱만 지우고 데이터·캐시는 남김
adb uninstall --user 0 com.example.game
```

`-k` is for checking whether migration runs correctly when you swap out only
the app and leave the data in place.

## Moving files back and forth

```bash
adb push local.txt /sdcard/local.txt     # PC → 기기
adb pull /sdcard/remote.txt ./           # 기기 → PC
```

Whole directories work too. Use it to pull down a save data or log folder in
one go.

## The shell

```bash
adb shell                      # 대화형 셸. Ctrl+D 또는 exit로 나옴
adb shell pm list packages     # 명령 하나만 실행하고 빠져나옴
```

Android is built on the Linux kernel, so a lot of the shell commands overlap.
Which tools are actually present on a device varies by build, though.

```bash
adb shell ls /system/bin       # 쓸 수 있는 도구 목록
adb shell toybox --help
```

### `exec-out`

When you need the binary data as-is, use `exec-out` instead of `shell`. The
official docs annotate their screenshot example with exactly that note: use
`exec-out` rather than `shell` to get raw data.

```bash
adb exec-out screencap -p > screen.png
```

### root, remount

```bash
adb root       # adbd를 root로 재시작
adb unroot     # 다시 일반 권한으로
adb remount    # 시스템 파티션을 쓰기 가능하게 재마운트
```

The commands themselves are in the docs, but **they don't work on retail
devices.** Android builds come in three variants — `user` / `userdebug` /
`eng` — and the `user` build that ships on retail devices is a production
build with restricted security access. These commands only mean something on
development builds and emulators.

## Logs — logcat

This is the heart of debugging. Use just this part well and you're halfway
there.

```bash
adb logcat            # 실시간 스트림
adb logcat -d         # 현재 버퍼를 덤프하고 종료
adb logcat -c         # 버퍼 비우기
```

A convenient flow: clear with `-c` right before running the repro steps,
reproduce the issue, then dump with `-d` and save it to a file.

### Buffers

Logs aren't one bucket — they're split across several buffers.

```bash
adb logcat -b main      # 기본
adb logcat -b system    # 시스템
adb logcat -b events    # 이벤트
adb logcat -b crash     # 크래시
adb logcat -b all       # 전부
```

If the app died quietly and nothing was left in `main`, check the `crash`
buffer.

### Filters

Filters take the form `tag:priority`, joined together with spaces. Priorities
run from lowest to highest: `V` (Verbose), `D` (Debug), `I` (Info), `W`
(Warn), `E` (Error), `F` (Fatal), `S` (Silent).

The key is **putting `*:S` at the very end**. It silences every other tag,
turning the tags you listed ahead of it into a whitelist.

```bash
adb logcat ActivityManager:I MyApp:D *:S
```

Drop `*:S` and you get buried in system logs, which defeats the point of
filtering at all.

### Output format

```bash
adb logcat -v threadtime
```

`-v` changes the format. The options are `brief`, `long`, `process`, `raw`,
`tag`, `thread`, `threadtime`, `time`, `usec`, `UTC`, `epoch`, `printable`,
`year`, and `zone`. If you need timestamps along with PID/TID, `threadtime`
is a safe pick.

The options `logcat` accepts differ by the device's OS version. Rather than
carrying the full list, the official docs tell you to check the help on the
device itself.

```bash
adb logcat --help
```

## Port forwarding

`forward` goes **PC port → device port**; `reverse` is the opposite,
**device port → PC port**.

```bash
adb forward tcp:6100 tcp:7100     # PC의 6100 → 기기의 7100
adb forward tcp:6100 local:logd   # 기기의 UNIX 도메인 소켓으로

adb reverse tcp:6100 tcp:7100     # 기기의 6100 → PC의 7100
```

`reverse` is for when an app running on the device needs to reach a local
server on your development machine. Hybrid apps that connect to a local dev
server, and the Unity profiler connection covered below, are cases like that.

Forwards you set up accumulate. If something seems off, checking the list
first is the quickest move.

```bash
adb forward --list
adb forward --remove tcp:6100
adb forward --remove-all

adb reverse --list
adb reverse --remove-all
```

## Diagnostics

```bash
adb bugreport ./report        # 로그·덤프를 zip으로 묶어 저장
adb shell dumpsys             # 시스템 서비스 상태 덤프
adb shell dumpsys battery     # 서비스 하나만
adb jdwp                      # 디버깅 가능한 프로세스의 PID 목록
```

`bugreport` is a good thing to ask QA for: "if it reproduces, run this once
and send it over." Logs, dumpsys, and system state all get bundled together.

## Screenshots and screen recording

```bash
adb exec-out screencap -p > screen.png
adb shell screenrecord --bit-rate 6000000 --time-limit 30 /sdcard/demo.mp4
adb pull /sdcard/demo.mp4 ./
```

`screenrecord` defaults to a 20Mbps bit rate, and the time limit is 180
seconds — both the default and the maximum. Lowering the resolution with
`--size 1280x720` makes the file far lighter.

Useful for capturing a bug repro on video. Audio isn't recorded, though.

## What I actually use in Unity client work

From here on are the combinations I actually reach for while building a game
client.

### Watching only the game's logs

```bash
adb logcat -c && adb logcat Unity:V *:S
```

Unity runtime logs conventionally go out under the `Unity` tag, so this one
line leaves you with nothing but the game's logs. That tag name isn't a value
Unity's official docs guarantee, though — it's what you observe in actual
builds. If nothing matches, it's faster to let the log run unfiltered once
and check the real tag.

If you're chasing a crash, watch the `crash` buffer as well.

```bash
adb logcat -b crash -d
```

### Attaching the profiler

You have to build as a **Development Build**. Then open the tunnel.

```bash
adb forward tcp:34999 localabstract:Unity-<bundle identifier>
```

Then pick `AndroidProfiler(ADB@127.0.0.1:34999)` under Target Selection in
the Profiler window. If you need the device-to-editor direction, open this
one too.

```bash
adb reverse tcp:34998 tcp:34999
```

What people get wrong most often is that the thing after `localabstract:` is
**not the package name but the bundle identifier with a `Unity-` prefix**.

### Pulling save files out and planting them back in

`Application.persistentDataPath` resolves on Android to
`/storage/emulated/<userid>/Android/data/<packagename>/files`. That's the
path determined by `android.content.Context.getExternalFilesDir`.

```bash
adb pull /storage/emulated/0/Android/data/com.example.game/files ./save
adb push ./save/. /storage/emulated/0/Android/data/com.example.game/files
```

Use it to pull down save data exactly as QA reproduced it, or to plant a
specific progress state before starting. Bugs where the local save gets
corrupted are hard to reproduce without this round trip.

### Swapping in a new build

```bash
adb install -r -g -t build.apk
```

Keep the data (`-r`), pre-approve the permissions (`-g`), and allow a test
build (`-t`). This is the combination I type most while going around a QA
cycle.

## Where decade-old material gets it wrong

Now for the old material I mentioned at the start. Posts from that era have a
few spots that will leave you stuck if you follow them as-is today.

### `adb ppp`

It's introduced as "the option for running PPP over USB," but it's **not in
the current official docs' command list.** Many writers from that period
noted that all they got was an error about it not being implemented on Win32,
so they couldn't tell what it actually meant. There's no longer even a reason
to check.

### DDMS

A frequent aside in the log sections compares logcat to ddms: "these are the
same logs you see in ddms (Dalvik Debug Monitor)." Go looking for DDMS now
and you won't find it.

**Android Device Monitor**, which contained DDMS, **was deprecated in Android
Studio 3.1 and removed in 3.2.** Its features got scattered like this.

| Old feature | Today |
|---|---|
| DDMS profiling | Android Studio Profiler |
| Traceview | CPU Profiler |
| Network Traffic Tool | Network Profiler |
| Hierarchy Viewer | Layout Inspector |

The runtime isn't even called Dalvik anymore — it's ART. Material still
carrying the name "Dalvik Debug Monitor" is telling you its age all by
itself.

### Peeking straight into `/data/data`

Screenshots of dropping into `adb shell` and checking installed package names
under `/data/data` show up constantly. Follow along and nine times out of ten
you'll get `Permission denied`.

The original isn't wrong. **That screen was an emulator**, which is why it
worked; on a real device you can't open an app's private directory unless
it's rooted. If you want package names, use this.

```bash
adb shell pm list packages
```

When you read old material, you also have to watch **whether the terminal
output came from an emulator or a real device.** That's the line where
permissions decide what works and what doesn't.

### The things that are simply missing

There's more missing from the old material than there is wrong in it.
Wireless debugging (`pair`/`connect`), `reverse`, `exec-out`,
`install-multiple`, `install-multi-package`, and `server-status` all came
afterward. A decade's worth is just absent.

## Wrapping up

When you read adb material, split it into the parts that don't age and the
parts with an expiry date.

- **Long-lived** — the three-layer client/server/daemon structure, port 5037,
  the device selection options, and the basic shape of
  `push`/`pull`/`shell`/`logcat`. These are concepts, so they rarely change.
- **Has an expiry date** — the full command list, the flags, the terminal
  output, and the names of the surrounding tools. Always check these against
  the current official docs.

And when you're stuck, asking the device directly is often faster than the
docs, because the options differ by the device's OS version.

```bash
adb --help
adb logcat --help
adb shell screenrecord --help
```

---

### References

- [Android Debug Bridge (adb) — Android Developers](https://developer.android.com/tools/adb)
- [SDK Platform Tools release notes](https://developer.android.com/tools/releases/platform-tools)
- [logcat command-line tool](https://developer.android.com/tools/logcat)
- [Android Device Monitor (deprecated)](https://developer.android.com/studio/profile/monitor)
- [Android build variants (user / userdebug / eng)](https://source.android.com/docs/setup/build/building)
- [Unity — Collecting performance data on an Android device](https://docs.unity3d.com/6000.4/Documentation/Manual/android-profile-on-an-android-device.html)
- [Unity — Application.persistentDataPath](https://docs.unity3d.com/6000.4/Documentation/ScriptReference/Application-persistentDataPath.html)

The starting point for this post was a [Naver blog post](https://blog.naver.com/chogar/220147798199)
written up from a Korean mentoring-program assignment. I borrowed its outline
of topics, but rewrote the explanations and verified them against the official
docs listed above.
