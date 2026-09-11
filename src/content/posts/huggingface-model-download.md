---
pubDatetime: 2026-09-11T15:00:00+09:00
title: "huggingface-cli는 없어졌고, SSL 오류의 답은 따로 있다"
lang: ko
translationKey: huggingface-model-download
featured: false
draft: false
tags:
  - Python
  - Hugging Face
  - AI
  - 로컬 LLM
  - 보안
description: "Hugging Face 모델을 통째로 받는 세 가지 방법을 정리한 글을 확인했다. 그중 둘이 쓰는 명령이 v1.0에서 제거됐고, SSL 오류에 git을 권한 건 맞지만 이유가 글에 적힌 것과 다르다."
---

[Ollama 때](/posts/ollama-api-basics/)와 같은 흐름으로, 개발 도구 쪽에 로컬
LLM을 붙일 방법을 찾아보던 중이었다. 돌릴 엔진을 보고 나면 다음 질문은 모델을
어디서 어떻게 가져오느냐인데, 그러다 Hugging Face 모델을 **폴더 단위로 통째로**
받는 방법 세 가지를 정리한 [글](https://shashacode.tistory.com/111)을
스크랩해뒀었다. 제목에 조건이 붙어 있다 — "API 다운못받는 환경에서 SSL 오류날
때 사용".

2025년 4월 글이다. 확인해보니 **세 방법 중 둘이 쓰는 명령이 지금은 없다.**
그리고 제목이 내건 조건, 그러니까 SSL 오류라는 상황에 대해서는 **권한 방법은
맞는데 글에 적힌 이유가 실제 이유가 아니다.**

## 목차

## 세 방법 중 둘이 안 돈다

원문의 1번 방법에 딸린 안내다.

> ⚠️ 인증이 필요한 모델이라면, huggingface에 로그인하고 토큰 발급 받아서
> 환경변수로 설정하거나 **huggingface-cli login** 실행!

3번 방법은 통째로 그 CLI다.

```bash
huggingface-cli login
huggingface-cli repo clone mistralai/Mistral-7B-Instruct --type model
```

`huggingface_hub` v1.0 마이그레이션 문서의 문장이 이렇다.

> The deprecated `huggingface-cli` **has been removed**, `hf` (introduced in
> v0.34) replaces it with a clearer resource-action CLI.

**제거됐다.** v0.34에서 `hf`가 나왔고 한동안 둘 다 돌았는데, v1.0에서 옛
명령이 빠졌다. 바꿔 적으면 이렇게 된다.

| 원문 | 지금 |
| --- | --- |
| `huggingface-cli login` | `hf auth login` |
| `huggingface-cli whoami` | `hf auth whoami` |
| `huggingface-cli repo clone <id> --type model` | `hf download <id> --local-dir <경로>` |

마지막 줄은 이름만 바뀐 게 아니다. **현재 `hf`에는 `repo clone`이라는
서브커맨드가 없다.** `repo`는 저장소를 만들고 관리하는 쪽이고, 받는 일은
`download`가 맡는다. 원문이 "내부적으로 git-lfs를 써서 똑같이 파일 다
가져오는 방법"이라고 설명한 그 동작은 지금 `hf download`로 대체됐고, git-lfs를
경유하지 않는다.

```bash
hf auth login
hf download mistralai/Mistral-7B-Instruct-v0.3 --local-dir ./mistral
```

1번 방법의 `snapshot_download()` 자체는 그대로 있다. **파이썬 함수는 살아남고
CLI만 갈린 셈**이라, 원문의 세 방법 중 1번은 여전히 유효하고 3번은 통째로 다시
써야 한다.

## SSL 오류에 git을 권한 건 맞지만, 이유가 다르다

제목이 내건 상황은 SSL 오류다. 그런데 원문이 붙인 딱지를 보면 앞뒤가 안 맞는다.

- 1번 `snapshot_download()` — "추천! **(보안이슈 有)**"
- 2번 Git + Git LFS — "**(보안이슈 無)**", "((SSL 우회 불가 시 대체 수단))"

**세 방법 다 `https://huggingface.co`로 붙는다.** TLS 인증서 검증에 실패하는
환경이라면 git clone도 같은 벽을 만나야 정상이다. 그런데 실제로는 git 쪽이
되는 경우가 있고, 원문의 관찰은 거기서 나왔을 것이다.

이유는 우회가 아니라 **서로 다른 CA 목록을 본다는 데 있다.** `requests`
공식 문서의 문장이다.

> Requests uses certificates from the package **certifi**. This allows for users
> to update their trusted certificates without changing the version of Requests.

`huggingface_hub`은 파이썬에서 HTTP를 쓰고, 그 밑의 `requests`는 **운영체제
신뢰 저장소가 아니라 `certifi`라는 패키지에 담긴 CA 목록**을 본다. 회사망의
중간 검사 장비가 끼어 있는 환경에서는 그 회사 CA가 윈도우 인증서 저장소에는
깔려 있어도 `certifi`에는 없다. 같은 주소를 받아도 **파이썬만 실패하는** 이유가
이것이다.

| 방법 | HTTP를 누가 하나 | 신뢰 목록 |
| --- | --- | --- |
| `snapshot_download()` / `hf` | 파이썬 `requests` | `certifi` 번들 |
| `git clone` | git | git이 쓰는 백엔드의 저장소 |

**"우회"가 아니라 "다른 저장소를 보는 클라이언트로 갈아탄 것"이다.** 그래서
2번이 되는 것도 우연이 아니고, 동시에 이건 근본 해결이 아니다.

## 파이썬 쪽을 고치는 방법

`requests` 문서가 방법을 바로 다음 문단에 적어둔다.

> This list of trusted CAs can also be specified through the
> **`REQUESTS_CA_BUNDLE`** environment variable. If `REQUESTS_CA_BUNDLE` is not
> set, `CURL_CA_BUNDLE` will be used as fallback.

회사에서 받은 CA 인증서 파일을 가리키면 된다.

```bash
# Windows (PowerShell)
$env:REQUESTS_CA_BUNDLE = "C:\certs\corp-ca.pem"

# macOS / Linux
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/corp-ca.pem
```

현재 번들 위치가 궁금하면 확인할 수도 있다.

```python
from requests.utils import DEFAULT_CA_BUNDLE_PATH
print(DEFAULT_CA_BUNDLE_PATH)
```

**검증을 끄는 방법은 적지 않겠다.** SSL 오류가 나는 상황은 대개 중간에서
트래픽을 열어보는 장비가 있다는 뜻이고, 그때 검증을 끄면 그 장비를 무조건
믿겠다는 선언이 된다. 인증서를 등록하는 쪽이 손이 더 가지만 성질이 다르다.

## 예제로 든 모델 이름이 안 받아진다

원문의 세 방법이 전부 같은 이름을 쓴다.

```python
snapshot_download(
    repo_id="mistralai/Mistral-7B-Instruct",
    local_dir="C:/Users/내이름/Downloads/mistral_model"
)
```

**`mistralai/Mistral-7B-Instruct`는 그대로 받아지지 않는다.** 익명으로 열면
401이 돌아온다. Mistral의 instruct 모델은 `-v0.1`, `-v0.2`, `-v0.3`처럼
버전 접미사가 붙고, 접근에 동의가 필요한 저장소이기도 하다.

원문이 "추가 팁"에서 403이 날 때를 따로 설명하는데 — **비공개거나 조건부
액세스면 토큰 로그인 또는 웹에서 승인 요청** — 정작 자기 예제가 그 경우다.
따라 해보는 사람은 팁을 읽기 전에 먼저 막힌다. 예제를 `gpt2`처럼 조건 없는
저장소로 뒀으면 흐름이 끊기지 않았을 자리다.

## "보안이슈 有/無"가 설명되지 않는다

앞에서 미뤄둔 딱지로 돌아오면, **설명이 글 어디에도 없다.** 그리고 성립하기도
어렵다. 1번과 2번은 **같은 저장소에서 같은 파일을 받는다.** 받는 경로가 다르다고
파일이 달라지지 않는다.

진짜 보안 문제는 받는 방법이 아니라 **받은 파일을 여는 순간**에 있고, 그건 두
방법 모두에 똑같이 해당된다. 두 가지다.

**가중치 형식.** `safetensors` 문서가 존재 이유를 이렇게 적는다.

> a new simple format for storing tensors **safely (as opposed to pickle)** and
> that is still fast (zero-copy)

`.bin` 계열은 파이썬 pickle이라 역직렬화 과정에서 코드가 돌 수 있다.
`.safetensors`가 있으면 그쪽을 받는 게 낫다.

**커스텀 코드 실행.** `transformers`의 `trust_remote_code` 설명이다.

> This option should only be set to True for repositories you trust and in which
> you have read the code, as it will **execute code present on the Hub on your
> local machine.**

원문의 3번째 단계가 `AutoModelForCausalLM.from_pretrained(model_path)`인데,
모델에 따라 이 옵션을 켜라는 안내가 나온다. **거기서 켜는 순간 저장소의 코드가
내 기계에서 돈다.** "보안이슈"라고 쓸 자리가 있다면 여기다.

## `local_dir`이 하는 일

원문 예제가 `local_dir`을 쓰는데, 기본 동작과의 차이를 알아두면 나중에
헷갈리지 않는다. 현재 문서의 설명이다.

> By default, we recommend using the cache system to download files from the
> Hub. ... However, if you need to download files to a specific folder, you can
> pass a `local_dir` parameter. **This is useful to get a workflow closer to
> what the `git` command offers.**

기본은 캐시(`HF_HOME` 아래)에 받고, `local_dir`을 주면 그 폴더에 원래 구조
그대로 푼다. 원문이 git clone과 나란히 놓을 수 있었던 이유가 이것이다. 한 가지
덧붙는 동작이 있다.

> A `.cache/huggingface/` folder is created at the root of your local directory
> containing metadata about the downloaded files. This prevents re-downloading
> files if they're already up-to-date.

지정한 폴더 안에 `.cache/huggingface/`가 같이 생긴다. 모델 폴더를 통째로 다른
데 옮기거나 압축할 때 이 폴더가 따라온다는 걸 모르면 의아할 수 있다.

참고로 v1.0에서 `local_dir_use_symlinks`, `resume_download`, `force_filename`
세 인자가 제거됐다. 예전 코드나 예전 글에서 이 인자들을 봤다면 지금은 지워야
한다.

## 그래도 남는 것

**폴더 단위로 받아서 로컬 경로로 쓰는 흐름**은 그대로 유효하고, 원문이 그걸
끝까지 보여준다는 게 장점이다. 받기만 설명하고 끝나는 글이 많은데, 여기서는
받은 폴더를 `from_pretrained`에 그대로 넘기는 데까지 간다.

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

model_path = "C:/Users/내이름/Mistral-7B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path)
```

**로컬 실행과 API 호출의 비교표**도 결이 맞는다. 로컬은 모델을 통째로 올리니
메모리를 쓰고, API는 클라이언트 메모리를 거의 안 쓴다는 구분, 그리고 7~8B급을
로컬에서 돌리려면 12~16GB VRAM 이상이 필요하다는 기준도 여전히 대략적인
감으로 쓸 만하다. 다만 **Inference 쪽 요금 구조는 그 사이 여러 번 바뀌었으니
"일정 사용량까지 무료"는 지금 시점에 다시 확인해야 한다.**

`git lfs install`을 먼저 실행하라는 조언, Git Bash에서 돌리라는 조언도 그대로다.

## 정리

- **`huggingface-cli`는 `huggingface_hub` v1.0에서 제거됐다.** `hf auth login`,
  `hf download`로 바뀌었고, **`repo clone` 서브커맨드는 없다.** 원문의 3번
  방법은 통째로 다시 써야 한다.
- `snapshot_download()` 자체는 그대로다. 파이썬 함수는 남고 CLI만 갈렸다.
- **SSL 오류에 git을 권한 건 결과적으로 맞지만 이유가 다르다.** 우회가 아니라
  파이썬 `requests`가 OS 저장소가 아닌 **`certifi` 번들**을 보기 때문이다.
- **파이썬 쪽 답은 `REQUESTS_CA_BUNDLE`이다.** 회사 CA 파일을 가리키면 된다.
  검증을 끄는 건 다른 성질의 선택이다.
- **예제의 `mistralai/Mistral-7B-Instruct`는 받아지지 않는다.** 버전 접미사가
  없고 접근 동의가 필요한 저장소다. 자기 글의 403 팁에 걸리는 예제다.
- **"보안이슈 有/無"는 설명이 없고 성립하기도 어렵다.** 같은 파일을 받는다.
  실제 위험은 `pickle` 형식 가중치와 `trust_remote_code`이고, 둘 다 받는 방법과
  무관하다.
- `local_dir`을 주면 캐시 대신 그 폴더에 풀리고 **`.cache/huggingface/`가
  같이 생긴다.** `local_dir_use_symlinks` 등 세 인자는 v1.0에서 제거됐다.

받는 방법을 정리한 글에서 제일 먼저 상하는 건 **CLI 명령**이었다. 라이브러리
함수는 1년 반을 버텼는데 명령줄 도구는 이름째 바뀌었다.

그리고 제목이 내건 조건이 이 글에서 제일 흥미로운 부분이었다. **되는 방법을
찾아낸 것과 왜 되는지 아는 것은 다르다.** 원문은 앞엣것을 해냈고, 그래서
글로 남길 값이 있었다. 다만 이유를 "우회"로 적어두면 그다음에 할 수 있는 게
없다. **`certifi`라는 이름 하나가 나오면 고칠 자리가 생긴다.**

로컬 LLM을 붙이려고 찾던 입장에서 남는 건 이거다. 엔진을 고르는 것과 모델을
받는 것은 별개의 문제이고, **받는 쪽에서 막히는 자리는 대개 모델이 아니라
경로다.** 인증서, 접근 승인, 바뀐 명령어 — 셋 다 모델과 무관한데 셋 다 여기서
걸린다.

## 참고

- [Migrating to huggingface_hub v1.0](https://huggingface.co/docs/huggingface_hub/en/concepts/migration)
- [CLI — huggingface_hub](https://huggingface.co/docs/huggingface_hub/guides/cli)
- [Download files from the Hub — huggingface_hub](https://huggingface.co/docs/huggingface_hub/guides/download)
- [SSL Cert Verification — Requests](https://requests.readthedocs.io/en/latest/user/advanced/)
- [Safetensors](https://huggingface.co/docs/safetensors/index)
- [Auto Classes — Transformers](https://huggingface.co/docs/transformers/main/en/model_doc/auto)
- 원문: [\[python\] Huggingface 모델 다운로드 방법](https://shashacode.tistory.com/111)
