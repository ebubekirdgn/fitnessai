import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from "react-webcam";
import { Pose } from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { useAuth } from '../../contexts/AuthContext';
import { sendResults } from "../../api";
import { toast } from "react-toastify"; // toast'ı ekleyin
import "react-toastify/dist/ReactToastify.css"; // toast css'i ekleyin
import {findAngle} from "./utils/helperUtils";
import { useNavigate } from 'react-router-dom';
function ShoulderPressExercise() {

 //webcam and canvas references
   const webcamRef = useRef(null);
   const canvasRef = useRef(null);
   const cameraRef = useRef(null);
   const poseRef = useRef(null);

   const { user } = useAuth();
   const navigate = useNavigate();

  // State for counting correct and incorrect raises
  const [correctRaiseCount, setCorrectRaiseCount] = useState(0);
  const [incorrectRaiseCount, setIncorrectRaiseCount] = useState(0);
  const [feedback, setFeedback] = useState(""); // State for feedback messages
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Ref to track the current arm lift status
  const isArmLiftedRef = useRef(false);

  // Threshold values for angle detection
  const thresholds = {
    SHOULDER_RAISE: [85, 95], // Ideal shoulder raise angle range
    SHOULDER_TOO_LOW: 70, // Minimum angle for a correct raise
    SHOULDER_TOO_HIGH: 100, // Maximum angle for a correct raise
  };

   const sendResultsToBackend = async () => {
      const userId = user?.id; // Aktif kullanıcı ID'sini alın
      const exerciseId = 4; // Shoulder Press veritabanındaki ID'si
      const createdDate = new Date().toISOString(); // Oluşturulma tarihi
  
      try {
        const response = await sendResults({
          userId,
          exerciseId,
          correct: correctRaiseCount,
          incorrect: incorrectRaiseCount,
          createdDate,
        });
        toast.success(`Kayıt işlemi başarıyla tamamlandı! ${response}`);
      } catch (error) {
        toast.error(`Sonuçlar gönderilirken bir hata oluştu: ${error.message}`);
      }
    };

    const resetExercise = () => {
      if (correctRaiseCount !== 0 || incorrectRaiseCount !== 0) {
        sendResultsToBackend();
      }
  
      setCorrectRaiseCount(0);
      setIncorrectRaiseCount(0);
      // Close the pose instance and stop the camera
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
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
      navigate('/profile');
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
  // Pose detection and feedback function
  const onResults = useCallback((results) => {
    if (webcamRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      canvas.width = webcamRef.current.video.videoWidth;
      canvas.height = webcamRef.current.video.videoHeight;

      // Draw the webcam image on the canvas
      ctx.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;

        // Function to draw a circle at a landmark point
        const drawLandmark = (x, y, color) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        };

        // Function to draw text at a landmark point
        const drawText = (x, y, text) => {
          ctx.fillStyle = "white";
          ctx.font = "16px Arial";
          ctx.fillText(text, x, y);
        };

        // Draw landmarks and calculate angles for both arms
        const leftShoulder = { x: landmarks[11].x * canvas.width, y: landmarks[11].y * canvas.height };
        const leftElbow = { x: landmarks[13].x * canvas.width, y: landmarks[13].y * canvas.height };
        const rightShoulder = { x: landmarks[12].x * canvas.width, y: landmarks[12].y * canvas.height };
        const rightElbow = { x: landmarks[14].x * canvas.width, y: landmarks[14].y * canvas.height };

        // Draw landmarks for left and right arms
        drawLandmark(leftShoulder.x, leftShoulder.y, "yellow");
        drawLandmark(leftElbow.x, leftElbow.y, "red");
        drawLandmark(rightShoulder.x, rightShoulder.y, "yellow");
        drawLandmark(rightElbow.x, rightElbow.y, "red");

        // Function to calculate angle between three points
        

        // Calculate angles for both arms
        const leftShoulderAngle = findAngle({ x: leftShoulder.x, y: 1 }, leftShoulder, leftElbow);
        const rightShoulderAngle = findAngle({ x: rightShoulder.x, y: 1 }, rightShoulder, rightElbow);

        // Draw the angles as text on the canvas near the elbows
        drawText(leftElbow.x + 10, leftElbow.y, `${Math.round(leftShoulderAngle)}°`);
        drawText(rightElbow.x + 10, rightElbow.y, `${Math.round(rightShoulderAngle)}°`);

        let correctLift = false;

        // Check if both arms are in the correct angle range
        if (
          leftShoulderAngle >= thresholds.SHOULDER_RAISE[0] &&
          leftShoulderAngle <= thresholds.SHOULDER_RAISE[1] &&
          rightShoulderAngle >= thresholds.SHOULDER_RAISE[0] &&
          rightShoulderAngle <= thresholds.SHOULDER_RAISE[1]
        ) {
          correctLift = true;
          setFeedback("Harika! Kollarını doğru şekilde kaldırdın.");
        } else {
          setFeedback("Kollarını doğru pozisyonda tutmaya çalış.");
        }

        // Detect when the arms are lifted and then lowered
        if (correctLift && !isArmLiftedRef.current) {
          // Arms were just lifted
          isArmLiftedRef.current = true;
        } else if (!correctLift && isArmLiftedRef.current) {
          // Arms were lowered, count the lift
          if (
            (leftShoulderAngle < thresholds.SHOULDER_TOO_LOW) ||
            (rightShoulderAngle < thresholds.SHOULDER_TOO_LOW) ||
            (leftShoulderAngle > thresholds.SHOULDER_TOO_HIGH) ||
            (rightShoulderAngle > thresholds.SHOULDER_TOO_HIGH)
          ) {
            setIncorrectRaiseCount(prevCount => prevCount + 1);
          } else {
            setCorrectRaiseCount(prevCount => prevCount + 1);
          }
          isArmLiftedRef.current = false;
        }
      }
    }
  }, []);




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
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
          const tracks = webcamRef.current.video.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          webcamRef.current.video.srcObject = null;
        }
      };
    }, [onResults]);

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
                      <td>{correctRaiseCount}</td>
                    </tr>
                    <tr>
                      <td>Incorrect</td>
                      <td>{incorrectRaiseCount}</td>
                    </tr>
                    <tr>
                      <td>Feedback</td>
                      <td>{feedback}</td>
                    </tr>
                  </tbody>
                </table>
                <button className="btn btn-success mt-3" onClick={startExercise}>Start Sport</button>
                <button className="btn btn-danger mt-3 ms-2" onClick={resetExercise}>Finish Sport</button>
             </div>
            </div>
          </div>
        </div>
      </>
    );
}

export default ShoulderPressExercise;