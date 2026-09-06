export type PaginationQuery = { page: number; limit: number };
export type Pagination = { page: number; limit: number; total: number; totalPages: number };

export const toSkip = ({ page, limit }: PaginationQuery): number => (page - 1) * limit;

export const buildPagination = ({ page, limit }: PaginationQuery, total: number): Pagination => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});
