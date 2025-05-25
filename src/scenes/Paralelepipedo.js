export default class Paralelepipedo extends Phaser.Scene {
  constructor() {
    super({ key: "Paralelepipedo" });
    this.unfoldProgress = 0;
    this.isSliding = false;
    this.unfoldPlans = {};
    this.currentPlan = "1";
    this.lastResizeHeight = window.innerHeight;
    this.isMobile = false;
    this.isLongTouch = false;
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('bt_home', 'assets/bt_home.png');
    this.load.image('bt_screenback', 'assets/bt_screenback.png');
    this.load.image('bt_fullscreen', 'assets/bt_fullscreen.png');
    this.load.image('bt_info', 'assets/bt_info.png');
  }

  create() {
    // Detect device type
    this.isMobile = this.sys.game.device.os.android || 
                   this.sys.game.device.os.iOS || 
                   this.sys.game.device.os.windowsPhone ||
                   (this.sys.game.device.os.tablet && this.scale.width < 1000);

    // Responsive background setup
    const bg = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'background'
    );
    this.resizeBackground(bg);

    // Responsive buttons
    this.createResponsiveButtons();

    // Three.js setup
    this.setupThreeJS();

    // Unfold slider
    this.createUnfoldSlider();

    // Controls
    this.initMouseControls();

    // Initial resize
    this.onWindowResize();

    // Handle window resizing
    window.addEventListener("resize", () => {
      setTimeout(() => this.onWindowResize(), 100);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.onWindowResize(), 150);
    });
  }

  resizeBackground(bg) {
    const bgAspect = this.textures.get('background').getSourceImage().width / 
                    this.textures.get('background').getSourceImage().height;
    const screenAspect = this.cameras.main.width / this.cameras.main.height;
    
    if (screenAspect > bgAspect) {
      bg.setScale(this.cameras.main.height / this.textures.get('background').getSourceImage().height);
    } else {
      bg.setScale(this.cameras.main.width / this.textures.get('background').getSourceImage().width);
    }
  }

  createResponsiveButtons() {
    const margin = this.isMobile ? 
      Math.min(this.cameras.main.width, this.cameras.main.height) * 0.02 :
      Math.min(this.cameras.main.width, this.cameras.main.height) * 0.03;
    
    const baseSize = Math.min(this.cameras.main.width, 1024);
    const btnScale = this.isMobile ? 
      0.5 * (baseSize / 1024) :
      0.65 * (baseSize / 1024);

    // Home button (bottom left)
    this.btnHome = this.add.image(
      margin,
      this.cameras.main.height - margin,
      'bt_home'
    )
      .setScale(btnScale)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000)
      .setOrigin(0, 1);

    // Fullscreen button (top left)
    this.btnFullScreen = this.add.image(
      margin,
      margin,
      'bt_fullscreen'
    )
      .setScale(btnScale * (this.isMobile ? 0.45 : 0.55))
      .setInteractive({ useHandCursor: true })
      .setDepth(1000)
      .setOrigin(0, 0);

    // Back button (overlaps fullscreen)
    this.btnBack = this.add.image(
      margin,
      margin,
      'bt_screenback'
    )
      .setScale(btnScale * (this.isMobile ? 0.45 : 0.55))
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .setDepth(1000)
      .setOrigin(0, 0);

    // Info button (bottom right)
    this.btnInfo = this.add.image(
      this.cameras.main.width - margin,
      this.cameras.main.height - margin,
      'bt_info'
    )
      .setScale(btnScale)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000)
      .setOrigin(1, 1);

    // Add hover effects (only for desktop)
    if (!this.isMobile) {
      [this.btnHome, this.btnFullScreen, this.btnBack, this.btnInfo].forEach(btn => this.addHoverEffect(btn));
    }

    // Button events
    this.btnHome.on('pointerup', () => {
      this.cleanupDOM();
      this.scene.start('MenuScene');
    });

    const toggleFullscreen = () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        this.btnFullScreen.setVisible(true);
        this.btnBack.setVisible(false);
      } else {
        document.body.appendChild(this.threeCanvas);
        if (this.unfoldSliderContainer) document.body.appendChild(this.unfoldSliderContainer);
        this.scale.startFullscreen();
        this.btnFullScreen.setVisible(false);
        this.btnBack.setVisible(true);
      }
      this.onWindowResize();
    };

    this.btnFullScreen.on('pointerup', toggleFullscreen);
    this.btnBack.on('pointerup', toggleFullscreen);

    this.scale.on('fullscreenchange', () => {
      if (this.scale.isFullscreen) {
        this.btnFullScreen.setVisible(false);
        this.btnBack.setVisible(true);
        if (this.unfoldSliderContainer) {
          this.unfoldSliderContainer.style.right = '20px';
        }
      } else {
        this.btnFullScreen.setVisible(true);
        this.btnBack.setVisible(false);
      }
      this.onWindowResize();
    });
  }

  setupThreeJS() {
    // Create Three.js canvas
    this.threeCanvas = document.createElement("canvas");
    const phaserCanvas = this.sys.game.canvas;
    const phaserContainer = phaserCanvas.parentElement;

    Object.assign(this.threeCanvas.style, {
        position: 'absolute',
        left: `${phaserCanvas.offsetLeft}px`,
        top: `${phaserCanvas.offsetTop}px`,
        width: `${phaserCanvas.width}px`,
        height: `${phaserCanvas.height}px`,
        zIndex: '0',
        pointerEvents: 'none'
    });
    
    phaserContainer.appendChild(this.threeCanvas);

    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      alpha: true,
      antialias: true,
    });

    // Scene setup
    this.scene3D = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.orbit = { radius: 5, theta: Math.PI / 8, phi: Math.PI / 2.5 };

    // Cube group
    this.cubeGroup = new THREE.Group();
    this.scene3D.add(this.cubeGroup);

    // Materials
    this.materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 1 })
    ];

    // Face groups and rotations
    this.faceGroups = {};
    this.originalRotations = {};

    // Initialize unfold plans and build initial face groups
    this.initUnfoldPlans();
    this.buildFaceGroupsForPlan(this.currentPlan);
  }

  initUnfoldPlans() {
    const sideHeight = 2;
    const squareSize = 1;
    const d = squareSize / 2;

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
      }
    };
  }

  createFaceGroup(name, material, pivotArr, positionArr, rotationArr) {
    const pivot = new THREE.Vector3(...pivotArr);
    const position = new THREE.Vector3(...positionArr);
    const rotation = new THREE.Euler(...rotationArr);

    let width, height;
    if (name === 'top' || name === 'bottom') {
      width = 1;
      height = 1;
    } else {
      width = 1;
      height = 2;
    }

    const geometry = new THREE.PlaneGeometry(width, height);
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
      const group = this.faceGroups[key];
      group.parent?.remove(group);
    }

    this.faceGroups = {};
    this.originalRotations = {};
    this.cubeGroup.clear();

    const plan = this.unfoldPlans[planName];
    const { transforms } = plan;

    for (const name in transforms) {
      const { pivot, position, rotation } = transforms[name];
      const index = ['front', 'back', 'left', 'right', 'top', 'bottom'].indexOf(name);
      const group = this.createFaceGroup(name, this.materials[index], pivot, position, rotation);
      this.cubeGroup.add(group);
    }

    this.applyParenting(planName);
  }

  applyParenting(planName) {
    const plan = this.unfoldPlans[planName];
    for (const face in this.faceGroups) {
      const group = this.faceGroups[face];
      group.parent?.remove(group);

      const parentName = plan.parents[face];
      if (parentName && this.faceGroups[parentName]) {
        this.faceGroups[parentName].add(group);
      } else {
        this.cubeGroup.add(group);
      }
    }
  }

  updateCubeTransforms() {
    const plan = this.unfoldPlans[this.currentPlan];
    const rotations = plan.rotations;

    for (const name in this.faceGroups) {
      if (name === 'bottom') continue;
      const group = this.faceGroups[name];

      const startQuat = this.originalRotations[name].quaternion;
      const endQuat = new THREE.Quaternion().setFromEuler(rotations[name]);
      const currentQuat = new THREE.Quaternion();
      currentQuat.slerpQuaternions(startQuat, endQuat, this.unfoldProgress);
      group.quaternion.copy(currentQuat);
    }
  }

  createUnfoldSlider() {
    this.unfoldSliderContainer = document.createElement("div");
    this.unfoldSliderContainer.classList.add("slider-container");

    // Base styles
    const sliderStyle = {
      position: 'absolute',
      zIndex: '1001',
      padding: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1.5px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(224, 120, 18, 0.5)',
      userSelect: 'none',
      transition: 'all 0.3s ease'
    };

    // Mobile vs desktop positioning
    if (this.isMobile) {
      Object.assign(sliderStyle, {
        bottom: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '400px'
      });
    } else {
      Object.assign(sliderStyle, {
        right: '20px',
        top: '40px',
        width: '200px'
      });
    }

    Object.assign(this.unfoldSliderContainer.style, sliderStyle);

    const sliderLabel = document.createElement("div");
    sliderLabel.innerText = "Abrir Figura";
    sliderLabel.style.textAlign = 'center';
    sliderLabel.style.marginBottom = '8px';
    sliderLabel.style.fontWeight = '600';
    sliderLabel.style.color = '#e07812';
    sliderLabel.style.fontSize = this.isMobile ? '14px' : '16px';
    this.unfoldSliderContainer.appendChild(sliderLabel);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = "0";
    slider.classList.add("custom-slider");
    slider.style.width = '100%';
    slider.style.height = this.isMobile ? '25px' : '12px';

    const updateSliderBackground = (value) => {
      const percentage = value * 100;
      slider.style.background = `linear-gradient(to right,
        #fcc33c 0%,
        #fba434 ${percentage / 2}%,
        #e07812 ${percentage}%,
        #ccc ${percentage}%,
        #ccc 100%)`;
    };

    slider.addEventListener("mousedown", () => this.isSliding = true);
    slider.addEventListener("touchstart", () => this.isSliding = true);
    document.addEventListener("mouseup", () => this.isSliding = false);
    document.addEventListener("touchend", () => this.isSliding = false);

    slider.addEventListener("input", (e) => {
      this.unfoldProgress = parseFloat(e.target.value);
      updateSliderBackground(this.unfoldProgress);
      this.updateCubeTransforms();
    });

    updateSliderBackground(0);
    this.unfoldSliderContainer.appendChild(slider);
    document.body.appendChild(this.unfoldSliderContainer);
  }

  initMouseControls() {
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastPinchDistance = 0;
    this.touchTimer = null;

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

    // Touch event handlers
    this.onTouchStart = (event) => {
      event.preventDefault();
      if (this.isSliding) return;

      if (event.touches.length === 1) {
        this.isMouseDown = true;
        this.lastMouseX = event.touches[0].clientX;
        this.lastMouseY = event.touches[0].clientY;
        
        this.touchTimer = setTimeout(() => {
          this.isLongTouch = true;
        }, 200);
      } else if (event.touches.length === 2) {
        this.isMouseDown = false;
        this.lastPinchDistance = this.getPinchDistance(event);
      }
    };

    this.onTouchMove = (event) => {
      event.preventDefault();
      if (this.isSliding) return;

      if (!this.isLongTouch && event.touches.length === 1) return;

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
      clearTimeout(this.touchTimer);
      this.isLongTouch = false;
    };

    // Helper function
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

  checkFaceVisibility() {
    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const faceData = {};
    
    // Collect face data
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

    // Reset all opacities
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

  onWindowResize() {
    // Update device detection
    const width = window.innerWidth;
    this.isMobile = width < 768 || 
                  this.sys.game.device.os.android || 
                  this.sys.game.device.os.iOS || 
                  this.sys.game.device.os.windowsPhone;

    const container = this.scale.isFullscreen ? document.fullscreenElement : document.body;
    const height = container === document.body ? window.innerHeight : container.clientHeight;

    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();

    // Update Three.js
    if (this.renderer) {
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.domElement.style.width = `${rect.width}px`;
        this.renderer.domElement.style.height = `${rect.height}px`;
    }

    if (this.camera) {
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
    }

    // Update slider position
    if (this.unfoldSliderContainer) {
      if (this.isMobile) {
        this.unfoldSliderContainer.style.left = '50%';
        this.unfoldSliderContainer.style.right = 'auto';
        this.unfoldSliderContainer.style.transform = 'translateX(-50%)';
        this.unfoldSliderContainer.style.bottom = '70px';
        this.unfoldSliderContainer.style.top = 'auto';
        this.unfoldSliderContainer.style.width = '80%';
      } else {
        const rightOffset = 20;
        this.unfoldSliderContainer.style.left = 'auto';
        this.unfoldSliderContainer.style.right = `${(window.innerWidth - rect.right) + rightOffset}px`;
        this.unfoldSliderContainer.style.top = `${rect.top + 40}px`;
        this.unfoldSliderContainer.style.bottom = 'auto';
        this.unfoldSliderContainer.style.width = '200px';
        this.unfoldSliderContainer.style.transform = 'none';
      }
    }

    // Adjust orbit distance based on screen height
    const baseHeight = this.isMobile ? 400 : 600;
    this.orbit.radius = (this.isMobile ? 5 : 6) * (baseHeight / Math.max(height, 400));

    // Update edge materials
    if (this.faceGroups) {
      for (const group of Object.values(this.faceGroups)) {
        for (const child of group.children) {
          if (child.material && child.material.isLineMaterial) {
            child.material.resolution.set(width, height);
          }
        }
      }
    }

    // Handle delayed resize for mobile
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
    this.camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(0, 0, 0);
    this.checkFaceVisibility();
    this.renderer.render(this.scene3D, this.camera);
  }

  cleanupDOM() {
    // Remove Three.js canvas
    if (this.threeCanvas?.parentNode) {
      this.threeCanvas.remove();
    }

    // Remove slider
    if (this.unfoldSliderContainer?.parentNode) {
      this.unfoldSliderContainer.remove();
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
    button.on('pointerover', () => button.setScale(button.scaleX * 1.1));
    button.on('pointerout', () => button.setScale(button.scaleX / 1.1));
  }
}