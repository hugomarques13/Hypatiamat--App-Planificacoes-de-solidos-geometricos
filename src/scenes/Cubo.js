export default class Cubo extends Phaser.Scene {
  constructor() {
    super({ key: "Cubo" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "plan1"
  }

  preload() {
  this.load.image('background', 'assets/background.png');
  this.load.image('bt_home', 'assets/bt_home.png');
  }

  create() {

    this.add.image(512, 300, 'background').setScale(0.8);
    let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive().setDepth(1000);
    this.addHoverEffect(btnHome);

    btnHome.on('pointerup', () => {
            this.cleanupDOM();
            this.scene.start('MenuScene');
    });

    // --- THREE Setup ---
    this.threeCanvas = document.createElement("canvas")
    this.threeCanvas.style.position = "absolute"
    this.threeCanvas.style.top = "0"
    this.threeCanvas.style.left = "0"
    this.threeCanvas.style.zIndex = "0"
    document.body.appendChild(this.threeCanvas)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      alpha:true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.scene3D = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.orbit = { radius: 5, theta: 0, phi: Math.PI / 2 }

    this.cubeGroup = new THREE.Group()
    this.scene3D.add(this.cubeGroup)

    this.unfoldProgress = 0;
    this.isSliding = false;
    this.currentPlan = "plan1";

    this.materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide })
    ]

    this.faceGroups = {}
    this.originalRotations = {}

    this.initUnfoldPlans()
    this.buildFaceGroupsForPlan(this.currentPlan)

    this.createUnfoldSlider()
    this.createPlanSlider()
    this.initMouseControls()
  }

  initUnfoldPlans() {
    const d = 0.5

    this.unfoldPlans = {
      plan1: {
        parents: {
          top: 'right',
          front: null,
          back: null,
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(Math.PI / 2, 0, 0),
          back: new THREE.Euler(-Math.PI / 2, Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0, 0.5, 0], position: [0, 0, d], rotation: [0, 0, 0] },
          back:   { pivot: [0, 0.5, 0], position: [0, 0, -d], rotation: [0, Math.PI, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      plan2: {
        parents: {
          top: 'right',
          front: null,
          back: 'left',
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(Math.PI / 2, 0, 0),
          back: new THREE.Euler(0, -Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0, 0.5, 0], position: [0, 0, d], rotation: [0, 0, 0] },
          back:   { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      plan3: {
        parents: {
          top: 'right',
          front: null,
          back: 'right',
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(Math.PI / 2, 0, 0),
          back: new THREE.Euler(0, -Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0, 0.5, 0], position: [0, 0, d], rotation: [0, 0, 0] },
          back:   { pivot: [-0.5, -0.5, 0], position: [d, d, -d], rotation: [0, -Math.PI/2, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      plan4: {
        parents: {
          top: 'right',
          front: null,
          back: 'top',
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(Math.PI / 2, 0, 0),
          back: new THREE.Euler(0, 0, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0, 0.5, 0], position: [0, 0, d], rotation: [0, 0, 0] },
          back:   { pivot: [0.5, 0.5, 0], position: [d, -d, d], rotation: [Math.PI/2, -Math.PI/2, Math.PI/2] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      plan5: {
        parents: {
          top: 'right',
          front: 'right',
          back: null,
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(0, Math.PI, 0),
          back: new THREE.Euler(-Math.PI / 2, Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          back:   { pivot: [0, 0.5, 0], position: [0, 0, -d], rotation: [0, Math.PI, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      plan9: {
        parents: {
          top: 'front',
          front: 'right',
          back: 'left',
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(0, Math.PI, 0),
          back: new THREE.Euler(0, -Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, -Math.PI, -Math.PI/2),
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          back:   { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0.5, 0.5, 0], position: [d, 0, d], rotation: [Math.PI / 2, 0, Math.PI / 2]}
        }
      },
      plan10: {
        parents: {
          top: 'front',
          front: 'right',
          back: null,
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(0, Math.PI, 0),
          back: new THREE.Euler(-Math.PI / 2, Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, -Math.PI, -Math.PI/2),
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          back:   { pivot: [0, 0.5, 0], position: [0, 0, -d], rotation: [0, Math.PI, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0.5, 0.5, 0], position: [d, 0, d], rotation: [Math.PI / 2, 0, Math.PI / 2]}
        }
      },
      plan11: {
        parents: {
          top: 'front',
          front: 'right',
          back: null,
          left: 'back',
          right: null
        },
        rotations: {
          front: new THREE.Euler(0, Math.PI, 0),
          back: new THREE.Euler(-Math.PI / 2, Math.PI, 0),
          left: new THREE.Euler(-Math.PI, 0, -Math.PI),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, -Math.PI, -Math.PI/2),
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          back:   { pivot: [0, 0.5, 0], position: [0, 0, -d], rotation: [0, Math.PI, 0] },
          left:   { pivot: [-0.5, 0, 0], position: [d, d, -d], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0.5, 0.5, 0], position: [d, 0, d], rotation: [Math.PI / 2, 0, Math.PI / 2]}
        }
      }
    }
  }

  createFaceGroup(name, material, pivotArr, positionArr, rotationArr) {
    const pivot = new THREE.Vector3(...pivotArr)
    const position = new THREE.Vector3(...positionArr)
    const rotation = new THREE.Euler(...rotationArr)

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    mesh.position.copy(pivot)

    const group = new THREE.Group()
    group.add(mesh)

    const rotatedPivot = pivot.clone().applyEuler(rotation)
    const adjustedPosition = position.sub(rotatedPivot)

    group.position.copy(adjustedPosition)
    group.rotation.copy(rotation)

    this.originalRotations[name] = {
      quaternion: new THREE.Quaternion().setFromEuler(rotation)
    }

    this.faceGroups[name] = group
    return group
  }

  buildFaceGroupsForPlan(planName) {
    for (const key in this.faceGroups) {
      const group = this.faceGroups[key]
      group.parent?.remove(group)
    }

    this.faceGroups = {}
    this.originalRotations = {}
    this.cubeGroup.clear()

    const plan = this.unfoldPlans[planName]
    const { transforms } = plan

    for (const name in transforms) {
      const { pivot, position, rotation } = transforms[name]
      const index = ['front', 'back', 'left', 'right', 'top', 'bottom'].indexOf(name)
      const group = this.createFaceGroup(name, this.materials[index], pivot, position, rotation)
      this.cubeGroup.add(group)
    }

    this.applyParenting(planName)
  }

  applyParenting(planName) {
    const plan = this.unfoldPlans[planName]
    for (const face in this.faceGroups) {
      const group = this.faceGroups[face]
      group.parent?.remove(group)

      const parentName = plan.parents[face]
      if (parentName && this.faceGroups[parentName]) {
        this.faceGroups[parentName].add(group)
      } else {
        this.cubeGroup.add(group)
      }
    }
  }

  updateCubeTransforms() {
    const plan = this.unfoldPlans[this.currentPlan]
    const rotations = plan.rotations

    for (const name in this.faceGroups) {
      if (name === 'bottom') continue
      const group = this.faceGroups[name]

      const startQuat = this.originalRotations[name].quaternion
      const endQuat = new THREE.Quaternion().setFromEuler(rotations[name])
      const currentQuat = new THREE.Quaternion()
      currentQuat.slerpQuaternions(startQuat, endQuat, this.unfoldProgress)
      group.quaternion.copy(currentQuat)
    }
  }

  createUnfoldSlider() {
    this.unfoldSliderContainer = document.createElement("div");
    const sliderContainer = this.unfoldSliderContainer;
    sliderContainer.style.position = "absolute"
    sliderContainer.style.top = "10px"
    sliderContainer.style.right = "10px"
    sliderContainer.style.width = "200px"
    sliderContainer.style.padding = "10px"
    sliderContainer.style.backgroundColor = "rgba(0,0,0,0.5)"
    sliderContainer.style.borderRadius = "5px"
    document.body.appendChild(sliderContainer)

    const sliderLabel = document.createElement("div")
    sliderLabel.innerText = "Cube Unfold Progress"
    sliderLabel.style.color = "white"
    sliderLabel.style.marginBottom = "10px"
    sliderContainer.appendChild(sliderLabel)

    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = "1"
    slider.step = "0.01"
    slider.value = "0"
    slider.style.width = "100%"

    slider.addEventListener("mousedown", () => this.isSliding = true)
    document.addEventListener("mouseup", () => this.isSliding = false)
    slider.addEventListener("input", (e) => {
      this.unfoldProgress = parseFloat(e.target.value)
      this.updateCubeTransforms()
    })

    sliderContainer.appendChild(slider)
  }

  createPlanSlider() {
    this.planSliderContainer = document.createElement("div");
    const sliderContainer = this.planSliderContainer;
    sliderContainer.style.position = "absolute"
    sliderContainer.style.top = "80px"
    sliderContainer.style.right = "10px"
    sliderContainer.style.width = "200px"
    sliderContainer.style.padding = "10px"
    sliderContainer.style.backgroundColor = "rgba(0,0,0,0.5)"
    sliderContainer.style.borderRadius = "5px"
    document.body.appendChild(sliderContainer)

    const label = document.createElement("div")
    label.style.color = "white"
    label.style.marginBottom = "10px"
    sliderContainer.appendChild(label)

    this.planKeys = Object.keys(this.unfoldPlans)

    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = `${this.planKeys.length - 1}`
    slider.step = "1"
    slider.value = `${this.planKeys.indexOf(this.currentPlan)}`
    slider.style.width = "100%"

    const updatePlan = () => {
      const index = parseInt(slider.value)
      this.currentPlan = this.planKeys[index]
      label.innerText = `Plan: ${this.currentPlan}`
      this.buildFaceGroupsForPlan(this.currentPlan)
      this.updateCubeTransforms()
    }
    
    slider.addEventListener("mousedown", () => this.isSliding = true)
    document.addEventListener("mouseup", () => this.isSliding = false)
    slider.addEventListener("input", updatePlan)
    updatePlan()
    sliderContainer.appendChild(slider)
  }

  initMouseControls() {
    this.isMouseDown = false
    this.lastMouseX = 0
    this.lastMouseY = 0

    this.onMouseDown = (event) => {
      if (this.isSliding) return
      this.isMouseDown = true
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    }

    this.onMouseUp = () => this.isMouseDown = false

    this.onMouseMove = (event) => {
      if (this.isMouseDown && !this.isSliding) {
        const deltaX = event.clientX - this.lastMouseX
        const deltaY = event.clientY - this.lastMouseY

        this.orbit.theta -= deltaX * 0.01
        this.orbit.phi -= deltaY * 0.01
        this.orbit.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.orbit.phi))

        this.lastMouseX = event.clientX
        this.lastMouseY = event.clientY
      }
    }

    this.onMouseWheel = (event) => {
      if (this.isSliding) return
      this.orbit.radius += event.deltaY * 0.01
      this.orbit.radius = Math.max(1, Math.min(10, this.orbit.radius))
    }

    window.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)
    window.addEventListener("mousemove", this.onMouseMove)
    window.addEventListener("wheel", this.onMouseWheel)
  }

  update() {
    const { radius, theta, phi } = this.orbit
    const x = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.cos(theta)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
    this.renderer.render(this.scene3D, this.camera)
  }

  cleanupDOM() {
  // Remove Three.js canvas
  if (this.threeCanvas?.parentNode) {
    this.threeCanvas.remove();
    this.threeCanvas = null;
  }

  // Remove sliders
  if (this.unfoldSliderContainer?.parentNode) {
    this.unfoldSliderContainer.remove();
    this.unfoldSliderContainer = null;
  }

  if (this.planSliderContainer?.parentNode) {
    this.planSliderContainer.remove();
    this.planSliderContainer = null;
  }

  // Mouse listeners
  window.removeEventListener("mousedown", this.onMouseDown);
  window.removeEventListener("mouseup", this.onMouseUp);
  window.removeEventListener("mousemove", this.onMouseMove);
  window.removeEventListener("wheel", this.onMouseWheel);
  }

  // Função para adicionar efeito de hover
    addHoverEffect(button) {
        button.on('pointerover', () => {
            button.setScale(button.scaleX * 1.1); // Aumenta o tamanho do botão
    });

        button.on('pointerout', () => {
            button.setScale(button.scaleX / 1.1); // Retorna ao tamanho original
    });
  }
}
