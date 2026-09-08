---
pubDatetime: 2026-09-08T17:30:00+09:00
title: "Ollama 응답이 길었던 건 답변이 길어서가 아니다"
lang: ko
translationKey: ollama-api-basics
featured: false
draft: false
tags:
  - Ollama
  - LLM
  - API
  - 온디바이스 AI
  - 로컬 LLM
  - AI
description: "Ollama API를 훑은 메모를 공식 문서와 대조했다. 답변이 너무 길다던 것의 원인은 stream 하나인데, 원문은 세 가지를 한꺼번에 바꿔서 원인이 셋으로 나뉘어 있었다."
---

게임 개발과는 별개로, **개발 도구 쪽에 로컬 LLM을 붙여보려던 중**에 Ollama의
REST API를 `curl`로 훑어본 [메모](https://ride-wind.tistory.com/122)를
스크랩해뒀었다. 엔드포인트를 하나씩 때려보는 짧은 기록인데, 중간에 이런 대목이
있다.

> 답변이 너무 긺
>
> 무슨 문제가 있나?

그리고 다음 줄에서 **`stream` false 에 json 지정해야 짧아짐**이라고 결론을
낸다. 이 진단이 이 글의 출발점이다. **원인은 셋 중 하나뿐인데 셋으로 나뉘어
있고**, 그 하나도 "답변이 길다"는 문제가 아니었다.

## 목차

## "답변이 너무 긺"의 정체

원문의 첫 요청이다.

```bash
curl http://localhost:11434/api/generate -d '{"model": "llama3.1","prompt": "Why is the sky blue?"}'
```

여기서 지정하지 않은 값이 하나 있다. `stream`이다. 문서의 기본값은 **`true`**고,
그러면 응답이 이렇게 온다.

> a series of responses

**한 덩어리가 아니라 여러 개다.** 토큰이 생길 때마다 JSON 객체가 하나씩
날아온다. 각 객체에 `response`와 `done` 필드가 있고, 마지막 객체만
`"done": true`와 함께 `total_duration`, `load_duration`, `prompt_eval_count`,
`eval_count` 같은 통계를 달고 온다.

`curl`은 그걸 그대로 터미널에 쏟는다. 그래서 화면이 JSON 벽으로 채워진다.
**답변이 길었던 게 아니라 출력 형식이 그랬던 것이다.** 같은 문장을 받아도
토큰 수만큼 줄이 늘어난다.

`stream`을 끄면 문서의 표현대로 이렇게 된다.

> the response will be returned as a single response object, rather than a
> stream of objects

## 세 가지가 동시에 바뀌었다

원문이 "짧아졌다"며 제시한 두 번째 요청이다.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "What color is the sky at different times of the day? Respond using JSON",
  "format": "json",
  "stream": false
}'
```

첫 요청과 비교하면 바뀐 게 하나가 아니다.

| 항목 | 첫 요청 | 둘째 요청 | 화면 길이와의 관계 |
| --- | --- | --- | --- |
| `prompt` | Why is the sky blue? | What color is the sky…​ Respond using JSON | 내용이 다르다 |
| `format` | 없음 | `"json"` | 무관 |
| `stream` | 없음(=`true`) | `false` | **이것 하나가 원인** |

**화면을 줄인 건 `stream: false`뿐이다.** `format: "json"`은 출력을 JSON으로
강제하는 기능이고 분량과는 상관이 없다. 프롬프트는 아예 다른 질문이 됐다.

그리고 이 두 번째 요청은 **원문이 고쳐 만든 게 아니다.** 프롬프트를 포함해
공식 문서의 JSON 모드 예제 그대로다. 문서에서 다른 예제를 가져다 붙인 뒤
"짧아졌다"고 관찰한 셈이라, 무엇이 무엇을 줄였는지가 섞였다.

한 가지만 바꿔보면 분명해진다.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

프롬프트도 그대로, `format`도 없이 `stream`만 껐다. 이걸로 JSON 벽은 사라진다.
답변 자체의 길이는 그대로다.

## 길이를 줄이는 건 따로 있다

정말로 **답변을 짧게** 만들고 싶었다면 손댈 곳은 `options`다. 문서가 추가 모델
파라미터를 여기에 받고, 그중 `num_predict`가 생성 토큰 수를 제한한다.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Why is the sky blue?",
  "stream": false,
  "options": { "num_predict": 100 }
}'
```

`stream`은 **전달 방식**, `num_predict`는 **생성량**이다. 원문이 겪은 건 앞쪽
문제인데 "답변이 너무 길다"고 표현하면서 뒤쪽 문제처럼 읽히게 됐다. 둘을 갈라
두면 다음에 진짜로 답변이 길 때 어디를 볼지가 분명해진다.

## `format: "json"`은 프롬프트와 한 쌍이다

원문 예제의 프롬프트 끝에 `Respond using JSON`이 붙어 있다. 문서 예제를 그대로
가져왔으니 당연한데, **왜 붙어 있는지**가 문서에 적혀 있다.

> When `format` is set to `json`, the output will always be a well-formed JSON
> object. **It's important to also instruct the model to respond in JSON.**

`format: "json"`은 출력이 유효한 JSON이 되도록 강제할 뿐, 모델에게 **무엇을**
JSON으로 담을지는 알려주지 않는다. 프롬프트에 그 지시가 없으면 모델이 형식만
맞춘 채 헤맬 수 있다.

**둘은 한 쌍이다.** `format`은 문법을, 프롬프트는 내용을 맡는다. 원문은 이
조합을 결과로만 보고 "json 지정"이라고 요약했는데, 그러면 프롬프트 쪽 절반이
사라진다.

