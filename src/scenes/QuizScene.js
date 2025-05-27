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
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('caixatexto', 'assets/caixatexto.png');
        this.load.image('bt_butaoVazio', 'assets/bt_butaoVazio.png');
        this.load.image('bt_voltar', 'assets/bt_voltar.png');
    }

    create() {
        this.add.image(512, 384, 'background').setDepth(-1);

        this.uiGroup = this.add.group();

        // Botão voltar comum, será reposicionado e mostrado conforme o caso
        this.btnVoltar = this.add.image(45, 555, 'bt_voltar')
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });

        this.btnVoltar.on('pointerup', () => {
            this.scene.start('MenuScene');
        });

        this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);

        // Botão voltar visível nas perguntas na posição correta
        this.btnVoltar.setPosition(45, 555).setVisible(true);

        const questionObj = this.questions[this.currentQuestionIndex];

        const questionBox = this.add.image(512, 100, 'caixatexto')
            .setScale(0.7, 0.65)
            .setOrigin(0.5);

        // Texto centrado na caixa, com pequeno ajuste para ficar mais central verticalmente
        const questionText = this.add.text(512, 110, questionObj.question, {
            fontSize: '20px',
            fontFamily: 'Snap ITC',
            color: '#fff',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        this.uiGroup.add(questionBox);
        this.uiGroup.add(questionText);

        this.optionButtons = [];

        questionObj.options.forEach((option, index) => {
            const y = 250 + index * 100;  // Aumentado espaçamento vertical aqui

            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(0.20)
                .setInteractive({ useHandCursor: true });

            const optionText = this.add.text(512, y, option, {
                fontSize: '18px',
                fontFamily: 'Snap ITC',
                color: '#fff',
                align: 'center',
                wordWrap: { width: 350 }
            }).setOrigin(0.5);

            optionBg.on('pointerover', () => optionBg.setScale(0.22));
            optionBg.on('pointerout', () => optionBg.setScale(0.20));
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        if (this.progressoText) this.progressoText.destroy();

        this.progressoText = this.add.text(512, 580, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '24px',
            fontFamily: 'Snap ITC',
            color: '#fff'
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

        // Esconde o botão voltar anterior (que estava nas perguntas)
        this.btnVoltar.setVisible(false);

        // Caixa da pontuação
        const scoreBox = this.add.image(512, 300, 'caixatexto').setScale(0.6).setOrigin(0.5);

        const scoreText = this.add.text(512, 300,
            `Quiz concluído!\nPontuação: ${this.score}/${this.questions.length}`,
            {
                fontSize: '26px',
                fontFamily: 'Snap ITC',
                color: '#fff',
                align: 'center'
            }).setOrigin(0.5);

        this.uiGroup.add(scoreBox);
        this.uiGroup.add(scoreText);

        // Botão voltar centralizado abaixo da caixa
        const voltarBtn = this.add.image(512, 450, 'bt_voltar')
            .setScale(0.34)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.scene.stop();
                this.scene.start('MenuScene');
            });

        this.uiGroup.add(voltarBtn);
    }
}
