// ==========================================
// PENGAMAN HALAMAN (CEK LOGIN)
// ==========================================
// Jika tidak ada "kunci" gudangku_auth, langsung lempar kembali ke halaman login
if (!sessionStorage.getItem('gudangku_auth')) {
    window.location.replace('login.html');
}

// Fungsi untuk Keluar Sistem (Logout)
function prosesLogout(event) {
    if (event) event.preventDefault();

    const yakin = confirm('Apakah Anda yakin ingin keluar dari akun Admin Gudang?');
    if (!yakin) return;
    
    // Hapus kunci akses
    sessionStorage.removeItem('gudangku_auth');
    
    // Kembalikan ke halaman login
    window.location.replace('login.html');
}

// ==========================================
// APP.JS - FUNGSI UMUM GUDANGKU
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Buka Modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');

    setTimeout(() => {
        modal.classList.remove('opacity-0');

        if (modal.firstElementChild) {
            modal.firstElementChild.classList.remove('scale-95');
            modal.firstElementChild.classList.add('scale-100');
        }
    }, 10);
}

// Tutup Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modal.firstElementChild) {
        modal.firstElementChild.classList.remove('scale-100');
        modal.firstElementChild.classList.add('scale-95');
    }

    modal.classList.add('opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// ==========================================
// HITUNG WIDGET KAPASITAS GUDANG DINAMIS
// ==========================================
function updateKapasitasWidget(dataBarang) {
    const textElem = document.getElementById('text-storage-rak');
    const barElem = document.getElementById('bar-storage-rak');
    const persenElem = document.getElementById('persen-storage-rak');
    const barVolumeElem = document.getElementById('bar-volume-terisi');

    if (!textElem || !Array.isArray(dataBarang)) return;

    // Hitung total unit stok dari data yang ada
    const totalStok = dataBarang.reduce((acc, curr) => acc + (Number(curr.stok) || 0), 0);
    const maxKapasitas = 1600; // Batas total slot gudang
    const persentase = Math.min(Math.round((totalStok / maxKapasitas) * 100), 100);

    // Update Tampilan Widget Sidebar
    textElem.textContent = `${totalStok.toLocaleString('id-ID')} dari ${maxKapasitas.toLocaleString('id-ID')} slot terpakai`;
    
    if (persenElem) persenElem.textContent = `${persentase}%`;
    if (barElem) barElem.style.width = `${persentase}%`;
    if (barVolumeElem) barVolumeElem.style.width = `${persentase}%`;
}

// ==========================================
// KONTROL BATAS STOK KRITIS DINAMIS
// ==========================================
function getStokKritisLimit() {
    return parseInt(localStorage.getItem('gudangku_stok_kritis'), 10) || 5;
}

function ubahBatasStokKritis() {
    const inputElem = document.getElementById('input-batas-kritis');
    const errorElem = document.getElementById('error-batas-kritis');

    // Jika dibuka dari halaman lain yang belum memiliki modal kustomnya
    if (!inputElem) {
        const limitLama = getStokKritisLimit();
        const inputBaru = prompt('Masukkan batas maksimal unit untuk Stok Kritis:', limitLama);
        if (inputBaru !== null && !isNaN(parseInt(inputBaru, 10)) && parseInt(inputBaru, 10) >= 0) {
            localStorage.setItem('gudangku_stok_kritis', parseInt(inputBaru, 10));
            location.reload();
        }
        return;
    }

    inputElem.value = getStokKritisLimit();
    if (errorElem) errorElem.classList.add('hidden');
    openModal('modal-stok-kritis');

    setTimeout(() => {
        inputElem.focus();
        inputElem.select();
    }, 50);
}

function simpanBatasStokKritis() {
    const inputElem = document.getElementById('input-batas-kritis');
    const errorElem = document.getElementById('error-batas-kritis');
    const val = parseInt(inputElem.value.trim(), 10);

    if (isNaN(val) || val < 0) {
        if (errorElem) errorElem.classList.remove('hidden');
        return;
    }

    localStorage.setItem('gudangku_stok_kritis', val);
    closeModal('modal-stok-kritis');

    // Perbarui ringkasan dan tabel secara langsung tanpa reload halaman
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    } else if (typeof loadBarangFromSupabase === 'function') {
        loadBarangFromSupabase();
    } else {
        location.reload();
    }
}