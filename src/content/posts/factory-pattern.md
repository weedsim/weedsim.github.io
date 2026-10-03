---
pubDatetime: 2026-10-03T16:00:00+09:00
title: "첫 예제는 `type`이 아니라 `pizza`를 비교한다"
lang: ko
translationKey: factory-pattern
featured: false
draft: false
tags:
  - Java
  - C#
  - 디자인 패턴
description: "Head First를 따라 팩토리 패턴을 정리한 2016년 글이다. 개념 설명은 교과서대로인데 코드가 셋 다 깨져 있다. 그리고 그 셋이 전부 같은 구멍으로 떨어진다. 타입을 문자열로 받으면 컴파일러가 볼 수 있는 게 없다."
---

게임 개발을 할 때 **신경 써야 하는 디자인 패턴**이 무엇인지 공부하던 중에
스크랩한 글이다. 2016년 글이고, *Head First Design Patterns*의 피자 가게 예제를
따라가며 **간단한 팩토리 → 팩토리 메소드 패턴 → 추상 팩토리 패턴** 순서로
정리한다. 책의 흐름을 그대로 밟기 때문에 지도로 보기 좋다.

피자 가게 예제가 게임과 멀어 보이는데, 구조가 그대로 겹친다. 분점마다 다른
피자를 만드는 자리는 **스테이지마다 다른 적을 뽑는 자리**이고, 같은 지역의
재료끼리 써야 한다는 제약은 **같은 테마의 에셋끼리 써야 한다는 제약**이다.
그래서 이 글의 "어디에 왜 쓰나"는 전부 Unity 코드로 썼다.

**개념 설명은 교과서대로다.** "바뀔 수 있는 부분을 찾아내서 바뀌지 않는 부분하고
분리"한다는 원칙에서 출발해서, 의존성 뒤집기 원칙까지 간다. 틀린 데가 없다.

코드가 문제다. **세 군데 다 깨져 있고, 깨진 방식이 전부 같다.**

```java
public Pizza createPizza (String type){
    Pizza pizza = null;
    if(pizza.equals("cheese")) pizza = new CheesePizza();
    ...
}
```

이 글 첫 코드 예제의 세 번째 줄이다. 매개변수는 `type`인데 **`pizza`를
비교하고**, 그 `pizza`는 바로 위에서 `null`로 초기화된다. 첫 줄에서
`NullPointerException`이 난다.

그리고 이게 **컴파일된다.**

## 목차

## 개념 설명은 교과서대로다

먼저 맞는 쪽부터. 출발점이 정확하다.

> 이런 코드가 있다는 것은, 뭔가 변경하거나 확장해야 할 때 코드를 다시 확인하고
> 추가 또는 제거해야 한다는 것을 의미함.

그리고 원칙으로 올린다.

> **- 바뀔 수 있는 부분을 찾아내서 바뀌지 않는 부분하고 분리시켜야 한다는 원칙.**

맞다. 피자 주문 절차(`prepare` → `bake` → `cut` → `box`)는 안 바뀌고 어떤
피자를 만드는지는 바뀐다. 바뀌는 쪽만 떼어내는 것이 이 패턴의 전부다.

간단한 팩토리를 패턴으로 치지 않는 것도 정확하다.

> **간단한 팩토리는 디자인 패턴이라고 할 수는 없다.**
> **프로그래밍을 하는데 있어서 자주 쓰이는 관용구에 가깝다고 할 수 있다.**

그리고 두 패턴의 차이를 마지막에 요약하면서 **구성**이라는 단어를 굵게
표시한다.

> **추상 팩토리 패턴**: 제품군을 생성하기 위한 인터페이스를 생성 그 인터페이스를
> **구성** 하여 사용할수 있게끔 하는것.

여기가 핵심인데 글이 한 번 짚고 지나간다. 자기 코드가 그 차이를 그대로
보여주는데도 연결해주지 않는다. 뒤에서 다시 본다.

의존성 뒤집기 원칙을 설명하는 방식도 좋다. 화살표 방향을 바꿔서 보여준다.

| 전 | 후 |
| --- | --- |
| `PizzaStore` → `NYStyleCheesePizza` | `PizzaStore` → `Pizza` |
| `PizzaStore` → `ChicagoStyleCheesePizza` | `Pizza` ← `NYStyleCheesePizza` |
| `PizzaStore` → `NYStyleVeggiePizza` | `Pizza` ← `ChicagoStyleCheesePizza` |

> **고수준 구성요소(PizzaStore)와 저수준 구성요소(NYStyleCheesePizza, ...) 들이
> 모두 추상 클래스인 Pizza에 의존하게됨.**

맞는 설명이고, "뒤집기"라는 이름이 왜 붙었는지도 이 표 하나로 전달된다.

## 첫 예제는 `type`이 아니라 `pizza`를 비교한다

도입부에 붙인 그 코드다. 전체를 보면 이렇다.

```java
public class SimplePizzaFactory {
    public Pizza createPizza (String type){
        Pizza pizza = null;
        if(pizza.equals("cheese")) pizza = new CheesePizza();
        if(pizza.equals("pepper")) pizza = new PepperoniPizza();
        if(pizza.equals("clam")) pizza = new ClamPizza();
        if(pizza.equals("veggie")) pizza = new VeggiePizza();
        return pizza;
    }
}
```

