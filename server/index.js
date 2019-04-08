const cors = require('cors');
const restify = require('restify');
require('dotenv').config();
const VitalChat = require('vitalchat');
const SessionController = require('./session-controller');

const PORT = parseInt(process.env['PORT']) || 3000;
const server = restify.createServer();
const io = require('socket.io').listen(server.server);
const store = {};

server.get('/create_session', cors(), (req, res) => {
    const client = new VitalChat({
        key: 'test',
        secret: 'dfff6d37-4a7f-4d4d-9d48-14b6e8958ecb',
        baseUrl: 'https://signal-local.vitalchat.com:1443'
    });
    client.createSession({
        tags: [{ my_id: '1234' }, { reference: '5678' }],
        callback: { url: 'https://myserver.com/vitalchat', user: '', password: '' },
        defaults: { character: 'sally' }
    })
        .then((session) => {
            const controller = new SessionController(session);
            session.on('connect', (session_id) => {
                store[session_id] = controller;
                controller.watsonConnectPromise().then(() => {
                    res.send({ session_id });
                }).catch((err) => {
                    console.error(err);
                    res.send(err);
                });
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
            res.send(err);
        });
});

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});
