'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { auth, provider, db } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
    const pathname = usePathname();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [dbFirstName, setDbFirstName] = useState('');

    const dropdownRef = useRef(null);
    const desktopDropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const hamburgerRef = useRef(null);

    const appId = 'untuk-esok-web';
    const isActive = (path) => pathname === path;

    const handleNavClick = (e, path) => {
        setIsMobileMenuOpen(false);
        if (pathname === path) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileDropdownOpen &&
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }

            if (
                isMobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(event.target)
            ) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileDropdownOpen, isMobileMenuOpen]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        let unsubscribeDoc = () => { };
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
                unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setIsAdmin(data.role === 'admin');
                        setDbFirstName(data.firstName || '');
                    } else {
                        setIsAdmin(false);
                        setDbFirstName('');
                    }
                });
            } else {
                setIsAdmin(false);
                setDbFirstName('');
                unsubscribeDoc();
            }
        });
        return () => { unsubscribeAuth(); unsubscribeDoc(); };
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
            setIsLoginModalOpen(false);
        } catch (error) { console.error("Login error:", error); }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setIsProfileDropdownOpen(false);
            setIsMobileMenuOpen(false);
        } catch (error) { console.error("Logout error:", error); }
    };

    const avatarInitial = dbFirstName
        ? dbFirstName.charAt(0).toUpperCase()
        : (user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');

    return (
        <>
            <header className="navbar-header">
                <div className="container nav-container">
                    <div className="logo">
                        <Link href="/" onClick={(e) => handleNavClick(e, '/')}>
                            <img src="/logo.png" alt="Untuk Esok Logo" className="navbar-logo" />
                        </Link>
                    </div>

                    <div className="navbar-spacer"></div>

                    <nav className="desktop-nav navbar-desktop-nav">
                        <ul className="nav-links navbar-ul">
                            <li>
                                <Link href="/" className={`nav-item${isActive('/') ? ' nav-item-active' : ''}`} onClick={(e) => handleNavClick(e, '/')}>Beranda</Link>
                            </li>
                            <li>
                                <Link href="/tentangkami" className={`nav-item${isActive('/tentangkami') ? ' nav-item-active' : ''}`} onClick={(e) => handleNavClick(e, '/tentangkami')}>Tentang Kami</Link>
                            </li>
                            <li>
                                <Link href="/program" className={`nav-item${isActive('/program') ? ' nav-item-active' : ''}`} onClick={(e) => handleNavClick(e, '/program')}>Program</Link>
                            </li>
                            {isAdmin && (
                                <li>
                                    <Link href="/admin" className={`nav-item nav-item-admin${isActive('/admin') ? ' nav-item-active' : ''}`} onClick={(e) => handleNavClick(e, '/admin')}>Admin</Link>
                                </li>
                            )}
                            <li>
                                <Link href="/donasi" className="btn btn-orange" onClick={(e) => handleNavClick(e, '/donasi')}>Donasi</Link>
                            </li>

                            {user ? (
                                <li className="nav-li-plain">
                                    <div className="user-profile-dropdown user-profile-dropdown-flex" ref={desktopDropdownRef}>
                                        <div
                                            className="user-avatar-btn"
                                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        >
                                            <div className="user-avatar-circle">{avatarInitial}</div>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="navbar-chevron">
                                                <path d="M6 9l6 6 6-6"></path>
                                            </svg>
                                        </div>
                                        {isProfileDropdownOpen && (
                                            <div className="dropdown-menu active dropdown-menu-desktop">
                                                <Link href="/profil" onClick={(e) => { setIsProfileDropdownOpen(false); handleNavClick(e, '/profil'); }}>Lihat Profil</Link>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleSignOut(); }}>Keluar</a>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ) : (
                                <li className="nav-li-plain">
                                    <button onClick={() => setIsLoginModalOpen(true)} className="nav-item navbar-login-btn">
                                        Login
                                    </button>
                                </li>
                            )}
                        </ul>
                    </nav>

                    {user && (
                        <div ref={dropdownRef} className="mobile-profile-btn" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                            <div className="user-avatar-circle">{avatarInitial}</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6"></path>
                            </svg>
                            {isProfileDropdownOpen && (
                                <div className="mobile-profile-dropdown">
                                    <Link href="/profil" onClick={(e) => { setIsProfileDropdownOpen(false); handleNavClick(e, '/profil'); }}>Lihat Profil</Link>
                                    <a href="#" className="nav-link-danger" onClick={(e) => { e.preventDefault(); handleSignOut(); }}>Keluar</a>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        ref={hamburgerRef}
                        className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <div ref={mobileMenuRef} className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                    <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active-link' : ''}`} onClick={(e) => handleNavClick(e, '/')}>Beranda</Link>
                    <Link href="/tentangkami" className={`mobile-nav-item ${isActive('/tentangkami') ? 'active-link' : ''}`} onClick={(e) => handleNavClick(e, '/tentangkami')}>Tentang Kami</Link>
                    <Link href="/program" className={`mobile-nav-item ${isActive('/program') ? 'active-link' : ''}`} onClick={(e) => handleNavClick(e, '/program')}>Program</Link>
                    {isAdmin && (
                        <Link href="/admin" className={`mobile-nav-item ${isActive('/admin') ? 'active-link' : ''}`} onClick={(e) => handleNavClick(e, '/admin')}>Admin</Link>
                    )}
                    <Link href="/donasi" className="mobile-donate-btn" onClick={(e) => handleNavClick(e, '/donasi')}>Donasi</Link>

                    {!user && (
                        <button className="mobile-login-btn" onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}>
                            Login
                        </button>
                    )}
                </div>
            </header>

            {isLoginModalOpen && (
                <div className="modal-overlay active modal-overlay-flex" onClick={(e) => e.target.className.includes('modal-overlay') && setIsLoginModalOpen(false)}>
                    <div className="modal-content modal-content-center modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={() => setIsLoginModalOpen(false)}>&times;</span>
                        <h2 className="modal-login-title">Masuk / Sign In</h2>
                        <button className="btn-google" onClick={handleGoogleLogin}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="google-logo-img" />
                            Sign in with Google
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}