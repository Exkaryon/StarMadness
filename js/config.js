"use strict";

//////////////////////////////////////////////////////////////////////////////////////////
//█████████████████████████████████████████████████████████████████████████████████//////
//█████  Статичные параметры объектов Вселенной и пользовательские настройки  █████/////
//█████████████████████████████████████████████████████████████████████████████████////
//////////////////////////////////////////////////////////////////////////////////////


const config = {


      //////////////////////////////////
     ///// Модификации космолетов /////
    //////////////////////////////////
    shipMods: {
        ranger: {                                                       // Уникальное идентификационное имя объекта.
            model: 'ranger',                                            // Наименование модели объекта (модификация), характерезующее его уникальные параметры. Свойство повторяет имя своего родителя.
            paramsConst: {                                              // Комплект свойств, которые не меняются во время жизни космолета, но могут быть изменены в процессе его инициализации (создания).
                formType: 'polygon',                                    // Тип фигуры объекта. В зависимости от типа (polygon/circle) применяются разные функции расчета физики и отрисовки при рендеринге.
                weapon: ['plasma', 0],                                  // Базовое оружие данного космолета [модель оружия, % заряда].
                superWeapon: ['rocket', 0],                             // Супер оружие [модель оружия, % заряда].
                reflection: false,                                      // Параметр указывает, меняется ли градус поворота объекта при рикошете от границ вселенной.
                topSpeed: 5,                                            // Максимально возможная скорость, например, х100 метров в секунду.
                rotationSpeed: 3,                                       // Скорость вращения (градусов в секунду). Значение должно делить 360 без остатка.
                weight: 50,                                             // Масса объекта, например, в тоннах. Используется для физики динамических эффектов (энерция, столкновения и т.д.) и для расчета инкремента скорости в методах движения. 
                durability: 1,                                          // Коэффициент прочности корабля от 1 до 10.
                fragmentation: 0,                                       // Фрагменация на осколки при разрушении. Кол-во фрагментов равно от 0 до n. 0 - нет фрагментации. Свойство может отсутствовать.
                texture: {},                                            // Параметры тектуры для объекта. Присваиваются из конфига при инициализации объекта соответсвенно имени объекта. Свойство необязательное и если оно отсутствует, текстура не присваивается.
                sprites: {},                                            // Спрайты для объекта. Присваиваются из конфига спрайтов при инициализации объекта соответсвенно имени объекта. Если свойство отсутствует, спрайты не присваивается и не обрабатываются.
                effects: {                                              // Набор эффектов состоящие из пар: тип эффекта / коллекция идентификационных имен эффектов, которые будут выбираться случайно, если их больше чем один. Свойство может быть пустым, но не может отсутсвтовать!
                    explosions: ['fireBang'],
                },
                muzzleDist: 100,                                        // Расстояние дула оружия от центра космолета (место появления пуль).
                radius: 30,                                             // Для круглых объектов указывается радиус их размера. Св-во игнорируется, если тип формы объекта не circle.
                vertices: [                                             // Координаты вершин объекта X,Y (строго поочередно), описывающие фигуру объекта, которая рефлексивна к другим объектам вселенной. Центром объекта является [0,0]. Св-во игнорируется, если тип объекта не polygon.
                    [0, -41],
                    [23, -5],
                    [30, 42],
                    [-30, 42],
                    [-23, -5] 
                ], 
            }
        },
/*
        predator: {
            model: 'predator',
            paramsConst: {
                formType: 'polygon',
                weapon: ['mine', 0],
                superWeapon: ['rocket', 0],
                reflection: false,
                topSpeed: 2,
                rotationSpeed: 3,
                weight: 100,
                durability: 10,
                texture: {},
                muzzleDist: 100,
                radius: 0,
                vertices: [
/*                     [-20, -53],
                    [0, -25],
                    [20, -53],
                    [25, 1],
                    [30, 42],
                    [-30, 42],
                    [-25, 1] /
/*                     [-20, -53],
                    [0, -25],
                    [20, -53],
                    [30, 42],
                    [-30, 42], /
                    [-20, -80],
                    [0, -85],
                    [20, -80],
                    [20, 80],
                    [-20, 80]
                ],
            },
        }*/
    },



      ////////////////////////////
     ///// Модификации пуль /////
    ////////////////////////////
    bulletMods: {
        plasma: {                                                       // Уникальное идентификационное имя объекта. Плазма - вид circle, имеет свойства обычной корпускулы.
            model: 'plasma',                                            // Наименование модели объекта (модификация), характерезующее его уникальные параметры. Свойство повторяет имя своего родителя.
            paramsConst: {                                              // Комплект свойств, которые не меняются во время жизни пули, но могут быть изменены в процессе ее инициализации (создания).
                formType: 'circle',                                     // Тип фигуры объекта. В зависимости от типа (polygon/circle) применяются разные функции расчета физики и отрисовки при рендеринге.
                reflection: true,                                       // Параметр указывает, меняется ли градус поворота объекта при рикошете от границ вселенной.
                speed: [10, false],                                     // Собственная скорость пули. Второй параметр указывает статичная скорость (false) или вариативная/случайная от 0 до n (true).
                rotationSpeed: 0,                                       // Максимальная скорость вращения в пределах значения которой (от 0 до n) будет случайно выбран параметр вращения при инициализации обекта.
                weight: 1,                                              // Масса объекта, например, в тоннах. Используется для физики динамических эффектов (энерция, столкновения и т.д.) и для расчета инкремента скорости в методах движения. 
                durability: 1,                                          // Коэффициент прочности.
                chargeTime: 60,                                         // Время восполнения заряда в квантах (кол-во итераций 60 ~ 1сек)
                energyСharge: 100,                                      // Энергетическая вооруженность снаряда (деструктивная сила снаряда) измеряемая в единицах health*durability (целостность на коэффициент прочности).
                lifeTime: 160,                                          // Время существования во Вселенной в квантах (кол-во итераций 60 ~ 1сек)
                texture: {},                                            // Параметры тектуры для объекта. Присваеваются из конфига при инициализации объекта. Если свойство отсутствует, текстура не присваивается.
                //sprites: {},                                          // Спрайты для объекта. Присваиваются из конфига при инициализации объекта соответсвенно имени объекта. Если свойство отсутствует, спрайты не присваивается.
                effects: {                                              // Набор эффектов состоящие из пар: тип эффекта / коллекция идентификационных имен эффектов, которые будут выбираться случайно, если их больше чем один. Свойство может быть пустым, но не может отсутсвтовать!
                    explosions: ['miniBangV1', 'miniBangV2'],
                },
                radius: 4,                                             // Для круглых объектов указывается радиус их размера. Св-во игнорируется, если тип формы объекта не circle.
                vertices: [                                             // Для полигональных объектов указываются вершины. Координаты вершин объекта X,Y (строго поочередно). Св-во игнорируется, если тип объекта не polygon.
                    [-40 , -40],
                    [50, -50],
                    [30, 30],
                    [-20, 20],
                ]
            }
        },
        laser: {                                                        // Лазер - линейный вид.

        },
        stone: {                                                        // Камень - полигональный вид или вид окружности.

        },
        mine: {                                                         // Мина - вид окружности.
            model: 'mine',
            paramsConst: {
                formType: 'circle',
                reflection: false,
                speed: [2, false],
                rotationSpeed: 0,
                weight: 1,
                durability: 1,
                chargeTime: 60,
                energyСharge: 100,
                lifeTime: 230,
                //texture: {},
                //sprites: {},
                radius:10,
                //vertices: [
                //    [0, 10],
                //    [10, 0],
                //]
            }
        }
    },



    celestialBodyMods: {
        asteroidStone: {
            model: 'asteroidStone',
            paramsConst: {                                              // Комплект свойств, которые не меняются во время жизни космолета, но могут быть изменены в процессе его инициализации (создания).
                formType: 'circle',                                     // Тип фигуры объекта. В зависимости от типа (polygon/circle) применяются разные функции расчета физики и отрисовки при рендеринге.
                topSpeed: 5,                                            // Максимально возможная скорость, например, х100 метров в секунду.
                rotationSpeed: 3,                                       // Скорость вращения (градусов в секунду). Значение должно делить 360 без остатка.
                weight: 50,                                             // Масса объекта, например, в тоннах. Используется для физики динамических эффектов (энерция, столкновения и т.д.) и для расчета инкремента скорости в методах движения. 
                durability: 1,                                          // Коэффициент прочности корабля от 1 до 10.
                fragmentation: 3,                                       // Фрагменация на осколки при разрушении. Кол-во фрагментов равно от 0 до n. 0 - нет фрагментации. Свойство может отсутствовать.
                //texture: {},                                          // Параметры тектуры для объекта. Присваиваются из конфига при инициализации объекта соответсвенно имени объекта. Свойство необязательное и если оно отсутствует, текстура не присваивается.
                sprites: {},                                            // Спрайты для объекта. Присваиваются из конфига спрайтов при инициализации объекта соответсвенно имени объекта. Если свойство отсутствует, спрайты не присваивается и не обрабатываются.
                effects: {                                              // Набор эффектов состоящие из пар: тип эффекта / коллекция идентификационных имен эффектов, которые будут выбираться случайно, если их больше чем один. Свойство может быть пустым, но не может отсутсвтовать!
                    explosions: ['dustBang'],
                },
                radius: 24,                                             // Для круглых объектов указывается радиус их размера. Св-во игнорируется, если тип формы объекта не circle.
                vertices: [],                                           // Координаты вершин объекта X,Y (строго поочередно), описывающие фигуру объекта, которая рефлексивна к другим объектам вселенной. Центром объекта является [0,0]. Св-во игнорируется, если тип объекта не polygon.
            }
        },
        
        asteroidBrown : {
            model: 'asteroidBrown',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 50,
                durability: 1,
                fragmentation: 5,
                //texture: {},
                sprites: {},
                effects: {
                    explosions: ['dustBrownBang'],
                },
                radius: 24,
                vertices: [], 
            }
        },

        asteroidBlack : {
            model: 'asteroidBlack',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 15,
                durability: 1,
                fragmentation: 2,
                //texture: {},
                sprites: {},
                effects: {
                    explosions: ['dustBlackBang'],
                },
                radius: 13,
                vertices: [], 
            }
        },

        asteroidSteel : {
            model: 'asteroidSteel',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 100,
                durability: 5,
                fragmentation: false,
                //texture: {},
                sprites: {},
                effects: {
                    explosions: ['dustSparksBang'],
                },
                radius: 16,
                vertices: [], 
            }
        },
        
        stoneV1: {
            model: 'stoneV1',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 5,
                durability: 2,
                fragmentation: false,
                sprites: {},
                effects: {
                    explosions: ['dustStoneBang'],
                },
                radius: 6,
                vertices: [], 
            }
        },
        
        stoneV2: {
            model: 'stoneV2',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 5,
                durability: 2,
                fragmentation: false,
                sprites: {},
                effects: {
                    explosions: ['dustStoneBang'],
                },
                radius: 6,
                vertices: [], 
            }
        },

        stoneV3: {
            model: 'stoneV3',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 5,
                durability: 2,
                fragmentation: false,
                sprites: {},
                effects: {
                    explosions: ['dustStoneBang'],
                },
                radius: 6,
                vertices: [], 
            }
        },

        stoneV4: {
            model: 'stoneV4',
            paramsConst: {
                formType: 'circle',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 15,
                durability: 1,
                fragmentation: false,
                sprites: {},
                effects: {
                    explosions: ['dustStoneBang'],
                },
                radius: 10,
                vertices: [], 
            }
        },

        fragment : {
            model: 'fragment',
            paramsConst: {
                formType: 'polygon',
                topSpeed: 5,
                rotationSpeed: 3,
                weight: 20,
                durability: 1,
                fragmentation: false,
                //texture: {},
                sprites: {},
                effects: {
                    //explosions: ['dustCollision'],
                },
                radius: 0,
                vertices: [
                    [0, -41],
                    [30, 42],
                    [-30, 15] 
                ], 
            }
        }
    },



      ////////////////////////////////
     ///// Модификации эффектов /////
    ////////////////////////////////
    effectMods: {
        fireBang: {                                                     // Уникальное идентификационное имя объекта.
            model: 'fireBang',                                          // Наименование модели объекта (модификация), характерезующее его уникальные параметры. Свойство повторяет имя своего родителя.
            visual: true,                                               // Является ли эффект визуальным. Если свойство истинно, то объекту бедет присвоен соответсвующий имени модели спрайт, а рендер создаст соотвествующий объекту слой.
            sound: false,                                               // Является ли эффект звуковым. Если свойство истинно, то объекту бедет присвоен соответсвующий имени модели звук, а рендер проигнорирует создание слоя.
            paramsConst: {                                              // Комплект свойств, которые не меняются во время жизни эффекта, но могут быть изменены в процессе его инициализации (создания).
                lifeTime: 0,                                            // Время существования эффекта во Вселенной в квантах (кол-во итераций 60 ~ 1сек). Если = 0, то время существования устанавливается из расчета кадров спрайта или длины звука (что больше).
                motion: true,                                               // Флаг указывает, что объект может перемещаться, например, наследуя от объекта, который вызывает данный эффект, скорость. 
                textureLifeTime: 5,                                         // Время жизни текстуры в квантах, которая наследуется от объекта источника эффекта, после чего она будет удалена. Если свойство = 0, наследования не просиходит. Данный параметр расчитывается так, чтобы при проигрывании спрайта, исчезновение текстуры было незаметным, то есть, перекрывалось спрайтом.
                sprites: {},                                                // Спрайты для объекта. Присваиваются из конфига спрайтов при инициализации объекта соответсвенно имени объекта. Если свойство отсутствует, спрайты не присваивается и не обрабатываются.
             },
        },

        plasmaBang: {
            model: 'plasmaBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 5,
                sprites: {},
             },
        },

        dustBang: {
            model: 'dustBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 0,
                sprites: {},
             },
        },

        dustBrownBang: {
            model: 'dustBrownBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 0,
                sprites: {},
             },
        },

        dustBlackBang: {
            model: 'dustBlackBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 0,
                sprites: {},
             },
        },

        dustSparksBang: {
            model: 'dustSparksBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 0,
                sprites: {},
             },
        },

        miniBangV1: {
            model: 'miniBangV1',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 2,
                sprites: {},
             },
        },

        miniBangV2: {
            model: 'miniBangV2',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 2,
                sprites: {},
             },
        },

        dustStoneBang: {
            model: 'dustStoneBang',
            visual: true,
            sound: false,
            paramsConst: {
                lifeTime: 0,
                motion: true,
                textureLifeTime: 0,
                sprites: {},
             },
        },

        
    },



      ////////////////////////////////////////////////////////////
     ///// Статичные и регулируемые из лобби параметры игры /////
    ////////////////////////////////////////////////////////////
    gameSettings: {
        gameplay: {                                                     // Настройки игры.
            boundaryBehavior: 'rebound',                                    // Поведение объектов Вселенной при выходе за пределы пространства (контейнера). Установлено значение по умолчанию. Регулируется из лобби. rebound — отскок от границы. teleport — перенос на противоположную сторону.
            respawnTime: [180, 180],                                        // Время смены модели на следующую в квантах (итерациях) [таймаут, время индикации перерождения].
            timers: {                                                       // Таймеры и задержки.
                respawnTimeout: 120,                                            // Время задержки перед возраждением пользовательских объектов (космолетов).
                respawnIndication: 180,                                         // Время индикации (мигания) пользовательского объекта после возраждения.
                winnerTextTimeout: 240,                                         // Задержка появления текста победителя после того, как другие игроки утратили свой флот (время показа текста равно разнице stopGameplayTimeout - winnerTextTimeout).
                stopGameplayTimeout: 300,                                       // Задержка перед остановкой геймплея после того, как другие игроки утратили свой флот.
            },
            players: 2,                                                     // Количество игроков. Установлено значение по умолчанию.
            ships: 2,                                                       // Кораблей в партии. Установлено значение по умолчанию. Регулируется из лобби.
            celestialBodies: [2, 2],                                        // Количество небесных тел при старте геймплея [min, max].
            pauseKey: 'Escape',                                             // Код клавиши паузы геймплея.
        },
        players: [                                                      // Настройки игроков. Количество элементов массива определяет максимальное кол-во игроков.
            {
                active: true,                                               // Участвует игрок в игре (true) или нет (false). Установлено значение по умолчанию. Регулируется из лобби.
                color: '#f90',                                              // Отличительный цвет игрока.
                captain: 'Player 1',                                        // Имя игрока. Установлено значение по умолчанию. Регулируется из лобби.
                shipMods: [],                                               // Набор имен кораблей ['ranger', 'predator', ...]. Первичное значение устанавливается и регулируется из лобби.
                driverType: 'human',                                        // Игрок - человек или AI (human/ai). Установлено значение по умолчанию. Регулируется из лобби.
                controls: {                                                 // Клавиши управления и статус активности [Двигатель, поворот влево, вправо, стрельба].
                    engine:  ['ArrowUp',   'impulse'],                      // Имя действия: [клавиша управления, имя метода, *статус активности]  * - флаг, назначаемый при инициализации космолета и изменяемый по клавишам контроля.
                    left:    ['ArrowLeft', 'rotate'],
                    right:   ['ArrowRight','rotate'],
                    strike:  ['Space',     'strike'],
                },
            },
            {
                active: true,
                color: '#059',
                captain: 'Player 2',
                shipMods: [],
                driverType: 'ai',
                controls: {
                    engine:  ['KeyW', 'impulse'],
                    left:    ['KeyA', 'rotate'],
                    right:   ['KeyD', 'rotate'],
                    strike:  ['ControlLeft', 'strike'],
                },
            },
            {
                active: false,
                color: '#0f0',
                captain: 'Player 3',
                shipMods: [],
                driverType: 'ai',
                controls: {
                    engine:  [null, 'impulse'],
                    left:    [null, 'rotate'],
                    right:   [null, 'rotate'],
                    strike:  [null, 'strike'],
                },
            },
            {
                active: false,
                color: '#00f',
                captain: 'Player 4',
                shipMods: [],
                driverType: 'ai',
                controls: {
                    engine:  [null, 'impulse'],
                    left:    [null, 'rotate'],
                    right:   [null, 'rotate'],
                    strike:  [null, 'strike'],
                },
            },
        ],
    },



      ///////////////////////////////////////////////////////////////////////////////////////
     ///// Допустимые опции игры, отображаемые, как в локальном, так и в онлайн лобби. /////
    ///////////////////////////////////////////////////////////////////////////////////////
    lobbySets: {
        commonOptions: {
            players: {                                              // Максимальное количество кораблей в наборе партии (от 1 до установленного значения). 
                title: 'Количество игроков',                        // Наименование опции.
                values: [2,3,4],                                    // Все возможные значения для выбора, однако, маскимально возможное значение = gameSettings.players.length
            },
            ships: {
                title: 'Кораблей в партии',
                values: [1,2,3,4,5],
            },
            boundaryBehavior: {                                     // Поведение объектов Вселенной при выходе за пределы пространства (контейнера). rebound — отскок от границы. teleport — перенос на противоположную сторону.
                title: 'Взаимодействие с границами',
                values: ['rebound', 'teleport'],
                descr:  ['Отскок', 'Телепортация'],
            }
        },
        playersOptions: {
            driverType: {                                           // Тип игрока - пользователь или автомат (human / AI).
                title: 'Управление',
                values: ['human', 'ai'],
                descr:  ['Человек', 'AI'],
            },
            fleetSelector: {                                        // Способ подбора кораблей для игроков.
                title: 'Флот',
                values: ['random', 'selective'],
                descr:  ['Случайно', 'Выборочно'],
            }
        },
    },



      /////////////////////////////////////////
     ///// Текстуры для игровых объектов /////
    /////////////////////////////////////////
    textures: {
        ranger: {
            pic: function(){    // Объект изображения, который будет вставляться в контекст объектов при рендеринге.
                let img = new Image();
                img.src = 'data:image/png;base64,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';
                return img;
            }(),
            size: [54, 90],      // Реальные размеры изображения (нужны для корректного отображения и позиционирования). Желательно, чтобы размеры реальных изображений были нечетными для более точного позиционирования.
        },
        plasma: {
            pic: function(){
                let img = new Image();
                img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAARBAMAAADqGAscAAAAJFBMVEX/AKYAAAD/AKL/AKWAlf90i/9qg/9ifP9bdv/M1P+yv/+Zqv8TN9GXAAAACXRSTlNJADcS/uC2hUYbbLO8AAAAMElEQVQI12OQEGAQF2AQE2AwNWBQUWDgZmDgYmDghCAQGyTCwsCgqsBgZgBUCVQPAD19AmJPXqskAAAAAElFTkSuQmCC';
                return img;
            }(),
            size: [3, 17]      // Реальные размеры изображения (нужны для корректного отображения и позиционирования). Желательно, чтобы размеры реальных изображений были нечетными для более точного позиционирования.
        },
    },



    sprites: {
        ranger: {                   // Набор спрайтов для модели объекта, соответсвующий его имени. 
            engine: {                   // Имя сета в наборе, который соответсвует активному действию объекта. Если у объекта одно возможное действие, то принято называть его singular.
                defaultActive: false,       // Флаг, указывающий, нужно ли обрабатывать спрайт по умолчанию, то есть без предварительных указаний.
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 8,                  // Количество кадров в спрайте, которое будет проиграно за цикл. 
                single: false,              // Свойство указывает, является ли спрайт однокадровым. Если true, спрайт будет проигран равное frames раз без смещения изображения спрайта.
                size: [25, 400],            // Размеры спрайта [x, y].
                frameSize: [25, 50],        // Размеры кадра спрайта.
                offset: [0, 60],            // Величины смещения спрайта рассчитываемые от его центра относительно центра холста.
                interval: 2,                // Интервал анимации в квантах (кадрах), то есть задержка перед сменой кадра. 0 или 1 - нет интервала. Большие значения могут вызывать задерку старта анимации <= интервалу.
                loop: true,                 // Зацикленная анимация - true, разовая - false.
            },

            rotatorRight: {
                defaultActive: false,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAANCAMAAADCBP1IAAAAQlBMVEUAAAD+///9/v/9/v///f7////+///9/v/+/////////v/////+//////7//v/////////////////////+///////rbNZSAAAAFnRSTlMABQgKAxMQDRchHSkbPSQ1MGJGWFBN9GnMcwAAALVJREFUKM+l0usOgyAMhmFBpBY8Td393+o+a4HFhLjDk2y/fNdRbH7l4MsATHEb6NPW2lZZqMZvv46CvO+U955I4tpkZ2zruz4w84RPCMPQw5mivcQDHgjyxVNcZlgOMcapxHkw5diZhvdHsm37c13XcUSuLeI8uEyWWrZtOMI8FnOKUafBILGcGc5YYTkgxz3+/olBcq2PFvKZ6xfUEmHP2mEs0GVjn70ccmmqflX3nNCF/eMFl8kKxkq2RzUAAAAASUVORK5CYII=';
                    return img;
                }(),
                frames: 3,
                single: true,
                size: [25, 400],
                frameSize: [60, 15],
                offset: [49, -12],
                interval: 1,
                loop: false,
            },

            rotatorLeft: {
                defaultActive: false,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAANCAMAAADCBP1IAAAAP1BMVEUAAAD9/v///f7+/v/////9/v/////////+/////////v/+/v////7//////////v7////////////+//////+3QpYGAAAAFXRSTlMABgQKEg0hFhAmHRs9MWIrNkZYUE03Lj0dAAAArklEQVQoz72SwRKDIAxEFQ0SkALa///WLqEZy8GO48E3jCdfdpYwGDDcBe4IDI5wR55+kWngslx1IudmxTlqY3TUH/lrk9gLCMF72/DL7PCDOZEBVIl2nczMKUWQc46R2frgcUDoZehqq9zs6q5rKeW9b9tL2S3kozQBuCoHTZbg9SCnlNia7ra7zqICFtA7SPG21q6z2Jos2W0CvkTTeLK0vrNSV3PxkSgDhAf5AJscCYUx4TxcAAAAAElFTkSuQmCC';
                    return img;
                }(),
                frames: 3,
                single: true,
                size: [25, 400],
                frameSize: [60, 15],
                offset: [-49, -12],
                interval: 1,
                loop: false,
            }
        },


        fireBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/fire_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [192, 3840],
                frameSize: [192, 192],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        plasmaBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/plasma_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [192, 3840],
                frameSize: [192, 192],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        dustBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/dust_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [96, 1920],
                frameSize: [96, 96],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        dustBrownBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/dust_brown_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [110, 2200],
                frameSize: [110, 110],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        dustBlackBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/black_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [76, 1520],
                frameSize: [76, 76],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        dustSparksBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/dust_sparks_bang.png';
                    return img;
                }(),
                frames: 20,
                single: false,
                size: [96, 1920],
                frameSize: [96, 96],
                offset: [0, 0],
                interval: 2,
                loop: false,
            }
        },

        miniBangV1: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 13,
                single: false,
                size: [26, 416],
                frameSize: [26, 32],
                offset: [0, 0],
                interval: 1,
                loop: false,
            } 
        },

        miniBangV2: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 13,
                single: false,
                size: [26, 416],
                frameSize: [26, 32],
                offset: [0, 0],
                interval: 1,
                loop: false,
            } 
        },

        asteroidStone: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/asteroid_stone.png';
                    return img;
                }(),
                frames: 31,
                single: false,
                size: [64, 1984],
                frameSize: [64, 64],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        asteroidBrown: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/asteroid_brown.png';
                    return img;
                }(),
                frames: 31,
                single: false,
                size: [64, 1984],
                frameSize: [64, 64],
                offset: [0, 0],
                interval: 4,
                loop: true,
            } 
        },

        asteroidBlack: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/black.png';
                    return img;
                }(),
                frames: 23,
                single: false,
                size: [34, 874],
                frameSize: [34, 38],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        asteroidSteel: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/asteroid_steel.png';
                    return img;
                }(),
                frames: 29,
                single: false,
                size: [36, 928],
                frameSize: [36, 32],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        stoneV1: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 23,
                single: false,
                size: [16, 460],
                frameSize: [16, 20],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },
        
        stoneV2: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 23,
                single: false,
                size: [20, 460],
                frameSize: [20, 20],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        stoneV3: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'data:image/png;base64,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';
                    return img;
                }(),
                frames: 23,
                single: false,
                size: [20, 460],
                frameSize: [20, 20],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        stoneV4: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/stone_v4.png';
                    return img;
                }(),
                frames: 23,
                single: false,
                size: [28, 690],
                frameSize: [28, 30],
                offset: [0, 0],
                interval: 3,
                loop: true,
            } 
        },

        dustStoneBang: {
            singular: {
                defaultActive: true,
                pic: function(){
                    let img = new Image();
                    img.src = 'images/stone_bang.png';
                    return img;
                }(),
                frames: 12,
                single: false,
                size: [64, 768],
                frameSize: [64, 64],
                offset: [0, 0],
                interval: 2,
                loop: false,
            } 
        }

    }


}

