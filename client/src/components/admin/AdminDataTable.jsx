import { displayValue } from './adminData.js'

function AdminDataTable({
  rows = [],
  columns = [],
  actions,
  emptyMessage = 'No records found.',
  rowKey,
}) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            {actions && <th scope="col" className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="py-5 text-center text-secondary"
                colSpan={columns.length + (actions ? 1 : 0)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={rowKey?.(row) || row._id || row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : displayValue(row[column.key])}
                </td>
              ))}
              {actions && <td className="text-end text-nowrap">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminDataTable
