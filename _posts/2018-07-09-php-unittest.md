---
layout: blog_post
title: "PHP에서 단위테스트 시작하기"
description: "처음 PHP에서 단위테스트를 작성하는 데 도움이 되는 몇 가지 이야기입니다."
header-img: "blog/img/2018-07-09/background.jpg"
date: 2018-07-09
author: "minq"
category: engineering
published: true
---

# 시작

처음 사용하는 라이브러리나 프레임워크, 처음 입사하거나 이직 후 보는 생소한 코드라도 친절한 예제가 있다면 큰 힘이 됩니다. 변화 주기가 길거나 인터페이스가 잘 변하지 않는다면 누군가 문서를 만들어 두어 도움을 줄 수 있습니다.
그러나 서비스 중인 코드라면 시시각각 변하기 때문에 계속해서 문서를 갱신 하는 것이 부담이 되게 마련입니다.
그래서 잘 만든 문서가 있지만 오래 방치된 최신의 내용이 아닌 문서를 심심치 않게 봅니다.
다른 방법은 없을까요? 테스트 코드를 이용해 테스트 자체가 문서가 되도록 작성하면 어떨까요?
이 문서 역할의 테스트 코드는 변경이 있을 때마다 테스트가 실행되면서 통과가 되기도 하고 실패가 되기도 하면서 실제로 동작하는 문서로 살아있을 것입니다.

