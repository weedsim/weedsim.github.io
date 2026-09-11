---
pubDatetime: 2026-09-11T15:00:00+09:00
title: "huggingface-cli Is Gone, and the Answer to the SSL Error Is Elsewhere"
lang: en
translationKey: huggingface-model-download
featured: false
draft: false
tags:
  - Python
  - Hugging Face
  - AI
  - Local LLM
  - Security
description: "I checked a write-up on three ways to download a whole Hugging Face model. Two of them use a command removed in v1.0, and recommending git for SSL errors works — for a reason the article doesn't give."
---

Continuing the thread from [the Ollama post](/en/posts/ollama-api-basics/), I was
looking at how to put a local LLM behind some tooling. Once you've picked the
engine that runs it, the next question is where the models come from and how you
get them — which is how I ended up saving a
[write-up](https://shashacode.tistory.com/111) covering three ways to download a
Hugging Face model **as a whole folder.** The title attaches a condition: "for
when the API download won't work and you get SSL errors."

It's from April 2025. Checking it, **the command two of the three methods rely on
no longer exists.** And on the condition in the title — the SSL error situation —
**the method it recommends is right, but the reason it gives isn't the real one.**

## Table of contents

## Two of the three methods don't run

The note attached to method 1:

> ⚠️ If the model requires authentication, log in to huggingface, get a token and
> set it as an environment variable, or run **huggingface-cli login**!

Method 3 is that CLI outright.

```bash
huggingface-cli login
huggingface-cli repo clone mistralai/Mistral-7B-Instruct --type model
```

From the `huggingface_hub` v1.0 migration document:

> The deprecated `huggingface-cli` **has been removed**, `hf` (introduced in
> v0.34) replaces it with a clearer resource-action CLI.

**Removed.** `hf` arrived in v0.34, both ran side by side for a while, and v1.0
dropped the old one. Translated:

| The article | Now |
| --- | --- |
| `huggingface-cli login` | `hf auth login` |
| `huggingface-cli whoami` | `hf auth whoami` |
| `huggingface-cli repo clone <id> --type model` | `hf download <id> --local-dir <path>` |

That last row isn't just a rename. **There is no `repo clone` subcommand in `hf`
today.** `repo` is for creating and managing repositories; downloading is
`download`'s job. What the article describes as "internally uses git-lfs to pull
all the files the same way" has been replaced by `hf download`, which doesn't go
through git-lfs at all.

```bash
hf auth login
hf download mistralai/Mistral-7B-Instruct-v0.3 --local-dir ./mistral
```

`snapshot_download()` itself is unchanged. **The Python function survived and
only the CLI split**, so method 1 still holds and method 3 has to be rewritten
from scratch.

## Recommending git for SSL errors is right, for a different reason

The situation the title names is an SSL error. But the labels the article
attaches don't line up.

- Method 1, `snapshot_download()` — "recommended! **(has security issues)**"
- Method 2, Git + Git LFS — "**(no security issues)**", "((fallback when SSL
  can't be bypassed))"

**All three methods connect to `https://huggingface.co`.** In an environment
where TLS certificate verification fails, `git clone` should hit the same wall.
Yet in practice the git route sometimes works, and that's presumably where the
article's observation came from.

The reason isn't a bypass — it's that **they consult different CA lists.** From
the `requests` documentation:

> Requests uses certificates from the package **certifi**. This allows for users
> to update their trusted certificates without changing the version of Requests.

`huggingface_hub` does HTTP from Python, and the `requests` underneath it reads
**a CA list bundled in a package called `certifi`, not the operating system's
trust store.** In an environment with a corporate inspection appliance in the
middle, that corporate CA may be installed in the Windows certificate store and
still absent from `certifi`. That's why **only Python fails** while fetching the
same address.

| Method | Who does the HTTP | Trust list |
| --- | --- | --- |
| `snapshot_download()` / `hf` | Python `requests` | the `certifi` bundle |
| `git clone` | git | git's backend's store |

**Not "a bypass" but "switching to a client that reads a different store."** So
method 2 working isn't luck — and it also isn't a fix.

## Fixing the Python side

The `requests` docs put the method in the very next paragraph.

> This list of trusted CAs can also be specified through the
> **`REQUESTS_CA_BUNDLE`** environment variable. If `REQUESTS_CA_BUNDLE` is not
> set, `CURL_CA_BUNDLE` will be used as fallback.

Point it at the CA certificate file your organization issued.

```bash
# Windows (PowerShell)
$env:REQUESTS_CA_BUNDLE = "C:\certs\corp-ca.pem"

# macOS / Linux
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/corp-ca.pem
```

If you want to know where the current bundle lives:

```python
from requests.utils import DEFAULT_CA_BUNDLE_PATH
print(DEFAULT_CA_BUNDLE_PATH)
```

**I'm deliberately not writing down how to disable verification.** An SSL error
usually means something in the middle is opening your traffic, and switching
verification off is a declaration that you trust that something unconditionally.
Registering the certificate takes more steps, but it's a different kind of act.

## The example model name doesn't download

All three of the article's methods use the same id.

```python
snapshot_download(
    repo_id="mistralai/Mistral-7B-Instruct",
    local_dir="C:/Users/myname/Downloads/mistral_model"
)
```

**`mistralai/Mistral-7B-Instruct` doesn't download as written.** Opening it
anonymously returns a 401. Mistral's instruct models carry version suffixes like
`-v0.1`, `-v0.2`, `-v0.3`, and they're gated repositories requiring you to accept
terms.

The article's own "extra tips" section covers what to do on a 403 — **token login
for private or gated repos, or clicking the access request button on the web
page** — and its own example is exactly that case. Anyone following along hits
the wall before reaching the tip. Using a repository without conditions, like
`gpt2`, would have kept the flow intact.

## "Has / has no security issues" is never explained

Back to the labels I set aside. **The explanation isn't anywhere in the
article.** And it's hard to make one hold. Methods 1 and 2 **fetch the same files
from the same repository.** Taking a different route doesn't change the files.

The real security question isn't in how you download but in **the moment you open
what you downloaded** — and that applies equally to both. Two things.

**Weight format.** The `safetensors` docs state their reason for existing:

> a new simple format for storing tensors **safely (as opposed to pickle)** and
> that is still fast (zero-copy)

`.bin`-family files are Python pickles, which can run code during
deserialization. If `.safetensors` is available, take that one.

**Custom code execution.** From `transformers` on `trust_remote_code`:

> This option should only be set to True for repositories you trust and in which
> you have read the code, as it will **execute code present on the Hub on your
> local machine.**

The article's third step is
`AutoModelForCausalLM.from_pretrained(model_path)`, and depending on the model
you'll be told to enable that option. **The moment you do, the repository's code
runs on your machine.** If there's a place to write "security issue," it's here.

## What `local_dir` does

The article's example uses `local_dir`, and knowing how it differs from the
default saves confusion later. From the current docs:

> By default, we recommend using the cache system to download files from the
> Hub. ... However, if you need to download files to a specific folder, you can
> pass a `local_dir` parameter. **This is useful to get a workflow closer to
> what the `git` command offers.**

By default it lands in the cache (under `HF_HOME`); pass `local_dir` and it
unpacks into that folder with the original structure. That's what let the article
place it beside `git clone`. One behavior comes along with it:

> A `.cache/huggingface/` folder is created at the root of your local directory
> containing metadata about the downloaded files. This prevents re-downloading
> files if they're already up-to-date.

A `.cache/huggingface/` appears inside the folder you specified. Not knowing that
is puzzling the first time you move or archive a model folder.

For the record, v1.0 removed three parameters: `local_dir_use_symlinks`,
`resume_download` and `force_filename`. If you see those in old code or old
write-ups, they need deleting now.

## What still holds

**The flow of downloading a whole folder and using it as a local path** is intact,
and the article's strength is carrying it all the way through. Plenty of
write-ups stop at the download; this one goes on to hand the folder to
`from_pretrained`.

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

model_path = "C:/Users/myname/Mistral-7B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path)
```

**The local-versus-API comparison table** is sound in shape too. Local loads the
whole model and uses memory; the API barely touches client memory; running a 7–8B
model locally wants 12–16GB of VRAM or more — still a usable rough guide. That
said, **Inference pricing has been restructured several times since, so "free up
to a certain usage" needs rechecking against today.**

Running `git lfs install` first and working from Git Bash are still good advice.

## Wrapping up

- **`huggingface-cli` was removed in `huggingface_hub` v1.0.** It's `hf auth
  login` and `hf download` now, and **there is no `repo clone` subcommand.** The
  article's method 3 needs rewriting entirely.
- `snapshot_download()` itself is unchanged. The Python function stayed; only the
  CLI split.
- **Recommending git for SSL errors works, but for a different reason.** Not a
  bypass: Python's `requests` reads the **`certifi` bundle**, not the OS store.
- **The Python-side answer is `REQUESTS_CA_BUNDLE`.** Point it at the corporate
  CA file. Disabling verification is a different kind of choice.
- **The example `mistralai/Mistral-7B-Instruct` doesn't download.** No version
  suffix, and it's a gated repository — the exact case the article's own 403 tip
  describes.
- **"Has / has no security issues" is unexplained and hard to justify.** Same
  files either way. The real risks are `pickle`-format weights and
  `trust_remote_code`, neither of which depends on how you downloaded.
- Passing `local_dir` unpacks into that folder instead of the cache and **creates
  a `.cache/huggingface/` inside it.** `local_dir_use_symlinks` and two other
  parameters were removed in v1.0.

In a write-up about how to download things, the first thing to spoil was **the
CLI command.** The library function lasted a year and a half; the command-line
tool changed its name.

And the condition in the title turned out to be the most interesting part.
**Finding a way that works and knowing why it works are different things.** The
article did the first, which is why it was worth writing down. But record the
reason as "a bypass" and there's nothing you can do next. **One name — `certifi`
— gives you somewhere to fix.**

From the position of someone wiring up a local LLM, here's what's left. Picking
the engine and fetching the model are separate problems, and **where you get
stuck on the fetching side is usually the route, not the model.** Certificates,
access approval, a renamed command — none of them are about the model, and all
three catch you here.

## References

- [Migrating to huggingface_hub v1.0](https://huggingface.co/docs/huggingface_hub/en/concepts/migration)
- [CLI — huggingface_hub](https://huggingface.co/docs/huggingface_hub/guides/cli)
- [Download files from the Hub — huggingface_hub](https://huggingface.co/docs/huggingface_hub/guides/download)
- [SSL Cert Verification — Requests](https://requests.readthedocs.io/en/latest/user/advanced/)
- [Safetensors](https://huggingface.co/docs/safetensors/index)
- [Auto Classes — Transformers](https://huggingface.co/docs/transformers/main/en/model_doc/auto)
- Source: [\[python\] How to download Hugging Face models](https://shashacode.tistory.com/111)
