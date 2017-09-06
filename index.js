const Discord = require("discord.js");

const fs = require("fs");

const prefix = "bot "

const token = "MzUxNDM0NjcwMDY1NDUxMDEw.DISi8Q.CChkE4rdzMMsqTAiV1Rm_bKJzvA"

const ytdl = require("ytdl-core");

const translate = require('google-translate-api');

var bot = new Discord.Client();

var oyunlar = {ids:[],games:[]};

var servers = {};

var cbot = require('mitsuku-api')();

var dil = 'tr';

var search = require('youtube-search');

var opts = {
  maxResults: 1,
  key: 'AIzaSyBEGnlJX9T1VU7H_3rwKlQNu3SdBU9_YDQ',
  type: 'video'
};

fs.readFile('Oyunlar.json', 'utf8', function (err, data) {
  if (err) throw err;
  oyunlar = JSON.parse(data);
});

setInterval(oyun,10000);

bot.login(token);

function oyun(){
  var guilds = bot.guilds.array();
  for(var i=0;i<guilds.length;i++) {
    var members = bot.guilds.array()[i].members.array()
    for(var j=0;j<members.length;j++) {
      if(!oyunlar.ids.includes(members[j].id)) {
        oyunlar.ids.push(members[j].id);
        oyunlar.games.push([]);
      }
        if(members[j].presence.game) {
          if(!oyunlar.games[idtoIndex(oyunlar.ids,members[j].id)].includes(members[j].presence.game.name)) {
          oyunlar.games[idtoIndex(oyunlar.ids,members[j].id)].push(members[j].presence.game.name);
        }
      }
    }
  }
  var json = JSON.stringify(oyunlar);
  fs.writeFile('Oyunlar.json', json, 'utf8');
}

// bot.on("ready", () => {
//
// });

bot.on("message", function(message){
  if(message.author.equals(bot.user)) return;
  if(message.content.substring(0,prefix.length)!=prefix) return;
  var args = message.content.substring(prefix.length).split(" ");
  switch(args[0]){
    case "rastgele":
      message.channel.sendMessage(args[Math.floor((Math.random() * (args.length-1)) + 1)]);
      break;
    // case "gel":
    //   message.member.voiceChannel.join();
    //   break;
    // case "git":
    //   message.member.voiceChannel.leave();
    //   break;
    case "oyun":
      if(oyunlar.games[idtoIndex(oyunlar.ids,message.author.id)].length>0) {
        message.channel.sendMessage(oyunlar.games[idtoIndex(oyunlar.ids,message.author.id)][Math.floor(Math.random()*oyunlar.games[idtoIndex(oyunlar.ids,message.author.id)].length)]);
      } else {
        message.channel.sendMessage("Bu isim için oyun bulunamadı.");
      }
      break;
    case "oyunlarıunut":
      oyunlar.games[idtoIndex(oyunlar.ids,message.author.id)] = [];
      break;
    case "çal":
      if(args[1]) {
        if(!servers[message.guild.id]) {
          servers[message.guild.id] = {queue: [], tqueue: []};
        }
        var server = servers[message.guild.id];
        server.queue.push(args[1]);
        if(!message.guild.voiceConnection && message.member.voiceChannel) {
          message.member.voiceChannel.join().then(function(connection) {
            play(connection, message);
          });
        }
      }
      break;
    case "geç":
      var server = servers[message.guild.id];
      if(server.dispatcher) {
        server.dispatcher.end();
      }
      break;
    case "dur":
      var server = servers[message.guild.id];
      if (message.guild.voiceConnection)
              {
                server.tqueue = server.queue;
                server.queue = [];
                server.dispatcher.end();
                //console.log("[" + new Date().toLocaleString() + "] Stopped the queue.");
              }﻿
      break;
    case "devam":
        if(!servers[message.guild.id]) return;
        var server = servers[message.guild.id];
        server.queue = server.tqueue;
        if(server.queue.length == 0) {
          console.log("Şarkı kalmadı.");
          return;
        }
        if(!message.guild.voiceConnection && message.member.voiceChannel) {
          message.member.voiceChannel.join().then(function(connection) {
            play(connection, message);
          });
        }
      break;
    case "birisiniseç":
      var username = message.guild.members.array()[Math.floor(Math.random()*message.guild.members.array().length)].user.username;
      while(username == bot.user.username) {
        username = message.guild.members.array()[Math.floor(Math.random()*message.guild.members.array().length)].user.username;
      }
      message.channel.sendMessage(username);
      break;
    case "dil":
      dil = args[1];
      break;
    case "youtube":
      search(message.content.substring(prefix.length+7), opts, function(err, results) {
        if(err) return console.log(err);
        message.channel.sendMessage("https://www.youtube.com/watch?v="+results[0].id);
      });
      break;
    case "çalisim":
      if(args[1]) {
        if(!servers[message.guild.id]) {
          servers[message.guild.id] = {queue: [], tqueue: []};
        }
        var server = servers[message.guild.id];
        search(message.content.substring(prefix.length+7), opts, function(err, results) {
          if(err) return console.log(err);
          server.queue.push("https://www.youtube.com/watch?v="+results[0].id);
        });
        if(!message.guild.voiceConnection && message.member.voiceChannel) {
          message.member.voiceChannel.join().then(function(connection) {
            play(connection, message);
          });
        }
      }
      break;
    default:
      if(dil=='en') {
        cbot.send(message.content.substring(prefix.length))
        .then(function(response){
          message.channel.sendMessage(response);
        });
      } else {
        translate(message.content.substring(prefix.length), {from: dil, to: 'en'}).then(res => {
          cbot.send(res.text)
          .then(function(response){
            translate(response, {from: 'en', to: dil}).then(r => {
              message.channel.sendMessage(r.text.replace("Mitsuku", "Mustafa"));
            }).catch(err => {
              console.error(err);
            });
          });
        }).catch(err => {
          console.error(err);
        });
      }
      //message.channel.sendMessage("Anlamadım.");
  }
});

function idtoIndex(array,id) {
  for(var i=0;i<array.length;i++) {
    if(array[i]==id) {
      return i;
    }
  }
}

function play(connection, message) {
  var server = servers[message.guild.id];
  server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: 'audioonly'}));
  server.queue.shift();
  server.dispatcher.on("end", function() {
    if(server.queue[0]) {
      play(connection, message);
    } else{
      connection.disconnect();
    }
  })
}
