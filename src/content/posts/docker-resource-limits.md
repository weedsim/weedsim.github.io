---
pubDatetime: 2026-10-02T16:30:00+09:00
title: "`--memory-swap=0`은 스왑을 끄지 않는다"
lang: ko
translationKey: docker-resource-limits
featured: false
draft: false
tags:
  - Docker
  - 컨테이너
  - 리눅스
  - 인프라
description: "컨테이너 자원 제한 옵션을 표로 정리한 2017년 글이다. 지도로는 쓸모 있는데 복사해 쓰면 걸리는 자리가 셋 있다. 스왑 규칙 둘이 서로 반대로 적혀 있고, 예제의 스왑 용량이 두 배이고, period 기본값이 10배다."
---

게임 서버와 DB를 **컨테이너로 분리해서 보안을 챙기는 구성**으로 가고 싶었고,
거기에 **최적화까지 같이 고려하면서** 어떻게 해야 하는지 찾다가 스크랩한 글이다.

보안 쪽은 [앞선 글](/posts/docker-build-and-run/)에서 한 번 정리했다 — 포트를
퍼블리시하지 않는 것, 비밀번호를 명령줄로 넘기지 않는 것, 볼륨을 붙여두는 것.
남은 절반이 이쪽이다. **한 PC에 둘이 같이 있으면 DB 컨테이너가 서버 쪽 CPU와
메모리를 다 먹어버릴 수 있다.**

두 절반이 겹치는 자리도 있다. 자원 한도는 암호나 포트처럼 경계를 긋는 장치는
아니지만, **하나가 호스트를 독점해서 나머지를 굶기는 상황을 막는다.** 클리핑의
문제 설정이 정확히 그것이다.

2017년 글이고, Docker 공식 문서의 자원 제한 페이지를 한국어로 옮겨 표로 정리한
형태다. **지도로는 지금도 쓸모 있다.** 어떤 옵션이 있고 CPU 쪽과 메모리 쪽이
어떻게 나뉘는지 한 화면에 들어온다.

문제는 복사해 쓸 때다. 걸리는 자리가 셋 있고, 그중 하나는 **두 규칙이 서로
반대로 적혀 있다.**

> \* --memory-swap 옵션이 0으로 설정되어 있으면, 값은 무시된다.
>
> \* --memory-swap 옵션이 --memory 옵션 값과 동일한 값으로 설정되어 있다면
> 스왑을 사용하지 않겠다는 의미로 --memory-swap="0" 과 동일한 의미로 사용된다.

두 줄이 한 문단 안에 붙어 있다. 앞 줄은 "0은 무시된다", 뒷 줄은 "같게 두면
스왑을 안 쓰는 것이고 그게 0과 같다". **0이 무시되는데 어떻게 0이 "스왑 안 쓰기"
일 수 있나.** 둘 중 하나가 틀렸고, 실제로는 **정반대의 결과**다.

## 목차

## 표의 뼈대는 지금도 맞다

먼저 맞는 쪽부터. 글의 문제 설정이 정확하다.

> 하나의 머신에 여러 개의 컨테이너를 띄워서 서비스하려할 때, 각 컨테이너가 호스트
> 머신의 자원을 독점하는 현상을 막아야 한다

그리고 기본 상태를 짚은 것도 맞다.

> 기본적으로 Docker 컨테이너는 호스트 머신의 CPU 자원을 제한없이 사용할 수 있다

커널 쪽 기본값이 그렇게 되어 있다. cgroup v2의 인터페이스 파일 설명이 그대로다.

> **memory.max** — A read-write single value file which exists on non-root
> cgroups. **The default is "max".** ... Memory usage hard limit.

> **memory.swap.max** — ... **The default is "max".** ... Swap usage hard limit.

제한이 없는 게 기본이다. 옵션을 안 주면 한도가 `max`다.

개별 옵션 설명도 대체로 맞다. `--cpus`와 `--cpu-period`/`--cpu-quota`의 관계를
적은 부분은 현행 문서와 같다.

> **`--cpus=<value>`** — Specify how much of the available CPU resources a
> container can use. For instance, if the host machine has two CPUs and you set
> `--cpus="1.5"`, the container is guaranteed at most one and a half of the CPUs.

`--cpu-shares` 기본값 1024도 맞다.

