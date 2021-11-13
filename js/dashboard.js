"use strict";

const dashboard = {

    elements: {
        basis: document.querySelector('#gamescreen .dashboard'),
    },

    templates: {
        player: `
            <div data-playernum="{{ playerNum }}">
                <div class="avatar" style="border-color:{{ playerColor }}; box-shadow: 0 0 5px {{ playerColor }} inset"></div>
                <div class="stat">
                    <div class="name">{{ captain }}</div>
                    <div class="progress healt">
                        <div>Healt</div>
                        <div>
                            <div style="width:{{ healt }}%">
                                <div style="background: linear-gradient(90deg, #f00 10%, #f90 40%, #090 100%);">&nbsp;</div>
                            </div>
                        </div>
                    </div>
                    <div class="progress energy">
                        <div>Energy</div>
                        <div>
                            <div style="width:{{ energy }}%; background: #059;">
                                &nbsp;
                            </div>
                        </div>
                    </div> 
                    <div class="fleet">
                        {{ fleet }}
                    </div>
                </div>
            </div>
        `,
        victory: `
            <div class="victory">
                <div>Победа!</div>
                <div>{{ captain }} — <span>красавчик!</span><div>
            </div>
        `,
        draw: `
            <div class="victory">
                <div>Силы оказались равны!</div>
                <div>Вселенная забрала всех!<div>
            </div>
        `,
        pauseBox: `
            <div class="pausebox">
                <div>Пауза</div>
                <button class="blue">В лобби</button>
            </div>
        `,
    },


    init: function(){
        this.elements.players = [];
        this.elements.playersHealt = [];
        this.elements.playersEnergy = [];
        this.elements.playersFleet = [];
        this.builder();  // Генерурется блоки пользователей, а затем выбераются из него элементы.
        this.elements.players = this.elements.basis.querySelectorAll('div[data-playernum]');
        this.elements.players.forEach((element, key) => {
            this.elements.playersHealt[key] = element.querySelector('.healt > div > div');
            this.elements.playersEnergy[key] = element.querySelector('.energy > div > div');
            this.elements.playersFleet[key] = element.querySelector('.fleet');
        });
    },


    builder: function(){
        let playersHTML = '';
        config.gameSettings.players.forEach(player => {
            if(player.active){
                playersHTML += this.templates.player
                            .replace(/{{ playerNum }}/g, player.playerIndex)
                            .replace(/{{ captain }}/g, player.captain)
                            .replace(/{{ healt }}/g, 100)
                            .replace(/{{ energy }}/g, 100)
                            .replace(/{{ playerColor }}/g, player.color)
                            .replace(/{{ fleet }}/g, function(){
                                let shipsList = '';
                                player.shipMods.forEach((mod, k) => {
                                    shipsList += '<div data-mod="'+mod+'" class="'+(!k ? 'active' : '')+'"></div>';
                                });
                                return shipsList;
                            });
            }
        });
        this.elements.basis.insertAdjacentHTML('beforeend', playersHTML);
    },


    update: function(playerIndex, type, value){
        switch(type){
            case 'shipdamage':
                this.elements.playersHealt[playerIndex].style.width = value < 0 ? 0 : value+'%';
                break;
            case 'shipdestroy':
                this.elements.playersFleet[playerIndex].children[0].classList.add('destroyed');
                setTimeout(() => {
                    this.elements.playersFleet[playerIndex].children[0].remove();
                    if(this.elements.playersFleet[playerIndex].children[0]){
                        this.elements.playersFleet[playerIndex].children[0].classList.add('active');
                    }
                }, 1000);
                break;
            case 'gameover':
                this.elements.players[playerIndex].classList.add('gameover');
                break;
            case 'energy':
                this.elements.playersEnergy[playerIndex].style.width = value + '%';
                break;
        }
    },


    showWinner: function(hide){
        if(!hide){
            if(universe.winnerIndex == null){
                this.elements.basis.insertAdjacentHTML('beforebegin', this.templates.draw);
            }else{
                this.elements.basis.insertAdjacentHTML('beforebegin', this.templates.victory.replace(/{{ captain }}/g, config.gameSettings.players[universe.winnerIndex].captain));
            }
            setTimeout(() => {document.querySelector('#gamescreen .victory').classList.add('show');}, 100);
        }else{
            document.querySelector('#gamescreen .victory').remove();
        }
    },



    showPauseBox: function(tumbler){
        if(tumbler){
            this.elements.basis.insertAdjacentHTML('beforebegin', this.templates.pauseBox);
            document.querySelector('#gamescreen .pausebox button').addEventListener('click', function(){
                universe.stopGameplay(true);
                document.removeEventListener('click', universe.stopGameplay);
            })
        }else{
            document.querySelector('#gamescreen .pausebox').remove();
        }
    },


    destroy: function(){
        Array.from(this.elements.basis.children).forEach(elem => {
            elem.remove();
        })
    }

}


