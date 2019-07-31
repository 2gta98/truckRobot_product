/** 
* Postに対する反応
* ログを保存
* 返信メッセージを送る
*/
function doPost(e) {
  var event = JSON.parse(e.postData.contents).events[0];
  
  //ログの保存
  var ss = SpreadsheetApp.openById('1EpfiK7ZoevGFitGT-GFiDcWamGD12l4FVyhDtrsdFno');
  var sh = ss.getSheetByName('LINE_log');
  var lastRow = sh.getLastRow();
  sh.getRange(lastRow+1,1).setValue(event);
  
  if (event.type === 'message') {
    replyToMessage(event);
  } else if (event.type === 'postback') {
    actionToPostBack(event);
  }
}