> **`--cpu-shares`** — Set this flag to a value greater or less than the default of
> **1024** to increase or reduce the container's weight, and give it access to a
> greater or lesser proportion of the host machine's CPU cycles.

`--memory-reservation`을 soft limit으로, `--memory`를 hard limit으로 나눈 구분도
정확하다. 이 글을 읽고 "무엇을 검색해야 하는지"는 제대로 알게 된다.

## `--memory-swap=0`은 스왑을 끄지 않는다

공식 문서의 규칙 다섯 줄을 그대로 놓으면 끝난다.

> - If `--memory-swap` is set to a positive integer, then both `--memory` and
>   `--memory-swap` must be set. `--memory-swap` represents the total amount of
>   memory and swap that can be used, and `--memory` controls the amount used by
>   non-swap memory.
> - If `--memory-swap` is set to `0`, the setting is ignored, and the value is
>   **treated as unset.**
> - If `--memory-swap` is set to the same value as `--memory`, and `--memory` is
>   set to a positive integer, **the container doesn't have access to swap.**
> - If `--memory-swap` is unset, and `--memory` is set, the container can use as
>   much swap as the `--memory` setting.
> - If `--memory-swap` is explicitly set to `-1`, the container is allowed to use
>   unlimited swap, up to the amount available on the host system.

두 번째와 네 번째를 이어 읽으면 `0`의 결과가 나온다. **0은 "미설정으로 취급"되고,
미설정은 "`--memory`만큼 스왑을 쓸 수 있다"다.** 즉 0으로 두면 스왑이 꺼지는 게
아니라 **`--memory` 크기만큼 켜진다.**

반대로 세 번째 줄, `--memory`와 같은 값으로 두면 **스왑에 접근할 수 없다.**

| 설정 | 결과 | 쓸 수 있는 스왑 |
| --- | --- | --- |
| `--memory=300m --memory-swap=0` | 미설정으로 취급 | **300m** |
| `--memory=300m --memory-swap=300m` | 스왑 차단 | **0** |
| `--memory=300m` (미설정) | 0과 같다 | 300m |
| `--memory=300m --memory-swap=1g` | 합이 1g | 700m |
| `--memory=300m --memory-swap=-1` | 무제한 | 호스트에 있는 만큼 |

클리핑은 1행과 2행을 **같은 것**이라고 적었다. 표에서 보면 둘은 스왑이 0과 300m로
양 끝이다.

실무에서 이게 어떻게 터지나. "스왑을 끄고 싶다"는 의도로 `--memory-swap=0`을
주면, 컨테이너는 `--memory`만큼 스왑을 받는다. 그러면 메모리 한도를 넘겨도
**죽지 않고 디스크로 내려가서 느려진다.** OOM으로 재시작되길 기대하고 모니터링을
걸어뒀다면 그 알람이 안 울린다. 느려지는 것만 보이고 원인이 안 보인다.

스왑을 정말 끄려면 두 값을 같게 준다.

```bash
# 스왑 없음. 300m를 넘기면 OOM으로 끝난다.
docker run -d --name db --memory=300m --memory-swap=300m postgres:17
```

```bash
# 스왑 300m까지 허용. 0은 '미설정'이라서 위와 다른 결과가 된다.
docker run -d --name db --memory=300m --memory-swap=0 postgres:17
```

## 예제의 스왑이 두 배로 적혀 있다

같은 문단의 다른 줄이다.

> \* --memory-swap 옵션이 설정되어 있지 않고, --memory 옵션이 설정되어 있다면,
> --memory 옵션에 명시된 값의 두배에 해당하는 스왑공간을 사용할 수 있게 된다. 즉,
> --memory="300m" 옵션만 주면, 300MB의 메모리 공간과 **600MB의 스왑 공간**을
> 사용할 수 있게 설정된다.

문서의 같은 자리는 이렇게 적는다.

> If `--memory-swap` is unset, and `--memory` is set, the container can use **as
> much swap as the `--memory` setting**, if the host has swap memory configured.
> For instance, if `--memory="300m"` and `--memory-swap` is not set, the container
> can use **600m in total** of memory and swap.

**"두 배"가 붙는 곳이 다르다.** 두 배가 되는 건 메모리와 스왑을 더한 **합계**이고,
스왑 자체는 `--memory`와 같은 크기다.

