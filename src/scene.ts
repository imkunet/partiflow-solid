import { Color, PerspectiveCamera, Scene, Vector2, WebGLRenderTarget, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type RenderContext = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;

  pickingScene: Scene;
  pickingTexture: WebGLRenderTarget;

  pointer: Vector2;
};

export const createScene = (): RenderContext => {
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new WebGLRenderer({
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  scene.background = new Color(0x0f0f0f);

  document.body.appendChild(renderer.domElement);

  // handle viewport resize
  window.onresize = () => {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.2;
  controls.maxDistance = 20;
  controls.update();

  const pickingScene = new Scene();
  const pickingTexture = new WebGLRenderTarget(1, 1);

  const pointer = new Vector2();
  renderer.domElement.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });

  return { scene, camera, renderer, controls, pickingScene, pickingTexture, pointer };
};

export const cleanupScene = (renderer: WebGLRenderer, scene: Scene) => {
  renderer.domElement.remove();
  renderer.getContext().finish();
  scene.clear();
  renderer.dispose();
};
