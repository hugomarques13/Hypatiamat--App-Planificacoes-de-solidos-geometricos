import GameScene from './scenes/GameScene.js'
import MenuScene from './scenes/MenuScene.js'
import SelectingSolids from './scenes/SelectingSolids.js'

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    scene: [MenuScene, SelectingSolids,GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

const game = new Phaser.Game(config);