`type`을 비교해야 하는데 네 줄 모두 `pizza`를 비교한다. `pizza`는 `null`이니
**첫 `if`에서 `NullPointerException`이다.** 이 팩토리는 어떤 입력에도 피자를
돌려주지 못한다.

여기서 중요한 건 "오타가 있다"가 아니라 **이 오타가 컴파일된다**는 것이다.
`equals`의 시그니처가 그걸 허용한다.

> **`public boolean equals(Object obj)`**

매개변수 타입이 `Object`다. 그래서 `Pizza` 타입 변수에 `String`을 넘겨도
타입 오류가 아니다. 컴파일러는 "`Pizza`와 `String`을 비교하는 건 말이 안 된다"고
말해줄 자리가 없다. 그냥 `false`를 돌려줄 코드로 받아들인다.

그리고 받는 쪽이 `null`이라 `false`도 못 돌려준다. `Object`의 명세에 그 경계가
적혀 있다.

> For any non-null reference value `x`, `x.equals(null)` should return `false`.

**"non-null reference value `x`"** — `x`가 null이 아닐 때의 이야기다. 여기서는
`x` 자리가 null이므로 비교가 시작되기 전에 끝난다.

고치면 두 글자다.

```java
public class SimplePizzaFactory {
    public Pizza createPizza(String type) {
        Pizza pizza = null;
        if (type.equals("cheese")) pizza = new CheesePizza();
        if (type.equals("pepper")) pizza = new PepperoniPizza();
        if (type.equals("clam")) pizza = new ClamPizza();
        if (type.equals("veggie")) pizza = new VeggiePizza();
        return pizza;
    }
}
```

고쳐도 남는 게 있다. **`type`에 아무 문자열이나 들어오면 `null`이 나간다.**
`createPizza("Cheese")`도, `createPizza("치즈")`도, 오타가 난
`createPizza("chese")`도 전부 조용히 `null`이다.

## 오타가 전부 같은 구멍으로 떨어진다

클리핑의 나머지 오타들을 모아보면 하나의 패턴이 보인다.

| 자리 | 쓴 것 | 의도 |
| --- | --- | --- |
| `SimplePizzaFactory` | `"pepper"` | 페퍼로니 |
| `NYPizzaStore` | `"peper"` | 페퍼로니 |
| `ChicagoPizzaStore` | `"peper"` | 페퍼로니 |
| `NYPizzaStore`(추상 팩토리 절) | `"peper"` | 페퍼로니 |

**같은 개념에 세 가지 철자가 쓰였다.** 그리고 어느 것도 컴파일 오류가 아니다.
`PizzaStore`를 쓰는 코드가 `orderPizza("pepperoni")`라고 부르면 네 `if`가 모두
빗나가고 `createPizza`가 `null`을 돌려준다. 그다음 줄에서 터진다.

```java
public Pizza orderPizza (String type){
    Pizza pizza;
    pizza = createPizza(type);
    pizza.prepare();   // ← createPizza가 null을 돌려주면 여기서 NPE
    pizza.bake();
    pizza.cut();
    pizza.box();
    return pizza;
}
```

**예외가 나는 자리와 원인이 있는 자리가 다르다.** 스택 트레이스는
`orderPizza`의 `prepare()` 줄을 가리키고, 실제 문제는 호출한 사람이 넘긴
문자열과 `createPizza` 안의 철자가 안 맞는 것이다.

클래스 이름 쪽 오타는 성격이 다르다.

| 쓴 것 | 의도 |
| --- | --- |
| `new Farlic()` | `Garlic` |
| `new ThinCrustdough()` | `ThinCrustDough` |
| `new Slicedpepperoni()` | `SlicedPepperoni` |
| `new FrozenClam()` / `new Freshclams()` | 짝이 안 맞는 이름 |

이것들은 **컴파일이 안 된다.** 존재하지 않는 타입이니 컴파일러가 바로 잡는다.
같은 글 안에서 **오타가 두 종류로 갈린다** — 타입 이름에 난 오타는 즉시
드러나고, 문자열에 난 오타는 런타임까지 간다.

그 차이가 이 설계의 비용이다. 글이 `new`를 없애려고 공을 들였는데, 그 과정에서
**타입 정보를 문자열로 바꿔버렸다.** `new CheesePizza()`는 클래스 이름을 틀리면
컴파일이 안 되는 코드였다. `createPizza("cheese")`는 그 안전망이 없다.

`"cheese"`를 열거형으로 바꾸면 안전망이 돌아온다. 그리고 패턴 자체는 그대로
남는다 — 바뀌는 부분을 캡슐화한다는 목적과 문자열은 아무 관계가 없다.

## 추상 팩토리 절은 컴파일되지 않는다

두 번째 패턴으로 넘어가는 절의 코드다.

```java
public class NYPizzaStore extends PizzaStore {
    @Override
    public Pizza createPizza(String type){
        Pizza pizza = null;
        PizzaIngredientFactory ingredientFactory = new NYPizzaingredientFactory();
        if(type.equals("cheese")){
            pizza = new CheesePizza(ingredientFactory);
            pizza.setName(ingredientFactory.NY_STYLE+" Cheese Pizza");
        }
        // ...
    }
}
```

