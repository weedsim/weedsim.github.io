---
pubDatetime: 2026-10-15T17:10:00+09:00
title: "노멀에 곱할 행렬을 정하는 건 역행렬이 아니라 벡터의 위치다"
lang: ko
translationKey: normal-matrix-transpose
featured: false
draft: false
tags:
  - 그래픽스
  - 렌더링
  - 셰이더
  - 수학
  - GPU
description: "셰이더를 적용하며 공부하던 중 스크랩한 정점 처리 강의 노트다. 규칙 세 개를 명세와 대조했다 — 노멀에 곱하는 행렬, 카메라 축 셋의 외적 순서, 오른손에서 왼손으로 넘어갈 때 바꿀 것. 노멀 쪽은 역행렬이 틀린 게 아니라 벡터를 어느 쪽에 두는지가 빠져 있었다."
---

**셰이더를 적용해보면서 공부하던 중에 여러 자료를 찾다가 스크랩한 것이다.**
셰이더를 쓰는 쪽에서 출발했는데, 왜 이 값에 저 행렬을 곱하는지가 설명이
안 되는 지점들이 생겨서 한 층 아래를 찾아 내려갔다.

스크랩해둔 것은 강의 정리 노트다. KUOCW에 올라온 한정현 교수님 강의의
5장 「정점 처리」를 듣고 정리한 블로그 글이고, 정점 셰이더 안에서 일어나는
변환을 world → view → projection 순서로 따라간다. 글머리에 **"선형대수학의
기초적인 지식이 요구됩니다"**라고 적어둘 만큼 수식 쪽으로 들어간다.

**파이프라인 단계 목록 자체는 다루지 않는다.** 그 이야기는
[그래픽스 파이프라인 정리: 정점이 픽셀이 되기까지](/posts/graphics-pipeline/)에
이미 적어뒀다. 이 글이 보는 것은 **그 단계 안에서 쓰는 식**이다.

정리 노트에 규칙이 세 개 나온다. 셋 다 명세와 대조해봤다.

| 노트가 적은 규칙 | 명세와 대조한 결과 |
|---|---|
| 노멀은 "Linear transform matrix의 **역행렬**로 계산" | 명세는 **역행렬의 전치**다. 둘이 같아지는 조건이 빠져 있다 |
| 카메라 축: `u = n × UP`, `v = n × u` | `u`는 명세와 같고, `v`는 **외적 순서가 뒤집혀** 있다 |
| RHS→LHS는 "**z의 값의 부호를 바꿔주면** 됩니다" | Direct3D 문서는 **"two changes"**라고 적는다 |

**첫 번째가 이 글의 제목이 된 이유는 "역행렬"이 틀린 답이 아니기 때문이다.**
벡터를 행렬의 왼쪽에 두면 역행렬 그대로가 맞고, 오른쪽에 두면 전치가
필요하다. 노트에 빠진 것은 전치가 아니라 **그 위치를 정하는 한 마디**다.
그걸 정하지 않으면 두 형태 중 무엇을 써야 하는지 답이 없다.

세 번째는 증상이 가장 분명하다. z 부호만 바꾸면 **삼각형의 앞뒤가 뒤집힌
채로** 남는다.

## 목차

## 노멀에 곱하는 행렬: 역행렬인가, 역행렬의 전치인가

노트가 노멀 변환을 이렇게 적는다.

> 여기서 normal vector를 계산할 때는 각 object에 적용한 affine transform
> matrix \[L|t\]에서 Linear transform matrix를 그대로 연산한다고 해서 알맞은
> 값이 나오지 않는 것을 아래 그림에서 확인할 수 있습니다.
>
> 그럼 어떻게 해야할까요? 바로 Linear transform matrix의 역행렬로 계산을
> 해주면 됩니다.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

**앞 문장은 정확하다.** 변환 행렬을 노멀에 그대로 곱하면 면과 수직이 깨진다.
비균일 스케일을 걸어보면 바로 보인다. 그리고 translation은 노멀에 영향이
없으므로 `[L|t]`에서 `L`만 보는 것도 맞다.

문제는 뒷 문장이다. GLSL 1.20 명세가 이 행렬을 내장 유니폼으로 정의해뒀고,
주석에 정체를 적어뒀다.

