const cors = require('cors');
const restify = require('restify');
require('dotenv').config();
const VitalChat = require('vitalchat');
const initSpeechEngine = require('./speech-engine');

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
            session.on('connect', (session_id) => {
                console.log(session_id, 'connected');
                assistant.createSession().then((watson_session_id) => {
                    store[session_id] = {
                        watson_session_id,
                        context: {},
                        greeting_done: false,
                        gesture_recognition: false,
                        isBotSpeaking: false,
                        play_video: false
                    }
                    res.send({ session_id })
                }).catch((err) => {
                    console.error(err);
                    res.send(err);
                })
            });
            session.on('disconnect', (session_id) => {
                console.log(session_id, 'disconnected');
                delete store[session_id];
            });
            session.on('message', ({ data, session_id }) => {
                const message = JSON.parse(data);
                switch (message.type) {
                    case 'eos':
                        store[session_id].isBotSpeaking = false;
                        break;
                    case 'speech':
                        {
                            if (store[session_id].isBotSpeaking) {
                                return;
                            }
                            const sessionDetails = store[session_id];
                            const { watson_session_id, context } = sessionDetails;
                            assistant.message(message.transcript, watson_session_id, context)
                                .then((response) => {
                                    console.log('watson', JSON.stringify(response));
                                    let shouldSpeak = true;
                                    if (response.output.user_defined && response.output.user_defined.action) {
                                        const action = response.output.user_defined.action;
                                        switch (action) {
                                            case 'GREETING_DONE':
                                                store[session_id].greeting_done = true;
                                                break;
                                            case 'PLAY_VIDEO':
                                                store[session_id].play_video = true;
                                                session.sendMessage({ type: 'video' });
                                                shouldSpeak = false;
                                                break;
                                            case 'DO_NOTHING':
                                                shouldSpeak = false;
                                                break;
                                            case 'GESTURE_RECOGNITION':
                                                console.log("Enabling gesture recognition");
                                                store[session_id].gesture_recognition = true;
                                                store[session_id].play_video = false;
                                                break;
                                        }
                                    }
                                    if (shouldSpeak) {
                                        const watsonText = response.output.generic[0].text;
                                        store[session_id].isBotSpeaking = true;
                                        session.speak(watsonText, 'ssml');
                                    }
                                }).catch((err) => {
                                    console.error(err);
                                });
                        }
                        break;
                    case 'face_attributes':
                        if (store[session_id].isBotSpeaking) {
                            return;
                        }
                        if (message.data && message.data.FaceMatches) {
                            const username = message.data.FaceMatches[0].Face.ExternalImageId;
                            store[session_id].context.username = username;
                        }
                        if (!store[session_id].greeting_done) {
                            const { watson_session_id, context } = store[session_id];
                            assistant.message("Hello", watson_session_id, context).then((response) => {
                                const watsonText = response.output.generic[0].text;
                                store[session_id].greeting_done = true;
                                store[session_id].isBotSpeaking = true;
                                session.speak(watsonText, 'ssml');
                            }).catch((err) => {
                                console.error(err);
                            });
                        }
                        break;
                    case 'detection':
                        if (store[session_id].isBotSpeaking) {
                            return;
                        }
                        if (store[session_id].play_video && message.data && message.data.handgesture === 12) {
                            store[session_id].isBotSpeaking = true;
                            const { watson_session_id, context } = store[session_id];
                            assistant.message("Skip the video", watson_session_id, context).then((response) => {
                                const watsonText = response.output.generic[0].text;
                                store[session_id].play_video = false;
                                store[session_id].gesture_recognition = true;
                                session.speak(watsonText, 'ssml');
                            }).catch((err) => {
                                console.error(err);
                            });
                        }
                        if (message.data && store[session_id].gesture_recognition) {
                            if (message.data.emotion === 1) { // Only when happy
                                store[session_id].isBotSpeaking = true;
                                const emotion = message.data.emotion;
                                const { watson_session_id, context } = store[session_id];
                                const contextWithGesture = Object.assign(context, { "gesture": EMOTIONS[emotion.toString()] })
                                assistant.message("", watson_session_id, contextWithGesture).then((response) => {
                                    console.log('watson', JSON.stringify(response));
                                    const watsonText = response.output.generic[0].text;
                                    store[session_id].isBotSpeaking = true;
                                    session.speak(watsonText, 'ssml');
                                }).catch((err) => {
                                    console.error(err);
                                });
                            } else if (message.data.handgesture === 11) { // Only when waving
                                store[session_id].isBotSpeaking = true;
                                const handgesture = message.data.handgesture;
                                const { watson_session_id, context } = store[session_id];
                                const contextWithGesture = Object.assign(context, { "gesture": HANDGESTURES[handgesture.toString()] })
                                assistant.message("", watson_session_id, contextWithGesture).then((response) => {
                                    console.log('watson', JSON.stringify(response));
                                    const watsonText = response.output.generic[0].text;
                                    session.speak(watsonText, 'ssml');
                                }).catch((err) => {
                                    console.error(err);
                                });
                            } else if (message.data.headgesture && message.data.headgesture !== -1 && message.data.headgesture !== 0 && message.data.headgesture !== 1) { // Ignore nod
                                store[session_id].isBotSpeaking = true;
                                const headgesture = message.data.headgesture;
                                const { watson_session_id, context } = store[session_id];
                                const contextWithGesture = Object.assign(context, { "gesture": HEADGESTURES[headgesture.toString()] })
                                assistant.message("", watson_session_id, contextWithGesture).then((response) => {
                                    console.log('watson', JSON.stringify(response));
                                    const watsonText = response.output.generic[0].text;
                                    session.speak(watsonText, 'ssml');
                                }).catch((err) => {
                                    console.error(err);
                                });
                            }
                        }
                        break;
                }
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
