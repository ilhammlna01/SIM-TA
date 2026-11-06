import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb-trail" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="breadcrumb-item">
            {index > 0 && <ChevronRight size={12} className="text-muted" />}
            <span className={isLast ? 'breadcrumb-item active' : 'breadcrumb-item'}>
              {item}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
