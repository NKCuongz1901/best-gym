import axios from "./axios.customize";

export const getPackages = async () => {
  const response = await axios.get("/package");
  return response.data;
};
