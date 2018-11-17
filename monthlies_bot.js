const fs = require("fs");
const Telegraf = require('telegraf');
const Telegram = require('telegraf/telegram');
const TELEGRAM_API_TOKEN = "601839852:AAG6x8uOiLHYD_j6br_I8OuhKLlX8Yt9Cww";
const telegram = new Telegram(TELEGRAM_API_TOKEN);
const bot = new Telegraf(TELEGRAM_API_TOKEN, {
	polling: true
})
botStart = function(msg){
  var id = msg.from.id;
	console.log("user "+id+" starts bot")
  fs.readdir("data",function(error,array){
	if (error)
	  throw error;
	if (array.includes(id+".json")==false){
    var obj = {id:id, time:new Date().getHours(),lastmsg:null,lastcommand:null, mes:[]};
	  fs.writeFile("data/"+id+".json",JSON.stringify(obj),'utf8', function(){});
	  console.log("file for user "+id+" created")
  }
  else 
	  console.log("file for user "+id+" found")
  });
}
bot.start(botStart);
bot.command("history",function(msg){
	tableCreate(msg.from.id)
});

bot.command("time",function(msg){
	readJsonFile("data/"+msg.from.id+".json").then(function(data){
		var id = data.id;
		data.lastcommand = "time";
		telegram.sendMessage(data.id,"В котором часу тебе будет удобно получать сообщения? Отправь цифру, например 18.");
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
		setTimeout(function(){
      readJsonFile("data/"+id+".json").then(function(data){
				if (data.lastcommand=="time"){
					data.lastcommand = "null";
					fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
					telegram.sendMessage(data.id,"Ты так и не прислала время. Если решишь изменить время сообщений, воспользуйся командой.");
				}
			})

		},1000*60*5);
	})
});


bot.startPolling();

var readJsonFile = function(file){
  return new Promise(function(success,fail){
    fs.readFile(file,function(error,data){
	  if (error) 
	    fail(error);
	  else
	    success(JSON.parse(data));
	})
  })
} 
function CreateMonhlies(){
  this.start = new Date();
  this.end = null;
	this.firstpain = null;
	this.secondpain = null;
	return this;
}
function addMonhlies(id){
	console.log("addMonhlies")
	readJsonFile("data/"+id+".json").then(function(data){
		data.mes.push(new CreateMonhlies());
		console.log(data.id);
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
	});
}

function timeAfterLastMes(obj){
  return (new Date() -  new Date(obj.mes[obj.mes.length-1].start))
}
function timeAfterLastMsg(obj){
  return (new Date() -  new Date(obj.lastmsg))
}


function checkIfNotifiationNeed(obj){
	var now = new Date();

	var betweenMsg = 1000*60*60*24;
	var betweenMes = 1000*60*60*24*28;
	var betweenStartEnd = 1000*60*60*24*3;
	var betweenStartPain =1000*60*60*24*1;
  if ( ( (obj.mes.length == 0) || (timeAfterLastMes(obj) >= betweenMes) ) && ( (timeAfterLastMsg(obj) >= (betweenMsg) ) || (obj.lastmsg == null) ) && (obj.time == (new Date()).getHours()) ){
		console.log((new Date).getHours(), obj.time);
		console.log("start question user "+obj.id)
		telegram.sendMessage(obj.id, 'Месячные начались?', optionsStart);
	  obj.lastmsg = new Date();
	  fs.writeFile("data/"+obj.id+".json", JSON.stringify(obj), 'utf8', function(){});
	}
	
  if (obj.mes.length!=0 && obj.mes[obj.mes.length-1].end==null && (timeAfterLastMes(obj) >= betweenStartEnd) && (timeAfterLastMsg(obj)>=betweenMsg) && (obj.time == (new Date()).getHours())){
		console.log("end question user "+obj.id)
		telegram.sendMessage(obj.id, 'Месячные закончились?', optionsEnd);
		obj.lastmsg = new Date();
		fs.writeFile("data/"+obj.id+".json", JSON.stringify(obj), 'utf8', function(){});
	}

	if (obj.mes.length!=0 &&  (timeAfterLastMes(obj) >= betweenStartPain) && (timeAfterLastMes(obj) <= betweenStartEnd) && (timeAfterLastMsg(obj)>=betweenMsg) && (obj.time == (new Date()).getHours())){
		console.log("first pain question user "+obj.id)
		telegram.sendMessage(obj.id, 'Оцени уровень боли', optionsFirstPain);
		obj.lastmsg = new Date();
		fs.writeFile("data/"+obj.id+".json", JSON.stringify(obj), 'utf8', function(){});
	}
}

