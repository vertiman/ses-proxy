const SesSender = require('./SesSender.js');
const AddressChecker = require('./address-checker');
const SMTPServer = require('smtp-server').SMTPServer;
const getRawBody = require('raw-body');
const fs = require('fs');

const AWS = require('aws-sdk');

let server;

const createClient = function(to, data) {
    return {
        from: null,
        subject: '',
        to,
        data
    };
};

const startServer = port => {
    server = new SMTPServer({
        secure: false,
        onData: onDataReceived,
        hideSTARTTLS: true,
        authOptional: true
    });
    server.listen(port ? port : 25);

    server.on('error', function(err) {
        console.log('Error starting server on port', port, err.code);
        if (port != 2525 && (err.code == 'EACCES' || err.code == 'EADDRINUSE')) {
            console.log('Trying port 2525');
            startServer(2525);
        } else {
            throw e;
        }
    });
};

const sesSender = new SesSender();
const onDataReceived = (stream, session, callback) => {
    const recipients = [];
    return Promise.all(session.envelope.rcptTo.map(rcptTo => {
        return AddressChecker.validateEmailAddress(rcptTo.address).then(valid => {
            if(valid) recipients.push(rcptTo.address);
        });
    })).then(() => {
        getRawBody(stream).then(buffer => {
            const client = createClient(recipients, buffer);
            sesSender.queue(client);
            callback();
        });
    });
};

const initAWS = (opts) => {
    let credentialsFilePath = './ses-credentials.json';
    if (opts && opts.config) {
        credentialsFilePath = opts.config;
    }

    if (fs.existsSync(credentialsFilePath)) {
        AWS.config.loadFromPath(credentialsFilePath);
    } else if (fs.existsSync(path.join(process.cwd(), credentialsFilePath))) {
        AWS.config.loadFromPath(path.join(process.cwd(), credentialsFilePath));
    } else {
        console.warn('Warning: Can not find credentials file.');
    }
};

let options;
module.exports = function(opts) {
    options = opts;
    initAWS(opts);
    startServer(options.port);
};
