import Phaser from "phaser";

import PreloaderScene from "./scenes/PreloaderScene";
import BoardScene from "./scenes/BoardScene";
import SplashScene from "./scenes/SplashScene";

export const DEBUG = true;

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        width: 800,
        height: 800,
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 },
        },
    },
    scene: [PreloaderScene, BoardScene, SplashScene],
    // transparent: true,
    backgroundColor: "0xffffff",
};

export default new Phaser.Game(config);