두 군데가 막힌다.

**첫째, `ingredientFactory.NY_STYLE`.** `PizzaIngredientFactory`는 같은 글에서
이렇게 선언된다.

```java
public interface PizzaIngredientFactory {
    public Dough createDough();
    public Sauce createSauce();
    public Cheese createCheese();
    public Veggies[] createVeggies();
    public Pepperoni createPepperoni();
    public Clams createClams();
}
```

**`NY_STYLE`이라는 멤버가 없다.** 메소드 여섯 개뿐이다. 있었다 해도 이상한
설계인데, 인터페이스에 `NY_STYLE`을 두면 시카고 팩토리도 그 상수를 갖게 된다.
지역 이름은 **구현체가 각자 갖는 값**이지 인터페이스의 공통 계약이 아니다.

**둘째, `pizza.setName(...)`.** `Pizza` 추상 클래스의 선언을 보면 `getname()`은
있고 `setName()`은 없다.

```java
public abstract class Pizza {
    String name;
    // ...
    public String getname(){
        return this.name;
    }
}
```

`name`이 패키지 전용 필드라 같은 패키지에서는 `pizza.name = ...`으로 쓸 수 있고,
그래서 책의 원본은 `setName`을 추가해두거나 필드에 직접 대입한다. 클리핑은
중간 단계를 옮기지 않았다.

고치면 이렇게 된다. 지역 이름을 팩토리의 책임으로 두는 쪽이 자연스럽다.

```java
public interface PizzaIngredientFactory {
    String getStyleName();   // 구현체마다 다른 값은 메소드로 받는다
    Dough createDough();
    Sauce createSauce();
    Cheese createCheese();
    Veggies[] createVeggies();
    Pepperoni createPepperoni();
    Clams createClams();
}
```

```java
public abstract class Pizza {
    private String name;

    public void setName(String name) { this.name = name; }
    public String getName() { return this.name; }
    // ...
}
```

## 가이드라인 3을 자기 코드가 어긴다

글이 의존성 뒤집기 원칙의 가이드라인 셋을 나열한다. 세 번째가 이것이다.

> **3. 베이스 클래스에 이미 구현되어 있던 메소드를 오버라이드 하지 않는다.**
>
> \- 이미 구현되어 있는 메소드를 오버라이드 한다는 것은 애초부터 베이스 클래스가
> 제대로 추상화 된것이 아니었다고 볼수있다.

그리고 네 화면 위에 이 코드가 있다.

```java
public class ChicagoStyleCheesePizza extends Pizza {
    public ChicagoStyleCheesePizza() { /* ... */ }

    @Override
    public void cut() {
        System.out.println("Cutting the pizza into square slices");
    }
}
```

`Pizza.cut()`은 추상 메소드가 아니다. 대각선으로 자르는 구현이 들어 있고,
시카고 피자가 그걸 네모로 덮어쓴다. **가이드라인 3이 말하는 그 경우다.**

글이 가이드라인을 "항상 지켜야 하는 규칙이 아니라 지향해야하는 바"라고 완충해
두기는 했다. 그런데 이 경우는 완충이 필요한 애매한 상황이 아니다.
**가이드라인이 말한 진단이 정확히 들어맞는다** — 자르는 방식이 지역마다 다르면
`Pizza.cut()`에 구현이 들어 있을 이유가 없다.

그리고 **글 자신이 다른 메소드에는 그 처방을 한다.** 추상 팩토리 절에서
`prepare()`를 이렇게 바꾼다.

```java
public abstract void prepare(); //추상 메소드로 변경됨.
```

`prepare()`는 추상으로 올리고 `cut()`은 오버라이드로 남겼다. 둘은 같은 상황이다
— 지역마다 다른 동작이다.

C# 쪽 용어로 보면 차이가 더 분명하다. 문서의 두 문장이 그대로 대조된다.

> When a base class declares a method as `virtual`, a derived class **can**
> `override` the method with its own implementation.

> If a base class declares a member as `abstract`, that method **must be
> overridden** in any non-abstract class that directly inherits from that class.

`virtual`은 "덮어쓸 수도 있다"이고 `abstract`는 "반드시 덮어써라"다. 구현이
전부 다를 거라면 `abstract`로 선언해서 **빠뜨릴 수 없게** 만드는 쪽이 맞다.
Java에는 `virtual` 키워드가 없고 모든 인스턴스 메소드가 그 자리에 있으므로,
구분이 **구현을 두느냐 마느냐**로만 나타난다.

