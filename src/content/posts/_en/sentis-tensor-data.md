---
pubDatetime: 2026-08-26T10:00:00+09:00
title: "Accessing Tensor Data Directly in Sentis: Why and How to Avoid Readback"
lang: en
translationKey: sentis-tensor-data
featured: false
draft: false
tags:
  - Unity
  - Sentis
  - AI
  - On-device AI
  - GPU
description: "The bottleneck in on-device inference is usually not inference itself but data movement between GPU and CPU. Here are the Sentis APIs that reduce it."
---

I landed on this documentation page while building something with Sentis.
Getting a model loaded and running is just a matter of following the samples,
but the questions start right after that. **Where does the inference result
live right now, and is getting it out free?**

When you run a neural network in Unity, the slow part is not always inference
itself. If the model runs fine on the GPU and frames still hitch, it is worth
suspecting **the step that brings the result back to the CPU**.

The official docs have a page on this problem. It walks you through reading
and writing a tensor's native data directly, but **why you would want to** goes
by in a single line. That one line is really the reason this entire API exists.

While going through it, I also cover the versioning problem, because on this
topic **following older material verbatim won't even compile**.

## Table of contents

## First, there are four names

Search for this package and several names come up. Here is the breakdown.

| What | Value |
|---|---|
| Package ID | `com.unity.ai.inference` |
| Namespace | `Unity.InferenceEngine` |
| Package Manager display name | **Sentis** |
| Old package ID | `com.unity.sentis` (no longer used) |

It was Sentis originally, became Inference Engine, and after that **only the
display name went back to Sentis.** A staff reply on the Unity forum makes it
clear.

> The name has changed back to Sentis. The package name remains the same. You
> shouldn't need any code changes, and the package is findable via either name
> in package manager.

In other words, **only the display name was reverted; the package ID and the
namespace stayed the same.** That is also why the documentation page title
still reads "Sentis."

Only one thing trips you up in practice. **The `using` statement differs by
version.**

```csharp
// The com.unity.sentis era (2.1 and earlier)
using Unity.Sentis;

// Current (com.unity.ai.inference)
using Unity.InferenceEngine;
```

The upgrade guide tells you to **use Unity's automatic API updater, or replace
every `Unity.Sentis` with `Unity.InferenceEngine`.** Class and method names did
not change.

If Sentis sample code you found online doesn't compile, this is usually why.
All the code below assumes the current namespace. **The latest version as of
writing is 2.6.1.**

## Why access it directly — readback

The docs say it in their first sentence: when you hand tensors between models
or access them, read and write the native data directly **to avoid "slow
readback."**

Readback is **pulling a result that sits in GPU memory into CPU memory.** Why
that is expensive makes sense once you think about how a GPU works.

The CPU queues up commands for the GPU and immediately moves on to the next
thing. The two run asynchronously. But the moment the CPU says it wants to read
a GPU computation result **right now**, it has to wait for the GPU to finish up
to that point. In effect, the CPU stalls until the queued pipeline drains.

So readback is wasted work in cases like these.

- **Passing model A's output into model B as input** — both run on the GPU, so
  there is no reason to detour through the CPU in between.
- **Drawing the result as a texture** — the data is headed back to the GPU
  anyway.

Conversely, if C# logic has to act on the final result (the index of a
classification, say), readback is unavoidable. In that case it is better to
request it **asynchronously** and check for completion.

## Checking where a tensor lives

A tensor's `backendType` tells you where its data is.

```csharp
using UnityEngine;
using Unity.InferenceEngine;

public class CheckTensorLocation : MonoBehaviour
{
    public Texture2D inputTexture;

    void Start()
    {
        Tensor inputTensor = TextureConverter.ToTensor(inputTexture);
        Debug.Log(inputTensor.backendType);
    }
}
```

The value is one of three.

| Value | Meaning |
|---|---|
| `BackendType.CPU` | CPU memory |
| `BackendType.GPUCompute` | Compute shader memory (`ComputeBuffer`) |
| `BackendType.GPUPixel` | Pixel shader path |

`tensor.dataOnBackend.backendType` gives you the same value. `dataOnBackend` is
the backend-specific internal representation, and `backendType` is the short
form that skips going through it.

## Forcing a move — Pin

You can move the data to whichever side you want.

```csharp
Tensor<float> inputTensor = new Tensor<float>(new TensorShape(1, 3, 2, 2));

// Force it onto GPU compute memory
ComputeTensorData computeTensorData = ComputeTensorData.Pin(inputTensor);
```

- `ComputeTensorData.Pin` — to GPU compute shader memory (`ComputeBuffer`)
- `CPUTensorData.Pin` — to CPU memory

**There are two behavioral rules to remember.**

- If the data is already on that device, **it does nothing** (pass-through).
- Otherwise it **discards the existing data and allocates anew on the target
  backend.**

The second one matters. It means that calling `Pin` repeatedly without thinking
triggers an allocation and a copy every time.

