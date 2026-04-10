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

/**
 * Persist guest selfie using phone details
 * @param {string} phoneCountryCode
 * @param {string} phoneNumber
 * @param {File} selfieFile
 * @returns {Promise}
 */
const persistGuestSelfie = async (
  phoneCountryCode,
  phoneNumber,
  selfieFile,
) => {
  try {
    const formData = new FormData();

    formData.append("phoneCountryCode", phoneCountryCode);
    formData.append("phoneNumber", phoneNumber);
    // formData.append("selfie", selfieFile);
    formData.append("Image", selfieFile);

    const response = await apiClient.post(
      API_ENDPOINTS.PERSIST_SELFIE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("Invalid selfie or phone data");
    }
    if (error.response?.status === 401) {
      throw new Error("Unauthorized request");
    }
    if (error.response?.status === 413) {
      throw new Error("Selfie image too large");
    }

    console.error("❌ Error persisting selfie:", error);
    throw error;
  }
};

/**
 * Contractor face match verification
 * @param {File} selfieFile - Selfie image file
 * @returns {Promise} Face match result
 */
const matchContractorFace = async (selfieFile) => {
  try {
    const formData = new FormData();
    formData.append("selfie", selfieFile);

    const response = await apiClient.post(
      API_ENDPOINTS.CONTRACTOR_MATCH,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    // Handling common errors for contractor matching
    if (error.response?.status === 400) {
      throw new Error("Invalid image file provided");
    }
    if (error.response?.status === 422) {
      throw new Error("Face not detected in the contractor selfie");
    }
    if (error.response?.status === 413) {
      throw new Error("Image file size exceeds limit");
    }

    console.error("❌ Contractor face match API error:", error);
    throw error;
  }
};

export const faceMatchService = {
  matchFace,
  persistGuestSelfie,
  matchContractorFace,
};
