import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import MainBanner from './components/MainBanner/MainBanner';
import RegisterForm from './pages/Auth/Signup/signup';
import LoginForm from './pages/Auth/Signin/signin';
import Footer from './components/Footer/Footer';
import ExerciseCarousel from './components/ExerciseCarousel/ExerciseCarousel';
import Profile from './pages/Profile/Profile';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/Error404'
import ExercisePage from './pages/Exercise/ExercisePage';
import Admin from './pages/Admin/admin';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <MainBanner />
              <ExerciseCarousel />
              <RegisterForm />
              <LoginForm />
            </>
          }
        />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin/></ProtectedRoute>} />
        <Route path="/exercise/:exerciseId" element={<ProtectedRoute> <ExercisePage /> </ProtectedRoute>}/>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Footer */}
      <Footer />
    </Router>
  );
}

export default App;
