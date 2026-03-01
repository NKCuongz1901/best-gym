import axios from "./axios.customize";

export const getPackages = async () => {
  const response = await axios.get("/package");
  return response.data;
};

/** Returns { access_token } - axios interceptor unwraps response.data */
export const signin = async (
  email: string,
  password: string
): Promise<{ access_token: string }> => {
  const res = await axios.post("/auth/sign-in", { email, password });
  return res as unknown as { access_token: string };
};

/** Returns { userId, role, email } - axios interceptor unwraps response.data */
export const getMe = async (): Promise<{
  userId: string;
  role: string;
  email: string;
}> => {
  const res = await axios.get("/auth/profile");
  return res as unknown as { userId: string; role: string; email: string };
};
