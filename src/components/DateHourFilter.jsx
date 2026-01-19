import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { FiCornerUpLeft, FiX } from "react-icons/fi";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { DATE_CONDITIONS } from "../constants/ui";

import {
  DEFAULT_DATE_FILTER,
  sanitizeNumberInput,
  requiresTimeUnitInput,
  getFormattedFilterText,
} from "../utility/dateFilterUtils";

const DateHourFilter = ({ onApply }) => {
  const [condition, setCondition] = useState(DEFAULT_DATE_FILTER.condition);
  const [selectedDate, setSelectedDate] = useState(
    DEFAULT_DATE_FILTER.selectedDate
  );
  const [selectedDateOpen, setSelectedDateOpen] = useState(false);
  const [startDate, setStartDate] = useState(DEFAULT_DATE_FILTER.startDate);
  const [endDate, setEndDate] = useState(DEFAULT_DATE_FILTER.endDate);
  const [value, setValue] = useState(DEFAULT_DATE_FILTER.value);
  const [timeUnit, setTimeUnit] = useState(DEFAULT_DATE_FILTER.timeUnit);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const popupRef = useRef(null);
  const filterRef = useRef(null);

  const conditionOptions = Object.values(DATE_CONDITIONS);

  const timeUnitOptions = ["months", "days", "hours"];

  const togglePopup = useCallback(
    (e) => {
      e.stopPropagation();
      setIsPopupOpen(!isPopupOpen);
      setIsConditionDropdownOpen(false);
    },
    [isPopupOpen]
  );

  const handleConditionChange = useCallback((option) => {
    setCondition(option);
    setIsConditionDropdownOpen(false);
  }, []);

  const handleValueChange = useCallback((e) => {
    setValue(sanitizeNumberInput(e.target.value));
  }, []);

  const handleTimeUnitChange = useCallback((unit) => {
    setTimeUnit(unit);
  }, []);

  const handleApply = useCallback(() => {
    setIsFilterActive(true);
    setIsPopupOpen(false);

    if (onApply) {
      onApply({
        condition,
        selectedDate: dayjs(selectedDate),
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        value,
        timeUnit,
      });
    }
  }, [onApply, condition, selectedDate, startDate, endDate, value, timeUnit]);

  const handleClearFilter = useCallback(() => {
    setIsFilterActive(false);
    setCondition(DEFAULT_DATE_FILTER.condition);
    setSelectedDate(DEFAULT_DATE_FILTER.selectedDate);
    setStartDate(DEFAULT_DATE_FILTER.startDate);
    setEndDate(DEFAULT_DATE_FILTER.endDate);
    setValue(DEFAULT_DATE_FILTER.value);
    setTimeUnit(DEFAULT_DATE_FILTER.timeUnit);

    onApply(null);
  }, [onApply]);

  const formattedFilterText = useCallback(() => {
    return getFormattedFilterText({
      condition,
      value,
      timeUnit,
      startDate,
      endDate,
      selectedDate,
    });
  }, [condition, value, timeUnit, startDate, endDate, selectedDate]);

  // Click outside handler for both dropdowns and popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close condition dropdown if click is outside
      if (
        isConditionDropdownOpen &&
        !event.target.closest(".condition-dropdown-container")
      ) {
        setIsConditionDropdownOpen(false);
      }

      // Close popup if click is outside both popup and filter header
      if (
        isPopupOpen &&
        popupRef.current &&
        filterRef.current &&
        !popupRef.current.contains(event.target) &&
        !filterRef.current.contains(event.target)
      ) {
        setIsPopupOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isPopupOpen) {
        setIsPopupOpen(false);
      }
    });

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", (e) => {
        if (e.key === "Escape" && isPopupOpen) {
          setIsPopupOpen(false);
        }
      });
    };
  }, [isPopupOpen, isConditionDropdownOpen]);

  const showTimeUnitInput = requiresTimeUnitInput(condition);

  return (
    <div className="relative inline-block font-sans" ref={filterRef}>
      {/* TOP HEADER */}
      <div
        className={`flex items-center gap-2 w-48 h-8 px-2 py-1 border border-gray-300 rounded-full bg-white cursor-pointer select-none transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 ${
          isFilterActive ? "bg-blue-50" : ""
        } ${
          isPopupOpen
            ? "border-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
            : ""
        }`}
        onClick={togglePopup}
      >
        <span className="text-sm  text-gray-500 pl-2">Date filter</span>
        <span className="flex-1 ml-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-600">
          {isFilterActive ? formattedFilterText() : ""}
        </span>

        {/* Clear icon (only shown when filter is active) */}
        {isFilterActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilter();
            }}
            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Clear filter"
          >
            <FiX size={14} className="text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>

      {/* POPUP */}
      {isPopupOpen && (
        <div
          ref={popupRef}
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg min-w-72 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4">
            {/* HEADER */}
            <div className="flex flex-col gap-1 pb-3 border-b border-gray-200">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Filter by:
              </span>
              <span className="text-sm text-gray-900 font-semibold">
                evidence due by
              </span>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col gap-4">
              {/* CONDITION DROPDOWN */}
              <div className="relative w-full condition-dropdown-container">
                <div
                  className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConditionDropdownOpen(!isConditionDropdownOpen);
                  }}
                >
                  <span className="text-sm text-gray-900">{condition}</span>
                  <span className="text-xs text-gray-500">▼</span>
                </div>

                {isConditionDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                    {conditionOptions.map((opt) => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                          condition === opt
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-900 hover:bg-gray-100"
                        }`}
                        onClick={() => handleConditionChange(opt)}
                      >
                        {opt}
                        {condition === opt && (
                          <span className="float-right text-blue-600 font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INPUT SECTION */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {showTimeUnitInput ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="rotate-180">
                      <FiCornerUpLeft size={20} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        className="w-20 px-2 py-2 border border-gray-300 rounded  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={value}
                        onChange={handleValueChange}
                        placeholder="0"
                      />
                      <select
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=%22black%22 height=%2216%22 width=%2216%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M4 6l4 4 4-4z%22/></svg>')] bg-no-repeat bg-position-[right_10px_center] bg-size-[12px]"
                        value={timeUnit}
                        onChange={(e) => handleTimeUnitChange(e.target.value)}
                      >
                        {timeUnitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : condition === "is between" ? (
                  <div className="flex items-start gap-2">
                    <div className="rotate-180 pt-1">
                      <FiCornerUpLeft size={20} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <DatePicker
                        label=""
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        format="DD MMM YY"
                        open={startDateOpen}
                        onOpen={() => setStartDateOpen(true)}
                        onClose={() => setStartDateOpen(false)}
                        slots={{ openPickerIcon: () => null }}
                        slotProps={{
                          textField: {
                            size: "small",
                            placeholder: "DD MMM YY",
                            InputProps: {
                              endAdornment: null,
                              sx: {
                                fontSize: "14px",
                                "& input": {
                                  fontSize: "14px",
                                  padding: "8.5px 14px",
                                },
                              },
                            },

                            onClick: () => setStartDateOpen(true),
                            className: "w-32",
                            sx: {
                              "& .MuiInputBase-input": {
                                fontSize: "14px",
                              },
                            },
                          },
                        }}
                      />
                      <span className="text-sm text-gray-600">and</span>
                      <DatePicker
                        label=""
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        format="DD MMM YY"
                        open={endDateOpen}
                        onOpen={() => setEndDateOpen(true)}
                        onClose={() => setEndDateOpen(false)}
                        slots={{ openPickerIcon: () => null }}
                        slotProps={{
                          textField: {
                            size: "small",
                            placeholder: "DD MMM YY",
                            InputProps: {
                              endAdornment: null,
                              sx: {
                                fontSize: "14px",
                                "& input": {
                                  fontSize: "14px",
                                  padding: "8.5px 14px",
                                },
                              },
                            },
                            onClick: () => setEndDateOpen(true),
                            className: "w-32",
                            sx: {
                              "& .MuiInputBase-input": {
                                fontSize: "14px",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="rotate-180">
                      <FiCornerUpLeft size={20} className="text-blue-500" />
                    </div>

                    <DatePicker
                      label=""
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      format="DD MMM YY"
                      open={selectedDateOpen}
                      onOpen={() => setSelectedDateOpen(true)}
                      onClose={() => setSelectedDateOpen(false)}
                      slots={{ openPickerIcon: () => null }}
                      slotProps={{
                        textField: {
                          size: "small",
                          placeholder: "DD MMM YY",
                          InputProps: {
                            endAdornment: null,
                            sx: {
                              fontSize: "14px",
                              "& input": {
                                fontSize: "14px",
                                padding: "8.5px 14px",
                              },
                            },
                          },
                          onClick: () => setSelectedDateOpen(true),
                          className: "w-32",
                          sx: {
                            "& .MuiInputBase-input": {
                              fontSize: "14px",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </LocalizationProvider>

              {/* BUTTONS ROW */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                {/* Clear button (only shown when filter is active) */}
                {isFilterActive && (
                  <button
                    onClick={handleClearFilter}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FiX size={16} />
                    Clear
                  </button>
                )}

                {/* Apply button */}
                <button
                  onClick={handleApply}
                  className="ml-auto px-5 py-2 bg-brand text-white text-sm font-medium rounded hover:bg-brand/90 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DateHourFilter.propTypes = {
  onApply: PropTypes.func.isRequired,
};

export default DateHourFilter;
