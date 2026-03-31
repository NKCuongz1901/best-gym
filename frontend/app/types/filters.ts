export interface FILTER_PROPS {
  page?: number;
  itemsPerPage?: number;
  search?: string;
}
export interface FILTER_PACKAGE_PROPS {
  page?: number;
  itemsPerPage?: number;
  unit?: 'DAY' | 'MONTH';
}

export interface FILTER_PT_ASSIST_SCHEDULE_PROPS {
  from?: string;
  to?: string;
}
