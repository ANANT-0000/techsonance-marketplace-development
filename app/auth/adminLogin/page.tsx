"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/lib/features/auth/authSlice";
import { adminLogin } from "@/utils/authApiClient";
import { useRouter, notFound } from "next/navigation";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { User, VendorUser, UserRole } from "@/utils/Types";
import { isAdminDomainAllowed } from "@/lib/get-domain";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { AUTH_TEXT, IS_AUTHENTICATED_KEY } from "@/constants";
import { ADMIN_LOGIN_TEXT } from "@/constants";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

enum UiState {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}
enum StepStatus {
  PENDING = "pending",
  ACTIVE = "active",
  DONE = "done",
  FAILED = "failed",
}
type Step = { label: string; status: StepStatus };

export interface AdminLoginResponseData {
  user: Partial<User | VendorUser>;
  access_token: string;
  refresh_token: string;
  role: UserRole;
}

const INITIAL_STEPS: Step[] = [
  { label: ADMIN_LOGIN_TEXT.STEP_VALIDATING, status: StepStatus.PENDING },
  { label: ADMIN_LOGIN_TEXT.STEP_PERMISSIONS, status: StepStatus.PENDING },
  { label: ADMIN_LOGIN_TEXT.STEP_INITIALISING, status: StepStatus.PENDING },
];

export enum ActionType {
  SET_LOGIN_ID = "SET_LOGIN_ID",
  SET_LOGIN_PASS = "SET_LOGIN_PASS",
  SET_ERROR = "SET_ERROR",
  SET_UI_STATE = "SET_UI_STATE",
  UPDATE_STEP = "UPDATE_STEP",
  RESET_STEPS = "RESET_STEPS",
  SET_COUNTDOWN = "SET_COUNTDOWN",
  TOGGLE_SHOW_PASS = "TOGGLE_SHOW_PASS",
  SET_REDIRECT_PROGRESS = "SET_REDIRECT_PROGRESS",
  SET_STORAGE_BLOCKED = "SET_STORAGE_BLOCKED",
  RESET_ON_RETRY = "RESET_ON_RETRY",
}

export type Action =
  | { type: ActionType.SET_LOGIN_ID; payload: string | null }
  | { type: ActionType.SET_LOGIN_PASS; payload: string | null }
  | { type: ActionType.SET_ERROR; payload: string | null }
  | { type: ActionType.SET_UI_STATE; payload: UiState }
  | {
      type: ActionType.UPDATE_STEP;
      payload: { index: number; status: Step["status"] };
    }
  | { type: ActionType.RESET_STEPS }
  | { type: ActionType.SET_COUNTDOWN; payload: number }
  | { type: ActionType.TOGGLE_SHOW_PASS }
  | { type: ActionType.SET_REDIRECT_PROGRESS; payload: number }
  | { type: ActionType.SET_STORAGE_BLOCKED; payload: boolean }
  | { type: ActionType.RESET_ON_RETRY };

interface State {
  adminLoginID: string | null;
  adminLoginPass: string | null;
  error: string | null;
  uiState: UiState;
  steps: Step[];
  countdown: number;
  showPass: boolean;
  redirectProgress: number;
  storageBlocked: boolean;
}

const initialState: State = {
  adminLoginID: null,
  adminLoginPass: null,
  error: null,
  uiState: UiState.IDLE,
  steps: INITIAL_STEPS.map((s) => ({ ...s })),
  countdown: 3,
  showPass: false,
  redirectProgress: 100,
  storageBlocked: false,
};

function adminLoginReducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.SET_LOGIN_ID:
      return { ...state, adminLoginID: action.payload };
    case ActionType.SET_LOGIN_PASS:
      return { ...state, adminLoginPass: action.payload };
    case ActionType.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionType.SET_UI_STATE:
      return { ...state, uiState: action.payload };
    case ActionType.UPDATE_STEP:
      return {
        ...state,
        steps: state.steps.map((s, i) =>
          i === action.payload.index
            ? { ...s, status: action.payload.status }
            : s,
        ),
      };
    case ActionType.RESET_STEPS:
      return {
        ...state,
        steps: INITIAL_STEPS.map((s, i) => ({
          ...s,
          status: i === 0 ? StepStatus.ACTIVE : StepStatus.PENDING,
        })),
      };
    case ActionType.SET_COUNTDOWN:
      return { ...state, countdown: action.payload };
    case ActionType.TOGGLE_SHOW_PASS:
      return { ...state, showPass: !state.showPass };
    case ActionType.SET_REDIRECT_PROGRESS:
      return { ...state, redirectProgress: action.payload };
    case ActionType.SET_STORAGE_BLOCKED:
      return { ...state, storageBlocked: action.payload };
    case ActionType.RESET_ON_RETRY:
      return {
        ...state,
        uiState: UiState.IDLE,
        error: null,
        adminLoginID: null,
        adminLoginPass: null,
      };
    default:
      return state;
  }
}

