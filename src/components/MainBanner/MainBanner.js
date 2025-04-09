import React from 'react'
import gymVideo from '../../assets/images/gym-video.mp4';

function MainBanner() {

  const scrollToLogin = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="main-banner" id="top">
        <video autoPlay muted loop id="bg-video">
        <source src={gymVideo} type="video/mp4" />
      </video>
      
      <div className="video-overlay header-text">
        <div className="caption">
          <h6>work harder, get stronger</h6>
          <h2>FITNESS <em>AI</em></h2>
          <div className="main-button scroll-to-section">
            <button onClick={scrollToLogin}>Register</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainBanner