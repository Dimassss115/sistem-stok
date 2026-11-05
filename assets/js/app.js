// Inisialisasi Lucide Icons saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Fungsi Buka Modal (Tambah / Edit Data Barang)
function openModal(modalId, mode = 'add', sku = '', nama = '', kategori = 'Elektronik', stok = '', satuan = '', rak = '') {
    const modal = document.getElementById(modalId);
    const title = document.getElementById('modal-title');
    
    if (mode === 'edit') {
        title.innerText = 'Edit Data Barang';
        document.getElementById('input-sku').value = sku;
        document.getElementById('input-nama').value = nama;
        document.getElementById('input-kategori').value = kategori;
        document.getElementById('input-stok').value = stok;
        document.getElementById('input-satuan').value = satuan;
        document.getElementById('input-rak').value = rak;
    } else {
        title.innerText = 'Input Stok Barang Baru';
        document.getElementById('form-barang').reset();
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.firstElementChild.classList.remove('scale-95');
        modal.firstElementChild.classList.add('scale-100');
    }, 10);
}

// Fungsi Tutup Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.firstElementChild.classList.remove('scale-100');
    modal.firstElementChild.classList.add('scale-95');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}