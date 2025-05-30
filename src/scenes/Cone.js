export default class Cone extends Phaser.Scene {
  constructor() {
    super({ key: 'Cone' });
    this.unfoldProgress = 0;
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

    const titleText = this.add.text(this.scale.width / 2, 20, 'Cone', {
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
              currentQuestionIndex: quizData.nextQuestionIndex + 1,
              score: quizData.currentScore,
              questions: quizData.questions
          });
      });
    }

    btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    btnVoltar.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('SelectingSolids');
    });

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

    this.coneHeight = 2;
    this.radius = 1;
    this.unfoldProgress = 0;

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
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.orbit = { radius: 6, theta: Math.PI / 35, phi: Math.PI / 3 };

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

      window.addEventListener("resize", () => {
        setTimeout(() => this.onWindowResize(), 100);
      });

      window.addEventListener("orientationchange", () => {
        setTimeout(() => this.onWindowResize(), 150);
      });
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
    
    // Unfolded position
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

        // Folded positions
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        
        positions[idx * 3 + 0] = x + radius;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;
        baseVertices.push(x, 0, z);

        // Unfolded positions
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

  checkSurfaceVisibility() {
    const surfaces = {
      lateral: {
        mesh: this.lateralMesh,
        material: this.materials.lateral,
        isDoubleSided: true
      },
      base: {
        mesh: this.baseMesh,
        material: this.materials.base,
        isDoubleSided: true
      }
    };

    for (const [name, surface] of Object.entries(surfaces)) {
      if (!surface.mesh) continue;

      // Get world position and normal of the surface
      const position = new THREE.Vector3();
      surface.mesh.getWorldPosition(position);
      
      let normal;
      if (name === 'lateral') {
        // Average normal pointing diagonally outward
        normal = new THREE.Vector3(0, 0.5, 0.5).normalize();
        normal.applyQuaternion(this.lateralGroup.quaternion);
      } else { // base
        normal = new THREE.Vector3(0, 1, 0);
        normal.applyQuaternion(this.baseGroup.quaternion);
      }

      const cameraToSurface = new THREE.Vector3().subVectors(
        this.camera.position, 
        position
      ).normalize();
      
      const dotProduct = normal.dot(cameraToSurface);
      
      if (surface.isDoubleSided) {
        // For unfolded state, make everything fully visible
        if (this.unfoldProgress > 0.95) {
          surface.material.opacity = 1;
        } 
        // For partially unfolded, adjust opacity based on viewing angle
        else if (this.unfoldProgress > 0.1) {
          // Use absolute value of dot product since it's double-sided
          const visibility = 0.4 + 0.6 * (1 - Math.abs(dotProduct));
          surface.material.opacity = visibility;
        }
        // For folded state, make semi-transparent
        else {
          surface.material.opacity = 0.6;
        }
      }
    }
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