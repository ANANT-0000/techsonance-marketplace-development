'use client';

import { useState } from "react";
import { updateProductVariantStatus } from "@/utils/vendorApiClient"; // adjust import to your actual API util
import { ProductVariantStatus } from "@/utils/Types";
import { authToken } from "@/utils/authToken";
import toast, { Toaster } from "react-hot-toast";
import { STATUS_CONFIRMATION_MODAL_TEXT } from "@/constants/commonText";
import { motion, AnimatePresence } from "framer-motion";

interface StatusToggleProps {
    productVariantId: string;
    vendorId: string;
    initialStatus: string;
}

export const StatusConfirmationModal = ({ onConfirm, onCancel, isActive }: { onConfirm: () => void; onCancel: () => void; isActive: boolean }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md"
            onClick={() => onCancel()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-slate-100 w-full max-w-sm mx-4 p-8 flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${isActive ? "bg-red-50 text-red-500 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                    {isActive ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h3 className="text-theme-h6 font-semibold text-slate-800 tracking-tight">
                        {isActive ? STATUS_CONFIRMATION_MODAL_TEXT.DEACTIVATE_PRODUCT : STATUS_CONFIRMATION_MODAL_TEXT.ACTIVATE_PRODUCT}
                    </h3>
                    <p className="text-theme-body-sm text-slate-500 leading-relaxed">
                        {isActive
                            ? STATUS_CONFIRMATION_MODAL_TEXT.DEACTIVATE_DESCRIPTION
                            : STATUS_CONFIRMATION_MODAL_TEXT.ACTIVATE_DESCRIPTION}
                    </p>
                </div>

                {/* Status change preview */}
                <div className="flex items-center justify-center gap-4 bg-slate-50/80 rounded-2xl py-3 px-4 border border-slate-100">
                    <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-theme-tiny font-semibold tracking-wide uppercase border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {isActive ? STATUS_CONFIRMATION_MODAL_TEXT.ACTIVE : STATUS_CONFIRMATION_MODAL_TEXT.INACTIVE}
                    </span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-theme-tiny font-semibold tracking-wide uppercase border ${!isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {isActive ? STATUS_CONFIRMATION_MODAL_TEXT.INACTIVE : STATUS_CONFIRMATION_MODAL_TEXT.ACTIVE}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => onCancel()}
                        className="flex-1 text-theme-body-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 border border-slate-200 py-3 rounded-xl transition-all duration-200 ease-out active:scale-[0.98]"
                    >
                        {STATUS_CONFIRMATION_MODAL_TEXT.CANCEL}
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className={`flex-1 text-theme-body-sm font-semibold text-white py-3 rounded-xl transition-all duration-200 ease-out active:scale-[0.98] shadow-sm ${isActive
                            ? "bg-slate-800 hover:bg-slate-900 shadow-slate-900/10"
                            : "bg-slate-800 hover:bg-slate-900 shadow-slate-900/10"
                            }`}
                    >
                        {isActive ? STATUS_CONFIRMATION_MODAL_TEXT.YES_DEACTIVATE : STATUS_CONFIRMATION_MODAL_TEXT.YES_ACTIVATE}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}