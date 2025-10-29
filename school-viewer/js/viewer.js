window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  // 三人称視点カメラ（ArcRotateCameraで見渡し可能）
  const camera = new BABYLON.ArcRotateCamera("ThirdPersonCam", Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 20;
  camera.wheelDeltaPercentage = 0.01;
  camera.useAutoRotationBehavior = false;

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.6, 0.9, 1.0);
  ground.material = groundMat;

  let characterMesh = null;
  let isJumping = false;

  // モデル読み込み（TransformNodeでまとめて、立ち姿に調整）
  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
    const parent = new BABYLON.TransformNode("characterParent", scene);

    meshes.forEach((mesh) => {
      if (mesh.name !== "__root__") {
        mesh.parent = parent;
      }
    });

    characterMesh = parent;
    characterMesh.position = new BABYLON.Vector3(0, 0, 0);
    characterMesh.scaling = new BABYLON.Vector3(1, 1, 1);
    characterMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0); // 🔹 立ち姿に修正！

    camera.lockedTarget = characterMesh; // 🔹 カメラがキャラを中心に見渡す！

    infoBox.innerHTML = "✅ キャラ読み込み完了！";

    if (animationGroups && animationGroups.length > 0) {
      animationGroups[0].start(true);
    }
  }, null, (scene, message, exception) => {
    infoBox.innerHTML = "❌ モデルの読み込みに失敗しました！<br>" + message;
    console.error("読み込みエラー:", message, exception);
  });

  // 滑らか移動関数
  function smoothMove(mesh, direction, distance, duration = 200) {
    const start = mesh.position.clone();
    const end = start.add(direction.scale(distance));

    const animation = new BABYLON.Animation("moveAnim", "position", 60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const keys = [
      { frame: 0, value: start },
      { frame: 60, value: end }
    ];

    animation.setKeys(keys);
    mesh.animations = [];
    mesh.animations.push(animation);
    scene.beginAnimation(mesh, 0, 60, false);
  }

  // キー操作：Q左 C右 E上 S下 スペースジャンプ
  window.addEventListener("keydown", (event) => {
    if (!characterMesh) return;

    const step = 0.5;

    switch (event.key.toLowerCase()) {
      case "q":
        smoothMove(characterMesh, new BABYLON.Vector3(-1, 0, 0), step);
        break;
      case "c":
        smoothMove(characterMesh, new BABYLON.Vector3(1, 0, 0), step);
        break;
      case "e":
        smoothMove(characterMesh, new BABYLON.Vector3(0, 1, 0), step);
        break;
      case "s":
        smoothMove(characterMesh, new BABYLON.Vector3(0, -1, 0), step);
        break;
      case " ":
        if (isJumping) return;
        isJumping = true;
        const jumpHeight = 2;
        const jumpSpeed = 0.1;
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
            if (characterMesh.position.y <= 0) {
              characterMesh.position.y = 0;
              clearInterval(jumpInterval);
              isJumping = false;
            }
          }
        }, 16);
        break;
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
