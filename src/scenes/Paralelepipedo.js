export default class Paralelepipedo extends Phaser.Scene {
  constructor() {
    super({ key: "Paralelepipedo" })
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
    this.load.image('bt_info', 'assets/bt_info.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(1000);
    let btnInfo = this.add.image(980, 555, 'bt_info').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);

    this.addHoverEffect(btnHome);
    this.addHoverEffect(btnFullScreen);
    this.addHoverEffect(btnBack);
    this.addHoverEffect(btnInfo);

    btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    const toggleFullscreen = () => {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
            btnFullScreen.setVisible(true);
            btnBack.setVisible(false);
        } else {
            // Reattach Three.js canvas and sliders before going fullscreen
            document.body.appendChild(this.threeCanvas);
            if (this.unfoldSliderContainer) document.body.appendChild(this.unfoldSliderContainer);
            
            this.scale.startFullscreen();
            btnFullScreen.setVisible(false);
            btnBack.setVisible(true);
        }
        // Force resize after fullscreen change
        this.onWindowResize();
    };

    btnFullScreen.on('pointerup', toggleFullscreen);
    btnBack.on('pointerup', toggleFullscreen);

    this.scale.on('fullscreenchange', () => {
      if (this.scale.isFullscreen) {
        btnFullScreen.setVisible(false);
        btnBack.setVisible(true);
      } else {
        btnFullScreen.setVisible(true);
        btnBack.setVisible(false);
      }
      // Resize after fullscreen change
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

    this.scene3D = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.orbit = { radius: 5, theta: Math.PI / 8, phi: Math.PI / 2.5 }

    this.cubeGroup = new THREE.Group()
    this.scene3D.add(this.cubeGroup)

    this.unfoldProgress = 0;
    this.isSliding = false;
    this.currentPlan = "1";

    // Materials with transparency enabled
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

    this.createUnfoldSlider()
    this.initMouseControls()

    
    this.lastResizeHeight = window.innerHeight;

    window.addEventListener("resize", () => {
      setTimeout(() => this.onWindowResize(), 100);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.onWindowResize(), 150);
    });

    this.onWindowResize(); // Initial layout
  }

  initUnfoldPlans() {
    const sideHeight = 2; // Height of the side rectangles
    const squareSize = 1; // Size of top/bottom squares
    const d = squareSize / 2; // Half of square size for positioning

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
          bottom: { 
            pivot: [0, 0, 0], 
            position: [0, -d*2, 0], 
            rotation: [Math.PI / 2, 0, 0] 
          },
          front:  { 
            pivot: [0, sideHeight/2, 0], 
            position: [0, 0, d], 
            rotation: [0, 0, 0] 
          },
          back:   { 
            pivot: [0, sideHeight/2, 0], 
            position: [0, 0, -d], 
            rotation: [0, Math.PI, 0] 
          },
          left:   { 
            pivot: [0, sideHeight/2, 0], 
            position: [-d, 0, 0], 
            rotation: [0, -Math.PI / 2, 0] 
          },
          right:  { 
            pivot: [0, sideHeight/2, 0], 
            position: [d, 0, 0], 
            rotation: [0, Math.PI / 2, 0] 
          },
          top:    { 
            pivot: [0, -d, 0], 
            position: [0, sideHeight, -d], 
            rotation: [Math.PI / 2, 0, 0] 
          }
        }
      },
    }
  }


   createFaceGroup(name, material, pivotArr, positionArr, rotationArr) {
    const pivot = new THREE.Vector3(...pivotArr);
    const position = new THREE.Vector3(...positionArr);
    const rotation = new THREE.Euler(...rotationArr);

    // Create the face mesh with different dimensions for sides vs top/bottom
    let width, height;
    if (name === 'top' || name === 'bottom') {
      // Square faces for top and bottom (1:1 ratio)
      width = 1;
      height = 1;
    } else {
      // Rectangular faces for sides (2:1 ratio)
      width = 1;
      height = 2;
    }

    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pivot);

    // Create edge geometry and line segments
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

  createUnfoldSlider() {
    this.unfoldSliderContainer = document.createElement("div");
    const sliderContainer = this.unfoldSliderContainer;
    sliderContainer.classList.add("slider-container");
    

    const sliderLabel = document.createElement("div");
    sliderLabel.innerText = "Abrir Figura";
    sliderLabel.classList.add("slider-label");
    sliderContainer.appendChild(sliderLabel);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = "0";
    slider.classList.add("custom-slider");

    function updateSliderBackground(value) {
      const percentage = value * 100;
      slider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    }

    slider.addEventListener("mousedown", () => this.isSliding = true);
    slider.addEventListener("touchstart", () => this.isSliding = true);
    document.addEventListener("mouseup", () => this.isSliding = false);
    document.addEventListener("touchend", () => this.isSliding = false);

    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.unfoldProgress = val;
      updateSliderBackground(val);
      this.updateCubeTransforms();
    });

    updateSliderBackground(0);

    sliderContainer.appendChild(slider);
    document.body.appendChild(sliderContainer);
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

      this.orbit.radius += event.deltaY * 0.01;
      this.orbit.radius = Math.max(1, Math.min(10, this.orbit.radius));
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

        this.orbit.radius -= delta * 0.01;
        this.orbit.radius = Math.max(1, Math.min(10, this.orbit.radius));

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
      
      // First collect all face data
      faces.forEach(face => {
          if (this.faceGroups[face]) {
              const position = new THREE.Vector3();
              this.faceGroups[face].getWorldPosition(position);
              
              const normal = new THREE.Vector3(0, 0, 1);
              normal.applyQuaternion(this.faceGroups[face].quaternion);
              
              // Calculate camera direction to face
              const cameraToFace = new THREE.Vector3().subVectors(position, this.camera.position).normalize();
              
              faceData[face] = {
                  position: position,
                  normal: normal,
                  cameraToFace: cameraToFace,
                  index: faces.indexOf(face)
              };
          }
      });

      // Reset all opacities to 1 (opaque)
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

        // Check each face against all others
        for (const face1 in faceData) {
            const data1 = faceData[face1];
            
            // First check if face is facing away from camera
            const faceToCameraDot = data1.normal.dot(data1.cameraToFace);
            if (faceToCameraDot < 0) {
                this.materials[data1.index].opacity = 0.6;
                continue;
            }

            // Then check if other faces are in front of this one
            for (const face2 in faceData) {
                if (face1 === face2) continue;
                
                const data2 = faceData[face2];
                const face1ToFace2 = new THREE.Vector3().subVectors(data2.position, data1.position).normalize();
                
                // If face2 is in front of face1 (relative to face1's normal)
                if (face1ToFace2.dot(data1.normal) > 0.3) {
                    // And if face2 is between camera and face1
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


  onWindowResize() {
    // Get the appropriate container for fullscreen
    const container = this.scale.isFullscreen ? document.fullscreenElement : document.body;
    
    // Ensure canvas is in the right container
    if (this.threeCanvas?.parentNode !== container) {
        container.appendChild(this.threeCanvas);
    }

    // Ensure sliders are in the right container
    if (this.unfoldSliderContainer?.parentNode !== container) {
        container.appendChild(this.unfoldSliderContainer);
    }


    // Rest of your existing resize logic...
    const width = container === document.body ? window.innerWidth : container.clientWidth;
    const height = container === document.body ? window.innerHeight : container.clientHeight;

    // === Camera update: Keep FOV fixed, adjust orbit to maintain visual size ===
    if (this.camera) {
        this.camera.fov = 75; // Fixed FOV
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Adjust orbit distance based on screen height
        const baseHeight = 600; // Reference height
        this.orbit.radius = 6 * (baseHeight / Math.max(height, 400)); // Prevent extreme zoom
    }

    // Adjust the orbit distance (z distance) to compensate for screen height
    const baseHeight = 600; // Your reference height
    this.orbit.radius = 6 * (baseHeight / height); // Smaller screens = larger radius

    // === Resize renderer ===
    if (this.renderer) {
        this.renderer.setSize(width, height);
        this.renderer.domElement.style.width = `${width}px`;
        this.renderer.domElement.style.height = `${height}px`;
    }

    // === Update edge line material resolution ===
    if (this.faceGroups) {
      for (const group of Object.values(this.faceGroups)) {
        for (const child of group.children) {
          if (child.material && child.material.isLineMaterial) {
            child.material.resolution.set(width, height);
          }
        }
      }
    }

    // === Reposition and scale sliders to stay within canvas ===
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const rightOffset = window.innerWidth - rect.right + 10;
    const topOffset = rect.top + 45;

    const sliderWidth = Math.min(width * 0.2, 220);
    const sliderPadding = `${Math.max(height * 0.01, 8)}px`;

    if (this.unfoldSliderContainer) {
        const canvas = this.sys.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate responsive dimensions
        const rightOffset = window.innerWidth - rect.right + 10;
        const topOffset = rect.top + 45;
        
        // Dynamic sizing based on window width
        const baseWidth = 220; // Default width
        const minWidth = 180;  // Minimum width
        const maxWidth = 300;   // Maximum width
        
        // Calculate width (20% of width but within bounds)
        const sliderWidth = Math.min(
            Math.max(width * 0.2, minWidth), 
            maxWidth
        );
        
        // Adjust font size proportionally
        const baseFontSize = 16;
        const fontSize = Math.max(baseFontSize * (sliderWidth / baseWidth), 14);
        
        // Calculate responsive padding
        const paddingVertical = Math.max(height * 0.015, 10);
        const paddingHorizontal = Math.max(width * 0.02, 12);
        
        Object.assign(this.unfoldSliderContainer.style, {
            right: `${rightOffset}px`,
            top: `${topOffset}px`,
            width: `${sliderWidth}px`,
            padding: `${paddingVertical}px ${paddingHorizontal}px`,
            fontSize: `${fontSize}px`,
            borderRadius: `${Math.min(sliderWidth * 0.07, 16)}px`
        });

        // Update slider thumb size
        const slider = this.unfoldSliderContainer.querySelector('.custom-slider');
        if (slider) {
            const thumbSize = Math.max(sliderWidth * 0.11, 20);
            slider.style.setProperty('--thumb-size', `${thumbSize}px`);
        }
    }

    // Recheck layout 1 frame later to fix mobile UI shift issues
    clearTimeout(this.resizeRetryTimeout);
    this.resizeRetryTimeout = setTimeout(() => {
      if (window.innerHeight !== this.lastResizeHeight) {
        this.lastResizeHeight = window.innerHeight;
        this.onWindowResize(); // Retry resize
      }
    }, 150);

  }

  update() {
    const { radius, theta, phi } = this.orbit;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
    
    // Update face visibility before rendering
    this.checkFaceVisibility();
    
    this.renderer.render(this.scene3D, this.camera);
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

  // Mouse listeners
  window.removeEventListener("mousedown", this.onMouseDown);
  window.removeEventListener("mouseup", this.onMouseUp);
  window.removeEventListener("mousemove", this.onMouseMove);
  window.removeEventListener("wheel", this.onMouseWheel);

  window.removeEventListener("touchstart", this.onTouchStart)
  window.removeEventListener("touchmove", this.onTouchMove)
  window.removeEventListener("touchend", this.onTouchEnd)
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
