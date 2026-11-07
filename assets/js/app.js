
// ==========================================
// APP.JS - FUNGSI UMUM APLIKASI GUDANGKU
// ==========================================

// Inisialisasi ikon Lucide
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Fungsi Generic Buka Modal
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

// Fungsi Generic Tutup Modal
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
