---
pubDatetime: 2026-08-26T10:00:00+09:00
title: "Sentis에서 텐서 데이터에 직접 접근하기: 리드백을 피하는 이유와 방법"
lang: ko
translationKey: sentis-tensor-data
featured: false
draft: false
tags:
  - Unity
  - Sentis
  - AI
  - 온디바이스 AI
  - GPU
description: "온디바이스 추론의 병목은 대개 추론 자체가 아니라 GPU와 CPU 사이의 데이터 이동이다. Sentis가 그걸 줄이려고 제공하는 API를 정리했다."
---

Sentis로 뭔가 만들어보다가 이 문서에 닿았다. 모델을 얹어서 돌리는 데까지는
예제를 따라가면 되는데, 그다음부터 질문이 생긴다. **추론 결과가 지금 어디에
있고, 그걸 꺼내 쓰는 게 공짜인가.**

Unity에서 신경망을 돌릴 때 느린 지점이 항상 추론 자체인 것은 아니다. 모델이
GPU에서 잘 도는데도 프레임이 튄다면 **결과를 CPU로 가져오는 과정**을 의심해볼
만하다.

공식 문서에 이 문제를 다루는 페이지가 있다. 텐서의 네이티브 데이터에
직접 읽고 쓰는 방법을 안내하는 페이지인데, **왜 그렇게 해야 하는지**는 한 줄로
지나간다. 그 한 줄이 사실 이 API 전체의 이유다.

정리하면서 버전 문제도 같이 짚는다. 이 주제는 **오래된 자료를 그대로 따라 하면
컴파일부터 안 되기 때문**이다.

## 목차

## 먼저, 이름이 네 개다

이 패키지를 검색하면 이름이 여러 개 나온다. 정리하면 이렇다.

| 무엇 | 값 |
|---|---|
| 패키지 ID | `com.unity.ai.inference` |
| 네임스페이스 | `Unity.InferenceEngine` |
| 패키지 매니저 표시 이름 | **Sentis** |
| 옛 패키지 ID | `com.unity.sentis` (더 이상 쓰지 않음) |

원래 Sentis였다가 Inference Engine으로 바뀌었고, 그 뒤 **표시 이름만 다시
Sentis로 돌아왔다.** Unity 포럼의 직원 답변이 명확하다.

> 이름이 Sentis로 다시 바뀌었습니다. 패키지 이름은 그대로입니다. 코드는
> 바꿀 필요가 없고, 패키지 매니저에서 두 이름 중 어느 쪽으로도 찾을 수
> 있습니다.

즉 **표시 이름만 되돌린 것이고 패키지 ID와 네임스페이스는 그대로**다.
문서 페이지 제목이 여전히 "Sentis"로 나오는 것도 이 때문이다.

실무에서 걸리는 건 하나다. **`using` 문이 버전에 따라 다르다.**

```csharp
// com.unity.sentis 시절 (2.1 이하)
using Unity.Sentis;

// 현재 (com.unity.ai.inference)
using Unity.InferenceEngine;
```

업그레이드 가이드는 **Unity의 자동 API 업데이터를 쓰거나, `Unity.Sentis`를
전부 `Unity.InferenceEngine`으로 바꾸라고** 안내한다. 클래스나 메서드 이름은
바뀌지 않았다.

인터넷에 도는 Sentis 예제 코드가 컴파일이 안 된다면 대개 이것이 원인이다.
아래 코드는 전부 현재 네임스페이스 기준이다. **작성 시점 기준 최신은 2.6.1**이다.

## 왜 직접 접근하는가 — 리드백

문서가 첫 문장에서 이렇게 말한다. 여러 모델 사이에서 텐서를 주고받거나 접근할
때 **"느린 리드백(slow readback)"을 피하려면** 네이티브 데이터를 직접 읽고
쓰라고.

리드백은 **GPU 메모리에 있는 결과를 CPU 메모리로 가져오는 것**이다. 이게 왜
비싼지는 GPU가 일하는 방식을 생각하면 이해가 된다.

