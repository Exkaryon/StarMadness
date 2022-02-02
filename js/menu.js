"use strict";

const menu = {  
    ready: false,                       // Флаг, указывающий, инициализированы ли раннее элементы меню.
    shipMods: function() {              // Массив имен всех модификаций кораблей имеющийся в конфиге.
        let mods = [];
        for (const key in config.shipMods) {
            mods.push(key);
        }
        return mods;
    }(),
    playerChoice: {                     // Переменные выбора игрока.
        hangar: {
            player: 0,
            shipCell: 0,
        }
    },
    controlChoice: null,
    previousElementName: '',            // Имя предыдущего активного элемента (из которого пользователь пришел в текущий). Это свойство используется для возврата в лобби из hangar и gamescreen.



      //////////////////////////////
     ///// DOM-элементы меню  /////
    //////////////////////////////
    elements: {
        preloader:{
            basis: document.querySelector('#preloader'),
        },

        intro: {           // Вступительная демка
            basis: document.querySelector('#intro'),
        },

        main: {            // Главное меню
            basis: document.querySelector('#mainmenu'),
            items: document.querySelectorAll('#mainmenu .items > div'),
            video: document.querySelectorAll('#mainmenu video'),
        },

        local: {          // Лобби мультиплеера
            basis: document.querySelector('#local'),
            sets: {
                common: document.querySelector('[data-setname="common"]'),
                players: document.querySelector('[data-setname="players"]'),
            },
            playersFleets: [],
            buttons: {
                tomenu: document.querySelector('#local .tomenu'),
                tospace: document.querySelector('#local .tospace') 
            }
        },

        online: {          // Раздел сетевой игры
            basis: document.querySelector('#online'),
            sets: {
                new: document.querySelector('[data-setname="new"]'),
                available: document.querySelector('[data-setname="available"]'),
            },
            buttons: {
                tomenu: document.querySelector('#online .tomenu'),
            }
        },

        settings: {        // Раздел настроек
            basis: document.querySelector('#settings'),
            sets: {
                media: document.querySelector('[data-setname="media"]'),
                control: document.querySelector('[data-setname="control"]'),
            },
            buttons: {
                tomenu: document.querySelector('#settings .tomenu'),
            }
        },

        hangar: {          // Ангар (модальный слой выбора кораблей для local- и online-меню)
            basis: document.querySelector('#hangar'),
            fleet: {},
            ships: {},
            button:{},
        },
        gamescreen: {
            basis: document.querySelector('#gamescreen'),
            canvas: document.querySelector('#gamescreen canvas'),
        }
    },


      ////////////////////////////////////////////////////////////
     ///// Шаблоны динамически генерируемых элементов опций /////
    ////////////////////////////////////////////////////////////
    templates: {
        selectors: `
            <div class="option selector">
                <div>{{ message }}</div>
                <div>
                    <div data-select="{{ name }}">
                        {{ props }}
                    </div>
                </div>
            </div>
        `,
        commonOptions: `
            <div class="options itembox">
                <div class="title">Геймплей</div>
                {{ options }}
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>`,
        newServerOptions: `
            <div class="options itembox">
                <div class="title">Новый сервер</div>
                <div class="option servername">
                <label>
                    <div>Имя сервера:</div>
                    <div>
                        <input type="text" name="playername" value="server_name">
                        <div></div>
                    </div>
                </label>
            </div>
                {{ options }}
                <div class="buttons"><button class="mini">Создать</button></div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>`,
        availableServers: `
            <div class="options itembox">
                <div class="title">Доступные серверы</div>
                <div class="option list">
                    <table>
                        <tr class="ttl"><td>Имя</td><td>Игроков</td><td>Геймплей/Лобби</td><td>Задержка</td><td>ip</td></tr>
                        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                    </table>
                </div>
                <div class="buttons"><button class="mini">Подключиться</button></div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
        playersOptions: `
            <div class="options itembox" data-playernum="{{ num }}" data-active="{{ active }}">
                <div class="title">Игрок {{ num }}</div>
                <div class="capname">
                    <label>
                        <div>Имя:</div>
                        <div>
                            <input type="text" name="playername" value="{{ captain }}">
                            <div></div>
                        </div>
                    </label>
                </div>
                {{ options }}
                <div class="ships">
                    {{ ships }}
                </div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
        hangar: `
            <div class="fleet">&nbsp;</div>
            <div class="ships">{{ ships }}</div>
            <div class="buttons"><button>Готово</button></div>
        `,
        shipsBox: `
            <div data-mod="{{ boatMod }}" class="mod itembox">
                <div class="title">{{ boatMod }}</div>
                <div class="pic">{{ boatPic }}</div>
                <div class="chars">
                    {{ boatChars }} 
                </div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
        soundRanges: `
            <div class="options itembox">
                <div class="title">Звук</div>
                <div class="option selector">
                    <label for="menuMusic">Музыка меню</label>
                    <input type="range" id="menuMusic" name="vol" min="0" max="1" value="${config.audio.volume.menuMusic}" step="0.1">
                </div>
                <div class="option selector">
                    <label for="gameMusic">Музыка в игре</label>
                    <input type="range" id="gameMusic" name="vol" min="0" max="1" value="${config.audio.volume.gameMusic}" step="0.1">
                </div>
                <div class="option selector">
                    <label for="gameSound">Эффекты</label>
                    <input type="range" id="gameSound" name="vol" min="0" max="1" value="${config.audio.volume.gameSound}" step="0.1">
                </div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
        fullScreenOption: `
            <div class="options itembox">
                <div class="title">Общее</div>
                <div class="option fullscreen">
                    Полноэкран. режим
                    <button class="mini" data-fullscreen="0"></button>
                </div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
        controlTable: `
            <div class="options itembox">
                <div class="title">Управление</div>
                <div class="option list">
                    {{ ctrlTable }}
                </div>
                <div class="option notice">Нажмите на наименование клавиши, чтобы изменить её.</div>
                <div class="angles_top"></div>
                <div class="angles_bot"></div>
            </div>
        `,
    },



      //////////////////////////////////////////////////////////////
     ///// Методы, инициализирующие функционал элементов меню /////
    //////////////////////////////////////////////////////////////
    initializers: {
        main: function(){
            menu.elements.main.items.forEach(elem => {
                elem.addEventListener('click', () => {
                    switch(elem.dataset.item){
                        case 'multiplayer': menu.show('local');     break;
                        case 'online':      menu.show('online');    break;
                        case 'settings':    menu.show('settings');  break;
                        case 'exit':        menu.closeApp();        break;
                    }
                });
            });
        },
        local: function(){
            // Кнопки.
            menu.elements.local.buttons.tomenu.addEventListener('click', () => {menu.show('main');});
            menu.elements.local.buttons.tospace.addEventListener('click', () => {menu.gameplay();});
            // Генерация набора элементов общих настроек игры.
            menu.elements.local.sets.common.insertAdjacentHTML('beforeend', menu.templates.commonOptions.replace(/{{ options }}/, menu.selectorsGenerator(config.lobbySets.commonOptions)));
            // Формирование набора блоков опций для игроков.
            menu.elements.local.sets.players.insertAdjacentHTML('beforeend', menu.playersSetGenerator());
            // Обработчик смены имени для игрока.
            menu.elements.local.sets.players.querySelectorAll('input[name="playername"]').forEach(input => {
                input.addEventListener('blur', function(e){
                    menu.update('players', e.target.closest('[data-playernum]').dataset.playernum, 'captainName', input.value);
                });
            });
        },
        online: function(){
            // Кнопки.
            menu.elements.online.buttons.tomenu.addEventListener('click', () => {menu.show('main');});
            // Генерация набора элементов общих настроек игры.
            menu.elements.online.sets.new.insertAdjacentHTML('beforeend', menu.templates.newServerOptions.replace(/{{ options }}/, menu.selectorsGenerator(config.lobbySets.commonOptions)));
            menu.elements.online.sets.available.insertAdjacentHTML('beforeend', menu.templates.availableServers);
        },
        settings: function(){
            // Кнопки.
            menu.elements.settings.buttons.tomenu.addEventListener('click', () => {menu.show('main');});
            // Генерация набора для регулировок медиапараметров игры.
            menu.elements.settings.sets.media.insertAdjacentHTML('beforeend', menu.templates.soundRanges);
            menu.elements.settings.sets.media.insertAdjacentHTML('beforeend', menu.templates.fullScreenOption);
            // Обработчики ползунков.
            menu.elements.settings.sets.ranges = document.querySelectorAll('[type="range"]');
            menu.elements.settings.sets.ranges.forEach(range => {
                range.addEventListener('input', (e) => {
                    config.audio.volume[e.target.id] = e.target.value;
                    if(mediaLibrary.playingMusic){                      // Изменение громкости текущей проигрываемой музыки.
                        if(mediaLibrary.playingMusic.type == e.target.id || (mediaLibrary.playingMusic.type == 'introMusic' && e.target.id == 'menuMusic')){
                            mediaLibrary.playingMusic.gainNode.gain.value = e.target.value;
                            mediaLibrary.playingMusic.gainNode.gain.setValueAtTime(e.target.value, mediaLibrary.playingMusic.ctx.currentTime);
                        }
                    }
                });
            });
            // Кнопка полноэкранного режима.
            menu.elements.settings.buttons.fullscreen = document.querySelector('#settings .fullscreen button');
            // Таблица клавиш управления.
            menu.elements.settings.sets.control.insertAdjacentHTML('beforeend', menu.templates.controlTable.replace(/{{ ctrlTable }}/, menu.controlTableGenerator(config.gameSettings.players)));
        },
        hangar: function(){
            // Формирование ангара (модального слоя выбора кораблей).
            this.elements.hangar.basis.insertAdjacentHTML('beforeend', menu.hangarGenerator());
            this.elements.hangar.fleet = document.querySelector('#hangar .fleet');
            this.elements.hangar.ships = document.querySelector('#hangar .ships');
            this.elements.hangar.button = document.querySelector('#hangar button');
            this.elements.hangar.button.addEventListener('click', () => {    // Закрытие модального слоя "ангара" с последующим обновлением состояния конфига для выбранного игрока и набора модов в лобби. (Данный "слушатель" был извлечен из метода shipsSelector, поскольку там он назначался на кнопку с каждым вызовом этого метода, что приводило к суммированию этих слушателей на кнопке и последующему многократному вызову апдейта.)
                this.show(this.previousElementName);
                this.update('players', this.playerChoice.hangar.player, 'shipsSelector', Array.from(this.elements.hangar.fleet.children));
            });
        }
    },


      ////////////////////////////////////////////////////////////////////////
     ///// Инициализация меню (комплект инициализаторов всех элементов) /////
    ////////////////////////////////////////////////////////////////////////
    init: function(){
        this.fleetGenerator();                  // Генерация набора кораблей для игроков по умолчанию.
        this.initializers.main();               // Подготовка главного меню.
        this.initializers.local();              // Подготовка Локального лобби.
        this.initializers.online();             // Подготовка Online раздела.
        this.initializers.settings();           // Подготовка раздела настроек игры.
        this.initializers.hangar.call(this);    // Подготовка ангара.
        this.selectorsHandler();                // Обработчик селекторов.
        this.fleetSelectorHandler();
        this.controlKeysHandler();              // Обработчик выбора кнопок управления раздела settings.
        this.fullscreenController();            // Контроллер полноэкранного режима.
        this.ready = true;                      // Установка флага, указывающем о том, что меню инициализировано.
        this.intro();                           // Запуск заставки
    },



      /////////////////
     ///// Интро /////
    /////////////////
    intro: function(){
        this.show('intro', 1000, () => { // dev - 10
            // Стилистические эффекты для интро.
            this.elements.intro.basis.children[0].style.animation = 'introzoom 5s ease-out forwards';
            this.elements.intro.basis.children[0].children[1].style.animation = 'blink 5s ease forwards';
            // Запуск вступительной музыки с передачей калбэка для старта стандартной музыки меню после окончания вступительной.
            mediaLibrary.player('introMusic');
            // Переход в меню.
            setTimeout(() => {
                this.show('main', 2000); //dev - 0
                mediaLibrary.videoElements.serenity.element.play();
                mediaLibrary.videoElements.serenity.element.addEventListener('ended', () => {
                    mediaLibrary.videoElements.serenity.element.classList.add('inctv');
                }, {once: true})
            }, 6000); // dev - 10
        });
    },



      ////////////////////////////////////////////////
     ///// Генератор случайного набора кораблей /////
    ////////////////////////////////////////////////
    fleetGenerator:function(playerNum){
        if(playerNum){                                                                   // Если передан номер игрока (не номер ключа).
            config.gameSettings.players[playerNum-1].shipMods.forEach((mod, key) => {
                config.gameSettings.players[playerNum-1].shipMods[key] = this.shipMods[Math.floor(Math.random() * this.shipMods.length)];
            });
        }else{                                                                           // В противном случае, набор генерируется для всех игроков.
            config.gameSettings.players.forEach((player, key) => {
                if(player.shipMods.length > config.gameSettings.gameplay.ships){
                    player.shipMods.length = config.gameSettings.gameplay.ships;         // Коррекция длины набора соответсвенно установленному значению кол-ва кораблей.
                }
                for(let i = 0; i < config.gameSettings.gameplay.ships; i++){
                    player.shipMods[i] = player.shipMods[i] ? player.shipMods[i] : this.shipMods[Math.floor(Math.random() * this.shipMods.length)];
                }
            });
        }
    },



      /////////////////////////////////////////////////////
     ///// Генерация набора опций для каждого игрока /////
    /////////////////////////////////////////////////////
    playersSetGenerator: function(){
        let setHTML = '';
        config.gameSettings.players.forEach((player, key) => {
            setHTML += menu.templates.playersOptions
                .replace(/{{ options }}/, function(){                                                       // Вставка комплекта селекторов с предварительным выявлением дефолтных значений.
                        for (const name in config.lobbySets.playersOptions) {
                            config.lobbySets.playersOptions[name].default = config.gameSettings.players[key][name] ? config.gameSettings.players[key][name] : config.lobbySets.playersOptions[name].values[0];
                        }
                        return menu.selectorsGenerator(config.lobbySets.playersOptions)
                    })
                .replace(/{{ num }}/g, key+1)                                                                       // Вставка номера игрока.
                .replace(/{{ captain }}/g,  config.gameSettings.players[key].captain)                               // Вставка дефолтного имени игрока.
                .replace(/{{ active }}/, (config.gameSettings.gameplay.players >= key + 1) ? 'active' : 'inactive') // Вставка маркера активности для блока игрока.
                .replace(/{{ ships }}/, function(){                                                                 // Вставка набора кораблей с предварительным маркерованием модификации и активности каждого блока с судном.
                        let shipsList = '';
                        config.lobbySets.commonOptions.ships.values.forEach((val, k) => {
                            shipsList += '<div data-active="'+((config.gameSettings.gameplay.ships < val) ? 'inactive' : 'active')+'" data-mod="'+(player.shipMods[k] ? player.shipMods[k] : '')+'">&nbsp;</div>';
                        });
                        return shipsList;
                    });
        });
        return setHTML;
    },



      /////////////////////////////////
     ///// Обработчик селекторов /////
    /////////////////////////////////
    selectorsHandler: function(){
        document.querySelectorAll('.selector [data-select]').forEach(elem => {
            document.addEventListener('click', (e) => {
                if(e.target.closest('.selector [data-select]') ==  elem){
                    if(elem.classList.value.includes('active')){
                        elem.classList.remove('active');
                        if(e.target.dataset.val != undefined){
                            elem.querySelector('div.selected').classList.remove('selected');
                            e.target.classList.add('selected');
                            this.update(
                                    elem.closest('.sets').dataset.setname,                                                         // Имя сета
                                    elem.closest('[data-playernum]') ? +elem.closest('[data-playernum]').dataset.playernum : 0,    // Элемент сета
                                    elem.dataset.select,                                                                           // Имя опции
                                    e.target.dataset.val                                                                           // Значение опции
                                );
                        }
                    }else{
                        elem.classList.add('active');
                    }
                }else{
                    elem.classList.remove('active');
                }
            });
        });
    },



      ////////////////////////////////////////////////////////////////////
     ///// Обработчик выбора флота по клику на ячейки флота игрока. /////
    ////////////////////////////////////////////////////////////////////
    fleetSelectorHandler: function(){
        Array.from(menu.elements.local.sets.players.children).forEach((elem, k) => { 
            menu.elements.local.playersFleets[k] = elem.querySelector('.ships');
            elem.querySelectorAll('.ships > div').forEach(cell => {
                cell.addEventListener('click', function(e){
                    if(e.target.dataset.active == 'active' && e.target.closest('.ships').classList.value.includes('selective')){
                        menu.playerChoice.hangar.player = e.target.closest('[data-playernum]').dataset.playernum;
                        menu.playerChoice.hangar.shipCell = function(){
                            let cellNum;
                            Array.from(e.target.closest('.ships').children).forEach((el, k) => {
                                if(e.target == el) cellNum = k;
                            });
                            return cellNum;
                        }();
                        menu.shipsSelector();
                    }
                });
            });
        });
    },



      //////////////////////////////////////////////////////////////////
     ///// Обработчик выбора кнопок управления в разделе settings /////
    //////////////////////////////////////////////////////////////////
    controlKeysHandler: function(){
        document.addEventListener('click', (e) => {
            if(menu.controlChoice && e.target != menu.controlChoice){
                menu.controlChoice.classList.remove('active');
                menu.controlChoice = null;
            }
            if(e.target.closest('#settings table')){
                if(e.target.hasAttribute("data-actionName")){
                    if(e.target == menu.controlChoice){
                        e.target.classList.remove('active');
                        menu.controlChoice = null;
                    }else{
                        e.target.classList.add('active');
                        menu.controlChoice = e.target;
                        document.addEventListener('keyup', (e) => {
                            config.gameSettings.players[menu.controlChoice.dataset.playernum].controls[menu.controlChoice.dataset.actionname][0] = e.code;
                            menu.controlChoice.textContent = e.code;
                            menu.controlChoice.classList.remove('active');
                            menu.controlChoice = null;
                        }, {once: true});
                    }
                }
            }
        });
    },



      ////////////////////////////////////////////////////
     ///// Функция обновления конфига и опций сетов /////
    ////////////////////////////////////////////////////
    update: function(setName, num, optionName, value){
        switch(setName){
            case 'common':
                switch(optionName){
                    case 'players':                                                                             // Обновление конфига и отображения в лобби кол-ва игроков.
                        config.gameSettings.gameplay.players = +value;
                        config.gameSettings.players.forEach((player, key) => {
                            player.active = (value > key) ? true : false;
                            menu.elements.local.sets.players.children[key].dataset.active =  (value > key) ?  'active' : 'inactive';
                        });
                        break;
                    case 'ships':
                        config.gameSettings.gameplay.ships = +value;
                        this.fleetGenerator();                                                                  // Регенерация, флота соответственно измененным значениям конфига.
                        config.gameSettings.players.forEach((player, key) => {                                  // Проход по игрокам и изменения параметров флота для каждого из них соответсвенно установленным значениям.
                            Array.from(menu.elements.local.playersFleets[key].children).forEach((elem, k) => {
                                elem.dataset.active = (k < value) ? 'active' : 'inactive';
                                elem.dataset.mod    = (k < value) ? player.shipMods[k] : '';
                                if(elem.parentElement.classList.contains('selective')){
                                    elem.style.backgroundImage = (k < value) ? 'url('+config.textures[elem.dataset.mod].pic.src+')' : 'none';
                                }
                            });

                        });
                        break;
                    case 'boundaryBehavior':
                        config.gameSettings.gameplay.boundaryBehavior = value; 
                        break;
                }
                break;
            case 'players':
                switch(optionName){
                    case 'captainName':
                        config.gameSettings.players[num-1].captain = value;
                        break;
                    case 'driverType':            // Установка в конфиг способа управления игроком (человек/AI).
                        config.gameSettings.players[num-1].driverType = value;
                        break;
                    case 'fleetSelector':         // Обновление способа выбора флота (случайно/выборочно).
                        if(value != 'selective'){
                            this.fleetGenerator(num);
                            document.querySelector('[data-playernum="'+ num +'"] .ships').classList.remove('selective');
                            document.querySelectorAll('[data-playernum="'+ num +'"] .ships > div').forEach((elem, k) => {
                                elem.dataset.mod = config.gameSettings.players[num-1].shipMods[k];
                                elem.style.backgroundImage = 'none';
                            });
                        }else{
                            menu.elements.local.playersFleets[num-1].classList.add('selective');
                            Array.from(menu.elements.local.playersFleets[num-1].children).forEach((elem, k) => {
                                elem.style.backgroundImage = elem.dataset.mod != 'undefined' && elem.dataset.mod ? 'url('+config.textures[elem.dataset.mod].pic.src+')' : 'none';
                            });
                        }
                        break;
                    case 'shipsSelector':        // Обновление конфига и опций флота пользователя в лобби.
                        value.forEach((cell, k) => {
                            config.gameSettings.players[num-1].shipMods[k] = cell.dataset.mod;
                        });
                        Array.from(menu.elements.local.playersFleets[num-1].children).forEach((elem, k) => {
                            elem.dataset.mod = config.gameSettings.players[num-1].shipMods[k];
                            elem.style.backgroundImage = elem.dataset.mod != 'undefined' ? 'url('+config.textures[elem.dataset.mod].pic.src+')' : 'none';
                        });
                        break;
                }
                break;
        }
    },



      ///////////////////////////////////////////////////////////
     ///// Генерация селекторов для каждой отдельной опции /////
    ///////////////////////////////////////////////////////////
    selectorsGenerator:function(options){
        let selectorsHTML = '';
        for (const name in options) {
            selectorsHTML += this.templates.selectors
                .replace(/{{ message }}/, options[name].title)                  // Вставка наименования опции
                .replace(/{{ name }}/, name)                                    // Вставка идентификатора (имя) опции
                .replace(/{{ props }}/, function(){                             // Вставка набора селекторов с предварительным поиском и маркерованием дефолтных значений.
                    let html = '';
                    options[name].values.forEach((elem, k) => {
                        if(!options[name].default){                             // Если умолчание не было установлено в опциях лобби, то оно выявляется из опций конфига.
                            html += '<div data-val="'+elem+'"'+(elem == config.gameSettings.gameplay[name] ? ' class="selected"' : '')+'>'+(options[name].descr ? options[name].descr[k] : elem)+'</div>';
                        }else{                                                  
                            html += '<div data-val="'+elem+'"'+(elem == options[name].default ? ' class="selected"' : '')+'>'+(options[name].descr ? options[name].descr[k] : elem)+'</div>';
                        }
                    });
                    return html;
                });
        }
        return selectorsHTML;
    },



      //////////////////////////////////////////////////////////////////////////////////////////
     ///// Генерация содержимого модального слоя для выбора модификаций кораблей игроками /////
    //////////////////////////////////////////////////////////////////////////////////////////
    hangarGenerator: function(){
        let shipsHTML = '';
        for (const key in config.shipMods) {
            const pC = config.shipMods[key].paramsConst;
            // Функция расчета процента мощности оружия для шкалы.
            const calcScale = function(pC, wType){
                if(config.bulletMods[pC[wType]['mod']].paramsConst.energyСharge){
                    let multiplier = pC[wType]['machineGun'] ? pC[wType]['machineGun'][0] : 1;
                    multiplier = pC[wType]['muzzleDist'][1] ? 2 : multiplier;
                    return Math.round(config.bulletMods[pC[wType]['mod']].paramsConst.energyСharge * 100 / 1000) * multiplier;
                }else{
                    return Math.round(config.bulletMods[pC[wType]['mod']].paramsConst.weight * config.bulletMods[pC[wType]['mod']].paramsConst.speed / 10);
                }
            };
            const chars = {
                manv: Math.round(pC.topSpeed * pC.rotationSpeed / pC.weight * 100 + 10),    // Шкала безотносительная, а +10 - просто, чтобы у объектов с околонулевыми значениями хоть шкала от 0 чуть оторвалась. 
                tSpd: Math.round(pC.topSpeed * 100 / 10 ),                                  // 0 - 10 км/c
                mass: Math.round(pC.weight * 100 / 200),                                    // 0 - 200 тонн 
                drbt: Math.round(pC.durability * 100 / 10),                                 // 0 - 10 ед. 
                dWpn: calcScale(pC, 'weapon') * 2,                                          // 0 - 1000
                sWpn: calcScale(pC, 'superWeapon') * 2,
            }
            shipsHTML += this.templates.shipsBox
                .replace(/{{ boatMod }}/g, config.shipMods[key].model)
                .replace(/{{ boatPic }}/,  config.textures[key].pic.outerHTML)
                .replace(/{{ boatChars }}/, function(){
                    return `
                        <div><div>Манёврен.:</div><div class="bar"><div style="width:${chars.manv}%">&nbsp;</div><span>&nbsp;</span></div></div>
                        <div><div>Скорость:</div><div class="bar"><div style="width:${chars.tSpd}%">&nbsp;</div><span>${pC.topSpeed} км/c</span></div></div>
                        <div><div>Масса:</div><div class="bar"><div style="width:${chars.mass}%">&nbsp;</div><span>${pC.weight} тонн</span></div></div>
                        <div><div>Прочность:</div><div class="bar"><div style="width:${chars.drbt}%">&nbsp;</div><span>${pC.durability} ед.</span></div></div>
                        <div><div>Осн.оружие:</div><div class="bar"><div style="width:${chars.dWpn}%">&nbsp;</div><span>${pC.weapon.mod}</div></div>
                        <div><div>Суп.оружие:</div><div class="bar"><div style="width:${chars.sWpn}%">&nbsp;</div><span>${pC.superWeapon.mod}</span></div></div>
                    `;
                });
        }
        let hangarHTML = this.templates.hangar.replace(/{{ ships }}/, shipsHTML);
        return hangarHTML;
    },



      /////////////////////////////////////////////////////
     ///// Функция выбора кораблей для флота игрока. /////
    /////////////////////////////////////////////////////
    shipsSelector: function(){
        // Открытие модального слоя "ангара" с модификациями кораблей.
        this.show('hangar');
        // Формирование ячеек флота для модального слоя "ангара".
        let cells = '';
        config.gameSettings.players[this.playerChoice.hangar.player-1].shipMods.forEach((ship, k) => {
            cells += '<div data-mod="' + ship + '" ' + (k == this.playerChoice.hangar.shipCell ? 'class="focus"' : '') + '>&nbsp;</div>';
        });
        this.elements.hangar.fleet.innerHTML = cells;
        // Установка обработчика для каждой ячейки с флота, который устанавливает класс на выбранную ячейку и записывает ключ активной ячейки в специальное св-во this.playerChoice... 
        Array.from(this.elements.hangar.fleet.children).forEach((elem, k) => {
            elem.addEventListener('click', () => {
                if(this.elements.hangar.fleet.querySelector('.focus')){
                    this.elements.hangar.fleet.querySelector('.focus').classList.remove('focus');
                }
                elem.classList.add('focus');
                menu.playerChoice.hangar.shipCell = k;
            });
            elem.style.backgroundImage = `url(${config.textures[elem.dataset.mod].pic.src})`;
        });
        // Установка обработчика для блоков с модификациями кораблей, который записывает в атрибут активной ячейки флота выбранный мод.
        for(let mod of Array.from(this.elements.hangar.ships.children)){
            mod.addEventListener('click', (e) => {
                menu.elements.hangar.fleet.children[menu.playerChoice.hangar.shipCell].dataset.mod = e.target.closest('[data-mod]').dataset.mod;
                menu.elements.hangar.fleet.children[menu.playerChoice.hangar.shipCell].style.backgroundImage = `url(${config.textures[e.target.closest('[data-mod]').dataset.mod].pic.src})`;
            });
        }
    },


      ////////////////////////////////////////////////////////////
     ///// Метод скрытия и показа элементов (разделов) меню /////
    ////////////////////////////////////////////////////////////
    show: function(blockName, fadeSpeed = 500, callback){
        for (const key in this.elements){
            if(key != blockName && !menu.elements[key].basis.classList.contains('inactive')){               // Поиск активного блока, т.е., который показывается, но не являющийся блоком назначения.
                this.previousElementName = key;                                                             // Установка имени блока, который закрывается.
                this.elements[key].basis.style = `animation: trans_out ${fadeSpeed / 1000}s ease forwards`;
                setTimeout(() => {
                    this.elements[key].basis.classList.add('inactive');
                    this.elements[key].basis.removeAttribute('style');
                    this.elements[blockName].basis.style = `animation: trans_in ${fadeSpeed / 1000}s ease forwards`;
                    this.elements[blockName].basis.classList.remove('inactive');
                    if(callback) callback();
                    setTimeout(() => {
                        this.elements[blockName].basis.removeAttribute('style');                            // Свойство animation удаляется. Это также необходимо для chrome с отключенным аппартаным ускорением, поскольку оставшееся свойство (в частности для блока #gamescreen) провоцирует торможение в canvas и снижение FPS в анимации.
                    }, fadeSpeed);
                }, fadeSpeed);
            }
        }
    },



      ///////////////////////////
     ///// Запуск геймплея /////
    ///////////////////////////
    gameplay: function(){
        mediaLibrary.player(false, null, 1);
        this.gamescreenChoiser();
        menu.show('gamescreen', 1000, () => {
            universe.init();
            dashboard.init();
            mediaLibrary.player('gameMusic', null, 0, 0, 10);
        });
    },



    gamescreenChoiser(){
        const bgIndx = library.randomizer(0, config.gameSettings.gameplay.bgImages.length-1);
        this.elements.gamescreen.canvas.style.backgroundImage = 'url(images/'+config.gameSettings.gameplay.bgImages[bgIndx]+')';
    },



      ////////////////////////////////////////////
     ///// Контроллер полноэкранного режима /////
    ////////////////////////////////////////////
    fullscreenController: function(check, button){
        if(!check){                                                                                                         // Инициализация контроллера (первый запуск).
            window.addEventListener('resize', () => {this.fullscreenController(true);});
            this.elements.settings.buttons.fullscreen.addEventListener('click', (e) => {this.fullscreenController(true, e.target);});
            this.fsReturner = function(e){                                                                                  // Функция возврата в полноэкранный режим.
                document.documentElement.requestFullscreen({ navigationUI: "show" })
                    .then(() => {
                        config.gameSettings.gameplay.fullscreen = 1;
                        menu.elements.settings.buttons.fullscreen.dataset.fullscreen = 1;
                    })
                    .catch(err => {console.warn(`Произошла ошибка при попытке переключиться в полноэкранный режим: ${err.message} (${err.name})`); })
                if(e.code != config.gameSettings.gameplay.pauseKey) document.removeEventListener('keyup', menu.hndlr);      // Слушатель с клавиш удаляется, если fsReturner отработал на отличной от pauseKey клавише.
            };
            return;
        }
        if(!document.fullscreenElement){                                                                                    // Если случился выброс из полноэкранного режима.
            if(config.gameSettings.gameplay.fullscreen){
                config.gameSettings.gameplay.fullscreen = 0;
                this.elements.settings.buttons.fullscreen.dataset.fullscreen = 0;
                if(!menu.elements.gamescreen.basis.classList.contains('inactive')){                                         // Если это происходит во время геймплея, геймплей встает на паузу и назначаются слушатели для возврата в полноэкранный режим.
                    universe.pause({code: config.gameSettings.gameplay.pauseKey});
                    document.addEventListener('keyup', this.fsReturner);
                    if(document.querySelector('#gamescreen .pausebox')){
                        document.querySelectorAll('#gamescreen .pausebox button').forEach(el => {
                            el.addEventListener('click', this.fsReturner, {once: true});
                        });
                    }
                }
            }else{                                                                                                          // Если вне геймплея то возврат/вход в полноэкранный режим может быть осуществлен только по кнопке в разделе настроек.
                if(button){
                    config.gameSettings.gameplay.fullscreen = 1;
                    this.elements.settings.buttons.fullscreen.dataset.fullscreen = 1;
                    document.documentElement.requestFullscreen();
                }
            }
        }else{                                                                                                              // Выход из полноэкранного режима по кнопке в разделе настроек.
            if(button){
                config.gameSettings.gameplay.fullscreen = 0;
                this.elements.settings.buttons.fullscreen.dataset.fullscreen = 0;
                document.exitFullscreen();
            }
        }
    },


      ////////////////////////////////////////////////////
     ///// Генерация таблицы с клавишами управления /////
    ////////////////////////////////////////////////////
    controlTableGenerator: function(players){
        const ctrlNames = {
            engine: 'Ускорение',
            left: 'Поворот влево',
            right: 'Поворот вправо',
            shot: 'Оружие',
            supershot: 'Супер оружие',
        };
        let r = '';
        for (const cN in ctrlNames) {
            r += `<tr><td>${ctrlNames[cN]}</td>`;
            players.forEach((p, k) => {
                r += p.controls[cN] ? `<td data-playernum="${k}" data-actionname="${cN || ''}">${p.controls[cN][0] || '&nbsp;'}</td>` : `<td>&nbsp;</td>`;
            });
            r += `</tr>`;
        }
        return `<table><tr class="ttl"><td>Действие</td><td>Player 1</td><td>Player 2</td><td>Player 3</td><td>Player 4</td></tr>${r}</table>`;
    },



    closeApp: function(){
        window.close();
        setTimeout(() => {
            window.location.replace("https://exkaryon.ru/");
        }, 100);
    }

}


