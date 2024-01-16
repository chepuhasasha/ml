interface Box {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
}

function intersectBoxes(box1: Box, box2: Box): Box | null {
  const xMin = Math.max(box1.x - box1.dx / 2, box2.x - box2.dx / 2);
  const xMax = Math.min(box1.x + box1.dx / 2, box2.x + box2.dx / 2);

  const yMin = Math.max(box1.y - box1.dy / 2, box2.y - box2.dy / 2);
  const yMax = Math.min(box1.y + box1.dy / 2, box2.y + box2.dy / 2);

  const zMin = Math.max(box1.z - box1.dz / 2, box2.z - box2.dz / 2);
  const zMax = Math.min(box1.z + box1.dz / 2, box2.z + box2.dz / 2);

  if (xMin <= xMax && yMin <= yMax && zMin <= zMax) {
    const intersectionDimensions = {
      dx: xMax - xMin,
      dy: yMax - yMin,
      dz: zMax - zMin,
    };

    const intersectionCenter = {
      x: xMin + intersectionDimensions.dx / 2,
      y: yMin + intersectionDimensions.dy / 2,
      z: zMin + intersectionDimensions.dz / 2,
    };

    return {
      x: intersectionCenter.x,
      y: intersectionCenter.y,
      z: intersectionCenter.z,
      dx: intersectionDimensions.dx,
      dy: intersectionDimensions.dy,
      dz: intersectionDimensions.dz,
    };
  }

  return null;
}

// Пример использования
const box1: Box = {
  x: 0,
  y: 0,
  z: 0,
  dx: 2,
  dy: 2,
  dz: 2,
};

const box2: Box = {
  x: 1,
  y: 1,
  z: 1,
  dx: 2,
  dy: 2,
  dz: 2,
};

const intersection = intersectBoxes(box1, box2);

if (intersection) {
  console.log("Параллелепипеды пересекаются:", intersection);
} else {
  console.log("Параллелепипеды не пересекаются.");
}
