import Cubo from './src/scenes/Cubo.js'
import MenuScene from './src/scenes/MenuScene.js'
import SelectingSolids from './src/scenes/SelectingSolids.js'
import Paralelepipedo from './src/scenes/Paralelepipedo.js'
import Prisma from './src/scenes/Prisma.js'
import Piramide from './src/scenes/Piramide.js'
import Cone from './src/scenes/Cone.js'
import Cilindro from './src/scenes/Cilindro.js'
import Quiz from './src/scenes/QuizScene.js'


const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    scene: [MenuScene, SelectingSolids,Cubo,Paralelepipedo,Prisma,Piramide,Cone, Cilindro, Quiz],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

const game = new Phaser.Game(config);
