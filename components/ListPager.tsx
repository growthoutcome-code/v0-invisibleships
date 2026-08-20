"use client";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

/**
 * The site's one pagination control — extracted from the journal feed so the
 * Data section's source lists paginate identically. Renders a window of five
 * page numbers with first/last shortcuts and ellipses.
 *
 * `scrollTo` — where to return the viewport on page change. The journal goes
 * to the top of the page; long lists mid-page pass their section element so
 * the reader stays in context.
 */
export default function ListPager({
  page, totalPages, setPage, scrollTo,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  scrollTo?: () => void;
}) {
  const nums: number[] = [];
  const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) nums.push(i);
  const go = (p: number) => {
    setPage(Math.min(totalPages, Math.max(1, p)));
    if (scrollTo) scrollTo(); else window.scrollTo({ top: 0 });
  };
  if (totalPages <= 1) return null;
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
