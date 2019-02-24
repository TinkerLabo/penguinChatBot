# penguinChatBot
prototyping of chatbot

● rasPiに関する作業

ssh する
ssh pi@172.24.1.1

git clone https://github.com/TinkerLabo/penguinChatBot.git

cd penguinChatBot/

● mongodb,mecabなどをインストールする
sudo apt-get install -y mongodb-server mecab libmecab-dev mecab-ipadic-utf8 python-mecab 

● penguinChatBot/package.json の　dependencies は以下の通り
  "dependencies": {
    "csv": "^5.1.1",
    "mecab-lite": "0.0.8",
    "mongodb": "^2.0.35",
    "node-red-contrib-scx-ibmiotapp": "0.0.49",
    "node-red-contrib-web-worldmap": "~1.3.5",
    "node-red-dashboard": "~2.9.7"
  },

この設定でnode moduleをインストールする
npm install 


● 辞書を読み込むプログラムを動かして動作確認

node make-dic.js


● node-redのpublic設定をする
/home/pi/.node-red/settings.js の以下の部分を編集
（settings.jsの元ファイルを用意しておいて上書き）
    httpStatic: '/home/pi/penguinChatBot/node_modules/node-red/public',

● node-redを起動する
node-red

pcからnode-redに接続して・・・
http://172.24.1.1:1880/

ハンバーガーメニューから「読み込み」→「クリップボード」選び
表示されたダイアログボック上のテキストエリアに貼り付ける。

デプロイボタンを押す

● 動作確認・・・
サーバーアプリを起動（sshでは起動するが、外部から接続できない、なぜだろう？・・・vnc経由だと動いた）
node chat-server.js

http://172.24.1.1:1337/api?msg=%E8%90%BD%E8%AA%9E


● デプロイの動作確認・・・

http://172.24.1.1:1880/chat

● node-redが自動起動するように設定
sudo systemctl enable nodered
sudo systemctl start nodered

● openJTalkも入れておく

https://github.com/hecomi/node-openjtalk

sudo apt-get install -y open-jtalk open-jtalk-mecab-naist-jdic hts-voice-nitech-jp-atr503-m001

npm install openjtalk


● rasPi 起動時にnode モジュールを動かす　
さて・・どうしよう？！

-------------------------------------------------
●VNCに関するめも
raspiに最初から入っているvncサーバーは
暗号化の設定がされており
mac標準のvncから接続できない様子
raspiに入っているのと同じrealVNCというクライアントアプリを使って接続する
https://www.realvnc.com/en/connect/download/viewer/

VNC用のユーザーを作ります

sudo adduser vncpi

=> pw:raspberry   を設定

sudoグループにも追加
sudo gpasswd -a vncpi sudo

realVNCを起動,ダイアログに172.24.1.1:5900
繋がる！！

