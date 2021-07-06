
//appends N Rooms to class="Container"
//<div class = "RoomContainer">
//<button class="joinButton" id="joinRoom1">Join Room 1</button>
//</div>
function createNRooms(num){
    for(let i=1;i<num+1;i++){
        let roomContainer = document.createElement("div")
        roomContainer.className = "RoomContainer"
        let joinButton = document.createElement("button")
        joinButton.className = "joinButton"
        joinButton.id = "joinRoom" + i
        joinButton.textContent = "Join Room " + i
        roomContainer.append(joinButton)
        $(".Container").append(roomContainer)
    }
}
//adds onclick function to each join room button
//$('#joinRoom1').on('click',function(){
//    socket.emit("join",data={'room' : "1",'username':$('#username').val()});
//    document.location.href=(mainurl+'/inRoom')
//});
function addOnclick(socket,num){
    for(let i=1;i<num+1;i++){
        string = "#joinRoom" + i
        $(string).on('click',function(){
            socket.emit("join",data={'room' : i.toString(),'username':$('#username').val()});
            document.location.href=(mainurl+'/inRoom')
        });
    }

}