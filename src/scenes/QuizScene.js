export default class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });

        this.questions = [
            {
                question: "Qual destas formas tem 6 faces quadradas?",
                options: ["Cubo", "Cilindro", "Cone"],
                correct: "Cubo"
            },
            {
                question: "Qual destas formas tem uma base circular e um vértice?",
                options: ["Cone", "Cubo", "Paralelepípedo"],
                correct: "Cone"
            },
            {
                question: "Qual destas formas tem duas bases circulares?",
                options: ["Cilindro", "Piramide", "Prisma"],
                correct: "Cilindro"
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["12", "6", "8"],
                correct: "12"
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cilindro", "Cubo", "Piramide"],
                correct: "Cilindro"
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Esfera", "Cilindro"],
                correct: "Cone"
            },
            {
                question: "Qual forma corresponde a uma planificação com 1 círculo apenas?",
                options: ["Esfera", "Cone", "Cilindro"],
                correct: "Esfera"
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Prisma", "Piramide", "Cubo"],
                correct: "Prisma"
            },
            {
                question: "Qual destas formas tem uma planificação com 6 retângulos?",
                options: ["Paralelepípedo", "Cubo", "Piramide"],
                correct: "Paralelepípedo"
            }
        ];

        this.currentQuestionIndex = 0;
        this.score = 0;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.add.image(512, 300, 'background').setScale(0.8);
        this.showQuestion();
    }

    showQuestion() {
        if (this.questionText) this.questionText.destroy();
        if (this.optionButtons) this.optionButtons.forEach(btn => btn.destroy());
        if (this.feedbackText) this.feedbackText.destroy();

        const questionObj = this.questions[this.currentQuestionIndex];

        this.questionText = this.add.text(512, 150, questionObj.question, {
            fontSize: '28px',
            color: '#000',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5);

        this.optionButtons = [];

        questionObj.options.forEach((option, index) => {
            const button = this.add.text(512, 250 + index * 60, option, {
                fontSize: '24px',
                backgroundColor: '#fff',
                color: '#000',
                padding: { x: 20, y: 10 },
                align: 'center'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            button.on('pointerup', () => this.checkAnswer(option, button));

            this.optionButtons.push(button);
        });
    }

    checkAnswer(selectedOption, selectedButton) {
        const question = this.questions[this.currentQuestionIndex];

        // Disable all buttons to prevent multiple clicks
        this.optionButtons.forEach(btn => btn.disableInteractive());

        if (selectedOption === question.correct) {
            this.score++;
            selectedButton.setBackgroundColor('#b6fcb6'); // Verde
            this.showFeedback("Certo!");
        } else {
            selectedButton.setBackgroundColor('#fcb6b6'); // Vermelho
            this.showFeedback(`Errado! A resposta certa é: ${question.correct}`);
        }

        this.time.delayedCall(1500, () => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.showQuestion();
            } else {
                this.showResults();
            }
        });
    }

    showFeedback(text) {
        if (this.feedbackText) this.feedbackText.destroy();

        this.feedbackText = this.add.text(512, 480, text, {
            fontSize: '26px',
            color: '#000'
        }).setOrigin(0.5);
    }

    showResults() {
        if (this.questionText) this.questionText.destroy();
        if (this.optionButtons) this.optionButtons.forEach(btn => btn.destroy());
        if (this.feedbackText) this.feedbackText.destroy();

        this.add.text(512, 250, `Pontuação final: ${this.score}/${this.questions.length}`, {
            fontSize: '32px',
            color: '#000'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(512, 350, "Voltar ao Menu", {
            fontSize: '26px',
            backgroundColor: '#fff',
            color: '#000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerup', () => {
            this.scene.start('MenuScene');
        });
    }
}

