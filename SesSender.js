const fs = require('fs');
const async = require('async');
const path = require('path');
const AWS = require('aws-sdk');

function SesSender() {
    this.messageQueue = async.queue(this.processClient.bind(this), 1);
}

SesSender.prototype = {
    queue: function(client) {
        this.messageQueue.push(client);
    },

    processClient: function(client, callback) {
        this.sendRaw(client, callback);
    },

    sendRaw: function(client, callback) {
        const ses = new AWS.SES();
        const options = {
            RawMessage: {
                Data: client.data
            },
            Destinations: client.to,
            ConfigurationSetName: 'playground'
        };

        console.log('Attempting to send SES message');
        ses.sendRawEmail(options, function(err, data) {
            if (err) {
                console.error('Error sending SES email', err);
                console.error(err.stack);
                console.log(this.httpResponse && this.httpResponse.body && this.httpResponse.body.toString());
            } else {
                console.log('Successfully sent SES email.', data);
            }
            callback();
        });
    }
};

module.exports = SesSender;
