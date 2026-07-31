import { useState, useEffect } from "react";
import { getClientCompanyId } from "@/utils/getCompanyId";
import { authToken } from "@/utils/authToken";

export function useVendorSession() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setCompanyId(getClientCompanyId());
    setToken(authToken());
    setIsMounted(true);
  }, []);

  return { companyId, token, isMounted };
}
