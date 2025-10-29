window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  const infoBox = document.getElementById('info');

  // カメラ設定（操作可能＆自動回転）
  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 20, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 100;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 50;
  camera.useAutoRotationBehavior = true;

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面（広くて安心！）
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.6, 0.9, 1.0); // 水色っぽく！
  ground.material = groundMat;

  // モデル読み込み
  BABYLON.SceneLoader.Append("/assets/models/", "character.glb", scene, (scene) => {
    let message = "✅ モデル読み込み完了！<br>";

    if (scene.meshes.length === 0) {
      message += "⚠️ メッシュが読み込まれませんでした！";
    } else {
      scene.meshes.forEach((mesh) => {
        message += `🔹 メッシュ名: ${mesh.name}<br>`;
        mesh.scaling = new BABYLON.Vector3(10, 10, 10);
        mesh.position = new BABYLON.Vector3(0, 0, 0);
        mesh.isVisible = true;
      });

      if (scene.animationGroups && scene.animationGroups.length > 0) {
        message += `🎞️ アニメーション数: ${scene.animationGroups.length}<br>`;
        scene.animationGroups[0].start(true);
      } else {
        message += "⚠️ アニメーションなし！";
      }
    }

    infoBox.innerHTML = message;
  }, null, (scene, message, exception) => {
    infoBox.innerHTML = "❌ モデルの読み込みに失敗しました！<br>" + message;
    console.error("読み込みエラー:", message, exception);
  });

  // レンダーループ
  engine.runRenderLoop(() => {
    scene.render();
  });

  // ウィンドウサイズ変更対応
  window.addEventListener('resize', () => {
    engine.resize();
  });
});
