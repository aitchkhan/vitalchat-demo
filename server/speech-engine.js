const { SpeechClient } = require('@google-cloud/speech');
module.exports = function initSpeechEngine(io) {

    const speechClient = new SpeechClient(); // Creates a client
    let recognizeStream = null;

    function stopRecognitionStream() {
        if (recognizeStream) {
            recognizeStream.end();
        }
        recognizeStream = null;
    }

    function startRecognitionStream(client, data) {
        recognizeStream = speechClient.streamingRecognize(request)
            .on('error', console.error)
            .on('data', (data) => {
                process.stdout.write(data.results[0] && data.results[0].alternatives[0]
                    ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                    : `\n\nReached transcription time limit, press Ctrl+C\n`);
                client.emit('speechData', data);

                /*
                 * If end of utterance, let's restart stream
                 * this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
                 */
                if (data.results[0] && data.results[0].isFinal) {
                    stopRecognitionStream();
                    startRecognitionStream(client);
                    // Console.log('restarted stream serverside');
                }
            });
    }

    io.on('connection', (client) => {
        console.log('Client Connected to server');
        recognizeStream = null;

        client.on('join', (data) => {
            client.emit('messages', 'Socket Connected to Server');
        });

        client.on('messages', (data) => {
            client.emit('broad', data);
        });

        client.on('startGoogleCloudStream', function (data) {
            startRecognitionStream(this, data);
        });

        client.on('endGoogleCloudStream', (data) => {
            stopRecognitionStream();
        });
        client.on('disconnect', () => {
            stopRecognitionStream();
        });

        client.on('binaryData', (data) => {
            // Console.log(data); //log binary data
            if (recognizeStream !== null) {
                recognizeStream.write(data);
            }
        });
    });


}

// =========================== GOOGLE CLOUD SETTINGS ================================ //

/**
 * The encoding of the audio file, e.g. 'LINEAR16'
 * The sample rate of the audio file in hertz, e.g. 16000
 * The BCP-47 language code to use, e.g. 'en-US'
 */
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

const request = {
    config: {
        encoding,
        sampleRateHertz,
        languageCode,
        profanityFilter: false,

        /*
         * SpeechContexts: [{
         *     phrases: ["hoful","shwazil"]
         *    }] // add your own speech context for better recognition
         */
    },
    interimResults: false
};