| 선언 | 서브클래스가 | 빠뜨리면 |
| --- | --- | --- |
| 구현이 있는 메소드 (Java 기본 / C# `virtual`) | 덮어쓸 수도 있다 | 베이스 동작이 쓰인다 |
| `abstract` 메소드 | 반드시 덮어쓴다 | 컴파일되지 않는다 |

마지막 열이 요점이다. `cut()`을 `abstract`로 올리면 **새 지역 분점을 만들 때
자르는 방식을 정하지 않고는 컴파일이 안 된다.** 글이 걱정했던 상황 —
"피자를 자르는 단계를 빼먹거나 하는" — 을 컴파일러가 막아준다.

## `new`는 사라지지 않고 옮겨갔다

글의 마지막 요약에 이름이 하나 틀려 있다.

> **추상 메소드 패턴**: 하나의 추상클래스에서 추상 메소드를 만들고
> **서브클래스들이 그 추상메소드를 구현** 하여 인스턴스를 만들게끔 하는것.

**"추상 메소드 패턴"이라는 패턴은 없다.** 설명 내용은 팩토리 메소드 패턴이
맞다. 두 패턴을 나란히 놓고 차이를 정리하는 그 자리에서 한쪽 이름이 바뀌었다.

이름보다 아쉬운 건 **차이가 무엇인지가 안 적혀 있다는 것**이다. 글이 "구성"을
굵게 표시해두고 넘어갔는데, 그 한 단어가 두 패턴을 가른다. 클리핑의 코드가
그걸 그대로 보여준다.

```java
// 팩토리 메소드 — 상속. 어느 피자를 만들지는 서브클래스가 정한다.
public class NYPizzaStore extends PizzaStore {
    @Override
    public Pizza createPizza(String type) { /* NY 스타일을 new 한다 */ }
}
```

```java
// 추상 팩토리 — 구성. 어느 재료를 쓸지는 넘겨받은 객체가 정한다.
public class CheesePizza extends Pizza {
    private final PizzaIngredientFactory ingredientFactory;

    public CheesePizza(PizzaIngredientFactory ingredientFactory) {
        this.ingredientFactory = ingredientFactory;
    }
}
```

위는 `extends`로 바뀌는 부분을 꽂고, 아래는 **생성자 인자**로 꽂는다. 같은
목적에 다른 수단이다.

| | 팩토리 메소드 | 추상 팩토리 |
| --- | --- | --- |
| 바뀌는 것을 꽂는 방법 | 상속 (`extends`) | 구성 (생성자 인자) |
| 바뀌는 단위 | 제품 하나 | 서로 맞물리는 제품군 |
| 새 변종을 더할 때 | 서브클래스를 하나 만든다 | 팩토리 구현을 하나 만든다 |
| 런타임에 바꿀 수 있나 | 아니다 (타입이 고정) | 그렇다 (다른 팩토리를 넘긴다) |

마지막 줄이 실무에서 갈리는 지점이다. 상속으로 꽂으면 어느 분점인지가
**컴파일 시점에 정해진다.** 구성으로 꽂으면 설정 파일이나 사용자 선택으로
런타임에 바꿀 수 있다.

그리고 글이 끝까지 말하지 않는 것이 하나 있다. **`new`는 사라지지 않았다.**
옮겨갔을 뿐이다. 클리핑의 코드에서 `new`가 있던 자리를 따라가면 이렇다.

| 단계 | `new`가 있는 곳 |
| --- | --- |
| 처음 | `orderPizza` 안 — 주문 절차와 섞여 있다 |
| 간단한 팩토리 | `SimplePizzaFactory.createPizza` |
| 팩토리 메소드 | `NYPizzaStore.createPizza` — 지역별로 하나씩 |
| 추상 팩토리 | `NYPizzaingredientFactory` — 재료별 메소드로 쪼개짐 |

**옮긴 것으로 무엇을 얻었나.** 주문 절차를 고치는 사람과 피자 종류를 더하는
사람이 **다른 파일을 열게 된 것**이다. 그게 이 패턴이 실제로 파는 물건이고,
글의 원칙 — 바뀌는 것과 바뀌지 않는 것을 분리 — 이 말한 그대로다.

그러니 판단 기준도 거기서 나온다. **두 부분이 서로 다른 이유로 다른 속도로
바뀌지 않는다면, 팩토리는 파일 하나를 늘린 것뿐이다.** 추상 팩토리 절에서
`NYPizzaStore.createPizza`가 여전히 `new NYPizzaingredientFactory()`를 직접
부르는 것도 같은 이야기다. 지역과 재료 공장의 짝은 바뀌지 않으므로, 그 `new`는
거기 있어도 된다.

## 어디에 왜 쓰나

### 적을 뽑는 팩토리 하나

게임에서 적을 생성하는 자리에 같은 구조가 나온다. 문자열 대신 열거형을 쓰는
것부터 시작한다.

```csharp
public enum EnemyKind
{
    Grunt,
    Archer,
    Brute,
}
```

```csharp
using UnityEngine;

public interface IEnemyFactory
{
    Enemy Create(EnemyKind kind, Vector3 position);
}
```

클리핑의 `if`-체인을 C#의 switch 식으로 옮기면, **빠뜨린 경우를 컴파일러가
알려준다.**

```csharp
using UnityEngine;

public class SwitchEnemyFactory : MonoBehaviour, IEnemyFactory
{
    [Header("Prefabs")]
    [SerializeField, Tooltip("EnemyKind.Grunt에 해당하는 프리팹")]
    private Enemy _gruntPrefab;

    [SerializeField] private Enemy _archerPrefab;
    [SerializeField] private Enemy _brutePrefab;

    public Enemy Create(EnemyKind kind, Vector3 position)
    {
        // EnemyKind에 값을 더하고 여기를 안 고치면 컴파일 경고가 난다.
        Enemy prefab = kind switch
        {
            EnemyKind.Grunt => _gruntPrefab,
            EnemyKind.Archer => _archerPrefab,
            EnemyKind.Brute => _brutePrefab,
            _ => throw new System.ArgumentOutOfRangeException(nameof(kind)),
        };

        return Instantiate(prefab, position, Quaternion.identity);
    }
}
```

문서가 그 경고를 명시한다.

> In most cases, the compiler generates a warning if a `switch` expression
> doesn't handle all possible input values.

그리고 런타임 쪽 보증도 적혀 있다.

> If none of a `switch` expression's patterns matches an input value, the runtime
> throws an exception. In .NET Core 3.0 and later versions, the exception is a
> `System.Runtime.CompilerServices.SwitchExpressionException`.

클리핑의 `createPizza`는 안 맞으면 **`null`을 돌려주고 호출한 쪽에서 터졌다.**
switch 식은 **그 자리에서 터진다.** `_ => throw`를 직접 써두면 메시지까지
남는다. 예외가 나는 자리와 원인이 있는 자리가 같아진다.

`if`-체인을 아예 없애는 쪽도 있다. 종류와 프리팹의 짝을 데이터로 빼면
`switch`가 필요 없다.

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "EnemyCatalog", menuName = "Game/Enemy Catalog")]
public class EnemyCatalog : ScriptableObject
{
    [Serializable]
    private struct Entry
    {
        public EnemyKind Kind;
        public Enemy Prefab;
    }

