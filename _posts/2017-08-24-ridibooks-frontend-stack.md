---
layout: blog
title: "리디북스 프론트엔드 스택 소개"
description: "리디북스의 프론트엔드 스택을 간단히 소개합니다."
header-img: "blog/img/bg-2.jpg"
date: 2017-08-24
author: nnyamm
category: engineering
published: true
---

모바일 웹 초창기에 만들어진 리디북스 서점은 프론트엔드 분야의 발전과 함께 스택이 지속적으로 변화해 왔습니다. 

이 글은 리디북스의 초기, 현재 프론트엔드 스택 및 지향하는 방향에 대한 내용을 담고 있습니다.



## 브라우저 지원

서비스 초기 아래의 브라우저들을 지원 하고 있었습니다. 

> IE9 이상, iOS 7 이상, Android 2.3 이상

브라우저의 CSS3 지원이 보편화되고 JavaScript 생태계가 급격히 발전함에 따라 **더 많은 고객에게 더 나은 경험을 제공하기 위해** 

업데이트 및 대체 가능한 브라우저가 있는 범위 내에서 접속 통계를 기반으로 지원 브라우저를 업데이트 하고 있으며 

2017년 8월 기준 아래 브라우저들을 지원하고 있습니다.

- 모바일, 태블릿
  - Android
    - Chrome - last 2 versions
    - Webviewer
      - 4.2.x (PAPER)
      - 4.4.x+ (네이버 앱)
  - iOS 10+
    - Safari - last 2 versions
- PC
  - Windows
    - IE11
    - Edge
    - Chrome - last 2 versions
  - Mac
    - Safari - last 2 versions



## HTML

HTML은 **HTML5**를 사용하며 전자책 서점이라는 특성상 **웹 접근성과 웹 표준을 지키기 위해 더욱 노력**하고 있습니다.

- 내용에 부합하는 명확한 태그 사용
- 스크린 리더기로 이용시 문맥이 자연스럽도록 시각적으로 생략된 요소들도 DOM에 추가 
- 반복되는 header 요소를 건너 뛸 수 있도록 페이지내 본문 링크 제공



## CSS

CSS는 **CSS3**를 사용하고 있으며 보다 효율적으로 개발하기 위해 preProcessor로 Less 를 사용하고 있습니다.
 
최근에는 Vendor prefix 대응 및 lint, convention 등을 추가하기 위해 점진적으로 PostCSS로 교체해 나가고 있습니다.



### Less

처음에는 외부 Less compiler 를 사용 했었지만 Grunt를 도입하여 자동화가 이루어졌고 현재 아래의 스택으로 구성되어 있습니다.

