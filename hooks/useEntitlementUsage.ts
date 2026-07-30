import { useQuery } from "@tanstack/react-query";
import AxiosAPI from "@/lib/axios";

export interface EntitlementUsageData {
  limitValue: number | null;
  isUnlimited: boolean;
  used: number;
}

export function useEntitlementUsage(featureKey: string, companyId?: string) {
  const { data, isLoading, refetch } = useQuery<EntitlementUsageData | null>({
    queryKey: ["entitlement", featureKey, companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // 1. Fetch entitlements mapping
      const meRes = await AxiosAPI.get(
        `/v1/entitlements/me?companyId=${companyId}`,
      );
      const entitlements = meRes.data?.entitlements || {};
      const entitlement = entitlements[featureKey];

      if (!entitlement) {
        return null; // Not even in plan
      }

      // 2. Fetch current usage
      const usageRes = await AxiosAPI.get(
        `/v1/entitlements/${companyId}/usage/${featureKey}`,
      );
      const used = usageRes.data?.used || 0;

      return {
        limitValue: entitlement.limitValue,
        isUnlimited: entitlement.isUnlimited,
        used,
      };
    },
    enabled: !!companyId && !!featureKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Opportunistic refetch
  });

  return { data: data || null, loading: isLoading, refetch };
}
