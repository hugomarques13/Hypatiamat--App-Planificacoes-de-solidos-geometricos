export default class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
    }

    init() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [
            {
                question: "Qual destas formas tem 6 faces quadradas?",
                options: ["Cubo", "Cilindro", "Cone"],
                correctAnswer: "Cubo",
            },
            {
                question: "Qual destas formas tem uma base circular e um vértice?",
                options: ["Cubo", "Cone", "Paralelepípedo"],
                correctAnswer: "Cone",
            },
            {
                question: "Qual destas formas tem duas bases circulares?",
                options: ["Cilindro", "Pirâmide", "Prisma"],
                correctAnswer: "Cilindro",
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["8", "6", "12"],
                correctAnswer: "12",
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cubo", "Cilindro", "Pirâmide"],
                correctAnswer: "Cilindro",
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Cubo", "Cilindro"],
                correctAnswer: "Cone",
            },
            {
                question: "Quantas planificações tem um cubo?",
                options: ["6", "11", "8"],
                correctAnswer: "11",
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Cubo", "Pirâmide", "Prisma"],
                correctAnswer: "Prisma",
            },
            {
                question: "Qual destas formas tem uma planificação com 6 retângulos?",
                options: ["Paralelepípedo", "Cubo", "Pirâmide"],
                correctAnswer: "Paralelepípedo",
            }
        ];

        this.shuffleArray(this.questions);
        this.questions.forEach(q => this.shuffleArray(q.options));
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('caixatexto', 'assets/caixatexto.png');
        this.load.image('bt_butaoVazio', 'assets/bt_butaoVazio.png');
        this.load.image('bt_voltar', 'assets/bt_voltar.png');
        this.load.image('bt_home', 'assets/bt_home.png');
        this.load.image('bt_screenback', 'assets/bt_screenback.png');
        this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
    }

    create() {
        this.loadFont('Snap ITC').then(() => {
            this.initScene();
        }).catch(() => {
            this.initScene();
        });
    }

    loadFont(fontName) {
        return new Promise((resolve) => {
            if (!document.fonts) return resolve();
            
            document.fonts.load(`20px "${fontName}"`).then(resolve).catch(resolve);
        });
    }

    initScene() {
            this.add.image(512, 384, 'background').setDepth(-1);
            
            let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive();
            let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive().setVisible(false);

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


            this.uiGroup = this.add.group();

            this.btnVoltar = this.add.image(45, 555, 'bt_voltar')
                .setScale(0.34)
                .setInteractive({ useHandCursor: true });

            this.btnVoltar.on('pointerup', () => {
                this.scene.start('MenuScene');
            });

            this.addHoverEffect(this.btnVoltar);

            this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);

        this.btnVoltar.setPosition(45, 555).setVisible(true);

        const questionObj = this.questions[this.currentQuestionIndex];

        const questionBox = this.add.image(512, 120, 'caixatexto')
            .setScale(0.7, 0.65)
            .setOrigin(0.5);

        questionBox.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        const questionText = this.add.text(512, 130, questionObj.question, {
            fontSize: '22px',
            fontFamily: 'Snap ITC',
            color: '#993300',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        this.uiGroup.add(questionBox);
        this.uiGroup.add(questionText);

        this.optionButtons = [];

        questionObj.options.forEach((option, index) => {
            const y = 250 + index * 100;

            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(0.23)
                .setInteractive({ useHandCursor: true });

            const optionText = this.add.text(512, y - 4, option, {
                fontSize: '20px',
                fontFamily: 'Snap ITC',
                color: '#993300',
                align: 'center',
                wordWrap: { width: 350 }
            }).setOrigin(0.5);

            this.addHoverEffect(optionBg, optionText);
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        if (this.progressoText) this.progressoText.destroy();

        this.progressoText = this.add.text(512, 560, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '24px',
            fontFamily: 'Snap ITC',
            color: '#993300'
        }).setOrigin(0.5);

        this.uiGroup.add(this.progressoText);
    }

    checkAnswer(selected, bg, text) {
        const correct = this.questions[this.currentQuestionIndex].correctAnswer;

        if (selected === correct) {
            bg.setTint(0x8BC34A);
            this.score++;
        } else {
            bg.setTint(0xF44336);

            this.optionButtons.forEach(opt => {
                if (opt.text.text === correct) {
                    opt.bg.setTint(0x8BC34A);
                }
            });
        }

        this.optionButtons.forEach(opt => opt.bg.disableInteractive());

        this.time.delayedCall(1000, () => {
            this.optionButtons.forEach(opt => opt.bg.clearTint());
            this.nextQuestion();
        });
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showFinalScore();
        }
    }

    showFinalScore() {
        this.uiGroup.clear(true, true);

        this.btnVoltar.setVisible(false);

        const centerX = 512;

        const scoreBox = this.add.image(centerX, 240, 'caixatexto').setScale(0.6).setOrigin(0.5);

        const scoreText = this.add.text(centerX, 240 + 7,
            `Quiz concluído!\nPontuação: ${this.score}/${this.questions.length}`,
            {
                fontSize: '26px',
                fontFamily: 'Snap ITC',
                color: '#993300',
                align: 'center'
            }).setOrigin(0.5);

        this.uiGroup.add(scoreBox);
        this.uiGroup.add(scoreText);

        const voltarBtn = this.add.image(centerX, 350, 'bt_home')
            .setScale(0.65)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.scene.stop();
                this.scene.start('MenuScene');
            });

        this.addHoverEffect(voltarBtn);

        this.uiGroup.add(voltarBtn);
    }

    addHoverEffect(button, text = null) {
        button.on('pointerover', () => {
            button.setScale(button.scaleX * 1.1);
            if (text) {
                text.setFontSize(22);
            }
        });

        button.on('pointerout', () => {
            button.setScale(button.scaleX / 1.1);
            if (text) {
                text.setFontSize(20);
            }
        });
    }
}