- [Grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) - 특정 폴더 혹은 파일의 변경 감시
- [Grunt-contrib-newer](https://github.com/tschaub/grunt-newer) - 변경된 파일에 특정 task 를 연결하는데 사용
- [Grunt-contrib-less](https://github.com/gruntjs/grunt-contrib-less) - Less compiler
- [less-plugin-clean-css](https://github.com/less/less-plugin-clean-css) - minifiy tool


### PostCSS

Less의 Mixin으로 구현한 Vendor prefix를 자동화 하고 lint 및 convention을 적용하여 일관된 품질의 CSS를 개발하기 위해 

PostCSS를 적용하기로 결정하였고 점진적으로 교체해 나가고 있습니다.

- [SugarSS](https://github.com/postcss/sugarss) - 간결한 CSS 문법
- [PostCSS](https://github.com/postcss/postcss) - CSS 개발을 위한 아래와 같은 다양한 Plugin들을 조합
  - [StyleLint](https://stylelint.io/) - Lint tool
  - [PostCSS Nested](https://github.com/postcss/postcss-nested) - nested 기능을 구현, cssnext의 nesting 기능중 at-rule(@nest)에 bug가 있어서 적용
  - [PostCSS Base64](https://github.com/jelmerdemaat/postcss-base64) - CSS 내 각종 이미지 url을 Base64로 변환, 삽입
  - [PostCSS SVGO](https://github.com/ben-eb/postcss-svgo) - SVG 최적화
  - [PostCSS cssnext](http://cssnext.io/) - 차세대 CSS4 구현 및 auto prefix 기능 지원
  - [PostCSS Reporter](https://github.com/postcss/postcss-reporter) - PostCSS 진행 시 다른 plugin 들의 각종 경고 및 message 들을 표기
  - [CSSNano](http://cssnano.co/) - minifiy tool




## JavaScript

초반에는 jQuery 기반 간단한 유효성 검사 및 AJAX, UI조작 등의 역할을 수행 했습니다. 

이후 프론트엔드 개발환경이 빠른속도로 발전하였고 JavaScript의 역할이 다양해 짐에 따라 

최신 스팩의 JavaScript 및 lint tool 그리고 JavaScript Framework를 도입하기로 결정했습니다.



- **[키워드로 검색하기](https://ridibooks.com/keyword-finder/romance?group_id=1)**
  - [Vue.js](https://vuejs.org/) - JavaScript Framework
  - [Babel](https://babeljs.io/) - stage3 (ECMA Script lates release + candidate feature)
  - [ESLint](http://eslint.org/)  - [eslint-config-ridibooks](https://github.com/ridibooks/eslint-config-ridibooks) + custom setting
  - [Webpack 3.0](https://webpack.js.org/)
  - [Jest](https://facebook.github.io/jest/)
- **나머지 페이지**
  - ES5 -> Babel - stage3 교체 완료
  - [jQuery 3.1.1](https://jquery.com/)
  - [RequireJS](http://requirejs.org/) ->  Webpack 3.0 으로 대체 완료
  - [Bower](https://bower.io/) ->  Yarn 으로 대체 완료
  - [Grunt](https://gruntjs.com/) -> Less, Imagemin, Copy 를 위해 유지
  - [JSHint](http://jshint.com/) ->  ESLint로 대체 완료
  - Jest 도입 예정


- **Error tracking tool**

  이미 Backend part 에서 운영중에 있고 Vue.js를 지원하기 때문에 Sentry를 선택하였습니다.

  - [Sentry](https://sentry.io/)



## Icon

UI 요소중 가장 빈번하고 반복적으로 사용되는 요소인 Icon을 아래 세가지 방법을 혼용하여 서점에 적용중에 있습니다

- Icon font 
- Background SVG 
- SVG Icon component - for Vue.js

세가지 방법이 혼용중인 이유는 일괄 교체하기에는 사용되는 곳이 너무 광범위하고 기술적으로는 서로 다른 방법이지만 

사용자에게 시각적으로 동일한 결과물을 제공하기 때문에 점진적인 개선을 선택했기 때문입니다.



### Icon font

이전에 사용중이던 Image Sprites의 문제를 해결하기 위해 Vector Icon들을 Web font로 묶은 Icon font를 도입 하였습니다.

장점

- 백터방식이기 때문에 다양한 크기의 대응이 가능
- font로 구현되기 때문에 각기 다른 크기, 색상등 CSS font관련 속성만으로 손쉽게 제어 가능

단점

- Font loading이 완료되기 전까지 해당 영역이 비어있다가 loading 완료 후 rendering 되며 화면이 깜빡이는 듯한 FOUT 현상 발생
- 모든 Icon 들이 하나의 Web font 안에 들어있기 때문에 하나라도 수정, 추가되는 경우 font 를 새로 생성 해야하고 이로인한 잦은 Caching update 필요
- 브라우저가 Web font를 렌더링할 때 Anti-Aliasing 을 적용하기 때문에 선명도가 떨어짐



#### Icon font - IcoMoon

도입당시 아직 Grunt를 적용하기 전이였기 때문에 [IcoMoon](https://icomoon.io/) 이라는 웹 서비스를 통해 Icon font를 만들었는데 

아래와 같은 문제점들이 발생 하였습니다.

- icon resource 가 외부에서 관리되기 때문에 version 관리가 어려움
- 유료결제를 하지 않으면 협업이 어려움



#### Icon font - Grunt-web-font

IcoMoon의 문제를 해결하기 위해 [grunt-web-font](https://github.com/sapegin/grunt-webfont) 로 대체 하였습니다.

Grunt-contrib-newer 와 Grunt-contrib-watch 를 조합하여 Icon 추가시 **Icon font가 자동생성** 되고 version 관리가 가능해졌습니다.





### Background SVG icon

Icon font의 단점을 해결할 수 있는 방법으로 SVG를 inline 으로 CSS의 `background` 규칙에 삽입하는 방법 입니다.

- Icon이 CSS에 들어있기 때문에 FOUT 현상이 없음
- 해당 Icon이 필요한 곳에만 inline으로 삽입하기 때문에 Icon의 추가, 수정시 해당하는 CSS만 변경되어 불필요한 Caching이 줄어듦
- Web font 가 아니기 때문에 Anti-Aliasing 이 적용되지 않아 선명하게 렌더링 됨

다만 IE 에서Drop shadow 등의 효과를 구현해주는 CSS Filter 기능이 지원되지 않는다는 단점이 있습니다.

이는 서점의 접속 브라우저 통계상 비IE 접속이 월등하게 높기 때문에 감수하기로 결정했습니다. 



## Images

대부분의 UI image 요소들이 SVG로 교체되어 있지만 어쩔 수 없이 남아있는(e-mail, 외부 인증뱃지 등) image의 경우 [Imagemin](https://github.com/imagemin/imagemin) 으로 용량을 최적화해서 사용하고 있습니다.

