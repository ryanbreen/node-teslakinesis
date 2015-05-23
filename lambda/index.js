var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB();
exports.handler = function(event, context) {
    event.Records.forEach(function(record) {
        // Kinesis data is base64 encoded so decode here
        payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

        //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]

        ddb.putItem({
          Item: {
            'id': { 'S': payload['usersha'] + '_' + payload['timestamp'] },
            'timestamp': { 'N': payload['timestamp'] },
            'speed': { 'N': payload['speed'] && payload['speed'] !== '' ? payload['speed'] : '-1' },
            'odometer': { 'N': payload['odometer'] },
            'soc': { 'N': payload['soc'] },
            'elevation': { 'N': payload['elevation'] },
            'est_heading': { 'N': payload['est_heading'] },
            'est_lat': { 'N': payload['est_lat'] },
            'est_lng': { 'N': payload['est_lng'] },
            'power': { 'N': payload['power'] },
            'shift_state': { 'S': payload['shift_state'] && payload['shift_state'] !== '' ? payload['shift_state'] : 'O' },
            'range': { 'N': payload['range'] },
            'est_range': { 'N': payload['est_range'] },
            'heading': { 'N': payload['heading'] }
          },
          TableName: 'tesla_vehicle_status'
        }, function(err, data) {
          if (err) return context.fail(err);
          console.log('wrote to dynamo: %s', data);
          context.succeed();
        });
    });
};