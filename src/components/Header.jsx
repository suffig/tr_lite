import React from 'react';

export default function Header() {
  return (
    <header className="modern-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">
            <img 
              src="/assets/logo.png" 
              alt="FIFA Tracker Logo" 
              className="w-6 h-6 object-contain filter brightness-0 invert"
              loading="eager"
            />
          </div>
          <div className="header-title">FIFA Tracker</div>
        </div>
      </div>
    </header>
  );
}