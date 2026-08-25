---
pubDatetime: 2026-08-25T13:00:00+09:00
title: "adb 정리: 안드로이드 디버그 브리지의 구조와 명령어"
featured: false
draft: false
tags:
  - 안드로이드
  - adb
  - Unity
description: "안드로이드 빌드를 붙잡고 디버깅할 때 쓰는 adb를 구조부터 명령어까지 정리했다. SDK Platform Tools 37.0.1 기준이며, 한국어 자료에 흔한 10년 전 정보와 어디서 갈리는지도 같이 짚었다."
---

안드로이드 빌드를 디버깅한다는 건 결국 `adb`를 얼마나 손에 익혔느냐의 문제다.
로그를 보든, 빌드를 밀어 넣든, 프로파일러를 붙이든, 세이브 파일을 꺼내오든
전부 이 도구를 거친다.

그런데 한국어로 `adb`를 검색하면 2014년 전후에 쓰인 글이 먼저 나온다.
안드로이드가 한창 커지던 시기라 그때 정리된 자료가 많고, 그 뒤로 이걸 대체할
만큼 정리된 한글 문서가 잘 안 나왔기 때문이다. 문제는 그 자료들이 **절반만
맞다**는 것이다. 구조를 설명하는 부분은 10년이 지나도 그대로인데, 명령어
목록과 실행 화면은 지금 따라 하면 막힌다.

그래서 처음부터 다시 정리했다. 기준은 **SDK Platform Tools 37.0.1**(2026년 7월)과
현재 공식 문서다. 마지막에 옛 자료가 어디서 틀리는지 따로 모아뒀다.

## Table of contents

## adb는 하나의 프로그램이 아니다

Android Debug Bridge는 SDK Platform Tools 패키지에 들어 있고,
`<android_sdk>/platform-tools/`에 있다.

터미널에서 `adb`를 치면 실행 파일 하나가 도는 것처럼 보이지만, 실제로는
**세 개의 프로세스**가 물려 있다.

- **클라이언트** — 개발 PC에서, `adb` 명령을 칠 때마다 새로 떴다가 사라지는
  쪽. 하는 일은 명령을 서버로 넘기는 것뿐이다.
- **서버** — 개발 PC에서 백그라운드로 상주하는 프로세스. 연결된 기기 목록을
  관리하고 클라이언트와 데몬 사이를 중계한다.
- **데몬(`adbd`)** — 기기·에뮬레이터 쪽에서 도는 프로세스. 실제로 명령을
  실행하는 쪽.

서버는 로컬 TCP **5037** 포트에 바인딩하고, 모든 클라이언트는 이 포트로 서버와
통신한다. 클라이언트를 처음 실행할 때 서버가 떠 있지 않으면 알아서 띄운다.

이 구조를 알아두면 실무에서 하나가 풀린다. **기기가 목록에 안 잡힐 때
`adb kill-server && adb start-server`가 왜 듣는지**다.

```bash
adb kill-server
adb start-server
adb server-status   # 서버 버전과 상태 확인
```

고장 난 건 대개 USB도 기기도 아니고, PC에서 돌던 서버가 쥐고 있던 기기 목록
상태다. 클라이언트는 명령마다 새로 뜨니 재시작해도 소용이 없고, 데몬은 기기
쪽이라 직접 건드릴 수 없다. **상태를 들고 있는 건 가운데 층뿐이다.**

### 트랜스포트

서버와 데몬이 붙는 경로는 두 가지다.

- **USB** — 케이블
- **TCP** — 같은 네트워크

무선 연결에서는 기기를 찾는 데 mDNS를 쓴다. 이 부분은 최근까지도 바뀌고 있다.
platform-tools 37.0.0에서 기본 mDNS 백엔드가 `libadbmdns`로 바뀌었고,
**37.0.1에서는 `openscreen` 백엔드가 아예 삭제**되어 `ADB_MDNS_OPENSCREEN`
환경변수는 이제 아무 효과가 없다.

## 어느 기기에 명령을 보낼 것인가

기기가 하나뿐이면 신경 쓸 일이 없지만, 실기기와 에뮬레이터를 같이 띄워놓고
작업하면 바로 문제가 된다.

