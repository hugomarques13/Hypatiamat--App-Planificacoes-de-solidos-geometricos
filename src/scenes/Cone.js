export default class Cone extends Phaser.Scene {
  constructor() {
    super({ key: 'Cone' });
    this.unfoldProgress = 0;
    this.orbit = { radius: 6, theta: Math.PI / 4, phi: Math.PI / 3 };
    this.isSliding = false;
    this.coneHeight = 2;
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
    
    // Add navigation buttons (same as cylinder)
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
        depthWrite: false,
        blending: THREE.NormalBlending
      }),
      base: new THREE.MeshBasicMaterial({ 
        color: 0x0000ff, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.6 
      }),
    };

    this.isSliding = false;
    this.coneHeight = 2;
    this.radius = 1;

    this.coneGroup = new THREE.Group();
    this.scene3D.add(this.coneGroup);

    this.createConeGeometry();
    this.createUnfoldSlider();
    this.createHeightSlider();
    this.createRadiusSlider();
    this.onWindowResize();

    window.addEventListener('resize', () => this.onWindowResize());
  }

createConeGeometry() {
    const radius = this.radius;
    const height = this.coneHeight;
    const slices = this.slices;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const sectorAngle = (2 * Math.PI * radius) / slantHeight;

    // Clear existing geometry if it exists
    if (this.lateralPivot) {
        this.coneGroup.remove(this.lateralPivot);
        this.coneGroup.remove(this.basePivot);
    }

    // --- Lateral Surface ---
    this.lateralPivot = new THREE.Group();
    
    // Create geometry
    const lateralGeometry = new THREE.BufferGeometry();
    const segments = slices; // +1 to close the cone
    
    // Create vertices for both folded and unfolded states
    const positions = new Float32Array(segments * 3 * 2); // 3 coords per vertex, 2 states
    const indices = [];
    this.vertexData = [];
    
    // Center point (apex of the cone)
    const centerIndex = 0;
    positions[centerIndex * 3 + 0] = 0; // x - folded
    positions[centerIndex * 3 + 1] = height; // y - folded
    positions[centerIndex * 3 + 2] = 0; // z - folded
    
    // Unfolded position will be above the base
    positions[centerIndex * 3 + 0 + segments * 3] = 0; // x - unfolded
    positions[centerIndex * 3 + 1 + segments * 3] = slantHeight; // y - unfolded (vertical position)
    positions[centerIndex * 3 + 2 + segments * 3] = 0; // z - unfolded

    const vX = 0;
    const vY = slantHeight;
    
    // Add vertex data for center point
    this.vertexData.push({
        original: new THREE.Vector3(0, height, 0),
        target: new THREE.Vector3(vX, vY, -radius) // Positioned above base
    });

    // Create vertices around the base
    for (let i = 1; i <= segments; i++) {
        const angle = (i-1) / slices * Math.PI * 2;
        const u = (i-1) / slices;
        
        // Folded position (cone)
        const foldedX = radius * Math.cos(angle);
        const foldedY = 0;
        const foldedZ = radius * Math.sin(angle);

        let proportion = (angle + Math.PI/2)/(Math.PI*2);

        const unfoldedAngle = proportion * sectorAngle;
        
        // Unfolded position (sector) - rotated to be vertical
        const unfoldedX = vX + (slantHeight*Math.sin(unfoldedAngle)); // Switched x/z for vertical orientation
        const unfoldedY = vY + (slantHeight*Math.cos(unfoldedAngle)); // Vertical position
        const unfoldedZ = -radius;
        
        // Set positions in the buffer
        const vi = i * 3;
        positions[vi + 0] = foldedX;
        positions[vi + 1] = foldedY;
        positions[vi + 2] = foldedZ;
        
        positions[vi + 0 + segments * 3] = unfoldedX;
        positions[vi + 1 + segments * 3] = unfoldedY;
        positions[vi + 2 + segments * 3] = unfoldedZ;
        
        // Create triangles
        if (i > 1) {
            indices.push(centerIndex, i-1, i);
        }
        
        // Store vertex data for animation
        this.vertexData.push({
            original: new THREE.Vector3(foldedX, foldedY, foldedZ),
            target: new THREE.Vector3(unfoldedX, unfoldedY, unfoldedZ)
        });
    }
    
    // Close the cone
    indices.push(centerIndex, segments, 1);
    
    // Set the geometry attributes
    lateralGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lateralGeometry.setIndex(indices);
    
    // Create the lateral mesh
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
    this.lateralPivot.add(this.lateralGroup);
    this.coneGroup.add(this.lateralPivot);

    // --- Base Circle ---
    this.basePivot = new THREE.Group();
    this.basePivot.position.set(0, 0, -radius);

    const baseGeometry = new THREE.CircleGeometry(radius, 64);
    this.baseMesh = new THREE.Mesh(baseGeometry, this.materials.base);
    
    // Create edge lines for base
    const baseEdges = new THREE.EdgesGeometry(baseGeometry);
    const baseLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x000000, 
        linewidth: 2,
        visible: true
    });
    this.baseLines = new THREE.LineSegments(baseEdges, baseLineMaterial);
    
    // Create container group for base
    this.baseGroup = new THREE.Group();
    this.baseGroup.add(this.baseMesh);
    this.baseGroup.add(this.baseLines);
    
    this.baseGroup.rotation.x = Math.PI / 2;
    this.baseGroup.position.z = radius;
    this.basePivot.add(this.baseGroup);
    this.coneGroup.add(this.basePivot);
}

