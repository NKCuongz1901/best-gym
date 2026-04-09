export const appRoute = {
  admin: {
    root: '/admin',
    users: '/admin/user',
    package: '/admin/package',
    pt: '/admin/Pt',
    exercise: '/admin/exercise',
    program: '/admin/program',
    branch: '/admin/branch',
  },
  user: {
    root: '/my-packages',
  },
  home: {
    root: '/',
    packages: '/packages',
    profile: '/profile',
    programLearn: (programId: string) => `/programs/${programId}/learn`,
  },
  pt: {
    root: '/pt',
    trainee: '/pt/trainee',
  },
};