| | 클리핑 | 문서 |
| --- | --- | --- |
| 메모리 | 300m | 300m |
| 스왑 | **600m** | 300m |
| 합계 | 900m | **600m** |

300MB 차이다. 메모리 한도를 300m로 잡으면서 "최악의 경우 900MB까지 쓸 수
있다"로 계산해두면, 한 대에 몇 개를 띄울지 세는 계산이 어긋난다. 그리고 스왑은
디스크라서 **넘치는 쪽이 메모리가 아니라 디스크 공간**이 된다.

문서 문장에 조건이 하나 더 붙어 있는 것도 짚어둘 만하다 — **"if the host has swap
memory configured."** 호스트에 스왑이 없으면 스왑 옵션은 전부 무의미하다. 요즘
클라우드 인스턴스는 스왑이 꺼져 있는 경우가 많고, 그러면 `--memory` 하나만
의미를 갖는다.

## period 기본값은 1초가 아니라 100밀리초다

CPU 쪽이다. 클리핑의 `--cpu-period` 설명은 이렇다.

> CPU CFS 스케줄러 Period를 의미하며, --cpu-quota 옵션과 같이 사용한다. **기본
> 값은 1초이며**, 마이크로초로 표현된다.

문서는 10분의 1을 적는다.

> **`--cpu-period=<value>`** — Specify the CPU CFS scheduler period, which is used
> alongside `--cpu-quota`. **Defaults to 100000 microseconds (100 milliseconds).**

커널 쪽 문서도 같다. CFS 대역폭 제어의 `cpu.cfs_period_us`가 **기본 100ms**이고,
cgroup v2의 `cpu.max`는 기본값이 **`max 100000`** — 두 번째 숫자가 period다.

재미있는 건 "1초"라는 숫자가 이 시스템에 실제로 있다는 것이다. 다만 기본값이
아니라 **상한**이다. 커널 문서가 period의 범위를 1ms에서 1초까지로 적는다.
기본값 자리에 상한값이 들어간 셈이다.

그리고 이 오류는 **클리핑 자신의 예제와 모순된다.** 같은 글이 두 군데에서
숫자를 든다.

```bash
# 글의 예제 1 — CPU 50%
$ sudo docker run -it --cpu-period="100000" --cpu-quota="50000" ubuntu /bin/bash
```

> --cpus="1.5"는 --cpu-period="100000" 옵션과 --cpu-quota="150000" 옵션을 동시에
> 준 것과 동일한 의미를 갖는다.

두 예제 모두 period에 `100000`을 쓴다. 그게 1초라면 `--cpus=1.5`는 1.5초를
1초 안에 쓴다는 뜻이 되는데, 마이크로초 단위에서 `100000`은 0.1초다.
**예제 쪽이 맞고 설명 쪽이 틀렸다.**

실무에서 period를 직접 만질 일은 드물다. 문서도 `--cpus` 하나로 가라고 하고,
클리핑도 그걸 옮겨 적었다. 그런데 **period가 100ms라는 걸 알아야 하는 자리가
하나 있다** — 스로틀링 간격이다. `--cpus=0.5`는 "항상 반쪽짜리 CPU"가 아니라
**100ms마다 50ms를 쓰고 나머지 50ms는 멈춘다**는 뜻이다. 응답 시간에 50ms짜리
톱니가 생길 수 있다. 1초로 알고 있으면 이 톱니의 주기를 10배로 잘못 예상한다.

| 설정 | 한 주기(100ms)에 허용되는 CPU 시간 |
| --- | --- |
| `--cpus=0.5` | 50ms |
| `--cpus=1` | 100ms |
| `--cpus=1.5` | 150ms (코어 둘에 걸쳐서) |
| `--cpus=2` | 200ms |

## 9년 뒤에 사라진 것과 사라질 것

2017년 글이다. 표에 적힌 옵션 하나는 **이제 없다.**

클리핑의 메모리 표에 `--kernel-memory`가 있다.

> 컨테이너가 사용할 수 있는 커널 메모리 양을 제한한다. 최소 값은 4m(4메가
> 바이트)이다.

Docker의 폐기 목록에 이 항목이 있다 — **v26.0에서 deprecated, v27.0에서
removed.** 지금 `docker run --kernel-memory=...`를 치면 옵션이 없다는 에러가
난다. `docker run` 레퍼런스의 옵션 표에도 없다.

