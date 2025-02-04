// General utility functions

export const getLandmarkPosition = (landmark, frameWidth, frameHeight) => ({
  x: landmark.x * frameWidth,
  y: landmark.y * frameHeight,
});

export const getLandmarkFeatures = (poseLandmarks,feature,frameWidth,frameHeight) => {
  const dictFeatures = {
    nose: 0,
    left: {
      shoulder: 11,
      elbow: 13,
      wrist: 15,
      hip: 23,
      knee: 25,
      ankle: 27,
      foot: 31,
    },
    right: {
      shoulder: 12,
      elbow: 14,
      wrist: 16,
      hip: 24,
      knee: 26,
      ankle: 28,
      foot: 32,
    },
  };

  if (feature === "nose") {
    return getLandmarkPosition(
      poseLandmarks[dictFeatures.nose],
      frameWidth,
      frameHeight
    );
  } else if (feature === "left" || feature === "right") {
    const featureSet = dictFeatures[feature];
    return {
      shoulder: getLandmarkPosition(
        poseLandmarks[featureSet.shoulder],
        frameWidth,
        frameHeight
      ),
      elbow: getLandmarkPosition(
        poseLandmarks[featureSet.elbow],
        frameWidth,
        frameHeight
      ),
      wrist: getLandmarkPosition(
        poseLandmarks[featureSet.wrist],
        frameWidth,
        frameHeight
      ),
      hip: getLandmarkPosition(
        poseLandmarks[featureSet.hip],
        frameWidth,
        frameHeight
      ),
      knee: getLandmarkPosition(
        poseLandmarks[featureSet.knee],
        frameWidth,
        frameHeight
      ),
      ankle: getLandmarkPosition(
        poseLandmarks[featureSet.ankle],
        frameWidth,
        frameHeight
      ),
      foot: getLandmarkPosition(
        poseLandmarks[featureSet.foot],
        frameWidth,
        frameHeight
      ),
    };
  } else {
    throw new Error("Feature must be 'nose', 'left', or 'right'.");
  }
};

export const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

export const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

export const findAngle = (p1, p2, refPt = { x: 0, y: 0 }) => {
  const p1Ref = { x: p1.x - refPt.x, y: p1.y - refPt.y };
  const p2Ref = { x: p2.x - refPt.x, y: p2.y - refPt.y };

  const cosTheta = dot(p1Ref, p2Ref) / (magnitude(p1Ref) * magnitude(p2Ref));
  const theta = Math.acos(Math.max(Math.min(cosTheta, 1.0), -1.0));
  return Math.round(theta * (180 / Math.PI));
};

export const drawRoundedRect = (
  ctx,
  x,
  y,
  width,
  height,
  radius,
  fillColor
) => {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
};

export const drawText = (ctx, msg, x, y, options = {}) => {
  const {
    boxWidth = 8,
    textColor = "rgb(0, 255, 0)",
    backgroundColor = "rgb(0, 0, 0)",
    fontSize = "16px",
    fontFamily = "Arial",
    paddingX = 20,
    paddingY = 10,
  } = options;

  ctx.font = `${fontSize} ${fontFamily}`;
  const textMetrics = ctx.measureText(msg);
  const textWidth = textMetrics.width;
  const textHeight = parseInt(fontSize, 10);

  const rectStartX = x - paddingX;
  const rectStartY = y - textHeight - paddingY;
  const rectWidth = textWidth + 2 * paddingX;
  const rectHeight = textHeight + 2 * paddingY;

  drawRoundedRect(
    ctx,
    rectStartX,
    rectStartY,
    rectWidth,
    rectHeight,
    boxWidth,
    backgroundColor
  );
  ctx.fillStyle = textColor;
  ctx.fillText(msg, x, y + paddingY / 2);
};

export const drawCircle = (ctx, position, radius, color) => {
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
};

export const drawConnector = (ctx, start, end, color, lineWidth) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
};

export const drawDottedLine = (ctx, start, end, color) => {
  const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const dotSpacing = 5;
  const numOfDots = Math.floor(lineLength / dotSpacing);

  for (let i = 0; i < numOfDots; i++) {
    const dotX = start.x + ((end.x - start.x) / numOfDots) * i;
    const dotY = start.y + ((end.y - start.y) / numOfDots) * i;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
};

export const colors = {
  blue: 'rgb(0,127,255)',
  red: 'rgb(255,50,50)',
  green: 'rgb(0,255,127)',
  light_green: 'rgb(100,233,127)',
  yellow: 'rgb(255,255,0)',
  magenta: 'rgb(255,0,255)',
  white: 'rgb(255,255,255)',
  cyan: 'rgb(0,255,255)',
  light_blue: 'rgb(102,204,255)'
};