```bash
adb -d shell            # 연결된 USB 기기 하나
adb -e shell            # 실행 중인 에뮬레이터 하나
adb -s emulator-5554 shell   # 시리얼로 지정
```

`-d`와 `-e`는 **해당 범주에 기기가 정확히 하나일 때만** 동작하고, 둘 이상이면
에러를 낸다. 여러 대를 붙여놓고 쓸 거라면 `-s`가 기본이라고 보면 된다.

매번 `-s`를 치기 귀찮으면 환경변수로 고정할 수 있다. 다만 `-s`를 같이 주면
그쪽이 이긴다.

```bash
export ANDROID_SERIAL=emulator-5554
```

### 목록과 상태

```bash
adb devices          # 시리얼과 상태
adb devices -l       # 모델명·기기 설명까지
adb get-state        # device / offline / no device
adb get-serialno     # 시리얼 문자열
```

`adb devices`에서 `offline`으로 잡히는 건 "케이블은 붙었는데 데몬과 핸드셰이크가
끝나지 않은" 상태다. 기기 화면의 USB 디버깅 허용 팝업을 아직 안 눌렀을 때
흔히 이렇게 나온다.

스크립트에서 유용한 건 `wait-for-device`다. 부팅이 끝날 때까지 다음 명령을
막아준다.

```bash
adb wait-for-device shell
```

이걸 빼고 부팅 도중에 `adb shell`을 때리면 에러만 보고 끝난다. CI에서
에뮬레이터를 띄운 직후 명령을 이어 붙일 때 반드시 필요하다.

## 무선으로 붙기

케이블 없이 붙는 쪽은 옛 자료에 통째로 빠져 있는 영역이다.

**Android 11(API 30) 이상**이 필요하고, TV와 WearOS는 **Android 13(API 33)
이상**이다. 기기의 개발자 옵션에서 무선 디버깅을 켜고 페어링 코드를 띄운 다음:

```bash
adb pair 192.168.0.10:37115   # 기기 화면의 페어링 코드 입력
adb connect 192.168.0.10:5555
adb disconnect 192.168.0.10:5555
```

`pair`는 최초 1회만 하면 되고, 이후에는 `connect`만 하면 된다. 페어링 포트와
연결 포트가 다르다는 점을 자주 헷갈린다.

platform-tools 37.0.0과 Android 17 조합부터는 **adb Wi-Fi 2.0**이 들어가
같은 네트워크의 페어링된 기기에 자동으로 다시 붙는다.

**Android 10 이하**는 페어링이 없고, USB로 한 번 붙은 상태에서 TCP 모드로
전환하는 방식이다.

```bash
adb tcpip 5555
adb connect 192.168.0.10:5555
```

## 앱 설치와 제거

```bash
adb install app.apk
adb install -r app.apk       # 데이터 유지하고 재설치
adb install -t app.apk       # 테스트 APK 허용
adb install -g app.apk       # 매니페스트 권한 전부 부여
adb install -d app.apk       # 버전 코드 다운그레이드 허용
```

자주 쓰는 플래그를 정리하면 이렇다.

| 플래그 | 뜻 |
|---|---|
| `-r` | 재설치. 앱 데이터 유지 |
| `-t` | 테스트 APK 설치 허용 |
| `-g` | 매니페스트에 선언된 권한 전부 승인 |
| `-d` | 버전 코드 다운그레이드 허용 |
| `--user <id>` | 특정 사용자에게만 설치 |
| `--wait` | 설치가 끝날 때까지 대기 |
| `--incremental` | APK를 스트리밍하며 앱 실행 |

`-g`는 QA 빌드를 돌릴 때 편하다. 권한 팝업을 하나씩 눌러줄 필요가 없다.
`-d`는 이전 버전으로 되돌려 재현할 때 쓴다.

분할 APK(App Bundle에서 나온 여러 개의 APK)는 따로 있다.

```bash
adb install-multiple base.apk split_config.arm64_v8a.apk ...
adb install-multi-package app1.apk app2.apk
```

제거는 이렇다.

```bash
adb uninstall com.example.game
adb uninstall -k com.example.game            # 앱만 지우고 데이터·캐시는 남김
adb uninstall --user 0 com.example.game
```

`-k`는 "데이터는 그대로 두고 앱만 갈아 끼워서 마이그레이션이 잘 도는지" 볼 때
쓴다.

