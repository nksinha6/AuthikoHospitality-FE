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
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-b border-gray-200/65">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-3 text-left font-bold text-xs text-gray-600 tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-2 py-3 text-left font-bold text-xs text-gray-600 tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-2 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowKey =
                  row.id ?? (row.bookingId ? `${row.bookingId}_${i}` : i);
                const rowWithKey = { ...row, __rowKey: rowKey };
                return (
                  <tr
                    key={rowKey}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col) => {
                      const rawValue = rowWithKey[col.key];
                      const formatter = format[col.key];
                      let cellValue;
                      try {
                        cellValue = formatter
                          ? formatter(rawValue, rowWithKey)
                          : rawValue;
                      } catch (error) {
                        console.error(
                          `Error formatting column ${col.key}:`,
                          error,
                        );
                        cellValue = rawValue;
                      }

                      return (
                        <td
                          key={col.key}
                          className="px-2 py-3 text-sm text-gray-900"
                        >
                          {cellValue}
                        </td>
                      );
                    })}

                    {actions && (
                      <td className="px-2 py-3 text-sm text-gray-900">
                        {actions(rowWithKey)}
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
  },
);

UniversalTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  data: PropTypes.arrayOf(PropTypes.object),
  format: PropTypes.objectOf(PropTypes.func),
  actions: PropTypes.func,
  emptyMessage: PropTypes.string,
};

UniversalTable.displayName = "UniversalTable";

export default UniversalTable;
