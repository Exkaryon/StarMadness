"use strict";



////////////////////////////////////
///// Класс — Небесноое тело. /////
//////////////////////////////////
class celestialBody {
    exist = true;                                               // Флаг указывает, что объект действенен, то есть существует во Вселенной. Для извлечения из Вселенной (удаления объекта) флаг меняется.
    redraw = true;                                              // Свойство указывает, нужно ли перерисовывать объект для текущего кванта. Флаг "обнуляется" в самом рендере по окончанию прорисовки, но не в методах объекта. Это значение актуально для рендера в целях экономии ресурсов.
    interaction = true;                                        // Флаг указывает, что объект должен взаимодействовать (проверятся на столкновение) с другими объектами Вселенной, у которых так же истинно данное свойство. 
    boundaryIgnore = false;
    activeSprites = {};                                         // Стек имен собственных спрайтов со значениями, например {engine:false}, которые указывают рендеру обрабатывать ли спрайт или игнорировать. False - спрайт неактивен; Number - спрайт активен, значение является текущим номером кадра спрайта. Имена и значения присваиваются при инициализации, а также во время активации метода объекта.
    activeActions = {                                           // Стек имен собственных методов с флагами, которые указывают объекту Вселенной, должны ли методы быть вызваны (в методе quantumSwitch). Данное свойство повторяет некоторые значения св-ва controls, но выведено отдельно, поскольку в дальнейшем могут быть созданы методы не зависящие от управления.
        motion: false,
        rotate: false,
        ignoringPI: false,
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

    color = '#ccc';


    constructor(bodyType, parentParams){
        const bodyTypes = {                                                                                                         // Набор типов небесных тел и их коллекции моделей.
            asteroids: ['asteroidStone', 'asteroidBrown', 'asteroidSteel', 'asteroidBlack'],
            stones: ['stoneV1', 'stoneV2', 'stoneV3', 'stoneV4'],
            debris: ['fragment'],
        };
        Object.assign(this, config.celestialBodyMods[bodyTypes[bodyType][library.randomizer(1, bodyTypes[bodyType].length) - 1]]);  // Копирование статичных свойств из конфига соответсвенно случайно выбранному моду из набора.

        if(parentParams){                                                                                                           // Если передан родитель, то от него наследуются некоторые свойства.
            this.paramsVariable.currentSpeed = [parentParams.currentSpeed[0], parentParams.currentSpeed[1]];
            this.paramsVariable.location = [parentParams.location[0], parentParams.location[1]];
            this.activeActions.ignoringPI = true;
        }else{
            this.paramsVariable.location = library.respawnPos(this, universe.objects);                                          // Стартовая позиция в пространстве.

        }


// еще подумать, можно ли эффект искр сделать при рикошете объектов.
// Нужно оптимизировать обработку спрайтов с интервалами, чтобы флаг redraw не становился истинным тогда, когда спрайт не меняет кадр.



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
        this.paramsVariable.currentSpeed = library.respawnSpeed(this);                                                      // Стартовая скорость при рождении/возраждении.
        this.activeActions.motion = true;
    }



      //////////////////////////////////////////////////////
     /////// Метод движения объекта в пространстве. ///////
    //////////////////////////////////////////////////////
    motion(){
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];                             // Расчет координат Y и X позиций для текущей итерации. Новая позиция объекта = старая позиция + значение скорости * (c = m/E).
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];
        this.redraw = true;
    }



    ignoringPI (){
        if(!this.activeActions.ignoringPI) return;

        if(!this.ignorePITimer){                                                    // Если таймер индикации не установлен, устанавливается он и флаг индикации. 
            this.ignorePITimer = 180;                                               // Время игнорирования физического воздействия в квантах. Пример: пока небесные тела не успели разлететься подальше друг от друга (осколки после разбития большого астероидла), нужно отключать физическое воздействие, чтобы они не уничтожились друг об друга.
            this.ignoreModels = ['stoneV1', 'stoneV2', 'stoneV3', 'stoneV4'];       // Модели объектов, которые следует игнорировать, то есть в данном случае, созданный камень игнорирует объекты перечисленных моделей.
        }else{
            this.ignorePITimer--;
            if(this.ignorePITimer <= 0){
                this.activeActions.ignoringPI = false;
                delete this.ignoreModels;                  // Поскольку модель всего лишь одна, можно удалить всё свойство.
            }
        }

    }



}