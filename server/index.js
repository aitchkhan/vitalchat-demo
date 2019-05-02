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
                    .then(() => conversation.playVideo('file:///mcu/assets/media/video.webm'))
                    .then(() => conversation.waitUntil((message) => ConvoController.videoEnd()(message) || ConvoController.recognizeSpeech('stop')(message)))
                    .then(() => conversation.clearMedia())

                    .then(() => conversation.speak('Which of these can I help with?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('menu')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['symptom', 'symptoms'])))

                    .then(() => conversation.speak('What is wrong?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Headache 2. Diarrhea')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['headache', 'headaches', 'diarrhea'])))

                    .then(() => conversation.speak('Question 1 goes here'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('question 1')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['answer', 'answers'])))

                    .then(() => conversation.speak('Question 2 goes here'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('question 2')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['answer', 'answers'])))

                    .then(() => conversation.waitUntil(ConvoController.detect('unattentive')))
                    .then(() => conversation.showImage(imagePath('Pay attention')))
                    .then(() => conversation.waitUntil(ConvoController.detect('attentive')))

                    .then(() => conversation.speak('Your possible issue is Tension Headache. Would you like to see a video about it?'))
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
