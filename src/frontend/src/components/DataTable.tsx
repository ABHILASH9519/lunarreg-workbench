import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  /** Column header label. */
  header: string;
  /** Accessor returning the cell content for a row. */
  cell: (row: T) => ReactNode;
  /** Optional className applied to the header cell. */
  headerClassName?: string;
  /** Optional className applied to each body cell. */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Optional row key accessor; falls back to index. */
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
}

/**
 * DataTable: a scientific data table wrapper with sticky headers and
 * right-aligned numeric cell support via column classNames.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.header}
                className={cn("px-3", col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const key = rowKey ? rowKey(row, index) : index;
            return (
              <TableRow key={key}>
                {columns.map((col) => (
                  <TableCell
                    key={col.header}
                    className={cn("px-3", col.cellClassName)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
