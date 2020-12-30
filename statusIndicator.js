const pwm = require('raspi-pwm')

const led = new pwm.PWM('GPIO18')

let dutyCycle = 0;
let dutyCycleSummand = 0;
let currentInterval = 0;

// let currentInterval = setInterval(() => {
    
//   }, 20);

const statusValues = {
    starting: 'STARTING',
    waitingForInput: 'WAITING',
    playing: 'PLAYING',
    error: 'ERROR'
}

const statusIndicatorConfig = {
    'STARTING': () => {
        dutyCycleSummand = -5;
        if (dutyCycle <= 0) {
            dutyCycle = 255;
        }
        dutyCycle += dutyCycleSummand;
        led.write(dutyCycle / 255);
    },
    'WAITING': () => {
        if (dutyCycle <= 0) {
            dutyCycleSummand = 1;
        } else if(dutyCycle > 75) {
            dutyCycleSummand = -1;
        }
        dutyCycle += dutyCycleSummand;
        led.write(dutyCycle / 255);
    },
    'PLAYING': () => {
        led.write(0.1);
    },
    'ERROR': () => {
        dutyCycleSummand += 10;
        if(dutyCycleSummand > 70){
            dutyCycleSummand = 0;
            if(dutyCycle === 1) dutyCycle = 0;
            else dutyCycle = 1;
        } 
        led.write(dutyCycle );
    }
}

const displayStatus = function(status){
    dutyCycle = 0;
    dutyCycleSummand = 0;
    currentInterval = setInterval(statusIndicatorConfig[status], 20)
}

const stopDisplay = function(){
    clearInterval(currentInterval);
}

displayStatus(statusValues.error)

module.exports = {
    status: statusValues,
    displayStatus: displayStatus
}