'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { db, auth, provider } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function ProgramPage() {
    const router = useRouter();
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [user, setUser] = useState(null);
    const [userRegistrations, setUserRegistrations] = useState({});
    const [processingId, setProcessingId] = useState(null);

    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });

    const showNotification = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirmCallback) => {
        setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm: onConfirmCallback });
    };

    const closeModal = () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setIsLoginPromptOpen(false);
                try {
                    const q = query(collection(db, 'registrations'), where('volunteerId', '==', currentUser.uid));
                    const querySnapshot = await getDocs(q);
                    const regs = {};
                    querySnapshot.forEach((docSnap) => {
                        regs[docSnap.data().programId] = docSnap.id;
                    });
                    setUserRegistrations(regs);
                } catch (error) {
                    console.error("Error fetching user registrations:", error);
                }
            } else {
                setUserRegistrations({});
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'programs'));
                const programsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Default sort: Latest created
                programsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setPrograms(programsList);
            } catch (error) {
                console.error("Error fetching programs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrograms();
    }, []);

    const handleJoinProgram = async (prog) => {
        if (!user) {
            setIsLoginPromptOpen(true);
            return;
        }

        setProcessingId(prog.id);
        try {
            const userDocRef = doc(db, 'artifacts', 'untuk-esok-web', 'users', user.uid, 'profile', 'info');
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                const isIncomplete = !data.firstName || !data.lastName || !data.phone || !data.gender || !data.dob;

                if (isIncomplete) {
                    router.push('/profil?incomplete=true');
                    return;
                }

                const registrationData = {
                    programId: prog.id,
                    programName: prog.name,
                    volunteerId: user.uid,
                    name: `${data.firstName} ${data.lastName}`.trim(),
                    email: user.email,
                    phone: data.phone,
                    createdAt: serverTimestamp()
                };
                const docRef = await addDoc(collection(db, 'registrations'), registrationData);
                setUserRegistrations(prev => ({ ...prev, [prog.id]: docRef.id }));
                showNotification("Berhasil!", `Anda terdaftar di program: ${prog.name}.`, "success");
            } else {
                router.push('/profil?incomplete=true');
            }
        } catch (error) {
            showNotification("Error", "Gagal memproses pendaftaran.", "error");
        } finally { setProcessingId(null); }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
            setIsLoginPromptOpen(false);
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    const handleCancelProgram = (prog) => {
        showConfirm("Konfirmasi", `Batal ikut program: ${prog.name}?`, async () => {
            setProcessingId(prog.id);
            try {
                const regId = userRegistrations[prog.id];
                if (regId) {
                    await deleteDoc(doc(db, 'registrations', regId));
                    setUserRegistrations(prev => {
                        const updated = { ...prev };
                        delete updated[prog.id];
                        return updated;
                    });
                    showNotification("Dibatalkan", "Pendaftaran berhasil dibatalkan.", "info");
                }
            } catch (error) {
                showNotification("Error", "Gagal membatalkan.", "error");
            } finally { setProcessingId(null); }
        });
    };

    const calculateDaysRemaining = (deadline) => {
        if (!deadline) return "Batas waktu tidak ditentukan";
        const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diff > 0 ? `${diff} Hari lagi` : diff === 0 ? "Hari ini terakhir" : "Ditutup";
    };

    const sortPrograms = (type) => {
        let sorted = [...programs];
        if (type === 'latest') {
            sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        } else if (type === 'oldest') {
            sorted.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
        } else if (type === 'name') {
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (type === 'deadline_low') {
            sorted.sort((a, b) => {
                const dateA = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline || 0);
                const dateB = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline || 0);
                return dateA - dateB;
            });
        } else if (type === 'deadline_high') {
            sorted.sort((a, b) => {
                const dateA = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline || 0);
                const dateB = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline || 0);
                return dateB - dateA;
            });
        }

        setPrograms(sorted);
        setIsDropdownOpen(false);
    };

    return (
        <>
            <section id="program" className="page-section active page-section-relative">
                <article className="section-padding bg-light page-section-min80">
                    <div className="container">
                        <div className="filter-bar">
                            <h2>Program Kami</h2>

                            <div className="sort-dropdown">
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                                    </svg>
                                    Urutkan
                                </button>
                                <div className={`dropdown-menu ${isDropdownOpen ? 'active' : ''} dropdown-menu-program`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); sortPrograms('latest'); }}>Terbaru</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); sortPrograms('oldest'); }}>Terlama</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); sortPrograms('deadline_low'); }}>Batas Terdekat</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); sortPrograms('deadline_high'); }}>Batas Terlama</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); sortPrograms('name'); }}>Nama Program (A-Z)</a>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="program-loading"></div>
                        ) : programs.length === 0 ? (
                            <div className="program-empty">Belum ada program yang tersedia saat ini.</div>
                        ) : (
                            <div className="program-list">
                                {programs.map((prog) => {
                                    const isJoined = !!userRegistrations[prog.id];
                                    const isProcessing = processingId === prog.id;

                                    return (
                                        <div key={prog.id} className="program-list-item">
                                            <div className="pli-img">
                                                {prog.imageUrl && <img src={prog.imageUrl} alt={prog.name} className="pli-img-content" />}
                                            </div>
                                            <div className="pli-content">
                                                <h3 className="pli-title">{prog.name}</h3>
                                                <p className="pli-desc">{prog.description}</p>
                                                <div className="pli-meta">
                                                    <span>Batas: {calculateDaysRemaining(prog.deadline)}</span>
                                                    <span>Lokasi: {prog.location}</span>
                                                    <div className="sdg-badges-row">
                                                        {prog.sdgIds?.map(id => (
                                                            <img key={id} src={`/sdgs/sdg-${id}.png`} alt={`SDG ${id}`} className="sdg-badge-img" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="pli-action">
                                                    <button
                                                        className={`btn btn-outline pli-btn${isJoined ? ' pli-btn-cancel' : ''}`}
                                                        onClick={() => isJoined ? handleCancelProgram(prog) : handleJoinProgram(prog)}
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? "..." : isJoined ? "Batal Ikut" : "Ikut Program"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </article>
            </section>

            {isLoginPromptOpen && (
                <div className="modal-overlay active modal-overlay-flex modal-overlay-top" onClick={() => setIsLoginPromptOpen(false)}>
                    <div className="modal-content modal-content-center modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={() => setIsLoginPromptOpen(false)}>&times;</span>
                        <h2 className="modal-login-title">Masuk / Sign In</h2>
                        <button className="btn-google" onClick={handleGoogleLogin}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="google-logo-img" />
                            Sign in with Google
                        </button>
                    </div>
                </div>
            )}

            {modalConfig.isOpen && (
                <div className="modal-overlay active modal-overlay-flex modal-overlay-top" onClick={closeModal}>
                    <div className="modal-content modal-content-center modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">{modalConfig.title}</h3>
                        <p className="modal-message modal-message-top">{modalConfig.message}</p>
                        <div className="modal-actions">
                            {modalConfig.type === 'confirm' ? (
                                <>
                                    <button className="btn btn-outline" onClick={closeModal}>Kembali</button>
                                    <button className="btn btn-orange btn-confirm-danger" onClick={() => { modalConfig.onConfirm(); closeModal(); }}>Ya, Batalkan</button>
                                </>
                            ) : <button className="btn btn-orange" onClick={closeModal}>OK, Mengerti</button>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}