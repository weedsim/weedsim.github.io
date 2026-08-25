---
pubDatetime: 2026-08-25T18:00:00+09:00
title: "The Graphics Pipeline: How a Vertex Becomes a Pixel"
lang: en
translationKey: graphics-pipeline
featured: false
draft: false
tags:
  - Graphics
  - Rendering
  - GPU
  - Unity
description: "Every stage 3D geometry passes through on its way to becoming pixels, including vertex post-processing, output merger, and the newer mesh shader path."
---

Drawing a single triangle on screen goes through more steps than you might
expect. It looks like you hand the GPU some vertex coordinates and it draws
them for you, but in between there is a fixed sequence of stages, and knowing
what each stage is responsible for is what lets you pin down where a
performance problem is coming from.

Search for this topic in Korean and you mostly get articles that summarize it
into about five stages. That isn't wrong, but they often **leave out a few
decisive stages**. The vertex shader's output gets described as if it were
already screen coordinates, or the final stage that handles depth testing and
blending is missing entirely.

So I went through the whole thing in order. The reference points are the
official Direct3D, Vulkan, and OpenGL documentation.

## Table of contents

## Why "pipeline"

In 3D computer graphics, the graphics pipeline is **the staged procedure that
turns three-dimensional geometry into a two-dimensional raster image**. It is
also called the rendering pipeline.

The name "pipeline" comes from the factory assembly line. Once a vertex passes
through the vertex shader and moves on to the next stage, the vertex shader
doesn't sit idle — it takes the next vertex immediately. Splitting the work
into stages means **different data is processed at different stages at the same
time.** That is why a GPU can push everything through thousands of cores at
once.

Stages come in two kinds.

- **Fixed-function** — baked into the hardware. You can change its settings,
  but you can't change what it does with code.
- **Programmable** — you write a shader to define what it does.

## The full set of stages

I use the Direct3D names as the baseline and list the corresponding OpenGL and
Vulkan names alongside them.

| # | Stage | Kind | OpenGL / Vulkan |
|---|---|---|---|
| 1 | Input Assembler (IA) | Fixed | Vertex Specification |
| 2 | Vertex Shader (VS) | Programmable | Vertex Shader |
| 3 | Hull Shader (HS) | Programmable | Tessellation Control Shader |
| 4 | Tessellator | Fixed | Tessellation Primitive Generator |
| 5 | Domain Shader (DS) | Programmable | Tessellation Evaluation Shader |
| 6 | Geometry Shader (GS) | Programmable | Geometry Shader |
| 7 | Stream Output (SO) | Fixed | Transform Feedback |
| 8 | Vertex post-processing | Fixed | Vertex Post-Processing |
| 9 | Rasterizer (RS) | Fixed | Rasterization |
| 10 | Pixel Shader (PS) | Programmable | Fragment Shader |
| 11 | Output Merger (OM) | Fixed | Per-Sample Operations |

As a flow, it looks like this. The numbers match the table above, and the
stages marked `← optional` are the ones you can skip.

```text
Buffers
 │
 ▼
[1] Input Assembler ─────────── Assemble primitives
 │
 ▼
[2] Vertex Shader ───────────── Once per vertex, transform to clip space
 │
 ├─▶ [3-5] Tessellation (Hull → Tessellator → Domain)         ← optional
 │
 ├─▶ [6] Geometry Shader ── Create or modify primitives       ← optional
 │
 ├─▶ [7] Stream Output ──── Capture results back to memory    ← optional
 │
 ▼
[8] Vertex Post-Processing ──── Clipping → perspective divide → viewport transform
 │
 ▼
[9] Rasterizer ──────────────── Generate fragments, interpolate attributes
 │
 ▼
[10] Pixel / Fragment Shader ── Determine fragment color
 │
 ▼
[11] Output Merger ──────────── Depth/stencil test, blending
 │
 ▼
Render target
```

## The stages one by one

### 1. Input Assembler — fixed

Reads data from the vertex buffer and index buffer, **assembles it into
primitives (points, lines, triangles)**, and hands them to the next stage.

This is where the index buffer earns its keep. A corner of a cube is shared by
three faces; instead of storing three copies of the vertex data, you store one
copy and reference it by index, which cuts both memory and vertex shader
invocations.

### 2. Vertex Shader — programmable

Runs **exactly once per vertex**. Per-vertex work — transforms, skinning,
morphing, per-vertex lighting — happens here.

The most common job is coordinate transformation. Usually you multiply by three
matrices in sequence.

- **Model matrix (M)** — the model's local space → world space
- **View matrix (V)** — world space → camera-relative space
- **Projection matrix (P)** — view space → clip space

