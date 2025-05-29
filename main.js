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
    roundPixels: true,
    scene: [MenuScene, SelectingSolids, Cubo, Paralelepipedo, Prisma, Piramide, Cone, Cilindro, Quiz],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    transparent: true
};

const game = new Phaser.Game(config);

function updateBorderRadius() {
    const baseRadius = 50;
    
    const scaleFactor = Math.min(
        window.innerWidth / 1024,
        window.innerHeight / 600
    );
    
    // Apply scaled radius
    const scaledRadius = baseRadius * scaleFactor;
    
    game.canvas.style.borderRadius = `${scaledRadius}px`;
    game.canvas.style.overflow = 'hidden';
}

game.events.on('ready', () => {
    updateBorderRadius();
    document.body.style.backgroundColor = 'white';
    
    game.scale.on('resize', updateBorderRadius);
});

// Handle window resize and orientation change events
function handleViewportChange() {
    if (game.isBooted) {
        updateBorderRadius();
    }
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportChange, 150);
});