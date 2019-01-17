const restify = require('restify');
const VitalChat = require('vitalchat');

const PORT = parseInt(process.env['PORT']) || 3000;
const server = restify.createServer();

server.use(
    function crossOrigin(req,res,next){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return next();
    }
  );

server.get('/create_session', (req, res, next) => {
    const client = new VitalChat({
        key: 'test',
        secret: 'dfff6d37-4a7f-4d4d-9d48-14b6e8958ecb',
        baseUrl: 'https://signal-local.vitalchat.com:1443'
    });
console.log("sasd")
    client.createSession({
        tags: [{ my_id: '1234' }, { reference: '5678' }],
        callback: { url: 'https://myserver.com/vitalchat', user: '', password: '' },
        defaults: { character: 'sally' }
    })
        .then((session) => {
            console.log("then")
            session.on('connect', (session_id) => {
                console.log(session_id, 'connected');

                res.send({ session_id });
            });
            session.on('disconnect', (session_id) => {
                console.log(session_id, 'disconnected');
            });
            session.on('message', (message) => {
                console.log(message.session_id, 'message:', message.data);
            })

        }).catch((err) => {
            res.send(err);
        });;
});

server.listen(PORT, () => {
    console.log('%s listening at %s', server.name, server.url);
});
