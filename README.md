RIDI Corporation
----------------

www.ridicorp.com 도메인으로 접속할 수 있는 리디 주식회사의 홈페이지입니다.

[Jekyll](https://jekyllrb.com/)을 이용한 정적 블로그 생성 툴을 이용하여 관리하고 있으며, GitHub 연동과 관련한 자세한 문서는 [이곳](https://help.github.com/articles/using-jekyll-with-pages/)을 참고하세요.

# How to Build


## 1. Front-end 빌드하기

### less build하기

less-watch-compiler를 설치합니다. 

```
$ (sudo) npm install -g less-watch-compiler
```

파일이 수정되면 자동으로 css로 빌드되도록 합니다.

```
$ less-watch-compiler less css
```


## 2. Jekyll 설치하기

간단한 명령어로 설치할 수 있습니다. 상세한 내용은 [Jekyll 웹사이트](https://jekyllrb-ko.github.io/)를 참고하세요.

```
$ (sudo) gem install jekyll
```

## 3. 로컬에서 확인하기

Bundler를 사용하여 웹사이트를 테스트할 수 있습니다.
```
$ bundle exec jekyll serve
```