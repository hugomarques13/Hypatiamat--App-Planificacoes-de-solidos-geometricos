export default class Cubo extends Phaser.Scene {
  constructor() {
    super({ key: "Cubo" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('bt_home', 'assets/bt_home.png');
    this.load.image('bt_screenback', 'assets/bt_screenback.png');
    this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
    //this.load.image('bt_info', 'assets/bt_info.png');
    this.load.image('bt_voltar', 'assets/bt_voltar.png');
    this.load.image('bt_butaoVazio', 'assets/bt_butaoVazio.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnVoltar = this.add.image(125, 556, 'bt_voltar').setScale(0.34).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(1000);
    //let btnInfo = this.add.image(980, 555, 'bt_info').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);

    const titleText = this.add.text(this.scale.width / 2, 20, 'Cubo', {
      fontFamily: 'Snap ITC',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    titleText.setShadow(2, 2, '#FFA500', 3);
    titleText.setDepth(1000);

    this.addHoverEffect(btnHome);
    this.addHoverEffect(btnVoltar);
    this.addHoverEffect(btnFullScreen);
    this.addHoverEffect(btnBack);
    //this.addHoverEffect(btnInfo);

    btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    btnVoltar.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('SelectingSolids');
    });

  if (this.scene.settings.data?.returnToQuiz) {
      const quizData = this.scene.settings.data;
      
      this.returnButtonContainer = this.add.container(512, 520);
      
      const returnBtnBg = this.add.image(0, 0, 'bt_butaoVazio')
          .setScale(0.23)
          .setInteractive({ useHandCursor: true });
      
      const returnBtnText = this.add.text(0, -4, "Voltar ao Quiz", {
          fontSize: '20px',
          fontFamily: 'Snap ITC',
          color: '#993300',
          align: 'center'
      }).setOrigin(0.5);
      
      this.addHoverEffect(returnBtnBg, returnBtnText);
      
      this.returnButtonContainer.add([returnBtnBg, returnBtnText]);
      
      returnBtnBg.on('pointerup', () => {
          this.cleanupDOM();
          this.scene.stop();
          
          // Restart the QuizScene with preserved data
          this.scene.start('QuizScene', {
              returnToQuiz: true,
              currentQuestionIndex: quizData.nextQuestionIndex,
              score: quizData.currentScore,
              questions: quizData.questions
          });
      });
    }

  
    this.isFullscreen = !!document.fullscreenElement;
    btnFullScreen.setVisible(!this.isFullscreen);
    btnBack.setVisible(this.isFullscreen);


    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => {
                btnFullScreen.setVisible(true);
                btnBack.setVisible(false);
            });
        } else {
            document.body.requestFullscreen().then(() => {
                btnFullScreen.setVisible(false);
                btnBack.setVisible(true);
                
                setTimeout(() => {
                    this.onWindowResize();
                    this.renderer.render(this.scene3D, this.camera);
                }, 100);
            });
        }
    };

    btnFullScreen.on('pointerup', toggleFullscreen);
    btnBack.on('pointerup', toggleFullscreen);

    this.events.on('pause', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });

    this.scale.on('fullscreenchange', () => {
      if (this.scale.isFullscreen) {
        btnFullScreen.setVisible(false);
        btnBack.setVisible(true);
      } else {
        btnFullScreen.setVisible(true);
        btnBack.setVisible(false);
      }

      this.onWindowResize();
    });

    // --- THREE Setup ---
    this.threeCanvas = document.createElement("canvas")
    this.threeCanvas.style.position = "absolute"
    this.threeCanvas.style.top = "0"
    this.threeCanvas.style.left = "0"
    this.threeCanvas.style.zIndex = "0"
    this.threeCanvas.style.pointerEvents = "none";
    document.body.appendChild(this.threeCanvas)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0xffffff, 0)

    this.scene3D = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.orbit = { radius: 130, theta: Math.PI / 8, phi: Math.PI / 2.5 }

    this.cubeGroup = new THREE.Group()
    this.scene3D.add(this.cubeGroup)

    this.unfoldProgress = 0;
    this.isSliding = false;
    this.currentPlan = "1";

    this.materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 1 }), // Red
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 1 }), // Green
      new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 1 }), // Blue
      new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 1 }), // Yellow
      new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, transparent: true, opacity: 1 }), // Pink
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 1 })  // Cyan
    ]

    this.faceGroups = {}
    this.originalRotations = {}

    this.initUnfoldPlans()
    this.buildFaceGroupsForPlan(this.currentPlan)

    this.createSliders()
    this.initMouseControls()

    
    this.lastResizeHeight = window.innerHeight;

    window.addEventListener("resize", () => {
      setTimeout(() => this.onWindowResize(), 100);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.onWindowResize(), 150);
    });

    this.onWindowResize();
  }

  initUnfoldPlans() {
    const d = 0.5

    this.unfoldPlans = {
      1: {
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
      2: {
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
      3: {
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
      4: {
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
      5: {
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
       6: {
        parents: {
          top: 'right',
          front: null,
          back: null,
          left: 'top',
          right: null
        },
        rotations: {
          front: new THREE.Euler(Math.PI / 2, 0, 0),
          back: new THREE.Euler(-Math.PI / 2, Math.PI, 0),
          left: new THREE.Euler(-Math.PI, Math.PI, 0),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0, 0.5, 0], position: [0, 0, d], rotation: [0, 0, 0] },
          back:   { pivot: [0, 0.5, 0], position: [0, 0, -d], rotation: [0, Math.PI, 0] },
          left:   { pivot: [0, 0.5, 0], position: [0, -d * 2, d], rotation: [Math.PI/2 , Math.PI, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      7:{
        parents: {
          top: 'right',
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
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          back:   { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      8:{
        parents: {
          top: 'right',
          front: 'top',
          back: 'left',
          left: null,
          right: null
        },
        rotations: {
          front: new THREE.Euler(0, -Math.PI, 0),
          back: new THREE.Euler(0, -Math.PI, 0),
          left: new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
          right: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
          top: new THREE.Euler(Math.PI, 0, 0)
        },
        transforms: {
          bottom: { pivot: [0, 0, 0], position: [0, -d, 0], rotation: [Math.PI / 2, 0, 0] },
          front:  { pivot: [0.5, 0, 0], position: [-d, -d, d], rotation: [0, -Math.PI/2, 0] },
          back:   { pivot: [0.5, -0.5, 0], position: [-d, d, -d], rotation: [0, Math.PI/2, 0] },
          left:   { pivot: [0, 0.5, 0], position: [-d, 0, 0], rotation: [0, -Math.PI / 2, 0] },
          right:  { pivot: [0, 0.5, 0], position: [d, 0, 0], rotation: [0, Math.PI / 2, 0] },
          top:    { pivot: [0, -0.5, 0], position: [0, d * 2, -d], rotation: [Math.PI / 2, 0, 0] }
        }
      },
      9: {
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
      10: {
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
      11: {
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
    const pivot = new THREE.Vector3(...pivotArr);
    const position = new THREE.Vector3(...positionArr);
    const rotation = new THREE.Euler(...rotationArr);

    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pivot);

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(pivot);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(edges);

    const rotatedPivot = pivot.clone().applyEuler(rotation);
    const adjustedPosition = position.sub(rotatedPivot);

    group.position.copy(adjustedPosition);
    group.rotation.copy(rotation);

    this.originalRotations[name] = {
      quaternion: new THREE.Quaternion().setFromEuler(rotation)
    };

    this.faceGroups[name] = group;
    return group;
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

  createSliders() {
    this.slidersContainer = document.createElement("div");
    this.slidersContainer.classList.add("slider-container");
    this.slidersContainer.style.top = "40px";
    this.slidersContainer.style.right = "40px";
    document.body.appendChild(this.slidersContainer);

    const unfoldLabel = document.createElement("div");
    unfoldLabel.innerText = "Abrir Cubo";
    unfoldLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(unfoldLabel);

    const unfoldSlider = document.createElement("input");
    unfoldSlider.type = "range";
    unfoldSlider.min = "0";
    unfoldSlider.max = "1";
    unfoldSlider.step = "0.01";
    unfoldSlider.value = "0";
    unfoldSlider.classList.add("custom-slider");
    unfoldSlider.style.marginBottom = "20px";

    function updateUnfoldSliderBackground(value) {
      const percentage = value * 100;
      unfoldSlider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    }

    unfoldSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.unfoldProgress = val;
      updateUnfoldSliderBackground(val);
      this.updateCubeTransforms();
    });

    updateUnfoldSliderBackground(0);
    this.slidersContainer.appendChild(unfoldSlider);

    const planLabel = document.createElement("div");
    planLabel.innerText = "Planificação";
    planLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(planLabel);

    this.planKeys = Object.keys(this.unfoldPlans);
    const planSlider = document.createElement("input");
    planSlider.type = "range";
    planSlider.min = "0";
    planSlider.max = `${this.planKeys.length - 1}`;
    planSlider.step = "1";
    planSlider.value = `${this.planKeys.indexOf(this.currentPlan)}`;
    planSlider.classList.add("custom-slider");

    function updatePlanSliderBackground(value) {
      const max = parseInt(planSlider.max);
      const percentage = (value / max) * 100;
      planSlider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    }

    const updatePlan = () => {
      const index = parseInt(planSlider.value);
      this.currentPlan = this.planKeys[index];
      planLabel.innerText = `Planificação: ${this.currentPlan}`;
      this.buildFaceGroupsForPlan(this.currentPlan);
      this.updateCubeTransforms();
      updatePlanSliderBackground(index);
    };

    planSlider.addEventListener("input", updatePlan);
    updatePlan();
    this.slidersContainer.appendChild(planSlider);

    const setSliding = (isSliding) => this.isSliding = isSliding;
    [unfoldSlider, planSlider].forEach(slider => {
      slider.addEventListener("mousedown", () => setSliding(true));
      slider.addEventListener("touchstart", () => setSliding(true));
    });
    document.addEventListener("mouseup", () => setSliding(false));
    document.addEventListener("touchend", () => setSliding(false));
  }


  initMouseControls() {
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastPinchDistance = 0;

    // --- Mouse Controls ---
    this.onMouseDown = (event) => {
      if (this.isSliding) return;

      this.isMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    };

    this.onMouseMove = (event) => {
      if (this.isSliding || !this.isMouseDown) return;

      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      this.orbit.theta -= deltaX * 0.01;
      this.orbit.phi -= deltaY * 0.01;
      this.orbit.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.orbit.phi));

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    };

    this.onMouseUp = () => {
      this.isMouseDown = false;
    };

    this.onMouseWheel = (event) => {
      if (this.isSliding) return;

      this.orbit.radius += event.deltaY * 0.1;
      this.orbit.radius = Math.max(80, Math.min(240, this.orbit.radius));
    };

    // --- Touch Controls ---
    this.onTouchStart = (event) => {
      if (this.isSliding) return;

      if (event.touches.length === 1) {
        this.isMouseDown = true;
        this.lastMouseX = event.touches[0].clientX;
        this.lastMouseY = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        this.isMouseDown = false;
        this.lastPinchDistance = this.getPinchDistance(event);
      }
    };

    this.onTouchMove = (event) => {
      if (this.isSliding) return;

      if (event.touches.length === 1 && this.isMouseDown) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.lastMouseX;
        const deltaY = touch.clientY - this.lastMouseY;

        this.orbit.theta -= deltaX * 0.01;
        this.orbit.phi -= deltaY * 0.01;
        this.orbit.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.orbit.phi));

        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
      } else if (event.touches.length === 2) {
        const newDistance = this.getPinchDistance(event);
        const delta = newDistance - this.lastPinchDistance;

        this.orbit.radius -= delta * 0.1;
        this.orbit.radius = Math.max(80, Math.min(240, this.orbit.radius));

        this.lastPinchDistance = newDistance;
      }
    };

    this.onTouchEnd = () => {
      this.isMouseDown = false;
      this.lastPinchDistance = 0;
    };

    // --- Pinch Helper ---
    this.getPinchDistance = (event) => {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // --- Event Listeners ---
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("wheel", this.onMouseWheel);

    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd);
  }


  checkFaceVisibility() {
      const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
      const faceData = {};
      
      faces.forEach(face => {
          if (this.faceGroups[face]) {
              const position = new THREE.Vector3();
              this.faceGroups[face].getWorldPosition(position);
              
              const normal = new THREE.Vector3(0, 0, 1);
              normal.applyQuaternion(this.faceGroups[face].quaternion);
              
              const cameraToFace = new THREE.Vector3().subVectors(position, this.camera.position).normalize();
              
              faceData[face] = {
                  position: position,
                  normal: normal,
                  cameraToFace: cameraToFace,
                  index: faces.indexOf(face)
              };
          }
      });

      faces.forEach(face => {
          if (faceData[face]) {
              this.materials[faceData[face].index].opacity = 1;
          }
      });

      if (this.unfoldProgress == 0) {

        faces.forEach(face => {
            if (faceData[face]) {
                this.materials[faceData[face].index].opacity = 0.6;
            }
        });

      } else if (this.unfoldProgress < 0.95) {

        for (const face1 in faceData) {
            const data1 = faceData[face1];
            
            const faceToCameraDot = data1.normal.dot(data1.cameraToFace);
            if (faceToCameraDot < 0) {
                this.materials[data1.index].opacity = 0.6;
                continue;
            }

            for (const face2 in faceData) {
                if (face1 === face2) continue;
                
                const data2 = faceData[face2];
                const face1ToFace2 = new THREE.Vector3().subVectors(data2.position, data1.position).normalize();
                
                if (face1ToFace2.dot(data1.normal) > 0.3) {
                    const face2ToFace1 = new THREE.Vector3().subVectors(data1.position, data2.position).normalize();
                    const face2ToCamera = new THREE.Vector3().subVectors(this.camera.position, data2.position).normalize();
                    
                    if (face2ToFace1.dot(face2ToCamera) > 0.5) {
                        this.materials[data1.index].opacity = 0.6;
                        break;
                    }
                }
            }
        } 
      } else {
        faces.forEach(face => {
            if (faceData[face]) {
                this.materials[faceData[face].index].opacity = 1;
            }
        });
      }
  }

  getCanvasOffsetRight(pixelsFromRight = 10) {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    return window.innerWidth - rect.right + pixelsFromRight;
  }

    addHoverEffect(button, text = null) {
        button.on('pointerover', () => {
            button.setScale(button.scaleX * 1.1);
            if (text) {
                text.setFontSize(22);
            }
        });

        button.on('pointerout', () => {
            button.setScale(button.scaleX / 1.1);
            if (text) {
                text.setFontSize(20);
            }
        });
    }

onWindowResize() {
    const savedOrbit = {
        radius: this.orbit.radius,
        theta: this.orbit.theta,
        phi: this.orbit.phi
    };

    const canvas = this.sys.game.canvas;
    const canvasBounds = canvas.getBoundingClientRect();

    if (this.threeCanvas) {
        Object.assign(this.threeCanvas.style, {
            width: `${canvasBounds.width}px`,
            height: `${canvasBounds.height}px`,
            left: `${canvasBounds.left}px`,
            top: `${canvasBounds.top}px`,
            position: 'absolute'
        });

        this.renderer.setSize(canvasBounds.width, canvasBounds.height);
        this.camera.aspect = canvasBounds.width / canvasBounds.height;
        this.camera.updateProjectionMatrix();

        this.orbit.radius = savedOrbit.radius;
        this.orbit.theta = savedOrbit.theta;
        this.orbit.phi = savedOrbit.phi;
    }

    if (this.slidersContainer) {
        const rightOffset = canvasBounds.width * 0.05;  // 5% from right
        const topOffset = canvasBounds.height * 0.05;   // 5% from top
        const sliderWidth = canvasBounds.width * 0.2;   // 20% of canvas width
        const padding = sliderWidth * 0.08;             // 8% of slider width
        const fontSize = sliderWidth * 0.07;            // 7% of slider width
        const thumbSize = sliderWidth * 0.1;            // 10% of slider width
        const sliderHeight = sliderWidth * 0.04;        // 4% of slider width

        this.slidersContainer.style.position = 'absolute';
        this.slidersContainer.style.left = `${canvasBounds.left + (canvasBounds.width - sliderWidth - rightOffset)}px`;
        this.slidersContainer.style.top = `${canvasBounds.top + topOffset}px`;
        this.slidersContainer.style.width = `${sliderWidth}px`;
        this.slidersContainer.style.padding = `${padding}px`;
        this.slidersContainer.style.borderRadius = `${padding}px`;
        
        const sliders = this.slidersContainer.querySelectorAll('.custom-slider');
        const labels = this.slidersContainer.querySelectorAll('.slider-label');
        
        labels.forEach(label => {
            label.style.fontSize = `${fontSize}px`;
            label.style.marginBottom = `${padding * 0.75}px`;
        });
        
        sliders.forEach(slider => {
            slider.style.height = `${sliderHeight}px`;
            slider.style.setProperty('--thumb-size', `${thumbSize}px`);
            slider.style.marginBottom = `${padding}px`;
            slider.style.borderRadius = `${sliderHeight}px`;
        });
    }

    this.renderer?.render(this.scene3D, this.camera);
}

  update() {
    const { radius, theta, phi } = this.orbit;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
    
    this.checkFaceVisibility();
    
    this.renderer.render(this.scene3D, this.camera);
  }

 cleanupDOM() {
    // Remove Three.js canvas
    if (this.scene.settings.data) {
        this.scene.settings.data = null;
    }
    if (this.threeCanvas?.parentNode) {
        this.threeCanvas.remove();
        this.threeCanvas = null;
    }

    // Remove sliders
    if (this.slidersContainer?.parentNode) {
        this.slidersContainer.remove();
        this.slidersContainer = null;
    }

    // Clean up Three.js resources
    if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
    }
    
    if (this.scene3D) {
        // Dispose of geometries and materials
        this.scene3D.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        this.scene3D = null;
    }

    // Remove event listeners
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("wheel", this.onMouseWheel);

    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
  }

}
