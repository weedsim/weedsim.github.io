---
pubDatetime: 2026-09-10T22:00:00+09:00
title: "The Feature Confirmed Working in the Comments Was Removed in OpenCode 1.3.0"
lang: en
translationKey: opencode-usage-guide-revisited
featured: false
draft: false
tags:
  - OpenCode
  - Claude Code
  - AI
  - Agent
  - CLI
description: "I checked an OpenCode usage review and install guide against how things stand now. What the article said works today is now called prohibited by the official docs, and its JSON examples carry a paste artifact that breaks on copy."
---

Following on from [the previous post](/en/posts/oh-my-opencode-revisited/),
there's one more thing I saved while hunting for an open-source alternative to
Claude Code: a
[write-up](https://www.gpters.org/dev/post/summary-opencode-usage-reviews-w25e8CqBmoVnv7K)
pairing a week of using OpenCode and oh-my-opencode with the installation steps
and configuration. It's written to be followed by hand, from installing Bun
through adding MCP servers, which makes it more practical than the previous one.

It's from January 16, 2026. This time what caught my eye was **what the article
rests on.** Covering the authentication problem, it says:

> **As of the time of writing the workaround functions and it does actually
> work**, but from a terms-of-service standpoint it's hard to recommend.

And in the comments, someone confirms it works. What became of that feature
eight months later is what this post is about.

## Table of contents

## The feature confirmed in the comments

One commenter asks the author directly:

> I've installed it, but does installing the way described here work around
> what Anthropic blocked? **My Claude Max plan just authenticated fine.**

The author's reply:

> Yes, **OpenCode has Claude Code login built in.**

That was January. Here's what the Anthropic section of OpenCode's official docs
says now:

> There are plugins that allow you to use your Claude Pro/Max models with
> OpenCode. **Anthropic explicitly prohibits this.**
>
> Previous versions of OpenCode came bundled with these plugins but that is
> **no longer the case as of 1.3.0**

**The thing that was "built in" was unbundled in 1.3.0.** And the docs now
describe that use as something Anthropic explicitly prohibits.

This is worth using to sharpen what I wrote last time. April's move was
Anthropic removing third-party use from its subscription products, and
**OpenCode separately removed that path from its default distribution.** The
company blocking something and the tool dropping it were two different events.

So following this article's steps, **step 4, the login, is where it diverges.**
Picking Anthropic and connecting with Claude Pro/Max isn't what it was. The
rest of the procedure is fine; that one step isn't.

**"It works right now" is hard to build on.** Not that the author was careless
— that sentence is on the honest side, since it carries the terms-of-service
caveat alongside. But **whether something works is a fact about a moment**, and
it ages with the clipping.

## The install path survives; the org name changed

Authentication aside, the installation itself still mostly holds.

```bash
bun add -g opencode-ai
opencode --version
```

The npm package is still `opencode-ai`. It's at **1.18.30** now, a long way
from the 1.0.x era the article was written in.

What changed is wherever the org name shows. The article's diagram labels
OpenCode "**SST open source**," while the current docs list these paths:

| Method | Current |
| --- | --- |
| Script | `curl -fsSL https://opencode.ai/install \| bash` |
| npm | `npm install -g opencode-ai` |
| Homebrew | `brew install anomalyco/tap/opencode` |
| Docker | `docker run -it --rm ghcr.io/anomalyco/opencode` |

Not `sst/tap` but **`anomalyco/tap`**. The previous post noted the repository
moving from `sst/opencode` to `anomalyco/opencode`; **the package paths carry
the same change.** The diagram's "SST open source" no longer fits.

The desktop app, which the article introduces as "recently released in beta,"
is now listed by the docs alongside the terminal interface and IDE extension
with no beta label.

## A comment caught the paste bug — half of it

Another commenter points this out:

> About that bun install command… `curl -fsSL < https://bun.com/install > | bash`
> — I don't think you need these `< >`.

The author agreed: "looks like it slipped in while pasting." It's the artifact
you get moving links out of Notion-style editors.

The problem is that **the same artifact is still in the article in several more
places.** Counting in the clipping there are six, and four of them are inside
JSON.

```json
{
  "$schema": "<https://opencode.ai/config.json>",
  "mcp": {
    "linear": {
      "type": "remote",
      "url": "<https://mcp.linear.app/mcp>",
      "oauth": {}
    }
  }
}
```

**This one breaks on copy.** The `< >` in a shell command gets read as
redirection and produces a visible error; inside a JSON string it's **a
perfectly valid value.** Parsing succeeds and only the connection to that URL
fails.

The comment caught the conspicuous one. Four quiet ones remain. **In a guide
people follow step by step, the quiet kind is the worse kind.**

## Claude Code has per-agent MCP restriction too

One of the advantages the article claims for OpenCode:

> **This isn't supported in Claude Code**, but in opencode you can enable an
> MCP only for specific agents and disable it on the main agent, saving tokens.

The OpenCode side is still accurate — disable globally, enable per agent:

```json
{
  "tools": { "my-mcp*": false },
  "agent": {
    "my-agent": {
      "tools": { "my-mcp*": true }
    }
  }
}
```

**The first half doesn't hold today.** Claude Code's subagents documentation
has a field that does the same job, and it takes MCP server-level patterns.

> Both fields accept **MCP server-level patterns** in addition to exact tool
> names: `mcp__<server>` or `mcp__<server>__*` grants or removes every tool
> from the named server.

The docs' example is exactly that use:

> This example uses `tools` to allow only Read, Grep, Glob, and Bash. The
> subagent **can't edit files, write files, or use any MCP tools**

A similar item came up in the previous post, and it confirms the pattern again:
**comparison sentences spoil first.** The underlying idea — splitting MCP access
per agent to save tokens — is a good one, and now both sides do it.

## What's unchanged

Take out installation and comparison and a fair amount is left.

**The project config layout.** `<project>/opencode.json` plus `.opencode/`
holding `agents/`, `commands/` and `skills/` is as described. Setting it beside
Claude Code's `.claude` helps the explanation land.

**`AGENTS.md` vs `CLAUDE.md`.** OpenCode uses `AGENTS.md`, and pointing
`instructions` at an existing `CLAUDE.md` to keep using it still works.

**MCP config shape.** `type: local` taking a `command` array and `type: remote`
taking a `url` matches the current docs. **The command list has grown**, though.

| Command | Current docs |
| --- | --- |
| `opencode mcp auth <server>` | present |
| `opencode mcp list` | present |
| `opencode mcp logout <server>` | **added** |
| `opencode mcp debug <server>` | **added** |
| `opencode mcp add` | not found in the current list |

The article suggests using `opencode mcp add` when you don't know what config
to write, and I couldn't find that entry in the current MCP command list.
Whether it's gone or just missing from the docs, I didn't establish.

**Turning off the Claude Code compatibility layer.** The `claude_code` block in
`~/.config/opencode/oh-my-opencode.json`, switching `mcp`/`commands`/`skills`/
`agents`/`hooks`/`plugins` individually, is still useful — few write-ups list
the individual keys. Just note the plugin is now `oh-my-openagent`, so start by
checking the filename.

## What grew instead

The article names OpenAI and GitHub Copilot as cases "moving toward official
support." The current docs have one more.

> other companies (ChatGPT Plus, GitHub Copilot, **GitLab Duo**) support
> developer tool freedom with zero setup required

Copilot now has its authentication documented too. It opens with "To use your
GitHub Copilot subscription with opencode," walks through device-code auth at
`github.com/login/device`, and notes some models need a Pro+ subscription. What
the article could only link to as an X post became a documented section in
eight months.

**One side closed while another opened.** The article's observation holds; only
the list got longer.

## Wrapping up

- The feature confirmed in the comments with "**my Claude Max plan just
  authenticated fine**" **was unbundled in OpenCode 1.3.0.** The current docs
  call that use something "Anthropic explicitly prohibits."
- The company's block (April's subscription policy) and **the tool's own
  removal (1.3.0) are two separate things.**
