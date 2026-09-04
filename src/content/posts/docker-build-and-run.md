---
pubDatetime: 2026-09-04T16:00:00+09:00
title: "Docker 빌드와 실행 다시 보기: `docker build .`의 점은 Dockerfile 경로가 아니다"
lang: ko
translationKey: docker-build-and-run
featured: false
draft: false
tags:
  - Docker
  - 컨테이너
  - Node.js
  - 인프라
  - DevOps
description: "DB를 컨테이너에 격리해두려고 찾다가 스크랩한 글이다. `docker build .`의 점이 무엇인지, 예제 Dockerfile이 왜 실제로는 실행되지 않는지, 그리고 정작 DB를 올릴 때 필요한 것들은 무엇인지 정리했다."
---

멀티플레이 게임 프로젝트를 하면서 DB를 게임 서버와 같은 PC에 두려고 했다.
다만 같은 OS에 그냥 설치해두는 게 꺼려져서, **DB만 컨테이너로 격리하고 서버가
거기에 붙는 구성**으로 가고 싶었다. 그래서 Docker에 DB를 올리는 방법을 찾다가
[이 글](https://log4day.tistory.com/66)을 스크랩해뒀었다. Node.js 예제로
Dockerfile 작성 → `build` → `run` → `ps` → `stop`까지 한 바퀴 도는 구성이라,
Docker를 처음 잡을 때 보기 좋은 순서다.

그런데 대조해보니 짚을 게 몇 개 나왔다. 하나는 **명령어의 인자를 잘못
설명한 것**이고, 다른 하나는 **예제 Dockerfile이 그대로는 실행되지 않는다**는
것이다. 둘 다 처음 배울 때 그대로 굳으면 나중에 고생하는 종류다. 그리고
정작 내 목적이었던 "DB를 컨테이너에 올리기"에 필요한 것들은 이 글의 범위
밖이라, 그쪽도 뒤에 따로 정리했다.

## 목차

## 원문이 잡은 흐름

원문의 순서는 이렇다.

1. **Dockerfile 작성** — `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`
2. **`docker build`** — 이미지 생성
3. **`docker run -p 3000:80 [이미지 ID]`** — 컨테이너 생성 및 실행
4. **`docker ps`** — 실행 목록 확인
5. **`docker stop [컨테이너 이름]`** — 종료

이 뼈대 자체는 지금도 그대로 유효하다. `RUN`과 `CMD`의 실행 시점이 다르다는
설명(빌드 시점 vs 컨테이너 실행 시점), `EXPOSE`가 실제로 포트를 열지 않고
문서 역할에 가깝다는 설명, `run`과 `start`의 차이 — 전부 맞는 이야기다.

문제는 세부다.

## `docker build .`의 점은 무엇인가

원문은 이렇게 적는다.

> 빌드 명령어는 **docker build \[ 도커 파일 경로 \]** 다.

**이 인자는 Dockerfile 경로가 아니다.** 공식 CLI 레퍼런스의 정의는 이렇다.

> `docker buildx build [OPTIONS] PATH | URL | -`

여기서 `PATH`는 **빌드 컨텍스트(build context)**, 즉 빌더에게 통째로 넘길
디렉터리다. Dockerfile의 위치를 지정하는 건 별도 옵션이다.

> `-f, --file` — Name of the Dockerfile (default: `PATH/Dockerfile`)

즉 `docker build .`는 "현재 디렉터리에 있는 Dockerfile을 빌드하라"가 아니라
**"현재 디렉터리 전체를 빌드 컨텍스트로 넘기고, 그 안의 `Dockerfile`을
쓰라"**는 뜻이다. 기본값이 `PATH/Dockerfile`이라 결과적으로 같은 파일을
가리키게 되니 헷갈리기 쉽다.

### 그래서 `.dockerignore`가 필요하다

이 구분이 실무에서 바로 물린다. `.`을 넘기면 **그 디렉터리의 모든 파일이
빌더로 전송된다.** `node_modules`, `.git`, 로컬 `.env`, 빌드 산출물이 전부
포함된다. 프로젝트가 크면 빌드가 시작되기도 전에 수백 MB를 옮기고 있고,
`.env`가 섞여 들어가면 이미지에 자격 증명이 들어간다.

그래서 `.dockerignore`를 둔다. Docker 공식 Node.js 가이드가 드는 예시는
`node_modules/`, `dist/`, `.env`, `.git`, `.DS_Store`, `npm-debug.log*`,
`coverage/` 같은 항목들이고, 목적을 이렇게 적는다.

> keep unwanted files out of the build context

```dockerignore
node_modules
dist
.git
.env
npm-debug.log*
```

원문에 `.dockerignore`가 아예 없는 건, 첫 문장의 오해와 같은 뿌리라고 본다.
`.`을 "Dockerfile 경로"로 읽으면 무엇이 전송되는지를 생각할 이유가 없다.

## 파일 이름이 반드시 Dockerfile이어야 하는 건 아니다

원문의 주의사항이다.

> 도커 파일 이름은 Dockerfile 혹은 dockerfile 이다. 철자와 대소문자에
> 주의하자. 잘못된 예시로 파일이름으로 docker\_file, dockerFile 이라고 명시하면
> 에러가 발생한다.

기본 동작만 놓고 보면 맞는 말이지만, 규칙 자체가 그렇지는 않다. 위에서 본
`-f` 옵션이 있기 때문이다.

```bash
docker build -f docker/api.Dockerfile -t myapp:1.0 .
```

이건 실무에서 자주 쓴다. 같은 저장소에서 API용·워커용·개발용 이미지를
따로 빌드하거나, Dockerfile들을 `docker/` 아래로 모아두는 경우다.
**"이름을 바꾸면 에러"가 아니라 "이름을 바꾸면 `-f`로 알려줘야 한다"**가
정확한 서술이다.

## 예제 Dockerfile은 그대로는 실행되지 않는다

원문의 Dockerfile을 옮기면 이렇다.

```dockerfile
FROM node
WORKDIR /app
COPY package.json /app
RUN npm install
EXPOSE 80
CMD ["node", "server.js"]
```

**소스 코드를 이미지 안에 넣는 단계가 없다.** `COPY`는 `package.json` 하나
뿐인데 `CMD`는 `server.js`를 실행한다. 이대로 빌드해서 돌리면 컨테이너는
`Cannot find module '/app/server.js'`로 즉시 죽는다.

빠진 건 소스 복사 한 줄이다.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 80
CMD ["node", "server.js"]
```

재밌는 건 원문이 이 패턴을 **알고 있었다는 점**이다. 주석에 이렇게 적혀 있다.

> 빌드 시, Layer 캐싱 활용 (소스코드만 변경될 경우 저장된 캐시 사용)

`package.json`을 먼저 복사하고 `npm install`을 돌린 뒤 소스를 복사하는 이유가
정확히 이 캐싱이다. 소스만 바뀌면 의존성 설치 레이어는 캐시에서 재사용된다.
Docker 공식 Node.js 가이드도 같은 이유를 든다.

> install dependencies as a separate step to take advantage of Docker's
> caching

**설명은 두 단계를 전제하는데 코드에는 첫 단계만 남았다.** 두 번째 `COPY`가
편집 중에 사라진 것으로 보인다.

### 빌드 로그도 Dockerfile과 맞지 않는다

원문에 붙은 빌드 로그를 보면 이 추측이 뒷받침된다.

```text
 => [internal] load metadata for docker.io/library/node:14
 => [3/5] COPY package.json .
 => [4/5] RUN npm install
 => [5/5] COPY package.json /app
```

Dockerfile에는 `FROM node`인데 로그는 `node:14`를 받고 있고, `COPY`가 두 번
찍히는데 둘 다 `package.json`이다. **로그와 Dockerfile이 서로 다른 버전에서
나온 것**이다. 아마 두 번째 `COPY`가 원래 소스 복사였는데 편집 과정에서
`package.json`으로 덮인 게 아닐까 싶다.

작은 것 하나 더. 실행 예제의 `docuer run`은 `docker run` 오타다. 두 번 나온다.

## 태그를 붙이면 sha256을 복사할 일이 없다

원문의 흐름을 보면 빌드 로그 마지막의 `sha256:19d66bf50e25...`를 눈으로 찾아
앞자리를 복사해 `docker run`에 넣는다. 그리고 종료할 때는 `docker ps`로
`vigorous_feynman` 같은 랜덤 이름을 찾아 `docker stop`에 넣는다.

이 번거로움은 옵션 두 개로 사라진다.

```bash
docker build -t myapp:1.0 .
docker run -d --name myapp -p 3000:80 myapp:1.0
docker stop myapp
```

- `-t` — 이미지에 이름과 태그를 붙인다. 형식은 `[registry/]repository[:tag]`다.
- `--name` — 컨테이너 이름을 직접 정한다. 안 주면 도커가 랜덤으로 만든다.
  원문이 "도커 엔진이 랜덤하게 생성한다"고 한 건 맞지만, 그건 이름을 안 줬을
  때의 기본 동작이다.

참고로 `docker stop`은 컨테이너 이름뿐 아니라 **컨테이너 ID로도 받는다.**
원문의 "이미지 ID가 아닌 컨테이너 이름을 옵션으로 전달해줘야 한다"는 이미지와
컨테이너를 구분하라는 취지로는 맞지만, 이름만 받는다는 뜻으로 읽히면 곤란하다.

## `FROM node`의 문제

원문은 이렇게 설명한다.

> **FROM**: 컨테이너 런타임 환경 ( 버전을 명시하지 않으면, 최신 버전을
> 사용한다. 예, FROM node:14 )

동작 설명은 맞다. 태그를 생략하면 `:latest`가 붙는다. 문제는 **그게 재현
가능한 빌드를 깬다**는 것이다. 오늘 빌드한 이미지와 반년 뒤 빌드한 이미지의
Node 버전이 다르고, CI에서만 깨지는 종류의 문제가 여기서 나온다. 태그는
고정하는 게 기본이다.

그리고 예시로 든 `node:14`는 **2023년 4월 30일에 지원이 끝났다.** 원문이
2023년 2월 글이니 그 시점에도 두 달 남은 상태였다. 지금 이 예제를 그대로
따라가면 EOL 이미지로 시작하게 된다.

Docker 공식 가이드가 쓰는 형태를 참고하면 `node:24-alpine3.23`처럼 **메이저
버전과 베이스 배포판까지** 고정한다. Alpine 계열을 쓰면 이미지도 훨씬 작다.

## 지금 기준으로 더 붙일 것

원문 범위 밖이지만, 이 Dockerfile을 실제로 배포까지 가져간다면 따라오는
것들이다.

- **비루트 사용자로 실행** — 공식 Node 이미지에는 `node` 사용자가 이미 있다.
  Docker 가이드의 예제도 `COPY --chown=node:node`로 소유권을 넘긴다. 컨테이너
  안에서 root로 도는 프로세스는 줄일수록 좋다.
- **`npm install` 대신 `npm ci`** — 락 파일 그대로 설치하므로 빌드마다 같은
  의존성 트리가 나온다. 재현성이 목적이라면 이쪽이다.
- **멀티스테이지 빌드** — 빌드 도구와 개발 의존성은 빌드 단계에만 두고,
  최종 이미지에는 실행에 필요한 것만 복사한다. 이미지 크기와 공격 표면이
  같이 줄어든다.
- **`--platform`** — Apple Silicon에서 빌드해 x86 서버에 올릴 때 걸린다.
  빌드한 기계와 돌릴 기계의 아키텍처가 다르면 명시해야 한다.

## DB를 컨테이너에 올릴 때 필요한 건 이 글에 없다

내 목적으로 돌아가면, 사실 이 글은 **필요한 절반이 아니었다.** Dockerfile로
이미지를 빌드하는 건 *내가 만든 애플리케이션*을 컨테이너로 포장할 때 하는
일이다. DB를 올리는 건 반대쪽이다. **이미지를 만들 게 아니라 이미 있는 공식
이미지를 가져다 실행**하면 된다. Dockerfile은 아예 필요 없다.

대신 이 글이 다루지 않는 것들이 전부 중요해진다.

### 볼륨을 안 붙이면 데이터가 사라진다

가장 먼저다. 공식 문서의 표현은 이렇다.

> A volume's contents exist outside the lifecycle of a given container. When a
> container is destroyed, the writable layer is destroyed with it.

> Volumes are the preferred mechanism for persisting data generated by and used
> by Docker containers.

컨테이너를 지우면 그 안에 쓴 데이터도 같이 사라진다. 이미지를 새 버전으로
올리거나 설정을 바꾸려고 컨테이너를 재생성하는 건 흔한 일인데, 볼륨 없이
DB를 돌리고 있었다면 그 순간 데이터가 없어진다.

```bash
docker run -v pgdata:/var/lib/postgresql/data postgres:17
```

### `-p 3306:3306`은 내가 원한 격리가 아니다

여기가 내 동기와 정확히 어긋나는 지점이었다. **보안을 위해 DB를 컨테이너로
분리하려던 건데, 원문 예제처럼 포트를 그냥 publish하면 오히려 반대로 간다.**

원문의 `-p 3000:80`처럼 호스트 IP를 생략하면 그 포트는 호스트의 모든
인터페이스에 열린다. 같은 PC의 서버만 붙으면 되는 DB가 네트워크 전체에
노출되는 것이다.

더 고약한 건 방화벽이 이걸 못 막는다는 점이다. Docker 공식 문서가 직접
설명한다.

> When you publish a container's ports using Docker, traffic to and from that
> container gets diverted before it goes through the ufw firewall settings.
> Docker routes container traffic in the `nat` table, which means that packets
> are diverted before it reaches the `INPUT` and `OUTPUT` chains that ufw uses.

> Packets are routed before the firewall rules can be applied, effectively
> ignoring your firewall configuration.

즉 "방화벽으로 막아뒀으니 괜찮겠지"가 성립하지 않는다. 해결은 **바인딩 주소를
명시**하는 것이다.

```bash
docker run -p 127.0.0.1:3306:3306 mysql:8
```

공식 문서도 호스트에서만 접근하게 하려면 이 형태를 쓰라고 예시를 든다.

> docker run -p 127.0.0.1:8080:80 -p '[::1]:8080:80' nginx

한 걸음 더 가면, **서버도 같이 컨테이너로 올린다면 포트를 publish할 필요조차
없다.** 사용자 정의 네트워크에 두 컨테이너를 넣으면 컨테이너 이름으로 서로를
찾을 수 있고, DB 포트는 호스트에 아예 노출되지 않는다.

### 비밀번호를 명령줄로 넘기는 문제

DB 이미지는 보통 초기 비밀번호를 환경변수로 받는다. 그런데
`-e MYSQL_ROOT_PASSWORD=...`로 넘기면 그 값이 컨테이너 메타데이터에 남는다.
직접 확인해볼 수 있다.

```bash
docker inspect <컨테이너> --format '{{.Config.Env}}'
```

셸 히스토리에도 남는다. 파일로 넘기거나 시크릿 기능을 쓰는 쪽이 낫다.

## Docker Desktop은 조건부 무료다

원문은 시작하면서 이렇게 안내한다.

> PC에 도커 데스크탑(Docker Desktop)이 설치되어 있는지 확인하자.

개인 학습이라면 문제없지만, 회사에서 쓴다면 조건이 붙는다. Docker의 라이선스
문서는 무료 사용 범위를 이렇게 정한다.

- 개인 사용, 교육, 비상업적 오픈소스
- **소규모 사업자** — "fewer than 250 employees AND less than $10 million in
  annual revenue"

이 조건을 넘는 조직에서 업무용으로 쓰면 유료 구독이 필요하다. 그리고
Docker Desktop이 유일한 길도 아니다. Linux에서는 Docker Engine만 설치하면
되고, GUI가 필요 없다면 데스크탑 앱 없이도 `docker` CLI로 전부 할 수 있다.

## 정리

- `docker build .`의 `.`은 **빌드 컨텍스트**다. Dockerfile 경로가 아니다.
  Dockerfile 위치는 `-f`로 지정한다.
- 컨텍스트가 통째로 전송되므로 `.dockerignore`가 필요하다. `node_modules`,
  `.git`, `.env`가 이미지에 섞이는 걸 막는다.
- 파일 이름이 반드시 `Dockerfile`이어야 하는 건 아니다. 기본값일 뿐이고
  `-f`로 바꿀 수 있다.
- 원문의 예제 Dockerfile은 **소스 코드를 복사하지 않아** 그대로는 실행되지
  않는다. `COPY . .`가 빠졌다. 붙어 있는 빌드 로그도 Dockerfile과 맞지 않는다.
- `-t`와 `--name`을 쓰면 sha256과 랜덤 이름을 찾아다닐 일이 없다.
- `FROM node`처럼 태그를 생략하면 재현성이 깨진다. 예시로 든 `node:14`는
  2023년 4월 30일에 EOL이다.
- Docker Desktop은 250명 미만·연 매출 1000만 달러 미만 조직까지만 무료다.
- DB를 컨테이너에 올리는 건 이 글의 반대편 작업이다. 이미지를 빌드할 게 아니라
  공식 이미지를 실행하면 되고, 대신 **볼륨·바인딩 주소·비밀번호 전달**이
  중요해진다.
- `-p 3306:3306`은 호스트의 모든 인터페이스에 포트를 연다. 게다가 publish된
  포트는 호스트 방화벽 규칙을 우회한다. 같은 PC에서만 붙일 거라면
  `-p 127.0.0.1:3306:3306`으로 바인딩 주소를 명시할 것.

## 참고

- [docker buildx build — Docker Docs](https://docs.docker.com/reference/cli/docker/buildx/build/)
- [Containerize a Node.js application — Docker Docs](https://docs.docker.com/guides/nodejs/containerize/)
- [Docker Desktop license agreement — Docker Docs](https://docs.docker.com/subscription/desktop-license/)
- [Volumes — Docker Docs](https://docs.docker.com/engine/storage/volumes/)
- [Publishing ports — Docker Docs](https://docs.docker.com/engine/network/port-publishing/)
- [Packet filtering and firewalls — Docker Docs](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Node.js End-of-Life releases](https://nodejs.org/en/about/previous-releases)
- 원문: [\[Docker\] 도커(docker) 빌드(build) 및 실행(run)하기 - Dockerfile](https://log4day.tistory.com/66)