최소값도 바뀌었다. 클리핑은 `--memory`의 최소값을 4m로 적는데, 현행 문서는
다르다.

> **`-m` or `--memory=`** — The maximum amount of memory the container can use.
> If you set this option, the minimum allowed value is **`6m`** (6 megabytes).

그리고 더 큰 변화가 진행 중이다. **cgroup v1 지원이 v29.0에서 deprecated 되었다.**
이 글 전체가 cgroup v1 시절의 용어로 쓰여 있다 — CFS 스케줄러, `--cpu-period`,
`--cpu-shares`가 그쪽 이름들이다.

cgroup v2에서는 커널 쪽 파일과 값이 다르다.

| 클리핑이 설정하는 것 | cgroup v2에서 커널이 보는 것 |
| --- | --- |
| `--cpus=0.5` | `cpu.max` = `50000 100000` |
| `--cpu-shares=2048` | `cpu.weight` (기본 100, 범위 1–10000) |
| `--memory=300m` | `memory.max` |
| `--memory-swap=1g` | `memory.swap.max` |

마지막 줄이 특히 다르다. Docker의 `--memory-swap`은 **"메모리 + 스왑의 합"**인데,
cgroup v2의 `memory.swap.max`는 **스왑만**이다.

> **`--memory-swap`** — Swap limit equal to memory **plus** swap

> **memory.swap.max** — **Swap** usage hard limit.

그래서 `--memory=300m --memory-swap=1g`을 주고 컨테이너 안에서
`memory.swap.max`를 읽으면 `1g`이 아니라 **700m**가 나올 것이다. Docker가
변환해서 쓰기 때문이다. 이 변환 과정 자체를 문서에서 확인하지는 못했으므로,
두 정의를 이어붙인 추론이다. 확인하는 방법은 아래에 적는다.

`--cpu-shares`도 숫자가 그대로 가지 않는다. Docker의 기본값은 1024인데 cgroup
v2의 `cpu.weight` 기본값은 100이고 범위가 1–10000이다. **내가 적은 숫자와 커널이
보는 숫자가 다르다.** 비율로만 생각하면 되지만, 커널 파일을 직접 들여다볼 때
숫자가 안 맞는다고 당황하지 않으려면 알아둘 만하다.

## 어디에 왜 쓰나

### DB 컨테이너에 한도를 거는 법

[앞선 글](/posts/docker-build-and-run/)의 구성 — 게임 서버와 DB가 한 PC에
있고, DB만 컨테이너 — 에 한도를 거는 명령이다.

```bash
docker run -d \
  --name game-db \
  --memory=2g \
  --memory-swap=2g \
  --memory-reservation=1g \
  --cpus=1.5 \
  --restart=unless-stopped \
  -v game-db-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD_FILE=/run/secrets/db_password \
  postgres:17
```

각 줄의 이유를 적으면 이렇다.

| 옵션 | 왜 |
| --- | --- |
| `--memory=2g` | hard limit. 이걸 넘기면 컨테이너 안 프로세스가 죽는다 |
| `--memory-swap=2g` | `--memory`와 **같게** 줘서 스왑을 끈다. DB가 디스크로 내려가면 느려지는 걸 모르고 지나친다 |
| `--memory-reservation=1g` | soft limit. 평소엔 넘겨 쓰고, 호스트가 빡빡할 때만 1g로 눌린다 |
| `--cpus=1.5` | 서버 쪽에 남겨둘 코어를 확보한다 |
| `--restart=unless-stopped` | OOM으로 죽었을 때 다시 올라온다 |

`--memory-swap`을 `--memory`와 같게 주는 게 요점이다. DB에서 스왑은 대개
**고장을 숨기는 쪽**으로 작동한다 — 메모리가 모자라면 느려지기만 하고, 모니터링은
"살아 있음"으로 읽는다. 차라리 죽고 다시 올라오는 쪽이 원인이 보인다.

`--memory-reservation`을 `--memory`보다 작게 두라는 건 문서의 조건이다.

> **`--memory-reservation`** — Allows you to specify a soft limit **smaller than
> `--memory`** which is activated when Docker detects contention or low memory on
> the host machine.

Compose로 쓰면 키 이름이 달라진다. 그리고 **스왑을 끄려면 어느 쪽 키를 쓰는지가
갈린다.**

