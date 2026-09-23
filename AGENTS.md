# AGENTS.md

Working agreement for any AI agent operating on this repository.

This is the source of a **bilingual (Korean / English) technical blog** built
with Astro + AstroPaper and published to GitHub Pages. Most work here is one
recurring job: **turn a saved article clipping into a verified bilingual post.**

Read this file before touching anything. Where a rule says "don't", it is
because that thing has already gone wrong once.

---

## 1. Repository facts

| | |
|---|---|
| Framework | Astro 7 / AstroPaper v6 |
| Package manager | **pnpm 11** (Node 24) |
| Deploy | GitHub Actions → GitHub Pages (Pages source **must stay "GitHub Actions"**) |
| Posts (Korean) | `src/content/posts/<slug>.md` |
| Posts (English) | `src/content/posts/_en/<same-slug>.md` |
| Tag dictionary | `src/i18n/tags.ts` |
| Post filter | `src/utils/postFilter.ts` |

Commands, as CI runs them:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run format:check
pnpm run build
```

### Things not to change

- **Do not turn off pnpm's `verifyDepsBeforeRun`.**
- **Do not rewrite the `build` script in `package.json` back to `cp -r`.**
- **Do not disable the LF normalization in `.gitattributes`.** `core.autocrlf`
  is deliberately off; keep every file LF.
- **`allowBuilds` is intentionally empty** — zero third-party postinstall
  scripts run. If adding a dependency produces a blocked-build message, do not
  auto-allow it. Stop, explain why the script is needed, and only then add it
  with a comment giving the reason.
- **Every `trustPolicyExclude` exception carries a comment with its reason,
  its date, and the condition for removing it**, plus a recheck deadline. Never
  add one without all four.

---

## 2. Hard rules

1. **Run `pnpm build` before every push.** `astro check` alone does not catch
   errors that only appear at render time. This has bitten this repo more than
   once.
2. **`pubDatetime` must be in the past.** Production builds silently drop
   future-dated posts via `postFilter.ts` + `scheduledPostMargin`. Check the
   real clock in Asia/Seoul first: `TZ=Asia/Seoul date`.
3. **Do not run install or system-changing commands on the user's behalf.**
   Print the command and let the user run it. Package installs especially —
   the user needs to see the block message themselves.
4. **Only read-only git commands inside this repo** unless the user asked for a
   write. A stray `git status` once left a `.git/index.lock` the user had to
   delete by hand.
5. **This is a public repo.** The commit email is set to a GitHub noreply
   address. Never put a personal email address in a commit, in a file, or
   anywhere on the site.
6. **Never guess package facts.** Version numbers, API names, defaults — look
   them up in the official docs and quote them.
7. **Say the part you disagree with.** If the user's instruction or a source
   article is wrong, say so plainly instead of complying quietly.

### Commit messages

English, one line, imperative. Nothing else — no trailers, no co-author lines,
no session links.

```
Add post on the Input System generated C# class
Add Data to the tag dictionary
Fix broken internal link in the Addressables post
```

---

## 3. The post pipeline

Run these in order. Do not skip ahead — step 8 exists because guessing the
user's motivation wastes a whole post.

1. **Check the clock.** `TZ=Asia/Seoul date`. Pick a `pubDatetime` at least a
   few minutes in the past.
2. **Read the clipping** the user named.
3. **Check for overlap.** List `src/content/posts/` and read any existing post
   on the same topic. The new post must not repeat an earlier one's angle.
4. **Find the angle.** A post is not a summary of the clipping. Read the
   clipping against the current official documentation and look for what the
   clipping got **wrong, outdated, or left out**. That gap is the post.
5. **Verify every claim** against a primary source — the vendor's own docs,
   the package changelog, the API reference. Quote verbatim in a blockquote.
   Where the docs do not state something, **say that they do not** rather than
   asserting it.
6. **Write the Korean post** to `src/content/posts/<ascii-slug>.md`.
7. **Verify the structure** (section 6 below), then hand the file to the user
   and commit it. Do this *before* asking anything.
8. **Ask two questions and wait:**
   - **계기** — why did the user actually save this clipping? Never invent it.
   - **태그** — the tag list, and whether `src/i18n/tags.ts` needs a new row.
9. **Apply the answers.** If the motivation changes what the post is about,
   rewrite it rather than patching the intro.
10. **Write the English post** to `src/content/posts/_en/<same-slug>.md`.
11. **Verify ko/en parity** (section 6), commit both, then give the user the
    `pnpm build` command and the commit message.

---

## 4. Front matter

Exactly this shape. **There is no `slug` field** — the filename is the slug.

```yaml
---
pubDatetime: 2026-09-23T14:00:00+09:00
title: "..."
lang: ko            # 'en' for the _en/ copy
translationKey: <must equal the filename without .md>
featured: false
draft: false
tags:
  - Unity
  - C#
description: "..."
---
```

`translationKey` and `pubDatetime` must be **identical** between the Korean
file and its English counterpart. Only `lang`, `title`, `description`, the tag
labels, and the prose differ.

---

## 5. How posts are written

### Structure

```
(intro — the real motivation, then what this post found)

