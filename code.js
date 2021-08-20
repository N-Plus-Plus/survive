document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener(`mousedown`, function (e) { clicked( e.target, false ) } );


function onLoad(){
    buildUI();
    buildSi();
    setInterval(() => {
        tick();
    }, global.tickSpeed );
}


function clicked( e ){ // CHECK FOR CD ON SCOUT TOO
    if( e.classList.contains( `bar` ) ){
        let x = e.getAttribute(`data-bar`);
        if( x == `scout` ){
            if( !lap.scout.cd ){ lap.doing = `scout`; }
        }
        else if( !lap.inv[x].cd ){
            if( netAmt( x, true ) > 0 ){
                lap.doing = x;
            }
        }
    }
    else if( e.parentElement.classList.contains( `button` ) ){
        buildThis( e.parentElement.getAttribute(`data-type`) );
    }
    else if( e.classList.contains(`barButton`) ){
        let dir = e.getAttribute(`data-dir`);
        if( dir == `up` ){ assignPop( `unassigned`, e.getAttribute(`data-up`) ) }
        else if( dir == `down` ){ assignPop( e.getAttribute(`data-down`) ) }
    }
}

function tick(){
    if( Math.random() < global.envChance ){
        let n = Math.floor( Math.random() * flav.env.length );
        newLog( flav.env[n] );
    }
    if( netPop() > 0 ){ doPop( false ); }
    progress();
}

function progress(){
    for( p in lap.pop ){
        let proc = true;
        let t = null, u = null;
        if( p == `unassigned` ){ proc = false; }
        else if( p == `scout` ){ t = lap.scout; }
        else{ 
            if( netAmt( p, true, false ) < 1 ){ proc = false; }
            t = lap.inv[p];
            u = lap.loc[p];
        }
        if( proc ){
            // calc
            let amt = global.popProgress * lap.pop[p];
            let y = res[p].max + ( t.done * global.dMulti );
            let per = ( y - t.curr ) / y * 100;
            if( lap.doing == p ){ amt += global.progress; }            
            if( t.cd ){
                let n = document.querySelector(`[data-bar=${p}]`);
                let c = res[p].max + ( global.dMulti * ( u == null ? t.done : u.done ) );
                if( t.curr < c ){
                    let per = ( c - t.curr ) / c * 100;
                    t.curr += global.cdAmt + amt;
                    n.children[0].style.width = `${per}%`;
                }
                else{
                    n.children[0].style.width = `0%`;
                    t.cd = false;
                }
            } // cooldown
            else if( t.curr < 0 ){
                t.curr = 0;
                t.cd = true;
                t.done++;
                if( u !== null ){ u.done++ }
                if( lap.doing == p ){
                    newLog( flav.get[p] );
                    lap.doing = null;
                }
                if( p !== `scout` ){ addResource( p, false, 1, false ); }
                document.querySelector(`[data-bar=${p}]`).children[0].style.width = `100%`;
                makeCooldown( p, true );
            }
            else{
                makeCooldown( p, false );
                t.curr -= amt;
                if( p == `scout` ){ scout( lap.doing == `scout` ); }
                document.querySelector(`[data-bar=${p}]`).children[0].style.width = `${per}%`;
            } // do
        }
    }
}

function makeCooldown( type, on ){
    let n = document.querySelector(`[data-bar=${type}]`);
    if( on ){
        n.children[0].classList.add(`cooldown`);
        n.classList.add(`unavailable`);
    }
    else{
        n.children[0].classList.remove(`cooldown`);
        n.classList.remove(`unavailable`);
    }
}

function scout(){
    for( key in res ){
        if( res[key].basic ){
            if( lap.scout.curr - global.max > res[key].gate ){
                let n = Math.random();
                if( n < global.baseChance * res[key].chanceMod ){
                    addResource( key, true, 1, false );
                }
            }
        }
    }
}

function doPop( certainty ){
    let nonce = Math.random();    
    if( certainty ){ nonce = 0; }
    if( nonce < global.popChance * netPop() ){
        lap.pop.unassigned++;
        let n = Math.floor( Math.random() * flav.event.pop.length );
        newLog( flav.event.pop[n] );
        updatePop();
    }
}

function buildThis( type ){
    let afford = true;
    for( i in res[type].cost ){
        if( netAmt( res[type].cost[i].type, false ) < res[type].cost[i].amt ){ afford = false; }
    }
    if( afford ){
        for( i in res[type].cost ){
            addResource( res[type].cost[i].type, false, res[type].cost[i].amt, true );
            if( lap.build[lap.zone] == undefined ){ lap.build[lap.zone] = {}; }
            if( lap.build[lap.zone][type] == undefined ){ lap.build[lap.zone][type] = 0; }
            lap.build[lap.zone][type]++;
            newLog( flav.build[type] );
            updateStock();
        }
    }    
    doUnlock();
    updatePop();
}

function addResource( type, locale, amount, sub ){
    if( lap.loc[type] == undefined ){ lap.loc[type] = { gained: 0, lost: 0, done: 0 }; }
    if( lap.inv[type] == undefined ){ lap.inv[type] = { gained: 0, lost: 0, done: 0, curr: res[type].max }; }
    if( lap.pop[type] == undefined ){ lap.pop[type] = 0; }
    if( amount == undefined ){ amount = 1; }
    if( locale ){
        lap.loc[type].gained += amount;
        if( netAmt( type, true ) == 1 && locale ){ newLog( flav.see[type] ); }
    }
    else{
        if( sub ){ lap.inv[type].lost += amount; }
        else{
            lap.inv[type].gained += amount;
            lap.loc[type].lost += amount;
        }
    }
    updateStock();
    doUnlock();
}

function updateStock(){
    for( key in res ){
        if( lap.loc[key] !== undefined ){
            let x = document.querySelector(`[data-locstock=${key}]`);
            if( x !== null ){
                x.classList.remove( `noDisplay` );
                x.children[1].innerHTML = nicify( abstract[ netAmt( key, true, true ) ] );
            }
        }
        if( lap.inv[key] !== undefined ){
            let x = document.querySelector(`[data-invstock=${key}]`);
            if( lap.inv[key].gained > 0 ){
                x.classList.remove( `noDisplay` );
                x.children[1].innerHTML = abbrevNum( netAmt( key, false, false ) );
            }
        }
        if( lap.build[lap.zone][key] !== undefined ){
            let x = document.querySelector(`[data-buistock=${key}]`);
            if( lap.build[lap.zone][key] > 0 ){
                x.classList.remove( `noDisplay` );
                x.children[1].innerHTML = abbrevNum( lap.build[lap.zone][key] );
            }
        }
    }
}

function updatePop(){
    let x = popTotal();
    let z = netPop();
    let y = x + z;
    document.querySelector(`#pop`).classList.remove(`noDisplay`);
    document.querySelector(`#pop`).children[1].innerHTML = abbrevNum( x ) + ` / ` + abbrevNum( y );
    let t = document.querySelectorAll(`[data-tally]`);
    for( let i = 0; i < t.length; i++ ){
        let e = t[i].getAttribute(`data-tally`);
        t[i].innerHTML = lap.pop[e] == undefined ? 0 : lap.pop[e];
    }
    t = document.querySelectorAll(`[data-up]`);
    if( lap.pop.unassigned > 0 ){
        for( let i = 0; i < t.length; i++ ){ t[i].classList.remove(`locked`) }
    }
    else{ for( let i = 0; i < t.length; i++ ){ t[i].classList.add(`locked`) } }
    t = document.querySelectorAll(`[data-down]`);
    for( let i = 0; i < t.length; i++ ){
        let e = t[i].getAttribute(`data-down`);
        if( lap.pop[e] > 0 ){ t[i].classList.remove(`locked`) }
        else{ t[i].classList.add(`locked`) }
    }
    doUnlock();
}

function netAmt( type, locale, abs ){
    let o = 0;
    if( locale ){ o = lap.loc[type].gained - lap.loc[type].lost; }
    else{ o = lap.inv[type].gained - lap.inv[type].lost; }
    if( abs ){ 
        if( o == 0 ){}
        else{ o = Math.max( 0, Math.min( 9, Math.ceil( Math.pow( o / 10, global.notLog ) ) ) ); } }
    return o;
}

function netPop(){
    let o = 0;
    for( i in lap.build[lap.zone] ){
        if( res[i].popAdd !== undefined ){
            o += lap.build[lap.zone][i];
        }
    }
    o -= popTotal();
    return o;
}

function popTotal(){
    let n = 0;
    for( i in lap.pop ){ n += lap.pop[i]; }
    return n;
}

function assignPop( from, to ){
    if( to == undefined ){ to = `unassigned`; }
    if( lap.pop[from] > 0 ){
        lap.pop[from]--;
        lap.pop[to]++;
        updatePop();
    }
}

function stockDiv( type, amount, cat ){
    let o = document.createElement(`div`);
    o.classList = `stockRow`;
    o.setAttribute(`data-${cat}Stock`, type);
    o.innerHTML = `<div class="stockTitle">${nicify(type)}</div><div class="stockAmount">${amount}</div>`
    return o;
}

function barDiv( type, hidden ){
    let o = document.createElement(`div`);
    o.classList = `bar ${ hidden ? 'noDisplay' : '' }`;
    o.setAttribute( `data-bar`, type );
    o.setAttribute( `data-type`, type );
    o.innerHTML = `<div class="barFill" style="width: 0%;"></div>
        <div class="barLabel">${type !== `scout` ? nicify( res[type].prefix ) + ` ` : ``}${nicify( type )}</div>
        <div class="barBox noDisplay" data-pop=${type}>
            <div class="barButton locked" data-down=${type} data-dir="down">-</div>
            <div class="barTally" data-tally=${type}>0</div>
            <div class="barButton" data-up=${type} data-dir="up">+</div>
        </div>`
    return o;
}

function buttonDiv( type, hidden ){
    let o = document.createElement(`div`);
    o.classList = `button ${ hidden ? 'noDisplay' : '' }`;
    o.setAttribute( `data-button`, type );
    o.setAttribute( `data-type`, type );
    let innards = ``;
    for( i in res[type].cost ){
        innards += `<div class="ttRow">${nicify( res[type].cost[i].type )}: ${abbrevNum( res[type].cost[i].amt )}</div>`;
    }
    o.innerHTML = `<div class="ttHover"><div class="tooltip">${innards}</div></div>${nicify( type )}`;
    return o;
}

function logDiv( x ){
    let o = document.createElement(`div`);
    o.classList = `log`;
    o.innerHTML = x;
    return o;
}

function buildUI(){
    document.querySelector(`#bars`).appendChild( barDiv( `scout`, false ) );
    for( r in res ){
        if( res[r].basic || res[r].crafted ){
            document.querySelector(`#loc`).appendChild( stockDiv( r, 0, `loc` ) );
            document.querySelector(`#loc`).lastChild.classList.add( `noDisplay` );
            document.querySelector(`#inv`).appendChild( stockDiv( r, 0, `inv` ) );
            document.querySelector(`#inv`).lastChild.classList.add( `noDisplay` );
            document.querySelector(`#bars`).appendChild( barDiv( r, true ) );
        }
        else if( res[r].build ){
            document.querySelector(`#build`).children[1].appendChild( buttonDiv( r, true ) );
            document.querySelector(`#bui`).appendChild( stockDiv( r, 0, `bui` ) );
            document.querySelector(`#bui`).lastChild.classList.add( `noDisplay` );
        }
    }
    doUnlock();
}

