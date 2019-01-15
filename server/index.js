const VitalChat = require('vitalchat');

const client = new VitalChat({
    key: 'test',
    secret: 'dfff6d37-4a7f-4d4d-9d48-14b6e8958ecb',
    baseUrl: 'https://signal-local.vitalchat.com:1443'
});

client.createSession({
    tags: [{ my_id: '1234'}, { reference: '5678'}],
    callback: { url: 'https://myserver.com/vitalchat', user: '', password: ''},
    defaults: { character: 'sally' }
})
    .then((session) => {
        session.on('connect', (session_id) => {
            console.log(session_id, 'connected');

            session.init();
        });
        session.on('disconnect', (session_id) => {
            console.log(session_id, 'disconnected');
        });
        session.on('message', (message) => {
            console.log(message.session_id, 'message:', message.data);
        });

        setTimeout(() => {
            session.close();
        }, 5000);
    });
