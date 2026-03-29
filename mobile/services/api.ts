import { FILTER_PROPS } from "@/types/filters";
import {
  CheckInHistoryResponse,
  CheckInRequest,
  CheckInResponse,
  CreatePtAssistRequest,
  CreatePtAssistRequestResponse,
  ExerciseDetailResponse,
  ExercisesResponse,
  MyPurchasePackagesResponse,
  ProgramsResponse,
} from "@/types/types";
import axios from "./axios.customize";
import { API } from "./constant";

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

export const getMyPurchasePackages = async (): Promise<any> => {
  const res = await axios.get<MyPurchasePackagesResponse>(
    API.USER.GET_PURCHASE_PACKAGE,
  );
  return res;
};

export const checkIn = async (request: CheckInRequest): Promise<any> => {
  const res = await axios.post<CheckInResponse>(API.USER.CHECK_IN, request);
  return res;
};

export const getCheckInHistory = async (): Promise<any> => {
  const res = await axios.get<CheckInHistoryResponse>(
    API.USER.GET_CHECK_IN_HISTORY,
  );
  return res as unknown as CheckInHistoryResponse;
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

export const createPtAssistRequest = async (
  request: CreatePtAssistRequest,
): Promise<CreatePtAssistRequestResponse> => {
  const res = await axios.post<CreatePtAssistRequestResponse>(
    API.USER.CREATE_REQUEST_PT,
    request,
  );
  return res as unknown as CreatePtAssistRequestResponse;
};
