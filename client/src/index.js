import VitalChat from 'vitalchat-client';

const API_SERVER_URL = process.env.API_SERVER_URL;
const VC_SERVER_URL= process.env.VC_SERVER_URL;
const CREATE_SESSION_ENDPOINT = '/create_session';

window.onload = setupClient;

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
        return fetch(`${API_SERVER_URL}${CREATE_SESSION_ENDPOINT}`)
            .then(response => response.json())
            .then(({session_id}) => {
                showStatus('Connecting...');
                client = new VitalChat({
                    baseUrl: VC_SERVER_URL, //vital chat signal server
                    session_id: session_id,
                    localVideo: localVideo,
                    remoteVideo: remoteVideo,
                });

                client.on('connect', () => {
                    showControlbar('play');
                });

                client.on('disconnect', () => {
                    showControlbar('start');
                });

                client.connect();
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

    showControlbar('start');
}
