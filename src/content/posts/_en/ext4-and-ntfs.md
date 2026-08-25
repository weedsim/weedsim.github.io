---
pubDatetime: 2026-08-25T21:00:00+09:00
title: "Ext4 and NTFS: How Linux and Windows Handle Disks"
lang: en
translationKey: ext4-and-ntfs
featured: false
draft: false
tags:
  - File System
  - Linux
  - Windows
  - Ext4
  - NTFS
description: "Looking up Ext4 after it showed up as the default in an Ubuntu install: its structure, formats for drives shared with Windows, and case sensitivity."
---

I ended up writing this post while installing Ubuntu as a host OS. The
installer has a step where you lay out partitions and choose a file system,
and **Ext4** was sitting there as the default. I could have just moved on,
but **picking something without knowing what it was bothered me**, so I
started digging.

The digging branched in two directions. One was how Ext4 actually handles
the disk; the other was what to format a drive with if I wanted to share it
with Windows.

And while writing it up, I found there is a difference that **bites far more
often in day-to-day development** than either of those: a build that runs
fine on Windows can't find its files on Linux. That ended up being the most
practical part of this post.

I've covered the three in order.

## Table of contents

## First, what are you using right now

On Linux, adding `-T` to `df` prints the file system type along with
everything else.

```bash
$ df -Th
Filesystem     Type   Size  Used Avail Use% Mounted on
tmpfs          tmpfs  1.2G  3.7M  1.2G   1% /run
/dev/sda3      ext4   916G  221G  648G  26% /
tmpfs          tmpfs  5.7G   34M  5.7G   1% /dev/shm
/dev/sda2      vfat   512M  5.3M  507M   2% /boot/efi
```

That's a typical Ubuntu layout: root (`/`) on `ext4`, the EFI partition on
`vfat`. To see devices that aren't mounted as well, `lsblk -f` is better.

On Windows, you check it this way.

```powershell
fsutil fsinfo volumeinfo C:
```

The Ubuntu installer has defaulted to Ext4 for a long time. (I could not
confirm the frequently cited "since 9.10" date against the original release
notes. What is certain is that it is still the default today, and you can
verify that directly with the command above.)

## How Ext4 divides up the disk

### Block groups

Ext4 manages the disk by cutting it into **block groups**. A group is as
many blocks as `8 × block size` (in bytes). With the common 4 KiB block that
comes out to 32,768 blocks per group, or **128 MiB**.

The reason for dividing it up is **to keep related data close together**.
When a file's metadata and its actual data sit in the same group, the seek
distance shrinks. In the HDD era that meant head movement time, and on SSDs
locality is still a win.

As an aside, there's one entertaining asymmetry. Every field in Ext4 proper
is written **little-endian**, but **the journal (jbd2) alone is big-endian**.
It's confusing enough that the kernel documentation warns about it with an
all-caps "HOWEVER".

### extent — the biggest change from ext3

ext3 recorded which blocks a file lived in using **indirect block mapping**.
It creates an entry for every single block, so the larger the file, the more
bloated that map itself became.

Ext4 uses **extents**. A run of contiguous physical blocks is expressed as a
single entry. If a 1 GiB file happens to be laid out contiguously in one
piece, in theory a handful of entries covers it. Metadata overhead drops
sharply when you're dealing with large files.

### Delayed allocation

Ext4 **does not grab blocks the instant a write request arrives.** It keeps
the data in cache and puts allocation off as long as it can.

What's the benefit of waiting? It can pick a spot after it knows how large
the file will finally be. Even a file that gets appended to in many small
steps can receive one contiguous region at once, which reduces
fragmentation.

### The journal

Ext4's journal carries a **checksum**. Being able to check whether the
journal is damaged is a gain in itself, but the side effect is bigger. ext3
had to split a commit into two phases; with a checksum it **can be finished
in one phase**, which in some cases is up to about 20% faster.

### Limits

| | ext3 | Ext4 |
|---|---|---|
| Maximum file size | 2 TB | **16 TB** |
| Maximum file system size | 16 TB | **1 EB** |
| Number of subdirectories | 32,000 | Unlimited |

## NTFS and Linux

At the center of NTFS sits the **MFT (Master File Table)**. Every file and
directory is represented as an MFT record, and very small files get no
separate block at all — they go directly inside the record.

The way Linux reads and writes NTFS changed significantly at one point along
the way.

- **`ntfs-3g`** — FUSE-based. Being a userspace implementation, it was the
  standard for a long time, but it was never as fast as a kernel file
  system.
- **`ntfs3`** — **an in-kernel driver that landed in kernel 5.15.** Led by
  Konstantin Komarov of Paragon Software. Straight from the pull request:
  "This is NTFS read-write driver. Current version works with
  normal/compressed/sparse files and supports acl, NTFS journal replaying."

Going by the kernel documentation, `ntfs3` supports **up to NTFS 3.1** and
provides mount options including `umask`/`fmask`/`dmask` (permissions),
`acl`, `discard` (TRIM), and `windows_names` (blocking file names that
Windows does not allow).

`windows_names` is a practical option. It stops you from creating names that
Linux will happily accept but Windows cannot open — `aux`, for example, or
names containing a colon.

