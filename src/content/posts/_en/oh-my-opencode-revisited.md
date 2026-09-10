---
pubDatetime: 2026-09-10T17:00:00+09:00
title: "An Eight-Month-Old Install Guide: oh-my-opencode Isn't Called That Anymore"
lang: en
translationKey: oh-my-opencode-revisited
featured: false
draft: false
tags:
  - OpenCode
  - Claude Code
  - AI
  - Agent
  - CLI
description: "I checked a January 2026 oh-my-opencode install guide against how things stand now. The project has been renamed, and the Anthropic subscription cutoff it warned about actually took effect in April."
---

I was looking for an alternative to Claude Code. Two conditions: **open
source**, and **able to run local LLMs**. That's how I ended up saving a
[write-up](https://goddaehee.tistory.com/485) covering the installation and
configuration of **oh-my-opencode**, an agent plugin that sits on top of
OpenCode. Install command, authentication, config file layout, per-agent model
assignment — all in one sweep, which looked like a good starting point.

It's from January 7, 2026, and it's now September. **Eight months.** That's a
long time for an install guide, and it shows. Checking it, **the project has
been renamed**, and what the write-up warned against as "not recommended" was
formally enforced in April. There are also a few places where the article
contradicts itself.

## Table of contents

## The name changed first

Go to `github.com/code-yeongyu/oh-my-opencode` and you land on
**`oh-my-openagent`**. The official docs give the reason.

> The project was formerly called "oh-my-opencode" but is now
> "oh-my-openagent" to reflect its **provider-agnostic design**.

A rename meant to shake off the impression of being OpenCode-only. There's now
a separate lightweight edition for Codex CLI (`npx lazycodex-ai install`) too.

Eight months, side by side:

| Item | Article (2026-01) | Now (2026-09) |
| --- | --- | --- |
| Name | oh-my-opencode | **oh-my-openagent (OmO)** |
| Install | `bunx oh-my-opencode install` | `bunx oh-my-openagent install` |
| Minimum OpenCode | 1.0.150+ | **1.4.0+** |
| Agents | Sisyphus + 6 | **11** |
| GitHub stars | 9,500+ | **68.9k** |
| Claude subscription auth | "ToS violation, not recommended" | **cut off as of 2026-04-04** |

The agent roster didn't just grow, it changed character. The article's
Sisyphus, Oracle, Librarian and Explore are still there, joined by Hephaestus
(deep autonomous work), Prometheus (strategic planning), Atlas (todo
management), Metis (gap identification), Momus (plan review), and
Sisyphus-Junior.

**Once the install command stops working, you can't trust the rest of the
guide either.** Config paths, flags, model names — all of it assumes that name.

## What the article warned about actually happened

The section the article invests the most in is Anthropic authentication. Two
days after publication, an update block was added.

> **\[2026-01-09 update\] Anthropic OAuth authentication restriction**
>
> Anthropic has applied a technical restriction making Claude Code OAuth tokens
> usable only from official Claude Code.

And its conclusion:

> Since this isn't a simple block but has produced **account bans**, **be sure
> to use the API key method.**

**That call was right.** And it went one step further afterwards. Per an April
3, 2026 report, Anthropic cut off using Claude Pro/Max subscriptions with
third-party agents entirely, **effective April 4 at 12pm PT**. Boris Cherny,
who heads Claude Code, put it this way:

> We've been working hard to meet the increase in demand for Claude, and our
> subscriptions weren't built for the usage patterns of these third-party tools.

Not a technical sanction so much as **a policy decision driven by capacity**.
Existing subscribers were offered a one-time credit equal to a month's plan
price (redeemable until April 17) and up to 30% off pre-purchased usage
bundles, with pay-as-you-go or the API as the remaining paths.

So the article's "use an API key" advice stands — for a different reason. The
article cited **ToS violation and account bans**; what actually settled was **a
policy removing third-party use from the subscription products.** For someone
reading it today, "that route doesn't exist" is more accurate than "it's a
violation, so avoid it."

Worth noting: the oh-my-openagent repo carries a banner reading "Anthropic
blocked OpenCode because of us." That's where it places itself in this story.

## Places the article contradicts itself

Separate from what aged, some passages were **already self-contradictory at
publication.**

| Item | One place | The other |
| --- | --- | --- |
| GitHub stars | intro: "over 12,000" | body table: "Stars: 9,500+" |
| Gemini 3 model names | "the `-preview` suffix is no longer needed" | troubleshooting: omitting `-preview` is the 404 cause |
| Agent count | body: "7 specialist agents working in parallel" | table: "Sisyphus + 6 (7 total)" |
| Stock OpenCode | table: "build/plan + @general (3)" | body: "works sequentially with 2 agents, Build and Plan" |
| Account bans | "since account bans are occurring" | "all accounts blocked by this issue have been unblocked" |

Both star figures are labeled **"as of early January 2026."** It looks like the
intro was refreshed later and the body table wasn't.

The `-preview` one will actually stop you mid-setup. Partway through, the
article says GA shipped so the suffix is unnecessary and recommends
`google/gemini-3-flash`:

```json
"model": "google/gemini-3-flash"
"model": "google/gemini-3-pro"
```

Troubleshooting item 5 in the same article names exactly that spelling as the
cause of a 404.

```json
// ❌ wrong (produces 404)
"model": "google/gemini-3-flash"

// ✅ correct
"model": "google/gemini-3-flash-preview"
```

**A head-on collision.** And the article's own config example
(`oh-my-opencode.json`) uses `-preview`, which suggests the GA note was slipped
in later without updating the rest. Either answer might be right, but **when one
article gives two, the reader can't choose.**

Same with the agent count. "7 specialist agents led by the Sisyphus
orchestrator" makes 8 total, while the table says 7 — and counting the table's
own list gives 7 including Sisyphus.

## Three different repositories

The GitHub issue links the article cites point at **three different
organizations.**

- `anomalyco/opencode/issues/6930` — the Anthropic OAuth item
- `opencode-ai/opencode/issues/{523,530,541}` — exit and background issues
- `sst/opencode` — listed under references as "OpenCode source code"

Checking it: the repository the official docs (`opencode.ai/docs`) point at is
**`anomalyco/opencode`**, and the site footer carries Anomaly's copyright.
`sst/opencode` is the earlier org name.

The middle one is the problem. **`opencode-ai/opencode` is an archived,
different project.** Its banner says:

> This repository is no longer maintained and has been archived for provenance.
> The project has continued under the name **Crush**, developed by the original
> author and the Charm team.

A separate Go-based terminal AI tool, now continued as Charm's Crush. The names
collided, apparently — which means **the supporting links for troubleshooting
items 7 and 8 point at the wrong project.** The symptom descriptions are still
useful; you just can't follow the link to verify them.

## The Claude Code comparison doesn't hold up now

The article's FAQ says:

> Claude Code can only use Claude models, whereas oh-my-opencode uses Claude,
> ChatGPT and Gemini optimized per role. It also provides **multi-agent
> collaboration, parallel execution**, Todo Enforcer and other features
> **Claude Code doesn't have.**

The first half is fair. The second half doesn't match the current
documentation. From Claude Code's subagents page:

> Each subagent runs in its own context window with a custom system prompt,
> specific tool access, and independent permissions.
>
> For independent investigations, **spawn multiple subagents to work
> simultaneously**.
>
> **Background subagents** run concurrently while you continue working.

Multi-agent and parallel execution both exist. Same for the comparison table's
"**model selection: single model only**."

> The `model` field controls which model the subagent uses.

Each subagent gets its own model. Within the Claude family, yes — but not
"single model."

The hook names don't line up either. The article claims "**fully compatible**
with Claude Code" and lists `PreToolExecution` / `PostToolExecution` /
`Notification` / `Stop`. Claude Code's documented event names run to more than
thirty and include `PreToolUse` and `PostToolUse`. `Notification` and `Stop`
overlap; the first two **have different names.** From the article's list alone
there's no way to check what "fully compatible" means.

That said, this is **the item to weigh against the eight-month gap.**
Comparison pieces spoil first by nature. The point is that it doesn't hold for
someone choosing a tool today, not that the author invented anything.

## The slash commands the title promises

The title advertises "**basic commands, slash commands**, integration methods
and more." In the body there are three slash commands, and all three pass by in
troubleshooting or footnote context.

- `/connect` — OpenAI OAuth login
- `/exit` — quitting (while explaining that background agents survive it)
- `/tasks` — checking running tasks

No `/init`, no `/model`. There's no basic-commands chapter either, because the
author says up front to **read Part 1 first.** It's the second entry in a
series, so this is less a flaw in the article than **a title that over-promises
to anyone who lands here from search.**

## What still holds

Aside from what aged, some of the design is unchanged eight months on.

**Automatic context injection.** Read a file and every `AGENTS.md` and
`README.md` from that directory up to the project root gets injected, with each
directory's context injected once per session. The current docs still carry
this.

**Curated MCPs.** Exa (web search), Context7 (official docs), and Grep.app
(GitHub code search) bundled by default — also still in the current docs.

**Multi-account load balancing.** Registering several Google accounts to get
past rate limits is still there. Though the article introducing it as "getting
past rate limits for free" and then immediately adding "but you must comply
with Google's terms of service" **doesn't add up.** Recommend the workaround or
require compliance; together they leave the reader nothing to judge with.

**The warnings about cost.** Paying for a subscription and API usage both, the
price of Opus-class models, the advice to use the stock tool for simple work —
all still valid. More valid since April, if anything.

## The local LLM side is still empty

This is where my reason for saving it runs aground. The article's FAQ answers:

> A: oh-my-opencode is designed around Claude, ChatGPT and Gemini
> subscriptions. **Compatibility with local models isn't clearly addressed in
> the official documentation, and would need actual testing.**

An honest answer, and eight months later not much has changed. Where Ollama
appears in the current docs is one line of Sisyphus's fallback chain, and the
name there is **`ollama-cloud`** — which reads as Ollama's hosted service
rather than local execution. There's a mention of detecting custom-endpoint
providers during setup, but **no guidance on wiring up a local model that I
could find.**

The recommended configuration says the same thing. The model the docs suggest
for Sisyphus is Claude Opus 5, and the rest of the chain is hosted models like
Kimi K3, GPT-5.6 and GLM-5.2. The rename to `oh-my-openagent` was for being
"provider-agnostic" — and **provider here means several companies, not
locally.**

## Wrapping up

- **The project is now `oh-my-openagent`.** The install command is
  `bunx oh-my-openagent install`, the minimum OpenCode version went from
  1.0.150 to 1.4.0, and the agent count went from 7 to 11.
- **The Anthropic subscription cutoff the article warned about took effect on
  April 4, 2026** — as **a policy removing third-party use from the
  subscription products**, not as a ToS enforcement action.
- The article contradicts itself in **five places.** The Gemini 3 `-preview`
  one in particular will stop you mid-setup, since the body and the
  troubleshooting section say opposite things.
- **The cited repositories span three organizations.** One of them,
  `opencode-ai/opencode`, is **an archived, different project** (now Crush), so
  those supporting links point somewhere else entirely.
- **The Claude Code comparison doesn't hold today.** Subagents, parallel
  execution and per-agent model selection are all documented.
- The slash commands the title promises amount to `/connect`, `/exit` and
  `/tasks`. It's an article written on top of Part 1.
- Still valid: **context injection, curated MCPs, multi-account balancing, and
  the cost warnings.**
- **Local LLMs still have no guidance.** The Ollama that appears in the docs is
  `ollama-cloud`, and every recommended model is hosted.

In a tool write-up the first things to spoil are **the install command and the
comparison table.** Both are facts about a moment. What lasted was **why it's
built that way** — how context gets injected, what gets delegated, where the
cost leaks.

Back to the two conditions I was looking for, and they split. **Open source:
still yes.** **Local LLM: still no.** If anything, April's subscription cutoff
made this tool's position clearer — it splits hosted models from several
companies across roles; it doesn't run on your machine. For not being tied to
Claude Code alone, it fits. **For not calling out to anything at all, it isn't
the one.**

Opening a saved install guide eight months later will keep happening. **Open
the repository first** is the ordering I took from this. Checking whether the
name is still the name decides whether the rest is worth reading.

## References

- [code-yeongyu/oh-my-openagent — GitHub](https://github.com/code-yeongyu/oh-my-openagent)
- [Oh My OpenAgent Docs](https://omo.dev/docs)
- [OpenCode Docs](https://opencode.ai/docs/)
- [opencode-ai/opencode (archived) — GitHub](https://github.com/opencode-ai/opencode)
- [Anthropic cuts off the ability to use Claude subscriptions with OpenClaw and third-party AI agents — VentureBeat](https://venturebeat.com/technology/anthropic-cuts-off-the-ability-to-use-claude-subscriptions-with-openclaw-and)
- [Subagents — Claude Code](https://code.claude.com/docs/en/sub-agents)
- [Hooks — Claude Code](https://code.claude.com/docs/en/hooks)
- Source: [Open Code review (2): installing and configuring oh-my-opencode](https://goddaehee.tistory.com/485)
