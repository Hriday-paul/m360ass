export const PaginateOptions = ["limit", "page", "sortOrder", "sortBy"];
export type TPaginationOptions = {
  limit?: number;
  page?: number;
  sortOrder?: string | undefined;
  sortBy?: string | undefined;
};

type IOptionResult = {
  page: number;
  skip: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
};

const calculatePagination = (option: TPaginationOptions): IOptionResult => {
  const page = Number(option.page) || 1;
  const limit = Number(option.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = option.sortBy || "createdAt";
  const sortOrder = option.sortOrder || "desc";

  return {
    page,
    skip,
    limit,
    sortBy,
    sortOrder,
  };
};

const calculatePaginationMetaData = (options: TPaginationOptions & { total: number }) => {
  const { page, limit, total } = options;
  const currentPage = page ? +page : 1;
  const skip = limit! * (currentPage - 1);
  const nextPage = skip + limit! > total ? null : currentPage + 1;
  const prevPage = skip === 0 ? null : currentPage - 1;

  return {
    skip,
    take: limit,
    total,
    currentPage,
    nextPage,
    prevPage,
  };
};

const generatePaginationMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) => {
  const totalPage = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPage,
  };
};

export const paginationHelper = {
  calculatePagination,
  generatePaginationMeta,
};
