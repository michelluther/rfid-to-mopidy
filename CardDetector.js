"use strict";
const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");
const Card = require('./Card')

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log("scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24 // pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522(softSPI)//.setResetPin(22).setBuzzerPin(18);

const CardDetector = function(){

this.notFoundFor = 0;
this.detectionInterval;


this.scanForCards = () => {
  setInterval(()=>{
    console.log('checking ...')
    mfrc522.reset();
    console.log('have reset ...')
    
    let response = mfrc522.findCard();
    console.log('have tried to find a card ...')
    if (!response.status) {
      this.emitNoCard();
      if (this.notFoundFor < 6)
        this.notFoundFor ++;
      return;
    }
    response = mfrc522.getUid();
    if (!response.status) {
      console.log("UID Scan Error");
      if (this.notFoundFor < 6)
        this.notFoundFor ++;
      return;
    }

    this.notFoundFor = 0;
    let card = new Card(response.data);
    this.emit('card-detected', card);
  }, 250);

  },

  this.emitNoCard = () => {
    if(this.notFoundFor === 5){
      this.emit('card-removed')
    }
  },

  this.resetReader = () => {
    mfrc522.reset();
  }
}

CardDetector.prototype = require('events').EventEmitter.prototype;

module.exports = CardDetector