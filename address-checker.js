/* @flow weak */

/**
 * This code is copyright Resolver and commercially licensed.
 * Using, reproducing, copying and modifying this code is only allowed under explicit permission from Resolver.
 */

'use strict';
const AWS = require('aws-sdk');
const moment = require('moment');

const baseQueryParams = {
    TableName: 'SNSBlacklist',
    //IndexName: 'Index',
    KeyConditionExpression: 'address = :hkey and email_time > :rkey',
    FilterExpression: 'message_type = :mtype or message_type = :mtype2',
    Select: 'COUNT'
};

module.exports.validateEmailAddress = (emailAddress) => {
    //return Promise.resolve(true);

    const documentClient = new AWS.DynamoDB.DocumentClient();

    const now = moment().subtract(1, 'months').valueOf();
    const queryParams = Object.assign({
        ExpressionAttributeValues: {
            ':hkey': emailAddress,
            ':rkey': now,
            ':mtype': 'bounce',
            ':mtype2': 'complaint',
        }
    }, baseQueryParams);

    return new Promise((resolve) => {
        documentClient.query(queryParams, function(err, data) {
            //if dynamo fails, fail open (send email)
            if (err) {
                console.log('dynamo error', err, emailAddress);
                return resolve(true);
            }

            if (data && data.Count) {
                console.log('bounce match', emailAddress);
                return resolve(false);
            }

            console.log('no bounce match', emailAddress);
            return resolve(true);
        });
    });
};