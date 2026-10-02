---
pubDatetime: 2026-10-02T16:30:00+09:00
title: "`--memory-swap=0` Doesn't Turn Swap Off"
lang: en
translationKey: docker-resource-limits
featured: false
draft: false
tags:
  - Docker
  - Container
  - Linux
  - Infrastructure
description: "A 2017 write-up that tabulates the container resource-limit options. It works as a map, but three spots snag if you copy from it. Two swap rules are written as opposites, the example's swap size is doubled, and the period default is off by ten."
---

I wanted to go with a setup that **separates the game server and the DB into
containers for security**, and I clipped this while figuring out how to do that
**with optimization considered alongside it.**

The security half I covered once in [the earlier post](/posts/docker-build-and-run/)
— not publishing the port, not passing the password on the command line, attaching
a volume. The remaining half is this one. **With both on one PC, the DB container
can eat all the CPU and memory the server needs.**

There's a place where the two halves overlap. A resource limit isn't a boundary in
the way a password or a port is, but **it stops one container monopolizing the host
and starving the rest.** That's exactly the clipping's framing of the problem.

It's a 2017 post, a Korean rendering of Docker's official resource-constraints page
arranged as tables. **As a map it's still useful.** Which options exist and how the
CPU side and the memory side divide up fits on one screen.

The trouble is copying from it. Three spots snag, and one of them has **two rules
written as opposites.**

> \* If the --memory-swap option is set to 0, the value is ignored.
>
> \* If the --memory-swap option is set to the same value as the --memory option,
> it means not using swap, which is used with the same meaning as
> --memory-swap="0".

The two lines sit in the same paragraph. The first says "0 is ignored," the second
says "setting it equal means no swap, and that's the same as 0." **If 0 is ignored,
how can 0 mean "don't use swap"?** One of them is wrong, and the actual result is
**the exact opposite.**

## Table of Contents

## The Table's Skeleton Still Holds

What's right first. The post's framing of the problem is accurate.

> When running several containers on one machine to serve something, you have to
> prevent each container monopolizing the host machine's resources

And its note on the default state is right too.

> By default a Docker container can use the host machine's CPU resources without
> limit

That's how the kernel-side defaults are set. The cgroup v2 interface file
descriptions say it outright.

> **memory.max** — A read-write single value file which exists on non-root
> cgroups. **The default is "max".** ... Memory usage hard limit.

> **memory.swap.max** — ... **The default is "max".** ... Swap usage hard limit.

No limit is the default. Pass no option and the ceiling is `max`.

The individual option descriptions are mostly right as well. The part describing
the relationship between `--cpus` and `--cpu-period`/`--cpu-quota` matches the
current docs.

> **`--cpus=<value>`** — Specify how much of the available CPU resources a
> container can use. For instance, if the host machine has two CPUs and you set
> `--cpus="1.5"`, the container is guaranteed at most one and a half of the CPUs.

The `--cpu-shares` default of 1024 is right too.

> **`--cpu-shares`** — Set this flag to a value greater or less than the default of
> **1024** to increase or reduce the container's weight, and give it access to a
> greater or lesser proportion of the host machine's CPU cycles.

And the split of `--memory-reservation` as the soft limit against `--memory` as the
hard limit is accurate. Read this post and you do come away knowing what to search
for.

## `--memory-swap=0` Doesn't Turn Swap Off

Lay the official docs' five rules out and it's settled.

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

Read the second and the fourth together and `0`'s result falls out. **0 is "treated
as unset," and unset means "can use as much swap as `--memory`."** So setting it to
0 doesn't switch swap off — it switches **`--memory` worth of swap on.**

Conversely the third line: set equal to `--memory` and **the container doesn't have
access to swap.**

| Setting | Result | Swap available |
| --- | --- | --- |
| `--memory=300m --memory-swap=0` | Treated as unset | **300m** |
| `--memory=300m --memory-swap=300m` | Swap blocked | **0** |
| `--memory=300m` (unset) | Same as 0 | 300m |
| `--memory=300m --memory-swap=1g` | Total of 1g | 700m |
| `--memory=300m --memory-swap=-1` | Unlimited | As much as the host has |

The clipping says rows 1 and 2 are **the same thing.** In the table they're at
opposite ends, 0 and 300m.

How that blows up in practice. Pass `--memory-swap=0` meaning "turn swap off" and
the container gets `--memory` worth of swap. Then exceeding the memory limit
**doesn't kill it — it drops to disk and gets slow.** If you set up monitoring
expecting an OOM restart, that alarm never fires. You see the slowdown and not the
cause.

To actually turn swap off, give the two the same value.

