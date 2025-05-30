export default class Cilindro extends Phaser.Scene {
  constructor() {
    super({ key: 'Cilindro' });
    this.unfoldProgress = 0;
    this.isSliding = false;
    this.cylinderHeight = 2;
    this.minHeight = 0.5;
    this.maxHeight = 4;
    this.radius = 1;
    this.minRadius = 0.5;
    this.maxRadius = 2;
    this.slices = 50;
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('bt_home', 'assets/bt_home.png');
    this.load.image('bt_screenback', 'assets/bt_screenback.png');
    this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
    this.load.image('bt_info', 'assets/bt_info.png');
    this.load.image('bt_voltar', 'assets/bt_voltar.png');
    this.load.image('bt_butaoVazio', 'assets/bt_butaoVazio.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    
    // Add navigation buttons
    let btnHome = this.add.image(45, 555, 'bt_home').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnVoltar = this.add.image(125, 556, 'bt_voltar').setScale(0.34).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnFullScreen = this.add.image(45, 45, 'bt_fullscreen').setScale(0.35).setInteractive({ useHandCursor: true }).setDepth(1000);
    let btnBack = this.add.image(45, 45, 'bt_screenback').setScale(0.35).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(1000);
    let btnInfo = this.add.image(980, 555, 'bt_info').setScale(0.65).setInteractive({ useHandCursor: true }).setDepth(1000);
    
    const titleText = this.add.text(this.scale.width / 2, 20, 'Cilindro', {
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
    this.addHoverEffect(btnInfo);

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
              currentQuestionIndex: quizData.nextQuestionIndex + 1,
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

    // THREE.js setup
    this.threeCanvas = document.createElement('canvas');
    Object.assign(this.threeCanvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '0',
      pointerEvents: 'none'
    });
    document.body.appendChild(this.threeCanvas);

    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.threeCanvas, 
      alpha: true, 
      antialias: true
    });
    this.scene3D = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.orbit = { radius: 6, theta: Math.PI / 35, phi: Math.PI / 3 };

    this.initMouseControls();

    this.materials = {
      lateral: new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.NormalBlending
      }),
      top: new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.6 
      }),
      bottom: new THREE.MeshBasicMaterial({ 
        color: 0x0000ff, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.6 
      }),
    };

    this.cylinderGroup = new THREE.Group();
    this.scene3D.add(this.cylinderGroup);

    this.createCilindroGeometry();
    this.createSliders();
    this.onWindowResize();


    window.addEventListener("resize", () => {
      setTimeout(() => this.onWindowResize(), 100);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.onWindowResize(), 150);
    });
  }

 createCilindroGeometry() {
  const radius = this.radius;
  const cylinderHeight = this.cylinderHeight;
  const slices = this.slices;
  const lateralWidth = 2 * Math.PI * radius;
  const angleStep = (2 * Math.PI) / slices;
  const segmentWidth = lateralWidth / slices;

  // Clear existing geometry if it exists
  if (this.lateralPivot) {
    this.cylinderGroup.remove(this.lateralPivot);
    this.cylinderGroup.remove(this.topPivot);
    this.cylinderGroup.remove(this.bottomPivot);
  }

  // --- Lateral Surface ---
  this.lateralPivot = new THREE.Group();
  
  // Create lateral geometry
  const lateralGeometry = new THREE.PlaneGeometry(lateralWidth, cylinderHeight, slices, 1);
  this.lateralMesh = new THREE.Mesh(lateralGeometry, this.materials.lateral);
  
  // Create edge lines for lateral surface
  const lateralEdges = new THREE.EdgesGeometry(lateralGeometry);
  const lateralLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2,
    visible: false
  });
  this.lateralLines = new THREE.LineSegments(lateralEdges, lateralLineMaterial);
  
  // Create a container group for mesh and lines
  this.lateralGroup = new THREE.Group();
  this.lateralGroup.add(this.lateralMesh);
  this.lateralGroup.add(this.lateralLines);
  
  // Position the lateral group
  this.lateralGroup.position.x = 0;
  this.lateralPivot.add(this.lateralGroup);
  this.lateralPivot.position.set(0, 0, 0);
  this.lateralPivot.rotation.y = -Math.PI/2;
  this.cylinderGroup.add(this.lateralPivot);

  // Store original and target positions for animation
  this.vertexData = [];
  const positionAttribute = lateralGeometry.getAttribute('position');
  const positions = positionAttribute.array;
  
  const lateralStep = lateralWidth/slices;
  
  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3;
    const segment = Math.floor(vertexIndex % (slices + 1));
    const row = Math.floor(vertexIndex / (slices + 1));
    
    // Cylindrical coordinates (initial positions)
    const angle = segment * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = positions[i + 1];
    
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
    
    // Flat coordinates (target positions)
    const targetX = -radius;
    const targetZ = -(-lateralWidth/2 + (lateralStep*segment));
    
    // Store both positions for interpolation
    this.vertexData.push({
      original: new THREE.Vector3(x, y, z),
      target: new THREE.Vector3(targetX, y, targetZ)
    });
  }
  positionAttribute.needsUpdate = true;

  // --- Top Face ---
  this.topPivot = new THREE.Group();
  this.topPivot.position.set(0, cylinderHeight / 2, -radius);

  const topGeometry = new THREE.CircleGeometry(radius, 64);
  this.topMesh = new THREE.Mesh(topGeometry, this.materials.top);
  
  const topEdges = new THREE.EdgesGeometry(topGeometry);
  const topLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2,
    visible: true
  });
  this.topLines = new THREE.LineSegments(topEdges, topLineMaterial);
  
  // Create container group for top face
  this.topGroup = new THREE.Group();
  this.topGroup.add(this.topMesh);
  this.topGroup.add(this.topLines);
  
  this.topGroup.rotation.x = -Math.PI / 2;
  this.topGroup.position.z = radius;
  this.topPivot.add(this.topGroup);
  this.cylinderGroup.add(this.topPivot);

  // --- Bottom Face ---
  this.bottomPivot = new THREE.Group();
  this.bottomPivot.position.set(0, -cylinderHeight / 2, -radius);

  const bottomGeometry = new THREE.CircleGeometry(radius, 64);
  this.bottomMesh = new THREE.Mesh(bottomGeometry, this.materials.bottom);
  
  // Create edge lines for bottom face (always visible)
  const bottomEdges = new THREE.EdgesGeometry(bottomGeometry);
  const bottomLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2,
    visible: true
  });
  this.bottomLines = new THREE.LineSegments(bottomEdges, bottomLineMaterial);
  
  // Create container group for bottom face
  this.bottomGroup = new THREE.Group();
  this.bottomGroup.add(this.bottomMesh);
  this.bottomGroup.add(this.bottomLines);
  
  this.bottomGroup.rotation.x = Math.PI / 2;
  this.bottomGroup.position.z = radius;
  this.bottomPivot.add(this.bottomGroup);
  this.cylinderGroup.add(this.bottomPivot);
}

