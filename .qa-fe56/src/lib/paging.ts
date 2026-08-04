/** Backend PagedResult — GET ?take=&skip= cavab formatı. */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface PageParams {
  take?: number;
  skip?: number;
}
