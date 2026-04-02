import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/config";

/**
 * Face match verification service
 * @param {string} verificationId - Verification ID
 * @param {File} selfieFile - Selfie image file
 * @param {File} idImageFile - Aadhaar image file
 * @param {number} threshold - Match threshold (default: 0.75)
 * @returns {Promise} Face match result
 */
const matchFace = async (
  verificationId,
  selfieFile,
  idImageFile,
  threshold = 0.75,
) => {
  try {
    const formData = new FormData();

    formData.append("verificationId", verificationId);
    formData.append("selfie", selfieFile);
    formData.append("idImage", idImageFile);
    formData.append("threshold", threshold);

    const response = await apiClient.post(API_ENDPOINTS.FACE_MATCH, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("Invalid image files or parameters");
    }
    if (error.response?.status === 413) {
      throw new Error("Image file size exceeds limit");
    }
    if (error.response?.status === 422) {
      throw new Error("Face not detected in image(s)");
    }

    console.error("❌ Face match API error:", error);
    throw error;
  }
};

export const faceMatchService = {
  matchFace,
};
