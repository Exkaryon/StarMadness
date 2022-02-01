"use strict";

window.addEventListener('load', async () => {
    if('serviceWorker' in navigator){
        try {
            const reg = await navigator.serviceWorker.register('serviceworker.js');
            console.log('serviceWorker: Зарегистрирован!');
        } catch (error) {
            console.log('serviceWorker: Ошибка при регистрации!');
        }
    }
});