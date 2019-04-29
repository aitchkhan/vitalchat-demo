const cors = require('cors');
const restify = require('restify');
const dotenv = require('dotenv');
const VitalChat = require('vitalchat');

dotenv.config();
const SessionController = require('./session-controller');

const PORT = parseInt(process.env['PORT']) || 9001;
const VC_SERVER_URL = process.env['VC_SERVER_URL'];
const server = restify.createServer();
const io = require('socket.io');
const store = {};

const vitalchat = new VitalChat({
    key: process.env['VC_KEY'],
    secret: process.env['VC_SECRET'],
    baseUrl: VC_SERVER_URL,
});

server.use(cors());

server.get('/api/create_session', (req, res, next) => {
    vitalchat.createSession({
        tags: [{ my_id: '1234' }, { reference: '5678' }],
        callback: { url: 'https://myserver.com/vitalchat', user: '', password: '' },
        defaults: { character: 'sally' }
    })
        .then((session) => {
            const controller = new SessionController(session);
            session.on('connect', (session_id) => {
                store[session_id] = controller;
                controller.watsonConnectPromise()
                    .then(() => {
                        res.send({
                            session_id,
                            vc_server_url: VC_SERVER_URL,
                        });
                    })
            });
            session.on('disconnect', (session_id) => {
                console.log(session_id, 'disconnected');
                delete store[session_id];
            });
            session.on('message', ({ data, session_id }) => {
                const message = JSON.parse(data);
                controller.onMessage(message);
            })
        })
        .catch((err) => {
            if (err.message) {
                res.send(400, { message: err.message });
            } else {
                res.send(500, { message: 'Unknown error occurred' })
            }
        });
});

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});

io.listen(server.server);
