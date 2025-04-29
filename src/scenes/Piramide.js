export default class Piramide extends Phaser.Scene {
  constructor() {
    super({ key: "Piramide" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }
}