> **A matrix is a transform, not a space.** You'll sometimes see explanations
> along the lines of "the model matrix = the space the model sits in," but
> strictly it is **a mapping that moves things from one space into another**.
> Blur that distinction and there's no way to explain why the next stage is
> needed.

And here's the important part — **the vertex shader's output is not screen
coordinates.** The result of multiplying by the projection matrix is **clip
space in homogeneous coordinates**, with the `w` component still live. Getting
to screen coordinates takes stage 8 on top of that.

### 3-5. Tessellation — Hull → Tessellator → Domain

This is the section Korean summaries most often drop entirely. The three stages
work as a single unit, **subdividing a low-detail surface on the GPU** into
higher-detail primitives.

- **Hull Shader** (programmable) — sets the tessellation factors, i.e. how
  finely to subdivide.
- **Tessellator** (fixed) — performs the actual subdivision according to those
  factors.
- **Domain Shader** (programmable) — computes the final position of each vertex
  produced by the subdivision.

Used to subdivide terrain or characters dynamically based on camera distance.
You send only a low-resolution mesh and let the GPU generate the detail, which
saves bandwidth.

### 6. Geometry Shader — programmable

A shader that takes primitives as input and **can generate new vertices**. Used
for billboards, outlines, debug normal visualization, and the like.

In practice, though, people reach for it carefully. The output vertex count is
variable, which makes parallelization awkward, and one of the reasons the mesh
shader (covered below) exists at all is that the geometry shader's processing
model is inefficient.

### 7. Stream Output — fixed

Takes the results of the geometry shader (or of the vertex shader, if there is
no geometry shader) and **returns them into a memory buffer instead of drawing
them to the screen.**

Useful when you want this frame's GPU results as next frame's input — particle
simulation, for example. OpenGL calls it Transform Feedback.

### 8. Vertex post-processing — fixed

This stage was missing entirely from the source article, and it's **where the
misconception that "the vertex shader produces screen coordinates" comes
from**. After the last vertex-processing shader finishes, the following happens
in order.

1. **Clipping** — cuts away primitives that fall outside the view volume. This
   is why off-screen triangles don't cost you any rasterization.
2. **Perspective divide** — divides the clip coordinates' `x, y, z` by `w` to
   produce **normalized device coordinates (NDC)**. Perspective — distant
   things looking smaller — is actually created right here. The projection
   matrix set up the division; this stage performs it.
3. **Viewport transform** — maps NDC into actual **framebuffer coordinates**
   according to the viewport settings (position, width, height, depth range).

Only once these three are done is "where on screen" finally decided.

### 9. Rasterizer — fixed

**Converts primitives, which are vector information, into a raster image made
of pixels.** It produces a **fragment** for every position the triangle covers.

One more thing here — the rasterizer doesn't just determine positions, it
**interpolates vertex attributes**. The UVs, normals, and colors of the three
corners get blended to match each point inside the triangle and passed along.
Every value the fragment shader receives is a result of this interpolation.

You'll often see it explained as "color isn't handled at the rasterization
stage." It's true that this stage doesn't *decide* the final color, but
**interpolation of attributes, color included, happens right here.**

### 10. Pixel Shader / Fragment Shader — programmable

Runs per fragment and **decides the color**. Sampling textures with the
interpolated UVs, computing lighting from the interpolated normals, applying
normal maps — all of that happens here.

Direct3D calls it the pixel shader; OpenGL and Vulkan call it the fragment
shader. Same stage — but **a fragment and a pixel are not the same thing.**

A fragment is "a candidate that has put itself forward to occupy this pixel
slot." If a character stands behind a wall, one pixel slot gets two fragments;
turn on MSAA and one pixel gets several samples. **Which of the competing
fragments becomes the final pixel is decided by the next stage.**

### 11. Output Merger — fixed

The last stage of the pipeline, and one the source article didn't have at all.
Quoting the official documentation directly:

> The output-merger (OM) stage generates the final rendered pixel color using a
> combination of pipeline state, the pixel data generated by the pixel shaders,
> the contents of the render targets, and the contents of the depth/stencil
> buffers. The OM stage is **the final step for determining which pixels are
> visible (with depth-stencil testing) and blending the final pixel colors**.

So two things get decided here.

- **Depth and stencil testing** — discards occluded fragments.
- **Blending** — mixes translucent surfaces with the colors already drawn.

This stage is the reason translucent objects have to be sorted back-to-front
before drawing. Blending is an operation against "the color already in the
render target," so the result changes with draw order. Opaque objects are
insensitive to order because the depth test keeps only the nearest one
regardless of the order things arrive in.

## What's changed since 2020

