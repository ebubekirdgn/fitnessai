import React, { useState } from 'react';

const images = {
  bicepsCurlImage: require('../../assets/images/biceps_curl.PNG'),
  lateralRaiseImage: require('../../assets/images/lateral_raise.PNG'),
  shoulderPressImage: require('../../assets/images/shoulder_press.PNG'),
  tricepsExtensionImage: require('../../assets/images/triceps_extension.PNG'),
  crunchImage: require('../../assets/images/crunch.PNG'),
  squatImage: require('../../assets/images/squat.PNG'),
};

function ExerciseCarousel() {
  const [activeTab, setActiveTab] = useState("tabs-1");

  return (
    <>
      <section className="jumbotron" id="our-classes">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="section-heading">
                <h2>Our <em>Classes</em></h2>
              </div>
            </div>
          </div>
          <div className="row" id="tabs">
            <div className="col-lg-4">
              <ul>
                <li><a href="#tabs-1" onClick={() => setActiveTab("tabs-1")}>Biceps Curl</a></li>
                <li><a href="#tabs-2" onClick={() => setActiveTab("tabs-2")}>Lateral Raise</a></li>
                <li><a href="#tabs-3" onClick={() => setActiveTab("tabs-3")}>Shoulder Press</a></li>
                <li><a href="#tabs-4" onClick={() => setActiveTab("tabs-4")}>Triceps Extension</a></li>
                <li><a href="#tabs-5" onClick={() => setActiveTab("tabs-5")}>Crunch</a></li>
                <li><a href="#tabs-6" onClick={() => setActiveTab("tabs-6")}>Squat</a></li>
              </ul>
            </div>
            <div className="col-lg-8">
              <section className='tabs-content'>
                {activeTab === "tabs-1" && (
                  <article id="tabs-1">
                    <img src={images.bicepsCurlImage} alt="Biceps Curl" />
                    <h4>Biceps Curl</h4>
                    <p>Phasellus convallis mauris sed elementum vulputate. Donec posuere leo sed dui eleifend hendrerit. Sed suscipit suscipit erat, sed vehicula ligula. Aliquam ut sem fermentum sem tincidunt lacinia gravida aliquam nunc. Morbi quis erat imperdiet, molestie nunc ut, accumsan diam.</p>
                  </article>
                )}

                {activeTab === "tabs-2" && (
                  <article id="tabs-2">
                    <img src={images.lateralRaiseImage} alt="Lateral Raise" />
                    <h4>Lateral Raise</h4>
                    <p>Integer dapibus, est vel dapibus mattis, sem mauris luctus leo, ac pulvinar quam tortor a velit. Praesent ultrices erat ante, in ultricies augue ultricies faucibus. Nam tellus nibh, ullamcorper at mattis non, rhoncus sed massa. Cras quis pulvinar eros. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
                  </article>
                )}

                {activeTab === "tabs-3" && (
                  <article id="tabs-3">
                    <img src={images.shoulderPressImage} alt="Shoulder Press" />
                    <h4>Shoulder Press</h4>
                    <p>Fusce laoreet malesuada rhoncus. Donec ultricies diam tortor, id auctor neque posuere sit amet. Aliquam pharetra, augue vel cursus porta, nisi tortor vulputate sapien, id scelerisque felis magna id felis. Proin neque metus, pellentesque pharetra semper vel, accumsan a neque.</p>
                  </article>
                )}

                {activeTab === "tabs-4" && (
                  <article id="tabs-4">
                    <img src={images.tricepsExtensionImage} alt="Triceps Extension" />
                    <h4>Triceps Extension</h4>
                    <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean ultrices elementum odio ac tempus. Etiam eleifend orci lectus, eget venenatis ipsum commodo et.</p>
                  </article>
                )}

                {activeTab === "tabs-5" && (
                  <article id="tabs-5">
                    <img src={images.crunchImage} alt="Crunch" />
                    <h4>Crunch</h4>
                    <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean ultrices elementum odio ac tempus. Etiam eleifend orci lectus, eget venenatis ipsum commodo et.</p>
                  </article>
                )}

                {activeTab === "tabs-6" && (
                  <article id="tabs-6">
                    <img src={images.squatImage} alt="Squat" />
                    <h4>Squat</h4>
                    <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean ultrices elementum odio ac tempus. Etiam eleifend orci lectus, eget venenatis ipsum commodo et.</p>
                  </article>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ExerciseCarousel;