updateUnfoldAnimation() {
    const p = this.unfoldProgress;
    const lateralGeometry = this.lateralMesh.geometry;
    const positionAttribute = lateralGeometry.getAttribute('position');
    const positions = positionAttribute.array;
    
    // Interpolate vertex positions for all vertices
    for (let i = 0; i < this.vertexData.length; i++) {
        const vertex = this.vertexData[i];
        const vi = i * 3;
        
        positions[vi + 0] = vertex.original.x * (1 - p) + vertex.target.x * p;
        positions[vi + 1] = vertex.original.y * (1 - p) + vertex.target.y * p;
        positions[vi + 2] = vertex.original.z * (1 - p) + vertex.target.z * p;
    }
    
    positionAttribute.needsUpdate = true;

    // Update edge lines
    this.lateralLines.geometry.dispose();
    this.lateralLines.geometry = new THREE.EdgesGeometry(lateralGeometry);

    // Filter edges to show only the important ones
    const edgesGeometry = this.lateralLines.geometry;
    const positions2 = edgesGeometry.attributes.position;
    const newPositions = [];
    const slantHeight = Math.sqrt(this.radius * this.radius + this.coneHeight * this.coneHeight);
    const edgeTolerance = 0.01 * slantHeight;

    for (let i = 0; i < positions2.count; i += 2) {
        const x1 = positions2.getX(i);
        const y1 = positions2.getY(i);
        const z1 = positions2.getZ(i);
        const x2 = positions2.getX(i + 1);
        const y2 = positions2.getY(i + 1);
        const z2 = positions2.getZ(i + 1);
        
        // Check if this is a radial edge (connected to apex)
        const isRadialEdge1 = Math.abs(y1 - this.coneHeight * (1 - p) - slantHeight * p) < edgeTolerance;
        const isRadialEdge2 = Math.abs(y2 - this.coneHeight * (1 - p) - slantHeight * p) < edgeTolerance;
        
        // Check if this is a base edge (y ≈ 0)
        const isBaseEdge = Math.abs(y1) < edgeTolerance && Math.abs(y2) < edgeTolerance;
        
        if ((isRadialEdge1 || isRadialEdge2) || isBaseEdge) {
            newPositions.push(x1, y1, z1, x2, y2, z2);
        }
    }
    
    // Create filtered geometry
    const filteredGeometry = new THREE.BufferGeometry();
    filteredGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(newPositions, 3)
    );
    
    this.lateralLines.geometry.dispose();
    this.lateralLines.geometry = filteredGeometry;

    // Always show lines
    this.lateralLines.material.visible = true;
    this.baseLines.material.visible = true;

    // Animate base
    this.basePivot.rotation.x = p * Math.PI / 2;
    
    this.updateFaceVisibility();
}
  updateFaceVisibility() {
    // When fully folded or mostly folded, make faces semi-transparent
    const opacity = this.unfoldProgress < 0.95 ? 0.6 : 1.0;
    
    this.materials.lateral.opacity = opacity;
    this.materials.base.opacity = opacity;
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
    label.innerText = "Abrir Cone";
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
    label.innerText = `Altura: ${this.coneHeight.toFixed(1)}`;
    label.style.color = "white";
    label.style.marginBottom = "10px";
    this.heightSliderContainer.appendChild(label);

    const slider = document.createElement("input");
    Object.assign(slider, {
      type: "range",
      min: this.minHeight.toString(),
      max: this.maxHeight.toString(),
      step: "0.1",
      value: this.coneHeight.toString()
    });
    slider.style.width = "100%";

    slider.addEventListener("input", (e) => {
      this.coneHeight = parseFloat(e.target.value);
      label.innerText = `Altura: ${this.coneHeight.toFixed(1)}`;
      this.createConeGeometry();
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
      this.createConeGeometry();
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