## 파일 주고받기

```bash
adb push local.txt /sdcard/local.txt     # PC → 기기
adb pull /sdcard/remote.txt ./           # 기기 → PC
```

디렉터리도 통째로 된다. 세이브 데이터나 로그 폴더를 통으로 받아올 때 쓴다.

## 셸

```bash
adb shell                      # 대화형 셸. Ctrl+D 또는 exit로 나옴
adb shell pm list packages     # 명령 하나만 실행하고 빠져나옴
```

안드로이드는 리눅스 커널 기반이라 셸 명령이 상당수 겹친다. 다만 기기에 어떤
도구가 들어 있는지는 빌드마다 다르다.

```bash
adb shell ls /system/bin       # 쓸 수 있는 도구 목록
adb shell toybox --help
```

### `exec-out`

바이너리를 그대로 받아야 할 때는 `shell` 대신 `exec-out`을 쓴다. 공식 문서도
스크린샷 예제에 "raw data를 얻으려면 `shell` 대신 `exec-out`을 쓰라"고 주석을
달아둔다.

```bash
adb exec-out screencap -p > screen.png
```

### root, remount

```bash
adb root       # adbd를 root로 재시작
adb unroot     # 다시 일반 권한으로
adb remount    # 시스템 파티션을 쓰기 가능하게 재마운트
```

명령 자체는 문서에 있지만, **소매용 단말에서는 통하지 않는다.** 안드로이드
빌드는 `user` / `userdebug` / `eng` 세 가지 변형이 있고, 출시 단말에 올라가는
`user` 빌드는 보안 접근이 제한된 프로덕션용이다. 이 명령들이 의미가 있는 건
개발용 빌드나 에뮬레이터다.

## 로그 — logcat

디버깅의 본체다. 여기만 제대로 써도 절반은 해결된다.

```bash
adb logcat            # 실시간 스트림
adb logcat -d         # 현재 버퍼를 덤프하고 종료
adb logcat -c         # 버퍼 비우기
```

재현 절차를 밟기 직전에 `-c`로 비우고, 재현한 다음 `-d`로 떠서 파일로
남기는 흐름이 편하다.

### 버퍼

로그는 하나의 통이 아니라 여러 버퍼로 나뉜다.

```bash
adb logcat -b main      # 기본
adb logcat -b system    # 시스템
adb logcat -b events    # 이벤트
adb logcat -b crash     # 크래시
adb logcat -b all       # 전부
```

앱이 조용히 죽었는데 `main`에 아무것도 안 남았다면 `crash` 버퍼를 봐야 한다.

### 필터

필터는 `태그:우선순위` 형태를 공백으로 이어 붙인다. 우선순위는 낮은 쪽부터
`V`(Verbose) `D`(Debug) `I`(Info) `W`(Warn) `E`(Error) `F`(Fatal) `S`(Silent)다.

핵심은 **`*:S`를 맨 뒤에 붙이는 것**이다. 나머지 태그를 전부 침묵시켜서, 앞에
적은 태그만 남는 화이트리스트가 된다.

```bash
adb logcat ActivityManager:I MyApp:D *:S
```

`*:S`를 빼면 시스템 로그에 파묻혀서 필터를 건 의미가 없어진다.

### 출력 형식

```bash
adb logcat -v threadtime
```

`-v`로 형식을 바꾼다. `brief`, `long`, `process`, `raw`, `tag`, `thread`,
`threadtime`, `time`, `usec`, `UTC`, `epoch`, `printable`, `year`, `zone`이
있다. 타임스탬프와 PID/TID가 같이 필요하면 `threadtime`이 무난하다.

`logcat`의 옵션은 기기의 OS 버전에 따라 다르다. 공식 문서도 전체 목록을 싣는
대신 기기에 맞는 도움말을 보라고 안내한다.

```bash
adb logcat --help
```

## 포트 포워딩

`forward`는 **PC 포트 → 기기 포트**, `reverse`는 반대로 **기기 포트 → PC
포트**다.

```bash
adb forward tcp:6100 tcp:7100     # PC의 6100 → 기기의 7100
adb forward tcp:6100 local:logd   # 기기의 UNIX 도메인 소켓으로

adb reverse tcp:6100 tcp:7100     # 기기의 6100 → PC의 7100
```

