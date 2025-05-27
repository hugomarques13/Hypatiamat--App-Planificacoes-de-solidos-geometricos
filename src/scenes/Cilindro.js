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

    window.addEventListener('resize', () => this.onWindowResize());
  }

 createCilindroGeometry() {
  const radius = this.radius;
  const cylinderHeight = this.cylinderHeight;
  const slices = this.slices;
  const lateralWidth = 2 * Math.PI * radius;
  const angleStep = (2 * Math.PI) / slices;
  const segmentWidth = lateralWidth / slices;

  if (this.lateralPivot) {
    this.cylinderGroup.remove(this.lateralPivot);
    this.cylinderGroup.remove(this.topPivot);
    this.cylinderGroup.remove(this.bottomPivot);
  }

  this.lateralPivot = new THREE.Group();
  
  const lateralGeometry = new THREE.PlaneGeometry(lateralWidth, cylinderHeight, slices, 1);
  this.lateralMesh = new THREE.Mesh(lateralGeometry, this.materials.lateral);
  
  const lateralEdges = new THREE.EdgesGeometry(lateralGeometry);
  const lateralLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2,
    visible: false
  });
  this.lateralLines = new THREE.LineSegments(lateralEdges, lateralLineMaterial);
  
  this.lateralGroup = new THREE.Group();
  this.lateralGroup.add(this.lateralMesh);
  this.lateralGroup.add(this.lateralLines);
  
  this.lateralGroup.position.x = 0;
  this.lateralPivot.add(this.lateralGroup);
  this.lateralPivot.position.set(0, 0, 0);
  this.lateralPivot.rotation.y = -Math.PI/2; 
  this.cylinderGroup.add(this.lateralPivot);

  this.vertexData = [];
  const positionAttribute = lateralGeometry.getAttribute('position');
  const positions = positionAttribute.array;
  
  const lateralStep = lateralWidth/slices;
  
  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3;
    const segment = Math.floor(vertexIndex % (slices + 1));
    const row = Math.floor(vertexIndex / (slices + 1));
    
    const angle = segment * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = positions[i + 1];
    
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
    
    const targetX = -radius;
    const targetZ = -(-lateralWidth/2 + (lateralStep*segment));
    
    this.vertexData.push({
      original: new THREE.Vector3(x, y, z),
      target: new THREE.Vector3(targetX, y, targetZ)
    });
  }
  positionAttribute.needsUpdate = true;

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
  
  this.topGroup = new THREE.Group();
  this.topGroup.add(this.topMesh);
  this.topGroup.add(this.topLines);
  
  this.topGroup.rotation.x = -Math.PI / 2;
  this.topGroup.position.z = radius;
  this.topPivot.add(this.topGroup);
  this.cylinderGroup.add(this.topPivot);

  this.bottomPivot = new THREE.Group();
  this.bottomPivot.position.set(0, -cylinderHeight / 2, -radius);

  const bottomGeometry = new THREE.CircleGeometry(radius, 64);
  this.bottomMesh = new THREE.Mesh(bottomGeometry, this.materials.bottom);
  
  const bottomEdges = new THREE.EdgesGeometry(bottomGeometry);
  const bottomLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2,
    visible: true
  });
  this.bottomLines = new THREE.LineSegments(bottomEdges, bottomLineMaterial);
  
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
  
  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3;
    const { original, target } = this.vertexData[vertexIndex];
    positions[i] = original.x * (1 - p) + target.x * p;
    positions[i + 1] = original.y * (1 - p) + target.y * p;
    positions[i + 2] = original.z * (1 - p) + target.z * p;
  }
  positionAttribute.needsUpdate = true;

  this.lateralLines.geometry.dispose();
  this.lateralLines.geometry = new THREE.EdgesGeometry(lateralGeometry);

  const edgesGeometry = this.lateralLines.geometry;
  const positions2 = edgesGeometry.attributes.position;
  const newPositions = [];
  const width = 2 * Math.PI * this.radius;
  const edgeTolerance = 0.01 * width;

  for (let i = 0; i < positions2.count; i += 2) {
    const y1 = positions2.getY(i);
    const y2 = positions2.getY(i + 1);
    const z1 = positions2.getZ(i);
    const z2 = positions2.getZ(i + 1);

    const isHorizontal = Math.abs(y1 - y2) < 0.001;

    const isLeftEdge = Math.min(Math.abs(z1 + width/2), Math.abs(z2 + width/2)) < edgeTolerance;
    const isRightEdge = Math.min(Math.abs(z1 - width/2), Math.abs(z2 - width/2)) < edgeTolerance;
    const isVerticalEdge = isLeftEdge || isRightEdge;

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

  this.topPivot.rotation.x = -p * Math.PI / 2;
  this.bottomPivot.rotation.x = p * Math.PI / 2;
  
  this.updateFaceVisibility();
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

    this.getPinchDistance = (event) => {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("wheel", this.onMouseWheel);
    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd);
  }

  onWindowResize() {
    const container = this.scale.isFullscreen ? document.fullscreenElement : document.body;
    
    if (this.threeCanvas?.parentNode !== container) {
        container.appendChild(this.threeCanvas);
    }

    if (this.slidersContainer?.parentNode !== container) {
        container.appendChild(this.slidersContainer);
    }

    const width = container === document.body ? window.innerWidth : container.clientWidth;
    const height = container === document.body ? window.innerHeight : container.clientHeight;

    if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        const baseHeight = 600;
        this.orbit.radius = 6 * (baseHeight / Math.max(height, 400));
    }

    if (this.renderer) {
        this.renderer.setSize(width, height);
        this.renderer.domElement.style.width = `${width}px`;
        this.renderer.domElement.style.height = `${height}px`;
    }

    if (this.slidersContainer) {
        const canvas = this.sys.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        const rightOffset = window.innerWidth - rect.right + 10;
        const topOffset = rect.top + 45;
        
        const baseWidth = 220;
        const minWidth = 180;
        const maxWidth = 300;
        
        let sliderWidth = Math.min(
            Math.max(width * 0.2, minWidth), 
            maxWidth
        );
        
        const baseFontSize = 16;
        const fontSize = Math.max(baseFontSize * (sliderWidth / baseWidth), 14);
        
        const paddingVertical = Math.max(height * 0.015, 10);
        const paddingHorizontal = Math.max(width * 0.02, 12);
        
        Object.assign(this.slidersContainer.style, {
            right: `${rightOffset}px`,
            top: `${topOffset}px`,
            width: `${sliderWidth}px`,
            padding: `${paddingVertical}px ${paddingHorizontal}px`,
            fontSize: `${fontSize}px`,
            borderRadius: `${Math.min(sliderWidth * 0.07, 16)}px`
        });

        const sliders = this.slidersContainer.querySelectorAll('.custom-slider');
        sliders.forEach(slider => {
            const thumbSize = Math.max(sliderWidth * 0.11, 20);
            slider.style.setProperty('--thumb-size', `${thumbSize}px`);
        });
    }

    clearTimeout(this.resizeRetryTimeout);
    this.resizeRetryTimeout = setTimeout(() => {
        if (window.innerHeight !== this.lastResizeHeight) {
            this.lastResizeHeight = window.innerHeight;
            this.onWindowResize();
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
    this.renderer.render(this.scene3D, this.camera);
  }

  resetToDefaults() {
    this.unfoldProgress = 0;
    this.cylinderHeight = 2;
    this.radius = 1;
    this.isSliding = false;
  }

  cleanupDOM() {
    this.resetToDefaults();

    if (this.threeCanvas?.parentNode) {
      this.threeCanvas.remove();
      this.threeCanvas = null;
    }

    if (this.slidersContainer?.parentNode) {
      this.slidersContainer.remove();
      this.slidersContainer = null;
    }


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