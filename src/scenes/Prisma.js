
export default class Prisma extends Phaser.Scene {
  constructor() {
    super({ key: "Prisma" })
    this.unfoldProgress = 0
    this.isSliding = false
    this.unfoldPlans = {}
    this.currentPlan = "1"
    this.sides = 5
    this.prismHeight = 2;
    this.minHeight = 0.5;
    this.maxHeight = 4;
    this.titleText = null;
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('bt_home', 'assets/bt_home.png');
    this.load.image('bt_screenback', 'assets/bt_screenback.png');
    this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
    this.load.image('bt_info', 'assets/bt_info.png');
    this.load.image('bt_voltar', 'assets/bt_voltar.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnVoltar = this.add.image(125, 556, 'bt_voltar').setScale(0.34).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(1000);
    let btnInfo = this.add.image(980, 555, 'bt_info').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);

    this.addHoverEffect(btnHome);
    this.addHoverEffect(btnVoltar);
    this.addHoverEffect(btnFullScreen);
    this.addHoverEffect(btnBack);
    this.addHoverEffect(btnInfo);

    this.updateTitleText();

    btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    btnVoltar.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('SelectingSolids');
    });


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

    this.scene3D = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.orbit = { radius: 8, theta: Math.PI / 8, phi: Math.PI / 3.8 }

    this.prismGroup = new THREE.Group()
    this.prismGroup.position.y = -1;
    this.scene3D.add(this.prismGroup)

    this.unfoldProgress = 0;
    this.sides = 5;
    this.prismHeight = 2;
    this.isSliding = false;
    this.currentPlan = "1";

    // Materials with transparency enabled
    this.materials = [];
    for (let i = 0; i < 12; i++) { // Enough materials for up to 10 sides + top/bottom
      const hue = (i * 360 / 12) % 360;
      const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
      this.materials.push(
        new THREE.MeshBasicMaterial({ 
          color: color, 
          side: THREE.DoubleSide, 
          transparent: true, 
          opacity: 1 
        })
      );
    }

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

    this.onWindowResize(); // Initial layout
  }

initUnfoldPlans() {
    
    const baseRadius = 1;
    const angleStep = (2 * Math.PI) / this.sides;
    const n = this.sides;

    const topZPosition = -baseRadius * Math.cos(Math.PI/this.sides);

    // Calculate the top face's final rotation
    const topFinalRotation = -(((n - 2) * Math.PI) / n) * 1.5;
 
    const pivotConfigs = {
        3: { x: 0.5, y: 0 },  // Triangular prism
        4: { x: 0, y: 1.0 },     // Cube
        5: { x: 0, y: 0.85 },  // Pentagonal
        6: { x: 0, y: 0.84 },  // Hexagonal
        7: { x: 0, y: 0.925 },   // Heptagonal
        8: { x: 0, y: 1 },   // Octagonal
        9: { x: 0, y: 1.085 },   // Nonagonal
        10: { x: 0, y: 1.175 }   // Decagonal
    };

    const config = pivotConfigs[n];

    this.unfoldPlans = {
        1: {
            parents: {
                top: 'side0',
                bottom: null,
            },
            rotations: {top: new THREE.Euler(Math.PI, 0, topFinalRotation)},
            transforms: {
                bottom: {
                    pivot: [0, 0, 0],
                    position: [0, 0, 0],
                    rotation: [Math.PI/2, 0, 0] 
                },
                top: { 
                    pivot: [config.x, config.y, 0],
                    position: [
                        0,
                        this.prismHeight, 
                        topZPosition
                    ],
                    rotation: [Math.PI/2, 0, topFinalRotation]
                }
            }
        }
    }

    for (let i = 0; i < n; i++) {
        const angle = angleStep * i;
        const nextAngle = angleStep * ((i + 1) % n);
        const x1 = baseRadius * Math.cos(angle);
        const z1 = baseRadius * Math.sin(angle);
        const x2 = baseRadius * Math.cos(nextAngle);
        const z2 = baseRadius * Math.sin(nextAngle);
        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;

        const internalAngle = (((n - 2) * Math.PI) / n) * i;
        const baseInternalAngle = ((n - 2) * Math.PI) / n;
        
        this.unfoldPlans[1].parents[`side${i}`] = null;

        // Calculate the correct unfolded rotation for each side
        const unfoldedRotation = new THREE.Euler(
            Math.PI/2 + (i % 2 === 0 ? 0 : -Math.PI) , // Rotate to stand upright
            0, // No rotation around Y axis
            (i % 2 === 0 ? angle - baseInternalAngle/2 : -(angle - baseInternalAngle/2) + Math.PI) // Alternate rotation for odd/even sides
        );
        
        this.unfoldPlans[1].rotations[`side${i}`] = unfoldedRotation;
        
        // INITIAL folded rotation (unchanged)
        this.unfoldPlans[1].transforms[`side${i}`] = {
            pivot: [0, this.prismHeight/2, 0],
            position: [midX, this.prismHeight/2, midZ],
            rotation: [
                0,
                internalAngle + baseInternalAngle/2,
                0
            ]
        };
    }
}

