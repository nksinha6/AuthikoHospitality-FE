import "./Loader.css";

export default function Loader() {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="loader__spinner">
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
        </div>
        <p className="loader__text">Loading...</p>
      </div>
    </div>
  );
}

