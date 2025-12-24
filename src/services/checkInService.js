/**
 * Service for check-in related API calls
 */
export const checkInService = {
  /**
   * Submit a new check-in
   * @param {Object} checkInData - Check-in data
   * @param {string} checkInData.bookingId - Booking ID
   * @param {string} checkInData.guestName - Guest name
   * @param {number} checkInData.numberOfGuests - Number of guests
   * @returns {Promise<Object>} API response
   */
  async submitCheckIn(checkInData) {
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await apiClient.post("/check-ins", checkInData);
      // return response.data;

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, data: checkInData };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to submit check-in"
      );
    }
  },
};
