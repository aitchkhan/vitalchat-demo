class ConvoController {
    constructor(session) {
        this.messages = [];
        this.session = session;

        this.session.on('message', (message) => {
            this.messages.push(message);
        });
    }

    waitUntil(checker, timeout = -1) {
        return new Promise((resolve, reject) => {
            let timer = null;

            if (timeout !== -1) {
                setTimeout(() => {
                    if (timer) {
                        clearInterval(timer);
                    }

                    reject(new Error('Timedout'));
                }, timeout);
            }

            timer = setInterval(() => {
                if (this.messages.length !== 0) {
                    const message = this.messages.shift();
                    const matched = checker(message);

                    if (matched) {
                        clearInterval(timer);
                        resolve(message);
                    }
                }
            }, 0);
        });
    }

    speak(text, type, audioOnly = false) {
        return this.session.speak(text, type, audioOnly);
    }

    showImage(uri) {
        return this.session.showImage(uri);
    }

    playVideo(uri) {
        return this.session.playVideo(uri);
    }

    clearMedia() {
        return this.session.clearMedia();
    }

    requestFace() {
        return this.session.requestFace();
    }

    static recognizeSpeech(words) {
        let input_words = words;

        return (message) => {
            if (!Array.isArray(input_words)) {
                input_words = [input_words];
            }

            if (message.type !== 'transcript') {
                return false;
            }

            for (const word of input_words) {
                if (message.data.transcript.search(new RegExp(`\\b${word}\\b`, 'iu')) !== -1) {
                    return true;
                }
            }

            return false;
        };
    }

    static detect(what) {
        let checker = () => false;

        if (what === 'wave') {
            checker = (message) => message.type === 'detection' && message.data.handGesture === 1;
        } else if (what === 'face') {
            checker = (message) => message.type === 'detection' && message.data.hasFace === 1;
        } else if (what === 'face-image') {
            checker = (message) => message.type === 'face-image';
        }

        return checker;
    }

    static speechEnd() {
        return (message) => message.type === 'eos';
    }

    static videoEnd() {
        return (message) => message.type === 'end-of-video';
    }
}

module.exports = ConvoController;
