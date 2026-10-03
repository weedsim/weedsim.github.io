---
pubDatetime: 2026-10-03T17:00:00+09:00
title: "`--parameters`라는 플래그는 없다"
lang: ko
translationKey: ollama-api-hosting
featured: false
draft: false
tags:
  - Ollama
  - LLM
  - API
  - 로컬 LLM
  - 인프라
description: "Ollama를 로컬에서 API로 띄우는 절차를 11절로 정리한 가이드다. 설치와 CLI는 그대로 쓸 수 있는데, 정작 호스팅에 관한 세 절이 각각 틀렸다. 그리고 여러 클라이언트가 붙을 때 가장 먼저 걸리는 설정이 가이드에 없다."
---

게임 개발과는 별개로, **로컬 LLM을 Ollama로 개발 도구에 붙여 쓸 방법**을 찾던
흐름의 연장이다. [앞선 글](/posts/ollama-api-basics/)에서 같은 이유로 Ollama의
REST API를 한 번 정리했고, 요청 본문 쪽에서 `stream`과 `options`를 갈라두는
데까지 갔다. 그 글이 이렇게 끝났다.

> 개발 PC의 Ollama를 다른 기기에서 불러 쓰려는 순간부터는 **앞단에 뭘 둘지를
> 같이 정해야 한다.**

이번 글이 그 "앞단"이다. 2025년 글이고, 설치부터 systemd, 보안, FAQ까지 11절로
묶은 종합 가이드다.

**설치와 CLI 절은 그대로 쓸 수 있다.** `ollama pull`·`ps`·`run`·`stop`의
네 명령은 현행 CLI 레퍼런스에 그대로 있고, 설치 스크립트 주소도 맞다.

문제는 **정작 호스팅에 관한 세 절**이다. 성능 팁에 적힌 명령은 존재하지 않는
플래그를 쓰고, systemd 샘플은 업그레이드에 지워질 파일을 쓰고, 보안 절은 자기
5절과 충돌한다. 그리고 여러 클라이언트가 붙었을 때 **가장 먼저 걸리는 설정**이
가이드에 없다.

## 목차

## 설치와 CLI는 그대로 쓸 수 있다

먼저 맞는 쪽부터. CLI 레퍼런스에 네 명령이 그대로 있다.

| 가이드 | 현행 CLI 레퍼런스 |
| --- | --- |
| `ollama pull llama3:8b` | `ollama pull gemma4` |
| `ollama ps` | "List running models" |
| `ollama run llama3:8b` | `ollama run gemma4` |
| `ollama stop llama3:8b` | "Stop a running model" |

`ollama stop`이 있다는 것부터가 2025년 글의 미덕이다. 초기 Ollama에는 로드된
모델을 명령으로 내리는 방법이 없었다.

바인드 주소 설명도 맞다.

> `ollama serve` → `http://127.0.0.1:11434` 에 바인딩

FAQ의 문장과 같다.

> Ollama binds 127.0.0.1 port 11434 by default.

모델 이름은 시점을 드러낸다. 가이드 전체가 `llama3:8b`를 쓰는데, 현행 문서의
예시는 `gemma4`나 `gpt-oss:20b`다. `llama3:8b`가 사라진 건 아니지만, **2025년
3월에 쓸 만했던 선택**이라는 걸 알고 읽어야 한다.

## `--parameters`라는 플래그는 없다

8절 성능 팁이다. 네 항목 중 둘이 이렇게 적혀 있다.

> - **컨텍스트 길이**
> - `ollama run llama3:8b --parameters num_ctx=2048`
> - **온도·배치**
> - `ollama run llama3:8b --parameters temperature=0.1,num_batch=128`

**`--parameters`라는 플래그가 CLI 레퍼런스에 없다.** `ollama run`에 붙는 플래그
목록 자체가 문서에 없고, 문서는 환경 변수를 보라고 넘긴다.

> To view a list of environment variables that can be set run
> `ollama serve --help`

