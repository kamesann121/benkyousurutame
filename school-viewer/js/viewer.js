window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI / 2.2, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 🌟 Havok物理エンジンの初期化
  const havokInstance = await HavokPhysics();
  const physicsPlugin = new BABYLON.HavokPlugin(true, havokInstance);
  scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), physicsPlugin);

  // 🌟 地面の作成＋物理設定
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  ground.position.y = 0;
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.1 },
    scene
  );

  const motionFiles = {
    idle: "character_idle.glb",
    walk: "character_walk.glb",
    run: "character_run.glb",
    jump: "character_jump.glb"
  };

  let characterMesh = null;
  let currentAnimGroup = null;
  let isJumping = false;
  const keysPressed = {};

  async function loadMotion(name) {
    return new Promise((resolve) => {
      BABYLON.SceneLoader.ImportMesh("", "/assets/models/", motionFiles[name], scene, (meshes, _, __, animationGroups) => {
        const mesh = meshes.find(m => m.name !== "__root__");
        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        mesh.position = new BABYLON.Vector3(0, 2, 0);

        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
          mesh,
          BABYLON.PhysicsImpostor.BoxImpostor,
          { mass: 1, restitution: 0.2 },
          scene
        );

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

  switchMotion("idle");

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
      characterMesh.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 5, 0), characterMesh.getAbsolutePosition());
      setTimeout(() => {
        switchMotion("idle");
        isJumping = false;
      }, 1000);
    });
  }

  engine.runRenderLoop(() => {
    if (characterMesh) {
      const speed = keysPressed["shift"] ? 0.1 : 0.05;
      const moving = keysPressed["q"] || keysPressed["c"] || keysPressed["e"] || keysPressed["s"];

      if (moving) {
        const impulse = new BABYLON.Vector3(0, 0, 0);
        if (keysPressed["q"]) impulse.x -= speed;
        if (keysPressed["c"]) impulse.x += speed;
        if (keysPressed["e"]) impulse.z -= speed;
        if (keysPressed["s"]) impulse.z += speed;

        characterMesh.physicsImpostor.setLinearVelocity(impulse);

        if (keysPressed[" "]) handleJump();
        switchMotion(keysPressed["shift"] ? "run" : "walk");
      } else if (!isJumping) {
        characterMesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        switchMotion("idle");
      }
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
