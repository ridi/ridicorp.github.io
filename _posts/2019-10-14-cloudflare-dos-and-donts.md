---
layout: blog_post
title: "Cloudflare 도입 후기"
description: "5년간의 Cloudflare 사용 후기를 공유합니다."
header-img: "blog/img/2019-10-14/header-bg.jpg"
date: 2019-10-14
author: "namenu"
category: engineering
published: true
---

리디에서는 2014년부터 Cloudflare를 사용해오고 있습니다.

Cloudflare는 주로 CDN 업체로 알려져 있습니다. 리디를 포함한 국내의 많은 서비스들은 AWS 상에 구축되는 추세이고 AWS에서는 CloudFront라는 CDN을 제공하고 있기 때문에, 굳이 왜 별도의 CDN을 사용하느냐는 질문을 주시곤 합니다.

그러나 현재 리디에서는 Cloudflare는 단순한 콘텐츠 전송을 빠르게 하기 위한 용도가 아닌(CloudFront의 대체재가 아닌), 별도의 가치를 부여하는 인프라로 간주하고 있습니다. 이 글에서는 리디에서 Cloudflare를 통해 어떤 이득을 얻었는지, 그간의 운영을 통해 얻은 경험에 대해 설명합니다.

---

# 이렇게 하고 있습니다

## 1. 전송 프로토콜을 현대화해주는 기능은 적극적으로 활용합니다.

Cloudflare는 현대화된 압축 알고리즘과 향상된 보안 프로토콜을 사용할 수 있게 해줍니다.

### Brotli 압축 알고리즘

웹서비스를 구축할 때 텍스트 위주의 리소스는 압축을 해서 내려줘야 한다는 것은 잘 알려져 있지만, gzip 이외의 압축 알고리즘을 지정할 수 있다는 사실은 잘 알려져 있지 않습니다.

최신 브라우저의 개발자 도구를 통해 송수신되는 헤더를 살펴보면 아래와 같은 내용이 있습니다.

```
(Request)
Accept-Encoding: gzip, deflate, br

(Response)
Content-Encoding: br
```