> uniform mat3 gl_NormalMatrix;
>
> // transpose of the inverse of the upper leftmost 3x3 of gl_ModelViewMatrix
>
> — [The OpenGL Shading Language 1.20 — Built-In Uniform State](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)

**"transpose of the inverse"** — 역행렬의 **전치**다. 그리고
**"upper leftmost 3x3"**이라고 범위까지 적어뒀다. 노트가 `L`만 본 것과
일치하는 부분이다.

그럼 노트가 틀렸나. **그렇게 단정하면 안 된다.** 역행렬만으로도 맞는 경우가
있고, 조건은 **벡터를 행렬의 어느 쪽에 두는가**다. 노멀을 행벡터로 두고
왼쪽에서 곱하면 역행렬 그대로가 맞고, 열벡터로 두고 오른쪽에 두면 전치가
필요하다. 둘은 같은 연산이다.

**노트에 빠진 것은 "전치"가 아니라 "어느 쪽에 두는지"다.** 그 한 마디가
없으면 규칙을 읽은 사람이 자기 코드에서 어느 형태를 써야 하는지 알 수 없다.

Unity가 이 두 형태를 **둘 다 내장 변수로 제공한다**는 점이 재미있다.

> unity_WorldToObject — Inverse of current model matrix.
>
> UNITY_MATRIX_IT_MV — Inverse transpose of model * view matrix.
>
> — [Built-in shader variables reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-UnityShaderVariables.html)

**역행렬 하나, 역행렬의 전치 하나.** 그런데 같은 페이지가 **둘 중 어느 것이
노멀용인지는 적지 않는다.** 표 전체에서 노멀을 언급하는 행이 없다. 빌트인
셰이더 함수 목록 쪽도 마찬가지다 — 그 페이지에서 노멀을 다루는 행은
`EncodeViewNormalStereo`·`DecodeViewNormalStereo`·`ShadeVertexLights`
셋뿐이고, **노멀을 어느 행렬로 옮기는지는 적혀 있지 않다.**

| 형태 | 벡터 위치 | 쓰는 행렬 | 비고 |
|---|---|---|---|
| `n' = n · M⁻¹` | 왼쪽(행벡터) | 역행렬 | 노트가 적은 형태 |
| `n' = (M⁻¹)ᵀ · n` | 오른쪽(열벡터) | 역행렬의 전치 | GLSL 명세가 정의한 형태 |
| `n' = M · n` | 오른쪽 | 변환 행렬 그대로 | **틀린 형태** (노트도 틀렸다고 적는다) |
| 대상 범위 | — | 좌상단 3×3 | 명세가 `upper leftmost 3x3`이라고 적는다 |

역행렬에는 함정이 하나 더 있다. Unity 문서가 적어둔다.

> You can not invert a matrix with a determinant of zero.
>
> If you attempt this, inverse returns Matrix4x4.zero instead.
>
> — [Matrix4x4.inverse](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-inverse.html)

**어느 축의 스케일이 0이면 예외가 아니라 영행렬이 돌아온다.** 노멀이 전부
0 벡터가 되고, 조명이 그냥 검게 나온다. 스케일에 0이 들어갈 수 있는
오브젝트라면 이 경로를 먼저 본다.

## 카메라 축 셋 중 하나는 외적 순서가 명세와 다르다

노트가 카메라 좌표계의 축 셋을 이렇게 만든다.

> 여기서 n는 EYE에서 AT을 가리키는 방향으로 형성됩니다. 그리고 방금 구한
> n과 UP방향으로 외적 한 결과를 normalize 한 것이 u가 되죠. 마지막으로 v는
> n과 u의 외적입니다.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

같은 일을 하는 함수의 명세가 축을 하나씩 정의해뒀다. `gluLookAt`이다.

> creates a viewing matrix derived from an eye point, a reference point
> indicating the center of the scene
>
> The matrix maps the reference point to the negative z axis and the eye point
> to the origin.
>
> The UP vector must not be parallel to the line of sight from the eye point to
> the reference point.
>
> — [gluLookAt — OpenGL 2.1 레퍼런스](https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/gluLookAt.xml)

