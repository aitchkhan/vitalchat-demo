const restify = require('restify');
const io = require('socket.io');
const cors = require('cors');
const VitalChat = require('vitalchat');
const ConvoController = require('./ConvoController');

const PORT = parseInt(process.env['PORT']) || 9001;
const VC_SERVER_URL = process.env['VC_SERVER_URL'];

const vitalchat = new VitalChat({
    key: process.env['VC_KEY'],
    secret: process.env['VC_SECRET'],
    baseURL: VC_SERVER_URL,
});

const server = restify.createServer();
server.use(cors());

server.get('/api/create_session', (req, res) => {
    vitalchat.createSession({
        tags: [{ my_id: '1234' }, { reference: '5678' }],
        callback: { url: 'https://myserver.com/vitalchat', user: '', password: '' },
        defaults: { character: 'sally' }
    })
        .then((session) => {
            const conversation = new ConvoController(session);

            session.on('connect', async () => {
                res.send({
                    sessionId: session.getId(),
                    vitalchatBaseURL: VC_SERVER_URL,
                });

                function imagePath(text) {
                    text = text.replace(/\n/gu, '_br_');
                    return `https://imgplaceholder.com/640x360/000?font-size=25&font-family=OpenSans&text=${encodeURIComponent(text)}`;
                }

                // Try to recognize with in 10 seconds
                await conversation.waitUntil(ConvoController.recognizeFace(), 10000)
                    .then((message) => conversation.speak(`Hello ${message.data.FaceMatches[0].Face.ExternalImageId}`))
                    .catch(() => conversation.speak('Hello there!'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.waitUntil((message) => ConvoController.detect('wave')(message) || ConvoController.recognizeSpeech(['hello', 'hi'])(message)))

                    .then(() => conversation.speak('Which of these can I help with? Please say one of these words.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Symptom Checker\n2. Medical Records')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['symptom', 'symptoms'])))

                    .then(() => conversation.speak('Please say one of the following chief complaints.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Headache\n2. Diarrhea')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['headache', 'headaches', 'diarrhea'])))

                    .then(() => conversation.speak('Which of the following best describes your pain level?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Extreme\n2. Mild to moderate\n3. Moderate to severe\n4. Pressure or squeezing sensation\n5. Stabbing or burning\n6. Throbbing')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['extreme', 'mild', 'moderate', 'severe', 'pressure', 'squeezing', 'sensation', 'stabbing', 'burning', 'throbbing'])))

                    .then(() => conversation.speak('Where is the pain located?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Around one eye or radiates from one eye\n2. Around your temples\n3. On both sides of your head\n4. On one side of your head')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['eye', 'temple', 'temples', 'side', 'head'])))

                    .then(() => conversation.speak('How did the pain onset?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Gradual\n2. Preceded by a head injury or fall\n3. Preceded by frequent use of pain medication\n4. Preceded by visual or other sensory disturbances\n5. Sudden')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['gradual', 'head', 'injury', 'fall', 'pain', 'medication', 'visual', 'sensory', 'disturbance', 'sudden'])))

                    .then(() => conversation.speak('How often do you get these headaches?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Gradually becomes more frequent\n2. Is daily\n3. Is often the same time every day')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['frequent', 'daily', 'time', 'every', 'day', 'everyday'])))

                    .then(() => conversation.speak('Is the pain triggered or worsened by any of these?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Change in sleep patterns\n2. Chewing\n3. Clenching or grinding teeth\n4. Everyday activities\n5. Hormonal changes\n6. Poor posture\n7. Stress')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['sleep', 'pattern', 'patterns', 'chewing', 'chew', 'clenching', 'clench', 'grinding', 'grind', 'teeth', 'activities', 'activity', 'hormonal', 'posture', 'stress'])))

                    .then(() => conversation.speak('Does the pain get relieved by any of these?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Lying down in the dark\n2. Over-the-counter pain medication\n3. Rest')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['lying', 'dark', 'counter', 'pain', 'medication', 'rest'])))

                    .then(() => conversation.speak('Thank you for answering all the questions. It is possible that you have Tension Headache. Would you like to see a video about it?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['yes', 'yep', 'sure', 'no'])))
                    .then((message) => {
                        if (ConvoController.recognizeSpeech(['yes', 'yep', 'sure'])(message)) {
                            return conversation.playVideo('file:///mcu/assets/media/video.webm')
                                .then(() => conversation.waitUntil((message) => ConvoController.videoEnd()(message) || ConvoController.recognizeSpeech('stop')(message)))
                                .then(() => conversation.clearMedia())
                                .then(() => new Promise((resolve) => setTimeout(() => resolve(), 3000)));
                        }

                        return Promise.resolve();
                    })
                    .then(() => conversation.speak('Thank you for using the Symptom checker, good bye!'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 2000)))
                    .then(() => session.end());
            });

            session.on('disconnect', () => {
                console.log(session.getId(), 'disconnected');
            });
        })
        .catch((err) => {
            if (err.message) {
                res.send(400, { message: err.message });
            }

            res.send(500, { message: 'Unknown error occurred' });
        });
});

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});

io.listen(server.server);
