export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
    GET_PURCHASE_PACKAGE: string;
    GET_CHECK_IN_HISTORY: string;
  };
  PACKAGE: {
    GET_ALL: string;
  };
  PT: {
    GET_ALL: string;
    GET_REQUESTS_LIST: string;
    GET_ACCEPTED_REQUESTS_LIST: string;
    APPROVE_REQUEST: (requestId: string) => string;
    REJECT_REQUEST: (requestId: string) => string;
    GET_ASSIST_REQUEST: string;
    ACCEPT_ASSIST_REQUEST: (requestId: string) => string;
    REJECT_ASSIST_REQUEST: (requestId: string) => string;
    GET_SCHEDULE: string;
    ASSIGN_PROGRAM_TO_USER: () => string;
  };
  BRANCH: {
    GET_ALL: string;
    GET_BY_ID: (branchId: string) => string;
    CREATE_BRANCH: string;
    UPDATE_BRANCH: (branchId: string) => string;
    DELETE_BRANCH: (branchId: string) => string;
  };
  ADMIN: {
    GET_ACCOUNT_USER: string;
    CREATE_PACKAGE: string;
  };
  EXERCISE: {
    GET_ALL: string;
    GET_BY_ID: (exerciseId: string) => string;
    CREATE_EXERCISE: string;
  };
  PROGRAM: {
    GET_ALL: string;
    CREATE_PROGRAM: string;
    CREATE_PROGRAM_DAY: (programId: string) => string;
    CREATE_PROGRAM_DAY_EXERCISE: (programId: string, dayId: string) => string;
  };
}

export const API: API_PROPS = {
  AUTHENTICATION: {
    SIGN_IN: '/auth/sign-in',
    PROFILE: '/auth/profile',
  },
  USER: {
    PURCHASE_PACKAGE: '/user-package/purchase',
    GET_PURCHASE_PACKAGE: '/user-package/my-packages',
    GET_CHECK_IN_HISTORY: '/user-package/checkins/grouped',
  },
  PACKAGE: {
    GET_ALL: '/package',
  },
  PT: {
    GET_ALL: '/account/pt-accounts',
    GET_REQUESTS_LIST: '/pt/requested-packages',
    GET_ACCEPTED_REQUESTS_LIST: '/pt/accepted-packages',
    APPROVE_REQUEST: (requestId: string) => `/pt/accepted-request/${requestId}`,
    REJECT_REQUEST: (requestId: string) => `/pt/rejected-request/${requestId}`,
    GET_ASSIST_REQUEST: '/pt/pt-assist-requests',
    ACCEPT_ASSIST_REQUEST: (requestId: string) =>
      `/pt/pt-assist-requests/${requestId}/accept`,
    REJECT_ASSIST_REQUEST: (requestId: string) =>
      `/pt/pt-assist-requests/${requestId}/reject`,
    GET_SCHEDULE: '/pt/assist-schedule',
    ASSIGN_PROGRAM_TO_USER: () => `/pt/assign-program-to-user`,
  },
  BRANCH: {
    GET_ALL: '/branch',
    GET_BY_ID: (branchId: string) => `/branch/${branchId}`,
    CREATE_BRANCH: '/branch',
    UPDATE_BRANCH: (branchId: string) => `/branch/${branchId}`,
    DELETE_BRANCH: (branchId: string) => `/branch/${branchId}`,
  },
  ADMIN: {
    GET_ACCOUNT_USER: '/account/user-accounts',
    CREATE_PACKAGE: '/package',
  },
  EXERCISE: {
    GET_ALL: '/exercise',
    GET_BY_ID: (exerciseId: string) => `/exercise/${exerciseId}`,
    CREATE_EXERCISE: '/exercise',
  },
  PROGRAM: {
    GET_ALL: '/program',
    CREATE_PROGRAM: '/program',
    CREATE_PROGRAM_DAY: (programId: string) => `/program/${programId}/days`,
    CREATE_PROGRAM_DAY_EXERCISE: (programId: string, dayId: string) =>
      `/program/${programId}/days/${dayId}/exercises`,
  },
};
