var socket = io();

//invio messaggio tramite pulsante o pressione tasto invio
$('#m').keydown(function(event){ 
    var keyCode = (event.keyCode ? event.keyCode : event.which);   
    if (keyCode == 13) {
        socket.emit('chat message', $('#m').val(), id);
        $('#m').val('');
    }
});
$('#msg_form').submit(function(){
    if (id=='') 
      alert("Nickname not valid!");
    else {
      socket.emit('chat message', $('#m').val(), id);
      $('#m').val('');
    }
    return false;
});
//ricevuto messaggio!
socket.on('chat message', function(msg, id){
    //gett hours,minutes and seconds
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    addMessage(id, msg, h+':'+m+':'+s);
    //scroll("chat-box");

});
//nuovo utente online!
socket.on('user_online', function(nick){
    //console.log("nuovo user online!");
    //mostro notifica
    $('#notifyUser').css('display', 'inline');
    setTimeout(function() { $('#notifyUser').css('display', 'none'); }, 3000);
    //aggiungo utente in elenco
    setOnline(nick);
});
//messaggi precedenti ricevuti!
socket.on('init', function(json_mex, json_users){
    //console.log("Chaiamto init");
    //parse dei messaggi e append nella chat box
    var rows = JSON.parse(json_mex);
    var l= rows.length;
    for (var i = 0; i < l; i++) {
      var msg = rows[i];
      addMessage(msg.mitt, msg.msg, msg.date+', '+msg.time);
    }
    //scroll("chat-box");
    //lista stati utenti
    rows = JSON.parse(json_users);
    l = rows.length;
    for (i=0; i<l; i++) {
      if (rows[i].status == 1)
        setOnline(rows[i].username);
      else 
        setOffline(rows[i].username);
    }
});
//utente logout
socket.on('user_logout', function(nick){
    $("#"+nick).attr('class', 'fa fa-circle text-danger');
});

