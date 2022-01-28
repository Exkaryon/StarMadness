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
    activeActions = {};                                         // Стек имен собственных методов с флагами, которые указывают объекту Вселенной, должны ли методы быть вызваны (в методе quantumSwitch).
    paramsVariable = {
        vertices: [],                                           // Координаты вершин объекта изменяемые в процессе «жизни» и применяемые для рендеринга слоя этого объекта. Используется только когда объект является полигональным.
        fulcrum: [0,0],                                         // Координаты опорной точки объекта (условный центр объекта). Если не установлено умолчание отличное от нуля, расчитывается при инициализации по вершинам. 
        interactionFieldSize: 0,                                // Размер поля (зоны взаимодействия), занимаемый объектом, включая его вращение. Расчитывается при инициализации по вершинам.
        fullFieldSize: [0, 0],
        currentSpeed: [0, 0],                                   // Текущая скорость X,Y
        location: [0,0],                                        // Текущее положение в пространстве X,Y
        deg: 0,                                                 // Градус поворота объекта
        muzzleDist: [0,0],                                      // Дистанция дула (места появления пули) от центра космолета. Наследуется от родителя. 
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
            Math.round(this.paramsVariable.location[0] + this.paramsVariable.muzzleDist[0] * iV[0] + this.paramsVariable.muzzleDist[1] * -iV[1]),
            Math.round(this.paramsVariable.location[1] + this.paramsVariable.muzzleDist[0] * -iV[1] + this.paramsVariable.muzzleDist[1] * -iV[0])
        ]; 
        // Расчет скорости пули относительно направления и скорости родителя.
        this.paramsVariable.currentSpeed[0] = this.paramsConst.speed *  iV[0] + this.paramsVariable.currentSpeed[0];
        this.paramsVariable.currentSpeed[1] = this.paramsConst.speed * -iV[1] + this.paramsVariable.currentSpeed[1];

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
        // Активация методов для объекта.
        this.activeActions.lifeTimer = true;                // Универсальный метод.
        this.paramsConst.ownMethods.forEach(method => {     // Собственные методы объекта, указанные в конфиге.
            this.activeActions[method] = true;
        });
    };



      /////////////////////////////////////////////////////
     ///// Универсальный метод времени существования /////
    /////////////////////////////////////////////////////
    lifeTimer(){
        // Если счетчик цикла существования исчерпан или исчерпана прочность, устанавливается флаг обработки процедуры деструктуризации и удаления объекта из Вселенной. Этот счетчик помещен сюда, потому что метод motion обрабатывается всегда.
        if(this.paramsVariable.lifeTime > 0){
            this.paramsVariable.lifeTime--;
        }else{
            this.exist = false;
        }
    }



      ///////////////////////////
     ///// Метод движения. /////
    ///////////////////////////
    motion(){
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];       // Расчет координат Y и X позиций для текущей итерации. Новая позиция объекта = старая позиция + значение скорости * (c = m/E).
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];
    };



      //////////////////////////////////
     ///// Метод вращения объекта /////
    //////////////////////////////////
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



      ///////////////////////////////////////////////////////////
     ///// Метод коррекции вектора скорости для biocapsule /////
    ///////////////////////////////////////////////////////////
    velocityVectorCorrection(){
        this.activeActions['velocityVectorCorrection'] = false;     // Метод отрабатывает единожды.
        const parent = universe.objects.find(O => {if(O) return O.id == this.parentId;});
        if(!parent) return;
        let iV = library.getImpulseVector(this.paramsVariable.deg);
        if(parent.controls.right[2]){                               // Добавление центробежной скорости к основной, если метод вращения космолета был задействован. 
            this.paramsVariable.currentSpeed[0] += 1.5 * -iV[1];    // 1.5 - Коэффициент усиления центробежной скорости.
            this.paramsVariable.currentSpeed[1] += 1.5 * -iV[0];
        }else if(parent.controls.left[2]){
            this.paramsVariable.currentSpeed[0] += 1.5 * iV[1];
            this.paramsVariable.currentSpeed[1] += 1.5 * iV[0];
        }
    }


      ////////////////////////////////////
     ///// Метод лазерного свечения /////
    ////////////////////////////////////
    laserGlow(){
        if(!this.ready){                                            // Если метод запускается первый раз, параметры объекта лазера трансформируются и выполняются вычисления взаимодействий.
            this.ready = true;                                      // Флаг, что объект прошел подготовку.
            this.hidden = false;                                    // Объект становится визуальным.
            this.interaction = false;                               // Луч лазера неинтерактивен пока не найдено попадание в объект, чтобы исключить лишние ненужные вычисления столкновений.
            // Функция расчета холста для луча лазера. Объект может быть очень большим и занять много времени на рендеринг, поэтому площадь холста нужно минимизировать как можно сильнее путем обрезки холста по крайним координатами точек.
            function getFullFieldSize(vertices){
                const t = vertices.reduce((acc, el) => {
                    acc.x.push(el[0]);
                    acc.y.push(el[1]);
                    return acc; 
                }, {x:[], y:[]});
                return [
                    Math.abs(Math.min(...t.x)) + Math.max(...t.x) || 9,     // Размер холста не должен быть = 0, иначе рендер выдаст ошибку. 0 может получится при ровном угле, когда координаты луча описывают прямую, а не прямоугольник.
                    Math.abs(Math.min(...t.y)) + Math.max(...t.y) || 9,
                ]; 
            }
            // Функция расчета длины луча, который протянется от дула космолета до границы игрового пространства к которому направлен космолет.
            function getRayLength(iVector, deg, muzzleLoc){
                let marker = [Math.sign(iVector[0]), Math.sign(iVector[1])];
                // Нахождение сторон "с" треугольников, где стороны "a" треугольников tX и tY (катеты) - расстояние от места начала луча до краев Вселенной, а углы degA - противолежащие им углы.
                const triangles = {
                    tX: {
                        a: marker[0] > 0 ? universe.spaceSize[0] - muzzleLoc[0] : muzzleLoc[0],
                        degA: (marker[0] * marker[1] > 0) ? deg - (Math.floor(deg / 90) * 90) : 90 - (deg - (Math.floor(deg / 90) * 90)),
                        get c(){return this.a / Math.sin(this.degA * Math.PI / 180);},
                    },
                    tY: {
                        a: marker[1] < 0 ? universe.spaceSize[1] - muzzleLoc[1] : muzzleLoc[1],
                        degA: (marker[0] * marker[1] > 0) ? 90 - (deg - (Math.floor(deg / 90) * 90)) : deg - (Math.floor(deg / 90) * 90),
                        get c(){return this.a / Math.sin(this.degA * Math.PI / 180);},
                    }
                }
                // Из двух треугольников гипотинуза одного всегда равна корректному расстоянию до границ, а другого всегда больше, поэтому достаточно просто взять меньшее значение.
                return Math.min(Math.round(triangles.tX.c), Math.round(triangles.tY.c));
            }
            // Трансформация параметров лазера под текущиее состояние кванта для проверки на взаимодействие с другими объектами.
            const parentObj = universe.objects.find(O => {if(O) return O.id == this.parentId;});                // Ссылка на родительский объект (космолет).
            const maxObjSize = universe.objects.reduce((size, obj) => {                                         // Максимальный размер объекта. Примет значения initialValue, то есть 2,  если интерактивных объектов кроме родителя и лазера во Вселенной нет.
                if(!obj.interaction || obj.id == this.parentId || obj.id == this.id) return size;
                return size > obj.paramsVariable.interactionFieldSize ? size : obj.paramsVariable.interactionFieldSize;
            }, 2);
            this.paramsVariable.currentSpeed = [0, 0];                                                          // Луч лазера неподвижен.
            this.paramsVariable.deg = !parentObj ? this.paramsVariable.deg : parentObj.paramsVariable.deg;      // Градус поворота. Используются значения установленные при инициализации, то есть из прошлого кванта, если родительский объект успели уничтожить за один квант, после того как он инициализировал луч.
            const iV = library.getImpulseVector(this.paramsVariable.deg);                                       // Вектор импульса - коэффициент отклонения по осям при повороте.
            this.muzzleLocation = [                                                                             // Координаты дула оружия.
                !parentObj ? this.paramsVariable.location[0] : Math.round(parentObj.paramsVariable.location[0] + this.paramsVariable.muzzleDist[0] * iV[0]),
                !parentObj ? this.paramsVariable.location[1] : Math.round(parentObj.paramsVariable.location[1] + this.paramsVariable.muzzleDist[0] * -iV[1])
            ];
            let rayLength = getRayLength(iV, this.paramsVariable.deg, this.muzzleLocation);                     // Расчет длины луча.
            this.paramsVariable.vertices = [                                                                    // Поле детектор - прямоугольник для поиска объектов претендентов на попадание в луч лазера.
                [ maxObjSize / 2, -rayLength / 2],
                [ maxObjSize / 2,  rayLength / 2],
                [-maxObjSize / 2,  rayLength / 2],
                [-maxObjSize / 2, -rayLength / 2],
            ];
            this.paramsVariable.fulcrum = library.getFulcrum(this.paramsVariable);
            this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsVariable.vertices);    // Разворот координат по унаследованному углу от родителя (космолета).
            this.paramsVariable.location = [                                                                    // Определение локации (позицию центра) абстрактного лазера в отдалении от центра родительского объекта.
                Math.round(this.muzzleLocation[0] + (rayLength / 2) *  iV[0]),
                Math.round(this.muzzleLocation[1] + (rayLength / 2) * -iV[1]) 
            ];
            // Поиск объектов и сбор их в кучу, центры которых оказались в прямоугольнике (поле детекторе) абстрактного лазера.
            const cx = document.createElement('canvas').getContext('2d');
            cx.beginPath();
            this.paramsVariable.vertices.forEach((vtx, key) => {
                if(key == 0) {cx.moveTo(vtx[0] + this.paramsVariable.location[0], vtx[1] + this.paramsVariable.location[1]);}
                else         {cx.lineTo(vtx[0] + this.paramsVariable.location[0], vtx[1] + this.paramsVariable.location[1]);}
            });
            cx.closePath();
            let objHeap = [this];    // Первым объектом в куче "пойманых" объектов претендентов будет сам лазер.
            universe.objects.forEach(obj => {
                if(obj.interaction && obj.id != this.parentId && obj != this){
                    if(cx.isPointInPath(obj.paramsVariable.location[0], obj.paramsVariable.location[1])){
                        objHeap.push(obj);
                    }
                }
            });
            // Перестройка геометрии лазера под реальную толщину луча.
            this.paramsVariable.vertices = [
                [0, -rayLength / 2],
                [0, rayLength / 2]
            ];
            this.paramsVariable.vertices = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsVariable.vertices);
            // Подготовка размеров холста для исходного луча лазера (т.е. который пока не попадает ни в один объект).
            this.paramsVariable.fullFieldSize = getFullFieldSize(this.paramsVariable.vertices);
            // Если в куче менее двух объектов, значит объектов, попавших в детектирующее поле лазера нет. Лазер готов к рендеру такой, какой есть. 
            if(objHeap.length < 2) return;
            // Поиск в куче ближайшего объекта к объекту родителю лазера, который пересекся с уже реальной толщиной луча. 
            const pairs = objHeap.map((obj, index) => [index, 0]).slice(1);                                 // Поскольку первым объектом в куче является луч, то пара получается [0, 0], поэтому ее нужно убрать с помощью slice.
            const crossPairs = library.getCollidedPairs(pairs, objHeap);                                    // Получение пар индексов объектов, которые пересеклись своими поверхностями с лучем.
            if(!crossPairs.length) return;
            // Подготовка данных для нахождения ближайшего объекта попавшего в луч к космолету выпустевшего этот луч.
            const laserML = this.muzzleLocation;
            let crs = crossPairs.map(el => {
                return {
                    objIndexes: [el[0], el[1]],
                    crossPoint: {
                        x: el[2][0] ? el[2][0][0] : objHeap[el[0]].paramsVariable.location[0],
                        y: el[2][0] ? el[2][0][1] : objHeap[el[0]].paramsVariable.location[1],
                    },
                    get rayLength(){
                        return Math.ceil(Math.sqrt(
                            Math.pow(laserML[0] - this.crossPoint.x, 2) + Math.pow(laserML[1] - this.crossPoint.y, 2)
                        ));
                    }
                };
            });
            // Сортировка массива объектов по возрастанию расстояния от пушки космолета до объекта попадания, если элементов массива больше чем один. Первый элемент и является ближайшим.
            if(crs.length > 1) crs.sort((a, b) => a.rayLength - b.rayLength);
            rayLength = crs[0].rayLength % 2 ? crs[0].rayLength + 3 : crs[0].rayLength + 2;                 // Приведение к большему четному значению, чтобы делить луч без дробей, и добавление пары пискелей для случаев, когда луч может немного "не дотянууться" до цели.
            // Обновление координатных точек луча в соответсвие с расстоянием до ближайшего объекта.
            this.paramsVariable.vertices = [
                [0, -rayLength / 2],
                [0, rayLength / 2]
            ];
            this.paramsVariable.vertices  = library.calcRotationVertices(this.paramsVariable.fulcrum, this.paramsVariable.deg, this.paramsVariable.vertices);
            this.paramsVariable.location = [
                Math.round(this.muzzleLocation[0] + (rayLength / 2) * iV[0]),
                Math.round(this.muzzleLocation[1] + (rayLength / 2) * -iV[1])
            ];
            // Изменение параметров холста под луч, который попал в объект.
            this.paramsVariable.interactionFieldSize = library.getInteractionFieldSize(this.paramsVariable.vertices);
            this.paramsVariable.fullFieldSize = getFullFieldSize(this.paramsVariable.vertices);
            this.interaction = true;
            // Создание эффекта искр в попавший объект.
            const source = {
                paramsConst: this.paramsConst,
                paramsVariable: {
                    location: [crs[0].crossPoint.x, crs[0].crossPoint.y], 
                    deg: this.paramsVariable.deg,
                    currentSpeed: [0, 0]
                }
            };
            universe.objects.push(
                new effect(
                    source,                                                       // Объект-источник эффекта (разрушенный в данном случае) 
                    objHeap[crs[0].objIndexes[0]],                                // Объект, учавствующий во взаимодействии с объектом-источником. Передается как носитель параметров, для возможного наследия их эффектом.
                    'explosions'                                                  // Тип эффекта прописанный для объекта в его конфиге.
                )
            );
            return;
        }
        this.interaction = false;
        this.alpha =  (this.alpha || 1) - this.paramsConst.lifeTime / Math.pow(( this.paramsConst.lifeTime), 2);
        this.alpha = this.alpha < 0.01 ? 0.01 : this.alpha;
        this.redraw = true;
    };



      ///////////////////////////////////////////////////////////////////////////////////
     ///// Метод примагничивания пули к космолетаам (изменения траектории полета). /////
    ///////////////////////////////////////////////////////////////////////////////////
    magneticMotion(){
        // Добавление инерциальной скорости (также скорости вылета из дула), которая затем затухает.
        if(!this.magneticObjs) this.inertialSpd = {};                                                                              // Первый квант жизни пули определяется отсутствием массива магнитных объектов, где инициализируется объект инерциальной/стартовой скорости.
        // Получение массива магнитных объектов для текущего кванта.
        this.magneticObjs = universe.objects.filter(obj => (obj.captain || obj.model == 'asteroidSteel') && obj.id != this.parentId && obj.interaction);
        // Если количество магнитных объектов в прошлом кванте отличается от количества в текущем, то востаннавливается устанавливается счетчик инерциальной скорости, указывается стартовая скорость равная настоящей и расчитывается декремент затухания.
        if(this.magneticObjs.length != this.lastMagneticObjsNum || !this.magneticObjs.length){
            this.inertialSpd.count = 60;                                                                                           // Счетчик декрементации в квантах, за время которого инерциальная скорость будет снижена до нуля. 
            this.inertialSpd.curr = Object.assign([], this.paramsVariable.currentSpeed);                                           // Текущая скорость. В первом кванте наследуется из оригинальной скорости при инициализации.
            this.inertialSpd.decr = [this.inertialSpd.curr[0] / this.inertialSpd.count, this.inertialSpd.curr[1] / this.inertialSpd.count];    // Декремент скорости кратный счетчику декрементации.
        }
        // Однако, если магнитных объектов в данном кванте нет, то скорость пули линейна и не меняется.
        if(!this.magneticObjs.length){
            this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];
            this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];
            return;
        }
        // Затухание (декрементация) инерциальной скорости.
        if(this.inertialSpd.count > 0){
            this.inertialSpd.curr[0] -= this.inertialSpd.decr[0];
            this.inertialSpd.curr[1] -= this.inertialSpd.decr[1];
            this.inertialSpd.count--;
        }else{
            this.inertialSpd.curr = [0, 0];
        }
        // Запись текущего количества объектов для использования в следующем кванте.
        this.lastMagneticObjsNum = this.magneticObjs.length;

        // Расчет магнитных данных от каждого магнитного объекта.
        const universeDiag = Math.sqrt(Math.pow(universe.spaceSize[0], 2) + Math.pow(universe.spaceSize[1], 2));
        const magneticData = this.magneticObjs.map(obj => {
            return {
                // Получение расстояния от пули до магнитных объектов.
                triangle: {
                    x: obj.paramsVariable.location[0] - this.paramsVariable.location[0],
                    y: obj.paramsVariable.location[1] - this.paramsVariable.location[1],
                    get c(){return Math.sqrt(this.x * this.x + this.y * this.y)},
                    get angleX(){return this.c != 0 ? Math.abs(Math.asin(this.x / this.c) * 180 / Math.PI) : 0;},
                    get angleY(){return this.c != 0 ? Math.abs(Math.asin(this.y / this.c) * 180 / Math.PI) : 0;},
                },
                // Получение коэффициента усиления примагничивания к каждому из объектов.
                get magneticCoef(){return 1 - 1 / (universeDiag / this.triangle.c)},
                // Получение градуса прямой протянутой от локации пули к каждому из магнитных объектов.
                get deg(){
                    let theta = 0;
                    switch(Math.sign(this.triangle.x || 1) + '' + Math.sign(this.triangle.y || 1)){ // Принять 0 за положительное число, что эквивалентно условию: ... || 1. Здесь, с помощью знаков значений X и Y, определяется четверть круга, к которому принадлежит вектор. 
                        case '1-1':  theta = 0   + this.triangle.angleX; break;
                        case '11':   theta = 90  + this.triangle.angleY; break;
                        case '-11':  theta = 180 + this.triangle.angleX; break;
                        case '-1-1': theta = 270 + this.triangle.angleY; break;
                    }
                    return theta;
                },
                get iV(){return library.getImpulseVector(this.deg);},
                get increment(){return [this.magneticCoef * this.iV[0], this.magneticCoef * -this.iV[1]];}
            };
        });
        // Расчет суммарного магнитного инкремента к скорости пули от всех магнитных объектов.
        const magneticInc = magneticData.reduce((acc, data) => {
            return [acc[0] + data.increment[0], acc[1] + data.increment[1]];
        }, [0, 0]);
        // Расчет новой скорости с учетом магнетизма объектов и иннерциальной скорости.
        this.paramsVariable.currentSpeed = [
            magneticInc[0] * 4 + this.inertialSpd.curr[0],         // 4 - коэффициент усиления магнитного инкремента.
            magneticInc[1] * 4 + this.inertialSpd.curr[1]
        ];
        // Расчет новой локации.
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];
    }
}









