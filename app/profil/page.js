'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const incomplete = searchParams.get('incomplete');

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [displayName, setDisplayName] = useState({ first: '', last: '' });

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        phone: ''
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showNotification = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type });
    };

    const closeModal = () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
    };

    const appId = 'untuk-esok-web';

    useEffect(() => {
        if (incomplete === 'true') {
            showNotification(
                "Lengkapi Profil",
                "Mohon lengkapi data diri Anda sebelum mendaftar program.",
                "info"
            );
        }
    }, [incomplete]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const { email, ...rest } = data;
                        setProfileData(rest);
                        setDisplayName({ first: data.firstName || '', last: data.lastName || '' });
                    } else {
                        const nameParts = currentUser.displayName ? currentUser.displayName.split(' ') : ['', ''];
                        const initialFirst = nameParts[0] || '';
                        const initialLast = nameParts.slice(1).join(' ') || '';

                        setProfileData(prev => ({
                            ...prev,
                            firstName: initialFirst,
                            lastName: initialLast
                        }));
                        setDisplayName({ first: initialFirst, last: initialLast });
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
                setLoading(false);
            } else {
                setUser(null);
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setProfileData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
            const dataToSave = {
                ...profileData,
                email: user.email,
                updatedAt: new Date().toISOString()
            };

            await setDoc(docRef, dataToSave);

            setDisplayName({
                first: profileData.firstName,
                last: profileData.lastName
            });

            showNotification("Berhasil", "Profil berhasil disimpan!", "success");
        } catch (error) {
            console.error("Error saving profile:", error);
            showNotification("Terjadi Kesalahan", "Gagal menyimpan ke database.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;
    if (!user) return null;

    return (
        <>
            <section className="page-section active page-section-relative">
                <article className="section-padding bg-light page-section-min80">
                    <div className="container">
                        <div className="profile-container">

                            <div className="avatar-edit-section">
                                <div className="avatar-edit-circle">
                                    {displayName.first ? displayName.first.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h2 className="profile-display-name">
                                        {displayName.first} {displayName.last}
                                    </h2>
                                    <p className="profile-email">{user.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nama Depan</label>
                                        <input type="text" id="firstName" className="form-control" value={profileData.firstName} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Belakang</label>
                                        <input type="text" id="lastName" className="form-control" value={profileData.lastName} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" className="form-control form-control-disabled" value={user.email} disabled />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Jenis Kelamin</label>
                                        <select id="gender" className="form-control" value={profileData.gender} onChange={handleChange}>
                                            <option value="">Pilih...</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tanggal Lahir</label>
                                        <input type="date" id="dob" className="form-control" value={profileData.dob} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>No. Telepon</label>
                                    <input type="tel" id="phone" className="form-control" value={profileData.phone} onChange={handleChange} />
                                </div>

                                <div className="profile-save-row">
                                    <button type="submit" className="btn btn-orange" disabled={saving}>
                                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </article>
            </section>

            {modalConfig.isOpen && (
                <div className="modal-overlay active modal-overlay-flex modal-overlay-top" onClick={closeModal}>
                    <div className="modal-content modal-content-center modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon-wrapper">
                            {modalConfig.type === 'success' && <svg className="modal-icon modal-icon-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            {modalConfig.type === 'error' && <svg className="modal-icon modal-icon-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            {modalConfig.type === 'info' && <svg className="modal-icon modal-icon-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        </div>
                        <h3 className="modal-title">{modalConfig.title}</h3>
                        <p className="modal-message">{modalConfig.message}</p>
                        <div className="modal-actions">
                            <button className="btn btn-orange modal-btn-ok" onClick={closeModal}>OK, Mengerti</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}