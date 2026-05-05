import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authService } from "../services/authService.js";
import { showToast } from "../utility/toast.js";
import { UI_TEXT } from "../constants/ui.js";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("At least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("At least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("At least one number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("At least one special character");
    }

    return errors;
  };

  const newPasswordErrors = validatePassword(newPassword);
  const confirmPasswordError =
    showErrors && confirmPassword && newPassword !== confirmPassword
      ? "Passwords do not match"
      : "";

  const isFormValid =
    newPasswordErrors.length === 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setShowErrors(true);

    if (confirmPassword && newPassword !== confirmPassword) {
      showToast("error", "Password and confirm password do not match.");
      return;
    }

    if (!isFormValid) {
      showToast("error", "Please fix password errors before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.persistPassword({
        userId: userData.userEmail || "",
        tenantId: userData.tenantId || "",
        password: newPassword,
      });
      setShowErrors(false);
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password changed successfully.");
    } catch (error) {
      showToast("error", error.message || "Could not change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-8">
      <div className="w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {UI_TEXT.BUTTON_CHANGE_PASSWORD}
          </h1>
          <p className="text-sm text-gray-600">
            Update your account password securely.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-2">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-24 text-sm text-gray-900 outline-none transition duration-150 ease-in-out focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand hover:text-brand/80"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={
                    showNewPassword
                      ? "ri-eye-off-line text-lg"
                      : "ri-eye-line text-lg"
                  }
                />
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-24 text-sm text-gray-900 outline-none transition duration-150 ease-in-out focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand hover:text-brand/80"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <i
                  className={
                    showConfirmPassword
                      ? "ri-eye-off-line text-lg"
                      : "ri-eye-line text-lg"
                  }
                />
              </button>
            </div>
            {showErrors && confirmPasswordError && (
              <p className="mt-2 text-sm text-red-600">
                {confirmPasswordError}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Note: 8+ chars with upper/lowercase, number, and symbol.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`inline-flex items-center justify-center bg-brand px-3 py-2 rounded-lg text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 ${
                !isFormValid || isSubmitting ? "hover:bg-brand" : ""
              }`}
            >
              {isSubmitting ? "Saving..." : "Save new password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