소프트웨어 테스트란 방대합니다. 평소 내가 작성한 코드를 어떻게, 어떤 방법으로 테스트 해야 할지 많이 고민하지 않았다면, [위키피디아](https://en.wikipedia.org/wiki/Software_testing)의 내용을 보고 놀랄지도 모르겠습니다. 왜냐하면 소프트웨어 테스트는 수십 가지의 방법, 레벨, 테크닉, 전략적인 측면을 고려해야 하는 전문적인 분야이기 때문입니다.
하지만 전문 테스터는 아니라도 화이트/블랙박스, 단위/인수/통합, TDD/BDD 테스트는 자주 사용하는 말이기 때문에 알아두면 좋습니다.

그중 소프트웨어 개발자와 가장 가까이 있는 건 단위 테스트입니다.

## 단위 테스트(Unit Testing)

단위 테스트는 함수 레벨에서 특정 부분의 동작을 검증하는 것입니다. 만약 객체지향 프로그래밍이라면 클래스 생성자와 소멸자도 테스트 할 수 있습니다.
소프트웨어 개발자가 직접 작성하기 때문에 테스트 대상의 동작을 자세히 알고 있는 상태로 작성하게 됩니다. 또 여러 측면으로 테스트를 해야 하기 때문에 실행 시점의 코드 구석구석까지 커버 할 수 있습니다.
단위 테스트 하나만으로 소프트웨어를 전체 검증할 수는 없습니다. 하지만 구성요소 하나하나를 확실하게 만들 수 있습니다. 구성요소들이 확실해 지면 전체적인 결함, 시간, 비용, 리스크를 줄일 수 있습니다. 특히 앞으로 변경할 코드는 문제가 없다는 확신을 갖는것이 궁극적인 목적입니다.
게다가 올라가는 테스트 커버리지를 통해 일종의 만족감을 얻고, 다시 생산성을 올리는 선순환의 시작이라고 믿습니다.

# 선택

테스트 코드 작성 경험이 많다면 처음부터 단위 테스트를 자기 스타일로 만들어 갈 수도 있습니다. 하지만 처음 시작한다면 잘 만들어진 프레임 위에서 학습을 한 후 프레임을 깨고 나와 시작해도 늦어지는 건 아니라고 생각합니다.
그래서 PHP의 사실상 표준(de-facto standard)인 PHPUnit은 좋은 시작입니다. 다음은 PHPUnit의 캐치 프레이즈입니다.

> PHPUnit is a **programmer-oriented** testing framework for PHP.
>
> It is an instance of the **xUnit architecture** for unit testing frameworks.

# 시나리오

대부분의 IDE에는 `Toggle auto-test`같은 옵션이 있습니다. 이는 코드가 변경되면 자동으로 테스트를 실행시켜줍니다.
이처럼 IDE가 도와준다면 코드를 리팩토링하고 단위 테스트가 잘 돌아가고 있다는 걸 빠르게 확인해 자신감을 상승시킬 수 있습니다.
![https://www.jetbrains.com/help/phpstorm/enabling-php-unit-support.html](/blog/img/2018-07-09/ps-test-result.png)
<figcaption><a href="https://www.jetbrains.com/help/phpstorm/enabling-php-unit-support.html">https://www.jetbrains.com/help/phpstorm/enabling-php-unit-support.html</a></figcaption>

마치 코드를 한 줄 수정했을 때 녹색 막대가 생기면 멘토가 고개를 끄떡 끄덕이며 `오케이`라고 이야기하는 것 같아 기분이 좋습니다. 한번 기분이 좋아지면, 이런 느낌을 더 강하게 얻기 위해 단위 테스트가 물 샐 틈 없이 코드 이곳저곳을 커버하고 다양한 방향으로 테스트 코드를 작성합니다.

그렇게 단위 테스트의 양이 늘어납니다.

그런데 어느 날부터 코드 한 줄을 고쳤는데 단위 테스트 결과를 보기 위해 커피 한잔을 마시고 와야 할 정도로 오래 걸리게 됩니다. 너무 자주 커피를 마셔 카페인 중독이 되고 주말에도 커피를 마시지 않으면 두통으로 고생하게 됩니다. 그러니 단위 테스트는 빠르게 실행 되도록 만들어야 합니다.

동료와 같이 일하고 있다고 가정해보겠습니다.
내가 로컬에서 개발하고 테스트를 하는 중인데 동료가 실행시킨 테스트와 문제가 생겨 동료만 테스트에 성공하고 나는 실패할 수 있습니다. 이때 다시 실행해서 통과하면 괜찮을까요?
조금 더 구체적인 예를 들어 보겠습니다.
세션을 저장하는 곳을 공통으로 사용하고 있습니다. 나는 TESTER라는 사용자가 로그인 후 어떤 동작을 테스트하고 있고 옆자리의 동료는 TESTER가 로그아웃이 잘되는지 테스트하고 있습니다.
옆 동료는 나의 붉은 막대를 보고 희미한 웃음을 지을 것입니다. 나는 상황을 눈치채고 다시 테스트를 실행합니다.
참 불편한 상황입니다. 그래서 이 같은 경우가 발생하지 않도록 단위 테스트는 테스트 케이스 각각이 서로 독립적으로 만들어야 합니다.

말도 안 될 것 같지만 더한 상상을 해보겠습니다.
빨리 개발한 기능을 배포해야 하는 데 시간이 오래 걸리거나 의도치 않은 실패가 자꾸 쌓이면 단위 테스트를 실행해보고 싶지 않을 것입니다.
CI로만 테스트하려고 레파지터리에 저장한 후 테스트 결과를 기다릴 것입니다.
더 나아가면 테스트가 실패해도 배포를 할 것이고, 테스트 코드를 유지 보수도 하지 않을 것입니다.
그렇게 테스트의 생애는 끝이 나고 삭제되어 없어지게 될 것입니다.

# Test Double

테스트 더블이란 용어가 있습니다. 아래 그림을 보세요.
![Sketch Types Of Test Doubles embedded from Types Of Test Doubles.gif](/blog/img/2018-07-09/Types-Of-Test-Doubles.gif)
<figcaption><a href="http://xunitpatterns.com/Test%20Double.html">http://xunitpatterns.com/Test Double.html</a></figcaption>

유래는 위험한 일을 하는 대역 배우를 일컫는 [스턴트 더블](https://en.wikipedia.org/wiki/Stunt_double)에서 왔다고 하니 설명하지 않아도 직관적인 의미를 알 수 있을 것입니다.
단위 테스트를 작성하는데 대역 배우는 왜 필요할까요? 누구를 대신 할까요?
단위 테스트의 생명을 위협하는 데이터베이스, 세션 스토어, 인증 서버, 이메일이나 SMS 발송을 위한 서버, 로깅 시스템, 테스트하기 어렵게 만드는 파일 시스템과 시간들, 테스트 하려고 하는 것과 상관없는 다른 오브젝트, 클래스, 함수, 변수들입니다.

일단 Dummy는 빼고 이야기하겠습니다. 마침 빼라고 점선으로 표시되어 있습니다. Dummy는 혼자 할 줄 아는 게 없습니다. 인자로서 전달될 뿐입니다.

Stub은 좀 더 똑똑하지만 정해놓은 결과만 반환합니다. "사용자의 아이디를 줘!" 라고 하면 TESTER만 전달합니다. 다른 이름의 사용자 이름을 달라고 해도 또 TESTER를 줍니다. 그래서 "이 메서드를 호출하면 이값을 줘!"라고 만듭니다. 손이 많이 가는 건 아닙니다.

Spy는 Stub보다 기억력이 좋습니다. 뭐가 호출되고 사용되어 졌는지를 기억하고 물어보면 대답해줍니다.

Mock은 더 복잡하고 손도 많이 갑니다. 왜냐하면, 어떤 상황에선 이렇게 되어야 하고 다른 상황이면 저렇게 되어야 한다는 걸 만들어 주어야 합니다.
예를 들면 쇼핑 카트의 내용을 모두 제거하는 메서드를 테스트하는데 반환 값이 없다고 해보겠습니다.
그럼 무엇을 어떻게 테스트해야 하나요? 이 메서드를 호출하고 기댓값은 없다고 테스트하면 될까요? 이렇게 테스트 케이스를 작성하고 메서드의 동작을 믿을 수 있다면 상관없을 것입니다.
믿지 못한다면 이 메서드가 무언가를 했는지 행동을 확인해야 하는데 이렇게 작성하는 것을 Mock이라고 부릅니다. 그러니 Spy보다 손이 더 많이 가는 게 당연합니다.

Fake는 비즈니스 로직까지 포함됩니다. 다른 팀과 API를 합의하고 개발이 완료될 때까지 기다리는 것이 아니라 Fake 개체 인터페이스에 맞춰 만들고 개발 할 수 있습니다. 이 대상이 API가 아니고 데이터베이스라고 해도 상관이 없습니다.

# 코드

설명한 대로 테스트 더블이라는 용어로 구분은 하지만 PHPUnit 으로 작성된 아래 예제처럼 특별하게 구분을 할 이유는 없습니다.
왜냐하면 "이런 상황에선 Stub을 써야지", "이때는 Mock이 좋겠지" 고민하는 시간에 상황에 맞게 테스트 코드를 작성하면서 Stub이 되었다가 Mock이 되었다 Spy가 되었다 하는 게 자연스럽지 않을까요.

[Stubs](https://phpunit.readthedocs.io/en/7.1/test-doubles.html#stubs)

```php
<?php

class SomeClass
{
    public function doSomething()
    {
        // Do something.
    }
}
```
&nbsp;
```php
<?php
use PHPUnit\Framework\TestCase;

class StubTest extends TestCase
{
    public function testStub()
    {
        // Create a stub for the SomeClass class.
        $stub = $this->createMock(SomeClass::class);

        // Configure the stub.
        $stub->method('doSomething')
             ->willReturn('foo');

        // Calling $stub->doSomething() will now return
        // 'foo'.
        $this->assertSame('foo', $stub->doSomething());
    }
}
```

[Mocks](https://phpunit.readthedocs.io/en/7.1/test-doubles.html#mock-objects)

```php
<?php

class Subject
{
    protected $observers = [];

    public function doSomething()
    {
        // Do something.
        // ...

        // Notify observers that we did something.
        $this->notify('something');
    }

    public function doSomethingBad()
    {
        foreach ($this->observers as $observer) {
            $observer->reportError(42, 'Something bad happened', $this);
        }
    }

    // Other methods.
}

class Observer
{
    public function update($argument)
    {
        // Do something.
    }

    public function reportError($errorCode, $errorMessage, Subject $subject)
    {
        // Do something
    }

    // Other methods.
}
```
&nbsp;
```php
<?php
use PHPUnit\Framework\TestCase;

class SubjectTest extends TestCase
{
    public function testObserversAreUpdated()
    {
        // Create a mock for the Observer class,
        // only mock the update() method.
        $observer = $this->getMockBuilder(Observer::class)
                         ->setMethods(['update'])
                         ->getMock();

        // Set up the expectation for the update() method
        // to be called only once and with the string 'something'
        // as its parameter.
        $observer->expects($this->once())
                 ->method('update')
                 ->with($this->equalTo('something'));

        // Create a Subject object and attach the mocked
        // Observer object to it.
        $subject = new Subject('My subject');
        $subject->attach($observer);

        // Call the doSomething() method on the $subject object
        // which we expect to call the mocked Observer object's
        // update() method with the string 'something'.
        $subject->doSomething();
    }
}
```


# 경곗 값 분석

경곗값 분석은 대표적인 명세 기반 테스트 기법의 하나입니다. 경계 주변의 값들에서 결함이 발견될 확률이 높다는 건 개발자 대부분은 경험적으로 알고 있습니다.
이 경계값을 바꿔가며 테스트를 작성하다 보면 테스트 케이스 길이가 길게 됩니다.
이럴 땐 PHPUnit의 `@testWith` 또는 `@dataProvider` 어노테이션을 이용하면 편리합니다.

[testWith](https://phpunit.readthedocs.io/en/7.1/annotations.html#testwith)

```php
<?php
/**
 * @param string    $input
 * @param int       $expectedLength
 *
 * @testWith        ["test", 4]
 *                  ["longer-string", 13]
 */
public function testStringLength(string $input, int $expectedLength)
{
    $this->assertSame($expectedLength, strlen($input));
}
```

[dataProvider](https://phpunit.readthedocs.io/en/7.1/writing-tests-for-phpunit.html#writing-tests-for-phpunit-data-providers)

```php
<?php
use PHPUnit\Framework\TestCase;

class DataTest extends TestCase
{
    /**
     * @dataProvider additionProvider
     */
    public function testAdd($a, $b, $expected)
    {
        $this->assertSame($expected, $a + $b);
    }

    public function additionProvider()
    {
        return [
            'adding zeros'  => [0, 0, 0],
            'zero plus one' => [0, 1, 1],
            'one plus zero' => [1, 0, 1],
            'one plus one'  => [1, 1, 3]
        ];
    }
}
```

# 데이터베이스

PHPUnit에는 JAVA의 DBUnit을 이식한 패키지가 있습니다.
DBUnit은 데이터베이스의 테이블과 행, 칼럼을 추상화한 데이터셋과 데이터 테이블을 제공하고 실제 데이터베이스에 실행한 결과를 추상화한 것을 이용해 평가를 할 수 있습니다.
그리고 yaml, xml, csv, php코드를 이용해 Fixture를 제공해 테스트를 위한 데이터베이스 사전 설정을 돕습니다.
반면 앞에서 언급한 시나리오에서 동료와의 로그인 로그아웃 테스트처럼 데이터베이스가 공유지라면 레이스 컨디션([Race condition](https://en.wikipedia.org/wiki/Race_condition#Software))으로 인한 실패를 감수해야 합니다.
만약 테스트를 실행 중인 동료가 많다면 테스트는 높은 확률로 실패합니다. 테스트 속도가 느려지는건 덤입니다. 혼자 사용하는 데이터베이스는 쾌적합니다. 반드시 사용해보세요.

# 레거시 코드

이젠 현실로 돌아올 때가 되었습니다.
슬프지만, 내 앞에 아래 코드가 놓여있습니다.

```php
<?php

class BookCalculator
{
    public function discountPercentage(int $book_id): int
    {
        $conn = $this->getConnection();
        $repo = new BookRepository($conn)
        $book = $repo->findBy($book_id);
        $price = $book->getPrice();
        $salePrice = $book->retailPrice();
        if ($salePrice > $price) {
            throw new BadRetailPriceException(ExceptionMessage::BAD_RETAIL_PRICE);
        }
        if ($salePrice === $price){
            return 0;
        }
        return round(($price - $salePrice) / $price, 2) * 100;
    }
}
```
`BookCalculator::discountPercentage()`는 도서의 할인 퍼센트가 얼마나 되는지 알려줍니다.
이 메서드를 만든 사람은 아래 내용을 가정하면서 만들었습니다.
도서 아이디는 4자리 int입니다. 그래서 입력으로는 1000~9999일 수 있고, 출력은 null, 0~99 입니다. 그 외는 모두 잘못된 출력입니다.
만약에 해당 도서가 없을때는 `BookRepository::find()`가 `BookNotFoundException`을 던지고 `BookCalculator::discountPercentage()`를 사용하는 주체가 예외를 처리합니다.
데이터베이스에 연결이 되지 않을 땐 아무 일도 하지 않습니다.
이 내용을 모두 테스트 하려면 어떻게 해야 하나요? 레파지터리를 통해 가져온 도서의 상태에 따라서 반환 값도 달라지고 예외도 발생하게 될 것입니다.
이 상태는 데이터베이스에 의존적입니다. 데이터베이스의 값을 바꿔가면서 테스트해 봐야 할까요?
테스트할 수 있도록 조금 리팩토링을 해보겠습니다.

```php
<?php

class BookCalculator
{
    private IRepository $repo;

    public function __construct(IRepository $repo)
    {
        $this->repo = $repo;
    }

    public function discountPercentage(int $book_id): int
    {
        $book = $this->repo->findBy($book_id);
        $price = $book->getPrice();
        $salePrice = $book->retailPrice();
        if ($salePrice > $price) {
            throw new BadRetailPriceException(ExceptionMessage::BAD_RETAIL_PRICE);
        }
        if ($salePrice === $price){
            return 0;
        }
        return round(($price - $salePrice) / $price, 2) * 100;
    }
}
```
&nbsp;
```php
<?php

/**
 * @testdox 도서 계산기
 */
class BookCalculatorTest extends TestCase
{
    /**
     * @test
     * @testdox 반값 도서는 50% 세일이다.
     */
    public function discountPercentage_WhenHalfSale_Than50Percentage():
    {
        $expected = 50;
        $book = new Book();
        $book->setPrice(1200);
        $book->setSalePrice(600);
        $mock = $this->getMockBuilder(BookRepository::class)
            ->setMethods(['findBy'])
            ->getMock();
        $mock->method('findBy')
            ->willReturn($book);

        $calculator = new BookCalculator($mock);
        $discountPercentage = $calculator->discountPercentage(1000);
        self::assertSame($expected, $discountPercentage);
    }
}

```
&nbsp;
```sh
root@8295cabe9170:/app# vendor/bin/phpunit --testdox
PHPUnit 7.1.3 by Sebastian Bergmann and contributors.

도서 계산
 ✔ 반값 도서는 50% 세일이다.

Time: 46 ms, Memory: 6.00MB

OK (1 test, 1 assertion)
```

생성자에서 레파지터리를 받도록 변경했습니다. 이 간단한 변경으로 `BookCalculator::salePercentage()`가 레파지터리와 상관이 없게 됩니다.
생성자를 통해 주입받은 레파지터리를 그냥 이용할 뿐입니다. 스스로 레파지터리를 만들어 의존관계를 만들었던 모습에서 `BookCalculator`를 인스턴스 테스트 하려는 테스트 케이스에게 책임을 떠넘길 수 있습니다.
이를 보통 의존성 주입(Dependency Injection)을 통해 테스트할 수 있게 만들었다고 이야기 하는데 생성자를 이용하는 방법과 메서드를 이용하는 방법이 있습니다. 이것들도 아니라면 Pimple같은 의존성 주입 컨테이너를 잘 이용해도 됩니다.
PHPUnit의 기본 적인 기능들을 잘 이용하면 처음 클래스나 메서드를 만들었던 의도대로 테스트 케이스를 모두 추가 해 나갈 수 있습니다.
그리고 커버리지 리포트를 생성해 살펴보고 미쳐 신경 쓰지 못한 코드가 어느 부분인지 확인하며 부족한 부분을 매울 수 있습니다.
이 과정에서 공통적인 고민거리가 크게 몇 가지가 있습니다.

먼저 "얼마나 많이 테스트 케이스를 작성해야 하나?"라는 질문의 모범 답안은 "작성자가 안심할 때 까지" 입니다.
"비공개 메서드도 작성해야 하나"란 물음은 보통 작성하지 않지만, 안심할 수 없다면 작성하는 것이 맞습니다.
모든 걸 다 테스트하려다보면 DI 받는 것이 많아지는데 이 또한 너무 많으면 코드가 디커플링되는건 좋은데 헐렁헐렁한 느낌의 산만한 코드로 보이기도 합니다. 그래서 "이걸 테스트 해야 하나" 라는 고민도 하게 됩니다.
테스트하자니 마음에 들지 않고, 하지 않자니 커버리지가 아쉽습니다. 하지만 단위 테스트를 작성하는 목적을 잊지 말고 버릴 건 버려야 합니다.

아이러니하지만 사이드 이펙트가 두려워 차마 리팩토링을 하지 못하는 경우도 있고
시간이나, 파일 시스템, 여러 내장 함수를 Mock해야 하는 상황도 생기는데 이때는 참 난감합니다.
직접 조작을 할 순 없으니 PHP Runkit이나, 네임스페이스로 속이는 방법, 랩핑 클래스나 함수를 만들어서 사용하는 방법, Mockery나 AspectMock같은 라이브러리를 이용하는 방법들이 있습니다.
개인적으로는 언어를 이렇게까지 해킹하는 것은 싫습니다. 하지만 굳이 선택하자면 [Mockery](https://github.com/mockery/mockery)나 [AspectMock](https://github.com/Codeception/AspectMock)이 좋겠습니다.
아래는 AspectMock의 개발 동기(Motivation)인데 참 인상적이라 AspectMock을 선호하게 되었습니다.
> PHP is a language that was not designed to be testable. Really.
>
> How would you fake the time() function to produce the same result for each test call?
>
> Is there any way to stub a static method of a class? Can you redefine a class method at runtime?
>
> Dynamic languages like Ruby or JavaScript allow us to do this.
>
> These features are essential for testing. AspectMock to the rescue!

자, 그럼 AspectMock이 우리를 어떻게 구원해줄 수 있는지 봅시다.

```php
<?php
use AspectMock\Test as test;

/**
 * @testdox 도서 계산
 */
class BookCalculatorAspectMockTest extends TestCase
{
    /**
     * @test
     * @testdox 반값 도서는 50% 세일이다.
     * @throws \Exception
     */
    public function salePercentage_WhenHalfSale_Then50Percentage(): void
    {
        $expected = 50;
        $book = new Book();
        $book->setPrice(1200);
        $book->setSalePrice(600);
        test::double(BookRepository::class, ['findBy' => $book]);
        $calculator = new BookCalculatorOld();
        $salePercentage = $calculator->salePercentage(1000);
        self::assertSame($expected, $salePercentage);
    }
}
```
생성자에 의존성 주입 없이 테스트를 통과시켰습니다.
이런 테스트가 가능하다는 건 레거시 코드를 리팩토링 없이 테스트를 할 수 있다는 이야기입니다.
다시 말하면 레거시와 싸우는 현실에서 리팩토링을 선행하지 않고 테스트 코드를 작성 할 수 있고 다시 테스트 코드를 믿고 리팩토링을 감행할 여지가 생긴다는 이야기입니다.

날짜와 관련된 코드도 보세요.
```php
<?php

class DateTimeUIHelper
{
    public static function twoDigitsWithLeadingZerosAtMondayThisWeek(): string
    {
        return date('d', strtotime('Monday this week'));
    }
}
```
흔하게 볼 수 있는 코드인데 의심이 많아 `date()`의 포맷으로 넘기는 `d`가 정말로 작동하는지 못 믿겠다면 어떻게 테스트해야 할까요?

```php
<?php
use AspectMock\Test as test;

/*
 * @testdox 템플릿에서 사용하는 일/시 헬퍼
 */
class DateTimeUIHelperTest extends TestCase
{
    /**
     * @test
     * @testdox 이번 주 월요일은 몇일인지 2자리 숫자로 변환한다.
     */
    public function twoDigitsWithLeadingZerosAtMondayThisWeek_WhenForce20180401000001_Then01(): void
    {
        $expected = '01';
        test::func('Example', 'strtotime', strtotime('2018-04-01 00:00:01'));
        self::assertSame($expected, DateTimeHelper::twoDigitsWithLeadingZerosAtMondayThisWeek());
    }
}
```
억지스럽지만 `strtotime()`의 반환 값을 조작해 `date()`의 동작을 테스트해 확신을 가질 수 있습니다.
만약 `DateTimeUIHelper::twoDigitsWithLeadingZerosAtMondayThisWeek()`를 리팩토링해야 한다면 어떻게 해야 할까요?
필요한 내용을 인자로 받게 될 텐데 차라리 저라면 테스트를 포기하고 `@codeCoverageIgnore`어노테이션으로 도배를 할 것입니다.
꼭 빌트인 함수들을 의심하는 상황이 아니라도 우리가 작성하는 코드 대부분은 언어가 제공하는 콤포넌트 위에 올라가는 것이기 때문에 이처럼 실행 시점에 결과를 조작하는 것은 중요합니다.
그래야 여유가 생기고 조금이라도 더 취미를 즐길 시간이 생기기 않겠습니까.

# 코드 커버리지

코드 커버리지는 충분히 테스트 코드를 작성했는지 **참조** 할 수 있는 일반적인 지표입니다.
너무 낮다면 주의를 해야겠지만 높다고 테스트가 완벽한 것이 아니니 커버리지 숫자에 목을 매면 안 되겠습니다.
하지만 높아지면 질수록 괜히(?) 기분이 좋아지니 활력소로 삼을 만합니다.
새로 만들거나 수정 중인 코드의 커버리지만이라도 높여간다면 언젠가는 100%를 달성 할 수 있을지도 모르겠습니다.

# 기타

PHPUnit는 생각보다 많은 기능과 상황을 염두에 둬서 만들어졌고 버전도 꾸준히 올라갑니다.
테스트 코드도 아름답게 만들려면 이미 있는 기능도 의미 있게 활용할 줄 아는 게 미덕이 아닐까요.

* `@runTestInSeparateProcesses`, `@runInSeparateProcess`, 어노테이션이나 `--process-isolation` 실행 옵션을 이용하면 테스트 실행을 독립적으로 할 수 있습니다.
* `@depends` 어노테이션은 특정한 테스트 메서드가 다음 메서드에게 결과를 메서드 인자로 전달해 테스트 의미를 더 확장할 수 있습니다.
* `TestCase::expectOutputString()`를 이용해 기대하는 `echo`나 `print`같은 output buffer 의 출력을 확인 할 수 있습니다.

직접 확인해보세요. [더 많습니다.](https://phpunit.readthedocs.io/en/7.1/annotations.html)

# 마무리

부끄럽지만 시나리오에서 언급한 사례 중 많은 테스트 코드들이 방치되는 경험도 했습니다.
이제는 커버리지가 잘 오르지 않을 정도로 수렴하고 많은 부분을 단위 테스트하고 있습니다.
방치된 코드를 리팩토링하고 단위 테스트로 확인을 받는 과정은 틀리면 틀린 대로 맞으면 맞는 대로 언제나 기분이 좋습니다.
매일 새로 갱신되는 코드 때문에 커버리지를 유지하는 것은 또 다른 경험입니다.
스토어팀은 조금 더 견고한 코드와 더 나은 개발 환경을 만들기 위해 고민이 많습니다.
다음번에는 화이트박스 테스트가 아닌 블랙박스 테스트로써 Codeception을 사용하면 어떤 재미있는 문제가 생길지 기대가 됩니다.

테스트가 소프트웨어 개발의 전부는 아니지만, 수많은 개발 방법론과 언어들처럼 소프트웨어 개발을 즐기는 방법의 하나라고 생각합니다.
오늘 작성한 코드가 만족스럽지 않다면 한번 단위 테스트부터 시작해 보는 건 어떨까요?
