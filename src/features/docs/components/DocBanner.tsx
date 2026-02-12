import React from 'react';

interface DocBannerProps {
  bannercolor: string;
  bannertext: string;
  isDark: boolean;
  className?: string;
  isCard?: boolean;
}

const DocBanner: React.FC<DocBannerProps> = ({ bannercolor, bannertext, isDark, className = '', isCard = false }) => {
  const textColor = isDark ? '#E8E7E3' : '#0a0a0a';

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        aspectRatio: isCard ? '16 / 9' : undefined,
        height: isCard ? undefined : 'clamp(200px, 30vh, 400px)',
        backgroundColor: bannercolor,
      }}
      data-banner-content
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          style={{
            color: textColor,
            fontFamily: 'UnifixSP, sans-serif',
            fontSize: isCard ? 'clamp(0.875rem, 2.5vw, 1.25rem)' : 'clamp(1.5rem, 4vw, 3rem)',
            fontWeight: 700,
            textAlign: 'center',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'auto',
            maxWidth: '95%',
            lineHeight: 1.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {bannertext}
        </div>
      </div>
    </div>
  );
};

export default DocBanner;
