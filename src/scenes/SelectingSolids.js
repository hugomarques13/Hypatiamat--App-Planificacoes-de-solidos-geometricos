export default class SelectingSolids extends Phaser.Scene {
    constructor() {
        super({ key: 'SelectingSolids' });
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('titulo', 'assets/titulo.png');
        this.load.image('texto', 'assets/texto.png');
        this.load.image('bt_cubo', 'assets/bt_cubo.png');
        this.load.image('bt_paralelepipedos', 'assets/bt_paralelepipedos.png');
        this.load.image('bt_prismas', 'assets/bt_prismas.png');
        this.load.image('bt_piramide', 'assets/bt_piramide.png');
        this.load.image('bt_cones', 'assets/bt_cones.png');
        this.load.image('bt_cilindros', 'assets/bt_cilindros.png');
        this.load.image('bt_home', 'assets/bt_home.png');
    }

    create() {
        this.add.image(512, 300, 'background').setScale(0.8);
        this.add.image(512, 60, 'titulo').setScale(0.65);
        this.add.image(512,175, 'texto').setScale(1.2);
        
        let btnCubo = this.add.image(110, 350, 'bt_cubo').setScale(0.65).setInteractive();
        let btnParalelepipedos = this.add.image(280, 350, 'bt_paralelepipedos').setScale(0.65).setInteractive();
        let btnPrismas = this.add.image(450,350,'bt_prismas').setScale(0.65).setInteractive();
        let btnPiramides = this.add.image(620,350,'bt_piramide').setScale(0.65).setInteractive();
        let btnCones = this.add.image(790, 350, 'bt_cones').setScale(0.65).setInteractive();
        let btnCilindros = this.add.image(960, 350, 'bt_cilindros').setScale(0.65).setInteractive();
        
        let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive();

        btnHome.on('pointerup', () => {
            this.scene.start('MenuScene');
        });

        btnCubo.on('pointerup', () => {
            this.scene.start('GameScene');
        });

        this.addHoverEffect(btnCubo);
        this.addHoverEffect(btnParalelepipedos);
        this.addHoverEffect(btnPrismas);
        this.addHoverEffect(btnPiramides);
        this.addHoverEffect(btnCones);
        this.addHoverEffect(btnCilindros);
        this.addHoverEffect(btnHome);
    
    }

    // Função para adicionar efeito de hover
    addHoverEffect(button) {
        button.on('pointerover', () => {
            button.setScale(button.scaleX * 1.1); // Aumenta o tamanho do botão
    });

        button.on('pointerout', () => {
            button.setScale(button.scaleX / 1.1); // Retorna ao tamanho original
    });
    }
}