`reverse`는 기기에서 도는 앱이 개발 PC의 로컬 서버를 붙잡아야 할 때 쓴다.
로컬 개발 서버에 붙는 하이브리드 앱이나, 뒤에 나올 Unity 프로파일러 연결이
그런 경우다.

걸어놓은 포워딩은 쌓인다. 뭔가 이상하면 목록부터 확인하는 게 빠르다.

```bash
adb forward --list
adb forward --remove tcp:6100
adb forward --remove-all

adb reverse --list
adb reverse --remove-all
```

## 진단

```bash
adb bugreport ./report        # 로그·덤프를 zip으로 묶어 저장
adb shell dumpsys             # 시스템 서비스 상태 덤프
adb shell dumpsys battery     # 서비스 하나만
adb jdwp                      # 디버깅 가능한 프로세스의 PID 목록
```

`bugreport`는 QA에게 "재현되면 이거 하나 떠서 주세요"라고 요청하기 좋다.
로그·덤프시스·시스템 상태가 한 번에 묶인다.

## 화면 캡처와 녹화

```bash
adb exec-out screencap -p > screen.png
adb shell screenrecord --bit-rate 6000000 --time-limit 30 /sdcard/demo.mp4
adb pull /sdcard/demo.mp4 ./
```

`screenrecord`의 기본 비트레이트는 20Mbps, 시간 제한은 기본이자 최대 180초다.
`--size 1280x720`으로 해상도를 낮추면 파일이 훨씬 가벼워진다.

버그 재현 영상을 남길 때 유용하다. 다만 오디오는 녹음되지 않는다.

## Unity 클라이언트 작업에서 실제로 쓰는 것

여기부터는 게임 클라이언트를 만들면서 실제로 손이 가는 조합이다.

### 게임 로그만 골라 보기

```bash
adb logcat -c && adb logcat Unity:V *:S
```

Unity 런타임 로그는 관례적으로 `Unity` 태그로 나가므로 이 한 줄이면 게임
로그만 남는다. 다만 이 태그 이름은 Unity 공식 문서가 보장하는 값은 아니고
실제 빌드에서 관찰되는 값이다. 안 걸리면 필터 없이 한 번 흘려보고 실제 태그를
확인하는 편이 빠르다.

크래시를 쫓는 중이라면 `crash` 버퍼도 같이 본다.

```bash
adb logcat -b crash -d
```

### 프로파일러 붙이기

**Development Build**로 빌드해야 한다. 그다음 터널을 연다.

```bash
adb forward tcp:34999 localabstract:Unity-<bundle identifier>
```

그리고 Profiler 창의 Target Selection에서
`AndroidProfiler(ADB@127.0.0.1:34999)`를 고른다. 기기에서 에디터로 붙는 방향이
필요하면 아래도 같이 연다.

```bash
adb reverse tcp:34998 tcp:34999
```

`localabstract:` 뒤에 오는 게 **패키지명이 아니라 `Unity-` 접두사가 붙은 번들
식별자**라는 점을 자주 틀린다.

### 세이브 파일 꺼내오고 심어넣기

`Application.persistentDataPath`는 안드로이드에서
`/storage/emulated/<userid>/Android/data/<packagename>/files`로 잡힌다.
`android.content.Context.getExternalFilesDir`로 결정되는 경로다.

```bash
adb pull /storage/emulated/0/Android/data/com.example.game/files ./save
adb push ./save/. /storage/emulated/0/Android/data/com.example.game/files
```

QA가 재현한 세이브 데이터를 그대로 받아오거나, 특정 진행 상태를 심어놓고
시작할 때 쓴다. 로컬 세이브가 깨지는 버그는 이 왕복 없이는 재현이 어렵다.

### 빌드 갈아 끼우기

```bash
adb install -r -g -t build.apk
```

데이터를 유지한 채(`-r`) 권한을 미리 승인하고(`-g`) 테스트 빌드를 허용(`-t`)한다.
QA 사이클을 도는 동안 이 조합을 가장 많이 친다.

## 10년 된 자료에서 틀리는 지점

이제 앞에서 말한 옛 자료 얘기다. 그 시기 글에는 지금 그대로 따라 하면 막히는
대목이 몇 군데 있다.

### `adb ppp`

