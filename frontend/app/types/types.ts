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
  unit: 'DAY' | 'MONTH';
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
  unit: 'DAY' | 'MONTH';
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
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
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
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
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

export interface Exercise {
  id: string;
  name: string;
  description: string;
  content: string;
  muscleGroup: 'CHEST' | 'BACK' | 'ARMS' | 'LEGS' | 'ABS' | 'CORE' | 'CARDIO';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipments: string;
  thumbnail: string;
  videoUrl: string;
  suggestion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExercisesResponse {
  message: string;
  meta: PaginationMeta;
  data: Exercise[];
}

export interface ExerciseDetailResponse {
  message: string;
  data: Exercise;
}

export interface ProgramRequest {
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  daysPerWeek: number;
  thumbnail: string;
}

export interface CreateProgramDayRequest {
  programId: string;
  dayOfWeek: number;
  title: string;
  note: string;
}

export interface CreateProgramResponse {
  message: string;
  data: any;
}

export interface CreateProgramDayResponse {
  message: string;
  data: any;
}

export interface CreateProgramDayExerciseRequest {
  programId: string;
  dayId: string;
  exerciseId: string;
  sortOrder: number;
}

export interface CreateProgramDayExerciseResponse {
  message: string;
  data: any;
}

export type ProgramLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ProgramDayExercise {
  id: string;
  programDayId: string;
  exerciseId: string;
  sortOrder: number;
  createdAt: string;
  exercise: Exercise;
}

export interface ProgramDay {
  id: string;
  programId: string;
  dayOfWeek: number;
  title: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  exercises: ProgramDayExercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  level: ProgramLevel;
  daysPerWeek: number;
  isActive: boolean;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  days: ProgramDay[];
}

export interface ProgramsResponse {
  message: string;
  meta: PaginationMeta;
  data: Program[];
}

export interface CheckInHistoryItem {
  id: string;
  userPackageId: string;
  checkedInAt: string;
  branch: {
    id: string;
    name: string;
  };
}

export interface CheckInHistoryResponse {
  message: string;
  data: Record<string, CheckInHistoryItem[]>;
}

export interface PTAssistRequest {
  id: string;
  accountId: string;
  userPackageId: string;
  branchId: string;
  ptAccountId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  note: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  account: UserAccount;
  branch: Branch;
  userPackage: MyPurchasePackage;
}

export interface PTAssistRequestsResponse {
  message: string;
  data: PTAssistRequest[];
}

export interface AcceptPTAssistRequestResponse {
  message: string;
  data: any;
}

export interface RejectPTAssistRequestResponse {
  message: string;
  data: any;
}

export interface PTAssistSchedule {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    status: 'ACCEPTED' | 'REJECTED';
    note: string | null;
    rejectReason: string | null;
    account: UserAccount;
    branch: Branch;
    userPackage: MyPurchasePackage;
  };
}

export interface PTAssistSchedulesResponse {
  message: string;
  data: PTAssistSchedule[];
}
