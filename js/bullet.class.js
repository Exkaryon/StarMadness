"use strict";







/////////////////////////
///// Класс — пуля. /////
/////////////////////////
class bullet {
    exist = true;                                               // Флаг указывает, что обхект действенен, то есть существует во Вселенной. Для извлечения из Вселенной (удаления объекта) флаг меняется.
    redraw = true;                                              // Свойство указывает, нужно ли перерисовывать объект для текущего кванта. Это значение актуально для рендера в целях экономии ресурсов.
    interaction = true;
    boundaryIgnore = false;
    activeSprites = {};                                         // Стек имен собственных спрайтов со значениями, которые указывают рендеру обрабатывать ли спрайт или игнорировать. False - спрайт неактивен; Number - спрайт активен, значение является текущим номером кадра спрайта.
    activeActions = {                                           // Стек имен собственных методов с флагами, которые указывают объекту Вселенной, должны ли методы быть вызваны (в методе quantumSwitch). Данное свойство повторяет некоторые значения св-ва controls, но выведено отдельно, поскольку в дальнейшем могут быть созданы методы не зависящие от управления.
        motion: false,
        rotate: false,
    };
    paramsVariable = {
        vertices: [],                                           // Координаты вершин объекта изменяемые в процессе «жизни» и применяемые для рендеринга слоя этого объекта. Используется только когда объект является полигональным.
        fulcrum: [0,0],                                         // Координаты опорной точки объекта (условный центр объекта). Если не установлено умолчание отличное от нуля, расчитывается при инициализации по вершинам. 
        interactionFieldSize: 0,                                // Размер поля (зоны взаимодействия), занимаемый объектом, включая его вращение. Расчитывается при инициализации по вершинам.
        fullFieldSize: 0,
        currentSpeed:[0,0],                                     // Текущая скорость X,Y
        location: [0,0],                                        // Текущее положение в пространстве X,Y
        deg: 0,                                                 // Градус поворота объекта
        muzzleDist: 0,                                          // Дистанция дула (места появления пули) от центра космолета. Наследуется от родителя. 
        lastBound: '',                                          // Маркеры последней достигшей границы объектом (Запад, Север, Восток, Юг — W,N,E,S). 
        health: 100,                                            // Процент целостности от 0 до 100.
    };


      /////////////////////////////////////////////////////////////////////////////////////////
     ///// Сборка новой пули для Вселенной с учетом поступивших конфигурационных данных. /////
    /////////////////////////////////////////////////////////////////////////////////////////
    constructor(bulletMod, parentId, parentParams){
        let obj = Object.assign(this, bulletMod, {parentId:parentId});        // Сборка объекта из переданных параметров.
        obj.paramsVariable = Object.assign(                                   // Копирование настоящих (текущих) параметров у родителя.
            obj.paramsVariable, 
            function(){
                let pV = {};
                ['location', 'currentSpeed', 'deg', 'muzzleDist'].forEach(paramName => {
                    if(Array.isArray(parentParams[paramName])){
                        pV[paramName] = Object.assign([], parentParams[paramName]);
                    }else{
                        pV[paramName] = parentParams[paramName];
                    }
                });
                return pV;
            }()
        );
        obj.paramsVariable.lifeTime = obj.paramsConst.lifeTime;
        obj.init();                                      // Инициализация свойств и функций объекта.
        return obj;
    }



      ///////////////////////////////////////////////////////
     /////// Инициализация свойств и методов объекта ///////
    ///////////////////////////////////////////////////////
    init(){
        this.id = this.model+'_'+String(Date.now()).substring(7) + String(Math.random().toFixed(5)).substring(2);   // Генерация уникального идентификатора для объекта.
        // Расчет координат места «вылета» пули относительно центра космолета.
        let iV = library.getImpulseVector(this.paramsVariable.deg);
        this.paramsVariable.location = [
            Math.round(this.paramsVariable.location[0] + this.paramsVariable.muzzleDist * iV[0]),
            Math.round(this.paramsVariable.location[1] + this.paramsVariable.muzzleDist * -iV[1])
        ]; 
        // Расчет скорости пули относительно направления и скорости родителя.
        this.paramsVariable.currentSpeed[0] = this.paramsConst.speed[0] *  iV[0] + this.paramsVariable.currentSpeed[0];
        this.paramsVariable.currentSpeed[1] = this.paramsConst.speed[0] * -iV[1] + this.paramsVariable.currentSpeed[1];

        switch(this.paramsConst.formType){
            case 'polygon':
                this.paramsConst.vertices.forEach((elem, key) => {                                                                                                // Глубокое копирование вершин объекта, в изменяемый массив, относительно которого будут расчитаны остальные параметры.
                    this.paramsVariable.vertices[key] = Object.assign([], elem);
                });
                this.paramsVariable.fulcrum   = library.getFulcrum(this.paramsVariable);                                                                          // Определение центра объекта.
                this.paramsVariable.vertices  = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsConst.vertices);    // Изменение координат вершин объекта, относительно расчитаной точки опоры.
                this.paramsVariable.interactionFieldSize = library.getInteractionFieldSize(this.paramsConst.vertices);                                            // Установка размера холста для объекта (строго после центровки/пересчета координат полигона в calcRotationVertices).
                break;
            case 'circle':
                this.paramsVariable.interactionFieldSize = this.paramsConst.radius * 2;
                break;
        }

        if(this.paramsConst.texture) this.paramsConst.texture = config.textures[this.model];                        // Присвоение текстур, если они указаны для объекта.
        if(this.paramsConst.sprites){                                                                               // Присвоение спрайтов и установка флагов активности спрайтов, если они указаны для объекта.
            this.paramsConst.sprites = config.sprites[this.model];
            for (const spriteName in this.paramsConst.sprites) {
                this.activeSprites[spriteName] = this.paramsConst.sprites[spriteName].defaultActive ? 0 : false;    // Если указана обработка спрайта по умолчанию, флаг меняется на номер первого кадра, что также указывает рендеру необходимость обработки спрайта.
            }
        }
        this.paramsVariable.fullFieldSize = library.getFullFieldSize(this);
        this.activeActions.motion = true;
    };



      //////////////////////////////
     //////// Метод движения. /////
    //////////////////////////////
    motion(){
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];       // Расчет координат Y и X позиций для текущей итерации. Новая позиция объекта = старая позиция + значение скорости * (c = m/E).
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];

        // Если счетчик цикла существования исчерпан или исчерпана прочность, устанавливается флаг обработки процедуры деструктуризации и удаления объекта из Вселенной. Этот счетчик помещен сюда, потому что метод motion обрабатывается всегда.
        if(this.paramsVariable.lifeTime > 0){
            this.paramsVariable.lifeTime--;
        }else{
            this.exist = false;
        }
    };



      /////////////////////////////////////
     //////// Метод вращения объекта /////
    /////////////////////////////////////
    rotate(){
        this.paramsVariable.deg += this.paramsConst.rotationSpeed;
        if(this.paramsVariable.deg >= 360){
            this.paramsVariable.deg = this.paramsVariable.deg - 360;
        }else if(this.paramsVariable.deg < 0){
            this.paramsVariable.deg = this.paramsVariable.deg + 360;
        } 

        // Изменение координат вершин объекта, по которым выполняются расчеты физики и рендеринг, когда объект полигональный.
        if(this.paramsConst.formType == 'polygon'){
            this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsConst.vertices); 
            this.redraw = true;
        }

        // Объекту всегда требуется указание флага перерисовки при повороте в случае, если для него указана текстура.
        if(this.paramsConst.texture) this.redraw = true;
    };



}