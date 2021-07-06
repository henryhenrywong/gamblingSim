numRoom =5
$(document).ready(function(){
    var socket = io.connect('http://' + location.hostname+':'+location.port)
    mainurl = 'http://' + location.hostname+':'+location.port
    socket.on('connect', function(){
        socket.send('User has connected!');
    });
    createNRooms(numRoom)
    addOnclick(socket,numRoom)
});