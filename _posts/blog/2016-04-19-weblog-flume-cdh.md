---
layout: blog
category: blog
title: "웹서버 로그 수집과 모니터링 설정"
description: "Flume 과 CDH 를 사용해서 끊김없이 로그 수집하기"
header-img: "img/blog-bg-1.jpg"
date: 2016-04-19
author: chanu.lee
type: engineering
published: true
---

우리는 고객이 무엇에 관심 있어 하고 무엇에 관심 없어하는지, 어떤 것을 보았을 때 클릭해 들어가고 어떤 것을 보았을 때 사이트에서 이탈하는지 궁금해 합니다. 이러한 정보를 얻기 위해 봐야 할 것은 역시 웹서버의 접속 로그입니다.

처음에는 매일 생성되는 로그 파일을 일일이 파싱해서 원하는 정보를 DB에 쌓는 방법을 이용했지만, 이러한 방식은 한계가 있었습니다. 저장할 수 있는 데이터의 양에 심각한 제한이 있었고, 따라서 처음에 얻고자 했던 데이터 이상의 것을 새로 추출할 수도 없었습니다. 

그래서 지금은 웹서버 로그를 하둡(Hadoop) 클러스터에 쌓고 있습니다. Google Analytics 같은 외부 분석툴을 사용하기도 하지만, 아무래도 데이터를 우리 손에 직접 들고 있는 것이 더 유연한 분석을 제공할 수 있지요. 클러스터에서 로그를 분석하려면 가장 먼저 로그 수집 시스템을 만들어야 합니다.

이번 포스팅에서는 이 로그 수집 시스템이 어떻게 만들어져 있는지, 그리고 그보다 더 중요한 시스템의 모니터링을 어떻게 하고 있는지 설명하려고 합니다.

---

# Flume 에이전트 설정하기

## Apache Flume

