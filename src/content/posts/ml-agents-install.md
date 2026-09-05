---
pubDatetime: 2026-09-05T19:00:00+09:00
title: "ML-Agents 설치 문서 읽기: 파이썬 3.10.12는 권장이 아니라 상한이다"
lang: ko
translationKey: ml-agents-install
featured: false
draft: false
tags:
  - Unity
  - ML-Agents
  - AI
  - Python
  - 강화학습
  - 온디바이스 AI
description: "ML-Agents 설치 절차가 왜 이렇게 까다로운지를 툴킷이 두 조각으로 나뉜 구조에서 짚었다. Conda와 3.10.12 지정의 이유, Unity 패키지와 Python 패키지의 버전 짝, 그리고 Sentis와 Inference Engine이라는 두 이름까지."
---

게임 개발 프로젝트에 온디바이스 AI를 넣으면서 Sentis를 붙여야 했고, 그걸
상세히 알아보다가 ML-Agents 툴킷 설치 문서를 스크랩해뒀었다. Sentis를
찾아보면 ML-Agents 자료가 같이 딸려 나오는데, **ML-Agents가 Sentis를 쓰는
쪽**이기 때문이다.

문서 자체는 Unity 설치 → Conda로 Python 환경 구성 → Unity 패키지 설치 →
Python 패키지 설치 순서의 절차서다. 그냥 따라 하면 된다.

그런데 이 문서에는 **"왜"가 거의 없다.** 왜 하필 Conda인지, 왜 Python
**3.10.12**라는 세 자리 버전을 콕 집는지, 왜 설치 순서를 지키라고 하는지가
안 적혀 있다. 그리고 그 이유들이 설치가 실패하는 지점과 정확히 겹친다.
그래서 이유 쪽을 채워서 다시 정리했다.

## 목차

## 이 툴킷이 두 조각인 이유

설치가 까다로운 근본 원인이 여기 있다. ML-Agents는 **하나의 패키지가
아니다.** 공식 매뉴얼의 표현이다.

> The C# package does not contain the machine learning algorithms for training
> behaviors ... The machine learning algorithms that orchestrate training are
> part of the companion Python package.

즉 이렇게 나뉜다.

- **Unity 쪽 (`com.unity.ml-agents`)** — 에이전트, 관측, 행동, 보상을 게임
  안에서 정의하고, 학습이 끝난 모델을 실행한다.
- **Python 쪽 (`mlagents`)** — 실제 학습 알고리즘. `mlagents-learn`으로 돌린다.

학습 중에는 이 둘이 **로컬 소켓으로 통신하면서** 돈다. Unity가 관측을 보내면
Python이 행동을 돌려주는 구조다. 그래서 **두 쪽의 버전이 맞아야 하고**, 설치
과정이 Unity 패키지 매니저와 pip 두 군데로 갈린다. 문서가 "Unity ML-Agents
패키지 버전과 맞는 Python 패키지 버전을 설치하라"고 강조하는 게 이 때문이다.

## 파이썬 3.10.12는 권장이 아니라 상한이다

문서는 이렇게만 적는다.

> Install Python 3.10.12 using Conda

왜 3.10.12인지는 없다. PyPI의 `mlagents` 패키지 메타데이터를 보면 답이 나온다.

> Requires-Python: **<=3.10.12, >=3.10.1**

**상한이 걸려 있다.** 3.10.13도 안 되고 3.11은 당연히 안 된다. 요즘 파이썬
패키지에서 보기 드물게 좁은 범위다. 시스템에 깔린 파이썬이 3.11이나 3.12라면
`pip install mlagents`가 아예 거부된다.

문서가 Conda나 Mamba를 쓰라고 하는 이유도 이것이다. `venv`는 **이미 설치된**
파이썬 인터프리터로 가상환경을 만들 뿐이라, 3.10.12가 시스템에 없으면
만들 수가 없다. Conda는 인터프리터 자체를 원하는 버전으로 받아온다.

```shell
conda create -n mlagents python=3.10.12 && conda activate mlagents
```

**이 한 줄이 이 문서에서 가장 중요한 줄이다.** 여기를 건너뛰고 시스템
파이썬으로 진행하면 뒤의 모든 단계가 의미가 없다.

## 버전 짝 맞추기

문서가 링크만 걸어둔 부분을 실제 값으로 채우면 이렇다.

| | 현재 |
| --- | --- |
| 최신 릴리스 | **Release 23** (2025-09-02) |
| Unity 패키지 | `com.unity.ml-agents` **4.0.3** |
| Python 패키지 | `mlagents` **1.1.0** (2024-10-05) |
| 최소 Unity 버전 | **6000.0** 이상 |

여기서 눈에 띄는 게 하나 있다. **Python 패키지가 2024년 10월에 멈춰 있다.**
Release 23이 2025년 9월에 나왔는데 PyPI의 `mlagents`는 그대로다. 그래서
문서의 `pip install mlagents==1.1.0`은 지금도 맞는 값이다.

