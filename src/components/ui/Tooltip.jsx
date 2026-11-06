import React, { useState } from 'react';

/**
 * Tooltip Component
 * Keterangan singkat saat elemen difokuskan atau diarahkan kursor.
 */
export default function Tooltip({
  content,
  children,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  return (
    <span
      className={`ui-tooltip-wrapper ${className}`.trim()}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className="ui-tooltip-bubble" role="tooltip">
          {content}
        </span>
      )}
    </span>
  );
}