    [Header("Catalog")]
    [SerializeField, Tooltip("EnemyKind마다 한 줄. 중복은 Awake에서 걸러진다")]
    private Entry[] _entries;

    private Dictionary<EnemyKind, Enemy> _byKind;

    public Enemy GetPrefab(EnemyKind kind)
    {
        Build();

        if (!_byKind.TryGetValue(kind, out Enemy prefab))
        {
            Debug.LogError($"{kind}에 해당하는 프리팹이 카탈로그에 없다.");
            return null;
        }

        return prefab;
    }

    private void Build()
    {
        if (_byKind != null)
        {
            return;
        }

        _byKind = new Dictionary<EnemyKind, Enemy>(_entries.Length);
        foreach (Entry entry in _entries)
        {
            if (entry.Prefab == null)
            {
                Debug.LogError($"{entry.Kind} 항목의 프리팹이 비어 있다.");
                continue;
            }

            _byKind[entry.Kind] = entry.Prefab;
        }
    }
}
```

둘의 거래가 다르다. `switch` 쪽은 **컴파일러가 빠진 경우를 잡아주고**, 카탈로그
쪽은 **코드를 안 고치고 항목을 더할 수 있다.** 적 종류가 코드로 분기되는 동작을
가진다면 `switch`, 데이터만 다르다면 카탈로그다.

### 서브클래스 대신 ScriptableObject

클리핑의 팩토리 메소드는 `NYPizzaStore extends PizzaStore`로 변종을 더한다.
Unity에서 같은 구조를 쓰면 **변종을 더하는 일이 에셋 하나 만드는 일**이 된다.

`ScriptableObject`가 그 자리다. 문서가 용도를 이렇게 적는다.

> **Saving data as an asset in your project to use at runtime.**

추상 팩토리 메소드를 가진 기반 클래스를 둔다. 클리핑의
`abstract Pizza createPizza(String type)`와 같은 자리다.

```csharp
using UnityEngine;

/// <summary>
/// 적 하나를 어떻게 만들지는 서브클래스가 정한다.
/// PizzaStore의 abstract createPizza와 같은 역할이다.
/// </summary>
public abstract class EnemySpawnRule : ScriptableObject
{
    [Header("Identity")]
    [SerializeField, Tooltip("로그와 디버깅용 이름")]
    private string _displayName;

    public string DisplayName => _displayName;

    public abstract Enemy Create(Vector3 position);
}
```

구현체마다 에셋을 하나 만든다. `CreateAssetMenu`가 그걸 메뉴에 올려준다.

> **CreateAssetMenuAttribute** — Mark a ScriptableObject-derived type to be
> automatically listed in the Assets/Create submenu, so that instances of the type
> can be easily created and stored in the project as '.asset' files.

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "GruntRule", menuName = "Game/Spawn Rule/Grunt")]
public class GruntSpawnRule : EnemySpawnRule
{
    private const float DEFAULT_SPEED = 3f;

    [Header("Prefab")]
    [SerializeField] private Enemy _prefab;

    [Header("Stats")]
    [SerializeField, Range(1, 50)] private int _hp = 5;
    [SerializeField, Range(0.5f, 10f)] private float _speed = DEFAULT_SPEED;

    public override Enemy Create(Vector3 position)
    {
        Enemy enemy = Instantiate(_prefab, position, Quaternion.identity);
        enemy.Initialize(_hp, _speed);
        return enemy;
    }
}
```

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "ArcherRule", menuName = "Game/Spawn Rule/Archer")]
public class ArcherSpawnRule : EnemySpawnRule
{
    private const float ARCHER_SPEED = 2f;