CPU는 GPU에 명령을 쌓아두고 바로 다음 일을 한다. 둘은 비동기로 움직인다.
그런데 CPU가 GPU의 계산 결과를 **지금 읽겠다**고 하면, GPU가 그 지점까지
끝낼 때까지 기다려야 한다. 쌓아둔 파이프라인이 비워질 때까지 CPU가 멈추는
셈이다.

그래서 이런 경우 리드백이 낭비다.

- **모델 A의 출력을 모델 B의 입력으로 넘길 때** — 둘 다 GPU에서 도는데
  중간에 CPU를 한 번 들렀다 갈 이유가 없다.
- **결과를 텍스처로 그릴 때** — 어차피 GPU로 돌아갈 데이터다.

반대로 최종 결과를 C# 로직에서 판단해야 한다면(예: 분류 결과의 인덱스)
리드백은 피할 수 없다. 그때는 **비동기로** 요청하고 완료를 확인하는 쪽이 낫다.

## 텐서가 어디 있는지 확인하기

텐서의 `backendType`으로 데이터 위치를 알 수 있다.

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

값은 셋 중 하나다.

| 값 | 의미 |
|---|---|
| `BackendType.CPU` | CPU 메모리 |
| `BackendType.GPUCompute` | 컴퓨트 셰이더 메모리 (`ComputeBuffer`) |
| `BackendType.GPUPixel` | 픽셀 셰이더 경로 |

`tensor.dataOnBackend.backendType`으로도 같은 값을 얻을 수 있다. `dataOnBackend`는
백엔드별 내부 표현이고, `backendType`은 그걸 거치지 않는 짧은 형태다.

## 강제로 옮기기 — Pin

원하는 쪽으로 데이터를 옮길 수 있다.

```csharp
Tensor<float> inputTensor = new Tensor<float>(new TensorShape(1, 3, 2, 2));

// GPU 컴퓨트 메모리로 강제
ComputeTensorData computeTensorData = ComputeTensorData.Pin(inputTensor);
```

- `ComputeTensorData.Pin` — GPU 컴퓨트 셰이더 메모리(`ComputeBuffer`)로
- `CPUTensorData.Pin` — CPU 메모리로

**동작 규칙 두 가지를 기억해야 한다.**

- 이미 그 장치에 있으면 **아무 일도 하지 않는다**(패스스루).
- 아니면 **기존 데이터를 폐기하고 대상 백엔드에 새로 할당한다.**

두 번째가 중요하다. 무심코 `Pin`을 반복 호출하면 그때마다 할당과 복사가
일어난다는 뜻이다.

## CPU 데이터 직접 읽고 쓰기

텐서가 CPU에 있고 **그 텐서에 의존하는 연산이 전부 끝났으면** 읽고 쓸 수 있다.
그래서 조건을 두 개 확인한다.

```csharp
var tensor = new Tensor<float>(new TensorShape(1, 2, 3));
//...
if (tensor.backendType == BackendType.CPU && tensor.IsReadbackRequestDone()) {
    // 직접 읽고 쓸 수 있는 상태
    tensor[0, 1, 0] = 1f;
    tensor[0, 1, 1] = 2f;
    tensor[0, 1, 2] = 3f;
    float val = tensor[0, 0, 2];
}
```

인덱서 대신 **평탄화된 형태**로 받을 수도 있다. 메모리 배치는 **row-major**다.

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

`[0,1,0]`이 평탄화 인덱스 `3`인 이유는 row-major이기 때문이다. 형상이
`(1, 2, 3)`이니 마지막 축이 3칸씩 연속으로 놓이고, 두 번째 축의 인덱스 1은
`1 × 3 = 3`부터 시작한다.

이름 그대로 `AsReadOnly...`는 **읽기 전용**이다. 쓰려면 인덱서를 쓴다.

## 백엔드 메모리에 직접 업로드

`Upload`로 데이터를 밀어 넣을 수 있다.

```csharp
var tensor = new Tensor<float>(new TensorShape(1,2,3), new [] { 0f, 1f, 2f, 3f, 4f, 5f });
tensor.Upload(new [] { 6f, 7f, 8f });
// 이제 텐서 데이터는 {6,7,8,3,4,5}
```

