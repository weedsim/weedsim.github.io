---
pubDatetime: 2026-10-03T17:00:00+09:00
title: "There Is No `--parameters` Flag"
lang: en
translationKey: ollama-api-hosting
featured: false
draft: false
tags:
  - Ollama
  - LLM
  - API
  - Local LLM
  - Infrastructure
description: "A guide that lays out serving Ollama locally as an API across eleven sections. Install and CLI are usable as written, but the three sections actually about hosting are each wrong. And the setting you hit first when several clients connect isn't in the guide."
---

Separately from game development, this continues the thread of **finding a way to
attach a local LLM to my dev tooling through Ollama.** In
[the earlier post](/posts/ollama-api-basics/) I went through Ollama's REST API for
the same reason, getting as far as separating `stream` from `options` on the
request-body side. That post ended like this.

> From the moment you want to call your dev PC's Ollama from another device,
> **you have to decide what goes in front of it too.**

This post is that "in front of it." It's a 2025 piece, a comprehensive guide
bundling install, systemd, security and an FAQ into eleven sections.

**The install and CLI sections are usable as written.** The four commands
`ollama pull`·`ps`·`run`·`stop` are in the current CLI reference as they are, and
the install script URL is right.

The problem is **the three sections actually about hosting.** The commands in the
performance tips use a flag that doesn't exist, the systemd sample writes a file
that gets erased on upgrade, and the security section contradicts its own section
5. And **the setting you hit first** when several clients connect isn't in the
guide.

## Table of Contents

## Install and CLI Are Usable as Written

What's right first. Four commands are in the CLI reference as they are.

| The guide | Current CLI reference |
| --- | --- |
| `ollama pull llama3:8b` | `ollama pull gemma4` |
| `ollama ps` | "List running models" |
| `ollama run llama3:8b` | `ollama run gemma4` |
| `ollama stop llama3:8b` | "Stop a running model" |

That `ollama stop` is there at all is a virtue of a 2025 post. Early Ollama had no
command for taking a loaded model down.

The bind-address description is right too.

> `ollama serve` → binds to `http://127.0.0.1:11434`

Same as the FAQ's sentence.

> Ollama binds 127.0.0.1 port 11434 by default.

The model names reveal the date. The whole guide uses `llama3:8b` while the current
docs' examples are `gemma4` and `gpt-oss:20b`. `llama3:8b` hasn't disappeared, but
you should read it knowing it was **a reasonable pick in March 2025.**

## There Is No `--parameters` Flag

Section 8, performance tips. Two of its four items read like this.

> - **Context length**
> - `ollama run llama3:8b --parameters num_ctx=2048`
> - **Temperature and batch**
> - `ollama run llama3:8b --parameters temperature=0.1,num_batch=128`

**There is no `--parameters` flag in the CLI reference.** There's no flag list for
`ollama run` in the docs at all, and the docs hand you off to environment
variables.

> To view a list of environment variables that can be set run
> `ollama serve --help`

I'm saying it doesn't exist from **reading the docs rather than running it**, so I
leave open the chance of an undocumented flag. But the docs point at three places,
and none of the three is `--parameters`.

**First, the API's `options`.** The same slot from
[the earlier post](/posts/ollama-api-basics/). `num_ctx` lives there.

> **options** — Runtime options that control text generation

> **num_ctx** — Context length size (number of tokens)

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3:8b",
  "prompt": "What is machine learning?",
  "stream": false,
  "options": { "num_ctx": 2048, "temperature": 0.1 }
}'
```

**Second, a Modelfile.** The way to pin values and use it like a model. The CLI
reference writes out the procedure.

```
FROM llama3:8b
PARAMETER num_ctx 2048
PARAMETER temperature 0.1
SYSTEM """You answer concisely."""
```

```bash
ollama create my-llama -f Modelfile
ollama run my-llama
```

**Third, context length alone has its own environment variable.** The FAQ even
gives the default.

> The default context window is **4096 tokens**, configurable via
> `OLLAMA_CONTEXT_LENGTH`.

4096 by default. The guide offering `num_ctx=2048` as a "performance tip" is
**lowering** from that default, and what the default is isn't in the guide. That's
a number you need before you lower it.

| Where it's set | Scope | Documented way |
| --- | --- | --- |
| The API's `options` | That one request | `"options": { "num_ctx": 2048 }` |
| A Modelfile | That whole model | `PARAMETER num_ctx 2048` |
| `OLLAMA_CONTEXT_LENGTH` | The whole server | Environment variable (default 4096) |
| A `--parameters` flag | — | **Not in the docs** |

## Writing a New systemd Unit Gets Erased on Upgrade

Section 5's systemd sample.

```
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
Environment="OLLAMA_HOST=0.0.0.0"
ExecStart=/usr/local/bin/ollama serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