직접 실행해서 확인한 게 아니라 **문서를 읽어서 없다고 말하는 것**이므로, 혹시
문서화되지 않은 플래그가 있을 가능성은 남겨둔다. 다만 문서가 안내하는 자리는
셋이고, 셋 다 `--parameters`가 아니다.

**첫째, API의 `options`.** [앞선 글](/posts/ollama-api-basics/)에서 본 그 자리다.
`num_ctx`가 거기 있다.

> **options** — Runtime options that control text generation

> **num_ctx** — Context length size (number of tokens)

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3:8b",
  "prompt": "기계학습이란?",
  "stream": false,
  "options": { "num_ctx": 2048, "temperature": 0.1 }
}'
```

**둘째, Modelfile.** 값을 고정해두고 모델처럼 쓰는 방법이다. CLI 레퍼런스가
절차를 적어둔다.

```
FROM llama3:8b
PARAMETER num_ctx 2048
PARAMETER temperature 0.1
SYSTEM """너는 간결하게 답한다."""
```

```bash
ollama create my-llama -f Modelfile
ollama run my-llama
```

**셋째, 컨텍스트 길이만은 환경 변수가 따로 있다.** FAQ가 기본값까지 적는다.

> The default context window is **4096 tokens**, configurable via
> `OLLAMA_CONTEXT_LENGTH`.

기본 4096이다. 가이드가 `num_ctx=2048`을 "성능 팁"으로 든 건 **기본값보다
줄이는** 쪽인데, 그 기본값이 얼마인지는 가이드에 없다. 줄이기 전에 알아야 하는
숫자다.

| 어디서 정하나 | 적용 범위 | 문서화된 방법 |
| --- | --- | --- |
| API의 `options` | 그 요청 하나 | `"options": { "num_ctx": 2048 }` |
| Modelfile | 그 모델 전체 | `PARAMETER num_ctx 2048` |
| `OLLAMA_CONTEXT_LENGTH` | 서버 전체 | 환경 변수 (기본 4096) |
| `--parameters` 플래그 | — | **문서에 없다** |

## systemd 유닛을 새로 쓰면 업그레이드에 지워진다

5절의 systemd 샘플이다.

```
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
Environment="OLLAMA_HOST=0.0.0.0"
ExecStart=/usr/local/bin/ollama serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

내용 자체는 그럴듯하다. 문제는 **이 파일을 어디에 쓰느냐**다. 같은 가이드 3절이
설치 스크립트를 안내한다.

> `curl -fsSL https://ollama.com/install.sh | sh`

그 스크립트가 **`/etc/systemd/system/ollama.service`를 이미 만든다.** 위 내용을
거기에 덮어쓰면 다음 설치·업그레이드에서 스크립트가 다시 쓰고, `OLLAMA_HOST`가
사라진다. 왜 안 되는지 모른 채 "분명히 설정했는데" 상태가 된다.

FAQ가 안내하는 방법은 유닛 파일을 쓰는 게 아니라 **override를 더하는** 것이다.

```
systemctl edit ollama.service
```

그리고 `[Service]` 절에 환경 변수만 적는다.

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

```
systemctl daemon-reload
systemctl restart ollama
```

`systemctl edit`은 유닛 파일을 고치지 않고 **`.../ollama.service.d/override.conf`**
를 만든다. 원래 유닛은 그대로 남으니 업그레이드가 덮어써도 설정이 살아 있다.

| | 가이드의 방법 | FAQ의 방법 |
| --- | --- | --- |
| 손대는 파일 | `ollama.service` 전체 | `ollama.service.d/override.conf` |
| 업그레이드 후 | 설정이 사라진다 | 남는다 |
| 적는 내용 | 유닛 전체(7줄) | 환경 변수만(2줄) |
| 틀릴 여지 | `ExecStart` 경로, `User` | 거의 없다 |

가이드가 적어둔 `ExecStart=/usr/local/bin/ollama serve`도 그 자체로 위험하다.
설치 방법에 따라 바이너리 경로가 다르고, 틀리면 서비스가 아예 안 뜬다.
override 쪽은 경로를 적지 않으므로 그 실패가 생기지 않는다.

