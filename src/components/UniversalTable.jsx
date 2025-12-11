import React from "react";
import "./UniversalTable.css";

export default function UniversalTable({
  columns = [],
  data = [],
  format = {},
  actions = null,
  emptyMessage = "No data found.",
}) {
  return (
    <div className="table-wrapper">
      <table className="universal-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="empty-row"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  const rawValue = row[col.key];
                  const formatter = format[col.key];
                  const cellValue = formatter
                    ? formatter(rawValue, row)
                    : rawValue;

                  return <td key={col.key}>{cellValue}</td>;
                })}

                {actions && <td>{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