    [Header("Prefab")]
    [SerializeField] private Enemy _prefab;
    [SerializeField] private Projectile _arrowPrefab;

    [Header("Stats")]
    [SerializeField, Range(1, 50)] private int _hp = 3;
    [SerializeField, Range(1f, 20f)] private float _range = 8f;

    public override Enemy Create(Vector3 position)
    {
        Enemy enemy = Instantiate(_prefab, position, Quaternion.identity);
        enemy.Initialize(_hp, ARCHER_SPEED);

        // 궁수만 필요한 조립. 이 분기가 생성 쪽에 있어야 하는 이유다.
        if (enemy.TryGetComponent(out RangedAttack ranged))
        {
            ranged.Configure(_arrowPrefab, _range);
        }

        return enemy;
    }
}
```

쓰는 쪽은 열거형도 `switch`도 필요 없다. **에셋 참조 배열 하나다.**

```csharp
using UnityEngine;

public class WaveTable : MonoBehaviour
{
    [Header("Waves")]
    [SerializeField, Tooltip("인스펙터에서 Spawn Rule 에셋을 끌어다 놓는다")]
    private EnemySpawnRule[] _rules;

    [SerializeField, Range(1, 60)] private int _countPerRule = 5;

    public void SpawnAll(Vector3 origin)
    {
        foreach (EnemySpawnRule rule in _rules)
        {
            if (rule == null)
            {
                Debug.LogError($"{name}의 _rules에 빈 항목이 있다.");
                continue;
            }

            for (int i = 0; i < _countPerRule; i++)
            {
                rule.Create(origin);
            }
        }
    }
}
```

클리핑의 표에서 "런타임에 바꿀 수 있나 — 아니다 (타입이 고정)"라고 적었던 칸이
여기서 뒤집힌다. **`extends`는 코드를 쓰는 일이고 에셋 참조는 필드에 값을
넣는 일이다.** 적 종류를 추가하는 작업이 "스크립트 하나 + 에셋 하나"로 끝나고,
난이도별 웨이브 구성은 기획자가 인스펙터에서 바꾼다.

### 테마가 에셋 묶음을 정한다

클리핑에서 추상 팩토리가 등장하는 이유가 이것이었다.

> 각각 체인점들이 미리 정해놓은 절차를 잘 따르고 있지만 몇몇 체인점들이 자잘한
> 재료를 더 싼 재료로 바꿔서 원가를 절감해 마진을 남기고 있다. 원재료의 품질까지
> 관리하는 방법이 있을까??

**재료가 제각각 섞이는 것**을 막는 게 목적이다. 게임에서 그대로 겹치는 자리가
**스테이지 테마**다. 얼음 스테이지에 용암 바닥이 깔리거나, 사막 적이 눈밭에
나오면 안 된다.

제품군을 한 인터페이스로 묶는다. 클리핑의 `PizzaIngredientFactory`와 같은
모양이다.

```csharp
using UnityEngine;

/// <summary>
/// 한 스테이지 테마가 내놓는 제품군. 넷이 서로 맞물려야 한다.
/// PizzaIngredientFactory와 같은 역할이다.
/// </summary>
public abstract class StageThemeFactory : ScriptableObject
{
    public abstract string ThemeName { get; }

    public abstract GameObject CreateFloorTile(Vector3 position);
    public abstract Enemy CreateMinion(Vector3 position);
    public abstract ParticleSystem CreateHitEffect(Vector3 position);
    public abstract AudioClip GetAmbientLoop();
}
```

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "IceTheme", menuName = "Game/Stage Theme/Ice")]
public class IceThemeFactory : StageThemeFactory
{
    private const float ICE_FRICTION = 0f;

    [Header("Prefabs")]
    [SerializeField] private GameObject _floorPrefab;
    [SerializeField] private EnemySpawnRule _minionRule;
    [SerializeField] private ParticleSystem _hitEffectPrefab;

    [Header("Audio")]
    [SerializeField] private AudioClip _ambientLoop;

    [Header("Physics")]
    [SerializeField, Tooltip("마찰 0, Friction Combine은 Minimum으로 만들 것")]
    private PhysicsMaterial _iceMaterial;

    public override string ThemeName => "Ice";

    public override GameObject CreateFloorTile(Vector3 position)
    {
        GameObject tile = Instantiate(_floorPrefab, position, Quaternion.identity);

        // 조립이 들어가는 자리. 단순 참조 묶음이면 팩토리가 필요 없다.
        if (tile.TryGetComponent(out Collider floorCollider))
        {
            floorCollider.sharedMaterial = _iceMaterial;
        }

        return tile;
    }

    public override Enemy CreateMinion(Vector3 position)
    {
        return _minionRule.Create(position);
    }

    public override ParticleSystem CreateHitEffect(Vector3 position)
    {
        return Instantiate(_hitEffectPrefab, position, Quaternion.identity);
    }

    public override AudioClip GetAmbientLoop()
    {
        return _ambientLoop;
    }
}
```

스테이지는 테마 하나만 받는다. 넷을 따로 받지 않는 게 요점이다.

