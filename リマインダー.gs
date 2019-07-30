/**
* 配車依頼の連絡から1時間経っても返信がない場合にリマインドを送る。
*
*
*/

function sendReminder() {
  var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno');
  var sh = ss.getSheetByName('五井火力'); //契約シートの呼び出し
  var lastRow = sh.getDataRange().getLastRow();　//最終行の呼び出し
  var data = sh.getDataRange().getValues();
  
  var shCus = ss.getSheetByName('五井火力引取事業者リスト');
  var cusData = shCus.getDataRange().getValues();
  
  var remindId = [];
  
  for (var i=1; i<cusData.length; i++) {
    for (var j=1; j<data.length; j++) {
      if (data[j][7] == '確認前' && cusData[i][0] == data[j][4]) {
        remindId.push(cusData[i][1]);
        break;
      }
    }
  }
  Logger.log(remindId);
  
  for (var i=0; i<remindId.length; i++) {
    var postData = {
      "to": remindId[i],
      "messages": [{
        "type": "text",
        "text": '本日お送りしている配車依頼につきましてご確認お願い致します。',
      }]
    };
    pushMessage(postData);
  }
}
