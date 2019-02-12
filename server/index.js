const cors = require('cors');
const restify = require('restify');
require('dotenv').config();
const VitalChat = require('vitalchat');
const initSpeechEngine = require('./speech-engine');
const SessionController = require('./session-controller');

const PORT = parseInt(process.env['PORT']) || 3000;
const server = restify.createServer();
const io = require('socket.io').listen(server.server);
const WatsonAssistant = require('./watson-assistant');
const store = {};
const assistant = new WatsonAssistant({
    version: '2018-11-08',
    iam_apikey: process.env['WATSON_IAM_APIKEY'],
    url: process.env['WATSON_URL'],
    assistant_id: process.env['WATSON_ASSISTANT_ID']
});

const EMOTIONS = {
    "-1": "NO_EMOTION_DETECTED",
    "0": "EMOTION_NEUTRAL",
    "1": "EMOTION_HAPPY",
}

const HANDGESTURES = {
    "1": "ONE",
    "2": "TWO",
    "3": "THREE",
    "4": "FOUR",
    "5": "FIVE",
    "11": "WAVE",
}

const HEADGESTURES = {
    '0': "NOD_NO",
    '1': "NOD_YES",
    '2': "TILT_RIGHT",
    '3': "TILT_LEFT",
    '4': "LOOK_RIGHT",
    '5': "LOOK_LEFT",
    '6': "LOOK_UP",
    '7': "LOOK_DOWN",
    '8': "LOOK_LEFT_UP",
    '9': "LOOK_LEFT_DOWN",
    '10': "LOOK_RIGHT_UP",
    '11': "LOOK_RIGHT_DOWN",
}
server.get('/create_session', cors(), (req, res) => {
    const client = new VitalChat({
        key: 'test',
        secret: 'dfff6d37-4a7f-4d4d-9d48-14b6e8958ecb',
        baseUrl: 'https://signal-local.vitalchat.com:1443'
    });
    client.createSession({
        tags: [{ my_id: '1234' }, { reference: '5678' }],
        callback: { url: 'https://myserver.com/vitalchat', user: '', password: '' },
        defaults: { character: 'sally' }
    })
        .then((session) => {
            const controller = new SessionController(session);
            session.on('connect', (session_id) => {
                store[session_id] = controller;
                controller.watsonConnectPromise().then(() => {
                    res.send({ session_id });
                }).catch((err) => {
                    console.error(err);
                    res.send(err);
                });
            });
            session.on('disconnect', (session_id) => {
                console.log(session_id, 'disconnected');
                delete store[session_id];
            });
            session.on('message', ({ data, session_id }) => {
                const message = JSON.parse(data);
                controller.onMessage(message);
            })

        })
        .catch((err) => {
            res.send(err);
        });
});

initSpeechEngine(io);

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});
