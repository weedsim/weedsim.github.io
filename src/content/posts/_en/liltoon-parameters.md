---
pubDatetime: 2026-08-26T01:00:00+09:00
title: "lilToon Parameters: A Reference Cross-Checked Against the Official Docs"
lang: en
translationKey: liltoon-parameters
featured: false
draft: false
tags:
  - Shader
  - Graphics
  - Unity
  - lilToon
  - VRChat
description: "lilToon's inspector is localized, but its official docs are Japanese only — the source of the mistranslations, so I cross-checked every entry."
---

lilToon is among the most widely used toon shaders for avatars. It is MIT
licensed, and its inspector UI **is localized into Korean.** That makes it easy
to pick up at first.

The trouble starts after that. The inspector shows the parameter names in
Korean, but **the documentation that explains what each of those parameters
actually is exists only in Japanese.** So searching for lilToon in Korean
mostly turns up secondary material carried over from those Japanese docs.

Things go wrong in the carrying over. In Korean material, for instance, you run
into an entry like this.

> **림 라이트의 벌금** (literally "the rim light's monetary fine") — the
> thinness of Rim Shade.

The name and the description do not agree with each other. Going back to the
source settles it. The actual property is **「リムライトの細さ」**, that is,
**the thinness of the rim light**. `細さ` means thinness or narrowness; it was
rendered into English as *fine(ness)*, and when that English word was carried
across a second time it came back out in the word's other sense — a **monetary
fine**. The description itself was carried over correctly. Only the parameter
name took that detour.

So I cross-checked the official Japanese documentation entry by entry. **The
baseline is lilToon 2.3.3**, and the coverage extends to the range you touch
most often in the inspector.

**The Japanese parameter names are listed alongside** so you can check against
the source. Use them with the inspector language switched to Japanese, or when
looking an entry up in the official docs.

## Table of contents

## Before you read

- **Which entries you see depends on the display mode.** The lilToon inspector
  has simple settings and advanced settings. Some of the entries below appear
  only in the advanced settings.
- **They also depend on the render pipeline.** Entries marked `[Built-in RP]`
  or `[HDRP]` appear only under that pipeline.
- **Some entries are not in the docs at all.** There are entries present in the
  inspector that the official documentation never describes. Those cases are
  flagged separately below.

---

## Basic settings (基本設定)

The first things you decide — the broad framing of how the material renders.

| Japanese | English | Description |
|---|---|---|
| 描画モード | Rendering mode | The kind of rendering: opaque, cutout, transparent, refraction, and so on |
| Cutoff | Cutoff | Anything at or below this opacity becomes fully transparent |
| Cull Mode (描画面) | Cull Mode | Renders only the specified faces. Single-sided costs less than double-sided |
| 裏面の法線を反転 | Flip backface normals | Inverts the lighting calculation on backfaces |
| 裏面を影にする | Shade backfaces | How strongly backfaces are forced dark. Use it when the inside of clothing looks unnaturally bright |
| 非表示 | Hide | When on, the material is not drawn |
| ZWrite | ZWrite | Whether depth information is written. Leaving it on is generally recommended, though turning it off sometimes improves transparent materials |
| Render Queue | Render Queue | Draw order. Higher values are drawn later. When two transparent materials overlap and one disappears, raise the value of the one that should be in front |

`Cull Mode` and `Render Queue` are not shader-specific features; they map
directly onto the rasterizer and output-merger stages of the graphics pipeline.
That is also why overlapping semi-transparent surfaces are order-dependent.

### Rendering mode list

| Japanese | English | Description |
|---|---|---|
| 不透明 | Opaque | Ignores transparency |
| カットアウト | Cutout | Uses transparency, but semi-transparency is not possible |
| 半透明 | Transparent | Uses transparency. When two semi-transparent surfaces overlap, one may vanish. Used for facial expressions, see-through hair, and the like |
| [高負荷] 屈折 | [Heavy] Refraction | Distorts whatever shows through |
| [高負荷] 屈折ぼかし | [Heavy] Refraction blur | Refraction plus a frosted-glass blur |
| [高負荷] ファー | [Heavy] Fur | Fur. Soft, but the depth ordering can look unnatural |
| [高負荷] ファー (カットアウト) | [Heavy] Fur (cutout) | Drawn with cutout, giving a harder look. Antialiasing improves it somewhat |
| [高負荷] ファー (2パス) | [Heavy] Fur (2-pass) | Blends transparent fur with cutout fur to soften the drawbacks of each |
| [高負荷] 宝石 | [Heavy] Gem | Complex refraction |

