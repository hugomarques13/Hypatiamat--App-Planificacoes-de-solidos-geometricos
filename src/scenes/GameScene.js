export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.threeCanvas = document.createElement('canvas')
    this.threeCanvas.style.position = 'absolute'
    this.threeCanvas.style.top = '0'
    this.threeCanvas.style.left = '0'
    document.body.appendChild(this.threeCanvas)

    this.renderer = new THREE.WebGLRenderer({ canvas: this.threeCanvas })
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.scene3D = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.z = 5

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.cube = new THREE.Mesh(geometry, material)
    this.scene3D.add(this.cube)
  }

  update() {
    this.cube.rotation.x += 0.01
    this.cube.rotation.y += 0.01
    this.renderer.render(this.scene3D, this.camera)
  }
}
