export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  data: T[];
  message: string;
  statusCode: number;
  meta: PaginationMeta;

  constructor(
    data: T[],
    message: string,
    statusCode: number,
    meta: PaginationMeta,
  ) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.meta = meta;
  }

  static of<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string,
    statusCode: number,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, message, statusCode, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }
}
