export default class Cone extends Phaser.Scene {
  constructor() {
    super({ key: "Cone" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }
}