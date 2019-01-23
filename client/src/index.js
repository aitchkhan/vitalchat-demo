import VitalChatClient from 'vitalchat-client';

const API_SERVER_URL = process.env.API_SERVER_URL;
const VC_SERVER_URL= process.env.VC_SERVER_URL;
const CREATE_SESSION_ENDPOINT = '/create_session';

window.onload = setupClient;

function setupClient() {
    //refs to remoteVideo and localVideo elements
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
        return fetch(`${API_SERVER_URL}${CREATE_SESSION_ENDPOINT}`)
            .then(response => response.json())
            .then(({session_id}) => {
                client = new VitalChatClient({
                    baseUrl: VC_SERVER_URL, //vital chat signal server
                    session_id: session_id,
                    localVideo: localVideo,
                    remoteVideo: remoteVideo,
                });

                client.session.on('connect', () => {
                    document.getElementById('control-start').style.display = 'none';
                    document.getElementById('control-play').style.display = 'block';
                });

                client.session.on('disconnect', () => {
                    document.getElementById('control-start').style.display = 'block';
                    document.getElementById('control-play').style.display = 'none';
                });

                // TODO: Fix SDK so that we remove setTimeout
                setTimeout(() => {
                    client.initiateCall();
                }, 1000);
            });
    }

    document.getElementById('drop-call').onclick = () => {
        client.endCall();
    }

    document.getElementById('speak').onclick = () => {
        const text = document.getElementById('speak-text').value;
        client.hearBot(text, 'text');
    };
    document.getElementById('music').onclick = () => {
        client.useAudio();
    };
    document.getElementById('image').onclick = () => {
        client.useImageVideo();
    };
    document.getElementById('video').onclick = () => {
        client.useVideo();
    };
}