명세는 `F = center − eye`를 정규화한 것을 `f`로 두고, `s = f × UP`,
`u = (s/‖s‖) × f`로 정의한 다음 행렬의 세 행을 `s`, `u`, **`−f`**로 쌓는다.
노트의 세 문장과 나란히 놓으면 이렇게 된다.

| 축 | 노트 | `gluLookAt` 명세 | 결과 |
|---|---|---|---|
| 시선 방향 | `n` = EYE → AT | `f` = eye → center | **같다** |
| 가로축 | `u = n × UP` | `s = f × UP` | **같다** |
| 세로축 | `v = n × u` | `u_spec = s × f` | **외적 순서가 반대다** |
| 행렬의 셋째 행 | `n` | **`−f`** | 부호가 반대다 |

**세로축의 외적 순서가 뒤집혀 있다.** `n × u`는 `f × s`이고, 명세의
`s × f`와 부호가 반대다. 외적은 순서를 바꾸면 부호가 바뀌니, 그대로 쓰면
위아래가 뒤집힌 축이 된다.

셋째 행의 부호도 짚어둘 만하다. 명세가 **"maps the reference point to the
negative z axis"**라고 적는다. 바라보는 점이 **음의 z**로 가야 하니, 카메라
공간의 세 번째 축은 시선과 **반대** 방향이다. 노트는 그 축을 시선 방향
자체로 부른다.

**다만 이걸 "강의가 틀렸다"로 읽으면 안 된다.** 관례가 둘 다 실재하고,
Unity는 한 프로젝트 안에서 그 둘을 다 쓴다. Unity 문서가 직접 적는다.

> Note that camera space matches OpenGL convention: camera's forward is the
> negative Z axis.
>
> This is different from Unity's convention, where forward is the positive Z
> axis.
>
> — [Camera.worldToCameraMatrix](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-worldToCameraMatrix.html)

**월드에서는 +Z가 앞이고, 카메라 공간에서는 −Z가 앞이다.** 같은 엔진 안에서
두 관례가 공존한다는 뜻이고, 노트의 `n`은 **Unity의 월드 관례**와 같고
**카메라 공간 관례**와는 반대다. 어느 쪽이 맞느냐가 아니라, **축 셋의
정의가 한 벌로 맞아야 한다**는 것이 요점이다. 노트의 세 문장은 서로는
맞는데(`u × v = n`이 성립한다) `gluLookAt`이 쌓는 행렬에 그대로 넣을 수는
없다.

**여기서 내가 확인한 범위를 밝혀둔다.** 나는 **정리 노트의 문장**을 명세와
대조했다. 강의 원본이나 교재의 정의와 대조한 것이 아니다. 교재가 `n`을
`EYE − AT`로 정의하고 나머지를 거기 맞춰 뒀을 수도 있고, 그러면 노트가
옮겨 적는 과정에서 어긋난 것이 된다. **어느 쪽인지는 교재를 봐야 안다.**

## RHS에서 LHS로 갈 때 바꿀 것은 하나가 아니라 둘이다

노트가 손 방향 변환을 이렇게 정리한다.

> RHS은 OpenGL에서 쓰는 방식, LHS은 Direct3D라고 하는데, 하드웨어가 LHS
> 방식으로 제작되어있어 결국 바꿔주는 연산이 요구되죠.
>
> RHS에서 LHS로 혹은 반대로 위와 같이 시점이 바뀌지 않게 하기 위해서는 z의
> 값의 부호를 바꿔주면 됩니다.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

API 쪽 소속은 맞다. Direct3D 문서가 자기 입으로 적는다.

> Direct3D uses a left-handed coordinate system. If you are porting an
> application that is based on a right-handed coordinate system, you must make
> two changes to the data passed to Direct3D.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**"you must make two changes"** — 둘이다. 그 둘을 같은 페이지가 번호까지
붙여 적는다.

