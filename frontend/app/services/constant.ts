export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
  };
  PACKAGE: {
    GET_ALL: string;
  };
  PT: {
    GET_ALL: string;
  };
  BRANCH: {
    GET_ALL: string;
  };
  ADMIN: {
    GET_ACCOUNT_USER: string;
    CREATE_PACKAGE: string;
  };
}

export const API: API_PROPS = {
  AUTHENTICATION: {
    SIGN_IN: '/auth/sign-in',
    PROFILE: '/auth/profile',
  },
  USER: {
    PURCHASE_PACKAGE: '/user-package/purchase',
  },
  PACKAGE: {
    GET_ALL: '/package',
  },
  PT: {
    GET_ALL: '/account/pt-accounts',
  },
  BRANCH: {
    GET_ALL: '/branch',
  },
  ADMIN: {
    GET_ACCOUNT_USER: '/account/user-accounts',
    CREATE_PACKAGE: '/package',
  },
};
