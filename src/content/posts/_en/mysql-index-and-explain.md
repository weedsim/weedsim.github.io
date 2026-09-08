---
pubDatetime: 2026-09-08T16:00:00+09:00
title: "USING HASH Silently Becomes a B-Tree on InnoDB"
lang: en
translationKey: mysql-index-and-explain
featured: false
draft: false
tags:
  - MySQL
  - MariaDB
  - SQL
  - Database
  - Index
  - Optimization
description: "I checked a write-up on MySQL/MariaDB index creation and EXPLAIN against the manuals. The hash index recipe doesn't work on InnoDB, and four of the EXPLAIN column descriptions are wrong."
---

I was carrying on with the [DB I put in Docker](/en/posts/docker-build-and-run/).
Creating tables and writing queries brought me to the point of needing indexes,
and along the way I'd saved a
[write-up](https://gbminnote.com/entry/mysql-mariadb-index-%EC%84%A4%EC%A0%95-%EC%BF%BC%EB%A6%AC%EC%B5%9C%EC%A0%81%ED%99%94)
covering MySQL and MariaDB index creation and deletion, four index types, and
how to read `EXPLAIN` — all on one page. The syntax you need when starting out
is in one place.

I checked it against the manuals, entry by entry. The syntax itself is fine, but
**one of the recipes doesn't do what it's meant to on InnoDB**, and **four of
the `EXPLAIN` column descriptions are wrong.** Two of those contradict the
sample output the write-up prints alongside them.

## Table of contents

## USING HASH silently becomes a B-Tree on InnoDB

The write-up gives this as the way to set up a hash index.

```sql
CREATE INDEX index_name ON table_name(column_name) USING HASH;
```

The syntax passes. No error. And **a B-Tree index is what you get.** The MySQL
manual's per-engine table:

| Storage engine | Permissible index types |
| --- | --- |
| `InnoDB` | `BTREE` |
| `MyISAM` | `BTREE` |
| `MEMORY`/`HEAP` | `HASH`, `BTREE` |
| `NDB` | `HASH`, `BTREE` |

Hash indexes can only be created on `MEMORY` and `NDB`. InnoDB has been the
default engine since MySQL 5.5, so on a table made without special settings,
`USING HASH` is ignored. The manual spells the behavior out.

> If you specify an index type that is not valid for a given storage engine, but
> another index type is available that the engine can use without affecting
> query results, **the engine uses the available type.**

**There's no warning either.** So you're left believing you added a hash index
and equality lookups got faster.

The way to check is something the write-up already handed you — the command in
its third section.

```sql
SHOW INDEX FROM table_name;
```

It has an `Index_type` column, described in the manual as "The index method used
(`BTREE`, `FULLTEXT`, `HASH`, `RTREE`)." Create the index with `USING HASH`,
then run this, and you get `BTREE`. **The write-up's section 3 disproves its
section 2.**

For what it's worth, InnoDB does have a hash: the Adaptive Hash Index. But
that's an **internal structure the engine builds on its own** based on access
patterns, not something you request with `CREATE INDEX`. The similar name makes
it easy to conflate.

## Four EXPLAIN columns are wrong

Putting the write-up's `EXPLAIN` column descriptions next to the manual:

| Column | The write-up | The manual |
| --- | --- | --- |
| `rows` | the number of rows **returned** by the query | "the number of rows MySQL believes it must **examine**" |
| `Extra: Using where` | means an **index was used** to handle the WHERE condition | "A `WHERE` clause is used to restrict which rows to match against the next table or send to the client." |
| `ref` | the list of **columns** used from the index | "which columns **or constants** are compared to the index named in the `key` column" |
| `filtered` | the percentage of data that was **filtered out** | "The maximum value is 100, which means **no filtering** of rows occurred." |

Taken one at a time, the consequences differ.

**`rows`** — this is the big one. It isn't rows returned; it's **the number of
rows the optimizer estimates it must examine.** Half the reason to look at
`EXPLAIN` lives here. A final result of one row with `rows` at a million means
that query is sweeping a million rows, and that's the signal that an index is
needed. Read as "rows returned," **that signal disappears entirely.**

**`Using where`** — not about indexes. It means rows fetched from the storage
engine get filtered by `WHERE`. The manual actually points the other way.

> Unless you specifically intend to fetch or examine all rows from the table,
> you may have something wrong in your query if the `Extra` value is **not**
> `Using where` and the table join type is `ALL` or `index`.

It's the **absence** of `Using where` on a full scan that's suspicious. Its
presence isn't a good sign.

**`ref`** — the write-up's own sample output has `ref` as `const`, and **`const`
is not a column.** It marks a comparison against a constant. Apply the
write-up's definition and it can't explain its own example.

**`filtered`** — not the fraction filtered out but **the fraction left after
filtering.** The manual is explicit that 100 means nothing was filtered. Run the
write-up's own numbers: `rows` 1000 × `filtered` 10% = 100 rows carry to the
next step. Read as "the fraction filtered out," you'd answer 900. MariaDB words
it more clearly, describing its measured counterpart `r_filtered` as "which
fraction of rows was **left** after applying the WHERE condition."

`type` is off as well. The write-up says "if the query uses a single table it
shows as index," but **the `type` in its own sample output is `ref`.** It's a
single-table query and it isn't `index`. `type` describes how rows are located,
and it degrades roughly in the order `const` / `eq_ref` / `ref` / `range` /
`index` / `ALL`.

## The "query optimization" the title promises isn't there

The write-up is titled "index creation and query optimization," but **there's
nothing about which column to index.** It lists index types and explains
`EXPLAIN` columns, and that's it.

Yet its own `EXPLAIN` example calls for exactly that discussion.

```sql
EXPLAIN SELECT *
FROM orders
WHERE order_date BETWEEN '2022-01-01' AND '2022-01-31'
AND status = 'completed';
```

In the sample output, `possible_keys` is just `status`. **That means
`order_date` has no index.** Two conditions, one usable index, and the other
condition spent filtering fetched rows with `WHERE`. That's what
`Extra: Using where` actually is here, and why `filtered` came out at 10%.

What's needed is a **composite index**. The manual's rule:

> If you have a three-column index on `(col1, col2, col3)`, you have indexed
> search capabilities on `(col1)`, `(col1, col2)`, and `(col1, col2, col3)`.
>
> MySQL cannot use the index to perform lookups if the columns do not form a
> leftmost prefix of the index.

**It only applies from the left.** An index on `(a, b)` serves a condition on
`a` and does nothing for a condition on `b` alone.

That's also where the ordering rule comes from: **equality conditions first,
range conditions after.**

```sql
CREATE INDEX idx_orders_status_date ON orders (status, order_date);
```

`status = 'completed'` picks one point, and the `order_date` range can then be
swept contiguously within it. Reverse it to `(order_date, status)` and the range
comes first, leaving `status` scattered through that range with no way to narrow
it via the index. Same two columns; the order decides the outcome.

## Korean FULLTEXT needs one more parser

The write-up's full-text index example:

```sql
CREATE FULLTEXT INDEX index_name ON table_name(column_name);
```

For English this is enough. **For Korean it isn't.** The manual gives the
reason.

> The built-in MySQL full-text parser uses the **white space between words** as
> a delimiter to determine where words begin and end, which is a limitation when
> working with ideographic languages that do not use word delimiters.

The default parser splits on whitespace. So MySQL provides a separate parser.

> MySQL provides an ngram full-text parser that supports **Chinese, Japanese,
> and Korean (CJK)**.

Attaching it is one extra clause.

```sql
CREATE FULLTEXT INDEX index_name ON table_name(column_name) WITH PARSER ngram;
```

`ngram_token_size` is the slicing unit, defaulting to 2 — bigrams. It's worth
knowing this has to be decided up front: it's a **read-only variable**, set as a
startup option or in the configuration file.

Use the write-up's example as-is on a Korean-language project and the index gets
created, the query runs, and only the results are missing. The same kind of
failure as `USING HASH`.

## Knowing it's an estimate is what sends you looking for the measurement

Both `rows` and `filtered` in `EXPLAIN` are **the optimizer's estimates.** With
stale statistics they can be far off. The write-up calling `rows` "rows
returned" trips here a second time: **believe it's a measurement and you have no
reason to go find the measurement.**

Both servers offer one.

```sql
-- MySQL
EXPLAIN ANALYZE SELECT ... ;

-- MariaDB
ANALYZE SELECT ... ;
```

MySQL's `EXPLAIN ANALYZE` "runs a statement and produces `EXPLAIN` output along
with timing and additional, iterator-based, information about **how the
optimizer's expectations matched the actual execution**." MariaDB's `ANALYZE`
puts `r_rows` ("how many rows were actually read from the table") and
`r_filtered` right beside the estimates.

**Both actually execute the statement.** Attach either to an `UPDATE` or
`DELETE` on a production database and that statement runs — worth keeping in
mind.

## Wrapping up

- **`USING HASH` is ignored on InnoDB and you get a B-Tree.** Hash indexes exist
  only on `MEMORY` and `NDB`, and there's no warning. Check with `SHOW INDEX`'s
  `Index_type`.
- **`EXPLAIN`'s `rows` is not rows returned but rows estimated to be examined.**
  That's where the "you need an index" signal comes from.
- **`Using where` doesn't mean an index was used.** It means fetched rows get
  filtered by `WHERE`, and the manual says to be suspicious when it's **absent**
  on a full scan.
- **`filtered` is the fraction left after filtering.** 100 means nothing was
  filtered.
- **`ref` covers constants, not just columns.** The `const` in the write-up's
  example is that case.
- **A composite index only applies from the left.** Equality conditions first,
  range conditions after. The example query needed `(status, order_date)`.
- **Korean FULLTEXT needs `WITH PARSER ngram`.** The default parser splits on
  whitespace.
- To compare estimates against measurements: `EXPLAIN ANALYZE` (MySQL) or
  `ANALYZE` (MariaDB) — but **they run the statement.**

Write-ups that transcribe syntax age well. The trouble starts **where passing
the syntax and doing what you meant come apart.** `USING HASH` and Korean
FULLTEXT both get created without error and both run. The failure never surfaces
as an exception — **only as the quality of the results.**

On a database you stood up yourself this bites harder. Nobody is watching it for
you the way a managed service would, so if adding an index is enough to put you
at ease, it stays that way. `SHOW INDEX` is that one line of checking.

## References

- [EXPLAIN Output Format — MySQL](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [CREATE INDEX Statement — MySQL](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
- [Multiple-Column Indexes — MySQL](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)
- [ngram Full-Text Parser — MySQL](https://dev.mysql.com/doc/refman/8.4/en/fulltext-search-ngram.html)
- [SHOW INDEX Statement — MySQL](https://dev.mysql.com/doc/refman/8.4/en/show-index.html)
- [ANALYZE Statement — MariaDB](https://mariadb.com/docs/server/reference/sql-statements/administrative-sql-statements/analyze-and-explain-statements/analyze-statement)
- Source: [mysql, mariadb index creation and query optimization](https://gbminnote.com/entry/mysql-mariadb-index-%EC%84%A4%EC%A0%95-%EC%BF%BC%EB%A6%AC%EC%B5%9C%EC%A0%81%ED%99%94)
