export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
    GET_PURCHASE_PACKAGE: string;
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
  };
  BRANCH: {
    GET_ALL: string;
  };
  ADMIN: {
    GET_ACCOUNT_USER: string;
    CREATE_PACKAGE: string;
  };
  EXERCISE: {
    GET_ALL: string;
    GET_BY_ID: (exerciseId: string) => string;
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
  },
  BRANCH: {
    GET_ALL: '/branch',
  },
  ADMIN: {
    GET_ACCOUNT_USER: '/account/user-accounts',
    CREATE_PACKAGE: '/package',
  },
  EXERCISE: {
    GET_ALL: '/exercise',
    GET_BY_ID: (exerciseId: string) => `/exercise/${exerciseId}`,
  },
  PROGRAM: {
    GET_ALL: '/program',
    CREATE_PROGRAM: '/program',
    CREATE_PROGRAM_DAY: (programId: string) => `/program/${programId}/days`,
    CREATE_PROGRAM_DAY_EXERCISE: (programId: string, dayId: string) =>
      `/program/${programId}/days/${dayId}/exercises`,
  },
};
