const fs = require("fs");
const Telegram = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent')
const TELEGRAM_API_TOKEN = "601839852:AAG6x8uOiLHYD_j6br_I8OuhKLlX8Yt9Cww";
 bot = new Telegram(TELEGRAM_API_TOKEN, {
	polling: true,
	request: {
		agentClass: Agent,
		agentOptions: {
			socksHost: 'hvkun.teletype.live',
			socksPort: 1080,
			socksUsername: 'telegram',
			socksPassword: 'telegram'
		}
	}
})

function restartPolling(){
	bot.stopPolling();
	console.log(bot.isPolling());
	bot.startPolling();
	console.log("polling restarts");
}

class UserObject{
	constructor(){
		this.id = undefined;
		this.time = new Date().getHours();
		this.lastmsg = null;
		this.lastcommand = null;
		this.mes = [];
	}
	savetoFile(){
    this.writeJsonFile();
  }
  writeJsonFile(){
    console.log("write file "+this.id)
    console.log(JSON.stringify(this).toString())
    fs.unlink("data/"+this.id+".json",(err)=>{
      if (err)
        console.log(err);
      fs.writeFile("data/"+this.id+".json",JSON.stringify(this),'utf8', function(){});
    })
	}
	timeAfterLastMes(){
		return (new Date() -  new Date(this.mes[this.mes.length-1].start))
	}
	timeAfterLastMsg(){
		return (new Date() -  new Date(this.lastmsg))
	}
	checkIfNotifiationNeed(){
		var betweenMsg = 1000*60*60*24;
		var betweenMes = 1000*60*60*24*28;
		var betweenStartEnd = 1000*60*60*24*3;
		var betweenStartPain =1000*60*60*24*1;
		if ( ( (this.mes.length == 0) || (this.timeAfterLastMes() >= betweenMes) ) && ( (this.timeAfterLastMsg() >= (betweenMsg) ) || (this.lastmsg == null) ) && (this.time == (new Date()).getHours()) ){
			console.log((new Date).getHours(), this.time);
			console.log("start question user "+this.id)
			bot.sendMessage(this.id, 'Месячные начались?', optionsStart);
			this.lastmsg = new Date();
			this.savetoFile();
		}	
		if (this.mes.length!=0 && this.mes[this.mes.length-1].end==null && (this.timeAfterLastMes() >= betweenStartEnd) && (this.timeAfterLastMsg()>=betweenMsg) && (this.time == (new Date()).getHours())){
			console.log("end question user "+this.id)
			bot.sendMessage(this.id, 'Месячные закончились?', optionsEnd);
			this.lastmsg = new Date();
			this.savetoFile();
		}	
		if (this.mes.length!=0 &&  (this.timeAfterLastMes() >= betweenStartPain) && (this.timeAfterLastMes() <= betweenStartEnd) && (this.timeAfterLastMsg()>=betweenMsg) && (this.time == (new Date()).getHours())){
			console.log("first pain question user "+this.id)
			bot.sendMessage(this.id, 'Оцени уровень боли', optionsFirstPain);
			this.lastmsg = new Date();
			this.savetoFile();
		}
	}
	static readJsonFile(file){
    return new Promise(function(success,fail){
      var path = "data/"+file+".json";
      fs.readFile(path,function(error,data){
        var obj;
        if (error){
          console.log("error with reading file:"+file);
          console.log(error);
          obj = new UserObject;
					obj.id=file;
					obj.savetoFile();
        }
        else{
          var obj = JSON.parse(data);
          obj.__proto__ = new UserObject;
        }
        success(obj);
      })
    }).catch((error)=>{console.log("error with parsing: "+data);})
	}
	static check_notifications(){
    fs.readdir("data/",function(error,data){
      if (error)
        conlose.error(error);
      data.forEach(function(element){
      if (element){
        var filename = element.toString();
        var filename = filename.slice(0,filename.length-".json".length);
        UserObject.readJsonFile(filename).then(function(obj){
          obj.checkIfNotifiationNeed();
        })
      }
      })
    })
	}
	mesEnd(){
		this.mes[this.mes.length-1].end = new Date();
		this.savetoFile();
		bot.sendMessage(this.id,"Оцени уровень боли:",optionsSecondPain);
	}
	static painToRussian(pain){
		switch (pain){
			case "low":
				return("не больно");
			case "normal":
				return("обычно");
			case "high":
				return("больно");
			default:
				return("---");
		}
	}
	firstPain(answer){
		if (/high/.test(answer)){
			console.log("first pain is high for user "+this.id);
			this.mes[this.mes.length-1].firstpain="high";
		}
		if (/normal/.test(answer)){
			console.log("first pain is normal for user "+this.id);
			this.mes[this.mes.length-1].firstpain="normal";
		}
		if (/low/.test(answer)){
			console.log("first pain is low for user "+this.id);
			this.mes[this.mes.length-1].firstpain="low";
		}
		this.savetoFile();
	}
	secondPain(answer){
		if (/high/.test(answer)){
			console.log("second pain is high for user "+this.id);
			this.mes[this.mes.length-1].secondpain="high";
		}
		if (/normal/.test(answer)){
			console.log("second pain is normal for user "+this.id);
			this.mes[this.mes.length-1].secondpain="normal";
		}
		if (/low/.test(answer)){
			console.log("second pain is low for user "+this.id);
			this.mes[this.mes.length-1].secondpain="low";
		}				
		this.savetoFile();
	}
	tableCreate(){
		var str ="";
		if (this.mes.length==0){
			console.log("history not found for user "+this.id)
			bot.sendMessage(this.id,"история не найдена");
			return;
		}
		this.mes.forEach(function(element){
			element.__proto__=new Monthlies;
			str += element.toString();
		});
		console.log("sending history for user "+this.id);
		bot.sendMessage(this.id,str);
	}
	static checkTimeCorrect(msg){
    var hour = msg.text;
		if (/\D+/.test(hour)){
			bot.sendMessage(msg.from.id,"Это не цифра");
			return false;
		}
		if(hour>23){
			bot.sendMessage(msg.from.id,"В сутках всего 24 часа!")
			return false;
		}
		if(hour<0){
			bot.sendMessage(msg.from.id,"некорректное время!")
			return false;
		}
		return true;
	}
	addTime(time){
		this.lastcommand=null;
		this.time = time;
		this.savetoFile();
	  bot.sendMessage(this.id,"Время сообщений  изменено на "+time)
	}
 
}
class Monthlies{
	constructor(){
		this.start = new Date();
		this.end = null;
		this.firstpain = null;
		this.secondpain = null;
	}
	addMonthlies(id){
		var monthlies = this;
		UserObject.readJsonFile(id).then(function(obj){
			obj.mes.push(monthlies);
			obj.savetoFile();
		});
	}
	toString(){
		var str = "";
		if (this.end == null)
			str += new Date(this.start).getDate() +"."+ (new Date(this.start).getMonth()+1) +"."+ new Date(this.start).getFullYear() +" - null\nБоль в начале: " +UserObject.painToRussian(this.firstpain)+"\nБоль в конце: "+UserObject.painToRussian(this.secondpain);
		else
			str += new Date(this.start).getDate() +"."+ (new Date(this.start).getMonth()+1) +"."+ new Date(this.start).getFullYear() +" - "+new Date(this.end).getDate() +"."+ (new Date(this.end).getMonth()+1) +"."+ new Date(this.end).getFullYear() +"\nБоль в начале: "+UserObject.painToRussian(this.firstpain)+"\nБоль в конце: "+UserObject.painToRussian(this.secondpain);
		str +="\n\n"
		return str;
	}
}
bot.onText(/\/start/,function(msg){
	var id = msg.from.id;
	console.log("user "+id+" starts bot")
  fs.readdir("data",function(error,array){
	if (error)
	  throw error;
	if (array.includes(id+".json")==false){
		var obj = new UserObject;
		obj.id = id;
	  obj.savetoFile();
	  console.log("file for user "+id+" created")
  }
  else 
	  console.log("file for user "+id+" found")
  });
});
bot.onText(/\/history/,function(msg){
	UserObject.readJsonFile(msg.from.id).then((obj)=>{obj.tableCreate()})
});
bot.onText(/\/time/,function(msg){
	UserObject.readJsonFile(msg.from.id).then(function(data){
		var id = data.id;
		data.lastcommand = "time";
		data.savetoFile();
		bot.sendMessage(data.id,"В котором часу тебе будет удобно получать сообщения? Отправь цифру, например 18.");
		setTimeout(function(){
      UserObject.readJsonFile(id).then(function(data){
				if (data.lastcommand=="time"){
					data.lastcommand = "null";
					data.savetoFile();
					bot.sendMessage(data.id,"Ты так и не прислала время. Если решишь изменить время сообщений, воспользуйся командой.");
				}
			})

		},1000*60*5);
	})
});
setInterval(UserObject.check_notifications,5000);
//setInterval(restartPolling,1000*60);
var optionsStart = {
	reply_markup: JSON.stringify({
	  inline_keyboard: [
		[{ text: 'Да', callback_data: 'mes_start' },
		{ text: 'Нет', callback_data: 'mes_not_start' }]
	  ]
	})
};
var optionsEnd = {
	reply_markup: JSON.stringify({
	  inline_keyboard: [
		[{ text: 'Да', callback_data: 'mes_end' },
		{ text: 'Нет', callback_data: 'mes_not_end' }]
	  ]
	})
};
var optionsFirstPain = {
	reply_markup: JSON.stringify({
	  inline_keyboard: [
		[{ text: 'Больно', callback_data: 'first_pain_high' }],
		[{ text: 'Обычно', callback_data: 'first_pain_normal' }],
		[{ text: 'Не больно', callback_data: 'first_pain_low' }]
	  ]
	})
};
var optionsSecondPain = {
	reply_markup: JSON.stringify({
	  inline_keyboard: [
		[{ text: 'Больно', callback_data: 'second_pain_high' }],
		[{ text: 'Обычно', callback_data: 'second_pain_normal' }],
		[{ text: 'Не больно', callback_data: 'second_pain_low' }]
	  ]
	})
};
bot.on('text',function(msg){
	if (/\//.test(msg.text))
    return;
	UserObject.readJsonFile(msg.chat.id).then(function(obj){
		if (obj.lastcommand == "time" && UserObject.checkTimeCorrect(msg))
		  obj.addTime(msg.text);
	})
});
bot.on('callback_query', function(msg){
	var answer = msg.data;
	if (answer == "mes_start"){
		var monthlies = new Monthlies;
		monthlies.addMonthlies(msg.from.id);
		bot.sendMessage(msg.from.id,"Записал!");
		return;
	}
	if (answer == "mes_end"){
    UserObject.readJsonFile(msg.from.id).then(function(obj){
			bot.sendMessage(msg.from.id,"Записал!");
			obj.mesEnd();
		})
	}
	if (answer == "mes_not_start"){
		bot.sendMessage(msg.from.id,"Записал! Спрошу завтра!");
	}
	if (answer == "mes_not_end"){
		bot.sendMessage(msg.from.id,"Записал! Спрошу завтра!");
	}
	if (/first_pain/.test(answer)){
		UserObject.readJsonFile(msg.from.id).then(function(obj){
			bot.sendMessage(msg.from.id,"Записал!");
			obj.firstPain(answer);
		})

	}
	if (/second_pain/.test(answer)){
		UserObject.readJsonFile(msg.from.id).then(function(obj){
			bot.sendMessage(msg.from.id,"Записал!");
			obj.secondPain(answer);
		})
 }
});
function checkDataFolder(){
  fs.readdir("data",function(err,data){
  if (err){
    console.log('no data directory');
    fs.mkdir("data/",(err)=>{
      if (err)
       console.error("error with creating data directory "+err);
    });
  }
  })
}
bot.on('polling_error',(err)=>{
	console.error("polling error: "+err.code+" body: "+err);
	restartPolling();
})
checkDataFolder();