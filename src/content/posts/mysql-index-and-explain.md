---
pubDatetime: 2026-09-08T16:00:00+09:00
title: "USING HASH는 InnoDB에서 조용히 B-Tree가 된다"
lang: ko
translationKey: mysql-index-and-explain
featured: false
draft: false
tags:
  - MySQL
  - MariaDB
  - SQL
  - 데이터베이스
  - 인덱스
  - 최적화
description: "MySQL·MariaDB 인덱스 생성과 EXPLAIN을 정리한 글을 매뉴얼과 대조했다. 해시 인덱스 레시피는 InnoDB에서 동작하지 않고, EXPLAIN 컬럼 설명 넷이 틀렸다."
---

[Docker에 올린 DB](/posts/docker-build-and-run/) 작업을 이어가던 중이었다.
테이블을 만들고 쿼리를 짜다 보니 인덱스를 걸어야 할 시점이 왔고, 그러다
MySQL과 MariaDB의 인덱스 생성·삭제, 인덱스 종류 네 가지, `EXPLAIN` 읽는 법까지
한 장에 담은
[글](https://gbminnote.com/entry/mysql-mariadb-index-%EC%84%A4%EC%A0%95-%EC%BF%BC%EB%A6%AC%EC%B5%9C%EC%A0%81%ED%99%94)을
스크랩해뒀었다. 처음 만들 때 필요한 문법이 한자리에 있다.

매뉴얼과 하나씩 대조해봤다. 문법 자체는 맞는데, **제시된 레시피 하나가
InnoDB에서는 의도한 대로 동작하지 않고**, `EXPLAIN` 컬럼 설명은 **넷이
틀렸다.** 그중 둘은 원문이 같이 실어둔 예제 출력과도 어긋난다.

## 목차

## `USING HASH`는 InnoDB에서 조용히 B-Tree가 된다

원문은 해시 인덱스의 "설정 방법"으로 이걸 준다.

```sql
CREATE INDEX 인덱스명 ON 테이블명(컬럼명) USING HASH;
```

문법은 통과한다. 에러도 안 난다. 그런데 **B-Tree 인덱스가 만들어진다.**
MySQL 매뉴얼의 엔진별 표가 이렇다.

| 스토리지 엔진 | 허용되는 인덱스 타입 |
| --- | --- |
| `InnoDB` | `BTREE` |
| `MyISAM` | `BTREE` |
| `MEMORY`/`HEAP` | `HASH`, `BTREE` |
| `NDB` | `HASH`, `BTREE` |

해시 인덱스는 `MEMORY`와 `NDB`에서만 만들 수 있다. MySQL 5.5부터 기본 엔진은
InnoDB이므로, 아무 설정 없이 만든 테이블이라면 `USING HASH`는 무시된다.
매뉴얼이 이 동작을 명시한다.

> If you specify an index type that is not valid for a given storage engine, but
> another index type is available that the engine can use without affecting
> query results, **the engine uses the available type.**

**경고도 없다.** 그래서 "해시 인덱스를 걸었으니 등치 검색이 빨라졌겠지"라고
믿은 채로 남는다.

확인하는 방법은 원문이 이미 알려줬다. 세 번째 절의 명령이다.

```sql
SHOW INDEX FROM 테이블명;
```

여기 `Index_type` 컬럼이 있고, 매뉴얼의 설명은 "The index method used
(`BTREE`, `FULLTEXT`, `HASH`, `RTREE`)"다. `USING HASH`로 만든 뒤 이걸 찍어보면
`BTREE`가 나온다. **원문의 3절이 원문의 2절을 반증한다.**

덧붙이면 InnoDB에도 해시는 있다. Adaptive Hash Index인데, 이건 엔진이 접근
패턴을 보고 **알아서 만드는 내부 구조**라 사용자가 `CREATE INDEX`로 지정하는
대상이 아니다. 이름이 비슷해서 헷갈리기 좋은 자리다.

## `EXPLAIN` 컬럼 넷이 틀렸다

원문의 `EXPLAIN` 컬럼 설명과 매뉴얼을 나란히 놓으면 이렇게 된다.

| 컬럼 | 원문의 설명 | 매뉴얼 |
| --- | --- | --- |
| `rows` | 쿼리에 의해 **반환된** 행의 수 | "the number of rows MySQL believes it must **examine**" |
| `Extra: Using where` | WHERE 조건을 처리하기 위해 **인덱스를 사용**했다는 뜻 | "A `WHERE` clause is used to restrict which rows to match against the next table or send to the client." |
| `ref` | 인덱스에서 사용된 **열의 목록** | "which columns **or constants** are compared to the index named in the `key` column" |
| `filtered` | **필터링된** 데이터의 비율 | "The maximum value is 100, which means **no filtering** of rows occurred." |

하나씩 보면 왜 문제인지가 갈린다.

**`rows`** — 이게 제일 크다. 반환 행 수가 아니라 **읽어야 한다고 옵티마이저가
추정한 행 수**다. `EXPLAIN`을 보는 이유의 절반이 여기 있다. 최종 결과가 한
줄이어도 `rows`가 100만이면 그 쿼리는 100만 행을 훑고 있다는 뜻이고, 그게
인덱스를 걸어야 할 신호다. "반환된 행 수"로 읽으면 **이 신호가 통째로 안
보인다.**

**`Using where`** — 인덱스 얘기가 아니다. 스토리지 엔진에서 가져온 행을
`WHERE`로 걸러낸다는 뜻이다. 매뉴얼은 오히려 반대 방향으로 쓴다.

> Unless you specifically intend to fetch or examine all rows from the table,
> you may have something wrong in your query if the `Extra` value is **not**
> `Using where` and the table join type is `ALL` or `index`.

즉 `Using where`가 **없는데** 전체 스캔이면 의심하라는 것이다. 있다고 좋은
신호가 아니다.

**`ref`** — 원문의 예제 출력에서 `ref` 값이 `const`인데, **`const`는 열이
아니다.** 상수와 비교했다는 표시다. 원문의 정의를 그대로 적용하면 자기 예제를
설명할 수 없다.

**`filtered`** — 걸러낸 비율이 아니라 **걸러내고 남은 비율**이다. 100이면
아무것도 안 걸러졌다는 뜻이라고 매뉴얼이 못 박는다. 원문의 예제로 계산하면
`rows` 1000 × `filtered` 10% = 다음 단계로 넘어가는 행이 100개다. "필터링된
비율"로 읽으면 900이라고 답하게 된다. MariaDB 쪽 표현이 더 명확한데, 실측
컬럼 `r_filtered`를 "which fraction of rows was **left** after applying the
WHERE condition"이라고 설명한다.

`type`도 어긋난다. 원문은 "쿼리가 단일 테이블을 사용하면 index로 표시"라고
적었는데, **원문이 실은 예제 출력의 `type`이 `ref`다.** 단일 테이블 쿼리인데
`index`가 아니다. `type`은 어떤 방식으로 행을 찾는지를 나타내는 값이고,
`const` / `eq_ref` / `ref` / `range` / `index` / `ALL` 순으로 나빠진다.

## 제목이 약속한 "쿼리 최적화"가 없다

원문 제목은 "index 생성 및 쿼리 최적화"인데, **어떤 컬럼에 인덱스를 걸어야
하는지가 없다.** 인덱스 종류를 나열하고 `EXPLAIN` 컬럼을 설명할 뿐이다.

그런데 원문의 `EXPLAIN` 예제 쿼리가 정확히 그 이야기를 부른다.

```sql
EXPLAIN SELECT *
FROM orders
WHERE order_date BETWEEN '2022-01-01' AND '2022-01-31'
AND status = 'completed';
```

예제 출력에서 `possible_keys`가 `status` 하나뿐이다. **`order_date`에는
인덱스가 없다는 뜻이다.** 조건이 둘인데 인덱스는 하나만 쓰이고, 나머지 하나는
가져온 행을 `WHERE`로 걸러내는 데 쓰인다. 그게 `Extra: Using where`의 정체이고
`filtered` 10%가 나온 이유다.

여기서 필요한 게 **복합 인덱스**다. 매뉴얼의 규칙은 이렇다.

> If you have a three-column index on `(col1, col2, col3)`, you have indexed
> search capabilities on `(col1)`, `(col1, col2)`, and `(col1, col2, col3)`.
>
> MySQL cannot use the index to perform lookups if the columns do not form a
> leftmost prefix of the index.

**왼쪽부터 이어져야 쓰인다.** `(a, b)` 인덱스는 `a` 조건에는 쓰이고 `b`
조건만으로는 안 쓰인다.

순서를 정하는 기준도 여기서 나온다. **등치 조건을 앞에, 범위 조건을 뒤에**
둔다.

```sql
CREATE INDEX idx_orders_status_date ON orders (status, order_date);
```

`status = 'completed'`로 한 지점을 찍고, 그 안에서 `order_date` 범위를
연속으로 훑을 수 있기 때문이다. 순서를 뒤집어 `(order_date, status)`로 두면
범위 조건이 먼저 와서, 그 범위 안에 흩어진 `status`는 인덱스로 좁힐 수 없다.
같은 두 컬럼이라도 순서가 결과를 가른다.

## 한국어 FULLTEXT에는 파서가 하나 더 필요하다

원문의 전문 검색 인덱스 예제다.

```sql
CREATE FULLTEXT INDEX 인덱스명 ON 테이블명(컬럼명);
```

영어라면 이걸로 된다. **한국어는 안 된다.** 매뉴얼의 설명이 이유를 말한다.

> The built-in MySQL full-text parser uses the **white space between words** as
> a delimiter to determine where words begin and end, which is a limitation when
> working with ideographic languages that do not use word delimiters.

기본 파서는 공백으로 단어를 자른다. "데이터베이스 최적화"는 두 덩어리가 되고,
"데이터베이스"의 일부인 "데이터"로는 검색되지 않는다. 그래서 MySQL은 별도
파서를 제공한다.

> MySQL provides an ngram full-text parser that supports **Chinese, Japanese,
> and Korean (CJK)**.

붙이는 방법은 절 하나 추가다.

```sql
CREATE FULLTEXT INDEX 인덱스명 ON 테이블명(컬럼명) WITH PARSER ngram;
```

`ngram_token_size`가 자르는 단위이고 기본값은 2다. 2면 "데이터베이스"를
"데이터", "이터", "터베"… 식으로 두 글자씩 쪼개 색인한다. 시작할 때 정해야
하는 값이라는 점도 알아둘 만한데, **읽기 전용 변수**라 서버 시작 옵션이나 설정
파일에서 지정한다.

한국어를 다루는 프로젝트에서 원문 예제를 그대로 쓰면, 인덱스는 만들어지고
쿼리도 통과하는데 결과만 안 나온다. `USING HASH`와 같은 종류의 실패다.

## 추정이라는 것을 알아야 실측을 찾는다

`EXPLAIN`이 보여주는 `rows`도 `filtered`도 전부 **옵티마이저의 추정치**다.
통계가 낡았으면 실제와 크게 어긋난다. 원문이 `rows`를 "반환된 행의 수"라고
적은 게 여기서 한 번 더 걸린다. **실측이라고 믿으면 실측을 따로 찾을 이유가
없어진다.**

둘 다 실측을 보는 수단이 있다.

```sql
-- MySQL
EXPLAIN ANALYZE SELECT ... ;

-- MariaDB
ANALYZE SELECT ... ;
```

MySQL의 `EXPLAIN ANALYZE`는 "runs a statement and produces `EXPLAIN` output
along with timing and additional, iterator-based, information about **how the
optimizer's expectations matched the actual execution**"이다. MariaDB의
`ANALYZE`는 `r_rows`("how many rows were actually read from the table")와
`r_filtered`를 추정치 옆에 나란히 붙여준다.

**둘 다 쿼리를 실제로 실행한다.** 운영 DB에서 `UPDATE`나 `DELETE`에 붙이면 그
문장이 실행된다는 뜻이니 그 점은 주의해야 한다.

## 정리

- **`USING HASH`는 InnoDB에서 무시되고 B-Tree가 만들어진다.** 해시 인덱스는
  `MEMORY`·`NDB`에서만 가능하고, 경고도 없다. `SHOW INDEX`의 `Index_type`으로
  확인한다.
- **`EXPLAIN`의 `rows`는 반환 행 수가 아니라 읽어야 한다고 추정한 행 수다.**
  인덱스가 필요하다는 신호가 여기서 나온다.
- **`Using where`는 인덱스를 썼다는 뜻이 아니다.** 가져온 행을 `WHERE`로
  걸러낸다는 뜻이고, 매뉴얼은 전체 스캔인데 이게 **없을 때** 의심하라고 한다.
- **`filtered`는 걸러내고 남은 비율이다.** 100이 "안 걸러짐"이다.
- **`ref`는 열만이 아니라 상수도 포함한다.** 원문 예제의 `const`가 그 경우다.
- **복합 인덱스는 왼쪽부터 이어져야 쓰인다.** 등치 조건을 앞, 범위 조건을 뒤에
  둔다. 원문의 예제 쿼리에 필요한 건 `(status, order_date)`였다.
- **한국어 FULLTEXT는 `WITH PARSER ngram`이 필요하다.** 기본 파서는 공백으로
  자른다.
- 추정치를 실측과 대보려면 `EXPLAIN ANALYZE`(MySQL) 또는 `ANALYZE`(MariaDB).
  다만 **문장을 실제로 실행한다.**

문법을 옮긴 글은 오래 간다. **문법이 통과하는 것과 의도대로 동작하는 것이 다를
때** 문제가 된다. `USING HASH`도, 한국어 FULLTEXT도, 에러 없이 만들어지고
쿼리도 통과한다. 실패가 예외로 드러나지 않고 **결과의 품질로만 드러나는**
종류다.

직접 세운 DB에서는 이게 특히 걸린다. 관리형 서비스처럼 누가 대신 봐주지
않으니, 인덱스를 걸었다는 사실만으로 안심하고 넘어가면 그대로 남는다. `SHOW
INDEX` 한 줄이 그 확인이다.

## 참고

- [EXPLAIN Output Format — MySQL](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [CREATE INDEX Statement — MySQL](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
- [Multiple-Column Indexes — MySQL](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)
- [ngram Full-Text Parser — MySQL](https://dev.mysql.com/doc/refman/8.4/en/fulltext-search-ngram.html)
- [SHOW INDEX Statement — MySQL](https://dev.mysql.com/doc/refman/8.4/en/show-index.html)
- [ANALYZE Statement — MariaDB](https://mariadb.com/docs/server/reference/sql-statements/administrative-sql-statements/analyze-and-explain-statements/analyze-statement)
- 원문: [mysql, mariadb index 생성 및 쿼리 최적화](https://gbminnote.com/entry/mysql-mariadb-index-%EC%84%A4%EC%A0%95-%EC%BF%BC%EB%A6%AC%EC%B5%9C%EC%A0%81%ED%99%94)
