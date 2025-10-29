window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material = groundMat;

  // キャラモデル読み込み
  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
    console.log("読み込んだメッシュ数:", meshes.length);

    meshes.forEach((mesh) => {
      mesh.position = new BABYLON.Vector3(0, 0, 0);
      mesh.scaling = new BABYLON.Vector3(10, 10, 10); // ← 大きくして見逃し防止！
      mesh.isVisible = true;
      console.log("表示メッシュ:", mesh.name);
    });

    if (animationGroups.length > 0) {
      animationGroups[0].start(true);
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
