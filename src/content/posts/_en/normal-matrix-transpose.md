---
pubDatetime: 2026-10-15T17:10:00+09:00
title: "What Decides the Matrix for a Normal Isn't the Inverse, It's Where the Vector Sits"
lang: en
translationKey: normal-matrix-transpose
featured: false
draft: false
tags:
  - Graphics
  - Rendering
  - Shader
  - Math
  - GPU
description: "Lecture notes on vertex processing, clipped while studying shaders by applying them. I checked three of its rules against the specs — the matrix a normal gets multiplied by, the cross-product order for the three camera axes, and what to change going from right-handed to left-handed. On the normal, the inverse isn't the wrong answer; what's missing is which side the vector sits on."
---

**I clipped this while studying shaders by applying them and reading around.**
I started from the using side, and points kept coming up where I couldn't
explain why this value gets multiplied by that matrix, so I went looking one
layer down.

What I clipped is a set of lecture notes. It's a blog write-up of chapter 5,
"vertex processing", from Professor Han Jung-hyun's KUOCW course, and it follows
the transforms inside the vertex shader in world → view → projection order. It
opens by saying **"basic knowledge of linear algebra is required"**, which is
how far into the math it goes.

**It doesn't cover the pipeline's stage list itself.** That story is already
written up in
[The Graphics Pipeline in Order: From Vertex to Pixel](/en/posts/graphics-pipeline/).
What this post looks at is **the formulas used inside that stage**.

Three rules come up in the notes. I checked all three against the specs.

| The rule as the notes write it | Result of checking against the spec |
|---|---|
| normals are "calculated with the **inverse** of the Linear transform matrix" | the spec says **transpose of the inverse**; the condition that makes them equal is missing |
| camera axes: `u = n × UP`, `v = n × u` | `u` matches the spec; `v` has **the cross-product order reversed** |
| right-handed → left-handed is "**just flip the sign of z**" | the Direct3D docs say **"two changes"** |

**The first one became this post's title because "the inverse" isn't a wrong
answer.** Put the vector on the matrix's left and the plain inverse is right;
put it on the right and you need the transpose. What's missing from the notes
isn't the transpose but **the one clause that fixes that position**. Without
it there's no answer to which of the two forms you should use.

The third one has the clearest symptom. Flip only the sign of z and **the front
and back of the triangle stay inverted**.

## Table of contents

## The matrix a normal gets multiplied by: the inverse, or the transpose of the inverse

Here's how the notes write the normal transform.

> When calculating the normal vector, you can see in the figure below that
> operating directly with the Linear transform matrix from the affine transform
> matrix \[L|t\] applied to each object does not give the right value.
>
> So what should you do? You calculate with the inverse of the Linear transform
> matrix.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

**The first sentence is accurate.** Multiply a normal by the transform matrix
directly and perpendicularity to the surface breaks. Apply a non-uniform scale
and it shows immediately. And since translation has no effect on a normal,
looking only at `L` in `[L|t]` is right too.

The problem is the second sentence. The GLSL 1.20 spec defines this matrix as a
built-in uniform, and writes its identity in the comment.

> uniform mat3 gl_NormalMatrix;
>
> // transpose of the inverse of the upper leftmost 3x3 of gl_ModelViewMatrix
>
> — [The OpenGL Shading Language 1.20 — Built-In Uniform State](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)

**"transpose of the inverse"** — the **transpose** of the inverse. And it writes
the extent too, **"upper leftmost 3x3"**. That's the part that agrees with the
notes looking only at `L`.

So are the notes wrong? **That's too strong a call.** There are cases where the
inverse alone is right, and the condition is **which side of the matrix the
vector sits on**. Put the normal on the left as a row vector and the plain
inverse is right; put it on the right as a column vector and you need the
transpose. The two are the same operation.

**What's missing from the notes isn't "the transpose" but "which side".**
Without that one clause, a reader of the rule can't tell which form to use in
their own code.

What's interesting is that Unity ships **both forms as built-in variables.**

> unity_WorldToObject — Inverse of current model matrix.
>
> UNITY_MATRIX_IT_MV — Inverse transpose of model * view matrix.
>
> — [Built-in shader variables reference — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-UnityShaderVariables.html)

**One inverse, one inverse transpose.** And yet the same page **doesn't say
which of the two is for normals.** No row in the whole table mentions normals.
The built-in shader function list is the same — the rows there that deal with
normals are `EncodeViewNormalStereo`, `DecodeViewNormalStereo` and
`ShadeVertexLights`, and **which matrix a normal gets moved by isn't written.**

