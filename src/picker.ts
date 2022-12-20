import { create3DCursor } from './geometry';
import { RenderContext } from './scene';

export type PointData = {
  pid: number;
  id: string;
  x: number;
  y: number;
  z: number;
  tag: string;
  created: number;
  hit: boolean;
  uncertainty: number;
};

export class Picker {
  private context: RenderContext;
  private allocation = 1;
  private pixelBuffer = new Uint8Array(4);
  private currentId = 0;
  private cursor = create3DCursor();
  private pointData: PointData[] = [];
  private setSelected: (value: PointData) => void;
  private leftClickCounter = 0;

  constructor(context: RenderContext, setter: (value: PointData) => void) {
    this.context = context;
    this.cursor.visible = false;
    context.scene.add(this.cursor);
    this.setSelected = setter;

    context.renderer.domElement.addEventListener('mousedown', (e) => {
      if (this.currentId != 0 && e.button == 0) this.leftClickCounter++;
    });
  }

  public allocate(): number {
    const returnAllocation = this.allocation;
    this.allocation++;
    return returnAllocation;
  }

  public pushData(
    id: number,
    uid: string,
    x: number,
    y: number,
    z: number,
    tag: string,
    created: number,
    hit: boolean,
    uncertainty: number,
  ) {
    this.pointData[id] = {
      pid: id,
      id: uid,
      x: x,
      y: y,
      z: z,
      tag: tag,
      created: created,
      hit: hit,
      uncertainty: uncertainty,
    };
  }

  public pick() {
    const { camera, renderer, pointer, pickingTexture, pickingScene } = this.context;

    const pixelRatio = renderer.getPixelRatio();
    camera.setViewOffset(
      renderer.getContext().drawingBufferWidth,
      renderer.getContext().drawingBufferHeight,
      pointer.x * pixelRatio,
      pointer.y * pixelRatio,
      1,
      1,
    );

    renderer.setRenderTarget(pickingTexture);
    renderer.render(pickingScene, camera);
    renderer.setRenderTarget(null);
    camera.clearViewOffset();

    renderer.readRenderTargetPixels(pickingTexture, 0, 0, 1, 1, this.pixelBuffer);
    const id = (this.pixelBuffer[0] << 16) | (this.pixelBuffer[1] << 8) | this.pixelBuffer[2];
    const size = 0.5 + Math.abs(Math.sin(Date.now() / 750));
    this.cursor.scale.set(size, size, size);
    if (this.currentId == id) return;

    if (this.leftClickCounter == 1) {
      return;
    }

    this.currentId = id;
    this.leftClickCounter = 0;

    if (id == 0) {
      this.cursor.visible = false;
      return;
    }

    const pointData = this.pointData[id];
    this.cursor.visible = true;
    this.cursor.position.set(pointData.x, pointData.y, pointData.z);

    this.setSelected(pointData);
  }
}
