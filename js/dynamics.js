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
    timeFlow: false,                // Флаг, определяющий течение времени или его остановку (паузу).
    objects: [],                    // Ссылки на все объекты Вселенной.
    collidedPairsData: {},          // Стек пар столкнувшихся объектов в настоящем кванте (итерации) вермени. Пара содержит идентификаторы объектов во Вселенной и счетчик продолжительности беспрерывного столкновения в квантах (итерациях) [id, id, count].
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

    quantCounter: 0,                    // Счетчик квантов (фремов). Используется в рендере для анимации спрайтов.




    counter: 0,                     // DEV: счетчик квантов для ограниченения анимации.
    objs: {},                       // DEV: 
    perf:0,                         // DEV: Отладка - производительность - максимальное зафиксированное время обработки кванта.
    objcount:0,                     // DEV: Максимальное зафиксированное количество объектов


      //////////////////////////////////////////////////////////////////////////////////////////////
     /////// Инициализация объекта Вселенной. По сути, это наш собственный Большой взрыв =) ///////
    //////////////////////////////////////////////////////////////////////////////////////////////
    init(){
        // Определить размеры обертки и назначить их размерами Вселенной.
        this.DOM_Elem.wrapper = document.getElementById('gamescreen');
        this.spaceSize        = [this.DOM_Elem.wrapper.offsetWidth/* - 20*/, this.DOM_Elem.wrapper.offsetHeight/* - 20*/];

        // Создание пользовательких объектов (космолетов) в игровом пространстве из коллекции (флота) пользователя.
        this.respawn();

        // Создание небесных тел.
        this.celestialBodyCreator();

        // Инициализация рендера.
        render.init();

        // Запуск времени Вселенной
        this.quantumSwitch();

        // Инициализация метода паузы геймплея.
        document.addEventListener('keyup', this.pause);
    },



      //////////////////////////////////////////////////////////////////////////////////////
     /////// Кванты времени. Течение времени для всего, ведь время во Вселенной едино! ////         (!) Через данный метод проходят все параметры объектов, которые могут изменяться со временем (координаты, градусы поворота, скорость и т.д.).
    //////////////////////////////////////////////////////////////////////////////////////
    quantumSwitch(){
        
        if (universe.timeFlow) {
            let t = performance.now();

            // Выполнение методов каждого из объектов Вселенной, у которых указан флаг выполнения (activeActions).
            universe.objects.forEach((obj, key) => {
                if(obj.exist){                                  // Если объект актуален, выполняются его активные методы.
                    for(let method in obj.activeActions){
                        if(obj.activeActions[method]) obj[method]();
                    }
                }else{                                          // В противном случае, слушатели событий объекта, объект и его слой удаляются, запускается процесс возраждения.
                    if(universe.objects[key].playerIndex != undefined){                                                           // Операции только для объектов игроков (космолетов).
                        document.removeEventListener('keydown', universe.objects[key]['playerKeydownListener'+universe.objects[key].playerIndex]);
                        document.removeEventListener('keyup', universe.objects[key]['playerKeydownListener'+universe.objects[key].playerIndex]);
                        config.gameSettings.players[universe.objects[key].playerIndex].shipMods.shift();
                        dashboard.update(universe.objects[key].playerIndex, 'shipdestroy');                                       // Обновление данных пользователя (для декримента коллекции космолетов)
                        universe.gameplayRelevanceCheck(universe.objects[key].playerIndex);
                    }
                    delete universe.objects[key];
                    delete render.layers[key];
                    console.log('Йок!');
                }
                // Процедура взаимодействия объекта с границей игрового пространства (экрана).
                library.boundaryLaw(obj, config.gameSettings.gameplay.boundaryBehavior);
            });

            // Обработка установленных таймеров.
            universe.quantumTimer();
            // Детектирование столкновений объектов.
            universe.collider();
            // Визуализация обновленных параметров всех объектов Вселенной за текущий квант.
            render.rendering();

            universe.quantCounter++;
            
            universe.counter++;
            if(universe.counter < 1800){
                // Переход к следующему кванту (итерации обработки параметров).
                requestAnimationFrame(universe.quantumSwitch);
            }else{
                universe.timeFlow = false;
            }


            // ОТЛАДКА: Количество объектов во Вселенной.
            universe.objcount = (Object.keys(universe.objects).length < universe.objcount ) ? universe.objcount : Object.keys(universe.objects).length;

            // ОТЛАДКА: Производительность.
            let q = performance.now() - t;
            universe.perf = (q < universe.perf ) ? universe.perf : q;
            //DEBUG_INFO('win_2', [universe.perf.toFixed(0), universe.objcount], 'green');

            // ОТЛАДКА: Список объектов Вселенной.
/*             DEBUG_INFO('win_4', function (){
                    let r = [];
                    universe.objects.forEach(element => {
                        r.push(element.id);
                    });                                   
                    return r;
                }(), 'yellow'); */


            DEBUG_INFO('win_4', function(){
                let r = [];
                for (const pair in universe.collidedPairsData) {
                    r.push(universe.collidedPairsData[pair].count);
                }
                return r;
            }(), 'yellow');

            // ОТЛАДКА: Health объектов.
            DEBUG_INFO('win_2', function (){
                let r = [];
                universe.objects.forEach(element => {
                    r.push(element.paramsVariable.health);
                });
                return r;
            }(), '#090');

            // ОТЛАДКА: Скорость объектов Вселенной.
            DEBUG_INFO('win_1', function (){
                    let r = [];
                    universe.objects.forEach(element => {
                        r.push(element.paramsVariable.currentSpeed);
                    });                                   
                    return r;
                }(), 'orange');

        }
    },



      ////////////////////////////////////////////////////////////////////////
     /////// Метод остановки течения времени Вселенной (пауза геймплея) /////
    ////////////////////////////////////////////////////////////////////////
    pause(e){
        if(e.code == config.gameSettings.gameplay.pauseKey){
            if(universe.timeFlow){
                universe.timeFlow = false;
                dashboard.showPauseBox(true);
            }else{
                dashboard.showPauseBox(false);
                universe.timeFlow = true;
                universe.quantumSwitch();
            }
        }
    },



      ////////////////////////////////////////////////////
     /////// Метод столкновений объектов Вселенной. /////
    ////////////////////////////////////////////////////
    collider(){
        let interactPairs = library.getInteractPairs(universe.objects);                             // Пересекающиеся окружности потенциального взаимодействия описанные вокруг каждого объекта.
        if(!interactPairs.length){
            this.collidedPairsData = {};
            return;
        }


        let collidedPairs = library.getCollidedPairs(interactPairs, universe.objects);          // Получение пар объектов, соприкоснувшиеся своими поверхностями.

        collidedPairs.forEach(pair => {                                                         // Запись текущих соприкоснувшихся пар в стек Вселенной, для которых будет произведен расчет рефлексии.
            const pairName = this.objects[pair[0]].id +'_&_'+this.objects[pair[1]].id;          // Строковое наименование пары, для создания суб-объекта учета данных столкновений.
            if(this.collidedPairsData[pairName]){                                               // Если пара есть в стеке, счетчик контакта пары инкреминтируется.
                this.collidedPairsData[pairName].count++;
            }else{                                                                              // Если нет, данные о паре добавляются в стек
                this.collidedPairsData[pairName] = {ids: pair, count: 0};
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
                delete this.collidedPairsData[pairName]
                continue;
            }

            // Расчет кинетики пары
            const CP = this.collidedPairsData[pairName];
            if(CP.count == 0){                                          // Случай первичного соприкосновения пары.
                library.physicalImpact(CP.ids, this.objects);               // Расчет физических параметров пары, кроме кинетических.
                if(this.objects[CP.ids[0]].paramsVariable.health > 0 && this.objects[CP.ids[1]].paramsVariable.health > 0){   // Если один из объектов уничтожен, кинетика пары не рассчитывается, для более естественного эффекта.
                    library.kineticReflexion(CP.ids, this.objects);         // Расчет кинетики пары после столкновения.
                }
            }else if(CP.count == 2){                                     // Случай множественного (третьего по счету) соприкосновения пары.
                library.physicalImpact(CP.ids, this.objects);
                if(this.objects[CP.ids[0]].paramsVariable.health > 0 && this.objects[CP.ids[1]].paramsVariable.health  > 0){
                    library.nonGeomKineticReflexion(CP.ids, this.objects);
                }
            }

            // Проверка объектов пары на жизнеспособность после столкновения.
            CP.ids.forEach((id, key) => {
                if(this.objects[id].paramsVariable.health <= 0){                                    // Если объект уничтожен, он помечается как неактуaльный и...
                    this.objects[id].exist = false;
                    if(this.objects[id].paramsConst.effects.explosions){                            // ...если у объекта есть эффект взрыва, во Вселенную добавляется новый объект данного эффекта.
                        this.objects.push(
                                new effect(
                                    this.objects[id],                                                   // Объект-источник эффекта (разрушенный в данном случае) 
                                    this.objects[CP.ids[key ? 0 : 1]],                                  // Объект, учавствующий во взаимодействии с объектом-источником. Передается как носитель параметров, для возможного наследия их эффектом.
                                    'explosions'                                                        // Тип эффекта прописанный для объекта в его конфиге.
                                )
                            );
                    }
                    if(this.objects[id].paramsConst.fragmentation){                                     // Если для объекта было установлено свойство фрагментации, он порождает осколки. 
                        this.fragmentation(this.objects[id]);
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


    celestialBodyCreator(){
        const bodies = library.randomizer(...config.gameSettings.gameplay.celestialBodies);
        for(let i = 0; i < bodies; i++){
            this.objects.push(
                new celestialBody('asteroids')
            );
        }
    },

    fragmentation(obj){
        if(!obj.paramsConst.fragmentation) return;
        const fragments = library.randomizer(0, obj.paramsConst.fragmentation);
        for(let i = 0; i < fragments; i++){
            this.objects.push(
                new celestialBody(obj.captain ? 'debris' : 'stones', obj.paramsVariable)
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
        this.destroy();
        dashboard.destroy();
        menu.show('local');
        menu.update('common', false, 'ships', config.gameSettings.gameplay.ships);
    },



      ////////////////////////////////
     ///// Разрушение Вселенной /////
    ////////////////////////////////
    destroy(){
        this.objects.forEach((obj, key) => {        // Удаление слушателей событий управляемых объектов.
            if(universe.objects[key].playerIndex != undefined){
                document.removeEventListener('keydown', this.objects[key]['playerKeydownListener'+this.objects[key].playerIndex]);
                document.removeEventListener('keyup', this.objects[key]['playerKeyupListener'+this.objects[key].playerIndex]);
            }
        });

        document.removeEventListener('keyup', this.pause);  // Удаление слушателя для метода паузы геймплея.
        this.timeFlow = false;      // Остановка течения времени
        this.objects = [];          // Удаление объектов Вселенной
        this.winnerIndex = null;    // Обнуление индекса победителя
    }



}


// Остановились над тем, что решали вопрос вызова методов в таймере (строки 273, 280), указанных в свойствах timers.counters[...].method. Один из способов написать функции инициализации методов в timers, которые будут возващать текст методов в method для последующего вызова в таймере. Другой - реализовать таймер через switch. 



/*
========================
Задачи
========================

    ✓ 1. Исправить расчет размеров занимаемого поля для объектов (fieldSize).
    ✓ 2. Вынести операции перерисовки объекта из условия redraw в отдельный метод библиотеки.
    ✓ 3. Вынести объекты вселенной в классы (объекты должны создаваться по шаблону, то есть классу)
    ✓ 4. Добавить в свойства и методы рендера обработку тектур. 
    ✓ 5. Написать метод взаимодействия с границами пространства.
    ✓ 6. Написать процедуру очистки стека закадровых слоев, реализация которой была начата в методе clearLayersStack рендера.
    ✓ 7. Переделать расчет скорости движения космолетов и сделать корректное ускорение соответсвенно массе космолета. Проблема в том, что космолет продолжает набирать максимально установленную скорость в сторону отклонения, несмотря на то, что угол отклонения недостаточен для такой скорости. 
    ✓ 8. Подумать над необходимостью и переделать, если это необходимо, процедуры использующие spaceShip.name, под spaceShip.id, который должен генерироваться автоматически и быть уникальным. Идентификатор так же понадобиться для многочисленных однообразных объектов, типа пуль. 
    ✓ 9. Создать пули и методы их движения и взаимодействия с границами, а так же реализовать счетчик времени их существования и удаления их из Вселенной.
    ✓ 10. Сделать объекты рефлексивными к соприкосновениям, то есть разработать процедуры и методы детектирования столкновений.
    ✓ 11. Написать методы рефлексии, то есть, обработки и изменения состояний и скорости объектов при столкновениях на основе их свойств.
    ✓ 12. Установить исходную скорость для кораблей при возраждении.
    ✓ 13. Завершить цикл возрождения когда коллекция кораблей для игрока исчерпана. Выводить где-то информаци об этом или показывать эффект исключения игрока из игрового процесса.
    ✓ 14. Сделать индикацию возрождения для космолетов игроков.
    ✓ 15. Сделать корректное завершение геймплея и переход в меню.
    ✓ 16. Сделать возможность паузы геймплея и перехода в меню, когда геймплей еще актуален.
17. Добавить космический мусор (астероиды и другие объекты) и определить их жизненный цикл в игровой вселенной.
    ✓ 18. Визуализировать работу двигателей для космолетов.
    ✓ 19. Визуализировать взрывы объектов.
20. Создать методы для добавления звукового сопровождения событий во Вселенной. Начать со звуков стрельбы и взрывов.
    ✓ 21. Доработать метод столкновений так, чтобы при взаимном уничтожении объектов их траектория полета не менялась. Это нужно, чтобы создавался эффект пересечения взрывов, а не их отскока друг от друга.



========================================
Баглист, задачи по доработке.
========================================
    ✓ 1. Переделать метод motion для космолетов, поскольку различно инкрементируется и декрементируется скорость на прямых и отличных на 1/2 от них углах (90, 180... и 45, 135...)  
    ✓ 2. Переписать функцию getFieldSize() в библиотеке для более точных вычислений размеров, основываясь на комментарии к этой функции.
    ✓ 3. Добавить возможностть существования и рендеринга круглых объектов.
    ✓ 4. Добавить обработку столкновений для объектов типа circle с аналогичными и полигональными объетками.
    ✓ 5. Сделать так, чтобы объекты пуль были не восприимчивы к своим родителям.
    ✓ 6. Создать функцию определения локации для рождения/возраждения объекта так, чтобы они не накладывались друг на друга.
?   7. Есть ситуация, когда при встречном столкновении объектов, один из них, пройдя центр (половину) другого, задевает грань, так сказать, с другой стороны, и в таком случае направления отскока некорректны, то есть направлены как бы внутрь объектов, а не от них. Неплохобы это как-то пофиксить, либо как-то минимизировать/замаскировать неестественный вид процесса. Такая ситуация возникает именно на следующей половине объекта, дальней по движению. Кроме того, не понятно, как расчитывать столкновение объектов когда, например, астероид оказался внутри "впуклого" объекта.
    ✓ 8. При возраждении корабля пропадает управление.
    ✓ 9. Перенести обновления флота (а также удаления элемента из shipMods) пользователя на дашборде сразу после уничтожения судна, а не перед индикацией возраждения, как сейчас. 
10. При столкновении объектов скорость космолетов может выйти за пределы допустимого, затем, при активации ускорения скорость уменьшается скачкообразно до максимального допустимого предела. 
    ✓ 11. Не меняется имя игрока в конфиге при его изменении в лобби. 
    ✓ 13. Не изменяется способ отражения от границ Вселенной при изменении его в лобии.
    ✓ 14. Не предусмотрена ситуация нечьей. В случае взаимного уничтожения получается ошибка в дашборде в showWinner. 
    ✓ 15. Не сливается последний проигравший плеер в дашборде, а сразу выводится надпись победителя.
    ✓ 16. Пару раз возникала ситуация, когда при старте геймплея или во время геймплея активировалось и "залипало" ускорение космолета игрока без нажатия клавиш. Возможно это связано с прерыванием игры через паузу. Нужно прочекать. (На самом деле это было связано с флагами контроля действия, которые не копируются из конфига, а ссылаются на него.)
17. Космолеты и другие объекты Вселенной всегда появляются направленными в одну сторону (наверх). Нужно сделать рандомное направление или направление соответсвующее движению объектов (в особенности космолетов).
    ✓ 18. Необходимо разделить для космолетов метод motion на два метода impulse и motion поскольку это создает сложности при реализации визуализации спрайтов работы двигателей. Да и логически это совершенно разные методы.
    ✓ 19. Когда космолет мигает после возрождения он может залететь за границы пространства. Это связано с тем, что ему пристваивается неактивный статус interaction (+условие в quantumSwitch).  
20. Возникло странное поведение дашборда при уничтожении космолетов: появилось мерцание. Предположительно, баг возникший при обновлении браузера.


/* ВАРИАНТ РЕШЕНИЯ ЗАДАЧИ №21 ИЗ СПИСКА ЗАДАЧ. 
    // Расчет кинетики пары
    if(this.collidedPairsData[pairName].count == 0){                                        // Случай первичного соприкосновения пары.
        library.physicalImpact(this.collidedPairsData[pairName].ids, universe.objects);     // Расчет остальных физических параметров пары.
        if(universe.objects[this.collidedPairsData[pairName].ids[0]].paramsVariable.health > 0 && universe.objects[this.collidedPairsData[pairName].ids[1]].paramsVariable.health  > 0 ){
            library.kineticReflexion(this.collidedPairsData[pairName].ids, universe.objects);   // Расчет кинетики пары после столкновения.
        }
    }else if(this.collidedPairsData[pairName].count == 2){                                  // Случай множественного (третьего по счету) соприкосновения пары.
        library.physicalImpact(this.collidedPairsData[pairName].ids, universe.objects);
        if(universe.objects[this.collidedPairsData[pairName].ids[0]].paramsVariable.health > 0 && universe.objects[this.collidedPairsData[pairName].ids[1]].paramsVariable.health  > 0 ){
            library.nonGeomKineticReflexion(this.collidedPairsData[pairName].ids, universe.objects);
        }
    }









Рекомендации по оптимизации
==============================
https://developer.mozilla.org/ru/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
1. Предварительно отрисуйте похожие примитивы или повторяющиеся объекты на offscreen canvas 
2. Избегайте координат с плавающей точкой и используйте вместо них целые числа — Субпиксельный рендеринг происходит при рендеринге объектов на canvas без целых значений.
3. Используйте несколько слоев canvas для сложных сцен
4. Отключите прозрачность

Другие советы
1. Объединяйте запросы к canvas. Например, рисуйте одну ломанную линию вместо нескольких отдельных линий.
2. Избегайте ненужных изменений состояния canvas.
3. Отображайте только изменения экрана, а не заново перерисовывайте.
4. По возможности избегайте свойства shadowBlur.
5. Избегайте рендеринга текста, когда это возможно.
6. Попробуйте разные способы очистки canvas ((clearRect(), или fillRect(), или изменение размера canvas).
7. С анимациями используйте window.requestAnimationFrame() вместо window.setInterval().
8. Будьте осторожны с тяжелыми физическими библиотеками.

*/







