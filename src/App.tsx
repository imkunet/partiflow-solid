import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { createBreathPoints, createGrid, createPlayerBox, nothingMaterial } from './geometry';
import { useLayer } from './layer';
import { cleanupScene, createScene } from './scene';
import { LayerToggle } from './components/LayerToggle';
import { Picker, PointData } from './picker';
import moment from 'moment';
import { Color, InstancedMesh, Matrix4, Quaternion, SphereGeometry, Vector3 } from 'three';

const App: Component = () => {
  const [animationFrame, setAnimationFrame] = createSignal(0);
  const [selectedPoint, setSelectedPoint] = createSignal<PointData | undefined>(undefined);

  const [tagNames, setTagNames] = createSignal<string[]>([], { equals: false });
  const [activeTags, setActiveTags] = createSignal<Set<string>>(new Set<string>(), {
    equals: false,
  });

  const [needsRender, setNeedsRender] = createSignal(false);

  const setTagState = (tag: string, state: boolean) => {
    if (state) activeTags().add(tag);
    else activeTags().delete(tag);
    setActiveTags(activeTags());
    setNeedsRender(true);
  };

  onMount(() => {
    const renderContext = createScene();
    const { scene, camera, renderer, controls, pickingScene } = renderContext;
    onCleanup(() => cleanupScene(renderer, scene));

    camera.position.set(-5, 5, 5);
    scene.add(camera);

    const picker = new Picker(renderContext, setSelectedPoint);

    const grid = useLayer(showGrid, createGrid(), renderContext);
    const playerBox = useLayer(showPlayerHitbox, createPlayerBox(), renderContext);
    const breathPoints = useLayer(
      showBreath,
      createBreathPoints(),
      renderContext,
      createBreathPoints(picker),
    );

    onCleanup(() => cancelAnimationFrame(animationFrame()));

    const pointDataArray = [];

    const websocket = new WebSocket('wss://papi-prod.kunet.dev/ws');
    websocket.addEventListener('open', () => {
      console.log('socket opened!');
    });

    websocket.addEventListener('message', (e) => {
      const data = JSON.parse(e.data) as PointData[];
      data.forEach((point) => {
        if (!tagNames().includes(point.tag)) {
          const add = tagNames();
          add.push(point.tag);
          setTagNames(add);
          activeTags().add(point.tag);
        }

        point.pid = picker.allocate();
        picker.pushData(
          point.pid,
          point.id,
          point.x,
          point.y,
          point.z,
          point.tag,
          point.created,
          point.hit,
          point.uncertainty,
        );
        pointDataArray.push(point);
      });

      setActiveTags(activeTags());
      setNeedsRender(true);
    });

    onCleanup(() => websocket.close());

    const constructPoints = (picker: boolean) => {
      const geometry = new SphereGeometry(0.025, 12, 12);
      const matrix = new Matrix4();

      console.log(pointDataArray);
      console.log(activeTags());

      const filtered = [];
      // this HAS to be optimized in the future, not care now ._.
      activeTags().forEach((it) => {
        pointDataArray.filter((point) => point.tag == it).forEach((point) => filtered.push(point));
      });

      console.log(filtered);

      const mesh = new InstancedMesh(geometry, nothingMaterial, filtered.length);

      const position = new Vector3();
      const quaternion = new Quaternion();
      const scale = new Vector3(1, 1, 1);
      const color = new Color(0x767ff7);
      const hit = new Color(0xe06262);
      const miss = new Color(0x4c4c4c);

      filtered.forEach((point, i) => {
        position.set(point.x, point.y, point.z);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(i, matrix);

        if (picker) mesh.setColorAt(i, color.setHex(point.pid));
        else mesh.setColorAt(i, point.hit ? hit : miss);
      });

      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;

      return mesh;
    };

    let pointMesh = constructPoints(false);
    let pointPickerMesh = constructPoints(true);

    scene.add(pointMesh);
    pickingScene.add(pointPickerMesh);

    const animate = () => {
      setAnimationFrame(requestAnimationFrame(animate));

      if (needsRender()) {
        setNeedsRender(false);
        scene.remove(pointMesh);
        pickingScene.remove(pointPickerMesh);

        pointMesh = constructPoints(false);
        pointPickerMesh = constructPoints(true);

        scene.add(pointMesh);
        pickingScene.add(pointPickerMesh);
      }

      if (resetCamera()) {
        controls.reset();
        camera.position.set(-5, 5, 5);
        setResetCamera(false);
      }

      playerBox.update();
      breathPoints.update();
      grid.update();

      controls.update();

      picker.pick();
      renderer.render(scene, camera);
    };

    animate();
  });

  const [frameShown, setFrameShown] = createSignal(true);
  const [resetCamera, setResetCamera] = createSignal(false);

  const [showPlayerHitbox, setShowPlayerHitbox] = createSignal(true);
  const [showBreath, setShowBreath] = createSignal(true);
  const [showGrid, setShowGrid] = createSignal(true);

  return (
    <div class="w-64 backdrop-blur-md bg-opacity-20 bg-zinc-900 rounded-lg m-2 p-2 outline outline-1 outline-zinc-800">
      <div class="text-2xl font-bold">
        Partiflow<span class="text-zinc-400">™</span>
      </div>
      <div class="text-zinc-300 font-medium leading-tight pb-2">
        Partiflow is a digital 3d browser based real time freezing breath data viewer.
      </div>
      <div class="flex w-full gap-1">
        <div
          class="flex items-center justify-center bg-indigo-500 w-12 h-8 font-bold text-xl text-center rounded-md select-none cursor-pointer"
          onClick={() => setFrameShown(!frameShown())}
        >
          {frameShown() ? '-' : '+'}
        </div>
        <div
          class="flex items-center w-full justify-center bg-indigo-500 h-8 font-semibold text-md text-center rounded-md select-none cursor-pointer"
          onClick={() => setResetCamera(true)}
        >
          Reset Camera
        </div>
      </div>
      <div hidden={!frameShown()} class="m-1">
        <div class="font-semibold">Layer Toggles</div>
        <LayerToggle label="Show grid" update={setShowGrid} defaultValue={showGrid()} />
        <LayerToggle
          label="Show player hitbox"
          update={setShowPlayerHitbox}
          defaultValue={showPlayerHitbox()}
        />
        <LayerToggle
          label="Show breath particles"
          update={setShowBreath}
          defaultValue={showBreath()}
        />
        <div class="font-semibold">Inspector</div>
        <div class="leading-snug">
          <div class="font-mono">
            {selectedPoint()?.tag || 'none'}:{selectedPoint()?.id || 'none'}
          </div>
          <div>
            Created{' '}
            {selectedPoint()?.created
              ? moment(selectedPoint()?.created || 0).fromNow()
              : '∞ eternities ago'}
          </div>
          <div class="font-mono">
            {selectedPoint()?.x?.toFixed(4) || '0'} {selectedPoint()?.y?.toFixed(4) || '0'}{' '}
            {selectedPoint()?.z?.toFixed(4) || '0'}
          </div>
          <div>Hit: {selectedPoint()?.hit ? 'yeah' : 'nah'}</div>
          <div>Uncertainty: {selectedPoint()?.uncertainty || '0'}</div>
        </div>
        <div class="font-semibold">Tag Toggles</div>
        <For each={tagNames()}>
          {(item) => (
            <div>
              <input
                class="cursor-pointer"
                type="checkbox"
                id={`tag-${item}`}
                onInput={(e) => setTagState(item, e.target['checked'])}
                checked
              />
              <label class="select-none" for={`tag-${item}`}>
                {' ' + item}
              </label>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default App;
