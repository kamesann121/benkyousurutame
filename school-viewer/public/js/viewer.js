window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  const camera = new BABYLON.ArcRotateCamera("ThirdPersonCam", Math.PI, Math.PI / 2.2, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 6;
  camera.panningSensibility = 0;
  camera.inputs.attached.mousewheel.detachControl();

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.4);
  ground.material = groundMat;
  ground.checkCollisions = true;

  scene.collisionsEnabled = true;

  let characterMesh = null;
  let currentAnimGroup = null;
  let isJumping = false;
  const keysPressed = {};

  const motionFiles = {
    idle: "character_idle.glb",
    walk: "character_walk.glb",
    run: "character_run.glb",
    jump: "character_jump.glb"
  };

  async function loadMotion(name) {
    return new Promise((resolve) => {
      BABYLON.SceneLoader.ImportMesh("", "/assets/models/", motionFiles[name], scene, (meshes, _, __, animationGroups) => {
        const mesh = meshes.find(m => m.name !== "__root__");
        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI, 0);
        mesh.position = new BABYLON.Vector3(0, 1, 0);

        mesh.checkCollisions = true;
        mesh.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

        resolve({ mesh, group: animationGroups[0] });
      });
    });
  }

  async function switchMotion(name) {
    if (!motionFiles[name]) return;

    if (characterMesh) {
      characterMesh.dispose();
      characterMesh = null;
    }
    if (currentAnimGroup) {
      currentAnimGroup.stop();
      currentAnimGroup = null;
    }

    const { mesh, group } = await loadMotion(name);
    characterMesh = mesh;
    currentAnimGroup = group;

    camera.lockedTarget = characterMesh;
    currentAnimGroup.start(true);
  }

  // 初期状態：Idle
  switchMotion("idle").then(() => {
    infoBox.innerHTML = "✅ モーション切り替え準備完了！";
  });

  window.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });

  function handleJump() {
    if (!characterMesh || isJumping) return;
    isJumping = true;

    switchMotion("jump").then(() => {
      const jumpHeight = 1.5;
      const jumpSpeed = 0.08;
      let jumpUp = true;

      const jumpInterval = setInterval(() => {
        if (!characterMesh) return;

        if (jumpUp) {
          characterMesh.position.y += jumpSpeed;
          if (characterMesh.position.y >= jumpHeight) {
            jumpUp = false;
          }
        } else {
          characterMesh.position.y -= jumpSpeed;
          if (characterMesh.position.y <= 1) {
            characterMesh.position.y = 1;
            clearInterval(jumpInterval);
            isJumping = false;
            switchMotion("idle");
          }
        }
      }, 16);
    });
  }

  engine.runRenderLoop(() => {
    if (characterMesh) {
      const speed = keysPressed["shift"] ? 0.1 : 0.05;
      const moving = keysPressed["q"] || keysPressed["c"] || keysPressed["e"] || keysPressed["s"];

      if (moving) {
        if (keysPressed["q"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(-speed, 0, 0));
        if (keysPressed["c"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(speed, 0, 0));
        if (keysPressed["e"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, -speed));
        if (keysPressed["s"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, speed));
        if (keysPressed[" "]) handleJump();

        switchMotion(keysPressed["shift"] ? "run" : "walk");
      } else if (!isJumping) {
        switchMotion("idle");
      }
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
