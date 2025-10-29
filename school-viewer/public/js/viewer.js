window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  // 三人称視点カメラ（フォートナイト風に固定）
  const camera = new BABYLON.ArcRotateCamera("ThirdPersonCam", Math.PI, Math.PI / 2.2, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 6;
  camera.panningSensibility = 0;
  camera.inputs.attached.mousewheel.detachControl(); // ズーム禁止

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面（当たり判定あり）
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.4);
  ground.material = groundMat;
  ground.checkCollisions = true;

  scene.collisionsEnabled = true;

  let characterMesh = null;
  let isJumping = false;
  const keysPressed = {};

  // モデル読み込み（サイズ・向き・接地・当たり判定）
  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, _, __, animationGroups) => {
    characterMesh = meshes.find(mesh => mesh.name !== "__root__");

    if (!characterMesh) {
      infoBox.innerHTML = "⚠️ キャラメッシュが見つかりません！";
      return;
    }

    characterMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
    characterMesh.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI, 0);
    characterMesh.position = new BABYLON.Vector3(0, 1, 0);

    // 当たり判定設定
    characterMesh.checkCollisions = true;
    characterMesh.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
    characterMesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

    camera.lockedTarget = characterMesh;

    infoBox.innerHTML = "✅ キャラ読み込み完了！";

    if (animationGroups && animationGroups.length > 0) {
      animationGroups[0].start(true);
    }
  }, null, (scene, message, exception) => {
    infoBox.innerHTML = "❌ モデルの読み込みに失敗しました！<br>" + message;
    console.error("読み込みエラー:", message, exception);
  });

  // キー入力管理
  window.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });

  // ジャンプ処理
  function handleJump() {
    if (!characterMesh || isJumping) return;
    isJumping = true;

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
        }
      }
    }, 16);
  }

  // 毎フレームの処理（滑らか移動）
  engine.runRenderLoop(() => {
    if (characterMesh) {
      const speed = 0.05;

      if (keysPressed["q"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(-speed, 0, 0));
      if (keysPressed["c"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(speed, 0, 0));
      if (keysPressed["e"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, -speed));
      if (keysPressed["s"]) characterMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, speed));
      if (keysPressed[" "]) handleJump();
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
