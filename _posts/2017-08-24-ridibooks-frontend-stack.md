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

모바일 웹 초창기에 만들어진 리디북스 서점은 Frontend 분야의 발전과 함께 Stack이 지속적으로 변화해 왔습니다. 

이 글은 리디북스의 초기, 현재 Frontend Stack 및 지향하는 방향에 대한 내용을 담고 있습니다.



## Browser Support

초기 Browser 지원 기준은 

> IE9 이상, iOS 7 이상, Android kitkat 이상

하지만 Mobile OS의 발전과 지속적으로 줄어드는 PC, Tablet 사용자의 감소에 따라

> GA Session 기준 2% 이하는 팀내 논의 후 공식지원 제외

라는 기준으로 2017년 8월 현재 아래 Browser들을 지원하고 있습니다.

(참고 : Mobile 기기와 Desktop의 비율이 약 8:2로 모든 프로젝트는 Mobile Browser 우선으로 진행하고 있습니다)



- Desktop
  - Windows
    - IE11
    - Edge
    - Chrome - last 2 versions
  - Mac
    - Safari - last 2 versions
- Mobile, Tablet
  - Android
    - Chrome - last 2 versions
    - Webviewer
      - 4.2.x (PAPER)
      - 4.4.x + (Naver app)
  - iOS 10+
    - Safari - last 2 versions




## HTML

