import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { breathData } from './breathData';
import { Picker } from './picker';

const lineMaterial = new LineBasicMaterial({ color: 0x333232 });
const redMaterial = new LineBasicMaterial({ color: 0x536ef4, linewidth: 2 });
const blueMaterial = new LineBasicMaterial({ color: 0xf45e53, linewidth: 2 });
const boxMaterial = new LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const breathPointMaterial = new MeshBasicMaterial({ color: 0x767ff7 });
export const nothingMaterial = new MeshBasicMaterial({});

export const createPlayerBox = () => {
  // player AABB is 0.6x1.8
  const radius = 0.6 / 2;
  const height = 1.8;

  const lineGeometry = new BufferGeometry();
  const positions: number[] = [];

  const x = (i: number) => (Math.floor((i + 1) / 2) % 2 == 0 ? -radius : radius);
  const y = (i: number) => (Math.floor(i / 2) % 2 == 0 ? -radius : radius);

  for (let i = 0; i < 4; i++) {
    const x1 = x(i),
      y1 = y(i),
      x2 = x(i + 1),
      y2 = y(i + 1);

    positions.push(x1, 0, y1);
    positions.push(x1, height, y1);

    positions.push(x1, 0, y1);
    positions.push(x2, 0, y2);
    positions.push(x1, height, y1);
    positions.push(x2, height, y2);
  }

  lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const line = new LineSegments(lineGeometry, boxMaterial);
  line.position.set(0, 0, 0);

  return line;
};

export const createGrid = () => {
  const grid = new Object3D();

  const lineGeometry = new BufferGeometry();
  const positions = [];

  const size = 10;
  const iteration = 1;

  for (let i = -size; i <= size; i += iteration) {
    positions.push(-size, 0, i);
    positions.push(size, 0, i);
    positions.push(i, 0, -size);
    positions.push(i, 0, size);
  }

  lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const line = new LineSegments(lineGeometry, lineMaterial);
  line.position.set(0, 0, 0);
  grid.add(line);

  const geometryZ = new BufferGeometry();
  geometryZ.setAttribute('position', new Float32BufferAttribute([0, 0, -size, 0, 0, size], 3));
  grid.add(new LineSegments(geometryZ, redMaterial));

  const geometryX = new BufferGeometry();
  geometryX.setAttribute(
    'position',
    new Float32BufferAttribute(
      [size + iteration / 2, 0, 0, size + iteration, 0, 0, -size, 0, 0, size, 0, 0],
      3,
    ),
  );
  grid.add(new LineSegments(geometryX, blueMaterial));

  return grid;
};

export const createBreathPoints = (picker: Picker | undefined = undefined) => {
  const geometry = new SphereGeometry(0.025, 12, 12);
  const matrix = new Matrix4();

  const mesh = new InstancedMesh(
    geometry,
    picker ? nothingMaterial : breathPointMaterial,
    breathData.length,
  );

  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  const color = new Color(0x767ff7);

  breathData.forEach((point, i) => {
    position.set(point[2], point[1] + 1.62, -point[0]);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);

    if (picker) {
      const allocation = picker.allocate();
      mesh.setColorAt(i, color.setHex(allocation));
      picker.pushData(
        allocation,
        i.toString(),
        point[2],
        point[1] + 1.62,
        -point[0],
        'breath',
        0,
        true,
        0,
      );
    } else mesh.setColorAt(i, color);
  });

  mesh.instanceColor.needsUpdate = true;
  mesh.instanceMatrix.needsUpdate = true;

  return mesh;
};

export const create3DCursor = () => {
  const lineGeometry = new BufferGeometry();
  const positions = [];

  const radius = 0.05;

  const x = (i: number) => (Math.floor((i + 1) / 2) % 2 == 0 ? -radius : radius);
  const y = (i: number) => (Math.floor(i / 2) % 2 == 0 ? -radius : radius);

  for (let i = 0; i < 4; i++) {
    const x1 = x(i),
      y1 = y(i),
      x2 = x(i + 1),
      y2 = y(i + 1);

    positions.push(x1, -radius, y1);
    positions.push(x1, radius, y1);

    positions.push(x1, -radius, y1);
    positions.push(x2, -radius, y2);
    positions.push(x1, radius, y1);
    positions.push(x2, radius, y2);
  }

  lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new LineSegments(lineGeometry, boxMaterial);
};
