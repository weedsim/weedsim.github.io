---
pubDatetime: 2026-09-15T18:00:00+09:00
title: "The Six-Step Sentis Workflow: The Ownership and Blocking the Docs Leave Out"
lang: en
translationKey: sentis-workflow
featured: false
draft: false
tags:
  - Unity
  - Sentis
  - AI
  - On-device AI
  - GPU
description: "Unity's official Sentis workflow page is a six-step skeleton. Here is what it omits — the Resources folder, tensor ownership, and the GPU stall hiding in the line that reads your result — filled in against the rest of the same manual."
---

I had decided to put on-device AI into a game project and was working through
the Sentis documentation from the top. The workflow page is effectively the
first gate, and it ends after six steps. You finish it feeling like you know
everything, and then **copying it verbatim does not run.**

This post walks those six steps in order and fills in **what each one leaves
unsaid**, checked against the other pages of the same manual. Three things
caught me: the model isn't found, tensor ownership is ambiguous, and one line
that reads the result stalls the frame.

Keeping tensor data on the GPU is a separate topic, covered in
[Accessing Tensor Data Directly in Sentis](/en/posts/sentis-tensor-data/). This
post is about the step before that — **getting a model loaded and pulling one
result out of it.**

## Table of contents

## The six steps as the page states them

The page opens like this:

1. Use the `Unity.InferenceEngine` namespace.
2. Load a neural network model file.
3. Create input for the model.
4. Create a worker.
5. Run the model with the input to compute a result (inference).
6. Get the result.

Each step comes with one or two lines of code. Stitched together, that is:

```csharp
using Unity.InferenceEngine;

ModelAsset modelAsset = Resources.Load("model-file-in-assets-folder") as ModelAsset;
var runtimeModel = ModelLoader.Load(modelAsset);

Texture2D inputTexture = Resources.Load("image-file") as Texture2D;
Tensor<float> inputTensor = new Tensor<float>(new TensorShape(1, 4, inputTexture.height, inputTexture.width));
TextureConverter.ToTensor(inputTexture, inputTensor);

Worker worker = new Worker(runtimeModel, BackendType.GPUCompute);
worker.Schedule(inputTensor);

Tensor<float> outputTensor = worker.PeekOutput() as Tensor<float>;
```

That's the end. `Dispose` never appears once, and there is no line that pulls an
actual number out of `outputTensor`.

Note also that the namespace is `Unity.InferenceEngine` while the page title
says "Sentis." The package ID is `com.unity.ai.inference`, and only the display
name reverted to Sentis. Why those three names differ is covered in
[the earlier post](/en/posts/sentis-tensor-data/).

## Another page in the same manual has longer code

At the bottom of the workflow page, under "Additional resources," there is a
link to **Workflow example** — the same sequence written out as a working
`MonoBehaviour`. The code there is noticeably different. Quoted as-is:

```csharp
// Create input data as a tensor
using Tensor<float> inputTensor = new Tensor<float>(new TensorShape(1, 1, 28, 28));
TextureConverter.ToTensor(inputTexture, inputTensor);

// ...

// outputTensor is still pending
// Either read back the results asynchronously or do a blocking download call
results = outputTensor.DownloadToArray();

// Release outputTensor memory
outputTensor.Dispose();
```

```csharp
void OnDisable()
{
    // Tell the GPU we're finished with the memory the engine used
    worker.Dispose();
}
```

Everything missing from the six-step page is here: the `using` in front of the
input tensor, a `DownloadToArray()` that actually retrieves the result, a
`worker.Dispose()` in `OnDisable`, and the comment **"outputTensor is still
pending."**

Put plainly: **the six-step page is a page for memorizing API names, not a page
to copy code from.** Copy it without knowing that and you hit the following
three traps.

## Trap 1 — `Resources.Load` cannot read from the `Assets` folder

The six-step page gives these instructions for the model file:

> 2. Add the model file to the `Assets` folder of the **Project** window.
> 3. Create a runtime model in your script.

And then the code is `Resources.Load("model-file-in-assets-folder")`. The
argument literally spells out "model file in assets folder," yet
**`Resources.Load` does not read the `Assets` folder.** Unity's Scripting
Reference is explicit:

> The `path` is relative to any folder named **`Resources`** inside the `Assets`
> folder of your project.