이는 [컨텐츠 협상](https://developer.mozilla.org/ko/docs/Web/HTTP/Content_negotiation)이라고 부르는 과정의 일부로, 브라우저가 먼저 `Accept-Encoding` 헤더를 통해 수용 가능한 인코딩 방식을 제시하면 서버에서는 그에 부합하는 인코딩을 사용하게 되는 것입니다.

여기서 마지막 `br`이라고 표기된 것은 Brotli 알고리즘을 가리키는 것으로, 2016년 7월에 웹에 사용될 수 있도록 [RFC](https://tools.ietf.org/html/rfc7932)로 등록되었습니다.

알고리즘의 핵심 아이디어나 구현 방식을 이해하기는 어렵지만, 우리에게 중요한 사실은 Brotli의 성능과 안정성은 이미 충분히 검증되었고 구글 및 여러 대형 사이트에서 널리 쓰이고 있다는 것입니다.

<img srcset="/blog/img/2019-10-14/brotli_logo.png 2x" alt="Brotli">
<figcaption>로고를 가진 Brotli 압축 알고리즘</figcaption>

여튼 Brotli는 비교적 최근에 도입되고 있는 인코딩 방식이므로, 아마 운용 중인 웹서버의 상황에 따라서는 지원을 위한 업데이트가 부담스러울 수 있습니다. 2019년 10월 현재 CloudFront에서도 gzip 이외의 방식은 지원하지 않고 있습니다. 그러나 Cloudflare는 이를 손쉽게 활성화 할 수 있게 해줍니다.

성능 비교와 관련된 글은 Cloudflare의 [공식 블로그(영어)](https://blog.cloudflare.com/results-experimenting-brotli/)에서 확인하실 수 있습니다. 요약하면, 통상적으로 다루어지는 콘텐츠의 크기를 고려했을 때 평균적으로 **1.19~1.38배** 작은 결과물을 생성하므로 gzip과 비교하여 매우 큰 이득이 있다는 결론입니다.

다만 특정 상황에 있어서는 연산량이 많아 gzip보다 지연이 발생할 수 있으므로, 리디에서는 정적인 콘텐츠에 한해서만 Brotli를 적용하고 있습니다.


### TLS v1.3

웹의 전송 계층의 보안을 담당하는 TLS v1.3은 2018년 8월 10일에 [게시](https://tools.ietf.org/html/rfc8446)되었습니다. TLS v1.3은 기존 v1.2에 비해 보안성도 크게 강화하기도 했지만, 암호화 스위트 합의 및 키 교환 방식을 단순화하여 2번에 걸쳐 일어나던 핸드셰이크 과정을 1번으로 줄였습니다.

물론 최근에는 HTTP/2가 보편화되어 RTT 감소로 인한 성능 향상을 체감하기는 어렵지만, 그럼에도 불구하고 보다 나은 보안성을 손쉽게 확보할 수 있다는 것은 큰 장점입니다.

![TLS](/blog/img/2019-10-14/tls-analytics.png)
<figcaption>TLS v1.3을 활성화한 모습</figcaption>

또한 TLS v1.3에는 [0-RTT](https://blog.cloudflare.com/introducing-0-rtt/)라는 모드가 있어서, 연속적인 요청에 대해서는 별도의 핸드셰이크 과정을 거치지 않고 데이터를 전송할 수도 있습니다. 결과적으로 라운트 트립이 없다 하여 0-RTT라고 부릅니다.

리디에서는 공개된 정적 리소스들에 한해 0-RTT 모드를 사용하고 있습니다. 아래와 같이 `Early data was accepted` 메세지가 출력되는 것을 통해 0-RTT의 활성화 상태를 알 수 있습니다.

```
$ openssl s_client -connect ridicdn.net:443 -tls1_3 -sess_in session.pem -early_data request.txt

...
Reused, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Server public key is 2048 bit
...
Early data was accepted
Verify return code: 0 (ok)
...
```


### 기타

이 외에도 HTTP/3(QUIC), 보안 헤더(HSTS), DNSSEC 등을 지원하며 애플리케이션 개발자들이 크게 신경 쓰지 않고도 누릴 수 있는 여러 가지 공짜 점심을 제공하고 있습니다.

특히 HTTP/3와 같은 웹 기술의 최선단을 빠르게 체험해볼 수 있다는 것은 큰 장점입니다. HTTP/3의 탄생 배경에 관한 내용은 [HTTP/3 explained](https://http3-explained.haxx.se/ko/) 및 [공식 블로그](https://blog.cloudflare.com/ko/http3-the-past-present-and-future-ko/)에 매우 상사하게 설명되어 있으니 궁금하신 분들은 읽어보시기를 추천합니다.

아래는 최신 버전의 cURL을 통해 리디북스에 적용된 HTTP/3를 확인한 결과입니다.
참고로 `--http3` 옵션을 사용하기 위해서는 최신 버전의 curl을 직접 빌드해야 합니다.

```
$ curl --http3 https://ridibooks.com/\?genre\=comic -I

HTTP/3 200
date: Mon, 14 Oct 2019 10:38:14 GMT
content-type: text/html; charset=UTF-8
...
alt-svc: h3-23=":443"; ma=86400
expect-ct: max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"
server: cloudflare
```

아직은 초기 단계인 만큼 HTTP/3 사용으로 인한 성능 개선을 체감할 수 없었습니다만, 향후 최적화를 통해 나아질 것을 기대해 봅니다.


## 2. 동적 콘텐츠 전송에도 CDN을 활용합니다.

리디에서는 동적 콘텐츠 전송에도 CDN을 사용합니다. 얼핏 생각하면 어차피 오리진에 도달해야 하는 요청이 프록시 서버를 한 번 더 경유하니까(홉이 증가하니까) RTT가 더 길어질 것이라 생각할 수 있겠으나 실제로는 대부분 예상과는 반대의 결과가 나타난다고 합니다. 이러한 현상에 관해서는 이미 많은 글들이 있으므로 링크로 설명을 대신합니다.

- [Dynamic site acceleration (영어)](https://en.wikipedia.org/wiki/Dynamic_site_acceleration)
- [Amazon CloudFront를 활용한 동적 콘텐츠 전송 성능 개선하기](https://aws.amazon.com/ko/blogs/korea/how-to-improve-dynamic-contents-delievery-using-amazon-cloudfront/)
- [Akamai, 고용량 동적 콘텐츠 전송을 위한 네트워크 최적화](https://www.akamai.com/kr/ko/products/performance/dynamic-site-accelerator.jsp)

좋은 말들은 많은데요, 실제로는 어떨지 결과가 궁금하여 직접 테스트를 해보았습니다.


### 연결 생성 속도 개선

가장 극적으로 개선되는 것은 연결 속도의 개선이라고 합니다. 이러한 개선이 가능한 경우를 간단히 시뮬레이션해보면 아래와 같습니다.

<style>
article.post .my-table {
  line-height: 1.5em;
  margin: 20px auto;
}
article.post .my-table th, td {
  text-align: center;
  padding: 5px 20px;
  border-top: 1px solid #e3e3e3;
}
article.post .table-caption {
  text-align: center;
  margin: 40px 0 20px;
}
</style>

{: .table-caption }
A. 오리진에 직접 요청하는 경우

| SYN | → | 100ms |
| SYNACK | ← | 100ms |
| TLS HS | → | 100ms |
| TLS HS | ← | 100ms |
| Request | → | 100ms |
| Response | ← | 100ms |
||| 총 600ms RTT |
{: .my-table }

{: .table-caption }
B. 엣지 프록시를 통해 요청하는 경우

| SYN | → | 20ms |
| SYNACK | ← | 20ms |
| TLS HS | → | 20ms |
| TLS HS | ← | 20ms |
| Request | → | 20ms |
| Request (Origin) | → | 100ms |
| Response | ← | 20ms |
| Response (Origin) | ← | 100ms |
||| 총 320ms RTT |
{: .my-table }

작위적인 예시이긴 하지만, 클라이언트의 요청을 처리하기 위해서는 TCP 연결 및 TLS 핸드셰이킹을 위한 패킷 교환이 필요하므로 오리진과의 딜레이가 클수록 지연이 커진다고 예상해볼 수 있습니다.

실제로는 어떨지 궁금하여 직접 테스트를 해보았습니다. 먼저 오리진으로 직접 요청하는 경우입니다.

<img src="/blog/img/2019-10-14/argo-before.png" srcset="/blog/img/2019-10-14/argo-before.png 2x" alt="Argo before">

Connect 컬럼과 TLS컬럼의 수치를 보면 실제로 테스트를 수행한 서버와의 물리적인 거리에 비례하여 지연이 발생함을 확인할 수 있습니다.

다음은 요청을 엣지 프록시를 통해 전송한 결과입니다.

<img src="/blog/img/2019-10-14/argo-after.png" srcset="/blog/img/2019-10-14/argo-after.png 2x" alt="Argo after">

TCP SYN/SYNACK와 TLS 핸드셰이킹 단계가 크게 줄어듦으로 인해 TTFB가 개선되었음을 알 수 있습니다.
이러한 차이는 TCP 멀티플렉싱(HTTP keep-alive)을 통해 더욱 극대화됩니다.


### 2. 네트워크 경로 최적화

접속을 맺는 속도가 빨라진다고 하더라도 오리진과의 통신이 느리다면 사용자 경험은 크게 나아지지 않습니다. 즉, 위 표에서 Request (Origin) / Response (Origin)에 해당하는 구간의 전송 속도 또한 개선되어야 합니다.

일반적으로 CDN 업체에서는 네트워크 라우팅 경로를 최적화하여 전송 속도를 개선하는데, 대략적인 원리는 주기적으로 네트워크 상황을 분석하여 혼잡한 구간을 우회하고 여유 있는 트래픽 전송 루트를 동적으로 택해주는 것입니다. Cloudflare에서는 이를 [Argo Smart Routing](https://www.cloudflare.com/ko-kr/products/argo-smart-routing/)이라고 부릅니다.

리디는 전자책 서비스의 특성상 해외에서 접속하는 고객분들이 많고, 해외 트래픽의 경우 네트워크 혼잡으로 인한 지연이 발생할 확률이 더욱 높기 때문에 저희는 Argo Smart Routing 기능을 사용하기로 결정했습니다.

엔터프라이즈 플랜부터 사용할 수 있는 기능인만큼 성능 향상에 대한 기대도 컸는데요. 실제로 적용해보니 해외 트래픽의 경우 평균적으로 50% 이상의 성능 향상이 있었습니다. 홍보용 소개 페이지의 수치가 결코 과장이 아니었습니다.

![Argo Analytics](/blog/img/2019-10-14/argo-graph.png)
<figcaption>Argo 사용 전후 성능 비교</figcaption>

지역적으로는 아시아보다 유럽이, 유럽보다 북미 지역의 성능 개선이 두드러졌습니다.
![Argo Geo](/blog/img/2019-10-14/argo-geo.png)
<figcaption>오리진이 한국에 있는 경우 지역별 변화량</figcaption>

최근 Cloudflare에서는 일반 사용자를 위한 Warp라는 VPN 서비스를 출시한 바 있는데요. Smart Routing의 성능이 궁금하다면 Warp를 통해 직접 체험해 볼 수 있을 것입니다.

---

# 이렇게는 하고 있지 않습니다

Cloudflare에는 매우 다양한 기능들이 제공되지만, 모든 것들이 저희에게 유용한 것은 아니었습니다. 운영되는 서비스의 상황에 따라 불필요하거나 오히려 사용하지 않는 것이 좋은 것들도 있었습니다.

## 1. 애플리케이션 계층의 역할을 위임하지 않습니다.

Cloudflare는 본질은 프록시 서버이므로, 오리진 응답 자체로도 서비스에 문제가 없어야 합니다. 이는 서비스 인프라가 Cloudflare에 강한 의존성이 생기는 것을 방지하는 데에도 도움이 됩니다. 그래야 만약 CDN을 이중화하고자 할 경우에도 큰 비용 없이 도입이 가능하게 됩니다.

이러한 원칙에 따라 리디에서는 종단 간 요청과 응답의 내부(body)를 변조하는 기능은 매우 보수적으로 사용하고 있습니다.

- 이미지 포멧을 최적화해준다거나
- HTML/JavaScript/CSS를 minify 해준다거나
- 오리진에 장애가 발생했는데 마치 살아있는 것처럼 보여준다거나
- 오리진에 특정 바이너리 설치를 요구하거나
- User-Agent에 따라 다른 응답을 가능하게 하는

기능들이 이에 해당합니다. 이들은 매력적으로 보이지만 사용을 자제하고 있습니다. 오리진의 응답을 충실하게 전달하지 않기 때문입니다.

캐싱 정책 역시 CDN에 위임하지 않습니다. 캐시를 투명하게 관리하기 위해서는 **오로지 오리진에서 설정된 HTTP 캐시 헤더에만 의존하도록** 애플리케이션이 설계되어야 합니다. 그리고 프록시 서버에서는 이 헤더를 오버라이딩하지 않아야 합니다.


## 2. 개발자가 신경 써야 할 보안을 방화벽에 의탁하지 않습니다.

웹서버의 보안은 대응 관점에서 크게 두 종류로 구분할 수 있습니다.

1. 애플리케이션 서버에서 대응해야 하는 것
2. 애플리케이션 서버에서 대응할 수 없거나 대응하는 것이 비효율적인 것

Cloudflare에서는 수십 개에 달하는 관리형 방화벽 룰셋을 제공합니다. 봇(bot)으로 의심되는 클라이언트를 차단하는 똑똑한 기능도 있습니다.
모두 적용해버리고픈 유혹이 들지만 이 중 1번, 애플리케이션 서버에서 대응할 수 있는 것은 가급적 직접 처리하려고 합니다. 주로 [시큐어 코딩](https://ko.wikipedia.org/wiki/%EC%86%8C%ED%94%84%ED%8A%B8%EC%9B%A8%EC%96%B4_%EA%B0%9C%EB%B0%9C_%EB%B3%B4%EC%95%88)이라고 강조되는 것들입니다.

정확한 진단 없이 아무 약이나 처방받으면 약의 부작용이 나타나거나 오히려 면역력이 약화되어 인체에 위험하듯이, 룰셋의 적용이 쉽다고 하여 내용을 이해하지 못한 채 모두 활성화한다면 조직 구성원들의 보안적인 면역력을 약하게 만들기 때문입니다.

예를 들어, 클라이언트 요청의 입력값 검증은 웹서버에서 반드시 해야 할 일입니다. 이를 방화벽의 SQL 인젝션 방어 휴리스틱에 위임하는 것은 바람직하지 않습니다.

또한 거짓 음성으로 공격이 유입되는 것보다, 거짓 양성으로 무고한 사용자가 차단되는 상황이 더 나쁘다는 인식도 필요합니다.
그러나 보안적인 지식수준이 높지 않다면 현재 우리가 얼마나 위험한 상태인지, 또 어떤 공격에 대비를 해야 하는지조차 알기 어렵습니다.

이에 대한 대안으로 Cloudflare에서는 방화벽을 침입 탐지 용도로만 사용할 수 있는 "Simulation" 옵션을 제공합니다.
시뮬레이션 결과를 정기적으로 리뷰하는 것은 위에 언급한 부작용을 피하며 보안 지식수준을 높일 수 있는 좋은 방법입니다.


위 구분에서 2번에 해당하는, 즉 방화벽을 활용해야 하는 것의 예는 아래와 같습니다.

- 각종 DDoS 공격
- 악성 크롤러, 스캐닝 도구
- 서비스 어뷰징 (계정 자동 생성, 무작위 쿠폰 번호 대입, 이벤트 자동 참여 등)

특히 서비스 어뷰징과 관련된 브루트포스 공격에 대해서는 공격자의 요청 횟수를 제한하는 [Rate Limiting](https://www.cloudflare.com/ko-kr/rate-limiting/) 기능을 사용할 수 있습니다.

---

CDN으로만 한정한다면 Cloudflare 이외에도 더 나은 품질과 안정성을 가진 대안이 많이 있을 것입니다.

그러나 앞서 살펴본 바와 같이 Cloudflare는 여러 현대화된 기술들을 손쉽게 활용할 수 있도록 도와줌으로서 단순한 CDN 이상의 가치를 제공합니다.

보다 나은 인터넷을 만들기 위한 이들의 시도[^1]에 공감하는 만큼, 앞으로의 행보도 기대해봅니다.

---

[^1]: "we make sure to stay on top of the latest trends in the Internet so that every web site can ‘be Google’." - [Evenly Distributed Future](https://blog.cloudflare.com/evenly-distributed-future/)
