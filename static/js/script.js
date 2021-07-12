
function startGame(playerArr,socket){
    $('.prestart').hide()
    $('.poststart').show()
    //add money status of all players
    updateplayersmoney(playerArr)
    //keep track of round and time as game progresses
    flag = incrementRound()
    startCountdown(socket)
    let y = setInterval(function(){
        if(flag == 10){
            clearInterval(y)
            $('#timer').html('Game is over.')
            endGame(socket)
            return
        }
        flag = incrementRound()
        startCountdown(socket)


    },35000)
}
//add box that shows odd and has an input box to optionContainer
//<div class="option">
//    <div class="prob">Probability: 20%</div>
//    <div class="return">Odds: 5</div>
//    <input type="text">
//</div>
function createBox(percentage,odd){
    optioncontainer = document.getElementById("optionContainer")
    //option div
    optionnode = document.createElement('div')
    optionnode.className="option"
    optioncontainer.append(optionnode)
    //prob div
    probnode = document.createElement('div')
    probnode.textContent = "Probability: "+percentage+"%"
    probnode.className = "prob"
    optionnode.append(probnode)
    //return div
    returnnode = document.createElement('div')
    returnnode.textContent = "Odds: "+odd
    returnnode.className = "return"
    optionnode.append(returnnode)
    //input div
    inputnode = document.createElement("input")
    optionnode.append(inputnode)
}
//timer  of 30 seconds
function startCountdown(socket){
    $('#timer').html('Time: 30')
    let socketvariable = socket
    let x = setInterval(function(){startCountdownInternal(socketvariable,x)},1000);

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
    $('#playersmoney').empty()
//    for (const [key, value] of Object.entries(dict)) {
//        $('#playersmoney').append('<div>'+key+': '+value+'</div>')
//        console.log(key, value);
//    }
    $('#playersmoney').append('<b>Player\'s money</b>' )
    for (elem of dict){
        $('#playersmoney').append('<div>'+elem[0]+': '+elem[1]+'</div>')
        console.log(elem[0], elem[1]);
    }
}
//check if positive whole number
function isNumeric(value) {
    return /^\d+$/.test(value);
}
function startCountdownInternal(socket,interval){
        let value = $('#timer').html().split(' ')[1]
        //event when timer hit 0
        if(value == '0'){
            clearInterval(interval)
            let userinput = []
            //send userinput array
            for (elem of $(".option input")){
                if(!elem.value == ''){
                    userinput.push(parseInt(elem.value))
                }else{
                    userinput.push(parseInt(0))
                }
            }
            let percentagearray = []
            let returnarray = []
            let totalwinning = 0
            //send odds and returns
            for (elem of $(".prob")){percentagearray.push(elem.textContent.split(' ')[1].slice(0,-1))}
            for (elem of $(".return")){returnarray.push(elem.textContent.split(' ')[1])}
            //calculating whether they won anything poggers
            percentagearray.forEach((currpercentage,index)=>{
                currreturn = returnarray[index]
                currinput = userinput[index]
                d = Math.random() * 100;
                if(d<currpercentage){
                    changecolor($(".option")[index])
                    totalwinning += currreturn*currinput
                }
            })
            profit = totalwinning - userinput.reduce((a,b)=>a+b,0)

            $('#timer').html('Wait for next bet')
            //delete input in input boxes
            for (elem of $(".option input")){elem.value=''}
            //updating current money with profit
            newAmount = parseInt($('#money').html().split(' ')[2]) + profit
            $("#money").html('Current Money: '+newAmount)
            //updating resulting money
            $("#moneyleft").html('Resulting Money: '+newAmount)
            socket.emit("userresult",{"list":[newAmount,profit]})


        }else{
            let newValue = parseInt(value) - 1
            $('#timer').html('Time: ' + newValue)
        }

}
//resetting game screen at the end of the game
function endGame(socket){
    $('.prestart').show()
    $('.poststart').hide()
    $("#round").empty()
    $('#timer').empty()
    resetOption()
    socket.emit("readyUpdate",{"value": 'Not Ready'})
    $('#readyButton').text('Ready Up')
    socket.emit("endgame")
}
function changecolor(div){
    div.style.borderColor="green"
    setTimeout(function(){
        div.style.borderColor="#69D2E7"
    },5000)

}
function increaseRandomOdds(){
    const cost = 10
    let newAmount = getCurrentMoney() - cost
    if(newAmount < 0 ){
        alert("Invalid funds")
        return
    }
    let numOdds = $(".return").length
    let index = Math.floor(Math.random() * (numOdds))
    let newint = parseFloat($(".return")[index].textContent.split(' ')[1]) + 0.25

    $("#money").html("Current Money: "+newAmount)
    $(".return")[index].textContent = "Odds: "+newint


}
function resetOption(){
    $("#optionContainer").empty()
    createBox(20,5)
    createBox(40,2.5)
    createBox(60,1.66)
    createBox(80,1.25)
}
function getCurrentMoney(){
    return parseInt($('#money').html().split(' ')[2])
}
function increaseRandomProb(){
    const cost = 10
    let newAmount = getCurrentMoney() - cost
    if(newAmount < 0 ){
        alert("Invalid funds")
        return
    }
    let numOdds = $(".prob").length
    let index = Math.floor(Math.random() * (numOdds))
    let newint = parseFloat($(".prob")[index].textContent.split(' ')[1].slice(0,-1)) + 5

    $("#money").html("Current Money: "+newAmount)
    $(".prob")[index].textContent = "Probability: "+newint+"%"

}
function increaseOption(){
    const cost = 10
    let newAmount = getCurrentMoney() - cost
    if(newAmount < 0 ){
        alert("Invalid funds")
        return
    }
    let index = Math.floor(Math.random() * 99 + 1)
    odd = Math.round(((100/index)+Number.EPSILON)*100)/100
    if(Math.random()>0.5){
        odd = odd + 0.25
    }else{
        odd = odd - 0.25
    }
    createBox(index,odd)
    console.log(index,odd)
    $("#money").html("Current Money: "+newAmount)
}