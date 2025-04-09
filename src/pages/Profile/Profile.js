import React from "react";
import TrainerCards from "../../components/TrainerCards/TrainerCards";
import ExerciseRecords from "../Exercise/ExerciseRecords";
import ProfileInfo from "../../pages/Profile/ProfileInfo";

const Profile = () => {
  return (
    <div>
      {/* TrainerCards */}
      <section className="section mb-5">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <TrainerCards />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Info */}
      <p ></p>
      <section className="section mb-5" id="my-profiles">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <ProfileInfo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Egzersiz İstatistikleri */}
      <section className="section mt-5" id="exercise-stats">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <ExerciseRecords />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;