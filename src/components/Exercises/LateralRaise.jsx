import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import {thresholdsLateralRaiseBeginner,thresholdsLateralRaisePro,} from "./utils/thresholds";
import {getLandmarkFeatures,colors,findAngle,drawText,drawCircle,drawConnector,drawDottedLine,} from "./utils/helperUtils";

function LateralRaiseExercise() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const flipFrameRef = useRef(false);

  const [currentThresholds, setCurrentThresholds] = useState(thresholdsLateralRaiseBeginner);

  const stateTrackerRef = useRef({
    state_seq: [],
    start_inactive_time: Date.now(),
    start_inactive_time_front: Date.now(),
    INACTIVE_TIME: 0,
    INACTIVE_TIME_FRONT: 0.0,
    DISPLAY_TEXT: Array(5).fill(false),
    COUNT_FRAMES: Array(5).fill(0),
    INCORRECT_POSTURE: false,
    prev_state: null,
    curr_state: null,
    LATERAL_RAISE_COUNT: 0,
    IMPROPER_RAISE: 0,
  });

  const FEEDBACK_ID_MAP = {
    0: { text: "STRAIGHTEN YOUR ELBOWS", position: 100, color: "rgb(255,80,80)" },
    1: { text: "LOWER YOUR ARMS", position: 130, color: "rgb(255,80,80)" },
    2: { text: "RAISE YOUR ARMS HIGHER", position: 160, color: "rgb(255,80,80)" },
    3: { text: "KEEP YOUR ARMS PARALLEL", position: 190, color: "rgb(255,80,80)" },
    4: { text: "CAMERA NOT ALIGNED PROPERLY!", position: 50, color: "rgb(255,153,0)" },
  };

  const getState = (shoulderBodyAngle) => {
    if (shoulderBodyAngle >= currentThresholds.ANGLE_SHOULDER.NORMAL[0] && shoulderBodyAngle <= currentThresholds.ANGLE_SHOULDER.NORMAL[1]) {
      return "s1";
    } else if (shoulderBodyAngle >= currentThresholds.ANGLE_SHOULDER.TRANS[0] && shoulderBodyAngle <= currentThresholds.ANGLE_SHOULDER.TRANS[1]) {
      return "s2";
    } else if (shoulderBodyAngle >= currentThresholds.ANGLE_SHOULDER.PASS[0] && shoulderBodyAngle <= currentThresholds.ANGLE_SHOULDER.PASS[1]) {
      return "s3";
    } 
    return null;
  };

  const updateStateSequence = (newState) => {
    let updatedStateSeq = [...stateTrackerRef.current.state_seq];

    if (newState === "s2") {
      if ((!updatedStateSeq.includes("s3") &&  updatedStateSeq.filter((state) => state === "s2").length === 0) || (updatedStateSeq.includes("s3") && updatedStateSeq.filter((state) => state === "s2").length === 1)) {
        updatedStateSeq.push(newState);
      }
    } else if (newState === "s3") {
      if (!updatedStateSeq.includes("s3") && updatedStateSeq.includes("s2")) {
        updatedStateSeq.push(newState);
      }
    }

    stateTrackerRef.current.state_seq = updatedStateSeq;
  };

  // This function now doesn't require parameters for stateTracker and FEEDBACK_ID_MAP
    const showFeedback = (ctx) => {
      // Access the current state using stateTrackerRef.current
      const stateTracker = stateTrackerRef.current;

      // Iterate over DISPLAY_TEXT to show feedback messages
      stateTracker.DISPLAY_TEXT.forEach((displayText, index) => {
        if (displayText) {
          const feedback = FEEDBACK_ID_MAP[index];
          if (feedback) {
            drawText(ctx, feedback.text, 30, feedback.position, {
              textColor: feedback.textColor || "black",
              backgroundColor: feedback.backgroundColor || "yellow",
              fontSize: "16px",
            });
          }
        }
      });

      // Display a general incorrect posture message if applicable
      if (stateTracker.INCORRECT_POSTURE) {
        drawText(ctx, "CORRECT YOUR POSTURE", 30, 300, {
          textColor: "white",
          backgroundColor: "red",
          fontSize: "16px",
        });
      }
    };
  

  const onResults = useCallback(
    (results) => {
      if (webcamRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = webcamRef.current.video.videoWidth;
        canvas.height = webcamRef.current.video.videoHeight;

        const frameWidth = canvas.width;
        const frameHeight = canvas.height;

        ctx.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);

        let displayInactivity = false;
        let endTime = Date.now();

        if (results.poseLandmarks) {
          // Calculate coordinates for each key landmark
          const noseCoord = getLandmarkFeatures(results.poseLandmarks,"nose",frameWidth,frameHeight);
          const leftFeatures = getLandmarkFeatures(results.poseLandmarks,"left",canvas.width,canvas.height);
          const rightFeatures = getLandmarkFeatures(results.poseLandmarks,"right",canvas.width,canvas.height);

          const offsetAngle = findAngle(leftFeatures.shoulder,rightFeatures.shoulder,noseCoord); //Kullanıcının omuz hizasının doğru olduğunu kontrol eder.
          

          if (offsetAngle > currentThresholds.OFFSET_THRESH) {
            displayInactivity = false;
            endTime = Date.now(); // Equivalent to time.perf_counter()
            stateTrackerRef.current.INACTIVE_TIME_FRONT += endTime - stateTrackerRef.current.start_inactive_time_front;
            stateTrackerRef.current.start_inactive_time_front = endTime;

            if (stateTrackerRef.current.INACTIVE_TIME_FRONT >= currentThresholds.INACTIVE_THRESH) {
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

              drawText(ctx,`CORRECT: ${stateTrackerRef.current.LATERAL_RAISE_COUNT}`,frameWidth * 0.68,30,{
                  textColor: "rgb(255, 255, 230)",
                  backgroundColor: "rgb(18, 185, 0)",
                  fontSize: "14px", // Adjusted for typical browser scaling; you may need to tweak this
                }
              );
              drawText(ctx,`INCORRECT: ${stateTrackerRef.current.IMPROPER_RAISE}`,frameWidth * 0.68,80,{
                  textColor: "rgb(255, 255, 230)",
                  backgroundColor: "rgb(221, 0, 0)",
                  fontSize: "14px",
                }
              );
              drawText(ctx,"CAMERA NOT ALIGNED PROPERLY!!!",30,frameHeight - 60,{
                  textColor: "rgb(255, 255, 230)",
                  backgroundColor: "rgb(255, 153, 0)",
                  fontSize: "14px",
                }
              );
              drawText(ctx,`OFFSET ANGLE: ${offsetAngle.toFixed(2)}`,30,frameHeight - 30,{
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
          }
          else{// Kamera hizası doğru ise yapılacaklar
            stateTrackerRef.current.INACTIVE_TIME_FRONT = 0;
            stateTrackerRef.current.start_inactive_time_front = Date.now();

             // Kullanıcının analiz edilecek tarafını (sol veya sağ) belirlemek
             const distLShHip = Math.abs(leftFeatures.foot.y - leftFeatures.shoulder.y);
             const distRShHip = Math.abs(rightFeatures.foot.y - rightFeatures.shoulder.y);

             let selectedSideFeatures = null;
             let multiplier = 0;

             if (distLShHip > distRShHip) {
              selectedSideFeatures = leftFeatures;
              multiplier = -1;
             } else {
              selectedSideFeatures = rightFeatures;
              multiplier = 1;
             }

             // Omuz dikey açısını hesaplamak
            const shoulder_vertical_angle = findAngle(selectedSideFeatures.hip,{ x: selectedSideFeatures.shoulder.x, y: 0 },selectedSideFeatures.shoulder);
            drawCircle(ctx, selectedSideFeatures.shoulder, 15, colors.white); // Omuz noktasını beyaz bir daire ile işaretler
            let verticalStart = { x: selectedSideFeatures.shoulder.x, y: selectedSideFeatures.shoulder.y - 80 };
            let verticalEnd = { x: selectedSideFeatures.shoulder.x, y: selectedSideFeatures.shoulder.y + 20 };
            drawDottedLine(ctx, verticalStart, verticalEnd, colors.blue); // Omuz hizasını göstermek için mavi kesikli bir çizgi çizer
            
            // Dirsek dikey açısını hesaplamak
            const elbow_vertical_angle = findAngle(selectedSideFeatures.shoulder,{ x: selectedSideFeatures.elbow.x, y: 0 },selectedSideFeatures.elbow);
            drawCircle(ctx, selectedSideFeatures.elbow, 10, colors.white); // Dirsek noktasını beyaz bir daire ile işaretler
            verticalStart = { x: selectedSideFeatures.elbow.x, y: selectedSideFeatures.elbow.y - 50 };
            verticalEnd = { x: selectedSideFeatures.elbow.x, y: selectedSideFeatures.elbow.y + 20 };
            drawDottedLine(ctx, verticalStart, verticalEnd, colors.blue); // Dirsek hizasını göstermek için mavi kesikli bir çizgi çizer

            // Bilek dikey açısını hesaplamak
            const wrist_vertical_angle = findAngle(selectedSideFeatures.elbow,{ x: selectedSideFeatures.wrist.x, y: 0 },selectedSideFeatures.wrist);
            drawCircle(ctx, selectedSideFeatures.wrist, 15, colors.white); // Bilek noktasını beyaz bir daire ile işaretler
            verticalStart = { x: selectedSideFeatures.wrist.x, y: selectedSideFeatures.wrist.y - 50 };
            verticalEnd = { x: selectedSideFeatures.wrist.x, y: selectedSideFeatures.wrist.y + 20 };
            drawDottedLine(ctx, verticalStart, verticalEnd, colors.blue); // Bilek hizasını göstermek için mavi kesikli bir çizgi çizer


            // Landmarkları birleştirme
            drawConnector(ctx, selectedSideFeatures.shoulder, selectedSideFeatures.elbow, colors.light_blue, 4);
            drawConnector(ctx, selectedSideFeatures.elbow, selectedSideFeatures.wrist, colors.light_blue, 4);

            // Kritik landmarkları işaretleme
            drawCircle(ctx, selectedSideFeatures.shoulder, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.elbow, 7, colors.yellow);
            drawCircle(ctx, selectedSideFeatures.wrist, 7, colors.yellow);

            const currState = getState(elbow_vertical_angle);
            stateTrackerRef.current.curr_state = currState;
            updateStateSequence(currState);

            const { state_seq, INCORRECT_POSTURE } = stateTrackerRef.current;

            if (currState === "s1") {
              if (state_seq.length === 3 && !INCORRECT_POSTURE) {
                stateTrackerRef.current.TRICEPS_COUNT += 1;
              } else if (state_seq.includes("s2") && state_seq.length === 1) {
                stateTrackerRef.current.INCORRECT_TRICEPS += 1;
              } else if (INCORRECT_POSTURE) {
                stateTrackerRef.current.INCORRECT_TRICEPS += 1;
              }

              stateTrackerRef.current.state_seq = [];
              stateTrackerRef.current.INCORRECT_POSTURE = false;
            } else {
              const stateTracker = stateTrackerRef.current;
              // Dirsek açısını kontrol et
              if (elbow_vertical_angle > currentThresholds.ANGLE_SHOULDER.PASS[1]) {
                stateTracker.DISPLAY_TEXT[0] = true; // "FULLY EXTEND YOUR ARMS" geri bildirimi
              } else if (
                elbow_vertical_angle < currentThresholds.ANGLE_SHOULDER.NORMAL[0] && stateTracker.state_seq.filter((e) => e === "s2").length === 1) {
                stateTracker.DISPLAY_TEXT[1] = true; // "RETURN TO START POSITION" geri bildirimi
              }

              // Omuz hizasını kontrol et
              if (
                Math.abs(selectedSideFeatures.shoulder.x - selectedSideFeatures.elbow.x) >
                currentThresholds.OFFSET_THRESH
              ) {
                stateTracker.DISPLAY_TEXT[2] = true; // "KEEP ELBOWS CLOSE TO HEAD" geri bildirimi
                stateTracker.INCORRECT_POSTURE = true;
              }

              // Kolların doğru hizalanmasını kontrol et
              if (
                Math.abs(selectedSideFeatures.wrist.y - selectedSideFeatures.elbow.y) <
                currentThresholds.WRIST_THRESH
              ) {
                stateTracker.DISPLAY_TEXT[3] = true; // "DO NOT FLARE ELBOWS" geri bildirimi
                stateTracker.INCORRECT_POSTURE = true;
              }
            }
            // --------------------- COMPUTE INACTIVITY TIME ------------------------------------------------------
            
            displayInactivity = false;

            if (stateTrackerRef.current.curr_state ===stateTrackerRef.current.prev_state) {
              endTime = Date.now();
              stateTrackerRef.current.INACTIVE_TIME +=endTime - stateTrackerRef.current.start_inactive_time;
              stateTrackerRef.current.start_inactive_time = endTime;

              if (stateTrackerRef.INACTIVE_TIME >= currentThresholds.INACTIVE_THRESH) {
                displayInactivity = true;
              }
            } 
            else {
              stateTrackerRef.current.start_inactive_time = Date.now();
              stateTrackerRef.current.INACTIVE_TIME = 0;
            }

             // Geri bildirim metin koordinatlarını belirle
             const shoulderTextCoordX = flipFrameRef.current ? frameWidth - selectedSideFeatures.shoulder.x + 10 : selectedSideFeatures.shoulder.x + 10;
             const elbowTextCoordX = flipFrameRef.current ? frameWidth - selectedSideFeatures.elbow.x + 15 : selectedSideFeatures.elbow.x + 15;
             const wristTextCoordX = flipFrameRef.current ? frameWidth - selectedSideFeatures.wrist.x + 10 : selectedSideFeatures.wrist.x + 10;
            

             if (stateTrackerRef.current.state_seq.includes("s3") || currState === "s1") {
              stateTrackerRef.current.INCORRECT_POSTURE = false; // Yanlış postür bayrağını sıfırla
            }

            // Geri bildirim gösterim sayacını artır
            stateTrackerRef.current.DISPLAY_TEXT.forEach((displayText, index) => {
              if (displayText) {
                stateTrackerRef.current.COUNT_FRAMES[index] += 1; // İlgili geri bildirim için kare sayısını artır
              }
            });

            // Geri bildirimleri göster
            showFeedback(ctx);

            if (displayInactivity) {
              stateTrackerRef.current.start_inactive_time = Date.now();
              stateTrackerRef.current.INACTIVE_TIME = 0;
            }

            // Dirsek açısını çiz
            drawText(ctx,` ${elbow_vertical_angle.toFixed(2)}`,elbowTextCoordX,selectedSideFeatures.elbow.y + 10,{
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            // Omuz açısını çiz
            drawText(ctx,`${shoulder_vertical_angle.toFixed(2)}`,shoulderTextCoordX,selectedSideFeatures.shoulder.y + 10,{
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            // Bilek açısını çiz
            drawText(ctx,`${wrist_vertical_angle.toFixed(2)}`,wristTextCoordX,selectedSideFeatures.wrist.y + 10,{
                textColor: colors.light_green,
                fontSize: "16px",
              }
            );

            // Doğru Triceps Extension Sayısını Göster
            drawText(ctx,`CORRECT: ${stateTrackerRef.current.LATERAL_RAISE_COUNT}`,frameWidth * 0.68,30,{
                textColor: "rgb(255, 255, 230)",
                backgroundColor: "rgb(18, 185, 0)",
                fontSize: "14px",
              }
            );

            // Yanlış Triceps Extension Sayısını Göster
            drawText(ctx,`INCORRECT: ${stateTrackerRef.current.IMPROPER_RAISE}`,frameWidth * 0.68,80,{
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

            stateTrackerRef.current.prev_state = currState;
          }
           
        }
        else{
          if (flipFrameRef.current) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(webcamRef.current.video,0,0,canvas.width,canvas.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to default after flipping
          }

          const endTime = Date.now();
          stateTrackerRef.current.INACTIVE_TIME += endTime - stateTrackerRef.current.start_inactive_time;

          let displayInactivity = false;

          if (stateTrackerRef.current.INACTIVE_TIME >=currentThresholds.INACTIVE_THRESH) {
            displayInactivity = true;
          }

          stateTrackerRef.current.start_inactive_time = endTime;

          drawText(ctx,`CORRECT: ${stateTrackerRef.current.LATERAL_RAISE_COUNT}`,frameWidth * 0.68,30,{
            textColor: "rgb(255, 255, 230)",
            backgroundColor: "rgb(18, 185, 0)",
            fontSize: "14px",
            }
          );

          drawText(ctx,`INCORRECT: ${stateTrackerRef.current.IMPROPER_RAISE}`,frameWidth * 0.68,80,{
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
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
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

    const startCamera = () => {
      if (webcamRef.current && webcamRef.current.video) {
        camera = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current && webcamRef.current.video) {
              // Additional check to prevent accessing video of null
              await pose.send({ image: webcamRef.current.video });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    };
    

    pose.onResults(onResults);
    startCamera();

    return () => {
      if (camera) {
        camera.stop();
      }
      if (webcamRef.current &&webcamRef.current.video && webcamRef.current.video.srcObject) {
        const tracks = webcamRef.current.video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      pose.close();
    };
  }, [onResults]); // Notice how we use the onResults function within the dependencies list.

   // Function to handle mode change
    const handleModeChange = (event) => {
      const isBeginner = event.target.value === "beginner";
      setIsBeginnerMode(isBeginner);
      const newThresholds = isBeginner ? thresholdsLateralRaiseBeginner : thresholdsLateralRaisePro;
      setCurrentThresholds(newThresholds);
      console.log("Current Thresholds:", newThresholds);
    };

 return (
     <>
     <div className="card">
       <div className="card-body">
         {/* İlk satır: Video ve Bilgilendirme Alanı */}
         <div className="row">
           <div className="col-md-6 col-sm-12 text-center mb-3">
             <p>Video Alanı</p>
           </div>
           <div className="col-md-6 col-sm-12 text-center mb-3">
             <p>Bilgilendirme Alanı</p>
           </div>
         </div>
 
         {/* İkinci satır: Webcam ve Seçim Alanı */}
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
                    <td>{stateTrackerRef.current.LATERAL_RAISE_COUNT}</td>
                  </tr>
                  <tr>
                    <td>Incorrect</td>
                    <td>{stateTrackerRef.current.IMPROPER_RAISE}</td>
                  </tr>
                </tbody>
              </table>
           </div>
         </div>
       </div>
     </div>
   </>
   );
}

export default LateralRaiseExercise;