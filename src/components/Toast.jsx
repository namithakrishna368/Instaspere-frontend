import { useState, useEffect, useCallback } from "react";

let showToastFn = null;

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "error", duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    }, []);

    useEffect(() => {
        showToastFn = showToast;
        return () => { showToastFn = null; };
    }, [showToast]);

    return { toast, showToast };
}

// Call this from anywhere
export function toast(message, type = "error", duration = 3000) {
    if (showToastFn) showToastFn(message, type, duration);
}

export default function Toast({ toast }) {
    if (!toast) return null;

    const bgColor = toast.type === "error"
        ? "bg-red-500"
        : toast.type === "success"
            ? "bg-green-500"
            : "bg-gray-800";

    return (
        <div
            className="fixed bottom-8 left-1/2 z-[9999]"
            style={{
                transform: "translateX(-50%)",
                animation: "toastSlideUp 0.3s ease-out",
            }}
        >
            <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2`}>
                {toast.type === "error" && <span>⚠️</span>}
                {toast.type === "success" && <span>✅</span>}
                {toast.message}
            </div>
        </div>
    );
}
