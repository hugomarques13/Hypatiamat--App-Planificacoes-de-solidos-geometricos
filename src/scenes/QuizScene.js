export default class QuizScene extends Phaser.Scene {
    // ... (mantido o mesmo constructor e preload)

    create() {
        // Background
        this.add.image(512, 384, 'background').setDepth(-1);

        this.uiGroup = this.add.group();

        // Botão Voltar (mantido igual)
        this.btnVoltar = this.add.image(60, 40, 'bt_voltar')
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });
        this.btnVoltar.on('pointerup', () => this.scene.start('MenuScene'));

        // Perguntas (mantido igual)
        this.questions = [ /* ... */ ];

        this.showQuestion();
    }

    showQuestion() {
        this.uiGroup.clear(true, true);

        const questionObj = this.questions[this.currentQuestionIndex];

        // CAIXA DA PERGUNTA - Reduzida
        const questionBox = this.add.image(512, 100, 'caixatexto')
            .setScale(0.5, 0.4); // Reduzido significativamente

        const questionText = this.add.text(512, 100, questionObj.question, {
            fontSize: '22px', // Fonte menor
            fontFamily: 'Arial',
            color: '#000',
            align: 'center',
            wordWrap: { width: 500 } // Largura reduzida
        }).setOrigin(0.5);

        this.uiGroup.add(questionBox);
        this.uiGroup.add(questionText);

        // CAIXAS DAS OPÇÕES - Muito menores
        this.optionButtons = [];
        const optionSpacing = 70; // Espaçamento reduzido
        const startY = 200; // Posição mais alta

        questionObj.options.forEach((option, index) => {
            const y = startY + index * optionSpacing;

            // Botão reduzido
            const optionBg = this.add.image(512, y, 'bt_butaoVazio')
                .setScale(0.35) // Escala muito reduzida
                .setInteractive({ useHandCursor: true });

            // Texto menor
            const optionText = this.add.text(512, y, option, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#000',
                align: 'center'
            }).setOrigin(0.5);

            // Efeitos hover mais sutis
            optionBg.on('pointerover', () => optionBg.setScale(0.4));
            optionBg.on('pointerout', () => optionBg.setScale(0.35));
            optionBg.on('pointerup', () => this.checkAnswer(option, optionBg, optionText));

            this.optionButtons.push({ bg: optionBg, text: optionText });
            this.uiGroup.add(optionBg);
            this.uiGroup.add(optionText);
        });

        // Indicador de progresso menor
        this.progressText = this.add.text(900, 40, `${this.currentQuestionIndex + 1}/${this.questions.length}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#000',
            backgroundColor: 'rgba(255,255,255,0.7)'
        }).setOrigin(0.5);
    }

    // ... (mantido o mesmo checkAnswer e nextQuestion)
}