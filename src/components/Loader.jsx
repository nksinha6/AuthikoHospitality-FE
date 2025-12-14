import { UI_TEXT } from "../constants/ui.js";
import "./Loader.css";

export default function Loader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label={UI_TEXT.LOADER_TEXT}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2 items-center" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full bg-brand"
              style={{
                animation: `bounce 1.4s ease-in-out infinite both`,
                animationDelay: `${
                  index === 0 ? "-0.32s" : index === 1 ? "-0.16s" : "0s"
                }`,
              }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 font-medium tracking-wide">
          {UI_TEXT.LOADER_TEXT}
        </p>
      </div>
    </div>
  );
}
