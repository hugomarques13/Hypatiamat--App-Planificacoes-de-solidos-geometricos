export default class Cilindro extends Phaser.Scene {
  constructor() {
    super({ key: 'Cilindro' });
    this.unfoldProgress = 0;
    this.orbit = { radius: 6, theta: Math.PI / 4, phi: Math.PI / 3 };
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
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    
    // Add navigation buttons
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
        document.body.appendChild(this.threeCanvas);
        if (this.unfoldSliderContainer) document.body.appendChild(this.unfoldSliderContainer);
        if (this.heightSliderContainer) document.body.appendChild(this.heightSliderContainer);
        if (this.radiusSliderContainer) document.body.appendChild(this.radiusSliderContainer);
        
        this.scale.startFullscreen();
        btnFullScreen.setVisible(false);
        btnBack.setVisible(true);
      }
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
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.initMouseControls();

    // Create materials with edge lines
    this.materials = {
      lateral: new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.6,
        depthWrite: false,  // Important for overlapping transparency
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
    this.createUnfoldSlider();
    this.createHeightSlider();
    this.createRadiusSlider();
    this.onWindowResize();

    window.addEventListener('resize', () => this.onWindowResize());
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
  this.lateralPivot.rotation.y = -Math.PI/2; // Start folded (rolled up)
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
  
  // Create edge lines for top face (always visible)
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

    // Create filtered geometry
    const filteredGeometry = new THREE.BufferGeometry();
    filteredGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    
    this.lateralLines.geometry.dispose();
    this.lateralLines.geometry = filteredGeometry;
  }

  // Always show lines (visibility controlled elsewhere)
  this.lateralLines.material.visible = true;
  this.topLines.material.visible = true;
  this.bottomLines.material.visible = true;

  // Animate faces
  this.topPivot.rotation.x = -p * Math.PI / 2;
  this.bottomPivot.rotation.x = p * Math.PI / 2;
  
  this.updateFaceVisibility();
}
  
  updateFaceVisibility() {
    // When fully folded or mostly folded, make faces semi-transparent
    const opacity = this.unfoldProgress < 0.95 ? 0.6 : 1.0;
    
    this.materials.lateral.opacity = opacity;
    this.materials.top.opacity = opacity;
    this.materials.bottom.opacity = opacity;
  }

  createUnfoldSlider() {
    this.unfoldSliderContainer = document.createElement("div");
    Object.assign(this.unfoldSliderContainer.style, {
      position: "absolute",
      top: "40px",
      right: "10px",
      width: "180px",
      padding: "10px",
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: "5px"
    });
    document.body.appendChild(this.unfoldSliderContainer);

    const label = document.createElement("div");
    label.innerText = "Abrir Cilindro";
    label.style.color = "white";
    label.style.marginBottom = "10px";
    this.unfoldSliderContainer.appendChild(label);

    const slider = document.createElement("input");
    Object.assign(slider, {
      type: "range",
      min: "0",
      max: "1",
      step: "0.01",
      value: "0"
    });
    slider.style.width = "100%";

    slider.addEventListener("input", (e) => {
      this.unfoldProgress = parseFloat(e.target.value);
      this.updateUnfoldAnimation();
    });

    this.unfoldSliderContainer.appendChild(slider);
    slider.addEventListener("mousedown", () => this.isSliding = true);
    slider.addEventListener("touchstart", () => this.isSliding = true);
    document.addEventListener("mouseup", () => this.isSliding = false);
    document.addEventListener("touchend", () => this.isSliding = false);
  }

  createHeightSlider() {
    this.heightSliderContainer = document.createElement("div");
    Object.assign(this.heightSliderContainer.style, {
      position: "absolute",
      top: "110px",
      right: "10px",
      width: "180px",
      padding: "10px",
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: "5px"
    });
    document.body.appendChild(this.heightSliderContainer);

    const label = document.createElement("div");
    label.innerText = `Altura: ${this.cylinderHeight.toFixed(1)}`;
    label.style.color = "white";
    label.style.marginBottom = "10px";
    this.heightSliderContainer.appendChild(label);

    const slider = document.createElement("input");
    Object.assign(slider, {
      type: "range",
      min: this.minHeight.toString(),
      max: this.maxHeight.toString(),
      step: "0.1",
      value: this.cylinderHeight.toString()
    });
    slider.style.width = "100%";

    slider.addEventListener("input", (e) => {
      this.cylinderHeight = parseFloat(e.target.value);
      label.innerText = `Altura: ${this.cylinderHeight.toFixed(1)}`;
      this.createCilindroGeometry();
      this.updateUnfoldAnimation();
    });

    this.heightSliderContainer.appendChild(slider);
    slider.addEventListener("mousedown", () => this.isSliding = true);
    slider.addEventListener("touchstart", () => this.isSliding = true);
    document.addEventListener("mouseup", () => this.isSliding = false);
    document.addEventListener("touchend", () => this.isSliding = false);
  }

  createRadiusSlider() {
    this.radiusSliderContainer = document.createElement("div");
    Object.assign(this.radiusSliderContainer.style, {
      position: "absolute",
      top: "180px",
      right: "10px",
      width: "180px",
      padding: "10px",
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: "5px"
    });
    document.body.appendChild(this.radiusSliderContainer);

    const label = document.createElement("div");
    label.innerText = `Raio: ${this.radius.toFixed(1)}`;
    label.style.color = "white";
    label.style.marginBottom = "10px";
    this.radiusSliderContainer.appendChild(label);

    const slider = document.createElement("input");
    Object.assign(slider, {
      type: "range",
      min: this.minRadius.toString(),
      max: this.maxRadius.toString(),
      step: "0.1",
      value: this.radius.toString()
    });
    slider.style.width = "100%";

    slider.addEventListener("input", (e) => {
      this.radius = parseFloat(e.target.value);
      label.innerText = `Raio: ${this.radius.toFixed(1)}`;
      this.createCilindroGeometry();
      this.updateUnfoldAnimation();
    });

    this.radiusSliderContainer.appendChild(slider);
    slider.addEventListener("mousedown", () => this.isSliding = true);
    slider.addEventListener("touchstart", () => this.isSliding = true);
    document.addEventListener("mouseup", () => this.isSliding = false);
    document.addEventListener("touchend", () => this.isSliding = false);
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
    // Get the appropriate container for fullscreen
    const container = this.scale.isFullscreen ? document.fullscreenElement : document.body;
    
    // Ensure canvas is in the right container
    if (this.threeCanvas && this.threeCanvas.parentNode !== container) {
      container.appendChild(this.threeCanvas);
    }

    // Ensure sliders are in the right container
    if (this.unfoldSliderContainer && this.unfoldSliderContainer.parentNode !== container) {
      container.appendChild(this.unfoldSliderContainer);
    }
    if (this.heightSliderContainer && this.heightSliderContainer.parentNode !== container) {
      container.appendChild(this.heightSliderContainer);
    }
    if (this.radiusSliderContainer && this.radiusSliderContainer.parentNode !== container) {
      container.appendChild(this.radiusSliderContainer);
    }

    const width = container === document.body ? window.innerWidth : container.clientWidth;
    const height = container === document.body ? window.innerHeight : container.clientHeight;

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.renderer.domElement.style.width = `${width}px`;
      this.renderer.domElement.style.height = `${height}px`;
    }

    // Position sliders correctly
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const rightOffset = window.innerWidth - rect.right + 10;
    const topOffset = rect.top + 45;
    const sliderWidth = Math.min(width * 0.2, 220);
    const sliderPadding = `${Math.max(height * 0.01, 8)}px`;

    if (this.unfoldSliderContainer) {
      this.unfoldSliderContainer.style.right = `${rightOffset}px`;
      this.unfoldSliderContainer.style.top = `${topOffset}px`;
      this.unfoldSliderContainer.style.width = `${sliderWidth}px`;
      this.unfoldSliderContainer.style.padding = sliderPadding;
    }

    if (this.heightSliderContainer) {
      this.heightSliderContainer.style.right = `${rightOffset}px`;
      this.heightSliderContainer.style.top = `${topOffset + 70}px`;
      this.heightSliderContainer.style.width = `${sliderWidth}px`;
      this.heightSliderContainer.style.padding = sliderPadding;
    }

    if (this.radiusSliderContainer) {
      this.radiusSliderContainer.style.right = `${rightOffset}px`;
      this.radiusSliderContainer.style.top = `${topOffset + 140}px`;
      this.radiusSliderContainer.style.width = `${sliderWidth}px`;
      this.radiusSliderContainer.style.padding = sliderPadding;
    }
  }

  update() {
    const { radius, theta, phi } = this.orbit;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
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

    if (this.heightSliderContainer?.parentNode) {
      this.heightSliderContainer.remove();
      this.heightSliderContainer = null;
    }

    if (this.radiusSliderContainer?.parentNode) {
      this.radiusSliderContainer.remove();
      this.radiusSliderContainer = null;
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