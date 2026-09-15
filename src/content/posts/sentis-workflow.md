---
pubDatetime: 2026-09-15T18:00:00+09:00
title: "Sentis 워크플로 6단계: 문서 코드가 생략한 소유권과 블로킹"
lang: ko
translationKey: sentis-workflow
featured: false
draft: false
tags:
  - Unity
  - Sentis
  - AI
  - 온디바이스 AI
  - GPU
description: "Sentis 공식 워크플로 문서는 여섯 단계짜리 뼈대다. 그 뼈대가 생략한 것 — Resources 폴더, 텐서 소유권, 결과를 읽는 줄에서 발생하는 GPU 대기 — 를 같은 문서의 다른 페이지와 대조해 정리했다."
---

게임 프로젝트에 온디바이스 AI를 붙이기로 하고 Sentis 문서를 처음부터 훑는
중이었다. 워크플로 페이지가 사실상 첫 관문인데, 여섯 단계로 끝나는 짧은
페이지다. 읽고 나면 다 안 것 같은데, **그대로 옮겨 적으면 돌아가지 않는다.**

이 글은 그 여섯 단계를 순서대로 따라가면서, **각 단계에서 페이지가 말하지 않고
넘어간 것**을 같은 문서의 다른 페이지와 대조해 채우는 글이다. 세 군데가 걸렸다.
모델을 못 찾고, 텐서 소유권이 헷갈리고, 결과를 읽는 한 줄에서 프레임이 멈춘다.

텐서 데이터를 GPU에 남겨둔 채 다루는 이야기는
[Sentis에서 텐서 데이터에 직접 접근하기](/posts/sentis-tensor-data/)에 따로
정리해뒀다. 여기서는 그 앞 단계, **모델을 올려서 결과를 한 번 받아내는
경로**만 다룬다.

## 목차

## 문서가 말하는 6단계

페이지는 이렇게 시작한다.

1. `Unity.InferenceEngine` 네임스페이스를 사용한다.
2. 신경망 모델 파일을 로드한다.
3. 모델에 넣을 입력을 만든다.
4. 워커를 만든다.
5. 입력과 함께 모델을 실행해 결과를 계산한다(추론).
6. 결과를 가져온다.

각 단계의 코드는 한두 줄씩이다. 이어 붙이면 이렇게 된다.

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

여기서 끝난다. `Dispose`가 한 번도 안 나오고, `outputTensor`에서 실제 숫자를
꺼내는 줄도 없다.

참고로 네임스페이스가 `Unity.InferenceEngine`인데 페이지 제목은 "Sentis"다.
패키지 ID는 `com.unity.ai.inference`고, 표시 이름만 Sentis로 되돌아온 결과다.
이 이름 세 개가 왜 다른지는 [앞 글](/posts/sentis-tensor-data/)에 정리해뒀다.

## 같은 문서의 다른 페이지에는 코드가 더 길다

워크플로 페이지 맨 아래 "Additional resources"에 **Workflow example** 링크가
있다. 같은 순서를 실제로 동작하는 `MonoBehaviour`로 옮긴 페이지인데, 코드가
눈에 띄게 다르다. 원문을 그대로 옮기면 이렇다.

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

6단계 페이지에 없던 것이 전부 여기 있다. 입력 텐서 앞의 `using`, 결과를 실제로
꺼내는 `DownloadToArray()`, `OnDisable`에서의 `worker.Dispose()`, 그리고
**"outputTensor is still pending"** 이라는 주석.

정리하면 **6단계 페이지는 API 이름을 외우는 페이지이지 코드를 베끼는
페이지가 아니다.** 그걸 모르고 베끼면 다음 세 군데에서 걸린다.

## 함정 1 — `Resources.Load`는 `Assets` 폴더에서 못 읽는다

6단계 페이지는 모델 파일을 이렇게 안내한다.

> 2. 모델 파일을 **Project** 창의 `Assets` 폴더에 추가한다.
> 3. 스크립트에서 런타임 모델을 만든다.