> Flip the order of triangle vertices so that the system traverses them
> clockwise from the front. In other words, if the vertices are v0, v1, v2,
> pass them to Direct3D as v0, v2, v1.
>
> Use the view matrix to scale world space by -1 in the z-direction. To do
> this, flip the sign of the _31, _32, _33, and _34 member of the D3DMATRIX
> structure that you use for your view matrix.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**노트가 적은 것은 둘째 항목뿐이다.** 첫째 항목 — **삼각형 정점 순서를
뒤집는 것** — 이 빠져 있다. z만 뒤집으면 좌표는 맞게 가는데 **와인딩이
그대로 남아서**, 앞면으로 보내려던 면이 뒷면으로 판정된다. 백페이스 컬링이
켜져 있으면 **모델이 안 보이거나 안쪽이 보인다.** 좌표가 맞으니 수식을
의심하게 되고, 원인은 수식이 아니라 와인딩이다.

같은 페이지가 투영 쪽 선택지도 적어둔다.

> To obtain what amounts to a right-handed world, use the
> D3DXMatrixPerspectiveRH and D3DXMatrixOrthoRH functions to define the
> projection transform.
>
> However, be careful to use the corresponding D3DXMatrixLookAtRH function,
> reverse the backface-culling order, and lay out the cube maps accordingly.
>
> — [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)

**여기서도 "reverse the backface-culling order"가 같이 붙는다.** 손 방향을
바꾸는 이야기에는 컬링 순서가 항상 딸려 온다는 것이 문서의 일관된 태도다.
큐브맵 배치까지 언급한다.

| 바꿔야 하는 것 | Direct3D 문서의 표현 | 노트 |
|---|---|---|
| 뷰 행렬의 z 스케일 −1 | "scale world space by -1 in the z-direction" | 적혀 있다 |
| 삼각형 정점 순서 | "if the vertices are v0, v1, v2, pass them ... as v0, v2, v1" | **빠져 있다** |
| (RH 투영을 쓸 때) 컬링 순서 | "reverse the backface-culling order" | 언급 없음 |
| (RH 투영을 쓸 때) 큐브맵 배치 | "lay out the cube maps accordingly" | 언급 없음 |

하나 더. 노트는 **"하드웨어가 LHS 방식으로 제작되어있어"**라고 적는다.
**그 문장을 뒷받침하는 1차 출처는 찾지 못했다.** Direct3D 문서는 손 방향을
**API의 관례**로 돌리고("Direct3D uses a left-handed coordinate system"),
하드웨어가 어느 손인지는 말하지 않는다. 그래픽스 하드웨어가 특정 손 방향으로
만들어졌다고 적어둔 명세를 나는 확인하지 못했다. **문서가 말하지 않는
것이니 이 글도 적지 않는다.**

## View Frustum의 네 변수는 Unity 문서와 이름까지 맞는다

