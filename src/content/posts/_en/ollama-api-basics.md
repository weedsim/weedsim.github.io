---
pubDatetime: 2026-09-08T17:30:00+09:00
title: "The Ollama Response Was Long Because of the Format, Not the Answer"
lang: en
translationKey: ollama-api-basics
featured: false
draft: false
tags:
  - Ollama
  - LLM
  - API
  - On-device AI
  - Local LLM
  - AI
description: "I checked a set of notes on the Ollama API against the official docs. The cause of the too-long response was one parameter, but the notes changed three at once, so the credit got split three ways."
---

Separately from game development, I was **looking at putting a local LLM behind
some of my tooling** when I saved these
[notes](https://ride-wind.tistory.com/122) walking through Ollama's REST API
with `curl`. It's a short record of hitting endpoints one at a time, and
partway through there's this.

> The answer is too long
>
> Is something wrong?

The next line concludes: **set `stream` to false and specify json, then it gets
shorter.** That diagnosis is where this post starts. **Only one of the three is
responsible, but the credit is split across three** — and even that one wasn't
"the answer being long."

## Table of contents

## What "the answer is too long" actually was

The first request in the notes:

```bash
curl http://localhost:11434/api/generate -d '{"model": "llama3.1","prompt": "Why is the sky blue?"}'
```

One value goes unspecified here: `stream`. The documented default is **`true`**,
and then the response comes back as:

> a series of responses

**Not one object, several.** A JSON object flies back for each token produced.
Each carries `response` and `done` fields, and only the last one sets
`"done": true` and attaches statistics like `total_duration`, `load_duration`,
`prompt_eval_count`, and `eval_count`.

`curl` dumps all of that straight into the terminal, which fills the screen with
a wall of JSON. **The answer wasn't long; the output format was.** The same
sentence produces as many lines as it has tokens.

Turn `stream` off and, in the docs' words:

> the response will be returned as a single response object, rather than a
> stream of objects

## Three things changed at once

The second request, offered in the notes as the one that "got shorter":

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "What color is the sky at different times of the day? Respond using JSON",
  "format": "json",
  "stream": false
}'
```

Compared against the first, more than one thing moved.

| Item | First request | Second request | Relation to screen length |
| --- | --- | --- | --- |
| `prompt` | Why is the sky blue? | What color is the sky…​ Respond using JSON | different content |
| `format` | absent | `"json"` | unrelated |
| `stream` | absent (= `true`) | `false` | **this one is the cause** |

**Only `stream: false` shortened the screen.** `format: "json"` constrains the
output to JSON and has nothing to do with volume. The prompt became an entirely
different question.

And that second request **isn't something the notes built as a fix.** Prompt
included, it's the official docs' JSON mode example verbatim. A different
example was pasted in from the documentation and then observed to be "shorter,"
so what shortened what got mixed together.

Change one thing and it's clear.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

Same prompt, no `format`, only `stream` turned off. That alone removes the wall
of JSON. The answer's own length is unchanged.

## Shortening the answer is a different knob

To actually make **the answer shorter**, the place to touch is `options`. The
docs take additional model parameters there, and among them `num_predict` caps
the number of generated tokens.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Why is the sky blue?",
  "stream": false,
  "options": { "num_predict": 100 }
}'
```

`stream` is **delivery**; `num_predict` is **production.** What the notes ran
into was the former, but calling it "the answer is too long" makes it read as
the latter. Keeping them apart is what makes it obvious where to look the next
time an answer really is too long.

## `format: "json"` comes paired with the prompt

The prompt in the example ends with `Respond using JSON`. That follows from
copying the docs' example — but **why it's there** is also in the docs.

> When `format` is set to `json`, the output will always be a well-formed JSON
> object. **It's important to also instruct the model to respond in JSON.**

`format: "json"` only forces the output to be valid JSON; it doesn't tell the
model **what** to put in that JSON. Without the instruction in the prompt, the
model can satisfy the shape while flailing at the content.

**They're a pair.** `format` handles the grammar, the prompt handles the
content. The notes saw the combination only through its result and summarized it
as "specify json," which drops the prompt half.

## Added December 2024: structured outputs

The notes are from September 2024. That December 6th, `format` was extended.

> Ollama now supports structured outputs making it possible to constrain a
> model's output to a specific format defined by a **JSON schema**.

Instead of the string `"json"`, you can pass **a schema object.**

```bash
curl -X POST http://localhost:11434/api/chat -H "Content-Type: application/json" -d '{
  "model": "llama3.1",
  "messages": [{"role": "user", "content": "Tell me about Canada."}],
  "stream": false,
  "format": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "capital": {"type": "string"},
      "languages": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["name", "capital", "languages"]
  }
}'
```

`"json"` means "as long as it's JSON"; a schema pins down **field names and
types.** From the parsing side that's a large difference. The first you have to
receive and inspect; the second arrives in a shape you decided in advance.

## The parameter name on `/api/show`

The notes' `/api/show` call:

```bash
curl http://localhost:11434/api/show -d '{"name": "llama3.1"}'
```

The current documented parameter name is **`model`**. `name` is the older
spelling; every other endpoint takes `model`, so it appears to have been
unified.

Methods are worth listing too. The notes give `/api/ps` and `/api/tags` as bare
URLs, which suggests opening them in a browser — and that works, because both
are GET.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/ps` | GET | models currently loaded in memory |
| `/api/tags` | GET | models available locally |
| `/api/show` | POST | model details (`model` field) |
| `/api/generate` | POST | one-shot generation |
| `/api/chat` | POST | conversation (`messages` array) |
| `/api/embed` | POST | embeddings |
| `/api/version` | GET | version |

## What to know before opening it up

Every URL in the notes is `localhost`, because that's the default.

> Ollama binds 127.0.0.1 port 11434 by default.

**Local access only.** To use it from another machine you change the bind
address.

> Change the bind address with the `OLLAMA_HOST` environment variable.

One thing worth flagging here. **The FAQ tells you how to change the bind
address and says nothing about authentication.** As far as I could find in the
documentation, there's no entry corresponding to an API key or auth setting. So
opening the address should be read as meaning **anyone who can reach that port**
can use the model.

The CORS default is documented.

> Ollama allows cross-origin requests from `127.0.0.1` and `0.0.0.0` by default.
> Additional origins can be configured with `OLLAMA_ORIGINS`.

None of this matters while you're using it alone locally. From the moment you
want to call your dev machine's Ollama from another device, **what sits in front
of it becomes part of the decision.**

## Wrapping up

- **`stream` defaults to `true`**, and then a JSON object arrives per token.
  The "long answer" in the notes was **the output format, not the answer.**
- Between the notes' two requests, **prompt, `format` and `stream` all changed
  at once.** Only `stream: false` shortened the screen.
- To shorten the answer itself, use **`options.num_predict`**. Delivery and
  production are separate problems.
- **`format: "json"` is paired with an instruction in the prompt.** The docs say
  "It's important to also instruct the model to respond in JSON."
- Since December 2024 you can pass **a JSON schema object to `format`**, pinning
  field names and types.
- `/api/show`'s parameter is now **`model`**; the notes' `name` is the older
  spelling.
- The default bind is **`127.0.0.1:11434`**, changed via `OLLAMA_HOST`. **The
  FAQ makes no mention of authentication.**

Hitting endpoints one at a time with `curl` is a good way to work. What muddied
this particular diagnosis was **not changing one thing at a time.** Change three
together and get a better result, and all three keep the credit. Narrowing the
cause here would have gone faster by **reducing the variables** than by reading
the documentation.

Since the plan was to wire this into tooling, the distinction wasn't something
to wave past. In `curl`, `stream` is a question of whether the screen is messy;
the moment you call it from code it becomes **the decision between parsing one
response and reading line by line.** Defaulting to `true` has already made that
choice for you.

## References

- [API — ollama/ollama](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Structured outputs — Ollama](https://ollama.com/blog/structured-outputs)
- [FAQ — Ollama](https://docs.ollama.com/faq)
- Source: [Trying out the ollama api](https://ride-wind.tistory.com/122)