그리고 코드가 `Resources.Load("model-file-in-assets-folder")`다. 인자 이름부터
"assets 폴더 안의 모델 파일"이라고 써 있는데, **`Resources.Load`는 `Assets`
폴더를 읽지 않는다.** Unity 스크립트 레퍼런스가 분명하다.

> `path`는 프로젝트의 `Assets` 폴더 안에 있는 **`Resources`라는 이름의 폴더**를
> 기준으로 한 상대 경로다.

즉 `Assets/Model.onnx`는 `Resources.Load("Model")`로 안 나온다.
`Assets/Resources/Model.onnx`여야 한다. 시키는 대로 `Assets`에 넣고 코드를
붙이면 `modelAsset`이 `null`이고, `ModelLoader.Load`에서 터진다.

같은 문서의 **Import a model file** 페이지는 이 문제가 없다. 거기는 파일을
`Assets`에 드래그해 넣고, **직렬화된 `ModelAsset` 필드**를 만들어 인스펙터에서
지정하는 방식을 보여준다. 6단계 페이지도 그 방식을 한 줄로 언급하기는 한다.

> GameObject에 `public ModelAsset modelAsset`을 public 변수로 추가할 수도
> 있다. 이 경우 모델을 수동으로 지정한다.

**둘 중에서는 인스펙터 쪽이 기본값이어야 한다.** `Resources` 폴더는 빌드에
무조건 포함되고 런타임에 통째로 들고 있어야 하는 폴더라, 수십 MB짜리 모델을
넣기에 좋은 자리가 아니다. 예제 코드에서 `Resources.Load`가 먼저 나오는 건
페이지가 짧아서지, 그게 권장이라서가 아니다.

## 함정 2 — `PeekOutput`의 소유권, 그리고 문서끼리 어긋난 자리

`PeekOutput`이라는 이름이 이미 힌트다. **가져오는(get) 게 아니라 들여다보는
(peek) 것**이다. 반환된 텐서는 내 것이 아니다. **Get output from a model**
페이지가 규칙을 못 박는다.

> Sentis 워커 메모리 할당자가 `PeekOutput`이 반환한 참조를 소유한다. 이는
> 다음을 의미한다.
> - 출력에 `Dispose`를 쓸 필요가 없다.
> - 출력을 바꾸거나 워커를 다시 실행하면, 워커 출력과 `PeekOutput` 사본이
>   **둘 다** 바뀐다.
> - 워커에 `Dispose`를 쓰면 `PeekOutput` 사본도 함께 해제된다.

두 번째 항목이 실무에서 걸린다. `PeekOutput`으로 받아둔 참조를 필드에 들고
있다가 다음 프레임에 `Schedule`을 또 부르면, **들고 있던 참조의 내용이
바뀐다.** 값을 남겨두려면 복사해야 한다.

그런데 **여기서 두 페이지가 어긋난다.** 앞에서 인용한 Workflow example의 코드는
`PeekOutput`으로 받은 텐서에 `Dispose`를 부른다.

```csharp
Tensor<float> outputTensor = worker.PeekOutput() as Tensor<float>;
results = outputTensor.DownloadToArray();

// Release outputTensor memory
outputTensor.Dispose();
```

규칙 페이지는 "`Dispose`를 쓸 필요가 없다"고 하고, 예제 페이지는 "메모리를
해제한다"는 주석과 함께 `Dispose`를 부른다. 같은 버전(2.6.1) 문서에서 둘 다
읽힌다.

둘 중 어느 쪽이 맞는지 나는 코드를 읽어 확인하지 않았다. 다만 **규칙 페이지가
API 수준의 서술이고 예제는 그 API를 쓰는 쪽**이라, 규칙 쪽을 따르는 편이
안전하다고 본다. 예제의 `Dispose`는 `Start()`가 끝나면서 워커도 곧 정리되는
맥락이라 결과적으로 문제가 안 되는 자리에 있다. 같은 줄을 **매 프레임 돌아가는
코드에 그대로 옮기면** 이야기가 다르다.

경계는 이렇게 잡으면 된다.

