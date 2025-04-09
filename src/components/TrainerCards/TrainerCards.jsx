import React from "react";
import { useNavigate } from "react-router-dom";
import exercises from "../../exerciseConfig";

const TrainerCards = () => {
  const navigate = useNavigate();

  const handleStartExercise = (exerciseId) => {
    navigate(`/exercise/${exerciseId}`);
  };

  return (
    <section className="section" id="trainers">
      <div className="container" id="schedule">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>
                Expert <em>Trainers</em>
              </h2>
              <p>
                You can choose one of the cards below and start playing sports immediately.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          {exercises.map((exercise, index) => (
            <div className="col-lg-4" key={index}>
              <div className="trainer-item">
                <div className="image-thumb">
                  <img src={exercise.image} alt={exercise.title} />
                </div>
                <div className="down-content">
                  <h4>{exercise.title}</h4>
                  <ul className="social-icons">
                    <li>
                      <button
                        type="button"
                        className={`btn ${exercise.color}`}
                        onClick={() => handleStartExercise(exercise.id)}
                      >
                        Spora Başla
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrainerCards;