updateUnfoldAnimation() {
  const p = this.unfoldProgress;
  const lateralGeometry = this.lateralMesh.geometry;
  const positionAttribute = lateralGeometry.getAttribute('position');
  const positions = positionAttribute.array;
  
  // Interpolate vertex positions
  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3;
    const { original, target } = this.vertexData[vertexIndex];
    positions[i] = original.x * (1 - p) + target.x * p;
    positions[i + 1] = original.y * (1 - p) + target.y * p;
    positions[i + 2] = original.z * (1 - p) + target.z * p;
  }
  positionAttribute.needsUpdate = true;

  // Update edge lines
  this.lateralLines.geometry.dispose();
  this.lateralLines.geometry = new THREE.EdgesGeometry(lateralGeometry);

  // Filter edges based on unfold progress
  const edgesGeometry = this.lateralLines.geometry;
  const positions2 = edgesGeometry.attributes.position;
  const newPositions = [];
  const width = 2 * Math.PI * this.radius;
  const edgeTolerance = 0.01 * width; // 1% tolerance for edge detection

  for (let i = 0; i < positions2.count; i += 2) {
    const y1 = positions2.getY(i);
    const y2 = positions2.getY(i + 1);
    const z1 = positions2.getZ(i);
    const z2 = positions2.getZ(i + 1);

    // Horizontal edges (top and bottom)
    const isHorizontal = Math.abs(y1 - y2) < 0.001;

    // Vertical edges at extreme left/right
    const isLeftEdge = Math.min(Math.abs(z1 + width/2), Math.abs(z2 + width/2)) < edgeTolerance;
    const isRightEdge = Math.min(Math.abs(z1 - width/2), Math.abs(z2 - width/2)) < edgeTolerance;
    const isVerticalEdge = isLeftEdge || isRightEdge;

    // Keep either horizontal edges or edge verticals
    if (isHorizontal || isVerticalEdge) {
      newPositions.push(
        positions2.getX(i), positions2.getY(i), positions2.getZ(i),
        positions2.getX(i + 1), positions2.getY(i + 1), positions2.getZ(i + 1)
      );
    }

    const filteredGeometry = new THREE.BufferGeometry();
    filteredGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    
    this.lateralLines.geometry.dispose();
    this.lateralLines.geometry = filteredGeometry;
  }

  this.lateralLines.material.visible = true;
  this.topLines.material.visible = true;
  this.bottomLines.material.visible = true;

  // Animate faces
  this.topPivot.rotation.x = -p * Math.PI / 2;
  this.bottomPivot.rotation.x = p * Math.PI / 2;
  
  this.updateFaceVisibility();
}