[Apache Flume](https://flume.apache.org/)은 로그와 같은 데이터의 흐름(streaming)을 제어할 수 있게 해주는 도구입니다. 단순하면서도 확장성 높은 구조로 되어 있기 때문에 많은 시스템에서 채택하는 도구가 되었고, 리디북스에서도 Flume 을 사용하게 되었습니다.

Flume 의 기본 구조는 단순합니다.

![기본적인 에이전트 구성](https://i.imgur.com/w5awy6k.png){: data-action="zoom" }
<figcaption>기본적인 에이전트 구성 (이미지 출처: Apache Flume 홈페이지)</figcaption>

* 에이전트(agent)는 Source, Channel, Sink 로 이루어진 자바 프로세스이다.
* 소스(source)는 외부에서 이벤트를 입력받아 채널(channel)로 전달하고, 채널은 이벤트를 저장하고 있다가 싱크(sink)로 전달한다. 싱크는 이벤트를 외부로 출력한다.
* 한 에이전트의 Sink와 다른 에이전트의 Source가 같은 타입이면, 에이전트 간에 이벤트를 전달할 수 있다.

굉장히 간단하지만 강력한 모델입니다. Flume 은 Avro, Thrift, Exec, HDFS, Kafka 등 다양한 라이브러리를 적용한 소스와 싱크를 미리 제공하고 있기 때문에, 사용자는 자기 입맛에 맞게 이를 조합해서 시스템을 구성할 수 있습니다.

예를 들면 아래와 같습니다.

![좀 더 복잡한 Agent 구성](https://i.imgur.com/3gFrUT6.png){: data-action="zoom" }
<figcaption>좀 더 복잡한 에이전트 구성 (이미지 출처: Apache Flume 홈페이지)</figcaption>


## 초기 에이전트 구성: [Avro](https://avro.apache.org/)를 통해 클러스터에 로그 전송

저희가 맨 처음 설정한 Flume 에이전트의 구성은 다음과 같습니다.
![에이전트 구성2](https://i.imgur.com/1sZJQ9B.png){: data-action="zoom" }
<figcaption>초기 에이전트 구성</figcaption>

* 각 웹서버
  * ExecSource: exec 명령으로 실행된 프로세스의 표준 출력을 이벤트로 입력받음. (tail -F <로그파일>)
  * MemoryChannel: 메모리상의 큐(queue)로 구현된 채널
  * AvroSink: 클러스터에 상의 에이전트가 실행하는 Avro RPC 서버로 이벤트를 전송
* 하둡 클러스터
  * AvroSource: 웹서버의 에이전트가 Avro RPC 로 보내는 이벤트를 수신
  * MemoryChannel
  * HDFSSink: HDFS 상의 지정된 경로의 파일에 이벤트 내용을 출력

각 웹서버에는 에이전트가 하나씩 실행되어서, 로그 파일에 새로 추가되는 로그를 클러스터에 전송합니다. 클러스터 상의 에이전트는 단 한 개 존재하는데, 웹서버로부터 전송받은 로그를 HDFS(Hadoop File System) 에 파일로 출력하는 역할을 합니다. 웹서버 에이전트와 클러스터 에이전트 간의 통신은 Avro RPC 로 하게 하였습니다. Flume 에서 기본적으로 AvroSource 와 AvroSink 를 구현하여 제공해 주는 것을 이용했습니다.

사실은 클러스터 상의 에이전트가 Avro 서비스를 통해 데이터를 모아 주지 않고, 웹서버 상의 에이전트가 HDFSSink 를 이용해서 직접 클러스터에 파일을 쓰게 하더라도 대부분의 경우는 상관없습니다. 하지만 리디북스의 경우는 그렇게 할 수 없었는데, 왜냐하면 웹서버와 하둡 클러스터가 서로 다른 네트워크 상에 있기 때문입니다.

리디북스의 웹서버는 국내 IDC에 존재하지만 하둡 클러스터는 Miscrosoft Azure 클라우드 내의 가상머신으로 실행되고 있습니다. 따라서 하둡의 네임노드(namenode)가 인식하는 각 노드의 사설 IP 주소를 웹서버들이 쉽게 접근할 수 없습니다. 이를 우회하는 다양한 방법을 시도해 보았지만 최종적으로는 Avro 서비스를 중간에 두어 해결하였습니다.


# 모니터링 알람 설정하기

## JSON 리포팅 사용

다음은 에이전트 프로세스를 모니터링하는 문제가 있었습니다. 예기치 않은 에러로 에이전트가 종료되어서 로그가 수집되지 않고 있는데 며칠 동안 모르고 있어서는 안되겠지요.

Flume 에서는 [모니터링 인터페이스](https://flume.apache.org/FlumeUserGuide.html#monitoring)도 여러가지를 제공하고 있는데, 그 중 가장 이용하기 간편한 것은 HTTP 를 통한 JSON reporting 이었습니다. 에이전트 자체가 HTTP 서비스로 작동해서, 특정 포트로 요청을 보내면 에이전트의 상태를 JSON 으로 정리하여 응답을 주게 되어 있습니다. 에이전트 실행시에 옵션 몇 개만 추가하면 바로 설정할 수 있기 때문에 매우 간단합니다.

## Health 페이지를 이용한 모니터링

그런데 이 리포팅이 제대로 나오지 않으면 어떻게 알림을 받을 수 있을까요? 각 서버마다 JSON 리포팅을 요청해서 응답이 제대로 오지 않으면 이메일을 보내는 스크립트를 만들어서 cron 으로 5분마다 실행하는 방법도 있습니다. 하지만 이 스크립트가 제대로 동작하지 않거나, 이게 실행되는 서버가 다운되면?

결국 스스로를 믿지 못하고 택한 방법은 외부 서비스 [Pingdom](https://www.pingdom.com/)을 이용하는 것이었습니다. 단, 외부 서비스가 각각의 웹서버에 직접 접근하여 리포팅을 요청하는 방식은 보안상 문제가 될 수 있어서 아래와 같이 보완하였습니다.

* 웹 서비스 상에 health 페이지 구현. 이 페이지는 각 웹서버의 에이전트의 JSON reporting 포트로 요청을 보내서, 결과를 종합해서 다시 JSON 으로 보여줌.
* 모든 에이전트가 정상적으로 리포트를 보내면 {“status”: “OKAY”} 를, 아니면 {“status”: “ERROR”} 를 보여줌.
* 이 health 페이지의 내용을 모니터링하도록 Pingdom 설정. {“status”: “OKAY”} 가 응답에 없으면 알람 메일이 오도록 함.

{% highlight json linenos %}
{
    "status": "OKAY",
    "metrics": {
        "192.168.0.101": {
            "SOURCE.log_src": { ... },
            "SINK.avro_sink": {
                "BatchCompleteCount": 562110,
                "ConnectionFailedCount": 294,
                "EventDrainAttemptCount": 56246850,
                "ConnectionCreatedCount": 31,
                "Type": "SINK",
                "BatchEmptyCount": 16,
                "ConnectionClosedCount": 30,
                "EventDrainSuccessCount": 56243927,
                "StopTime": 0,
                "StartTime": 1459135471379,
                "BatchUnderflowCount": 610
            },
            "CHANNEL.mem_channel": { ... }
        },
        "192.168.0.102": { ... }
    }
}
{% endhighlight %}
<figcaption>Health 페이지의 JSON 내용</figcaption>

## JSON 리포팅의 문제

이렇게 설정해 놓고, 며칠간 로그가 HDFS 상에 잘 수집되는 것을 확인하고 만족해 했습니다. 그런데 며칠간 신경을 쓰지 않은 사이, 다시 에이전트를 확인해 보니 모든 웹서버 에이전트가 죽어 있었습니다. HDFS에 로그도 쌓이지 않았구요.

확인해 보니, MemoryChannel 의 설정 문제였습니다. byteCapacity 값을 실수로 너무 작게 설정해서, 채널 큐가 메모리 부족으로 터져나간 것이죠. 해당 문제는 byteCapacity 값을 늘려서 간단하게 해결했습니다.

문제는 알람이 오지 않았다는 것이었습니다. 문제를 재현해 본 결과, 채널이 터져서 에이전트 실행이 중단되어도, 에이전트 프로세스는 죽지 않고 ExecSource 에서 실행한 자식 프로세스(tail -F)만 죽어 있었습니다. 이렇게 되면 JSON 리포팅도 정상적으로 나오기 때문에, 결국 JSON 리포팅으로는 이런 유형의 에러를 잡지 못한다는 결론이 나왔습니다.


# 클러스터에 모니터링 설정하기

결국 웹서버상에서 모니터링하는것 보다는 데이터를 최종 전달받는 하둡 클러스터 상에서 모니터링하는 것이 안정적이라 판단하였습니다. 다행히도, 하둡 클러스터에서 사용할 수 있는 꽤나 좋은 모니터링 도구가 이미 있었습니다.

## CDH 의 알람 트리거

리디북스에서는 기본 하둡 패키지가 아닌, Cloudera에서 제공하는 하둡 배포판인 [Cloudera CDH](https://www.cloudera.com/products/apache-hadoop/key-cdh-components.html)를 사용하고 있습니다. CDH는 클러스터 상에서 사용되는 서비스마다 각종 테스트를 자동으로 실행하여, 테스트가 통과되지 않을 때마다 메일로 알람을 보내줍니다. 그리고 웬만한 필수 테스트는 기본적으로 설정되어 있지만, 사용자가 커스텀 서비스를 직접 제작할 수도 있습니다. CDH가 각 에이전트의 소스, 채널, 싱크마다 초당 전송한 이벤트 개수 등의 측정치(metric)을 모두 기록하고 있기 때문에, 이 값들이 일정 수준 이상/이하가 될 때마다 알람이 트리거되도록 설정할 수 있습니다.

![CDH 의 알람 트리거 편집 화면](https://i.imgur.com/3Wi4FS8.png){: data-action="zoom" }
<figcaption>CDH의 알람 트리거 편집 화면</figcaption>

## 웹서버마다 알람 설정하기

그런데 이것으로 끝이 아닙니다. 클러스터 에이전트는 각 서버에서의 트래픽이 모두 모이는 곳이기 때문에, 여기에서 모니터링을 하는 것은 웹서버 상에서 모니터링하는 것보다 기준이 애매해집니다.

10대의 웹서버 중에 한 대만 문제가 생겼을 경우, 클러스터 에이전트가 받는 트래픽은 0으로 줄어드는 것이 아니라 90%로 줄어듭니다. 알람을 트리거하는 역치(threshold)를 평소 트래픽의 90%로 잡아야 한다는 것이지요. 그런데 트래픽이라는 것이 원래 날짜와 시간에 따라 달라지기 때문에, 이 역치값을 고정된 값으로 정할 수가 없습니다. 트래픽이 높은 때를 기준으로 하면, 트래픽이 낮아지는 새벽 시간마다 가짜 알람(false alarm)이 오게 되겠지요. 그렇다고 트래픽이 낮은 때를 기준으로 하면, 트래픽이 높은 때 웹서버 에이전트가 죽더라도 새벽이 될 때까지 알 수 없습니다.

결국 클러스터 단에서도 각 웹서버마다 트래픽을 구분해 주어야 한다는 결론이 나옵니다. 다행히 한 에이전트가 여러 개의 채널과 싱크를 가질 수 있고, 이벤트 헤더의 내용에 따라 소스가 어느 채널로 이벤트를 보낼지 결정해 주는 채널 셀렉터 (Channel Selector)라는 것이 있습니다.

* 웹서버 에이전트의 소스에서는 각 이벤트 헤더에 자기 호스트명을 달아 준다. (Interceptor 는 각 이벤트에 원하는 헤더를 달아주는 역할을 한다. HostInterceptor 이용)
* 클러스터 에이전트는 1개의 소스와, 웹서버 대수만큼의 채널 및 싱크가 있다.
* 클러스터의 소스는 이벤트의 host 헤더를 보고 그에 해당하는 채널로 이벤트를 전달한다. (MultiplexingSelector 사용)
* 각 채널은 자신에게 대응되는 싱크에 이벤트를 전달하고, 싱크는 각자의 HDFS 경로에 이벤트를 파일로 출력한다.

## 최종 에이전트 구성: 채널 셀렉터로 트래픽 나누기

최종적으로 나온 에이전트의 구성은 다음과 같습니다.

![에이전트 구성3](https://i.imgur.com/qcHkjKH.png){: data-action="zoom" }
<figcaption>최종 에이전트 구성</figcaption>

그리고 에이전트 설정 파일은 아래와 같이 작성했습니다.

{% highlight ini linenos %}
...
log_to_avro.sources.log_src.type = exec
log_to_avro.sources.log_src.command = tail -F /path/to/log/file
log_to_avro.sources.log_src.restart = true
log_to_avro.sources.log_src.channels = mem_channel
log_to_avro.sources.log_src.interceptors = ts_ic host_ic          # 호스트 인터셉터 설정
log_to_avro.sources.log_src.interceptors.ts_ic.type = timestamp   # 이벤트 헤더에 timestamp 삽입 (날짜별 구분을 위해)
log_to_avro.sources.log_src.interceptors.host_ic.type = host      # 이벤트 헤더에 호스트명 삽입 (호스트별 구분을 위해)
log_to_avro.sources.log_src.interceptors.host_ic.useIP = true     # 호스트명 대신에 IP 사용

log_to_avro.channels.mem_channel.type = memory
log_to_avro.channels.mem_channel.capacity = 10000
log_to_avro.channels.mem_channel.transactionCapacity = 10000
log_to_avro.channels.mem_channel.byteCapacityBufferPercentage = 20
log_to_avro.channels.mem_channel.byteCapacity = 10485760


log_to_avro.sinks.avro_sink.type = avro
log_to_avro.sinks.avro_sink.channel = mem_channel
log_to_avro.sinks.avro_sink.hostname = hostname.of.cluster.agent
log_to_avro.sinks.avro_sink.port = 4141
...
{% endhighlight %}
<figcaption>웹서버 에이전트 설정파일</figcaption>


{% highlight ini linenos %}
...
avro_to_hdfs.sources.avro_src.type = avro
avro_to_hdfs.sources.avro_src.bind = 0.0.0.0
avro_to_hdfs.sources.avro_src.port = 4141
avro_to_hdfs.sources.avro_src.channels = c_101 c_102
avro_to_hdfs.sources.avro_src.selector.type = multiplexing            # Multiplexing Selector 설정
avro_to_hdfs.sources.avro_src.selector.header = host                  # 호스트 이름으로 채널 나누기
avro_to_hdfs.sources.avro_src.selector.mapping.192.168.0.101 = c_101  # 192.168.0.101 에서 온 이벤트는 c_101 채널로
avro_to_hdfs.sources.avro_src.selector.mapping.192.168.0.102 = c_102  # 192.168.0.102 에서 온 이벤트는 c_102 채널로

# 채널 c_101 설정
avro_to_hdfs.channels.c_101.type = memory
avro_to_hdfs.channels.c_101.capacity = 10000
avro_to_hdfs.channels.c_101.transactionCapacity = 10000
avro_to_hdfs.channels.c_101.byteCapacityBufferPercentage = 20
avro_to_hdfs.channels.c_101.byteCapacity = 10485760

# 싱크 k_101 설정
avro_to_hdfs.sinks.k_101.type = hdfs
avro_to_hdfs.sinks.k_101.channel = c_101
avro_to_hdfs.sinks.k_101.hdfs.fileSuffix = .log.gz
avro_to_hdfs.sinks.k_101.hdfs.path = hdfs://namenode/path/to/logs/dir/%Y%m%d/%{host}  # 날짜별, 호스트별로 다른 디렉토리에
avro_to_hdfs.sinks.k_101.hdfs.rollSize = 104857600
avro_to_hdfs.sinks.k_101.hdfs.rollInterval = 7200
avro_to_hdfs.sinks.k_101.hdfs.rollCount = 0 
avro_to_hdfs.sinks.k_101.hdfs.fileType = CompressedStream
avro_to_hdfs.sinks.k_101.hdfs.codeC = gzip

# 채널 c_102 설정
avro_to_hdfs.channels.c_102.type = memory
avro_to_hdfs.channels.c_102.capacity = 10000
avro_to_hdfs.channels.c_102.transactionCapacity = 10000
avro_to_hdfs.channels.c_102.byteCapacityBufferPercentage = 20
avro_to_hdfs.channels.c_102.byteCapacity = 10485760
{% endhighlight %}
<figcaption>클러스터 에이전트 설정파일</figcaption>

p.s. Flume 설정 파일은 변수 또는 외부 파일 include 등을 지원하지는 않아서, 위와 같이 반복되는 설정을 여러 번 써 주어야 합니다. 

## 호스트마다 CDH 알람 트리거 설정

그리고 CDH 상에서도 웹서버 호스트의 개수만큼 알람 트리거를 만들어 줍니다. 초당 이벤트 개수가 0에 가깝게 떨어지면 알람이 오도록 해 주면 됩니다. 채널/싱크 중 어느 것을 기준으로 해도 크게 상관은 없는데, 저희는 싱크가 초당 이동완료한 이벤트 개수를 기준으로 했습니다.

![CDH 에서의 알람 트리거 상태 화면](https://i.imgur.com/I5UDuDq.png){: data-action="zoom" }
<figcaption>CDH에서의 알람 트리거 상태 화면</figcaption>

이렇게 해 놓으면 또 한가지 좋은 점은, CDH가 알아서 차트를 그려 주기 때문에, 웹서버마다 트래픽 추이를 한눈에 볼 수 있다는 것입니다.

![HDFS Sink의 초당 이벤트 개수 그래프](https://i.imgur.com/T0N6TGN.png){: data-action="zoom" }
<figcaption>HDFSSink의 초당 이벤트 개수 그래프</figcaption>


# 맺음말

지금까지 Apache Flume 과 CDH 를 사용해 로그 수집 시스템을 구성하고 모니터링을 설정한 후기를 살펴 보았습니다. 이 과정에서 느낀 점들을 한번 정리해 보겠습니다.

첫째, 일견 간단해 보이는 기능이었지만 의외로 많은 시행착오를 거쳐야 했습니다. 아무리 간단해 보이더라도 각자의 상황에 맞추어 시스템을 설계하는 데에는 그에 맞는 고민을 거쳐야 합니다.

둘째, 처음에는 로그가 일단 수집되게 하는 것이 가장 중요하다고 생각했는데, 실제로 겪어보니 모니터링이 훨씬 어렵고 중요한 문제라는 것을 알게 되었습니다. 어떤 기능이 일단 실행되도록 설정을 해 놓더라도, 그것이 매일 문제없이 실행됨을 보장받는 것은 또 다른 문제입니다.

셋째, Health 페이지와 Pingdom을 이용한 웹서버 측의 모니터링은 JSON 리포팅의 문제 때문에 큰 쓸모가 없게 되었습니다. 하지만 꽤 유용한 테크닉이라는 생각이 들고, 어딘가에서는 비슷하게 이용할 수 있을 것 같습니다.

마지막으로 CDH 쓰면 좋습니다. 많은 것들이 편해집니다.

<br>

_P.S. 리디북스 데이터팀에서는 이러한 로그 시스템을 함께 고민하고 만들어나갈 분들을 찾고 있습니다. 많은 관심 부탁드립니다._ 
