import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} AqarFlow Real Estate Platform. All rights reserved.
      </div>
    </footer>
  );
};
