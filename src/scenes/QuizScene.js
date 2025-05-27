export default class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.score = 0;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('caixatexto', 'assets/caixatexto.png');
        this.load.image('bt_butaoVazio', 'assets/bt_butaoVazio.png');
        this.load.image('bt_voltar', 'assets/bt_voltar.png');
    }

    create() {
        // Background
        this.add.image(512, 384, 'background').setDepth(-1);

        this.uiGroup = this.add.group();

        // Botão Voltar
        this.btnVoltar = this.add.image(60, 40, 'bt_voltar')
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });

        this.btnVoltar.on('pointerup', () => {
            this.scene.start('MenuScene');
        });

        // Perguntas
        this.questions = [
            {
                question: 'Quantas faces tem um cubo?',
                options: ['4', '6', '8'],
                correctAnswer: '6'
            },
            {
                question: 'Qual destes é um sólido?',
                options: ['Círculo', 'Esfera', 'Quadrado'],
                correctAnswer: 'Esfera'
            },
            {
                question: 'Um cilindro tem bases de forma...',
                options: ['Quadrada', 'Triangular', 'Circular'],
                correctAnswer: 'Circular'
            }
        ];

        this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);

        const questionObj = this.questions[this.currentQuestionIndex];

        // Fundo da pergunta
        const questionBox = this.add.image(512, 100, 'caixatexto').setScale(0.6);
        const questionText = this.add.text(512, 100, questionObj.question, {
            fontSize: '28px',
            fontFamily: 'Snap ITC',
            color: '#000',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        this.uiGroup.add(questionBox);
        this.uiGroup.add(questionText);

        // Opções
        this.optionButtons = [];

        questionObj.options.forEach((option, index) => {
            const y = 250 + index * 100;

            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(0.7)
                .setInteractive({ useHandCursor: true });

            const optionText = this.add.text(512, y, option, {
                fontSize: '22px',
                fontFamily: 'Snap ITC',
                color: '#000',
                align: 'center',
                wordWrap: { width: 400 }
            }).setOrigin(0.5);

            optionBg.on('pointerover', () => optionBg.setScale(0.75));
            optionBg.on('pointerout', () => optionBg.setScale(0.7));
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        // Progresso (ex: 2/3)
        if (this.progressoText) this.progressoText.destroy();

        this.progressoText = this.add.text(512, 580, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '24px',
            fontFamily: 'Snap ITC',
            color: '#000'
        }).setOrigin(0.5);
    }

    checkAnswer(selected, bg, text) {
        const correct = this.questions[this.currentQuestionIndex].correctAnswer;

        if (selected === correct) {
            bg.setTint(0x8BC34A);
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
            this.scene.start('MenuScene');
        }
    }
}