| 얻는 방법 | 소유권 | `Dispose` |
|---|---|---|
| `worker.PeekOutput()` | 워커 | 불필요 |
| `worker.CopyOutput(...)` | 호출자 | **필요** |
| `tensor.ReadbackAndClone()` | 호출자 (CPU 사본) | **필요** |
| `tensor.ReadbackAndCloneAsync()` | 호출자 (CPU 사본) | **필요** |
| `tensor.DownloadToArray()` | — (`T[]` 반환) | 해당 없음 |

이름에 `Copy`나 `Clone`이 들어가면 내 것이고, `Peek`이면 남의 것이다.

## 함정 3 — 결과를 읽는 줄이 GPU를 기다리는 줄이다

Workflow example의 주석이 이 문제를 한 줄로 요약한다.

> `outputTensor`는 아직 대기 중이다. 결과를 비동기로 리드백하거나, 블로킹
> 다운로드를 호출하라.

`worker.Schedule()`은 **논블로킹**이다. API 문서가 그렇게 적어놨고,
`PeekOutput()`도 논블로킹이다. 즉 여기까지는 아무것도 기다리지 않는다.
계산은 GPU에 예약만 되어 있다.

기다림은 **숫자를 실제로 꺼낼 때** 온다. Get output from a model 페이지의
경고가 이 지점이다.

> 출력 텐서에서 데이터를 읽을 때 주의하라. 많은 경우, 모델 실행이 끝날 때까지
> 기다렸다가 GPU나 Burst에서 CPU로 데이터를 내려받는 **블로킹 대기를
> 의도치 않게 유발**할 수 있다.

`DownloadToArray()`와 `DownloadToNativeArray()`가 그 블로킹 경로다. 모델이
50ms짜리면 그 프레임이 50ms 늘어난다.

피하는 방법은 두 가지다.

```csharp
// 1) 비동기로 await
using Tensor<float> cpuCopy = await outputTensor.ReadbackAndCloneAsync();
float[] scores = cpuCopy.DownloadToArray();

// 2) 요청만 걸어두고 나중에 완료 확인
outputTensor.ReadbackRequest();
// ... 다음 프레임들 ...
if (outputTensor.IsReadbackRequestDone())
{
    using Tensor<float> cpuCopy = outputTensor.ReadbackAndClone();
}
```

한 번 CPU로 내려온 뒤에는 `DownloadToArray()`가 더 이상 기다릴 게 없다. 비싼
건 다운로드 자체가 아니라 **동기화**다.

## 어디에 왜 쓰나

여기까지가 문서를 읽고 고친 내용이고, 실제로 붙일 때 쓰는 형태는 이렇다.
6단계를 전부 담고, 위의 세 함정을 전부 피한 컴포넌트다.

