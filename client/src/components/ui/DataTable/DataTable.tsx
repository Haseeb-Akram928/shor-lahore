import type { ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, getRowKey, isLoading = false, emptyMessage = 'No records found' }: DataTableProps<T>) {
  if (isLoading) {
    return <div className={styles.state}>Loading records...</div>;
  }

  if (rows.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
