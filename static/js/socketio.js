$(document).ready(function(){
    mainurl = 'http://' + location.hostname+':'+location.port
    var socket = io.connect(mainurl+'/inRoom')
    console.log('http://' + location.hostname+':'+location.port)
    socket.on('connect', function(){
        socket.send('User has connected!');
    });
    socket.on('message',function(msg){
        console.log(msg)
        $("#messages").append('<li>'+msg+'</li>')
        $('#messages').scrollTop($('#messages')[0].scrollHeight)
        console.log($('#messages')[0].scrollHeight)

    });
    $('#readyButton').on('click',function(){
        if($('#readyButton').text() == 'Ready Up'){
            socket.emit("readyUpdate",{"value": 'Ready'})
            $('#readyButton').text('Unready')
        }else{
            socket.emit("readyUpdate",{"value": 'NotReady'})
            $('#readyButton').text('Ready Up')
        }
    });
    socket.on('newnumber', function(msg) {
        console.log("Received number: " + msg.number);
        //maintain a list of ten numbers
        $('#numberContainer').html(msg.number);
    });
    socket.on('startTimer', function(msg) {
        console.log("Received: " + msg.state);
        startCountdown()
    });
    $('#leaveRoom').on('click',function(){
        document.location.href=(mainurl)
    });
    socket.on('lobbyUpdate', function(msg) {
        let readyFlag = 1
        console.log("Received update: " + msg.list);
        $('#currLobby').empty()
        for (row of msg.list) {
            console.log(row)
            if(row[1]!="Ready") readyFlag = 0
            $('#currLobby').append('<div>'+row[0]+':'+row[1]+'</div>')
        }
        // ready flag == 1 when everyone in lobby is ready, shows start button
        if (readyFlag == 1){
            $('#startButton').show()
        }else{
            $('#startButton').hide()
        }

    });
    socket.on('redirect', function(msg) {
        console.log("Received: " + mainurl);
        document.location.href=(mainurl+msg.url)
    });

});