## 목차            ← empty heading; the theme injects the TOC

## <finding 1>
## <finding 2>
...
## 어디에 왜 쓰나   ← required for any post about an API, component or package
### <working example>
### <how to choose>
### 쓰지 말아야 할 자리
## 정리

---

### 참고
- [Title — source](url)
...
(one closing paragraph naming the original clipping, its author and date)
```

### Rules

- **The "어디에 왜 쓰나" section is required** whenever the post is about an
  API, a component, or a package. It must say where and why you'd use the
  thing, and carry example code that compiles.
- **Each post stands on its own.** Do not send the reader to another post for
  something the current post needs. Repeat the explanation and repeat the
  example code, even verbatim, rather than linking around it. Links are for
  "see also", never as a substitute for content.
- **Quote sources verbatim** in blockquotes, and attribute each one.
- **Don't overstate.** If the documentation does not answer a question, write
  that it does not.
- **Vary the structural angle.** Do not reuse the same framing device in
  consecutive posts.
- **Check internal link targets exist in both languages** before adding them —
  `src/content/posts/<slug>.md` *and* `src/content/posts/_en/<slug>.md`.
- Code in Korean posts keeps Korean comments; code quoted from a source keeps
  the source's comments as-is, and the English post says so.

### Correcting a published post

**Never silently edit a wrong claim.** Strike it through and explain
underneath, dated:

```markdown
| ~~블록~~ | ~~`CGPROGRAM` … `ENDCG`~~ | ~~`HLSLPROGRAM` … `ENDHLSL`~~ |

> **정정 (2026-09-16)**
>
> 줄을 그은 행은 **틀린 내용**이다. …
```

Apply the same correction to both the Korean and English copies.

### Unity C# in examples

- Private fields `_camelCase`; serialized ones via `[SerializeField]`.
- Use `[Header]`, `[Tooltip]`, `[Range]` on inspector-facing fields.
- `TryGetComponent` over `GetComponent` + null check.
- **Never `?.` on a `UnityEngine.Object`** — use `if (obj != null)`. `?.` is
  fine on plain C# objects, and it's worth saying which is which in the post.
- Named constants instead of magic numbers.

---

## 6. Verification

Run this on the Korean file, then on the English file, and compare.

```bash
for f in src/content/posts/<slug>.md src/content/posts/_en/<slug>.md; do
  printf '%-44s ' "$f"
  printf 'CR:%s h2:%s h3:%s fences:%s rows:%s tags:%s links:%s slug:%s key:%s pub:%s lang:%s\n' \
    "$(grep -c $'\r' "$f")" \
    "$(grep -c '^## ' "$f")" \
    "$(grep -c '^### ' "$f")" \
    "$(grep -c '^```' "$f")" \
    "$(grep -c '^|' "$f")" \
    "$(sed -n '/^tags:/,/^description:/p' "$f" | grep -c '^  - ')" \
    "$(grep -o '](/posts/[^)]*)' "$f" | wc -l)" \
    "$(grep -c '^slug:' "$f")" \
    "$(grep '^translationKey:' "$f" | cut -d' ' -f2)" \
    "$(grep '^pubDatetime:' "$f" | cut -d' ' -f2)" \
    "$(grep '^lang:' "$f" | cut -d' ' -f2)"
done
```

Expected: `CR:0`, `slug:0`, matching `key` and `pub`, `lang` differing, and
**every other count identical between the two files**.

Also check by eye:

- No line outside a fenced code block starts with `> ` unless it is a real
  blockquote. A wrapped line beginning with `>` (e.g. a menu path broken after
  `Other Settings`) renders as a blockquote — rewrap it.
- Internal link targets exist in both `posts/` and `posts/_en/`.
- Every reference link resolves.

---

## 7. `src/i18n/tags.ts`

Add a row **only** when the tag reads differently in Korean and English.
Locale-neutral tags (`Unity`, `C#`, `GPU`, `URP`, `Animator`, `Addressables`,
`Input System`, `.NET`, …) are deliberately absent — their slugs already match,
so a row would be noise.

Before editing, **re-read the file from the repository**, never from a cached
copy, and confirm that rows added earlier are still present. A stale copy once
nearly dropped two entries.

---

## 8. Deployment

`.github/workflows/deploy.yml` builds with pnpm and publishes via
`actions/deploy-pages`. `.github/workflows/ci.yml` runs lint, format check and
build on pull requests.

**GitHub Pages' source must stay set to "GitHub Actions."** If it is ever set
back to "Deploy from a branch", GitHub additionally runs its built-in Jekyll
build (`pages build and deployment`) against this repo's Astro source, which
fails — Jekyll tries to Liquid-render Markdown and `.astro` files that contain
`{{ … }}`. Adding `.nojekyll` is **not** the fix: it would make the branch
source publish the raw repository instead, fighting the Actions deployment.
Fix it at the setting.