```csharp
using UnityEngine;

public class StageBuilder : MonoBehaviour
{
    private const int TILE_COUNT = 32;
    private const float TILE_SIZE = 2f;

    [Header("Theme")]
    [SerializeField, Tooltip("테마를 바꾸면 바닥·적·이펙트·음악이 함께 바뀐다")]
    private StageThemeFactory _theme;

    [Header("References")]
    [SerializeField] private AudioSource _ambientSource;

    private void Start()
    {
        if (_theme == null)
        {
            Debug.LogError($"{name}의 _theme이 비어 있다.");
            return;
        }

        for (int i = 0; i < TILE_COUNT; i++)
        {
            _theme.CreateFloorTile(transform.position + Vector3.right * (i * TILE_SIZE));
        }

        _theme.CreateMinion(transform.position + Vector3.forward * 5f);

        _ambientSource.clip = _theme.GetAmbientLoop();
        _ambientSource.Play();

        Debug.Log($"{_theme.ThemeName} 스테이지를 만들었다.");
    }
}
```

**필드가 하나라서 섞일 수가 없다.** 얼음 테마를 넣으면 바닥·적·이펙트·음악이
한 묶음으로 따라온다. 클리핑이 걱정한 "자잘한 재료를 더 싼 재료로 바꾸는" 일이
구조적으로 불가능해진다.

다만 선을 그어둘 게 있다. **넷이 단순 참조일 뿐이라면 팩토리가 아니라 데이터
묶음이면 된다.**

```csharp
using UnityEngine;

/// <summary>
/// 조립할 게 없다면 이걸로 끝난다. 추상 메소드도 서브클래스도 필요 없다.
/// </summary>
[CreateAssetMenu(fileName = "StageThemeData", menuName = "Game/Stage Theme Data")]
public class StageThemeData : ScriptableObject
{
    [Header("Prefabs")]
    public GameObject FloorPrefab;
    public Enemy MinionPrefab;
    public ParticleSystem HitEffectPrefab;

    [Header("Audio")]
    public AudioClip AmbientLoop;
}
```

갈림길은 **만드는 과정에 로직이 있느냐**다. 얼음 바닥에 물리 재질을 꽂는 줄이
있으면 팩토리가 값을 한다. 네 줄이 전부 `Instantiate(참조)`라면 위쪽
`StageThemeData` 하나로 끝나고, 추상 클래스와 서브클래스 셋을 더한 것은 비용만
늘린 것이다.

### 풀에서 꺼내는 팩토리로 바꾸기

팩토리의 쓸모가 분명해지는 자리가 여기다. `Create`가 `Instantiate`를 부르는지
풀에서 꺼내는지를 **호출하는 쪽이 몰라도 되게** 만들 수 있다.

[오브젝트 풀링을 다룬 글](/posts/unity-object-pooling/)에서 본 풀을 그대로
끼운다.

```csharp
using UnityEngine;

public class PooledEnemyFactory : MonoBehaviour, IEnemyFactory
{
    [Header("References")]
    [SerializeField] private EnemyCatalog _catalog;

    public Enemy Create(EnemyKind kind, Vector3 position)
    {
        Enemy prefab = _catalog.GetPrefab(kind);

        if (prefab == null)
        {
            return null;
        }

        // Instantiate 대신 풀에서 꺼낸다. 부르는 쪽 코드는 바뀌지 않는다.
        GameObject instance = PoolManager.Instance.Pop(prefab.gameObject);

        if (instance == null)
        {
            return null;
        }

        instance.transform.position = position;
        return instance.TryGetComponent(out Enemy enemy) ? enemy : null;
    }
}
```

`IEnemyFactory`를 쓰는 쪽은 한 줄도 안 바뀐다.

```csharp
using UnityEngine;

public class WaveSpawner : MonoBehaviour
{
    private const float SPAWN_RADIUS = 12f;

    [Header("References")]
    [SerializeField, Tooltip("SwitchEnemyFactory나 PooledEnemyFactory를 꽂는다")]
    private MonoBehaviour _factorySource;

    private IEnemyFactory _factory;

    private void Awake()
    {
        // 인터페이스는 인스펙터에 안 보이므로 MonoBehaviour로 받아 캐스팅한다.
        _factory = _factorySource as IEnemyFactory;

        if (_factory == null)
        {
            Debug.LogError($"{name}의 _factorySource가 IEnemyFactory가 아니다.");
        }
    }

    public void SpawnWave(EnemyKind kind, int count)
    {
        for (int i = 0; i < count; i++)
        {
            Vector2 offset = Random.insideUnitCircle * SPAWN_RADIUS;
            _factory.Create(kind, transform.position + new Vector3(offset.x, 0f, offset.y));
        }
    }
}
```

이게 클리핑의 원칙이 실제로 돌려주는 것이다. **풀링을 넣는 변경이 `WaveSpawner`
에 닿지 않는다.** 바뀐 파일은 팩토리 하나다.

반대로 `WaveSpawner`가 `Instantiate`를 직접 불렀다면, 풀링을 넣는 작업이
스포너를 부르는 모든 코드로 번진다. 글이 처음에 지적한 그 상황이다.

> 이런 코드가 있다는 것은, 뭔가 변경하거나 확장해야 할 때 코드를 다시 확인하고
> 추가 또는 제거해야 한다는 것을 의미함.

