---
pubDatetime: 2026-10-02T14:30:00+09:00
title: "GC를 길게 만든 건 캐시 크기가 아니라 포인터 개수다"
lang: ko
translationKey: discord-go-to-rust
featured: false
draft: false
tags:
  - Go
  - Rust
  - 최적화
  - 메모리
description: "Discord의 Go → Rust 전환 글은 진단이 정확하고 지금도 맞다. 그런데 돌려본 손잡이가 둘뿐이다. GOGC는 빈도만 바꾸고 캐시 크기는 적중률을 깎는다. 스캔 비용을 정하는 변수는 포인터 개수이고, Go는 포인터 없는 객체를 아예 스캔하지 않는다."
---

게임 개발과는 별개로 **디스코드를 자주 쓴다.** 그러다 "디스코드가 Go에서
Rust로 전환한다"는 이야기를 보고 스크랩해뒀다. 거기까지가 계기다.

원문은 2020년 Discord 엔지니어링 블로그의 글이고, 이 분야에서 가장 많이 인용되는
글 중 하나다. 제목이 "Why Discord is switching from Go to Rust"라서 제품 전체가
옮겨간다는 말처럼 읽히는데, **본문이 다루는 건 서비스 하나**다 — 읽음 표시를
관리하는 "Read States"다. 각주에까지 선을 그어뒀다.

> \[2\] To be clear, we don't think you should rewrite everything in rust just
> because.

내가 본 소문과 글이 하는 말의 거리가 거기 있다. 그래서 글을 끝까지 읽었다.

**진단은 정확하고, 지금도 맞다.** 2분마다 오는 스파이크의 정체를 찾아내고,
`GOGC`를 돌려도 안 바뀌는 이유를 알아내고, 스파이크가 큰 이유가 해제 대상이
많아서가 아니라 **살아 있는 LRU 캐시 전체를 훑어야 해서**라는 데까지 간다.
읽을 가치가 있다.

걸리는 건 결론이 아니라 **돌려본 손잡이의 수**다. 글은 두 개를 돌린다 —
`GOGC`와 캐시 크기. 앞의 것은 수집 **빈도**를 정하고, 뒤의 것은 적중률을
깎는다. 한 번의 수집이 얼마나 오래 걸릴지를 정하는 변수는 그 둘이 아니다.

```go
// If this is a noscan object, fast-track it to black
// instead of greying it.
if span.spanclass.noscan() {
	gcw.bytesMarked += uint64(span.elemsize)
	return
}
```

Go 런타임의 마킹 코드다. **포인터가 없는 객체는 스캔 큐에 들어가지도 않는다.**

## 목차

## 진단은 지금도 맞다 — 그리고 2분은 문서에 없다

먼저 맞는 쪽부터. 글은 스파이크의 주기를 런타임 소스에서 찾아낸다.

> After digging through the Go source code, we learned that Go will force a
> garbage collection run every **2 minutes at minimum**. In other words, if
> garbage collection has not run for 2 minutes, regardless of heap growth, go
> will still force a garbage collection.

이 장치는 지금도 있다. 현재 런타임의 `gcTrigger`에 주석과 함께 그대로 남아
있다.

```go
// gcTriggerTime indicates that a cycle should be started when
// it's been more than forcegcperiod nanoseconds since the
// previous GC cycle.
```

```go
case gcTriggerTime:
	if gcController.gcPercent.Load() < 0 {
		return false
	}
	lastgc := int64(atomic.Load64(&memstats.last_gc_nanotime))
	return lastgc != 0 && t.now-lastgc > forcegcperiod
```

여기서 두 가지가 보인다.

