// Mock Data Stok Gudang
let barangData = [
    { sku: 'BRG-001', nama: 'Laptop Asus Core i5', kategori: 'Elektronik', stok: 12, satuan: 'unit', rak: 'Rak A-01' },
    { sku: 'BRG-002', nama: 'Kabel LAN Cat6 50m', kategori: 'Jaringan', stok: 3, satuan: 'roll', rak: 'Rak B-03' },
    { sku: 'BRG-003', nama: 'Switch Hub 16 Port', kategori: 'Jaringan', stok: 25, satuan: 'unit', rak: 'Rak B-01' }
];

let targetDeleteSku = null;

// Inisialisasi saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderTable(barangData);
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Fungsi Render Tabel Barang & Badge Stok Kritis
function renderTable(data) {
    const tbody = document.getElementById('tabel-barang-body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">
                    <i data-lucide="package-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Data barang tidak ditemukan.
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isKritis = item.stok <= 5;
        const badgeKategoriColor = item.kategori === 'Elektronik' 
            ? 'bg-blue-50 text-[#1d61d1]' 
            : 'bg-purple-50 text-purple-600';

        const stokDisplay = isKritis
            ? `${item.stok} ${item.satuan} <span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] rounded font-bold ml-2">Stok Kritis</span>`
            : `${item.stok} ${item.satuan}`;

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-5 font-semibold text-[#1d61d1]">${item.sku}</td>
                <td class="py-3.5 px-5 font-medium text-gray-900">${item.nama}</td>
                <td class="py-3.5 px-5">
                    <span class="px-2.5 py-1 ${badgeKategoriColor} rounded-full text-[11px] font-medium">${item.kategori}</span>
                </td>
                <td class="py-3.5 px-5 font-semibold ${isKritis ? 'text-red-600 flex items-center' : ''}">${stokDisplay}</td>
                <td class="py-3.5 px-5 text-gray-400">${item.rak}</td>
                <td class="py-3.5 px-5 text-center text-gray-400">
                    <button onclick="openModal('modal-stok', 'edit', '${item.sku}', '${item.nama}', '${item.kategori}', ${item.stok}, '${item.satuan}', '${item.rak}')" class="p-1 hover:text-[#1d61d1] mr-1" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDelete('${item.sku}')" class="p-1 hover:text-red-600" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Fitur Live Search
function handleSearch() {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    const filtered = barangData.filter(item => 
        item.sku.toLowerCase().includes(keyword) ||
        item.nama.toLowerCase().includes(keyword) ||
        item.rak.toLowerCase().includes(keyword) ||
        item.kategori.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
}

// Konfirmasi Hapus (Buka Modal Red Alert)
function confirmDelete(sku) {
    targetDeleteSku = sku;
    document.getElementById('delete-target-sku').innerText = sku;
    openModal('modal-hapus');
}

// Eksekusi Hapus Data
function executeDelete() {
    if (targetDeleteSku) {
        barangData = barangData.filter(item => item.sku !== targetDeleteSku);
        renderTable(barangData);
        targetDeleteSku = null;
        closeModal('modal-hapus');
    }
}

// Fungsi Generic Buka Modal
function openModal(modalId, mode = 'add', sku = '', nama = '', kategori = 'Elektronik', stok = '', satuan = '', rak = '') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modalId === 'modal-stok') {
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
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.firstElementChild.classList.remove('scale-95');
        modal.firstElementChild.classList.add('scale-100');
    }, 10);
}

// Fungsi Generic Tutup Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.firstElementChild.classList.remove('scale-100');
    modal.firstElementChild.classList.add('scale-95');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}