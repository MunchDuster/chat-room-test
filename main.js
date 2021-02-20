var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.get("/join", function(req, res) {
	res.sendFile(__dirname + "/join.html");
});
app.get("/chat", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

class Room{
	constructor(name,firstUser){
		rooms.push(this);
		this.name = name;
		this.users = [firstUser];
	}
	isUser(userName){
		for(var i=0;i<this.users.length;i++){
			if(this.users[i].name = userName)
				return true;
		}
		return false;
	}
	removeUser(userName){
		const index = this.users.findIndex(user => user.name === userName);
		if(index !== -1){
			return this.users.splice(index, 1)[0];
		}
	}
	joinUser(user){
		this.users.push(user);
		return user;
	}
}
class User{
  constructor(nm, pswd) {
    this.name = nm;
    this.password = pswd;
	this.isConnected = false;
	this.socket = null;
	users.push(this);
  }
  connect(socket){
	this.isConnected = true;
	this.socket = socket;
  }
}
class Socket{
	constructor(id,page){
		this.id = id;
		this.page = page;
	}
}

let thisRoom = "";
var currentdate = new Date();
var rooms = [];
var users = [];
var sockets = [];

function createUser(name,pass){
	var user = new User(name,pass)
	users.push(user);
	return user;}
function getUser(name){
	for(var i = 0;i < users.length;i++){
		if(users[i].username === name)
			return users[i];
	}}
function deleteUser(name){
	const index = users.findIndex(user => user.username === name);
	if(index !== -1){
		return users.splice(index, 1)[0];
	}}
function getDateTime(){
	return  currentdate.getDate() + "/"+  (parseInt(currentdate.getMonth())    + 1) + "/" + currentdate.getFullYear() + " , "   + currentdate.getHours() + ":"   + currentdate.getMinutes() + ":" + currentdate.getSeconds(); }
function IsRoom(name){
	for(let i=0;i<rooms.length;i++){
		if(rooms[i].name == name)
			return i;
	}
	return null;}
function makeRoom(nam,psd){
	var newRoom = {
		name: nam,
		password: psd,
		users: [],
		msgs: [],
		addUser: function(user){
			this.users.push(user);
		},
		removeUser: function(user){
			const index = this.users.findIndex(testuser => testuser.socketID === user.socketID);
			if(index !== -1){
				return this.users.splice(index, 1)[0];
			}
		},
		addMsg: function(systemMessage,msg,dateTime,user){
			this.msgs.splice(0, 0, {isSystemMessage: systemMessage ,msg: msg ,dateTime: dateTime ,user:user});
		} 
	}
	rooms.push(newRoom);
	return newRoom;}

io.on("connection", function(socket){
	console.log("connected");
	
	var pg;
	var room;
	socket.on('page type',function(page){
	console.log("Page Connected: " + page);
		pg = new Socket(socket,page);
	});
	socket.on('submit form',function(username,roomname,roompass,userpass){
		console.log("Checking for room: " + "roomname");
		var isrm = false;var isuser = false;
		var userMsg = "";var roomMsg = "";

		if(IsRoom(roomname) != null){
			if(rooms[IsRoom(roomname)].password != roompass){
				roomMsg = "Incorrect room password";
			}
			else{
				isrm = true;
			}
		}else{
			roomMsg = "No room found.";
		}
		if(getUser(username) != null){
			if(getUser(username).password === userpass)
				userMsg = "Incorrect user password";
				isuser = true;
		}else{
			userMsg = "User does not exist.";
		}
		console.log("Room pass: "+roompass);
		socket.emit('form response',(!isuser && !isrm && !userMsg && !roomMsg),isuser,isrm,userMsg,roomMsg);//userValid,roomValid,passValid,roomPassValid
	});
	socket.on('create room',function(name,pass){
		room = makeRoom(name,pass);
	})
	socket.on('join room',function(data){
		console.log('in room');
		let newUser = joinUser(socket.id,data.username, data.roomname);
		
		if(IsRoom(newUser.roomname) != null){
			room = rooms[IsRoom(newUser.roomname)];
			room.addUser(newUser);
		}
		socket.emit('send data', socket.id,newUser.username,newUser.roomname,room.msgs,room.password);
		io.emit('systemMsg',{msg: newUser.username + " connected.",room: room ,dateTime: getDateTime() });

		room.addMsg(true, newUser.username + " connected.", getDateTime(), null);
		room.addUser(newUser);

		thisRoom = newUser.roomName;
		console.log(newUser);
		socket.join(newUser.roomName);
	});
	socket.on("chat msg",function(data){
		socket.broadcast.emit('receive chat',data);
		if(room != null)
			room.addMsg(false, data.msg, data.dateTime, data.user);
	});
	socket.on("disconnect", function(){
		if(pg == "chat"){
			if(room){
				const user = room.removeUser(socket.id);
				io.emit('systemMsg', {msg: user.username+ " disconnected." ,room: user.roomname,dateTime: getDateTime()});
				if(room){
					room.addMsg(true, user.username + " connected.", getDateTime(), null);
					room.removeUser(user);
				}
				else
					console.log("NO CHAT ROOM");
			}
		}
	});
});

http.listen(3000);