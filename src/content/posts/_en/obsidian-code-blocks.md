---
pubDatetime: 2026-10-06T19:20:00+09:00
title: "It's Three or More Backticks, Not Three"
lang: en
translationKey: obsidian-code-blocks
featured: false
draft: false
tags:
  - Obsidian
  - Markdown
description: "A write-up on Obsidian code blocks. The explanations mostly hold, but where it pins backticks at 'three', the post's own first example trips. It escaped the backticks to nest a code block inside a code block — and the docs say that isn't necessary."
---

I clipped this **back when I was putting example code into Obsidian notes and
looking for how.** These days I use it as a vault for stashing clippings, but
back then how to hold a snippet came first. It's a 2024 post, briefly organized
into **seven sections from overview to plugins.**

Most of it holds. Folding with a callout, the claim that it uses Prism, the
plugin options — check them and they're all real.

What snags is the first section.

> 인라인 코드에는 백틱(\`) 한 개를, 코드 블록에는 **세 개의 백틱**(\`\`\`)을
> 사용하여 생성할 수 있습니다.
>
> (Inline code is created with one backtick, and a code block with **three
> backticks**.)

And the example attached just above it looks like this.

````text
```
\`\`\`

이것은 코드 블록입니다

\`\`\`
```
````

**The backticks are escaped with backslashes.** Trying to make a code block that
shows a code block, the inner backticks closed the outer fence, so each one got
escaped. The official docs say that isn't necessary.

## Table of contents

## It's Three or More Backticks, Not Three

Obsidian's official docs describe code blocks like this.

> Enclose code with **three or more backticks** or **three or more tildes**.

**Not "three" but "three or more"**, and not only backticks — tildes work too.
And immediately after, the nesting rule.

> The outer code block must use **more** fence characters (backticks or tildes)
> than any inner code block, or use a **different fence character type**.

**The outer one just has to exceed the inner one.** This isn't a place that needs
escaping. The example above can be written like this.

`````text
````
```
This is a code block
```
````
`````

Four backticks outside, three inside. Or you can change the type.

````text
~~~
```
This is a code block
```
~~~
````

This post is written by that rule. The two examples above are wrapped in **five
backticks** and **four** respectively. They contain a four-backtick fence and a
three-backtick one, so the outer has to exceed those.

Memorize it as three and **you can't write a post that explains code blocks.**
Documentation about Markdown itself, a heredoc inside a shell script, quoting
someone else's code block — all of it lands here. That's why the clipping fell
back on escaping.

### Tildes and indentation exist too

The docs count three ways.

| Method | Where it fits |
| --- | --- |
| Three or more backticks | The default. A language can be specified |
| Three or more tildes | Changing the type when a backtick fence is inside |
| Tab or 4-space indentation | No language can be specified |

> Alternatively, indent using **Tab** or **4 blank spaces**.

The indented form is CommonMark's indented code block, and **there's nowhere to
attach a language identifier.** Syntax highlighting requires the fenced form.
That's why indented code in older docs and older posts comes out unhighlighted.

## Inline Code Isn't Always One Either

Inline code has the same property. The docs' description:

> Text inside `backticks` on a line will be formatted like code.

> inline ``code with a backtick ` inside``

**When a backtick goes inside, the outside grows to two.** Same principle as the
code block nesting rule, and for the same reason memorizing "one" blocks you.

Where this bites in practice is clear. Explaining Markdown syntax, quoting a
shell command substitution (`` `cmd` ``), and **showing a backtick itself, like
this sentence does.** The `` `cmd` `` just above is written with two on the
outside.

## What Folds Isn't the Code Block but the Callout

The clipping's second section.

> 코드 블록을 접고싶을 땐, 접을 수 있는 콜아웃 안에 넣으면 됩니다.
>
> (When you want to fold a code block, put it inside a foldable callout.)

It's a valid method, and the official docs guarantee both conditions. First, the
syntax for folding a callout.

> You can make a callout foldable by adding a plus (`+`) or a minus (`-`)
> directly after the type identifier.

> A plus sign **expands** the callout by default, and a minus sign **collapses**
> it instead.

The `-` the clipping's example uses is **collapsed by default.** To leave it
expanded, use `+`. And putting a code block inside a callout is in the docs too —
callouts can hold Markdown, internal links and embeds, and there's a command that
wraps selected lists and code blocks into a callout.

What matters is that **this isn't a code block feature.** Neither Markdown nor
Obsidian has syntax for folding a code block itself. It borrows the callout's
folding. Which is why the title in the collapsed state is the callout's title, and
the icon is the callout type's icon.

````text
> [!note]- The whole config file
> ```json
> {
>   "name": "Game.Input",
>   "references": ["Unity.InputSystem"]
> }
> ```
````

**Every line carries `>`.** Including the fence lines. Miss one and the callout
ends there while the code block falls out on its own. The clipping's example got
this part right.

Worth adding: **it works on this blog too.** This site renders callouts with
`rehype-callouts` using the Obsidian theme, and that package states:

> Supports collapsible callouts with `-/+` and nestable callouts.

Meaning a post folded in Obsidian stays folded when published. It's one of the few
syntaxes that doesn't break between the vault and the blog.

## Prism Is the Reading-Mode Side

The syntax highlighting section.

> 옵시디언은 **300여개의** 다양한 언어를 지원하는 Prism 라이브러리를 사용합니다.
>
> (Obsidian uses the Prism library, which supports **over 300** languages.)

That it uses Prism is something the official docs state directly.

> Obsidian uses **Prism** for syntax highlighting.

The number checks out on Prism's side. Its supported-languages page counts them.

> This is the list of all **297 languages** currently supported by Prism

297. "Over 300" rounds the wrong way, and the check date is 2026-10-06. It'll
change as languages are added to Prism.

Something more important than the number sits behind it. The same section
recommends a plugin.

> 고급 기능이 필요한 경우 Editor Syntax Highlight 플러그인을 사용해 보세요.
>
> (If you need advanced features, try the Editor Syntax Highlight plugin.)

**Why that plugin is needed isn't written down.** The plugin's README answers it.

> A plugin for Obsidian which allows syntax highlighting for code blocks **in
> the editor**.

> imports a bunch of syntax highlighting modes **from CodeMirror**

Not Prism but **CodeMirror**. Obsidian's highlighter differs by mode.

| Mode | Highlighter |
| --- | --- |
| Reading mode | Prism (297 languages) |
| Editing mode | CodeMirror (only the modes Obsidian bundles) |

**This is why the same code block looks different in the two modes.** A language
that wasn't highlighted while editing picks up color once you switch to reading
mode. 297 is the reading-mode number; editing mode has far fewer. Closing that gap
is what the plugin does.

Not knowing this structure makes you **fix the wrong thing.** You suspect a typo
in the language identifier, or go look up whether Prism supports that language.
Neither is it.

## The Same Fence Read Three Different Ways

That's the clipping's scope, but if you move posts from the vault to a blog there's
one more layer. **This blog uses neither Prism nor CodeMirror.** It uses
**Shiki**, Astro's default highlighter.

So one identical-looking fence line gets interpreted three times in three places.

| Who reads it | With what | Result |
| --- | --- | --- |
| Obsidian editing mode | CodeMirror | Only bundled modes highlighted |
| Obsidian reading mode | Prism | 297 languages highlighted |
| The built blog | Shiki | Highlighted with TextMate grammars |

The language identifiers themselves mostly carry over. `csharp`, `json` and
`yaml` are known to all three. What splits is **what you attach after the
identifier.**

This blog's config has four Shiki transformers attached. One of them is a custom
transformer that adds a filename, written on the fence line like this.

````text
```ts file="astro.config.ts"
export default defineConfig({ ... });
```
````

And diff notation is written in comments.

````text
```csharp
int before = 1;  // [!code --]
int after = 2;   // [!code ++]
```
````

**Both are Shiki-only.** Open it in Obsidian and `file="astro.config.ts"` is
simply ignored, while `// [!code ++]` **shows as a literal comment.** It isn't
removed and it isn't highlighted.

The reverse direction exists too. Syntax that Obsidian plugins provide — like the
title and line-highlight notation of Code Styler, coming up next — **does nothing
on the built site.** It's just a leftover string on the fence line.

So using a vault and a blog together produces one rule. **Trust only what's in
standard Markdown on both sides.** Fence counts, tildes, language identifiers and
callout folding are that range. Outside it, assume one side only.

## The Plugin Sections Hold

The remaining sections don't snag when checked.

| The clipping's claim | Verified |
| --- | --- |
| Line numbers come from a CSS snippet or a plugin | Correct. Code block line numbers aren't a built-in |
| Code block tabs come from the Codeblock Tabs plugin | Correct |
| Styling can change via CSS snippets, plugins or themes | Correct |
| Code Styler supports all of the above | Correct |

The last row is worth cross-checking against the README. All six features the
clipping counts are there.

| Clipping | README |
| --- | --- |
| Add a title to a code block | "Titles and references" — titles can also link to other notes or websites |
| Show line numbers | "line numbers" |
| Highlight code lines | By line number, range, quoted phrase and **regex** |
| Folding support | "Collapsible codeblocks with custom placeholder text" |
| Inline code support | Highlighting in inline code via `{language} code` syntax |
| External code references | "Display local or remote files with line range selection" |

**Two rows are broader than the clipping says.** Line highlighting takes regex,
and folding lets you **specify the placeholder text** for the collapsed state.
Unlike the callout workaround above, it folds the code block itself, so the title
doesn't get dragged into being a callout title.

"Line numbers aren't a built-in" is worth one note. Obsidian's setting
**Editor > Show line numbers** is for the **note body**, and lines inside a code
block get no numbers. The names are close enough that you turn it on and wonder
why nothing happens.

## Where and Why You'd Use It

### Writing documentation that explains Markdown

The place this bites most often. Deciding the fence depth ahead of time helps.

| Depth | Fence |
| --- | --- |
| Code | 3 backticks |
| Code showing code | 4 backticks |
| Code showing that | 5 backticks |

That's how this post is written. Going three levels deep is rare, but **the rule
is "one more," so there's no ceiling on depth.** Escaping grows along with the
depth; a fence only needs one more character.

The language identifier can go on the outer fence too. When showing Markdown, use
`text` or `markdown` — `text` is better if you don't want the inner fence
highlighted as code.

### Keeping a vault in git

An Obsidian vault is **all plain Markdown.** So it goes into git as-is and the
diffs read. One thing is worth deciding alongside it, though.

In [the post on untracking Git LFS](/posts/git-lfs-untrack/) the conclusion was
that **putting text files in LFS only loses you things.** A vault is exactly that
case. Markdown files are numerous and individually small, so LFS gains nothing
and you lose the diff. If anything in a vault belongs in LFS, it's the attached
images and PDFs.

Encoding is settled once as well. Since these files travel between the vault and
the blog repository, applying the UTF-8 baseline from
[the post on character encodings](/posts/character-encodings/) on both sides keeps
Korean strings inside code blocks from breaking.

### Where Not to Use It

- **Escaping backticks to avoid nesting.** Add one to the outside. An escaped post
  doesn't work when copied and pasted.
- **Insisting on one backtick for inline code that contains a backtick.** Wrap it
  in two.
- **Trying to specify a language on an indented code block.** There's nowhere to
  put the identifier. If you need highlighting, use a fence.
- **Suspecting Prism support when editing-mode highlighting fails.** Editing mode
  is CodeMirror. Its language list is different.
- **Expecting code block line numbers from the "Show line numbers" setting.**
  That's the note body.
- **Publishing a code block written in plugin syntax straight to a blog.** Shiki
  doesn't know that syntax. Conversely, Shiki notation shows as a comment in
  Obsidian.
- **Looking for Markdown syntax that folds a code block itself.** There is none.
  Borrow callout folding or use a plugin.

## Wrapping Up

- **A fence is "three or more," not "three."** The docs say "three or more
  backticks or three or more tildes."
- **The nesting rule is that the outer one is larger.** "The outer code block must
  use more fence characters than any inner code block, or use a different fence
  character type." That's the spot where the clipping fell back on escaping.
- **Inline code with a backtick inside gets wrapped in two.** Same principle.
- **An indented code block can't specify a language.** If you need highlighting,
  use a fence.
- **There's no syntax for folding a code block.** It's a workaround borrowing a
  callout's `-`/`+`, and `-` is collapsed by default. This blog supports the same
  syntax via `rehype-callouts`.
- **Prism is the reading-mode side.** 297 is that side's number; editing mode is
  CodeMirror. That gap is why the plugin the clipping recommends exists.
- **Three highlighters read one fence line differently.** Obsidian editing
  (CodeMirror), reading (Prism), and the built blog (Shiki). `file="..."` and
  `// [!code ++]` are Shiki-only; in Obsidian they're ignored and shown as a
  comment respectively.
- **The plugin sections all hold.** Code Styler has all six features the clipping
  counts, and line highlighting even takes regex.

---

### References

- [Basic formatting syntax — Obsidian Help](https://obsidian.md/help/syntax)
- [Callouts — Obsidian Help](https://obsidian.md/help/callouts)
- [Supported languages — Prism](https://prismjs.com/#supported-languages)
- [Editor Syntax Highlight — deathau/cm-editor-syntax-highlight-obsidian](https://github.com/deathau/cm-editor-syntax-highlight-obsidian)
- [Code Styler — mayurankv/Obsidian-Code-Styler](https://github.com/mayurankv/Obsidian-Code-Styler)
- [rehype-callouts](https://github.com/lin-stephanie/rehype-callouts)
- [Shiki — supported languages](https://shiki.style/languages) ·
  [@shikijs/transformers](https://shiki.style/packages/transformers)
- [Fenced code blocks — CommonMark spec](https://spec.commonmark.org/0.31.2/#fenced-code-blocks)

The starting point for this post was
[제이닉 — 옵시디언 기초: 코드 블록(Code block)](https://kaminik.tistory.com/entry/%EC%98%B5%EC%8B%9C%EB%94%94%EC%96%B8-%EA%B8%B0%EC%B4%88-%EC%BD%94%EB%93%9C-%EB%B8%94%EB%A1%9DCode-block)
(2024-02-25). I cross-checked the syntax explanations against Obsidian's official
help and the CommonMark spec, and verified the highlighter side against Prism's,
CodeMirror's and Shiki's documentation. The check date is 2026-10-06.
