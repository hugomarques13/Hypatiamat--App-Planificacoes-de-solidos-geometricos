export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.isUnfolded = false; // Track whether the cube is unfolded
  }

  create() {
    this.threeCanvas = document.createElement("canvas");
    this.threeCanvas.style.position = "absolute";
    this.threeCanvas.style.top = "0";
    this.threeCanvas.style.left = "0";
    document.body.appendChild(this.threeCanvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.threeCanvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene3D = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.cubeGroup = new THREE.Group();
    this.scene3D.add(this.cubeGroup);

    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }), // Red
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }), // Green
      new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }), // Blue
      new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }), // Yellow
      new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide }), // Magenta
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide })  // Cyan
    ];

    this.faces = [];
    const size = 1;
    const d = size / 2;

    const faceData = [
      { pos: [0, 0, d], rot: [0, 0, 0] }, // Front
      { pos: [0, 0, -d], rot: [0, Math.PI, 0] }, // Back
      { pos: [-d, 0, 0], rot: [0, -Math.PI / 2, 0] }, // Left
      { pos: [d, 0, 0], rot: [0, Math.PI / 2, 0] }, // Right
      { pos: [0, d, 0], rot: [-Math.PI / 2, 0, 0] }, // Top
      { pos: [0, -d, 0], rot: [Math.PI / 2, 0, 0] } // Bottom
    ];

    for (let i = 0; i < 6; i++) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(size, size), materials[i]);
      face.position.set(...faceData[i].pos);
      face.rotation.set(...faceData[i].rot);
      this.cubeGroup.add(face);
      this.faces.push(face);
    }

    this.originalTransforms = this.faces.map(face => ({
      position: face.position.clone(),
      rotation: face.rotation.clone()
    }));


    this.createPlanificationButtons();
    this.initMouseControls();
  }

  unfoldCube() {
      this.isUnfolded = true; // Mark as unfolded
      this.disableMouseControls(); // Lock camera

      let positions = [
        { x: 0, y: -1, z: 0 },  // Front
        { x: 0, y: 1, z: 0 },   // Back
        { x: -1, y: 0, z: 0 },  // Left
        { x: 1, y: 0, z: 0 },   // Right
        { x: 2, y: 0, z: 0 },   // Top
        { x: 0, y: 0, z: 0 }    // Bottom
      ];

      let targetQuaternion = this.camera.quaternion.clone(); // Capture camera rotation

      for (let i = 0; i < this.faces.length; i++) {
        // Animate position
        gsap.to(this.faces[i].position, {
          x: positions[i].x,
          y: positions[i].y,
          z: positions[i].z,
          duration: 1,
          ease: "power2.out"
        });

        // Directly apply the camera's rotation to each face
        this.faces[i].quaternion.copy(targetQuaternion);
      }
  }



  reassembleCube() {
    this.cubeGroup.visible = true;  // Show the cube again
    this.isUnfolded = false;        // Unlock camera movement
    this.enableMouseControls(); // Lock camera

    for (let i = 0; i < this.faces.length; i++) {
      gsap.to(this.faces[i].position, {
        x: this.originalTransforms[i].position.x,
        y: this.originalTransforms[i].position.y,
        z: this.originalTransforms[i].position.z,
        duration: 1,
        ease: "power2.out"
      });

      gsap.to(this.faces[i].rotation, {
        x: this.originalTransforms[i].rotation.x,
        y: this.originalTransforms[i].rotation.y,
        z: this.originalTransforms[i].rotation.z,
        duration: 1,
        ease: "power2.out"
      });
    }
  }



  createPlanificationButtons() {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "absolute";
    buttonContainer.style.top = "10px";
    buttonContainer.style.right = "10px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    document.body.appendChild(buttonContainer);

    const button = document.createElement("button");
    button.innerText = "Unfold Cube";
    button.style.margin = "5px";
    button.onclick = () => this.unfoldCube();
    buttonContainer.appendChild(button);

    const resetButton = document.createElement("button");
    resetButton.innerText = "Reset Cube";
    resetButton.style.margin = "5px";
    resetButton.onclick = () => this.reassembleCube();
    buttonContainer.appendChild(resetButton);
  }

  initMouseControls() {
    this.isMouseDown = false;
    
    this.onMouseDown = (event) => {
      if (this.isUnfolded) return; // Lock controls when unfolded
      this.isMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    };

    this.onMouseUp = () => { this.isMouseDown = false; };

    this.onMouseMove = (event) => {
      if (this.isMouseDown && !this.isUnfolded) {
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        this.cubeGroup.rotation.y += deltaX * 0.01;
        this.cubeGroup.rotation.x += deltaY * 0.01;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
      }
    };

    this.onMouseWheel = (event) => {
      if (this.isUnfolded) return;
      this.camera.position.z += event.deltaY * 0.01;
      this.camera.position.z = Math.max(1, Math.min(this.camera.position.z, 10));
    };

    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("wheel", this.onMouseWheel);
  }

  disableMouseControls() {
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("wheel", this.onMouseWheel);
  }

  enableMouseControls() {
    this.initMouseControls();
  }

update() {
  if (this.isUnfolded) {
    let cameraQuaternion = this.camera.quaternion.clone();
    this.faces.forEach(face => face.quaternion.copy(cameraQuaternion));
  }

  this.renderer.render(this.scene3D, this.camera);
}


}
