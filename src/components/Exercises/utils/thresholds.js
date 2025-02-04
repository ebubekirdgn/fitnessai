// BICEPS CURL
export const thresholdsBicepsCurl = {
    ANGLE_ELBOW: {
      NORMAL: [0, 20],  // Kol tamamen açık (dinlenme durumu)
      TRANS: [21, 70],  // Kol kısmen bükülmüş (geçiş durumu)
      PASS: [71, 140]   // Kol tamamen bükülmüş (tam biceps curl)
    },
    ELBOW_THRESH: [10, 140],  // Minimum ve maksimum bükülme açısı
    INACTIVE_THRESH: 10.0,    // Hareketin inaktif olabileceği maksimum süre (saniye)
    CNT_FRAME_THRESH: 30      // Geri bildirim için gereken minimum kare sayısı
};
/*------------------------------- SQUAT-------------------------------------- */
//
export const thresholdsSquatBeginner = {
  ANGLE_HIP_KNEE_VERT: {
      NORMAL: [0, 32],
      TRANS: [35, 65],
      PASS: [70, 95]
  },
  HIP_THRESH: [10, 50],
  ANKLE_THRESH: 45,
  KNEE_THRESH: [50, 70, 95],
  OFFSET_THRESH: 35.0,
  INACTIVE_THRESH: 15.0,
  CNT_FRAME_THRESH: 50
};

export const thresholdsSquatPro = {
  ANGLE_HIP_KNEE_VERT: {
      NORMAL: [0, 32],
      TRANS: [35, 65],
      PASS: [80, 95]
  },
  HIP_THRESH: [15, 50],
  ANKLE_THRESH: 30,
  KNEE_THRESH: [50, 80, 95],
  OFFSET_THRESH: 35.0,
  INACTIVE_THRESH: 15.0,
  CNT_FRAME_THRESH: 50
};
/*------------------------------- SQUAT-------------------------------------- */

/*------------------------------- CRUNCH-------------------------------------- */

export const thresholdsCrunchBeginner = {
  ANGLE_SHOULDER_HIP_VERT: {
      NORMAL: [30, 60], // Doğru crunch açısı
      TRANS: [61, 75],  // Geçiş açısı
      PASS: [76, 90],   // Maksimum kabul edilebilir açılar
  },
  HIP_THRESH: [0, 10], // Kalça kalkış açısı
  NECK_THRESH: [10, 30], // Boyun doğal pozisyon açısı
  INACTIVE_THRESH: 10.0, // İnaktiflik süresi
  CNT_FRAME_THRESH: 50 // Geri bildirim süresi
};

export const thresholdsCrunchPro = {
  ANGLE_SHOULDER_HIP_VERT: {
      NORMAL: [35, 55],
      TRANS: [56, 70],
      PASS: [71, 85],
  },
  HIP_THRESH: [0, 5],
  NECK_THRESH: [5, 20],
  INACTIVE_THRESH: 8.0,
  CNT_FRAME_THRESH: 50
};

/*------------------------------- CRUNCH-------------------------------------- */


/*-------------------------------SHOULDER PRESS----------------------------------- */
export const thresholdsShoulderPress = {
  ANGLE_SHOULDER_ELBOW: {
      NORMAL: [160, 180], // Kollar yukarıda, doğru pozisyon
      TRANS: [100, 160],  // Geçiş pozisyonu
      PASS: [70, 100]     // Kollar aşağıdayken
  },
  ANGLE_ELBOW_WRIST: {
      NORMAL: [170, 180], // Kollar düz
      TRANS: [120, 170],  // Geçiş pozisyonu
  },
  OFFSET_THRESH: 20.0,    // Simetri hatalarını kontrol için
  INACTIVE_THRESH: 10.0,  // Hareketsizlik toleransı
  CNT_FRAME_THRESH: 50    // Geri bildirim gösterim süresi
};


/* TRICEPS EXTENSION */

export const thresholdsTricepsExtensionBeginner = {
  ANGLE_ELBOW: {
    NORMAL: [0, 5], // Dirsek tam uzatılmış pozisyon
    TRANS: [6, 15],  // Geçiş pozisyonu
    PASS: [16, 25],  // Dirsek başlangıç pozisyonu (90 derece)
  },
  OFFSET_THRESH: 20.0,
  INACTIVE_THRESH: 10.0, // İnaktiflik süresi
  CNT_FRAME_THRESH: 50, // Geri bildirim için gereken kare sayısı   // Geri bildirim için minimum kare sayısı
};

export const thresholdsTricepsExtensionPro = {
  ANGLE_ELBOW: {
    NORMAL: [25, 30], // Dirsek tam uzatılmış pozisyon
    TRANS: [31, 89],  // Geçiş pozisyonu
    PASS: [90, 120],  // Dirsek başlangıç pozisyonu (90 derece)
  },
  OFFSET_THRESH: 20.0,
  INACTIVE_THRESH: 10.0, // İnaktiflik süresi
  CNT_FRAME_THRESH: 50, // Geri bildirim için gereken kare sayısı   // Geri bildirim için minimum kare sayısı
};



/* LATERAL RAISE */

export const thresholdsLateralRaiseBeginner = {
  ANGLE_SHOULDER: {
    NORMAL: [0, 15], // Kol başlama pozisyonu (kollar vücuda paralel)
    TRANS: [16, 45], // Geçiş pozisyonu (kol yukarıya doğru hareket eder)
    PASS: [46, 90],  // Kol tam açılma pozisyonu (90 derece)
  },
  OFFSET_THRESH: 20.0,
  INACTIVE_THRESH: 10.0, // İnaktiflik süresi
  CNT_FRAME_THRESH: 50, // Geri bildirim için gereken kare sayısı
};

export const thresholdsLateralRaisePro = {
  ANGLE_SHOULDER: {
    NORMAL: [0, 10], // Kol başlama pozisyonu (kollar vücuda paralel)
    TRANS: [11, 45], // Geçiş pozisyonu (kol yukarıya doğru hareket eder)
    PASS: [46, 90],  // Kol tam açılma pozisyonu (90 derece)
  },
  OFFSET_THRESH: 20.0,
  INACTIVE_THRESH: 10.0, // İnaktiflik süresi
  CNT_FRAME_THRESH: 50, // Geri bildirim için gereken kare sayısı
};