```bash
# No swap. Go past 300m and it ends in an OOM.
docker run -d --name db --memory=300m --memory-swap=300m postgres:17
```

```bash
# Allows up to 300m of swap. 0 means 'unset', so this differs from the above.
docker run -d --name db --memory=300m --memory-swap=0 postgres:17
```

## The Example's Swap Is Written at Double

Another line in the same paragraph.

> \* If the --memory-swap option is not set and the --memory option is set, you can
> use **twice** the swap space of the value specified in --memory. That is, giving
> only --memory="300m" configures 300MB of memory space and **600MB of swap
> space**.

The same spot in the docs puts it this way.

> If `--memory-swap` is unset, and `--memory` is set, the container can use **as
> much swap as the `--memory` setting**, if the host has swap memory configured.
> For instance, if `--memory="300m"` and `--memory-swap` is not set, the container
> can use **600m in total** of memory and swap.

**The "twice" attaches somewhere else.** What doubles is the **total** of memory
plus swap; swap itself is the same size as `--memory`.

| | The clipping | The docs |
| --- | --- | --- |
| Memory | 300m | 300m |
| Swap | **600m** | 300m |
| Total | 900m | **600m** |

A 300MB difference. Set the memory limit at 300m while budgeting "worst case 900MB"
and the arithmetic for how many fit on one box is off. And swap is disk, so **what
overflows isn't memory but disk space.**

The extra condition in the docs' sentence is worth noting too — **"if the host has
swap memory configured."** With no swap on the host, every swap option is
meaningless. Cloud instances often ship with swap off these days, and then
`--memory` alone carries meaning.

## The Period Default Is 100 Milliseconds, Not 1 Second

The CPU side. Here's the clipping's `--cpu-period` description.

> It means the CPU CFS scheduler Period, used together with the --cpu-quota option.
> **The default value is 1 second**, expressed in microseconds.

The docs write one tenth of that.

> **`--cpu-period=<value>`** — Specify the CPU CFS scheduler period, which is used
> alongside `--cpu-quota`. **Defaults to 100000 microseconds (100 milliseconds).**

The kernel-side docs agree. CFS bandwidth control's `cpu.cfs_period_us` **defaults
to 100ms**, and cgroup v2's `cpu.max` defaults to **`max 100000`** — the second
number is the period.

What's interesting is that "1 second" really does exist in this system. Just not as
the default — as the **upper bound.** The kernel docs put the period's range at 1ms
to 1 second. The ceiling ended up in the default's slot.

And this error **contradicts the clipping's own examples.** The same post cites
numbers in two places.

```bash
# The post's example 1 — CPU 50%
$ sudo docker run -it --cpu-period="100000" --cpu-quota="50000" ubuntu /bin/bash
```

> --cpus="1.5" has the same meaning as giving --cpu-period="100000" and
> --cpu-quota="150000" at once.

Both examples use `100000` for the period. If that were 1 second then `--cpus=1.5`
would mean using 1.5 seconds within 1 second — whereas in microseconds, `100000`
is 0.1 seconds. **The examples are right and the description is wrong.**

Touching the period directly is rare in practice. The docs say to go with `--cpus`
alone, and the clipping copies that across. But **there is one place you need to
know the period is 100ms** — the throttling interval. `--cpus=0.5` doesn't mean
"always half a CPU," it means **50ms of every 100ms, stopped for the other 50ms.**
A 50ms sawtooth can appear in your response times. Believe it's 1 second and you
mispredict that sawtooth's period by a factor of ten.

| Setting | CPU time allowed per period (100ms) |
| --- | --- |
| `--cpus=0.5` | 50ms |
| `--cpus=1` | 100ms |
| `--cpus=1.5` | 150ms (spread across two cores) |
| `--cpus=2` | 200ms |

## What Disappeared in Nine Years, and What Will

It's a 2017 post. One option in its table **no longer exists.**

The clipping's memory table has `--kernel-memory`.

> Limits the amount of kernel memory a container can use. The minimum value is 4m
> (4 megabytes).

Docker's deprecation list has this entry — **deprecated in v26.0, removed in
v27.0.** Type `docker run --kernel-memory=...` today and you get an unknown-option
error. It isn't in the `docker run` reference's option table either.

The minimum changed too. The clipping puts `--memory`'s minimum at 4m; the current
docs differ.

> **`-m` or `--memory=`** — The maximum amount of memory the container can use.
> If you set this option, the minimum allowed value is **`6m`** (6 megabytes).

And a bigger change is under way. **cgroup v1 support was deprecated in v29.0.**
This whole post is written in cgroup v1-era vocabulary — the CFS scheduler,
`--cpu-period`, `--cpu-shares` are names from that side.