### 쓰지 말아야 할 자리

**종류가 하나인 것에 팩토리를 두는 것.** 적이 한 종류면 `Instantiate`를 직접
부르는 쪽이 읽기 쉽다. 팩토리는 **분기가 생길 때** 값을 하기 시작한다. 분기가
생길 "예정"일 때가 아니라 생겼을 때다.

**타입을 문자열로 받는 것.** 이 글의 모든 사고가 거기서 났다. 열거형이든
`ScriptableObject` 참조든, **철자를 틀리면 컴파일이 안 되는 것**으로 받는다.
외부에서 문자열이 들어오는 경계(서버 응답, 설정 파일)가 있다면 그 경계에서
한 번만 열거형으로 바꾸고, 안쪽은 전부 열거형으로 다닌다.

**구현이 다 다른 메소드에 베이스 구현을 두는 것.** 가이드라인 3의 그 경우다.
서브클래스가 전부 덮어쓸 메소드라면 `abstract`로 선언한다. 하나라도 빠뜨리면
컴파일이 안 되는 쪽이, 빠뜨린 걸 런타임에 발견하는 쪽보다 싸다.

**팩토리 `ScriptableObject`에 상태를 두는 것.** 에셋은 모든 씬이 공유하는 하나의
객체다. "지금까지 몇 마리 뽑았는지"를 팩토리 SO의 필드에 두면, 에디터에서는 그
값이 플레이를 멈춘 뒤에도 남고 빌드에서는 안 남는다. 문서가 그 차이를 적어뒀다.

> In the Unity Editor, you can save data to ScriptableObjects in Edit mode and
> Play mode. In a standalone Player at runtime, **you can only read saved data
> from the ScriptableObject assets.**

**에디터와 빌드가 다르게 동작한다.** 팩토리 SO는 읽기만 하는 설정으로 두고,
세는 일은 씬 쪽 `MonoBehaviour`에 둔다.

**추상 팩토리로 "나중에 바꿀 수 있게" 해두는 것.** 제품군이 실제로 **맞물려서**
바뀔 때만 값이 있다. 피자 예제가 설득력 있는 건 반죽·소스·치즈가 **같은 지역의
것끼리 쓰여야** 하기 때문이다. 서로 독립적으로 고를 수 있는 값 세 개라면
팩토리 인터페이스가 아니라 설정 객체 하나면 된다.

## 정리

이 글의 개념 설명은 교과서대로다. 바뀌는 것과 바뀌지 않는 것을 분리한다는
원칙에서 출발해서, 간단한 팩토리는 패턴이 아니라고 선을 긋고, 의존성 뒤집기
원칙의 화살표 방향까지 보여준다. 읽고 나면 무엇을 검색해야 하는지 알게 된다.

코드는 셋 다 깨져 있다. 첫 예제는 `type` 대신 `pizza`를 비교해서
**`NullPointerException`**이고, 추상 팩토리 절은 인터페이스에 없는 `NY_STYLE`과
선언되지 않은 `setName`으로 **컴파일되지 않고**, 요약의 패턴 이름 하나가
**"추상 메소드 패턴"**으로 바뀌어 있다. 그리고 가이드라인 3을 적어둔 같은 글에서
`ChicagoStyleCheesePizza`가 `Pizza.cut()`을 오버라이드한다.

깨진 방식이 전부 같다. **타입을 문자열로 받으면 컴파일러가 볼 수 있는 게
없다.** `pizza.equals("cheese")`가 컴파일되는 것도, `"peper"`와 `"pepper"`가
섞여도 아무 일이 없는 것도, 안 맞을 때 `null`이 나가서 **호출한 쪽에서
터지는** 것도 한 뿌리다. `new CheesePizza()`에는 있던 안전망을
`createPizza("cheese")`가 버렸다.

버릴 이유가 없었다는 게 요점이다. 열거형으로 받으면 패턴은 그대로 남고 안전망도
돌아온다. **바뀌는 부분을 캡슐화하는 일과 그 부분을 문자열로 표현하는 일은 아무
관계가 없다.**

---

### 참고

- [Object.equals — Java SE 21 API 명세](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)
- [JEP 441: Pattern Matching for switch — OpenJDK](https://openjdk.org/jeps/441)
- [switch 식 — C# 언어 레퍼런스](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression)
- [ScriptableObject — Unity 매뉴얼](https://docs.unity3d.com/6000.2/Documentation/Manual/class-ScriptableObject.html)
- [CreateAssetMenuAttribute — Unity 스크립팅 레퍼런스](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/CreateAssetMenuAttribute.html)
- [상속: abstract와 virtual — C# 문서](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance)

이 글의 출발점이 된 자료는 [램쥐뱅 — 디자인패턴 - 팩토리 패턴 (factory pattern)](https://jusungpark.tistory.com/14)
(2016-05-12)이고, 그 글이 따라간 책은 *Head First Design Patterns*다. 거기 실린
세 단계의 코드를 한 줄씩 따라가면서, 컴파일되는 오타와 컴파일되지 않는 오타를
갈라보고 열거형 쪽 대안을 Java·C# 언어 문서에 대조했다.