createFaceGroup(name, material, pivotArr, positionArr, rotationArr) {
    const pivot = new THREE.Vector3(...pivotArr);
    const position = new THREE.Vector3(...positionArr);
    const rotation = new THREE.Euler(...rotationArr);
    
    let geometry;
    const baseRadius = 1;

    if (name === 'top' || name === 'bottom') {
        // Create n-sided polygon for top and bottom
        const shape = new THREE.Shape();
        const angleStep = (2 * Math.PI) / this.sides;
        
        // Start at first point
        const firstX = baseRadius * Math.cos(0);
        const firstZ = baseRadius * Math.sin(0);
        shape.moveTo(firstX, firstZ);
        
        // Add remaining points
        for (let i = 1; i <= this.sides; i++) {
            const angle = angleStep * i;
            const x = baseRadius * Math.cos(angle);
            const z = baseRadius * Math.sin(angle);
            shape.lineTo(x, z);
        }
        
        geometry = new THREE.ShapeGeometry(shape);
    } else {
        // Rectangular faces for sides
        // Calculate side length based on n-sided polygon
        const sideLength = 2 * baseRadius * Math.sin(Math.PI / this.sides);
        geometry = new THREE.PlaneGeometry(sideLength, this.prismHeight);
    }

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
    // Clear existing faces
    for (const key in this.faceGroups) {
        const group = this.faceGroups[key];
        group.parent?.remove(group);
    }

    this.faceGroups = {};
    this.originalRotations = {};
    this.prismGroup.clear();

    const plan = this.unfoldPlans[planName];
    const { transforms } = plan;

    // Create bottom face
    const bottomGroup = this.createFaceGroup(
        'bottom',
        this.materials[0],
        transforms.bottom.pivot,
        transforms.bottom.position,
        transforms.bottom.rotation
    );
    this.prismGroup.add(bottomGroup);

    // Create top face
    const topGroup = this.createFaceGroup(
        'top',
        this.materials[1],
        transforms.top.pivot,
        transforms.top.position,
        transforms.top.rotation
    );
    this.prismGroup.add(topGroup);

    // Create side faces
    for (let i = 0; i < this.sides; i++) {
        const sideName = `side${i}`;
        const sideTransform = transforms[sideName];
        const sideGroup = this.createFaceGroup(
            sideName,
            this.materials[2 + i], // First two materials are for top and bottom
            sideTransform.pivot,
            sideTransform.position,
            sideTransform.rotation
        );
        this.prismGroup.add(sideGroup);
    }

    this.applyParenting(planName);
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
        this.prismGroup.add(group)
      }
    }
  }

  updatePrismTransforms() {
    const plan = this.unfoldPlans[this.currentPlan]
    const rotations = plan.rotations

    for (const name in this.faceGroups) {
      if (name === 'bottom') continue
      const group = this.faceGroups[name]

      const startQuat = this.originalRotations[name].quaternion
      const endQuat = new THREE.Quaternion().setFromEuler(rotations[name] || new THREE.Euler(0, 0, 0))
      const currentQuat = new THREE.Quaternion()
      currentQuat.slerpQuaternions(startQuat, endQuat, this.unfoldProgress)
      group.quaternion.copy(currentQuat)
    }

    //this.debugFacePositions();
  }

  debugFacePositions() {
    if (this.faceGroups.top && this.faceGroups.bottom && this.faceGroups.side0) {
        const topPos = new THREE.Vector3();
        this.faceGroups.top.getWorldPosition(topPos);
        
        const bottomPos = new THREE.Vector3();
        this.faceGroups.bottom.getWorldPosition(bottomPos);
        
        const side0Pos = new THREE.Vector3();
        this.faceGroups.side0.getWorldPosition(side0Pos);
        
        console.log('--- Face Positions ---');
        console.log('Top:', topPos);
        console.log('Bottom:', bottomPos);
        console.log('Side0:', side0Pos);
        console.log('Unfold Progress:', this.unfoldProgress);
        console.log('Current Plan:', this.currentPlan);
    }
}