"USB로 PPP를 실행하는 옵션"으로 소개돼 있는데, **현재 공식 문서의 명령어
목록에 없다.** 그 시절 글쓴이들도 Win32에서 구현되지 않는다는 에러만 보고
정확한 의미를 알 수 없었다고 적어둔 경우가 많다. 확인해볼 필요조차 없어진
셈이다.

### DDMS

로그를 설명하면서 "ddms(Dalvik Debug Monitor)로 보는 로그와 같다"고 비교하는
대목이 자주 나온다. 지금 DDMS를 찾으면 못 찾는다.

DDMS를 품고 있던 **Android Device Monitor는 Android Studio 3.1에서 deprecated,
3.2에서 제거됐다.** 기능별로 이렇게 흩어졌다.

| 옛 기능 | 현재 |
|---|---|
| DDMS 프로파일링 | Android Studio Profiler |
| Traceview | CPU Profiler |
| Network Traffic Tool | Network Profiler |
| Hierarchy Viewer | Layout Inspector |

런타임 이름부터가 이제 Dalvik이 아니라 ART다. "Dalvik Debug Monitor"라는
이름이 남아 있는 자료는 그 자체로 연식을 알려주는 표시로 봐도 된다.

### `/data/data`를 그냥 들여다보는 장면

`adb shell`로 들어가 `/data/data` 아래 설치된 패키지 이름을 확인하는 화면이
자주 등장한다. 따라 하면 십중팔구 `Permission denied`가 뜬다.

원문이 틀린 게 아니다. **그 화면이 에뮬레이터**여서 됐던 것이고, 실제 단말에서는
루팅하지 않는 한 앱 전용 디렉터리를 열 수 없다. 패키지 이름이 궁금하면 이걸
쓰면 된다.

```bash
adb shell pm list packages
```

오래된 자료를 볼 때는 **실행 화면이 에뮬레이터인지 실기기인지**를 같이 봐야
한다. 권한 때문에 되고 안 되고가 갈리는 지점이 거기다.

### 아예 빠져 있는 것들

옛 자료에 "틀린 것"보다 많은 게 "없는 것"이다. 무선 디버깅(`pair`/`connect`),
`reverse`, `exec-out`, `install-multiple`, `install-multi-package`,
`server-status`가 전부 그 뒤에 생겼다. 10년치가 통째로 빠져 있는 셈이다.

## 정리

adb 자료를 볼 때는 연식과 무관한 부분과 유통기한이 있는 부분을 갈라서 보면 된다.

- **오래 가는 것** — 클라이언트/서버/데몬 3층 구조, 5037 포트, 기기 지정
  옵션, `push`/`pull`/`shell`/`logcat`의 기본 형태. 개념이라 잘 안 변한다.
- **유통기한이 있는 것** — 전체 명령어 목록, 플래그, 실행 화면, 주변 도구
  이름. 반드시 현재 공식 문서와 대조해야 한다.

그리고 막히면 문서보다 기기에게 직접 묻는 게 빠를 때가 많다. 옵션은 기기의
OS 버전에 따라 다르기 때문이다.

```bash
adb --help
adb logcat --help
adb shell screenrecord --help
```

---

### 참고

- [Android Debug Bridge (adb) — Android Developers](https://developer.android.com/tools/adb)
- [SDK Platform Tools 릴리스 노트](https://developer.android.com/tools/releases/platform-tools)
- [logcat 명령줄 도구](https://developer.android.com/tools/logcat)
- [Android Device Monitor (deprecated)](https://developer.android.com/studio/profile/monitor)
- [Android 빌드 변형 (user / userdebug / eng)](https://source.android.com/docs/setup/build/building)
- [Unity — Collecting performance data on an Android device](https://docs.unity3d.com/6000.4/Documentation/Manual/android-profile-on-an-android-device.html)
- [Unity — Application.persistentDataPath](https://docs.unity3d.com/6000.4/Documentation/ScriptReference/Application-persistentDataPath.html)

이 글의 출발점이 된 자료는 스팩초월 멘토스쿨 과제물을 정리한
[네이버 블로그 글](https://blog.naver.com/chogar/220147798199)이다. 항목 구성을
참고했고, 설명과 검증은 위 공식 문서를 기준으로 다시 작성했다.