```csharp
using System;
using Unity.InferenceEngine;
using UnityEngine;

/// <summary>
/// 텍스처 한 장을 모델에 넣고 가장 점수가 높은 클래스 인덱스를 알린다.
/// </summary>
public class TextureClassifier : MonoBehaviour
{
    private const int INPUT_CHANNELS = 3;
    private const int INPUT_SIZE = 224;

    [Header("Model")]
    [SerializeField, Tooltip("Assets에 드래그해 넣은 ONNX 또는 LiteRT 모델")]
    private ModelAsset _modelAsset;

    [Header("Backend")]
    [SerializeField, Tooltip("컴퓨트 셰이더를 못 쓰는 기기에서는 GPUPixel로 내려간다")]
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
            // 크기가 다르면 선형 리샘플링으로 맞춰준다.
            TextureConverter.ToTensor(source, _inputTensor);
            _worker.Schedule(_inputTensor);

            // PeekOutput은 워커가 소유하는 참조다. 여기서 Dispose하지 않는다.
            Tensor<float> output = _worker.PeekOutput() as Tensor<float>;

            // await 없이 output을 읽으면 GPU가 끝날 때까지 이 프레임이 멈춘다.
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

몇 가지 의도를 적어둔다.

- **입력 텐서를 `Awake`에서 한 번만 만들고 재사용한다.** 매 호출마다 새로
  할당하면 그만큼 GC와 GPU 할당이 늘어난다.
- **`_isRunning`으로 동시 실행을 막는다.** 입력 텐서를 재사용하는 구조라서,
  이전 추론이 끝나기 전에 같은 텐서를 덮어쓰면 워커가 무엇을 읽을지 보장할 수
  없다. 여러 추론을 겹쳐 돌려야 한다면 입력 텐서를 따로 두는 쪽이 맞다.
- **`_worker?.Dispose()`에 `?.`를 쓴 건 의도적이다.** `Worker`와 `Tensor`는
  `UnityEngine.Object`가 아닌 순수 C# 객체라 Unity의 가짜 null 문제가 없다.
  같은 자리에 `MonoBehaviour`나 `GameObject`가 온다면 `if (obj != null)`로
  써야 한다.
- **`BackendType`을 인스펙터에 노출했다.** 기기별로 무엇이 빠른지는 프로파일링
  없이는 모른다. 공식 문서도 CPU 쪽이 유리한 조건을 따로 적어둔다.

### 언제 GPUCompute가 아닌 걸 고르나

**Create an engine** 페이지의 기준을 옮기면 이렇다.

| 백엔드 | 쓰는 자리 |
|---|---|
| `GPUCompute` | 대부분의 모델에서 가장 빠름. 출력이 GPU에 남으면 전송 비용도 없음 |
| `CPU` | **작은 모델**이거나 **입출력이 이미 CPU에 있을 때** GPU보다 빠름 |
| `GPUPixel` | 컴퓨트 셰이더를 지원하지 않는 플랫폼에서만 |

`GPUPixel`은 `SystemInfo.supportsComputeShaders`로 판단하라고 문서가 직접
안내한다. 위 예제의 폴백이 그 문장을 그대로 옮긴 것이다.

`CPU`가 유리한 경우가 생각보다 흔하다. **입력이 `float[]` 몇 개이고 출력도
숫자 몇 개인 작은 정책 모델**이면, GPU에 올렸다 내리는 왕복이 계산보다 비싸다.
NPC 행동 판단 같은 모델이 대개 여기 해당한다.

### 어떤 모델을 얹게 되나

- **ML-Agents로 학습시킨 정책** — 학습이 끝나면 `.onnx`가 나온다. 이걸 런타임에
  돌리는 게 Sentis다. 학습 쪽 설치는
  [ML-Agents 설치 문서 읽기](/posts/ml-agents-install/)에 정리해뒀다.
- **이미지 분류·세그멘테이션** — 카메라 프레임이나 `RenderTexture`를
  `TextureConverter.ToTensor`로 넣는 경로. 위 예제가 이 형태다.
- **작은 회귀/분류 모델** — 배열을 그대로 텐서로 만든다. 텍스처 변환이
  필요 없어 가장 단순하다.

```csharp
int[] array = new int[] { 1, 2, 3, 4 };
using Tensor<int> inputTensor = new Tensor<int>(new TensorShape(4), array);
```

### 쓰지 말아야 할 자리

- **서버로 보내도 되는 큰 모델.** 온디바이스의 값어치는 오프라인 동작과
  왕복 지연 제거다. 둘 다 필요 없으면 기기 메모리와 발열을 쓸 이유가 없다.
- **매 프레임 결과가 필요한데 그 결과를 C# 로직이 읽어야 하는 구조.** 매
  프레임 리드백이 들어가면 GPU 파이프라인을 매 프레임 세우게 된다. 결과를
  셰이더에서 소비할 수 있는 형태로 바꾸는 편이 낫고, 그건
  [텐서 데이터 직접 접근](/posts/sentis-tensor-data/) 쪽 이야기다.

## 한 프레임에 다 못 돌릴 때 — `ScheduleIterable`

모델이 무거우면 위 구조로도 부족하다. `Schedule()`이 논블로킹이라고 해도 **GPU가
그 프레임에 그 일을 다 하려고 하기** 때문이다. 문서의 예시가 50ms짜리 모델이다.

`Worker`에는 `Schedule` 말고 `ScheduleIterable`이 있다.

```csharp
public IEnumerator ScheduleIterable()
public IEnumerator ScheduleIterable(Tensor input)
public IEnumerator ScheduleIterable(params Tensor[] inputs)
```

레이어 단위로 끊어 실행하는 열거자다. **Split inference over multiple frames**
페이지가 이 패턴을 보여준다. 한 프레임에 `MoveNext()`를 정해둔 횟수만 돌리고
빠져나오는 방식이다.

```csharp
private const int LAYERS_PER_FRAME = 20;

