# RFID to Mopidy controller for Raspberry Pi

## Setup and components

This package uses [mfrc522-rpi](https://github.com/firsttris/mfrc522-rpi) for interfacing with a MIFARE RC522 RFID-card reader.

For music playback it communicates via the [Mopidy client](https://github.com/mopidy/mopidy.js) with a [mopidy server](https://docs.mopidy.com/en/latest/).



## How it works

This program connects to a MIFARE RFID-reader and polls the card reader for cards. If a card is detected, a configuration file (`rfid_to_mopidy_url.json`) is read and if there is an entry for that rfid-card, the url configured is sent with the play command to a mopidy server for playback.
If card removal is detected, the pause command is sent to the mopidy server. 

# Configurations

## Installing the service for systemd

store a file with this content under /etc/systemd/system/rfid-to-mopidy.service

````shell
[Unit]
Description=rfid card reader
#Requires=After=mysql.service       # Requires the mysql service to run first

[Service]
ExecStart=/usr/bin/node /opt/rfid_to_mopidy/index.js
# Required on some systems
#WorkingDirectory=/opt/rfid_to_mopidy
Restart=always
# Restart service after 10 seconds if node service crashes
RestartSec=10
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rfid-to-mopidy
#User=<alternate user>
#Group=<alternate group>

[Install]
WantedBy=multi-user.target
````