## 2024년 12월에 생긴 것: 구조화 출력

원문은 2024년 9월 글이다. 그해 12월 6일에 `format`이 확장됐다.

> Ollama now supports structured outputs making it possible to constrain a
> model's output to a specific format defined by a **JSON schema**.

`"json"`이라는 문자열 대신 **스키마 객체**를 넣을 수 있다.

```bash
curl -X POST http://localhost:11434/api/chat -H "Content-Type: application/json" -d '{
  "model": "llama3.1",
  "messages": [{"role": "user", "content": "Tell me about Canada."}],
  "stream": false,
  "format": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "capital": {"type": "string"},
      "languages": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["name", "capital", "languages"]
  }
}'
```

`"json"`은 "JSON이기만 하면 된다"이고, 스키마는 **필드 이름과 타입까지 정한다.**
파싱하는 쪽 코드를 생각하면 차이가 크다. 앞의 것은 받아서 열어봐야 알고,
뒤의 것은 미리 정한 모양으로 온다.

## `/api/show`의 파라미터 이름

원문의 `/api/show` 호출이다.

```bash
curl http://localhost:11434/api/show -d '{"name": "llama3.1"}'
```

현재 문서의 파라미터 이름은 **`model`**이다. `name`은 예전 표기다. 다른
엔드포인트들이 전부 `model`을 쓰니 그쪽으로 통일된 것으로 보인다.

메서드도 정리해두면 헷갈리지 않는다. 원문이 `/api/ps`와 `/api/tags`를 주소만
적어둬서 브라우저로 열어본 것으로 보이는데, 실제로 둘은 GET이라 그게 맞다.

| 엔드포인트 | 메서드 | 용도 |
| --- | --- | --- |
| `/api/ps` | GET | 메모리에 올라와 있는 모델 |
| `/api/tags` | GET | 로컬에 받아둔 모델 |
| `/api/show` | POST | 모델 상세(`model` 필드) |
| `/api/generate` | POST | 단발 생성 |
| `/api/chat` | POST | 대화(`messages` 배열) |
| `/api/embed` | POST | 임베딩 |
| `/api/version` | GET | 버전 |

## 열기 전에 알아둘 것

원문의 주소가 전부 `localhost`인데, 그게 기본값이라 그렇다.

> Ollama binds 127.0.0.1 port 11434 by default.

**로컬에서만 접근된다.** 다른 기기에서 쓰려면 `OLLAMA_HOST`로 바인드 주소를
바꿔야 한다.

> Change the bind address with the `OLLAMA_HOST` environment variable.

여기서 한 가지 짚어둘 게 있다. **FAQ는 바인드 주소를 바꾸는 방법만 알려주고
인증에 대해서는 말하지 않는다.** 내가 문서에서 찾은 범위에서는 API 키나 인증
설정에 해당하는 항목이 없었다. 즉 주소를 열면 **그 포트에 닿을 수 있는
누구나** 그 모델을 쓸 수 있다는 뜻으로 읽어야 한다.

CORS 쪽 기본값은 문서에 있다.

> Ollama allows cross-origin requests from `127.0.0.1` and `0.0.0.0` by default.
> Additional origins can be configured with `OLLAMA_ORIGINS`.

로컬에서 혼자 쓸 때는 신경 쓸 일이 없지만, 개발 PC의 Ollama를 다른 기기에서
불러 쓰려는 순간부터는 **앞단에 뭘 둘지를 같이 정해야 한다.**

## 정리

- **`stream`의 기본값은 `true`**이고, 그러면 토큰마다 JSON 객체가 하나씩
  온다. 원문이 본 "긴 답변"은 **답변이 아니라 출력 형식**이었다.
- 원문의 두 요청 사이에서 **프롬프트·`format`·`stream` 세 가지가 동시에
  바뀌었다.** 화면을 줄인 건 `stream: false` 하나다.
- 답변 자체를 짧게 하려면 **`options.num_predict`**다. 전달 방식과 생성량은
  다른 문제다.
- **`format: "json"`은 프롬프트의 지시와 한 쌍이다.** 문서가 "It's important to
  also instruct the model to respond in JSON"이라고 적는다.
- 2024년 12월부터 **`format`에 JSON 스키마 객체**를 넣을 수 있다. 필드 이름과
  타입까지 고정된다.
- `/api/show`의 파라미터는 현재 **`model`**이다. 원문의 `name`은 예전 표기다.
- 기본 바인드는 **`127.0.0.1:11434`**이고, `OLLAMA_HOST`로 바꾼다. **FAQ에
  인증에 대한 언급은 없다.**

`curl`로 엔드포인트를 하나씩 때려보는 방식은 좋다. 다만 이번 건은 **한 번에
하나씩 바꾸지 않은 것**이 진단을 흐렸다. 세 개를 같이 바꾸고 결과가 좋아지면,
셋 다 효과가 있었던 것처럼 남는다. 원인을 좁히는 데는 문서를 읽는 것보다
**변수를 하나로 줄이는 쪽**이 빨랐을 자리다.

도구로 붙일 생각이었으니 이 구분이 그냥 넘길 일이 아니었다. `curl`에서는
`stream`이 화면이 지저분한지의 문제지만, 코드에서 부르는 순간
**응답을 한 번에 파싱할지 줄 단위로 읽을지를 가르는 결정**이 된다. 기본값이
`true`라는 것부터가 그 선택을 이미 하고 있다.

## 참고

- [API — ollama/ollama](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Structured outputs — Ollama](https://ollama.com/blog/structured-outputs)
- [FAQ — Ollama](https://docs.ollama.com/faq)
- 원문: [ollama api 사용해 보기](https://ride-wind.tistory.com/122)