## `/api/pull`의 필드는 `name`이 아니다

6절 REST API 예시 중 마지막 줄이다.

```bash
# 모델 다운로드
curl -X POST http://localhost:11434/api/pull -d '{"name":"phi3:mini"}'
```

현행 API 문서의 파라미터 목록은 이렇다.

> **model** (required): Name of the model to download
>
> **insecure** (optional): Allow downloading over insecure connections
>
> **stream** (optional, default true): Stream progress updates

**필드 이름이 `model`이다.** `name`은 예전 이름이고 문서의 파라미터 목록에
없다. 호환이 남아 있을 수는 있지만, 지금 쓰는 사람이 기대야 할 쪽은 아니다.

같은 절의 다른 예시들에도 짚을 게 있다. 넷 중 셋이 `stream`을 안 넘긴다.

```bash
curl http://localhost:11434/api/generate \
     -d '{"model":"llama3:8b","prompt":"기계학습이란?"}'
```

문서의 기본값이 그 결과를 정한다.

> **stream** — When true, returns a stream of partial responses
>
> Default: `true`

**기본이 스트리밍이다.** 이 `curl`은 답변 한 덩어리가 아니라 **JSON 객체
여러 개**를 줄줄이 뱉는다. 터미널에서 처음 쳐보면 "왜 이렇게 길지"가 된다.
[앞선 글](/posts/ollama-api-basics/)에서 다룬 그 혼동이고, 가이드는 `"stream":
false`를 한 번도 쓰지 않는다.

한 줄로 보고 싶으면 이렇게 쓴다.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3:8b",
  "prompt": "기계학습이란?",
  "stream": false
}'
```

## 호스팅에 필요한 설정이 빠져 있다

제목이 "API 호스팅을 위한" 가이드인데, **여러 클라이언트가 붙었을 때를 다루는
절이 없다.** FAQ에 그 설정이 셋 있고, 기본값이 전부 작다.

> - `OLLAMA_MAX_LOADED_MODELS`: Maximum concurrently loaded models
>   (default: 3 × GPU count, or 3 for CPU)
> - `OLLAMA_NUM_PARALLEL`: Parallel requests per model (**default: 1**)
> - `OLLAMA_MAX_QUEUE`: Maximum queued requests before rejection (default: 512)

가운데 줄이 제일 중요하다. **모델 하나당 동시 요청이 기본 1이다.** 두 사람이
같이 물으면 한 사람은 기다린다. 혼자 쓰는 로컬 환경에서는 보이지 않고, API로
열어서 두 번째 클라이언트가 붙는 순간 드러난다.

큐도 무한하지 않다. 512를 넘기면 **거절한다.** 가이드의 FAQ 표에 "404 또는 연결
실패 → `ollama serve` 실행 여부·방화벽 확인"이 있는데, 부하가 걸린 상태의 실패는
그 둘이 아니라 이쪽일 수 있다.

메모리 쪽 기본값도 알아둘 만하다.

> By default, models remain in memory for **5 minutes**.

5분이다. 그리고 `keep_alive`로 바꾼다.

> - **Duration strings**: "10m" or "24h"
> - **Seconds**: numeric values like 3600
> - **Negative numbers**: keep loaded indefinitely (e.g., -1)
> - **Zero**: unload immediately

호스팅에서 이 값이 양쪽으로 갈린다. **5분마다 모델이 내려가면 그 뒤 첫 요청이
로딩을 기다린다** — 7B 모델이면 수 초다. 반대로 `-1`로 두면 VRAM을 계속 물고
있어서 다른 모델이 올라갈 자리가 없다.

| 설정 | 기본값 | 호스팅에서 생각할 것 |
| --- | --- | --- |
| `OLLAMA_NUM_PARALLEL` | **1** | 동시 사용자 수만큼 올린다 |
| `OLLAMA_MAX_LOADED_MODELS` | 3 (CPU) / 3 × GPU 수 | 모델을 몇 종류 돌릴지 |
| `OLLAMA_MAX_QUEUE` | 512 | 넘으면 요청을 거절한다 |
| `OLLAMA_KEEP_ALIVE` | 5분 | 첫 요청 지연 ↔ VRAM 점유의 거래 |
| `OLLAMA_CONTEXT_LENGTH` | 4096 | 길게 주면 요청당 메모리가 늘어난다 |

마지막 두 줄이 서로 묶여 있다는 게 요점이다. `OLLAMA_NUM_PARALLEL`을 4로
올리면 그 모델의 컨텍스트가 **동시에 네 벌** 필요하다. 가이드의 8절이
`num_ctx`를 "성능 팁"으로 든 건 사실 이쪽 계산인데, 동시 요청 수가 없으니
계산이 성립하지 않는다.

## 인증이 없다는 건 문서에 적혀 있다

9절 보안 가이드다.

> - 로컬 전용이 기본. 원격 노출 시 **TLS 리버스 프록시 + Basic Auth** 고려
> - 방화벽로 11434 차단
> - 신뢰할 수 없는 GGUF/Modelfile은 검증 후 사용

첫 줄과 셋째 줄은 맞다. 둘째 줄이 **같은 가이드 5절과 충돌한다.** 5절은 이렇게
시킨다.

> ```
> # 모든 인터페이스 + 기본 포트
> OLLAMA_HOST=0.0.0.0 ollama serve
> ```

0.0.0.0으로 열라고 하고 네 절 뒤에 방화벽으로 막으라고 한다. 둘 다 하면 결국
막힌 것이고, 한쪽만 하면 **인증 없는 API가 네트워크에 열린다.**

인증이 없다는 건 추측이 아니다. OpenAI 호환 문서의 예제 코드에 **주석으로**
적혀 있다.

```python
from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:11434/v1/',
    api_key='ollama',  # required but ignored
)
```

> `api_key='ollama',  # required but ignored`

