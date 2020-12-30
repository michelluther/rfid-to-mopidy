const CardDetector = require('./CardDetector')
const Mopidy = require('mopidy')
const email = require('./eMail')
const config = require('./config')
const statusIndicator = require('./statusIndicator')

let cardDetector = null;
let mopidyClient = null;
const setUpMopidyClient = () => {

    const returnPromise = new Promise((resolve, reject) => {
        mopidyClient = new Mopidy({
            webSocketUrl: "ws://localhost:6680/mopidy/ws/",
            callingConvention: "by-position-or-by-name",
            
        })
        const onConnected = () => {
            mopidyClient.removeAllListeners('web')
            resolve(mopidyClient)
        }
        mopidyClient.on('websocket:open', onConnected)
        mopidyClient.on('websocket:error', () => {
            reject(mopidyClient)
        })
    })
    return returnPromise
}
const setUpCardDetector = () => {
    cardDetector = new CardDetector();

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
            statusIndicator.displayStatus(statusIndicator.status.playing)
        } else if(currentStatus !== statusMap.playing && currentlyActiveCard !== statusMap.launched_play){
            status = statusMap.launched_play
            mopidyClient.playback.play({"tl_track":null,"tlid":null}).then(function(data){
                statusIndicator.displayStatus(statusIndicator.status.playing)
                currentStatus = statusMap.playing
                console.log('started playing')
                console.log(data)
            }).catch(reason =>{
                console.log('hey, something went wrong')
                statusIndicator.displayStatus(statusIndicator.status.error)
            })
        }
    })
    
    cardDetector.on('card-removed', () => {
        if(currentStatus !== statusMap.paused)
            mopidyClient.playback.pause({}).then(function(data){
                currentStatus = statusMap.paused
                console.log('paused playback')
                statusIndicator.displayStatus(statusIndicator.status.waitingForInput)
            });
    })

    cardDetector.on('long-running-check', () => {
        console.log('it took too long')
        email.sendMessage(config.email.toAddress, 'Kinderzimmermusik ist slow', 'Sooo slow!')
    })

    cardDetector.on('card-detector-broken', () => {
        console.log('card reader does not work')
        statusIndicator.displayStatus(statusIndicator.status.error)
        email.sendMessage(config.email.toAddress, 'Kinderzimmermusik: Kartenlesegerät funktioniert nicht', 'Guck mal nach!')
    })
    
    playRFIDCard = (card) => {
        mopidyClient.playback.stop({})
            .then(() => {mopidyClient.tracklist.clear({}).then(() => {
                console.log('tracklist cleared');
                const cardConfig = rfidTrackMapping[card.getId()]
                if(cardConfig){
                    if(cardConfig.uri.startsWith('m3u:')){
                        mopidyClient.playlists.getPlaylists().then((playLists) => {
                            const playList = playLists.find( ({ name }) => name === 'Beatles' )
                            const trackUris = [];
                            playList.tracks.forEach(track => {
                                trackUris.push(track.uri)
                            })
                            mopidyClient.tracklist.add({"uris": trackUris }).then(trackList => {
                                console.log('playlist added to tracklist')
                            })
                        })
                    } else {
                        mopidyClient.tracklist.add({"uris":[cardConfig.uri]}).then((error) => {
                            console.log('tracklist added')
                            console.log(error)
                        })
                    }
                }
            }) })
    }
    
    cardDetector.scanForCards();
}

function exitHandler(options, exitCode) {
    console.log('cleaning up');
    if(cardDetector){
        cardDetector.resetReader();
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}


statusIndicator.displayStatus(statusIndicator.status.starting)

let intervalId = setInterval(() => {
    try {
        setUpMopidyClient().then(() => {
            setUpCardDetector();
            clearInterval(intervalId)
        }).catch((error) => {
            console.log('connection to mopidy failed, will try again')
        })
    } catch (exc) {
        console.log('could not connect to mopidy, will try again in 1 second')
    }   
},1000)

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));