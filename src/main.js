// import GameScene from './scenes/GameScene.js'
import MenuScene from './scenes/MenuScene.js'

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    scene: MenuScene,
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH 
    }
};

const game = new Phaser.Game(config);
