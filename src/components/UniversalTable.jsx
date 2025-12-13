import React, { memo } from "react";
import PropTypes from "prop-types";

const UniversalTable = memo(
  ({
    columns = [],
    data = [],
    format = {},
    actions = null,
    emptyMessage = "No data found.",
  }) => {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse" role="table">
          <thead>
            <tr role="row" className="border-t border-b border-gray-200/65">
              {columns.map((col) => (
                <th
                  key={col.key}
                  role="columnheader"
                  className="px-2 py-3 text-left font-bold  text-xs text-gray-600 tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th
                  role="columnheader"
                  className="px-2 py-3 text-left font-bold  text-xs text-gray-600 tracking-wider"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr role="row">
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-2 py-8 text-center text-gray-500"
                  role="cell"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowKey = row.id || row.bookingId || i;
                return (
                  <tr
                    key={rowKey}
                    role="row"
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
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
                        <td
                          key={col.key}
                          role="cell"
                          className="px-2 py-3 text-sm text-gray-900"
                        >
                          {cellValue}
                        </td>
                      );
                    })}

                    {actions && (
                      <td
                        role="cell"
                        className="px-2 py-3 text-sm text-gray-900"
                      >
                        {actions(row)}
                      </td>
                    )}
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
