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
                options: ["Cubo", "Cone", "Paralelepípedo"],
                correct: "Cone"
            },
            {
                question: "Qual destas formas tem duas bases circulares?",
                options: ["Cilindro", "Pirâmide", "Prisma"],
                correct: "Cilindro"
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["8", "6", "12"],
                correct: "12"
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cubo", "Cilindro", "Pirâmide"],
                correct: "Cilindro"
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Cubo", "Cilindro"],
                correct: "Cone"
            },
            {
                question: "Quantas planificações tem um cubo?",
                options: ["6", "11", "8"],
                correct: "11"
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Cubo", "Pirâmide", "Prisma"],
                correct: "Prisma"
            },
            {
                question: "Qual destas formas tem uma planificação com 6 retângulos?",
                options: ["Paralelepípedo", "Cubo", "Pirâmide"],
                correct: "Paralelepípedo"
            }
        ];
    }

    init() {
        // Reinicia variáveis quando a cena começa (útil se voltaste do menu)
        this.currentQuestionIndex = 0;
        this.score = 0;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.add.image(512, 300, 'background').setScale(0.8);
        this.uiGroup = this.add.group();

        this.showQuestion();
    }

    showQuestion() {
        this.clearScene();

        const questionObj = this.questions[this.currentQuestionIndex];

        const qText = this.add.text(512, 150, questionObj.question, {
            fontSize: '28px',
            color: '#000',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5);
        this.uiGroup.add(qText);

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
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.checkAnswer(option, button));

            this.optionButtons.push(button);
            this.uiGroup.add(button);
        });
    }

    checkAnswer(selectedOption, button) {
        const questionObj = this.questions[this.currentQuestionIndex];

        // Bloqueia cliques após uma resposta
        this.optionButtons.forEach(btn => btn.disableInteractive());

        this.optionButtons.forEach(btn => {
            if (btn.text === questionObj.correct) {
                btn.setBackgroundColor('#00ff00');
            } else if (btn.text === selectedOption && selectedOption !== questionObj.correct) {
                btn.setBackgroundColor('#ff0000');
            }
        });

        if (selectedOption === questionObj.correct) {
            this.score++;
        }

        this.time.delayedCall(1000, () => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.showQuestion();
            } else {
                this.showFinalScore();
            }
        });
    }

    showFinalScore() {
        this.clearScene();

        const resultText = this.add.text(512, 200, `Fim do Quiz!\nAcertaste ${this.score} de ${this.questions.length}!`, {
            fontSize: '32px',
            color: '#000',
            align: 'center'
        }).setOrigin(0.5);
        this.uiGroup.add(resultText);

        const restartBtn = this.add.text(512, 300, 'Jogar Novamente', {
            fontSize: '24px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerup', () => this.resetQuiz());
        this.uiGroup.add(restartBtn);

        const menuBtn = this.add.text(512, 370, 'Voltar ao Menu', {
            fontSize: '24px',
            backgroundColor: '#2196F3',
            color: '#fff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerup', () => this.returnToMenu());
        this.uiGroup.add(menuBtn);
    }

    clearScene() {
        this.uiGroup.clear(true, true);
    }

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.showQuestion();
    }

    returnToMenu() {
        this.scene.stop('QuizScene');
        this.scene.start('MenuScene');
    }
}
