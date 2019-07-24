
/** 
* Postに対する反応
* ログを保存
* 返信メッセージを送る
*/
function doPost(e) {
  //Post情報の取得
  var messageInfo = JSON.parse(e.postData.contents).events[0];
  var replyToken = messageInfo.replyToken;  // WebHookで受信した応答用Token
  var userMessage = messageInfo.message.text;  // ユーザーのメッセージを取得
  var timestamp = messageInfo.timestamp;
  var userId = messageInfo.source.userId;
  var groupId = messageInfo.source.groupId;

  //返信用の情報
  var CHANNEL_ACCESS_TOKEN = 'Qk8go0KUNsUYp1aEgOUmQbANQu/PRbTOxLG5bmTe9ilKgVtV+q3QM9se37URCN9hNm8S6CbuWhkIqZXQNh8En7B4novKX0TjSVLK0g4h0pzsGgWBluCzW3/CguGHJMoh2Vz/K3+LL+tt7DcxTpAb7AdB04t89/1O/w1cDnyilFU=';
  var url = 'https://api.line.me/v2/bot/message/reply';  // 応答メッセージ用のAPI URL

  //ログの保存
  var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno');
  var sh = ss.getSheetByName('LINE_log');
  var lastRow = sh.getLastRow();
  sh.getRange(lastRow+1,1).setValue(userId);
  sh.getRange(lastRow+1,2).setValue(messageInfo);
  
  if (userId != 'U6fc79eba210a02ee240c2bb8a491b16c') {
    return
  }
  
  //送信・返信用のデーターの保存
  var replyMessage =　setData(userMessage, timestamp, userId);
  
  var postData = {
    "replyToken": replyToken,
    "messages": [{
      "type": "text",
      "text": replyMessage,
    }],
  };
  var headers = {
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
  };
  var options = {
    "method": "POST",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

/** 
*Postされたメッセージを貼り付け
*
*@param LINEのメッセージ内容
*@param メッセージのTimestamp
*@param LINE@のuserId
*/

function setData(m,t　,u) {
  t = new Date(t);
  t = Utilities.formatDate(t,'JST', 'M/d H:mm');
  var command = m.split(' ');
  var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno'); //契約管理Bot Spreadsheetの呼び出し
  var sh = ss.getSheetByName('五井火力'); //契約シートの呼び出し
  var lastRow = sh.getDataRange().getLastRow();　//最終行の呼び出し  

// ==================================  
// 先頭が「新規」のとき
// ==================================
  if (command[0] == '新規') {
    var count = parseInt(command[3]);
    var replyMessage = "登録を完了しました。\n";
    
    var shTime = ss.getSheetByName('time');
    var timeData = shTime.getDataRange().getValues();
    
    command.shift();
    command.splice(0,0,"",t);
    command.splice(3,0,'','');
    command.pop();
    command.push(u,'依頼前');
    replyMessage += "\n"+command[2]+' '+command[5];
    
    for (var i=1; i<=count; i++) {
      sh.appendRow(command);
      var index = lastRow+i;
      sh.getRange(index,1).setValue(index);
      var time = new Date(timeData[i-1][0]);
      time = Utilities.formatDate(time,'JST', 'H:mm');
      sh.getRange(index,4).setValue(time);
      sh.getRange(index,5).setValue(timeData[i-1][1]);
      replyMessage += "\n"+index+' '+time+' '+timeData[i-1][1];    
    }
    sh.sort(4, true);
    sh.sort(3, true);
    Logger.log(replyMessage);
    return replyMessage;
  }　
  
// ==================================  
// 先頭が「配車」のとき
// ==================================
  else if (command[0] == '配車') {
    var data = sh.getDataRange().getValues();
    var replyMessage = 'Indexが正しくありません。';
    
    if (command.length == 3) {
      for (var i=0; i<lastRow; i++) {
        var index = parseInt(command[1]);
        if (data[i][0] == index) {
          sh.getRange(i+1,5).setValue(command[2]);
          var time = new Date(data[i][3]);
          time = Utilities.formatDate(time,'JST', 'H:mm');
          sh.getRange(i+1,8).setValue('依頼前');
          replyMessage = '以下の通り配車を割り振りました。\n\n'+command[1]+' '+time+' '+command[2];
          return replyMessage
        }
      }
    } else if (command.length == 4) {
      for (var i=0; i<lastRow; i++) {
        var index = parseInt(command[1]);
//        var newTime = new Date(command[2]);
//        newTime = Utilities.formatDate(newTime,'JST', 'H:mm');
//        Logger.log(newTime);
        
        if (data[i][0] == index) {
          sh.getRange(i+1,5).setValue(command[3]);
          sh.getRange(i+1,4).setValue(command[2]);
          sh.getRange(i+1,8).setValue('依頼前');
          replyMessage = '以下の通り配車を割り振りました。\n\n'+command[1]+' '+command[2]+' '+command[3];
          Logger.log(replyMessage);
          return replyMessage
        }
      }
    }
    sh.sort(4, true);
    sh.sort(3, true);
    return replyMessage
  }
  
// ==================================  
// 先頭が「依頼」のとき
// ==================================
  else if (command[0] == '依頼') {
    var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno');
    var shCus = ss.getSheetByName('五井火力引取事業者リスト');

    // 顧客ごとにメッセージを送信する。顧客名とグループIDは事業者リストから取得する。
    var cusData = shCus.getDataRange().getValues();
    
    // 指定の日付を取得する
    var date = command[1];
    
    // 送信先を限定する
    if (command[2] == '全社') {
      
      // 顧客リスト全体を検索する
      for (var i=1; i<cusData.length; i++) {
        var customer = cusData[i][0];
        var id = cusData[i][1];
        var contents = fetchContents(date,customer);
        Logger.log(contents);
        
        if (contents != '') {
          var te = requestText(contents);
          var rt = 'お世話になります。\n\n'+ date +'分の五井火力の引取依頼となります。配車可否のご連絡をお願い申し上げます。\n' + te + '\n\nディールコネクト 　辻';
          Logger.log(rt);
          pushMessage(id,rt);
        } else {
          var rt = 'お世話になります。\n\n'+ date +'分の五井火力の引取依頼はなしとなります。\nよろしくお願い申し上げます。\n\nディールコネクト 　辻';
          pushMessage(id,rt);
        }
      }
      var replyMessage = '配車依頼を送信しました。';
      return replyMessage
    } else {
      
      // 指定した顧客のみをcontentsを作成する
      var customer = command[2];
      var contents = fetchContents(date,customer);
      
      // group idを取得する
      for (var i=1; i<cusData.length; i++) {
        if (command[2] == cusData[i][0]) {
          var id = cusData[i][1];
        }
      }
      var text = requestText(contents);
      var rt = 'お世話になります。\n\n'+ date +'分の五井火力の引取依頼となります。配車可否のご連絡をお願い申し上げます。\n' + text + '\n\nディールコネクト 　辻';
      pushMessage(id,rt);
      
      var replyMessage = command[2]+'へ配車依頼を送信しました。';
      return replyMessage
    }
  }
  
// ==================================  
// 先頭が「確認」のとき
// ==================================
  else if (command[0] == '確認') {
    sh.sort(4, true);
    sh.sort(3, true);
    var data = sh.getDataRange().getValues();
    var date = command[1];
    var replyMessage = date+'の予定は以下です。';
    
    for (var i=0; i<lastRow; i++) {
      var d = new Date(data[i][2]);
      d = Utilities.formatDate(d,'JST', 'M/d');
      if (date == d) {
        var time = new Date(data[i][3]);
        time = Utilities.formatDate(time,'JST', 'H:mm');
        replyMessage += '\n'+ data[i][0] +' '+ time +' '+ data[i][4] +' '+ data[i][5] +' '+ data[i][7]; 
      }
    }
    return replyMessage
  }

// ==================================  
// 先頭が「確定連絡」のとき
// ==================================
  else if (command[0] == '確定連絡') {
    var data = sh.getDataRange().getValues();
    var date = command[1];

    var subject = '【五井火力】 配車のこと';
    var body = '藤本様\n\nお世話になります。\n\n'+ date +'分の引取につき、以下の通り手配致しましたことご報告致します。\n';

    for (var i=0; i<lastRow; i++) {
      var d = new Date(data[i][2]);
      d = Utilities.formatDate(d,'JST', 'M/d');
      if (date == d && data[i][7] == '依頼済') {
        var time = new Date(data[i][3]);
        time = Utilities.formatDate(time,'JST', 'H:mm');
        body += '\n'+ time +' '+ data[i][4] +' '+ data[i][5];
        sh.getRange(i+1,8).setValue('報告済');
      }
    }
    body += '\n\n以上\n\n株式会社ディールコネクト\n辻 拓也\nMobile: 080-4345-2407';
    
    GmailApp.sendEmail(
      'tsujiji0510@me.com', //宛先
      subject,
      body,
      {
        cc: 'info@deal-connect.co.jp, tsuji@deal-connect.co.jp',
        from: 'tsuji@deal-connect.co.jp'
      }
      );
      
      
    var replyMessage = '藤本様へメールを送りました。';
    return replyMessage
  }
}


/* 配車時間と車種をContentオブジェクトとして管理 
* 
* @param 配車時間
* @param 車種
* 
*/

var Content = function(time, truck) {
  this.time = time;
  this.truck = truck;
};


// スプレッドシートからcustomerごとのcontent群を取得
function fetchContents(date,customer) {
  var contents = [];
  var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno'); //契約管理Bot Spreadsheetの呼び出し
  var sh = ss.getSheetByName('五井火力'); //契約シートの呼び出し
  var lastRow = sh.getDataRange().getLastRow();　//最終行の呼び出し  
  var data = sh.getDataRange().getValues();

  
  for (var i=0; i<lastRow; i++) {
    var d = new Date(data[i][2]);
    d = Utilities.formatDate(d,'JST', 'M/d');
    if (date == d) {
      if (customer == data[i][4] && data[i][7] == '依頼前') {
        var time = new Date(data[i][3]);
        time = Utilities.formatDate(time,'JST', 'H:mm'); 
        var content = new Content(time, data[i][5]);
        contents.push(content);
        sh.getRange(i+1,8).setValue('依頼済');
        Logger.log(contents);
      }  
    }
  }
  return contents
}

// 配車依頼用テキストの作成
function requestText(contents) {
  var text = '';
   
  for (var i=0; i<contents.length; i++) {
    text += "\n"+ contents[i].time + " " + contents[i].truck;
  }
  
  return text
}

// プッシュメッセージ
function pushMessage(GROUP_ID,text) {
  var CHANNEL_ACCESS_TOKEN = 'Qk8go0KUNsUYp1aEgOUmQbANQu/PRbTOxLG5bmTe9ilKgVtV+q3QM9se37URCN9hNm8S6CbuWhkIqZXQNh8En7B4novKX0TjSVLK0g4h0pzsGgWBluCzW3/CguGHJMoh2Vz/K3+LL+tt7DcxTpAb7AdB04t89/1O/w1cDnyilFU=';
  var postData = {
    "to": GROUP_ID,
    "messages": [{
      "type": "text",
      "text": text,
    }]
  };

  var url = "https://api.line.me/v2/bot/message/push";
  var headers = {
    "Content-Type": "application/json",
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  var options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
}

function test() {
  var m = '確定 7/17';
  var t = new Date();
  var u = 'U6fc79eba210a02ee240c2bb8a491b16c';
  setData(m,t,u);
}