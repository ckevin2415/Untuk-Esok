'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const bannerImages = [
  '/banner/banner1.png',
  '/banner/banner2.png',
  '/banner/banner3.png',
  '/banner/banner4.png',
  '/banner/banner5.png',
  '/banner/banner6.png',
];

export default function BerandaPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="page-section active">
      <article className="hero-slideshow">
        {bannerImages.map((src, i) => {
          const bgClass = `slide-${src.split('/')[2].split('.')[0]}`;
          return (
            <div
              key={i}
              className={`slide ${bgClass} ${i === current ? 'slide-active' : 'slide-inactive'}`}
            />
          );
        })}

        <div className="slide-overlay" />

        <div className="slide-text">
          <h1>Hari ini menanam aksi,<br />esok menuai inspirasi!</h1>
        </div>
      </article>

      <article className="about-article">
        <div className="container about-grid reveal active">
          <img
            src="/aboutUs.jpg"
            alt="About Us - Komunitas Untuk Esok"
            className="about-img"
          />
          <div className="text-center">
            <h2 className="section-heading">Tentang Kami</h2>
            <p className="about-text">
              Untuk Esok merupakan komunitas yang dikelola oleh pelajar SMA sebagai ruang bagi generasi muda untuk berperan aktif dalam memberikan kontribusi nyata kepada masyarakat. Komunitas ini mewadahi para relawan yang memiliki kepedulian terhadap berbagai isu sosial, khususnya dalam upaya mendukung tercapainya 17 tujuan dalam Sustainable Development Goals (SDGs).
            </p>
            <Link href="/tentangkami">
              <button className="btn btn-outline about-btn">
                Selengkapnya
              </button>
            </Link>
          </div>
        </div>
      </article>

      <article className="section-padding bg-light">
        <div className="container reveal active">
          <h2 className="text-center section-heading">
            Program Kami
          </h2>

          <div className="program-grid">

            <Link href="/program">
              <div
                className="img-placeholder program-img-card program-bg-literasi"
              >
              </div>
            </Link>

            <Link href="/program">
              <div
                className="img-placeholder program-img-card program-bg-komputer"
              >
              </div>
            </Link>

            <Link href="/program">
              <div
                className="img-placeholder program-img-card program-bg-numerasi"
              >
              </div>
            </Link>

            <Link href="/program">
              <div
                className="img-placeholder program-img-card program-bg-bahasaInggris"
              >
              </div>
            </Link>
          </div>
        </div>
      </article>

      <article className="section-padding bg-catalina cta-section">
        <div className="container reveal active">
          <div className="cta-buttons">
            <Link href="/donasi">
              <button className="btn btn-orange">Donate Now</button>
            </Link>
            <Link href="/program">
              <button className="btn btn-outline-white">Join Us</button>
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}