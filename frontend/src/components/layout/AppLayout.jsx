import React from "react";
import Navigation from "./Navigation";

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#FDFBF7]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sidebar Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:ml-0 pb-20 lg:pb-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
