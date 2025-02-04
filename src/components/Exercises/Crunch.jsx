import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import {
  thresholdsCrunchBeginner,
  thresholdsCrunchPro,
} from "./utils/thresholds";
import {
  getLandmarkFeatures,
  colors,
  findAngle,
  drawText,
  drawCircle,
  drawConnector,
} from "./utils/crunchUtils";

function CrunchExercise() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [currentThresholds, setCurrentThresholds] = useState(
    thresholdsCrunchBeginner
  );

  const stateTrackerRef = useRef({
    state_seq: [],
    INACTIVE_TIME: 0.0,
    DISPLAY_TEXT: Array(3).fill(false),
    COUNT_FRAMES: Array(3).fill(0),
    CRUNCH_COUNT: 0,
    IMPROPER_CRUNCH: 0,
  });

  const getState = (shoulderAngle) => {
    let state = null;
    if (
      shoulderAngle >= currentThresholds.ANGLE_SHOULDER_HIP_VERT.NORMAL[0] &&
      shoulderAngle <= currentThresholds.ANGLE_SHOULDER_HIP_VERT.NORMAL[1]
    ) {
      state = "s1";
    } else if (
      shoulderAngle >= currentThresholds.ANGLE_SHOULDER_HIP_VERT.TRANS[0] &&
      shoulderAngle <= currentThresholds.ANGLE_SHOULDER_HIP_VERT.TRANS[1]
    ) {
      state = "s2";
    } else if (
      shoulderAngle >= currentThresholds.ANGLE_SHOULDER_HIP_VERT.PASS[0] &&
      shoulderAngle <= currentThresholds.ANGLE_SHOULDER_HIP_VERT.PASS[1]
    ) {
      state = "s3";
    }
    return state;
  };

  const onResults = useCallback(
    (results) => {
      if (webcamRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = webcamRef.current.video.videoWidth;
        canvas.height = webcamRef.current.video.videoHeight;

        ctx.drawImage(
          webcamRef.current.video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (results.poseLandmarks) {
          const leftFeatures = getLandmarkFeatures(
            results.poseLandmarks,
            "left",
            canvas.width,
            canvas.height
          );

          const shoulderAngle = findAngle(
            leftFeatures.hip,
            leftFeatures.shoulder,
            { x: leftFeatures.shoulder.x, y: 0 }
          );

          const hipDisplacement = Math.abs(
            leftFeatures.hip.y - leftFeatures.shoulder.y
          );

          if (hipDisplacement > currentThresholds.HIP_THRESH[1]) {
            stateTrackerRef.current.DISPLAY_TEXT[0] = true;
            stateTrackerRef.current.IMPROPER_CRUNCH++;
          }

          const neckAngle = findAngle(
            leftFeatures.shoulder,
            leftFeatures.head,
            leftFeatures.head
          );

          if (
            neckAngle < currentThresholds.NECK_THRESH[0] ||
            neckAngle > currentThresholds.NECK_THRESH[1]
          ) {
            stateTrackerRef.current.DISPLAY_TEXT[1] = true;
            stateTrackerRef.current.IMPROPER_CRUNCH++;
          }

          const currState = getState(shoulderAngle);

          if (currState === "s1") {
            stateTrackerRef.current.CRUNCH_COUNT++;
            stateTrackerRef.current.state_seq = [];
          } else {
            stateTrackerRef.current.state_seq.push(currState);
          }

          drawText(
            ctx,
            `Correct Crunches: ${stateTrackerRef.current.CRUNCH_COUNT}`,
            10,
            20,
            { textColor: colors.green }
          );

          drawText(
            ctx,
            `Incorrect Crunches: ${stateTrackerRef.current.IMPROPER_CRUNCH}`,
            10,
            50,
            { textColor: colors.red }
          );
        }
      }
    },
    [webcamRef, canvasRef, currentThresholds]
  );

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    let camera;
    if (webcamRef.current && webcamRef.current.video) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await pose.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    pose.onResults(onResults);

    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, [onResults]);

  const handleModeChange = (event) => {
    const isBeginner = event.target.value === "beginner";
    setIsBeginnerMode(isBeginner);
    setCurrentThresholds(
      isBeginner ? thresholdsCrunchBeginner : thresholdsCrunchPro
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <Webcam ref={webcamRef} style={{ display: "none" }} />
            <canvas ref={canvasRef} className="w-100 h-100" />
          </div>
          <div className="col-md-6">
            <select
              onChange={handleModeChange}
              value={isBeginnerMode ? "beginner" : "pro"}
            >
              <option value="beginner">Beginner Mode</option>
              <option value="pro">Pro Mode</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrunchExercise;
