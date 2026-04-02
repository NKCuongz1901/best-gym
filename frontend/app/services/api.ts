import {
  FILTER_PACKAGE_PROPS,
  FILTER_PROPS,
  FILTER_PT_ASSIST_SCHEDULE_PROPS,
} from '../types/filters';
import {
  AcceptedTraineeRequestsResponse,
  AcceptPTAssistRequestResponse,
  ApproveTraineeRequestRequest,
  ApproveTraineeRequestResponse,
  AssignProgramToUserRequest,
  AssignProgramToUserResponse,
  BranchDetailResponse,
  BranchesResponse,
  CheckInHistoryResponse,
  CreateBranchRequest,
  CreateBranchResponse,
  CreateExerciseRequest,
  CreateExerciseResponse,
  CreatePackageRequest,
  CreatePackageResponse,
  CreateProgramDayExerciseRequest,
  CreateProgramDayExerciseResponse,
  CreateProgramDayRequest,
  CreateProgramDayResponse,
  CreateProgramResponse,
  DeleteBranchResponse,
  ExerciseDetailResponse,
  ExercisesResponse,
  MyPurchasePackagesResponse,
  PackagesResponse,
  ProgramRequest,
  ProgramsResponse,
  PtAccountsResponse,
  PTAssistRequestsResponse,
  PTAssistSchedulesResponse,
  PTTrainingHistoriesResponse,
  PurchasePackageRequest,
  PurchasePackageResponse,
  RejectPTAssistRequestResponse,
  RejectTraineeRequestRequest,
  RejectTraineeRequestResponse,
  ReportUserSessionRequest,
  ReportUserSessionResponse,
  TraineeRequestsResponse,
  UpdateBranchResponse,
  UserAccountsResponse,
} from '../types/types';
import axios from './axios.customize';
import { API } from './constant';

export const signin = async (
  email: string,
  password: string,
): Promise<{ access_token: string }> => {
  const res = await axios.post(API.AUTHENTICATION.SIGN_IN, {
    email,
    password,
  });
  return res as unknown as { access_token: string };
};

export const getMe = async (): Promise<{
  userId: string;
  role: string;
  email: string;
}> => {
  const res = await axios.get(API.AUTHENTICATION.PROFILE);
  return res as unknown as { userId: string; role: string; email: string };
};

export const getAccountUser = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<UserAccountsResponse>(
    API.ADMIN.GET_ACCOUNT_USER,
    {
      params: {
        page: filter.page,
        itemsPerPage: filter.itemsPerPage,
        search: filter.search,
      },
    },
  );
  return res;
};

export const getPtAccounts = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<PtAccountsResponse>(API.PT.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const getPackages = async (
  filter: FILTER_PACKAGE_PROPS,
): Promise<any> => {
  const res = await axios.get<PackagesResponse>(API.PACKAGE.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      unit: filter.unit,
    },
  });
  return res;
};

export const createPackage = async (
  request: CreatePackageRequest,
): Promise<any> => {
  const res = await axios.post<CreatePackageResponse>(
    API.ADMIN.CREATE_PACKAGE,
    request,
  );
  return res;
};

