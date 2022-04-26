import Phaser from 'phaser';

export const WHOEvents = {
    BoardDone: 'boardDone',
    GameStart: 'gameStart',
};

const eventsCenter = new Phaser.Events.EventEmitter();

export default eventsCenter;
