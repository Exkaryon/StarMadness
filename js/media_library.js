"use strict";



/////////////////////////////////////
///// Объект — медиабиблиотека. /////
/////////////////////////////////////
const mediaLibrary = {
    audioFiles: {},
    videoElements: {
        serenity: {
            element: document.querySelector('#mainmenu #video1'),               // Елемент
            readyEvent: 'canplaythrough',                                       // Имя события для слушателя, по которому будет считаться, что элемент загружен.
        },
    },
    preloader: {
        basis: document.querySelector('#preloader'),
        progress: document.querySelector('#preloader .progress'),
        ready: document.querySelector('#preloader .ready'),
    },


    context: new (window.AudioContext || window.webkitAudioContext)(),      // Аудио контекст.
    sounds: {},                                                             // Коллекция готовых звуков.
    loadedItems: 0,                                                         // Число загруженных файлов.
    totalItems: 0,                                                          // Общее число медиа-элементов (аудиофайлов и видеоэлементов) 



      //////////////////////////////////////
     ///// Класс для объектов-звуков  /////
    //////////////////////////////////////
    Sound: class {
        // Создаем объект звука на основе полученных данных.
        constructor(ctx, buffer, type) {
            this.ctx = ctx;                 // Аудио контекст документа.
            this.buffer = buffer;           // Передача буфера загруженного файла.
            this.type = type;               // Тип звука (музыкаМеню/музыкаИгры/эффект).
        }

        // Инициализация звука - процедура создания узлов управления и установка параметров для проигрывания.
        init() {
            // Обязательные процедуры:
            this.gainNode = this.ctx.createGain();                  // Создание узла усиления.
            this.source = this.ctx.createBufferSource();            // Создание нового AudioBufferSourceNode, который может быть использован для воспроизведения звуковых данных. 
            this.source.buffer = this.buffer;                       // Установка в качестве источника звука (аудиобуфера) передаем буфер из полученного файла (this.buffer).
            this.source.connect(this.gainNode);                     // Цепляем к источнику звука к узел усиления, чтобы можно было регулировать громкость.
            this.gainNode.connect(this.ctx.destination);            // Цепляем gainNode к destination. (i) destination — Свойство BaseAudioContext интерфейса возвращает AudioDestinationNode представляющий конечный пункт назначения всех аудио в контексте. Он часто представляет собой реальное устройство воспроизведения звука, такое как динамики вашего устройства.
        }

        play(exTime = 0) {
            this.init();
            let ct = this.ctx.currentTime + exTime;
            this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);                          // Изменение громкости в текущий момент времени.
            this.gainNode.gain.exponentialRampToValueAtTime(config.audio.volume[this.type], ct);    // Возрастание громкости до определенного значения в установленный временной интервал.
            this.source.start(this.ctx.currentTime);
        }

        stop(exTime = 0) {
            let ct = this.ctx.currentTime + exTime;
            this.gainNode.gain.setValueAtTime(config.audio.volume[this.type], this.ctx.currentTime);    // Установка громкости.
            this.gainNode.gain.exponentialRampToValueAtTime(0.01, ct);                                  // Затухание громкости до определенного значения в установленный временной интервал.
            this.source.stop(ct);                                                                       // Остановка звука в установленную временную задержку.
        }
    },



      ////////////////////////////////////////////////////////
     ///// Функция обновления прогресса для прелоадера. /////
    ////////////////////////////////////////////////////////
    progressUpdate(percent, url, errorClass){
        if(url){
            let urlParts = url.split('/');
            let fileName = urlParts[urlParts.length - 1];
            if(errorClass){
                this.preloader.progress.classList.add(errorClass);
                this.preloader.progress.children[2].textContent = `Что-то пошло не так с: .../${fileName} !`;
            }else{
                this.preloader.progress.children[2].textContent = `Буферизация: .../${fileName}`;
                this.preloader.progress.classList.remove('error');
            }
            return;
        }

        percent = Math.round(percent);
        this.preloader.progress.children[2].textContent = `...`;
        this.preloader.progress.children[0].textContent = percent + '%';
        this.preloader.progress.children[1].children[0].style.width = percent + '%';
    },



      //////////////////////////////////////////////////////////////////////////////
     ///// Инициализация библиотеки - загрузка аудиофайлов и создание звуков. /////
    //////////////////////////////////////////////////////////////////////////////
     init(){
        this.audioFiles = config.audio.files;
        this.totalItems = Object.entries(this.audioFiles).length + Object.entries(this.videoElements).length;
        const getNames = function(items){
            let itemsNames = [];
            for (const itemName in items) {
                itemsNames.push(itemName);
            }
            return itemsNames;
        };

        this.soundLoader(getNames(this.audioFiles));
        this.loadListener(getNames(this.videoElements));
    },



      //////////////////////////////////////////////
     ///// Загрузчик/буферизатор аудиофайлов. /////
    //////////////////////////////////////////////
    async soundLoader(soundNames){
        if(!soundNames.length){
            this.showStartButton();
            return;
        }
        const soundName = soundNames.shift();
        const url = this.audioFiles[soundName].url;
        const type = this.audioFiles[soundName].type;
        try{
            this.progressUpdate(false, url);                                                     // Передается адрес файла для отображения что он пошел в обработку.
            let response = await fetch(url);
            if(!response.ok) throw new Error(url); 
            let responseBuffer = await response.arrayBuffer();
            (function(thisLib){
                thisLib.context.decodeAudioData(responseBuffer)
                .then(function(decodedBuffer){
                    thisLib.sounds[soundName] = new thisLib.Sound(thisLib.context, decodedBuffer, type);    // Записываем получившийся звук в коллекцию звуков.
                    thisLib.loadedItems++;
                    thisLib.progressUpdate(thisLib.loadedItems / thisLib.totalItems * 100);                 // Просто обновляется прогрессбар и строка процента буферизации.
                    thisLib.soundLoader(soundNames);                                                        // Загрузчик вызывается рекурсивно, пока не будет исчерпана коллекция имен аудиофайлов soundNames.
                });
            })(this);
        }catch(error){
            this.progressUpdate(false, url, 'fatal_error');                                           // В случае ошибки передается адрес файла, на котором споткнулся загрузчик.
        }
    },



      ///////////////////////////////////////////////
     ///// Слушатель готовности медиаэлементов /////
    ///////////////////////////////////////////////
    loadListener(elemNames){
        if(!elemNames.length){
            this.showStartButton();
            return;
        }

        const elemName = elemNames.shift();
        const url = this.videoElements[elemName].element.currentSrc;
        this.progressUpdate(false, url);

        const answer = function(){
            this.loadedItems++;
            this.progressUpdate(this.loadedItems / this.totalItems * 100);
            this.loadListener(elemNames);
        }

        if(this.videoElements[elemName].element.buffered.length){                                                   // Если элемент уже был загружен, функция выполняется дальше, в ином случае прослушивается готовность элемента.
            answer.call(this);
        }else{
            let pushThrough = false;
            let tid = setTimeout(() => {                                                                            // Задержка 5 секунд на попытку загрузить элемент перед тем как выдать ошибку, а затем пойти дальше.
                this.progressUpdate(false, url, 'error');
                pushThrough = true;
                setTimeout(() => {
                    answer.call(this);
                }, 1000);

            }, 5000);
            this.videoElements[elemName].element.addEventListener(this.videoElements[elemName].readyEvent, () => {  // Если элемент загружен, задержка перед ошибкой снимается и функция выполняется дальше. 
                clearTimeout(tid);
                if(!pushThrough) answer.call(this);      // Не отрабатываеть если answer() уже вызван из таймаута. 
            }, {once: true});
        }
    },



      /////////////////////////////////////////////////////////////////
     ///// Отображение кнопки для активации медиа и запуска меню /////
    /////////////////////////////////////////////////////////////////
    showStartButton(){
        if(this.loadedItems < this.totalItems) return;
        this.preloader.progress.classList.add('inactive');
        this.preloader.ready.classList.remove('inactive');
        this.preloader.ready.children[1].addEventListener('click', (e) => {
            menu.init();
        }, {once: true})

    }

}

menu.init()
menu.show('main');
//mediaLibrary.init();