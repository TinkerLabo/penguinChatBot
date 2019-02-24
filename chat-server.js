// チャットサーバーを作る
//-----------------------------
// 設定
var SERVER_PORT = 1337; // サーバーポート
var FILE_CLIENT = "chat-client.html";
const SERVER = 'localhost';

// モジュールの取り込み
var
  http = require('http'),
  URL = require('url'),
  path = require('path'),
  fs = require('fs'),
  bot = require('./chat-server-bot.js');

// サーバーを起動 --- (※1)
var svr = http.createServer(checkRequest);
svr.listen(SERVER_PORT, function () {
  console.log("サーバー起動しました");
  console.log('http://' + SERVER + ':' + SERVER_PORT);
});

// サーバーにリクエストがあった時の処理 --- (※2)
function checkRequest(req, res) {
  var uri = URL.parse(req.url, true);
  var pathname = uri.pathname;
  // パス名で処理を分岐
  if (pathname == "/api") {
    apiRequest(req, res, uri);
  } else if (pathname == "/reg") {
    regRequest(req, res, uri);
  } else if (pathname == "/save") {
    saveRequest(req, res, uri);
  } else if (pathname == "/") {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(FILE_CLIENT, "utf-8"));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("File not found");
  }
  console.log(pathname);
};

// 辞書登録リクエストを処理
function regRequest(req, res, uri) {
  msg = uri.query["msg"];  //  msg = "key,msg";
  bot.regDictionary(msg, function (bot_stat) {
    body = JSON.stringify({ "status": bot_stat });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  });
};
// 辞書をファイルに保存する　リモートコントロール
function saveRequest(req, res, uri) {
  msg = uri.query["file"];  //  msg = "dict.csv";
  bot.saveResponse(msg, function (bot_stat) {
    body = JSON.stringify({ "status": bot_stat });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  });
};
// APIへのリクエストを処理 --- (※3)
function apiRequest(req, res, uri) {
  msg = uri.query["msg"];
  bot.getResponse(msg, function (bot_msg) {
    body = JSON.stringify({ "msg": bot_msg });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  });
};