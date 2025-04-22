export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('titulo', 'assets/titulo.png');
        this.load.image('bt_opcao1', 'assets/bt_opcao1.png');
        this.load.image('bt_opcao2', 'assets/bt_opcao2.png');
        this.load.image('bt_screenback', 'assets/bt_screenback.png');
        this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
        this.load.image('bt_info', 'assets/bt_info.png');
        this.load.image('info', 'assets/info.png');
        this.load.image('bt_creditos', 'assets/bt_creditos.png');
        this.load.image('creditos-img', 'assets/creditos-img.png');
        this.load.image('bt_fechar', 'assets/bt_fechar.png');
    }

    create() {
        this.add.image(512, 300, 'background').setScale(0.8);
        this.add.image(512, 60, 'titulo').setScale(0.65);

        let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive();
        let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive().setVisible(false);
        
        let btn1 = this.add.image(512, 250, 'bt_opcao1').setScale(0.45).setInteractive();
        let btn2 = this.add.image(512, 475, 'bt_opcao2').setScale(0.45).setInteractive();
        
        let btnInfo = this.add.image(965, 475, 'bt_info').setScale(0.7).setInteractive();

        let btnCredits = this.add.image(965, 555, 'bt_creditos').setScale(0.7).setInteractive();
        let creditosImg = this.add.image(512,360, 'creditos-img').setScale(0.65).setVisible(false);
        let btnFechar = this.add.image(725, 150, 'bt_fechar').setScale(0.8).setInteractive().setVisible(false);

        btn1.on('pointerup', () => {
            this.scene.start('SelectingSolids');
        });

        btnCredits.on('pointerup', () => {
            // infoImage.setScale(0.9);
            creditosImg.setVisible(true);
            btnFechar.setVisible(true);
            btn1.setVisible(false);
            btn2.setVisible(false);
        });

        btnFechar.on('pointerup', () => {
            // infoImage.setScale(0.9);
            creditosImg.setVisible(false);
            btnFechar.setVisible(false);
            btn1.setVisible(true);
            btn2.setVisible(true);
        });

        this.addHoverEffect(btnFullScreen);
        this.addHoverEffect(btnBack);
        this.addHoverEffect(btn1);
        this.addHoverEffect(btn2);
        this.addHoverEffect(btnInfo);
        this.addHoverEffect(btnCredits);
        this.addHoverEffect(btnFechar);
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

