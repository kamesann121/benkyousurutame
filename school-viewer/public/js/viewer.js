window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 5, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material = groundMat;

  BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "character.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
    const root = meshes[0];
    root.position = new BABYLON.Vector3(0, 0, 0);
    root.scaling = new BABYLON.Vector3(1, 1, 1);

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
