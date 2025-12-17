import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
  showImage?: boolean;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 8,
  showCheckbox = true,
  showImage = true 
}: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckbox && (
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
          )}
          {showImage && (
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
          )}
          {Array.from({ length: columns - (showCheckbox ? 1 : 0) - (showImage ? 1 : 0) }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {showCheckbox && (
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
            )}
            {showImage && (
              <TableCell>
                <Skeleton className="h-16 w-12 rounded" />
              </TableCell>
            )}
            {Array.from({ length: columns - (showCheckbox ? 1 : 0) - (showImage ? 1 : 0) - 1 }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </TableCell>
            ))}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}