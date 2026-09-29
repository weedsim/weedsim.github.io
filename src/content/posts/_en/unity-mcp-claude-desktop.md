---
pubDatetime: 2026-09-29T18:00:00+09:00
title: "What You Pay For With Claude Code Isn't MCP"
lang: en
translationKey: unity-mcp-claude-desktop
featured: false
draft: false
tags:
  - Unity
  - MCP
  - AI
  - Agent
description: "The steps for wiring up MCP for Unity are worth following. But the premise the post starts from — that Claude Code charges for MCP connectivity — isn't what the docs say, and two product names are mixed together."
---

I clipped this while looking into **whether Unity project development can
actually be driven through an AI tool.** It's a February 2026 write-up of how to
connect the Unity Editor to an AI client over MCP — grabbing MCP for Unity from
the Asset Store, installing the runtime it needs, switching the transport, and
getting to a connection, screen by screen. **It's a post written from actually
hitting the snags**, which is where its value is.

The **premise it starts from**, though, differs from the documentation.

> But since I heard **Claude Code requires a paid subscription for MCP
> connections**, I'll connect Unity to Claude Code Desktop, which you can use on
> the free version.

The conclusion (you have to pay) is right, but **the reason is different.** And
that one sentence mixes **two different product names.**

## Table of Contents

## The Procedure Still Holds

Start with what's right. The UPM Git URL the clipping gives is **character for
character** the one in the repository README.

```
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
```

The README lists that URL and adds two alternatives.

> pin to **`#v10.0.0`** for the current release, or use OpenUPM:
> `openupm add com.coplaydev.unity-mcp`

It's also right that you can get it free from the Asset Store. The requirements
check out too.

> Unity versions **2021.3 LTS through 6.x**
> Python **3.10+** (installed via `uv`)

That `uv`/Python is exactly what turns red in the clipping's step 2, "download
the required components." **Red is normal**, and the description of installing
via the link the window offers and then going green is accurate.

One thing has moved. The path the README now recommends is a single
**`Window → MCP for Unity → Configure All Detected Clients`** — fewer steps than
the clipping's `Toggle MCP Window` followed by a per-client `Configure`. The
post is from February 2026 and the README's current release is v10.0.0, so **if
your screen doesn't match the post, suspect that first.**

## It Isn't "Paid Because of MCP"

Let's line the premise up against the docs. Claude Code's MCP documentation
**says nothing about plans.** The plan requirement lives in a different
document, and its subject isn't MCP.

> Claude Code requires a **Pro, Max, Team, Enterprise, or Console account. The
> free claude.ai plan does not include Claude Code access.** You can also use
> Claude Code with a third-party API provider.

**The paywall is on Claude Code itself, not on MCP.** The difference matters in
practice.

| | The clipping's reading | The documentation |
|---|---|---|
| What costs money | The MCP connection feature | **The Claude Code product as a whole** |
| If you pay for Pro | MCP unlocks | Claude Code unlocks, and **MCP never had its own gate** |
| To stay free | Avoid MCP | **Use a client the free plan includes** |

The third row is the important one. **The choice the clipping actually made is
correct** — to stay free, use a client other than Claude Code. But recording the
reason as "MCP costs money" means that later, after paying for Pro, you go
looking for a switch to turn MCP on. **There is no such switch.**

## There Is No Product Called "Claude Code Desktop"

Two product names sit in that one sentence. Untangled:

- **Claude Code** — the agentic coding tool that runs in a terminal. As quoted
  above, **it isn't included in the free plan.**
- **The Claude desktop app** — the conversational app. It's the one the clipping
  opens in step 4 to check "Settings > Developer" for `running`.

What the clipping actually connected is **the latter**. The "Claude Code
Desktop" in its title and body takes the former's name and attaches it to the
latter.

There's a reason to be confused, too. Claude Code's documentation now carries
this note:

> Prefer a graphical interface? The **Desktop app** lets you use Claude Code
> without the terminal.

**There is now a desktop app that runs Claude Code.** The plan requirement is
still Claude Code's, though. The names got closer; "it's the desktop app, so
it's free" did not become true. MCP for Unity's README also lists the two names
side by side but **separately.**

> works with Claude Desktop, **Claude Code**, Cursor, VS Code, Windsurf, Cline,
> Gemini CLI, and additional MCP-compatible clients.

## stdio, Not HTTP — What This Post Earned

This is the clipping's most valuable part. Pressing Configure threw an error,
and the configuration text said this:

> Claude Desktop doesn't support the HTTP transport, so go to Advanced Settings
> and use stdio instead of HTTP

But the Advanced window the message pointed at had no such setting. The answer
the author found:

> **Just change the setting at the very top that said HTTP Local to Stdio and
> hit Start server**

**Where the message pointed and where the setting actually lived were different
places.** That's the kind of thing documentation doesn't carry and you only get
by running into it — and it's this post's reason to exist.

For background: the local MCP path Anthropic documents for the Claude desktop
app is now **Extensions**. Here's how the help article describes installing:

> Installing from the directory: **Navigate to Settings > Extensions** on Claude
> Desktop

> Installing custom extensions: Click **'Advanced settings'** and find the
> **Extension Developer** section

The flow is **installing `.mcpb` files through the UI** rather than editing a
JSON config by hand. A tool like MCP for Unity writes that config for you, so the
difference is easy to miss — but **knowing where to go when you do have to touch
it yourself** is worth having.

