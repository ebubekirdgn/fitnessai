import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import {
  thresholdsSquatBeginner,
  thresholdsSquatPro,
} from "./utils/thresholds";
import {
  getLandmarkFeatures,
  colors,
  findAngle,
  drawText,
  drawCircle,
  drawConnector,
  drawDottedLine,
} from "./utils/helperUtils";
import { useAuth } from "../../contexts/AuthContext";
import { sendResults } from "../../api";
import { toast } from "react-toastify"; // toast'ı ekleyin
import "react-toastify/dist/ReactToastify.css"; // toast css'i ekleyin

function SquatExercise() {
  //webcam and canvas references
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);

  const { user } = useAuth();

  // Mode: beginner or pro
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const flipFrameRef = useRef(false);
  const [currentThresholds, setCurrentThresholds] = useState(
    thresholdsSquatBeginner
  );

  // State tracker for the pose analysis
  const stateTrackerRef = useRef({
    state_seq: [],
    start_inactive_time: Date.now(),
    start_inactive_time_front: Date.now(),
    INACTIVE_TIME: 0.0,
    INACTIVE_TIME_FRONT: 0.0,
    DISPLAY_TEXT: Array(4).fill(false),
    COUNT_FRAMES: Array(4).fill(0),
    LOWER_HIPS: false,
    INCORRECT_POSTURE: false,
    prev_state: null,
    curr_state: null,
    SQUAT_COUNT: 0,
    IMPROPER_SQUAT: 0,
  });

  const handleModeChange = (event) => {
    const isBeginner = event.target.value === "beginner";
    setIsBeginnerMode(isBeginner);
    const newThresholds = isBeginner
      ? thresholdsSquatBeginner
      : thresholdsSquatPro;
    setCurrentThresholds(newThresholds);
    console.log("Current Thresholds:", newThresholds);
  };

  const sendResultsToBackend = async () => {
    const userId = user?.id; // Aktif kullanıcı ID'sini alın
    const exerciseId = 3; // Triceps Extension'ın veritabanındaki ID'si
    const createdDate = new Date().toISOString(); // Oluşturulma tarihi

    try {
      const response = await sendResults({
        userId,
        exerciseId,
        correct: correctCount,
        incorrect: incorrectCount,
        createdDate,
      });
      toast.success(`Kayıt işlemi başarıyla tamamlandı! ${response}`);
    } catch (error) {
      toast.error(`Sonuçlar gönderilirken bir hata oluştu: ${error.message}`);
    }
  };

  const FEEDBACK_ID_MAP = {
    0: { text: "BEND BACKWARDS", position: 215, color: "rgb(0,153,255)" },
    1: { text: "BEND FORWARD", position: 215, color: "rgb(0,153,255)" },
    2: {
      text: "KNEE FALLING OVER TOE",
      position: 170,
      color: "rgb(255,80,80)",
    },
    3: { text: "SQUAT TOO DEEP", position: 125, color: "rgb(255,80,80)" },
  };

  const resetExercise = () => {
    if (correctCount !== 0 || incorrectCount !== 0) {
      sendResultsToBackend();
    }

    setCorrectCount(0);
    setIncorrectCount(0);
    stateTrackerRef.current.LATERAL_RAISE_COUNT = 0;
    stateTrackerRef.current.IMPROPER_RAISE = 0;
    // Reset other state variables if needed

    // Close the pose instance and stop the camera
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.srcObject
    ) {
      const tracks = webcamRef.current.video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      webcamRef.current.video.srcObject = null;
    }
    setIsCameraActive(false);

    // Clear the canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startExercise = () => {
    setIsCameraActive(true);
    startCamera();
  };

  const startCamera = () => {
    if (webcamRef.current && webcamRef.current.video) {
      cameraRef.current = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video && poseRef.current) {
            await poseRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start();
    }
  };

  // Function to get the state of the knee
  const getState = (kneeAngle) => {
    let state = null;
    if (
      kneeAngle >= currentThresholds.ANGLE_HIP_KNEE_VERT.NORMAL[0] &&
      kneeAngle <= currentThresholds.ANGLE_HIP_KNEE_VERT.NORMAL[1]
    ) {
      state = "s1";
    } else if (
      kneeAngle >= currentThresholds.ANGLE_HIP_KNEE_VERT.TRANS[0] &&
      kneeAngle <= currentThresholds.ANGLE_HIP_KNEE_VERT.TRANS[1]
    ) {
      state = "s2";
    } else if (
      kneeAngle >= currentThresholds.ANGLE_HIP_KNEE_VERT.PASS[0] &&
      kneeAngle <= currentThresholds.ANGLE_HIP_KNEE_VERT.PASS[1]
    ) {
      state = "s3";
    }
    return state;
  };

  // Update the state sequence based on the new state
  /*
    Bu kod, kullanıcının squat hareketini yaparken diz açısına göre hareketin hangi durumda olduğunu belirler ve sırasıyla bu durumları (state_seq dizisi) takip eder. 
    Fonksiyon, squat hareketinin doğru bir sırada ilerleyip ilerlemediğini analiz etmek için kullanılır.
  */
  const updateStateSequence = (newState) => {
    let updatedStateSeq = [...stateTrackerRef.current.state_seq];

    if (newState === "s2") {
      if (
        (!updatedStateSeq.includes("s3") &&
          updatedStateSeq.filter((state) => state === "s2").length === 0) ||
        (updatedStateSeq.includes("s3") &&
          updatedStateSeq.filter((state) => state === "s2").length === 1)
      ) {
        updatedStateSeq.push(newState);
      }
    } else if (newState === "s3") {
      if (!updatedStateSeq.includes("s3") && updatedStateSeq.includes("s2")) {
        updatedStateSeq.push(newState);
      }
    }

    stateTrackerRef.current.state_seq = updatedStateSeq;
  };

  // Show feedback based on the current state
  // This function now doesn't require parameters for stateTracker and FEEDBACK_ID_MAP
  const showFeedback = (ctx) => {
    // Access the current state using stateTrackerRef.current
    const stateTracker = stateTrackerRef.current;

    if (stateTracker.LOWER_HIPS) {
      drawText(ctx, "LOWER YOUR HIPS", 30, 80, {
        textColor: "black",
        backgroundColor: "yellow",
        fontSize: "16px",
      });
    }

    // Iterate over DISPLAY_TEXT to show feedback messages
    stateTracker.DISPLAY_TEXT.forEach((displayText, index) => {
      if (displayText) {
        const feedback = FEEDBACK_ID_MAP[index];
        if (feedback) {
          drawText(ctx, feedback.text, 30, feedback.position, {
            textColor: "black",
            backgroundColor: "yellow",
            fontSize: "16px",
          });
        }
      }
    });
  };

  // OnResults function to process the pose detection results
  const onResults = useCallback(
    (results) => {
      if (webcamRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = webcamRef.current.video.videoWidth;
        canvas.height = webcamRef.current.video.videoHeight;

        const frameWidth = canvas.width;
        const frameHeight = canvas.height;

        ctx.drawImage(
          webcamRef.current.video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        let displayInactivity = false;
        let endTime = Date.now();

        if (results.poseLandmarks) {
          // Calculate coordinates for each key landmark
          const noseCoord = getLandmarkFeatures(
            results.poseLandmarks,
            "nose",
            frameWidth,
            frameHeight
          );
          const leftFeatures = getLandmarkFeatures(
            results.poseLandmarks,
            "left",
            frameWidth,
            frameHeight
          );
          const rightFeatures = getLandmarkFeatures(
            results.poseLandmarks,
            "right",
            frameWidth,
            frameHeight
          );

          const offsetAngle = findAngle(
            leftFeatures.shoulder,
            rightFeatures.shoulder,
            noseCoord
          ); //Kullanıcının omuz hizasının doğru olduğunu kontrol eder.

          if (offsetAngle > currentThresholds.OFFSET_THRESH) {
            // Kamera hizası doğru değil ise
            displayInactivity = false; //(hareketsiz veya yanlış pozisyonda)

            endTime = Date.now(); // Equivalent to time.perf_counter()
            stateTrackerRef.current.INACTIVE_TIME_FRONT +=
              endTime - stateTrackerRef.current.start_inactive_time_front;
            stateTrackerRef.current.start_inactive_time_front = endTime;

            if (
              stateTrackerRef.current.INACTIVE_TIME_FRONT >=
              currentThresholds.INACTIVE_THRESH
            ) {
              displayInactivity = true; //Kullanıcı uzun süre inaktif veya yanlış pozisyonda.
            }

            // Burun, sol ve sağ omuz noktaları, belirgin renklerle çizilir.
            drawCircle(ctx, noseCoord, 7, colors.white);
            drawCircle(ctx, leftFeatures.shoulder, 7, colors.yellow);
            drawCircle(ctx, rightFeatures.shoulder, 7, colors.magenta);

            // Bu kod parçası, kullanıcının kamera görüntüsünü gerektiğinde yatay olarak ters çevirmek (flip) için kullanılır.
            if (flipFrameRef.current) {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.translate(-canvas.width, 0); // Translate back after flipping
            }

            if (displayInactivity) {
              // Bu kod, kullanıcı inaktif (hareketsiz veya yanlış pozisyonda) olarak algılandığında sayaçları ve zamanlayıcıyı sıfırlamak için kullanılır.
              stateTrackerRef.current.INACTIVE_TIME_FRONT = 0;
              stateTrackerRef.current.start_inactive_time_front = Date.now();
            }

            drawText(
              ctx,
              `CORRECT: ${stateTrackerRef.current.SQUAT_COUNT}`,
              frameWidth * 0.68,
              30,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(18, 185, 0)",
                fontSize: "14px", // Adjusted for typical browser scaling; you may need to tweak this
              }
            );
            drawText(
              ctx,
              `INCORRECT: ${stateTrackerRef.current.IMPROPER_SQUAT}`,
              frameWidth * 0.68,
              80,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(221, 0, 0)",
                fontSize: "14px",
              }
            );
            drawText(
              ctx,
              "CAMERA NOT ALIGNED PROPERLY!!!",
              30,
              frameHeight - 60,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(255, 153, 0)",
                fontSize: "14px",
              }
            );
            drawText(
              ctx,
              `OFFSET ANGLE: ${offsetAngle.toFixed(2)}`,
              30,
              frameHeight - 30,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(255, 153, 0)",
                fontSize: "14px",
              }
            );

            // Reset inactive times for side view
            stateTrackerRef.current.start_inactive_time = Date.now();
            stateTrackerRef.current.INACTIVE_TIME = 0;
            stateTrackerRef.current.prev_state = null;
            stateTrackerRef.current.curr_state = null;
          } else {
            // Kamera hizası doğru ise yapılacaklar
            stateTrackerRef.current.INACTIVE_TIME_FRONT = 0;
            stateTrackerRef.current.start_inactive_time_front = Date.now();

            //Kullanıcının analiz edilecek tarafını (sol veya sağ) belirlemek.
            const distLShHip = Math.abs(
              leftFeatures.foot.y - leftFeatures.shoulder.y
            );
            const distRShHip = Math.abs(
              rightFeatures.foot.y - rightFeatures.shoulder.y
            );

            let selectedSideFeatures = null;
            let multiplier = 0;

            if (distLShHip > distRShHip) {
              selectedSideFeatures = leftFeatures;
              multiplier = -1;
            } else {
              selectedSideFeatures = rightFeatures;
              multiplier = 1;
            }
            // -------------------- Vertical Angle calculation ----------------------------------------------

            // Kalça dikey açısını hesaplamak.
            const hip_vertical_angle = findAngle(
              selectedSideFeatures.shoulder,
              { x: selectedSideFeatures.hip.x, y: 0 },
              selectedSideFeatures.hip
            );
            drawCircle(ctx, selectedSideFeatures.hip, 15, colors.white); // Kalça noktasını (landmark) beyaz bir daire ile işaretler.
            let verticalStart = {
              x: selectedSideFeatures.hip.x,
              y: selectedSideFeatures.hip.y - 80,
            };
            let verticalEnd = {
              x: selectedSideFeatures.hip.x,
              y: selectedSideFeatures.hip.y + 20,
            };
            drawDottedLine(ctx, verticalStart, verticalEnd, colors.blue); //Kalça hizasını göstermek için mavi kesikli bir çizgi çizer.

            // Diz dikey açısını hesaplamak.
            const knee_vertical_angle = findAngle(
              selectedSideFeatures.hip,
              { x: selectedSideFeatures.knee.x, y: 0 },
              selectedSideFeatures.knee
            );
            drawCircle(ctx, selectedSideFeatures.knee, 10, colors.white); // Diz noktasını beyaz bir daire ile işaretler.
            verticalStart = {
              x: selectedSideFeatures.knee.x,
              y: selectedSideFeatures.knee.y - 50,
            };
            verticalEnd = {
              x: selectedSideFeatures.knee.x,
              y: selectedSideFeatures.knee.y + 20,
            };
            drawDottedLine(ctx, verticalStart, verticalEnd, colors.blue); //Diz hizasını göstermek için mavi kesikli bir çizgi çizer.

            // Ayak bileği dikey açısının hesaplanması.
            const ankle_vertical_angle = findAngle(
              selectedSideFeatures.knee,
              { x: selectedSideFeatures.ankle.x, y: 0 },
              selectedSideFeatures.ankle
            );
            drawCircle(ctx, selectedSideFeatures.ankle, 15, colors.white); // Ayak bileği noktasını beyaz bir daire ile işaretler.
            const ankleVerticalStart = {
              x: selectedSideFeatures.ankle.x,
              y: selectedSideFeatures.ankle.y - 50,
            };
            const ankleVerticalEnd = {
              x: selectedSideFeatures.ankle.x,
              y: selectedSideFeatures.ankle.y + 20,
            };
            drawDottedLine(
              ctx,
              ankleVerticalStart,
              ankleVerticalEnd,
              colors.blue
            ); //Ayak bileği hizasını göstermek için mavi kesikli bir çizgi çizer.

            // Join landmarks using selectedSideFeatures instead of leftFeatures.
            drawConnector(
              ctx,
              selectedSideFeatures.shoulder,
              selectedSideFeatures.elbow,
              colors.light_blue,
              4
            );
            drawConnector(
              ctx,
              selectedSideFeatures.wrist,
              selectedSideFeatures.elbow,
              colors.light_blue,
              4
            );
            drawConnector(
              ctx,
              selectedSideFeatures.shoulder,
              selectedSideFeatures.hip,
              colors.light_blue,
              4
            );
            drawConnector(
              ctx,
              selectedSideFeatures.knee,
              selectedSideFeatures.hip,
              colors.light_blue,
              4
            );
            drawConnector(
              ctx,
              selectedSideFeatures.ankle,
              selectedSideFeatures.knee,
              colors.light_blue,
              4
            );
            drawConnector(
              ctx,
              selectedSideFeatures.ankle,
              selectedSideFeatures.foot,
              colors.light_blue,
              4
            );

            drawCircle(ctx, selectedSideFeatures.shoulder, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.elbow, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.wrist, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.hip, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.knee, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.ankle, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.foot, 7, colors.yellow);

            const curr_state = getState(knee_vertical_angle);
            stateTrackerRef.current.curr_state = curr_state;
            updateStateSequence(curr_state);

            // ------------- COMPUTE COUNTERS ------------------
            const { state_seq, INCORRECT_POSTURE } = stateTrackerRef.current;

            if (curr_state === "s1") {
              if (state_seq.length === 3 && !INCORRECT_POSTURE) {
                stateTrackerRef.current.SQUAT_COUNT += 1;
                setCorrectCount(stateTrackerRef.current.SQUAT_COUNT);
              } else if (state_seq.includes("s2") && state_seq.length === 1) {
                stateTrackerRef.current.IMPROPER_SQUAT += 1;
                setIncorrectCount(stateTrackerRef.current.IMPROPER_SQUAT);
              } else if (INCORRECT_POSTURE) {
                stateTrackerRef.current.IMPROPER_SQUAT += 1;
                setIncorrectCount(stateTrackerRef.current.IMPROPER_SQUAT);
              }

              stateTrackerRef.current.state_seq = [];
              stateTrackerRef.current.INCORRECT_POSTURE = false;
            } else {
              // ------------ PERFORM FEEDBACK ACTIONS -------------
              const stateTracker = stateTrackerRef.current;

              if (hip_vertical_angle > currentThresholds.HIP_THRESH[1]) {
                stateTracker.DISPLAY_TEXT[0] = true;
              } else if (
                hip_vertical_angle < currentThresholds.HIP_THRESH[0] &&
                stateTracker.state_seq.filter((e) => e === "s2").length === 1
              ) {
                stateTracker.DISPLAY_TEXT[1] = true;
              }

              if (
                currentThresholds.KNEE_THRESH[0] < knee_vertical_angle &&
                knee_vertical_angle < currentThresholds.KNEE_THRESH[1] &&
                stateTracker.state_seq.filter((e) => e === "s2").length === 1
              ) {
                stateTracker.LOWER_HIPS = true;
              } else if (
                knee_vertical_angle > currentThresholds.KNEE_THRESH[2]
              ) {
                stateTracker.DISPLAY_TEXT[3] = true;
                stateTracker.INCORRECT_POSTURE = true;
              }

              if (ankle_vertical_angle > currentThresholds.ANKLE_THRESH) {
                stateTracker.DISPLAY_TEXT[2] = true;
                stateTracker.INCORRECT_POSTURE = true;
              }
            }

            // --------------------- COMPUTE INACTIVITY TIME ------------------------------------------------------
            displayInactivity = false;

            if (
              stateTrackerRef.current.curr_state ===
              stateTrackerRef.current.prev_state
            ) {
              endTime = Date.now();
              stateTrackerRef.current.INACTIVE_TIME +=
                endTime - stateTrackerRef.current.start_inactive_time;
              stateTrackerRef.current.start_inactive_time = endTime;

              if (
                stateTrackerRef.INACTIVE_TIME >=
                currentThresholds.INACTIVE_THRESH
              ) {
                displayInactivity = true;
              }
            } else {
              stateTrackerRef.current.start_inactive_time = Date.now();
              stateTrackerRef.current.INACTIVE_TIME = 0;
            }
            // ------------------------------------------------------------------------------------

            const hipTextCoordX = flipFrameRef.current
              ? frameWidth - selectedSideFeatures.hip.x + 10
              : selectedSideFeatures.hip.x + 10;
            const kneeTextCoordX = flipFrameRef.current
              ? frameWidth - selectedSideFeatures.knee.x + 15
              : selectedSideFeatures.knee.x + 15;
            const ankleTextCoordX = flipFrameRef.current
              ? frameWidth - selectedSideFeatures.ankle.x + 10
              : selectedSideFeatures.ankle.x + 10;

            if (
              stateTrackerRef.current.state_seq.includes("s3") ||
              curr_state === "s1"
            ) {
              stateTrackerRef.current.LOWER_HIPS = false;
            }

            stateTrackerRef.current.DISPLAY_TEXT.forEach(
              (displayText, index) => {
                if (displayText) {
                  stateTrackerRef.current.COUNT_FRAMES[index] += 1;
                }
              }
            );

            showFeedback(ctx);

            if (displayInactivity) {
              stateTrackerRef.current.start_inactive_time = Date.now();
              stateTrackerRef.current.INACTIVE_TIME = 0;
            }

            drawText(
              ctx,
              `Hip Angle: ${hip_vertical_angle.toFixed(2)}`,
              hipTextCoordX,
              selectedSideFeatures.hip[1],
              {
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            drawText(
              ctx,
              `Knee Angle: ${knee_vertical_angle.toFixed(2)}`,
              kneeTextCoordX,
              selectedSideFeatures.knee[1] + 10,
              {
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            drawText(
              ctx,
              `Ankle Angle: ${ankle_vertical_angle.toFixed(2)}`,
              ankleTextCoordX,
              selectedSideFeatures.ankle[1],
              {
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            // Displaying Correct Squats Count
            drawText(
              ctx,
              `CORRECT: ${stateTrackerRef.current.SQUAT_COUNT}`,
              frameWidth * 0.68,
              30,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(18, 185, 0)",
                fontSize: "14px",
              }
            );

            // Displaying Incorrect Squats Count
            drawText(
              ctx,
              `INCORRECT: ${stateTrackerRef.current.IMPROPER_SQUAT}`,
              frameWidth * 0.68,
              80,
              {
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(221, 0, 0)",
                fontSize: "14px",
              }
            );

            // Resetting Display Text and Count Frames
            stateTrackerRef.current.DISPLAY_TEXT.forEach((_, index) => {
              if (
                stateTrackerRef.current.COUNT_FRAMES[index] >
                currentThresholds.CNT_FRAME_THRESH
              ) {
                stateTrackerRef.current.DISPLAY_TEXT[index] = false;
                stateTrackerRef.current.COUNT_FRAMES[index] = 0;
              }
            });

            stateTrackerRef.current.prev_state = curr_state;
          }
        } else {
          if (flipFrameRef.current) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
              webcamRef.current.video,
              0,
              0,
              canvas.width,
              canvas.height
            );
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to default after flipping
          }

          const endTime = Date.now();
          stateTrackerRef.current.INACTIVE_TIME +=
            endTime - stateTrackerRef.current.start_inactive_time;

          let displayInactivity = false;

          if (
            stateTrackerRef.current.INACTIVE_TIME >=
            currentThresholds.INACTIVE_THRESH
          ) {
            displayInactivity = true;
          }

          stateTrackerRef.current.start_inactive_time = endTime;

          drawText(
            ctx,
            `CORRECT: ${stateTrackerRef.current.SQUAT_COUNT}`,
            frameWidth * 0.68,
            30,
            {
              textColor: "rgb(255, 255, 230)",
              backgroundColor: "rgb(18, 185, 0)",
              fontSize: "14px",
            }
          );

          drawText(
            ctx,
            `INCORRECT: ${stateTrackerRef.current.IMPROPER_SQUAT}`,
            frameWidth * 0.68,
            80,
            {
              textColor: "rgb(255, 255, 230)",
              backgroundColor: "rgb(221, 0, 0)",
              fontSize: "14px",
            }
          );

          if (displayInactivity) {
            stateTrackerRef.current.start_inactive_time = Date.now();
            stateTrackerRef.current.INACTIVE_TIME = 0;
          }

          // Reset all other state variables
          stateTrackerRef.current.prev_state = null;
          stateTrackerRef.current.curr_state = null;
          stateTrackerRef.current.INACTIVE_TIME_FRONT = 0;
          stateTrackerRef.current.INCORRECT_POSTURE = false;
          stateTrackerRef.current.DISPLAY_TEXT = Array(5).fill(false);
          // stateTrackerRef.current.COUNT_FRAMES = Array(5).fill(0);
          stateTrackerRef.current.start_inactive_time_front = Date.now();
        }
      }
    },
    [webcamRef, canvasRef]
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

    poseRef.current = pose;

    pose.onResults(onResults);

    return () => {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.srcObject
      ) {
        const tracks = webcamRef.current.video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        webcamRef.current.video.srcObject = null;
      }
    };
  }, [onResults]); // Notice how we use the onResults function within the dependencies list.

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 col-sm-12 text-center mb-3">
              <p>Video Alanı</p>
            </div>
            <div className="col-md-6 col-sm-12 text-center mb-3">
              <p>Bilgilendirme Alanı</p>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 col-sm-12 mb-3">
              <Webcam ref={webcamRef} style={{ display: "none" }} />
              <canvas
                ref={canvasRef}
                className="h-full w-full object-contain"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  position: "relative",
                  left: 0,
                  top: 0,
                }}
              />
            </div>

            <div className="col-md-6 col-sm-12">
              <select
                className="form-select"
                aria-label="Default select example"
                onChange={handleModeChange}
                value={isBeginnerMode ? "beginner" : "pro"}
              >
                <option className="dropdown-item" value="beginner">
                  Beginner Mode
                </option>
                <option className="dropdown-item" value="pro">
                  Pro Mode
                </option>
              </select>
              <table className="table mt-3">
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Correct</td>
                    <td>{correctCount}</td>
                  </tr>
                  <tr>
                    <td>Incorrect</td>
                    <td>{incorrectCount}</td>
                  </tr>
                </tbody>
              </table>
              <button className="btn btn-success mt-3" onClick={startExercise}>
                Start Sport
              </button>
              <button
                className="btn btn-danger mt-3 ms-2"
                onClick={resetExercise}
              >
                Finish Sport
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SquatExercise;
