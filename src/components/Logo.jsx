import React from 'react';

/**
 * MeraLogo — full wordmark logo
 * @param {string} variant - 'maroon' (default, untuk bg terang) | 'white' (untuk bg gelap)
 * @param {string} className
 */
export const MeraLogo = ({ className = "h-20", variant = 'white', style }) => {
    const src = variant === 'maroon' ? '/logo-mera-maroon.png' : '/logo-mera-white.png';
    return (
        <img
            src={src}
            alt="Méra SelfStudio"
            className={className}
            style={{ objectFit: 'contain', ...style }}
        />
    );
};

/**
 * MeraLogoIcon — icon/mark only
 */
export const MeraLogoIcon = ({ className = "h-10", style }) => (
    <img
        src="/logo-mera-iconm.png"
        alt="Méra"
        className={className}
        style={{ objectFit: 'contain', ...style }}
    />
);

export default MeraLogo;
