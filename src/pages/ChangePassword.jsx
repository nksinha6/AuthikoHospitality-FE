import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UI_TEXT } from "../constants/ui.js";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showErrors, setShowErrors] = useState(false);
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

  const handleSave = (event) => {
    event.preventDefault();
    setShowErrors(true);

    if (!isFormValid) {
      return;
    }

    // TODO: implement save password logic
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
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition duration-150 ease-in-out focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter new password"
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition duration-150 ease-in-out focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Re-enter new password"
            />
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
              disabled={!isFormValid}
              className={`inline-flex items-center justify-center bg-brand px-3 py-2 rounded-lg text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 ${
                !isFormValid ? "hover:bg-brand" : ""
              }`}
            >
              Save new password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
