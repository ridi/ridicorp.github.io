.PHONY: install serve watch

install:
	gem install bundler --conservative # Skip installing when it's already installed
	bundle install
	npm install

serve:
	bundle exec jekyll serve

watch:
	npm run watch
