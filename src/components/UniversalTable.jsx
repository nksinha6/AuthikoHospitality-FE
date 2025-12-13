import React, { memo } from "react";
import PropTypes from "prop-types";
import "./UniversalTable.css";

const UniversalTable = memo(
  ({
    columns = [],
    data = [],
    format = {},
    actions = null,
    emptyMessage = "No data found.",
  }) => {
    return (
      <div className="table-wrapper">
        <table className="universal-table" role="table">
          <thead>
            <tr role="row">
              {columns.map((col) => (
                <th key={col.key} role="columnheader">
                  {col.label}
                </th>
              ))}
              {actions && <th role="columnheader">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr role="row">
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="empty-row"
                  role="cell"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowKey = row.id || row.bookingId || i;
                return (
                  <tr key={rowKey} role="row">
                    {columns.map((col) => {
                      const rawValue = row[col.key];
                      const formatter = format[col.key];
                      let cellValue;
                      try {
                        cellValue = formatter
                          ? formatter(rawValue, row)
                          : rawValue;
                      } catch (error) {
                        console.error(
                          `Error formatting column ${col.key}:`,
                          error
                        );
                        cellValue = rawValue;
                      }

                      return (
                        <td key={col.key} role="cell">
                          {cellValue}
                        </td>
                      );
                    })}

                    {actions && <td role="cell">{actions(row)}</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

UniversalTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  data: PropTypes.arrayOf(PropTypes.object),
  format: PropTypes.objectOf(PropTypes.func),
  actions: PropTypes.func,
  emptyMessage: PropTypes.string,
};

UniversalTable.defaultProps = {
  columns: [],
  data: [],
  format: {},
  actions: null,
  emptyMessage: "No data found.",
};

UniversalTable.displayName = "UniversalTable";

export default UniversalTable;
