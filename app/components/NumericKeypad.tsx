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
                                className="h-16 rounded-xl bg-red-100 text-red-600 text-xl font-bold active:scale-95 transition-transform flex items-center justify-center shadow-sm"
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
                                className="h-16 rounded-xl bg-gray-100 text-gray-600 text-xl font-bold active:scale-95 transition-transform flex items-center justify-center shadow-sm"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                ⌫
                            </button>
                        );
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => onKeyPress(key)}
                            className="h-16 rounded-xl bg-white border border-gray-200 text-gray-900 text-2xl font-semibold active:scale-95 transition-transform shadow-sm hover:bg-gray-50 bg-[#F2F2F7]"
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
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
