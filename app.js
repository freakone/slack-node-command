var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const mosca = require('mosca');
const mqtt = require('mqtt');

var slackToken = process.env.SLACK_API_TOKEN;
var rtm = new RtmClient(slackToken);
rtm.start();

let beaconsMap = [{ 'name': 'Green room', 'message': 'is in the green room', 'minor': '10', 'major': '11111' },
{ 'name': 'Lower open-space', 'message': 'is in the lower open-space', 'minor': '3', 'major': '11111' },
{ 'name': 'Coffee machine', 'message': 'is making coffee', 'minor': '11', 'major': '11111' },
{ 'name': 'Kitchen', 'message': 'is in the kitchen', 'minor': '1', 'major': '11111' },
{ 'name': 'Balcony', 'message': 'is in the balcony', 'minor': '7', 'major': '11111' },
{ 'name': 'Upper open-space', 'message': 'is in the upper open-space', 'minor': '2', 'major': '11111' },
{ 'name': 'Entrance (Pałólinas desk)', 'message': 'has just entered the office (Pałólinas desk)', 'minor': '12', 'major': '11111' },
{ 'name': 'Kebab', 'message': 'is in the kebabista room', 'minor': '8', 'major': '11111' },
{ 'name': 'Kazimierza', 'message': 'is in the Kazimierza', 'minor': '5', 'major': '11111' },
{ 'name': 'Fun room', 'message': 'is in the fun room', 'minor': '4', 'major': '11111' },
{ 'name': 'Fishtank', 'message': 'is in the fishtank', 'minor': '14', 'major': '11111' }
]

let usersMap = {}

const server = new mosca.Server({
    port: 11883,
    http: {
        port: 9001,
        bundle: true   
    },
    backend: {
        type: 'mongo',
        url: process.env['MONGO_URL'],
        pubsubCollection: 'ascoltatori',
        mongo: {}
    }
});

server.on('ready', () => {
    client = mqtt.connect('mqtt://localhost:11883');
    client.on('connect', () => {
        client.subscribe('users/+');
    });

    client.on('message', (topic, message) => {
        let split = topic.split('/');
        let id = split[1];
        usersMap[id] = { _id: id, minor: message };
    });

});


rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    if (typeof message.text === 'string') {
        if (message.text.indexOf('.where') === 0 && message.text.match(/<@([A-Z0-9]*)>/i)) {
            var mentionedUser = message.text.match(/<@([A-Z0-9]*)>/i)[1];
            if (usersMap[mentionedUser]) {
                var beacon = usersMap[mentionedUser].minor;
                var localization = beaconsMap.find(function(el) {
                    return el.minor == beacon;
                });
                if (localization) {
                    rtm.sendMessage(`<@${message.user}>: <@${mentionedUser}> ${localization.message}`, message.channel);
                } else {
                    rtm.sendMessage(`<@${message.user}>: Unknown beacon! \`${JSON.stringify(beacon)}\``, message.channel);
                }
            } else {
                rtm.sendMessage(`<@${message.user}>: There is no intel about <@${mentionedUser}>.`, message.channel);
            }
        }
    }
});

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    response.send('locator');
});

app.get('/map', function(request, response) {
    response.json(beaconsMap);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
