const { it } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);

const EventEmitter = require('events');
const ConvoController = require('./ConvoController');

it('should receive a message', () => {
    const session = new EventEmitter();
    const conversation = new ConvoController(session);

    session.emit('message', { dummy: 'data1' });
    session.emit('message', { dummy: 'data2' });

    return Promise.all([
        expect(conversation.waitForMessage((message) => message.dummy === 'data1')).to.eventually.not.rejected,
        expect(conversation.waitForMessage((message) => message.dummy === 'data2')).to.eventually.not.rejected,
    ]);
});

it('should receive a message with delay', () => {
    const session = new EventEmitter();
    const conversation = new ConvoController(session);

    setTimeout(() => {
        session.emit('message', { dummy: 'data1' });
        session.emit('message', { dummy: 'data2' });
    }, 50);

    return Promise.all([
        expect(conversation.waitForMessage((message) => message.dummy === 'data1')).to.eventually.not.rejected,
        expect(conversation.waitForMessage((message) => message.dummy === 'data2')).to.eventually.not.rejected,
    ]);
});

it('should receive a message with delay and timeout', () => {
    const session = new EventEmitter();
    const conversation = new ConvoController(session);

    setTimeout(() => {
        session.emit('message', { dummy: 'data1' });
        session.emit('message', { dummy: 'data2' });
    }, 50);

    return Promise.all([
        expect(conversation.waitForMessage((message) => message.dummy === 'data1', 500)).to.eventually.not.rejected,
        expect(conversation.waitForMessage((message) => message.dummy === 'data2', 500)).to.eventually.not.rejected,
    ]);
});

it('should timeout on late message arrival', () => {
    const session = new EventEmitter();
    const conversation = new ConvoController(session);

    setTimeout(() => {
        session.emit('message', { dummy: 'data1' });
    }, 100);

    return expect(conversation.waitForMessage((message) => message.dummy === 'data1', 50)).to.eventually.rejectedWith('Timedout');
});
