'use client';

import React from 'react';

interface NumericKeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
    onClear: () => void;
    onConfirm?: () => void;
    isConfirmDisabled?: boolean;
}

export default function NumericKeypad({
    onKeyPress,
    onDelete,
    onClear,
    onConfirm,
    isConfirmDisabled
}: NumericKeypadProps) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

    return (
        <div className="w-full max-w-sm mx-auto mt-4">
            <div className="grid grid-cols-3 gap-3">
                {keys.map((key) => {
                    if (key === 'C') {
                        return (
                            <button
                                key={key}
                                onClick={onClear}
                                className="h-16 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xl font-bold active:scale-95 transition-transform flex items-center justify-center shadow-sm"
                            >
                                C
                            </button>
                        );
                    }
                    if (key === '⌫') {
                        return (
                            <button
                                key={key}
                                onClick={onDelete}
                                className="h-16 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 active:scale-95 transition-transform flex items-center justify-center shadow-sm"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                                </svg>
                            </button>
                        );
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => onKeyPress(key)}
                            className="h-16 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-2xl font-semibold active:scale-95 transition-transform shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
                        >
                            {key}
                        </button>
                    );
                })}
            </div>

            {/* Quick Add Modifiers (Optional Row) */}
            <div className="flex gap-3 mt-3">

            </div>

            {onConfirm && (
                <button
                    onClick={onConfirm}
                    disabled={isConfirmDisabled}
                    className={`nav-button-primary w-full mt-4 h-14 rounded-xl font-bold text-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${isConfirmDisabled
                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-[#007AFF] text-white hover:bg-[#0056b3]'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Confirmar
                </button>
            )}
        </div>
    );
}
