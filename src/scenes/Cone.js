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
    this.load.image('bt_voltar', 'assets/bt_voltar.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);
    
    // Add navigation buttons
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

    btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    btnVoltar.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('SelectingSolids');
    });

    const toggleFullscreen = () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        btnFullScreen.setVisible(true);
        btnBack.setVisible(false);
      } else {
        document.body.appendChild(this.threeCanvas);
        if (this.slidersContainer) document.body.appendChild(this.slidersContainer);
        this.scale.startFullscreen();
        btnFullScreen.setVisible(false);
        btnBack.setVisible(true);
      }
      this.onWindowResize();
    };

    this.coneHeight = 2;
    this.radius = 1;
    this.unfoldProgress = 0;

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

    // Create materials
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
      lateralEdges: new THREE.LineBasicMaterial({ 
        color: 0x000000, 
        linewidth: 2,
        visible: true
      }),
      baseEdges: new THREE.LineBasicMaterial({ 
        color: 0x000000, 
        linewidth: 2,
        visible: true
      })
    };

    this.coneGroup = new THREE.Group();
    this.scene3D.add(this.coneGroup);

    this.createConeGeometry();
    this.createSliders();
    this.onWindowResize();

    window.addEventListener('resize', () => this.onWindowResize());
  }
 
  createConeGeometry() {
    const radius = this.radius;
    const height = this.coneHeight;
    const slices = this.slices;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const sectorAngle = (2 * Math.PI * radius) / slantHeight;

    // Clear existing geometry
    if (this.lateralPivot) {
        this.coneGroup.remove(this.lateralPivot);
        this.coneGroup.remove(this.basePivot);
    }

    // --- Lateral Surface ---
    this.lateralPivot = new THREE.Group();
    
    // Create geometry with both folded and unfolded positions
    const geometry = new THREE.BufferGeometry();
    const vertexCount = slices + 2;
    const positions = new Float32Array(vertexCount * 3 * 2);
    const indices = [];
    this.vertexData = [];

    // Apex (V point) - index 0
    positions[0] = radius;
    positions[1] = height;
    positions[2] = 0;
    
    // Unfolded position (center of sector)
    positions[vertexCount * 3 + 0] = 0;
    positions[vertexCount * 3 + 1] = slantHeight;
    positions[vertexCount * 3 + 2] = 0;

    this.vertexData.push({
        original: new THREE.Vector3(radius, height, 0),
        target: new THREE.Vector3(0, slantHeight, 0)
    });

    // Generate base vertices
    const baseVertices = [];
    for (let i = 0; i <= slices; i++) {
        const angle = (i / slices) * Math.PI * 2;
        const idx = i + 1;

        // Folded positions (base circle)
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        
        positions[idx * 3 + 0] = x + radius;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;
        baseVertices.push(x, 0, z);

        // Unfolded positions (sector)
        const unfoldedAngle = (i / slices) * sectorAngle - sectorAngle/2;
        const unfoldedX = -slantHeight * Math.sin(unfoldedAngle);
        const unfoldedY = Math.abs(slantHeight * Math.cos(unfoldedAngle) - slantHeight);

        positions[(vertexCount + idx) * 3 + 0] = 0;
        positions[(vertexCount + idx) * 3 + 1] = unfoldedY;
        positions[(vertexCount + idx) * 3 + 2] = unfoldedX;

        this.vertexData.push({
            original: new THREE.Vector3(x + radius, 0, z),
            target: new THREE.Vector3(0, unfoldedY, unfoldedX)
        });

        // Create triangles
        if (i < slices) {
            indices.push(0, idx, idx + 1);
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    // --- Base Surface ---
    this.basePivot = new THREE.Group();
    const baseGeometry = new THREE.BufferGeometry();
    baseGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(baseVertices), 3));
    
    const baseIndices = [];
    const centerIndex = 0;
    for (let i = 1; i <= slices; i++) {
        baseIndices.push(centerIndex, i, i + 1 > slices ? 1 : i + 1);
    }
    baseGeometry.setIndex(baseIndices);
    
    this.lateralMesh = new THREE.Mesh(geometry, this.materials.lateral);
    this.baseMesh = new THREE.Mesh(baseGeometry, this.materials.base);

    const edges = new THREE.EdgesGeometry(geometry);
    this.lateralLines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 2,
        })
    );

    const baseEdges = new THREE.EdgesGeometry(baseGeometry);
    this.baseLines = new THREE.LineSegments(
        baseEdges,
        new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 2,
        })
    );

    this.lateralGroup = new THREE.Group();
    this.lateralGroup.add(this.lateralMesh);
    this.lateralGroup.add(this.lateralLines);
    this.lateralPivot.add(this.lateralGroup);
    this.lateralGroup.rotation.y = -Math.PI/2;
    
    this.baseGroup = new THREE.Group();
    this.baseGroup.add(this.baseMesh);
    this.baseGroup.add(this.baseLines);
    this.baseGroup.rotation.y = Math.PI/2;
    this.baseGroup.position.set(0, 0, radius);
    
    this.basePivot.add(this.baseGroup);
    this.coneGroup.add(this.lateralPivot);
    this.coneGroup.add(this.basePivot);

    this.basePivot.rotation.x = 0;
    this.updateUnfoldAnimation();
  }

  updateUnfoldAnimation() {
    const p = this.unfoldProgress;
    const geometry = this.lateralMesh.geometry;
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    const vertexCount = this.slices + 2;

    for (let i = 0; i < vertexCount; i++) {
        const foldedIdx = i * 3;
        positions[foldedIdx] = this.vertexData[i].original.x * (1 - p) + this.vertexData[i].target.x * p;
        positions[foldedIdx + 1] = this.vertexData[i].original.y * (1 - p) + this.vertexData[i].target.y * p;
        positions[foldedIdx + 2] = this.vertexData[i].original.z * (1 - p) + this.vertexData[i].target.z * p;
    }
    positionAttribute.needsUpdate = true;

    const circleEdges = [];
    
    for (let i = 0; i < this.slices + 2; i++) {
        const current = i;
        let next = i + 1;

        if (i == this.slices+1) {
          next = 0;
        }
        
        circleEdges.push(
            positions[current * 3], positions[current * 3 + 1], positions[current * 3 + 2],
            positions[next * 3], positions[next * 3 + 1], positions[next * 3 + 2]
        );
    }

    if (!this.lateralLines) {
        this.lateralLines = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 3,
                visible: true
            })
        );
        this.lateralGroup.add(this.lateralLines);
    }

    this.lateralLines.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(circleEdges, 3)
    );
    this.lateralLines.geometry.attributes.position.needsUpdate = true;
    this.lateralLines.geometry.setDrawRange(0, circleEdges.length/3);

    if (!this.baseLines) {
        this.baseLines = new THREE.LineSegments(
            new THREE.EdgesGeometry(this.baseMesh.geometry),
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 })
        );
        this.baseGroup.add(this.baseLines);
    }

    if (p > 0.01) {
      this.lateralLines.material.visible = true;
    } else {
      this.lateralLines.material.visible = false;
    }

    this.basePivot.rotation.x = Math.PI/2 * p;
    this.renderer.render(this.scene3D, this.camera);
  }

  createSliders() {
    // Create main container for all sliders
    this.slidersContainer = document.createElement("div");
    this.slidersContainer.classList.add("slider-container");
    document.body.appendChild(this.slidersContainer);

    // Function to update slider gradient
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
    unfoldLabel.innerText = "Abrir Cone";
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

    // --- HEIGHT SLIDER ---
    const heightLabel = document.createElement("div");
    heightLabel.innerText = `Altura: ${this.coneHeight.toFixed(1)}`;
    heightLabel.classList.add("slider-label");
    this.slidersContainer.appendChild(heightLabel);

    const heightSlider = document.createElement("input");
    heightSlider.type = "range";
    heightSlider.min = this.minHeight.toString();
    heightSlider.max = this.maxHeight.toString();
    heightSlider.step = "0.1";
    heightSlider.value = this.coneHeight.toString();
    heightSlider.classList.add("custom-slider");
    heightSlider.style.marginBottom = "20px";

    heightSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.coneHeight = val;
      heightLabel.innerText = `Altura: ${val.toFixed(1)}`;
      updateSliderBackground(heightSlider, val, this.minHeight, this.maxHeight);
      this.createConeGeometry();
      this.updateUnfoldAnimation();
    });

    updateSliderBackground(heightSlider, this.coneHeight, this.minHeight, this.maxHeight);
    this.slidersContainer.appendChild(heightSlider);

    // --- RADIUS SLIDER ---
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
      this.createConeGeometry();
      this.updateUnfoldAnimation();
    });

    updateSliderBackground(radiusSlider, this.radius, this.minRadius, this.maxRadius);
    this.slidersContainer.appendChild(radiusSlider);

    // Sliding control
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
    // Get the appropriate container for fullscreen
    const container = this.scale.isFullscreen ? document.fullscreenElement : document.body;
    
    // Ensure canvas is in the right container
    if (this.threeCanvas && this.threeCanvas.parentNode !== container) {
      container.appendChild(this.threeCanvas);
    }

    // Ensure sliders are in the right container
    if (this.slidersContainer && this.slidersContainer.parentNode !== container) {
      container.appendChild(this.slidersContainer);
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
    
    // Dynamic sizing based on window width
    const baseWidth = 220;
    const minWidth = 180;
    const maxWidth = 300;
    
    let sliderWidth = Math.min(
        Math.max(width * 0.2, minWidth), 
        maxWidth
    );
    
    // Adjust font size based on width
    const baseFontSize = 16;
    const fontSize = Math.max(baseFontSize * (sliderWidth / baseWidth), 14);
    
    // Calculate responsive padding
    const paddingVertical = Math.max(height * 0.015, 10);
    const paddingHorizontal = Math.max(width * 0.02, 12);

    if (this.slidersContainer) {
        Object.assign(this.slidersContainer.style, {
            right: `${rightOffset}px`,
            top: `${topOffset}px`,
            width: `${sliderWidth}px`,
            padding: `${paddingVertical}px ${paddingHorizontal}px`,
            fontSize: `${fontSize}px`,
            borderRadius: `${Math.min(sliderWidth * 0.07, 16)}px`
        });

        // Update all slider thumbs
        const sliders = this.slidersContainer.querySelectorAll('.custom-slider');
        sliders.forEach(slider => {
            const thumbSize = Math.max(sliderWidth * 0.11, 20);
            slider.style.setProperty('--thumb-size', `${thumbSize}px`);
        });
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

  addHoverEffect(button) {
    button.on('pointerover', () => {
      button.setScale(button.scaleX * 1.1);
    });

    button.on('pointerout', () => {
      button.setScale(button.scaleX / 1.1);
    });
  }
}