The content itself is plausible. The problem is **where you write this file.**
Section 3 of the same guide points at the install script.

> `curl -fsSL https://ollama.com/install.sh | sh`

That script **already creates `/etc/systemd/system/ollama.service`.** Overwrite it
with the above and the next install or upgrade rewrites it, and `OLLAMA_HOST`
disappears. You end up in a "but I definitely set that" state without knowing why.

What the FAQ points at isn't writing the unit file but **adding an override.**

```
systemctl edit ollama.service
```

Then write only the environment variables in the `[Service]` section.

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

```
systemctl daemon-reload
systemctl restart ollama
```

`systemctl edit` doesn't touch the unit file; it creates
**`.../ollama.service.d/override.conf`**. The original unit stays, so the setting
survives an upgrade overwriting it.

| | The guide's way | The FAQ's way |
| --- | --- | --- |
| File you touch | All of `ollama.service` | `ollama.service.d/override.conf` |
| After an upgrade | The setting is gone | It stays |
| What you write | The whole unit (7 lines) | Only env vars (2 lines) |
| Room to get it wrong | `ExecStart` path, `User` | Almost none |

The `ExecStart=/usr/local/bin/ollama serve` the guide writes is risky on its own.
The binary path differs by install method, and get it wrong and the service won't
come up at all. The override side doesn't write a path, so that failure can't
happen.

## The `/api/pull` Field Isn't `name`

The last line among section 6's REST API examples.

```bash
# Download a model
curl -X POST http://localhost:11434/api/pull -d '{"name":"phi3:mini"}'
```

The current API docs' parameter list reads like this.

> **model** (required): Name of the model to download
>
> **insecure** (optional): Allow downloading over insecure connections
>
> **stream** (optional, default true): Stream progress updates

**The field name is `model`.** `name` is the old name and isn't in the docs'
parameter list. Compatibility may remain, but it isn't what someone starting today
should lean on.

There's something to note about the other examples in that section too. Three of
the four don't pass `stream`.

```bash
curl http://localhost:11434/api/generate \
     -d '{"model":"llama3:8b","prompt":"What is machine learning?"}'
```

The docs' default decides the result.

> **stream** — When true, returns a stream of partial responses
>
> Default: `true`

**Streaming is the default.** This `curl` spits out not one block of answer but
**several JSON objects** in a row. Type it in a terminal for the first time and it
becomes "why is this so long." That's the confusion
[the earlier post](/posts/ollama-api-basics/) covered, and the guide never once
writes `"stream": false`.

To see it as one block, write it like this.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3:8b",
  "prompt": "What is machine learning?",
  "stream": false
}'
```

## The Settings Hosting Needs Are Missing

The title is a guide "for API hosting," and **there's no section covering several
clients connecting.** The FAQ has three such settings, and all their defaults are
small.

> - `OLLAMA_MAX_LOADED_MODELS`: Maximum concurrently loaded models
>   (default: 3 × GPU count, or 3 for CPU)
> - `OLLAMA_NUM_PARALLEL`: Parallel requests per model (**default: 1**)
> - `OLLAMA_MAX_QUEUE`: Maximum queued requests before rejection (default: 512)

The middle line matters most. **Concurrent requests per model default to 1.** Two
people asking at once means one waits. It's invisible in a local setup you use
alone, and surfaces the moment you open it as an API and a second client connects.

The queue isn't infinite either. Past 512 it **rejects.** The guide's FAQ table has
"404 or connection failure → check whether `ollama serve` is running, and the
firewall," but a failure under load may be this rather than those two.

The memory-side default is worth knowing too.

> By default, models remain in memory for **5 minutes**.

Five minutes. And you change it with `keep_alive`.

> - **Duration strings**: "10m" or "24h"
> - **Seconds**: numeric values like 3600
> - **Negative numbers**: keep loaded indefinitely (e.g., -1)
> - **Zero**: unload immediately

In hosting this value cuts both ways. **If the model comes down every five
minutes, the next first request waits for loading** — several seconds for a 7B
model. Set it to `-1` and it holds VRAM continuously, leaving no room for another
model to load.

| Setting | Default | What to think about when hosting |
| --- | --- | --- |
| `OLLAMA_NUM_PARALLEL` | **1** | Raise it to the number of concurrent users |
| `OLLAMA_MAX_LOADED_MODELS` | 3 (CPU) / 3 × GPU count | How many model kinds you'll run |
| `OLLAMA_MAX_QUEUE` | 512 | Past this, requests are rejected |
| `OLLAMA_KEEP_ALIVE` | 5 minutes | First-request delay ↔ VRAM occupancy trade |
| `OLLAMA_CONTEXT_LENGTH` | 4096 | Give it more and per-request memory grows |

That the last two rows are tied together is the point. Raise
`OLLAMA_NUM_PARALLEL` to 4 and that model needs **four copies of its context at
once.** Section 8 offering `num_ctx` as a "performance tip" is really this
calculation, and without a concurrent-request count the calculation doesn't stand
up.

## That There's No Authentication Is in the Docs

Section 9, the security guide.

> - Local-only is the default. When exposing remotely, consider a **TLS reverse
>   proxy + Basic Auth**
> - Block 11434 at the firewall
> - Verify untrusted GGUF/Modelfiles before use

The first and third lines are right. The second **contradicts section 5 of the same
guide.** Section 5 tells you this.

> ```
> # All interfaces + default port
> OLLAMA_HOST=0.0.0.0 ollama serve
> ```

It tells you to open on 0.0.0.0 and four sections later to block it at the
firewall. Do both and it's blocked after all; do only one and **an API with no
authentication is open on the network.**

That there's no authentication isn't a guess. It's written **in a comment** in the
OpenAI compatibility docs' example code.

```python
from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:11434/v1/',
    api_key='ollama',  # required but ignored
)
```

> `api_key='ollama',  # required but ignored`

