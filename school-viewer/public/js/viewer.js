window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  // カメラ設定（見下ろし気味）
  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  // ライト
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // 地面
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material = groundMat;

  // キャラモデル読み込み
  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
    const root = meshes[0];
    root.position = new BABYLON.Vector3(0, 0, 0);
    root.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);

    // アニメーションがあれば再生
    if (animationGroups.length > 0) {
      animationGroups[0].start(true);
    }

    console.log("モデル読み込み完了:", meshes);
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