앞에서부터 덮어쓰고 나머지는 그대로 둔다.

**주의할 점이 있다.** 이 메서드는 모든 백엔드에서 동작하지만 **블로킹일 수
있다.** CPU에 있으면 그 텐서의 대기 중인 작업이 끝날 때까지 막고, GPU에 있으면
GPU 업로드를 수행한다. 매 프레임 호출하는 자리에 넣을 때는 이 점을 감안해야
한다.

## GPU 메모리의 텐서 접근하기

`ComputeTensorData.Pin`으로 `ComputeTensorData`를 얻은 뒤, `buffer` 속성으로
컴퓨트 버퍼에 직접 접근한다. 그다음은 평범한 `ComputeBuffer` 사용법이다.

이 경로의 값어치는 **데이터가 GPU를 떠나지 않는다**는 데 있다. 추론 결과를
컴퓨트 셰이더로 후처리하거나 그대로 렌더링에 쓸 때, CPU를 거치지 않고 이어붙일
수 있다.

공식 샘플의 `Read output asynchronously` 예제가 이 패턴을 보여준다.

## CPU 메모리의 텐서를 Burst 잡에서 다루기

`CPUTensorData.Pin`으로 얻은 객체는 `IJobParallelFor` 같은 Burst 함수에서
읽고 쓸 수 있다.

여기서 중요한 게 **펜스(fence)** 다. 잡 의존성을 처리하기 위한 속성이 두 개
있다.

| 속성 | 용도 |
|---|---|
| `CPUTensorData.fence` | 읽기 펜스 |
| `CPUTensorData.reuse` | 쓰기 펜스 |

Burst 잡은 비동기로 돈다. 그래서 **Sentis가 아직 쓰고 있는 텐서를 잡이 읽으면**
경쟁 상태가 된다. 펜스는 그 순서를 지키기 위한 핸들이다.

네이티브 배열로 다루려면 `NativeTensorArray` 클래스의 메서드를 쓴다.

공식 샘플의 `Use the job system to write data` 예제가 이 패턴을 보여준다.

## 정리

- **패키지 ID는 `com.unity.ai.inference`, 네임스페이스는
  `Unity.InferenceEngine`, 표시 이름은 Sentis.** 옛 자료의 `using Unity.Sentis;`가
  컴파일 안 되는 이유다.
- 직접 접근의 목적은 **리드백 회피**다. GPU에서 CPU로 결과를 당겨오면 비동기로
  돌던 파이프라인을 세우게 된다.
- **위치 확인은 `backendType`, 이동은 `Pin`.** `Pin`은 같은 장치면 패스스루,
  아니면 폐기 후 재할당이다.
- CPU에서 직접 읽으려면 **`BackendType.CPU`이면서 `IsReadbackRequestDone()`**
  이어야 한다. 평탄화 배치는 row-major다.
- **`Upload`는 블로킹일 수 있다.**
- GPU에 남겨둔 채 이어붙이려면 `ComputeTensorData.buffer`, Burst 잡에서 다루려면
  `CPUTensorData.Pin` + 펜스.

결국 이 API들이 답하는 질문은 하나다. **이 데이터가 지금 어디 있고, 굳이
옮겨야 하는가.**

---

### 참고

- [Access tensor data directly — Inference Engine 문서](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.6/manual/access-tensor-data-directly.html)
- [Upgrade to Inference Engine 2.2](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.2/manual/upgrade-guide.html)
- [Namespace Unity.InferenceEngine](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.4/api/Unity.InferenceEngine.html)
- [Did Inference Engine package revert to the old Sentis name? — Unity Discussions](https://discussions.unity.com/t/did-inference-engine-package-revert-to-the-old-sentis-name/1695183)
- [Job System — Unity 매뉴얼](https://docs.unity3d.com/Manual/JobSystem.html)

이 글의 출발점이 된 자료는 같은 문서의 **Sentis 2.0.0 판**이다. 항목 구성을
참고했고, 네임스페이스와 API는 현행 문서(2.6.1)로 다시 대조했다.
