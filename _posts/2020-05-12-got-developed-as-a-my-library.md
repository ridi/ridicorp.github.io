---
layout: blog_post
title: "개발했더니 내 서재였던 건에 대하여"
description: "길거리에서 난데없이 정신을 잃은 25살의 나이스 가이. 정신을 차리고 자신의 몸을 확인해보니, 개발자가 되어버렸다!"
header-img: "blog/img/bg-4.jpg"
date: 2020-05-12
author: hyunjoon.park
category: engineering
published: true
---

리디 계정팀에서는 유저가 구매한 책을 조회할 수 있는 [내 서재]라는 서비스를 운영하고 있습니다. [내 서재]를 개발하면서 여러 요구사항 변화들이 있었습니다. 이에 대응해 개발하던 중 RDBMS와 관련해 문제들이 발생했습니다. 그 문제들을 서브쿼리, 데이터 후보정, 역정규화 등을 이용해 해결했습니다. 이번 글에서는 위와 같이 [내 서재]를 개발하면서 겪은 문제, 그리고 해결방법에 대해 이야기해드리고자 합니다. 

그럼, 시작하겠습니다! 

## 내가 리디의 개발자라니 절대 무리!

나는 리디에 막 입사한 개발자(리발자). 입사하자마자 새로운 업무를 맡았다. 유저가 구매한 책을 [내 서재]에서 보여줘야 한다. 딱히 어려운 문제는 없을 것 같다고 생각하는 순간, 옆에서 PM이 말을 걸어 온다.

PM👨‍⚖️ : 리발자님! 리디에 오신 걸 환영합니다! 저희 리디에는 리디북스라는 한국의 전자책 서비스가 있습니다. 안드로이드, iOS, Windows, macOS를 지원하는 전자책 서비스 앱이 있으며 자체 전자책 리더인 리디페이퍼도 출시한 걸 아시나요? 흠흠… 소개는 이 정도만 하고, 개발을 진행하시기 전에 간단한 퀴즈를 하나 풀어보고 가는 게 좋을 것 같아서 찾아왔습니다! 아래 퀴즈를 한 번 풀어보시겠어요?

### 🤹‍♀️Quiz!
PM👨‍⚖️: [내 서재]에는 책이 몇 권 있을까요?

![intro-1](/blog/img/2020-05-12/intro-1.png)

![intro-2](/blog/img/2020-05-12/intro-2.png)


PM👨‍⚖️ : 7권? 아닙니다!

![intro-3](/blog/img/2020-05-12/intro-3.png)

PM👨‍⚖️ : 정답은 총 11권입니다! 

연재 도서 같은 시리즈 책의 경우, 여러 권의 책을 하나의 표지로 묶어서 보여주고 있습니다. 따라서 [약탈혼]은 3권, [SSS급 촉수 괴물이 지능을 얻음!]이 3권 있어서 실제로는 총 11권이 있습니다. 즉, 시리즈의 경우 실제로는 여러 책이 존재하지만 묶어서 하나의 도서만 보여주도록 만들어야 합니다.

이 요구사항을 염두에 두시면서 [내 서재]를 개발해주세요!
<br>

### 🎯New Quest
- 유저가 구매한 책을 조회할 수 있는 [내 서재] 서비스를 개발해주세요.
- 연재 도서 같은 시리즈 책의 경우 묶어서 하나로 보여주세요.

<br>

라고 말하며 PM은 홀연히 사라져버렸다. 나는 또 귀찮게 되었군, 이라든가, 도대체 날 가만두지 않는단 말이야, 따위의 이런저런 생각을 하며 다시 책상 앞에 앉기로 했다.

그렇다면… 어떻게 개발하는 게 좋을까?

## 개발 중입니다만, 문제라도?

리발자는 입사 이후 증정되는 최고 사양의 업무 장비 및 유료 소프트웨어를 받고 자리로 향했다. 그는 사용자의 체형 및 자세 변화에 따라 적절한 높이로 목과 머리를 편안하게 하는 의자에 앉아 [내 서재]를 개발하는 데 필요한 모델들을 생각해보기로 했다.

[내 서재]를 만들기 위해서는 책, 시리즈, 유저, 구매 이력이 필요하다.