```yaml
services:
  game-db:
    image: postgres:17
    restart: unless-stopped
    volumes:
      - game-db-data:/var/lib/postgresql/data

    # 서비스 레벨 키. memswap_limit이 --memory-swap에 해당한다.
    cpus: "1.5"
    mem_limit: 2g
    memswap_limit: 2g   # mem_limit과 같게 줘서 스왑을 끈다
    mem_reservation: 1g

volumes:
  game-db-data:
```

`deploy.resources` 쪽으로도 쓸 수 있는데, 거기에는 **스왑에 대응하는 키가 없다.**

```yaml
services:
  game-db:
    image: postgres:17
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 2g      # --memory에 해당
        reservations:
          memory: 1g      # --memory-reservation에 해당
    # 스왑은 여기서 못 정한다. 필요하면 위의 memswap_limit을 쓴다.
```

Compose 스펙에 있는 키들은 이렇게 대응한다.

| `docker run` | Compose 서비스 키 | `deploy.resources` |
| --- | --- | --- |
| `--memory` | `mem_limit` | `limits.memory` |
| `--memory-swap` | `memswap_limit` | **없음** |
| `--memory-reservation` | `mem_reservation` | `reservations.memory` |
| `--memory-swappiness` | `mem_swappiness` | 없음 |
| `--cpus` | `cpus` | `limits.cpus` |
| `--cpu-shares` | `cpu_shares` | 없음 |
| `--cpuset-cpus` | `cpuset` | 없음 |
| `--oom-kill-disable` | `oom_kill_disable` | 없음 |

스왑을 아예 생각하지 않아도 되게 만드는 쪽도 있다 — **호스트에서 스왑을 끄는
것**이다. 앞에서 본 문서 조건이 그걸 보장한다. 스왑 옵션은 "if the host has swap
memory configured"일 때만 의미를 갖는다.

### 걸린 값을 확인하는 법

한도를 걸었다고 믿지 말고 본다. 세 층에서 각각 볼 수 있다.

```bash
# 1층: 내가 준 값. HostConfig에 그대로 들어 있다.
docker inspect game-db \
  --format '{{.HostConfig.Memory}} {{.HostConfig.MemorySwap}} {{.HostConfig.NanoCpus}}'
```

```bash
# 2층: 커널이 보는 값. cgroup v2 인터페이스 파일을 컨테이너 안에서 읽는다.
docker exec game-db sh -c '
  echo "memory.max      : $(cat /sys/fs/cgroup/memory.max)"
  echo "memory.swap.max : $(cat /sys/fs/cgroup/memory.swap.max)"
  echo "cpu.max         : $(cat /sys/fs/cgroup/cpu.max)"
'
```

```bash
# 3층: 실제 사용량. 한도에 붙어 있는지 본다.
docker stats --no-stream game-db
```

2층이 앞 절에서 미뤄둔 확인이다. `--memory-swap=2g --memory=2g`를 줬다면
`memory.swap.max`가 `0`으로 나와야 하고, `--memory-swap=1g --memory=300m`을
줬다면 `700m`에 해당하는 바이트가 나와야 한다. **CLI에 적은 숫자와 커널 파일의
숫자가 다른 게 정상이다.**

cgroup 버전 자체도 확인해둔다. 경로가 다르면 v1이다.

```bash
# version=2면 cgroup v2다. driver는 버전과 무관하게 cgroupfs 또는 systemd다.
docker info --format 'driver={{.CgroupDriver}} version={{.CgroupVersion}}'
```

v1이면 파일 경로가 `/sys/fs/cgroup/memory/memory.limit_in_bytes` 쪽이고, 위의
2층 명령이 빈 값을 낸다. **v1 지원은 v29.0에서 deprecated 되었으므로**, 아직
v1이라면 그 자체가 처리할 일이다.

### 쓰지 말아야 할 자리

**`--cpuset-cpus`로 성능을 올리려는 것.** 클리핑의 설명은 맞다 — 쓸 코어를
지정한다. 그런데 이건 **격리 도구이고 성능 도구가 아니다.** `--cpus=1.5`는
"어느 코어든 1.5개 분량"이고 스케줄러가 알아서 옮긴다. `--cpuset-cpus="0,2"`는
그 두 코어에 못 박는 것이라서, 그 코어가 바쁠 때 다른 코어가 비어 있어도 못
쓴다. 캐시 지역성 같은 이유로 고정이 필요한 경우가 아니면 `--cpus`가 맞다.

