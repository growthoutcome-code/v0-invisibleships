"use client";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

/** Numbered pages, shared by the journal feed and the concept tiles. `onGo`
 *  runs after the page changes (the journal scrolls to the top, Concepts to its
 *  list). */
export default function Pager({ page, totalPages, setPage, onGo }: {
  page: number; totalPages: number; setPage: (n: number) => void; onGo?: () => void;
}) {
  const nums: number[] = [];
  const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) nums.push(i);
  const go = (p: number) => {
    setPage(Math.min(totalPages, Math.max(1, p)));
    if (onGo) onGo(); else window.scrollTo({ top: 0 });
  };
  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => go(page - 1)} disabled={page === 1} className="disabled:opacity-40" />
        </PaginationItem>
        {nums[0] > 1 && <PaginationItem><PaginationLink onClick={() => go(1)}>1</PaginationLink></PaginationItem>}
        {nums[0] > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {nums.map((n) => (
          <PaginationItem key={n}>
            <PaginationLink isActive={n === page} onClick={() => go(n)}>{n}</PaginationLink>
          </PaginationItem>
        ))}
        {nums[nums.length - 1] < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {nums[nums.length - 1] < totalPages && <PaginationItem><PaginationLink onClick={() => go(totalPages)}>{totalPages}</PaginationLink></PaginationItem>}
        <PaginationItem>
          <PaginationNext onClick={() => go(page + 1)} disabled={page === totalPages} className="disabled:opacity-40" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
