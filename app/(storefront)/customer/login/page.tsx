"use client";

import { Suspense } from "react";
import { CUSTOMER_LOGIN_POSTER } from "@/constants/common";
import Image from "next/image";
import CustomerLoginForm from "@/components/customer/CustomerLoginForm";
import { motion } from "framer-motion";

function CustomerLoginWrapper() {
  return (
    <main className="w-full flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden max-w-4xl w-full"
      >
        {/* Poster Image */}
        <div className="hidden md:block relative md:w-5/12 lg:w-1/2">
          <Image
            src={CUSTOMER_LOGIN_POSTER}
            alt="Login"
            className="h-full w-full object-cover"
            loading="eager"
            width={1920}
            height={1080}
            priority
            quality={100}
          />
        </div>

        {/* Form Section */}
        <div className="flex flex-col px-6 py-10 lg:px-14 lg:py-12 justify-center md:w-7/12 lg:w-1/2">
          <CustomerLoginForm />
        </div>
      </motion.div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <CustomerLoginWrapper />
    </Suspense>
  );
}
