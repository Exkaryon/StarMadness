"use strict";

const menu = {  
    ready: false,                       // Флаг, указывающий, инициализированы ли раннее элементы меню.
    musicNames: [],
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

        online: {          // Меню сетевой игры
            basis: document.querySelector('#online'),
        },

        settings: {        // Меню мультиплеера (лобби)
            basis: document.querySelector('#settings'),
        },

        hangar: {          // Ангар (модальный слой выбора кораблей для local- и online-меню)
            basis: document.querySelector('#hangar'),
            fleet: {},
            ships: {},
            button:{},
        },
        gamescreen: {
            basis: document.getElementById('gamescreen'),
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
        `
    },



      //////////////////////////////////////////////////////////////
     ///// Методы, инициализирующие функционал элементов меню /////
    //////////////////////////////////////////////////////////////
    initializers: {
        main: function(){
            menu.elements.main.items.forEach(elem => {
                elem.addEventListener('click', () => {
                    switch(elem.dataset.item){
                        case 'multiplayer':
                            menu.show('local');
                            break;
                        case 'online':
                            menu.show('online');
                            break;
                        case 'settings':
                            menu.show('settings');
                            break;
                        case 'exit':
                            window.close();
                            break;
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
            }),
            // Обработчик выбора флота по клику на ячейки флота игрока.
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
        // Генерация набора кораблей для игроков по умолчанию.
        this.fleetGenerator();

        // Подготовка главного меню.
        this.initializers.main();

        // Подготовка Локального лобби.
        this.initializers.local();

        // Подготовка ангара.
        this.initializers.hangar.call(this);

        // Обработчик селекторов.
        this.selectorsHandler();

        // Установка флага, указывающем о том, что меню инициализировано.
        this.ready = true;

        // Сбор имен треков, которые могут воспроизводится в меню.
        for (const sName in config.audio.files) {
            if(config.audio.files[sName].type != 'menuMusic') continue;
            this.musicNames.push(sName); 
        }

        // Запуск заставки
        //menu.intro();
    },


    intro: function(){
        this.show('intro', 1000, () => {
            // Стилистические эффекты для интро.
            this.elements.intro.basis.children[0].style.animation = 'introzoom 5s ease-out forwards';
            this.elements.intro.basis.children[0].children[1].style.animation = 'blink 5s ease forwards';
            // Запуск музыки intro.
            mediaLibrary.sounds.alienInvasion.play(1);
            // Переход в меню.
            setTimeout(() => {
                this.show('main', 2000);
                mediaLibrary.videoElements.serenity.element.play();
            }, 6000);
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



      ////////////////////////////////////////////////////
     ///// Функция обновления конфига и опций сетов /////
    ////////////////////////////////////////////////////
    update: function(setName, num, optionName, value){
        console.log(setName, num, optionName, value);
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
                        console.log(num-1 , value)
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
                            });
                        }else{
                            menu.elements.local.playersFleets[num-1].classList.add('selective');
                        }
                        break;
                    case 'shipsSelector':        // Обновление конфига и опций флота пользователя в лобби.
                        value.forEach((cell, k) => {
                            config.gameSettings.players[num-1].shipMods[k] = cell.dataset.mod;
                        });
                        Array.from(menu.elements.local.playersFleets[num-1].children).forEach((elem, k) => {
                            elem.dataset.mod = config.gameSettings.players[num-1].shipMods[k];
                        });
                        console.log('Config updated!');
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
                if(config.bulletMods[pC[wType][0]].paramsConst.energyСharge){
                    return Math.round(config.bulletMods[pC[wType][0]].paramsConst.energyСharge / 1000 * 100);
                }else{
                    return Math.round(config.bulletMods[pC[wType][0]].paramsConst.weight * config.bulletMods[pC[wType][0]].paramsConst.speed[0] / 10);
                }
            };
            const chars = {
                tSpd: Math.round(pC.topSpeed / 10 * 100),
                mass: Math.round(pC.weight / 1000 * 100),
                drbt: Math.round(pC.durability / 10 * 100),
                dWpn: calcScale(pC, 'weapon'),
                sWpn: calcScale(pC, 'superWeapon'),
            }
            shipsHTML += this.templates.shipsBox
                .replace(/{{ boatMod }}/g, config.shipMods[key].model)
                .replace(/{{ boatPic }}/, config.textures[key] ? config.textures[key].pic.outerHTML : '!!!')
                .replace(/{{ boatChars }}/, function(){
                    return `
                        <div><div>Скорость:</div><div class="bar"><div style="width:${chars.tSpd}%">&nbsp;</div><span>${pC.topSpeed} км/с</span></div></div>
                        <div><div>Масса:</div><div class="bar"><div style="width:${chars.mass}%">&nbsp;</div><span>${pC.weight} тонн</span></div></div>
                        <div><div>Прочность:</div><div class="bar"><div style="width:${chars.drbt}%">&nbsp;</div><span>${pC.durability} ед.</span></div></div>
                        <div><div>Осн.оружие:</div><div class="bar"><div style="width:${chars.dWpn}%">&nbsp;</div><span>${pC.weapon[0]}</div></div>
                        <div><div>Суп.оружие:</div><div class="bar"><div style="width:${chars.sWpn}%">&nbsp;</div><span>${pC.superWeapon[0]}</span></div></div>
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
        });
        // Установка обработчика для блоков с модификациями кораблей, который записывает в атрибут активной ячейки флота выбранный мод.
        for(let mod of Array.from(this.elements.hangar.ships.children)){
            mod.addEventListener('click', (e) => {
                menu.elements.hangar.fleet.children[menu.playerChoice.hangar.shipCell].dataset.mod = e.target.closest('[data-mod]').dataset.mod;
            });
        }
    },


      ////////////////////////////////////////////////////////////
     ///// Метод скрытия и показа элементов (разделов) меню /////
    ////////////////////////////////////////////////////////////
    show: function(blockName, fadeSpeed = 500, callback){
        for (const key in this.elements){
            if(key != blockName && !menu.elements[key].basis.classList.contains('inactive')){              // Поиск активного блока, т.е., который показывается, но не являющийся блоком назначения.
                this.previousElementName = key;                                                            // Установка имени блока, который закрывается.
                this.elements[key].basis.style = `animation: trans_out ${fadeSpeed / 1000}s ease forwards`;
                setTimeout(() => {
                    this.elements[key].basis.classList.add('inactive');
                    this.elements[key].basis.style = `animation: none`;
                    this.elements[blockName].basis.style = `animation: trans_in ${fadeSpeed / 1000}s ease forwards`;
                    this.elements[blockName].basis.classList.remove('inactive');
                    if(callback) callback();
                    setTimeout(() => {
                        this.elements[blockName].style = `animation: none`;
                    }, fadeSpeed);
                }, fadeSpeed);
            }
        }
    },


// Выяснить че за тормоза в хроме появились только для текущей версии.
// Начать привязывать звуки к событиям, а также закончить механизм переключения музыки между геймплеем и меню.

      ///////////////////////////
     ///// Запуск геймплея /////
    ///////////////////////////
    gameplay: function(){
        menu.show('gamescreen', 1000, () => {
            universe.init();
            dashboard.init();
        });

    }
}