첫째, 주기를 정하는 건 `forcegcperiod`라는 **런타임 내부 변수**다. 공개 API도
아니고 환경 변수도 아니다. Go의 [GC 가이드](https://go.dev/doc/gc-guide)에는
이 강제 주기에 대한 언급이 없다. 글이 "2분"을 알아낸 방법이 소스를 읽은
것이었다는 게 그 자체로 정보다 — **문서화된 보장이 아니라 구현 세부사항**이고,
따라서 기대지 말아야 할 숫자다.

둘째, 첫 줄의 가드가 재미있다. `gcPercent`가 음수면 `false`를 돌려준다. 그리고
문서는 `GOGC`를 끄는 방법을 이렇게 적는다.

> Note that GOGC may also be used to turn off the GC entirely (provided the
> memory limit does not apply) by setting `GOGC=off` or calling
> `SetGCPercent(-1)`.

**`GOGC=off`면 2분 강제 수집도 같이 꺼진다.** 글이 시도한 "`GOGC`를 조절해
스파이크를 평탄하게 만들기"의 반대 극단이 저 가드 한 줄에 있다.

## GOGC가 안 통한 이유는 문서에 적혀 있다

글은 `GOGC`를 런타임에 바꾸는 엔드포인트까지 만들어놓고 아무 변화가 없었다고
적는다.

> Unfortunately, no matter how we configured the GC percent nothing changed. How
> could that be? It turns out, it was because we were not allocating memory
> quickly enough for it to force garbage collection to happen more often.

자기 추론이 맞다. 그리고 왜 맞는지는 `GOGC`의 정의에 그대로 있다.

> At a high level, GOGC determines the trade-off between GC CPU and memory. It
> works by **determining the target heap size after each GC cycle**, a target
> value for the total heap size in the next cycle.

목표 힙 크기를 정하는 공식까지 문서에 있다.

```
Target heap memory = Live heap + (Live heap + GC roots) * GOGC / 100
```

이 식에 **"한 번의 수집이 얼마나 걸리는지"는 들어 있지 않다.** `GOGC`는
**언제 다음 수집을 시작할지**만 정한다. 할당 속도가 느리면 목표 힙에 도달하는
데 오래 걸리고, 그래서 `GOGC`를 낮춰도 수집이 더 자주 오지 않는다. Read States는
LRU 캐시가 가득 찬 뒤로는 살아 있는 힙이 거의 고정이고 새 할당이 적다 —
`GOGC`가 건드릴 수 있는 변수가 애초에 움직이지 않는 상태였다.

| 손잡이 | 정하는 것 | Read States에서 |
| --- | --- | --- |
| `GOGC` | 다음 수집을 **언제** 시작할지 | 할당이 적어 움직이지 않음 |
| LRU 캐시 크기 | 캐시에 들어갈 **항목 수** | 줄이면 스캔은 짧아지고 적중률이 떨어짐 |
| **포인터 개수** | 한 번의 마킹이 **얼마나** 걸릴지 | 글이 돌리지 않은 손잡이 |

글은 두 번째 손잡이를 돌려서 거래를 했고, 그 거래를 정직하게 적어둔다.

> Unfortunately, the trade off of making the LRU cache smaller resulted in higher
> 99th latency times. This is because if the cache is smaller it's less likely
> for a user's Read State to be in the cache.

이게 막다른 길로 읽히는 이유는 캐시 크기가 두 비용을 동시에 쥐고 있기
때문이다 — 스캔 시간과 적중률. 그런데 **스캔 시간을 쥐고 있는 건 캐시 크기가
아니다.**

## Go는 포인터 없는 객체를 스캔하지 않는다

GC 가이드가 마킹 비용의 변수를 한 문장으로 말한다.

> Most of the CPU cost of the GC is marking and scanning... **more pointers means
> more GC work, because at minimum the GC needs to visit all the pointers in the
> program.**

항목 수가 아니라 포인터 수다. 그리고 가이드는 그 결론을 실무 조언으로 한 번 더
적는다.

> **Pointer-free values are segregated from other values.** As a result, it may
> be advantageous to **eliminate pointers from data structures that do not
> strictly need them**, as this reduces the cache pressure the GC exerts on the
> program.

가이드는 "캐시 압력이 줄어든다"까지만 말한다. 런타임 소스는 더 센 것을 말한다.
도입부에 붙인 그 코드다.

```go
// If this is a noscan object, fast-track it to black
// instead of greying it.
if span.spanclass.noscan() {
	gcw.bytesMarked += uint64(span.elemsize)
	return
}
```

`noscan` 스팬의 객체는 **검정으로 바로 넘어가고 끝난다.** 회색으로 칠해 작업
큐에 넣는 단계가 없다. 포인터가 없으면 들여다볼 게 없으니 들여다보지 않는다.

이제 글의 문장을 다시 읽으면 데이터 구조가 역산된다.

> the spikes were huge not because of a massive amount of ready-to-free memory,
> but because **the garbage collector needed to scan the entire LRU cache** in
> order to determine if the memory was truly free from references.

**스캔해야 했다면 포인터가 있었다는 뜻이다.** 글은 자기 자료구조를 공개하지
않았지만, 이 한 문장이 그걸 말해준다. 포인터가 없는 캐시라면 저 문장이 성립하지
않는다.

어떤 모양이 스캔을 부르나. Go에서 흔한 LRU 캐시는 이렇게 생긴다.

```go
// 스캔해야 하는 모양. 엔트리마다 포인터가 셋 있다.
type entry struct {
	key   string      // 포인터 하나 (문자열 데이터)
	value *ReadState  // 포인터 하나
	elem  *list.Element // 포인터 하나 (LRU 연결 리스트)
}

type ReadState struct {
	UserID    string // 포인터
	ChannelID string // 포인터
	Mentions  int
	LastRead  int64
}

type Cache struct {
	items map[string]*entry // 맵 자체도 포인터로 가득하다
	order *list.List        // 이중 연결 리스트: 노드마다 포인터 둘
}
```

엔트리가 천만 개면 마킹이 따라가야 하는 포인터가 수천만 개다. 그리고 `string`과
`*ReadState`와 `list.Element`가 모두 힙에 흩어져 있으니, 따라갈 때마다 캐시
미스 후보다. 글이 본 "수 분마다 오는 긴 스파이크"의 모양이 정확히 이것이다.

같은 캐시를 포인터 없이 쓰면 마킹이 할 일이 사라진다.

```go
// 스캔하지 않는 모양. 포인터가 하나도 없다.
type ReadState struct {
	Mentions int32
	LastRead int64
	// 문자열 ID 대신 해시한 정수를 쓴다.
}

type Cache struct {
	// 키와 값 모두 포인터 없는 값 타입이다.
	items map[uint64]ReadState

	// LRU 순서도 연결 리스트가 아니라 배열 인덱스로 표현한다.
	slots []slot
	head  int32
	tail  int32
}

type slot struct {
	key  uint64
	prev int32 // 포인터가 아니라 slots의 인덱스
	next int32
}
```

차이는 **엔트리 수가 아니라 따라갈 포인터 수**다. `slots`는 하나의 큰
`noscan` 할당이고, `map[uint64]ReadState`의 버킷도 포인터를 담지 않는다. 캐시를
800만 개로 키워도 마킹 비용은 그대로다.

이게 Go에서 이 문제를 고치는 표준적인 방법이다. 쓰기 불편하다 —
`string`을 `uint64`로 바꾸면 해시 충돌을 다뤄야 하고, 포인터를 인덱스로 바꾸면
타입 안전성이 사라진다. 그래서 "그 불편함을 감수하느니 Rust로 다시 쓴다"는
선택은 **합리적일 수 있다.** 다만 그건 "Go로는 안 된다"와 다른 문장이고, 글은
그 구분을 하지 않는다.

[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 같은 모양을 봤다.
거기서도 답은 GC를 빠르게 만드는 게 아니라 **GC에게 할 일을 주지 않는 것**이다.
Unity에서는 객체를 재사용해서 할당을 없애고, Go에서는 포인터를 없애서 스캔을
없앤다. 수집기를 설득하는 방법은 없고, 보여줄 것을 줄이는 방법만 있다.

## 6년 뒤에 바뀐 것과 안 바뀐 것

각주 1이 이 글의 가장 중요한 한 줄이다.

> \[1\] Go version 1.9.2. Edit: Graphs are from 1.9.2. We tried versions 1.8,
> 1.9, and 1.10 without any improvement. The initial port from Go to Rust was
> completed in May 2019.

**Go 1.9.2는 2017년 10월판이다.** 그 뒤에 런타임에서 이 문제와 닿는 변화가 두 번
있었다.

**Go 1.14 — 비동기 선점.** 이 글이 올라간 것이 2020년 2월 4일이고, Go 1.14가
나온 것이 **2020년 2월 25일**이다. 3주 차이다. 릴리스 노트의 문장이 지연
스파이크를 직접 언급한다.

> Goroutines are now asynchronously preemptible. As a result, **loops without
> function calls no longer potentially deadlock the scheduler or significantly
> delay garbage collection.**

1.9.2에서는 함수 호출이 없는 루프가 선점되지 않았다. GC가 stop-the-world를
요청해도 그 고루틴이 멈추기를 기다려야 했다. 이게 마킹 비용을 줄이지는 않지만,
**측정된 스파이크 중 일부는 마킹이 아니라 선점 대기였을 수 있다.** 1.14 이후에
같은 코드를 다시 재면 그래프가 달라질 가능성이 있다. 글의 시점에는 알 수 없던
변화다.

**Go 1.19 — `GOMEMLIMIT`.** "GOGC를 어떻게 설정해도 안 바뀐다"에 대한 답으로
흔히 언급되는 손잡이다.

> That's why in the 1.19 release, Go added support for setting a runtime memory
> limit.

그런데 **이건 Read States 문제를 더 나쁘게 만든다.** `GOMEMLIMIT`은 메모리
상한에 가까워지면 **수집을 더 자주** 돌린다. 마킹 한 번의 비용이 긴 게 문제인
상황에서 빈도를 올리는 건 반대 방향이다. 가이드가 그 극단을 이름까지 붙여
경고한다.

> This situation, where the program fails to make reasonable progress due to
> constant GC cycles, is called **thrashing**. It's particularly dangerous
> because it effectively stalls the program.

그리고 상한 자체가 약속이 아니다.

> For this reason, the memory limit is defined to be **soft**. The Go runtime
> makes no guarantees that it will maintain this memory limit under all
> circumstances; it only promises some reasonable amount of effort.

**안 바뀐 것**이 더 중요하다. Go의 GC는 여전히 비이동식이다.

> We call a GC that moves objects in this way a **moving** GC; Go has a
> **non-moving** GC.

가이드가 세대 구분을 쓴다는 설명도 없고, 제시하는 비용 모델은 "more pointers
means more GC work"처럼 힙 전체를 대상으로 한다. 그래서 **마킹 비용이 살아 있는
포인터 그래프에 비례한다는 성질은 2017년과 지금이 같다.** 오래 사는 큰 캐시를 포인터로 엮어 들고 있으면
2026년의 Go에서도 같은 그래프가 나온다. 바뀐 건 손잡이의 개수이고, 바뀌지 않은
건 비용 구조다.

| | 2017 (글의 시점) | 지금 |
| --- | --- | --- |
| 2분 강제 수집 | 있음 (`forcegcperiod`) | 그대로 |
| `GOGC`가 정하는 것 | 수집 시작 시점 | 그대로 |
| 비동기 선점 | 없음 | 1.14부터 있음 |
| 메모리 상한 | 없음 | 1.19부터 `GOMEMLIMIT` (이 문제에는 역효과) |
| 세대·이동 수집 | 없음 | 그대로 없음 |
| 포인터 없는 객체 | 스캔 안 함 | 그대로 |

## Rust 쪽에서 글이 생략한 것

Rust 쪽 서술은 짧고, 짧은 만큼 빠진 게 있다.

글이 인용한 rust-lang.org 문장은 지금도 그 사이트에 그대로 있다.

> Rust is blazingly fast and memory-efficient: **with no runtime or garbage
> collector**, it can power performance-critical services, run on embedded
> devices, and easily integrate with other languages.

그런데 같은 글이 몇 단락 뒤에 이렇게 적는다.

> Recently, tokio (**the async runtime we use**) released version 0.2. We
> upgraded and it gave us CPU benefits for free.

**"런타임이 없다"와 "우리가 쓰는 async 런타임"이 한 글에 같이 있다.** 모순이
아니라 같은 단어가 두 뜻으로 쓰인 것이다 — 앞의 것은 언어가 깔아주는 GC·스케줄러
같은 상주 기계를 말하고, 뒤의 것은 직접 고르고 버전을 올리는 라이브러리를
말한다. 구분이 중요한 건 **지연 특성을 결정하는 쪽이 뒤의 것**이기 때문이다.
글 스스로가 그 증거를 댄다. 코드를 바꾸지 않고 tokio 버전만 올렸는데 CPU가
내려갔다.

최적화 목록의 첫 항목도 설명이 한 겹 모자라다.

> 1. Changing to a **BTreeMap instead of a HashMap** in the LRU cache to optimize
>    memory usage.

메모리가 줄어드는 이유는 Rust 표준 라이브러리 문서에 있다. `BTreeMap`은 노드
하나에 여러 원소를 연속 배열로 담는다.

> A B-Tree instead makes each node contain B-1 to 2B-1 elements in a contiguous
> array. By doing this, we **reduce the number of allocations by a factor of B**,
> and improve cache efficiency in searches.

그런데 같은 문서가 대가도 적어둔다.

> However, this does mean that searches will have to do **more comparisons on
> average**. ... searching for a random element is expected to take
> **B \* log(n) comparisons**, which is generally worse than a BST.

**메모리를 줄인 게 아니라 비교 횟수와 거래한 것이다.** 조회가 O(1)에서
O(log n)으로 바뀐다. Read States처럼 초당 수십만 번 조회하는 캐시에서 이건
공짜가 아니다. 글이 "every single performance metric"에서 이겼다고 적었으니
실제로는 남는 거래였겠지만, 왜 남는지는 적혀 있지 않다.

덤으로, `HashMap`을 떠나면 따라오는 게 하나 더 있다. Rust의 기본 해셔는 보안
우선이다.

> The default hashing algorithm is currently **SipHash 1-3**... While its
> performance is very competitive for medium sized keys, **other hashing
> algorithms will outperform it for small keys such as integers** as well as
> large keys such as long strings, though those algorithms will typically *not*
> protect against attacks such as HashDoS.

내부 서비스의 정수 키 캐시라면 `HashDoS` 방어가 필요 없고, 해셔만 바꿔도
`HashMap` 쪽에서 상당히 벌 수 있다. `BTreeMap`으로 간 결정이 **해셔 교체와
비교되었는지는 글에 없다.**

마지막으로 시점이다. 글은 nightly로 갔다고 적는다.

> As an engineering team, we decided it was worth using nightly Rust and we
> committed to running on nightly until async was fully supported on stable.

각주 1에 따르면 포팅은 **2019년 5월**에 끝났다. async/await가 stable에 들어간
것은 **Rust 1.39.0, 2019년 11월 7일**이다. 반 년 동안 nightly로 프로덕션
서비스를 돌렸다는 뜻이고, 글이 "the bet paid off"라고 쓴 건 과장이 아니다. 지금
같은 선택을 하는 사람에게는 그 전제가 없다 — **async는 2019년 11월에 stable이
되었다.**

## 어디에 왜 쓰나

### 이 문제를 Go에서 고친다면

순서가 있다. 글이 돌린 순서와 다르다.

| 순서 | 할 일 | 왜 |
| --- | --- | --- |
| 1 | 마킹이 실제로 범인인지 확인 | 스파이크가 마킹인지 선점 대기인지 구분 |
| 2 | 캐시에서 포인터를 뺀다 | 마킹 비용을 정하는 변수 |
| 3 | 그래도 모자라면 캐시를 쪼갠다 | 적중률 손해를 감수하는 마지막 수단 |
| 4 | `GOGC`·`GOMEMLIMIT` | 빈도 손잡이. 이 문제에는 끝 순위 |

1번부터 보자. 추측하지 않고 재는 방법이 있다.

```bash
# 수집 한 번마다 한 줄. wall-clock과 CPU 시간이 단계별로 나온다.
GODEBUG=gctrace=1 ./read-states 2>&1 | grep '^gc '
```

CPU 프로파일 쪽은 가이드가 읽는 법을 적어둔다.

> A large amount of cumulative time spent here (>5%) indicates that the
> application is likely out-pacing the GC with respect to how fast it's
> allocating. It indicates a particularly high degree of impact from the GC, and
> also represents time the application spend marking and scanning.

2번이 본론이다. 포인터를 빼는 작업은 세 군데에서 일어난다.

```go
package readstates

// 1) 키: 문자열을 해시한 정수로 바꾼다.
//    충돌을 다뤄야 하므로 공짜가 아니다. 슬롯에 원본 키 해시를 들고 비교한다.
type Key uint64

// 2) 값: 포인터를 들지 않는 값 타입으로 만든다.
//    string 필드가 하나만 남아도 이 구조체 전체가 scan 대상이 된다.
type ReadState struct {
	Mentions    int32
	LastReadID  int64
	LastWriteNs int64
}

// 3) LRU 순서: 연결 리스트를 인덱스 배열로 바꾼다.
//    container/list는 노드마다 Element 포인터를 둘 들고 있다.
type slot struct {
	key   Key
	state ReadState
	prev  int32
	next  int32
}

type Cache struct {
	index map[Key]int32 // 값이 포인터가 아니라 slots의 인덱스다
	slots []slot        // 하나의 큰 noscan 할당
	head  int32
	tail  int32
	free  int32
}
```

`slots`를 한 번에 잡아두면 엔트리를 넣고 빼는 동안 **힙 할당이 일어나지 않고**,
전체가 포인터 없는 한 덩어리라 마킹이 지나간다. `map[Key]int32`도 키와 값이 모두
포인터 없는 값이라 버킷이 `noscan`이다.

측정 없이 이걸 먼저 하면 안 된다. 코드가 확실히 더 읽기 어려워지고, 그 대가로
사는 것이 **마킹 시간뿐**이기 때문이다. 1번에서 마킹이 범인이 아니라고 나오면
이 작업은 손해다.

### 같은 결론에 또 도달한 2023년

이 글이 외로운 사례가 아니라는 게 3년 뒤에 드러난다. Discord의
[How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)(2023-03-06)는
메시지 저장소를 Cassandra에서 ScyllaDB로 옮긴 이야기인데, 옮긴 이유가 같다.

> **GC pauses would cause significant latency spikes**

이번엔 Go가 아니라 JVM이다. 그리고 그 앞에 세운 데이터 서비스를 **또 Rust로**
썼다.

> it gave us fast C/C++ speeds without having to sacrifice safety

그 서비스가 하는 일 중 하나가 요청 합치기다.

> If multiple users are requesting the same row at the same time, we'll only
> query the database once... This routing further helps reduce the load on our
> database.

2020년 글만 읽으면 "Go의 GC가 문제였다"로 읽힌다. 두 글을 겹쳐 읽으면 다른
문장이 나온다 — **Discord의 지연 요구사항이 추적 수집기의 비용 구조와 안
맞는다.** 런타임이 Go든 JVM이든 같은 그래프가 나왔고, 두 번 다 같은 답을
골랐다. 어느 언어가 나쁘다는 이야기가 아니라, **꼬리 지연을 제품 요구사항으로
들고 있는 서비스**에서 수집기가 어떤 자리를 차지하는지에 관한 이야기다.

### 다시 쓰기를 고르지 말아야 할 때

도입부에 옮긴 각주를 다시 가져온다. 이 글에서 가장 자주 무시되는 문장이다.

> \[2\] To be clear, we don't think you should rewrite everything in rust just
> because.

본문에도 전제가 적혀 있다. 이 서비스를 고른 이유가 성능이 전부가 아니다.

> we collectively decided we wanted to create the frameworks and libraries needed
> to build new services fully in Rust. **This service was a great candidate to
> port to Rust since it was small and self-contained**, but we also hoped that
> Rust would fix these latency spikes.

순서를 보라. **Rust로 서비스를 짜는 기반을 만들기로 먼저 정했고**, 작고 독립적인
서비스를 후보로 골랐고, 지연 문제도 같이 풀리길 바랐다. 다시 쓰기의 근거가
성능 하나였던 게 아니다. 같은 선택을 복사하려면 그 전제들도 같이 있어야 한다.

- **작고 독립적인가.** 경계가 모호한 서비스는 번역이 아니라 재설계가 된다.
- **그 언어로 계속 갈 건가.** 서비스 하나만 Rust면 그 하나를 유지할 사람이
  계속 필요하다.
- **측정이 있나.** 글에는 포팅 전 Go 버전의 그래프가 있다. 비교 대상 없이
  시작하면 끝난 뒤에 무엇이 좋아졌는지 말할 수 없다.
- **고칠 수 있는 걸 다 고쳐봤나.** 포인터를 빼는 작업은 하루이고, 다시 쓰기는
  하루가 아니다.

마지막 항목이 이 글을 읽는 가장 실용적인 방법이다. 글이 돌린 손잡이는 둘이고,
돌리지 않은 손잡이가 하나 남아 있었다.

## 정리

Discord의 진단은 정확하다. 2분 주기를 소스에서 찾아낸 것도, `GOGC`가 안 통하는
이유를 할당 속도에서 찾은 것도, 스파이크의 크기가 **해제할 메모리 양이 아니라
훑어야 할 캐시 크기**에서 온다고 결론 낸 것도 전부 맞다. 그리고 그 세 가지는
2026년의 Go에서도 그대로 맞다.

빠진 건 그다음 한 칸이다. 훑는 비용을 정하는 변수는 **항목 수가 아니라 포인터
수**다. Go의 GC 가이드가 "more pointers means more GC work"라고 적고, 런타임
소스는 포인터 없는 객체를 **스캔 큐에 넣지 않고 검정으로 바로 넘긴다.** 캐시를
작게 만들면 스캔 시간과 적중률을 동시에 깎지만, 포인터를 빼면 스캔 시간만
깎인다.

그게 Rust 선택을 틀리게 만들지는 않는다. 글 자신이 Rust 기반을 만들기로 먼저
정했다고 적었고, 각주에 "그냥 다 Rust로 다시 쓰라는 말이 아니다"라고 적었다.
3년 뒤 JVM에서 같은 그래프를 보고 또 Rust를 고른 것도 일관된다.

다만 이 글을 "Go의 GC는 이 문제를 못 푼다"로 인용하는 건 글이 한 말보다 한 칸
더 나간 것이다. **못 푸는 게 아니라, 푸는 방법이 불편하다.** 그 불편함과 다시
쓰기의 비용을 비교한 기록은 이 글에 없다.

---

### 참고

- [Why Discord is switching from Go to Rust — Discord Blog](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
- [A Guide to the Go Garbage Collector — go.dev](https://go.dev/doc/gc-guide)
- [Go 1.14 릴리스 노트 — go.dev](https://go.dev/doc/go1.14)
- [runtime/mgcmark.go — golang/go](https://github.com/golang/go/blob/master/src/runtime/mgcmark.go)
- [BTreeMap — Rust 표준 라이브러리](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)
- [HashMap — Rust 표준 라이브러리](https://doc.rust-lang.org/std/collections/struct.HashMap.html)
- [How Discord Stores Trillions of Messages — Discord Blog](https://discord.com/blog/how-discord-stores-trillions-of-messages)

이 글의 출발점이 된 자료는 [Jesse Howarth — Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
(2020-02-04)이다. 글의 진단 과정을 그대로 따라가면서, `GOGC`와 강제 수집 주기,
마킹 비용의 변수를 현행 Go GC 가이드와 런타임 소스에 대조하고, Rust 쪽 선택을
표준 라이브러리 문서와 맞춰봤다.