릴리스 주기도 참고할 만하다. Release 19(2022-01) → 20(2022-11) →
21(2023-10) → 22(2024-10) → 23(2025-09)으로, **대략 연 1회**다. 지금이
2026년 9월이니 Release 23이 나온 지 1년째인데, 이 주기에서는 아직 이례적이라고
보기 어렵다. 다만 **빠르게 굴러가는 프로젝트를 기대하고 들어가면 안 된다**는
정도는 알고 시작하는 게 낫다.

## 지금 기준으로 손볼 부분

스크랩본은 4.0 문서인데, 몇 가지가 이미 어긋난다.

**패키지 버전.** 문서 제목은 4.0.1인데 현재 Unity 패키지는 **4.0.3**이다.

**Preview Packages 안내.** 문서에 이런 단계가 있다.

> Enable **Preview Packages** under the **Advanced** drop-down list if the
> package doesn't appear.

현재 `com.unity.ml-agents`는 **정식 릴리스 패키지**로 올라와 있다. 이름으로
추가하면 그냥 잡히므로 이 단계는 보통 필요 없다. 옛 버전 문서에서 넘어온
안내로 보인다.

**PyTorch 설치 줄.** Windows용으로 이 명령을 준다.

```shell
pip3 install torch~=2.2.1 --index-url https://download.pytorch.org/whl/cu121
```

