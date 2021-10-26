"use strict";







/////////////////////////////
///// Класс — космолет. /////
/////////////////////////////
class spaceShip {
    exist = true;                                               // Флаг указывает, что объект действенен, то есть существует во Вселенной. Для извлечения из Вселенной (удаления объекта) флаг меняется.
    redraw = true;                                              // Свойство указывает, нужно ли перерисовывать объект для текущего кванта. Флаг "обнуляется" в самом рендере по окончанию прорисовки, но не в методах объекта. Это значение актуально для рендера в целях экономии ресурсов.
    interaction = true;                                         // Флаг указывает, что объект должен взаимодействовать (проверятся на столкновение) с другими объектами Вселенной, у которых так же истинно данное свойство. 
    boundaryIgnore = false;
    activeSprites = {};                                         // Стек имен собственных спрайтов со значениями, например {engine:false}, которые указывают рендеру обрабатывать ли спрайт или игнорировать. False - спрайт неактивен; Number - спрайт активен, значение является текущим номером кадра спрайта. Имена и значения присваиваются при инициализации, а также во время активации метода объекта.
    activeActions = {                                           // Стек имен собственных методов с флагами, которые указывают объекту Вселенной, должны ли методы быть вызваны (в методе quantumSwitch). Данное свойство повторяет некоторые значения св-ва controls, но выведено отдельно, поскольку в дальнейшем могут быть созданы методы не зависящие от управления.
        impulse: false,
        rotate: false,
        strike: false,
        blink: false
    };
    paramsVariable = {
        vertices: [],                                           // Координаты вершин объекта изменяемые в процессе «жизни» и применяемые для рендеринга слоя этого объекта.
        fulcrum: [0,0],                                         // Координаты опорной точки объекта (условный центр объекта). Если не установлено умолчание отличное от нуля, расчитывается при инициализации по вершинам. 
        interactionFieldSize: 0,                                // Размер поля взаимодействия объекта (зона, при соприкосновении с которой иного объекта, начинается детальные вычисления столкновений). Расчитывается при инициализации по вершинам.
        fullFieldSize: 0,                                       // Размер поля (всего холста объекта), включая неактивную зону - место в котором могут отрисовываться спрайты или иные элементы так, чтобы они полностью вписались в это поле.
        currentSpeed:[0,0],                                     // Текущая скорость X,Y
        location: [0,0],                                        // Текущее положение в пространстве X,Y
        deg: 0,                                                 // Градус поворота объекта
        health: 100,                                            // Процент целостности от 0 до 100.
    };