| Form | Vector position | Matrix used | Note |
|---|---|---|---|
| `n' = n · M⁻¹` | left (row vector) | the inverse | the form the notes write |
| `n' = (M⁻¹)ᵀ · n` | right (column vector) | transpose of the inverse | the form the GLSL spec defines |
| `n' = M · n` | right | the transform matrix itself | **the wrong form** (the notes say so too) |
| extent | — | upper leftmost 3×3 | the spec writes `upper leftmost 3x3` |

The inverse has one more trap. Unity's docs record it.

> You can not invert a matrix with a determinant of zero.
>
> If you attempt this, inverse returns Matrix4x4.zero instead.
>
> — [Matrix4x4.inverse](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-inverse.html)

**If any axis has a scale of 0 you get the zero matrix, not an exception.**
Every normal becomes a zero vector and the lighting simply comes out black. For
an object whose scale can hit 0, check this path first.

## One of the three camera axes has a cross-product order different from the spec

Here's how the notes build the three axes of camera space.

> Here n is formed in the direction pointing from EYE to AT. Then the cross
> product of that n with the UP direction, normalized, becomes u. Finally v is
> the cross product of n and u.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

The spec for the function that does the same job defines the axes one by one.
That's `gluLookAt`.

> creates a viewing matrix derived from an eye point, a reference point
> indicating the center of the scene
>
> The matrix maps the reference point to the negative z axis and the eye point
> to the origin.
>
> The UP vector must not be parallel to the line of sight from the eye point to
> the reference point.
>
> — [gluLookAt — OpenGL 2.1 reference](https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/gluLookAt.xml)

The spec takes `F = center − eye` normalized as `f`, defines `s = f × UP` and
`u = (s/‖s‖) × f`, then stacks the matrix's three rows as `s`, `u`, **`−f`**.
Lined up against the notes' three sentences it comes out like this.

| Axis | The notes | The `gluLookAt` spec | Result |
|---|---|---|---|
| view direction | `n` = EYE → AT | `f` = eye → center | **same** |
| horizontal axis | `u = n × UP` | `s = f × UP` | **same** |
| vertical axis | `v = n × u` | `u_spec = s × f` | **cross-product order is reversed** |
| matrix's third row | `n` | **`−f`** | the sign is reversed |

**The vertical axis has its cross-product order flipped.** `n × u` is `f × s`,
which is the opposite sign of the spec's `s × f`. A cross product changes sign
when you swap the order, so using it as written gives a vertically inverted
axis.

The third row's sign is worth noting too. The spec says **"maps the reference
point to the negative z axis"**. The point being looked at has to go to
**negative z**, so camera space's third axis points **opposite** to the view
direction. The notes call that axis the view direction itself.

**But don't read this as "the lecture is wrong".** Both conventions genuinely
exist, and Unity uses both inside one project. Unity's docs write it directly.

> Note that camera space matches OpenGL convention: camera's forward is the
> negative Z axis.
>
> This is different from Unity's convention, where forward is the positive Z
> axis.
>
> — [Camera.worldToCameraMatrix](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-worldToCameraMatrix.html)

**In the world +Z is forward, and in camera space −Z is forward.** Two
conventions coexist inside the same engine, and the notes' `n` matches **Unity's
world convention** while running opposite to the **camera-space** one. The point
isn't which is right but that **the set of three definitions has to agree as a
set**. The notes' three sentences agree with each other (`u × v = n` holds), but
they can't be dropped into the matrix `gluLookAt` stacks as they are.

**Let me state the limit of what I checked.** I compared **the sentences in the
write-up** against the specs. I did not compare the original lecture or the
textbook's definitions. The textbook may define `n` as `EYE − AT` and align the
rest with that, in which case the divergence happened in the transcription.
**Which it is, you'd have to see the textbook to know.**

## Going from RHS to LHS, what to change is two things, not one

Here's how the notes sum up the handedness conversion.

> RHS is the way OpenGL does it and LHS is said to be Direct3D, but the
> hardware is built the LHS way, so a conversion ends up being required.
>
> To keep the view from changing when going from RHS to LHS or the reverse, you
> flip the sign of the z value.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

The API side is right. The Direct3D docs say it in their own words.