**`--oom-kill-disable`을 `--memory` 없이 켜는 것.** 클리핑이 이 옵션을 표에
넣고 "특정 상황에 쓰면 유용하다"로 끝낸다. 문서에는 조건이 붙어 있다.

> only disable the OOM killer on containers where you have **also set the
> `-m`/`--memory` option**

한도 없이 OOM 킬러를 끄면, 컨테이너가 호스트 메모리를 다 먹고 **커널이 호스트의
다른 프로세스를 죽인다.** 컨테이너를 살리려고 켠 옵션이 호스트를 쓰러뜨린다.
그리고 cgroup v2에서는 이 옵션 자체가 동작하지 않는 쪽으로 가 있다.

**`--kernel-memory`.** v27.0에서 제거됐다. 2017년 글을 그대로 따라가면 여기서
막힌다.

**한도를 거는 것으로 메모리 누수를 "해결"하는 것.** `--memory`는 누수를 멈추지
않고 **누수의 영향 범위를 한 컨테이너로 줄인다.** `--restart` 와 함께 쓰면 주기적
재시작으로 버티는 모양이 되는데, 그건 시간을 버는 것이지 고치는 것이 아니다.
[앞선 글](/posts/docker-build-and-run/)에서 본 볼륨 설정이 되어 있지 않으면,
그 재시작마다 데이터도 같이 사라진다.

## 정리

이 글은 표로서 쓸모가 있다. CPU 쪽과 메모리 쪽에 어떤 옵션이 있고 soft limit과
hard limit이 어떻게 갈리는지 한 화면에 들어오고, "컨테이너 하나가 호스트를
독점하는 걸 막아야 한다"는 문제 설정도 정확하다.

복사해 쓸 때 걸리는 자리는 셋이다. **`--memory-swap=0`과
`--memory-swap=--memory`가 같다고 적혀 있는데 정반대다** — 0은 미설정으로
취급되어 `--memory`만큼 스왑이 켜지고, 같은 값은 스왑을 끈다. 미설정일 때의
예제도 스왑이 두 배로 적혀 있다 — 두 배가 되는 건 합계이고 스왑은 `--memory`와
같은 크기다. 그리고 `--cpu-period` 기본값이 1초로 적혀 있는데 **100밀리초**다.
1초는 기본값이 아니라 커널이 허용하는 상한이다.

셋 중 첫 번째가 제일 조용하다. 스왑을 끌 의도로 0을 주면 스왑이 켜지고,
컨테이너는 한도를 넘겨도 **죽는 대신 느려진다.** 알람은 안 울리고 응답만
늘어난다.

9년이 지나면서 `--kernel-memory`는 v27.0에서 제거되었고, `--memory`의 최소값은
4m에서 6m이 되었고, 글 전체가 전제하는 cgroup v1은 v29.0에서 deprecated 되었다.
표의 뼈대는 남았지만 **숫자와 이름은 그때 것이다.**

---

### 참고

- [Resource constraints — Docker 문서](https://docs.docker.com/engine/containers/resource_constraints/)
- [docker container run 레퍼런스 — Docker 문서](https://docs.docker.com/reference/cli/docker/container/run/)
- [Compose file services 레퍼런스 — Docker 문서](https://docs.docker.com/reference/compose-file/services/)
- [Deprecated Engine features — Docker 문서](https://docs.docker.com/engine/deprecated/)
- [CFS Bandwidth Control — Linux 커널 문서](https://docs.kernel.org/scheduler/sched-bwc.html)
- [Control Group v2 — Linux 커널 문서](https://docs.kernel.org/admin-guide/cgroup-v2.html)

이 글의 출발점이 된 자료는 [안지니어 — 도커 (Docker) 컨테이너 자원의 제한, 쿼터 설정하기](https://m.blog.naver.com/finway/220994619068)
(2017-05-02)이다. 거기 정리된 옵션 표를 한 줄씩 따라가면서, 스왑 규칙과 CFS
period 기본값, 그리고 그 뒤 제거·폐기된 항목을 현행 Docker 문서와 리눅스 커널
문서에 대조했다.
