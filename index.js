const CardDetector = require('./CardDetector')
const Mopidy = require('mopidy')

const cardDetector = new CardDetector();

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
            mopidyClient.tracklist.add({"uris":[rfidTrackMapping[card.getId()].uri]})
        }) })
}

cardDetector.scanForCards();