> Direct3D uses a left-handed coordinate system. If you are porting an
> application that is based on a right-handed coordinate system, you must make
> two changes to the data passed to Direct3D.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**"you must make two changes"** — two. And the same page writes those two out,
numbered.

> Flip the order of triangle vertices so that the system traverses them
> clockwise from the front. In other words, if the vertices are v0, v1, v2,
> pass them to Direct3D as v0, v2, v1.
>
> Use the view matrix to scale world space by -1 in the z-direction. To do
> this, flip the sign of the _31, _32, _33, and _34 member of the D3DMATRIX
> structure that you use for your view matrix.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**What the notes write is only the second item.** The first — **flipping the
triangle vertex order** — is missing. Flip only z and the coordinates go right
while **the winding stays**, so a face you meant to send as front-facing gets
judged back-facing. With backface culling on, **the model is invisible or you
see its inside.** The coordinates are right, so you start doubting the formula,
and the cause isn't the formula but the winding.

The same page also records the option on the projection side.

> To obtain what amounts to a right-handed world, use the
> D3DXMatrixPerspectiveRH and D3DXMatrixOrthoRH functions to define the
> projection transform.
>
> However, be careful to use the corresponding D3DXMatrixLookAtRH function,
> reverse the backface-culling order, and lay out the cube maps accordingly.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**Here too "reverse the backface-culling order" comes attached.** That culling
order always rides along with a handedness change is the docs' consistent
attitude. It even mentions cube map layout.

| What has to change | How the Direct3D docs put it | The notes |
|---|---|---|
| view matrix's z scale −1 | "scale world space by -1 in the z-direction" | written |
| triangle vertex order | "if the vertices are v0, v1, v2, pass them ... as v0, v2, v1" | **missing** |
| (when using RH projection) culling order | "reverse the backface-culling order" | not mentioned |
| (when using RH projection) cube map layout | "lay out the cube maps accordingly" | not mentioned |

One more thing. The notes write **"the hardware is built the LHS way"**.
**I found no primary source backing that sentence.** The Direct3D docs put
handedness down to **the API's convention** ("Direct3D uses a left-handed
coordinate system") and say nothing about which handedness the hardware is. I
did not find a spec stating that graphics hardware is built for a particular
handedness. **The docs don't say it, so this post doesn't either.**

## The view frustum's four variables match Unity's docs down to the names

The notes define the view frustum with four variables — **fovy, aspect, n, f**.
This side lines up well with the current docs.

