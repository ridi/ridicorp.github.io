---
layout: blog
title: "Postman과 GitLab CI 연동하기"
description: "Postman Test와 GitLab CI를 사용해 자동화된 RESTful API 테스트 환경을 구성하는 방법에 대해 알아봅니다."
header-img: "blog/img/2017-11-09/background.png"
date: 2017-11-09
author: "kyungmi.k"
category: engineering
published: true
---

> RESTful API를 개발하고 계신가요? 그렇다면 문서화와 테스트를 위해서는 어떤 도구들을 사용하고 있으신가요?

## API 개발을 힘들게 하는 것들

API는 사용자와의 약속입니다. 따라서 API를 개발하는 데 있어서 일관성 있는 설계와 기능 구현은 매우 중요한 요소입니다. 하지만 그보다 더 중요한 것은 잦은 변경에도 안정적으로 동작하는 버전을 지속적으로 제공하는 것입니다. 이것이 충족되려면 **문서화**와 **테스트**가 반드시 요구됩니다. 하지만 개발자들에게는 그만큼 귀찮은 짐이 되어버리는 경우가 많습니다.

보통의 API 개발과정은 다음과 비슷합니다.

![보통의 API 개발과정](/blog/img/2017-11-09/develop_process.png){:data-action="zoom"}

위와 같이 새로운 기능을 개발한다는 것은 테스트를 작성하고 문서를 업데이트해야 한다는 것을 의미합니다. 개발자라면 분명히 이 부분의 오버헤드를 줄이고 싶을 것입니다.

## 그래서 무엇을 선택해야 할까

최근에 뷰어팀에서는 API 서버의 소스 구조를 대폭 개편하는 작업을 진행했습니다. 타 팀의 코드와 함께 동작하고 있던 뷰어 API 소스를 분리해 따로 서비스 환경을 구축하고, 정리되지 않았던 에러 응답 방식을 체계화했으며, 그와 함께 PHP 기반이었던 코드를 Node.js 기반으로 옮기는 API v2 작업도 진행 중이었습니다.

운영 환경이 바뀌는 데다 구조적인 변화가 많이 있었기 때문에 전체 API가 잘 동작하는지, 에러 케이스에서 요구하는 응답을 정확히 주는지에 대한 검증이 필요했습니다. 그리고 이때까지 유닛 테스트로만 코드를 검증했고, 따로 작성된 API 테스트가 없었기 때문에 API 테스트를 새로 작성해야 했습니다. 그 테스트 코드마저도 PHP와 Node.js 이중으로 작성해야 하는 문제에 맞닥뜨리게 되었습니다.

저는 이 반복적인 API 작업에서 조금이라도 자유로워지고 싶었습니다. 그래서 여러 가지 도구들을 시험 삼아 사용해 봤지만 아쉽게도 마음에 쏙 드는 것은 없었습니다.

**문서화가 중심이 되는 도구**는 표현력을 최대화하기 위해 복잡한 문법을 제공하는 것이 대부분이었고, 힘겹게 작성을 마친 후에는 어떤 형태로도 다른 개발 과정에 전혀 재사용할 수 없었습니다.

**테스트가 중심이 되는 도구**들은 프로그래밍 언어, 사용하는 프레임워크에 따라 다른 것들을 선택해야만 했고 제공하는 API와 함께 사용해야 하는 라이브러리들을 공부하는 데 적지 않은 시간을 소모해야 했습니다.

최근에 **데이터팀에서 만든 [lightweight-rest-tester](/blog/2017/08/31/rest-api-testing/)**가 있었지만 아쉽게도 대안이 될 수 없었습니다. 모니터링을 목적으로 만들어졌기 때문에 서버가 정상적인 상태라고 확인할 수 있는 최소한의 조건(허용된 응답 코드를 반환하는지, JSONSchema로 표현되는 응답 형식을 만족하는지, 정해진 시간 내에 응답을 하는지 등)을 감시하기엔 적합했지만 API 스펙의 세세한 부분을 정확히 검증하기에는 표현에 제한이 있었고, 로그인 후 쿠키를 전달한다던지 각 테스트 케이스에서 발생한 값들을 변수로 재활용 할 수 있게 하는 컨텍스트 관리 등의 기능을 제공하지 않고 있었습니다.

그렇게 정착하지 못하고 떠돌다가 최근 우연히 Postman을 다시 만났습니다.
확 달라진 모습의 Postman을 접하고 나서 "아, 이게 지금까지의 문제점들을 한 번에 해결해 줄 수 있겠구나!" 하는 생각이 들었고, 그 즉시 GitLab CI와 연동하기 위한 작업을 시작했습니다.

