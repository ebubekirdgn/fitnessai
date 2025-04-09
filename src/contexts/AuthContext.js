import { createContext, useContext, useEffect, useState } from "react";
import { fetchLogin,fetchLogout, fetchMe, fetchRegister } from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tarayıcıya tokenları kaydetme
  const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem("access-token", accessToken);
    localStorage.setItem("refresh-token", refreshToken);
  };

  // Tarayıcıdan tokenları kaldırma
  const removeTokens = () => {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
  };

  // Kullanıcı verilerini kontrol etme (örneğin tarayıcı yeniden yüklendiğinde)
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchMe();
        setLoggedIn(true);
        setUser(me);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();
  }, []);

  // Kayıt işlemi
  const register = async (registerData) => {
    try {
      await fetchRegister(registerData);
      toast.success("Kayıt işlemi başarıyla tamamlandı!");
    } catch (e) {
      toast.error(e.message || "Kayıt işlemi başarısız.");
    }
  };

  const login = async (loginData) => {
    try {
      const { accessToken, refreshToken } = await fetchLogin(loginData);
      setTokens(accessToken, refreshToken);
      const userData = await fetchMe(); // Kullanıcı bilgilerini hemen yükleyin
      setUser(userData);
      setLoggedIn(true);
      toast.success("Login successful!");
      return userData; // userData'yı döndür
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "Failed to login. Please check your credentials.");
      return null;
    }
  };
  
  // Çıkış işlemi
  const logout = async (callback = () => {}) => {
    try {
      await fetchLogout(); // API çağrısı (isteğe bağlı)
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Çıkış işlemi başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setUser(null);
      setLoggedIn(false);
      removeTokens(); // Token'ları temizle
      toast.info("Başarıyla çıkış yapıldı.");
      callback(); // Callback'i çağır
    }
  };

  const values = {
    loggedIn,
    user,
    login,
    register,
    logout,
  };

  if (loading) {
    return <div className="center-container">
    <div className="spinner-border" role="status">
      <span className="visually-hidden"></span>
    </div>
  </div>;
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

// AuthContext kullanımı kolaylaştırmak için hook
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };