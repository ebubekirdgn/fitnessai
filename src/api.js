const BASE_URL = process.env.REACT_APP_BASE_ENDPOINT;

export const fetchRegister = async (registerData) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registerData),
  });

  if (!response.ok) {
    throw new Error("Registration failed. Please check your details.");
  }

  return await response.json();
};

export const fetchLogout = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed.");
  }

  return true;
};

export const fetchMe = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data.");
  }

  return await response.json();
};

export const fetchLogin = async (loginData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    // Yanıt başarılı mı kontrol et
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Login failed. Please check your credentials.");
    }

    // JSON formatında yanıtı al
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

export const sendResults = async (resultsData) => {
  const response = await fetch(`${BASE_URL}/api/ExerciseRecord/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access-token")}`, // Yetkilendirme başlığını ekleyin
    },
    body: JSON.stringify(resultsData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to send results.");
  }

  // Yanıtın JSON formatında olup olmadığını kontrol edin
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return await response.json();
  } else {
    return await response.text();
  }
};

// export const fetchExerciseRecords = async () => {
//   const response = await fetch(`${BASE_URL}/api/ExerciseRecord`, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("access-token")}`, // Yetkilendirme başlığını ekleyin
//     },
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(errorText || "Failed to fetch exercise records.");
//   }

//   return await response.json();
// };

export async function fetchExerciseRecords(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/ExerciseRecord/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Fetched data:', data); // Fetched data verilerini kontrol edin

    if (!Array.isArray(data)) {
      throw new Error('Fetched data is not an array');
    }

    return data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return []; // Hata durumunda boş bir dizi döndür
  }
}


export const updateUser = async (id, userData) => {
  const response = await fetch(`${BASE_URL}/api/Admin/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access-token")}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update user.");
  }

  return await response.json();
};