Most Korean material on this topic was written around 2020. Two big changes to
the pipeline itself have landed since then.

### Mesh shaders — a path that replaces the front end wholesale

A new path that **replaces with two stages** the geometry front end that used to
run `IA → VS → HS → Tessellator → DS → GS`. Here's how the Direct3D spec puts
it.

> VS, HS, DS, and GS shader stages are replaced with Amplification Shader and
> Mesh Shader. Roughly, Mesh shaders replace VS+GS or DS+GS shaders and
> Amplification shaders replace VS+HS.

- **Amplification Shader** (optional) — decides how many Mesh Shader workgroups
  to launch. Vulkan calls it the Task Shader.
- **Mesh Shader** (required) — a workgroup cooperatively produces vertex and
  index data, and that output goes straight to the Rasterizer.

The key concept is the **meshlet**. You pre-split geometry into small chunks
with upper bounds on vertex count and triangle count, which then lets you cull
and apply LOD per chunk. Think of it as handling geometry with the flexibility
of a compute shader, without going through the fixed-function Input Assembler.

It isn't free, though. You have to restructure your geometry toolchain around
meshlets.

Vulkan got it in September 2022 as `VK_EXT_mesh_shader`, which focused on
matching feature compatibility with Direct3D 12.

### Vulkan pipelines — you don't have to build them anymore

Material from 2020 commonly says something like this: "Vulkan can't modify a
graphics pipeline, so you have to swap shaders or build a new pipeline."

**That was true at the time.** Vulkan's model was to precompile a pipeline
object for every shader combination, and as the combinations grew, the
permutations exploded.

Now there's an alternative. `VK_EXT_shader_object`, released on March 31, 2023,
introduced `VkShaderEXT`, **a shader object compiled separately per stage**.
All state becomes dynamic, and you can attach shaders in arbitrary
combinations.

Pipelines haven't gone away, though. As the official blog puts it,
"applications can use only pipelines, only shader objects, or an arbitrary mix
of both." So it's **an option, not a replacement**.

## Where this maps to in Unity

The `#pragma` directives in ShaderLab that specify which stage an HLSL function
compiles to correspond directly to the pipeline stages.

```hlsl
#pragma vertex vert       // vertex shader
#pragma fragment frag     // fragment shader
#pragma geometry geom     // geometry shader
#pragma hull hull         // hull shader
#pragma domain domain     // domain shader
```

The two you use day to day are the first two. The other three only go in when
you need them.

Knowing the pipeline stages lets you narrow down where a performance problem
lives.

- **High vertex count** → the vertex shader runs once per vertex, so the cost
  scales with it.
- **Heavy overdraw** → the same pixel slot gets fragments several times over,
  and the fragment shader runs for each one. Translucency that fills the screen
  is especially expensive.
- **Translucent sorting looks wrong** → because blending in the Output Merger
  depends on draw order.
- **Lots of draw calls** → that means running through the pipeline that many
  times.

## Wrapping up

You don't need to memorize the pipeline, but knowing **which stage is
responsible for what** keeps paying off.

- The vertex shader only gets you as far as **clip space**. Screen coordinates
  come out of the perspective divide and viewport transform in vertex
  post-processing.
- The Rasterizer creates fragments and **interpolates attributes**.
- What's visible and what gets blended is decided by the **Output Merger**.
  Depth testing and blending live there.
- A fragment is a pixel candidate, not a pixel.

And when reading older material, it's worth checking first **whether any stages
are missing**. An explanation without vertex post-processing and the Output
Merger can't tell you why perspective happens or why translucency needs
sorting.

---

### References

- [Graphics pipeline — Direct3D 11, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d11/overviews-direct3d-11-graphics-pipeline)
- [Fixed-Function Vertex Post-Processing — Vulkan Specification](https://docs.vulkan.org/spec/latest/chapters/vertexpostproc.html)
- [Mesh Shader — DirectX Specs](https://microsoft.github.io/DirectX-Specs/d3d/MeshShader.html)
- [Mesh Shading for Vulkan — Khronos](https://www.khronos.org/blog/mesh-shading-for-vulkan)
- [You Can Use Vulkan Without Pipelines Today — Khronos](https://www.khronos.org/blog/you-can-use-vulkan-without-pipelines-today)
- [HLSL pragma directives reference — Unity](https://docs.unity3d.com/6000.4/Documentation/Manual/SL-PragmaDirectives.html)

The starting point for this post was
[3D Graphics — What is the Graphics Pipeline? (Korean)](https://parodev.tistory.com/30).
I took the stage breakdown from it and rewrote the explanations and the
fact-checking against the official documentation listed above.