createSliders() {
    // Create main container for all sliders
    this.slidersContainer = document.createElement("div");
    this.slidersContainer.classList.add("slider-container");
    document.body.appendChild(this.slidersContainer);

    // Function to update slider gradient (reusable)
    const updateSliderBackground = (slider, value, min = 0, max = 1) => {
      const percentage = ((value - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    };

    // --- UNFOLD SLIDER ---
    const unfoldLabel = document.createElement("div");
    unfoldLabel.innerText = "Abrir Figura";
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

    unfoldSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.unfoldProgress = val;
      updateSliderBackground(unfoldSlider, val);
      this.updatePrismTransforms();
    });

    updateSliderBackground(unfoldSlider, 0);
    this.slidersContainer.appendChild(unfoldSlider);

    // --- SIDES SLIDER ---
    const sidesLabel = document.createElement("div");
    sidesLabel.innerText = `Lados: ${this.sides}`;
    sidesLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(sidesLabel);

    const sidesSlider = document.createElement("input");
    sidesSlider.type = "range";
    sidesSlider.min = "3";
    sidesSlider.max = "10";
    sidesSlider.step = "1";
    sidesSlider.value = `${this.sides}`;
    sidesSlider.classList.add("custom-slider");
    sidesSlider.style.marginBottom = "20px";

    sidesSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sides = val;
      sidesLabel.innerText = `Lados: ${val}`;
      updateSliderBackground(sidesSlider, val, 3, 10);
      this.initUnfoldPlans();
      this.buildFaceGroupsForPlan(this.currentPlan);
      this.updatePrismTransforms();
      this.updateTitleText();
    });

    updateSliderBackground(sidesSlider, this.sides, 3, 10);
    this.slidersContainer.appendChild(sidesSlider);

    // --- HEIGHT SLIDER ---
    const heightLabel = document.createElement("div");
    heightLabel.innerText = `Altura: ${this.prismHeight.toFixed(1)}`;
    heightLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(heightLabel);

    const heightSlider = document.createElement("input");
    heightSlider.type = "range";
    heightSlider.min = this.minHeight.toString();
    heightSlider.max = this.maxHeight.toString();
    heightSlider.step = "0.1";
    heightSlider.value = this.prismHeight.toString();
    heightSlider.classList.add("custom-slider");

    heightSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.prismHeight = val;
      heightLabel.innerText = `Altura: ${val.toFixed(1)}`;
      updateSliderBackground(heightSlider, val, this.minHeight, this.maxHeight);
      this.initUnfoldPlans();
      this.buildFaceGroupsForPlan(this.currentPlan);
      this.updatePrismTransforms();
    });

    updateSliderBackground(heightSlider, this.prismHeight, this.minHeight, this.maxHeight);
    this.slidersContainer.appendChild(heightSlider);

    // --- GLOBAL SLIDING CONTROL ---
    const setSliding = (isSliding) => this.isSliding = isSliding;
    
    [unfoldSlider, sidesSlider, heightSlider].forEach(slider => {
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
    // Get all face names dynamically from faceGroups
    const faces = Object.keys(this.faceGroups);
    
    const faceData = {};
    
    // First collect all face data
    faces.forEach(face => {
        const position = new THREE.Vector3();
        this.faceGroups[face].getWorldPosition(position);
        
        const normal = new THREE.Vector3(0, 0, 1);
        normal.applyQuaternion(this.faceGroups[face].quaternion);
        
        // Calculate camera direction to face
        const cameraToFace = new THREE.Vector3().subVectors(position, this.camera.position).normalize();
        
        // Find material index - top is 1, bottom is 0, sides start from 2
        let materialIndex;
        if (face === 'top') materialIndex = 1;
        else if (face === 'bottom') materialIndex = 0;
        else materialIndex = 2 + parseInt(face.replace('side', '')); // side0 = 2, side1 = 3, etc.
        
        faceData[face] = {
            position: position,
            normal: normal,
            cameraToFace: cameraToFace,
            materialIndex: materialIndex
        };
    });

    // Reset all opacities to 1 (opaque)
    faces.forEach(face => {
        if (faceData[face]) {
            this.materials[faceData[face].materialIndex].opacity = 1;
        }
    });

    if (this.unfoldProgress == 0) {
        // When fully folded, make all faces semi-transparent
        faces.forEach(face => {
            if (faceData[face]) {
                this.materials[faceData[face].materialIndex].opacity = 0.6;
            }
        });
    } else if (this.unfoldProgress < 0.95) {
        // Check each face against all others
        for (const face1 in faceData) {
            const data1 = faceData[face1];
            
            // First check if face is facing away from camera
            const faceToCameraDot = data1.normal.dot(data1.cameraToFace);
            if (faceToCameraDot < 0) {
                this.materials[data1.materialIndex].opacity = 0.6;
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
                        this.materials[data1.materialIndex].opacity = 0.6;
                        break;
                    }
                }
            }
        }
    } else {
        // When fully unfolded, make all faces opaque
        faces.forEach(face => {
            if (faceData[face]) {
                this.materials[faceData[face].materialIndex].opacity = 1;
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
    // Save current camera orbit values before resize
    const savedOrbit = {
        radius: this.orbit.radius,
        theta: this.orbit.theta,
        phi: this.orbit.phi
    };

    // Get the game canvas and its display size
    const canvas = this.sys.game.canvas;
    const canvasBounds = canvas.getBoundingClientRect();

    // === Three.js Canvas Handling ===
    if (this.threeCanvas) {
        // Match Three.js canvas to Phaser canvas size and position
        Object.assign(this.threeCanvas.style, {
            width: `${canvasBounds.width}px`,
            height: `${canvasBounds.height}px`,
            left: `${canvasBounds.left}px`,
            top: `${canvasBounds.top}px`,
            position: 'absolute'
        });

        // Update renderer and camera
        this.renderer.setSize(canvasBounds.width, canvasBounds.height);
        this.camera.aspect = canvasBounds.width / canvasBounds.height;
        this.camera.updateProjectionMatrix();

        // Restore camera position after resize
        this.orbit.radius = savedOrbit.radius;
        this.orbit.theta = savedOrbit.theta;
        this.orbit.phi = savedOrbit.phi;
    }

    // === Sliders Positioning - Relative to Game Canvas ===
    if (this.slidersContainer) {
        // Proportional values (all based on canvas width)
        const rightOffset = canvasBounds.width * 0.05;  // 5% from right
        const topOffset = canvasBounds.height * 0.05;   // 5% from top
        const sliderWidth = canvasBounds.width * 0.2;   // 20% of canvas width
        const padding = sliderWidth * 0.08;             // 8% of slider width
        const fontSize = sliderWidth * 0.07;            // 7% of slider width
        const thumbSize = sliderWidth * 0.1;            // 10% of slider width
        const sliderHeight = sliderWidth * 0.04;        // 4% of slider width

        // Apply styles
        this.slidersContainer.style.position = 'absolute';
        this.slidersContainer.style.left = `${canvasBounds.left + (canvasBounds.width - sliderWidth - rightOffset)}px`;
        this.slidersContainer.style.top = `${canvasBounds.top + topOffset}px`;
        this.slidersContainer.style.width = `${sliderWidth}px`;
        this.slidersContainer.style.padding = `${padding}px`;
        this.slidersContainer.style.borderRadius = `${padding}px`;
        
        // Update all slider elements
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

    // Update title text position
    if (this.titleText) {
        this.titleText.setPosition(this.scale.width / 2, 10);
    }

    // Force a re-render
    this.renderer?.render(this.scene3D, this.camera);
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

    if (this.slidersContainer?.parentNode) {
      this.slidersContainer.remove();
      this.slidersContainer = null;
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

  updateTitleText() {
    const typeNames = {
      3: "Triangular",
      4: "Quadrangular",
      5: "Pentagonal",
      6: "Hexagonal",
      7: "Heptagonal",
      8: "Octogonal",
      9: "Eneagonal",
      10: "Decagonal"
    };

    const prismType = typeNames[this.sides] || "Poligonal";
    const fullTitle = "Prisma\n" + prismType;

    if (this.titleText) {
      this.titleText.destroy();
    }

    this.titleText = this.add.text(this.scale.width / 2, 10, fullTitle, {
      fontFamily: 'Snap ITC',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: -15
    }).setOrigin(0.5, 0);

    this.titleText.setShadow(2, 2, '#FFA500', 3);
    this.titleText.setDepth(1000);
  }
}
