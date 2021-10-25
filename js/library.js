"use strict";

const library = {

      ////////////////////////////////////////////////////
     ///// Генератор случайных чисел из диаппазона. /////
    ////////////////////////////////////////////////////
    randomizer: function(min, max) {
        return Math.floor( (min + Math.random() * (max + 1 - min)));
    },



      //////////////////////////////////////////////////////////////////
     ///// Метод расчета длины отрезка по координатам двух точек. /////
    //////////////////////////////////////////////////////////////////
    getLengthFromVertices: function(x1, y1, x2, y2){
        let catheti = [
            Math.abs(x1 - x2),
            Math.abs(y1 - y2)
        ];
        return Math.sqrt(   // Расчитывается по Теореме Пифагора.
                    Math.pow(catheti[0], 2) + Math.pow(catheti[1], 2) 
                );
    },



      ///////////////////////////////////////////////////////////////////////////////////////////
     ///// Метод расчета опорной точки объекта (центра объекта) Вселенной по его вершинам. /////
    ///////////////////////////////////////////////////////////////////////////////////////////
    getFulcrum: function(params){
        if(params.fulcrum[0] && params.fulcrum[1]) return params.fulcrum;
        let X = [1000,-1000]; // [min, max]
        let Y = [1000,-1000];
        params.vertices.forEach(vrtx => {
            if(vrtx[0] < X[0]) X[0] = vrtx[0];
            if(vrtx[0] > X[1]) X[1] = vrtx[0];
            if(vrtx[1] < Y[0]) Y[0] = vrtx[1];
            if(vrtx[1] > Y[1]) Y[1] = vrtx[1];
        });
        return [
            Math.round((X[1] - X[0]) / 2) + X[0],
            Math.round((Y[1] - Y[0]) / 2) + Y[0],
        ];
    },



      ///////////////////////////////////////////////////////////////////////////////////////
     ///// Расчет размера поля, на котором сможет уместиться объект, включая вращение. /////
    ///////////////////////////////////////////////////////////////////////////////////////
    getInteractionFieldSize: function(vertices){ 
        let max = 0, hypo = 0;
        vertices.forEach(vrtx => {                                                      // Выборка элемента массива с максимальными суммарными значениями (максимальным отдалением от центра).
            hypo = Math.sqrt(vrtx[0]*vrtx[0] + vrtx[1]*vrtx[1]);                        // Расчет гипотенузы, являющаяся радиусом окружности в которую полностью вписыввается полигон.
            max = max < hypo ? hypo : max;
        });
        let diameter = Math.ceil(max * 2);
        return (diameter % 2) ? diameter + 1 : diameter;                                // Чтобы объект располагался в поле симметрично, значение должно быть четным.
    },



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Расчет поля, включая не только чувствительный к взаимодействиям объект, но и все его графические дополнения /////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getFullFieldSize: function(obj){
        let sizes = [0];
        if(obj.paramsConst.texture){
            sizes = sizes.concat(obj.paramsConst.texture.size);
        }
        if(obj.paramsConst.sprites){
            Object.entries(obj.paramsConst.sprites).forEach(spriteName => {
                sizes = sizes.concat([
                    spriteName[1].frameSize[0] + spriteName[1].offset[0] * 2,
                    spriteName[1].frameSize[1] + spriteName[1].offset[1] * 2
                ]);
            });
        }
        let maxSize = Math.max(...sizes);  // Эквивалентно старому выражению: Math.max.apply(null, sizes); 
        return maxSize > (obj.paramsVariable.interactionFieldSize || 0) ? maxSize : obj.paramsVariable.interactionFieldSize;
    },



    /////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Определение позиции рождения/возрождения с учетом позиции и размеров других объектов. /////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    respawnPos: function(protoObj, uniObjs){
        let attempts = 10;                       // Число попыток, после исчерпания которых, объект будет размещен уж как получится. Исчерпание попыток означает возможное остутсвие свободного места в пространстве для возрождения.
        let location;
        function coordsGenerator(){
            let preLoc = [
                library.randomizer(protoObj.paramsVariable.interactionFieldSize, universe.spaceSize[0] - protoObj.paramsVariable.interactionFieldSize),
                library.randomizer(protoObj.paramsVariable.interactionFieldSize, universe.spaceSize[1] - protoObj.paramsVariable.interactionFieldSize)
            ];

            if(Object.keys(uniObjs).length){
                let overlay = uniObjs.find(realObj => {         // Детектирование наложения протообъекта на другие объекты Вселенной.
                                   if(realObj != undefined){    // В uniObjs могут присутсвовать пустые индексы удаленных объектов, поэтому осуществляется проверка,чтобы избежать ошибки обращения к несуществующим св-вам.
                                        let rSum = (protoObj.paramsVariable.interactionFieldSize + realObj.paramsVariable.interactionFieldSize) / 2 + 10;
                                        if(rSum > library.getLengthFromVertices(preLoc[0], preLoc[1], realObj.paramsVariable.location[0], realObj.paramsVariable.location[1])){
                                            return true;
                                        }
                                   }
                               });
                if(overlay && attempts > 0){
                    attempts--;
                    coordsGenerator();
                }else{
                    location = preLoc;
                }    
            }else{
                location = preLoc;
            }
        }
        coordsGenerator();
        return location;
    },



      ////////////////////////////////////////////////////////////////////////////
     ///// Определение начальной скорости объектов при рождении/возраждении /////
    ////////////////////////////////////////////////////////////////////////////
    respawnSpeed: function(obj){
        const topSpd = obj.paramsConst.topSpeed;
        const curSpd = obj.paramsVariable.currentSpeed;
        let newSpd = [
            this.randomizer(topSpd * -10, topSpd * 10) / 10 / 2,    // Произведение на 10 для получения десятичных, а не целых значений в скорости.
            this.randomizer(topSpd * -10, topSpd * 10) / 10 / 2
        ];
        if(curSpd[0] != 0 || curSpd[1] != 0){                       // Если у объекта уже была некоторая скорость отличная от нуля (например, когда объект наследует скорость от предка) то она добавляется к новой скорости так, чтобы не выйти за рамки лимитов.
            newSpd.forEach((spd, key) => {
                newSpd[key] = (spd + curSpd[key] > topSpd || spd + curSpd[key] < -topSpd)
                                    ? topSpd * Math.sign(curSpd[key])
                                    : spd + curSpd[key];
            });
        }
        return newSpd;
    },



      ///////////////////////////////////////////////////////////////////////////////////////////
     ///// Расчет направления импульса управляемых объектов в зависимости от угла поворота /////
    ///////////////////////////////////////////////////////////////////////////////////////////
    getImpulseVector:function(deg){
        //DEBUG_INFO('win_2', [Math.sin(deg * Math.PI / 180).toFixed(1), Math.cos(deg * Math.PI / 180).toFixed(1)], '#f90', '');
        return [                                            // Возвращаемые значения от 0 до 1. Значения являются инкрементом для свойств скорости по соответсвующим осям.
            Math.sin(deg * Math.PI / 180).toFixed(2),       // X
            Math.cos(deg * Math.PI / 180).toFixed(2)        // Y
        ];
    },



      /////////////////////////////////////////////////////////////////////////////////////
     ///// Функция пересчета координат вершин в зависимости от угла поворота объекта /////
    /////////////////////////////////////////////////////////////////////////////////////
    calcRotationVertices: function(fulcrum, deg, vertices){
        if(!vertices) return false;
        let newVtxs = [];
        vertices.forEach((vertex) => {
            newVtxs.push([
                Math.trunc((vertex[0] - fulcrum[0]) * Math.cos(deg * Math.PI / 180) - (vertex[1] - fulcrum[1]) * Math.sin(deg * Math.PI / 180)),    // X
                Math.trunc((vertex[0] - fulcrum[0]) * Math.sin(deg * Math.PI / 180) + (vertex[1] - fulcrum[1]) * Math.cos(deg * Math.PI / 180))     // Y
            ]);
        });
        return newVtxs;
    },



      //////////////////////////////////////////////
     ///// Функция рисования объектов по типу /////
    //////////////////////////////////////////////
    drawObject: function(context, obj){
        switch(obj.paramsConst.formType){
            case 'polygon':
                // Dev: Круг, занимаемый объектом (зона взаимодействия).
                context.beginPath();
                context.arc(0, 0, obj.paramsVariable.interactionFieldSize / 2, 0, Math.PI * 2, false);
                context.stroke();
                context.closePath();
                // Отрисовка граней объекта.
                context.beginPath();
                obj.paramsVariable.vertices.forEach((vertex, key) => {
                    if(key == 0){
                        context.moveTo(vertex[0], vertex[1]);
                    }else{
                        context.lineTo(vertex[0], vertex[1]);
                    }
                });
                context.closePath();
                // Раскраска объекта
                context.strokeStyle = obj.color || '#f00';
                context.stroke();
                context.fillStyle = (obj.color || '#f00') + '5';
                context.fill();
                break;
            case 'circle':

                if(obj.color){
                    context.beginPath();
                    context.arc(0, 0, obj.paramsVariable.interactionFieldSize / 2, 0, Math.PI * 2, false);
                    context.closePath();
                    // Раскраска объекта
                    context.strokeStyle = obj.color || '#f00';
                    context.stroke();
                    context.fillStyle = (obj.color || '#f00') + '5';
                    context.fill();
                }

                break;
        };
        return context;
    },



      ////////////////////////////////////////
     ///// Наложение текстур на объекты /////
    /////////////////////////////////////////
    textureMapping:function(context, obj){
        context.save();
        context.translate(Math.ceil(obj.paramsVariable.fullFieldSize / 2), Math.ceil(obj.paramsVariable.fullFieldSize / 2));
        context.rotate(obj.paramsVariable.deg * Math.PI / 180);
        context.drawImage(
            obj.paramsConst.texture.pic,
            obj.paramsConst.texture.size[0] / -2,
            obj.paramsConst.texture.size[1] / -2,
            obj.paramsConst.texture.size[0],
            obj.paramsConst.texture.size[1],
        );
        context.restore();
    },



      ///////////////////////////////
     ///// Прорисовка спрайтов /////
    ///////////////////////////////
    playSprites: function(context, obj){
        for (const [spriteName, frameCount] of Object.entries(obj.activeSprites)) {
            if(frameCount === false || !obj.paramsConst.sprites[spriteName]) continue;                  // Если для спрайта установлено булево отрицание, а не число, т.е. счет кадров, или если спрайт с указанным именем не существует у объекта, операция прорисовки прерывается.
            if(obj.activeSprites[spriteName] <= obj.paramsConst.sprites[spriteName].frames){            // Прорисовка кадров спрайтов, если счетчик кадров не превышает их кол-во. 
                context.save();
                context.translate(Math.ceil(obj.paramsVariable.fullFieldSize / 2), Math.ceil(obj.paramsVariable.fullFieldSize / 2));
                context.rotate(obj.paramsVariable.deg * Math.PI / 180);
                context.drawImage(
                    obj.paramsConst.sprites[spriteName].pic,
                    0,
                    obj.paramsConst.sprites[spriteName].frameSize[1] * (obj.paramsConst.sprites[spriteName].single ? 0 : obj.activeSprites[spriteName] - 1),
                    obj.paramsConst.sprites[spriteName].frameSize[0],
                    obj.paramsConst.sprites[spriteName].frameSize[1],
                    obj.paramsConst.sprites[spriteName].frameSize[0] / -2 + obj.paramsConst.sprites[spriteName].offset[0], 
                    obj.paramsConst.sprites[spriteName].frameSize[1] / -2 + obj.paramsConst.sprites[spriteName].offset[1],
                    obj.paramsConst.sprites[spriteName].frameSize[0],
                    obj.paramsConst.sprites[spriteName].frameSize[1]
                );
                context.restore();
            }
        };
    },



      ///////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция взаимодействия с границами игрового пространства объектов разного типа. /////
    ///////////////////////////////////////////////////////////////////////////////////////////
    boundaryLaw: function(obj , behavior){
        if(obj.boundaryIgnore) return;                          // Если у объекта существует истинное свойство игнорирования границ, вычислений не происходит.
        let min, max;
        switch (obj.paramsConst.formType){
            case 'polygon':                                     // Если тип объекта полигональный (на основе вершин).
                min = [ 1000,  1000];                           // [X, Y]
                max = [-1000, -1000];
                obj.paramsVariable.vertices.forEach(vrtx => {   // Нахождение максимальных и минимальных значений вершин.
                    if(vrtx[0] < min[0]) min[0] = vrtx[0];      // X min
                    if(vrtx[0] > max[0]) max[0] = vrtx[0];      // X max
                    if(vrtx[1] < min[1]) min[1] = vrtx[1];      // Y min
                    if(vrtx[1] > max[1]) max[1] = vrtx[1];      // Y max
                });
                break;
            case 'circle':                                      // Если тип объекта окружность.
                min = [-obj.paramsConst.radius, -obj.paramsConst.radius];
                max = [obj.paramsConst.radius, obj.paramsConst.radius];
                break; 
        }

        switch (behavior){
            case 'teleport':            // Переход границ объектом учитывается по достижению его максимальными и минимальными вершинами этих границ.
                // Расчет положения объекта при телепортации при достижении границ разных сторон.
                if      (obj.paramsVariable.location[0] + max[0] < 0)                      obj.paramsVariable.location[0] += (universe.spaceSize[0] + max[0] + min[0] * -1);
                else if (obj.paramsVariable.location[1] + max[1] < 0)                      obj.paramsVariable.location[1] += (universe.spaceSize[1] + max[1] + min[1] * -1);
                else if (obj.paramsVariable.location[0] + min[0] > universe.spaceSize[0])  obj.paramsVariable.location[0] -= (universe.spaceSize[0] + max[0] + min[0] * -1);
                else if (obj.paramsVariable.location[1] + min[1] > universe.spaceSize[1])  obj.paramsVariable.location[1] -= (universe.spaceSize[1] + max[1] + min[1] * -1);
                break;
            case 'rebound':              // Поведение объектов с отскоком от границ.
                // Расчет параметров скорости и направления отскока объекта при достижении границ.
                let loc = obj.paramsVariable.location;
                let cS = obj.paramsVariable.currentSpeed;
                if      (loc[0] + min[0] < 0)                      cS[0] = Math.abs(cS[0]);
                else if (loc[1] + min[1] < 0)                      cS[1] = Math.abs(cS[1]);
                else if (loc[0] + max[0] > universe.spaceSize[0])  cS[0] = Math.abs(cS[0]) * -1;
                else if (loc[1] + max[1] > universe.spaceSize[1])  cS[1] = Math.abs(cS[1]) * -1;
                // Если для объекта установлено отражение поворота при достижении границы, выполняются дополнительные процедуры. 
                if(obj.paramsConst.reflection){ 
                    if     (obj.paramsVariable.lastBound != 'W' && loc[0] + min[0] < 0)                     {obj.paramsVariable.deg = 360 - obj.paramsVariable.deg; obj.rotate(); obj.paramsVariable.lastBound = 'W';}    // obj.paramsVariable.lastBound — Для объектов сложной формы требуется предовтратить многократное отражение от одной и той же границы. Для этого создаются флаги, запоминающие последнюю достигшую границу (Запад, Север, Восток, Юг).
                    else if(obj.paramsVariable.lastBound != 'N' && loc[1] + min[1] < 0)                     {obj.paramsVariable.deg = 540 - obj.paramsVariable.deg; obj.rotate(); obj.paramsVariable.lastBound = 'N';}
                    else if(obj.paramsVariable.lastBound != 'E' && loc[0] + max[0] > universe.spaceSize[0]) {obj.paramsVariable.deg = 360 - obj.paramsVariable.deg; obj.rotate(); obj.paramsVariable.lastBound = 'E';}
                    else if(obj.paramsVariable.lastBound != 'S' && loc[1] + max[1] > universe.spaceSize[1]) {obj.paramsVariable.deg = 540 - obj.paramsVariable.deg; obj.rotate(); obj.paramsVariable.lastBound = 'S';}
                }
                break;
        }
    },



      //////////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция детектирования пересечения окружностей (зон взаимодействия) попарно, занимаемых объектами. /////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getInteractPairs: function(objs){
        let objParams = [];                                                         // Стек нужных для вычисления параметров объектов Вселенной, которые могут участвовать во взаимодействии между собой.
        let pairs = [];                                                             // Пары ключей из массива universe.objects тех объектов, окружности которых пересеклись. 
        // Создание массива свойств объектов вселенной, который будет применен для создания пар взаимодествующих объектов для дальнейшего уточнения столкновений.
        objs.forEach((obj, key) => {
            if(obj.interaction){                                                        // В стек параметров взаимодействующих объектов попадут только те объекты, для которых истино свойство interaction.
                objParams.push({
                    key: key,                                                           // Ключ объекта в стеке объектов Вселенной (universe.objects)
                    id: obj.id,
                    parentId: obj.parentId ? obj.parentId : 0,
                    size: obj.paramsVariable.interactionFieldSize,                      // Размеры поля взаимодействия.
                    loc: obj.paramsVariable.location                                    // Координаты положения центра объекта во Вселенной.
                });
            }
        });
        // Выявление взаимодействующих пар обектов, которые попали в поля (окружности) взаимодействия друг друга.
        objParams.forEach((obj, key) => {
            objParams.forEach((O, K) => {
                if(key != K && obj.id != O.parentId && obj.parentId != O.id){       // Объект не должен сравниваться сам с собой и с родственными себе объектами (потомками, родителями), кроме сравнения потомков (&& O.parentId != obj.parentId).
                    let rSum = (obj.size + O.size) / 2;
                    if(rSum > this.getLengthFromVertices(obj.loc[0], obj.loc[1], O.loc[0], O.loc[1])){  // Сравнение суммы радиусов с гипотенузой, которая является настоящим расстоянием между центрами объектов.  Если реальное расстояние между центрами меньше суммы радиусов, значит произошло пересечение окружностей занимаемых объектами.
                        pairs.push([obj['key'], O['key']]);
                    }
                }
            });
            delete objParams[key];                                                  // Удалить обработанный объект, чтобы не сравнивать его повторно.
        });
        return pairs;
    },



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция детектирования столкновения объектов попарно (детализированное выявление столкновений). Возвращает массив пар индексов universe.objects столкнувшихся объектов. /////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getCollidedPairs: function(interactPairs, uniObjs){
        let collidedPairs = [];

        interactPairs.forEach(pair => {
            switch(uniObjs[pair[0]].paramsConst.formType +'-'+ uniObjs[pair[1]].paramsConst.formType){

                case 'polygon-polygon':
                    let objPair = [];                                                           // Собираемая пара объектов и их параметров.
                    pair.forEach(key => {                                                       // Сбор необходимых для вычисления параметров для каждого объекта из пары.
                        objPair.push({
                            key: key,                                                           // Индекс объекта в стеке объектов Вселенной (universe.objects)
                            loc: uniObjs[key].paramsVariable.location,                          // Координаты положения центра объекта во Вселенной.
                            edges: function(vertices){                                          // Стек граней объекта (пары вершин), которые понадобяться далее для выявления пересечений.
                                let t = [];
                                for(let i = 0; i < vertices.length; i++){
                                    t.push([vertices[i], vertices[(i + 1 >= vertices.length) ? 0 : i + 1]]);
                                }
                                return t;
                            }(uniObjs[key].paramsVariable.vertices)
                        });
                    });
                    if(this.checkCrossEdges(objPair)){
                        collidedPairs.push([pair[0], pair[1]]);
                    }
                    break;

                case 'circle-circle':
                    collidedPairs.push([pair[0], pair[1]]);
                    break;

                case 'circle-polygon':
                case 'polygon-circle':
                    const oPair = {};
                    pair.forEach(index => {
                        oPair[uniObjs[index].paramsConst.formType] = uniObjs[index];
                    });
                    // Проверка пары на пересечение их поверхностей.
                    if(this.checkCrossSurfaces(oPair['polygon'], oPair['circle'])){
                        collidedPairs.push([pair[0], pair[1]]);
                    }
                    break;
            }
        });

        return collidedPairs;
    },



      /////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция детектирования пересечения граней пар полигональных объектов (возвращает true/false). /////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkCrossEdges: function(objPair){
        // Перебор граней обоих объектов и их рассмотрение на предмет пересечения.
        return objPair[0].edges.find(edgeO1 => {
            return objPair[1].edges.find(edgeO2 => {
                // Вершины граней (AB и CD) от первого и второго объекта.
                let Ax = Math.round(edgeO1[0][0] + objPair[0].loc[0]),                       // Значения с плавающей точкой могут внести незначительные флуктуации, которые повлияют на корректность сравнения непараллельных отрезков, поэтому следует округлить значения, жертвуя точностью и прибегая к погрешности в один пиксель.
                    Ay = Math.round(edgeO1[0][1] + objPair[0].loc[1]),
                    Bx = Math.round(edgeO1[1][0] + objPair[0].loc[0]),
                    By = Math.round(edgeO1[1][1] + objPair[0].loc[1]),
                    Cx = Math.round(edgeO2[0][0] + objPair[1].loc[0]),
                    Cy = Math.round(edgeO2[0][1] + objPair[1].loc[1]),
                    Dx = Math.round(edgeO2[1][0] + objPair[1].loc[0]),
                    Dy = Math.round(edgeO2[1][1] + objPair[1].loc[1]);
                let a = (((Bx - Ax) * Ay - (By - Ay) * Ax) / ((Bx - Ax) || 0.0001)) - (((Dx - Cx) * Cy - (Dy - Cy) * Cx) / ((Dx - Cx) || 0.0001));      //  a / b — точка пересечения по оси X.
                let b = (Dy - Cy) / ((Dx - Cx) || 0.0001) - (By - Ay) / ((Bx - Ax) || 0.0001);
                let ABdeg = Math.atan( (Bx - Ax) / (By - Ay) ) * (180 / Math.PI);           // Угол поворота грани относительно осей (-90/90).
                let CDdeg = Math.atan( (Dx - Cx) / (Dy - Cy) ) * (180 / Math.PI);
                if(!(ABdeg % 90)){                                                          // Поскольку угол отражается в рамках медиан (-90 - 0 - 90), то может сложится ситуация, когда прямые, находящиеся под НЕпрямым, но пересекающиеся под равным углом (без учета знака) могут быть приняты за паралелльные, поэтому отбор минуса возможен только для прямых углов и сцелью выявить разнонаправленные параллельные прямые.
                    ABdeg = Math.abs(ABdeg);
                    CDdeg = Math.abs(CDdeg);
                }
                if(ABdeg == CDdeg){                 // Отрезки параллельны?
                    let sameLine = function(){
                        if(!(ABdeg % 90)){          // Отрезки находяться под прямыми углами относительно осей?
                            return ((Ay == By) && (Cy == Dy) && (Ay == Dy)) || ((Ax == Bx) && (Cx == Dx) && (Ax == Dx));    // Проверка, совпадают ли позиции отрезков по любой из осей, т.е., находятся ли они оба на одной вертикальной или горизонтальной линии.
                        }else{
                            return (a == 0 && b == 0);                                                                      // Если делимое и делитель равны 0, отрезки находятся на одной и той же линии.
                        }
                    };
                    if(sameLine()){                 // Находятся ли отрезки на одной линии?
                        let Xmax = Math.max(Ax, Bx, Cx, Dx),
                            Xmin = Math.min(Ax, Bx, Cx, Dx),
                            Ymax = Math.max(Ay, By, Cy, Dy),
                            Ymin = Math.min(Ay, By, Cy, Dy);
                        if(Xmax - Xmin < Math.abs(Bx - Ax) + Math.abs(Dx - Cx) || Ymax - Ymin < Math.abs(By - Ay) + Math.abs(Dy - Cy)) return true; // Суперпозиция (накладываются ли параллельные отрезки друг на друга).
                    }
                }else{
                    let x = a / b;                                                                       // Точка пересечения прямых по оси X.
                    let y = ((By - Ay) * x + (Bx -Ax) * Ay - (By - Ay) * Ax) / ((Bx - Ax) || 0.0001);    // Точка пересечения прямых по оси Y.
                    x = Math.round(x);                                                                   // Значения с плавающей точкой могут внести незначительные флуктуации, которые повлияют на корректность сравнения, когда точка пересечания находится находиться в малом (дробном) диаппазоне значений, поэтому следует округлить.
                    y = Math.round(y);
                    let ABx_cross = (Ax >= x && x >=  Bx) || (Ax <= x && x <= Bx);
                    let CDx_cross = (Cx >= x && x >=  Dx) || (Cx <= x && x <= Dx);
                    let ABy_cross = (Ay >= y && y >=  By) || (Ay <= y && y <= By);
                    let CDy_cross = (Cy >= y && y >=  Dy) || (Cy <= y && y <= Dy);
                    if(ABx_cross && CDx_cross && ABy_cross && CDy_cross) return true;                    // Проверка, лежит ли точка на отрезках (гранях)
                }
            });
        });
    },



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Функция детектирования пересечения поверхностей пар круглых с полигональными объектами (возвращает true/false). /////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkCrossSurfaces: function(polygon, circle){
        let triangles = function(pVtcs, cLoc){                                                                  // Стек треугольников, образующихся при соединении граней полигона с центром окружности.
            let t = [];
            pVtcs.forEach((vertex, k) => {
                let n = (k + 1 >= pVtcs.length) ? 0 : k + 1;
                t.push({
                    A: library.getLengthFromVertices(pVtcs[k][0] + polygon.paramsVariable.location[0], pVtcs[k][1] + polygon.paramsVariable.location[1], cLoc[0], cLoc[1]),
                    B: library.getLengthFromVertices(pVtcs[n][0] + polygon.paramsVariable.location[0], pVtcs[n][1] + polygon.paramsVariable.location[1], cLoc[0], cLoc[1]),
                    C: library.getLengthFromVertices(pVtcs[k][0], pVtcs[k][1], pVtcs[n][0], pVtcs[n][1]),// Основание, которое проверяется на пересечение с окружностью.
                });
                t[k].perimeter = t[k].A + t[k].B + t[k].C;
                t[k].diff = Math.round(t[k].A + t[k].B - t[k].C);                                               // Разница суммы сторон и основания, которая является коррелятом приближенности к центру окружности (чем меньше, тем ближе)
            });
            return t;
        }(polygon.paramsVariable.vertices, circle.paramsVariable.location);
        triangles.sort((a, b) => a.diff - b.diff);                                                              // Сортировка треугольников для последующего отбора треугольника с самой малой разницей суммы сторон и основания, как первый претиндент на столкновение.

        const degC = 180 - Math.acos((Math.pow(triangles[0].A,2) + Math.pow(triangles[0].B, 2) - Math.pow(triangles[0].C, 2)) / (2*triangles[0].A*triangles[0].B)) * 180 / Math.PI; // Вычисление угла противолежащего основанию по формуле: aCos(A²+B²-C²)/(2AB)); требуется для определения расстояния центра окружности до основания, когда высота треугольника выходит за рамки оного (в этом случае высота оказывается некорректной (меньше чем реальное расстояние центра от грани). 
        const h = function(){
            if(degC > 90){
                return Math.min(triangles[0].A, triangles[0].B);                                                // Для случаев, когда высота треугольника выходит за пределы периметра (противолежащий угол > 90 град.) и отражает не реальное расстояние, а меньшее от точки до отрезка (основания), считать высотой наименьшую сторону треугольника. 
            }else{
                const p = 1/2 * triangles[0].perimeter;                                                         // Получение полупериметра треугольника p = 1/2(a+b+c).
                const S = Math.sqrt(p * (p - triangles[0].A) * (p - triangles[0].B) * (p - triangles[0].C));    // Получение площади треугольника образующегося при соединении двух лучей и стороны "с". S=√​(p(p−a)(p−b)(p−c)) — (Формула Герона).
                return 2 * S / triangles[0].C;                                                                  // Вычисление высоты треугольника, опускающуюся на сторону "C".
            }
        }();
        if(h < circle.paramsConst.radius){                                                                      // Если высота треугольника меньше радиуса кругового объекта, считать это пересечением поверхностей объектов, поскольку при этих условиях грань является секущей окружности.
            return true;
        }
        // Если, высота треугольника оказалась больше радиуса, все же может возникнуть ситуация, когда круг, находясь внутри полигона, слишком мал, чтобы задеть своей поверхностью грань полигона. Поэтому следует проверить, находится ли центр круга внутри полигона.
        const cx = document.createElement('canvas').getContext('2d');
        cx.beginPath();
        polygon.paramsVariable.vertices.forEach((vertex, key) => {
            if(key == 0) {cx.moveTo(vertex[0] + polygon.paramsVariable.location[0], vertex[1] + polygon.paramsVariable.location[1]);}
            else         {cx.lineTo(vertex[0] + polygon.paramsVariable.location[0], vertex[1] + polygon.paramsVariable.location[1]);}
        });
        cx.closePath();
        if(cx.isPointInPath(circle.paramsVariable.location[0], circle.paramsVariable.location[1])){
            return true;
        }
    },



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///// Метод ответных процедур на столкновения объектов, изменяющий кинетические параметры столкнувшихся пар объектов. /////    * Предназначен и выполняется точно для круглых и близких к круглым полигональных объектов, но может некорректно вычислять направления разлета для полигональных объектов иных форм.
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    kineticReflexion: function(pair, uniObjs){
        // Сборка параметров, необходимых для вычислений.
        let objs = [];
        pair.forEach(index => {
            objs.push({
                indx:     index,  
                loc:      uniObjs[index].paramsVariable.location,
                spd:      uniObjs[index].paramsVariable.currentSpeed,
                rad:      uniObjs[index].paramsVariable.interactionFieldSize / 2,
                health:   uniObjs[index].paramsVariable.health,
                strength: uniObjs[index].paramsConst.strength,
                weight:   uniObjs[index].paramsConst.weight
            });
        });

        // Решение треугольников образованных векторами скоростей и отрезком соединяющим центры объектов.
        function triangleSolution(){
            let triangles = [{
                    x: objs[1].loc[0] - objs[0].loc[0],     // Катеты треугольника, образованного соединением (гипотинузой) центров объектов
                    y: objs[1].loc[1] - objs[0].loc[1],
                }, {
                    x: objs[0].spd[0],                      // Катеты треугольника, гипотинузой которого является X и Y величины вектора скорости первого объекта из пары.
                    y: objs[0].spd[1],
                }, {
                    x: objs[1].spd[0],                      // Катеты треугольника, гипотинузой которого является X и Y величины вектора скорости второго объекта из пары.
                    y: objs[1].spd[1],
                }];
    
            // Вычисление дополнительных параметров треугольников, таких, как гипотинуза и углы.
            triangles.forEach( triangle => {
                // Расчет величин векторов (гипотенузы треугольника)
                triangle.c = Math.sqrt(triangle.x * triangle.x + triangle.y * triangle.y);
                // Расчет полного угла направления векторов (theta)
                triangle.angleX = triangle.c != 0 ? Math.abs(Math.asin(triangle.x / triangle.c) * 180 / Math.PI) : 0;
                triangle.angleY = triangle.c != 0 ? Math.abs(Math.asin(triangle.y / triangle.c) * 180 / Math.PI) : 0;
                switch(Math.sign(triangle.x || 1) + '' + Math.sign(triangle.y || 1)){    // Принять 0 за положительное число, что эквивалентно условию: ... || 1. Здесь, с помощью знаков значений X и Y, определяется четверть круга, к которому принадлежить вектор. 
                    case '1-1':  triangle.theta = 0   + triangle.angleX; break;
                    case '11':   triangle.theta = 90  + triangle.angleY; break;
                    case '-11':  triangle.theta = 180 + triangle.angleX; break;
                    case '-1-1': triangle.theta = 270 + triangle.angleY; break;
                }
            });
    
            // Определение углов новых векторов скоростей, ообразованых при столкновении.
            [triangles[1], triangles[2]].forEach((trg, key) => {
                let k = key == 0 ? [2, 1] : [1, 2];
                objs[key].newSpeed = {
                    // Получение компонентов скоростей после столкновения (составных частей векторов скорости), где trans - переданный компонент вектора скорости другому объекту, направленный вдоль оси столкновения, а own - собственный вектор скорости, направленный перпендикулярно направлению столкновения.
                    components: {
                        trans: {  
                            angle: Math.acos(Math.sign(Math.cos((triangles[0].theta - triangles[k[0]].theta) * Math.PI / 180)     )) * 180 / Math.PI + triangles[0].theta,      // Угол вектора
                            value: Math.abs(triangles[k[0]].c * Math.cos((triangles[0].theta - triangles[k[0]].theta) * Math.PI / 180))                                         // Величина вектора (гипотинуза)
                        },
                        own: {
                            angle: Math.asin(Math.sign(Math.sin((triangles[0].theta - triangles[k[1]].theta) * Math.PI / 180) * -1)) * 180 / Math.PI + triangles[0].theta,
                            value: Math.abs(triangles[k[1]].c * Math.sin((triangles[0].theta - triangles[k[1]].theta) * Math.PI / 180)),
                        },
                    },
                };
                // Получение значений (X,Y - т.е. катетов) компонентов новых скоростей
                ['trans', 'own'].forEach(type => {
                    objs[key].newSpeed.components[type].vector = [
                        objs[key].newSpeed.components[type].value * Math.sin(objs[key].newSpeed.components[type].angle * Math.PI / 180),          // X
                        objs[key].newSpeed.components[type].value * Math.cos(objs[key].newSpeed.components[type].angle * Math.PI / 180) * -1      // Y
                    ];
                });
            });
        }

        // Учет массы объектов для вычисления новых скоростей. Вычисляется отдельно для каждой оси trans-векторов. 
        function massSpeedCorrection(){
            objs.forEach((obj, key) => {
                obj.newSpeed.components.trans.vmCorr = [
                    (2 * objs[1-key].weight * objs[key].newSpeed.components.trans.vector[0] + objs[1-key].newSpeed.components.trans.vector[0] * (objs[key].weight - objs[1-key].weight)) / (objs[0].weight + objs[1].weight),
                    (2 * objs[1-key].weight * objs[key].newSpeed.components.trans.vector[1] + objs[1-key].newSpeed.components.trans.vector[1] * (objs[key].weight - objs[1-key].weight)) / (objs[0].weight + objs[1].weight)
                ];
            });
        }

        // Сложение компонентов перпендикулярно направленных векторов, чтобы получить значения X и Y единого вектора для каждого из объектов.
        function calcNewSpeedVectors(){
            for (const obj of objs) {
                if( obj.health <= 0 ) continue;     // Если объект уничтожен, для него параметры скорости остаются прежними, чтобы в дальнейшем порожденный объектом эффект вел себя естественным образом, двигаясь дальше по той же траектории. 
                obj.spd[0] = obj.newSpeed.components.trans.vmCorr[0] + obj.newSpeed.components.own.vector[0];
                obj.spd[1] = obj.newSpeed.components.trans.vmCorr[1] + obj.newSpeed.components.own.vector[1];
            }
        }

        triangleSolution();
        massSpeedCorrection();
        calcNewSpeedVectors();
    },



      ////////////////////////////////////////////////////////////////////////////////////////
     ///// Метод негеометрического расчета ответных процедур на столкновения объектов . /////    * Выполняется в случае неестественного поведения при геометрической рефлексии (reflection) полигональных обектов.
    ////////////////////////////////////////////////////////////////////////////////////////
    nonGeomKineticReflexion: function(pair, uniObjs){
        if(uniObjs[pair[0]].paramsVariable.health <= 0 || uniObjs[pair[1]].paramsVariable.health <= 0) return; // Если один из объектов пары уничтожен, то, соответсвенно, и считать уже нечего.
        let m1 = uniObjs[pair[0]].paramsConst.weight,
            m2 = uniObjs[pair[1]].paramsConst.weight,
            v1 = uniObjs[pair[0]].paramsVariable.currentSpeed,
            v2 = uniObjs[pair[1]].paramsVariable.currentSpeed;
        uniObjs[pair[0]].paramsVariable.currentSpeed = [        // V₁ = (2m₂v₂ + v₁(m₁ - m₂)) / (m₁ + m₂);
            (2 * m2 * v2[0] + v1[0] * (m1 - m2)) / (m1 + m2),   // X
            (2 * m2 * v2[1] + v1[1] * (m1 - m2)) / (m1 + m2)    // Y
        ];
        uniObjs[pair[1]].paramsVariable.currentSpeed = [        // V₂ = (2m₁v₁ + v₂(m₂ - m₁)) / (m₁ + m₂).
            (2 * m1 * v1[0] + v2[0] * (m2 - m1)) / (m1 + m2),
            (2 * m1 * v1[1] + v2[1] * (m2 - m1)) / (m1 + m2)
        ];
    },



      ////////////////////////////////////////////////////////////////////////////////
     ///// Метод расчета физических параметров пар объектов после столкновения. /////
    ////////////////////////////////////////////////////////////////////////////////
    physicalImpact: function(pair, objs){
        // Проверка, должна ли взаимодействовать пара исходя из набора игнорируемых моделей в стеках пары специального свойства ignoreModels.
        let ignore = false; 
        [1, 0].forEach((i, k) => {
            if(objs[pair[k]].ignoreModels){
                objs[pair[k]].ignoreModels.forEach(model => {
                    ignore = model == objs[pair[i]].model ? true : ignore;
                });
            }
        })
        if(ignore) return;
        // Расчет физических свойств после взаимодействия. 
        const spdSum = Math.sqrt(                                                                                           // Расчет суммы скоростей пары объектов для дальнейшего вычисления воздействия на их свойство health.
                Math.pow(objs[pair[0]].paramsVariable.currentSpeed[0] - objs[pair[1]].paramsVariable.currentSpeed[0], 2) +
                Math.pow(objs[pair[0]].paramsVariable.currentSpeed[1] - objs[pair[1]].paramsVariable.currentSpeed[1], 2)
            );
        const damage = [                                                                                                    // Расчет величин воздействия на св-во health объектов. (Энергия воздейсвия / прочность противоположного объекта)
            objs[pair[0]].paramsConst.energyСharge
                ? objs[pair[0]].paramsConst.energyСharge    / objs[pair[1]].paramsConst.durability                          // Если для объекта существует параметр енергетической вооруженности (обычно для снарядов).
                : objs[pair[0]].paramsConst.weight * spdSum / objs[pair[1]].paramsConst.durability,                         // Если у объекта нет параметра энерговооруженности, его сила воздействия рассчитывается по массе и скорости.
            objs[pair[1]].paramsConst.energyСharge
                ? objs[pair[1]].paramsConst.energyСharge    / objs[pair[0]].paramsConst.durability
                : objs[pair[1]].paramsConst.weight * spdSum / objs[pair[0]].paramsConst.durability,
        ];
        objs[pair[0]].paramsVariable.health -= damage[1],
        objs[pair[1]].paramsVariable.health -= damage[0]
    }


}



