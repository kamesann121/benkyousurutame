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

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  ground.position.y = 0;

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
        // 🌟 モーション情報を画面に表示！
        if (infoBox) {
          infoBox.innerHTML = `🌟 アニメーション数: ${animationGroups.length}<br>`;
          animationGroups.forEach((group, i) => {
            infoBox.innerHTML += `Group ${i}: ${group.name}<br>`;
          });
        }

        const mesh = meshes.find(m => m.name !== "__root__");
        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
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

    // 🌟 モーション再生方法を修正！
    currentAnimGroup.reset();
    currentAnimGroup.play(true);
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
