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
    }
};

const game = new Phaser.Game(config);

function updateBorderRadius() {
    // Base border radius for original size (1024x600)
    const baseRadius = 50;
    
    // Calculate scale factor
    const scaleFactor = Math.min(
        window.innerWidth / 1024,
        window.innerHeight / 600
    );
    
    // Apply scaled radius
    const scaledRadius = baseRadius * scaleFactor;
    
    game.canvas.style.borderRadius = `${scaledRadius}px`;
    game.canvas.style.overflow = 'hidden';
}

// Call initially when game is ready
game.events.on('ready', () => {
    updateBorderRadius();
    document.body.style.backgroundColor = 'white';
    
    // Update on resize and orientation change
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
    // Add a slightly longer delay for orientation changes
    setTimeout(handleViewportChange, 150);
});