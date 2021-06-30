#! /bin/bash

git clone https://github.com/electron/electron-quick-start
mv -n electron-quick-start/node* .
rm -fr electron-quick-start
npm install
npm install jquery --save
npm start
