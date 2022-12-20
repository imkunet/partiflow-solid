import { Object3D } from 'three';
import { RenderContext } from './scene';

export class Layer {
  private rendering: boolean;
  private binding: () => boolean;
  private object: Object3D;
  private pickingObject: Object3D | undefined;

  public constructor(
    binding: () => boolean,
    object: Object3D,
    context: RenderContext,
    pickingObject: Object3D | undefined = undefined,
  ) {
    this.binding = binding;
    this.rendering = binding();
    this.object = object;
    this.pickingObject = pickingObject;

    context.scene.add(object);
    object.visible = this.rendering;
    if (this.pickingObject) {
      context.pickingScene.add(pickingObject);
      pickingObject.visible = this.rendering;
    }
  }

  public update() {
    if (!this.binding() && this.rendering) {
      this.object.visible = false;
      if (this.pickingObject) this.pickingObject.visible = false;
      this.rendering = false;
    }

    if (this.binding() && !this.rendering) {
      this.object.visible = true;
      if (this.pickingObject) this.pickingObject.visible = true;
      this.rendering = true;
    }
  }
}

export const useLayer = (
  binding: () => boolean,
  object: Object3D,
  context: RenderContext,
  pickingObject: Object3D | undefined = undefined,
) => {
  return new Layer(binding, object, context, pickingObject);
};
