import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      <div className="flex items-center gap-4">
        <p className="text-xs text-zinc-500">
          Showing <span className="font-medium text-zinc-300">{startItem}</span> to <span className="font-medium text-zinc-300">{endItem}</span> of <span className="font-medium text-zinc-300">{totalItems}</span> results
        </p>
        
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
              }}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-8 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <span className="text-xs text-zinc-500 px-2 font-medium">
          Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || totalPages === 0}
          className="h-8 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
