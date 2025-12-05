import React from 'react';
import NavBar from '../components/ui/NavBar';

const MainLayout = ({ children, isAdmin, setIsAdmin }) => {
    return (
        <div className="min-h-screen bg-cream text-navy font-sans selection:bg-plum selection:text-cream flex flex-col">
            <NavBar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
            <main className="flex-grow pt-20 px-4 flex flex-col">
                {children}
            </main>
            <footer className="py-6 text-center text-[10px] text-navy/40 uppercase tracking-widest border-t border-navy/5">
                © 2025 Gala Event Management. All rights reserved.
            </footer>
        </div>
    );
};

export default MainLayout;
