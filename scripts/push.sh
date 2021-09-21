#!/bin/sh
git checkout stableBackup
git merge master
git checkout master
git merge development
git checkout deployed
git merge master
git checkout development
git push origin --all