---

## Lighting and brightness settings (ライティング設定)

The docs **recommend leaving these at their defaults.** The baseline is the
state right after pressing "Normal" under "Apply preset"; this is the area you
touch only when you deliberately depart from it for photography or video work.

| Japanese | English | Description |
|---|---|---|
| 明るさの下限 | Brightness lower limit | The floor on how dark it can go. Keeps things from going pitch black. 0.0–0.2 recommended for VRChat |
| 明るさの上限 | Brightness upper limit | The ceiling on how bright it can go. Prevents blowing out to white |
| ライトのモノクロ化 | Monochrome lighting | Saturation of the light. Can compensate for a strongly tinted world, but creates a color mismatch with your surroundings |
| 影色への環境光影響度 | Ambient influence on shadow color | How strongly ambient light affects the shadow color |
| Unlit化 | Unlit conversion | Disables lighting to approximate Unlit. Used to compensate for dark worlds, but brightening yourself also makes the avatars around you relatively darker |
| 頂点ライトの強度 | Vertex light strength | Strength of point and spot lights computed per vertex. With several meshes, setting it to 0 reduces brightness differences between them |
| ライト方向のオーバーライド | Light direction override | A vector added to the light direction. It doubles as a fallback, so leaving x, y and z all at 0 can make the material go fully dark where there is no light |
| オブジェクトの向きに追従 | Follow object orientation | The override direction rotates along with the object |
| [Built-in RP] ライトの合成 | Light blending | How additional realtime lights are combined. Additive is optically correct but blows out to white easily; lighten (max) is the opposite |
| [HDRP] Before exposure limit | Before exposure limit | A brightness limit applied before exposure |
| [HDRP] Directional Lightの強さ | Directional Light strength | Strength of the Directional Light applied to the material |

This lighting portion is published separately as a CC0 library called
**OpenLit**. You can use it when you are writing your own shader and want the
brightness to match lilToon.

---

## Color settings (色設定)

### Main color / transparency (メインカラー / 透過)

The base color. If the rendering mode is cutout or transparent, the alpha
channel of the texture or of the color picker is used as opacity.

| Japanese | English | Description |
|---|---|---|
| 色 / 透明度 | Color / opacity | Assign a texture. The color from the picker on the right is multiplied in |
| 色相 / 彩度 / 明度 / ガンマ | Hue / saturation / value / gamma | Color correction. Gamma emphasizes contrast |
| グラデーションマップ | Gradient map | Replaces the coloring with a specified gradient. It is applied per RGB channel, so the result differs depending on whether the input was converted to grayscale |
| 色調補正マスク | Color correction mask | Color correction is disabled wherever the mask is painted black. Uses the R channel |
| 焼き込み | Bake | Exports the color-correction result as a texture |

> **How this interacts with VRChat safety.** The **color of the texture** you
> assign here **is preserved when safety kicks in**, but **colors edited
> through color correction are not.** If you have edited them, baking to a
> texture is the safer route.

The docs describe the final output color like this: the shader performs no
special color processing, so the texture's own color comes through as-is, and
the only thing it does is **multiply by the light color**. With a white light
you get the texture as it is; with a dark orange light you get the texture
multiplied by that color.

### Main color 2nd / 3rd (メインカラー2nd・3rd)

**Layers** placed on top of the main color. Use them for decals, fine surface
detail, hair gradients and so on. You can also convert a GIF to animate them,
or fade them out by distance.

| Japanese | English | Description |
|---|---|---|
| テクスチャ | Texture | `Convert Gif` lets you animate a GIF |
| MSDFテクスチャ | MSDF texture | Requires converting in advance, but allows near-vector representation |
| UV Mode | UV Mode | UV0–3 and MatCap are available |
| デカール化 | Use as decal | Uses the layer as a decal |
| マスク | Mask | Composites only the specified area. Uses the R channel |
| ライティングを適用 | Apply lighting | Applies the light's brightness |
| 合成モード | Blend mode | Normal / additive / screen / multiply |
| 開始距離 / 終了距離 / 強度 | Start distance / end distance / strength | Distance fade settings |
| Tiling / Offset / 角度 | Tiling / Offset / angle | Texture placement |

