---
pubDatetime: 2026-09-04T16:00:00+09:00
title: "Revisiting Docker Build and Run: The Dot in `docker build .` Isn't the Dockerfile Path"
lang: en
translationKey: docker-build-and-run
featured: false
draft: false
tags:
  - Docker
  - Container
  - Node.js
  - Infrastructure
  - DevOps
description: "A post I clipped while trying to isolate a database in a container. What the dot in `docker build .` actually is, why the example Dockerfile won't run as written, and what you actually need when the thing you're containerising is a database."
---

On a multiplayer game project I wanted the database on the same PC as the game
server. Installing it straight onto the same OS felt wrong, though, so I wanted
**the database isolated in a container with the server connecting to it**.
Looking for how to run a database on Docker, I clipped
[this post](https://log4day.tistory.com/66). It walks the basic loop with a
Node.js example — write a Dockerfile → `build` → `run` → `ps` → `stop` — which
is a good order for picking Docker up.

Checking it against the docs, though, a few things came up. One is **an
argument described incorrectly**, and the other is that **the example
Dockerfile won't run as written**. Both are the kind of thing that costs you
later if it sets wrong early. And what I actually came for — running a database
in a container — is outside this post's scope, so I've put that at the end.

## Table of contents

## The flow the original lays out

The order it follows:

1. **Write a Dockerfile** — `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`
2. **`docker build`** — create the image
3. **`docker run -p 3000:80 [image ID]`** — create and start a container
4. **`docker ps`** — check what's running
5. **`docker stop [container name]`** — stop it

That skeleton still holds. Its explanations that `RUN` and `CMD` fire at
different times (build vs container start), that `EXPOSE` doesn't actually open
a port and is closer to documentation, and the difference between `run` and
`start` — all correct.

The details are where it goes wrong.

## What the dot in `docker build .` is

The original says:

> 빌드 명령어는 **docker build \[ 도커 파일 경로 \]** 다.
>
> (The build command is **docker build \[Dockerfile path\]**.)

**That argument is not the Dockerfile path.** The official CLI reference
defines it as:

> `docker buildx build [OPTIONS] PATH | URL | -`

`PATH` here is the **build context** — the directory handed over to the builder
in its entirety. Where the Dockerfile lives is a separate option.

> `-f, --file` — Name of the Dockerfile (default: `PATH/Dockerfile`)

So `docker build .` doesn't mean "build the Dockerfile in the current
directory." It means **"send the whole current directory as the build context,
and use the `Dockerfile` inside it."** Because the default is
`PATH/Dockerfile`, both readings land on the same file, which is what makes
this easy to conflate.

### Which is why you need `.dockerignore`

The distinction bites immediately. Pass `.` and **every file in that directory
is transferred to the builder** — `node_modules`, `.git`, your local `.env`,
build output, all of it. On a large project you're shipping hundreds of
megabytes before the build even starts, and if `.env` slips in, your image now
contains credentials.

Hence `.dockerignore`. Docker's official Node.js guide lists entries like
`node_modules/`, `dist/`, `.env`, `.git`, `.DS_Store`, `npm-debug.log*` and
`coverage/`, with the purpose stated as:

> keep unwanted files out of the build context

```dockerignore
node_modules
dist
.git
.env
npm-debug.log*
```

That the original has no `.dockerignore` at all comes, I think, from the same
root as the first sentence. Read `.` as "the Dockerfile path" and you have no
reason to think about what gets transferred.

## The file doesn't have to be called Dockerfile

The original's warning:

> 도커 파일 이름은 Dockerfile 혹은 dockerfile 이다. ... docker_file, dockerFile
> 이라고 명시하면 에러가 발생한다.
>
> (The Docker file is named Dockerfile or dockerfile. ... naming it docker_file
> or dockerFile causes an error.)

True of the default behaviour, but that isn't the rule — because of the `-f`
option above.

```bash
docker build -f docker/api.Dockerfile -t myapp:1.0 .
```

This comes up often in practice: building separate API, worker and development
images from one repository, or collecting Dockerfiles under `docker/`. The
accurate statement is not "rename it and you get an error" but **"rename it and
you have to point `-f` at it."**

## The example Dockerfile won't actually run

The original's Dockerfile:

```dockerfile
FROM node
WORKDIR /app
COPY package.json /app
RUN npm install
EXPOSE 80
CMD ["node", "server.js"]
```

**There's no step that puts the source code into the image.** The only `COPY`
is `package.json`, yet `CMD` runs `server.js`. Build and run this as-is and the
container dies immediately with `Cannot find module '/app/server.js'`.

What's missing is one copy line.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 80
CMD ["node", "server.js"]
```

The interesting part is that the original **knew this pattern.** Its own
comment says:

> 빌드 시, Layer 캐싱 활용 (소스코드만 변경될 경우 저장된 캐시 사용)
>
> (Uses layer caching at build time — when only source code changes, the cached
> layer is reused.)

Copying `package.json` first, running `npm install`, then copying the source is
exactly that caching trick: change only the source and the dependency-install
layer comes from cache. Docker's official Node.js guide gives the same reason.

> install dependencies as a separate step to take advantage of Docker's
> caching

**The prose assumes two stages and only the first survives in the code.** The
second `COPY` looks like it was lost in editing.

### The build log doesn't match the Dockerfile either

The build log attached to the post supports that guess.

```text
 => [internal] load metadata for docker.io/library/node:14
 => [3/5] COPY package.json .
 => [4/5] RUN npm install
 => [5/5] COPY package.json /app
```

The Dockerfile says `FROM node` while the log pulls `node:14`, and `COPY`
appears twice with `package.json` both times. **The log and the Dockerfile came
from different versions.** My guess is the second `COPY` was originally the
source copy and got overwritten with `package.json` during editing.

One more small thing: `docuer run` in the run examples is a typo for
`docker run`. It appears twice.

## Tag it and you'll never copy a sha256 again

Follow the original's flow and you're eyeballing
`sha256:19d66bf50e25...` at the end of the build log, copying its first few
characters into `docker run`, then running `docker ps` to find a random name
like `vigorous_feynman` to feed to `docker stop`.

Two options make all of that go away.

```bash
docker build -t myapp:1.0 .
docker run -d --name myapp -p 3000:80 myapp:1.0
docker stop myapp
```

- `-t` — names and tags the image. The format is
  `[registry/]repository[:tag]`.
- `--name` — sets the container name yourself. Omit it and Docker generates a
  random one. The original's "the Docker engine generates it randomly" is
  correct, but that's the default when you don't supply a name.

Also, `docker stop` accepts **a container ID as well as a name.** The
original's "you have to pass the container name, not the image ID" is right in
spirit — distinguish images from containers — but shouldn't be read as
name-only.

## The problem with `FROM node`

The original explains:

> **FROM**: the container runtime environment (if you don't specify a version,
> the latest is used, e.g. FROM node:14)

The behaviour is described correctly — omit the tag and you get `:latest`. The
problem is that **it breaks reproducible builds.** The image you build today
and the one you build in six months run different Node versions, and this is
where the class of bug that only appears in CI comes from. Pin the tag.

And the `node:14` given as the example **reached end of life on 30 April
2023.** The post is from February 2023, so it had two months left even then.
Follow this example today and you start on an EOL image.

Docker's official guide pins the major version *and* the base distribution, as
in `node:24-alpine3.23`. Going Alpine also makes the image far smaller.

## What else to add today

Outside the original's scope, but these follow as soon as you take the
Dockerfile toward deployment.

- **Run as a non-root user** — the official Node images already have a `node`
  user, and Docker's guide transfers ownership with
  `COPY --chown=node:node`. The fewer processes running as root in the
  container, the better.
- **`npm ci` instead of `npm install`** — installs strictly from the lock file,
  so every build gets the same dependency tree. If reproducibility is the goal,
  this is the one.
- **Multi-stage builds** — keep build tooling and dev dependencies in a build
  stage and copy only what's needed to run into the final image. Image size and
  attack surface shrink together.
- **`--platform`** — bites when you build on Apple Silicon and deploy to x86
  servers. Specify it when the build machine and the run machine differ.

## What you need for a database in a container isn't here

Back to what I came for: this post was, in fact, **the wrong half.** Building
an image from a Dockerfile is what you do to package *your own application*.
Running a database is the other direction — **you don't build an image, you run
an existing official one.** No Dockerfile involved.

What matters instead is everything this post doesn't cover.

### Without a volume the data is gone

First things first. The official wording:

> A volume's contents exist outside the lifecycle of a given container. When a
> container is destroyed, the writable layer is destroyed with it.

> Volumes are the preferred mechanism for persisting data generated by and used
> by Docker containers.

Remove the container and the data written inside it goes with it. Recreating a
container to move to a new image version or change a setting is routine — and
if you were running a database without a volume, that's the moment the data
disappears.

```bash
docker run -v pgdata:/var/lib/postgresql/data postgres:17
```

### `-p 3306:3306` is not the isolation I wanted

This is exactly where my motivation and the default behaviour diverge. **I
wanted the database in a container for isolation, and publishing the port the
way the original does goes the other way.**

Omit the host IP, as in the original's `-p 3000:80`, and the port opens on
every interface on the host. A database that only the server on the same PC
needs to reach is now exposed to the whole network.

Worse, the firewall won't stop it. Docker's documentation says so directly.

> When you publish a container's ports using Docker, traffic to and from that
> container gets diverted before it goes through the ufw firewall settings.
> Docker routes container traffic in the `nat` table, which means that packets
> are diverted before it reaches the `INPUT` and `OUTPUT` chains that ufw uses.

> Packets are routed before the firewall rules can be applied, effectively
> ignoring your firewall configuration.

So "the firewall blocks it, we're fine" doesn't hold. The fix is to **state the
bind address**.

```bash
docker run -p 127.0.0.1:3306:3306 mysql:8
```

The official docs give exactly this form for restricting access to the host.

> docker run -p 127.0.0.1:8080:80 -p '[::1]:8080:80' nginx

A step further: **if the server is containerised too, you don't need to publish
the port at all.** Put both containers on a user-defined network and they find
each other by container name, with the database port never exposed on the host.

### Passing passwords on the command line

Database images usually take the initial password as an environment variable.
Pass it with `-e MYSQL_ROOT_PASSWORD=...` and that value stays in the
container's metadata. You can check for yourself:

```bash
docker inspect <container> --format '{{.Config.Env}}'
```

It also stays in your shell history. Passing it via a file or using secrets is
the better route.

## Docker Desktop is only conditionally free

The original opens with:

> PC에 도커 데스크탑(Docker Desktop)이 설치되어 있는지 확인하자.
>
> (Check that Docker Desktop is installed on your PC.)

Fine for personal learning, but there are conditions at work. Docker's licence
documentation sets the free scope as:

- Personal use, education, non-commercial open source
- **Small businesses** — "fewer than 250 employees AND less than $10 million in
  annual revenue"

Organisations past that need a paid subscription for professional use. And
Docker Desktop isn't the only route: on Linux you can install Docker Engine
alone, and without a GUI everything here works from the `docker` CLI.

## Summary

- The `.` in `docker build .` is the **build context**, not the Dockerfile
  path. `-f` sets where the Dockerfile is.
- Because the whole context is transferred, you need `.dockerignore` to keep
  `node_modules`, `.git` and `.env` out of the image.
- The file doesn't have to be named `Dockerfile`; that's just the default, and
  `-f` overrides it.
- The original's example Dockerfile **never copies the source code**, so it
  won't run. `COPY . .` is missing, and the attached build log doesn't match
  the Dockerfile either.
- `-t` and `--name` save you from hunting sha256 digests and random names.
- Omitting the tag as in `FROM node` breaks reproducibility, and the `node:14`
  used as the example went EOL on 30 April 2023.
- Docker Desktop is free only up to organisations under 250 employees and under
  $10M annual revenue.
- Running a database in a container is the opposite job to this post. You run an
  official image rather than building one, and **volumes, bind address and
  password handling** become what matters.
- `-p 3306:3306` opens the port on every host interface, and published ports
  bypass host firewall rules. For same-PC access only, state the bind address:
  `-p 127.0.0.1:3306:3306`.

## References

- [docker buildx build — Docker Docs](https://docs.docker.com/reference/cli/docker/buildx/build/)
- [Containerize a Node.js application — Docker Docs](https://docs.docker.com/guides/nodejs/containerize/)
- [Docker Desktop license agreement — Docker Docs](https://docs.docker.com/subscription/desktop-license/)
- [Volumes — Docker Docs](https://docs.docker.com/engine/storage/volumes/)
- [Publishing ports — Docker Docs](https://docs.docker.com/engine/network/port-publishing/)
- [Packet filtering and firewalls — Docker Docs](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Node.js End-of-Life releases](https://nodejs.org/en/about/previous-releases)
- Original (Korean): [\[Docker\] 도커(docker) 빌드(build) 및 실행(run)하기 - Dockerfile](https://log4day.tistory.com/66)
