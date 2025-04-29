export default class Cilindro extends Phaser.Scene {
  constructor() {
    super({ key: "Cilindro" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }
}