이 글에서는 왜 Postman을 선택했는지, 그리고 Postman을 이용해 작성한 테스트를 GitLab CI와 연동하는 방법에 대해서 다루려고 합니다.

## Postman: 100퍼센트의 테스트 도구

![Postman Logo](/blog/img/2017-11-09/postman.png)

[Postman](https://www.getpostman.com/)은 2012년에 서비스를 시작한 REST 클라이언트로 API 개발 전반에 걸쳐 필수적인 기능들을 제공합니다.
서비스 초반에는 단순한 기능들만을 제공했지만, 곧 문서화, 테스트를 위한 기능과 동기화, 공유와 모니터링 같은 고급 기능도 서비스하게 되었습니다.

현재는 RESTful API가 완전히 보편화 되었기 때문에 비슷한 도구들이 많이 등장했지만, Postman만의 강점이라면 인지도를 꼽을 수 있을 것입니다.

Postman은 큰 사용자 풀을 가지고 있기 때문에 다수의 Open API 제공 업체들이 Postman의 가져오기(import) 기능을 통해 활용 가능한 [Postman 용 컬렉션을 제공](https://www.getpostman.com/api-network/)하고 있습니다. 또, RESTful API를 다루는 도구들은 대부분 Postman 가져오기 기능을 제공하고 있습니다. 일례로, AWS의 서비스 중 하나인 API Gateway에서도 Postman 형식의 스펙 문서를 불러오는 기능을 제공합니다(썩 아름답게 동작하지는 않습니다만…). Postman 형식을 다른 형태로, 혹은 그 반대로 변환해주는 라이브러리들도 상당히 많은 편입니다. 그런 의미에서 Postman으로 API 테스트를 시작하는 것은 꽤 괜찮은 선택입니다.

직접 사용하면서 느낀 **Postman의 장점**들은 다음과 같습니다.

- API 문서를 작성하기 위해 특정한 문법을 공부할 필요가 없습니다.
- 사용하기 쉬운 UI를 제공합니다.
- 환경(언어, 사용하는 프레임워크, 플랫폼 등)에 상관없이 동작합니다.
- 작성한 문서를 테스트로, 반대로 테스트를 바로 문서로 활용할 수 있습니다.[^1]

Postman은 UI를 활용해 요청을 작성합니다. 특정 문법을 공부할 필요가 없으므로 빠르게 작업이 가능합니다. UI가 단순하고 직관적이며, 빠른 작업을 위해 자동 완성과 같은 기능을 적극적으로 제공합니다. 그래서 개발 언어나 프레임워크를 모르더라도 문서를 이해하고 수정할 수 있습니다. 테스트 스크립트를 짜는 데 자바스크립트가 필요하지만, 아주 기초적인 지식만으로도 작성할 수 있습니다. 

자바스크립트와 같은 단순한 언어를 사용해 얻는 또 하나의 이점은 상세한 테스트 표현에 유연하게 대응할 수 있다는 것입니다.

사용자의 환경에 상관없이 같은 방식으로 적용할 수 있다는 것은 매우 중요한 기능입니다. 물론 각 환경에 잘 맞는 테스트 프레임워크들이 있지만, 환경이 변경되면 같은 테스트를 또 다시 작성해야 하는 경우가 생길 수 있습니다.

Postman에서는 [Newman](https://github.com/postmanlabs/newman)이라는 CLI를 함께 제공하고 있습니다. 이 CLI를 사용하면 GUI를 사용할 수 없는 환경에서도 손쉽게 테스트를 수행할 수 있습니다.

밑에서 Newman을 사용해 GitLab CI 환경과 API 테스트를 통합할 것입니다.

## GitLab CI: 설정 기반의 소스 통합/배포 파이프라인

![GitLab Logo](/blog/img/2017-11-09/gitlab.png)

[GitLab](https://about.gitlab.com)이 설치형 GitHub라고 한다면, [GitLab CI](https://about.gitlab.com/features/gitlab-ci-cd/)는 [Travis CI](https://travis-ci.org/)에 비견될 수 있을 것입니다. GitLab에서는 CI/CD를 위한 파이프라인을 제공함으로써, 소스 반영과 함께 빌드/테스트/배포 등의 프로세스가 자동 실행되도록 설정할 수 있습니다.

위에서 언급한 Newman과 GitLab에서 제공하는 파이프라인을 결합하면 유용한 통합 환경을 제공할 수 있습니다.

GitLab CI도 Travis CI와 같이 YAML 형태의 설정 파일(`.gitlab-ci.yml`)을 처리합니다. 이 파일에는 사용자가 설정할 작업을 실행할 Docker 컨테이너(`image`, `service` 섹션)와 각 작업에서 실행할 스크립트를 정의합니다.

또한 [GitLab Runner](https://docs.gitlab.com/runner/)를 제공해, 로컬 환경에서 작업을 미리 실행시켜 볼 수 있습니다.

## Postman으로 테스트 작성하기

작업 과정을 설명하기 위해 Swagger의 예제로 잘 알려진 [Petshop API](http://petstore.swagger.io/)의 일부 CRUD 요청을 Postman으로 작성해 보았습니다.

### 시작하기 전에

Postman의 기본 요소들은 다음과 같습니다.

- **컬렉션(collection)**: 요청(request)들을 묶는 가장 큰 단위입니다. 프로젝트 개념과 비슷하다고 할 수 있습니다. 공유와 Postman Runner에서의 테스트는 컬렉션 단위로 이루어집니다.
- **폴더(folder)**: 컬렉션 안에서 요청을 구조화하는 데 사용됩니다. 폴더 구조는 문서에 그대로 반영되며 테스트 시에는 무시됩니다.
- **요청(request)**: HTTP 요청 하나를 의미하는 가장 작은 단위로, 요청 빌더를 통해 작성할 수 있습니다. 다양한 응답 형태를 문서화하기 위해 Examples 기능을 제공하고 테스트를 위해서는 Pre-request Script나 Tests를 작성할 수 있습니다.
- **환경(environment)**: 환경별로 달라지는 변수들을 관리하기 위한 집합입니다. 환경에 설정된 변수들은 요청에서 `{{"{{variable_name"}}}}` 형태로 활용할 수 있습니다.

테스트를 작성하기 전에 먼저 API 스펙을 확정해 문서 용도의 컬렉션(PetStore)과 요청(request)들을 생성하고 로컬 테스트를 위한 환경(environment), 환경 변수들을 설정하는 것을 추천합니다. 이렇게 하면, 나중에 테스트를 작성할 때 문서 용도로 작성된 요청을 복제해 사용할 수 있습니다. 

환경을 하나 생성해 아래 그림과 같이 필요한 변수들을 먼저 세팅합니다.

![Postman 환경 변수 설정](/blog/img/2017-11-09/api_env.png){:data-action="zoom"}
<figcaption>우측 상단의 설정 버튼을 눌러 Manage Environments를 선택해 환경 변수들을 관리할 수 있습니다.</figcaption>

위의 그림에서는 `Local`이라는 이름의 새로운 환경을 만들고 아래와 같이 두 가지 변수들을 추가하고 요청과 테스트를 작성할 때 사용합니다.

* `prefix`: 공통 URL 접두어로 사용합니다.
* `pet_id`: 리소스에 접근하기 위한 ID로 요청을 작성할 때 사용합니다.

![환경 변수 사용하기](/blog/img/2017-11-09/use_environment_variables.png){:data-action="zoom"}
<figcaption>환경 변수를 활용해 요청 작성이 가능합니다. URL 뿐만 아니라 HTTP 헤더, 바디, 파라미터, 테스트 스크립트 등 요청 빌더의 모든 곳에서 사용할 수 있습니다.</figcaption>

### 테스트 작성

각각의 CRUD API에 대해서 간단한 테스트를 작성해 보겠습니다.

![Postman 테스트 컬렉션 작성](/blog/img/2017-11-09/test_suites.png){:data-action="zoom"}
<figcaption>테스트 용도의 컬렉션을 만들고 폴더를 활용해 테스트를 구조화합니다.</figcaption>

일단 **(1) 테스트 용도로 컬렉션(PetStore Test)을 하나 생성**합니다. 테스트를 구조화하는 방식은 개인마다 다르겠지만 저는 검증할 API 당 하나의 폴더를 생성했습니다. 그 하위에 공통 요청(예: 로그인)을 위한 폴더와 성공/실패 케이스에 대한 폴더를 생성합니다. 

그리고 **(2) 각각의 폴더에 테스트를 위한 요청들을 생성합니다.** 이 요청들은 다른 설정[^2]을 하지 않는 이상 **눈에 보이는 그대로의 순서로 실행**됩니다. 문서 용도의 컬렉션(PetStore)에서 요청을 복제(duplicate)해 테스트 용도의 컬렉션에 추가하는 것으로 시작하면 더 편합니다.

이렇게 작성한 하나의 요청은 아래와 같은 순서로 실행됩니다.
![Postman 요청 실행 순서](/blog/img/2017-11-09/request_lifecycle.png){:data-action="zoom"}

이렇게 복제한 **(3) 요청에 테스트 스크립트를 추가**합니다. 요청 하나에 여러 개의 테스트 assertion을 포함할 수 있으며 테스트 assertion 하나는 다음의 형태로 작성합니다.

테스트 작성은 아래의 두 가지 방식 모두 잘 동작하지만 다양한 단축 기능들을 제공하는 [`pm` 전역 오브젝트](https://www.getpostman.com/docs/postman/scripts/postman_sandbox_api_reference#pm)를 활용하는 것을 추천합니다.

```js
// 새로운 방식
pm.test('테스트 이름', () => {
    var jsonData = pm.response.json();
    pm.expect(jsonData.value).to.eql(100);
});

// 오래된 방식
const jsonData = JSON.parse(responseBody);
tests['테스트 이름'] = jsonData.value === 100;
```

테스트 도중에 추출된 변수를 다른 요청에서 재사용하고 싶다면, 테스트 스크립트에서 환경에 새로운 변수를 추가하거나 변경할 수 있습니다.

아래와 같이 "등록 성공" 요청에서 변수 `added_pet_id`를 저장합니다.

```js
pm.environment.set('added_pet_id', value);
```

이 값은 위 식이 실행되는 순간 현재 선택된 환경 변수(여기서는 `Local` 환경)에 저장됩니다(이미 있다면 덮어씌워 집니다). 이후에 실행되는 다른 요청에서 일반적인 환경 변수 접근 방법과 같이 `{{"{{added_pet_id"}}}}` 표현 식으로 사용할 수 있습니다. 예를 들어 "등록 성공" 요청에서 저장한 `added_pet_id`를 "삭제 성공" 테스트를 위해 사용할 수 있을 것입니다.

이 외에도 다양한 내장 API들과 외부 라이브러리를 활용할 수 있습니다.[^3] 

### Postman UI에서 테스트 실행하기

Postman UI 상에서 테스트를 진행하는 방법은 두 가지입니다. **요청 빌더에서 바로 실행**하는 방법과 **컬렉션 러너(Collection Runner)**에서 실행하는 방법이 있습니다.

#### 요청 빌더에서 테스트하기

요청 내용과 테스트 스크립트를 작성한 뒤 URL 필드 우측의 [Send] 버튼을 눌러 요청을 바로 실행하고 Body 탭에서 요청의 결과를, Test Results 탭에서 테스트 결과를 확인할 수 있습니다.

![Postman의 Test Result 탭](/blog/img/2017-11-09/request_test_results.png){:data-action="zoom"}
<figcaption>하단의 Test Results 탭에서 성공/실패한 테스트를 확인할 수 있습니다.</figcaption>

#### 컬렉션 러너(Collection Runner)에서 테스트 실행하기

컬렉션 내의 모든 요청을 순차적으로 테스트하려면 **(1) 컬렉션의 [>] 버튼을 클릭해 메뉴를 열고 파란색 [Run] 버튼을 누릅니다**.

![Postman Collection Runner 실행하기](/blog/img/2017-11-09/collection_run.png){:data-action="zoom"}
<figcaption>[>] 버튼을 눌러 나오는 컬렉션 상세 화면에서는 컬렉션 러너를 실행하는 것 외에도 다운로드, 모니터링, 목업 API 생성, 문서 배포 등의 추가 기능들을 제공합니다.</figcaption>

이 버튼을 누르면 Collection Runner 창이 새로 열립니다. 여기에서 **(2) 환경, 요청 반복 횟수, 지연 시간 등의 기본적인 설정을 한 후 [Run PetStore Test] 버튼을 눌러 컬렉션 전체를 실행**합니다.

![Postman Collection Runner 결과 확인](/blog/img/2017-11-09/collection_run_result.png){:data-action="zoom"}

위와 같이 **(3) Run Result 화면에서 테스트 결과를 한눈에 확인**할 수 있으며, 각 요청의 제목을 클릭해 요청/응답 결과를 상세하게 확인할 수 있습니다.

### GitLab CI 설정

이제 GitLab CI에서 Newman을 사용해 위에서 작성한 Postman 테스트를 실행할 순서입니다.

우선 **(1) 테스트용 컬렉션과 환경을 JSON 형태로 내려받습니다**. 저는 **(2) 추출된 파일을 API 서버 프로젝트의 `./tests/postman/` 디렉터리 하위에 저장**했습니다.

여기서는 API가 Node.js 환경에서 구동된다고 가정하고 설명하겠습니다. **(3) 프로젝트 루트에 `.gitlab-ci.yml`을 생성하고 다음과 같이 작성**합니다.

```yaml
# .gitlab-ci.yml

image: node:latest
...
test_api:
  before_script:
    # Newman 설치
    - npm install newman -g
  script:
    # API 서버 실행 (백그라운드)
    - nohup npm start &
    # Newman 실행
    - newman run ./tests/postman/api_test.postman_collection.json -e ./tests/postman/gitlab.postman_environment.json
```

먼저 `before_script` 섹션에 Postman 테스트를 실행할 수 있도록 **Newman package를 설치**(`npm install newman -g`)합니다. 미리 사용할 Docker 이미지에 설치하는 방법도 있습니다.

그 후 실행되는 `script` 섹션에서 테스트할 **API 서버를 실행**(백그라운드)한 뒤 추출된 Postman JSON 파일들을 **Newman CLI를 사용해 실행**시킵니다. (유료 계정을 사용한다면, 파일을 추출해 사용하는 대신 URL을 사용해 실행할 수도 있습니다)

```
newman run [collection_json] -e [environment_json]
```

이제 **(4) 저장소에 작업 결과를 반영(commit)하면 바로 작업 파이프라인이 실행**됩니다. 결과는 다음과 같이 출력됩니다. 작업결과에 오류가 발생하면 오류 코드를 발생시키고 끝나게 되므로, 안전하게 다음 파이프라인은 실행되지 않습니다.

![GitLab CI 작업 결과 확인](/blog/img/2017-11-09/gitlab_ci_result.png){:data-action="zoom"}
<figcaption>테스트가 성공했습니다. 콘솔에 전체 테스트 결과와 요약 내용이 출력됩니다.</figcaption>

## 문서화

위에서 설명 드린 것처럼, Postman은 문서화 기능도 함께 제공합니다. API 스펙 용도로 만들었던 PetStore 컬렉션의 [Publish Docs] 기능을 이용해 다음과 같은 페이지를 확인할 수 있습니다. 이 주소는 public에 공개됩니다(무료 계정일 경우 1달에 1000번의 조회만 가능합니다).

![PetStore API 문서](/blog/img/2017-11-09/document.png){:data-action="zoom"}
<figcaption>문서 상에서 [Run in Postman] 버튼을 클릭해 Postman에 추가해 직접 실행할 수 있고, 오른쪽에서 등록한 응답 샘플들과 이 응답 샘플을 얻기 위한 코드 예제들을 확인할 수 있습니다.</figcaption>

## 마무리

RESTful API를 작성하고 배포한 경험이 있는 분들이라면 API 문서화와 테스트에 대해 한 번쯤은 고민해 보셨을 것입니다. Postman은 API 테스트에 필요한 다양한 기능들을 제공하고 굉장히 편리한 UI를 가지고 있습니다. 또, Newman CLI와 결합하면, 각기 다른 환경에서 동일한 방법으로 테스트를 실행할 수 있습니다. 그래서 로컬 환경이나 GitLab CI에서 Newman을 동작시켜 보셨던 분들이라면 다른 CI 도구에 적용하는 것은 매우 간단할 것입니다.

사실 Postman의 협업을 위한 기능들(유료로 제공)을 사용하지 않으면, 대규모의 팀에서 위에서 설명한 것과 같이 가져오기/내보내기 방식으로 API 문서를 작성하는 것은 분명 한계가 있습니다. 하지만 유료 기능을 꼭 사용하지 않더라도 테스트를 하는데 편리한 여러 기능을 제공하고 있으므로, 꼭 한 번 사용해 보시는 것을 권해드리고 싶습니다.

---
[^1]: 이 부분은 사실 반은 맞고 반은 틀립니다. 테스트와 API 문서는 목적이 다르므로, 그 형태가 달라질 수밖에 없습니다. 테스트의 경우 예외 케이스들을 검사하기 위해 같은 API에 대한 문서가 여러 차례 포함되므로, API 사용자를 위한 문서로는 장황하다고 할 수 있습니다.

[^2]: Postman의 내장 함수인 [`setNextRequest()`](https://www.getpostman.com/docs/postman/scripts/branching_and_looping)를 사용하면 요청의 흐름을 쉽게 제어할 수 있습니다.

[^3]: 다양한 내장 API를 활용해 테스트를 작성하는 방법은 [Test Examples](https://www.getpostman.com/docs/postman/scripts/test_examples?q=expect&idx=blog&p=0&is_v=2)에서 확인할 수 있습니다. 그 중 [`require()`](https://www.getpostman.com/docs/postman/scripts/postman_sandbox_api_reference)를 이용하면 외부 라이브러리를 활용할 수 있습니다. [Lodash](https://lodash.com/)의 경우에는 내장되어 있어 글로벌 변수(`_`)로 사용 가능합니다.
