"use strict";

// Кнопка запуска и паузы.
document.querySelector('button#pause').addEventListener('click', (e) => {
    e.preventDefault();
    if(universe.timeFlow){
        universe.timeFlow = false;
        //clearInterval(render.cleanerIntervalId);
    }else{
        universe.counter = 0;
        universe.timeFlow = true;
        universe.quantumSwitch();
        //render.cleanerIntervalId = setInterval(() =>{
        //    render.clearLayersStack();
        //} , render.cleanerInterval * 1000);
    }
});


// Управляемый цикл итетраций по кнопке или мышью.
document.addEventListener('mousewheel', (e) => {
    //console.log(e);
    //if(e.code == 'KeyZ'){
        universe.counter = 2000;
        universe.timeFlow = true;
        universe.quantumSwitch();
    //}
});




// Функция для отладки. Отображает данные переменных в режиме реального времени.
function DEBUG_INFO(fieldId, params, color, message, cssClass){
    let element = document.getElementById(fieldId);
    if(params){
        element.innerHTML = params.join('#', params).replace(/#/g, '<br>');//'X-space: '+params[0]+' px<br>X-pos: &nbsp;&nbsp;'+params[1].toFixed(1)+ ' px<br>'+params[2];
    }    
    if(message){
        element.innerHTML += '<br>'+message;
    }else{
        element.innerHTML += '';
    }
    element.style.color = color;
    
    if(cssClass){
        element.classList.add(cssClass);
    }

}
