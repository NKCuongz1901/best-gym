export interface FILTER_PROPS {
  page?: number;
  itemsPerPage?: number;
  search?: string;
}
export interface FILTER_PACKAGE_PROPS {
  page?: number;
  itemsPerPage?: number;
  unit?: 'DAY' | 'MONTH';
  /** Khi gửi `false`, BE chỉ trả gói đã ngưng hoạt động. Bỏ qua = mặc định chỉ gói đang hoạt động. */
  isActive?: boolean;
}

export interface FILTER_PT_ASSIST_SCHEDULE_PROPS {
  from?: string;
  to?: string;
}

export interface FILTER_ADMIN_USER_PACKAGES_PROPS {
  accountId?: string;
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  branchId?: string;
  packageId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  itemsPerPage?: number;
}
