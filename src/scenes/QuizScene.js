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

            button.on('pointerup', () => this.checkAnswer(option));

            this.optionButtons.push(button);
        });
    }

    checkAnswer(selectedOption) {
        const question = this.questions[this.currentQuestionIndex];

        if (selectedOption === question.correct) {
            this.score++;
        }

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        this.questionText.destroy();
        this.optionButtons.forEach(btn => btn.destroy());

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