private void Update()
{
    int layersThisFrame = 0;

    while (_schedule.MoveNext())
    {
        if (++layersThisFrame >= LAYERS_PER_FRAME)
        {
            return; // 나머지는 다음 프레임에
        }
    }

    // 여기 닿았으면 모든 레이어가 끝났다
}
```

문서의 예제는 `LAYERS_PER_FRAME`에 해당하는 값을 20으로 두고, 50ms 모델을
프레임당 5ms 정도로 나눠 돌린다. 이 숫자는 기기 성능에 맞춰 조정하라고
안내한다.

한 가지 짚어둘 점은, 이게 **총 시간을 줄이지는 않는다**는 것이다. 50ms는 여전히
50ms고, 대신 열 프레임에 걸쳐 나뉜다. 프레임 드랍을 없애는 기법이지 추론을
빠르게 만드는 기법이 아니다.

## 정리

- **6단계 페이지는 API 이름 목록이다.** 실제로 동작하는 코드는 같은 문서의
  Workflow example 페이지에 있고, 거기엔 `using`, `DownloadToArray()`,
  `worker.Dispose()`가 전부 들어 있다.
- **`Resources.Load`는 `Assets` 폴더가 아니라 `Resources` 폴더를 읽는다.**
  문서의 인자 이름이 오해를 부른다. 실제로는 직렬화된 `ModelAsset` 필드를
  인스펙터에서 지정하는 쪽이 기본값이어야 한다.
- **`PeekOutput`은 빌려오는 것이다.** 워커가 소유하고, 다시 `Schedule`하면
  내용이 바뀐다. `Copy`나 `Clone`이 이름에 들어간 것만 내가 `Dispose`한다.
  이 지점에서 규칙 페이지와 예제 페이지가 서로 어긋나 있다.
- **`Schedule`과 `PeekOutput`은 논블로킹이고, 블로킹은 숫자를 꺼낼 때 온다.**
  `DownloadToArray()`가 그 자리다. `ReadbackAndCloneAsync()`로 미루거나
  `ReadbackRequest()` + `IsReadbackRequestDone()`으로 나눠 받는다.
- **백엔드는 `GPUCompute`가 기본이되 절대가 아니다.** 작은 모델이거나 입출력이
  CPU에 있으면 `CPU`가 빠르고, 컴퓨트 셰이더가 없는 기기에는 `GPUPixel`뿐이다.
- **한 프레임에 안 끝나면 `ScheduleIterable` + `MoveNext()`.** 총 시간이 아니라
  분포를 바꾸는 기법이다.

문서 여섯 줄이 짧은 건 잘못이 아니다. 다만 그 여섯 줄은 **무엇을 부르는지**만
알려주고, **무엇이 언제 기다리고 누가 무엇을 소유하는지**는 알려주지 않는다.
온디바이스 추론에서 실제로 프레임을 먹는 건 후자 쪽이다.

---

### 참고

- [Understand the Sentis workflow — Inference Engine 2.6 문서](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/understand-sentis-workflow.html)
- [Workflow example](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/workflow-example.html)
- [Get output from a model](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/get-the-output.html)
- [Create an engine](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/create-an-engine.html)
- [Split inference over multiple frames](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/split-inference-over-multiple-frames.html)
- [Resources.Load — Unity 스크립트 레퍼런스](https://docs.unity3d.com/ScriptReference/Resources.Load.html)

이 글의 출발점이 된 자료는 같은 페이지의 **2.4.1 판**이다. 항목 구성은
그대로이고, 코드와 인용은 작성 시점 최신인 **2.6.1** 문서로 다시 대조했다.