**클라이언트가 요구해서 넣는 값이고 서버는 무시한다.** 그래서 9절의 "TLS 리버스
프록시 + Basic Auth 고려"는 선택이 아니라 **열기로 했다면 필수**다. "고려"로
적어두면 안 하고 넘어가게 된다.

열렸을 때 할 수 있는 일의 범위도 짚어둘 만하다. 가이드 6절이 이미 그걸
보여준다 — `/api/pull`로 **모델을 내려받게** 할 수 있다. 추론만 공짜로 쓰는 게
아니라 **남의 디스크를 채울 수 있다**는 뜻이다.

| 그 포트에 닿는 사람이 할 수 있는 것 | 엔드포인트 |
| --- | --- |
| 추론 요청 | `/api/generate`, `/api/chat` |
| 올라간 모델 목록 보기 | `/api/tags`, `/api/ps` |
| 모델 내려받기 | `/api/pull` |
| OpenAI 클라이언트로 붙기 | `/v1/chat/completions` |

마지막 줄이 가이드에 아예 없다. 다음 절에서 본다.

## 어디에 왜 쓰나

### 한 대에 올려서 다른 기기가 쓰게 하기

개발 PC 한 대에 Ollama를 올리고 노트북·태블릿에서 쓰는 구성이다. 순서가 있다.

**1. 환경 변수는 override로 넣는다.**

```bash
sudo systemctl edit ollama.service
```

편집기가 열리면 `[Service]` 절만 적는다.

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_CONTEXT_LENGTH=8192"
Environment="OLLAMA_MODELS=/srv/ollama/models"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

`OLLAMA_MODELS`는 가이드 FAQ 표의 "모델 다운로드 경로 변경 → export
OLLAMA_MODELS=/path 후 재시작"에 해당한다. 그런데 **서비스로 돌릴 때 `export`는
의미가 없다** — 셸 환경 변수는 systemd가 띄우는 프로세스에 안 간다. 그래서
여기 같이 적는다.

**2. 들어간 값을 확인한다.** 믿지 말고 본다.

