import React from 'react';

const USE_IMAGE_LOGO = true; // Ubah ke 'true' jika ingin menggunakan logo gambar

export const MeraLogo = ({ className = "h-20", style }) => {
    if (USE_IMAGE_LOGO) {
        // Pastikan file logo ada di folder public/logo.png
        return <img src="/logo.png" alt="Méra Logo" className={className} style={style} />;
    }

    return (
        <svg viewBox="0 0 300 100" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L40 80 L60 20 L80 80 L100 20" stroke="#800000" strokeWidth="15" fill="none" strokeLinecap="square" />
            <path d="M120 20 L160 20 M120 50 L150 50 M120 80 L160 80 M120 20 L120 80" stroke="#800000" strokeWidth="15" fill="none" />
            <path d="M180 20 L220 20 L220 50 L180 50 L220 80" stroke="#800000" strokeWidth="15" fill="none" />
            <path d="M240 80 L260 20 L280 80 M250 50 L270 50" stroke="#800000" strokeWidth="15" fill="none" />
            <text x="150" y="95" fontFamily="monospace" fontSize="12" fill="#ffffffff" textAnchor="middle" letterSpacing="0.2em">Operating System</text>
        </svg>
    );
};
