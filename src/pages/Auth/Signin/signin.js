import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../../../assets/css/LoginSection.css';

const LoginForm = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({ email, password });
      console.log("user: " + JSON.stringify(user)); // user nesnesini JSON formatında yazdır
  
      if (user) {
        // Kullanıcı rolünü kontrol etme ve yönlendirme
        if (user.role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      } else {
      }
    } catch (error) {
      toast.error("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <div>
      <section className="section" id="call-to-action">
          <div className="container">
            <div className="row">
              <div className="col-lg-10 offset-lg-1">
                <div className="cta-content">
                  <h2>LOGIN <em>Account</em></h2>
                </div>
              </div>
            </div>
            <div className="row justify-content-center mt-5">
              <div className="col-lg-6">
                <div className="contact-form">
                  <form id="login-form" onSubmit={handleSubmit} method="post">
                    <div className="row g-3">
                      <div className="col-md-12">
                        <input name="email" type="email" className="form-control" id="login-email" placeholder="Your Email*" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="col-md-12">
                        <input name="password" type="password" className="form-control" id="login-password" placeholder="Password*" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </div>
                      <div className="col-md-12 text-center mt-4">
                        <button type="submit" id="login-submit" className="main-button">Login</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
      </section>
    </div>
  );
};

export default LoginForm 