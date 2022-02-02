"use strict";


/////////////////////////////////////
///// Объект — медиабиблиотека. /////
/////////////////////////////////////
const mediaLibrary = {
    audioFiles: {},
    videoElements: {                                                        // Видеоэлементы. Их может быть несколько и все они указываются здесь (пока неизвестно зачем, но так, на всякий...).
        serenity: {
            element: document.querySelector('#mainmenu #video'),                // Елемент
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
    playingMusic: null,                                                     // Ссылка на объект текущей проигрываемой музыки.
    soundNamesInTypes: {                                                    // Имена звуков распределенные по типам. 
        introMusic: [],
        menuMusic: [],
        gameMusic: [],
        gameSound: [],
    },



      //////////////////////////////////////
     ///// Класс для объектов-звуков  /////
    //////////////////////////////////////
    Sound: class {
        // Создаем объект звука на основе полученных данных.
        constructor(ctx, buffer, type, loop) {
            this.ctx = ctx;                 // Аудио контекст документа.
            this.buffer = buffer;           // Передача буфера загруженного файла.
            this.type = type;               // Тип звука (музыкаМеню/музыкаИгры/эффект).
            this.loop = loop;               // Флаг звуковой петли (многократно повторяющийся звук).
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

        play(exTime = 0, delay = 0, afterPlayFunc = null) {                           // exTime - время возрастания громкости; afterPlayFunc - callback-функция которая будет запущена после окончания проигрывания.
            this.init();
            let ct = this.ctx.currentTime + delay + exTime ;
            this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);                              // Изменение громкости в текущий момент времени.
            this.gainNode.gain.exponentialRampToValueAtTime(config.audio.volume[this.type], ct);        // Возрастание громкости до определенного значения в установленный временной интервал.
            this.source.onended = afterPlayFunc;                                                        // Событие после окончания проигрывания (задумано для запуска следующей мелодии).
            if(this.loop){                                                                              // Когда звук должен многократно воспроизводится.
                this.source.loop = true;
                this.source.loopStart = 0.05;                                                           // Оконцовка и начало аудиофайла почему-то всегда приглушенные получаются при кодировании, поэтому отрезаается хвосты с обеих сторон, чтобы избежать "дырок" в звуковой петле.
                this.source.loopEnd = this.buffer.duration - 0.05;
            }
            if(this.type.includes('Music')) mediaLibrary.playingMusic = this;                           // Поскольку музыка является длительной, ее нужно вовремя останавлявать, например при переходе от меню к геймплею и обратно, поэтому ссылка на нее сохраняется в данном св-ве.
            this.source.start(this.ctx.currentTime + delay);
        }

        stop(exTime = 0) {
            let ct = this.ctx.currentTime + exTime;
            this.gainNode.gain.setValueAtTime(config.audio.volume[this.type], this.ctx.currentTime);    // Установка громкости.
            this.gainNode.gain.exponentialRampToValueAtTime(0.01, ct);                                  // Затухание громкости до определенного значения в установленный временной интервал.
            this.source.onended = null;                                                                 // Не нужно, чтобы при принужденной остановке проигрывания отрабатывал callback (например, запускался другой звук), поэтому вычищаем его.
            this.source.stop(ct);                                                                       // Остановка звука в установленную временную задержку.
            if(this.type.includes('Music')) mediaLibrary.playingMusic = null;
        }
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
        this.soundClassifier();
        this.soundLoader(getNames(this.audioFiles));
        this.loadListener(getNames(this.videoElements));
    },



      //////////////////////////////////////////////////////////////////////////////////////////
     ///// Клаccификатор звуков по типам соответсвено тому, где они должны проигрываться. /////
    //////////////////////////////////////////////////////////////////////////////////////////
    soundClassifier(){
        // Сбор имен треков, которые могут воспроизводится в меню.
        for (const sName in config.audio.files) {
            for (const type in this.soundNamesInTypes) {
                if(config.audio.files[sName].type != type) continue;
                    this.soundNamesInTypes[type].push(sName); 
                }
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
                this.preloader.progress.children[2].textContent = errorClass == 'error' ? `Медленная сеть! Отложено: .../${fileName}` : `Что-то пошло не так с: .../${fileName} !`;
            }else{
                this.preloader.progress.children[2].textContent = `Буферизация: .../${fileName}`;
                this.preloader.progress.classList.remove('error');
            }
            return;
        }

        percent = Math.round(percent);
        this.preloader.progress.children[2].textContent = errorClass == 'fatal_error' ? `Некоторе файлы недоступны...` : percent == 100 ? `Готово!` : `Продолжаю загрузку...`;
        this.preloader.progress.children[0].textContent = percent + '%';
        this.preloader.progress.children[1].children[0].style.width = percent + '%';
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


      //////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция выбора звука для события, в котором участвует два объекта (например, столкновения) /////
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    getSoundName(models){
        for (const comboName in config.audio.comboByModels) {
            if(config.audio.comboByModels[comboName][0].includes(models[0]) && config.audio.comboByModels[comboName][1].includes(models[1])) return comboName;
            if(config.audio.comboByModels[comboName][0].includes(models[1]) && config.audio.comboByModels[comboName][1].includes(models[0])) return comboName;
        }
        return false;
    },



      /////////////////////////////
     ///// Медиаплеер звуков /////
    /////////////////////////////
    player(soundType, soundName, smooth = 0 , delay = 0, playCount = 0){
        // Если не передан тип звука, значит требуется остановить текущее воспроизведение (при переходах от меню к геймплею и обратно).
        if(!soundType){
            if(this.playingMusic) this.playingMusic.stop(smooth);
            return;
        }

        switch(soundType){
            case 'introMusic':
                this.sounds[this.soundNamesInTypes.introMusic[0]].play(smooth, delay, () => this.player('menuMusic', null, 2, 2, 1)); // После музыки интро музыка меню запускается один раз.
                break;
                
            case 'menuMusic':
            case 'gameMusic':
                const musicIndex = library.randomizer(0, this.soundNamesInTypes[soundType].length - 1);
                const args = playCount > 1                                                                          // Если установлено многократное проигрывание, т.е. больше, чем один раз.
                                    ? [smooth, delay, () => {this.player(soundType, null, --playCount, 0, 2,)}]         // тогда вызов плеера для последующей музыки происходит калбэком с явно указанной задержкой и декрементацией счетчика запусков.
                                    : [smooth, delay];
                this.sounds[this.soundNamesInTypes[soundType][musicIndex]].play(...args);
                break;

            case 'gameSound':
                if(this.sounds[soundName]){
                    this.sounds[soundName].play();
                }else{
                    //console.log('===> ' + soundName + ' - Звук не найден!');
                }
                break;
        }

    },



     soundLoopPlayer(soundName, play, obj){
        if(play){
            // Если для объекта еще не создана звуковая петля, она создается.
            if(!obj.soundLoops[soundName]){
                if(!this.sounds[soundName]) return;
                obj.soundLoops[soundName] = new this.Sound(this.context, this.sounds[soundName].buffer, 'gameSound', true); 
            }
            obj.soundLoops[soundName].play(0.1);
        }else{
            if(!obj.soundLoops[soundName]) return;
            obj.soundLoops[soundName].stop(0.1);
        }
    },



      /////////////////////////////////////////////////////////////////
     ///// Отображение кнопки для активации медиа и запуска меню /////
    /////////////////////////////////////////////////////////////////
    showStartButton(){
        if(this.loadedItems < this.totalItems) return;
        const button = () => {
            this.preloader.progress.classList.add('inactive');
            this.preloader.ready.classList.remove('inactive');
            this.preloader.ready.children[1].addEventListener('click', (e) => {
                menu.init();
            }, {once: true})
        }
        try {
            mediaLibrary.sounds.alienInvasionAlt.play();
            setTimeout(() => {
                if(mediaLibrary.playingMusic.ctx.currentTime){
                    menu.init();
                }else{
                    button();
                }
				mediaLibrary.playingMusic.stop();
			}, 100);
        } catch (error) {
            console.warn('Звук alienInvasionAlt не найден!');
            button();
        }
    }

}


mediaLibrary.init();
