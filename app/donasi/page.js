'use client';
import { useState } from 'react';

export default function DonasiPage() {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');

    const formatIDR = (val) => {
        if (!val) return '0';
        return new Intl.NumberFormat('id-ID').format(val);
    };

    const handleAmountChange = (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 12) value = value.slice(0, 12);
        setAmount(value);
    };

    return (
        <section className="page-section active">
            <article className="section-padding bg-light donation-article">
                <div className="container">
                    <h2 className="text-center section-heading">Dukung Aksi Kami</h2>

                    <div className="donation-container">
                        <div className="donation-card-main">
                            <h1 className="donation-title">Donasi</h1>

                            <div className="step-indicator">
                                <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
                                <div className="step-line"></div>
                                <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
                            </div>

                            {step === 1 && (
                                <div className="donation-form-step">
                                    <label className="input-label">Jumlah</label>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            className="amount-input"
                                            placeholder="0"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            maxLength="12"
                                        />
                                    </div>

                                    <div className="donation-footer">
                                        <div className="total-summary">
                                            <p>Jumlah Total :</p>
                                            <h3>Rp {formatIDR(amount)}</h3>
                                        </div>
                                        <button
                                            className="btn btn-large btn-donation-next"
                                            disabled={!amount || parseInt(amount) <= 0}
                                            onClick={() => setStep(2)}
                                        >
                                            Lanjutkan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="donation-summary-step">
                                    <div className="summary-white-card">
                                        <div className="summary-header">
                                            <h4 className="summary-card-title">Donation Summary</h4>
                                        </div>
                                        <div className="summary-row line-below">
                                            <span>Donation</span>
                                            <span className="summary-amount">Rp {formatIDR(amount)}</span>
                                        </div>

                                        <div className="bank-details-section">
                                            <div className="bank-header">
                                                <h4 className="bank-transfer-title">Bank Transfer</h4>
                                                <img src="/BCA.png" alt="Bank BCA" className="bank-bca-logo" />
                                            </div>

                                            <table className="bank-table">
                                                <tbody>
                                                    <tr>
                                                        <td>Account Name</td>
                                                        <td className="data-cell">Komang Ayu Rheia Sandrakirana Rucika</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Account Number</td>
                                                        <td className="data-cell">7725736959</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Bank Name</td>
                                                        <td className="data-cell">PT Bank Central Asia Tbk.</td>
                                                    </tr>

                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <p className="receipt-note">Mohon kirimkan bukti transfer ke <strong>untukesok180126@gmail.com</strong></p>

                                    <div className="donation-footer-step2">
                                        <div className="total-summary-center">
                                            <p>Total Amount :</p>
                                            <h3>Rp {formatIDR(amount)}</h3>
                                        </div>
                                        <button
                                            className="btn btn-outline-white btn-donation-back"
                                            onClick={() => setStep(1)}
                                        >
                                            Kembali
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        </section>
    );
}