Turning on decal mode adds further entries: mirror mode, copy mode, X and Y
position and size, frame count and FPS. They are there for flipping through a
sprite sheet as an animation.

### Alpha mask (アルファマスク)

A black-and-white mask that sets opacity. The docs **recommend avoiding it
where possible.** Putting the same information into the main texture's alpha
channel keeps everything in a single texture, whereas using an alpha mask
**means sampling a second texture, which raises the shader's cost.** It is a
feature kept around for compatibility.

| Japanese | English | Description |
|---|---|---|
| アルファマスク | Alpha mask | None (disabled) / replace / multiply. Uses the R channel |
| Invert | Invert | Inverts the mask |
| Transparency | Transparency | Opacity |
| Cutoff | Cutoff | At or below this value it becomes fully transparent |
| Scale・Offset | Scale / offset | The final strength is `AlphaMask * Scale + Offset`. Scale = -1 with Offset = 1 gives an inversion |
| アルファマスクを焼き込み | Bake alpha mask | Applies the mask to the main texture and bakes it in |

The alpha mask is ignored when safety kicks in.

### Shadow settings (影設定)

The part that most shapes the impression lilToon gives. **Blur at 0 gives
anime-style shading; raising it moves toward an illustrated look, and raising
it further toward a realistic one.** Shadows can be set in **up to three
levels**, so lightening the innermost shadow color can even read as bounced
light.

| Japanese | English | Description |
|---|---|---|
| マスクタイプ | Mask type | With "strength", darker weakens the shadow; with "flatten", darker flattens the normals and suppresses the sense of volume |
| マスクと強度 | Mask and strength | Shadow strength. Use it to disable shadows on the face alone. Uses the R channel |
| LOD | LOD | Blur amount for the texture. Lowers the resolution via MipMap to fake a blur |
| ぼかし量マスク | Blur amount mask | Varies the blur amount by area. RGB corresponds to shadow colors 1, 2 and 3 |
| 影色1・2・3 | Shadow colors 1, 2 and 3 | By default they are multiplied into the main color. Alpha is treated as each shadow's blend strength |
| 範囲 | Range | The extent over which the shadow falls |
| ぼかし | Blur | 0 is anime-style, raising it is illustrated, raising it further is realistic. RGB corresponds to shadow colors 1, 2 and 3 |
| ノーマルマップ強度 | Normal map strength | How strongly the normal map is applied to the shadow |
| 影を受け取る | Receive shadows | Receives shadows cast by other objects. **In roofed spaces this often looks off, so turning it off is frequently the better choice** |
| 境界の色 / 境界の幅 | Border color / border width | Lays a color along the shadow boundary. Usable for effects like subsurface scattering |
| コントラスト | Contrast | Multiplies the main color in once more to make the shadow color more vivid |
| 影色への環境光影響度 | Ambient influence on shadow color | Leave the shadow color black and set this to 1 and you get a shadow color close to the Standard Shader |
| AO Map | AO Map | The darker the area, the more readily a shadow appears. RGB corresponds to shadow colors 1, 2 and 3 |
| Min・Max | Min / Max | Remaps the AO Map into this range |

The docs also spell out how the shadow color is computed. Seeing how the
parameters interlock makes it easier to grasp than just moving values around.

```text
影色 = (影色テクスチャがあれば影色テクスチャ、なければメインカラー)
       * カラーピッカーの影色
       * lerp(1.0, メインカラー, コントラスト);

最終的な影色 = lerp(影色, メインカラー, 環境光 * 影色への環境光影響度);
```

The shadow color is **(the shadow color texture if there is one, otherwise the
main color) × the shadow color from the color picker × `lerp(1.0, main color,
contrast)`**, and the final shadow color is that value `lerp`ed toward the main
color by the ambient influence.

The three shadow levels are combined in this order.

```text
影色2・3の合成結果 = lerp(影色3, 影色2, 3影のライティング);
全影の合成結果     = lerp(影色2・3の合成結果, 影色1, 2影のライティング);
最終結果           = lerp(全影の合成結果, メインカラー, 1影のライティング);
```

They are mixed from the innermost (3) outward to (1), and blended with the main
color last.

### RimShade

It adds **shadow along the model's silhouette** to give a sense of volume. As
the docs put it, this is a rim light acting as a shadow, and the effect reads
as 3DCG rather than illustrated.

