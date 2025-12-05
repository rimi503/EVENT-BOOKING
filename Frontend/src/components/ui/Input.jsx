import React from 'react';

const Input = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`group ${className}`}>
            {label && <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1 group-focus-within:text-plum transition-colors">{label}</label>}
            <input
                className={`w-full bg-transparent border-b border-navy/20 py-2 text-sm text-navy font-medium
          focus:outline-none focus:border-navy focus:border-b-2
          placeholder-navy/30 transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500' : ''}
        `}
                {...props}
            />
            {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
        </div>
    );
};

export default Input;