So `Assets/Model.onnx` will not come back from `Resources.Load("Model")`. It has
to be `Assets/Resources/Model.onnx`. Follow the instruction, drop the file in
`Assets`, paste the code, and `modelAsset` is `null` — then `ModelLoader.Load`
throws.

The **Import a model file** page in the same manual doesn't have this problem.
There you drag the file into `Assets` and use a **serialized `ModelAsset`
field** assigned in the Inspector. The six-step page does mention that approach,
in one line:

> You can also add `public ModelAsset modelAsset` as a public variable in
> GameObjects. In this case, specify the model manually.

**Between the two, the Inspector route should be the default.** A `Resources`
folder is always included in the build and has to be held at runtime, which
makes it a poor home for a model weighing tens of megabytes. `Resources.Load`
comes first in the example because the page is short, not because it's the
recommendation.

## Trap 2 — `PeekOutput` ownership, and where the docs contradict each other

The name is already the hint. **You aren't getting it, you're peeking at it.**
The returned tensor is not yours. The **Get output from a model** page nails the
rule down:

> Sentis worker memory allocator owns the reference returned by `PeekOutput`. It
> implies the following:
> - You don't need to use `Dispose` on the output.
> - If you change the output or you rerun the worker, **both** the worker output
>   and the `PeekOutput` copy change.
> - Using `Dispose` on the worker disposes the `PeekOutput` copy.

The second bullet is the one that bites. Hold a `PeekOutput` reference in a
field, call `Schedule` again next frame, and **the contents of the reference you
were holding change.** To keep a value, you have to copy it.

But **here the two pages disagree.** The Workflow example code quoted above
calls `Dispose` on a tensor obtained from `PeekOutput`:

```csharp
Tensor<float> outputTensor = worker.PeekOutput() as Tensor<float>;
results = outputTensor.DownloadToArray();

// Release outputTensor memory
outputTensor.Dispose();
```

The rule page says you don't need `Dispose`; the example page calls `Dispose`
with a comment about releasing memory. Both are readable in the same version of
the manual (2.6.1).

I did not read the source to determine which one wins. That said, **the rule
page is the API-level statement and the example is a consumer of that API**, so
following the rule page seems safer to me. The example's `Dispose` sits in a
context where `Start()` is ending and the worker is about to be cleaned up
anyway, so it happens not to matter there. Moving that same line **into code
that runs every frame** is a different story.

The boundary is easy to draw:

| How you get it | Owner | `Dispose` |
|---|---|---|
| `worker.PeekOutput()` | the worker | not needed |
| `worker.CopyOutput(...)` | the caller | **required** |
| `tensor.ReadbackAndClone()` | the caller (CPU copy) | **required** |
| `tensor.ReadbackAndCloneAsync()` | the caller (CPU copy) | **required** |
| `tensor.DownloadToArray()` | — (returns `T[]`) | n/a |

If `Copy` or `Clone` is in the name it's yours; if it's `Peek`, it's borrowed.

## Trap 3 — The line that reads the result is the line that waits on the GPU

The comment in the Workflow example sums this up in one line:

> `outputTensor` is still pending. Either read back the results asynchronously
> or do a blocking download call.

`worker.Schedule()` is **non-blocking** — the API reference says so — and
`PeekOutput()` is non-blocking too. Nothing has been waited on up to this point.
The computation is merely queued on the GPU.

The wait arrives **when you actually pull the numbers out.** That is exactly
what the warning on the Get output page is about:

> Be careful when you read data from an output tensor. In many instances, you
> might **unintentionally trigger a blocking wait** until the model finishes to
> run before it downloads the data from the graphics processing unit (GPU) or
> Burst to the central processing unit (CPU).

`DownloadToArray()` and `DownloadToNativeArray()` are that blocking path. If the
model takes 50 ms, that frame gets 50 ms longer.

There are two ways around it:

```csharp
// 1) await it asynchronously
using Tensor<float> cpuCopy = await outputTensor.ReadbackAndCloneAsync();
float[] scores = cpuCopy.DownloadToArray();

// 2) request now, check for completion later
outputTensor.ReadbackRequest();
// ... some frames later ...
if (outputTensor.IsReadbackRequestDone())
{
    using Tensor<float> cpuCopy = outputTensor.ReadbackAndClone();
}
```

