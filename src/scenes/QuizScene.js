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

        // Perguntas atualizadas
        this.questions = [
            {
                question: "Qual destas formas tem 6 faces quadradas?",
                options: ["Cubo", "Cilindro", "Cone"],
                correctAnswer: "Cubo"
            },
            {
                question: "Qual destas formas tem uma base circular e um vértice?",
                options: ["Cubo", "Cone", "Paralelepípedo"],
                correctAnswer: "Cone"
            },
            {
                question: "Qual destas formas tem duas bases circulares?",
                options: ["Cilindro", "Pirâmide", "Prisma"],
                correctAnswer: "Cilindro"
            },
            {
                question: "Quantas arestas tem um cubo?",
                options: ["8", "6", "12"],
                correctAnswer: "12"
            },
            {
                question: "Qual destas formas pode rolar?",
                options: ["Cubo", "Cilindro", "Pirâmide"],
                correctAnswer: "Cilindro"
            },
            {
                question: "Qual forma corresponde a esta planificação: 1 círculo e 1 lateral curva?",
                options: ["Cone", "Cubo", "Cilindro"],
                correctAnswer: "Cone"
            },
            {
                question: "Quantas planificações tem um cubo?",
                options: ["6", "11", "8"],
                correctAnswer: "11"
            },
            {
                question: "Qual destas formas pode ter uma planificação com 2 triângulos e 3 retângulos?",
                options: ["Cubo", "Pirâmide", "Prisma"],
                correctAnswer: "Prisma"
            },
            {
                question: "Qual destas formas tem uma planificação com 6 retângulos?",
                options: ["Paralelepípedo", "Cubo", "Pirâmide"],
                correctAnswer: "Paralelepípedo"
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

        // Opções - Configurações melhoradas para legibilidade
        this.optionButtons = [];
        const optionSpacing = 100; // Mais espaço entre opções
        const startY = 220; // Posição inicial mais alta
        const buttonScale = 0.6; // Botões um pouco maiores
        const fontSize = '24px'; // Fonte maior

        questionObj.options.forEach((option, index) => {
            const y = startY + index * optionSpacing;

            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(buttonScale)
                .setInteractive({ useHandCursor: true });

            const optionText = this.add.text(512, y, option, {
                fontSize: fontSize,
                fontFamily: 'Snap ITC',
                color: '#000',
                align: 'center',
                wordWrap: { width: 450 } // Largura maior para o texto
            }).setOrigin(0.5);

            // Efeitos de hover mais suaves
            optionBg.on('pointerover', () => {
                optionBg.setScale(buttonScale * 1.05);
                optionText.setStyle({ fontSize: '26px' }); // Texto cresce no hover
            });
            optionBg.on('pointerout', () => {
                optionBg.setScale(buttonScale);
                optionText.setStyle({ fontSize: fontSize });
            });
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        // Progresso (ex: 2/9) - Melhor posicionado
        if (this.progressoText) this.progressoText.destroy();

        this.progressoText = this.add.text(512, 550, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '28px',
            fontFamily: 'Snap ITC',
            color: '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }

    checkAnswer(selected, bg, text) {
        const correct = this.questions[this.currentQuestionIndex].correctAnswer;

        if (selected === correct) {
            bg.setTint(0x8BC34A); // Verde para resposta correta
            text.setStyle({ color: '#fff' }); // Texto branco para melhor contraste
        } else {
            bg.setTint(0xF44336); // Vermelho para resposta errada
            text.setStyle({ color: '#fff' });

            // Destacar a resposta correta
            this.optionButtons.forEach(opt => {
                if (opt.text.text === correct) {
                    opt.bg.setTint(0x8BC34A);
                    opt.text.setStyle({ color: '#fff' });
                }
            });
        }

        // Desativar interação após resposta
        this.optionButtons.forEach(opt => opt.bg.disableInteractive());

        this.time.delayedCall(1500, () => {
            this.optionButtons.forEach(opt => {
                opt.bg.clearTint();
                opt.text.setStyle({ color: '#000' });
            });
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