"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import {
  fetchTaxProfiles,
  fetchTaxSlabOptions,
  fetchTaxSlabs,
  fetchVendorsProductsCategory,
  fetchVendorWarehouse,
} from "@/utils/vendorApiClient";
import { ProductForm } from "@/components/vendor/ProductForm";
import { authToken } from "@/utils/authToken";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/reduxHooks";
import { SessionErrorCard } from "@/components/vendor/SessionErrorCard";

const getWarehouseOptions = async (
  token: string,
  companyId: string,
  setWarehouseOptions: any,
) => {
  await fetchVendorWarehouse(token, companyId)
    .then((res) => {
      setWarehouseOptions(
        res.data.map((w: any) => ({ value: w.id, label: w.warehouse_name })),
      );
    })
    .catch((error) => {});
};
const getCategoryOptions = async (
  token: string,
  companyId: string,
  setCategoryOptions: any,
) => {
  await fetchVendorsProductsCategory(token, companyId)
    .then((res) => {
      setCategoryOptions(
        res.data.map((c: any) => ({ value: c.id, label: c.name })),
      );
    })
    .catch((error) => {});
};

const getTaxSlabsOptions = async (
  token: string,
  companyId: string,
  setTaxSlabsOptions: any,
) => {
  fetchTaxSlabOptions(token, companyId)
    .then((res) => {
      setTaxSlabsOptions(
        res.data.map((t: any) => ({
          value: t.id,
          label: t.slab_name,
        })),
      );
    })
    .catch((error) => {});
};
export default function ProductFormPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setCompanyId(getClientCompanyId());
    setToken(authToken());
    setIsMounted(true);
  }, []);

  const { user } = useAppSelector((state) => state.auth);
  const vendorId = (user && "vendor_id" in user ? user.vendor_id : "") ?? "";
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [warehouseOptions, setWarehouseOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [taxSlabsOptions, setTaxSlabsOptions] = useState<
    { value: string; label: string }[]
  >([]);
  useEffect(() => {
    if (token && companyId) {
      getWarehouseOptions(token, companyId, setWarehouseOptions);
      getCategoryOptions(token, companyId, setCategoryOptions);
      getTaxSlabsOptions(token, companyId, setTaxSlabsOptions);
    }
  }, [token, companyId]);

  if (!isMounted) return null;

  if (!token || !companyId) {
    return <SessionErrorCard />;
  }

  return (
    <main className="flex-1 w-full h-full overflow-y-auto px-4 sm:px-8 py-1 bg-[#fafafa]">
      <div className="mx-auto space-y-6 pt-4 pb-12">
        <ProductForm
          categoryOptions={categoryOptions}
          vendorId={vendorId}
          warehouseOptions={warehouseOptions}
          taxSlabsOptions={taxSlabsOptions}
        />
      </div>
    </main>
  );
}
