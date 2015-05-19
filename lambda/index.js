var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB();
exports.handler = function(event, context) {
    event.Records.forEach(function(record) {
        // Kinesis data is base64 encoded so decode here
        payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

        //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]

        ddb.putItem({
          Item: {
            'timestamp': { 'N': payload['timestamp'] },
            'speed': { 'N': payload['speed'] ? payload['speed'] : -1 },
            'odometer': { 'N': payload['odometer'] },
            'soc': { 'N': payload['soc'] },
            'elevation': { 'N': payload['elevation'] },
            'est_heading': { 'N': payload['est_heading'] },
            'est_lat': { 'N': payload['est_lat'] },
            'est_lng': { 'N': payload['est_lng'] },
            'power': { 'N': payload['power'] },
            'shift_state': { 'S': payload['shift_state'] },
            'range': { 'N': payload['range'] },
            'est_range': { 'N': payload['est_range'] },
            'heading': { 'N': payload['heading'] }
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