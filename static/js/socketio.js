$(document).ready(function(){
    //hiding all post start elements on load
    $('.poststart').hide()
    mainurl = 'http://' + location.hostname+':'+location.port
    var socket = io.connect(mainurl+'/inRoom')
    console.log('http://' + location.hostname+':'+location.port)
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
            socket.emit("readyUpdate",{"value": 'NotReady'})
            $('#readyButton').text('Ready Up')
        }
    });
    //start game
    $('#startButton').on('click',function(){
        $('#waiting').hide()
        socket.emit("startGame",{})

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
    socket.on("startGameConfirm",function(data){
        startGame(data.list)
    });
    $(".option input").change(function(){
        let currAmount = parseInt($('#money').html().split(' ')[2])
        let moneyleft = parseInt($('#moneyleft').html().split(' ')[2])
        if(this.value.length == 0){
            input = 0
        }else{
            input = parseInt(this.value)
        }
        if(!isNumeric(input)){
            this.value = ''
            alert('Invalid Value')
        }else if(input > moneyleft){
            this.value = ''
            alert('Input is too big')
        }
        let totalspend = 0
        for (elem of $(".option input")){
            if(!elem.value == ''){
                totalspend += parseInt(elem.value)
            }
        }
        remainingmoney = currAmount - totalspend
        $("#moneyleft").html('Resulting Money: '+remainingmoney)
    })

});