export const getBranches = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<BranchesResponse>(API.BRANCH.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const purchasePackage = async (
  request: PurchasePackageRequest,
): Promise<any> => {
  const res = await axios.post<PurchasePackageResponse>(
    API.USER.PURCHASE_PACKAGE,
    request,
  );
  return res;
};

export const getMyPurchasePackages = async (): Promise<any> => {
  const res = await axios.get<MyPurchasePackagesResponse>(
    API.USER.GET_PURCHASE_PACKAGE,
  );
  return res;
};

export const getTraineeRequests = async (): Promise<any> => {
  const res = await axios.get<TraineeRequestsResponse>(
    API.PT.GET_REQUESTS_LIST,
  );
  return res;
};

export const getAcceptedTraineeRequests = async (): Promise<any> => {
  const res = await axios.get<AcceptedTraineeRequestsResponse>(
    API.PT.GET_ACCEPTED_REQUESTS_LIST,
  );
  return res;
};

export const approveTraineeRequest = async (
  request: ApproveTraineeRequestRequest,
): Promise<any> => {
  const res = await axios.post<ApproveTraineeRequestResponse>(
    API.PT.APPROVE_REQUEST(request.requestId),
    request,
  );
  return res;
};

export const rejectTraineeRequest = async (
  request: RejectTraineeRequestRequest,
): Promise<any> => {
  const res = await axios.post<RejectTraineeRequestResponse>(
    API.PT.REJECT_REQUEST(request.requestId),
    request,
  );
  return res;
};

export const getExercises = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<ExercisesResponse>(API.EXERCISE.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const getExerciseById = async (exerciseId: string): Promise<any> => {
  const res = await axios.get<ExerciseDetailResponse>(
    API.EXERCISE.GET_BY_ID(exerciseId),
  );
  return res;
};

export const createProgram = async (request: ProgramRequest): Promise<any> => {
  const res = await axios.post<CreateProgramResponse>(
    API.PROGRAM.CREATE_PROGRAM,
    request,
  );
  return res;
};

export const createProgramDay = async (
  request: CreateProgramDayRequest,
): Promise<any> => {
  const res = await axios.post<CreateProgramDayResponse>(
    API.PROGRAM.CREATE_PROGRAM_DAY(request.programId),
    request,
  );
  return res;
};

export const createProgramDayExercise = async (
  request: CreateProgramDayExerciseRequest,
): Promise<any> => {
  const res = await axios.post<CreateProgramDayExerciseResponse>(
    API.PROGRAM.CREATE_PROGRAM_DAY_EXERCISE(request.programId, request.dayId),
    request,
  );
  return res;
};

export const getPrograms = async (filter: FILTER_PROPS): Promise<any> => {
  const res = await axios.get<ProgramsResponse>(API.PROGRAM.GET_ALL, {
    params: {
      page: filter.page,
      itemsPerPage: filter.itemsPerPage,
      search: filter.search,
    },
  });
  return res;
};

export const getCheckInHistory = async (): Promise<any> => {
  const res = await axios.get<CheckInHistoryResponse>(
    API.USER.GET_CHECK_IN_HISTORY,
  );
  return res as unknown as CheckInHistoryResponse;
};

export const getPTTrainingHistory = async (params?: {
  from?: string;
  to?: string;
}): Promise<any> => {
  const res = await axios.get<PTTrainingHistoriesResponse>(
    API.USER.GET_PT_TRAINING_HISTORY,
    { params },
  );
  return res as unknown as PTTrainingHistoriesResponse;
};

export const getPTAssistRequests = async (): Promise<any> => {
  const res = await axios.get<PTAssistRequestsResponse>(
    API.PT.GET_ASSIST_REQUEST,
  );
  return res;
};

export const acceptPTAssistRequest = async (
  requestId: string,
): Promise<any> => {
  const res = await axios.post<AcceptPTAssistRequestResponse>(
    API.PT.ACCEPT_ASSIST_REQUEST(requestId),
  );
  return res;
};

export const rejectPTAssistRequest = async (
  requestId: string,
): Promise<any> => {
  const res = await axios.post<RejectPTAssistRequestResponse>(
    API.PT.REJECT_ASSIST_REQUEST(requestId),
  );
  return res;
};

export const getPTAssistSchedule = async (
  filter: FILTER_PT_ASSIST_SCHEDULE_PROPS,
): Promise<any> => {
  const res = await axios.get<PTAssistSchedulesResponse>(API.PT.GET_SCHEDULE, {
    params: {
      from: filter.from,
      to: filter.to,
    },
  });
  return res;
};

export const createBranch = async (
  request: CreateBranchRequest,
): Promise<any> => {
  const res = await axios.post<CreateBranchResponse>(
    API.BRANCH.CREATE_BRANCH,
    request,
  );
  return res;
};

export const updateBranch = async (
  branchId: string,
  request: CreateBranchRequest,
): Promise<any> => {
  const res = await axios.put<UpdateBranchResponse>(
    API.BRANCH.UPDATE_BRANCH(branchId),
    request,
  );
  return res;
};

export const deleteBranch = async (branchId: string): Promise<any> => {
  const res = await axios.delete<DeleteBranchResponse>(
    API.BRANCH.DELETE_BRANCH(branchId),
  );
  return res;
};

export const getBranchById = async (branchId: string): Promise<any> => {
  const res = await axios.get<BranchDetailResponse>(
    API.BRANCH.GET_BY_ID(branchId),
  );
  return res;
};

export const createExercise = async (
  request: CreateExerciseRequest,
): Promise<any> => {
  const res = await axios.post<CreateExerciseResponse>(
    API.EXERCISE.CREATE_EXERCISE,
    request,
  );
  return res;
};

export const assignProgramToUser = async (
  request: AssignProgramToUserRequest,
): Promise<any> => {
  const res = await axios.post<AssignProgramToUserResponse>(
    API.PT.ASSIGN_PROGRAM_TO_USER(),
    request,
  );
  return res;
};

export const reportUserSession = async (
  request: ReportUserSessionRequest,
): Promise<any> => {
  const res = await axios.post<ReportUserSessionResponse>(
    API.PT.REPORT_USER_SESSION(),
    request,
  );
  return res;
};
