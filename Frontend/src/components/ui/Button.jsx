import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    disabled,
    ...props
}) => {
    const baseStyles = "relative overflow-hidden transition-all duration-300 font-sans font-bold text-xs uppercase tracking-[0.2em] px-8 py-4 rounded-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-plum text-cream hover:bg-navy hover:text-white shadow-lg hover:shadow-plum/30 active:scale-95",
        secondary: "bg-transparent border border-navy text-navy hover:bg-navy hover:text-cream active:scale-95",
        outline: "border border-cream/40 text-cream hover:bg-cream hover:text-navy",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/30",
        ghost: "text-navy hover:text-plum bg-transparent hover:bg-navy/5"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
};

export default Button;
