---
pubDatetime: 2026-09-11T14:00:00+09:00
title: "It's peer, Not ident"
lang: en
translationKey: postgresql-ubuntu-install
featured: false
draft: false
tags:
  - PostgreSQL
  - Ubuntu
  - Database
  - SQL
  - Linux
description: "I checked a 2021 guide to installing PostgreSQL on Ubuntu. The version it gets you went end-of-life in 2024, and its explanation of authentication had one word wrong from the start."
---

I needed a database on Ubuntu, settled on PostgreSQL among the SQL options, and
went looking for how to install and use it. That's how I saved a
[write-up](https://sehyeona.tistory.com/7) covering everything from
installation to getting into the prompt. Install with `apt`, check the
processes, work out why `psql` won't connect — a shape that's easy to follow
the first time through.

It's from November 2021. **Four years and ten months.** Checking it turned up
two kinds of problem: **what drifted with time**, and **what was off from the
start.** The second kind matters more.

## Table of contents

## The version this guide gets you

The write-up targets Ubuntu 20.04. The install log includes this line:

> Success. You can now start the database server using:
>
>     **pg_ctlcluster 12 main start**

The process check prints the path as `/usr/lib/postgresql/12/bin/postgres` too.
**PostgreSQL 12.** Ubuntu pins one version per release and supports only that
one for the life of the release.

| Ubuntu | Default PostgreSQL | PostgreSQL end of life |
| --- | --- | --- |
| 20.04 LTS | **12** | **2024-11-21 (ended)** |
| 22.04 LTS | 14 | **2026-11-12** |
| 24.04 LTS | 16 | 2028-11-09 |
| 25.10 | 17 | 2029-11-08 |
| 26.04 LTS | 18 | 2030-11-14 |

**PostgreSQL 12 reached end of life on November 21, 2024.** Ubuntu 20.04's
standard support ended in May 2025 and it's now in Ubuntu Pro's ESM window. Both
halves of the combination the write-up assumes have passed.

The more urgent line is the one below it. **PostgreSQL 14, the default on Ubuntu
22.04, ends on November 12, 2026** — two months from now. If you're running the
distribution package on 22.04, that's a plan you need.

## It's peer, not ident

This one isn't about time. From the opening of the write-up's section 2:

> When postgres is installed, postgres is set up to use **ident
> authentication**. Configured this way, postgres ties into operating system
> accounts.

The behavior it's describing is right — you're authenticated by your OS account
name. But **that behavior isn't called `ident`.** The PostgreSQL docs separate
the two:

| | The documentation's definition |
| --- | --- |
| `peer` | "Obtain the client's operating system user name **from the operating system** ... This is only available for **local connections**." |
| `ident` | "Obtain the operating system user name of the client by **contacting the ident server on the client** ... can only be used on **TCP/IP connections**." |

**Same goal, different mechanism and different scope.** `peer` asks the kernel
who's on the other end of the Unix socket; `ident` asks an ident server on the
client, over the network. Which is why `ident` is TCP-only.

The docs add one more sentence:

> When specified for local connections, **peer authentication will be used
> instead.**

Write `ident` on a local line and `peer` is what actually runs. That's why the
write-up's account doesn't end up describing wrong behavior. The name is still
wrong.

Ubuntu's own documentation states it outright:

> In Ubuntu, **`peer` is the default authentication method used for `local`
> connections**, while `scram-sha-256` is the default for `host` connections.

Knowing the right name matters because **it changes what word you're looking for
when you open `pg_hba.conf`.** The line to edit says `local ... peer`, and
you'll stall there hunting for `ident`. Worse, switching it to `ident` when
adding remote access asks for something else entirely — an ident server on the
client.

## Creating a role doesn't create an Ubuntu account

The same paragraph continues:

> That is, if you create a new role A in postgres and grant A permissions (a)
> and (b), **a user named A is created on ubuntu**, and if we log into ubuntu as
> user A and connect to postgres, we can use permissions (a) and (b).

**The direction is reversed.** The definition of `peer` is the answer:

> ...and **check if it matches** the requested database user name.

**It checks; it doesn't create.** PostgreSQL never creates operating system
accounts. So the order you actually need is: create the Ubuntu account, create a
PostgreSQL role with the same name, then log in as that account and connect.
**Two separate things, and the names have to match.**

This misunderstanding leads somewhere concrete. Run `CREATE ROLE myapp` alone
and then `sudo -u myapp psql`, and Ubuntu doesn't know any `myapp`.

The install log line the write-up cites as evidence is worth a second look too.

> Adding user postgres to group ssl-cert

That's a line about putting the `postgres` user **into a group**, not about
creating one. The `postgres` OS account does get created during package
installation — but not by this line. The `/etc/passwd` check the write-up offers
right afterwards is the check that actually shows it.

```bash
cut -f1 -d: /etc/passwd | grep postgres
```

## You no longer need to spell out `postgresql-contrib`

The write-up's install commands:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Ubuntu Server's current documented instruction is one line:

```bash
sudo apt install postgresql
```

The `postgresql-contrib` package hasn't disappeared. It's still in 24.04, a
**version-tracking metapackage** described as "additional facilities for
PostgreSQL (supported version)." But its dependency points at
`postgresql-contrib-16`, a virtual package that `postgresql-16` provides — so
**installing `postgresql` alone brings the contrib modules along.** Spelling it
out costs nothing; it just isn't a line you need any more.

The modules the write-up names to explain contrib — `pg_stat_statements`,
`pgrowlocks`, `pgcrypto` — are all still in there.

## If you want to pick the version

The structure of that table is the constraint. Use distribution packages and
**the Ubuntu release picks your version.** PostgreSQL's download page says so
plainly:

> Ubuntu "snapshots" a specific version of PostgreSQL that is then supported
> throughout the lifetime of that Ubuntu version. If the version included in
> your version of Ubuntu is not the one you want, you can use the PostgreSQL
> Apt Repository.

So if you want something other than 14 on 22.04, or want to keep PostgreSQL
current without moving releases, you attach the PGDG repository.

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
```

Supported targets are 26.10, 26.04 LTS, 24.04 LTS, and 22.04 LTS. 20.04 isn't on
the list.

## What still holds

Versions and terminology changed; the way the procedure is explained still
works.

**Showing why `psql` fails before explaining it.** The write-up just runs `psql`,
gets `role "sehyeona" does not exist`, and then explains. Leading with the error
that `peer` demands your OS account name as the role name sticks better than
laying out the concept first.

**Two ways to connect, side by side.** Switching accounts first versus doing it
in one line:

```bash
# switch the shell to postgres, then connect
sudo -i -u postgres
psql

# connect directly without going through a shell
sudo -u postgres psql
```

**Clusters and `pg_ctlcluster`.** Explaining it as cluster > database > table,
and noting that Debian-family packaging has `pg_ctlcluster` for running several
versions and clusters, both hold. Given how the table above splits versions,
that's knowledge you need more now, not less.

**Reading process structure with `ps -ef | grep postgres` and `pstree`.** One
parent process with logger, checkpointer, autovacuum and other background
processes hanging off it is a picture that doesn't depend on version.

## Wrapping up

- **The PostgreSQL 12 this guide gets you went end-of-life on November 21,
  2024.** Ubuntu 20.04's standard support ended in May 2025.
- **14, the default on Ubuntu 22.04, ends November 12, 2026.** Two months out.
- **It's `peer`, not `ident`.** `ident` is TCP-only and asks an ident server on
  the client. Write `ident` on a local line and `peer` runs anyway.
- **Creating a role doesn't create an Ubuntu account.** `peer` only checks that
  the names match. Create both, separately, with the same name.
- **You no longer need `postgresql-contrib` spelled out.** Ubuntu's documented
  instruction is `sudo apt install postgresql`.
- Distribution packages mean **the release pins the version.** For a different
  one, attach the PGDG repository.
- **Showing the error before the explanation**, clusters, `pg_ctlcluster`, and
  the process-structure walkthrough all still hold.

What ages in an install guide is usually the version numbers, and one table
refreshes those. **What lasted was the part where a name was wrong.** `ident`
and `peer` were different things four years ago and they're different now. Time
doesn't fix that kind, so **learn it wrong once and it catches you every time
you open `pg_hba.conf`.**

Since installing and using it was the point, here's the order again. **The
release picks the version, so check that first** (and reach for PGDG if you need
to), installation is one `postgresql` line, and the next place you stall is
connecting. Knowing that the word in that slot is `peer` gets you both the line
to edit in `pg_hba.conf` and the fact that you need a matching OS account, in
one go.

## References

- [Versioning Policy — PostgreSQL](https://www.postgresql.org/support/versioning/)
- [The pg_hba.conf File — PostgreSQL](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [Install and configure PostgreSQL — Ubuntu Server documentation](https://ubuntu.com/server/docs/how-to/databases/install-postgresql/)
- [Linux downloads (Ubuntu) — PostgreSQL](https://www.postgresql.org/download/linux/ubuntu/)
- [Ubuntu release cycle](https://ubuntu.com/about/release-cycle)
- Source: [\[PostgreSQL\] Installing PostgreSQL on ubuntu](https://sehyeona.tistory.com/7)
