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
        this.load.image('bt_screenback', 'assets/bt_screenback.png');
        this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
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

        let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive();
        let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive().setVisible(false);
        
        let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive();

        this.isFullscreen = !!document.fullscreenElement;
        btnFullScreen.setVisible(!this.isFullscreen);
        btnBack.setVisible(this.isFullscreen);

        const toggleFullscreen = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().then(() => {
                    this.isFullscreen = false;
                    btnFullScreen.setVisible(true);
                    btnBack.setVisible(false);
                });
            } else {
                document.body.requestFullscreen().then(() => {
                    this.isFullscreen = true;
                    btnFullScreen.setVisible(false);
                    btnBack.setVisible(true);
                });
            }
        };

        btnFullScreen.on('pointerup', toggleFullscreen);
        btnBack.on('pointerup', toggleFullscreen);

        this.events.on('pause', () => {
            this.isFullscreen = !!document.fullscreenElement;
        });

        this.scale.on('fullscreenchange', () => {
            if (this.scale.isFullscreen) {
                btnFullScreen.setVisible(false);
                btnBack.setVisible(true);
            } else {
                btnFullScreen.setVisible(true);
                btnBack.setVisible(false);
            }
        });

        btnHome.on('pointerup', () => {
            this.scene.start('MenuScene');
        });

        btnCubo.on('pointerup', () => {
            this.scene.start('Cubo');
        });

        btnParalelepipedos.on('pointerup', () => {
            this.scene.start('Paralelepipedo');
        });

        btnPrismas.on('pointerup', () => {
            this.scene.start('Prisma');
        });

        btnPiramides.on('pointerup', () => {
            this.scene.start('Piramide');
        });

        btnCones.on('pointerup', () => {
            this.scene.start('Cone');
        });

        btnCilindros.on('pointerup', () => {
            this.scene.start('Cilindro');
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
