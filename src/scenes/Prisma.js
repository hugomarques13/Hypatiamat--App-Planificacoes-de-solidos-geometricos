export default class Prisma extends Phaser.Scene {
  constructor() {
    super({ key: "Prisma" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }
}