checkSurfaceVisibility() {
  const surfaces = {
    lateral: {
      mesh: this.lateralMesh,
      material: this.materials.lateral,
      getNormal: () => {
        const normal = new THREE.Vector3(1, 0, 0);
        normal.applyQuaternion(this.lateralGroup.quaternion);
        return normal;
      }
    },
    top: {
      mesh: this.topMesh,
      material: this.materials.top,
      getNormal: () => {
        const normal = new THREE.Vector3(0, 1, 0);
        normal.applyQuaternion(this.topGroup.quaternion);
        return normal;
      }
    },
    bottom: {
      mesh: this.bottomMesh,
      material: this.materials.bottom,
      getNormal: () => {
        const normal = new THREE.Vector3(0, -1, 0);
        normal.applyQuaternion(this.bottomGroup.quaternion);
        return normal;
      }
    }
  };

    for (const [name, surface] of Object.entries(surfaces)) {
      if (!surface.mesh) continue;

      // Get world position of the surface
      const position = new THREE.Vector3();
      surface.mesh.getWorldPosition(position);
      
      // Get surface normal
      const normal = surface.getNormal();
      
      // Calculate camera-to-surface vector
      const cameraToSurface = new THREE.Vector3().subVectors(
        position, 
        this.camera.position
      ).normalize();
      
      // Calculate dot product between normal and view direction
      const dotProduct = normal.dot(cameraToSurface);
      
      if (this.unfoldProgress > 0.95) {
        surface.material.opacity = 1;
      } 
      else if (this.unfoldProgress < 0.1) {
        surface.material.opacity = 0.6;
      }
      // For partially unfolded state
      else {
        // Calculate visibility based on viewing angle
        const visibility = 0.4 + 0.6 * (1 - Math.abs(dotProduct));
        surface.material.opacity = visibility;
      }
    }
  }
    
  updateFaceVisibility() {
    const opacity = this.unfoldProgress < 0.95 ? 0.6 : 1.0;
    
    this.materials.lateral.opacity = opacity;
    this.materials.top.opacity = opacity;
    this.materials.bottom.opacity = opacity;
  }

  createSliders() {
    this.slidersContainer = document.createElement("div");
    this.slidersContainer.classList.add("slider-container");
    this.slidersContainer.style.top = "40px";
    this.slidersContainer.style.right = "40px";
    document.body.appendChild(this.slidersContainer);

    const updateSliderBackground = (slider, value, min = 0, max = 1) => {
      const percentage = ((value - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    };

    // --- SLIDER DE ABERTURA DO CILINDRO ---
    const unfoldLabel = document.createElement("div");
    unfoldLabel.innerText = "Abrir Cilindro";
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
      this.updateUnfoldAnimation();
    });

    updateSliderBackground(unfoldSlider, 0);
    this.slidersContainer.appendChild(unfoldSlider);

    // --- SLIDER DE ALTURA ---
    const heightLabel = document.createElement("div");
    heightLabel.innerText = `Altura: ${this.cylinderHeight.toFixed(1)}`;
    heightLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(heightLabel);

    const heightSlider = document.createElement("input");
    heightSlider.type = "range";
    heightSlider.min = this.minHeight.toString();
    heightSlider.max = this.maxHeight.toString();
    heightSlider.step = "0.1";
    heightSlider.value = this.cylinderHeight.toString();
    heightSlider.classList.add("custom-slider");
    heightSlider.style.marginBottom = "20px";

    heightSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.cylinderHeight = val;
      heightLabel.innerText = `Altura: ${val.toFixed(1)}`;
      updateSliderBackground(heightSlider, val, this.minHeight, this.maxHeight);
      this.createCilindroGeometry();
      this.updateUnfoldAnimation();
    });

    updateSliderBackground(heightSlider, this.cylinderHeight, this.minHeight, this.maxHeight);
    this.slidersContainer.appendChild(heightSlider);

    // --- SLIDER DE RAIO ---
    const radiusLabel = document.createElement("div");
    radiusLabel.innerText = `Raio: ${this.radius.toFixed(1)}`;
    radiusLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(radiusLabel);

    const radiusSlider = document.createElement("input");
    radiusSlider.type = "range";
    radiusSlider.min = this.minRadius.toString();
    radiusSlider.max = this.maxRadius.toString();
    radiusSlider.step = "0.1";
    radiusSlider.value = this.radius.toString();
    radiusSlider.classList.add("custom-slider");

    radiusSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.radius = val;
      radiusLabel.innerText = `Raio: ${val.toFixed(1)}`;
      updateSliderBackground(radiusSlider, val, this.minRadius, this.maxRadius);
      this.createCilindroGeometry();
      this.updateUnfoldAnimation();
    });

    updateSliderBackground(radiusSlider, this.radius, this.minRadius, this.maxRadius);
    this.slidersContainer.appendChild(radiusSlider);

    // --- CONTROLE DE SLIDING GLOBAL ---
    const setSliding = (isSliding) => this.isSliding = isSliding;
    
    [unfoldSlider, heightSlider, radiusSlider].forEach(slider => {
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

    // Mouse event handlers
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
      this.orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.phi));
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    };

    this.onMouseUp = () => {
      this.isMouseDown = false;
    };

    this.onMouseWheel = (event) => {
      if (this.isSliding) return;
      this.orbit.radius += event.deltaY * 0.01;
      this.orbit.radius = Math.max(2, Math.min(10, this.orbit.radius));
    };

    // Touch event handlers
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
        this.orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.phi));
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
      } else if (event.touches.length === 2) {
        const newDistance = this.getPinchDistance(event);
        const delta = newDistance - this.lastPinchDistance;
        this.orbit.radius -= delta * 0.01;
        this.orbit.radius = Math.max(2, Math.min(10, this.orbit.radius));
        this.lastPinchDistance = newDistance;
      }
    };

    this.onTouchEnd = () => {
      this.isMouseDown = false;
      this.lastPinchDistance = 0;
    };

    // Helper function for pinch zoom
    this.getPinchDistance = (event) => {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Add event listeners
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("wheel", this.onMouseWheel);
    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd);
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
        // Proportional values
        const rightOffset = canvasBounds.width * 0.05;
        const topOffset = canvasBounds.height * 0.05;
        const sliderWidth = canvasBounds.width * 0.2;
        const padding = sliderWidth * 0.08;
        const fontSize = sliderWidth * 0.07;
        const thumbSize = sliderWidth * 0.1;
        const sliderHeight = sliderWidth * 0.04;

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
    this.checkSurfaceVisibility(); 
    this.renderer.render(this.scene3D, this.camera);
  }

  resetToDefaults() {
    this.unfoldProgress = 0;
    this.cylinderHeight = 2;
    this.radius = 1;
    this.isSliding = false;
  }

  cleanupDOM() {

    if (this.scene.settings.data) {
        this.scene.settings.data = null;
    }
    this.resetToDefaults();
    // Remove Three.js canvas
    if (this.threeCanvas?.parentNode) {
      this.threeCanvas.remove();
      this.threeCanvas = null;
    }

    if (this.slidersContainer?.parentNode) {
      this.slidersContainer.remove();
      this.slidersContainer = null;
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

  // Função para adicionar efeito de hover
  addHoverEffect(button) {
    button.on('pointerover', () => {
      button.setScale(button.scaleX * 1.1);
    });

    button.on('pointerout', () => {
      button.setScale(button.scaleX / 1.1);
    });
  }
}