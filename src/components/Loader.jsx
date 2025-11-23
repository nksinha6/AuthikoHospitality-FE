import "./Loader.css";
import { UI_TEXT } from "../constants/ui.js";

export default function Loader() {
  return (
    <div className="loader-container" role="status" aria-live="polite" aria-label={UI_TEXT.LOADER_TEXT}>
      <div className="loader">
        <div className="loader__spinner" aria-hidden="true">
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
        </div>
        <p className="loader__text">{UI_TEXT.LOADER_TEXT}</p>
      </div>
    </div>
  );
}