function doUnlock(){
    for( key in lap.inv ){
        let ac = res[key].req;
        if( lap[ac.t0][ac.t1] !== undefined ){
            if( lap[ac.t0][ac.t1].gained >= ac.amt ){
                document.querySelector(`[data-bar=${key}]`).classList.remove(`noDisplay`);
            }
        }
    }
    let b = false;
    for( key in res ){
        if( res[key].build ){
            let ac = res[key].req;
            if( lap[ac.t0][ac.t1] !== undefined ){
                if( lap[ac.t0][ac.t1].gained >= ac.amt ){
                    document.querySelector(`[data-button=${key}]`).classList.remove(`noDisplay`);
                    b = true;
                }
            }
        }
    }
    if( b ){
        document.querySelector(`#build`).classList.remove(`noDisplay`);
    }
    if( popTotal() > 0 ){
        let n = document.querySelectorAll(`[data-pop]`);
        for( let i = 0; i < n.length; i++ ){ n[i].classList.remove(`noDisplay`); }
    }
    doLock();
}

function doLock(){
    for( key in res ){
        if( res[key].basic ){
            if( lap.loc[key] == undefined ){}
            else if( netAmt( key, true ) <= 0 ){
                document.querySelector(`[data-bar=${key}]`).classList.add(`locked`);
            }
            else{
                document.querySelector(`[data-bar=${key}]`).classList.remove(`locked`);
            }
        }
        else if( res[key].build ){
            for( i in res[key].cost ){
                if( netAmt( res[key].cost[i].type, false ) < res[key].cost[i].amt ){
                    document.querySelector(`[data-button=${key}]`).classList.add(`locked`);
                }
                else{
                    document.querySelector(`[data-button=${key}]`).classList.remove(`locked`);
                }
            }
        }
    }
}


function newLog( x ){
    document.querySelector(`#log`).appendChild( logDiv( x ) );
    let n = document.querySelector(`#log`).children;
    for( let i = 0; i < n.length; i++ ){
        if( Math.abs( i - n.length ) >= global.logLimit ){ n[i].classList.add(`noDisplay`); } // clean up later
        else if( i + 1 == n.length ){}
        else{ n[i].classList.add(`old`); }
    }
}



/* helper functions */


function titleCase(string) {
    var sentence = string.toString().toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toString().toUpperCase() + sentence[i].slice(1);
    };
    return sentence;
};

function nicify(str) {
    return String(titleCase(str.replaceAll("_", " "))).replaceAll(",", " ");
}

var si = ["", " K", " M", " B", " T"];

function buildSi(){
    var toBe = ["","k","M","B","T","q","Q","s","S","O","D"];
    var times = Math.floor( ( 307 - 15 ) / 3 );
    for( let i = 0; i < times; i++ ){
        var nextLetter = String.fromCharCode( 65 + i - ( Math.floor( i / 26 ) * 26 ) );
        var repeats = Math.floor( i / 26 ) + 2;
        var nextOutput = '"';
        for( let j = 0; j < repeats; j++ ){
            nextOutput += nextLetter;
        }
        nextOutput += '"';
        toBe.push( nextOutput );
    }
    si = toBe;
}

function niceNumber( x ){
    let o = ``;
    if( x < 1000 && x > -1000 ){ o = round(x,2)}
    else if( x < 1000000 && x > -1000000 ){ o = round(x,0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
    else{ o = abbrevNum( x ) };
    return o;
}

function abbrevNum(number){
    let neg = false;
    if( number < 0 ){
        neg = true;
        number = Math.abs( number );
    }
    var tier = Math.log10(number) / 3 | 0;
    if(tier == 0) return number;
    var suffix = si[tier];
    var scale = Math.pow(10, tier * 3);
    var scaled = number / scale;
    return ( neg ? `-` : `` ) + scaled.toPrecision(4) + suffix;
}

function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);  
    value = +value;
    exp = +exp;  
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return NaN;
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}