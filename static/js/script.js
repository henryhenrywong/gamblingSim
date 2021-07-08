function startGame(playerArr){
    $('.prestart').hide()
    $('.poststart').show()
    //add money status of all players
    updateplayersmoney(playerArr)

    //keep track of round and time as game progresses
    flag = incrementRound()
    startCountdown()
    let x = setInterval(function(){
        if(flag == 10){
            clearInterval(x)
            $('#timer').html('Game is over.')
            return
        }
        flag = incrementRound()
        startCountdown()


    },40000)
}
//add boxes that shows odd and has an input box
function createBox(){}
//timer  of 30 seconds
function startCountdown(){
    $('#timer').html('Time: 30')
    let x = setInterval(function(){
        let value = $('#timer').html().split(' ')[1]
        if(value == '0'){
            clearInterval(x)
            $('#timer').html('Wait for next bet')

        }else{
            let newValue = parseInt(value) - 1
            $('#timer').html('Time: ' + newValue)
        }

    },1000)

}
//show round counter
function incrementRound(){
    if($("#round").is(':empty')){
        $("#round").html('1 of 10 rounds')
        return 1
    }else{
        roundNumber = parseInt($("#round").html().split(' ')[0])
        roundNumber = roundNumber + 1
        newString = roundNumber + ' of 10 rounds'
        $("#round").html(newString)
        return roundNumber
    }
}
//populate playersmoney of players money given dictionary
function updateplayersmoney(dict){
    for (const [key, value] of Object.entries(dict)) {
        $('#playersmoney').empty()
        $('#playersmoney').append('<div>'+key+': '+value+'</div>')
        console.log(key, value);
    }
}
//check if positive whole number
function isNumeric(value) {
    return /^\d+$/.test(value);
}
