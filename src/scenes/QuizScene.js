export default class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
    }

    init(data) {
        if (data?.returnToQuiz) {
            this.currentQuestionIndex = data.currentQuestionIndex || 0;
            this.score = data.score || 0;
            this.questions = data.questions || this.getDefaultQuestions();
        } else {
            // Otherwise, start fresh
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.questions = this.getDefaultQuestions();
            this.shuffleArray(this.questions);
            this.questions.forEach(q => this.shuffleArray(q.options));
        }
    }

    getDefaultQuestions() {
        return [
            {
                question: "Qual destas formas tem 6 faces quadradas?",
                options: ["Cubo", "Cilindro", "Cone"],
                correctAnswer: "Cubo",
                relatedScene: "Cubo",
            },
            {
                question: "Qual destas formas tem uma base circular e um vértice?",
                options: ["Cubo", "Cone", "Paralelepípedo"],
                correctAnswer: "Cone",
                relatedScene: "Cone",
            },
            {
                question: "Qual destas formas tem duas bases circulares?",
                options: ["Cilindro", "Pirâmide", "Prisma"],
                correctAnswer: "Cilindro",
                relatedScene: "Cilindro",
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["8", "6", "12"],
                correctAnswer: "12",
                relatedScene: "Cubo",
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cubo", "Cilindro", "Pirâmide"],
                correctAnswer: "Cilindro",
                relatedScene: "Cilindro",
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Cubo", "Cilindro"],
                correctAnswer: "Cone",
                relatedScene: "Cone",
            },
            {
                question: "Quantas planificações tem um cubo?",
                options: ["6", "11", "8"],
                correctAnswer: "11",
                relatedScene: "Cubo",
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Cubo", "Pirâmide", "Prisma"],
                correctAnswer: "Prisma",
                relatedScene: "Prisma",
            },
            {
                question: "Qual destas formas tem uma planificação com 6 retângulos?",
                options: ["Paralelepípedo", "Cilindro", "Pirâmide"],
                correctAnswer: "Paralelepipedo",
                relatedScene: "Paralelepipedo",
            }
        ];
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
        this.load.image('popup_window', 'assets/popup_window.png');
    }

    create() {
        this.events.on('resume', (sys, data) => {
            if (data) {
                this.currentQuestionIndex = data.currentQuestionIndex;
                this.score = data.score;
                this.questions = data.questions;
                this.showQuestion();
            }
        });
        this.loadFont('Snap ITC').then(() => {
            this.initScene();
            
            // If resuming, show the current question immediately
            if (this.currentQuestionIndex > 0) {
                this.showQuestion();
            }
        }).catch(() => {
            this.initScene();
            if (this.currentQuestionIndex > 0) {
                this.showQuestion();
            }
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
        this.btnVoltar.on('pointerup', () => this.scene.start('MenuScene'));
        this.addHoverEffect(this.btnVoltar);

        this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);
        this.btnVoltar.setVisible(true);

        const questionObj = this.questions[this.currentQuestionIndex];

        // Caixa e texto da pergunta (centrado no meio da tela, no topo)
        const questionBox = this.add.image(512, 120, 'caixatexto')
            .setScale(0.7, 0.65)
            .setOrigin(0.5);
        const questionText = this.add.text(512, 130, questionObj.question, {
            fontSize: '22px',
            fontFamily: 'Snap ITC',
            color: '#993300',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        this.uiGroup.addMultiple([questionBox, questionText]);

        this.optionButtons = [];

        // Mostrar opções no centro da cena (em x=350, y=250 + 100*index)
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
            this.uiGroup.addMultiple([optionBg, optionText]);
        });

        // Texto de progresso
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
        const relatedScene = this.questions[this.currentQuestionIndex].relatedScene;

        if (selected === correct) {
            bg.setTint(0x8BC34A);
            this.score++;
        } else {
            bg.setTint(0xF44336).setAlpha(0.85);

            this.optionButtons.forEach(opt => {
                if (opt.text.text === correct) {
                    opt.bg.setTint(0x8BC34A);
                }
            });
        }

        this.optionButtons.forEach(opt => opt.bg.disableInteractive());

        this.createActionButtons(relatedScene);
    }

    createActionButtons(relatedScene) {
        // Popup alinhado à direita (x=800), e verticalmente alinhado ao meio das opções (calculado)

        const optionsCount = this.optionButtons.length;
        const firstOptionY = 250;
        const lastOptionY = 250 + (optionsCount - 1) * 100;
        const middleY = (firstOptionY + lastOptionY) / 2;

        const popupX = 800;  // Podes ajustar a posição X do popup para a direita
        const popupY = middleY;

        const popupScaleX = 0.35;
        const popupScaleY = 0.4;

        this.popup = this.add.image(popupX, popupY, 'popup_window')
            .setScale(popupScaleX, popupScaleY)
            .setOrigin(0.5);

        const buttonSpacing = 110;
        const buttonX = popupX;
        const continueY = popupY - buttonSpacing / 2;
        const exploreY = popupY + buttonSpacing / 2;

        // Botão Continuar
        this.continueBtn = this.add.image(buttonX, continueY, 'bt_butaoVazio')
            .setScale(0.18)
            .setInteractive({ useHandCursor: true });
        this.continueText = this.add.text(buttonX, continueY - 4, "Continuar", {
            fontSize: '20px',
            fontFamily: 'Snap ITC',
            color: '#993300',
            align: 'center'
        }).setOrigin(0.5);

        this.addHoverEffect(this.continueBtn, this.continueText);

        this.continueBtn.on('pointerup', () => {
            this.popup.destroy();
            this.continueBtn.destroy();
            this.continueText.destroy();
            if (this.exploreBtn) this.exploreBtn.destroy();
            if (this.exploreText) this.exploreText.destroy();
            this.nextQuestion();
        });

        // Botão Explorar (se existir cena relacionada)
        if (relatedScene) {
            this.exploreBtn = this.add.image(buttonX, exploreY, 'bt_butaoVazio')
                .setScale(0.18)
                .setInteractive({ useHandCursor: true });
            this.exploreText = this.add.text(buttonX, exploreY - 4, "Explorar", {
                fontSize: '20px',
                fontFamily: 'Snap ITC',
                color: '#993300',
                align: 'center'
            }).setOrigin(0.5);

            this.addHoverEffect(this.exploreBtn, this.exploreText);

            this.exploreBtn.on('pointerup', () => {
                this.popup.destroy();
                this.scene.stop();
                this.scene.start(relatedScene, {
                    returnToQuiz: true,
                    quizScene: 'QuizScene',
                    nextQuestionIndex: this.currentQuestionIndex,
                    currentScore: this.score,
                    questions: this.questions
                });
            });
        }
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showFinalScore();
        } else {
            this.showQuestion();
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

    shutdown() {
        if (this.uiGroup) {
            this.uiGroup.clear(true, true);
        }
    }
}
