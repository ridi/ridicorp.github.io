---
layout: blog_post
title: "Index Aliases 활용 팁"
description: "Elasticsearch를 안정적으로 운영하기 위해 Index Aliases를 활용한 사례를 공유합니다."
header-img: "blog/img/2018-10-01/header.svg"
date: 2018-10-01
author: "neo"
category: engineering
published: true
---

# Elasticsearch

> Elasticsearch is a distributed, RESTful search and analytics engine capable of solving a growing number of use cases.

[Elasticsearch](https://www.elastic.co/products/elasticsearch)는 분산형 RESTful 검색 및 분석 엔진입니다.

분산형이기 때문에 데이터 증가에 따라 유연하게 확장할 수 있고, RESTful API를 제공하기 때문에 손쉽게 색인, 검색, 분석이 가능합니다.
오늘날 많은 기업 및 개인이 다양한 검색, 로깅, 분석 서비스에 Elasticsearch를 활용하고 있습니다.
사용자 층이 두터운 만큼 관련 커뮤니티가 활발히 운영되고 있고 유스케이스 또한 풍부하여 다양한 상황에서 응용 가능합니다.
본 글에서는 Elasticsearch를 안정적으로 운영하는데 유용한 [색인 별명(Index Aliases)](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-aliases.html)라는 기능을 활용한 몇 가지 사례를 공유합니다.

# 색인 별명(Index Aliases)

유닉스 명령어 중에 별명을 붙여주는 `alias`라는 명령어가 있습니다.

```bash
$ alias ll='ls -al'
$ alias vi='vim'
$ alias grep='grep --color=auto'
```

Elasticsearch에서도 [색인](https://www.elastic.co/blog/what-is-an-elasticsearch-index)에 별명을 붙여줄 수 있는데 이를 [색인 별명(Index Aliases)](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-aliases.html)라고 합니다.

some-index라는 색인에 some-alias라는 별명을 붙여보겠습니다.

```bash
$ curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d'
{
    "actions": [
        {
            "add" : {
                "index" : "some-index",
                "alias" : "some-alias"
            }
        }
    ]
}'

{"acknowledged":true}%

```

위 예제에서 `add` 대신 `remove` 키워드를 사용하면 some-index라는 색인에서 some-alias라는 별명을 지우라는 의미가 됩니다.


별명이 잘 붙었는지는 다음과 같이 확인해 볼 수 있습니다.

```bash
$ curl -X GET 'localhost:9200/_cat/aliases?v'
alias      index      filter routing.index routing.search
some-alias some-index -      -             -
```

이제 조회, 검색 등 거의 모든 기능을 실행하기 위해 some-index라는 실제 색인명 대신 some-alias라는 별명으로 접근할 수 있게 되었습니다.


색인 별명을 변경할 때에는 한 가지 주의해야 할 점이 있습니다.
다음과 같이 별명을 붙이고 지우는 두 가지 작업을 동시에 해야 합니다.
별명을 먼저 붙이면 동일한 별명을 가진 색인이 2개가 되므로 (거의) 동일한 검색결과가 2건씩 나오게 됩니다.
반대로 기존 별명을 먼저 지우면 클라이언트에서 검색 요청이 들어왔을 때 해당 별명이 없으므로 오류가 발생합니다.

```bash
$ curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d'
{
    "actions" : [
        {
            "add": {
                "index": "some-index-new",
                "alias": "some-alias"
            },
            "remove" : {
                "index" : "some-index",
                "alias" : "some-alias"
            }
       }
    ]
}'
```


# 색인 이중화

검색 서비스 운영 중에 실수로 색인을 잘못 만들어 검색결과에 일부 데이터가 누락된 일이 있었습니다.
다행히 미리 만들어 두었던 2차 색인으로 교체하여 장애를 빠르게 복구할 수 있었습니다.

만약 아무런 대비가 없었다면 아마도 다음과 비슷한 절차를 거쳤을 겁니다.

1. 원본 색인(some-index)의 문제로 인한 장애를 발견합니다.
2. 새로운 색인(some-index-new)을 만듭니다.
3. 스냅샷 또는 원본 데이터 저장소로부터 데이터를 추출하여 새로 만든 색인(some-index-new)에 색인합니다.
4. 검색 클라이언트 코드 내에 하드코딩되어 있는 색인명(some-index)을 새로 만든 색인명(some-index-new)으로 변경하고 배포합니다.

여기에는 두 가지 문제점이 있습니다.

첫번째는 위 과정이 완료될 때까지 장애가 서비스에 그대로 노출된다는 점입니다.

색인하는 것은 검색 서비스에서 가장 많은 시간이 소요되는 부분 중 하나입니다.
이러한 긴 시간동안 장애가 노출되는 것을 피하기 위해서는 별개의 2차 색인을 미리 만들어 이중화 해 두는게 좋습니다.
1차 색인에 문제가 생기면 미리 만들어 두었던 2차 색인으로 교체하면 됩니다.

두번째는 서빙하는 색인을 변경할 때 마다 검색 클라이언트 코드도 함께 변경해야 한다는 점입니다.

색인에 별명을 미리 붙여두고 검색 클라이언트 코드에는 실제 색인명이 아닌 별명을 사용하도록 하면 검색 클라이언트 코드와 무관하게 서빙중인 색인을 교체할 수 있습니다.
원본 색인에 문제가 생기면 별명의 타겟을 2차 색인으로 교체하기만 하면 됩니다.



# Log Rotation

서비스를 운영하다보면 각종 로그를 수집, 가공, 분석하는 일이 반드시 필요하게 됩니다.
[Logstash](https://www.elastic.co/products/logstash)로 로그를 수집하여 Elasticsearch에 저장한 후 이를 [Kibana](https://www.elastic.co/products/kibana)로 분석하는데 줄여서 ELK Stack이라고 합니다.
요즘에는 여기에 기능을 개선하고 유용한 플러그인들을 추가해서 Elastic Stack이라고도 합니다.

이번 단락에서는 ELK Stack을 운영하던 중에 겪었던 장애 상황과 이를 해결하기 위해 색인 별명(Index Aliases)를 응용하여 [Log Rotation](https://en.wikipedia.org/wiki/Log_rotation)을 도입한 사례를 소개해 드립니다.

ELK Stack을 도입하고 얼마 지나지 않아 디스크가 가득 차서 더 이상 로그를 저장할 수 없게 되었습니다.
디스크 공간을 확보하기 위해 평소처럼 오래된 데이터를 삭제했습니다.

```bash
$ curl -X POST 'localhost:9200/log-index/_delete_by_query' -d '
{
    "query": {
        "range": {
            "datetime": {"lt": "2018-08-01", "format": "yyyy-MM-dd"}
        }
    }
}'
```

아무런 반응이 없습니다.
원인을 찾아보니 Elasticsearch는 삭제시 기존 데이터를 바로 지우는게 아니라 지웠다는 표시만 달아준다고 합니다.
마찬가지로 갱신시에도 기존 데이터를 직접 수정하는게 아니라 기존 데이터에 지웠다는 표시만 달아주고 새로운 데이터를 삽입합니다.
Elasticsearch는 삽입은 쉽지만, 삭제나 갱신 비용이 크다는 특징이 있기 때문입니다.
그러한 흔적을 `deleted_docs`나 `_version` 정보를 통해 간접적으로 확인해 볼 수 있습니다.

```bash
$ curl -X GET 'localhost:9200/log-index/_status?pretty'
{
    ...
    "docs": {
        "num_docs": 1457,
        "max_doc": 1462,
        "deleted_docs": 5
    },
    ...
}

$ curl -X GET 'localhost:9200/log-index/log-type/2?pretty'
{
    "_index" : "log-index",
    "_type" : "log-type",
    "_id" : "2",
    "_version" : 2,
    "found" : true,
    "_source": {
        "referrer": "ridibooks.com",
        "response_code": "200",
        "message": "some message",
        "datetime": "2018-08-01T10:10:10"
    }
}
```

그러면 지워진 데이터는 영원히 남아있는 걸까요? 그렇지 않습니다.
지웠다는 표시를 단 채 디스크에 남아 있다가 백그라운드로 주기적으로 또는 특정 임계치를 넘기면 더 이상 필요없어진 데이터들을 정리하고 새로운 [세그먼트](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-segments.html)에 병합한 후 기존 세그먼트를 삭제합니다.
이때 비로소 디스크에서 완전히 삭제되는데 이를 [세그먼트 병합(Segment Merging)](https://www.elastic.co/guide/en/elasticsearch/guide/current/indexing-performance.html#segments-and-merging)이라고 합니다.

세그먼트 병합은 In-Place 업데이트가 아닙니다.
새로운 세그먼트를 만들 공간이 있어야 하기 때문에 디스크가 이미 꽉 찬 상태에서는 무용지물입니다.
따라서 디스크가 가득찬 상태에서는 세그먼트 병합을 기반으로 하는 삭제 방법은 사용할 수 없습니다.

세그먼트 병합은 시스템 자원을 비교적 많이 쓰는 부담스러운 작업입니다.
그래서 시스템 자원이 여유로울 때 서비스에 영향을 주지 않는 선에서 조심스럽게 진행합니다. 원하는 시점에 강제로 세그먼트 병합을 하고 싶다면 [force merge](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-forcemerge.html)(>Elasticsearch2.0)나 [optimize](https://www.elastic.co/guide/en/elasticsearch/reference/1.7/indices-optimize.html)(<=Elasticsearch2.0) API를 사용할 수도 있습니다.
다른 방법으로 각 문서마다 [TTL](https://www.elastic.co/guide/en/elasticsearch/reference/2.0/mapping-ttl-field.html)(Time To Live)을 설정해서 해당 시각이 지나면 자동으로 삭제되도록 할 수도 있습니다.
하지만 이 역시 세그먼트 병합을 통해 삭제되기 때문에 비효율적입니다.
그런 이유 때문인지 `_ttl` 필드는 Elasticsearch 2.0.0-beta2 버전부터 deprecated 되었습니다.

대안을 찾다가 색인을 삭제하면 그 즉시 디스크에서 삭제된다는 사실이 떠올랐습니다.
게다가 `_delete_by_query` API 를 사용하여 문서를 삭제하는 방법보다 효율적입니다.
하지만 기존에는 하나의 색인에 모든 로그 데이터를 저장하고 있었기 때문에 그 하나의 색인을 무작정 삭제할 수는 없었습니다.
고민 끝에 기존 색인을 포기하고 새로운 색인을 만들어 [Log Rotation](https://en.wikipedia.org/wiki/Log_rotation)을 적용해 보기로 했습니다.
Log Rotation은 로그 파일을 날짜별로 만들고 가장 오래된 로그를 먼저 지워서 최근 N개의 로그 파일만 유지하도록 하는 방법입니다.
`logrotate`라는 리눅스 유틸리티를 사용해 보셨다면 쉽게 이해가 되실 겁니다.

Log Rotation 방법은 다음과 같습니다.
일 단위로 예를 들었지만, 운영하시는 로그 시스템 규모에 따라 시간 단위, 주 단위, 월 단위 등등 얼마든지 자유롭게 구성하셔도 됩니다.

1. 일 단위로 새로운 색인을 만듭니다. (색인명에 날짜정보를 넣으면 구분하기 좋습니다.)
2. 로그 데이터는 오늘 생성한 색인에 저장합니다.
3. 가장 오래된 (N일 전에 생성한) 색인을 삭제합니다.
4. 로그 분석시에는 최근 N일 간의 모든 색인에서 조회합니다.

`오늘 생성한 색인`, `최근 N일 간의 모든 색인` 등을 쉽게 구분하기 위해 아래와 같이 적절한 별명을 붙여줍니다.

```bash
$ curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d'
{
  "actions": [
      {
            "add": {"index": "log-2018-08-02", "alias": "log"},
            "add": {"index": "log-2018-08-03", "alias": "log"},
            "add": {"index": "log-2018-08-04", "alias": "log"},
            "add": {"index": "log-2018-08-05", "alias": "log"},
            "add": {"index": "log-2018-08-06", "alias": "log"},
            "add": {"index": "log-2018-08-07", "alias": "log"},
            ...
            "add": {"index": "log-2018-09-01", "alias": "log"},
            "remove": {"index": "log-2018-08-01", "alias": "log"},

            "add": {"index": "log-2018-09-01", "alias": "log-today"}
      }
  ]
}'
```

이제 log라는 별명을 통해 전체 기간의 로그데이터를 단일 색인인 것 처럼 사용할 수 있게 되었습니다.
또 log-today라는 별명을 통해서는 오늘의 로그데이터만을 한정해서 사용할 수도 있습니다.
이렇게 여러 색인에 하나의 동일한 별명을 붙여줄 수도 있고, 하나의 색인에 여러개의 별명을 붙여줄 수도 있습니다.
조금만 응용하면 필요에 따라 오늘의 로그, 최근 일주일 간의 로그, 최근 한 달 간의 로그 등등의 별명을 얼마든지 붙여두고 사용할 수 있습니다.

### 자동화

Elasticsearch에는 [Curator](https://www.elastic.co/guide/en/elasticsearch/client/curator/current/about.html)라는 자동화 도구가 있습니다.
json형식의 복잡한 Elasticsearch Query DSL 대신 간결한 YAML 형식으로 설정할 수 있고 날짜 형식(`%Y-%m-%d`, `N일 전`)을 표현할 수 있어서 날짜 단위의 반복 작업에 유용합니다.
아래는 Curator를 이용해 Log Rotation을 재구성한 예제입니다.
상황에 맞추어 적당히 수정해서 사용하시면 되겠습니다.

```yaml
actions:
  1:
    action: create_index
    description: '오늘의 색인 만들기'
    options:
      name: 'log-%Y-%m-%d'
      extra_settings:
        settings:
          number_of_shards: 5
          number_of_replicas: 2
      continue_if_exception: False
      disable_action: False
  2:
    action: alias
    description: 'log-%Y-%m-%d 패턴의 모든 색인에 all_log라는 별명 붙이기'
    options:
      name: all_log
      extra_settings:
      timeout_override:
      continue_if_exception: False
      disable_action: False
    add:
      filters:
      - filtertype: pattern
        kind: timestring
        value: 'log-%Y-%m-%d'
        exclude:
  3:
    action: alias
    description: '오늘의 색인에 today_log라는 별명 붙이기'
    options:
      name: today_log
      extra_settings:
      timeout_override:
      continue_if_exception: False
      disable_action: False
    add:
      filters:
      - filtertype: pattern
        kind: prefix
        value: log-
        exclude:
      - filtertype: age
        source: name
        direction: younger
        timestring: '%Y-%m-%d'
        unit: days
        unit_count: 1
        exclude:
    remove:
      filters:
      - filtertype: pattern
        kind: prefix
        value: log-
        exclude:
      - filtertype: age
        source: name
        direction: older
        timestring: '%Y-%m-%d'
        unit: days
        unit_count: 1
        exclude:
  4:
    action: delete_indices
    description: '오래된 인덱스 삭제하기'
    options:
      timeout_override: 300
      continue_if_exception: False
      ignore_empty_list: True
      disable_action: False
    filters:
    - filtertype: age
      source: name
      direction: older
      timestring: '%Y-%m-%d'
      unit: days
      unit_count: 60
      exclude:
```

# 마치며

Elasticsearch 서비스를 안정적으로 운영하기 위한 다양한 방법들이 존재합니다.
대부분 꽤나 복잡한 설정을 해야하고 추가 비용도 발생합니다.
이번 글에서는 사용하기 간편하면서 추가 비용도 들지 않는 색인 별명(Index Aliases)를 활용한 방법에 대해서 공유 드렸습니다.
상황에 맞게 여러 가지 방법들을 적절히 섞어서 구성하면 좀 더 안정적인 서비스를 운영하는데 도움이 될 것 입니다.
