'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();

    const handleNavClick = (e, path) => {
        if (pathname === path) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <footer>
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <Link href="/" onClick={(e) => handleNavClick(e, '/')}>
                            <img src="/logo.png" alt="Untuk Esok Logo" className="footer-logo" />
                        </Link>
                        <p className="footer-tagline">Hari ini menanam aksi, esok menuai inspirasi!</p>
                    </div>
                    <div>
                        <ul className="footer-links footer-nav-list">
                            <li><Link href="/" onClick={(e) => handleNavClick(e, '/')}>Beranda</Link></li>
                            <li><Link href="/tentangkami" onClick={(e) => handleNavClick(e, '/tentangkami')}>Tentang Kami</Link></li>
                            <li><Link href="/program" onClick={(e) => handleNavClick(e, '/program')}>Program</Link></li>
                            <li><Link href="/donasi" onClick={(e) => handleNavClick(e, '/donasi')}>Donasi</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="footer-contact-heading">Hubungi Kami</h4>
                        <ul className="footer-links footer-nav-list">
                            <li>Email: untukesok180126@gmail.com</li>
                            <li>Instagram: @untukesok</li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Untuk Esok. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}