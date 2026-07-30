import { useState, useCallback, useEffect } from "react";
import AxiosAPI from "@/lib/axios";
import { AsyncStatus } from "@/utils/Types";

export interface FeatureDefinition {
  feature_key: string;
  display_name: string;
  description: string | null;
  value_type: "boolean" | "number" | "string";
  default_value: string | null;
  is_active: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureDefinitions() {
  const [featureDefinitions, setFeatureDefinitions] = useState<
    FeatureDefinition[]
  >([]);
  const [status, setStatus] = useState<AsyncStatus>(AsyncStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatureDefinitions = useCallback(async () => {
    setStatus(AsyncStatus.LOADING);
    setError(null);
    try {
      const res = await AxiosAPI.get(
        "/v1/admin/subscription-plans/feature-definitions",
      );
      const rows: FeatureDefinition[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setFeatureDefinitions(rows);
      setStatus(AsyncStatus.SUCCESS);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Couldn't load feature definitions.";
      setError(message);
      setStatus(AsyncStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchFeatureDefinitions();
  }, [fetchFeatureDefinitions]);

  return {
    featureDefinitions,
    status,
    error,
    refetch: fetchFeatureDefinitions,
  };
}
