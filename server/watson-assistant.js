
const WatsonAssistantV2 = require('watson-developer-cloud/assistant/v2');

class WatsonAssistant {
    constructor({ iam_apikey, version, url, assistant_id }) {
        if (!assistant_id) {
            throw new Error('Assistant Id not defined.')
        }
        this.assistant_id = assistant_id;
        this.context = {};
        this.assistant = new WatsonAssistantV2({
            version: version || '2018-11-08',
            iam_apikey,
            url
        });
    }

    createSession() {
        const payload = { assistant_id: this.assistant_id, }
        return new Promise((resolve, reject) => {
            this.assistant.createSession(
                payload,
                (err, response) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(response.session_id);
                }
            )
        });
    }

    message(text, session_id, context = {}) {
        if (!session_id) {
            throw new Error("Session_id not defined.")
        }
        const payload = {
            assistant_id: this.assistant_id,
            session_id,
            input: {
                message_type: 'text',
                text
            },
            context: {
                skills: {
                    'main skill': {
                        user_defined: context
                    }
                }
            }
        }
        return new Promise((resolve, reject) => {
            this.assistant.message(payload, (err, response) => {
                if (err) {
                    reject(err);
                }
                resolve(response);
            })

        })
    }

}

module.exports = WatsonAssistant;