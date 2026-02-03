import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Sidebar() {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">⚡</div>
                <h1>Log Analyzer</h1>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                    <span className="nav-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/incidents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🚨</span>
                    <span>Incidents</span>
                </NavLink>

                <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📋</span>
                    <span>Log Explorer</span>
                </NavLink>

                <NavLink to="/clusters" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🧩</span>
                    <span>Error Clusters</span>
                </NavLink>

                <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🖥️</span>
                    <span>Services</span>
                </NavLink>

                <NavLink to="/flows" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🔀</span>
                    <span>API Flows</span>
                </NavLink>
            </nav>

            <div className="theme-toggle">
                <button className="theme-btn" onClick={toggleTheme}>
                    <span className="nav-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                    <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
