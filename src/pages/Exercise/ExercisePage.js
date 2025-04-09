import React, { Suspense } from "react";
import { useParams } from "react-router-dom";

// Dinamik bileşen yükleme
const loadExerciseComponent = (exerciseId) => {
  switch (exerciseId) {
    case "squat":
      return React.lazy(() => import("../../components/Exercises/Squat"));
    case "biceps_curl":
      return React.lazy(() => import("../../components/Exercises/BicepsCurl"));
    case "lateral_raise":
      return React.lazy(() => import("../../components/Exercises/LateralRaise"));
    case "triceps_extension":
      return React.lazy(() => import("../../components/Exercises/TricepsExtension"));
    case "crunch":
      return React.lazy(() => import("../../components/Exercises/Crunch"));
    case "shoulder_press":
      return React.lazy(() => import("../../components/Exercises/ShoulderPress"));
    default:
      return null; 
  }
};

const ExercisePage = () => {
  const { exerciseId } = useParams(); // URL'deki parametreyi al
  const ExerciseComponent = loadExerciseComponent(exerciseId);

  return (
    <> 
    <br/> <br/> <br/> <br/>
      <div className="container">
        <div className="exercise-page">
            <Suspense fallback={<p>Egzersiz yükleniyor...</p>}>
              {ExerciseComponent ? <ExerciseComponent /> : <p>Geçersiz egzersiz!</p>}
            </Suspense>
        </div>
    </div>
  </>
  );
};

export default ExercisePage;
