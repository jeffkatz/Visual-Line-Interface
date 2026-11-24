import React from 'react';
import type { FrameworkId, PackageManagerId, RuntimeId } from '../../types/studio';

export const StudioLogoMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <rect x="2" y="2" width="24" height="24" rx="4" stroke="#343B43" strokeWidth="1.5" fill="#171A1E" />
    <circle cx="14" cy="14" r="6.5" stroke="#C7A46A" strokeWidth="1.5" />
    <line x1="14" y1="14" x2="18.2" y2="9.8" stroke="#F1F3F5" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="14" cy="14" r="1.5" fill="#C7A46A" />
    <line x1="6" y1="6" x2="8.5" y2="6" stroke="#626D78" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19.5" y1="22" x2="22" y2="22" stroke="#65B9A5" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const FrameworkMark: React.FC<{ id: FrameworkId; className?: string; active?: boolean }> = ({
  id,
  className = 'w-5 h-5',
  active = false,
}) => {
  const stroke = active ? '#C7A46A' : '#929BA5';
  switch (id) {
    case 'vite':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M20.5 4.5L12.3 20.2C12.1 20.6 11.6 20.6 11.4 20.2L3.5 4.5C3.3 4.1 3.6 3.6 4.1 3.7L12 5.4L19.9 3.7C20.4 3.6 20.7 4.1 20.5 4.5Z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M15.2 4.8L11.4 12.2L14 11.7L11.8 16.8"
            stroke={active ? '#F1F3F5' : '#65B9A5'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'nextjs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
          <path d="M9 16V8L16.5 18" stroke={active ? '#F1F3F5' : stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 8V12.5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'astro':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M8.5 15L11.4 5.5C11.6 4.9 12.4 4.9 12.6 5.5L15.5 15"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M7.5 13.5C9.5 12.5 14.5 12.5 16.5 13.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M10 16.8C10.8 18.6 12 19.5 12 19.5C12 19.5 13.5 18.4 14 16.8"
            stroke={active ? '#C7A46A' : '#E4AD63'}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'vue':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3 5H8.5L12 11L15.5 5H21L12 20L3 5Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7.5 5L12 12.8L16.5 5" stroke={active ? '#65B9A5' : stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'sveltekit':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M15.8 5.2C14.1 4 11.7 4.4 10.4 6L7.3 10C6.2 11.4 6.4 13.4 7.7 14.6C8.1 14.9 8.5 15.1 9 15.2C8.3 16.4 8.6 17.9 9.7 18.8C11.4 20 13.8 19.6 15.1 18L18.2 14C19.3 12.6 19.1 10.6 17.8 9.4C17.4 9.1 17 8.9 16.5 8.8C17.2 7.6 16.9 6.1 15.8 5.2Z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export const RuntimeMark: React.FC<{ id: RuntimeId; className?: string }> = ({ id, className = 'w-5 h-5' }) => {
  switch (id) {
    case 'node':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3L19.8 7.5V16.5L12 21L4.2 16.5V7.5L12 3Z"
            stroke="#65B9A5"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9.5 14.2V9.8L14.5 14.2V9.8" stroke="#F1F3F5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'deno':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="#77A9DC" strokeWidth="1.6" />
          <path d="M8.5 13C8.5 10.8 10.2 9.2 12.4 9.2C14.2 9.2 15.5 10.2 15.8 11.8L16.5 15.5" stroke="#F1F3F5" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11.5" cy="11.5" r="0.9" fill="#77A9DC" />
        </svg>
      );
    case 'bun':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <ellipse cx="12" cy="13" rx="8.2" ry="6.2" stroke="#C7A46A" strokeWidth="1.6" />
          <path d="M7.5 10.5C8.5 8.5 10.2 7.4 12 7.4C13.8 7.4 15.5 8.5 16.5 10.5" stroke="#C7A46A" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="9.6" cy="13" r="0.9" fill="#F1F3F5" />
          <circle cx="14.4" cy="13" r="0.9" fill="#F1F3F5" />
        </svg>
      );
  }
};

export const PackageManagerMark: React.FC<{ id: PackageManagerId; className?: string }> = ({
  id,
  className = 'w-4 h-4',
}) => {
  switch (id) {
    case 'pnpm':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="2.5" width="4" height="4" fill="#C7A46A" />
          <rect x="8" y="2.5" width="4" height="4" fill="#C7A46A" />
          <rect x="13.5" y="2.5" width="4" height="4" fill="#C7A46A" />
          <rect x="8" y="8" width="4" height="4" fill="#929BA5" />
          <rect x="13.5" y="8" width="4" height="4" fill="#C7A46A" />
          <rect x="2.5" y="13.5" width="4" height="4" fill="#929BA5" />
          <rect x="8" y="13.5" width="4" height="4" fill="#929BA5" />
          <rect x="13.5" y="13.5" width="4" height="4" fill="#929BA5" />
        </svg>
      );
    case 'npm':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="5" width="15" height="10" stroke="#DF7777" strokeWidth="1.4" />
          <path d="M6 12.5V7.5H9.5V12.5M12 7.5V12.5H14.5V7.5" stroke="#F1F3F5" strokeWidth="1.2" />
        </svg>
      );
    case 'yarn':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="#77A9DC" strokeWidth="1.4" />
          <path d="M6.5 13C8.5 11.5 11.5 8.5 13.5 6.5M6.5 8.5C9 9.5 11 10.5 13.5 13.5" stroke="#77A9DC" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'bun':
      return <RuntimeMark id="bun" className={className} />;
  }
};