1. 책: 책 제목, 정보, 이미지 등 책 정보가 담겨있는 모델
2. 시리즈 : 여러 책을 하나로 묶어주는 데 필요한 모델
3. 유저: 책을 구매 혹은 대여하여 [내 서재]에 소장할 수 있는 모델
4. 구매 이력: 유저가 특정 책을 구매하거나 대여한 이력. 대여인 경우에는 만료 시점에 대한 정보도 담김

위에서 생각했던 모델들을, 테이블로 정의(**定義**)한다.

![schema-1](/blog/img/2020-05-12/schema-1.png)

위의 테이블을 이용하면 유저가 구매한 책의 정보들을 추출할 수 있다. 각 테이블을 조인해서 아래와 같이 쿼리를 날려보자.

<pre><code><span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
	book.title <span style="color:#196b9f">AS</span> book_title, 
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id;
</code></pre>

→ しまった(시맛타)! PM의 말을 깜빡했군. 

![query-result-1](/blog/img/2020-05-12/query-result-1.png)

시리즈별로 책을 묶어서 보여주기로 했으니까, GROUP BY를 이용해서 묶어서 보여주자.

<pre><code><span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
	book.title <span style="color:#196b9f">AS</span> book_title, 
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date <span style="color:#196b9f">
<span style="color:#196b9f">FROM</span></span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<b><span style="color:#196b9f">GROUP BY</span> series.id</b>;
</code></pre>

→ 실행 결과를 보면, 시리즈별로 한 권의 데이터를 보여주는 걸 알 수 있다.

![query-result-2](/blog/img/2020-05-12/query-result-2.png)

쉽다. 개발. 끝.

이라고 생각한 순간, PM이 머리를 빼꼼 내밀며 말했다.

<br>

PM👨‍⚖️ : 앗차차 리발자님, 시리즈의 경우 만료가 가장 먼저 되는 책 기준으로 데이터를 보여줬으면 좋겠습니다! 아무래도 유저 입장에서는 만료될 책을 빨리 봐야 좋을 테니까요!

### 🎯New Quest

- 만료 시점으로 정렬해서 책을 보여주세요.

<br>

やれやれ(야레야레)... 새로운 요구 사항인가. 나는 ORDER BY를 추가해보기로 했다.

<pre><code><span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
	book.title <span style="color:#196b9f">AS</span> book_title, 
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">GROUP BY</span> series.id
<b><span style="color:#196b9f">ORDER BY</span> expire_date;</b>
</code></pre>

→ 그런데 결과를 보면 조금 이상하다. 위의 책 정보를 보면 '달빛조각사 2권'이 '달빛조각사 1권'보다 먼저 만료된다. 그래서 달빛조각사 2권을 반환해줘야 하는데, 1권을 준 걸 알 수 있다.


![query-result-3](/blog/img/2020-05-12/query-result-3.png)

<br>

그 이유는 쿼리의 실행 순서 때문이었다. 

쿼리는 GROUP BY → ORDER BY 순으로 실행되기 때문이다. 즉, 그룹핑을 해버린 이후에 정렬하기 때문이다. 정렬 이후에 그룹핑을 하고 싶은 경우라면, 서브쿼리를 이용해서 해결해야 한다. 따라서 쿼리를 아래처럼 바꾼다. 

<pre><code><b><span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> (</b>
	<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
		book.title <span style="color:#196b9f">AS</span> book_title, 
		library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
	<span style="color:#196b9f">FROM</span> book 
	<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
	<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
	<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
	<span style="color:#196b9f">ORDER BY</span> expire_date
<b>) sub <span style="color:#196b9f">GROUP BY</span> sub.series_id;</b>
</code></pre>

→  그러나 같은 결과를 뱉는다. 

![query-result-4](/blog/img/2020-05-12/query-result-4.png)

그 이유는 바로 MySQL Optimizer에서 내부적으로 파생 테이블을 병합해버리기 때문이었다.

