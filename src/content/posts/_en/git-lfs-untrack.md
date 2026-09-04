---
pubDatetime: 2026-09-04T17:00:00+09:00
title: "Untracking Git LFS: `git lfs uninstall` Defaults to Global"
lang: en
translationKey: git-lfs-untrack
featured: false
draft: false
tags:
  - Git
  - Git LFS
  - Version Control
  - GitHub
description: "Revisiting a 2021 write-up on untracking LFS and reclaiming GitHub storage. Three of its commands are described differently from what they actually do, and GitHub's LFS policy has moved since."
---

Running a Unity project, I blew through GitHub's LFS quota. Digging into why,
the problem wasn't LFS itself but **things being tracked by LFS that had no
business being there**. Looking for how to pull them back out, I clipped
[this post](https://blog.syki66.com/2021/04/09/git-lfs-untrack/) on untracking
Git LFS and reclaiming GitHub storage. It's a short list of commands, which is
what you want when you're in a hurry.

Checked against the docs, though, **three of its commands are described
differently from what they do** — and one of them, run as written, **breaks
your other repositories.** On top of that it's a 2021 post, and GitHub's LFS
policy has changed a fair bit since. In order:

## Table of contents

## The sequence the original gives

The flow:

1. `git lfs ls-files --all` — see what LFS manages across all commits
2. **Untrack at the current commit** — `git lfs untrack` → `git rm --cached` →
   `git add`
3. **Untrack across all commits** — `git lfs migrate export` →
   `git lfs uninstall` → `git filter-branch` to drop `.gitattributes`
4. `git filter-branch --env-filter` to fix up commit dates
5. Reclaim GitHub storage — delete and recreate the repository

The overall shape is right. `git lfs migrate export` is genuinely the correct
tool for rewriting history, and point 5's observation — **untracking doesn't
free the LFS storage** — is still a real trap.

It's the individual commands that go wrong.

## `git rm --cached` doesn't touch the remote

The original labels this command:

> 원격저장소에서 `.ext` 확장자를 가진 파일들 삭제
>
> (Delete files with the .ext extension from the remote repository)
>
> ```
> git rm --cached '*.ext'
> ```

**It has nothing to do with the remote.** Git's definition:

> Use this option to unstage and remove paths only from the index. Working tree
> files, whether modified or not, will be left alone.

`git rm` itself only deals with the local index and working tree.

> Remove files matching pathspec from the index, or from the working tree and
> the index.

With `--cached` it **drops the entry from the index and leaves the file on
disk.** The real purpose of this step isn't deleting anything — it's taking the
entries that were staged through the LFS filter back out of the index, so that
the `git add` on the next line re-adds them **as ordinary blobs**.

So the three lines mean:

```bash
git lfs untrack '*.ext'   # remove the rule from .gitattributes
git rm --cached '*.ext'   # drop from the index (file stays on disk)
git add '*.ext'           # re-stage as a normal file
```

Read the label as "delete from the remote" and the sequence stops making sense
— and worse, you might run it without `--cached`, which really does delete the
files.

## `git lfs uninstall` defaults to global

This is the dangerous line. The original says only:

> Remove the `lfs hook`
>
> ```
> git lfs uninstall
> ```

The Git LFS manual:

> Remove the 'lfs' clean and smudge filters from the global Git config.
> Uninstall the Git LFS pre-push hook if run inside a Git repository.

**The default touches your global (`~/.gitconfig`) configuration.** A command
you ran to clean up one repository strips the filters from **every other
LFS-using repository on that machine.**

What makes it worse is that nothing breaks immediately. Repositories already
cloned look fine; it's the next clone or checkout that brings down **pointer
text files** instead of the real ones — a few lines starting with
`version https://git-lfs.github.com/spec/v1`. In a Unity project that means
every texture and model arrives as that, and the editor throws import errors.

To scope it to one repository you have to say so.

```bash
git lfs uninstall --local
```

> Removes the 'lfs' smudge and clean filters from the local repository's git
> config, instead of the global git config.

Conversely, `--skip-repo` clears the global filters while leaving the current
repository alone. **Running it bare is almost never what you meant.**

## Git itself says not to use `filter-branch`

The original uses `git filter-branch` both to strip `.gitattributes` from
history and to fix up commit dates. That was a common choice in 2021; it isn't
now. Git's own documentation, verbatim:

> *git filter-branch* has a plethora of pitfalls that can produce non-obvious
> manglings of the intended history rewrite (and can leave you with little time
> to investigate such problems since it has such abysmal performance). These
> safety and performance issues cannot be backward compatibly fixed and as
> such, its use is not recommended. Please use an alternative history filtering
> tool such as git filter-repo.

Not merely "not recommended" but "not recommended **because the safety and
performance issues cannot be fixed compatibly**." And it names
`git filter-repo` as the alternative.

### And that step isn't even necessary

One more thing: `git lfs migrate export` already modifies `.gitattributes`.

> The export command will modify the `.gitattributes` to set/unset any filepath
> patterns as given by those flags.

Though it doesn't delete entries — it **inserts** "do not track" ones.

> instead, the `export` mode inserts 'do not track' entries similar to those
> created by the `git lfs untrack` command.

So the original's `filter-branch` step isn't part of untracking LFS at all. It's
**a separate cleanup for when you want the `.gitattributes` file itself gone
from history.** If untracking LFS is the goal, skip it. If you do want it, use
`filter-repo`.

## What rewriting history actually costs

The original has `git push origin +브랜치이름` sitting there as one calm line.
That leading `+` is a force push. Nothing says so.

The `git lfs migrate` docs are explicit:

> This will require a force-push to any existing Git remotes

Rewriting history changes every commit hash. Which means:

- **Every existing clone diverges.** Collaborators can't `git pull` their way
  across; they have to re-clone or discard local branches and reset.
- **Open pull requests break**, because the commits their branches sit on are
  gone.
- **It's hard to undo.** Back the remote's state up somewhere before you force
  push.

If this isn't a repository you work in alone, the most important step is not a
command at all — it's **telling the team when you'll do it and making sure
nobody is mid-work at that moment.** It's also why step 4 of the original
exists: rewriting history resets every committer date to today, bunching your
GitHub contribution graph into a single day.

## GitHub's LFS quotas aren't what they were

Being a 2021 post, this is where the most has changed. Per GitHub's current
documentation:

- **Free and Pro** — **10 GiB** each of storage and bandwidth
- **Team and Enterprise Cloud** — **250 GiB** each
- **Data packs are gone.** "Git LFS billing used pre-paid data packs. These
  have been removed and replaced with metered billing and you only pay for what
  you actually use."
- **Set a $0 budget** and you avoid overage charges, but "Git LFS usage is
  blocked for the rest of the calendar month."

And on a game project bandwidth usually binds before storage, so it's worth
knowing who pays for it:

> When you **download** a Git LFS file, the bandwidth you use is included in the
> **repository owner's bandwidth usage**.

**Bandwidth other people spend cloning your repository lands on your account.**
Publish a Unity project with heavy assets as a public repository, get some
traffic, and the quota drains without you doing anything.

## Reclaiming storage: deleting the repo isn't the only way

The original's conclusion:

> The only way to free the storage, currently, is to delete the repository on
> GitHub and recreate it.

The core point still holds. GitHub's documentation says:

> After you remove files from Git LFS, the Git LFS objects still exist on the
> remote storage and will continue to count toward your Git LFS storage quota.

> To remove Git LFS objects from a repository, delete and recreate the
> repository.

The warning that issues, stars and forks go with it is in the docs too. But
"the only way" is no longer accurate — the same page adds an exception:

> If you need to purge a removed object and you are unable to delete the
> repository, please contact support for help.

If you can't delete the repository, **contacting support** is a path. On a
repository with accumulated issues and stars, that's worth trying first.

## What should have been in LFS in the first place

In my case the cause of the overage wasn't LFS but **tracking things that
didn't need tracking**. So this criterion comes before any untracking
procedure.

LFS solves exactly one problem: **large binary files get stored as a whole new
object on the smallest change, and they don't diff or merge.** History inflates
accordingly. LFS keeps the contents outside and leaves a pointer in the
repository.

Which inverts to: **putting a text file in LFS is pure loss.** You give up the
delta compression, diffing and merging Git was already good at, and spend the
quota anyway.

Unity projects invite this mistake because so many files look binary from the
extension but aren't.

**What should not be in LFS**

- `.meta` — a few lines of text each, but there are thousands of them. The
  request count becomes the problem before the size does.
- `.unity`, `.prefab`, `.asset`, `.mat`, `.controller` — with Asset
  Serialization set to Force Text these are all YAML. Put them in LFS and
  **scene and prefab merging becomes impossible.**
- `.cs`, `.shader`, `.json`, `.txt`, `.md`, `.csproj`

**What genuinely needs LFS**

- Source art — `.psd`, `.tga`, large `.png`
- Models and animation — `.fbx`, `.blend`
- Audio and video — `.wav`, `.mp3`, `.ogg`, `.mp4`
- Binary artifacts — `.dll`, `.so`, `.aar`, `.unitypackage`

To find out what's actually consuming the quota:

```bash
git lfs ls-files --all --size
```

`--size` gives "the size of the LFS object between parenthesis at the end of a
line", and `--all`:

> Inspects the full history of the repository, not the current HEAD (or other
> provided reference). This will include previous versions of LFS objects that
> are no longer found in the current tree.

Because it **includes past versions no longer in the current tree**, this is
where you find the cause of "I deleted it but the storage is still full."

## So the sequence today looks like this

Putting it together:

```bash
# 0. Survey. See what LFS is managing before touching anything
git lfs ls-files --all --size

# 0-1. Back up. Preserve the remote's state before rewriting history
git clone --mirror <remote> backup.git

# 1. Untrack across all history (.gitattributes is updated for you)
git lfs migrate export --everything --include='*.ext'

# 2. Remove LFS filters for THIS repository only — --local is required
git lfs uninstall --local

# 3. Force push. Announce it first, and pick a moment nobody is working
git push origin --force --all
git push origin --force --tags

# 4. Reclaiming GitHub storage is a separate job
#    - delete and recreate the repo, or contact support
```

If you also want the `.gitattributes` file itself gone from history, that's
when you reach for `git filter-repo`. Not `filter-branch`.

## Summary

- `git rm --cached` drops entries **from the index only**. It has nothing to do
  with the remote, and the file stays on disk.
- `git lfs uninstall` **defaults to global config**. Cleaning up one repository
  requires `--local`; without it, other LFS repositories on the machine start
  pulling pointer files.
- Git's own documentation advises against `git filter-branch` and names
  `git filter-repo` as the alternative.
- `git lfs migrate export` already updates `.gitattributes`. The original's
  `filter-branch` step isn't part of untracking LFS.
- Rewriting history requires a force push and breaks existing clones and open
  PRs. **Team coordination and a backup** come before any command.
- GitHub LFS is now 10 GiB each of storage and bandwidth on Free and Pro, data
  packs are gone in favour of metered billing, and bandwidth is charged to the
  **repository owner**, not the downloader.
- Untracking doesn't free the storage — the original is right. But **contacting
  support** has since been added alongside deleting the repository.
- **Putting text files in LFS is pure loss.** In Unity, `.meta` and Force
  Text-serialized `.unity`/`.prefab` are the classic misclassifications, and
  the latter blocks merging as well.
- Use `git lfs ls-files --all --size` to see what's consuming the quota,
  including past versions no longer in the tree.

## References

- [git rm — Git Docs](https://git-scm.com/docs/git-rm)
- [git filter-branch — Git Docs](https://git-scm.com/docs/git-filter-branch)
- [git-filter-repo](https://github.com/newren/git-filter-repo/)
- [git lfs ls-files — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-ls-files.adoc)
- [git lfs migrate — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc)
- [git lfs uninstall — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-uninstall.adoc)
- [Removing files from Git Large File Storage — GitHub Docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files/removing-files-from-git-large-file-storage)
- [About billing for Git LFS — GitHub Docs](https://docs.github.com/en/billing/concepts/product-billing/git-lfs)
- Original (Korean): [\[git lfs untrack\] 깃, lfs 추적 해제, 원격 저장소 lfs 저장공간 확보](https://blog.syki66.com/2021/04/09/git-lfs-untrack/)