노트가 View Frustum을 네 변수로 정의한다 — **fovy, aspect, n, f**. 이쪽은
현행 문서와 잘 맞는다.

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
> — [Understanding the view frustum — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

**사다리꼴이 아니라 "잘린 피라미드"**라는 표현까지 노트와 통한다. 노트가
"사다리꼴 또는 사각뿔이 잘린 거 같은 공간"이라고 쓴 것과 같은 그림이다.
`n`과 `f`를 스크립트에서 어떻게 읽고 쓰는지, 그 두 값이 화면 좌표 변환에서
어떤 구간을 정하는지는
[z를 거리로 읽는 함수와 그냥 버리는 함수가 따로 있다](/posts/screentoworldpoint-vs-ray/)에
적어뒀다.

노트는 culling과 clip을 구분해둔다 — 시야 밖 object를 없애는 것이 View
Frustum Culling, object의 부분만 취하는 것이 clip이다. 그 구분은 맞고,
Unity 문서가 **단위**를 한 단어로 못 박는다.

> cameras perform frustum culling, which excludes all Renderers that don't
> fall within the view frustum
>
> — [Understanding the view frustum — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

**`Renderer` 단위다.** 오브젝트 하나가 프러스텀에 걸쳐 있으면 컬링으로는
안 빠지고, 잘려 나가는 일은 그 뒤 파이프라인에서 프리미티브 단위로
일어난다. 노트의 두 단어가 가리키는 것이 **같은 단계가 아니라는 점**이
여기서 분명해진다.

## 정점 셰이더의 출력은 정사각형이 아니라 동차 좌표다

노트가 마지막에 clip space를 이렇게 설명한다.

> 이를 통해 정 사각형의 공간에서 object를 표현 할 수 있죠. 이렇게 생긴
> 정사각형의 공간을 Clip space라고 합니다.
>
> — [컴퓨터 그래픽스 기초 - Vertex shader](https://wnthqmffhrm.tistory.com/23)

정점 셰이더가 내놓는 값을 명세는 다르게 부른다.

> vec4 gl_Position; // must be written to
>
> The variable gl_Position is available only in the vertex language and is
> intended for writing the homogeneous vertex position.
>
> All executions of a well-formed vertex shader executable must write a value
> into this variable.
>
> — [The OpenGL Shading Language 1.20 — Special Variables](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)

**"homogeneous vertex position"**이다. 명세는 이 자리에서 공간 이름을
붙이지 않고 **동차 좌표**라고만 쓴다. 정사각형(정확히는 정육면체)이 되는
것은 `w`로 나눈 **다음**이고, 그 나눗셈과 그 뒤 단계는
[그래픽스 파이프라인 정리: 정점이 픽셀이 되기까지](/posts/graphics-pipeline/)에
단계별로 적어뒀다. 노트가 투영 행렬의 마지막 행이 `(0,0,0,1)`이 아니라는 점과
`-1`이 원근을 만든다는 점을 짚은 것은 **정확히 그 나눗셈을 준비하는 자리**를
가리킨 것이다. 거기까지는 맞고, 이름만 한 단계 앞질러 붙였다.

`must be written to`도 눈여겨볼 만하다. **정점 셰이더가 이 값을 쓰지 않으면
명세 기준으로 결과가 정의되지 않는다.** 노트가 "최종적으로 가장 오른쪽에
clip space라는 출력을 내놓게 되는 것"이라고 쓴 그 출력이, 명세에서는
**선택이 아니라 의무**다. 이 의무가 어디에나 있다는 것 — 포스트 프로세스
셰이더에도 정점 단계가 있다는 것 — 은
[정의가 설명한 건 셰이더가 아니라 픽셀 셰이더다](/posts/what-is-a-shader/)에
적어뒀다.

## 강의 자료에는 정오표가 따로 있다

노트가 참고로 강의 자료 주소를 남겨뒀다. 열어봤다.

| 항목 | 상태 |
|---|---|
| 강의 유튜브 채널 | 링크 있음 |
| 교재 페이지 (`media.korea.ac.kr/books/`) | **열린다** |
| 교재 | *Introduction to Computer Graphics with OpenGL ES* 등 2종 |
| 강의 자료 | 장별 PDF·PPT 배포 |
| **정오표** | **별도로 공개돼 있다** (2022-06-23 날짜) |

**정오표가 공개돼 있다는 것이 이 글에서 중요하다.** 교재 자체도 고쳐진
내역이 있다는 뜻이고, 2022년 1월에 작성된 정리 노트는 **그 정오표보다
앞선다.** 그래서 이 글은 노트의 문장을 교재와 대조하지 않았다 — 교재를
인용하지 않고, **공개 명세**(GLSL 명세, `gluLookAt` 레퍼런스, Direct3D
문서, Unity 문서)와만 대조했다. 노트와 교재 사이에 차이가 있는지는
**교재와 정오표를 직접 봐야 안다.**

## 어디에 왜 쓰나

이 세 규칙은 **커스텀 셰이더를 쓰거나 카메라 행렬을 직접 만들 때** 바로
걸린다. 커스텀 셰이더를 어느 경로로 쓸 수 있는지는
[커스텀 셰이더 문서의 표는 목차가 아니라 분기다](/posts/unity-custom-shaders/)에
정리해뒀다. 노멀을 잘못 옮기면 조명이 틀리고, 축 정의가 어긋나면 화면이
뒤집히고, 손 방향 변환에서 와인딩을 빼먹으면 모델이 사라진다. 셋 다
**컴파일은 되고 실행도 되는** 종류의 오류라서, 식이 맞는지 눈으로 보는
것보다 **수치로 판정하는 쪽**이 빠르다.

### 동작하는 예제

노멀 변환 세 형태를 한 씬에서 수치로 비교하는 스크립트다. 비균일 스케일을
걸고, 변환된 노멀이 변환된 면과 **아직 수직인지**를 내적으로 찍는다.
`0`에 가까우면 수직이 유지된 것이다.

**문서 문장만으로 판정할 수 없는 부분이 하나 있어서**
`Matrix4x4.MultiplyVector`도 같이 찍는다. 그 문서는 **"only the rotation
part of the matrix is taken into account"**라고 적는데, 이 표현이 좌상단
3×3을 뜻하는지 회전 성분만 뽑는다는 뜻인지 문장만으로는 가려지지 않는다. **내 환경에서 돌려볼 수 없으니
사실로 적지 않고, 판정을 이 스크립트에 넘긴다.**

```csharp file="Scripts/Graphics/NormalMatrixProbe.cs"
using UnityEngine;

public class NormalMatrixProbe : MonoBehaviour
{
    [Header("걸어볼 변환")]
    [Tooltip("비균일 스케일일 때 차이가 드러난다. 0이 들어가면 역행렬이 영행렬이 된다")]
    [SerializeField]
    private Vector3 _scale = new Vector3(3f, 1f, 1f);

    [Tooltip("회전만으로는 세 형태가 같은 결과를 낸다")]
    [SerializeField]
    private Vector3 _eulerAngles = new Vector3(0f, 30f, 0f);

    [Tooltip("노멀에 영향이 없어야 하는 성분")]
    [SerializeField]
    private Vector3 _translation = new Vector3(5f, 0f, 0f);

    [Header("검사할 면")]
    [Tooltip("면 위의 두 변. 이 둘의 외적이 원래 노멀이다")]
    [SerializeField]
    private Vector3 _edgeA = new Vector3(1f, 1f, 0f);

    [SerializeField]
    private Vector3 _edgeB = new Vector3(0f, 1f, 1f);

    private void Start()
    {
        Probe();
    }

    [ContextMenu("지금 판정")]
    private void Probe()
    {
        Matrix4x4 model = Matrix4x4.TRS(
            _translation, Quaternion.Euler(_eulerAngles), _scale);

        // 문서가 "You can not invert a matrix with a determinant of zero"
        // 이고 "inverse returns Matrix4x4.zero instead"라고 적는다.
        Matrix4x4 inverse = model.inverse;
        if (inverse == Matrix4x4.zero)
        {
            Debug.LogError("역행렬이 영행렬이다. 스케일에 0이 들어 있다.", this);
            return;
        }

        Vector3 normal = Vector3.Cross(_edgeA, _edgeB).normalized;

        // 면은 변환 행렬로 옮긴다. 방향이므로 translation은 빠져야 한다.
        Vector3 movedEdgeA = Multiply3x3(model, _edgeA);
        Vector3 movedEdgeB = Multiply3x3(model, _edgeB);

        // 세 형태를 각각 만든다.
        Vector3 byModel = Multiply3x3(model, normal);
        Vector3 byInverseLeft = MultiplyRow3x3(inverse, normal);
        Vector3 byInverseTranspose = Multiply3x3(inverse.transpose, normal);
        Vector3 byMultiplyVector = inverse.transpose.MultiplyVector(normal);

        Report("변환 행렬 그대로", byModel, movedEdgeA, movedEdgeB);
        Report("역행렬 · 행벡터(왼쪽)", byInverseLeft, movedEdgeA, movedEdgeB);
        Report("역행렬의 전치 · 열벡터", byInverseTranspose, movedEdgeA, movedEdgeB);
        Report("MultiplyVector(역전치)", byMultiplyVector, movedEdgeA, movedEdgeB);
    }

    // 열벡터를 오른쪽에 두는 곱. 좌상단 3×3만 쓴다.
    private static Vector3 Multiply3x3(Matrix4x4 m, Vector3 v)
    {
        return new Vector3(
            m.m00 * v.x + m.m01 * v.y + m.m02 * v.z,
            m.m10 * v.x + m.m11 * v.y + m.m12 * v.z,
            m.m20 * v.x + m.m21 * v.y + m.m22 * v.z);
    }

    // 행벡터를 왼쪽에 두는 곱. 위와 전치 관계다.
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

        // 0에 가까우면 변환된 면과 아직 수직이다.
        Debug.Log(
            $"{label}: |dot A| = {dotA:F6}, |dot B| = {dotB:F6}", this);
    }
}
```

스케일을 `(3, 1, 1)`처럼 비균일하게 두고 돌리면 네 줄의 숫자가 갈린다.
스케일을 `(1, 1, 1)`로 두면 네 줄이 같아진다 — **회전과 이동만으로는 세
형태가 구분되지 않기 때문**이고, 그래서 비균일 스케일을 걸지 않은 테스트는
이 문제를 못 잡는다.

판정은 **각자 자기 에디터에서** 나온 숫자로 한다. 나는 이 스크립트를 돌려
확인한 환경이 없으므로, 어느 줄이 `0`을 찍는다고 적지 않는다. 다만
기대값은 분명하다 — 명세가 노멀 행렬을 **"transpose of the inverse of the
upper leftmost 3x3"**로 정의했으니, 셋째 줄이 기준이다.

### 무엇을 고르나

| 하고 싶은 일 | 쓸 것 | 근거 문장 |
|---|---|---|
| 노멀을 월드로 옮기기 | 역행렬의 전치 · 좌상단 3×3 | "transpose of the inverse of the upper leftmost 3x3" |
| 같은 일을 행벡터로 | 역행렬 그대로, 벡터를 왼쪽에 | 두 형태는 전치 관계다 |
| Unity 내장으로 | `UNITY_MATRIX_IT_MV` | "Inverse transpose of model * view matrix" |
| 스케일에 0이 들어갈 때 | 역행렬을 먼저 검사 | "inverse returns Matrix4x4.zero instead" |
| 카메라 행렬을 직접 만들기 | `gluLookAt`의 축 정의 순서 | "maps the reference point to the negative z axis" |
| Unity 카메라 공간을 쓸 때 | 앞이 **−Z**임을 전제 | "camera's forward is the negative Z axis" |
| RHS 자료를 D3D로 옮기기 | **두 가지** 다 바꾸기 | "you must make two changes" |
| 손 방향을 바꿨는데 모델이 사라질 때 | 와인딩·컬링 순서를 먼저 보기 | "reverse the backface-culling order" |

판단 순서는 이렇게 둔다.

1. **비균일 스케일이 있는지 본다.** 없으면 노멀 세 형태가 구분되지 않는다.
   있으면 명세 형태로 간다.
2. **벡터를 어느 쪽에 두는지 정한다.** 그걸 정하지 않으면 "역행렬"과
   "역행렬의 전치" 중 무엇이 맞는지 답이 없다.
3. **좌표계 관례를 한 벌로 묶는다.** 시선 축의 방향, 외적 순서, 투영 행렬의
   부호가 서로 맞아야 한다. 하나만 바꾸면 깨진다.
4. **손 방향을 바꿀 때는 와인딩을 같이 본다.** 문서가 둘이라고 적었다.

### 쓰지 말아야 할 자리

- **노멀에 변환 행렬을 그대로 곱하는 자리.** 노트도 틀렸다고 적고, 비균일
  스케일에서 바로 드러난다.
- **"역행렬"만 보고 벡터 위치를 정하지 않는 자리.** 왼쪽에 둘 때와 오른쪽에
  둘 때 쓸 행렬이 다르다.
- **스케일에 0이 들어갈 수 있는데 역행렬을 검사하지 않는 자리.** 영행렬이
  돌아오고 노멀이 전부 0이 된다.
- **회전만 걸고 노멀 변환을 테스트하는 자리.** 세 형태가 같은 결과를 낸다.
- **`gluLookAt` 모양의 행렬에 노트의 축 셋을 그대로 넣는 자리.** 세로축
  외적 순서와 셋째 행 부호가 반대다.
- **Unity의 월드 관례(+Z 앞)를 카메라 공간에 그대로 적용하는 자리.** 문서가
  카메라 공간은 **−Z가 앞**이라고 적는다.
- **RHS→LHS에서 z 부호만 바꾸는 자리.** 문서가 **"two changes"**라고 적고,
  빠진 하나가 삼각형 정점 순서다.
- **손 방향을 바꾼 뒤 모델이 안 보이는데 수식을 의심하는 자리.** 좌표가
  맞아도 와인딩이 남는다.
- **"하드웨어가 특정 손 방향으로 만들어졌다"고 전제하는 자리.** 그 문장을
  뒷받침하는 명세를 찾지 못했다.
- **clip space를 정육면체라고 전제하는 자리.** 정육면체가 되는 것은 `w`로
  나눈 다음이다.

## 정리

- 노멀 행렬은 GLSL 명세가 **"transpose of the inverse of the upper leftmost
  3x3 of gl_ModelViewMatrix"**로 정의한다. 노트의 "역행렬"은 **벡터를 왼쪽에
  두는 형태**이고, 그 조건이 노트에 빠져 있다.
- Unity는 **역행렬(`unity_WorldToObject`)과 역행렬의 전치
  (`UNITY_MATRIX_IT_MV`)를 둘 다** 내장으로 준다. 다만 **어느 것이
  노멀용인지는 그 페이지가 적지 않는다.**
- `Matrix4x4.inverse`는 행렬식이 0이면 예외가 아니라 **영행렬**을 돌려준다.
- 카메라 축 셋 중 **세로축의 외적 순서가 `gluLookAt` 명세와 반대**이고,
  행렬 셋째 행의 부호도 반대다. 명세는 **"maps the reference point to the
  negative z axis"**라고 적는다.
- Unity 문서가 **월드는 +Z 앞, 카메라 공간은 −Z 앞**이라고 직접 적는다.
  두 관례가 한 엔진 안에 같이 있다.
- RHS→LHS는 Direct3D 문서가 **"you must make two changes"**라고 적는다.
  노트에는 **z 부호 하나만** 있고, **삼각형 정점 순서(`v0, v2, v1`)**가
  빠져 있다. RH 투영 함수를 쓸 때도 **"reverse the backface-culling
  order"**가 같이 붙는다.
- **"하드웨어가 LHS로 제작되어 있다"는 문장의 1차 출처는 찾지 못했다.**
  문서는 손 방향을 API의 관례로 돌린다.
- View Frustum의 fovy·aspect·n·f는 Unity 문서와 잘 맞고, **frustum culling은
  `Renderer` 단위**다. clip은 그 뒤 단계의 프리미티브 단위 작업이다.
- `gl_Position`은 명세가 **"homogeneous vertex position"**이라고 부르고
  **"must be written to"**로 못 박는다. 정육면체는 `w`로 나눈 다음이다.
- 강의 교재 페이지는 열리고 **정오표가 따로 공개돼 있다.** 이 글은 교재를
  인용하지 않고 공개 명세와만 대조했다.

---

### 참고

- [The OpenGL Shading Language 1.20 — Khronos 명세 (PDF)](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.1.20.pdf)
- [gluLookAt — OpenGL 2.1 레퍼런스](https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/gluLookAt.xml)
- [Coordinate Systems (Direct3D 9) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d9/coordinate-systems)
- [Built-in shader variables reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-UnityShaderVariables.html)
- [Shader methods in the Built-In Render Pipeline reference — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-BuiltinFunctions.html)
- [Understanding the view frustum — Unity 6.6 매뉴얼](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)
- [Camera.worldToCameraMatrix — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-worldToCameraMatrix.html)
- [Matrix4x4.inverse — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-inverse.html)
- [Matrix4x4.transpose — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4-transpose.html)
- [Matrix4x4.MultiplyVector — Unity 스크립팅 API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Matrix4x4.MultiplyVector.html)
- [Books — 고려대 미디어랩 (강의 자료·정오표)](http://media.korea.ac.kr/books/)

원문 클리핑은 Sudo-soqmffhrm의 티스토리 글
[컴퓨터 그래픽스 기초 - Vertex shader(\[KUOCW\] 한정현 교수님 강의)](https://wnthqmffhrm.tistory.com/23)(2022-01-18)이다.
강의를 듣고 정리한 노트이고, 파이프라인을 먼저 세워두고 순서대로 따라가는
구성이 좋다. 노멀을 변환 행렬로 그대로 곱하면 안 된다는 것, translation은
노멀에 영향이 없다는 것, 투영 행렬의 마지막 행이 `(0,0,0,1)`이 아니라는 것
— 핵심은 다 짚혀 있다. 이 글은 그 위에서 **규칙 세 개의 빠진 절반**을
공개 명세로 메운 기록이다. **교재와 대조한 것이 아니라 노트의 문장과
대조한 것**이라는 점을 다시 적어둔다.
