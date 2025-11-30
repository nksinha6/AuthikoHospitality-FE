import { useEffect } from "react";
import { UI_TEXT } from "../constants/ui.js";
import CheckInForm from "../components/CheckInForm.jsx";
import { useSearch } from "../context/SearchContext.jsx";

export default function CheckIns() {
  const { setIsSearchEnabled } = useSearch();

  // Disable search when component mounts
  useEffect(() => {
    setIsSearchEnabled(false);
    return () => {
      setIsSearchEnabled(false);
    };
  }, [setIsSearchEnabled]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="h-page-title">{UI_TEXT.CHECK_INS_TITLE}</h1>
        <p className="text-muted page-subtitle">{UI_TEXT.CHECK_INS_SUBTITLE}</p>
      </div>

      <CheckInForm />
    </div>
  );
}