> 파생 테이블(Derived Table)은 쿼리가 실행될 때 FROM 절 아래에 서브쿼리로 만들어진 테이블을 말합니다. 쿼리 실행 시에 내부 작업으로 메모리/디스크 상에 가상의 테이블을 생성하게 됩니다. 그러나 때에 따라 필요 없는 가상 테이블 생성 작업을 줄이기 위해서 병합해서 쿼리를 실행하게 됩니다. [관련 링크](https://dev.mysql.com/doc/refman/5.7/en/derived-table-optimization.html)


<br>
실행 계획을 확인해보면, SELECT 타입을 통해 결괏값을 얻는 것으로 보아 가상 테이블을 생성하지 않고 병합되었다는 걸 다시 한 번 확인할 수 있었다.

<pre><code><b><span style="color:#196b9f">EXPLAIN</span></b> <span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> (
	<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
		book.title <span style="color:#196b9f">AS</span> book_title, 
		library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
	<span style="color:#196b9f">FROM</span> book 
	<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
	<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
	<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
	<span style="color:#196b9f">ORDER BY</span> expire_date
) sub <span style="color:#196b9f">GROUP BY</span> sub.series_id;
</code></pre>

→ select_type이 모두 SIMPLE 로 구성되어 있다.
![explain-1](/blog/img/2020-05-12/explain-1.png)

<br>
즉, 1번 쿼리가 내부적으로 병합되어 2번과 같이 처리되었다는 걸 의미한다.

<pre><code>1. 
<b><span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> (</b>
	<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
		book.title <span style="color:#196b9f">AS</span> book_title, 
		library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
	<span style="color:#196b9f">FROM</span> book 
	<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
	<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
	<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
	<span style="color:#196b9f">ORDER BY</span> expire_date
<b>) sub <span style="color:#196b9f">GROUP BY</span> sub.series_id;</b>

2. 
<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
	book.title <span style="color:#196b9f">AS</span> book_title,
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series On series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<b><span style="color:#196b9f">GROUP BY</span></b> series.id 
<span style="color:#196b9f">ORDER BY</span> expire_date;
</code></pre>

그러나 나는 병합을 하고 싶지 않다. 서브쿼리에서 만들어졌던 순서를 유지한 채로 GROUP BY를 적용하고 싶기 때문이다. 그렇다면 어떻게 해야 할까? 두 가지 방법이 있다. 

1. MySQL Optimizer 전체 쿼리 병합 옵션을 해제하는 방법이 있다. optimizer_switch 라는 시스템 변수를 설정하면 된다([관련 링크](https://dev.mysql.com/doc/refman/5.7/en/switchable-optimizations.html)). 그러나 그렇게 하면 다른 쿼리들도 영향을 받아 성능이 저하될 수 있으므로 사용하지 않겠다.
2. 서브쿼리에 병합이 불가능한 옵션을 설정하면 된다. 병합이 불가능한 조건은 AGGREGATE Function, LIMIT, GROUP BY, HAVING 등이 있다. ([관련 링크](https://dev.mysql.com/doc/refman/5.7/en/derived-table-optimization.html)) 

<br>
나는 2번 방식으로 결정했다. 서브쿼리 내에 LIMIT 을 걸어주면, 병합할 수 없게 되어 가상 테이블을 생성하고, 가상 테이블 내에서 ORDER BY 의 순서가 보장될 테니까 말이다.

<pre><code><span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> (
	<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
		book.title <span style="color:#196b9f">AS</span> book_title, 
		library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
	<span style="color:#196b9f">FROM</span> book 
	<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
	<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
	<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
	<span style="color:#196b9f">ORDER BY</span> expire_date 
	<b><span style="color:#196b9f">LIMIT</span> 2147483647</b>
) sub <span style="color:#196b9f">GROUP BY</span> sub.series_id;
</code></pre>

→ expire_date 와 book_title 이 모두 달빛조각사 2권의 데이터로 변경된 걸 확인할 수 있다!

![query-result-5](/blog/img/2020-05-12/query-result-5.png)

<br>

실행 계획 또한 확인해보면 DERIVED, 가상 테이블을 생성함을 알 수 있다.
<pre><code><b><span style="color:#196b9f">EXPLAIN</span></b> <span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> (
	<span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
		book.title <span style="color:#196b9f">AS</span> book_title, 
		library_item.expire_date <span style="color:#196b9f">AS</span> expire_date 
	<span style="color:#196b9f">FROM</span> book 
	<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
	<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
	<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
	<span style="color:#196b9f">ORDER BY</span> expire_date 
	<span style="color:#196b9f">LIMIT</span> 2147483647
) sub <span style="color:#196b9f">GROUP BY</span> sub.series_id;
</code></pre>

→ select_type 이 DERIVED 로 변경되었다!

![explain-2](/blog/img/2020-05-12/explain-2.png)


결국, 아래와 같은 요구사항을 모두 해결할 수 있었다.

### 🔮Quest Complete

- 유저가 구매한 책을 조회할 수 있는 [내 서재] 서비스를 개발해주세요. 
	- book, series, sereis_member, user, library_item 등의 테이블을 조인했다.
- 연재 도서 같은 시리즈 책의 경우 묶어서 하나로 보여주세요.
    - series.id로 GROUP BY 했다.
- 묶을 때, 만료가 가장 먼저 되는 책 기준으로 데이터를 보여주세요.
    - 서브쿼리를 사용해 정렬 이후 GROUP BY를 했다. 
	- 이때, 자동 병합이 되지 않도록 LIMIT을 설정했다.

## 데이터 보정? 그거 어떻게 하는 건데

잠시 뒷짐을 지고 만들어놓은 [내 서재] 서비스를 보면서 흐뭇하게 웃음 짓던 도중 리발자는 갑자기 귓가에 들려오는 날카로운 휘파람 소리에 소리가 들려오는 쪽으로 시선을 돌렸다.

두두두두두-! 

저 멀리 리디로 통하는 관도 위에 PM이 말을 탄 채로 곧장 달려오고 있었다. 거친 숨을 몰아쉬며 여정을 마친 PM이 리발자에게 다가왔다.

<br>

👨‍⚖️PM: 헉헉.. 리발자님!!! 만료일 기준으로 책을 보여주니까, 만료된 책만 보여서 유저들의 클릭이 줄어들었어요! 예를 들어서 

1. 달빛조각사 1권 : 석 달 전에 <span style="color:red">만료된</span> 책
2. 달빛조각사 2권 : 일주일 후에 <span style="color:blue">만료될</span> 책

이 있을 때 만료일 기준으로 빠른 달빛조각사 1권을 보여줘서 전부 만료된 줄 알았다는 유저가 많더라고요!

그래서 시리즈를 묶어줄 때 <span style="color:red">만료된</span> 책보다는 <span style="color:blue">만료될</span> 책을 보여주는 게 좋을 것 같아요! 현재 시각 기준으로 만료되지 않은 책이 있다면 그중 가장 빨리 만료될 책을, 만약 모두 만료되었다면 그중 가장 최근에 만료된 책을 보여주도록 해주세요!

### 🎯New Quest

- '만료될 책 중에, 가장 빨리 만료될 시간' 을 내려주세요.
- 만약 없다면, '만료될 책 중에, 가장 빨리 만료될 시간' 을 내려주세요.

<br>

자, 그러면 쿼리를 통해 '만료될 책 중에, 가장 빨리 만료될 시간' 을 찾아보자.

<pre><code><span style="color:#196b9f">SELECT</span> <b><span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series on series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">WHERE</span> <b>expire_date > <span style="color:#d23255">NOW</span>()</b>
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

'만료될 책 중에, 가장 빨리 만료될 시간' 이 없다면, '만료된 책 중에, 가장 늦게 만료된 시간'을 아래 쿼리로 돌려주도록 만들면 될 것 같다.

<pre><code><span style="color:#196b9f">SELECT</span> <b><span style="color:#d23255">MAX</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series on series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">WHERE</span> <b>expire_date < <span style="color:#d23255">NOW</span>()</b>
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

고작 이 정도인가? 시시해서 죽고 싶어졌다.

라고 생각하는 순간 어김없이 PM이 다가왔다.

<br>

👨‍⚖️PM: 리발자님. 좋은 소식을 알려드리려고 왔습니다! ^^ 이제 [리디셀렉트]라는 서비스를 착수해보려고 합니다! [리디셀렉트]란 이번에 새롭게 기획한 전자책 월정액 서비스입니다! 매월 일정 금액을 내면 수많은 베스트셀러를 무제한으로 볼 수 있는 그야말로 독자들의 천국 같은 서비스죠! 흠흠… 아무튼! [내 서재]에서 [리디셀렉트]의 책인지, 기존 상점으로 서비스하고 있는 책인지 알려주시고, 서비스에 따라 조회할 수 있도록 필터를 추가해주세요! 넣어주실 수 있죠?

### 🎯New Quest

- 책에 따라 서비스 타입(리디셀렉트 혹은 기존 서점에서 구매)을 알려주세요.
- 서비스 타입에 따른 필터를 넣어주세요.

<br>

그렇다면 구매 이력 모델에 서비스 타입 칼럼을 추가하자.

- 구매 이력: 유저가 특정 책을 구매한 정보, 책이 만료되는 정보, <span style="color:green">서비스 타입</span>이 담긴 구매 이력 모델

테이블에도 아래와 같이 칼럼을 추가했다. <span style="color:green">service_type</span> 은 0(일반 서점), 1(리디셀렉트)로 이루어져 있다.

![schema-2](/blog/img/2020-05-12/schema-2.png)

그러면 이제 서비스 타입을 포함해서 조회해보자.

<pre><code><span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> series_title, 
	book.title <span style="color:#196b9f">AS</span> book_title,
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date, 
	<b>library_item.service_type <span style="color:#196b9f">AS</span> service_type</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">JOIN</span> user <span style="color:#196b9f">ON</span> library_item.user_id = user.id;
</code></pre>

→ 정상적으로 조회된다. 여기서 <span style="color:purple">'달빛조각사 1권'</span>의 서비스 타입은 <span style="color:purple">0(일반 서점)</span>, <span style="color:orange">'달빛조각사 2권'</span>의 서비스 타입은 <span style="color:orange">1(리디셀렉트)</span>로 구매했다는 것에 유념하자.

![query-result-6](/blog/img/2020-05-12/query-result-6.png)

<br>

자 그러면, 만료 기간을 보여달라는 요구사항을 유지한 채로 시리즈별로 묶어서 내려주자.

<pre><code><span style="color:#196b9f">SELECT</span> series.title <span style="color:#196b9f">AS</span> title, 
	<span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date, 
	<b>library_item.service_type <span style="color:#196b9f">AS</span> service_type</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">JOIN</span> user <span style="color:#196b9f">ON</span> library_item.user_id = user.id 
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>() 
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

→ 그런데 결괏값이 이상하다. 뭐가 이상한지 보이는가?

![query-result-7](/blog/img/2020-05-12/query-result-7.png)

MIN(expire_date)으로 선택한 값이 <span style="color:orange">18:25분</span> 이므로 <span style="color:orange">달빛조각사 2권</span>이다. 즉, <span style="color:orange">service_type 이 1</span>어야 하는데 <span style="color:purple">0을 내려주고 있다.</span> expire_date 는 최솟값을 가져오지만, service_type 은 그저 GROUP BY로 잡힌 데이터의 첫 번째 값을 가져오기 때문에 일치하지 않는다.

<br>

따라서 이런 데이터 불일치를 보정해주기 위해서 아래와 같이 쿼리를 분리하기로 했다.

1. 만료 기간의 요구사항에 일치하는 series_id 와 expire_date를 찾는다.
2. 해당 series_id 와 expire_date를 가지고 있는 library_item의 service_type을 찾는다.

자, 그러면 만료 기간 요구사항을 충족하는 series_id 와 expire_date 를 구해보자.

<pre><code><span style="color:#196b9f">SELECT</span> <b>series.id <span style="color:#196b9f">AS</span> series_id,</b>
	series.title <span style="color:#196b9f">AS</span> title,
	<b><span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>() 
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

→ <span style="color:orange">18:25, 달빛조각사 2권</span>을 가져온 걸 알 수 있다. 

![query-result-8](/blog/img/2020-05-12/query-result-8.png)

그리고 이 series_id 와 expire_date 를 가지고 있는 library_item 을 찾아서 service_type 을 알아내자!

<pre><code><span style="color:#196b9f">SELECT</span> book.title <span style="color:#196b9f">AS</span> book_title, 
	<b>library_item.service_type <span style="color:#196b9f">AS</span> service_type</b> 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id 
<span style="color:#196b9f">WHERE</span> <b>series_id = 1 <span style="color:#946f44">AND</span> expire_date="2020-06-11 18:25:22"</b> 
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

→ <span style="color:orange">service_type이 1인 달빛조각사 2권</span>을 가져왔다.

![query-result-9](/blog/img/2020-05-12/query-result-9.png)

<br>

이렇게 데이터 후보정을 통해 올바른 서비스 타입을 내려주는 걸 성공했다. 그러면 이제 서비스 타입에 따른 필터도 넣어주자. 방법은 간단하다. 첫번째 쿼리에 where 절을 추가하면 된다. <span style="color:purple">service_type 이 0</span>인 책만 조회하고 싶다고 해보자.

<pre><code><span style="color:#196b9f">SELECT</span> series.id <span style="color:#196b9f">AS</span> series_id, 
	series.title <span style="color:#196b9f">AS</span> title,
	<span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>() <span style="color:#946f44">AND</span> <b>service_type = 0</b>
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

→ <span style="color:purple">service_type이 0인 '달빛조각사 1권'</span>의 expire_date 를 가져오게 되었다. 그러면 두 번째 쿼리에서 찾을 때, expire_date 를 이용해 service_type 을 보정할 수 있게 된다.

![query-result-10](/blog/img/2020-05-12/query-result-10.png)

<br>

결국, 아래와 같은 요구사항을 모두 해결할 수 있었다.

### 🔮Quest Complete

- '만료될 책 중에, 가장 빨리 만료될 시간' 을 내려주세요.
    - SELECT **MIN(library_item.expire_date)** WHERE **expire_date > NOW()** 
- 만약 없다면, '만료될 책 중에, 가장 빨리 만료될 시간' 을 내려주세요.
    - SELECT **MAX(library_item.expire_date)** WHERE **expire_date < NOW()** 
- 책에 따라 구매 타입(리디셀렉트 혹은 기존 상점에서 구매)을 알려주세요.
    - library_item 에 service_type 칼럼을 추가했다.
	- 쿼리를 2번 해서 서비스 타입 데이터를 보정했다.
- 구매 타입에 따른 필터를 넣어주세요.
    - where 절에 service_type 필터를 넣었다.

## 역정규화, 강림.

리디에서 제공하는 매일 색다른 샐러드 조식 및 제철 손질 과일로 아침 식사를 마친 리발자와 PM은 휴식 공간에 나와 가볍게 홍차를 즐기며 휴식을 취하고 있었다. 

"그래, 리디의 정세는 어떻던가?" 잠시 세상 돌아가는 얘기를 잡담 삼아 나누던 두 사람은 분위기가 무르익자 슬슬 본론으로 들어갔다. 이번에도 새로운 요구가 어김없이 생기고 말았다. 도대체 하늘은 날 가만히 내버려두지 않는군. 

<br>

👨‍⚖️ PM: 리발자님! 이번에는 책에 제목, 저자, 카테고리 등을 추가하고 싶어요. 그리고 책의 제목 순, 저자 순, 카테고리별 필터 기능 등을 추가하고 싶습니다!

### 🎯New Quest

- 책 정보에 제목, 저자, 카테고리를 추가해주세요.
- 제목 순, 저자 순 정렬 기능과 카테고리별 필터 기능을 넣어주세요.

<br>

그렇다면 모델을 다음과 같이 확장해야 한다.

- 책: 책 제목, <span style="color:green">작가, 카테고리</span> 등 책 정보가 담겨있는 모델
- <span style="color:green">카테고리: 책의 종류가 담겨있는 모델</span>

그래서 다음과 같이 칼럼과 테이블을 추가했다.

![schema-3](/blog/img/2020-05-12/schema-3.png)

이제 테이블을 조인해서 데이터를 조회해보자!

<pre><code><span style="color:#196b9f">SELECT</span> series.id <span style="color:#196b9f">AS</span> series_id, 
	<b>category.name <span style="color:#196b9f">AS</span> category_name,
	book.author <span style="color:#196b9f">AS</span> author,</b>
	series.title <span style="color:#196b9f">AS</span> title,
	<span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<b><span style="color:#196b9f">JOIN</span> category <span style="color:#196b9f">ON</span> book.category_id = category.id</b>
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>()
<span style="color:#196b9f">GROUP BY</span> series.id;
</code></pre>

→ 잘 나온다.

![query-result-11](/blog/img/2020-05-12/query-result-11.png)

<br>

그러면 이제 작가 순, 제목 순 정렬을 넣어주자! 방법은 간단하다. 쿼리에 ORDER BY 절만 추가하면 된다.

<pre><code><span style="color:#196b9f">SELECT</span> series.id <span style="color:#196b9f">AS</span> series_id, 
	<b>category.name <span style="color:#196b9f">AS</span> category_name,
	book.author <span style="color:#196b9f">AS</span> author,</b>
	series.title <span style="color:#196b9f">AS</span> title,
	<span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<b><span style="color:#196b9f">JOIN</span> category <span style="color:#196b9f">ON</span> book.category_id = category.id</b>
<span style="color:#196b9f">JOIN</span> user <span style="color:#196b9f">ON</span> library_item.user_id = user.id 
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>()
<span style="color:#196b9f">GROUP BY</span> series.id 
<b><span style="color:#196b9f">ORDER BY</span> series.title</b>;
</code></pre>

→ 시리즈별로 묶인 데이터가 제목 순으로 데이터가 내려오고 있다. 

![query-result-12](/blog/img/2020-05-12/query-result-12.png)

위와 비슷한 방식으로 작가 순 정렬도 가능하다. 또한, WHERE 절을 추가해서 series_id 에 따라 필터링을 걸 수 있었다.

어김없이 불안감이 찾아온 걸 느껴보니, PM이 숨길이 느껴질 정도로 내게 바싹 붙어 말을 걸었다.

<br> 

👨‍⚖️ PM: 축하드려요 리발자님!!! [내 서재]가 무럭무럭 성장해 책 2,700만 권, 구매 목록 2,000만 개 이상을 달성했습니다!!! 저희 둘 다 연말 보너스는 떼 놓은 당상이에요! 그런데… 너무 느리다는 고객들의 문의 사항이 자주 오고 있습니다. ㅠㅠ API 응답 시간을 낮출 방법이 없을까요?? 300ms까지 내려주셔야 합니다!!

### 🎯New Quest

- API 응답 시간을 300ms 이하로 만들어주세요.

<br>

우선, 속도가 느린 곳을 찾아보니 아래와 같은 데이터를 조회할 때 오랜 시간이 걸리고 있었다. 

- 유저 필터 + 카테고리 필터 + 제목 순 정렬
- 유저 필터 + 카테고리 필터 + 작가이름순 정렬
- 유저 필터 + 서비스 필터 + 제목 순 정렬
- 유저 필터 + 서비스 필터 + 제목 순 정렬

예를 들어서 user_id 가 3인 유저가 category_id=3인 책들에 대해 제목 순으로 정렬해서 책을 조회한다면, 

<pre><code><span style="color:#196b9f">SELECT</span> series.id <span style="color:#196b9f">AS</span> series_id, 
	category.name <span style="color:#196b9f">AS</span> category_name,
	book.author <span style="color:#196b9f">AS</span> author,
	series.title <span style="color:#196b9f">AS</span> title,
	<span style="color:#d23255">MIN</span>(library_item.expire_date) <span style="color:#196b9f">AS</span> expire_date 
<span style="color:#196b9f">FROM</span> book
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">JOIN</span> category <span style="color:#196b9f">ON</span> book.category_id = category.id
<span style="color:#196b9f">JOIN</span> user <span style="color:#196b9f">ON</span> library_item.user_id = user.id 
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>() <span style="color:#946f44">AND</span> user.id = 3 <span style="color:#946f44">AND</span> category_id = 3
<span style="color:#196b9f">GROUP BY</span> series.id 
<span style="color:#196b9f">ORDER BY</span> series.title;
</code></pre>

→ 소요되는 시간이 무려 **7.97s가 걸린다!** 이는 서비스가 불가능한 수준이다. (실제로 2,000만 건을 넣고 돌린 결과)

![query-result-13](/blog/img/2020-05-12/query-result-13.png)

이 쿼리들의 속도를 향상하기 위해서는 DB Index를 생성해줘야 한다. 그런데, MySQL은 다중 테이블에 인덱스를 걸 수가 없다. 또한, 각 테이블에 인덱스를 걸어봤자, 조인하면서 인덱스의 순서가 보장되지 않아 성능 향상에 크게 도움이 되지 않는다. 

<br>

그래서 읽기 성능 개선을 위해 [역정규화]를 <b>시.전.한.다.</b>

<span style="color:green">combined_library_item</span> 테이블을 만들어보자.

![schema-4](/blog/img/2020-05-12/schema-4.png)

이 테이블에 다른 테이블들의 데이터를 모아서 넣어보자. 

<pre><code><b><span style="color:#196b9f">INSERT INTO</span> combined_library_item</b>
 	(book_id, user_id, category_id, series_id, service_type, 
	expire_date, book_title, series_title, book_author) 
<span style="color:#196b9f">SELECT</span> book.id <span style="color:#196b9f">AS</span> book_id, user.id <span style="color:#196b9f">AS</span> user_id, 
	category.id <span style="color:#196b9f">AS</span> category_id, series.id <span style="color:#196b9f">AS</span> series_id,
	library_item.service_type <span style="color:#196b9f">AS</span> service_type, 
	library_item.expire_date <span style="color:#196b9f">AS</span> expire_date,
	book.title <span style="color:#196b9f">AS</span> book_title, series.title as series_title,
	book.author <span style="color:#196b9f">AS</span> book_author <span style="color:#196b9f">FROM</span> book 
<span style="color:#196b9f">JOIN</span> series_member <span style="color:#196b9f">ON</span> series_member.book_id = book.id
<span style="color:#196b9f">JOIN</span> series <span style="color:#196b9f">ON</span> series_member.series_id = series.id
<span style="color:#196b9f">JOIN</span> library_item <span style="color:#196b9f">ON</span> library_item.book_id = book.id
<span style="color:#196b9f">JOIN</span> category <span style="color:#196b9f">ON</span> book.category_id = category.id
<span style="color:#196b9f">JOIN</span> user <span style="color:#196b9f">ON</span> library_item.user_id = user.id
;
</code></pre>

<br>

이 데이터를 담고, 다음과 같이 인덱스를 생성했다. user_id, category_id 혹은 user_id, service_type 을 이용해 필터를 걸고 book_author, series_title 순으로 조회한다면 분명 무척 빠른 성능 향상이 있을 것이다!

![index](/blog/img/2020-05-12/index.png)

이전에 진행했던 쿼리를 역정규화 테이블에 실행해보자.

<pre><code><span style="color:#196b9f">SELECT</span> * 
<span style="color:#196b9f">FROM</span> <b>combined_library_item</b>
<span style="color:#196b9f">WHERE</span> expire_date > <span style="color:#d23255">NOW</span>() <span style="color:#946f44">AND</span> user_id = 3 <span style="color:#946f44">AND</span> category_id = 3
<span style="color:#196b9f"><span style="color:#196b9f">GROUP BY</span></span> series_id 
<span style="color:#196b9f">ORDER BY</span> series_title;
</code></pre>

→ 무려 **0.16s** 로 엄청나게 비약적인 응답 시간 향상이 있었다. 이 정도면… 도내 랭크 상위급… 아니 최상위급도 노려볼 수 있겠는걸…?

![query-result-14](/blog/img/2020-05-12/query-result-14.png)
 

이로써 역정규화를 통해 7.97s에서 0.16s로 비약적인 응답 시간 향상을 이뤄냈다.

### 🔮Quest Complete

- 속도를 향상해주세요.
    - 역정규화 테이블을 만들고 인덱스를 생성해 필터, 정렬의 속도를 향상했다.

## 리디를 위해서라면, 나는 마왕도 쓰러뜨릴 수 있을지 몰라.

"와아아아아아아!!"

"리디를 향해라아아아아!!"

수많은 유저들은 오늘도 리디를 향하고 있다. 그에 따라 발생하는 수없이 많은 문제를 PM과 리발자는 합을 맞춰 해결해나가고 있다. 초기에는 [내 서재]를 기획했던 방향과 다르게 수많은 요구사항이 발생했다. 리디에서는 제품을 기획하면서 끊임없이 고객의 소리를 들으며 발전시켜나갔다. 고객의 요구를 파악하며 우선순위에 따라 서비스를 확장해나갔다.

서비스를 확장함에 따라 개발 부문에서는 다양한 문제들이 생긴다. 글에서 언급한 서브쿼리, 데이터 후보정, 역정규화 외에도 서비스 자동화, 규모 확장, 동시성 처리 등의 새로운 난관들에 부딪히곤 한다. 그렇지만 리발자는 포기하지 않는다. 문제 상황을 파악하고, 방법을 찾아내 이내 해결하고 있다. 또한 더욱 나은 개발 환경을 만들기 위하여, 우리가 겪었던 다양한 문제들과 해결 과정 및 개발 문화를 공유하고 있다. 수많은 문제를 겪고 해결해나가며 어느새 눈에 띄게 성장한 리발자는 고개를 돌리며 나에게 말했다.

"아직 몸을 푼 것치고는 시시하군그래. 리디에 합류해서 나와 같이하지 않겠는가?"

이 말을 남겨둔 채 리발자는 달려오는 유저들을 쳐다보며 일체의 동요조차 보이지 않은 채 거침없이 키보드를 두드릴 뿐이었다.
