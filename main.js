import GameScene from './src/scenes/GameScene.js'
import MenuScene from './src/scenes/MenuScene.js'
import SelectingSolids from './src/scenes/SelectingSolids.js'

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