| Japanese | English | Description |
|---|---|---|
| 色 / マスク | Color / mask | RimShade's color and mask. Uses the R channel |
| ノーマルマップ強度 | Normal map strength | How strongly the normal map is applied |
| 範囲 | Range | The extent over which the shadow falls |
| ぼかし | Blur | 0 is anime-style, raising it is realistic |
| リムライトの細さ | **Rim light thinness** | The so-called **Fresnel** parameter. Strengthens contrast to make the rim narrower |

That last entry is the one from the opening. It is **"thinness", not "a
fine"**, and it adjusts Fresnel contrast.

### Emission settings (発光設定)

For things that **emit light of their own**, like LEDs and lamps. The specified
color is added regardless of light strength, so it shows up especially well in
dark spaces.

| Japanese | English | Description |
|---|---|---|
| 色 | Color | Emission color. UV settings sit behind the triangle beside it |
| マスク | Mask | Where it emits and how strongly. Uses the RGBA channels |
| 点滅の強さ / タイプ / 速度 / ズレ | Blink strength / type / speed / offset | With type off it blinks smoothly; with it on the blink is sharp |
| グラデーション | Gradient | Varies the color over time |
| 視差の強さ | Parallax strength | Shifts the UV depending on the viewing angle |
| 蛍光 | Fluorescence | Glows only in the dark. It will not glow in a space with no light at all, though |

---

## Normal map and gloss settings (ノーマルマップ・光沢設定)

### Normal map (ノーマルマップ設定)

A normal map **changes nothing on its own.** All it does is affect how shadows,
rim light and the rest get applied. Up to two can be used, so the usual split
is the first for broad shading and the second for detail. **Only the second one
supports a mask.**

The docs list what a normal map affects: shadows, backlight, gloss, MatCap, rim
light, glitter, AudioLink, refraction and gem.

### Backlight (逆光ライト)

The **light shining in from behind** that illustration uses so often. It can
receive shadows and follow the light, so the light enters a little differently
than with rim light.

| Japanese | English | Description |
|---|---|---|
| 色 | Color | Backlight color |
| 範囲 / ぼかし | Range / blur | How far it glows and how soft it is |
| 指向性 | Directionality | How much the brightness changes with the light direction |
| 視線方向の影響度 | View direction influence | Changes the extent of the light according to the view direction |
| 影を受け取る | Receive shadows | Receives shadows cast by other objects |
| 裏面で無効化 | Disable on backfaces | Turns it off on backfaces |

### Gloss (光沢設定)

Covers everything from illustration-style highlights to realistic reflection of
ambient light. You can assign a cubemap to customize the reflected light.

| Japanese | English | Description |
|---|---|---|
| 滑らかさ | Smoothness | Surface smoothness. Lowering it softens the reflection. Uses the R channel |
| 金属度 | Metallic | How metallic it looks. Uses the R channel |
| 反射率 | Reflectance | Reflectance of ambient light |
| 色 | Color | Color of the reflection |
| 光沢のタイプ | Gloss type | The shape in which light is reflected |
| 複数ライトから光沢を生成 | Gloss from multiple lights | Also generates gloss from point and spot lights |
| 環境光の反射 | Ambient reflection | Reflects the surrounding colors |
| 合成モード | Blend mode | Normal / additive / screen / multiply |

### MatCap (マットキャップ設定)

A MatCap **moves with the camera direction.** You draw the texture as
highlights painted onto a sphere, and since it does not change with the
lighting environment it is easy to work with.

| Japanese | English | Description |
|---|---|---|
| マットキャップ | MatCap | The MatCap texture |
| UV1を合成 | Blend UV1 | Blends UV1 into the MatCap UV. Projecting UV1 onto hair from the front and blending the y axis limits vertical movement, which **suits hair highlights well** |
| Z軸回転キャンセル | Cancel Z-axis rotation | Suppresses the rotation you get from tilting your head or the camera in VR |
| パース補正 | Perspective correction | Keeps the projection from drifting at the edges of the screen |
| VR時の視差の強さ | Parallax strength in VR | Adjusts the "shimmer" in VR |
| マスク | Mask | Where it applies. Uses the RGB channels |
| ライティングを適用 | Apply lighting | Keeps the color from floating away under dark lighting |
| 影部分で無効化 / 裏面で無効化 | Disable in shadow / on backfaces | Turns the MatCap off in those areas |
| 合成モード | Blend mode | Normal / additive / screen / multiply |
| カスタムノーマルマップ | Custom normal map | A normal map used only for the MatCap |

