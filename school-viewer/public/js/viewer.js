window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  // カメラ設定（高め＆後ろから）
  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);
  camera.setPosition(new BABYLON.Vector3(0, 5, -10));
  camera.setTarget(new BABYLON.Vector3(0, 1, 0));

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material = groundMat;

  // キャラモデル読み込み（Appendで階層ごと読み込む！）
  BABYLON.SceneLoader.Append("/assets/models/", "character.glb", scene, (scene) => {
    console.log("✅ モデル読み込み完了！");

    scene.meshes.forEach((mesh) => {
      console.log("🔹 メッシュ名:", mesh.name);
      console.log("   位置:", mesh.position);
      console.log("   スケール:", mesh.scaling);
      console.log("   可視状態:", mesh.isVisible);

      mesh.scaling = new BABYLON.Vector3(10, 10, 10);
      mesh.position = new BABYLON.Vector3(0, 0, 0);
      mesh.isVisible = true;
    });

    if (scene.animationGroups && scene.animationGroups.length > 0) {
      console.log("🎞️ アニメーション数:", scene.animationGroups.length);
      scene.animationGroups[0].start(true);
    } else {
      console.log("⚠️ アニメーションなし！");
    }
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