      ///////////////////////////////////////////////////////////////////////////////////////////////
     ///// Сборка нового космолета для Вселенной с учетом поступивших конфигурационных данных. /////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    constructor(shipMod, playerSet, respawnIndication){
        Object.assign(this, shipMod, playerSet, respawnIndication);         // Сборка объекта из переданных параметров.
        for (const ctrlName in this.controls) {                             // Сброс/определение флагов активности методов контроля. Поскольку объект конфига controls не копируется в spaceShip, а передает ссылку на себя, может сложится ситуация, когда новый космолет создается с флагом активного метода контроля.
            this.controls[ctrlName][2] = false;
        }
        // Инициализация свойств и функций объекта.
        this.init();
    }


    
      ///////////////////////////////////////////////////////
     /////// Инициализация свойств и методов объекта ///////
    ///////////////////////////////////////////////////////
    init(){
        this.id = this.model+'_'+String(Date.now()).substring(7) + String(Math.random().toFixed(5)).substring(2);           // Генерация уникального идентификатора для объекта.
        switch(this.paramsConst.formType){
            case 'polygon':
                this.paramsConst.vertices.forEach((elem, key) => {                                                          // Глубокое копирование вершин объекта, в изменяемый массив, относительно которого будут расчитаны остальные параметры.
                    this.paramsVariable.vertices[key] = Object.assign([], elem);
                });
                this.paramsVariable.fulcrum = library.getFulcrum(this.paramsVariable);                                                                          // Определение центра объекта.
                this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsConst.vertices);   // Изменение координат вершин объекта, относительно расчитаной точки опоры.
                this.paramsVariable.interactionFieldSize = library.getInteractionFieldSize(this.paramsVariable.vertices);                                       // Установка размера холста для объекта (строго после центровки/пересчета координат полигона в calcRotationVertices).
                break;
            case 'circle':
                this.paramsVariable.interactionFieldSize = this.paramsConst.radius * 2;
                break;
        }

        if(this.paramsConst.texture) this.paramsConst.texture = config.textures[this.model];                                // Присвоение текстур, если они указаны для объекта.
        if(this.paramsConst.sprites){                                                                                       // Присвоение спрайтов и установка флагов активности спрайтов, если они указаны для объекта.
            this.paramsConst.sprites = config.sprites[this.model];                                                          // Отдается ссылка на конфиг спрайта. Клонирование не требуется, поскольку paramConst не претерпевает никаких изменений. 
            for (const spriteName in this.paramsConst.sprites) {
                this.activeSprites[spriteName] = this.paramsConst.sprites[spriteName].defaultActive ? 0 : false;            // Если указана обработка спрайта по умолчанию, флаг меняется на счетчик кадров спрайта и устанавливается в ноль, который указывает рендеру необходимость обработки спрайта.
            }
        }
        this.paramsVariable.fullFieldSize = library.getFullFieldSize(this);                                                 // Размер области, которую будет занимать объект, включая все его графические элементы.
        this.paramsVariable.location = library.respawnPos(this, universe.objects);                                          // Стартовая позиция в пространстве.
        this.paramsVariable.currentSpeed = library.respawnSpeed(this);                                                      // Стартовая скорость при рождении/возраждении.
        this.paramsVariable.deg = library.randomizer(0, 360);                                                               // Стартовый случайный угол при рождении/возраждении.
        if(this.paramsConst.formType == 'polygon') this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsConst.vertices); // Пересчет вершин под стартотвый угол, когда объект полигональный.
        this.blink();                                                                                                       // Запуск индикации возраждения (мерцания).
        this.driver(this.driverType);                                                                                       // Инициализация управления.
        this.activeActions.motion = true;                                                                                   // Запуск дрейфа в пространстве
    }



      /////////////////////////////////////////
     /////// Метод управления объектом ///////
    /////////////////////////////////////////
    driver(driverType){
        if(driverType == 'human'){
            let obj = this;
            this['playerKeydownListener'+this.playerIndex] = function(e){        // Объекту присваивается именованный соответственно игроку метод отклика на действия пользователя. Именуется для возможности удаления "слушателя" событий вместе с объектом.
                for(let key in obj.controls){
                    if(obj.controls[key][0] == e.code && !obj.controls[key][2]){    // Перед вызовом метода необходимо проверять статус, чтобы избежать повторного вызовова метода, ведь зажатая клавиша = множественное нажатие.
                        obj.controls[key][2] = true;
                        obj.activeActions[obj.controls[key][1]] = true;             // Установка флага соответсвующему имени метода, указывающий Вселенной необходимость обработки указанного метода.
                    }
                }
            }
            this['playerKeyupListener'+this.playerIndex] = function(e){
                e.preventDefault();
                for(let key in obj.controls){
                    if(obj.controls[key][0] == e.code){
                        obj.controls[key][2] = false;
                    }
                }
            }
            document.addEventListener('keydown', this['playerKeydownListener'+this.playerIndex]);
            document.addEventListener('keyup', this['playerKeyupListener'+this.playerIndex]);
        }else{
            console.log('Инициализация AI для '+this.captain)
            //this.controls = 'Neural Model';
        }
    }


      //////////////////////////////////////////////////////
     /////// Метод движения объекта в пространстве. ///////
    //////////////////////////////////////////////////////
    motion(){
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];                             // Расчет координат Y и X позиций для текущей итерации. Новая позиция объекта = старая позиция + значение скорости * (c = m/E).
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];
    }


      ///////////////////////////////
     /////// Метод ускорения ///////
    ///////////////////////////////
    impulse(){
        if(this.controls.engine[2]){
            // Получение коэффициентов направления вектора импульса по X и Y.
            let impulseVector = library.getImpulseVector(this.paramsVariable.deg);
            let maxSpeed = this.paramsConst.topSpeed;
            let curSpeed = this.paramsVariable.currentSpeed;
            // Поскольку оси имеют разные направления отсчета, требуются разные знаки инкремента для них, поэтому здесь используется проход по массиву из положительного (X) и отрицательного (Y) значения.
            [1,-1].forEach((elem, key) => {
                let limit = maxSpeed * impulseVector[key] * elem;                                           // Расчетный лимит скорости по направлению (по оси).
                if(Math.abs(curSpeed[key]) < Math.abs(limit)){                                              // Когда скорость не превышает расчетного лимита по направлению, выполняется прибавка импульса к скорости.
                    curSpeed[key] += impulseVector[key] * elem / this.paramsConst.weight;
                }else{                                                                                      // Если же скорость по оси превзошла лимит, выполняется расчет декримента для направления (оси), у которого превышена скорость. Это нужно для того, чтобы объект постепенно выравнивал направление движения соответсвенно повороту, а не улетал в стороны, сохраняя "боковую" скорость.
                    let raznost, coef, decr;
                    raznost = Math.abs(limit) - Math.abs(curSpeed[key]);                                    // Декримент пропорционален разности лимита по направлению и реальной скорости по направлению.
                    coef    = maxSpeed * Math.sign(curSpeed[key]) - limit;                                  // Разница между общей разрешенной сокростью и разрешенной скоростью направления (по оси). Является дополнительным коэфициентом расчета.
                    decr    = coef ? raznost / coef * -1 : 0;                                               // Декремент явлется отношением разностей. 
                    curSpeed[key] -= decr / this.paramsConst.weight;
                    if(decr < 0.1) curSpeed[key] -= Math.sign(curSpeed[key]) / this.paramsConst.weight;     // Если декремент пренебрежимо мал или =0 (при некоторых обстоятельствах) скорость не сможет быстро вернуться из запределов лимита, поэтому ее нужно принудительно вернуть в эти пределы увеличив декремент, чтобы первое услови с инкрементом снова могло сработать.
                }
            });
            this.activeActions.impulse = true;                                                              // Флаг, указывающий объекту Вселенной необходимость обработки данного метода.
            this.activeSprites.engine = this.activeSprites.engine || 0;                                     // Разрешение обработки спрайта начиная с нулевого (первого) кадра или текущего, если он уже был разрешен.
            this.redraw = true;                                                                             // Разрешение перерисовки объекта рендером.
        }else{
            if(this.activeActions.impulse){                                                                 // Условие для того, чтобы после деактивации метода произошла еще одна перерисовка объекта для корректной визуализации соответсвующей состоянию объекта.
                this.activeActions.impulse = false;
                this.activeSprites.engine = false;
                this.redraw = true;
            }
        }
    }


      ////////////////////////////////////////////////////
     /////// Метод вращения объекта (ориентации). ///////
    ////////////////////////////////////////////////////
    rotate(){
        if(this.controls.left[2] || this.controls.right[2]){                                                                            // Когда кнопки вращения задействованы, в зависимости от той, которая нажата, выполняем прибавления или уменьшения градуса поворота.
            if(this.controls.right[2]){
                this.paramsVariable.deg += this.paramsConst.rotationSpeed;
                if(this.paramsVariable.deg >= 360) this.paramsVariable.deg = this.paramsVariable.deg - 360;                             // Градус поворота не может быть больше 360. Да и нам ни к чему огромные градусы для вычислений. Поэтому, если достигаем число 360, просто отнимаем - 360.
                this.activeSprites.rotatorLeft = this.activeSprites.rotatorRight !== false ? 0 : this.activeSprites.rotatorLeft || 0;   // Активация спрайта левого двигателя ориентации. Если правый двигатель находился в работе, то скорее всего значением левого двигателя было 100, поэтому нужно сбросить значение в 0, чтобы не произошло преждевременное удовлетворение условию при отпускании кнопки. В алтернативном случае назначается текущее значение, если уже проигрывается, или стартовое = 0.
                this.activeSprites.rotatorRight = false;                                                                                // Деактивация спрайта правого двигателя.
            }else if(this.controls.left[2]){                                                                                            // ... либо прибавляем 360, если градусы стали меньше 0.
                this.paramsVariable.deg -= this.paramsConst.rotationSpeed;
                if(this.paramsVariable.deg < 0)    this.paramsVariable.deg = this.paramsVariable.deg + 360;
                this.activeSprites.rotatorRight = this.activeSprites.rotatorLeft !== false ? 0 : this.activeSprites.rotatorRight || 0;
                this.activeSprites.rotatorLeft = false;
            }
            if(this.paramsConst.formType == 'polygon'){
                this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsConst.vertices);       // Изменение координат вершин объекта, по которым выполняются расчеты физики и рендеринг.
            }
            this.activeActions.rotate = true;                                                                                           // Флаг, указывающий объекту Вселенной необходимость обработки метода.
        }else{
            if(!this.paramsConst.sprites) {
                this.activeActions.rotate = false;
            }else{
                if(this.activeSprites.rotatorLeft == 100 && !this.activeSprites.rotatorRight) this.activeSprites.rotatorRight = 0;      // Когда визуализация двигателя вращения окончена, а этому служит значение = 100 и неактивный флаг противоположного двигателя, должно прозойти проигрывание спрайта противоположного двигателя, типа торможение, поэтому происходит его активация присвоением стартового значения = 0. 
                else if(this.activeSprites.rotatorRight == 100 && !this.activeSprites.rotatorLeft) this.activeSprites.rotatorLeft = 0;
                else if(this.activeSprites.rotatorRight == 100 && this.activeSprites.rotatorLeft == 100) {                              // Если процесс визуализации вращения и торможения вращения окончены, то выполняется деактивация активных спрайтов и остановка обработки метода вращения.
                    this.activeSprites.rotatorRight = false;
                    this.activeSprites.rotatorLeft = false;
                    this.activeActions.rotate = false;
                } 
            } 
        }
        this.redraw = true;                                                                                                             // Флаг, указывающий рендеру необходимость перерисовки объекта.
    }




      ////////////////////////////////
     /////// Функция стрельбы ///////
    ////////////////////////////////
    strike(){
        // Создается новый объект пули и добавляется во Вселенную.
        universe.objects.push(
            new bullet(
                config.bulletMods[this.paramsConst.weapon[0]],
                this.id,
                Object.assign(
                    {},
                    this.paramsVariable,
                    {muzzleDist: this.paramsConst.muzzleDist}
                )
            )
        );
        this.activeActions.strike = false;
    }



      /////////////////////////////////////////////
     /////// Функция индикации возраждения ///////
    /////////////////////////////////////////////
    blink(){
        if(this.respawnIndication){
            if(!this.blinkTimer){                           // Если таймер индикации не установлен, устанавливается он и флаг индикации. 
                this.blinkTimer = config.gameSettings.gameplay.timers.respawnIndication;
                this.activeActions.blink = true;
                this.interaction = false;                   // Во время индикации космолет недоступен для взаимодействия с другими объектами Вселенной.
            }else{                                          // В противном случае каждый раз, когда таймер кратен 5, выполняется изменение прозрачности слоя космолета.
                if(!(this.blinkTimer % 5)){
                    this.alpha = this.alpha == 1.0 || undefined
                        ? this.blinkTimer == 5
                            ? 1.0
                            : 0.5
                        : 1.0; 
                    this.redraw = true;
                }
                this.blinkTimer--;
                if(this.blinkTimer <= 0){
                    this.respawnIndication = false;
                    this.activeActions.blink = false;
                    this.interaction = true;
                    delete this.alpha;
                }
            }
        }
    }




}