**The client demands the value and the server ignores it.** So section 9's
"consider a TLS reverse proxy + Basic Auth" isn't optional — it's **mandatory once
you've decided to open it.** Write it down as "consider" and you skip it.

The range of what can be done once it's open is worth noting too. Section 6 of the
guide already shows it — `/api/pull` lets someone **download models.** It isn't
just inference for free; it means **someone can fill your disk.**

| What someone who can reach that port can do | Endpoint |
| --- | --- |
| Inference requests | `/api/generate`, `/api/chat` |
| See which models are loaded | `/api/tags`, `/api/ps` |
| Download models | `/api/pull` |
| Connect with an OpenAI client | `/v1/chat/completions` |

That last row isn't in the guide at all. The next section looks at it.

## Where and Why You'd Use It

### Serving From One Box for Other Devices

A setup with Ollama on one dev PC, used from a laptop and a tablet. There's an
order.

**1. Put environment variables in through an override.**

```bash
sudo systemctl edit ollama.service
```

When the editor opens, write only the `[Service]` section.

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_CONTEXT_LENGTH=8192"
Environment="OLLAMA_MODELS=/srv/ollama/models"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

`OLLAMA_MODELS` corresponds to the guide's FAQ table row, "change the model
download path → export OLLAMA_MODELS=/path then restart." But **`export` is
meaningless when running as a service** — shell environment variables don't reach
a process systemd starts. So it goes here with the rest.

**2. Check the values that landed.** Don't believe it — look.

```bash
# Whether the override actually took effect
systemctl show ollama.service --property=Environment

# Which address the server is listening on
ss -tlnp | grep 11434
```

**3. Put authentication in front.** The thing section 9 wrote as "consider."

```nginx
server {
    listen 443 ssl;
    server_name ollama.example.lan;

    ssl_certificate     /etc/ssl/certs/ollama.crt;
    ssl_certificate_key /etc/ssl/private/ollama.key;

    location / {
        auth_basic           "ollama";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://127.0.0.1:11434;

        # Keep streamed responses from getting trapped in a buffer.
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
```

`proxy_buffering off` matters. Since the API's `stream` default is `true`, a
reverse proxy that buffers makes **the whole stream collect and arrive at once.** A
client expecting tokens one at a time looks stalled.

**4. Then narrow the bind.** With the proxy on the same machine, Ollama doesn't
need to be on 0.0.0.0.

```
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
```

Only the proxy faces outward and Ollama stays on loopback. Section 9's "block 11434
at the firewall" should really be this shape — not blocking the port, but **never
putting that port outside in the first place.**

### Connecting With an OpenAI Client

The most useful part for hosting among the things missing from the guide. The docs'
first sentence explains it as is.

> Connect OpenAI clients to Ollama. Ollama supports a subset of the OpenAI API.

```bash
curl -X POST http://localhost:11434/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{
  "model": "llama3:8b",
  "messages": [{ "role": "user", "content": "Say this is a test" }]
}'
```

There are six supported endpoints.

