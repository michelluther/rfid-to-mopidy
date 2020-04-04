# RFID to Mopidy controller for Raspberry Pi

## Setup and components

This package uses [mfrc522-rpi](https://github.com/firsttris/mfrc522-rpi) for interfacing with a MIFARE RC522 RFID-card reader.

For music playback it communicates via the [Mopidy client](https://github.com/mopidy/mopidy.js) with a [mopidy server](https://docs.mopidy.com/en/latest/).

## How it works

This program connects to a MIFARE RFID-reader and polls the card reader for cards. If a card is detected, a configuration file (`rfid_to_mopidy_url.json`) is read and if there is an entry for that rfid-card, the url configured is sent with the play command to a mopidy server for playback.
If card removal is detected, the pause command is sent to the mopidy server. 

# Configurations

The 