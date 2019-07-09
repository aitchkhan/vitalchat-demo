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
        character: 'cathy',
        resolution: 504,
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
                    return `https://imgplaceholder.com/896x504/000?font-size=25&font-family=OpenSans&text=${encodeURIComponent(text)}`;
                }

                const symptomChecker = () => conversation.speak('Please say one of the following chief complaints.')
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.showImage(imagePath('1. Abdominal pain\n2. Chest pain\n3. Cough\n4. Diarrhea\n5. Dizziness\n6. Headaches\n7. Low back pain\n8. Nausea or vomiting\n9. Sore throat')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['abdominal', 'chest', 'pain', 'cough', 'diarrhea', 'dizzy', 'dizziness', 'headache', 'headaches', 'nausea', 'vomiting', 'sore', 'throat'])))

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
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 2000)));

                const patientFinder = () => conversation.speak('I can help you find the patient you are looking for. What is the name of the patient?')
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['alex', 'alexa'])))

                    .then(() => conversation.speak('Let me check, one second. Alexa is in room 201, south wing. Here are the directions to get there from this location.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))

                    .then(() => conversation.showImage('https://i.imgur.com/Fd8uocm.png')) // Elevators image
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => conversation.speak('Please go to the elevators to your right.', 'text', true))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))

                    .then(() => conversation.showImage('https://i.imgur.com/w15pnv5.png')) // 2nd button on lift
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => conversation.speak('Go to to 2nd floor.', 'text', true))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))

                    .then(() => conversation.showImage('https://i.imgur.com/J1bG0GV.png')) // Hallway image
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => conversation.speak('When on the second floor, take a left and follow the blue lines in the hallway.', 'text', true))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))

                    .then(() => conversation.showImage('https://i.imgur.com/73TycKr.png'))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => conversation.speak('Room 207 will be on the right.', 'text', true))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))

                    .then(() => conversation.speak('Thank you for using the patient finder, good bye!'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 2000)));

                const recognizeSpeechEndForPA = () => conversation.waitUntil(ConvoController.recognizeSpeech(['that\'s it', 'that\'s all', 'i am finished', 'i\'m finished', 'i am done', 'i\'m done', 'please quit', 'i am tired', 'i\'m tired', 'end the bot', 'i have had enough', 'please stop']))
                    .then((message) => {
                        if (ConvoController.recognizeSpeech(['quit', 'tired', 'end', 'enough', 'stop'])(message)) {
                            throw new Error('END_BOT');
                        }
                    });

                const personalAssistantQuestions = () => conversation.speak('Here is a picture of Morgan Freeman?')
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1400)))
                    .then(() => conversation.showImage('https://pmcvariety.files.wordpress.com/2018/05/morgan-freeman-sexual-harassment-7.jpg'))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 4000)))
                    .then(() => conversation.clearMedia())
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 500)))
                    .then(() => conversation.speak('Do you recognize Morgan? He is your favorite actor. Tell me about your favorite movie of Morgan Freeman.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => recognizeSpeechEndForPA())
                    .then(() => conversation.speak('Hmmm. That\'s interesting. Here is a picture of Killmer High School where you used to study in your childhood.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1750)))
                    .then(() => conversation.showImage('https://i.imgur.com/JAl0wov.png'))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 4000)))
                    .then(() => conversation.clearMedia())
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 500)))
                    .then(() => conversation.speak('How about you tell me about your days at Killmer High School'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => recognizeSpeechEndForPA())
                    .then(() => conversation.speak('That\'s quite fascinating. Now please check out the following picture.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1750)))
                    .then(() => conversation.showImage('https://calmatters.org/wp-content/uploads/Reno-1-1.jpg'))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 4000)))
                    .then(() => conversation.clearMedia())
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 500)))
                    .then(() => conversation.speak('Do you recognize this house? This is a picture of your childhood house. Please tell me how it was living over there?'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => recognizeSpeechEndForPA())
                    .then(() => conversation.speak('It was nice catching up with you. Goodbye'))
                    .catch(() => conversation.speak("It was nice talking with you. Goodbye"))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1200)));

                const personalAssistant = () => conversation.speak('I am going to ask you a few question to test your memory.')
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => personalAssistantQuestions());

                // Try to recognize with in 10 seconds
                await conversation.waitUntil(ConvoController.recognizeFace(), 10000)
                    .then((message) => conversation.speak(`Hello ${message.data.FaceMatches[0].Face.ExternalImageId}`))
                    .catch(() => conversation.speak('Hello there!'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1000)))
                    .then(() => conversation.waitUntil((message) => ConvoController.detect('wave')(message) || ConvoController.recognizeSpeech(['hello', 'hi'])(message)))

                    .then(() => conversation.speak('Which of these can I help with? Please say one of these words.'))
                    .then(() => conversation.waitUntil(ConvoController.speechEnd()))
                    .then(() => new Promise((resolve) => setTimeout(() => resolve(), 1200)))
                    .then(() => conversation.showImage(imagePath('1. Symptom Checker\n2. Patient Finder\n3. Personal Assistant\n4. Medical Records')))
                    .then(() => conversation.waitUntil(ConvoController.recognizeSpeech(['symptom', 'symptoms', 'checker', 'patient', 'find', 'finder', 'personal', 'assistant'])))
                    .then((message) => {
                        if (ConvoController.recognizeSpeech(['symptom', 'symptoms', 'checker'])(message)) {
                            return symptomChecker();
                        }
                        if (ConvoController.recognizeSpeech(['personal', 'assistant'])(message)) {
                            return personalAssistant();
                        }

                        return patientFinder();
                    })
                    .then(() => session.end());
            });

            session.on('disconnect', () => {
                console.log(session.getId(), 'disconnected');
            });
        })
        .catch((err) => {
            if (err.message) {
                return res.send(400, { message: err.message });
            }

            return res.send(500, { message: 'Unknown error occurred' });
        });
});

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});

io.listen(server.server);
