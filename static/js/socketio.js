$(document).ready(function(){
    //hiding all post start elements on load
    $('.poststart').hide()
    mainurl = 'http://' + location.hostname+':'+location.port
    var socket = io.connect(mainurl+'/inRoom')
    socket.on('connect', function(){
        socket.send('User has connected!');
    });
    socket.on('message',function(msg){
        $("#messages").append('<li>'+msg+'</li>')
        $('#messages').scrollTop($('#messages')[0].scrollHeight)
    });
    $('#readyButton').on('click',function(){
        if($('#readyButton').text() == 'Ready Up'){
            socket.emit("readyUpdate",{"value": 'Ready'})
            $('#readyButton').text('Unready')
        }else{
            socket.emit("readyUpdate",{"value": 'Not Ready'})
            $('#readyButton').text('Ready Up')
        }
    });
    //start game
    $('#startButton').on('click',function(){
        $('#waiting').hide()
        socket.emit("startGame",{})

    });
    socket.on('newnumber', function(msg) {
        //maintain a list of ten numbers
        $('#numberContainer').html(msg.number);
    });
    socket.on('startTimer', function(msg) {
        startCountdown()
    });
    $('#leaveRoom').on('click',function(){
        document.location.href=(mainurl)
    });
    socket.on('lobbyUpdate', function(msg) {
        let readyFlag = 1
        $('#currLobby').empty()
        for (row of msg.list) {
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
        document.location.href=(mainurl+msg.url)
    });
    socket.on("startGameConfirm",function(data){
        socket.emit("readyUpdate",{"value": 'Started'})
        startGame(data.list,socket)
    });
    updateInputChangeEvent()
    socket.on('updateplayersmoney', function(msg) {
        updateplayersmoney(msg.list)
    });

});