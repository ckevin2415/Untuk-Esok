'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const sdgData = [];
for (let i = 1; i <= 17; i++) {
    sdgData.push({ id: i, name: `SDG ${i}`, logoUrl: `/sdgs/sdg-${i}.png` });
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const appId = 'untuk-esok-web';

    const [programs, setPrograms] = useState([]);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [volunteers, setVolunteers] = useState([]);
    const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [isDeletingVolunteers, setIsDeletingVolunteers] = useState(false);
    const [isVolunteerSortOpen, setIsVolunteerSortOpen] = useState(false);

    const [judul, setJudul] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [batasRegistrasi, setBatasRegistrasi] = useState('');
    const [lokasi, setLokasi] = useState('');
    const [selectedSdgIds, setSelectedSdgIds] = useState([]);
    const [imageUrl, setImageUrl] = useState('');

    const [modalConfig, setModalConfig] = useState({
        isOpen: false, title: '', message: '', type: 'info', confirmText: 'Ya', onConfirm: null
    });

    const showNotification = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type, confirmText: '', onConfirm: null });
    };

    const showConfirm = (title, message, confirmText, onConfirmCallback) => {
        setModalConfig({ isOpen: true, title, message, type: 'confirm', confirmText, onConfirm: onConfirmCallback });
    };

    const closeNotificationModal = () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && docSnap.data().role === 'admin') {
                        await fetchPrograms();
                        await fetchVolunteers();
                        setLoading(false);
                    } else {
                        router.push('/');
                    }
                } catch (error) {
                    console.error("Access denied:", error);
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchPrograms = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'programs'));
            const programsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPrograms(programsList);
        } catch (error) {
            console.error("Error fetching programs:", error);
        }
    };

    const fetchVolunteers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'registrations'));
            const volunteersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            volunteersList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setVolunteers(volunteersList);
        } catch (error) {
            console.error("Error fetching volunteers:", error);
            setVolunteers([]);
        }
    };

    const sortVolunteers = (type) => {
        let sorted = [...volunteers];
        if (type === 'latest') sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        else if (type === 'oldest') sorted.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
        else if (type === 'programName') sorted.sort((a, b) => (a.programName || '').localeCompare(b.programName || ''));
        else if (type === 'volunteerName') sorted.sort((a, b) => (a.name || a.volunteerName || '').localeCompare(b.name || b.volunteerName || ''));
        setVolunteers(sorted);
        setIsVolunteerSortOpen(false);
    };

    const handleDeleteAllVolunteers = () => {
        if (volunteers.length === 0) return;
        showConfirm(
            "Hapus Semua Data", "PERINGATAN: Apakah Anda sangat yakin ingin menghapus SEMUA riwayat pendaftaran relawan? Tindakan ini tidak dapat dibatalkan!", "Ya, Hapus Semua",
            async () => {
                setIsDeletingVolunteers(true);
                try {
                    const deletePromises = volunteers.map((vol) => deleteDoc(doc(db, 'registrations', vol.id)));
                    await Promise.all(deletePromises);
                    await fetchVolunteers();
                    showNotification("Berhasil", "Semua data pendaftaran relawan telah dihapus.", "success");
                } catch (error) {
                    console.error("Error deleting all volunteers:", error);
                    showNotification("Terjadi Kesalahan", "Gagal menghapus data relawan.", "error");
                } finally {
                    setIsDeletingVolunteers(false);
                }
            }
        );
    };

    const resetFormFields = () => { setJudul(''); setDeskripsi(''); setBatasRegistrasi(''); setLokasi(''); setSelectedSdgIds([]); setImageUrl(''); };

    const handleModalOpen = (program = null) => {
        if (program) {
            setEditingProgramId(program.id);
            setJudul(program.name || ''); setDeskripsi(program.description || ''); setBatasRegistrasi(program.deadline && program.deadline.seconds ? new Date(program.deadline.seconds * 1000).toISOString().split('T')[0] : '');
            setLokasi(program.location || ''); setSelectedSdgIds(program.sdgIds || []); setImageUrl(program.imageUrl || '');
        } else {
            setEditingProgramId(null); resetFormFields();
        }
        setIsFormModalOpen(true);
    };

    const handleModalClose = () => { setIsFormModalOpen(false); resetFormFields(); };

    const openVolunteerModal = async (volunteer) => {
        setSelectedVolunteer({ ...volunteer, isLoadingDetails: true });
        setIsVolunteerModalOpen(true);
        if (volunteer.volunteerId) {
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', volunteer.volunteerId, 'profile', 'info');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let umur = '-';
                    if (data.dob) {
                        const birthDate = new Date(data.dob); const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                        umur = `${age} Tahun`;
                    }
                    setSelectedVolunteer(prev => ({
                        ...prev, gender: data.gender || '-', umur: umur, phone: data.phone || data.phoneNumber || prev.phone || '-',
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || prev.name, isLoadingDetails: false
                    }));
                } else setSelectedVolunteer(prev => ({ ...prev, isLoadingDetails: false }));
            } catch (error) { setSelectedVolunteer(prev => ({ ...prev, isLoadingDetails: false })); }
        }
    };

    const closeVolunteerModal = () => { setSelectedVolunteer(null); setIsVolunteerModalOpen(false); };

    const handleSdgToggle = (sdgId) => { setSelectedSdgIds((prev) => prev.includes(sdgId) ? prev.filter(id => id !== sdgId) : [...prev, sdgId]); };

    const handleFormSubmit = async (e) => {
        e.preventDefault(); setIsActionLoading(true);
        try {
            const programData = { name: judul, description: deskripsi, location: lokasi, sdgIds: selectedSdgIds, imageUrl: imageUrl, deadline: new Date(batasRegistrasi) };
            if (editingProgramId) {
                await updateDoc(doc(db, 'programs', editingProgramId), programData);
                showNotification("Berhasil", "Perubahan program berhasil disimpan.", "success");
            } else {
                programData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'programs'), programData);
                showNotification("Berhasil", "Program baru berhasil ditambahkan.", "success");
            }
            await fetchPrograms(); handleModalClose();
        } catch (error) { showNotification("Terjadi Kesalahan", "Gagal menyimpan program.", "error"); }
        finally { setIsActionLoading(false); }
    };

    const handleDeleteProgram = (programId) => {
        showConfirm(
            "Hapus Program", "Apakah Anda yakin ingin menghapus program ini secara permanen?", "Ya, Hapus",
            async () => {
                setIsActionLoading(true);
                try {
                    await deleteDoc(doc(db, 'programs', programId));
                    await fetchPrograms();
                    showNotification("Berhasil", "Program berhasil dihapus.", "success");
                } catch (error) { showNotification("Terjadi Kesalahan", "Gagal menghapus program.", "error"); }
                finally { setIsActionLoading(false); }
            }
        );
    };

    if (loading) return null;

    return (
        <>
            <section className="page-section active page-section-relative">
                <article className="section-padding bg-light page-section-min100">
                    <div className="container">

                        <div className="admin-page-heading">
                            <h1 className="admin-dashboard-title">Admin Dashboard</h1>
                        </div>

                        <div className="admin-section-block">
                            <div className="admin-section-header">
                                <h3 className="section-title-small admin-section-title">
                                    Kelola Program
                                </h3>
                                <button onClick={() => handleModalOpen()} className="btn btn-orange admin-add-btn">+ Tambah Program</button>
                            </div>

                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-th-no">No</th>
                                            <th>Nama Program</th>
                                            <th>Lokasi</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {programs.length > 0 ? programs.map((prog, index) => (
                                            <tr key={prog.id}>
                                                <td className="admin-td-muted">#{index + 1}</td>
                                                <td className="admin-td-bold">{prog.name}</td>
                                                <td>{prog.location}</td>
                                                <td>
                                                    <button onClick={() => handleModalOpen(prog)} className="btn-table edit admin-btn-margin">Edit</button>
                                                    <button onClick={() => handleDeleteProgram(prog.id)} className="btn-table delete">Hapus</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="admin-td-empty">
                                                    Belum ada program. Klik '+ Tambah Program' untuk menambahkan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <div className="admin-section-header">
                                <h3 className="section-title-small admin-section-title">
                                    Daftar Relawan Bergabung
                                </h3>

                                <div className="admin-controls-row">
                                    <div className="sort-dropdown sort-dropdown-relative">
                                        <button onClick={() => setIsVolunteerSortOpen(!isVolunteerSortOpen)} className="btn btn-outline admin-sort-btn">
                                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16"><path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg> Urutkan
                                        </button>

                                        <div className={`dropdown-menu ${isVolunteerSortOpen ? 'active' : ''} dropdown-menu-admin`}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); sortVolunteers('latest'); }}>Terbaru</a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); sortVolunteers('oldest'); }}>Terlama</a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); sortVolunteers('programName'); }}>Nama Program (A-Z)</a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); sortVolunteers('volunteerName'); }}>Nama Relawan (A-Z)</a>
                                        </div>
                                    </div>

                                    {volunteers.length > 0 && (
                                        <button onClick={handleDeleteAllVolunteers} className="btn btn-outline btn-delete-all" disabled={isDeletingVolunteers}>
                                            {isDeletingVolunteers ? 'Menghapus...' : 'Hapus Semua'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Nama Relawan</th>
                                            <th>Program Pilihan</th>
                                            <th className="col-email">Email</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {volunteers.length > 0 ? volunteers.map((vol, index) => (
                                            <tr key={vol.id}>
                                                <td className="admin-td-bold">{vol.name || vol.volunteerName || 'Anonim'}</td>
                                                <td>{vol.programName || 'Program tidak diketahui'}</td>
                                                <td className="col-email">{vol.email || '-'}</td>
                                                <td>
                                                    <button onClick={() => openVolunteerModal(vol)} className="btn-table edit btn-table-detail">Lihat Detail</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="admin-td-empty-light">Belum ada relawan yang bergabung.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            {isFormModalOpen && (
                <div className="modal-overlay active modal-overlay-top" onClick={(e) => e.target.className.includes('modal-overlay') && handleModalClose()}>
                    <div className="modal-content modal-content-form" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal close-modal-abs" onClick={handleModalClose}>&times;</span>
                        <h2 className="modal-form-title">{editingProgramId ? 'Edit Program' : 'Tambah Program Baru'}</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Judul Program</label>
                                <input type="text" className="form-control" value={judul} onChange={(e) => setJudul(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi Program</label>
                                <textarea className="form-control textarea-no-resize" rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} required />
                            </div>
                            <div className="form-row form-row-flex">
                                <div className="form-group form-group-flex">
                                    <label>Batas Waktu Registrasi</label>
                                    <input type="date" className="form-control" value={batasRegistrasi} onChange={(e) => setBatasRegistrasi(e.target.value)} required />
                                </div>
                                <div className="form-group form-group-flex">
                                    <label>Lokasi Pelaksanaan</label>
                                    <input type="text" className="form-control" value={lokasi} onChange={(e) => setLokasi(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>SDGs Terkait (Pilih)</label>
                                <div className="sdg-picker-grid">
                                    {sdgData.map((sdg) => (
                                        <div key={sdg.id} onClick={() => handleSdgToggle(sdg.id)} className={`sdg-picker-item${selectedSdgIds.includes(sdg.id) ? ' sdg-picker-item-selected' : ''}`}>
                                            <img src={sdg.logoUrl} alt={sdg.name} className="sdg-picker-img" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>URL Gambar (Image Link)</label>
                                <input type="url" className="form-control" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                                {imageUrl && (
                                    <div className="img-preview-box">
                                        <img src={imageUrl} alt="Preview" className="img-preview" onError={(e) => { e.target.classList.add('hide-preview'); e.target.nextSibling.classList.add('show-error'); }} />
                                        <span className="img-preview-error">Gambar tidak dapat dimuat</span>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-orange btn-full-width btn-form-submit" disabled={isActionLoading}>
                                {isActionLoading ? 'Menyimpan...' : (editingProgramId ? 'Simpan Perubahan' : 'Tambah Program')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isVolunteerModalOpen && selectedVolunteer && (
                <div className="modal-overlay active modal-overlay-top" onClick={(e) => e.target.className.includes('modal-overlay') && closeVolunteerModal()}>
                    <div className="modal-content modal-content-volunteer" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal close-modal-abs" onClick={closeVolunteerModal}>&times;</span>
                        <h2 className="modal-volunteer-title">Detail Relawan</h2>
                        <p className="modal-volunteer-program">Mendaftar pada: <span className="modal-volunteer-program-name">{selectedVolunteer.programName || '-'}</span></p>
                        <div className="volunteer-detail-list">
                            <div>
                                <label className="volunteer-detail-label">Nama Lengkap</label>
                                <div className="volunteer-detail-value">{selectedVolunteer.name || selectedVolunteer.volunteerName || '-'}</div>
                            </div>
                            <div>
                                <label className="volunteer-detail-label">Email</label>
                                <div className="volunteer-detail-value">{selectedVolunteer.email || '-'}</div>
                            </div>
                            <div>
                                <label className="volunteer-detail-label">Nomor Telepon</label>
                                <div className="volunteer-detail-value">{selectedVolunteer.isLoadingDetails ? 'Memuat...' : (selectedVolunteer.phone || selectedVolunteer.phoneNumber || '-')}</div>
                            </div>
                            <div className="volunteer-detail-row">
                                <div className="volunteer-detail-col">
                                    <label className="volunteer-detail-label">Gender</label>
                                    <div className="volunteer-detail-value">{selectedVolunteer.isLoadingDetails ? 'Memuat...' : (selectedVolunteer.gender || '-')}</div>
                                </div>
                                <div className="volunteer-detail-col">
                                    <label className="volunteer-detail-label">Umur</label>
                                    <div className="volunteer-detail-value">{selectedVolunteer.isLoadingDetails ? 'Memuat...' : (selectedVolunteer.umur || '-')}</div>
                                </div>
                            </div>
                        </div>
                        <button onClick={closeVolunteerModal} className="btn btn-outline btn-full-width btn-close-volunteer">Tutup Panel</button>
                    </div>
                </div>
            )}

            {modalConfig.isOpen && (
                <div className="modal-overlay active modal-overlay-flex modal-overlay-top" onClick={closeNotificationModal}>
                    <div className="modal-content modal-content-center modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon-wrapper">
                            {modalConfig.type === 'success' && <svg className="modal-icon modal-icon-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            {(modalConfig.type === 'error' || modalConfig.type === 'confirm') && <svg className="modal-icon modal-icon-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            {modalConfig.type === 'info' && <svg className="modal-icon modal-icon-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        </div>
                        <h3 className="modal-title">{modalConfig.title}</h3>
                        <p className="modal-message">{modalConfig.message}</p>
                        <div className="modal-actions">
                            {modalConfig.type === 'confirm' ? (
                                <>
                                    <button className="btn btn-outline modal-btn-cancel" onClick={closeNotificationModal}>Batal</button>
                                    <button className="btn btn-orange btn-confirm-danger modal-btn-confirm" onClick={() => { modalConfig.onConfirm(); closeNotificationModal(); }}>{modalConfig.confirmText}</button>
                                </>
                            ) : (
                                <button className="btn btn-orange modal-btn-ok" onClick={closeNotificationModal}>OK, Mengerti</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}