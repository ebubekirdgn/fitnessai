import React, { useEffect, useState } from 'react';
import { fetchMe, updateUser } from "../../api";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

function ProfileInfo() {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await fetchMe();
        setUser(data);
        setFormData(data);
      } catch (error) {
        toast.error(`Kullanıcı verileri alınırken bir hata oluştu: ${error.message}`);
      }
    };

    getUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      await updateUser(user.id, formData);
      setUser(formData);
      setIsEditing(false);
      toast.success("Profil başarıyla güncellendi!");
    } catch (error) {
      try {
        const errorData = await error.json();
        toast.error(`Profil güncellenirken bir hata oluştu: ${errorData.message}`);
      } catch (jsonError) {
        toast.error(`Profil güncellenirken bir hata oluştu: ${error.message}`);
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="section-heading">
              <h2>
                Profile <em>Info</em>
              </h2>
      </div>
      <div className="card mx-auto" style={{ maxWidth: "800px", border: "none" }}>
        <div className="card-body">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(user).map(([key, value]) => {
                if (key === "id" || key === "TrainerCards") return null; // id ve TrainerCards alanlarını formdan kaldır
                return (
                  <tr key={key}>
                    <td style={{ padding: "10px", textTransform: "capitalize" }}>{key}</td>
                    <td style={{ padding: "10px" }}>
                      {key === "role" ? (
                        <input
                          type="text"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          disabled
                          className="form-control"
                        />
                      ) : (
                        <input
                          type="text"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="form-control"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isEditing ? (
            <div className="text-center">
              <button className="btn btn-success me-2" onClick={handleSave}>
                Kaydet
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                İptal
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Düzenle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileInfo;