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
    idle: { file: "character_idle.glb", start: 0, end: 100 },
    walk: { file: "character_walk.glb", start: 0, end: 64 },
    run:  { file: "character_run.glb",  start: 0, end: 74 },
    jump: { file: "character_jump.glb", start: 0, end: 116 }
  };

  let characterMesh = null;
  let currentSkeleton = null;
  let currentAnimGroup = null;
  let isJumping = false;
  const keysPressed = {};

  async function loadMotion(name) {
    return new Promise((resolve) => {
      const motion = motionFiles[name];
      BABYLON.SceneLoader.ImportMesh("", "/assets/models/", motion.file, scene, (meshes, skeletons, __, animationGroups) => {
        if (infoBox) {
          infoBox.innerHTML = `🌟 ${name} モーション: ${motion.start}〜${motion.end}<br>`;
          infoBox.innerHTML += `Skeletons: ${skeletons.length}<br>`;
          infoBox.innerHTML += `AnimationGroups: ${animationGroups.length}<br>`;
          if (animationGroups[0]) {
            infoBox.innerHTML += `TargetedAnimations: ${animationGroups[0].targetedAnimations.length}<br>`;
          }
        }

        const skeleton = skeletons[0] || null;
        const animGroup = animationGroups[0] || null;

        // 🌟 全メッシュにスケルトンをバインド！
        meshes.forEach(m => {
          if (m instanceof BABYLON.Mesh && skeleton) {
            m.skeleton = skeleton;
          }
        });

        const mesh = meshes.find(m => m.name !== "__root__");

        mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        mesh.position = new BABYLON.Vector3(0, 1, 0);

        mesh.checkCollisions = true;
        mesh.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

        resolve({ mesh, skeleton, animGroup });
      });
    });
  }

  async function switchMotion(name, loop = true) {
    if (!motionFiles[name]) return;

    if (characterMesh) {
      characterMesh.dispose();
      characterMesh = null;
    }
    if (currentAnimGroup) {
      currentAnimGroup.stop();
      currentAnimGroup = null;
    }

    const { mesh, skeleton, animGroup } = await loadMotion(name);
    characterMesh = mesh;
    currentSkeleton = skeleton;
    currentAnimGroup = animGroup;

    camera.lockedTarget = characterMesh;

    const motion = motionFiles[name];

    if (currentAnimGroup && currentAnimGroup.targetedAnimations.length > 0) {
      currentAnimGroup.loopAnimation = loop;
      currentAnimGroup.reset();
      currentAnimGroup.play(loop);
    } else if (currentSkeleton) {
      scene.beginAnimation(currentSkeleton, motion.start, motion.end, loop);
    } else {
      if (infoBox) {
        infoBox.innerHTML += `<br>⚠️ モーション再生できませんでした`;
      }
    }
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

    switchMotion("jump", false).then(() => {
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