`torch 2.2.1` + `cu121`은 2024년 초 기준 조합이다. 최신 GPU를 쓴다면 이
빌드가 그 아키텍처를 지원하지 않을 수 있으므로, 문서도 함께 안내하는
[PyTorch 설치 페이지](https://pytorch.org/get-started/locally/)에서 **내 GPU에
맞는 CUDA 버전을 직접 고르는 편**이 안전하다. 다만 `mlagents`가 요구하는
torch 버전 범위를 벗어나면 안 되므로, 올릴 때는 한 번에 최신으로 가지 말고
확인하면서 올리는 게 맞다.

## Sentis인가 Inference Engine인가

학습이 끝난 모델을 Unity 안에서 돌리는 부분에서 이름이 두 개로 나온다.
ML-Agents 자체 문서 안에서도 갈린다.

- **매뉴얼 본문** — 학습된 행동을 **Sentis**를 통해 임베드한다고 적는다.
- **Release 23 릴리스 노트** — **Inference Engine 2.2.1**로 업그레이드했다고
  적는다.

그리고 현재 Unity의 추론 패키지는 **`com.unity.ai.inference`** 2.3.0이다.
문서 설명은 이렇다.

> Inference Engine is a neural network inference library for Unity. It lets you
> import trained neural network models into Unity and run them in real-time
> with your target device's compute resources, such as central processing unit
> (CPU) or graphics processing unit (GPU).

즉 **같은 것을 가리키는 두 이름**이고, ML-Agents 문서에는 아직 옛 이름이
남아 있다. 자료를 찾을 때 `Sentis`로도 `Inference Engine`으로도 검색해봐야
한다는 뜻이다. 이 추론 계층이 실제로 무엇을 하는지는
[Sentis의 텐서 데이터 접근](/posts/sentis-tensor-data/)에서 따로 정리했다.

여기서 구조가 하나 더 정리된다. **학습은 Python, 추론은 Unity**다. 빌드에
파이썬이 따라 들어가지 않는다. 학습이 끝나면 `.onnx` 모델 파일만 남고,
게임은 그걸 Inference Engine으로 돌린다.

### Sentis만 필요하다면 이 설치는 필요 없다

내가 이 문서에 닿은 경로가 그랬듯, Sentis를 찾다가 ML-Agents로 흘러오기 쉽다.
그런데 **둘의 관계는 포함이지 대등이 아니다.**

- **Inference Engine(Sentis)** — 학습된 ONNX 모델을 Unity 안에서 실행하는
  추론 라이브러리. 모델이 어디서 왔든 상관없다.
- **ML-Agents** — 그 위에 얹힌 **학습 툴킷**. 관측·행동·보상을 정의하고
  Python으로 강화학습을 돌린 뒤, 결과 모델을 Inference Engine으로 실행한다.

그러니 목적이 **"이미 있는 모델을 게임 안에서 돌리는 것"**이라면
`com.unity.ai.inference` 하나만 넣으면 되고, 이 문서의 Conda·PyTorch·Python
패키지는 전부 필요 없다. 반대로 **"게임 안에서 에이전트를 학습시키는 것"**이
목적일 때만 이 설치 절차가 의미가 있다.

Sentis 쪽 자료를 찾다가 ML-Agents 설치 문서가 나왔다면, 우선 어느 쪽이
필요한지부터 가르는 게 시간을 아낀다.

## 두 가지 설치 방식 중 무엇을 고를 것인가

문서는 두 갈래를 제시하는데, 기준이 하나로 정리된다. **예제 환경이
필요한가.**

- **Package installation** — Unity 패키지 매니저에서 이름으로 추가하고
  `pip install mlagents==1.1.0`. 툴킷을 고칠 생각이 없다면 이쪽.
- **Advanced installation** — 저장소를 클론해서 로컬 패키지로 추가하고
  Python 패키지도 소스에서 설치. **예제 환경(Project 폴더)이 여기에만 있다.**

처음 배우는 입장이라면 사실상 Advanced가 기본이다. 3D Ball 같은 예제를
돌려보지 않고 관측·행동·보상 설계를 감으로 잡기는 어렵기 때문이다.

클론할 때 브랜치를 지정하는 이유도 문서에 있다.

```sh
git clone --branch release_23 https://github.com/Unity-Technologies/ml-agents.git
```

`--branch`를 빼면 `develop`이 받아지고, 여기에는 실험적이거나 불안정한 변경이
들어 있을 수 있다.

## 순서를 지켜야 하는 곳

Advanced 설치의 마지막에 문서가 굵게 강조하는 부분이 있다.

> Install the packages in this order. The `mlagents` package depends on
> `mlagents_envs`. Installing them in the other order will download
> `mlagents_envs` from PyPi, which can cause version mismatches.

```sh
python -m pip install ./ml-agents-envs
python -m pip install ./ml-agents
```

**순서를 바꾸면 조용히 잘못된 것이 설치된다.** `mlagents`를 먼저 깔면 pip이
의존성인 `mlagents_envs`를 PyPI에서 받아오고, 그러면 방금 클론한 소스가 아니라
릴리스판이 들어간다. 소스를 고치려고 클론했는데 정작 다른 것이 도는 상황이다.
에러가 안 나기 때문에 알아채기 어렵다.

`grpcio` 우회도 같은 성격이다.

```shell
conda install "grpcio=1.48.2" -c conda-forge
```

휠 빌드가 실패할 때 conda-forge에서 미리 빌드된 것을 받아 끼우는 방식이다.
파이썬 버전이 좁게 묶여 있는 프로젝트에서 자주 나오는 패턴이다.

마지막으로 설치 확인은 이 한 줄이다.

```sh
mlagents-learn --help
```

파라미터 목록이 나오면 Python 쪽은 끝났다는 뜻이다.

## 정리

- ML-Agents는 **Unity 패키지와 Python 패키지 두 조각**이다. 학습 알고리즘은
  Python 쪽에만 있고, 둘이 로컬 통신으로 붙어 돈다. 설치가 복잡한 이유가 이
  구조다.
- **Python 3.10.12는 권장이 아니라 상한**이다. PyPI 메타데이터가
  `<=3.10.12, >=3.10.1`로 못 박는다. Conda를 쓰라는 것도 인터프리터 자체를
  그 버전으로 받아야 하기 때문이다.
- 현재 기준: Release 23(2025-09), Unity 패키지 4.0.3, Python 패키지 1.1.0
  (2024-10), 최소 Unity 6000.0. **Python 쪽은 2024년 10월에 멈춰 있다.**
- 문서의 "Preview Packages 활성화" 안내는 지금은 보통 불필요하다. 정식
  릴리스 패키지다.
- PyTorch 줄의 `cu121`은 2024년 초 조합이다. 최신 GPU라면 PyTorch 설치
  페이지에서 맞는 CUDA 빌드를 직접 고를 것.
- 추론 계층의 이름이 문서마다 **Sentis**와 **Inference Engine**으로 갈린다.
  같은 것이고, 현재 패키지는 `com.unity.ai.inference`다. **학습은 Python,
  추론은 Unity**이므로 빌드에 파이썬은 안 들어간다.
- **목적이 추론뿐이라면 이 설치는 필요 없다.** 학습이 필요할 때만 ML-Agents다.
  이미 있는 모델을 돌리는 것뿐이라면 `com.unity.ai.inference`만으로 끝난다.
- **예제 환경은 Advanced 설치(저장소 클론)에만 있다.** 처음이라면 이쪽.
- `ml-agents-envs`를 먼저, `ml-agents`를 나중에 설치한다. 순서를 바꾸면 소스
  대신 PyPI판이 조용히 들어간다.

## 참고

- [Install the ML-Agents Toolkit — Unity](https://docs.unity3d.com/Packages/com.unity.ml-agents@4.0/manual/Installation.html)
- [ML-Agents Toolkit overview — Unity](https://docs.unity3d.com/Packages/com.unity.ml-agents@4.0/manual/index.html)
- [ML-Agents releases — GitHub](https://github.com/Unity-Technologies/ml-agents/releases)
- [mlagents — PyPI](https://pypi.org/project/mlagents/)
- [Inference Engine — Unity](https://docs.unity3d.com/Packages/com.unity.ai.inference@2.3/manual/index.html)
