import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/config";

/**
 * Fetch Aadhaar data using verification and reference IDs
 * @param {string} verificationId - Verification ID
 * @param {string} referenceId - Reference ID (optional)
 * @param {string} phoneCode - Phone country code (e.g., +91)
 * @param {string} phoneNumber - Phone number (without country code)
 * @returns {Promise<Object|null>} Aadhaar data or null if not found
 */
export const getAadhaarData = async (
  verificationId,
  referenceId,
  phoneCode,
  phoneNumber,
) => {
  try {
    if (!verificationId) {
      throw new Error("Verification ID is required");
    }

    // 🔹 Build payload
    const payload = {
      verificationId,
      phoneCountryCode: phoneCode,
      phoneNumber,
    };

    // Include referenceId only if valid
    if (referenceId && referenceId !== verificationId) {
      payload.referenceId = referenceId;
    }

    console.log("🔍 Fetching Aadhaar data...");
    console.log("📦 Payload:", payload);
    console.log("📤 Endpoint:", API_ENDPOINTS.GET_AADHAAR_DATA);

    const response = await apiClient.post(API_ENDPOINTS.GET_AADHAAR_DATA, payload);

    console.log("✅ Aadhaar data received:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Aadhaar fetch error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // 🔹 Error handling
    if (error.response?.status === 404) {
      console.warn("⚠️ Aadhaar data not found (404)");
      return null;
    }

    if (error.response?.status === 400) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid parameters";
      throw new Error(`[400] ${msg}`);
    }

    if (error.response?.status === 401) {
      throw new Error("Authentication failed (401)");
    }

    throw new Error(
      error.response?.data?.message || "Failed to fetch Aadhaar data",
    );
  }
};

/**
 * Persist complete Aadhaar update with full payload
 * POST: /api/guest/persist/aadhaar/update
 *
 * @param {object} aadhaarPayload - Complete Aadhaar payload
 * @returns {Promise<Object>}
 */
export const persistAadhaarUpdate = async (aadhaarPayload) => {
  try {
    if (!aadhaarPayload) {
      throw new Error("Aadhaar payload is required");
    }

    console.log("📤 Persist Aadhaar Payload:", aadhaarPayload);

    const response = await apiClient.post(
      API_ENDPOINTS.PERSIST_AADHAAR_UPDATE,
      aadhaarPayload,
    );

    console.log("✅ Aadhaar update persisted successfully");

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error persisting Aadhaar update:",
      error.response?.data || error.message,
    );

    if (error.response?.status === 400) {
      throw new Error("Invalid Aadhaar update data");
    }

    if (error.response?.status === 401) {
      throw new Error("Unauthorized request");
    }

    if (error.response?.status === 404) {
      throw new Error("Guest not found");
    }

    throw new Error(
      error.response?.data?.message || "Failed to persist Aadhaar update",
    );
  }
};

/**
 * Persist Aadhaar image for guest
 * POST: /api/guest/persist/aadhar/image
 *
 * @param {string} phoneCountryCode
 * @param {string} phoneNumber
 * @param {File|Blob} imageFile
 * @returns {Promise<Object>}
 */
export const persistAadhaarImage = async (
  phoneCountryCode,
  phoneNumber,
  imageFile,
) => {
  try {
    if (!phoneCountryCode || !phoneNumber) {
      throw new Error("Phone details are required");
    }

    if (!imageFile) {
      throw new Error("Image file is required");
    }

    const formData = new FormData();

    formData.append("PhoneCountryCode", phoneCountryCode);
    formData.append("PhoneNumber", phoneNumber);
    formData.append("Image", imageFile);
    // ⚠️ Make sure this matches backend parameter name exactly

    console.log("📤 Persist Aadhaar Image Uploading...");

    const response = await apiClient.post(API_ENDPOINTS.PERSIST_IMAGE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Aadhaar image persisted successfully");

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error persisting Aadhaar image:",
      error.response?.data || error.message,
    );

    if (error.response?.status === 400) {
      throw new Error("Invalid Aadhaar image or phone details");
    }

    if (error.response?.status === 401) {
      throw new Error("Unauthorized request");
    }

    if (error.response?.status === 413) {
      throw new Error("Image file too large");
    }

    throw new Error(
      error.response?.data?.message || "Failed to persist Aadhaar image",
    );
  }
};