## Reading and writing CPU data directly

You can read and write a tensor when it is on the CPU and **every operation
that depends on it has finished.** So you check two conditions.

```csharp
var tensor = new Tensor<float>(new TensorShape(1, 2, 3));
//...
if (tensor.backendType == BackendType.CPU && tensor.IsReadbackRequestDone()) {
    // Safe to read and write directly
    tensor[0, 1, 0] = 1f;
    tensor[0, 1, 1] = 2f;
    tensor[0, 1, 2] = 3f;
    float val = tensor[0, 0, 2];
}
```

Instead of the indexer, you can also take it in **flattened form**. The memory
layout is **row-major**.

```csharp
var tensor = new Tensor<float>(new TensorShape(1, 2, 3));
//...
if (tensor.backendType == BackendType.CPU && tensor.IsReadbackRequestDone()) {
    var nativeArray = tensor.AsReadOnlyNativeArray();
    float val010 = nativeArray[3 + 0];
    float val011 = nativeArray[3 + 1];
    float val012 = nativeArray[3 + 2];

    var span = tensor.AsReadOnlySpan();
    float val002 = span[2];
}
```

`[0,1,0]` maps to flattened index `3` because the layout is row-major. The
shape is `(1, 2, 3)`, so the last axis is laid out in contiguous runs of three,
and index 1 on the second axis starts at `1 × 3 = 3`.

Just as the name says, `AsReadOnly...` is **read-only**. To write, use the
indexer.

## Uploading directly into backend memory

`Upload` lets you push data in.

```csharp
var tensor = new Tensor<float>(new TensorShape(1,2,3), new [] { 0f, 1f, 2f, 3f, 4f, 5f });
tensor.Upload(new [] { 6f, 7f, 8f });
// The tensor data is now {6,7,8,3,4,5}
```

It overwrites from the front and leaves the rest untouched.

**There is a caveat.** The method works on every backend, but **it can block.**
If the tensor is on the CPU it blocks until that tensor's pending work
finishes; if it is on the GPU it performs a GPU upload. Take that into account
before putting it somewhere that runs every frame.

## Accessing a tensor in GPU memory

Get a `ComputeTensorData` with `ComputeTensorData.Pin`, then access the compute
buffer directly through the `buffer` property. From there it is ordinary
`ComputeBuffer` usage.

The value of this path is that **the data never leaves the GPU.** When you
post-process an inference result in a compute shader or feed it straight into
rendering, you can chain it together without going through the CPU.

The official `Read output asynchronously` sample demonstrates this pattern.

## Working with a CPU-memory tensor in a Burst job

The object you get from `CPUTensorData.Pin` can be read and written inside
Burst functions such as `IJobParallelFor`.

What matters here is the **fence**. There are two properties for handling job
dependencies.

| Property | Purpose |
|---|---|
| `CPUTensorData.fence` | Read fence |
| `CPUTensorData.reuse` | Write fence |

Burst jobs run asynchronously. So **if a job reads a tensor Sentis is still
writing to**, you get a race condition. Fences are the handles that enforce
that ordering.

To work with it as a native array, use the methods on the `NativeTensorArray`
class.

The official `Use the job system to write data` sample demonstrates this
pattern.

## Summary

- **The package ID is `com.unity.ai.inference`, the namespace is
  `Unity.InferenceEngine`, and the display name is Sentis.** That is why
  `using Unity.Sentis;` in older material doesn't compile.
- The point of direct access is **avoiding readback**. Pulling a result from
  the GPU to the CPU stalls a pipeline that was running asynchronously.
- **Check the location with `backendType`, move it with `Pin`.** `Pin` is a
  pass-through if it is already on the same device, otherwise it discards and
  reallocates.
- To read directly on the CPU, the tensor must be **`BackendType.CPU` and
  `IsReadbackRequestDone()`**. The flattened layout is row-major.
- **`Upload` can block.**
- To keep the data on the GPU and chain onward, use
  `ComputeTensorData.buffer`; to work with it in a Burst job, use
  `CPUTensorData.Pin` plus fences.

In the end these APIs all answer one question. **Where is this data right now,
and do I really need to move it?**

---

### References

- [Access tensor data directly — Inference Engine docs](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/access-tensor-data-directly.html)
- [Upgrade to Inference Engine 2.2](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.2/manual/upgrade-guide.html)
- [Namespace Unity.InferenceEngine](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.4/api/Unity.InferenceEngine.html)
- [Did Inference Engine package revert to the old Sentis name? — Unity Discussions](https://discussions.unity.com/t/did-inference-engine-package-revert-to-the-old-sentis-name/1695183)
- [Job System — Unity Manual](https://docs.unity3d.com/Manual/JobSystem.html)

The material this post started from is the **Sentis 2.0.0 edition** of the same
document. I used its section structure as a reference and re-checked the
namespaces and APIs against the current docs (2.6.1).
