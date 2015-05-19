var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB();
exports.handler = function(event, context) {
    event.Records.forEach(function(record) {
        // Kinesis data is base64 encoded so decode here
        payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));
        ddb.putItem({
          Item: {
            'timestamp': { 'N': payload['timestamp'] }
          },
          TableName: 'tesla'
        }, function(err, data) {
          if (err) return console.error('Failed to write to dynamo due to %s', err);
          console.log('wrote to dynamo: %s', data);
          context.done();
        });
        console.log('Decoded payload:', payload);
    });
};