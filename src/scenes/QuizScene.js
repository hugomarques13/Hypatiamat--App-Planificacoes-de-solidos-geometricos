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

        // Perguntas atualizadas com texto completo
        this.questions = [
            {
                question: "Qual destas formas tem 6 faces quadradas?",
                options: ["Cubo", "Cilindro", "Cone"],
                correctAnswer: "Cubo"
            },
            // ... outras perguntas permanecem iguais
        ];

        this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);

        const questionObj = this.questions[this.currentQuestionIndex];

        // Fundo da pergunta - ajustado para caber texto completo
        const questionBox = this.add.image(512, 120, 'caixatexto')
            .setScale(0.7, 0.6); // Largura maior, altura menor

        const questionText = this.add.text(512, 120, questionObj.question, {
            fontSize: '26px',
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 650, useAdvancedWrap: true }
        }).setOrigin(0.5);

        this.uiGroup.add(questionBox);
        this.uiGroup.add(questionText);

        // Opções - layout melhorado
        this.optionButtons = [];
        const optionSpacing = 100;
        const startY = 250;

        questionObj.options.forEach((option, index) => {
            const y = startY + index * optionSpacing;

            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(0.6)
                .setInteractive({ useHandCursor: true });

            const optionText = this.add.text(512, y, option, {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#000000',
                align: 'center'
            }).setOrigin(0.5);

            optionBg.on('pointerover', () => optionBg.setScale(0.65));
            optionBg.on('pointerout', () => optionBg.setScale(0.6));
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        // Indicador de progresso - mais visível
        this.progressText = this.add.text(950, 50, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5);
    }

    checkAnswer(selected, bg, text) {
        const correct = this.questions[this.currentQuestionIndex].correctAnswer;

        // Efeitos visuais
        if (selected === correct) {
            bg.setTint(0x00FF00); // Verde
            this.score++;
        } else {
            bg.setTint(0xFF0000); // Vermelho
            // Mostrar resposta correta
            this.optionButtons.forEach(opt => {
                if (opt.text.text === correct) {
                    opt.bg.setTint(0x00FF00);
                }
            });
        }

        // Desativar interação após resposta
        this.optionButtons.forEach(opt => opt.bg.disableInteractive());

        // Próxima pergunta após 1.5 segundos
        this.time.delayedCall(1500, () => {
            this.nextQuestion();
        });
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            // Fim do quiz - mostrar pontuação
            this.scene.start('MenuScene', { score: this.score });
        }
    }
}