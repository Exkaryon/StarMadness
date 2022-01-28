"use strict";

class Autopilot {
    targetObjIndex = null;              // Индекс выбранного объекта Вселенной для прицеливания.
    
    rageMode = {
        permit: false,                  // Режим разрешен (true) или нет (false).
        flow: false,
        start: 0,                       // Начало обработки события в квантах.
        end: 0,                         // Конец обработки события в квантах.
        startDiap: [],                  // Вероятность (частотность) наступления - расчитывается в конструкторе в зависимости от типа космолета.
        dividers: {                     // Делители для startDiap событий, сокращающее время их наступления.
            impulse: 2,
            rotate: 10,
            shot: 1
        }
    };

    actions = {
        impulse: {
            start: 0,                   // Начало обработки события в квантах.
            end: 0,                     // Конец обработки события в квантах.
            now: false,                 // Флаг, указывающий, что надо начать обработку немедленно.
            startDiap: [120, 360],      // Диапазон отсрочки начала выполнения события.
            activeCtrl: null,           // Имя текущего активного свойства controls (когда обрабатывается событие).
            ctrlNames: ['engine']       // Имена свойств controls, которые связаны с соответсвующими событиями.
        },

        rotate: {
            start: 0,
            end: 0,
            now: false,
            startDiap: [120, 270],
            activeCtrl: null,
            ctrlNames: ['left', 'right'],
        },

        shot: {
            start: 0,
            end: 0,
            now: false,
            startDiap: [360, 500],
            activeCtrl: null,
            ctrlNames: ['shot'],
        },
    }



    constructor(spaceShip){
        this.spaceShip = spaceShip;
        spaceShip.apController = () => this.controller();
        spaceShip.activeActions.apController = true;

        // Rage Mode: Вероятность (частотность) наступления в зависимости от типа космолета.
        this.rageMode.startDiap[0] = Math.round(5000 / (this.spaceShip.paramsConst.topSpeed + 1));        // где 5000 - максимально возможный интервал в квантах, а 1 - коэффициент сглаживания разницы времени между типами космолетов.
        this.rageMode.startDiap[1] = this.rageMode.startDiap[0] + 600;
    }



      //////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Расчет длительности разрешения на выполнения событий отсноительно характеристик космолета. /////
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    calcActDuration(prop){
        let quants = 0;
        switch(prop){
            case 'impulse':
                quants = this.spaceShip.paramsConst.weight / this.spaceShip.paramsConst.topSpeed * 1000 / this.spaceShip.paramsConst.weight;
                quants = Math.round(quants + library.randomizer(quants / -1.5, quants / 4)); 
                break;
            case 'rotate':
                quants = library.randomizer(30,  Math.round(360 / this.spaceShip.paramsConst.rotationSpeed));
                break;
            case 'shot':
                quants = library.randomizer(this.spaceShip.paramsConst.weapon.delay, this.spaceShip.paramsConst.weapon.delay * 3);
                break;
            case 'rage':
                quants = this.spaceShip.paramsConst.topSpeed * this.spaceShip.paramsConst.weight + library.randomizer(0, 180);
                break;
        }
        return quants;
    }



      ///////////////////////////////////////////////////////////////////////////////
     ///// Контроллер событий для космолета, на котором активирован автопилот. /////
    ///////////////////////////////////////////////////////////////////////////////
     controller(){
        // Обработка режима ярости.
        if(!this.rageMode.permit){                                                      // Если режим ярости не активен, он планируется.
            this.rageMode.start = universe.quantCounter + library.randomizer(this.rageMode.startDiap[0], this.rageMode.startDiap[1]);
            this.rageMode.end = this.rageMode.start + this.calcActDuration('rage');
            this.rageMode.permit = true;
        }else{                                                                          // В противном случае режим обрабатывается и завершается, когда выходит за рамки планового времени.
            if(universe.quantCounter > this.rageMode.start && universe.quantCounter < this.rageMode.end){
                this.rageMode.flow = true;
            }else if (universe.quantCounter > this.rageMode.end){
                this.rageMode.permit = false;
                this.rageMode.flow = false;
            }
        }
        // Обработка событий
        for (const prop in this.actions) {
            if(!this.actions[prop].start || this.actions[prop].now){                    // Если не установлено время начала события, определяется запрланироованное время и длительность события.
                const term = Math.round(this.rageMode.flow 
                                        ? library.randomizer(this.actions[prop].startDiap[0] / this.rageMode.dividers[prop], this.actions[prop].startDiap[1] / this.rageMode.dividers[prop])
                                        : library.randomizer(this.actions[prop].startDiap[0], this.actions[prop].startDiap[1]));
                this.actions[prop].start = this.actions[prop].now
                                        ? universe.quantCounter + 1
                                        : universe.quantCounter + term;
                this.actions[prop].now = false;
                this.actions[prop].end = this.actions[prop].start + this.calcActDuration(prop);
            }else{                                                                      // Если же установлено, оно выполняется.
                if(universe.quantCounter > this.actions[prop].start && universe.quantCounter < this.actions[prop].end){
                    this.activator(true, prop);
                }else if (universe.quantCounter > this.actions[prop].end){
                    this.activator(false, prop);
                }
            }
        }
    }