HTML은 **HTML5**를 사용하며 초기 HTML5 미지원 Browser들은(IE8 이하) [HTML5 Shiv](https://github.com/aFarkas/html5shiv) 로 polyfill 하여 대응 하고 있습니다.

전자책 서점이라는 특성상 **웹 접근성과 웹 표준을 지키기 위해 더욱 노력**하고 있습니다.



## CSS

CSS는 **CSS3**를 사용하며 초기에는 외주업체에 의해 Vanilla CSS로 확장 불가능한 구조로 개발되어 있었기 때문에 [Less](http://lesscss.org/) 를 도입하여 각 page 단위로 모든 CSS를 refactoring 하였습니다.



### Less

도입 초기에는 외부 Less compiler 를 사용 했었지만 Grunt 도입 이후 자동화가 이루어졌고 현재 아래의 Stack 으로 구성되어 있습니다.

- [Grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) - 특정 폴더 혹은 파일의 변경 감시
- [Grunt-contrib-newer](https://github.com/tschaub/grunt-newer) - 변경된 파일에 특정 task 를 연결하는데 사용
- [Grunt-contrib-less](https://github.com/gruntjs/grunt-contrib-less) - Less compiler
- [less-plugin-clean-css](https://github.com/less/less-plugin-clean-css) - minifiy tool



하지만 도입 초기 적절한 Vendor prefix plugin 없이  Less의 mixin 으로 대응하였고, Lint tool 없이 몇가지 자체규칙을 정의한 문서를 통해 convention 을 적용하였기 때문에 점차 기술부채가 늘고 있습니다.

```css
.filter(@value) {
  -webkit-filter: @value;
  filter: @value;
}
```



### PostCSS

이를 개선하기 위해 PostCSS 를 적용하기로 결정하였고 보다 효율적인 업무 진행을 위해 기존의 모든 CSS를 일괄적으로 refactoring 하기 보다 점진적으로 교체해 나가기로 결정, 진행중에 있습니다.

- [SugarSS](https://github.com/postcss/sugarss) - 간결한 CSS 문법
- [PostCSS](https://github.com/postcss/postcss) - CSS 를 위해 다양한 Plugin을 조합해주는 tool
  - [StyleLint](https://stylelint.io/) - Lint tool
  - [PostCSS Nested](https://github.com/postcss/postcss-nested) - nested 기능을 구현, cssnext의 nesting 기능중 at-rule(@nest)에 bug가 있어서 적용
  - [PostCSS Base64](https://github.com/jelmerdemaat/postcss-base64) - CSS 내 각종 이미지 url을 Base64로 변환, 삽입
  - ~~[PostCSS Inline-SVG](https://github.com/TrySound/postcss-inline-svg) - SVG와 해당 SVG의 attribute를 간결한 CSS 문법으로 이용할 수 있도록 도와줌~~
  - [PostCSS SVGO](https://github.com/ben-eb/postcss-svgo) - SVG를 최적화
  - [PostCSS cssnext](http://cssnext.io/) - 차세대 CSS4 구현 및 auto prefix 기능 지원
  - [PostCSS Reporter](https://github.com/postcss/postcss-reporter) - PostCSS 진행 시 다른 plugin 들의 각종 경고 및 message 들을 표기
  - [CSSNano](http://cssnano.co/) - minifiy tool




## JS

초기 jQuery 기반으로 간단한 유효성검사 및 UI조작 등의 소극적인 역할을 담당하다 보니 관리주체 없이 컨벤션 없는 코드가 축적되어 왔습니다.

ES5 및 RequireJS를 도입하고 Package 관리 tool(npm, Bower)을 도입 하였지만 이후 Frontend 개발환경이 빠른속도로 발전하였고 JS의 역할이 다양해 짐에 따라 이에 대응하기 위해 최신 spec의 JS 및 lint tool 그리고 JS Framework를 도입하기로 결정했습니다.



- **[키워드로 검색하기](https://ridibooks.com/keyword-finder/romance?group_id=1)**
  - [Vue.js](https://vuejs.org/)
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

  이미 Backend part 에서 운영중에 있고 Vue.js를 지원하기 때문에 선택

  - [Sentry](https://sentry.io/)

  ​

### Package Manager

초기 [npm](https://github.com/npm/npm) 사용중 아래와 같은 문제들이 발생 하였습니다.

1. Speed - Package들이 증가함에 따른 **속도 문제**
2. Lock - 의존성 있는 Package의 **version 관리 문제**
   - 각 개발자의 local에 설치된 grunt-contrib-uglify가 version이 동일하더라도 의존하고 있는 UglifyJS 의 version이 달라 서로 다른 결과물이 만들어지는 문제 발생

이를 해결하기 위해  위 문제들을 해결 및 개선 가능한 [Yarn](https://yarnpkg.com/lang/en/) 으로 변경 하였습니다.

하지만 Yarn으로 교체 직후 위의 문제들을 해결했다는 [npm v5](http://blog.npmjs.org/post/161081169345/v500)가 발표 되어 비교 테스트를 진행할 예정입니다.



## Icon

UI 요소중 가장 빈번하고 반복적으로 사용되는 요소인 Icon은 현재 아래 방법이 혼용되고 있습니다.

- Icon font 
- Background SVG 
- SVG Icon component - for Vue.js

앞으로 모든 Icon font는 `Background SVG icon 방식` 혹은 `SVG icon component 방식` 으로 점진적으로 교체 할 예정입니다.



### Image Sprites 

초기에는 CSS와 마찬가지로 외주업체에 의해 단일 Image와 ImageSprites 방식으로 운영되고 있었습니다.

ImageSprites 방식은 아래와 같은 문제점이 있습니다.

- 고해상도 화면 지원을 위해 하나의 Icon을 위해 각기 다른 해상도의 여러장의 Image가 필요함
- 관리해야 하는 이미지가 추가되는 Icon의 배수로 증가함에 따라 관리에 많은 비용이 발생




### Icon font

Image Sprites의 문제를 해결하기 위해 Vector Icon 구현 방식인 Web font 기능을 활용한 Icon font를 도입 하였습니다.

Vector Icon 은 아래와 같은 장점을 갖고 있습니다.

- 하나의 Icon 으로 각기 다른 크기, 색상을 구현할 수 있음
- Icon을 하나의 Font로 Rendering 하기 때문에 다양한 Font 관련 CSS style을 적용할 수 있음




#### Icon font - IcoMoon

도입당시 아직 Grunt를 적용하기 전이였기 때문에 [IcoMoon](https://icomoon.io/) 이라는 웹 서비스를 통해 Icon font를 만들었는데 아래와 같은 문제점들이 발생 하였습니다.

- icon resource 가 외부에서 관리되기 때문에 version 관리가 어려움
- 유료결제를 하지 않으면 협업이 어려움




#### Icon font - Grunt-web-font

IcoMoon의 문제를 해결하기 위해 IcoMoon을 [grunt-web-font](https://github.com/sapegin/grunt-webfont) 로 대체하였습니다.

CSS와 마찬가지로 Grunt-contrib-newer 와 Grunt-contrib-watch 와 조합하여 SVG file 추가시 **Icon font가 자동생성** 되고 version 관리가 가능해졌습니다.

하지만 Icon font 또한 Web font 이기 때문에 다음과 같은 단점이 있습니다.

- Font loading이 완료되기 전까지 해당 영역이 비어있다가 loading 완료 후 Icon이 rendering 되며 화면이 깜빡이는 듯한 FOUT 현상 발생
- 모든 Icon 들이 하나의 Web font 안에 들어있기 때문에 하나라도 수정, 추가되는 경우 font 를 새로 생성해야함
- 이로인한 잦은 Caching update 필요
- Browser가 font를 Rendering 할 때 Anti-Aliasing 을 적용하는데 Icon font 에도 적용 되기 때문에 선명도가 떨어짐




### Background SVG icon

Icon font의 단점을 해결할 수 있는 방법으로 SVG를 inline 으로 CSS의 `background` 규칙에 삽입하는 방법 입니다.

- Icon이 CSS에 들어있기 때문에 FOUT 현상이 없음
- 해당 Icon이 필요한 곳에만 inline으로 삽입하기 때문에 Icon의 추가, 수정시 해당하는 CSS만 변경되어 불필요한 Caching이 줄어듦
- Web font 가 아니기 때문에 Anti-Aliasing 이 적용되지 않아 선명하게 Rendering 됨

다만 IE 에서Drop shadow 등의 효과를 구현해주는 CSS Filter 기능이 지원되지 않는다는 단점이 있습니다.



## Images

대부분의 UI image 요소들이 SVG로 교체되어 있지만 어쩔 수 없이 남아있는(e-mail, 외부 인증뱃지 등) image의 경우 [Imagemin](https://github.com/imagemin/imagemin) 으로 최적화해서 사용하고 있습니다.



## RSG

**R**idi **S**tyle **G**uide

프로젝트 마다 반복적으로 만들어지는 디자인 요소들을 모듈화하여 디자이너와 개발자의 불필요한 반복작업을 줄이고 일관된 UI를 만들기 위한 Style Guide 입니다.

초기에는 Bootstrap 을 참고하여 모든 HTML 요소들과 다양한 components를 기획, 개발 했지만 만들어 놓고 사용되지 않는 요소들이 많고, 경직된 규격 때문에 디자인할 때 제약을 받는 사례가 늘어남에 따라 이를 폐기하고 **최소한**의 Components 및 그외 디자인 요소돌의 Guide 를 제시하는 방향으로 만들었습니다.



- RUI - **R**idi **UI**
  - 서점 내에서 반복적으로 사용되는 최소한의 UI Components 모음
- Colors
  - Ridi의 서비스들이 공용으로 사용하는 Color palette
    - [Ridibooks 서점](https://ridibooks.com/?genre=romance), [Ridibooks App](https://ridibooks.com/support/app/download), [RidiStory App](https://www.ridistory.com/)
  - 디자이너가 업무에 손쉽게 활용할 수 있도록 Sketch, Photoshop용 Color palette export 지원
- Icons
  - Ridibooks 서점에서 사용중인 Icon 모음