function check_notifications(){
  fs.readdir("data/",function(error,data){
    data.forEach(function(element){
	  if (element)
	    readJsonFile("data/"+element).then(checkIfNotifiationNeed);
	})
  });
}

setInterval(check_notifications,5000);

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
	readJsonFile("data/"+msg.chat.id+".json").then(function(obj){
		if (obj.lastcommand == "time")
		  parseTime(msg);
	})
});
bot.on('callback_query', function (msg) {
	var answer = msg.callbackQuery.data;
	console.log(answer)
	if (answer == "mes_start"){
		addMonhlies(msg.from.id);
		telegram.sendMessage(msg.from.id,"Записал!");
		return;
	}
	if (answer == "mes_end"){
		mesEnd(msg.from.id);
		telegram.sendMessage(msg.from.id,"Записал!");
		return;
	}
	if (/first_pain/.test(answer)){
		firstpain(msg.from.id,answer);
		telegram.sendMessage(msg.from.id,"Записал!");
		return;
	}
	if (/second_pain/.test(answer)){
		secondpain(msg.from.id,answer);
		telegram.sendMessage(msg.from.id,"Записал!");
		return;
	}
});

function mesEnd(id){
	readJsonFile("data/"+id+".json").then(function(data){
		data.mes[data.mes.length-1].end = new Date();
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
		telegram.sendMessage(data.id,"Оцени уровень боли:",optionsSecondPain);
	})
}

function firstpain(id,answer){
	readJsonFile("data/"+id+".json").then(function(data){
		if (/high/.test(answer)){
			console.log("first pain is high for user "+id);
			data.mes[data.mes.length-1].firstpain="high";
		}
		if (/normal/.test(answer)){
			console.log("first pain is normal for user "+id);
			data.mes[data.mes.length-1].firstpain="normal";
		}
		if (/low/.test(answer)){
			console.log("first pain is low for user "+id);
			data.mes[data.mes.length-1].firstpain="low";
		}
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
	})
}
function secondpain(id,answer){
	readJsonFile("data/"+id+".json").then(function(data){
		if (/high/.test(answer)){
			console.log("second pain is high for user "+id);
			data.mes[data.mes.length-1].secondpain="high";
		}
		if (/normal/.test(answer)){
			console.log("second pain is normal for user "+id);
			data.mes[data.mes.length-1].secondpain="normal";
		}
		if (/low/.test(answer)){
			console.log("second pain is low for user "+id);
			data.mes[data.mes.length-1].secondpain="low";
		}				
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
	})
}
function tableCreate(id){
	readJsonFile("data/"+id+".json").then(function(data){
		var str ="";
		if (data.mes.length==0){
			console.log("history not found for user "+id)
			telegram.sendMessage(id,"история не найдена");
      return;
		}
		data.mes.forEach(function(element){
      str += mesToString(element);
		});
		console.log("sending history for user "+id);
		telegram.sendMessage(id,str);
	});
}
function mesToString(mes) {
  var str = "";
	if (mes.end == null)
	  str += new Date(mes.start).getDate() +"."+ (new Date(mes.start).getMonth()+1) +"."+ new Date(mes.start).getFullYear() +" - null\nБоль в начале: " +painToRussian(mes.firstpain)+"\nБоль в конце: "+painToRussian(mes.secondpain);
	else
		str += new Date(mes.start).getDate() +"."+ (new Date(mes.start).getMonth()+1) +"."+ new Date(mes.start).getFullYear() +" - "+new Date(mes.end).getDate() +"."+ (new Date(mes.end).getMonth()+1) +"."+ new Date(mes.end).getFullYear() +"\nБоль в начале: "+painToRussian(mes.firstpain)+"\nБоль в конце: "+painToRussian(mes.secondpain);
	str +="\n\n"
	return str;
}
function painToRussian(pain){
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
function parseTime(msg){
	var hour = msg.message.text;
	if (/\D+/.test(hour)){
		telegram.sendMessage(msg.from.id,"Это не цифра");
		return;
	}
	if(hour>23){
		telegram.sendMessage(msg.from.id,"В сутках всего 24 часа!")
		return;
	}
	if(hour<0){
		telegram.sendMessage(msg.from.id,"некорректное время!")
		return;
	}
	readJsonFile("data/"+msg.from.id+".json").then(function(data){
		data.lastcommand=null;
		data.time = hour;
		fs.writeFile("data/"+data.id+".json", JSON.stringify(data), 'utf8', function(){});
		telegram.sendMessage(msg.from.id,"Время сообщений  изменено на "+hour)
	})

}