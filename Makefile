.PHONY: run

run:
	bundle exec jekyll server

install:
	gem install bundler --conservative # Skip installing when it's already installed
	bundle install
	npm install

serve:
	bundle exec jekyll serve

watch:
	npm run watch
