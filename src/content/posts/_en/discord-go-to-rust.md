---
pubDatetime: 2026-10-02T14:30:00+09:00
title: "What Made GC Long Wasn't the Cache Size, It Was the Pointer Count"
lang: en
translationKey: discord-go-to-rust
featured: false
draft: false
tags:
  - Go
  - Rust
  - Optimization
  - Memory
description: "Discord's Go-to-Rust post diagnoses the problem accurately, and the diagnosis still holds. But only two knobs got turned. GOGC sets frequency and cache size cuts the hit rate. The variable that sets scan cost is the pointer count, and Go doesn't scan pointer-free objects at all."
---

Separately from game development, **I use Discord a lot.** So when I saw talk of
"Discord switching from Go to Rust" I clipped it. That's as far as the motivation
goes.

The original is a 2020 post on Discord's engineering blog, and one of the most
cited pieces in this area. The title, "Why Discord is switching from Go to Rust,"
reads as if the whole product were moving, but **what the body covers is one
service** — "Read States," which tracks what you've read. The post draws that
line in a footnote.

> \[2\] To be clear, we don't think you should rewrite everything in rust just
> because.

The distance between the rumor I saw and what the post says is right there. So I
read it to the end.

**The diagnosis is accurate, and it still holds.** It tracks down what the
every-two-minutes spikes are, works out why turning `GOGC` changes nothing, and
gets as far as the spikes being large not because there's much to free but
because **the entire live LRU cache has to be walked.** Worth reading.

What snags isn't the conclusion, it's **how many knobs got turned.** The post
turns two — `GOGC` and the cache size. The first sets collection **frequency**;
the second cuts the hit rate. The variable that sets how long a single collection
takes is neither of them.

```go
// If this is a noscan object, fast-track it to black
// instead of greying it.
if span.spanclass.noscan() {
	gcw.bytesMarked += uint64(span.elemsize)
	return
}
```

That's the Go runtime's marking code. **An object with no pointers never even
enters the scan queue.**

## Table of Contents

## The Diagnosis Still Holds — and 2 Minutes Isn't in the Docs

What's right first. The post finds the spikes' period by reading the runtime
source.

> After digging through the Go source code, we learned that Go will force a
> garbage collection run every **2 minutes at minimum**. In other words, if
> garbage collection has not run for 2 minutes, regardless of heap growth, go
> will still force a garbage collection.

That mechanism is still there. It sits in the current runtime's `gcTrigger`, with
its comment intact.

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

Two things show up here.

