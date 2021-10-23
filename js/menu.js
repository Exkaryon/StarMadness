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

      //////////////////////////////
     ///// DOM-элементы меню  /////
    //////////////////////////////
    elements: {
        intro: {           // Вступительная демка
            basis: document.querySelector('#intro'),
        },

        main: {            // Главное меню
            basis: document.querySelector('#mainmenu'),
            items: document.querySelectorAll('#mainmenu .items > div'),
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
        commonOptions: `<div class="options">{{ options }}</div>`,
        playersOptions: `
            <div class="options" data-playernum="{{ num }}" data-active="{{ active }}">
                <div class="title">Капитан {{ num }}</div>
                <div>
                    <label class="inputtext">
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
            </div>
        `,
        hangar: `
            <div class="fleet">&nbsp;</div>
            <div class="ships">{{ ships }}</div>
            <button>Готово</button>
        `,
        shipsBox: `
            <div data-mod="{{ boatMod }}">
                <div>{{ boatPic }}</div>
                <div>
                    {{ boatChars }} 
                </div>
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
            menu.elements.hangar.basis.insertAdjacentHTML('beforeend', menu.hangarGenerator());
            menu.elements.hangar.fleet = document.querySelector('#hangar .fleet');
            menu.elements.hangar.ships = document.querySelector('#hangar .ships');
            menu.elements.hangar.button = document.querySelector('#hangar button');
            menu.elements.hangar.button.addEventListener('click', () => {    // Закрытие модального слоя "ангара" с последующим обновлением состояния конфига для выбранного игрока и набора модов в лобби. (Данный "слушатель" был извлечен из метода shipsSelector, поскольку там он назначался на кнопку с каждым вызовом этого метода, что приводило к суммированию этих слушателей на кнопке и последующему многократному вызову апдейта.)
                menu.elements.hangar.basis.classList.add('trans_out');
                setTimeout(() => {
                    menu.elements.hangar.basis.classList.add('inactive');
                    menu.elements.hangar.basis.classList.remove('trans_out');
                }, 500);
                menu.update('players', menu.playerChoice.hangar.player, 'shipsSelector', Array.from(menu.elements.hangar.fleet.children));
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
        this.show('main');

        // Подготовка Локального лобби.
        this.initializers.local();

        // Подготовка ангара.
        this.initializers.hangar();

        // Обработчик селекторов.
        this.selectorsHandler();

        // Установка флага, указывающем о том, что меню инициализировано.
        this.ready = true;
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
            shipsHTML += this.templates.shipsBox
                .replace(/{{ boatMod }}/, config.shipMods[key].model)
                .replace(/{{ boatPic }}/, config.textures[key] ? config.textures[key].pic.outerHTML : '!!!')
                .replace(/{{ boatChars }}/, function(){
                    return `
                        <div><div>Название судна:</div><div>${config.shipMods[key].model}</div></div>
                        <div><div>Масса:</div><div>${config.shipMods[key].paramsConst.weight}</div></div>
                        <div><div>Макс. скорость:</div><div>${config.shipMods[key].paramsConst.topSpeed}</div></div>
                        <div><div>Прочность:</div><div>${config.shipMods[key].paramsConst.durability}</div></div>
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
        this.elements.hangar.basis.classList.remove('inactive');
        this.elements.hangar.basis.classList.add('trans_in');
        setTimeout(() => {this.elements.hangar.basis.classList.remove('trans_in')}, 500);
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
    show: function(name, type){
        for (const key in this.elements){
            key == name 
                ? async function(){
                        menu.elements[key].basis.classList.add('trans_in');
                        menu.elements[key].basis.classList.remove('inactive');
                        await new Promise((resolve, reject) => setTimeout(resolve, 500));
                        menu.elements[key].basis.classList.remove('trans_in');
                    }()
                : async function(){
                        menu.elements[key].basis.classList.add('trans_out');
                        await new Promise((resolve, reject) => setTimeout(resolve, 500));
                        menu.elements[key].basis.classList.add('inactive');
                        menu.elements[key].basis.classList.remove('trans_out');
                    }();
        }
    },



      ///////////////////////////
     ///// Запуск геймплея /////
    ///////////////////////////
    gameplay: function(){
        menu.show('gamescreen');
        universe.init();
        dashboard.init();
    }
}


!menu.ready ? menu.init() : menu.show();