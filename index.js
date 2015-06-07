//var app = require('express')();
var express = require('express');
var app = express();
var http = require('http').Server(app);
var socket = require('socket.io');
var io = socket.listen(http);
var mysql = require('mysql');

var clients = [];

app.get('/', function(req, res){
  log("requested index.html file");
  log("ID=>"+req.param('id'));
  res.sendfile(__dirname + '/index.html');
});

//routing static file on server
app.use(express.static(__dirname));

io.on('connection', function(socket){
  log("New connection incoming");
  socket.on('user_online', function(id){
    log("New nickname online");
    io.emit('user_online', id);
  });
  socket.on('disconnect', function(){
    log("client disconnected!");
    //setto status offline
    log("Requested logout");
    var id = getID(socket);
    var query = "UPDATE oauth_users SET status=0 WHERE username='"+id+"'";
    var db = connect();
    db.query(query);
    db.end();
    log("client called logout");
    io.emit('user_logout', id);
    
  });
  socket.on('chat message', function(msg, id){
        //trovo info date/time
        var date = new Date();
        var d = date.getDate() < 10 ? "0"+date.getDate() : date.getDate();
        var mo = (date.getMonth()+1) < 10 ? "0"+(date.getMonth()+1) : (date.getMonth()+1);
        var y = date.getFullYear();
        var h = date.getHours()+2 < 10 ? "0"+date.getHours()+2 : date.getHours()+2;
        var m = date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes();
        var s = date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds();
        var today = d+"/"+mo+"/"+y;
        var now = h+":"+m+":"+s; 
        
        //salvo in db
        var db = connect();
        var query = "INSERT INTO messages(mitt,dest,msg,date,time) VALUES ('"+id+"', '@', '"+msg+"', '"+today+"', '"+now+"');";
        db.query(query,function(err,rows){
            //db.release();
            if(err) {
                log("Error with insert query.");
            }           
        });
        db.end();
        io.emit('chat message', msg, id);
  });
  socket.on('user_logout', function(id){
      
  });
  //carica vecchi messaggi al loading della pagina
  socket.on('init', function(id){
      //memorizzo client+id
      clients.push({client : socket, id : id});
      var db = connect();
      //setto status online
      var query = "UPDATE oauth_users SET status=1 WHERE username='"+id+"'";
      db.query(query);
      var query_mex="SELECT * FROM messages ORDER BY date,time ASC";
      var query_user="SELECT username, status FROM oauth_users;";
      //scarico vecchi messaggi + stati utenti e spedisco al client
      db.query(query_mex,function(err,rows){
          if (err) {
            log("Error with select messages.");
          }
          else {
            var mex = JSON.stringify(rows);
            db.query(query_user,function(err,rows){
              if (err) {
                log("Error with select users.");
              } else {
                  var users = JSON.stringify(rows);
                  socket.emit('init', mex, users);
                  db.end();
              }
            });
          }
      });
  });

});

http.listen(80, function(){
  log('listening on *:'+80);
});

//connessione al db
function connect() {
  //mysql connection
  var DBhost = 'us-cdbr-iron-east-01.cleardb.net';
  var DBuser = 'bf1c9d658ff1ed';
  var DBpass = '3175e2fb';
  var DBname = 'ad_5b8045e5aae6ad9';
  var connection = mysql.createConnection({
    host     : DBhost,
    user     : DBuser,
    password : DBpass,
    database : DBname
  });
  
  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return false;
    }
  
    log('connected as id ' + connection.threadId);
  });
  return connection;
}

//dato un socket ne ritorna l' id
function getID(socket) {
  var l = clients.length;
  for (var i = 0; i < l; i++)
    if (clients[i].client == socket) return clients[i].id;

  return -1;
}

function timestamp() {
  var objToday = new Date(),
                curHour = objToday.getHours() > 12 ? objToday.getHours() - 12 : (objToday.getHours() < 10 ? "0" + objToday.getHours() : objToday.getHours()),
                curMinute = objToday.getMinutes() < 10 ? "0" + objToday.getMinutes() : objToday.getMinutes(),
                curSeconds = objToday.getSeconds() < 10 ? "0" + objToday.getSeconds() : objToday.getSeconds();
  var now = "[ " + curHour + ":" + curMinute + "." + curSeconds + " ] ";
  return now;
  
}

function log(text) {
  console.log(timestamp() + text);
}
//test vari

