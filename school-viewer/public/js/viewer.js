window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  // 三人称視点カメラ（FollowCamera）
  const followCamera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 5, -10), scene);
  followCamera.radius = 10;             // キャラとの距離
  followCamera.heightOffset = 3;        // 高さ
  followCamera.rotationOffset = 0;      // 角度（0で後ろから）
  followCamera.cameraAcceleration = 0.05;
  followCamera.maxCameraSpeed = 10;
  scene.activeCamera = followCamera;
  followCamera.attachControl(canvas, true);

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.6, 0.9, 1.0);
  ground.material = groundMat;

  let characterMesh = null;
  let isJumping = false;

  // モデル読み込み（__root__除去＋親ノード化＋サイズ調整）
  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
    const parent = new BABYLON.TransformNode("characterParent", scene);

    meshes.forEach((mesh) => {
      if (mesh.name !== "__root__") {
        mesh.parent = parent;
      }
    });

    characterMesh = parent;
    characterMesh.position = new BABYLON.Vector3(0, 0, 0);
    characterMesh.scaling = new BABYLON.Vector3(1, 1, 1); // 🔹 サイズ調整（小さくしすぎない）

    followCamera.lockedTarget = characterMesh; // 🔹 カメラがキャラを追いかける！

    infoBox.innerHTML = "✅ キャラ読み込み完了！";

    if (animationGroups && animationGroups.length > 0) {
      animationGroups[0].start(true);
    }
  }, null, (scene, message, exception) => {
    infoBox.innerHTML = "❌ モデルの読み込みに失敗しました！<br>" + message;
    console.error("読み込みエラー:", message, exception);
  });

  // キー操作：Q左 C右 E上 S下 スペースジャンプ
  window.addEventListener("keydown", (event) => {
    if (!characterMesh) return;

    const step = 0.5;

    switch (event.key.toLowerCase()) {
      case "q":
        characterMesh.position.x -= step;
        break;
      case "c":
        characterMesh.position.x += step;
        break;
      case "e":
        characterMesh.position.y += step;
        break;
      case "s":
        characterMesh.position.y -= step;
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