First, what sets the period is `forcegcperiod`, **a variable internal to the
runtime.** Not a public API, not an environment variable. Go's
[GC guide](https://go.dev/doc/gc-guide) doesn't mention this forced period at all.
That the post found "2 minutes" by reading source is itself information — it's
**an implementation detail, not a documented guarantee**, and therefore a number
not to lean on.

Second, the guard on the first line is interesting. If `gcPercent` is negative it
returns `false`. And the docs describe how to turn `GOGC` off.

> Note that GOGC may also be used to turn off the GC entirely (provided the
> memory limit does not apply) by setting `GOGC=off` or calling
> `SetGCPercent(-1)`.

**With `GOGC=off`, the 2-minute forced collection goes off too.** The opposite
extreme of what the post tried — tuning `GOGC` to flatten the spikes — lives in
that one guard line.

## Why GOGC Didn't Work Is Written in the Docs

The post built an endpoint to change `GOGC` at runtime and reports that nothing
changed.

> Unfortunately, no matter how we configured the GC percent nothing changed. How
> could that be? It turns out, it was because we were not allocating memory
> quickly enough for it to force garbage collection to happen more often.

Their own reasoning is right. And why it's right sits in `GOGC`'s definition.

> At a high level, GOGC determines the trade-off between GC CPU and memory. It
> works by **determining the target heap size after each GC cycle**, a target
> value for the total heap size in the next cycle.

The docs even give the formula for the target heap size.

```
Target heap memory = Live heap + (Live heap + GC roots) * GOGC / 100
```

**"How long one collection takes" is not in that formula.** `GOGC` only sets
**when the next collection starts.** Slow allocation means it takes longer to
reach the target heap, so lowering `GOGC` doesn't make collections come more
often. Once Read States' LRU cache is full the live heap is near-fixed and new
allocation is small — the variable `GOGC` can touch wasn't moving in the first
place.

| Knob | What it sets | In Read States |
| --- | --- | --- |
| `GOGC` | **When** the next collection starts | Doesn't move; allocation is small |
| LRU cache size | **How many** entries the cache holds | Smaller means shorter scans and a worse hit rate |
| **Pointer count** | **How long** one marking pass takes | The knob the post didn't turn |

The post turned the second knob and made a trade, and it records that trade
honestly.

> Unfortunately, the trade off of making the LRU cache smaller resulted in higher
> 99th latency times. This is because if the cache is smaller it's less likely
> for a user's Read State to be in the cache.

This reads like a dead end because the cache size holds two costs at once — scan
time and hit rate. But **what holds scan time isn't the cache size.**

## Go Doesn't Scan Objects Without Pointers

The GC guide names marking's variable in one sentence.

> Most of the CPU cost of the GC is marking and scanning... **more pointers means
> more GC work, because at minimum the GC needs to visit all the pointers in the
> program.**

Not entry count — pointer count. And the guide writes that conclusion out once
more as practical advice.

> **Pointer-free values are segregated from other values.** As a result, it may
> be advantageous to **eliminate pointers from data structures that do not
> strictly need them**, as this reduces the cache pressure the GC exerts on the
> program.

The guide stops at "reduces cache pressure." The runtime source says something
stronger. It's the code from the opening.

```go
// If this is a noscan object, fast-track it to black
// instead of greying it.
if span.spanclass.noscan() {
	gcw.bytesMarked += uint64(span.elemsize)
	return
}
```

Objects in a `noscan` span **go straight to black and that's it.** There's no step
that greys them and puts them on the work queue. No pointers means nothing to look
into, so it doesn't look.

Reread the post's sentence now and the data structure is deducible.

> the spikes were huge not because of a massive amount of ready-to-free memory,
> but because **the garbage collector needed to scan the entire LRU cache** in
> order to determine if the memory was truly free from references.

**If it had to be scanned, there were pointers in it.** The post never published
its data structure, but that one sentence tells you. With a pointer-free cache
that sentence couldn't be true.

What shape calls for scanning. A common Go LRU cache looks like this.

```go
// The shape that has to be scanned. Three pointers per entry.
type entry struct {
	key   string      // one pointer (the string data)
	value *ReadState  // one pointer
	elem  *list.Element // one pointer (the LRU linked list)
}

type ReadState struct {
	UserID    string // pointer
	ChannelID string // pointer
	Mentions  int
	LastRead  int64
}

type Cache struct {
	items map[string]*entry // the map itself is full of pointers
	order *list.List        // doubly linked list: two pointers per node
}
```

Ten million entries means tens of millions of pointers for marking to follow. And
since the `string`, the `*ReadState` and the `list.Element` are scattered across
the heap, every follow is a cache-miss candidate. The long spikes every few
minutes that the post measured have exactly this shape.

Write the same cache without pointers and marking has nothing to do.

```go
// The shape that isn't scanned. Not a single pointer.
type ReadState struct {
	Mentions int32
	LastRead int64
	// Hashed integers instead of string IDs.
}

type Cache struct {
	// Both key and value are pointer-free value types.
	items map[uint64]ReadState

	// LRU order as array indices rather than a linked list.
	slots []slot
	head  int32
	tail  int32
}

type slot struct {
	key  uint64
	prev int32 // an index into slots, not a pointer
	next int32
}
```

The difference is **the number of pointers to follow, not the number of
entries.** `slots` is one large `noscan` allocation, and the buckets of
`map[uint64]ReadState` hold no pointers either. Grow the cache to 8 million and
marking costs the same.

This is the standard way to fix this problem in Go. It's inconvenient to write —
turning `string` into `uint64` means dealing with hash collisions, and turning
pointers into indices throws away type safety. So choosing "rather than take that
inconvenience, rewrite it in Rust" **can be reasonable.** But that's a different
sentence from "Go can't do this," and the post doesn't draw the distinction.

[The post on object pooling](/posts/unity-object-pooling/) had the same shape.
There too the answer isn't making the GC faster but **not giving the GC work.** In
Unity you reuse objects to remove allocations; in Go you remove pointers to remove
scanning. There's no way to talk a collector round, only a way to show it less.

## What Changed in Six Years and What Didn't

Footnote 1 is this post's most important line.

> \[1\] Go version 1.9.2. Edit: Graphs are from 1.9.2. We tried versions 1.8,
> 1.9, and 1.10 without any improvement. The initial port from Go to Rust was
> completed in May 2019.

**Go 1.9.2 is the October 2017 build.** Two runtime changes since then touch this
problem.

**Go 1.14 — asynchronous preemption.** This post went up on February 4, 2020, and
Go 1.14 came out on **February 25, 2020**. Three weeks apart. The release note's
sentence mentions latency spikes directly.

> Goroutines are now asynchronously preemptible. As a result, **loops without
> function calls no longer potentially deadlock the scheduler or significantly
> delay garbage collection.**

On 1.9.2 a loop with no function call wasn't preemptible. When the GC asked for a
stop-the-world it had to wait for that goroutine to stop. This doesn't reduce
marking cost, but **some of the measured spikes may have been preemption waits
rather than marking.** Re-measuring the same code on 1.14 or later could produce a
different graph. That's a change the post couldn't have known about.

**Go 1.19 — `GOMEMLIMIT`.** The knob usually named as the answer to "no matter how
we set GOGC nothing changed."

> That's why in the 1.19 release, Go added support for setting a runtime memory
> limit.

Except **it makes the Read States problem worse.** `GOMEMLIMIT` runs collections
**more often** as the heap nears the memory limit. When the problem is that one
marking pass is long, raising the frequency is the wrong direction. The guide
warns about that extreme and even gives it a name.

> This situation, where the program fails to make reasonable progress due to
> constant GC cycles, is called **thrashing**. It's particularly dangerous
> because it effectively stalls the program.

And the limit itself isn't a promise.

> For this reason, the memory limit is defined to be **soft**. The Go runtime
> makes no guarantees that it will maintain this memory limit under all
> circumstances; it only promises some reasonable amount of effort.

**What didn't change** matters more. Go's GC is still non-moving.

> We call a GC that moves objects in this way a **moving** GC; Go has a
> **non-moving** GC.

The guide doesn't describe any generational scheme either, and the cost model it
offers — "more pointers means more GC work" — covers the whole heap. So **the
property that marking cost is proportional to the live pointer graph is the same
in 2017 and now.** Hold a large long-lived cache wired together with pointers and
Go in 2026 produces the same graph. What changed is the number of knobs; what
didn't is the cost structure.

| | 2017 (the post's time) | Now |
| --- | --- | --- |
| 2-minute forced collection | Present (`forcegcperiod`) | Unchanged |
| What `GOGC` sets | When a collection starts | Unchanged |
| Asynchronous preemption | Absent | Present since 1.14 |
| Memory limit | Absent | `GOMEMLIMIT` since 1.19 (counterproductive here) |
| Generational / moving GC | Absent | Still absent |
| Pointer-free objects | Not scanned | Unchanged |

## What the Post Left Out on the Rust Side

The Rust section is short, and short means things are missing.

The rust-lang.org sentence the post quotes is still on that site word for word.

> Rust is blazingly fast and memory-efficient: **with no runtime or garbage
> collector**, it can power performance-critical services, run on embedded
> devices, and easily integrate with other languages.

And a few paragraphs later the same post writes this.

> Recently, tokio (**the async runtime we use**) released version 0.2. We
> upgraded and it gave us CPU benefits for free.

**"No runtime" and "the async runtime we use" are in the same post.** Not a
contradiction — one word used in two senses. The first means the resident
machinery a language installs for you, like a GC or a scheduler; the second means
a library you pick and bump versions on. The distinction matters because **the
latter is what decides latency behavior.** The post supplies its own evidence: no
code changed, only the tokio version, and CPU went down.

The first item in the optimization list is also missing a layer of explanation.

> 1. Changing to a **BTreeMap instead of a HashMap** in the LRU cache to optimize
>    memory usage.

Why the memory drops is in Rust's standard library docs. A `BTreeMap` puts many
elements per node in a contiguous array.

> A B-Tree instead makes each node contain B-1 to 2B-1 elements in a contiguous
> array. By doing this, we **reduce the number of allocations by a factor of B**,
> and improve cache efficiency in searches.

But the same doc records the price.

> However, this does mean that searches will have to do **more comparisons on
> average**. ... searching for a random element is expected to take
> **B \* log(n) comparisons**, which is generally worse than a BST.

**It didn't reduce memory, it traded against comparison count.** Lookups go from
O(1) to O(log n). In a cache queried hundreds of thousands of times a second, like
Read States, that isn't free. The post says it won on "every single performance
metric," so the trade must have paid — but why it paid isn't written down.

As a bonus, leaving `HashMap` brings one more thing with it. Rust's default hasher
puts security first.

> The default hashing algorithm is currently **SipHash 1-3**... While its
> performance is very competitive for medium sized keys, **other hashing
> algorithms will outperform it for small keys such as integers** as well as
> large keys such as long strings, though those algorithms will typically *not*
> protect against attacks such as HashDoS.

For an internal service's integer-keyed cache, HashDoS protection isn't needed,
and swapping just the hasher can win a fair amount on the `HashMap` side. Whether
the decision to move to `BTreeMap` **was compared against replacing the hasher
isn't in the post.**

Last, the timing. The post says they went to nightly.

> As an engineering team, we decided it was worth using nightly Rust and we
> committed to running on nightly until async was fully supported on stable.

Per footnote 1 the port finished in **May 2019**. async/await landed on stable in
**Rust 1.39.0, November 7, 2019**. That means half a year of running a production
service on nightly, and the post's "the bet paid off" isn't an overstatement.
Anyone making the same choice today doesn't have that premise — **async went
stable in November 2019.**

## Where and Why You'd Use It

### If You Were to Fix This in Go

There's an order, and it differs from the order the post turned things in.

| Order | What to do | Why |
| --- | --- | --- |
| 1 | Confirm marking is actually the culprit | Separate marking from preemption waits |
| 2 | Take the pointers out of the cache | The variable that sets marking cost |
| 3 | If still short, partition the cache | Last resort, paying a hit-rate cost |
| 4 | `GOGC` / `GOMEMLIMIT` | Frequency knobs. Last for this problem |

Start with 1. There's a way to measure rather than guess.

```bash
# One line per collection. Wall-clock and CPU time, broken out by phase.
GODEBUG=gctrace=1 ./read-states 2>&1 | grep '^gc '
```

For the CPU profile side, the guide writes down how to read it.

> A large amount of cumulative time spent here (>5%) indicates that the
> application is likely out-pacing the GC with respect to how fast it's
> allocating. It indicates a particularly high degree of impact from the GC, and
> also represents time the application spend marking and scanning.

Step 2 is the main event. Taking pointers out happens in three places.

```go
package readstates

// 1) Keys: turn strings into hashed integers.
//    Collisions have to be handled, so it isn't free. Keep the key hash in the slot and compare.
type Key uint64

// 2) Values: make it a value type that holds no pointers.
//    One remaining string field makes this whole struct a scan target.
type ReadState struct {
	Mentions    int32
	LastReadID  int64
	LastWriteNs int64
}

// 3) LRU order: replace the linked list with an index array.
//    container/list holds two Element pointers per node.
type slot struct {
	key   Key
	state ReadState
	prev  int32
	next  int32
}

type Cache struct {
	index map[Key]int32 // the value is an index into slots, not a pointer
	slots []slot        // one large noscan allocation
	head  int32
	tail  int32
	free  int32
}
```

Allocate `slots` once and **no heap allocation happens** while entries go in and
out, and since the whole thing is one pointer-free block, marking walks past it.
`map[Key]int32` has pointer-free keys and values too, so its buckets are
`noscan`.

Don't do this before measuring. The code definitely gets harder to read, and what
you buy for that is **marking time only**. If step 1 says marking isn't the
culprit, this work is a loss.

### Reaching the Same Conclusion Again in 2023

That this post isn't an isolated case shows up three years later. Discord's
[How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
(2023-03-06) is about moving message storage from Cassandra to ScyllaDB, and the
reason for moving is the same.

> **GC pauses would cause significant latency spikes**

This time it's the JVM, not Go. And the data services they put in front of it were
written **in Rust again.**

> it gave us fast C/C++ speeds without having to sacrifice safety

One of the things those services do is coalescing requests.

> If multiple users are requesting the same row at the same time, we'll only
> query the database once... This routing further helps reduce the load on our
> database.

Read only the 2020 post and it reads as "Go's GC was the problem." Read the two
overlaid and a different sentence comes out — **Discord's latency requirements
don't fit a tracing collector's cost structure.** Go or JVM, the same graph came
out, and both times they picked the same answer. It isn't a story about which
language is bad, but about what place a collector takes **in a service that holds
tail latency as a product requirement.**

### When Not to Choose a Rewrite

Bringing back the footnote from the opening. It's the most frequently ignored
sentence in this post.

> \[2\] To be clear, we don't think you should rewrite everything in rust just
> because.

The body has premises too. Performance isn't the whole reason this service was
picked.

> we collectively decided we wanted to create the frameworks and libraries needed
> to build new services fully in Rust. **This service was a great candidate to
> port to Rust since it was small and self-contained**, but we also hoped that
> Rust would fix these latency spikes.

Look at the order. **They decided first to build the foundation for writing
services in Rust**, then picked a small, self-contained service as a candidate,
and hoped the latency problem would be solved along the way. The grounds for the
rewrite weren't performance alone. Copying the same choice requires those premises
too.

- **Is it small and self-contained?** A service with fuzzy boundaries becomes a
  redesign, not a translation.
- **Are you staying in that language?** One service in Rust still needs someone to
  maintain that one.
- **Do you have measurements?** The post has graphs of the Go version before the
  port. Start without a baseline and you can't say afterwards what got better.
- **Have you fixed everything that's fixable?** Taking the pointers out is a day;
  a rewrite is not a day.

That last item is the most practical way to read this post. The post turned two
knobs, and one knob was left unturned.

## Wrapping Up

Discord's diagnosis is accurate. Finding the 2-minute period in the source,
locating why `GOGC` doesn't work in the allocation rate, and concluding that the
spikes' size comes from **the cache that must be walked rather than the memory to
be freed** — all correct. And all three are still correct on Go in 2026.

What's missing is the next step. The variable that sets walking cost is **the
pointer count, not the entry count.** Go's GC guide writes "more pointers means
more GC work," and the runtime source **sends pointer-free objects straight to
black without queueing them for scanning.** Making the cache smaller cuts scan
time and hit rate together; taking the pointers out cuts scan time only.

That doesn't make the Rust choice wrong. The post itself says they decided first
to build a Rust foundation, and its footnote says this isn't a call to rewrite
everything in Rust. Seeing the same graph on the JVM three years later and picking
Rust again is consistent.

But citing this post as "Go's GC can't solve this problem" goes one step past what
the post said. **It isn't that it can't be solved — it's that solving it is
inconvenient.** A record comparing that inconvenience against the cost of a
rewrite isn't in this post.

---

### References

- [Why Discord is switching from Go to Rust — Discord Blog](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
- [A Guide to the Go Garbage Collector — go.dev](https://go.dev/doc/gc-guide)
- [Go 1.14 release notes — go.dev](https://go.dev/doc/go1.14)
- [runtime/mgcmark.go — golang/go](https://github.com/golang/go/blob/master/src/runtime/mgcmark.go)
- [BTreeMap — Rust standard library](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)
- [HashMap — Rust standard library](https://doc.rust-lang.org/std/collections/struct.HashMap.html)
- [How Discord Stores Trillions of Messages — Discord Blog](https://discord.com/blog/how-discord-stores-trillions-of-messages)

The starting point for this post was [Jesse Howarth — Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
(2020-02-04). I followed its diagnostic path as written, checking `GOGC`, the
forced collection period and the variable behind marking cost against the current
Go GC guide and runtime source, and matching the Rust-side choices against the
standard library docs.
