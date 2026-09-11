---
pubDatetime: 2026-09-11T14:00:00+09:00
title: "ident가 아니라 peer다"
lang: ko
translationKey: postgresql-ubuntu-install
featured: false
draft: false
tags:
  - PostgreSQL
  - Ubuntu
  - 데이터베이스
  - SQL
  - 리눅스
description: "우분투에 PostgreSQL을 설치하는 2021년 글을 확인했다. 이 글대로 나오는 12는 2024년에 수명이 끝났고, 인증 방식 설명은 처음부터 한 단어가 어긋나 있었다."
---

우분투에 DB를 올려야 했고, SQL 계열 중에 PostgreSQL로 정하고 나서 설치하고
쓰는 법을 찾아보던 중이었다. 그러다 설치부터 프롬프트에 들어가는 데까지를
정리한 [글](https://sehyeona.tistory.com/7)을 스크랩해뒀었다. `apt`로 설치하고,
프로세스를 확인하고, `psql`이 왜 안 붙는지까지 짚어가는 구성이라 처음
해보는 사람이 따라가기 좋다.

2021년 11월 글이다. **4년 10개월**이 지났다. 확인해보니 두 종류의 문제가
있었다. **시간이 지나서 어긋난 것**과, **처음부터 어긋나 있던 것**이다.
뒤쪽이 더 중요하다.

## 목차

## 이 글대로 설치하면 나오는 버전

원문은 Ubuntu 20.04를 대상으로 한다. 설치 로그에 이런 줄이 나온다.

> Success. You can now start the database server using:
>
>     **pg_ctlcluster 12 main start**

프로세스 확인 결과에도 경로가 `/usr/lib/postgresql/12/bin/postgres`로 찍힌다.
**PostgreSQL 12**다. 우분투는 릴리스마다 버전을 하나 고정해서 그 릴리스
수명 내내 그것만 지원한다.

| 우분투 | 기본 PostgreSQL | PostgreSQL 지원 종료 |
| --- | --- | --- |
| 20.04 LTS | **12** | **2024-11-21 (종료)** |
| 22.04 LTS | 14 | **2026-11-12** |
| 24.04 LTS | 16 | 2028-11-09 |
| 25.10 | 17 | 2029-11-08 |
| 26.04 LTS | 18 | 2030-11-14 |

**PostgreSQL 12는 2024년 11월 21일에 수명이 끝났다.** 그리고 Ubuntu 20.04도
2025년 5월에 표준 지원이 끝나 지금은 Ubuntu Pro의 ESM 구간에 있다. 원문이
전제하는 조합이 양쪽 다 지나간 셈이다.

여기서 더 급한 건 한 줄 아래다. **Ubuntu 22.04의 기본값인 PostgreSQL 14는
2026년 11월 12일에 끝난다.** 지금부터 두 달이다. 22.04에서 배포판 기본
패키지로 돌리고 있다면 계획이 필요한 시점이다.

## ident가 아니라 peer다

이건 시간 문제가 아니다. 원문 2절의 첫 문단이다.

> postgres 가 설치 될때, postgres 는 **ident authentication** 을 사용하도록
> 세팅됩니다. 이렇게 세팅됨으로서 postgres 는 운영체제의 계정과 연동됩니다.

설명하려는 동작은 맞다. 운영체제 계정 이름으로 인증된다. 그런데 **그 동작의
이름이 `ident`가 아니다.** PostgreSQL 문서가 둘을 이렇게 가른다.

| | 문서의 정의 |
| --- | --- |
| `peer` | "Obtain the client's operating system user name **from the operating system** ... This is only available for **local connections**." |
| `ident` | "Obtain the operating system user name of the client by **contacting the ident server on the client** ... can only be used on **TCP/IP connections**." |

**같은 목적에 방법과 적용 범위가 다르다.** `peer`는 커널에게 유닉스 소켓
반대편이 누구인지 묻고, `ident`는 클라이언트 쪽 ident 서버에 네트워크로
물어본다. 그래서 `ident`는 TCP 연결 전용이다.

문서는 한 문장을 더 붙여둔다.

> When specified for local connections, **peer authentication will be used
> instead.**

로컬에 `ident`라고 적어놔도 실제로는 `peer`가 돈다는 뜻이다. 원문의 서술이
결과적으로 틀린 동작을 설명하지 않는 이유가 이것이다. 그래도 이름은 틀렸다.

우분투 공식 문서는 아예 못 박아둔다.

> In Ubuntu, **`peer` is the default authentication method used for `local`
> connections**, while `scram-sha-256` is the default for `host` connections.

이름을 바로 아는 게 왜 중요하냐면, **`pg_hba.conf`를 열었을 때 찾을 단어가
다르기 때문**이다. `local ... peer`라고 적힌 줄을 고쳐야 하는데 `ident`를
찾고 있으면 거기서 막힌다. 그리고 원격 접속을 붙일 때 `ident`로 바꾸면 전혀
다른 것(클라이언트 쪽 ident 서버)을 요구하게 된다.

## role을 만들어도 우분투 계정은 안 생긴다

같은 문단이 이어서 이렇게 말한다.

> 즉 postgres 에서 A 라는 새로운 role 을 만들고 A에 (가), (나) 라는 권한을
> 부여한다면, **A 라는 이름의 user 가 ubuntu 에 생성되고**, 우리가 ubuntu 의
> A user 로 로그인하여 postgres 에 접속한다면 (가), (나) 의 권한을 사용할 수
> 있습니다.

**방향이 반대다.** `peer`의 정의가 그대로 답이다.

> ...and **check if it matches** the requested database user name.

**확인할 뿐 만들지 않는다.** PostgreSQL이 운영체제 계정을 생성하는 일은
없다. 그러니 실제로 필요한 건 이 순서다 — 우분투 계정을 만들고, 같은 이름의
PostgreSQL role을 만들고, 그 계정으로 로그인해서 붙는다. **두 개를 따로
만들어야 하고, 이름이 같아야 한다.**

이 오해는 실제로 막히는 자리로 이어진다. `CREATE ROLE myapp`만 해두고
`sudo -u myapp psql`을 치면 우분투가 `myapp`이라는 사용자를 모른다.

원문이 근거로 든 설치 로그 한 줄도 다시 볼 만하다.

> Adding user postgres to group ssl-cert

`postgres` 사용자를 `ssl-cert` **그룹에 넣는다**는 줄이지, 사용자를 만든다는
줄이 아니다. `postgres` OS 계정이 패키지 설치 과정에서 생기는 건 맞지만
증거가 이 줄은 아니고, 원문이 바로 다음에 제시하는 `/etc/passwd` 확인이
제대로 된 확인이다.

```bash
cut -f1 -d: /etc/passwd | grep postgres
```

## `postgresql-contrib`는 이제 안 적어도 된다

원문의 설치 명령이다.

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

우분투 서버 공식 문서의 현재 안내는 한 줄이다.

```bash
sudo apt install postgresql
```

`postgresql-contrib` 패키지가 사라진 건 아니다. 24.04에도 있고 설명이
"additional facilities for PostgreSQL (supported version)"인 **버전 추종
메타패키지**다. 다만 의존 관계가 `postgresql-contrib-16`을 향하고, 그건
`postgresql-16`이 제공하는 가상 패키지라서 **`postgresql`만 깔아도 contrib
모듈이 따라온다.** 적어서 손해는 없지만 필요해서 적는 줄은 아니게 됐다.

원문이 contrib를 설명하며 든 `pg_stat_statements`, `pgrowlocks`, `pgcrypto`는
지금도 그대로 들어 있다.

## 버전을 고르고 싶다면

위 표의 구조가 곧 제약이다. 배포판 패키지를 쓰면 **우분투 릴리스가 버전을
정한다.** PostgreSQL 공식 다운로드 페이지가 그 성질을 그대로 적어뒀다.

> Ubuntu "snapshots" a specific version of PostgreSQL that is then supported
> throughout the lifetime of that Ubuntu version. If the version included in
> your version of Ubuntu is not the one you want, you can use the PostgreSQL
> Apt Repository.

그래서 22.04에서 14가 아닌 걸 쓰고 싶거나, 반대로 릴리스를 올리지 않고
PostgreSQL만 최신으로 유지하고 싶으면 PGDG 저장소를 붙인다.

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
```

지원 대상은 26.10, 26.04 LTS, 24.04 LTS, 22.04 LTS다. 20.04는 목록에 없다.

## 그래도 그대로인 것

바뀐 건 버전과 용어고, 절차를 설명하는 방식 자체는 지금도 쓸 만하다.

**`psql`이 왜 안 붙는지 짚는 방식.** 원문은 그냥 `psql`을 쳐서
`role "sehyeona" does not exist`를 받아본 뒤 이유를 설명한다. `peer`가
운영체제 계정 이름을 그대로 role 이름으로 요구한다는 걸 에러로 먼저 보여주는
순서라, 개념을 먼저 늘어놓는 것보다 남는다.

**두 가지 접속 방법의 차이.** 계정을 바꾼 뒤 붙는 방법과 한 줄로 붙는 방법을
나란히 둔 것도 좋다.

```bash
# 셸을 postgres로 바꾼 뒤 붙기
sudo -i -u postgres
psql

# 셸을 거치지 않고 바로 붙기
sudo -u postgres psql
```

**클러스터 개념과 `pg_ctlcluster`.** 클러스터 > 데이터베이스 > 테이블 순서로
설명한 것, 그리고 데비안 계열이 버전·클러스터를 여러 개 굴리기 위해
`pg_ctlcluster`를 둔다는 설명도 그대로 유효하다. 위 표처럼 버전이 갈리는
구조에서는 오히려 지금 더 필요한 지식이다.

**`ps -ef | grep postgres`와 `pstree`로 프로세스 구조 보기.** 부모 프로세스
하나에 logger·checkpointer·autovacuum 같은 백그라운드 프로세스가 딸린다는
그림은 버전과 무관하다.

## 정리

- 원문대로 설치하면 나오는 **PostgreSQL 12는 2024년 11월 21일에 지원이
  끝났다.** Ubuntu 20.04도 2025년 5월에 표준 지원이 끝났다.
- **Ubuntu 22.04의 기본값인 14는 2026년 11월 12일에 끝난다.** 두 달 남았다.
- **`ident`가 아니라 `peer`다.** `ident`는 TCP 전용이고 클라이언트 쪽 ident
  서버에 물어보는 방식이다. 로컬에 `ident`라고 써도 `peer`가 돈다.
- **role을 만들어도 우분투 계정은 생기지 않는다.** `peer`는 이름이 맞는지
  확인만 한다. 계정과 role을 따로, 같은 이름으로 만들어야 한다.
- **`postgresql-contrib`는 이제 따로 안 적어도 된다.** 우분투 공식 안내는
  `sudo apt install postgresql` 한 줄이다.
- 배포판 패키지는 **릴리스가 버전을 고정한다.** 다른 버전을 쓰려면 PGDG
  저장소를 붙인다.
- **에러를 먼저 보여주고 이유를 설명하는 순서**, 클러스터 개념,
  `pg_ctlcluster`, 프로세스 구조 설명은 그대로 유효하다.

설치 글에서 낡는 건 대개 버전 숫자다. 그건 표 하나로 갱신된다. **정작
오래가는 건 이름이 어긋난 쪽**이었다. `ident`와 `peer`는 4년 전에도 다른
것이었고, 지금도 다르다. 시간이 고쳐주지 않는 종류라 **한 번 잘못 외우면
`pg_hba.conf`를 열 때마다 걸린다.**

설치해서 쓰는 게 목적이었으니 순서를 다시 적어두면 이렇다. **버전은 릴리스가
정하니 먼저 확인하고**(필요하면 PGDG), 설치는 `postgresql` 한 줄이면 되고,
그다음 막히는 자리가 접속이다. 그 한 칸에 적힌 단어가 `peer`라는 것만 알면
`pg_hba.conf`에서 고칠 줄과, 운영체제 계정을 같이 만들어야 한다는 사실이
한꺼번에 따라온다.

## 참고

- [Versioning Policy — PostgreSQL](https://www.postgresql.org/support/versioning/)
- [The pg_hba.conf File — PostgreSQL](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [Install and configure PostgreSQL — Ubuntu Server 문서](https://ubuntu.com/server/docs/how-to/databases/install-postgresql/)
- [Linux downloads (Ubuntu) — PostgreSQL](https://www.postgresql.org/download/linux/ubuntu/)
- [Ubuntu release cycle](https://ubuntu.com/about/release-cycle)
- 원문: [\[PostgreSQL\] ubuntu 에 PostgreSQL 설치](https://sehyeona.tistory.com/7)
