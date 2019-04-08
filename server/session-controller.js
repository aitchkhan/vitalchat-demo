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

module.exports = class SessionController {
    constructor(session) {
        this.watson_session_id = null;
        this.isBotSpeaking = false;
        this.play_video = false;
        this.gesture_recognition = false;
        this.greeting_done = false;
        this.context = {};
        this.session = session;
    }

    watsonConnectPromise() {
        return assistant.createSession().then((watson_session_id) => {
            this.watson_session_id = watson_session_id;
        })

    }

    onMessage(message) {
        switch (message.type) {
            case 'eos':
                this.onEOS();
                break;
            case 'transcript':
                this.onSpeech(message.data.transcript);
                break;
            case 'face_attributes':
                this.onFaceAttributes(message.data);
                break;
            case 'detection':
                this.onDetection(message.data);
                break;
            default:

        }
    }

    onEOS() {
        this.isBotSpeaking = false;
    }

    onSpeech(transcript) {
        if (this.isBotSpeaking) {
            return;
        }

        assistant.message(transcript, this.watson_session_id, this.context)
            .then((response) => {
                console.log('watson', JSON.stringify(response));
                let shouldSpeak = true;
                if (response.output.user_defined && response.output.user_defined.action) {
                    const action = response.output.user_defined.action;
                    switch (action) {
                        case 'GREETING_DONE':
                            this.greeting_done = true;
                            break;
                        case 'PLAY_VIDEO':
                            this.play_video = true;
                            this.session.sendMessage({ type: 'video' });
                            shouldSpeak = false;
                            break;
                        case 'DO_NOTHING':
                            shouldSpeak = false;
                            break;
                        case 'GESTURE_RECOGNITION':
                            console.log("Enabling gesture recognition");
                            this.gesture_recognition = true;
                            this.play_video = false;
                            break;
                    }
                }
                if (shouldSpeak) {
                    const watsonText = response.output.generic[0].text;
                    this.isBotSpeaking = true;
                    this.session.speak(watsonText, 'ssml');
                }
            }).catch((err) => {
                console.error(err);
            });
    }

    onFaceAttributes(data) {
        if (this.isBotSpeaking) {
            return;
        }
        if (data && data.FaceMatches) {
            const username = data.FaceMatches[0].Face.ExternalImageId;
            this.context.username = username;
        }
        if (!this.greeting_done) {
            assistant.message("Hello", this.watson_session_id, this.context).then((response) => {
                const watsonText = response.output.generic[0].text;
                this.greeting_done = true;
                this.isBotSpeaking = true;
                this.session.speak(watsonText, 'ssml');
            }).catch((err) => {
                console.error(err);
            });
        }
    }


    onDetection(data) {
        if (this.isBotSpeaking) {
            return;
        }
        if (this.play_video && data && data.handgesture === 12) {
            this.isBotSpeaking = true;
            assistant.message("Skip the video", this.watson_session_id, this.context).then((response) => {
                const watsonText = response.output.generic[0].text;
                this.play_video = false;
                this.gesture_recognition = true;
                this.session.speak(watsonText, 'ssml');
            }).catch((err) => {
                console.error(err);
            });
        }
        if (data && this.gesture_recognition) {
            if (data.emotion === 1) { // Only when happy
                this.isBotSpeaking = true;
                const emotion = data.emotion;
                const contextWithGesture = Object.assign(this.context, { "gesture": EMOTIONS[emotion.toString()] })
                assistant.message("", this.watson_session_id, contextWithGesture).then((response) => {
                    console.log('watson', JSON.stringify(response));
                    const watsonText = response.output.generic[0].text;
                    this.isBotSpeaking = true;
                    this.session.speak(watsonText, 'ssml');
                }).catch((err) => {
                    console.error(err);
                });
            } else if (data.handgesture === 11) { // Only when waving
                this.isBotSpeaking = true;
                const handgesture = data.handgesture;
                const contextWithGesture = Object.assign(this.context, { "gesture": HANDGESTURES[handgesture.toString()] })
                assistant.message("", this.watson_session_id, contextWithGesture).then((response) => {
                    console.log('watson', JSON.stringify(response));
                    const watsonText = response.output.generic[0].text;
                    this.session.speak(watsonText, 'ssml');
                }).catch((err) => {
                    console.error(err);
                });
            } else if (data.headgesture && data.headgesture !== -1 && data.headgesture !== 0 && data.headgesture !== 1) { // Ignore nod
                this.isBotSpeaking = true;
                const headgesture = data.headgesture;
                const contextWithGesture = Object.assign(this.context, { "gesture": HEADGESTURES[headgesture.toString()] })
                assistant.message("", this.watson_session_id, contextWithGesture).then((response) => {
                    console.log('watson', JSON.stringify(response));
                    const watsonText = response.output.generic[0].text;
                    this.session.speak(watsonText, 'ssml');
                }).catch((err) => {
                    console.error(err);
                });
            }
        }
    }


}