## Where developers actually get bitten — case sensitivity

This is the most substantial part of this post.

**Ext4 is case-sensitive.** `Player.png` and `player.png` are different
files.

**NTFS can in fact be case-sensitive too.** But **Windows, sitting on top of
it, ignores case by default.** In the exact words of Microsoft's
documentation:

> The Windows file system treats file and directory names as
> case-insensitive. `FOO.txt` and `foo.txt` will be treated as equivalent
> files.

So here's what happens. You write `LoadTexture("player.png")` in your code
while the actual file is `Player.png`: **on Windows it runs just fine.**
Commit it as-is and push it to a Linux build server, and the file can't be
found. This is the classic failure when you work on a Unity project on
Windows and build it in Linux CI.

Windows can turn case sensitivity on too, **per directory**.

```powershell
fsutil.exe file queryCaseSensitiveInfo <path>
fsutil.exe file setCaseSensitiveInfo <path> enable
```

There is a restriction, though. **The directory has to be empty for the flag
to be changed.** That means you can't turn it on later for a project folder
already full of files, so it's hard to use as an after-the-fact remedy.

The realistic defenses are these.

- Set a naming convention for assets and paths and **standardize on
  lowercase**
- Run a Linux build in CI so **the differences get caught at the build step**

## Formatting a drive shared by both operating systems

The conclusion in the original source material still holds. **Use NTFS
unless there's a specific reason not to.** One of the supporting arguments
does need updating, though.

### exFAT — the patent story is ancient history now

Older material says "Ubuntu doesn't support exFAT out of the box because of
patents." **That was true back then, but it isn't now.**

On August 28, 2019, Microsoft published the exFAT technical specification
and said this.

> We will be making Microsoft's technical specification for exFAT publicly
> available to facilitate development of conformant, interoperable
> implementations.

At the same time it said it supported exFAT's inclusion in the Open
Invention Network's Linux definition, which brings the **defensive patent
commitments** of OIN's 3,040-plus members and licensees into play. And exFAT
support landed in **Linux kernel 5.4**.

**The other point from the original material does still stand, however.**
exFAT has no concept of file ownership or permissions. Mount it on Linux and
whatever values you pass as mount options get applied uniformly. It remains
unsuitable for anything that has to preserve permissions.

### FAT32 — the 4 GiB wall

FAT32 **cannot hold a file larger than 4 GiB.** Modern game build outputs
and screen recordings cross that line easily. It also lacks ownership and
permissions, same as exFAT.

The only real reason to choose FAT32 today is **compatibility with very old
devices**.

### Choose NTFS, but choose it knowingly

- File ownership and permissions are preserved
- There's no 4 GiB limit
- Linux-side support is better than it used to be now that `ntfs3` is in the
  kernel

In exchange, there are two things to account for.

- **You can't install Ubuntu on NTFS.** It can't be used as the root file
  system.
- **Error recovery is better on the Windows side.** When an NTFS volume gets
  corrupted, Linux doesn't handle it as well as Windows does. Which also
  means that on a system running only Ubuntu, there's no particular reason
  to use NTFS at all.

To summarize:

| | Ownership & permissions | Files over 4 GiB | Linux support | Ubuntu install |
|---|---|---|---|---|
| NTFS | ○ | ○ | kernel `ntfs3` | ✗ |
| exFAT | ✗ | ○ | kernel 5.4+ | ✗ |
| FAT32 | ✗ | ✗ | long-standing | ✗ |
| Ext4 | ○ | ○ | native | ○ |

## Wrap-up

- To check a file system: `df -Th` (Linux), `fsutil fsinfo volumeinfo`
  (Windows).
- Ext4 cuts metadata for large files with **extents**, reduces fragmentation
  with **delayed allocation**, and finishes a commit in one phase with
  **journal checksums**.
- Linux's NTFS support moved from FUSE (`ntfs-3g`) to the **in-kernel
  `ntfs3` (5.15)**.
- For a shared drive, use NTFS. **exFAT's patent problem was settled in
  2019**, but the absence of ownership and permissions is unchanged.
- And what actually bites most often isn't the choice of format — it's
  **case sensitivity**. When something that worked on Windows fails on
  Linux, this is the first place to look.

---

### References

- [ext4 Data Structures and Algorithms — Linux Kernel Docs](https://docs.kernel.org/filesystems/ext4/overview.html)
- [Ext4 — KernelNewbies](https://kernelnewbies.org/Ext4)
- [NTFS3 — Linux Kernel Docs](https://docs.kernel.org/filesystems/ntfs3.html)
- [\[GIT PULL\] ntfs3: new NTFS driver for 5.15 — LKML](https://lkml.rescloud.iu.edu/2109.0/03094.html)
- [exFAT in the Linux kernel? Yes! — Microsoft Open Source Blog](https://opensource.microsoft.com/blog/2019/08/28/exfat-linux-kernel/)
- [Case Sensitivity — Microsoft Learn](https://learn.microsoft.com/en-us/windows/wsl/case-sensitivity)

The material this post started from is
[4.2. File Systems - Ext4 and NTFS](https://wikidocs.net/218005). I followed
its outline, but rewrote the explanations and verified them against the
official documentation listed above.
