'use strict';
console.log('Loading function');

const aws = require('aws-sdk');
const dynamo = new aws.DynamoDB.DocumentClient({ params: { TableName: 'SNSBlacklist' } });

exports.handler = (event, context, callback) => {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const time = event.Records[0].Sns.Timestamp;

    switch(message.eventType) {
        case 'Bounce':
            handleBounce(message, time, context);
            break;
        case 'Complaint':
            handleComplaint(message, time, context);
            break;
        case 'Delivery':
            handleDelivery(message, time, context);
            break;
        default:
            callback(`Unknown notification type: ${message.notificationType}`);
    }
};

function handleBounce(message, time, context) {
    const messageId = message.mail.messageId;
    const addresses = message.bounce.bouncedRecipients.map((recipient) => stripBracketsOffEmailAddress(recipient.emailAddress));
    const bounceType = message.bounce.bounceType;

    addresses.forEach(address => {
        const dynamoPayload = {
            type: 'bounce',
            messageId, address, bounceType, time
        };

        dynamo.put({Item : dynamoPayload}, function(err, data) {
            if (err) {
                context.fail(err);
            } else {
                console.log(data);
                context.succeed();
            }
        });
    });

    console.log(`Message ${messageId} bounced when sending to ${addresses.join(', ')}. Bounce type: ${bounceType}`);
}

function handleComplaint(message, time, context) {
    const messageId = message.mail.messageId;
    const addresses = message.complaint.complainedRecipients.map((recipient) => recipient.emailAddress);

    const dynamoPayload = {
        type: 'complaint',
        messageId, addresses, time
    };

    dynamo.put({Item : dynamoPayload}, function(err, data) {
        if (err) {
            context.fail(err);
        } else {
            console.log(data);
            context.succeed();
        }
    });

    console.log(`A complaint was reported by ${addresses.join(', ')} for message ${messageId}.`);
}

function handleDelivery(message, time, context) {
    const messageId = message.mail.messageId;
    const deliveryTimestamp = message.delivery.timestamp;
    const addresses = message.mail.destination;

    const dynamoPayload = {
        type: 'complaint',
        addresses, messageId, time, deliveryTimestamp
    };

    dynamo.put({Item : dynamoPayload}, function(err, data) {
        if (err) {
            context.fail(err);
        } else {
            console.log(data);
            context.succeed();
        }
    });

    console.log(`Message ${messageId} was delivered successfully at ${deliveryTimestamp}.`);
}

const stripBracketsOffEmailAddress = function (emailAddress) {
    return emailAddress.substring(1, emailAddress.length -1);
};
