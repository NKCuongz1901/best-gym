import { FILTER_PACKAGE_PROPS, FILTER_PROPS } from '../types/filters';
import {
  BranchesResponse,
  CreatePackageRequest,
  CreatePackageResponse,
  MyPurchasePackagesResponse,
  PackagesResponse,
  PtAccountsResponse,
  PurchasePackageRequest,
  PurchasePackageResponse,
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
