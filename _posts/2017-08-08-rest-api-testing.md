---
layout: blog
title: "REST API 테스팅 프레임워크"
description: "REST API 테스팅 프레임워크의 개발 과정을 소개합니다."
header-img: "blog/img/bg-1.jpg"
date: 2017-08-31
author: jeehoon.yoo
category: engineering
published: true
---

리디북스는 **마이크로서비스 아키텍쳐**를 지향하고 있습니다. 그래서 팀간 데이터 전달에 종종 REST API를 사용하고는 합니다. 예를 들어, 제가 속한 데이터팀은 **나를 위한 추천책** API를 다른 팀들에게 제공하고 있습니다. 저희들은 이런 API들이 정상적으로 작동하는지 확인하기 위해, **기능 테스트**를 주기적으로 실행하고 있습니다. 이 과정을 조금 더 편하게 만든 **REST API 테스팅 프레임워크의 개발 과정**을 소개합니다.

## 직접 만들게 된 이유

데이터팀에서는 **Jenkins**로 API 서버의 기능 테스트를 하고 있습니다. **Bash script**로 **curl**를 실행하여 응답 내용을 확인하고 있었는데, 그것보다는 조금 더 정밀하면서 편한 방법을 사용하고 싶었습니다. 시중에 좋은 솔루션들이 있을 것 같아 관련 툴이나 라이브러리를 찾기 시작했습니다.

