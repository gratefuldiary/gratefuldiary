deploy:
	git subtree push --prefix app heroku master

deploy_force:
	git push heroku `git subtree split --prefix app master`:master --force`

install:
	cd app && yarn install && cd ..

test:
	cd app && npm run test && cd ..

validate:
	cd app && npm run validate && cd ..