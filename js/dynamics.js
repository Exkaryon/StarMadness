"use strict";


///////////////////////////////
///// Объект — Вселенная. /////
///////////////////////////////
const universe = {
    DOM_Elem: {
        wrapper: {},                // DOM-элемент обертки Вселенной 
        canvas: {}                  // DOM-элемент Вселенной (canvas) 
    },
    spaceSize: [0,0],               // Размеры Вселенной X,Y (игрового пространства canvas)
    spaceScale: 1,                  // Масштаб игрового пространства (canvas). Умолчание меняется если ширина окна меньше минимального порога определенногоо в universe.init(). Сделано для того, чтобы размеры игрового простанства были достаточными.
    timeFlow: false,                // Флаг, определяющий течение времени или его остановку (паузу).
    objects: [],                    // Ссылки на все объекты Вселенной.
    collidedPairsData: {},          // Стек пар столкнувшихся объектов в настоящем кванте (итерации) времени. Пара содержит идентификаторы объектов во Вселенной и счетчик продолжительности беспрерывного столкновения в квантах (итерациях) [id, id, count].
    winnerIndex: null,              // Индекс игрока победителя, записываемый в то время, когда остальные игроки слились.

    respawnTimeout: {               // Счетчик таймаутов возрождения для каждого игрока [задержка возраждения, индикация возраждения]. Флаг active указывает, осуществлять ли отслеживание и декриментацию счетчика.
        active: false,
        counters: [
            [0,0],
            [0,0],
            [0,0],
            [0,0],
        ]
    },

    timers: {                       // Счетчики для геймплея, которые нуждаются в поквантовом отсчете, но не возможностями таймаута языка, поскольку последнее может вызвать "наслоение" процессов.
        active: false,                  // Флаг указывается, проверять ли счетчики, чтобы не осуществлять эту операцию каждый раз.
        counters: {
            respawn: {                  // Таймаут возрождения
                quants: [0,0,0,0],          // Счетчик квантов отдельно для каждого из четырех пользователей.
                method: 'respawn',          // Ссылка на метод, который выполняется по истечению таймера.
            },
            winnerText: {               // Таймаут перед показом текста победителя
                quants: [0],
                method: 'showWinner',
                context: dashboard,
            }, 
            stopGameplay: {             // Таймаут перед остановкой геймплея
                quants: [0],
                method: 'stopGameplay',
            }, 
        }
    },

    quantCounter: 0,                    // Счетчик квантов (фреймов). Используется в рендере для анимации спрайтов.

    performance: {                      // Данные о производительности.
        frameTime: 0,                       // Время затраченное на обработку всех данных и отрисовку фрейма. Приемлемым значением считается: 1000 ms / 60 frames = 16.7ms, однако, требуется время на обработку браузером и других задач, поэтому максимально приемлемое время на обработку кода считается не более 10ms.
        maxFrameTime: 0,                    // Максимальное зарегистрированное время обработки фрейма.
        fps: 0,                             // Приблизительное значение кадров в секунду (время рендеринга браузером не учитывается).
        lagFrameCount: 0,                   // Счет подряд идущих кадров, которые не вписываются в установленный порог производительности по времени.
    },





      //////////////////////////////////////////////////////////////////////////////////////////////
     /////// Инициализация объекта Вселенной. По сути, это наш собственный Большой взрыв =) ///////
    //////////////////////////////////////////////////////////////////////////////////////////////
    init(){
        // Определить размеры обертки и назначить их размерами Вселенной.
        this.DOM_Elem.wrapper = document.getElementById('gamescreen');
        this.spaceScale = (this.DOM_Elem.wrapper.offsetWidth < 1440) ?  Math.round(this.DOM_Elem.wrapper.offsetWidth / 1440 * 1000 ) / 1000 : 1;
        this.spaceScale = (this.DOM_Elem.wrapper.offsetWidth > 1920) ?  Math.round(this.DOM_Elem.wrapper.offsetWidth / 1920 * 1000 ) / 1000 : this.spaceScale;
        this.spaceSize = [this.DOM_Elem.wrapper.offsetWidth / this.spaceScale, this.DOM_Elem.wrapper.offsetHeight / this.spaceScale];

        // Создание пользовательких объектов (космолетов) в игровом пространстве из коллекции (флота) пользователя.
        this.respawn();

        // Инициализация рендера.
        render.init();

        // Инициализация метода паузы геймплея.
        this.dPause = this.pause.bind(this);            // Декоратор для паузы для привязки контекста к функции.
        document.addEventListener('keyup', this.dPause);

        // Запуск времени Вселенной
        this.timeFlow = true;
        this.quantumSwitch();
    },



      //////////////////////////////////////////////////////////////////////////////////////
     /////// Кванты времени. Течение времени для всего, ведь время во Вселенной едино! ////         (!) Через данный метод проходят все параметры объектов, которые могут изменяться со временем (координаты, градусы поворота, скорость и т.д.).
    //////////////////////////////////////////////////////////////////////////////////////
    quantumSwitch(){
        if (this.timeFlow) {
            performance.mark('start');
            // Выполнение методов каждого из объектов Вселенной, у которых указан флаг выполнения (activeActions).
            this.objects.forEach((obj, key) => {
                if(obj.exist){                                  // Если объект актуален, выполняются его активные методы.
                    for(let method in obj.activeActions){
                        if(obj.activeActions[method]) obj[method]();
                    }
                    library.boundaryLaw(obj, config.gameSettings.gameplay.boundaryBehavior);    // Процедура взаимодействия объекта с границей игрового пространства (экрана).
                    this.spritesStateHandler(obj);                                              // Процедура отслеживания и изменения состояния спрайтов объектов.
                }else{                                          // В противном случае, слушатели событий объекта, объект и его слой удаляются, запускается процесс возраждения.
                    if(this.objects[key].playerIndex != undefined){                             // Операции только для объектов игроков (космолетов).
                        this.objects[key].destruction();                                        // Подготовка объекта к удалению из Вселенной.
                        this.gameplayRelevanceCheck(this.objects[key].playerIndex);             // Проверка геймплея на актуальность.
                    }
                    delete this.objects[key];
                    delete render.layers[key];
                }
            });
            // Обработка установленных таймеров.
            this.quantumTimer();
            // Добавление небесных тел в процессе геймплея через каждые n-квантов, включая нулевой квант.
            if(!(this.quantCounter % 1800)) this.celestialBodyCreator();
            // Детектирование столкновений объектов.
            this.collider();
            // Инкрементация времени Вселенной.
            this.quantCounter++;
            // Визуализация обновленных параметров всех объектов Вселенной за текущий квант.
            if(this.performance.frameTime < 9){                     // Если время предыдущего фрейма заняло более 9мс, но не более 15мс, рендеринг текущего фрейма пропускается, обеспечивая тем самым небольшое ускорение анимации. 
                render.rendering();
                if(this.performance.lagFrameCount > 0) this.performance.lagFrameCount -= 0.5;
            }else if (this.performance.frameTime > 15){             // Если время предыдущего фрейма более 15мс (то есть, совсем тормоза), рендеринг не пропускается, но инкрементируется счет, по достижению предела которого, в рендере выполнится удаление слоев для всех объектов.
                render.rendering();
                this.performance.lagFrameCount++;
            }
            // Переход к следующему кванту (итерации обработки параметров).
            requestAnimationFrame(this.quantumSwitch.bind(this));
            // Данные о производительности.
            performance.mark('end');
            performance.measure('time', 'start', 'end');
            this.performance.frameTime = performance.getEntriesByType('measure')[0].duration;
            this.performance.maxFrameTime = this.performance.maxFrameTime < this.performance.frameTime ? this.performance.frameTime : this.performance.maxFrameTime;
            if(!(this.quantCounter % 15)){
                this.performance.fps = 15 * 1000 / (performance.now() - this.performance.fspStartTime);
                this.performance.fspStartTime = performance.now();
            }
            performance.clearMarks();
            performance.clearMeasures();
        }
    },



      ////////////////////////////////////////////////////////////////////////
     /////// Метод остановки течения времени Вселенной (пауза геймплея) /////
    ////////////////////////////////////////////////////////////////////////
    pause(e){
        if(this.winnerIndex !== null) return;           // Нельзя поставить на паузу когда определен победитель и, соотв., когда выполняется dashboard.showWinner().
        if(e.code == config.gameSettings.gameplay.pauseKey){
            if(this.timeFlow){
                this.timeFlow = false;
                dashboard.showPauseBox(true);
            }else{
                dashboard.showPauseBox(false);
                this.timeFlow = true;
                this.quantumSwitch();
            }
        }
    },



      ////////////////////////////////////////////////////
     /////// Метод столкновений объектов Вселенной. /////
    ////////////////////////////////////////////////////
    collider(){
        let interactPairs = library.getInteractPairs(universe.objects);                         // Пересекающиеся окружности потенциального взаимодействия описанные вокруг каждого объекта.
        if(!interactPairs.length){
            this.collidedPairsData = {};
            return;
        }
        let collidedPairs = library.getCollidedPairs(interactPairs, universe.objects);          // Получение пар объектов, соприкоснувшиеся своими поверхностями.
        if(!collidedPairs.length) return;

        collidedPairs.forEach(pair => {                                                         // Запись текущих соприкоснувшихся пар в стек Вселенной, для которых будет произведен расчет рефлексии.
            const pairName = this.objects[pair[0]].id +'_&_'+this.objects[pair[1]].id;          // Строковое наименование пары, для создания суб-объекта учета данных столкновений.
            if(this.collidedPairsData[pairName]){                                               // Если пара есть в стеке, счетчик контакта пары инкреминтируется.
                this.collidedPairsData[pairName].count++;
            }else{                                                                              // Если нет, данные о паре добавляются в стек.
                this.collidedPairsData[pairName] = {ids: [pair[0], pair[1]], count: 0};
            }
        });

        // Расчет рефлексии для сучаев однократного столкновения пар и множественного (алтернативный расчет для неестественного поведения при столкновении).
        for (const pairName in this.collidedPairsData) {
            // Очистка стека от потерявших актуальность (разлетевшихся/разрушившихся) пар.
            let available = false;
            collidedPairs.forEach(pair => {
                if(pairName == this.objects[pair[0]].id +'_&_'+this.objects[pair[1]].id) available = true;
            });
            if(!available) {
                delete this.collidedPairsData[pairName];
                continue;
            }

            // Расчет кинетики пары
            const CP = this.collidedPairsData[pairName];
            if(CP.count == 0){                                          // Случай первичного соприкосновения пары.
                if(library.physicalImpact(CP.ids, this.objects)){           // Расчет физических параметров пары, кроме кинетических.
                    mediaLibrary.player(                                        // Подбор и проигрывание соответсвующего паре объектов звука столкновения происходит только когда физическое воздействие является истинным.
                        'gameSound',
                        mediaLibrary.getSoundName([this.objects[CP.ids[0]].model, this.objects[CP.ids[1]].model])
                    );
                }
                library.kineticReflexion(CP.ids, this.objects);             // Расчет кинетики пары после столкновения.
            }else if(CP.count == 2){                                    // Случай множественного (третьего по счету) соприкосновения пары.
                library.physicalImpact(CP.ids, this.objects);
                library.nonGeomKineticReflexion(CP.ids, this.objects);
            }

            // Проверка объектов пары на жизнеспособность после столкновения.
            CP.ids.forEach((id, key) => {
                if(this.objects[id].paramsVariable.health <= 0){                                        // Если объект уничтожен, он помечается как неактуaльный и...
                    if(this.objects[id].paramsConst.fragmentation) this.fragmentation(this.objects[id]);    // Если для объекта было установлено свойство фрагментации, он порождает осколки (это вынесено раньше создания эффекта взрыва, чтобы зффект прикрыл внезапное появления фрагментов). 

                    this.objects[id].exist = false;
                    if(this.objects[id].paramsConst.effects.explosions){                                    // ...если у объекта есть эффект взрыва, во Вселенную добавляется новый объект данного эффекта.
                        this.objects.push(
                                new effect(
                                    this.objects[id],                                                       // Объект-источник эффекта (разрушенный в данном случае) 
                                    this.objects[CP.ids[key ? 0 : 1]],                                      // Объект, учавствующий во взаимодействии с объектом-источником. Передается как носитель параметров, для возможного наследия их эффектом.
                                    'explosions'                                                            // Тип эффекта прописанный для объекта в его конфиге.
                                )
                            );
                    }
                }
                if(this.objects[id].playerIndex != undefined){                                                              // Только для пользовательских объектов (космолетов).
                    dashboard.update(this.objects[id].playerIndex, 'shipdamage', this.objects[id].paramsVariable.health);   // Для обновления параметра Healt космолетов.
                }
            });
        }
    },



      ////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Создание/возраждение пользовательских объектов из коллекции shipMods пользователя.////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    respawn(playerIndex){
        if(playerIndex != undefined){                                   // Возраждение космолета по индексу игрока.
            if(config.gameSettings.players[playerIndex].shipMods[0]){   // Возраждение выполняется до тех пор, пока коллекция космолетов не пуста.
                this.objects.push(
                    new spaceShip(
                        config.shipMods[config.gameSettings.players[playerIndex].shipMods[0]],    // Модель (конфиг) первого космолета из коллекции пользователя.
                        config.gameSettings.players[playerIndex],                                 // Параметры пользователя.
                        {respawnIndication: true}                                                 // Флаг для индикации возраждения (мигание объекта).
                    )
                );
                dashboard.update(playerIndex, 'shipdamage', this.objects[this.objects.length-1].paramsVariable.health);    // Для обновления параметра Healt активного космолета.
            }else{
                dashboard.update(playerIndex, 'gameover');
                mediaLibrary.player('gameSound', 'gameOver');
            }
        }else{                                                          // Появление космолетов всех игроков при старте геймплея.
            config.gameSettings.players.forEach((param, key) => {
                if(param.active){
                    param.playerIndex = key;                                                      // Индекс пользователя. Не определен в конфиге изначально, но устанавливается здесь.
                    this.objects.push(
                        new spaceShip(
                            config.shipMods[param.shipMods[0]],                                   // Модель (конфиг) первого космолета из коллекции пользователя.
                            param                                                                 // Параметры пользователя.
                        )
                    );
                }
            });
        }
    },



      //////////////////////////////////////////////
     ///// Создание естественных небесных тел /////
    //////////////////////////////////////////////
    celestialBodyCreator(){
        // Проверка существования астероидов во Вселенной и, если их более одного, то новые не создаются.
        if(this.objects.reduce((sum, obj) => {
                return sum + (obj.model.includes('asteroid') ? 1 : 0); 
            }, 0) > 1) return;
        // Создание новых астероидов.
        const bodies = library.randomizer(...config.gameSettings.gameplay.celestialBodies);
        for(let i = 0; i < bodies; i++){
            this.objects.push(
                new celestialBody('asteroids')
            );
        }
    },



      //////////////////////////////////////////////////////////////////
     ///// Создание осколков объектов Вселенной при их разрушении /////
    //////////////////////////////////////////////////////////////////
    fragmentation(obj){
        if(!obj.paramsConst.fragmentation) return;
        const fragments = library.randomizer(0, obj.paramsConst.fragmentation);
        for(let i = 0; i < fragments; i++){
            this.objects.push(
                new celestialBody(obj.captain ? 'fragments' : 'stones', obj.paramsVariable)
            );
        }
    },



      //////////////////////////////////////////////////////////////////////////////////////////
     ///// Таймер поквантовых задержек наступления и длительности запланированных событий /////
    //////////////////////////////////////////////////////////////////////////////////////////
    quantumTimer(){
        if(this.timers.active){
            let totalQuants = 0;
            let counter;
            for (const counterName in this.timers.counters) {
                counter = this.timers.counters[counterName];
                counter.quants.forEach((quants, index) => {
                    if(quants > 0){
                        counter.quants[index]--;
                        totalQuants += counter.quants[index];
                        if(counter.quants[index] == 0) (counter.context || this)[counter.method](index);
                    }
                });
            }

            if(totalQuants <= 0){
                this.timers.active = false;
            }
        }
    },



      //////////////////////////////////////////////
     ///// Проверка геймплея на актуальность. /////
    //////////////////////////////////////////////
    gameplayRelevanceCheck(playerIndex){
        let actualPlayers = [];
        config.gameSettings.players.forEach((player, key) => {
            if(player.active){
                if(player.shipMods.length) actualPlayers.push(player.playerIndex);
            }
        });

        this.timers.active = true;                  // Активация отслеживания таймера.
        this.timers.counters.respawn.quants[playerIndex] = config.gameSettings.gameplay.timers.respawnTimeout;  // Запуск таймера возраждения для игрока, проигравшего космолет.
        if(actualPlayers.length < 2) {                                                                          // Если только у одного ирока остался флот, запускается таймер надписи победителя и таймер остановки геймплея.
            this.winnerIndex = actualPlayers[0];                                                                // Запись индекса игрока-победителя в св-ва Вселенной.
            this.timers.counters.winnerText.quants[0] = config.gameSettings.gameplay.timers.winnerTextTimeout;
            this.timers.counters.stopGameplay.quants[0] = config.gameSettings.gameplay.timers.stopGameplayTimeout;
        }
    },



      ////////////////////////////////////////////////////
     ///// Завершение геймплея, возвращение в меню. /////
    ////////////////////////////////////////////////////
    stopGameplay(brake){
        if(brake){
            dashboard.showPauseBox(false);
        }else{
            dashboard.showWinner('hide');
        } 
        mediaLibrary.player(false, null, 1);                                                // Остановка текущей воспроизводимой музыки.
        menu.show('local', 1000, () => {
            this.destroy();
            dashboard.destroy();
            menu.update('common', false, 'ships', config.gameSettings.gameplay.ships);      // Сброс наборов кораблей в исходные установленные значения.
            mediaLibrary.player('menuMusic');                                               // Запуск музыки меню.
        });
    },



      ////////////////////////////////
     ///// Разрушение Вселенной /////
    ////////////////////////////////
    destroy(){
        this.objects.forEach((obj, key) => {        // Удаление слушателей событий и звуковых петель у пользовательских объектов.
            if(this.objects[key].playerIndex != undefined){
                this.objects[key].destruction(true);
            }
        });

        document.removeEventListener('keyup', this.dPause);  // Удаление слушателя для метода паузы геймплея.
        this.timeFlow = false;                          // Остановка течения времени
        this.quantCounter = 0;                          // Обнуление времени Вселенной
        this.objects = [];                              // Удаление объектов Вселенной
        this.performance.maxFrameTime = 0;
        this.winnerIndex = null;                        // Обнуление индекса победителя
        this.timers.active = false;                     // Остановка таймеров
        for (const cName in this.timers.counters){
            this.timers.counters[cName].quants.fill(0); // Сброс счетчиков таймеров
        }
    },



      ////////////////////////////////////////////
     /////// Обработчик состояния спрайтов //////
    ////////////////////////////////////////////
    spritesStateHandler(obj){
        if(!obj.paramsConst.sprites) return;
        for (const spriteName in obj.activeSprites) {                                                   // Проход по всем счетчикам спрайтов, которые есть у объекта.
            if(obj.activeSprites[spriteName] === false) continue;                                       // Если для спрайта установлено булево отрицание, а не число, т.е. счет кадров, операция изменения прерывается.
            if(!(this.quantCounter % obj.paramsConst.sprites[spriteName].interval)){                    // Если итерация Вселенной кратна интервалу обработки спрайта, выполняется инкрементация счетчика кадров спрайта и визуализация кадра соответсвующего числу счетчика.
                if(obj.activeSprites[spriteName] < obj.paramsConst.sprites[spriteName].frames){         // Если счетчик кадров не достиг максимального числа кадров спрайта, происходит его инкрементация, иначе сброс на первый кадр.
                    obj.activeSprites[spriteName]++;
                }else{
                    obj.activeSprites[spriteName] = obj.paramsConst.sprites[spriteName].loop ? 1 : 100; // Если тип анимации спрайта зацикленный, происходит сброс на первый кадр, иначе устанавливается несуществующий кадр, который далее будет учтен в условии прорисовки метода playSprites.
                }
                obj.redraw = true;                                                                      // После изменений данных о спрайте (одном или нескольких из набора), объекту указывается флаг для перерисовки его рендером.
            }
        }
    }
}
