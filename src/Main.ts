import Phaser from 'phaser';

import PreloaderScene from './scenes/PreloaderScene';
import InitialScene from './scenes/InitialScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        width: 800,
        height: 800,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
        },
    },
    scene: [PreloaderScene, InitialScene],
    // transparent: true,
    backgroundColor: '0xffffff',
};

export default new Phaser.Game(config);
