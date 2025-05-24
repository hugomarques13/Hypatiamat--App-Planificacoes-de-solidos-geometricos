
export default class Cilindro extends Phaser.Scene {
  constructor() {
    super({ key: 'Cilindro' });
    this.unfoldProgress = 0;
    this.orbit = { radius: 6, theta: Math.PI / 4, phi: Math.PI / 3 };
    this.cylinderHeight = 2;
    this.radius = 1;
  }

  preload() {
    this.load.image('background', 'assets/background.png');
  }

  create() {
    this.add.image(512, 300, 'background').setScale(0.8);

    this.threeCanvas = document.createElement('canvas');
    Object.assign(this.threeCanvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '0',
      pointerEvents: 'none'
    });
    document.body.appendChild(this.threeCanvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.threeCanvas, alpha: true, antialias: true });
    this.scene3D = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.initMouseControls();

    this.materials = {
      lateral: new THREE.MeshBasicMaterial({ color: 0x1f77b4, side: THREE.DoubleSide }),
      top: new THREE.MeshBasicMaterial({ color: 0xff7f0e, side: THREE.DoubleSide }),
      bottom: new THREE.MeshBasicMaterial({ color: 0x2ca02c, side: THREE.DoubleSide }),
    };

    this.cylinderGroup = new THREE.Group();
    this.scene3D.add(this.cylinderGroup);

    this.createCilindroGeometry();
    this.createUnfoldSlider();
    this.onWindowResize();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  createCilindroGeometry() {
    const { radius, cylinderHeight } = this;
    const lateralWidth = 2 * Math.PI * radius;

    // --- Lateral: pivot na aresta esquerda, mesh deslocada para a direita ---
    this.lateralPivot = new THREE.Group();
    const lateralGeometry = new THREE.PlaneGeometry(lateralWidth, cylinderHeight);
    this.lateralMesh = new THREE.Mesh(lateralGeometry, this.materials.lateral);

    // Posiciona a lateral para que a dobra fique na aresta esquerda (pivot)
    this.lateralMesh.position.x = lateralWidth / 2;

    this.lateralPivot.add(this.lateralMesh);
    this.lateralPivot.position.set(0, 0, 0);

    // Começa dobrada (enrolada) com rotY = π (180°)
    this.lateralPivot.rotation.y = Math.PI;

    this.cylinderGroup.add(this.lateralPivot);

    // --- Top face pivot no ponto da ligação lateral-base ---
    this.topPivot = new THREE.Group();
    this.topPivot.position.set(0, cylinderHeight / 2, 0);  // eixo do cilindro na aresta topo-lateral

    this.topMesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), this.materials.top);
    this.topMesh.rotation.x = Math.PI / 2;
    this.topMesh.position.z = radius;  // deslocada para frente para ligar lateral
    this.topPivot.add(this.topMesh);
    this.cylinderGroup.add(this.topPivot);

    // --- Bottom face pivot no ponto da ligação lateral-base ---
    this.bottomPivot = new THREE.Group();
    this.bottomPivot.position.set(0, -cylinderHeight / 2, 0);  // eixo do cilindro na aresta baixo-lateral

    this.bottomMesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), this.materials.bottom);
    this.bottomMesh.rotation.x = -Math.PI / 2;
    this.bottomMesh.position.z = radius;  // deslocada para frente para ligar lateral
    this.bottomPivot.add(this.bottomMesh);
    this.cylinderGroup.add(this.bottomPivot);
  }

  updateUnfoldAnimation() {
    const p = this.unfoldProgress;

    // Lateral: desdobra da curva (π) para plano (0)
    this.lateralPivot.rotation.y = (1 - p) * Math.PI;

    // Top: gira para cima e sobe mantendo a ligação lateral-base
    this.topPivot.rotation.x = -p * Math.PI / 2;
    // A posição y e z do pivot mantém-se fixa pois é o ponto de ligação

    // Bottom: gira para baixo e desce mantendo a ligação lateral-base
    this.bottomPivot.rotation.x = p * Math.PI / 2;
    // Posição y e z do pivot mantida fixa

    // O lateral está na origem, as bases giram à volta dos seus pivots ligados à lateral
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
  }

  initMouseControls() {
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.orbit.theta -= deltaX * 0.01;
      this.orbit.phi -= deltaY * 0.01;
      this.orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.phi));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener("wheel", (e) => {
      this.orbit.radius += e.deltaY * 0.01;
      this.orbit.radius = Math.max(2, Math.min(10, this.orbit.radius));
    });
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
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
}