## What This Tool Can Actually Do

The clipping's step 5 is "testing," and the result is this:

> it went ahead and made prefabs, code, textures and so on

And on permission prompts:

> along the way it asks you to allow things like Find in File
> **Allow / deny as appropriate**

**The scope is too wide for "as appropriate."** Here's the scale the README
states.

> **47 focused tool endpoints** covering scene creation, C# script editing,
> asset management, testing, profiling, and build automation

Scene creation, **C# script editing** and **build automation** are on the same
list. Which means the moment you turn this connection on, **a path opens for
your conversation partner to write and delete project files.** Making one prefab
and editing a script sit on the same permission.

It's MIT-licensed open source with a public repository, so **you can read what
it's able to do** — which is good. But turn it on without reading and you've
turned on a scope you don't know.

## Where and Why You'd Use It

The use the clipping names at the end is exactly right.

> Now that I've confirmed it connects with Claude for free, I plan to use it for
> **project optimization / getting an overview of the whole thing.**

**Read-oriented uses.** Understanding project structure, finding where things
are, skimming settings. That's this tool's safest and most effective use.

### Before You Connect

Three things, and the order matters.

1. **Commit to version control.** You can only experiment if you can undo.
   Files can change from the moment the editor is attached.
2. **Turn it on in a practice project first.** Don't attach it to real work
   before you have a feel for what 47 endpoints do.
3. **Pin the package version.** The README shows the `#v10.0.0` form. Leave it
   at `#main` and the tool list may differ next time you open it.

```
# pinned
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#v10.0.0

# tracking latest (the form the clipping gives)
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
```

### What to Allow and What to Block

Decide the criteria in advance and permission prompts stop being "as
appropriate."

| Request | Criterion |
|---|---|
| Reads (find files, inspect scene, check components) | Generally allow. Nothing to undo |
| Creating new assets / prefabs | Allow, but check **where** it creates them |
| Editing existing scripts | **Check your commit state**, then allow. Read the diff yourself |
| Deletes, build setting changes | **Deny and do it yourself** |

That last row is the same criterion used elsewhere in the work behind this blog.
**Installs, system changes, and anything hard to undo get run by a person.**
Being handed the command and pressing it yourself is always cheaper than
reconstructing what happened after it ran.

### Where Not to Use It

- **Attaching it to an uncommitted working tree.** You open write access in a
  state you can't roll back.
- **Choosing a tool because "MCP costs money."** The billing condition is
  attached to the client product, not to MCP.
- **Leaving it on `#main` and forgetting.** Tools and UI change. This clipping's
  screens differing after six months is the example.
- **Delegating deletes and build settings.** The cost of undoing exceeds the
  benefit of delegating.
- **Opening write access for work that only needs reads.** If the goal is an
  overview, reads are enough.

## Wrapping Up

- **The UPM Git URL and requirements still hold.** Unity 2021.3 LTS–6.x, Python
  3.10+ via `uv`. Red lights in step 2 are normal.
- **The recommended path got shorter.** The README points at a single
  `Window → MCP for Unity → Configure All Detected Clients`.
- **It isn't "MCP connections require payment."** The documentation says
  **"Claude Code requires a Pro, Max, Team, Enterprise, or Console account"**,
  and the free claude.ai plan doesn't include **Claude Code itself.** MCP has no
  separate gate.
- **"Claude Code Desktop" isn't a product name.** Claude Code (the coding tool)
  and the Claude desktop app are different things. The clipping connected the
  latter.
- There is now **a Desktop app that runs Claude Code**, which makes the names
  more confusing. The plan requirement still follows Claude Code.
- **The stdio workaround is real information this post earned.** The setting was
  at the top, not in the Advanced window the message pointed to.
- **Anthropic's documented local MCP path for the desktop app has moved to
  Extensions** — `Settings > Extensions`, with custom ones under `Advanced
  settings` in the Extension Developer section.
- **47 endpoints** include C# script editing and build automation. That isn't a
  scope to approve "as appropriate."

As tends to happen with posts about wiring something up, **what to watch out for
after it's on doesn't get written down.** This one names the use precisely at
the end — "optimization / getting an overview" — and passes over the permissions
in between in a single line. That a connection you turn on just to read
**carries write access along with it** is what belongs in that line.

If the starting question was "can development be driven with AI," the answer
leans toward **"yes, and that's the problem."** With script editing and build
automation among the 47 endpoints, it's technically possible. So the choice
isn't **whether it works** — it's **how much to delegate and where you start
pressing the buttons yourself.**

---

### References

- [MCP for Unity — CoplayDev/unity-mcp README](https://github.com/CoplayDev/unity-mcp)
- [MCP for Unity — Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/mcp-for-unity-ai-driven-development-329908)
- [Claude Code advanced setup — authentication and plan requirements](https://code.claude.com/docs/en/setup)
- [MCP in Claude Code](https://code.claude.com/docs/en/mcp)
- [Getting started with local MCP servers on Claude Desktop — Claude Help Center](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

The starting point for this post was [굴러다니다니 — \[Unity\] 유니티와 클로드코드 데스크탑을 연결하자 (ClaudeCode Desktop MCP)](https://dani2344.tistory.com/188)
(2026-02-04). I followed its install and connection steps as written, checked its
billing premise and the product names against Anthropic's official
documentation, and the package details against the repository README. Quotes
from it are my translations.
