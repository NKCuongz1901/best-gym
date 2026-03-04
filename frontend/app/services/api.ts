import { FILTER_PROPS } from '../types/filters';
import { PtAccountsResponse, UserAccountsResponse } from '../types/types';
import axios from './axios.customize';
import { API } from './constant';

export const getPackages = async () => {
  const response = await axios.get(API.PACKAGE.GET_ALL);
  return response.data;
};

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
