import React from 'react';

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  elevated?: boolean;
}

const GlassContainerComponent: React.FC<GlassContainerProps> = ({
  children,
  className = '',
  interactive = false,
  elevated = false,
  ...props
}) => {
  return (
    <div
      className={`
        ${
          elevated
            ? 'bg-white/[0.04] dark:bg-white/[0.05] backdrop-blur-[48px] backdrop-saturate-[200%] border border-white/[0.1] border-t-white/[0.22] border-l-white/[0.16] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)]'
            : 'bg-white/[0.02] dark:bg-white/[0.03] backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/[0.06] border-t-white/[0.18] border-l-white/[0.12] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.55)]'
        }
        relative overflow-hidden
        rounded-[2rem] sm:rounded-[2.25rem]
        transform-gpu will-change-[transform,backdrop-filter]
        ${
          interactive
            ? 'cursor-pointer active:scale-[0.975] transition-[transform,filter,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:brightness-[1.08] hover:border-white/25 select-none hover:shadow-[0_20px_48px_rgba(0,0,0,0.6),0_0_24px_rgba(0,212,255,0.12)]'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {/* Specular Top Rim Illumination & Subtle Optical Refraction Flare */}
      <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />
      <div className="absolute -top-12 -right-12 w-36 h-32 rounded-full bg-cyan-400/[0.03] blur-2xl pointer-events-none z-0" />
      <div className="relative z-1">{children}</div>
    </div>
  );
};

export const GlassContainer = React.memo(GlassContainerComponent);
