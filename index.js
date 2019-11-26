const CardDetector = require('./CardDetector')
const Mopidy = require('mopidy')

const cardDetector = new CardDetector();

const mopidyClient = new Mopidy({
    webSocketUrl: "ws://localhost:6680/mopidy/ws/",
    callingConvention: "by-position-or-by-name"
})
const statusMap = {
    playing: 'PLAYING',
    paused: 'PAUSED'
}
let currentlyActiveCard;

let currentStatus;


cardDetector.on('card-detected', (card) => {
    if(!currentlyActiveCard || currentlyActiveCard.getId() !== card.getId()){
        console.log('this is the card that just got detected: ' + card.getId())
        currentlyActiveCard = card;
    }
    if(currentStatus !== statusMap.playing)
        mopidyClient.playback.play({"tl_track":null,"tlid":null}).then(function(data){
            currentStatus = statusMap.playing
            console.log('started playing')
        }).catch(reason =>{
            console.log('hey, something went wrong')
        });
})

cardDetector.on('card-removed', () => {
    if(currentStatus !== statusMap.paused)
        mopidyClient.playback.pause({}).then(function(data){
            currentStatus = statusMap.paused
            console.log('paused playback')
        });
})

cardDetector.scanForCards();