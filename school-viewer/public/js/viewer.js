window.addEventListener('error', (e) => {
  const infoBox = document.getElementById('info');
  if (infoBox) {
    infoBox.innerHTML = `⚠️ エラー発生: ${e.message}`;
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI / 2.2, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.useFramingBehavior = true;
  camera.framingBehavior.elevationReturnTime = -1;

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  ground.position.y = 0;

  const motionFiles = {
    idle: "character_idle.glb",
    walk: "character_walk.glb",
    run:  "character_run.glb",
    jump: "character_jump.glb"
  };

  let characterMesh = null;
  let currentAnimGroup = null;
  let currentMotionName = "";
  const keysPressed = {};

  async function loadMotion(name, loop = true) {
    if (name === currentMotionName) return;
    currentMotionName = name;

    if (characterMesh) {
      characterMesh.dispose();
      characterMesh = null;
    }
    if (currentAnimGroup) {
      currentAnimGroup.stop();
      currentAnimGroup = null;
    }

    const file = motionFiles[name];
    return new Promise((resolve) => {
      BABYLON.SceneLoader.ImportMesh("", "/assets/models/", file, scene, (meshes, _, __, animationGroups) => {
        const mesh = meshes.find(m => m.name !== "__root__");
        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        mesh.position = new BABYLON.Vector3(0, 1, 0);

        characterMesh = mesh;
        camera.lockedTarget = characterMesh;

        const animGroup = animationGroups[0];
        if (animGroup) {
          animGroup.loopAnimation = loop;
          animGroup.reset();
          animGroup.play(loop);
          currentAnimGroup = animGroup;
        }

        resolve();
      });
    });
  }

  await loadMotion("idle");

  window.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });

  engine.runRenderLoop(async () => {
    if (!characterMesh) return;

    const speed = keysPressed["shift"] ? 0.1 : 0.05;
    const moving = keysPressed["q"] || keysPressed["c"] || keysPressed["e"] || keysPressed["s"];

    if (keysPressed[" "]) {
      await loadMotion("jump", false);
    } else if (moving) {
      if (keysPressed["q"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(-speed, 0, 0));
      if (keysPressed["c"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(speed, 0, 0));
      if (keysPressed["e"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, -speed));
      if (keysPressed["s"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, speed));

      await loadMotion(keysPressed["shift"] ? "run" : "walk");
    } else {
      await loadMotion("idle");
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