      //////////////////////////////////////////
     ///// Активатор события на космолете /////
    //////////////////////////////////////////
    activator(permit, prop){
        // Запрет события.
        if(!permit){
            this.spaceShip.controls[this.actions[prop].activeCtrl][2] = false;
            this.actions[prop].start = 0;
            this.actions[prop].end = 0;
            this.actions[prop].activeCtrl = null;
            if(prop == 'rotate') this.targetObjIndex = null;
            return;
        }
        // Активация события.
        if(!this.actions[prop].activeCtrl){
            this.actions[prop].activeCtrl = this.actions[prop].ctrlNames[library.randomizer(0, this.actions[prop].ctrlNames.length - 1)];
            this.spaceShip.controls[this.actions[prop].activeCtrl][2] = true;
            this.spaceShip.activeActions[prop] = true;
        }
        // Метод автопилота для дополнительной обработки события космолета.
        if(this[prop]) this[prop]();
    }



      ////////////////////////////////////////////////////
     ///// Дополнитеьная обработка события вращения /////
    ////////////////////////////////////////////////////
    rotate(){
        // Выбор объекта для разворота на него.
        if(!this.targetObjIndex){
            let ships = universe.objects.filter(obj => obj.captain && obj.id != this.spaceShip.id && obj.interaction);
            if(!ships.length) return;
            ships.forEach(ship => {            // Увеличение вероятности выбора автопилотом в качестве цели космолет человека с помощью добавления (дублирования) в массив потенциальных целей космолетов человеко-игроков.
                if(ship.driverType == 'human') ships.push(ship);
            });
            const tIndx = library.randomizer(0, ships.length - 1);
            this.targetObjIndex = ships[tIndx];
        }
        // Разворот на объект прицеливания.
        const course = {
            triangle: {     // Решение треугольника, который образуется при соединении центров космолетов прямой, являющейся гипотинузой.
                x: this.targetObjIndex.paramsVariable.location[0] - this.spaceShip.paramsVariable.location[0],
                y: this.targetObjIndex.paramsVariable.location[1] - this.spaceShip.paramsVariable.location[1],
                get c(){return Math.sqrt(this.x * this.x + this.y * this.y)},
                get angleX(){return this.c != 0 ? Math.abs(Math.asin(this.x / this.c) * 180 / Math.PI) : 0;},
                get angleY(){return this.c != 0 ? Math.abs(Math.asin(this.y / this.c) * 180 / Math.PI) : 0;},
            },
            get deg(){      // Получение градуса прямой протянутой от локации пули к каждому из магнитных объектов.
                let deg = 0;
                switch(Math.sign(this.triangle.x || 1) + '' + Math.sign(this.triangle.y || 1)){ // Принять 0 за положительное число, что эквивалентно условию: ... || 1. Здесь, с помощью знаков значений X и Y, определяется четверть круга, к которому принадлежит вектор. 
                    case '1-1':  deg = 0   + this.triangle.angleX; break;
                    case '11':   deg = 90  + this.triangle.angleY; break;
                    case '-11':  deg = 180 + this.triangle.angleX; break;
                    case '-1-1': deg = 270 + this.triangle.angleY; break;
                }
                return Math.floor(deg);
            },
        };
        // Коррекция уже назначенного в активаторе названия события через определение, в какую сторону меньше крутиться космолету для достижения цели. 
        let d = Math.abs(this.spaceShip.paramsVariable.deg - course.deg);
        if(course.deg < this.spaceShip.paramsVariable.deg){
            if(d <= 180){
                this.actions.rotate.activeCtrl = 'left';
                this.spaceShip.controls.right[2] = false;
                this.spaceShip.controls.left[2] = true;
            }else{
                this.actions.rotate.activeCtrl = 'right';
                this.spaceShip.controls.right[2] = true;
                this.spaceShip.controls.left[2] = false;
            }
        }else{
            if(d > 180){
                this.actions.rotate.activeCtrl = 'left';
                this.spaceShip.controls.right[2] = false;
                this.spaceShip.controls.left[2] = true;
            }else{
                this.actions.rotate.activeCtrl = 'right';
                this.spaceShip.controls.right[2] = true;
                this.spaceShip.controls.left[2] = false;
            }
        }
        // Если угол стал минимальным в пределах погрешности, дается разрешение на внеочередную стрельбу, а вращение заканчивается.
        if(Math.abs(this.spaceShip.paramsVariable.deg - course.deg) < this.spaceShip.paramsConst.rotationSpeed){
            this.actions.shot.now = true;
            this.activator(false, 'rotate');
        }
    }



      ////////////////////////////////////////////////////
     ///// Дополнитеьная обработка событий стрельбы /////
    ////////////////////////////////////////////////////
    shot(){
        if(!this.spaceShip.shotDelayCounter.superShot && !this.rageMode.flow){  // Cупероружие лучше использовать вне режима ярости, поскольку оно может быть нейтрализовано пулями обычного.
            this.spaceShip.activeActions.superShot = true;
            return;
        }
        if(!this.spaceShip.shotDelayCounter.shot){
            this.spaceShip.activeActions.shot = true;
        }
    }



}