Once the data is down on the CPU, `DownloadToArray()` has nothing left to wait
for. The expensive part is not the download itself — it's the **synchronization**.

## Where and why you'd use this

That's everything the documentation made me fix. Here is the shape I actually
use: all six steps, with all three traps avoided.

```csharp
using System;
using Unity.InferenceEngine;
using UnityEngine;

/// <summary>
/// Feeds one texture to a model and reports the highest-scoring class index.
/// </summary>
public class TextureClassifier : MonoBehaviour
{
    private const int INPUT_CHANNELS = 3;
    private const int INPUT_SIZE = 224;

    [Header("Model")]
    [SerializeField, Tooltip("The ONNX or LiteRT model dragged into Assets")]
    private ModelAsset _modelAsset;

    [Header("Backend")]
    [SerializeField, Tooltip("Falls back to GPUPixel on devices without compute shaders")]
    private BackendType _preferredBackend = BackendType.GPUCompute;

    private Worker _worker;
    private Tensor<float> _inputTensor;
    private bool _isRunning;

    public event Action<int> OnClassified;

    private void Awake()
    {
        Model runtimeModel = ModelLoader.Load(_modelAsset);

        BackendType backend = _preferredBackend;
        if (backend == BackendType.GPUCompute && !SystemInfo.supportsComputeShaders)
        {
            backend = BackendType.GPUPixel;
        }

        _worker = new Worker(runtimeModel, backend);
        _inputTensor = new Tensor<float>(
            new TensorShape(1, INPUT_CHANNELS, INPUT_SIZE, INPUT_SIZE));
    }

    public async Awaitable ClassifyAsync(Texture source)
    {
        if (_isRunning)
        {
            return;
        }

        _isRunning = true;
        try
        {
            // A size mismatch is handled by linear resampling.
            TextureConverter.ToTensor(source, _inputTensor);
            _worker.Schedule(_inputTensor);

            // PeekOutput is a reference the worker owns. Do not Dispose it here.
            Tensor<float> output = _worker.PeekOutput() as Tensor<float>;

            // Reading output without awaiting would stall this frame on the GPU.
            using Tensor<float> cpuCopy = await output.ReadbackAndCloneAsync();
            OnClassified?.Invoke(ArgMax(cpuCopy.DownloadToArray()));
        }
        finally
        {
            _isRunning = false;
        }
    }

    private void OnDestroy()
    {
        _worker?.Dispose();
        _inputTensor?.Dispose();
    }

    private static int ArgMax(float[] values)
    {
        int best = 0;
        for (int i = 1; i < values.Length; i++)
        {
            if (values[i] > values[best])
            {
                best = i;
            }
        }

        return best;
    }
}
```

A few intentions worth writing down:

- **The input tensor is allocated once in `Awake` and reused.** Allocating a new
  one per call adds that much GC and GPU allocation.
- **`_isRunning` prevents overlapping runs.** Because the input tensor is
  reused, overwriting it before the previous inference finishes gives no
  guarantee about what the worker reads. If you need concurrent inferences, give
  each one its own input tensor.
- **The `?.` in `_worker?.Dispose()` is deliberate.** `Worker` and `Tensor` are
  plain C# objects, not `UnityEngine.Object`, so Unity's fake-null problem
  doesn't apply. Put a `MonoBehaviour` or `GameObject` in that slot and it has
  to be `if (obj != null)`.
- **`BackendType` is exposed in the Inspector.** Which one is fastest on which
  device is not knowable without profiling, and the manual itself lists
  conditions where CPU wins.

### When to pick something other than GPUCompute

The criteria from the **Create an engine** page:

| Backend | Where it fits |
|---|---|
| `GPUCompute` | Fastest for most models; no transfer cost if the output stays on the GPU |
| `CPU` | Faster than GPU for **small models** or when **inputs/outputs are already on the CPU** |
| `GPUPixel` | Only on platforms that lack compute shader support |

The manual explicitly says to check `SystemInfo.supportsComputeShaders` for the
`GPUPixel` case. The fallback in the example above is that sentence transcribed.

`CPU` wins more often than you'd expect. For a **small policy model whose input
is a handful of floats and whose output is a handful of numbers**, the round
trip to the GPU and back costs more than the math. NPC decision models usually
fall into this bucket.

### What kinds of models end up here

