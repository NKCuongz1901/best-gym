import { getMyPurchasePackages } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export const useMyPurchasePackages = () => {
  return useQuery({
    queryKey: ["my-purchase-packages"],
    queryFn: getMyPurchasePackages,
  });
};
