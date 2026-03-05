import apiClient from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/config.js";

// Static mock data for different verification flows
const MOCK_VERIFICATION_DATA = {
  // Corporate Starter Plan
  starter: {
    verificationCode: "123456",
    guestData: {
      verificationStatus: "pending",
      fullName: "John Doe",
      aadhaar_verified: false,
    }
  },
  // SMB Plan (both Corporate and Hospitality)
  smb: {
    guestData: {
      verificationStatus: "verified",
      fullName: "Jane Smith",
      aadhaar_verified: true,
      face_verified: false,
    },
    faceMatchData: {
      status: "verified",
      faceMatchScore: 98.5,
    }
  },
  // Enterprise Plan
  enterprise: {
    guestData: {
      verificationStatus: "verified",
      fullName: "Robert Johnson",
      aadhaar_verified: true,
      face_verified: true,
    },
    faceMatchData: {
      status: "verified",
      faceMatchScore: 99.2,
    }
  }
};

/**
 * Service for verification-related API calls (Static/Demo version)
 */
export const verificationService = {
  /**
   * Begin verification process (Static - returns success)
   */
  async beginVerification(payload) {
    console.log("Static beginVerification called with payload:", payload);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: "Verification started" };
  },

  /**
   * Ensure verification status (Static - returns appropriate response based on plan)
   */
  async ensureVerification(bookingId, phoneCountryCode, phoneNumber) {
    console.log("Static ensureVerification called with:", { bookingId, phoneCountryCode, phoneNumber });
    await new Promise(resolve => setTimeout(resolve, 800));

    // Determine plan based on some logic (in real app, this would come from user context)
    // For demo, we'll simulate based on the phone number or booking ID
    const plan = this.determinePlan(bookingId, phoneNumber);

    if (plan === "starter") {
      return MOCK_VERIFICATION_DATA.starter.guestData;
    } else if (plan === "smb") {
      return MOCK_VERIFICATION_DATA.smb.guestData;
    } else {
      return MOCK_VERIFICATION_DATA.enterprise.guestData;
    }
  },

  /**
   * Get guest by ID (Real API call)
   */
  async getGuestById(phoneCountryCode, phoneNumber) {
    try {
      const countryCode = phoneCountryCode || "91";
      // Ensure phoneNumber is 10 digits
      let cleanPhoneNumber = phoneNumber;
      if (phoneNumber && phoneNumber.length > 10) {
        cleanPhoneNumber = phoneNumber.slice(-10);
      }
      const response = await apiClient.get(API_ENDPOINTS.GET_GUEST_BY_ID, {
        params: {
          phoneCountryCode: countryCode,
          phoneno: cleanPhoneNumber,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("Guest not found, likely a new user");
        return null;
      }
      console.error("Error getting guest by ID:", error);
      throw error;
    }
  },

  /**
   * Initiate face match (Static)
   */
  async initiateFaceMatch(bookingId, phoneCountryCode, phoneNumber) {
    console.log("Static initiateFaceMatch called with:", { bookingId, phoneCountryCode, phoneNumber });
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: "Face match initiated" };
  },

  /**
   * Get face match status (Static)
   */
  async getFaceMatchStatus(bookingId, phoneCountryCode, phoneNumber) {
    console.log("Static getFaceMatchStatus called with:", { bookingId, phoneCountryCode, phoneNumber });
    await new Promise(resolve => setTimeout(resolve, 400));

    const plan = this.determinePlan(bookingId, phoneNumber);

    if (plan === "smb") {
      return MOCK_VERIFICATION_DATA.smb.faceMatchData;
    } else {
      return MOCK_VERIFICATION_DATA.enterprise.faceMatchData;
    }
  },

  /**
   * End verification (Real API call)
   */
  async endVerification(bookingId) {
    console.log("Static endVerification called with:", { bookingId });
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      message: "Verification completed successfully",
      data: {
        bookingId,
        completedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Post Digilocker verification IDs
   */
  async postDigilockerVerificationIds(phoneCountryCode, phoneNumber) {
    try {
      let cleanPhoneNumber = phoneNumber;
      if (phoneNumber && phoneNumber.length > 10) {
        cleanPhoneNumber = phoneNumber.slice(-10);
      }
      const response = await apiClient.post(API_ENDPOINTS.DIGILOCKER_VERIFICATION_IDS, {
        phoneCountryCode: phoneCountryCode || "91",
        phoneNumber: cleanPhoneNumber,
      });
      return response.data;
    } catch (error) {
      console.error("Error posting Digilocker verification IDs:", error);
      throw error;
    }
  },

  /**
   * Determine which plan to use for demo purposes
   * In real app, this would come from user's subscription/plan
   */
  determinePlan(bookingId, phoneNumber) {
    // For demo purposes, we'll determine plan based on:
    // - If phone number ends with specific digits
    // - Or if booking ID contains certain keywords

    if (!phoneNumber) return "enterprise"; // Default to enterprise

    const lastDigit = phoneNumber.slice(-1);

    if (lastDigit === '1' || lastDigit === '2' || lastDigit === '3') {
      return "starter";
    } else if (lastDigit === '4' || lastDigit === '5' || lastDigit === '6') {
      return "smb";
    } else {
      return "enterprise";
    }
  }
};