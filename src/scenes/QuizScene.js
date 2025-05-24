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
                options: ["Cilindro", "Piramide", "Prisma"],
                correct: "Cilindro"
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["8", "6", "12"],
                correct: "12"
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cubo", "Cilindro", "Piramide"],
                correct: "Cilindro"
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Esfera", "Cilindro"],
                correct: "Cone"
            },
            {
                question: "Qual forma corresponde a uma planificação com 1 círculo apenas?",
                options: ["Cone", "Esfera", "Cilindro"],
                correct: "Esfera"
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Cubo", "Piramide", "Prisma"],
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
        // Limpa elementos anteriores
        if (this.questionText) this.questionText.destroy();
        if (this.optionButtons) this.optionButtons.forEach(btn => btn.destroy());
        if (this.feedbackText) this.feedbackText.destroy();

        const questionObj = this.questions[this.currentQuestionIndex];

        // Mostra a pergunta
        this.questionText = this.add.text(512, 150, questionObj.question, {
            fontSize: '28px',
            color: '#000',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5);

        // Cria botões de opção
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

    checkAnswer(selectedOption, button) {
        const questionObj = this.questions[this.currentQuestionIndex];
        
        // Destaca visualmente as respostas
        this.optionButtons.forEach(btn => {
            if (btn.text === questionObj.correct) {
                btn.setBackgroundColor('#00ff00'); // Resposta correta (verde)
            } else if (btn.text === selectedOption && selectedOption !== questionObj.correct) {
                btn.setBackgroundColor('#ff0000'); // Resposta errada (vermelho)
            }
        });

        // Atualiza pontuação
        if (selectedOption === questionObj.correct) {
            this.score++;
        }

        // Próxima pergunta ou tela final
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
        // Limpa a cena
        this.questionText?.destroy();
        this.optionButtons?.forEach(btn => btn.destroy());
        
        // Mostra resultados
        this.add.text(512, 200, `Fim do Quiz!\nAcertaste ${this.score} de ${this.questions.length}!`, {
            fontSize: '32px',
            color: '#000',
            align: 'center'
        }).setOrigin(0.5);

        // Botão para reiniciar
        const restartButton = this.add.text(512, 300, 'Jogar Novamente', {
            fontSize: '24px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerup', () => {
            this.score = 0;
            this.currentQuestionIndex = 0;
            this.showQuestion();
        });

        // Botão para voltar ao menu
        const menuButton = this.add.text(512, 370, 'Voltar ao Menu', {
            fontSize: '24px',
            backgroundColor: '#2196F3',
            color: '#fff',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerup', () => {
            this.scene.start('MenuScene'); 
        });
    }
}