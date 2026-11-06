import React from 'react';

/**
 * ContentContainer
 * Wadah konten terstandarisasi untuk mengontrol lebar maksimum (max-width 1360px)
 * dan margin horizontal agar tampilan tetap teratur di layar lebar.
 */
export default function ContentContainer({ children, className = '', ...props }) {
  return (
    <div className={`content-container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
