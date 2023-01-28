import Phaser from "phaser";

import PreloaderScene from "./scenes/PreloaderScene";
import BoardScene from "./scenes/BoardScene";
import SplashScene from "./scenes/SplashScene";
import ResultScene from "./scenes/ResultScene";

export const DEBUG = false;
export const BAD_COLOR = 0xff0000;
export const GOOD_COLOR = 0x00ff00;

const urlParams = new URLSearchParams(window.location.search);
export const SESSION_ID = urlParams.get("session");
export const USER_ID = urlParams.get("user");
// TODO: this is probably an unhandled exception area
const isSpectate = urlParams.get("spectate");
export const IS_SPECTATE = JSON.parse(isSpectate as string) as boolean;

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
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 },
        },
    },
    scene: [PreloaderScene, BoardScene, SplashScene, ResultScene],
    // transparent: true,
    backgroundColor: "0xffffff",
};

export default new Phaser.Game(config);
