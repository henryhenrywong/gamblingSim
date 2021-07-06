function startCountdown(){
    $('#timer').html('30')
    let x = setInterval(function(){
        let value = $('#timer').html()
        if(value == '0'){
            clearInterval(x)
            $('#timer').html('Wait for next bet')

        }else{
            let newValue = parseInt(value) - 1
            $('#timer').html(newValue)
        }

    },1000)

}