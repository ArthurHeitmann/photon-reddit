git checkout master
git merge development
git checkout deployed
git merge master
git push heroku deployed:master
git checkout development