> The word frustum refers to a solid shape that looks like a pyramid with the
> top cut off parallel to the base.
>
> the angle between the top and bottom at the apex (known as the field of view
> or FOV)
>
> the ratio of its width to its height (known as the aspect ratio)
>
> The diverging corner lines of the image along with the two clipping planes
> define a truncated pyramid - the view frustum.
>
> — [Understanding the view frustum — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

**"A pyramid with the top cut off"** rather than a trapezoid — even that phrasing
connects with the notes, which call it "a trapezoid, or a space like a
rectangular pyramid with the top cut off". How you read and write `n` and `f`
from a script, and what interval those two values set in screen-coordinate
conversion, is written up in
[Some Functions Read z as a Distance and Others Throw It Away](/en/posts/screentoworldpoint-vs-ray/).

The notes separate culling from clipping — removing objects outside the view is
View Frustum Culling, taking only part of an object is clipping. That
distinction is right, and Unity's docs pin the **granularity** in one word.

> cameras perform frustum culling, which excludes all Renderers that don't
> fall within the view frustum
>
> — [Understanding the view frustum — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

**It's per `Renderer`.** If one object straddles the frustum, culling doesn't
drop it, and the cutting happens later in the pipeline per primitive. That the
notes' two words point at **different stages, not the same one**, becomes clear
here.

## The vertex shader's output isn't a cube, it's a homogeneous coordinate

The notes explain clip space at the end like this.

> Through this you can represent the object in a square space. This square
> space is what's called Clip space.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

The spec calls the value a vertex shader produces something else.

> vec4 gl_Position; // must be written to
>
> The variable gl_Position is available only in the vertex language and is
> intended for writing the homogeneous vertex position.
>
> All executions of a well-formed vertex shader executable must write a value
> into this variable.
>
> — [The OpenGL Shading Language 1.20 — Special Variables](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)

**"homogeneous vertex position".** At this point the spec attaches no space name
and writes only **homogeneous coordinate**. Becoming a square — a cube, strictly
— happens **after** dividing by `w`, and that division and the stages after it
are written up step by step in
[The Graphics Pipeline in Order: From Vertex to Pixel](/en/posts/graphics-pipeline/).
That the notes point out the projection matrix's last row isn't `(0,0,0,1)` and
that the `-1` makes perspective is **pointing at exactly the place that prepares
that division**. That much is right; only the name got attached one stage early.

`must be written to` is worth noting as well. **If a vertex shader doesn't write
this value, the result is undefined by the spec.** The output the notes describe
as "finally producing clip space at the far right" is, in the spec, **not a
choice but an obligation**. That this obligation is everywhere — that a
post-process shader has a vertex stage too — is written up in
[The Definition Describes a Pixel Shader, Not a Shader](/en/posts/what-is-a-shader/).

## The lecture material has its own errata

The notes leave the lecture material's address as a reference. I opened it.

| Item | State |
|---|---|
| lecture YouTube channel | link present |
| textbook page (`media.korea.ac.kr/books/`) | **opens** |
| textbooks | *Introduction to Computer Graphics with OpenGL ES* and one other |
| lecture material | per-chapter PDF and PPT distributed |
| **errata** | **published separately** (dated 2022-06-23) |

**That errata are published matters for this post.** It means the textbook
itself has a record of corrections, and the write-up, authored in January 2022,
**predates that errata.** So this post did not compare the notes' sentences
against the textbook — it doesn't quote the textbook, and compares only against
**public specs** (the GLSL spec, the `gluLookAt` reference, the Direct3D docs,
Unity's docs). Whether there's a difference between the notes and the textbook
**you'd have to look at the textbook and its errata to know.**

## Where and why you'd use it

These three rules bite immediately **when you write a custom shader or build
camera matrices yourself**. Which routes you can write a custom shader through is
laid out in
[The Table on Unity's Custom Shaders Page Is a Fork, Not an Index](/en/posts/unity-custom-shaders/).
Move a normal wrong and the lighting is wrong; get an axis definition out of
step and the screen inverts; drop the winding from a handedness change and the
model disappears. All three are the kind of error that **compiles and runs**, so
**judging by numbers** is faster than eyeballing whether the formula is right.

### A working example

A script that compares the three normal-transform forms numerically in one
scene. It applies a non-uniform scale and prints, as a dot product, whether the
transformed normal is **still perpendicular** to the transformed surface. Close
to `0` means perpendicularity held.

**There's one part the doc sentences can't settle**, so
`Matrix4x4.MultiplyVector` gets printed too. Its doc says **"only the rotation
part of the matrix is taken into account"**, and the sentence alone doesn't
separate whether that means the upper-left 3×3 or extracting only the rotation
component. **I can't run it in my environment, so I don't write it as fact and
hand the verdict to this script.**

```csharp file="Scripts/Graphics/NormalMatrixProbe.cs"
using UnityEngine;

public class NormalMatrixProbe : MonoBehaviour
{
    [Header("Transform to apply")]
    [Tooltip("A non-uniform scale exposes the difference. A 0 zeroes the inverse")]
    [SerializeField]
    private Vector3 _scale = new Vector3(3f, 1f, 1f);

    [Tooltip("Rotation alone makes all three forms agree")]
    [SerializeField]
    private Vector3 _eulerAngles = new Vector3(0f, 30f, 0f);

    [Tooltip("The component that must not affect the normal")]
    [SerializeField]
    private Vector3 _translation = new Vector3(5f, 0f, 0f);

    [Header("Surface to check")]
    [Tooltip("Two edges on the surface. Their cross product is the original normal")]
    [SerializeField]
    private Vector3 _edgeA = new Vector3(1f, 1f, 0f);

    [SerializeField]
    private Vector3 _edgeB = new Vector3(0f, 1f, 1f);

    private void Start()
    {
        Probe();
    }

    [ContextMenu("Judge now")]
    private void Probe()
    {
        Matrix4x4 model = Matrix4x4.TRS(
            _translation, Quaternion.Euler(_eulerAngles), _scale);

        // The docs say "You can not invert a matrix with a determinant of
        // zero" and "inverse returns Matrix4x4.zero instead".
        Matrix4x4 inverse = model.inverse;
        if (inverse == Matrix4x4.zero)
        {
            Debug.LogError("The inverse is the zero matrix. A scale is 0.", this);
            return;
        }

        Vector3 normal = Vector3.Cross(_edgeA, _edgeB).normalized;

        // Move the surface with the transform matrix. These are directions,
        // so translation must stay out.
        Vector3 movedEdgeA = Multiply3x3(model, _edgeA);
        Vector3 movedEdgeB = Multiply3x3(model, _edgeB);

        // Build each of the three forms.
        Vector3 byModel = Multiply3x3(model, normal);
        Vector3 byInverseLeft = MultiplyRow3x3(inverse, normal);
        Vector3 byInverseTranspose = Multiply3x3(inverse.transpose, normal);
        Vector3 byMultiplyVector = inverse.transpose.MultiplyVector(normal);

        Report("transform matrix itself", byModel, movedEdgeA, movedEdgeB);
        Report("inverse · row vector (left)",
            byInverseLeft, movedEdgeA, movedEdgeB);
        Report("inverse transpose · column",
            byInverseTranspose, movedEdgeA, movedEdgeB);
        Report("MultiplyVector(inv transpose)",
            byMultiplyVector, movedEdgeA, movedEdgeB);
    }

    // Column vector on the right. Uses only the upper-left 3×3.
    private static Vector3 Multiply3x3(Matrix4x4 m, Vector3 v)
    {
        return new Vector3(
            m.m00 * v.x + m.m01 * v.y + m.m02 * v.z,
            m.m10 * v.x + m.m11 * v.y + m.m12 * v.z,
            m.m20 * v.x + m.m21 * v.y + m.m22 * v.z);
    }

    // Row vector on the left. Transpose relation to the one above.
    private static Vector3 MultiplyRow3x3(Matrix4x4 m, Vector3 v)
    {
        return new Vector3(
            v.x * m.m00 + v.y * m.m10 + v.z * m.m20,
            v.x * m.m01 + v.y * m.m11 + v.z * m.m21,
            v.x * m.m02 + v.y * m.m12 + v.z * m.m22);
    }

    private void Report(
        string label, Vector3 movedNormal, Vector3 edgeA, Vector3 edgeB)
    {
        Vector3 unit = movedNormal.normalized;
        float dotA = Mathf.Abs(Vector3.Dot(unit, edgeA.normalized));
        float dotB = Mathf.Abs(Vector3.Dot(unit, edgeB.normalized));

        // Close to 0 means still perpendicular to the transformed surface.
        Debug.Log(
            $"{label}: |dot A| = {dotA:F6}, |dot B| = {dotB:F6}", this);
    }
}
```

Set the scale non-uniform, like `(3, 1, 1)`, run it, and the four lines of
numbers diverge. Set the scale to `(1, 1, 1)` and the four lines agree —
**because rotation and translation alone don't separate the three forms**, which
is why a test without a non-uniform scale can't catch this problem.

The verdict comes from the numbers **in your own editor**. I have no environment
where I ran this script, so I don't write down which line prints `0`. The
expectation is clear, though — the spec defines the normal matrix as the
**"transpose of the inverse of the upper leftmost 3x3"**, so the third line is
the reference.

### How to choose

| What you want | What to use | The sentence behind it |
|---|---|---|
| move a normal to world space | transpose of the inverse, upper-left 3×3 | "transpose of the inverse of the upper leftmost 3x3" |
| the same with a row vector | the plain inverse, vector on the left | the two forms are a transpose apart |
| via a Unity built-in | `UNITY_MATRIX_IT_MV` | "Inverse transpose of model * view matrix" |
| when a scale can be 0 | check the inverse first | "inverse returns Matrix4x4.zero instead" |
| build a camera matrix yourself | `gluLookAt`'s axis definition order | "maps the reference point to the negative z axis" |
| using Unity's camera space | assume forward is **−Z** | "camera's forward is the negative Z axis" |
| port RHS material to D3D | change **both** things | "you must make two changes" |
| handedness changed and the model vanished | look at winding and culling order first | "reverse the backface-culling order" |

Here's the order I'd decide in.

1. **Check whether there's a non-uniform scale.** Without one the three normal
   forms don't separate. With one, go to the spec's form.
2. **Decide which side the vector sits on.** Without deciding that, there's no
   answer to whether "the inverse" or "the transpose of the inverse" is right.
3. **Tie the coordinate conventions into one set.** The view axis direction, the
   cross-product order, and the projection matrix's sign have to agree. Change
   just one and it breaks.
4. **When changing handedness, look at the winding too.** The docs said two.

### Where not to use it

- **Multiplying a normal by the transform matrix directly.** The notes say it's
  wrong too, and a non-uniform scale shows it immediately.
- **Reading "the inverse" and not fixing the vector's position.** The matrix to
  use differs between putting it on the left and on the right.
- **Not checking the inverse when a scale can be 0.** The zero matrix comes back
  and every normal becomes 0.
- **Testing the normal transform with rotation only.** The three forms give the
  same result.
- **Dropping the notes' axis set into a `gluLookAt`-shaped matrix.** The
  vertical axis's cross-product order and the third row's sign are reversed.
- **Applying Unity's world convention (+Z forward) to camera space.** The docs
  say camera space has **−Z forward**.
- **Flipping only the sign of z in RHS → LHS.** The docs say **"two changes"**,
  and the missing one is the triangle vertex order.
- **Doubting the formula when the model is invisible after a handedness
  change.** The coordinates can be right and the winding still left over.
- **Assuming "the hardware is built for a particular handedness".** I found no
  spec backing that sentence.
- **Assuming clip space is a cube.** It becomes a cube after dividing by `w`.

## Summary

- The GLSL spec defines the normal matrix as **"transpose of the inverse of the
  upper leftmost 3x3 of gl_ModelViewMatrix"**. The notes' "inverse" is **the
  form with the vector on the left**, and that condition is missing from them.
- Unity gives **both the inverse (`unity_WorldToObject`) and the inverse
  transpose (`UNITY_MATRIX_IT_MV`)** as built-ins. But **which one is for
  normals that page doesn't say.**
- `Matrix4x4.inverse` returns **the zero matrix**, not an exception, when the
  determinant is 0.
- Of the three camera axes, **the vertical axis's cross-product order is the
  reverse of the `gluLookAt` spec's**, and the matrix's third row sign is
  reversed too. The spec says **"maps the reference point to the negative z
  axis"**.
- Unity's docs state directly that **the world is +Z forward and camera space
  is −Z forward.** Two conventions sit inside one engine.
- For RHS → LHS the Direct3D docs say **"you must make two changes"**. The notes
  have **only the z sign**, and **the triangle vertex order (`v0, v2, v1`)** is
  missing. When using the RH projection functions, **"reverse the
  backface-culling order"** comes attached as well.
- **I found no primary source for "the hardware is built the LHS way".** The
  docs put handedness down to the API's convention.
- The view frustum's fovy, aspect, n and f line up well with Unity's docs, and
  **frustum culling is per `Renderer`.** Clipping is a later stage's per-primitive
  work.
- The spec calls `gl_Position` a **"homogeneous vertex position"** and pins it
  with **"must be written to"**. The cube comes after dividing by `w`.
- The lecture's textbook page opens and **errata are published separately.**
  This post doesn't quote the textbook and compares only against public specs.

---

### References

- [The OpenGL Shading Language 1.20 — Khronos specification (PDF)](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)
- [gluLookAt — OpenGL 2.1 reference](https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/gluLookAt.xml)
- [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)
- [Built-in shader variables reference — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-UnityShaderVariables.html)
- [Shader methods in the Built-In Render Pipeline reference — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-BuiltinFunctions.html)
- [Understanding the view frustum — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)
- [Camera.worldToCameraMatrix — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-worldToCameraMatrix.html)
- [Matrix4x4.inverse — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-inverse.html)
- [Matrix4x4.transpose — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-transpose.html)
- [Matrix4x4.MultiplyVector — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4.MultiplyVector.html)
- [Books — Korea University media lab (lecture material and errata)](http://media.korea.ac.kr/books/)

The clipping is Sudo-soqmffhrm's Tistory post
[컴퓨터 그래픽스 기초 - Vertex shader(\[KUOCW\] 한정현 교수님 강의)](https://wnthqmffhrm.tistory.com/23)
(2022-01-18), in Korean; the quotes from it are my translations. It's a write-up
from listening to the lecture, and its structure — setting up the pipeline first
and then following it in order — is good. That you must not multiply a normal by
the transform matrix directly, that translation has no effect on a normal, that
the projection matrix's last row isn't `(0,0,0,1)` — the core points are all
there. This post is a record of filling in **the missing half of three rules**
on top of that, from public specs. **It compared the write-up's sentences, not
the textbook**, and that's worth saying again.
