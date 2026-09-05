---
pubDatetime: 2026-09-05T19:00:00+09:00
title: "Reading the ML-Agents Install Docs: Python 3.10.12 Is a Ceiling, Not a Recommendation"
lang: en
translationKey: ml-agents-install
featured: false
draft: false
tags:
  - Unity
  - ML-Agents
  - AI
  - Python
  - Reinforcement Learning
  - On-device AI
description: "Why ML-Agents installation is so particular, traced back to the toolkit being split in two. What Conda and the exact 3.10.12 are for, how the Unity and Python package versions pair up, and the two names for the inference layer."
---

Putting on-device AI into a game project meant bringing in Sentis, and while
digging into that I clipped the ML-Agents Toolkit installation docs. Searching
for Sentis material pulls ML-Agents pages along with it, because **ML-Agents is
one of the things that uses Sentis.**

The document itself is a procedure: install Unity → set up a Python environment
with Conda → install the Unity package → install the Python package. Follow it
and it works.

What it almost entirely lacks is **the "why."** Why Conda specifically, why a
three-part version like **3.10.12**, why the install order matters — none of
that is stated. And those reasons line up exactly with where installation
fails. So I filled in that side.

## Table of contents

## Why this toolkit comes in two pieces

This is the root of why installation is fiddly. ML-Agents is **not one
package**. From the official manual:

> The C# package does not contain the machine learning algorithms for training
> behaviors ... The machine learning algorithms that orchestrate training are
> part of the companion Python package.

Which splits as:

- **The Unity side (`com.unity.ml-agents`)** — defines agents, observations,
  actions and rewards inside the game, and runs the finished model.
- **The Python side (`mlagents`)** — the actual training algorithms, run with
  `mlagents-learn`.

During training the two **talk over a local socket**: Unity sends observations,
Python returns actions. That's why **their versions have to match**, and why
installation splits across the Unity Package Manager and pip. It's also why the
document insists you install a Python package version matching your Unity
ML-Agents package version.

## Python 3.10.12 is a ceiling, not a recommendation

The document says only:

> Install Python 3.10.12 using Conda

Nothing about why 3.10.12. The `mlagents` package metadata on PyPI answers it:

> Requires-Python: **<=3.10.12, >=3.10.1**

**There's an upper bound.** Not even 3.10.13, let alone 3.11. That's an unusually
narrow range for a modern Python package. If your system Python is 3.11 or
3.12, `pip install mlagents` refuses outright.

That's also why the document tells you to use Conda or Mamba. `venv` only makes
a virtual environment from an **already installed** interpreter, so if 3.10.12
isn't on the system there's nothing to build from. Conda fetches the
interpreter itself at the version you ask for.

```shell
conda create -n mlagents python=3.10.12 && conda activate mlagents
```

**That single line is the most important one in the document.** Skip it and
proceed with the system Python, and none of the later steps matter.

## Pairing up the versions

Filling in the values behind the links the document gives:

| | Current |
| --- | --- |
| Latest release | **Release 23** (2025-09-02) |
| Unity package | `com.unity.ml-agents` **4.0.3** |
| Python package | `mlagents` **1.1.0** (2024-10-05) |
| Minimum Unity | **6000.0** or later |

One thing stands out: **the Python package has been sitting still since October
2024.** Release 23 shipped in September 2025 and `mlagents` on PyPI hasn't
moved. So the document's `pip install mlagents==1.1.0` is still the right
value.

The release cadence is worth noting too: Release 19 (2022-01) → 20 (2022-11) →
21 (2023-10) → 22 (2024-10) → 23 (2025-09) — **roughly annual.** It's now
September 2026, a year on from Release 23, which isn't unusual at that cadence.
Still, it's worth knowing going in that **this isn't a fast-moving project.**

## What needs adjusting today

The clipping is the 4.0 documentation, and a few things have already drifted.

**Package version.** The document is titled 4.0.1; the current Unity package is
**4.0.3**.

**The Preview Packages step.** The document includes:

> Enable **Preview Packages** under the **Advanced** drop-down list if the
> package doesn't appear.

`com.unity.ml-agents` is now published as a **released package**. Adding it by
name finds it, so this step usually isn't needed. It reads like a leftover from
older documentation.

**The PyTorch line.** For Windows it gives:

```shell
pip3 install torch~=2.2.1 --index-url https://download.pytorch.org/whl/cu121
```

