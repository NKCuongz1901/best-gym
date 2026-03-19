export interface UserAccount {
  id: string;
  email: string;
  profile?: {
    name: string | null;
  };
}

export interface PtAccount {
  id: string;
  email: string;
  profile?: {
    name: string | null;
    gender: string;
    phone: string;
    dateOfBirth: string | null;
    avatar: string | null;
    height: number | null;
    weight: number | null;
    fitnessGoal: string | null;
  };
}

export interface PaginationMeta {
  page: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
}

export interface UserAccountsResponse {
  message: string;
  meta: PaginationMeta;
  data: UserAccount[];
}

export interface PtAccountsResponse {
  message: string;
  meta: PaginationMeta;
  data: PtAccount[];
}

export interface Package {
  id: string;
  name: string;
  unit: "DAY" | "MONTH";
  durationValue: number;
  hasPt: boolean;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagesResponse {
  message: string;
  meta: PaginationMeta;
  data: Package[];
}

export interface CreatePackageRequest {
  name: string;
  description: string;
  unit: "DAY" | "MONTH";
  durationValue: number;
  hasPt: boolean;
  price: number;
}

export interface CreatePackageResponse {
  message: string;
  data: Package;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchesResponse {
  message: string;
  meta: PaginationMeta;
  data: Branch[];
}

export interface PurchasePackageRequest {
  packageId: string;
  branchId: string;
  ptAccountId?: string;
}

export interface PurchasePackageResponse {
  message: string;
  data: Package;
}

export interface MyPurchasePackage {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REJECTED";
  startAt: string | null;
  endAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  package: Package;
  ptAccount: PtAccount | null;
}

export interface MyPurchasePackagesResponse {
  message: string;
  data: MyPurchasePackage[];
}

export interface TraineeRequest {
  id: string;
  accountId: string;
  packageId: string;
  branchId: string;
  ptAccountId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REJECTED";
  startAt: string | null;
  endAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  package: Package;
  account: UserAccount;
  branch: Branch;
}

export interface TraineeRequestsResponse {
  message: string;
  data: TraineeRequest[];
}

export interface ApproveTraineeRequestRequest {
  requestId: string;
}

export interface ApproveTraineeRequestResponse {
  message: string;
  data: TraineeRequest;
}

export interface RejectTraineeRequestRequest {
  requestId: string;
}

export interface RejectTraineeRequestResponse {
  message: string;
  data: TraineeRequest;
}

export interface AcceptedTraineeRequestsResponse {
  message: string;
  data: TraineeRequest[];
}

export interface CheckInRequest {
  userPackageId: string;
  branchId: string;
}

export interface CheckInResponse {
  message: string;
  data: any;
}
