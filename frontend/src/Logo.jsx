import React from 'react';

const Logo = ({ size = 'medium' }) => {
    // Sizes
    const dims = {
        small: { w: 32, h: 32, text: '1.25rem' },
        medium: { w: 40, h: 40, text: '1.5rem' },
        large: { w: 56, h: 56, text: '2rem' }
    };

    const { w, h, text } = dims[size] || dims.medium;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
            {/* Minimal Geometric Abstract Mark - "Network Node" */}
            <svg width={w} height={h} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="url(#paint0_linear)" />
                <path d="M20 10V16M20 24V30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M10 20H16M24 20H30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="5" stroke="white" strokeWidth="2.5" />
                <defs>
                    <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1" />
                        <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                </defs>
            </svg>

            <div style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: text, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                HRC <span style={{ fontWeight: 400, opacity: 0.7 }}>AI</span>
            </div>
        </div>
    );
};

export default Logo;
