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
                    return `https://dummyimage.com/640x360/000000/fff.jpg&text=${encodeURIComponent(text)}`;
                }

                // Try to recognize with in 10 seconds
                await conversation.waitUntil(ConvoController.recognizeFace(), 10000)
                    .then((message) => conversation.speak(`Hello ${message.data.FaceMatches[0].Face.ExternalImageId}`))
                    .catch(() => conversation.speak('Hello there!'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.waitUntil((message) => ConvoController.detect('wave')(message) || ConvoController.recognizeSpeech(['hello', 'hi'])(message)))

                    .then(() => conversation.speak('Which of these can I help with? Please say one of these words.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Symptom Checker 2. Medical Records')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['symptom', 'symptoms'])))

                    .then(() => conversation.speak('Please say one of the following chief complaints.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Headache 2. Diarrhea')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['headache', 'headaches', 'diarrhea'])))

                    .then(() => conversation.speak('Which of the following best describes your pain level?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Extreme 2. Mild to moderate 3. Moderate to severe 4. Pressure or squeezing sensation 5. Stabbing or burning 6. Throbbing')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['extreme', 'mild', 'moderate', 'severe', 'pressure', 'squeezing', 'sensation', 'stabbing', 'burning', 'throbbing'])))

                    .then(() => conversation.speak('Where is the pain located?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Around one eye or radiates from one eye 2. Around your temples 3. On both sides of your head 4. On one side of your head')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['eye', 'temple', 'temples', 'side', 'head'])))

                    .then(() => conversation.speak('How did the pain onset?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Gradual 2. Preceded by a head injury or fall 3. Preceded by frequent use of pain medication 4. Preceded by visual or other sensory disturbances 5. Sudden')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['gradual', 'head', 'injury', 'fall', 'pain', 'medication', 'visual', 'sensory', 'disturbance', 'sudden'])))

                    .then(() => conversation.speak('How often do you get these headaches?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Gradually becomes more frequent 2. Is daily 3. Is often the same time every day')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['frequent', 'daily', 'time', 'every', 'day', 'everyday'])))

                    .then(() => conversation.speak('Is the pain triggered or worsened by any of these?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Change in sleep patterns 2. Chewing 3. Clenching or grinding teeth 4. Everyday activities 5. Hormonal changes 6. Orgasm 7. Poor posture 8. Stress')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['sleep', 'pattern', 'patterns', 'chewing', 'chew', 'clenching', 'clench', 'grinding', 'grind', 'teeth', 'activities', 'activity', 'hormonal', 'orgasm', 'posture', 'stress'])))

                    .then(() => conversation.speak('Does the pain get relieved by any of these?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Lying down in the dark 2. Over-the-counter pain medication 3. Rest')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['lying', 'dark', 'counter', 'pain', 'medication', 'rest'])))

                    .then(() => conversation.speak('Thank you for answering all the questions. It is possible that you have Tension Headache. Would you like to see a video about it?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['yes', 'yep', 'sure'])))

                    .then(() => conversation.playVideo('file:///mcu/assets/media/video.webm'))
                    .then(() => conversation.waitUntil((message) => ConvoController.videoEnd()(message) || ConvoController.recognizeSpeech('stop')(message)))
                    .then(() => conversation.clearMedia())

                    .then(() => conversation.speak('Thank you'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()));
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
