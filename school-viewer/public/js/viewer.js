window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI / 2.2, 6, new BABYLON.Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const infoBox = document.getElementById('info');

  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character_idle.glb", scene, (meshes, _, __, animationGroups) => {
    const mesh = meshes.find(m => m.name !== "__root__");
    mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
    mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
    mesh.position = new BABYLON.Vector3(0, 1, 0);

    camera.lockedTarget = mesh;

    // モーション情報を画面に表示！
    infoBox.innerHTML = `✅ モデル読み込み完了！<br>`;
    infoBox.innerHTML += `アニメーション数: ${animationGroups.length}<br>`;

    animationGroups.forEach((group, i) => {
      infoBox.innerHTML += `[#${i}] ${group.name}<br>`;
    });

    // 最初のモーションを再生
    if (animationGroups[0]) {
      animationGroups[0].start(true);
    } else {
      infoBox.innerHTML += `<br>⚠️ モーションが見つかりません！`;
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});
