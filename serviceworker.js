"use strict";

const staticCacheName = 's-app-v1.01';  // Текущая версия кэша. Соответcтвует версии приложения.

const assetsURLs = [
    'http://127.0.0.4:85/',
    '/index.html',
    '/manifest.json',
     // JS
    '/js/app.js',
    '/js/config.js',
    '/js/menu.js',
    '/js/dashboard.js',
    '/js/library.js',
    '/js/effect.class.js',
    '/js/spaceship.class.js',
    '/js/bullet.class.js',
    '/js/celestial_body.class.js',
    '/js/autopilot.class.js',
    '/js/render.js',
    '/js/dynamics.js',
    '/js/media_library.js',
     // CSS
    '/css/fonts.css',
    '/css/style.css',
    '/css/responsive.css',
    // FONTS
    '/fonts/Andromeda-eR2n.woff',
    '/fonts/TTLakes-Regular.woff',
    '/fonts/TTLakes-Light.woff',
    '/fonts/TTLakes-DemiBold.woff',
    '/fonts/TTLakes-Medium.woff',
    '/fonts/TTLakes-ExtraLight.woff',
    // MEDIA
    '/media/serenity.mp4',
    '/media/alien_invasion.mp3',
    '/media/tomorow_is_today.mp3',
    '/media/alien_invasion_alt.mp3',
    '/media/kinetic_strike.mp3',
    '/media/epic_arrival.mp3',
    '/media/singularity.mp3',
    '/media/plasma_gun.mp3',
    '/media/red_plasma.mp3',
    '/media/pellet.mp3',
    '/media/toxicball.mp3',
    '/media/iridiumcore.mp3',
    '/media/laser.mp3',
    '/media/fireball.mp3',
    '/media/biocapsule.mp3',
    '/media/ship_to_ship.mp3',
    '/media/ship_to_asteroid.mp3',
    '/media/ship_to_metal.mp3',
    '/media/ship_to_stone.mp3',
    '/media/ship_to_fragment.mp3',
    '/media/asteroid_to_asteroid.mp3',
    '/media/stone_to_asteroid.mp3',
    '/media/stone_to_stone.mp3',
    '/media/fragment_to_fragment.mp3',
    '/media/fire_explosion.mp3',
    '/media/asteroid_fragmentation.mp3',
    '/media/spark_bang.mp3',
    '/media/black_bang.mp3',
    '/media/fireball_bang.mp3',
    '/media/blood_bang.mp3',
    '/media/toxic_bang.mp3',
    '/media/stone_bang.mp3',
    '/media/mini_bang.mp3',
    '/media/engine.mp3',
    '/media/game_over.mp3',
     // IMAGES
    '/icons/app-icon-144-144.png',
    '/images/logo.png',
    '/images/videoscreen.jpg',
    '/images/button_bg_blue.png',
    '/images/illuminator.png',
    '/images/local_bg.jpg',
    '/images/online_bg.jpg',
    '/images/settings_bg.jpg',
    '/images/hangar_bg.jpg',
    '/images/angles.png',
    '/images/focus.png',
    '/images/galaxy_bg.jpg',
    '/images/space_bg.jpg',
    '/images/player1.png',
    '/images/player2.png',
    '/images/player3.png',
    '/images/player4.png',
];


self.addEventListener('install', async event => {
    const cache = await caches.open(staticCacheName);
    await cache.addAll(assetsURLs);
    // Удаление старых версий кэша (когда приложение было обновлено).
    const cacheNames = await caches.keys();
    if(cacheNames.length > 1){
        cacheNames
            .filter(name => name !== staticCacheName)
            .map(name => caches.delete(name));
        //console.log('Удален старый кэш!');
    }
    //console.log('Приложение установлено!');
});


self.addEventListener('activate', async () => {
    //console.log('Приложение активировано!');
});


self.addEventListener('fetch', event => {
    event.respondWith(cacheFirst(event));
});


async function cacheFirst(ev){
    const cached = await caches.match(ev.request);
    //console.log(cached ? 'в кэше' : '------', ev.request.url);


    if(cached){
        return cached;
    }else{
        let re;
        try {
            re = await fetch(ev.request) ;
            return re;
        } catch (error) {
            //console.log('ФАЙЛ '+ev.request.url+' ОКАЗАЛСЯ НЕДОСТУПЕН!');
            return null;
        }
    }

   // return cached ?? await fetch(ev.request)
}