export default function AdminLoginPage() {
  // TODO(security): Domain and auth gating currently run client-side in useEffect, after the full admin-login bundle is sent to the browser. Consider moving to Next.js middleware or a Server Component.
  const [domainAllowed, setDomainAllowed] = useState<boolean | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let ignore = false;
    const verifyDomain = async () => {
      try {
        const allowed = await isAdminDomainAllowed();
        if (!ignore) setDomainAllowed(allowed);
      } catch (error) {
        if (!ignore) setDomainAllowed(false);
      }
    };
    verifyDomain();
    return () => {
      ignore = true;
    };
  }, []);

  const dispatch = useAppDispatch();
  const [state, dispatchState] = useReducer(adminLoginReducer, initialState);
  const router = useRouter();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Guards against setState calls landing after the component has unmounted
  // (e.g. the user navigates away mid-login while the step-animation
  // timeouts in submitHandler are still pending).
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Focus management: move focus to the heading whenever we land on the
  // success or error screen, so screen-reader users get the outcome
  // announced instead of having focus stranded on a now-hidden button.
  const outcomeHeadingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (state.uiState === UiState.SUCCESS || state.uiState === UiState.ERROR) {
      outcomeHeadingRef.current?.focus();
    }
  }, [state.uiState]);

  const idInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (state.uiState === UiState.IDLE) {
      idInputRef.current?.focus();
    }
  }, [state.uiState]);

  useEffect(() => {
    if (domainAllowed !== true) return;

    const storageAvailable = (() => {
      try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        return true;
      } catch {
        return false;
      }
    })();

    dispatchState({
      type: ActionType.SET_STORAGE_BLOCKED,
      payload: !storageAvailable,
    });

    const storedData =
      typeof window !== "undefined"
        ? localStorage.getItem(IS_AUTHENTICATED_KEY)
        : null;
    let auth = null;
    try {
      auth = storedData ? JSON.parse(storedData) : null;
    } catch {
      localStorage.removeItem(IS_AUTHENTICATED_KEY);
      auth = null;
    }
    if (auth && auth?.isAuthenticated && auth?.role === "admin") {
      router.replace(`/admin`);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [domainAllowed, router]);

  if (domainAllowed === false) {
    notFound();
  }

  if (domainAllowed === null) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-sm font-medium text-muted-foreground tracking-wide mt-2">
            Verifying secure connection...
          </p>
        </motion.div>
      </main>
    );
  }

  const updateStep = (index: number, status: Step["status"]) => {
    dispatchState({ type: ActionType.UPDATE_STEP, payload: { index, status } });
  };

  // Small helper so the artificial step-animation delays never resolve
  // into a dispatch after unmount.
  const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.uiState === UiState.LOADING) return;
    if (!state.adminLoginID || !state.adminLoginPass) {
      dispatchState({
        type: ActionType.SET_ERROR,
        payload: "Please fill in all fields.",
      });
      return;
    }
    dispatchState({ type: ActionType.SET_ERROR, payload: null });
    dispatchState({ type: ActionType.SET_UI_STATE, payload: UiState.LOADING });
    dispatchState({ type: ActionType.RESET_STEPS });

    dispatch(loginStart());

    let result: {
      status: number;
      message: string;
      data?: AdminLoginResponseData;
    };
    try {
      result = await adminLogin({
        admin_id: state.adminLoginID!,
        password: state.adminLoginPass!,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      dispatch(loginFailure(ADMIN_LOGIN_TEXT.NETWORK_ERROR_MSG));
      updateStep(0, StepStatus.FAILED);
      dispatchState({
        type: ActionType.SET_ERROR,
        payload: ADMIN_LOGIN_TEXT.NETWORK_ERROR_MSG,
      });
      dispatchState({ type: ActionType.SET_UI_STATE, payload: UiState.ERROR });
      return;
    }

    if (!isMountedRef.current) return;

    dispatch(
      result.status === 200
        ? loginSuccess(result.data!)
        : loginFailure(result.message),
    );

    if (result.status !== 200) {
      updateStep(0, StepStatus.FAILED);
      dispatchState({ type: ActionType.SET_ERROR, payload: result.message });
      dispatchState({ type: ActionType.SET_UI_STATE, payload: UiState.ERROR });
      return;
    }

    localStorage.setItem(
      IS_AUTHENTICATED_KEY,
      JSON.stringify({ isAuthenticated: true, role: "admin", ...result.data }),
    );

    // NOTE: intentional UX delay for step animation — confirm with product
    // before removing/shortening this. Skipped entirely when the user has
    // requested reduced motion, so the login doesn't feel artificially slow
    // for people who've opted out of animation.
    const stepDelay = prefersReducedMotion ? 0 : 600;
    const finalDelay = prefersReducedMotion ? 0 : 400;

    updateStep(0, StepStatus.DONE);
    updateStep(1, StepStatus.ACTIVE);
    await delay(stepDelay);
    if (!isMountedRef.current) return;

    updateStep(1, StepStatus.DONE);
    updateStep(2, StepStatus.ACTIVE);
    await delay(stepDelay);
    if (!isMountedRef.current) return;

    updateStep(2, StepStatus.DONE);
    await delay(finalDelay);
    if (!isMountedRef.current) return;

    dispatchState({ type: ActionType.SET_UI_STATE, payload: UiState.SUCCESS });
    startRedirect();
  };

  const startRedirect = () => {
    const total = 3000;
    const interval = 50;
    const startTime = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      dispatchState({
        type: ActionType.SET_REDIRECT_PROGRESS,
        payload: Math.max(0, 100 - (elapsed / total) * 100),
      });
      dispatchState({
        type: ActionType.SET_COUNTDOWN,
        payload: Math.ceil((total - Math.min(elapsed, total)) / 1000),
      });
      if (elapsed >= total) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        router.replace("/admin");
      }
    }, interval);
  };

  const goToAdminNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    router.replace("/admin");
  };

  const StepIcon = ({ status }: { status: Step["status"] }) => {
    if (status === "active")
      return (
        <span className="block w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      );
    if (status === "done")
      return (
        <span className="text-green-600 dark:text-green-400 font-bold text-sm">
          ✓
        </span>
      );
    if (status === "failed")
      return <span className="text-destructive font-bold text-sm">✕</span>;
    return (
      <span className="text-muted-foreground/40 font-bold text-sm">○</span>
    );
  };

  const stepStyles: Record<Step["status"], string> = {
    pending: "bg-muted/30 border-border",
    active: "bg-primary/5 border-primary/20 shadow-sm",
    done: "bg-green-500/10 border-green-500/20",
    failed: "bg-destructive/10 border-destructive/20",
  };
  const stepTextStyles: Record<Step["status"], string> = {
    pending: "text-muted-foreground",
    active: "text-primary",
    done: "text-green-600 dark:text-green-400",
    failed: "text-destructive",
  };

  const xOffset = prefersReducedMotion ? 0 : 20;
  const yOffset = prefersReducedMotion ? 0 : 20;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary">
      <motion.div
        layout
        initial={{ opacity: 0, y: yOffset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-xl overflow-hidden"
      >
        {/* Header — always visible */}
        <div className="px-8 pt-10 pb-6 border-b border-border/50 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 relative z-10 shadow-sm">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1.5 tracking-tight relative z-10">
            {ADMIN_LOGIN_TEXT.TITLE}
          </h1>
          <p className="text-sm text-muted-foreground relative z-10">
            {ADMIN_LOGIN_TEXT.SUBTITLE}
          </p>
        </div>

        {/*
          Content area: previously this used a fixed `min-h-[360px]` wrapper
          with each state absolutely positioned (`inset-0`) inside it. That
          meant the card's real height never reflected the content that was
          actually showing — e.g. the idle form grows taller than 360px as
          soon as both the "fill in all fields" error AND the "enable local
          storage" warning are visible, and with the parent's
          `overflow-hidden` that overflow was silently clipped, cutting off
          the submit button and disclaimer text. Motion's `layout` prop on
          the parent card now animates height changes smoothly as each
          state's real content height changes, so nothing is ever clipped
          or overlapping.
        */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {/* IDLE — login form */}
            {state.uiState === UiState.IDLE && (
              <motion.form
                key="idle"
                initial={{ opacity: 0, x: -xOffset }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: xOffset }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                onSubmit={submitHandler}
                noValidate
                className="w-full px-8 py-8 flex flex-col gap-5"
              >
                <CookieConsentBanner />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="adminLoginID"
                    className="text-sm font-medium text-foreground tracking-wide"
                  >
                    {ADMIN_LOGIN_TEXT.ID_LABEL}
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10">
                      @
                    </span>
                    <input
                      ref={idInputRef}
                      id="adminLoginID"
                      name="adminLoginID"
                      autoComplete="username"
                      type="text"
                      required
                      maxLength={50}
                      value={state.adminLoginID ?? ""}
                      aria-invalid={!!state.error}
                      aria-describedby={
                        state.error ? "admin-login-error" : undefined
                      }
                      className="w-full pl-9 pr-4 py-3 border border-border rounded-xl text-sm text-foreground bg-background outline-none transition-all duration-300 focus:border-primary focus:ring-[3px] focus:ring-primary/20 hover:border-border/80 shadow-sm"
                      placeholder={ADMIN_LOGIN_TEXT.ID_PLACEHOLDER}
                      onChange={(e) =>
                        dispatchState({
                          type: ActionType.SET_LOGIN_ID,
                          payload: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="adminLoginPass"
                    className="text-sm font-medium text-foreground tracking-wide"
                  >
                    {ADMIN_LOGIN_TEXT.PASS_LABEL}
                  </label>
                  <div className="relative group">
                    <input
                      id="adminLoginPass"
                      name="adminLoginPass"
                      autoComplete="current-password"
                      type={state.showPass ? "text" : "password"}
                      required
                      value={state.adminLoginPass ?? ""}
                      aria-invalid={!!state.error}
                      aria-describedby={
                        state.error ? "admin-login-error" : undefined
                      }
                      className="w-full pl-4 pr-11 py-3 border border-border rounded-xl text-sm text-foreground bg-background outline-none transition-all duration-300 focus:border-primary focus:ring-[3px] focus:ring-primary/20 hover:border-border/80 shadow-sm"
                      onChange={(e) =>
                        dispatchState({
                          type: ActionType.SET_LOGIN_PASS,
                          payload: e.target.value,
                        })
                      }
                      onPaste={(e) => {
                        if (process.env.NODE_ENV !== "development") {
                          e.preventDefault();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        dispatchState({ type: ActionType.TOGGLE_SHOW_PASS })
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                      aria-label={
                        state.showPass
                          ? ADMIN_LOGIN_TEXT.HIDE_PASS
                          : ADMIN_LOGIN_TEXT.SHOW_PASS
                      }
                    >
                      {state.showPass ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {state.error && (
                  <motion.div
                    id="admin-login-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    role="alert"
                    aria-live="polite"
                    className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm font-medium text-destructive mt-1"
                  >
                    <span aria-hidden="true">⚠</span> {state.error}
                  </motion.div>
                )}

                {state.storageBlocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    role="alert"
                    aria-live="polite"
                    className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-500 mt-1"
                  >
                    <span aria-hidden="true">⚠</span> {ADMIN_LOGIN_TEXT.STORAGE_ERROR_MSG}
                  </motion.div>
                )}

                <div className="mt-2">
                  <button
                    type="submit"
                    disabled={state.storageBlocked}
                    className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm rounded-xl py-3.5 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {ADMIN_LOGIN_TEXT.BTN_AUTH}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    {ADMIN_LOGIN_TEXT.MONITOR_MSG}
                  </p>
                  <p className="text-center text-[10px] text-muted-foreground/60 mt-2 px-2 leading-relaxed">
                    {AUTH_TEXT.CONSENT.DISCLAIMER}
                  </p>
                </div>
              </motion.form>
            )}

            {/* LOADING — step progress */}
            {state.uiState === UiState.LOADING && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: yOffset }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -yOffset }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="w-full px-8 py-10 flex flex-col"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5">
                    {ADMIN_LOGIN_TEXT.LOADING_TITLE}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ADMIN_LOGIN_TEXT.LOADING_SUBTITLE}
                  </p>
                </div>
                <div className="w-full flex flex-col gap-3">
                  {state.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : i * 0.1 }}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border text-sm font-medium transition-colors duration-300 ${stepStyles[step.status]} ${stepTextStyles[step.status]}`}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-background border border-border/50 flex-shrink-0 shadow-sm">
                        <StepIcon status={step.status} />
                      </div>
                      {step.label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUCCESS — redirect countdown */}
            {state.uiState === UiState.SUCCESS && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  type: prefersReducedMotion ? "tween" : "spring",
                  bounce: 0.4,
                }}
                className="w-full px-8 py-12 flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl relative z-10 text-green-600 dark:text-green-400">
                    ✓
                  </div>
                </div>
                <h2
                  ref={outcomeHeadingRef}
                  tabIndex={-1}
                  className="text-xl font-semibold text-foreground mb-2 tracking-tight outline-none"
                >
                  {ADMIN_LOGIN_TEXT.SUCCESS_TITLE}
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-[250px]">
                  {ADMIN_LOGIN_TEXT.SUCCESS_SUBTITLE}
                </p>
                <div className="w-full max-w-[200px] bg-muted rounded-full h-1.5 overflow-hidden mb-4 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${state.redirectProgress}%` }}
                    transition={{ ease: "linear", duration: 0.05 }}
                    className="absolute left-0 top-0 bottom-0 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                </div>
                <p className="text-xs text-muted-foreground tracking-wide font-medium uppercase mb-6">
                  {ADMIN_LOGIN_TEXT.REDIRECT_PREFIX}
                  {state.countdown}
                  {ADMIN_LOGIN_TEXT.REDIRECT_SUFFIX}
                </p>
                <button
                  onClick={goToAdminNow}
                  className="text-sm font-semibold text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  {ADMIN_LOGIN_TEXT.BTN_GO_NOW}
                </button>
              </motion.div>
            )}

            {/* ERROR — access denied */}
            {state.uiState === UiState.ERROR && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                className="w-full px-8 py-12 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 text-2xl text-destructive shadow-sm">
                  ✕
                </div>
                <h2
                  ref={outcomeHeadingRef}
                  tabIndex={-1}
                  className="text-xl font-semibold text-foreground mb-2 tracking-tight outline-none"
                >
                  {ADMIN_LOGIN_TEXT.ERROR_TITLE}
                </h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-[250px]">
                  {state.error || ADMIN_LOGIN_TEXT.ERROR_DEFAULT_MSG}
                </p>
                <button
                  onClick={() =>
                    dispatchState({ type: ActionType.RESET_ON_RETRY })
                  }
                  className="bg-foreground hover:bg-foreground/90 text-background active:scale-[0.98] font-semibold text-sm rounded-xl px-8 py-3 transition-all shadow-md"
                >
                  {ADMIN_LOGIN_TEXT.BTN_TRY_AGAIN}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