| Endpoint | Where it's used |
| --- | --- |
| `/v1/chat/completions` | Chat. Streaming, vision and tools supported |
| `/v1/completions` | Short-form generation |
| `/v1/models` | Model list |
| `/v1/models/{model}` | Info about one model |
| `/v1/embeddings` | Embeddings |
| `/v1/responses` | OpenAI Responses API (non-stateful) |

The reason this pays off is that **you don't have to change client code.** If you
already have tooling written against the OpenAI SDK, you change one line of
`base_url`.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://ollama.example.lan/v1/",
    api_key="unused",   # the server ignores it; the proxy's Basic Auth does the auth
)

resp = client.chat.completions.create(
    model="llama3:8b",
    messages=[{"role": "user", "content": "What is AI?"}],
)
print(resp.choices[0].message.content)
```

Section 7 of the guide points at the `ollama` Python package. That one is official
too and works fine, but **it becomes Ollama-specific code.** Connect via `/v1` and
switching to a different backend later only changes `base_url`. If you plan to
start with a local model and move it remote when needed, this side is cheaper.

### Where Not to Use It

**Leaving `OLLAMA_HOST=0.0.0.0` on and trusting the firewall alone.** Section 9's
second line. One firewall rule coming undone and **an API with no authentication is
immediately exposed.** Keep it on loopback with a proxy in front as above, and even
if a rule comes undone, what's reachable from outside is a proxy with
authentication.

**Making `OLLAMA_KEEP_ALIVE=-1` the default.** The first-request delay goes away in
exchange for holding VRAM continuously. Read alongside
`OLLAMA_MAX_LOADED_MODELS`, set two models to `-1` and a third can't load. It's a
setting for a server with only one model.

**Running it in a container without resource limits.** Running Ollama with Docker
is a common setup, and as seen in
[the post on resource limits](/posts/docker-resource-limits/), **there is no limit
by default.** Model loading grabs several GB at once, so with no limit another
process on the host dies first. Set `--memory` to the model size plus context
headroom, and turn swap off by giving `--memory-swap` the same value.

**Running `ollama serve` in a terminal and calling it a service.** Section 3's
Windows item points at running `ollama serve`, and that **ends when the terminal
closes.** If it has to stay up, you go to systemd (Linux) or service registration
(Windows), and where to write the environment variables then becomes the earlier
section's story.

## Wrapping Up

This guide's install and CLI sections are usable as written. The four commands
`pull`·`ps`·`run`·`stop` match the current reference, and the default bind address
matches the FAQ. The eleven-section layout makes it easy to see what to look for.

The three sections about hosting go wrong. Section 8's **`--parameters` flag isn't
in the docs**, and the places that set context length are three: the API's
`options`, a Modelfile, and `OLLAMA_CONTEXT_LENGTH`. Section 5's **systemd sample
is shaped to overwrite the unit file the install script created**, so it gets erased
on upgrade — what the FAQ points at is adding an override with `systemctl edit`.
Section 9's **"block 11434 at the firewall" contradicts the `0.0.0.0` bind in the
same guide's section 5.**

And what the title promised is missing. **The setting you hit first when hosting as
an API is `OLLAMA_NUM_PARALLEL`, and its default is 1.** The moment a second client
connects, one person waits. It's a number invisible while you use it alone, so if
it isn't in a "comprehensive guide" there's no occasion to find it.

On authentication the docs are more candid. One comment line in the OpenAI
compatibility example is the whole of it —
`api_key='ollama',  # required but ignored`. So section 9's "consider" should be
read as **mandatory once you've decided to open it.**

---

### References

- [FAQ — Ollama Docs](https://docs.ollama.com/faq)
- [CLI reference — Ollama Docs](https://docs.ollama.com/cli)
- [Generate a response — Ollama API Docs](https://docs.ollama.com/api/generate)
- [Pull a model — Ollama API Docs](https://docs.ollama.com/api/pull)
- [OpenAI compatibility — Ollama Docs](https://docs.ollama.com/api/openai-compatibility)

The starting point for this post was [블로글러 — 로컬 환경에서 API 호스팅을 위한 Ollama 설정 종합 가이드](https://memoryhub.tistory.com/entry/%EB%A1%9C%EC%BB%AC-%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C-API-%ED%98%B8%EC%8A%A4%ED%8C%85%EC%9D%84-%EC%9C%84%ED%95%9C-Ollama-%EC%84%A4%EC%A0%95-%EC%A2%85%ED%95%A9-%EA%B0%80%EC%9D%B4%EB%93%9C)
(2025-03-02). I followed its eleven sections' procedures, checking the CLI flags,
the systemd configuration method, the API field names and the concurrency-related
environment variables against the current Ollama docs.
