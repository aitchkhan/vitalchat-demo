import VitalChat from 'vitalchat-client';
import config from './config';

const CREATE_SESSION_ENDPOINT = '/api/create_session';

window.onload = setupClient;

window.onkeyup = function onKeyUp(event) {
    const speakTextElem = document.getElementById('speak-text');
    if (speakTextElem === document.activeElement) {
        return;
    }

    // on "i" key press
    if(event.keyCode === 73) {
        const infoDiv = document.getElementById('info-div');
        if(infoDiv.style.visibility === 'hidden') {
            infoDiv.style.visibility = 'visible';
            return;
        }
        infoDiv.style.visibility = 'hidden';
        return;
    }
}

function showControlbar(name) {
    const controlbars = ['start', 'play', 'status'];
    if (controlbars.indexOf(name) == -1) {
        throw new Error('Unknown control bar');
    }

    for (const controlbar of controlbars) {
        const display = name == controlbar ? 'block' : 'none';
        document.getElementById(`control-${controlbar}`).style.display = display;
    }
}

function showStatus(status) {
    document.getElementById('control-status').innerHTML = status;
    showControlbar('status');
}

function recordEvent(event) {
    const data = event.data ? JSON.parse(event.data) : null;

    switch (data.type) {
        case 'detection':
            if(data.data.attentive) {
                document.getElementById('attentive').innerHTML = data.data.attentive; 
            }

            if(data.data.handgesture) {
                document.getElementById('hand_gesture').innerHTML = data.data.handgesture; 
            }
            break;

        case 'face_attributes':
            let face_attributes;
            if (Array.isArray(data.data.FaceMatches)) {
                face_attributes = data.data.FaceMatches[0].Face.ExternalImageId;
            } else {
                face_attributes = JSON.stringify(data.data.FaceDetails[0].Smile);
            }
            document.getElementById('face_attributes').innerHTML = face_attributes;
            break;

        case 'transcript':
            document.getElementById('transcript').innerHTML = JSON.stringify(data.data.transcript);
            break;
    }
}

function resetInfoDiv() {
    document.getElementById('attentive').innerHTML = 0; 
    document.getElementById('hand_gesture').innerHTML = 0; 
    document.getElementById('face_attributes').innerHTML = 0; 
    document.getElementById('transcript').innerHTML = 0;
}

function setupClient() {
    const remoteVideo = document.getElementById('remotevideo');
    const localVideo = document.getElementById('localvideo');

    let client;

    let usingControl = false;
    let timerId;
    document.addEventListener('mousemove', () => {
        document.getElementById('control-play').style.opacity = 100;

        if (timerId) clearInterval(timerId);
        timerId = setTimeout(() => {
            if (usingControl) return;
            document.getElementById('control-play').style.opacity = 0;
        }, 1000);
    });

    document.getElementById('speak-text').onfocus = () => {
        usingControl = true;
    }
    document.getElementById('speak-text').onblur = () => {
        usingControl = false;
    }

    document.getElementById('make-call').onclick = () => {
        showStatus('Creating session...');

        // resetting the info-div
        resetInfoDiv();
        return fetch(`${config.API_SERVER_URL}${CREATE_SESSION_ENDPOINT}`)
            .then((response) => {
                if (response.status != 200) {
                    throw new Error(`Failed to create session (${response.statusText})`);
                }

                return response.json()
            })
            .then(({ sessionId, vitalchatBaseURL }) => {
                showStatus('Connecting...');
                client = new VitalChat({
                    baseURL: vitalchatBaseURL,
                    sessionId: sessionId,
                    localVideo: localVideo,
                    remoteVideo: remoteVideo,
                });

                client.on('connect', () => {
                    client.socket.onmessage = recordEvent;
                    
                    showControlbar('play');
                });

                client.on('disconnect', () => {
                    client.end();
                    showControlbar('start');
                });

                client.connect();
            })
            .catch((err) => {
                showStatus(err);
                setTimeout(() => showControlbar('start'), 1000);
            });
    }

    document.getElementById('drop-call').onclick = () => {
        client.end();
    }

    document.getElementById('speak').onclick = () => {
        const text = document.getElementById('speak-text').value;
        client.speak(text, 'text');
    };
    document.getElementById('music').onclick = () => {
        client.playAudio();
    };
    document.getElementById('image').onclick = () => {
        client.playImage();
    };
    document.getElementById('video').onclick = () => {
        client.playVideo();
    };
    document.getElementById('debug').onclick = () => {
        client.sendMessage({ type: 'debug' });
    };

    showControlbar('start');
}