### Rim light (リムライト設定)

The look of **light wrapping around** the form. A highlight along the outline
lifts the character off the background.

| Japanese | English | Description |
|---|---|---|
| 色 / マスク | Color / mask | Lets you change or disable the color by area |
| 範囲 / ぼかし | Range / blur | 0 is anime-style; raising it gives a softer impression |
| リムライトの細さ | **Rim light thinness** | The Fresnel parameter. Strengthens contrast to make the rim narrower |
| ライティングを適用 | Apply lighting | Keeps the color from floating away under dark lighting |
| 影部分で無効化 | Disable in shadow | Turns it off in shadowed areas |
| 裏面で無効化 | Disable on backfaces | Use it **when the inside of clothing glows unnaturally** |
| ライト方向の影響度 | Light direction influence | Lets you give the directly lit and indirectly lit parts their own blur, range and color |
| 直接光の幅 / 間接光の幅 | Direct light width / indirect light width | The extent of each |
| ノーマルマップ強度 | Normal map strength | How strongly the normal map is applied |
| VR時の視差の強さ | Parallax strength in VR | Parallax in VR |

### Glitter (ラメ設定)

Creates a sparkling texture.

| Japanese | English | Description |
|---|---|---|
| UV Mode | UV Mode | If there is no UV1, UV0 is used. Enabling `Generating Lightmap UVs` on FBX import can generate UV1 automatically |
| 色 | Color | An HDR color. Values above 1 make it sparkle harder |
| メインカラーの強度 | Main color strength | How much the main color is multiplied in |
| ライティングを適用 | Apply lighting | Keeps the color from floating away under dark lighting |
| 影部分 / 裏面で無効化 | Disable in shadow / on backfaces | Removes it in those areas |
| Shapeマスク | Shape mask | The shape of the glitter. Uses the RGBA channels |
| ランダム化（Angle / Size） | Randomize (angle / size) | Random rotation and scaling |
| サイズ / パーティクルサイズ | Size / particle size | Maxing out the particle size produces something like a Voronoi diagram |
| 密度 / 感度 / 点滅の速度 | Density / sensitivity / blink speed | How strongly it glints and how responsive it is |
| 角度制限 | Angle limit | Limits the angles at which it glints |
| ライト方向の影響度 | Light direction influence | How much the light direction is reflected in the gloss |
| ランダムカラー | Random color | How much the color is randomized |
| ノーマルマップ強度 | Normal map strength | How strongly the normal map is applied |
| コントラスト（後処理） | Contrast (post-process) | Controls density by adjusting gamma |

---

## Advanced settings — Outline (輪郭線設定)

The feature that corresponds to line art. Thickness can be driven by a texture,
which gives you tapered stroke ends and partial masking, and pulling the color
from a texture gives you colored line art.

There is one point the docs draw attention to. Models whose normals have been
adjusted for face shading, and hard-edged models, **normally do not produce a
smooth outline**; lilToon **stores normal information in the vertex colors** so
it can draw one smoothly.

| Japanese | English | Description |
|---|---|---|
| テクスチャ | Texture | You can also set the color with the picker on the right |
| 色相 / 彩度 / 明度 / ガンマ | Hue / saturation / value / gamma | Color correction |
| 焼き込み | Bake | Exports the corrected texture |
| ハイライト | Highlight | Turning on "take color from main color" multiplies the texture color in. Min and Max set the range |
| ライティングを適用 | Apply lighting | Applies the brightness change from lighting |
| マスクと太さ | Mask and thickness | No outline appears where the mask is painted black. Uses the R channel |
| 太さを補正 | Thickness correction | Corrects the change in thickness with distance |
| 頂点カラー | Vertex color | None / R→Width / RGBA→Normal & Width |
| 太さ0の頂点を削除 | Delete zero-thickness vertices | Deletes vertices where the thickness is 0, taking them out of rendering |
| Z Bias | Z Bias | Moves the outline forward or backward |
| ノーマルマップ | Normal map | Adjusts the **direction the outline is pushed out** |

Between the word "push out" (押し出す) in that last entry and the design of
using vertex normals for thickness, it looks like expansion along the normal
direction — but **the docs never state the rendering method explicitly.** What
is certain stops at the two sentences above.

