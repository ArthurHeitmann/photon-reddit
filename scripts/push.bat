git checkout stableBackup
git merge master
git checkout master
git merge development
git checkout deployed
git merge master
git push origin --all
git checkout development
