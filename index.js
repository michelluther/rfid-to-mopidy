const CardDetector = require('./CardDetector')
const Mopidy = require('mopidy')

let cardDetector = null;

setTimeout(() => {
    cardDetector = new CardDetector();
    const mopidyClient = new Mopidy({
        webSocketUrl: "ws://localhost:6680/mopidy/ws/",
        callingConvention: "by-position-or-by-name"
    })
    const statusMap = {
        playing: 'PLAYING',
        launched_play: 'PLAYING_TRIGGERED',
        paused: 'PAUSED'
    }
    let currentlyActiveCard;
    
    let currentStatus;
    
    let rfidTrackMapping = require('./rfid_to_mopidy_url.json')
    
    
    cardDetector.on('card-detected', (card) => {
        if(!currentlyActiveCard || currentlyActiveCard.getId() !== card.getId()){
            console.log('this is the card that just got detected: ' + card.getId())
            currentlyActiveCard = card;
            playRFIDCard(card)
        } else if(currentStatus !== statusMap.playing && currentlyActiveCard !== statusMap.launched_play){
            status = statusMap.launched_play
            mopidyClient.playback.play({"tl_track":null,"tlid":null}).then(function(data){
                currentStatus = statusMap.playing
                console.log('started playing')
                console.log(data)
            }).catch(reason =>{
                console.log('hey, something went wrong')
            })
        }
    })
    
    cardDetector.on('card-removed', () => {
        if(currentStatus !== statusMap.paused)
            mopidyClient.playback.pause({}).then(function(data){
                currentStatus = statusMap.paused
                console.log('paused playback')
            });
    })
    
    playRFIDCard = (card) => {
        mopidyClient.playback.stop({})
            .then(() => {mopidyClient.tracklist.clear({}).then(() => {
                console.log('tracklist cleared');
                const cardConfig = rfidTrackMapping[card.getId()]
                if(cardConfig){
                    mopidyClient.tracklist.add({"uris":[cardConfig.uri]}).then(() => {
                        console.log('tracklist added')
                    })
                }
            }) })
    }
    
    cardDetector.scanForCards();
}, 1000)

function exitHandler(options, exitCode) {
    cardDetector.resetReader();
    console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));