Under cgroup v2 the kernel-side files and values are different.

| What the clipping sets | What the kernel sees under cgroup v2 |
| --- | --- |
| `--cpus=0.5` | `cpu.max` = `50000 100000` |
| `--cpu-shares=2048` | `cpu.weight` (default 100, range 1–10000) |
| `--memory=300m` | `memory.max` |
| `--memory-swap=1g` | `memory.swap.max` |

The last row differs most. Docker's `--memory-swap` is **"memory plus swap,"**
while cgroup v2's `memory.swap.max` is **swap alone.**

> **`--memory-swap`** — Swap limit equal to memory **plus** swap

> **memory.swap.max** — **Swap** usage hard limit.

So give `--memory=300m --memory-swap=1g` and read `memory.swap.max` inside the
container and you should see not `1g` but **700m.** Docker converts before writing
it. I couldn't confirm that conversion itself in the docs, so this is an inference
stitched from the two definitions. How to check it is below.

`--cpu-shares` doesn't pass its number through either. Docker's default is 1024
while cgroup v2's `cpu.weight` defaults to 100 with a range of 1–10000. **The
number I write and the number the kernel sees are different.** Thinking in ratios
is enough, but it's worth knowing so the numbers not matching doesn't startle you
when you look at the kernel files directly.

## Where and Why You'd Use It

### Putting Limits on a DB Container

The command for the setup from [the earlier post](/posts/docker-build-and-run/) —
game server and DB on one PC, only the DB in a container.

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

The reason for each line.

| Option | Why |
| --- | --- |
| `--memory=2g` | Hard limit. Go past it and a process inside the container dies |
| `--memory-swap=2g` | **Equal** to `--memory`, which turns swap off. A DB dropping to disk is a slowdown you'd miss |
| `--memory-reservation=1g` | Soft limit. Normally it may exceed this, and gets squeezed to 1g only when the host is tight |
| `--cpus=1.5` | Keeps cores in reserve for the server side |
| `--restart=unless-stopped` | It comes back after dying to an OOM |

Giving `--memory-swap` the same value as `--memory` is the point. For a DB, swap
mostly works **to hide a fault** — short on memory and it merely gets slow, while
monitoring reads "alive." Dying and coming back makes the cause visible.

That `--memory-reservation` must be smaller than `--memory` is the docs' condition.

> **`--memory-reservation`** — Allows you to specify a soft limit **smaller than
> `--memory`** which is activated when Docker detects contention or low memory on
> the host machine.

In Compose the key names change. And **which set of keys you use decides whether
you can turn swap off.**

```yaml
services:
  game-db:
    image: postgres:17
    restart: unless-stopped
    volumes:
      - game-db-data:/var/lib/postgresql/data

    # Service-level keys. memswap_limit corresponds to --memory-swap.
    cpus: "1.5"
    mem_limit: 2g
    memswap_limit: 2g   # equal to mem_limit, which turns swap off
    mem_reservation: 1g

volumes:
  game-db-data:
```

You can write it under `deploy.resources` too, but there's **no key there for
swap.**

```yaml
services:
  game-db:
    image: postgres:17
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 2g      # corresponds to --memory
        reservations:
          memory: 1g      # corresponds to --memory-reservation
    # Swap can't be set here. Use memswap_limit above if you need it.
```

Here's how the keys in the Compose Specification line up.

| `docker run` | Compose service key | `deploy.resources` |
| --- | --- | --- |
| `--memory` | `mem_limit` | `limits.memory` |
| `--memory-swap` | `memswap_limit` | **none** |
| `--memory-reservation` | `mem_reservation` | `reservations.memory` |
| `--memory-swappiness` | `mem_swappiness` | none |
| `--cpus` | `cpus` | `limits.cpus` |
| `--cpu-shares` | `cpu_shares` | none |
| `--cpuset-cpus` | `cpuset` | none |
| `--oom-kill-disable` | `oom_kill_disable` | none |

There's also a way to stop having to think about swap at all — **turn swap off on
the host.** The docs' condition from earlier guarantees it. Swap options only carry
meaning "if the host has swap memory configured."

### Checking the Values That Landed

Don't believe you set a limit — look. You can look at three layers.

```bash
# Layer 1: the values I gave. They sit in HostConfig as written.
docker inspect game-db \
  --format '{{.HostConfig.Memory}} {{.HostConfig.MemorySwap}} {{.HostConfig.NanoCpus}}'
```