- **Policies trained with ML-Agents** — training produces an `.onnx`, and Sentis
  is what runs it at runtime. The training-side setup is in
  [Reading the ML-Agents Installation Docs](/en/posts/ml-agents-install/).
- **Image classification and segmentation** — camera frames or a `RenderTexture`
  fed through `TextureConverter.ToTensor`. That's the example above.
- **Small regression or classification models** — an array turned straight into
  a tensor. No texture conversion, so this is the simplest path.

```csharp
int[] array = new int[] { 1, 2, 3, 4 };
using Tensor<int> inputTensor = new Tensor<int>(new TensorShape(4), array);
```

### Where not to use it

- **Large models you could just send to a server.** On-device inference buys you
  offline operation and the removal of round-trip latency. If you need neither,
  there's no reason to spend the device's memory and thermal budget.
- **Per-frame results that C# logic has to read.** A readback every frame means
  stalling the GPU pipeline every frame. Better to reshape the result into
  something a shader can consume, which is the
  [direct tensor data access](/en/posts/sentis-tensor-data/) topic.

## When one frame isn't enough — `ScheduleIterable`

For a heavy model the structure above still isn't enough, because even though
`Schedule()` is non-blocking, **the GPU still tries to do all of that work in
that frame.** The manual's example is a 50 ms model.

`Worker` has `ScheduleIterable` alongside `Schedule`:

```csharp
public IEnumerator ScheduleIterable()
public IEnumerator ScheduleIterable(Tensor input)
public IEnumerator ScheduleIterable(params Tensor[] inputs)
```

It's an enumerator that runs the model a layer at a time. The **Split inference
over multiple frames** page shows the pattern: call `MoveNext()` a fixed number
of times per frame, then bail out.

```csharp
private const int LAYERS_PER_FRAME = 20;

private void Update()
{
    int layersThisFrame = 0;

    while (_schedule.MoveNext())
    {
        if (++layersThisFrame >= LAYERS_PER_FRAME)
        {
            return; // the rest goes to the next frame
        }
    }

    // reaching here means every layer is done
}
```

The manual's example sets the equivalent of `LAYERS_PER_FRAME` to 20 and spreads
a 50 ms model over roughly 5 ms per frame, and it says to tune that number to
the device.

One thing worth stating: this **does not reduce total time.** 50 ms is still
50 ms, just split across ten frames. It's a technique for removing frame hitches,
not for making inference faster.

## Summary

- **The six-step page is a list of API names.** The code that actually runs is
  on the Workflow example page in the same manual, and that one has the `using`,
  the `DownloadToArray()`, and the `worker.Dispose()`.
- **`Resources.Load` reads the `Resources` folder, not the `Assets` folder.**
  The argument name in the docs invites the mistake. In practice a serialized
  `ModelAsset` field assigned in the Inspector should be the default.
- **`PeekOutput` is borrowed.** The worker owns it, and its contents change when
  you `Schedule` again. Only the results with `Copy` or `Clone` in the name are
  yours to `Dispose` — and on this exact point the rule page and the example page
  contradict each other.
- **`Schedule` and `PeekOutput` are non-blocking; the blocking arrives when you
  pull the numbers.** `DownloadToArray()` is that spot. Defer it with
  `ReadbackAndCloneAsync()`, or split it with `ReadbackRequest()` +
  `IsReadbackRequestDone()`.
- **`GPUCompute` is the default backend, not the absolute one.** `CPU` is faster
  for small models or CPU-resident data, and `GPUPixel` is all you get on devices
  without compute shaders.
- **If it doesn't fit in one frame, `ScheduleIterable` + `MoveNext()`.** It
  changes the distribution, not the total.

Six lines of documentation being short isn't the fault. The problem is that
those six lines tell you **what to call** and never tell you **what waits when,
and who owns what.** In on-device inference, the second group is what actually
eats frames.

---

### References

- [Understand the Sentis workflow — Inference Engine 2.6 manual](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/understand-sentis-workflow.html)
- [Workflow example](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/workflow-example.html)
- [Get output from a model](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/get-the-output.html)
- [Create an engine](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/create-an-engine.html)
- [Split inference over multiple frames](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/split-inference-over-multiple-frames.html)
- [Resources.Load — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Resources.Load.html)

The source this post started from is the **2.4.1 edition** of the same page. The
structure is unchanged; the code and quotations were re-checked against the
**2.6.1** manual, current at the time of writing.
