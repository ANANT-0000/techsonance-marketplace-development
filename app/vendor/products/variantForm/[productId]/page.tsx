"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import { ProductVariantForm } from "@/components/vendor/ProductVariantForm";
import { BASE_API_URL } from "@/constants";
import { authToken } from "@/utils/authToken";
import { fetchProduct } from "@/utils/commonAPiClient";
import { fetchVendorWarehouse } from "@/utils/vendorApiClient";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useVendorSession } from "@/hooks/useVendorSession";
import { VEDNOR_LOGIN_PATH, VEDNOR_REGISTER_PATH } from "@/constants";
import { SessionErrorCard } from "@/components/vendor/SessionErrorCard";

const fetchProductMainDetails = async ({
  productId,
  setProductDetails,
  token,
}: {
  productId: string;
  setProductDetails: (productDetails: {
    id: string;
    name: string;
    category: { id: string; name: string };
  }) => void;
  token: string;
}) => {
  const response = await fetch(
    `${BASE_API_URL}products/main-details/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
    .then((res) => res.json())
    .catch((error) => {
      return null;
    });
  setProductDetails(response?.data || null);
};

const getWarehouseOptions = async ({
  setWarehouseOptions,
  token,
  companyId,
}: {
  setWarehouseOptions: (
    warehouseOptions: { value: string; label: string }[],
  ) => void;
  token: string;
  companyId: string;
}) => {
  await fetchVendorWarehouse(token, companyId)
    .then((res) => {
      setWarehouseOptions(
        res.data.map((w: any) => ({ value: w.id, label: w.warehouse_name })),
      );
    })
    .catch((error) => {
      return [];
    });
};

import { useAppSelector } from "@/hooks/reduxHooks";

export default function ProductVariantFormPage() {
  const { companyId, token, isMounted } = useVendorSession();

  const { productId } = useParams<{ productId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const vendorId = (user && "vendor_id" in user ? user.vendor_id : "") ?? "";
  const [warehouseOptions, setWarehouseOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [productDetails, setProductDetails] = useState<{
    id: string;
    name: string;
    category: { id: string; name: string };
  } | null>(null);
  useEffect(() => {
    if (token && companyId) {
      fetchProductMainDetails({ productId, setProductDetails, token });
      getWarehouseOptions({ setWarehouseOptions, token, companyId });
    }
  }, [token, companyId, productId]);

  if (!isMounted) return null;

  if (!token || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/30">
        <SessionErrorCard />
      </div>
    );
  }

  return (
    <main className="min-h-screen max-h-screen overflow-y-scroll overflow-x-hidden max-w-[100vw] py-8 px-4 w-full mx-auto bg-slate-50/30">
      <ProductVariantForm
        companyId={companyId}
        token={token}
        vendorId={vendorId}
        productDetails={
          productDetails ?? {
            id: "",
            name: "",
            category: { id: "", name: "" },
          }
        }
        productId={productId}
        warehouseOptions={warehouseOptions}
      />
    </main>
  );
}