```bash
# Layer 2: what the kernel sees. Read the cgroup v2 interface files inside the container.
docker exec game-db sh -c '
  echo "memory.max      : $(cat /sys/fs/cgroup/memory.max)"
  echo "memory.swap.max : $(cat /sys/fs/cgroup/memory.swap.max)"
  echo "cpu.max         : $(cat /sys/fs/cgroup/cpu.max)"
'
```

```bash
# Layer 3: actual usage. See whether it's pinned against the limit.
docker stats --no-stream game-db
```

Layer 2 is the check deferred from the previous section. Give
`--memory-swap=2g --memory=2g` and `memory.swap.max` should read `0`; give
`--memory-swap=1g --memory=300m` and it should read the bytes for `700m`. **The
number in the CLI differing from the number in the kernel file is normal.**

Check the cgroup version itself too. A different path means v1.

```bash
# version=2 means cgroup v2. The driver is cgroupfs or systemd regardless of version.
docker info --format 'driver={{.CgroupDriver}} version={{.CgroupVersion}}'
```

On v1 the file paths are over at
`/sys/fs/cgroup/memory/memory.limit_in_bytes` and the layer-2 command above comes
back empty. **Since v1 support was deprecated in v29.0**, still being on v1 is
itself something to handle.

### Where Not to Use It

**Using `--cpuset-cpus` to raise performance.** The clipping's description is right
— it pins which cores to use. But this is **an isolation tool, not a performance
tool.** `--cpus=1.5` means "1.5 CPUs' worth from any core" and the scheduler moves
things around. `--cpuset-cpus="0,2"` nails it to those two, so when they're busy it
can't use an idle core. Unless you need pinning for something like cache locality,
`--cpus` is the right one.

**Turning on `--oom-kill-disable` without `--memory`.** The clipping puts this
option in its table and ends with "useful in certain situations." The docs attach a
condition.

> only disable the OOM killer on containers where you have **also set the
> `-m`/`--memory` option**

Disable the OOM killer with no limit and the container eats the host's memory until
**the kernel kills some other process on the host.** An option switched on to keep a
container alive takes the host down. And on cgroup v2 this option is heading toward
not working at all.

**`--kernel-memory`.** Removed in v27.0. Follow the 2017 post as written and you
stop here.

**"Solving" a memory leak by setting a limit.** `--memory` doesn't stop a leak — it
**shrinks the leak's blast radius to one container.** Pair it with `--restart` and
you get a shape that survives on periodic restarts, which buys time rather than
fixing anything. And if the volume setup from
[the earlier post](/posts/docker-build-and-run/) isn't in place, every one of those
restarts takes the data with it.

## Wrapping Up

This post is useful as a table. Which options exist on the CPU side and the memory
side, and how soft limit and hard limit divide, fit on one screen, and the framing —
"you have to prevent one container monopolizing the host" — is accurate.

Three spots snag if you copy from it. **`--memory-swap=0` and
`--memory-swap=--memory` are written as the same thing, and they're exact
opposites** — 0 is treated as unset and switches on `--memory` worth of swap; the
equal value switches swap off. The example for the unset case also writes swap at
double — what doubles is the total, and swap is the same size as `--memory`. And
`--cpu-period`'s default is given as 1 second when it's **100 milliseconds.** One
second isn't the default; it's the ceiling the kernel allows.

The first of the three is the quietest. Pass 0 meaning to turn swap off and swap
comes on, and the container, past its limit, **gets slow instead of dying.** No
alarm fires and only the response times grow.

Over nine years `--kernel-memory` was removed in v27.0, `--memory`'s minimum went
from 4m to 6m, and the cgroup v1 the whole post presumes was deprecated in v29.0.
The table's skeleton survives, but **the numbers and the names are from back
then.**

---

### References

- [Resource constraints — Docker Docs](https://docs.docker.com/engine/containers/resource_constraints/)
- [docker container run reference — Docker Docs](https://docs.docker.com/reference/cli/docker/container/run/)
- [Compose file services reference — Docker Docs](https://docs.docker.com/reference/compose-file/services/)
- [Deprecated Engine features — Docker Docs](https://docs.docker.com/engine/deprecated/)
- [CFS Bandwidth Control — Linux kernel docs](https://docs.kernel.org/scheduler/sched-bwc.html)
- [Control Group v2 — Linux kernel docs](https://docs.kernel.org/admin-guide/cgroup-v2.html)

The starting point for this post was [안지니어 — 도커 (Docker) 컨테이너 자원의 제한, 쿼터 설정하기](https://m.blog.naver.com/finway/220994619068)
(2017-05-02). I followed its option tables line by line, checking the swap rules,
the CFS period default and the items removed or deprecated since against the
current Docker docs and the Linux kernel docs.