```bash
# override가 실제로 반영됐는지
systemctl show ollama.service --property=Environment

# 서버가 어느 주소에 떠 있는지
ss -tlnp | grep 11434
```

**3. 앞단에 인증을 세운다.** 9절이 "고려"라고 적은 그것이다.

```nginx
server {
    listen 443 ssl;
    server_name ollama.example.lan;

    ssl_certificate     /etc/ssl/certs/ollama.crt;
    ssl_certificate_key /etc/ssl/private/ollama.key;

    location / {
        auth_basic           "ollama";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://127.0.0.1:11434;

        # 스트리밍 응답이 버퍼에 갇히지 않게 한다.
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
```

`proxy_buffering off`가 중요하다. API의 `stream` 기본값이 `true`이므로
리버스 프록시가 버퍼링하면 **스트리밍이 통째로 모였다가 한 번에 온다.** 토큰이
하나씩 흐르는 걸 기대한 클라이언트가 멈춘 것처럼 보인다.

**4. 그러고 나서 바인드를 좁힌다.** 프록시가 같은 기계에 있으면 Ollama는
0.0.0.0일 필요가 없다.

```
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
```

프록시만 밖을 보고 Ollama는 루프백에 남는다. 가이드 9절의 "방화벽로 11434
차단"이 실제로는 이 모양이어야 한다 — 포트를 막는 게 아니라 **처음부터 그
포트를 밖에 내지 않는 것**이다.

### OpenAI 클라이언트로 붙이기

가이드에 없는 것 중 호스팅에서 가장 쓸모 있는 부분이다. 문서의 첫 문장이
그대로 설명한다.

> Connect OpenAI clients to Ollama. Ollama supports a subset of the OpenAI API.

```bash
curl -X POST http://localhost:11434/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{
  "model": "llama3:8b",
  "messages": [{ "role": "user", "content": "Say this is a test" }]
}'
```

지원 엔드포인트가 여섯 개다.

| 엔드포인트 | 쓰는 자리 |
| --- | --- |
| `/v1/chat/completions` | 채팅. 스트리밍·비전·툴 지원 |
| `/v1/completions` | 단문 생성 |
| `/v1/models` | 모델 목록 |
| `/v1/models/{model}` | 모델 하나의 정보 |
| `/v1/embeddings` | 임베딩 |
| `/v1/responses` | OpenAI Responses API (비상태) |

이게 값을 하는 이유는 **클라이언트 코드를 안 고쳐도 된다**는 것이다. 이미
OpenAI SDK로 짜둔 도구가 있으면 `base_url` 한 줄만 바꾼다.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://ollama.example.lan/v1/",
    api_key="unused",   # 서버는 무시한다. 인증은 앞단의 Basic Auth가 한다
)

