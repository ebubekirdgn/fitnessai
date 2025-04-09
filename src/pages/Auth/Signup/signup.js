import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    height: "",
    weight: "",
    dateOfBirth: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const { firstName, lastName, email, password, height, weight, dateOfBirth } = formData;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_ENDPOINT}/api/auth/register`,
        {
          firstName,
          lastName,
          email,
          password,
          height: parseFloat(height),
          weight: parseFloat(weight),
          dateOfBirth,
        }
      );
      // Başarılı kayıt mesajı
      toast.success("Kayıt başarılı!");

      // Formu sıfırla
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        height: "",
        weight: "",
        dateOfBirth: "",
      });
    } catch (error) {
      toast.error(error.response?.data || "Bir hata oluştu.");
    }
  };

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>REGISTER <em>Program</em></h2>
            </div>
          </div>
          <div className="container mt-5">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="contact-form">
                  <form id="register-form" method="post" onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input
                          name="firstName"
                          type="text"
                          className="form-control"
                          placeholder="First Name*"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          name="lastName"
                          type="text"
                          className="form-control"
                          placeholder="Last Name*"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-12">
                        <input
                          name="dateOfBirth"
                          type="date"
                          className="form-control"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-12">
                        <input
                          name="email"
                          type="email"
                          className="form-control"
                          placeholder="Your Email*"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-12">
                        <input
                          name="password"
                          type="password"
                          className="form-control"
                          placeholder="Password*"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-12">
                        <input
                          name="confirmPassword"
                          type="password"
                          className="form-control"
                          placeholder="Confirm Password*"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          name="height"
                          type="number"
                          className="form-control"
                          placeholder="Height (cm)*"
                          value={formData.height}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          name="weight"
                          type="number"
                          className="form-control"
                          placeholder="Weight (kg)*"
                          value={formData.weight}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-12 text-center mt-4">
                        <button type="submit" className="main-button">Register</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterForm;