---

## Things that snag when you read the docs

Problems in the source itself, found while cross-checking. Verified on
2026-08-26.

For reference, every lilToon docs page has the same two sections: `概要`
(overview) and `パラメーター` (parameters). Every property description lives in
the `パラメーター` one, so below I link the page and name the property in the
subheading.

### `Min・Max` — the name and the description disagree

[影設定](https://lilxyzw.github.io/lilToon/ja_JP/color/shadow.html)

> AO Mapを **Mix** ～Maxの範囲で再マッピングします。

The entry is named `Min・Max` but the description says `Mix～Max`. `Min` is what
the value actually means, so the description looks like the typo.

### `Atras` — the spelling changes mid-sentence

[ラメ設定](https://lilxyzw.github.io/lilToon/ja_JP/reflections/glitter.html)

> 形状のマスクテクスチャが **Atras** 化されている場合の縦横の **アトラス** 数の設定です。

The same sentence uses Roman `Atras` first and katakana `アトラス` second. It
clearly means a texture atlas, so `Atras` is the typo. The entry name itself is
`Atras`, so that is what shows up in the inspector too.

### `コントラスト（後処理）` — it refers to an entry that isn't there

[ラメ設定](https://lilxyzw.github.io/lilToon/ja_JP/reflections/glitter.html)

> 後処理で適用されるコントラストです。 **前述のコントラスト** は一定以下の明るさをカットするのに対し、こちらはガンマ値を調整することで密度を制御します。

It points at "the contrast mentioned earlier", but that page has no standalone
`コントラスト` entry. The list runs from `UV Mode` to `コントラスト（後処理）`,
21 entries, and it is not among them.

### The cubemap in gloss settings — in the overview, not in the parameters

[光沢設定](https://lilxyzw.github.io/lilToon/ja_JP/reflections/reflection.html)

> **Cubemapを指定することで** 反射光をカスタマイズできるため様々な使い方ができます。

That is what the **overview (`概要`)** promises, but the
**parameter list (`パラメーター`)** on the same page holds only eight entries — `滑らかさ` `金属度` `反射率`
`色` `光沢のタイプ` `複数ライトから光沢を生成` `環境光の反射` `合成モード` —
with no description of the entry that takes the cubemap.

---

So the official docs are not complete either. Running into an entry that is in
the inspector but not in the docs is normal; when that happens, moving the
value yourself is the faster route.

---

## Summary

- lilToon's inspector is localized into Korean, but **the official docs are
  Japanese only**. That is where the mistranslations in Korean secondary
  material come from.
- One of them is **"the rim light's fine"**. The original is
  「リムライトの細さ」 — **"thinness", the control for Fresnel contrast**.
- When an entry name is confusing, **looking it up in the official docs by its
  Japanese name is the fastest route.** That is why the Japanese names are
  listed here alongside.
- Rather than memorizing parameters, reading through the structure the docs do
  spell out — the **shadow calculation formulas**, for instance — helps more
  when you are adjusting values.

---

### References

- [lilToon official documentation (Japanese)](https://lilxyzw.github.io/lilToon/ja_JP/first.html)
- [基本設定](https://lilxyzw.github.io/lilToon/ja_JP/base/base.html) ·
  [ライティング設定](https://lilxyzw.github.io/lilToon/ja_JP/base/lighting.html)
- [影設定](https://lilxyzw.github.io/lilToon/ja_JP/color/shadow.html) ·
  [RimShade](https://lilxyzw.github.io/lilToon/ja_JP/color/rimshade.html)
- [リムライト設定](https://lilxyzw.github.io/lilToon/ja_JP/reflections/rimlight.html) ·
  [マットキャップ設定](https://lilxyzw.github.io/lilToon/ja_JP/reflections/matcap.html)
- [輪郭線設定](https://lilxyzw.github.io/lilToon/ja_JP/advanced/outline.html)
- [lilxyzw/lilToon — GitHub (MIT)](https://github.com/lilxyzw/lilToon)

The material this post started from is
[릴툰 쉐이더의 수치와 기능에 대해 알아보자!](https://www.postype.com/@fail-blanc/post/17808791)
("Let's look into the values and features of the lilToon shader"). I used it as
a reference for which entries to cover; the descriptions were written by
cross-checking the official Japanese documentation entry by entry.