`torch 2.2.1` with `cu121` is an early-2024 combination. On a recent GPU that
build may not support your architecture, so it's safer to pick the CUDA build
that matches your hardware from the
[PyTorch installation guide](https://pytorch.org/get-started/locally/) the
document also links. Just don't stray outside the torch range `mlagents`
requires — move up while checking rather than jumping straight to latest.

## Sentis or Inference Engine?

The part that runs the trained model inside Unity goes by two names, and
ML-Agents' own documentation splits between them.

- **The manual body** says trained behaviours are embedded via **Sentis**.
- **The Release 23 notes** say it was upgraded to **Inference Engine 2.2.1**.

And Unity's current inference package is **`com.unity.ai.inference`** 2.3.0,
described as:

> Inference Engine is a neural network inference library for Unity. It lets you
> import trained neural network models into Unity and run them in real-time
> with your target device's compute resources, such as central processing unit
> (CPU) or graphics processing unit (GPU).

So they're **two names for the same thing**, with the older one still sitting
in the ML-Agents docs. Meaning you have to search both `Sentis` and
`Inference Engine` when looking for material. What that inference layer
actually does I wrote up separately in
[accessing tensor data in Sentis](/en/posts/sentis-tensor-data/).

That also settles one more piece of the structure: **training is Python,
inference is Unity.** No Python goes into your build. Training leaves you an
`.onnx` model file, and the game runs it through the Inference Engine.

### If you only need Sentis, you don't need this install

As my own route here shows, it's easy to drift from Sentis into ML-Agents. But
**the relationship is containment, not equivalence.**

- **Inference Engine (Sentis)** — an inference library that runs a trained ONNX
  model inside Unity. It doesn't care where the model came from.
- **ML-Agents** — a **training toolkit** layered on top. You define
  observations, actions and rewards, run reinforcement learning through Python,
  and run the resulting model through the Inference Engine.

So if the goal is **"run a model I already have inside the game"**, adding
`com.unity.ai.inference` alone is enough, and the Conda, PyTorch and Python
packages in this document are all unnecessary. This installation procedure only
earns its keep when the goal is **"train an agent inside the game."**

If you landed on the ML-Agents install docs while looking for Sentis material,
sorting out which of the two you actually need saves the most time.

## Which of the two install methods to pick

The document offers two paths, and the criterion reduces to one question: **do
you need the example environments?**

- **Package installation** — add it by name in the Package Manager and
  `pip install mlagents==1.1.0`. This one if you're not modifying the toolkit.
- **Advanced installation** — clone the repository, add it as a local package,
  and install the Python packages from source. **The example environments (the
  `Project` folder) only exist here.**

Learning it for the first time, Advanced is effectively the default. Getting a
feel for observation, action and reward design without running something like
3D Ball is hard.

The document also explains why you specify a branch when cloning:

```sh
git clone --branch release_23 https://github.com/Unity-Technologies/ml-agents.git
```

Omit `--branch` and you get `develop`, which may contain experimental or
unstable changes.

## Where the order matters

At the end of the advanced install the document emphasises this:

> Install the packages in this order. The `mlagents` package depends on
> `mlagents_envs`. Installing them in the other order will download
> `mlagents_envs` from PyPi, which can cause version mismatches.

```sh
python -m pip install ./ml-agents-envs
python -m pip install ./ml-agents
```

**Reverse the order and something wrong gets installed silently.** Install
`mlagents` first and pip pulls its dependency `mlagents_envs` from PyPI — so
the released build goes in rather than the source you just cloned. You cloned
to modify it, and something else is running. No error appears, which makes it
hard to spot.

The `grpcio` workaround is the same kind of thing.

```shell
conda install "grpcio=1.48.2" -c conda-forge
```

When the wheel build fails, you take a prebuilt one from conda-forge instead. A
common pattern on projects pinned to a narrow Python range.

Finally, verification is one line:

```sh
mlagents-learn --help
```

If it lists the available parameters, the Python side is done.

## Summary

- ML-Agents is **two pieces: a Unity package and a Python package.** The
  training algorithms live only on the Python side, and the two talk locally
  during training. That structure is why installation is involved.
- **Python 3.10.12 is a ceiling, not a recommendation.** PyPI metadata pins it
  to `<=3.10.12, >=3.10.1`. Conda is prescribed because you need the
  interpreter itself at that version.
- Current state: Release 23 (2025-09), Unity package 4.0.3, Python package
  1.1.0 (2024-10), Unity 6000.0 minimum. **The Python side stopped in October
  2024.**
- The "enable Preview Packages" step is usually unnecessary now — it's a
  released package.
- The PyTorch line's `cu121` is an early-2024 combination. On a recent GPU,
  pick the matching CUDA build from the PyTorch installation page.
- The inference layer is called **Sentis** in some docs and **Inference
  Engine** in others. Same thing; the current package is
  `com.unity.ai.inference`. **Training is Python, inference is Unity**, so no
  Python ends up in the build.
- **If your goal is inference only, you don't need this install.** ML-Agents is
  for training; running an existing model just needs
  `com.unity.ai.inference`.
- **The example environments only come with the Advanced install** (cloning the
  repository). Start there if it's your first time.
- Install `ml-agents-envs` first, `ml-agents` second. Reverse it and the PyPI
  build silently replaces your source.

## References

- [Install the ML-Agents Toolkit — Unity](https://docs.unity3d.com/Packages/com.unity.ml-agents@4.0/manual/Installation.html)
- [ML-Agents Toolkit overview — Unity](https://docs.unity3d.com/Packages/com.unity.ml-agents@4.0/manual/index.html)
- [ML-Agents releases — GitHub](https://github.com/Unity-Technologies/ml-agents/releases)
- [mlagents — PyPI](https://pypi.org/project/mlagents/)
- [Inference Engine — Unity](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.3/manual/index.html)
