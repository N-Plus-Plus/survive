var global = {
    tickSpeed: 200
    , progress: 1
    , popProgress: 0.5
    , cdAmt: 1
    , baseChance: 0.1
    , popChance: 0.005
    , envChance: 0.001
    , max: 100
    , dMulti: 5
    , logLimit: 10
    , notLog: 0.25
}

var lap = {
    scout: { curr: 100, cd: false, done: 0 }
    , zone: `a` // String.fromCharCode(97)
    , loc: {}
    , inv: {}
    , build: { a: {} }
    , pop: { unassigned: 0, scout: 0 }
    , doing: null
}

var res = {
    scout:{
        basic: false
        , prefix: ``
        //, req: { t0: `loc`, t1: `wood`, amt: 1 }
        , max: 100
    }
    , wood: {
        basic: true
        , chanceMod: 2
        , gate: 20
        , prefix: `collect`
        , req: { t0: `loc`, t1: `wood`, amt: 1 }
        , max: 15
    }
    , stone: {
        basic: true
        , chanceMod: 0.5
        , gate: 70
        , prefix: `gather`
        , req: { t0: `loc`, t1: `stone`, amt: 1 }
        , max: 35
    }
    , bone: {
        basic: true
        , chanceMod: 0.1
        , gate: 100
        , prefix: `scavange`
        , req: { t0: `loc`, t1: `bone`, amt: 1 }
        , max: 30
    }
    , metal: {
        basic: true
        , chanceMod: 0.05
        , gate: 150
        , prefix: `salvage`
        , req: { t0: `loc`, t1: `metal`, amt: 1 }
        , max: 150
    }
    , hut: {
        build: true
        , prefix: `build`
        , cost: [ { type: `wood`, amt: 10 } ]
        , req: { t0: `inv`, t1: `wood`, amt: 1 }
        , max: 75
        , popAdd: 1
    }
}

var flav = {
    event: {
        scout: [    `you scout through your bleak and barren surroundings`]
        , pop: [    `a gaunt man arrives, wordlessly avoiding your gaze`
                ,   `a young woman arrives, a prominent burn marring her face`
                ,   `a heavy set man arrives, his once fine clothes in ruin`
                ,   `a hunched figure arrives, their hideskin hood drawn low`
                ,   `a man arrives, a flitting nevousness to his remaining eye`
                ,   `a woman arrives, as thought carrying a great unseen weight`
                ,   `a child arrives, their sooted face streaked by tears`
                ,   `a weary woman arrives, her sunken eyes show resignation`
                ,   `a lithe man arrives, his voice brimming with terror`
                ,   `a short woman arrives, her footfalls slow and deliberate`
                ,   `a withered woman arrives, her expression completely vacant`
                ,   `a starving child arrives, their hands riddled with scars`
                ,   `a broad shouldered woman arrives, sporadically giggling`
                ,   `a gruff man arrives, nursing an injured arm in a sling`
                ,   `a somber woman arrives, gripping a child's frock tightly`
                ,   `a solemn man arrives, his clothing wet with blood`
                ,   `a slender woman arrives, her haunted stare is unsettling`
                ,   `a feeble man arrives, tightly clutching a hand bound tome`
                ,   `a sickly woman arrives, distractedly chewing her lip`
                ,   `a pale woman arrives, her greying hair mottled with ash`
                ,   `a surly man arrives, his expression wracked with hatred`
                ,   `a palid man arrives, his words punctuated with coughs`
                ,   `a timid woman arrives, her gaze never leaving the ground`
                ,   `a nervous woman arrives, her trembling unceasing`
                ,   `a decrpit man arrives, his feet dragging with every step`
            ]
    }
    , get: {
        scout: [    `you scout through your bleak and barren surroundings`]
        , wood: [   `you gather some sturdier looking branches`]
        , stone: [  `you dislodge some usable stone from the dirt`]
        , bone: [   `you recover some gnaw mark addled bone`]
        , metal: [  `you find some mildly weathered scrap metal`]
    }
    , see: {
        wood: [     `a charred husk that must have once been tree`]
        , stone: [  `a patch of grey stone juts through the reddish-brown`]
        , bone: [   `a rib cage protrudes from the surrounding silt`]
        , metal: [  `a glint of metal reflects the red sunlight`]
    }
    , build: {
        hut: [      `it offers a modicum of shelter from the elements`]
    }
    , env: [        `the warm dry wind whips dust this way and that`
            ,       `the bestial howl carries across the barren land`
            ,       `the smell of burnt meat lingers only for a moment`
            ,       `the cracked skin of your palms begins to ache`
            ,       `the heavy clouds give respite from the swolen sun`
            ,       `the shadows dance in the corners of your vision`
            ,       `the stars pulsate and shift in uneasy patterns`
            ,       `the distant red flash is followed by a low rumble`
            ,       `the tracks look fresh though they abruptly stop`
            ,       `the grim vista feels like it is watching you back`
            ,       `the approaching figure was just a trick of the light`
            ,       `the smoke stopped before a source could be found`
            ,       `the ground shakes softly for a moment then no more`
            ,       `the rhythmic thumping is more felt than heard`
            ,       `the howling winds carry with them an uneasy feeling`
            ,       `the eerie silence, alone, permeates the dense fog`
            ,       `the sense of being watched never leaves you entirely`
            ,       `the echoes of manic laughter send chills up your spine`
            ,       `the wretched stench of decay ahead is overwhelming`
            ,       `the sound of footsteps stops when you look back`
            ,       `the etched symbols are not from a language you know`
            ,       `the chittering ebbs, flows, peaks and then is silent`
            ,       `the buzz increases in frequency until it escapes hearing`
            ,       `the whispy clouds cut the night sky into uneven segments`
            ,       `the invisible touch of something crawls along your skin`
            ,       `the fireflies prove to be embers from sources unknown`
            ,       `the cold light of the moon weighs heavily upon you`
            ,       `the scratched pattern twists and turns when unobserved`
            ,       `the terrain around you does not match your recollection`
            ,       `the sharply hissed chants seem to be getting closer`
            ,       `the sizable stain on the dirt is unmistakably blood`
            ,       `the number of shadows does not match the light sources`
            ,       `the long dead grass seems to reach for you as you pass`
        ]
}

var abstract = [
    `none` //0-1
    , `scarce` //1-2
    , `meager` //2-3
    , `few` //3-4
    , `moderate` //4-5
    , `ample` //5-6
    , `abundant` //6-7
    , `plentiful` //7-8
    , `bountiful` //8-9
    , `copious` //9-10
]