구글에서 **rest api test**라는 키워드로 검색했을 때 사람들이 보통 [apiary](https://apiary.io/), [SoupUI](https://www.soapui.org/rest-testing/getting-started.html), [Postman](https://www.getpostman.com)을 추천한다는 것을 확인했습니다. 이 툴들은 사용하기 편한 UI를 제공했지만, 저희들의 상황과는 조금씩 맞지 않는 부분이 있었습니다. **SoupUI**는 테스트 케이스 작성에 썩 좋지 않은 UI를 제공했습니다. **apiary**와 **Postman**은 저희들이 원하는 기능들을 완벽하게 지원했지만, 이 기능들을 저희의 상황에 맞게 사용하려면 적지않은 비용을 지불해야 했습니다. 정말 간단한 기능 테스트만 있으면 되는데, 잘 사용하지 않을 다른 기능들때문에 그 비용을 지불하는 것이 낭비라고 생각했습니다.

**GitHub**에서도 동일한 키워드로 프로젝트들을 검색해봤습니다. 하지만, 관련이 있는 툴이나 라이브러리를 찾을 수 없었습니다. 그래서, 저희가 원하는 기능의 툴을 직접 만들기로 했습니다! 필요한 기능이 단순해서 금방 만들 수 있을 것 같았습니다.

## REST API 테스팅 툴 디자인

### 입력과 출력

앞서 소개한 툴들을 조사할 때 얻은 아이디어를 바탕으로, 다음의 **입력**과 **출력**을 가지는 툴을 계획했습니다:

- **입력**: **소스 코드와 분리된** 별도의 테스트 케이스 파일
- **출력**: 테스트 실패가 발생했을 때만, 그 **원인**과 **리턴 코드**를 출력

테스트 케이스와 소스 코드는 분리되는 것이 좋습니다. 테스트 케이스가 소스 코드 안으로 들어갔을 때, 이것저것 넣고 싶은 유혹으로 복잡해질 수 있기 때문이었습니다. 그래서 테스트 케이스에는 정말 간단한 정보만 입력하고, 각종 번거로운 일들은 테스팅 툴이 알아서 해주기를 바랬습니다. 그리고, 정말 혹시라도, 이 툴의 개발 언어를 잘 모르시는 분이 이 툴을 사용할 수도 있지 않을까하는 생각도 있었습니다. 따라서 **JSON** 형식의 파일을 사용하기로 했습니다.

출력의 조건은 일반적인 유닛 테스트 라이브러리의 기능과 동일했습니다. 한참 빠져있었던 **Python**으로 이 툴을 만들고 싶었기 때문에, 내장 라이브러리인 **unittest**를 사용하기로 했습니다.

### JSON 검증

이 툴을 개발할 때 가장 고민을 많이 한 부분은 API 호출의 결과로 받는 **JSON 객체를 검증**하는 부분입니다. 여기에 흔히 사용하는 것이 [JSONPath](http://goessner.net/articles/JsonPath/)와 [JSON Schema](http://json-schema.org)입니다.

JSONPath는 JSON을 위한 [XPath](https://en.wikipedia.org/wiki/XPath)입니다. 즉, **쿼리**를 사용하여 JSON 객체 내의 특정 위치의 값들을 가지고 오기위해 만든 것입니다. 이를 JSON 객체의 검증에 사용하려면 검증에 대한 규칙 및 방법을 직접 만들어야 합니다. 테스팅 툴 중에서는 SoupUI가 JSONPath를 테스트 케이스 작성에 사용합니다.

JSON Schema는 JSON 객체의 구조를 표현하고 검증하려고 만든 것입니다. 그만큼 검증 규칙이 잘 짜여져 있습니다. 다만, 검증 대상의 구조와 검증 규칙을 함께 적어야 하기 때문에, JSONPath에 비해 장황한 테스트 케이스를 작성해야 합니다. JSON Schema를 사용하는 테스팅 툴은 찾지 못 했고, [30개가 넘는 라이브러리들](https://github.com/json-schema-org/JSON-Schema-Test-Suite#who-uses-the-test-suite)이 JSON Schema로 JSON 객체를 검증하는 기능을 제공하고 있다는 것을 확인했습니다.

JSONPath와 JSON Schema에 대한 이해를 돕기위해 다음 JSON 객체를 준비했습니다:

```json
{
  "results": [
    {
      "id": "1",
      "value": 0.9
    },
    {
      "id": "2",
      "value": 0.7
    },
    {
      "id": "3",
      "value": 0.5
    }
  ]
}
```

이 객체의 `results`는 `id`와 `value`로 구성된 객체들의 리스트입니다. 여기서 `id`는 `1`, `2`, `3`의 값을 갖는 문자열이고, `value`는 `0.9`, `0.7`, `0.5`의 값을 갖는 숫자입니다. `results` 리스트의 길이와 `id`와 `value`를 검증하는 JSONPath 테스트 케이스는 다음과 같습니다:

```json
[
  {
    "type": "object",
    "validation": "length",
    "condition": "range",
    "jsonpath": "$.results[*]",
    "expected": [1,3]
  },
  {
    "type": "string",
    "jsonpath": "$.results[*].id"
  },
  {
    "type": "number",
    "validation": "all",
    "condition": "range",
    "jsonpath": "$.results[*].value",
    "expected": [0.5, 0.9]
  }
]
```

여기서 `jsonpath`를 제외한 `type`및 `validation` 등은 제가 추가한 것입니다. 값의 종류를 결정하는 `type`과 어떤 것을 검증할지 정하는 `validation`, 그리고 예상 값 `expected`와 예상 값이 어떤 것을 의미하는지 알려주는 `condition`을 추가했습니다. 예를 들어, 마지막 항목은 `value`의 값을 검증합니다. 모든 `value`의 값 (`all`) 은 `0.5` 이상 `0.9` 이하의 범위 (`range`) 에 속하는 숫자 (`number`) 여야 합니다.

위의 JSONPath 테스트 케이스와 동일한 역할을 하는 JSON Schema 테스트 케이스는 다음과 같습니다:

```json
{
  "type" : "object",
  
  "properties" : {
    "results" : {
      "type" : "array",
      "minItems": 1,
      "maxItems": 3,
      
      "items" : {
        "type" : "object",
        
        "properties" : {
          "id": {
            "type" : "string"
          },
          "value": {
            "type" : "number",
            "minimum" : 0.5,
            "maximum" : 0.9
          }
        }
      }
    }
  }
}
```

JSON Schema는 검증 대상의 구조와 검증 규칙을 함께 표현합니다. 예를 들어, `value`는 `results` 아래에 `id`와 함께 있습니다. `value`에 대한 검증 규칙은 `type`, `minumum`, `maximum`으로 정의합니다. 앞의 JSONPath 검증과 동일하게, `value`의 조건을 `0.5` 이상 `0.9` 이하의 숫자 (`number`) 로 표현하고 있습니다.

JSONPath와 JSON Schema로 테스트 케이스를 작성하여 검증에 사용해보고 나서, JSON Schema를 사용하는 것이 더 낫다는 결론을 내렸습니다. 이유는 다음과 같습니다:

- JSON Schema는 잘 정의된 검증 규칙을 가지고 있고, 이 수준의 검증 규칙을 만드는 것은 쉬운 일이 아니다.
- JSON Schema의 검증 규칙을 적용한 잘 구현된 [검증기들](https://github.com/json-schema-org/JSON-Schema-Test-Suite#who-uses-the-test-suite)이 있다.
- 검증 항목들이 늘어나도, JSON Schema를 사용한 테스트 케이스의 길이는 크게 늘어나지 않는다.

### 집중과 선택

이 테스팅 툴로 **기능 테스트**만을 지원하기로 결정했습니다. 기능 테스트를 할 때마다 소요되는 시간과 노력을 줄이는 것에 초점을 두었습니다. 다른 종류의 테스트에 대해서는 다른 툴에서 충분히 잘 해주고 있다고 생각하여 과감히 포기했습니다.

또한, 지원하는 기능에 비해 쓸데없이 무거운 툴로 만들고 싶지 않았습니다. 빌트인 라이브러리를 주로 사용하고 써드 파티 라이브러리에 대한 의존을 최대한 줄였습니다.

### GitHub의 REST API 테스팅 툴

이 테스팅 툴을 개발하고 나서, 비슷한 역할을 하는 [jsonapitest](https://github.com/peter/jsonapitest)와 [rest-assured](https://github.com/rest-assured/rest-assured)와 같은 테스팅 툴들이 있다는 것을 알게 되었습니다. 하지만, 이 툴들은 저희가 원하는 기능과 조금 거리가 있었습니다. **rest-assured**는 소스 코드로 작성된 테스트 케이스를 사용했습니다. **jsonapitest**는 JSON으로 작성된 테스트 케이스를 사용했지만 구조가 상당히 복잡했습니다.

참 다행이었습니다. 이번 일을 계기로 검색을 더 철저히 해야겠다는 큰 교훈을 얻었습니다.

## REST API 테스팅 프레임워크

저희가 개발한 [lightweight-rest-tester](https://github.com/ridibooks/lightweight-rest-tester)는 JSON Schema로 작성된 테스트 케이스를 읽어들여 자동으로 Python의 unittest를 생성하고 실행해주는 가벼운 테스팅 프레임워크입니다. [Inversion of Control](https://martinfowler.com/bliki/InversionOfControl.html)의 정의에 따라, **툴**보다는 **프레임워크**라고 부르기로 했습니다.

이 프레임워크가 어떻게 동작하는지에 대해서 간단히 설명드리도록 하겠습니다. 입력 부분인 테스트 케이스의 작성부터 시작합니다.

### 테스트 케이스의 작성

테스트 케이스에는 대상 API의 정보를 넣는 `api`와 API 호출로 발생한 결과를 검증하는 `tests`를 작성해야 합니다. `api`에는 API 주소와 HTTP 메소드 등을 명시해야 합니다. 이 프레임워크에서는 **GET**, **POST**, **PUT**, **DELETE**, **PATCH** 메소드를 지원합니다. `tests`에는 JSON Schema와 응답 코드 등을 작성해야 합니다.

다음은 테스트 케이스의 예제입니다:

```json
{
  "api": {
    "url": "http://localhost:3000/comments",
    "method": "get",
    "params": {
      "postId": 1
    }
  },
  "tests": {
    "timeout" : 10,
    "statusCode": 200,
    "jsonSchema": {
      "JSONSchema 내용": "{ ... }"
    }
  }
}
```

위의 테스트 케이스는 `http://localhost:3000/comments`의 주소에 `postId` 파라미터의 값을 `1`로 넣고 GET 메소드를 호출합니다. 그 호출에 대한 응답은 `10`초 이내에 받을 수 있어야 하고, 응답 코드는 `200`이어야 합니다. 또, 결과 값인 JSON 객체는 주어진 `jsonSchema`의 내용과 일치해야 합니다.

### 단위 테스트의 생성과 실행

이 프레임워크에 JSON 테스트 케이스를 전달하면, Python unittest의 **TestCase**를 생성하고 실행합니다. 조금 더 자세히 설명하면, 먼저 테스트 케이스의 `api`에 정의된 `url`과 `params`로 API를 호출하여 결과 값을 받아옵니다. 그 후, 받은 값에 대하여 `tests`에 정의된 항목들을 하나씩 검증합니다. 특히, 결과로 얻은 JSON 객체를 검증할 때는 JSON Schema의 검증기인 [jsonschema](https://github.com/Julian/jsonschema)를 사용합니다. jsonschema는 JSON Schema에서 제시한 [Draft 3](https://github.com/json-schema-org/JSON-Schema-Test-Suite)과 [Draft 4](https://github.com/json-schema-org/JSON-Schema-Test-Suite)를 완벽하게 지원하는 라이브러리입니다.

방금 설명드린 기본적인 기능 외에, 사용할 때 느꼈던 불편함을 해소하는 기능들을 추가로 넣었습니다. 예를 들어, 테스트 케이스의 `api.params`에 있는 각 파라미터에 배열을 넣으면, 배열 내의 각 값에 해당하는 TestCase를 생성합니다. 또, 두 개 이상의 파라미터에 배열을 넣으면, 생성이 가능한 모든 조합의 **파라미터 셋**들의 TestCase를 생성합니다. `tests.statusCode`에도 역시 배열을 넣을 수 있습니다. 이 경우에는 응답 코드가 그 배열의 값들 중 하나이기만 하면 검증을 통과합니다. 또, PUT과 같이 데이터 베이스의 상태를 변화시키는 메소드에 대해서는, 바로 GET 메소드로 확인할 수 있는 기능을 지원하고 있습니다. 실행 순서가 중요하기 때문에, 한 TestCase내에서 순서대로 처리합니다. 더 자세한 사항은 이 프레임워크의 GitHub 레파지토리에서 다양한 예제와 함께 확인하실 수 있습니다:

[https://github.com/ridibooks/lightweight-rest-tester](https://github.com/ridibooks/lightweight-rest-tester)

### 프로젝트의 품질 향상을 위해서

이 프로젝트에 대한 신뢰 향상과 기능의 수정 및 추가를 대비하여 단위 테스트를 열심히 만들었습니다. (테스팅 프레임워크를 테스트하는 테스트 케이스…) 이 프레임워크가 외부에서 실행 중인 API 서버를 대상으로 하다보니, 단위 테스트를 실행시킬 수 있는 가상 환경이 필요했습니다. 그래서, **Docker**와 *full fake REST API with zero coding*인 [json-server](https://github.com/typicode/json-server)를 사용했습니다. 참고로, **Travis**와 **coveralls**의 조합으로 만족할만한 커버리지 (**90% 이상!!!**) 도 달성했습니다.

기능 구현에 든 시간과 거의 비슷한 시간이 단위 테스트 작성 및 환경 구축에 들었습니다. 이렇게 프로젝트의 품질을 측정하는 일은 간단하지 않은 것 같습니다.

### To-Do: 테스트 케이스 자동 생성

저희 팀의 API 서버를 테스트하면서 JSON Schema를 처음부터 작성하는게 번거롭다는 것을 발견했습니다. 그리고, JSON Schema를 접해보지 않은 상태에서 작성하려고 하면 좀 막막할 수도 있다는 것도 알게되었습니다. 그래서, JSON Schema를 자동으로 생성해주는 기능을 계획했습니다.

다음 방법으로 테스트 케이스를 자동으로 생성할 계획입니다:

1. `api`부분만 작성된 테스트 케이스를 **자동 생성기**에 전달
2. 자동 생성기에서 `api`를 참조하여 API 서버를 호출
3. 호출의 결과 값을 기준으로 **가장 엄격한 조건**의 `tests`부분을 생성
4. 사용자는 자동으로 생성된 `tests`의 일부 조건들을 완화

## 맺음말

REST API 테스팅 프레임워크를 개발하면서 예상했던 것보다 더 많은 것들을 접하고 배울 수 있었습니다. REST API의 기능 테스트에 대해서 A부터 Z까지 쭉 한 번 살펴본 것 같습니다. 또한, JSON Schema와 같은 표준의 편리함과 jsonschema와 같은 오픈 소스의 유용성도 경험할 수 있었습니다. 이 프레임워크도 다른 오픈 소스들처럼 누군가에게 도움이 되었으면 합니다! 

이 프레임워크를 개선할 수 있는 좋은 아이디어가 있으면 [GitHub 레파지토리](https://github.com/ridibooks/lightweight-rest-tester)에 남겨주세요 :) 개선에 직접 참여하시는 것도 환영합니다!
