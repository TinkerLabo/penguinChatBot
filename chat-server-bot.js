// 会話ボットの応答を生成するモジュール
//---------------------------------
const csv = require('csv'); //https://csv.js.org/generate/api/
const fs = require('fs');
const SERVER = 'localhost';
// MongoDBの設定情報
var MONGO_DSN = 'mongodb://' + SERVER + ':27017/simple-bot';

// MongoDBの接続情報を保持する変数
var mongo_db = null, keywords_co;

// モジュールの取り込み
var Mecab = require('mecab-lite'),
  mecab = new Mecab(),
  mongo_client = require('mongodb').MongoClient;

// 外部に getResponse() メソッドを公開 --- (※1)
module.exports = {
  "getResponse": getResponse,
  "regDictionary": regDictionary,
  "saveResponse": saveResponse,
};

// 会話ボットの応答を返す関数 --- (※2)
function getResponse(msg, callback) {
  checkDB(function () {
    var bot = new Bot(msg, callback);
    bot.talk();
  });
}

function saveResponse(msg, callback) {
  checkDB(function () {
    var stat = "";
    var outfile = 'output.csv';
    if (msg != null) outfile = msg;
    saveDict(outfile);
    callback('OK');
  });
}

// MongoDBへ登録
function regDictionary(msg, callback) {
  var line = msg;
  checkDB(function () {
    console.log('## msg:' + line);
    var cells = line.split(",");    //    var line = "じゃんけん,0,*, ぐー";
    var stat = "";
    if (cells.length >= 2) {
      // var key = cells[0].trim();
      // var rank = parseInt(cells[1].trim());
      // var pat = cells[2].trim();
      // var msg = cells[3].trim();
      var key = cells[0].trim();
      var rank = '0';
      var pat = '*';
      var msg = cells[1].trim();
      console.log("■　regDictionary@bot key:" + key + " msg:" + msg);
      //登録
      var collection = mongo_db.collection('keywords');
      collection.insert({
        "key": key, "rank": rank,
        "pattern": pat, "msg": msg
      }, function (err, result) {
        console.log("inserted:", result.ops);
      });
      stat = 'OK'
    } else {
      stat = 'NG'
    }
    callback(stat);
  });
}

// MongoDBへ接続 --- (※3)
function checkDB(next_func) {
  // 既に接続していれば何もしない
  if (mongo_db) {
    next_func(); return;
  }
  // MongoDBに接続
  mongo_client.connect(MONGO_DSN, function (err, db) {
    // エラーチェック
    if (err) { console.log("DB error", err); return; }
    // 接続情報を記録
    mongo_db = db;
    // コレクションを取得
    keywords_co = db.collection('keywords');
    // 次の処理を実行
    next_func();
  });
}

// ボットクラスの定義 ---- (※4)
function Bot(msg, callback) {
  this.callback = callback;
  this.msg = msg;
  this.results = [];
  this.words = [];
  this.index = 0;
}

// ボットからの応答を得るメソッド ---- (※5)
Bot.prototype.talk = function () {
  console.log("talk@bot:" + this.msg);

  var self = this;
  // 形態素解析 --- (※6)
  mecab.parse(this.msg, function (err, words) {
    if (err) {
      self.callback("Error");
      return;
    }
    // 単語を一つずつ確認する ---- (※7)
    self.index = 0;
    self.words = words;
    self.nextWord();
  });
};

// 各単語を一語ずつ調べるメソッド ---- (※8)
Bot.prototype.nextWord = function () {
  // 単語を最後まで調べたか確認
  if (this.index >= this.words.length) {
    this.response();
    return;
  }
  // データベースを検索
  var w = this.words[this.index++];
  // 活用のない単語 - 「頑張ら」なら「頑張る」を利用
  var org = (w.length >= 7) ? w[7] : w[0];

  console.log("nextword@bot:" + org);

  var self = this;
  keywords_co
    .find({ key: org })
    .toArray(function (err, rows) {
      // データベースに合致する語があったか？
      if (rows.length == 0) {
        self.nextWord(); return;
      }
      // パターンにマッチするか確認 --- (※9)
      var keys = rows.filter(function (el, index, ary) {
        if (el.pattern == "*") return true;
        if (self.msg.indexOf(el.pattern) >= 0) return true;
        return false;
      });
      if (keys.length > 0) {
        var r = Math.floor(Math.random() * keys.length);
        var key = keys[r];
        self.results.push(key.msg);
      }
      self.response();
    });
};

// 結果を戻す
Bot.prototype.response = function () {
  var res = "もう少しかみ砕いて話してください。";
  if (this.results.length > 0) {
    res = this.results.join("。");
  }
  this.callback(res);
};

function saveDict(outfile) {
  //ファイルが破損する可能性を考え・・ファイルが存在したら別名保存するようにしたい
  // また、サーバー起動時に辞書ファイルの自動読み込みをこのファイルからさせた方が良いだろうか
  const writableStream = fs.createWriteStream(outfile, { encoding: 'utf-8' });
  const stringifier = csv.stringify({
    delimiter: "\t"
  });
  //var fields = ['key', 'rank', 'pattern', 'msg']; 
  // モジュール
  var mongo_client = require('mongodb').MongoClient;
  //https://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html
  // MongoDBに接続 --- (※2)
  mongo_client.connect(MONGO_DSN, function (err, db) {
    // エラーチェック
    if (err) { console.log("DB error", err); return; }
    // MongoDBの接続オブジェクトを記憶
    mongo_db = db;
    // コレクションを取得 --- (※3)
    var collection = db.collection('keywords');
    collection.find().toArray(function (err, documents) {
      if (err) console.error(err);
      //console.log(documents);
      stringifier.pipe(writableStream);
      for (let i = 0; i < documents.length; i++) {
        stringifier.write(documents[i]);
      }
      mongo_db.close();
    });
    console.log("save to " + outfile);
  });
}

