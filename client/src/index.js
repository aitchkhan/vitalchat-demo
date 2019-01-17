import VitalChatClient from 'vitalchat-client';

const API_SERVER_URL = "http://localhost:3000";
const CREATE_SESSION_ENDPOINT = "/create_session";

fetch(`${API_SERVER_URL}${CREATE_SESSION_ENDPOINT}`)
    .then(function (response) {
        return response.json();
    })
    .then(function (response) {
        setUpClient(response.session_id);
    });


const setUpClient = (session_id) => {

    //refs to remoteVideo and localVideo elements
    const remoteVideo = document.getElementById('remotevideo');
    const localVideo = document.getElementById('previewvideo');

    //setup the vitalchat client
    const client = new VitalChatClient({
        baseUrl: 'signal-local.vitalchat.com:1443', //vital chat signal server
        session_id: session_id,
        localVideo: localVideo,
        remoteVideo: remoteVideo,
    });

    document.getElementById("session_id").innerText = session_id;

    document.getElementById('make-call').onclick = () => {
        document.getElementById("make-call").style.display = "none";
        document.getElementById("drop-call").style.display = "block";
        //initiates the call
        client.initiateCall();
    }

    document.getElementById('drop-call').onclick = () => {
        document.getElementById("make-call").style.display = "block";
        document.getElementById("drop-call").style.display = "none";
        //ends the call
        client.endCall();
    }

    document.getElementById('bot-button').onclick = () => {
        let text = document.getElementById('text').value;
        let textType = document.getElementById('text-type').value;
        client.hearBot(text, textType);
    };

    document.getElementById('image').onclick = () => {
        client.useImageVideo();
    };
    document.getElementById('video').onclick = () => {
        client.useVideo();
    };
    document.getElementById('audio').onclick = () => {
        client.useAudio();
    };

    //check status ever 500 ms to see if the client is connected or not to vital chat signal server.
    setInterval(() => {
        document.getElementById('isconnected').innerText = client.isConnected() ? 'Yes' : 'No';
    }, 1000);
}
