"use strict";


///////////////////////////
///// Класс — Эффект. /////
///////////////////////////
class effect {
    exist = true;                                               // Флаг указывает, что объект действенен, то есть существует во Вселенной. Для извлечения из Вселенной (удаления объекта) флаг меняется.
    redraw = true;                                              // Свойство указывает, нужно ли перерисовывать объект для текущего кванта. Флаг "обнуляется" в самом рендере по окончанию прорисовки, но не в методах объекта. Это значение актуально для рендера в целях экономии ресурсов.
    interaction = false;                                        // Свойство указывает с какие методы взаимодействия проявляет объект во Вселенной. False - объект нейтрино; all - все возможные взаимодействия; kinetic - кинетические; physic - физических параметров; boundary - пересечение границ. 
    activeSprites = {};                                         // Стек имен собственных спрайтов со значениями, например {engine:false}, которые указывают рендеру обрабатывать ли спрайт или игнорировать. False - спрайт неактивен; Number - спрайт активен, значение является текущим номером кадра спрайта. Имена и значения присваиваются при инициализации, а также во время активации метода объекта.
    activeActions = {                                           // Стек имен собственных методов с флагами, которые указывают объекту Вселенной, должны ли методы быть вызваны (в методе quantumSwitch). Данное свойство повторяет некоторые значения св-ва controls, но выведено отдельно, поскольку в дальнейшем могут быть созданы методы не зависящие от управления.
        motion: false,
    };
    paramsVariable = {};



      /////////////////////////////////////////////////////////////////////////////////////////////
     ///// Сборка нового эффекта для Вселенной с учетом поступивших конфигурационных данных. /////
    /////////////////////////////////////////////////////////////////////////////////////////////
    constructor(sourceObj, oppoObj,  effectType){
        ['location', 'currentSpeed', 'deg'].forEach(paramName => {                                          // Передача ссылок требуемых изменяемых свойств от объекта источника эффекта. 
            this.paramsVariable[paramName] = sourceObj.paramsVariable[paramName];
        });
        Object.assign(                                                                                      // Получение из конфига свойств эффекта, выбранного случайно из списка названий эффектов в объекте источнике, соответсвенно переданному типу эффекта.
            this,
            config.effectMods[sourceObj.paramsConst.effects[effectType][library.randomizer(0, sourceObj.paramsConst.effects[effectType].length - 1)]]
        ); 
        if(this.paramsConst.textureLifeTime) this.paramsConst.texture = config.textures[sourceObj.model];   // Передача ссылки на текстуру объекта источника. Требуется для того, чтобы дорисовывать текстуру объекта в эффект, когда сам объект-источник уже удален. 


        if(sourceObj.paramsConst.durability < 2 && sourceObj.paramsConst.weight < 10) {                     // Если объект-источник достаточно легкий и малопрочный, принято считать, что образуемый им эффект наследует свойства скорости от противопоставленного объекта, то есть как бы прилипает к нему...
            if(oppoObj.paramsConst.durability >= 2 && oppoObj.paramsConst.weight >= 10) {                     // ...но только в том случае, если сам противопоставленный объект не является таким же легким и малопрочным.
                this.paramsVariable.currentSpeed = oppoObj.paramsVariable.currentSpeed;
            }else{
                this.paramsVariable.currentSpeed[0] /= oppoObj.paramsConst.weight > 4 ? oppoObj.paramsConst.weight : 4;
                this.paramsVariable.currentSpeed[1] /= oppoObj.paramsConst.weight > 4 ? oppoObj.paramsConst.weight : 4;
            }
        }else{                                                                                              // В противном случае, скорость остается унаследованной от объекта источника и делиться пополам для более естественного поведения эффекта.
            this.paramsVariable.currentSpeed[0] /= 2;
            this.paramsVariable.currentSpeed[1] /= 2;
        }


        this.init();
    }



      ///////////////////////////////////////////////////////
     /////// Инициализация свойств и методов объекта ///////
    ///////////////////////////////////////////////////////
    init(){
        this.id = this.model+'_'+String(Date.now()).substring(7) + String(Math.random().toFixed(5)).substring(2);           // Генерация уникального идентификатора для объекта.
        let maxLifeTime = [];
        if(this.visual){
            this.paramsConst.sprites = config.sprites[this.model];                                                                                  // Отдается ссылка на конфиг спрайта. Клонирование не требуется, поскольку paramConst не претерпевает никаких изменений. 
            for (const spriteName in this.paramsConst.sprites) {
                this.activeSprites[spriteName] = this.paramsConst.sprites[spriteName].defaultActive ? 0 : false;                                    // Если указана обработка спрайта по умолчанию, флаг меняется на счетчик кадров спрайта и устанавливается в ноль, который указывает рендеру необходимость обработки спрайта.
                maxLifeTime.push(this.paramsConst.sprites[spriteName].frames * this.paramsConst.sprites[spriteName].interval);
            }
            this.paramsVariable.fullFieldSize = library.getFullFieldSize(this);
            this.activeActions.motion = true;
        }
        this.paramsConst.lifeTime = this.paramsConst.lifeTime ? this.paramsConst.lifeTime : Math.max(...maxLifeTime);                               // Время жизни эффекта.
        this.paramsVariable.lifeTime = this.paramsConst.lifeTime;                                                                                   // Установка счетчика существования.
    }



      //////////////////////////////
     //////// Метод движения. /////
    //////////////////////////////
    motion(){
        this.paramsVariable.location[0] += this.paramsVariable.currentSpeed[0];       // Расчет координат Y и X позиций для текущей итерации. Новая позиция объекта = старая позиция + значение скорости * (c = m/E).
        this.paramsVariable.location[1] += this.paramsVariable.currentSpeed[1];

        // Если счетчик цикла существования исчерпан устанавливается флаг обработки процедуры удаления объекта из Вселенной.
        if(this.paramsVariable.lifeTime > 0){
            if(this.paramsConst.textureLifeTime && this.paramsConst.lifeTime - this.paramsConst.textureLifeTime == this.paramsVariable.lifeTime){
                delete this.paramsConst.texture;
            }
            this.paramsVariable.lifeTime--;
            this.redraw = true;
        }else{
            this.activeActions.motion = false;
            this.exist = false;
        }
    }



}



