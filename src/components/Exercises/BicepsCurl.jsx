import React, { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from "react-webcam";
import { Pose } from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { thresholdsBicepsCurl } from './utils/thresholds';
import {colors,findAngle} from "./utils/helperUtils";
import { useAuth } from '../../contexts/AuthContext';
import { sendResults } from "../../api";
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import { useNavigate } from 'react-router-dom';

function BicepsCurlExercise() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);

  const { user } = useAuth(); // Aktif kullanıcı bilgisi

  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const navigate = useNavigate();

  const [currentThresholds, setCurrentThresholds] = useState(thresholdsBicepsCurl);

  const stateTrackerRef = useRef({
    state_seq_left: [],
    state_seq_right: [],
    CURL_COUNT: 0,
    IMPROPER_CURL: 0,
    DISPLAY_TEXT: { left: null, right: null },
    has_completed_tour_left: false,
    has_completed_tour_right: false,
    has_started_left: false, // Hareketin başladığını izlemek için
    has_started_right: false,
    last_curl_left: null, // Son tam tur
    last_curl_right: null  // Son tam tur
  });


  const FEEDBACK_MESSAGES = {
    straighten: 'STRAIGHTEN YOUR ARM',
    bend_more: 'BEND YOUR ARM MORE',
    complete_curl: 'COMPLETE THE CURL'
  };

  const handleModeChange = (event) => {
    const isBeginner = event.target.value === "beginner";
    setIsBeginnerMode(isBeginner);
    const newThresholds = isBeginner ? thresholdsBicepsCurl : thresholdsBicepsCurl;
    setCurrentThresholds(newThresholds);
    console.log("Current Thresholds:", newThresholds);
  };

  const sendResultsToBackend = async () => {
    const userId = user?.id; // Aktif kullanıcı ID'sini alın
    const exerciseId = 1; // Biceps Curl'ün veritabanındaki ID'si
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

  const resetExercise = () => {
    if (correctCount !== 0 || incorrectCount !== 0) {
      sendResultsToBackend();
    }

    setCorrectCount(0);
    setIncorrectCount(0);
    stateTrackerRef.current.BICEPS_CURL_COUNT = 0;
    stateTrackerRef.current.INCORRECT_CURL = 0;
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

  const getState = (elbowAngle) => {
    if (elbowAngle >= currentThresholds.ANGLE_ELBOW.NORMAL[0] && elbowAngle <= currentThresholds.ANGLE_ELBOW.NORMAL[1]) {
      return 's1'; // Başlangıç pozisyonu
    } else if (elbowAngle >= currentThresholds.ANGLE_ELBOW.TRANS[0] && elbowAngle <= currentThresholds.ANGLE_ELBOW.TRANS[1]) {
      return 's2'; // Geçiş pozisyonu
    } else if (elbowAngle >= currentThresholds.ANGLE_ELBOW.PASS[0] && elbowAngle <= currentThresholds.ANGLE_ELBOW.PASS[1]) {
      return 's3'; // Tam bükülmüş pozisyon
    }
    return null;
  };

  const updateStateSequence = (newState, side) => {
    const stateTracker = stateTrackerRef.current;
    const stateSeq = side === 'left' ? stateTracker.state_seq_left : stateTracker.state_seq_right;
    let updatedStateSeq = [...stateSeq];

    // Geri bildirim mesajını sıfırla
    stateTracker.DISPLAY_TEXT[side] = null;

    if (newState === 's1') {
      if (updatedStateSeq.includes('s3')) {
        // Her iki kol da tam tur tamamladıysa doğru sayımı artır
        if (stateTracker.has_completed_tour_left && stateTracker.has_completed_tour_right) {
          stateTracker.CURL_COUNT += 1;
          setCorrectCount(stateTrackerRef.current.CURL_COUNT);
          stateTracker.has_completed_tour_left = false;
          stateTracker.has_completed_tour_right = false;
          stateTracker.last_curl_left = Date.now();
          stateTracker.last_curl_right = Date.now();
        }
      } else if (stateTracker.has_started_left || stateTracker.has_started_right) {
        // Hareket başlamıştı ama tam tur yapılmadıysa, yanlış sayımı artır
        if (side === 'left' && stateTracker.last_curl_left && Date.now() - stateTracker.last_curl_left > 2000) {
          stateTracker.IMPROPER_CURL += 1;
          setIncorrectCount(stateTrackerRef.current.IMPROPER_CURL);
        }
        if (side === 'right' && stateTracker.last_curl_right && Date.now() - stateTracker.last_curl_right > 2000) {
          stateTracker.IMPROPER_CURL += 1;
          setIncorrectCount(stateTrackerRef.current.IMPROPER_CURL);
        }
      }
      // Sıfırla ve yeniden başlat
      updatedStateSeq = [];
      stateTracker.has_started_left = false;
      stateTracker.has_started_right = false;
    } else if (newState === 's2' && updatedStateSeq.length === 0) {
      // Geçiş pozisyonu, hareket başlatıldı
      updatedStateSeq.push(newState);
      if (side === 'left') stateTracker.has_started_left = true;
      if (side === 'right') stateTracker.has_started_right = true;
    } else if (newState === 's3' && updatedStateSeq.includes('s2')) {
      // Tam bükülmüş pozisyona geçildi
      updatedStateSeq.push(newState);
      if (side === 'left') stateTracker.has_completed_tour_left = true;
      if (side === 'right') stateTracker.has_completed_tour_right = true;
    }

    // Geri bildirim mesajları
    if (newState === 's1') {
      stateTracker.DISPLAY_TEXT[side] = FEEDBACK_MESSAGES.straighten;
    } else if (newState === 's2') {
      stateTracker.DISPLAY_TEXT[side] = FEEDBACK_MESSAGES.bend_more;
    } else if (newState === 's3') {
      stateTracker.DISPLAY_TEXT[side] = FEEDBACK_MESSAGES.complete_curl;
    }

    if (side === 'left') {
      stateTracker.state_seq_left = updatedStateSeq;
    } else {
      stateTracker.state_seq_right = updatedStateSeq;
    }
  };

  const onResults = useCallback((results) => {
    if (webcamRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = webcamRef.current.video.videoWidth;
      canvas.height = webcamRef.current.video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        const leftElbow = results.poseLandmarks[13];
        const leftShoulder = results.poseLandmarks[11];
        const leftWrist = results.poseLandmarks[15];
        const rightElbow = results.poseLandmarks[14];
        const rightShoulder = results.poseLandmarks[12];
        const rightWrist = results.poseLandmarks[16];

        const leftElbowAngle = findAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = findAngle(rightShoulder, rightElbow, rightWrist);

        const leftState = getState(leftElbowAngle);
        const rightState = getState(rightElbowAngle);
        updateStateSequence(leftState, 'left');
        updateStateSequence(rightState, 'right');

        const drawLandmark = (x, y, color) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        };

        const drawConnector = (p1, p2, color) => {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.stroke();
        };

        drawLandmark(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height, colors.green);
        drawLandmark(leftElbow.x * canvas.width, leftElbow.y * canvas.height, colors.green);
        drawLandmark(leftWrist.x * canvas.width, leftWrist.y * canvas.height, colors.green);
        drawConnector(
          { x: leftShoulder.x * canvas.width, y: leftShoulder.y * canvas.height },
          { x: leftElbow.x * canvas.width, y: leftElbow.y * canvas.height },
          colors.blue
        );
        drawConnector(
          { x: leftElbow.x * canvas.width, y: leftElbow.y * canvas.height },
          { x: leftWrist.x * canvas.width, y: leftWrist.y * canvas.height },
          colors.blue
        );

        drawLandmark(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height, colors.green);
        drawLandmark(rightElbow.x * canvas.width, rightElbow.y * canvas.height, colors.green);
        drawLandmark(rightWrist.x * canvas.width, rightWrist.y * canvas.height, colors.green);
        drawConnector(
          { x: rightShoulder.x * canvas.width, y: rightShoulder.y * canvas.height },
          { x: rightElbow.x * canvas.width, y: rightElbow.y * canvas.height },
          colors.blue
        );
        drawConnector(
          { x: rightElbow.x * canvas.width, y: rightElbow.y * canvas.height },
          { x: rightWrist.x * canvas.width, y: rightWrist.y * canvas.height },
          colors.blue
        );

        ctx.fillStyle = colors.white;
        ctx.font = '16px Arial';
        ctx.fillText(`Left Elbow Angle: ${leftElbowAngle.toFixed(2)}`, 30, 30);
        ctx.fillText(`Right Elbow Angle: ${rightElbowAngle.toFixed(2)}`, 30, 60);

        // Doğru ve yanlış sayıları yazdır
        ctx.fillText(`Correct Curls: ${stateTrackerRef.current.CURL_COUNT}`, 30, canvas.height - 60);
        ctx.fillText(`Incorrect Curls: ${stateTrackerRef.current.IMPROPER_CURL}`, 30, canvas.height - 30);

        // Geri bildirim mesajlarını göster
        if (stateTrackerRef.current.DISPLAY_TEXT.left) {
          ctx.fillText(stateTrackerRef.current.DISPLAY_TEXT.left, 30, canvas.height - 90);
        }
        if (stateTrackerRef.current.DISPLAY_TEXT.right) {
          ctx.fillText(stateTrackerRef.current.DISPLAY_TEXT.right, 30, canvas.height - 120);
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
              <button className="btn btn-success mt-3" onClick={startExercise}>Start Sport</button>
              <button className="btn btn-danger mt-3 ms-2" onClick={resetExercise}>Finish Sport</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BicepsCurlExercise;
