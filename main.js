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
    backgroundColor: '#ffffff',
    scene: [MenuScene, SelectingSolids,Cubo,Paralelepipedo,Prisma,Piramide,Cone, Cilindro, Quiz],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

const game = new Phaser.Game(config);

game.events.on('ready', () => {
  game.canvas.style.borderRadius = '50px';
  game.canvas.style.overflow = 'hidden';
  document.body.style.backgroundColor = 'white';
});

game.scale.on('enterfullscreen', () => {
  document.body.style.borderRadius = '0';
  document.body.style.overflow = 'visible';
  game.canvas.style.borderRadius = '0';
});

game.scale.on('leavefullscreen', () => {
  document.body.style.borderRadius = '50px';
  document.body.style.overflow = 'hidden';
  game.canvas.style.borderRadius = '50px';
});
