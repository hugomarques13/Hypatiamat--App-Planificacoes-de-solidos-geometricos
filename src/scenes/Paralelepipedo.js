export default class Paralelepipedo extends Phaser.Scene {
  constructor() {
    super({ key: "Paralelepipedo" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }
}