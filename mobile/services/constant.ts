export interface API_PROPS {
  AUTHENTICATION: {
    SIGN_IN: string;
    PROFILE: string;
  };
  USER: {
    PURCHASE_PACKAGE: string;
    GET_PURCHASE_PACKAGE: string;
    GET_CHECK_IN_HISTORY: string;
    CHECK_IN: string;
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
}

export const API: API_PROPS = {
  AUTHENTICATION: {
    SIGN_IN: "/auth/sign-in",
    PROFILE: "/auth/profile",
  },
  USER: {
    PURCHASE_PACKAGE: "/user-package/purchase",
    GET_PURCHASE_PACKAGE: "/user-package/my-packages",
    GET_CHECK_IN_HISTORY: "/user-package/checkins/grouped",
    CHECK_IN: "/user-package/checkin",
  },
  PACKAGE: {
    GET_ALL: "/package",
  },
  PT: {
    GET_ALL: "/account/pt-accounts",
    GET_REQUESTS_LIST: "/pt/requested-packages",
    GET_ACCEPTED_REQUESTS_LIST: "/pt/accepted-packages",
    APPROVE_REQUEST: (requestId: string) => `/pt/accepted-request/${requestId}`,
    REJECT_REQUEST: (requestId: string) => `/pt/rejected-request/${requestId}`,
  },
  BRANCH: {
    GET_ALL: "/branch",
  },
  ADMIN: {
    GET_ACCOUNT_USER: "/account/user-accounts",
    CREATE_PACKAGE: "/package",
  },
};