- The install steps mostly hold. `opencode-ai` is still the package and it's at
  1.18.30. But **the Homebrew tap and Docker image moved to `anomalyco`**, and
  the diagram's "SST open source" no longer fits.
- The `< >` paste artifact a comment caught **remains in four JSON examples.**
  The shell errors on it; **JSON accepts it silently.**
- "**Per-agent MCP restriction isn't supported in Claude Code**" doesn't hold
  today. `tools` / `disallowedTools` accept `mcp__<server>` patterns.
- Still valid: the `.opencode/` layout, `AGENTS.md` with `instructions`, the MCP
  config shape, and switching the compatibility layer off key by key.
- **GitLab Duo** joined the officially-supported list, and GitHub Copilot's
  authentication made it into the docs.

If the previous post was about names and versions aging, this one is about **the
grounds aging.** "It works right now" is a sentence only someone who tried it
can write, which is why it reads as trustworthy — and exactly why it spoils
fastest. Two people confirming an item back and forth in the comments, to that
item being written up as prohibited in the official docs: eight months.

So the parts of a write-up like this that last are elsewhere. **What the config
files look like and what you can switch on and off.** That's structure rather
than a working check, so versions climb and the names change while the slots
stay put.

## References

- [OpenCode Docs](https://opencode.ai/docs/)
- [Providers — OpenCode](https://opencode.ai/docs/providers/)
- [MCP Servers — OpenCode](https://opencode.ai/docs/mcp-servers/)
- [Subagents — Claude Code](https://code.claude.com/docs/en/sub-agents)
- [An eight-month-old install guide: oh-my-opencode isn't called that anymore](/en/posts/oh-my-opencode-revisited/)
- Source: [Opencode usage review and how-to](https://www.gpters.org/dev/post/summary-opencode-usage-reviews-w25e8CqBmoVnv7K)
