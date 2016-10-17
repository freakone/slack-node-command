var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var ArtikCloud = require('artikcloud-js');

var slackToken = process.env.SLACK_API_TOKEN;
var rtm = new RtmClient(slackToken);
rtm.start();

var artikOAuth =  ArtikCloud.ApiClient.instance.authentications['artikcloud_oauth'];
artikOAuth.accessToken =  process.env.ARTIK_OAUTH_TOKEN;
var artikApi = new ArtikCloud.MessagesApi()

function constructOpts(username)
{
  var today = new Date();
  today.setHours(0, 0, 1);

  return {
  'sdid': process.env.ARTIK_DEVICE_ID,
  'filter': `user_name:${username}`,
  'count': 1,
  'startDate': today.getTime(),
  'endDate': new Date().getTime(),
  'order': 'desc'
  };
}

var beaconsMap = [{'name':'is in the green room', 'minor':'14', 'major':'11111'},
{'name':'is in the lower open-space', 'minor':'3', 'major':'11111'},
{'name':'is making coffee', 'minor':'11', 'major':'11111'},
{'name':'is in the kitchen', 'minor':'1', 'major':'11111'},
{'name':'is in the balcony', 'minor':'7', 'major':'11111'},
{'name':'is in the upper open-space', 'minor':'2', 'major':'11111'},
{'name':'has just entered the office (Pałólinas desk)', 'minor':'12', 'major':'11111'},
{'name':'is in the kebabista room', 'minor':'8', 'major':'11111'},
{'name':'is in the Kazimierza', 'minor':'5', 'major':'11111'},
{'name':'is in the fun room', 'minor':'4', 'major':'11111'}
]

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  if(typeof message.text === 'string') {
    if (message.text.indexOf('.where') === 0 && message.text.match(/<@([A-Z0-9]*)>/i)) {
      var mentionedUser = message.text.match(/<@([A-Z0-9]*)>/i)[1];
      artikApi.getNormalizedMessages(constructOpts(mentionedUser), function(error, data, response) {
        if(!error){
          if(data.data.length > 0){
            var beacon = data.data[0].data.beacon;
            var localization = beaconsMap.find(function(el){
              return el.minor == beacon.minor && el.major == beacon.major;
            });
            if(localization){
              rtm.sendMessage(`<@${message.user}>: <@${mentionedUser}> ${localization.name}`, message.channel);
            } else {
              rtm.sendMessage(`<@${message.user}>: Unknown beacon! \`${JSON.stringify(beacon)}\``, message.channel);
            }
          } else {
             rtm.sendMessage(`<@${message.user}>: There is no intel about <@${mentionedUser}>.`, message.channel);
          }
        }
      });
    }
  }
});

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
  response.send('locator');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});