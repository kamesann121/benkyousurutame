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
  let currentAnim = null;
  let isJumping = false;
  const keysPressed = {};

  const animations = {
    idle: null,
    walk: null,
    run: null,
    jump: null
  };

  function loadCharacter(file, key) {
    return new Promise((resolve) => {
      BABYLON.SceneLoader.ImportMesh("", "/assets/models/", file, scene, (meshes, _, __, animationGroups) => {
        const mesh = meshes.find(m => m.name !== "__root__");
        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI, 0);
        mesh.position = new BABYLON.Vector3(0, 1, 0);
        mesh.setEnabled(false);

        mesh.checkCollisions = true;
        mesh.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

        animations[key] = {
          mesh: mesh,
          group: animationGroups[0]
        };

        resolve();
      });
    });
  }

  Promise.all([
    loadCharacter("character_idle.glb", "idle"),
    loadCharacter("character_walk.glb", "walk"),
    loadCharacter("character_run.glb", "run"),
    loadCharacter("character_jump.glb", "jump")
  ]).then(() => {
    characterMesh = animations.idle.mesh;
    characterMesh.setEnabled(true);
    camera.lockedTarget = characterMesh;
    animations.idle.group.start(true);
    currentAnim = "idle";
    infoBox.innerHTML = "✅ キャラとモーション読み込み完了！";
  });

  function switchAnimation(name) {
    if (currentAnim === name || !animations[name]) return;

    animations[currentAnim].group.stop();
    animations[currentAnim].mesh.setEnabled(false);

    characterMesh = animations[name].mesh;
    characterMesh.setEnabled(true);
    camera.lockedTarget = characterMesh;
    animations[name].group.start(true);

    currentAnim = name;
  }

  window.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });

  function handleJump() {
    if (!characterMesh || isJumping) return;
    isJumping = true;
    switchAnimation("jump");

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
          switchAnimation("idle");
        }
      }
    }, 16);
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

        switchAnimation(keysPressed["shift"] ? "run" : "walk");
      } else if (!isJumping) {
        switchAnimation("idle");
      }
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