resp = client.chat.completions.create(
    model="llama3:8b",
    messages=[{"role": "user", "content": "AI란?"}],
)
print(resp.choices[0].message.content)
```

가이드 7절은 `ollama` 파이썬 패키지를 안내한다. 그쪽도 공식이고 잘 동작하지만,
**Ollama 전용 코드가 된다.** `/v1`로 붙이면 나중에 다른 백엔드로 바꿀 때
`base_url`만 바뀐다. 로컬 모델로 시작해서 필요할 때 원격으로 옮길 생각이라면
이쪽이 싸다.

### 쓰지 말아야 할 자리

**`OLLAMA_HOST=0.0.0.0`을 켜두고 방화벽만 믿는 것.** 9절의 둘째 줄이다. 방화벽
규칙 하나가 풀리면 **인증 없는 API가 바로 드러난다.** 앞 절처럼 루프백에 두고
프록시를 세우면, 규칙이 풀려도 밖에서 닿는 건 인증이 걸린 프록시다.

**`OLLAMA_KEEP_ALIVE=-1`을 기본으로 두는 것.** 첫 요청 지연이 사라지는 대신
VRAM을 계속 물고 있는다. `OLLAMA_MAX_LOADED_MODELS`와 같이 보면, 모델 둘을
`-1`로 올려두면 세 번째 모델이 안 올라간다. 모델이 하나뿐인 서버에서만 쓸
설정이다.

**컨테이너에 올리면서 자원 한도를 안 주는 것.** Ollama를 Docker로 돌리는 건
흔한 구성인데, [자원 제한을 다룬 글](/posts/docker-resource-limits/)에서 본
대로 **기본 한도는 없다.** 모델 로딩은 수 GB를 한 번에 잡는 작업이라, 한도가
없으면 호스트의 다른 프로세스가 먼저 죽는다. `--memory`를 모델 크기 + 컨텍스트
여유만큼 잡고, 스왑은 `--memory-swap`을 같은 값으로 줘서 끈다.

**`ollama serve`를 터미널에서 띄워두고 서비스라고 부르는 것.** 가이드 3절의
Windows 항목이 `ollama serve` 실행을 안내하는데, 그건 **그 터미널이 닫히면
끝난다.** 상시 띄워야 한다면 systemd(리눅스)나 서비스 등록(윈도우)으로 가야
하고, 그때 환경 변수를 어디 적을지가 앞 절의 이야기가 된다.

## 정리

이 가이드의 설치와 CLI 절은 그대로 쓸 수 있다. `pull`·`ps`·`run`·`stop` 네
명령이 현행 레퍼런스와 같고, 기본 바인드 주소도 FAQ와 같다. 11절 구성이라
무엇을 찾아야 하는지가 한눈에 들어온다.

호스팅에 관한 세 절이 어긋난다. 8절의 **`--parameters` 플래그는 문서에
없고**, 컨텍스트 길이를 정하는 자리는 API의 `options`, Modelfile,
`OLLAMA_CONTEXT_LENGTH` 셋이다. 5절의 **systemd 샘플은 설치 스크립트가 만든
유닛 파일을 덮어쓰는 모양**이라 업그레이드에 지워진다 — FAQ가 안내하는 건
`systemctl edit`으로 override를 더하는 것이다. 9절의 **"방화벽로 11434 차단"은
같은 가이드 5절의 `0.0.0.0` 바인드와 충돌한다.**

그리고 제목이 약속한 것이 빠져 있다. **API로 호스팅할 때 가장 먼저 걸리는
설정은 `OLLAMA_NUM_PARALLEL`이고 기본값이 1이다.** 두 번째 클라이언트가 붙는
순간 한 사람은 기다린다. 혼자 쓰는 동안에는 보이지 않는 숫자여서, "종합
가이드"에 없으면 찾을 계기가 없다.

인증에 대해서는 문서가 더 솔직하다. OpenAI 호환 예제의 주석 한 줄이 전부다 —
`api_key='ollama',  # required but ignored`. 그래서 9절의 "고려"는 **열기로
했다면 필수**로 읽는 게 맞다.

---

### 참고

- [FAQ — Ollama 문서](https://docs.ollama.com/faq)
- [CLI 레퍼런스 — Ollama 문서](https://docs.ollama.com/cli)
- [Generate a response — Ollama API 문서](https://docs.ollama.com/api/generate)
- [Pull a model — Ollama API 문서](https://docs.ollama.com/api/pull)
- [OpenAI compatibility — Ollama 문서](https://docs.ollama.com/api/openai-compatibility)

이 글의 출발점이 된 자료는 [블로글러 — 로컬 환경에서 API 호스팅을 위한 Ollama 설정 종합 가이드](https://memoryhub.tistory.com/entry/%EB%A1%9C%EC%BB%AC-%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C-API-%ED%98%B8%EC%8A%A4%ED%8C%85%EC%9D%84-%EC%9C%84%ED%95%9C-Ollama-%EC%84%A4%EC%A0%95-%EC%A2%85%ED%95%A9-%EA%B0%80%EC%9D%B4%EB%93%9C)
(2025-03-02)이다. 11절의 절차를 따라가면서 CLI 플래그와 systemd 설정 방법,
API 필드 이름, 그리고 동시 요청 관련 환경 변수를 현행 Ollama 문서에 대조했다.
