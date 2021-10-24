"use strict";




///////////////////
///// Рендер. /////
///////////////////
const render = {
    canvas : {},                // DOM-элемент холста Вселенной
    context: {},                // Контекст холста Вселенной
    layers: {},                 // Массив отдельных слоев для объектов, нуждающиеся в независимых от основного контекста преобразованиях.
    cleanerInterval: 5,         // Частота запуска автоматического чистильщика закадровых слоев в секундах (раз в n секунд).
    cleanerIntervalId: 0,



      /////////////////////////////////
     ///// Инициализация холста. /////
    /////////////////////////////////
    init: function(){
        // Определение холста
        this.canvas        = universe.DOM_Elem.wrapper.querySelector('canvas');
        this.canvas.width  = universe.spaceSize[0];
        this.canvas.height = universe.spaceSize[1];
        
        // Назначение основного контекста 
        this.context = this.canvas.getContext('2d');

        // Запуск автоматической очистки стека от исчерпавших свою актуальность закадровых слоев (когда объекты удалены из Вселенной).
        this.cleanerIntervalId = setInterval(() =>{
            this.clearLayersStack();
        } , this.cleanerInterval * 1000);

    },



      //////////////////////////////////////////////////////////////////
     ///// Визуализация параметров всех объектов текущего кванта. /////
    //////////////////////////////////////////////////////////////////
    rendering: function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Перерисовка слоев.
        this.layersModifier();
    },



      //////////////////////////////////////////////
     ///// Чистильщик стека закадровых слоев. /////
    //////////////////////////////////////////////
    clearLayersStack:function(layerId){
        if(layerId){                                                                // Если метод вызван с указанием имени удаленного объекта, удаляется и соответтсвующий слой (холст).
            delete this.layers[layerId];
        }else{                                                                      // В ином случае выполняется зацикленная автоматическая проверка и очистка стека от потерявших актуальность слоев.
            if(Object.keys(this.layers).length != Object.keys(universe.objects).length && Object.keys(universe.objects).length){
                // Маркеровка всех слоев.
                for(let layerId in this.layers){
                    this.layers[layerId]['nonexist'] = true;
                }
                // Перезапись маркера для тех слоев, объекты которых еще присутствуют во Вселенной.
                universe.objects.forEach(element => {
                    if(this.layers[element.id]) this.layers[element.id]['nonexist'] = false;
                });
                // Удаление перемаркерованных слоев.
                for(let layerId in this.layers){
                    if(this.layers[layerId]['nonexist']) delete this.layers[layerId];
                }
            }
            if (!universe.timeFlow) {
                clearInterval(this.cleanerIntervalId);
            } 
        }
    },



      //////////////////////////////////////////////////////////////
     ///// Генератор закадровых слоев для объектов вселенной. /////
    //////////////////////////////////////////////////////////////
    layersGenerator: function(obj){
        this.layers[obj.id] = {};
        this.layers[obj.id].canvas = document.createElement('canvas');
        this.layers[obj.id].canvas.width = obj.paramsVariable.fullFieldSize;
        this.layers[obj.id].canvas.height = obj.paramsVariable.fullFieldSize;
        this.layers[obj.id].ctx = this.layers[obj.id].canvas.getContext('2d');
    },


      ///////////////////////////////////////////
     ///// Модификатор существующих слоев. /////
    ///////////////////////////////////////////
    layersModifier: function(){ 
        // Проход по всем объектам вселенной.
        universe.objects.forEach((obj) => {
            // Если слоя для объекта еще не существует, его надо создать.
            if(!this.layers[obj.id]) this.layersGenerator(obj);
            
            // Основные универсальные операции подготовки закадрового холста для модификаций. 
            if(obj.redraw){           // Справедливо только для тех объектов, которые нуждаются в перерисовке, то есть, для которых собственными методами установлен флаг redraw = true. 
                this.layers[obj.id].ctx.clearRect(0, 0, this.layers[obj.id].canvas.width, this.layers[obj.id].canvas.height);
                this.layers[obj.id].ctx.rect (0, 0, this.layers[obj.id].canvas.width, this.layers[obj.id].canvas.height);
                this.layers[obj.id].ctx.strokeStyle = "#fff";
                this.layers[obj.id].ctx.stroke();
                this.layers[obj.id].ctx.clearRect(2, 2, this.layers[obj.id].canvas.width-4, this.layers[obj.id].canvas.height-4);
                if(obj.alpha){
                    this.layers[obj.id].ctx.globalAlpha = obj.alpha;      // Установка прозрачности объекта, если у него существует свойство alpha (используется для индикации возраждения).
                }

                this.layers[obj.id].ctx.save();
                this.layers[obj.id].ctx.translate(this.layers[obj.id].canvas.width / 2, this.layers[obj.id].canvas.height / 2);     // Смещение контекста на 1/2 его размеров, чтобы его точка начала координат оказалась в центре холста слоя.
                library.drawObject(this.layers[obj.id].ctx, obj);                                                                   // Отрисовка контуров и фона объекта по его параметрам.
                this.layers[obj.id].ctx.restore();

                if(obj.paramsConst.texture){                                    // Если для объекта назначена текстура, выполняется ее наложение на слой.
                    library.textureMapping(this.layers[obj.id].ctx, obj);
                }

                if(obj.paramsConst.sprites){                                    // Если для объекта назначены спрайты, выполняется отслеживание их активности и прорисовка.
                    library.playSprites(this.layers[obj.id].ctx, obj);
                }

                // Завершение операции
                obj.redraw = false;
            }
            // Прорисовка закадровых слоев на основном холсте.
            this.context.drawImage(
                this.layers[obj.id].canvas,
                Math.round(obj.paramsVariable.location[0] - this.layers[obj.id].canvas.width / 2),    // Смещение слоя на 1/2 его размера в минус, чтобы его центр совпадал с центром основного холста и заодно компенсировал смещение контекста (translate).
                Math.round(obj.paramsVariable.location[1] - this.layers[obj.id].canvas.height / 2),
                this.layers[obj.id].canvas.width,
                this.layers[obj.id].canvas.height
            );
        });
    }
}