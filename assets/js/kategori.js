// Mock Data Kategori Barang
let kategoriData = [
    { id: 1, nama: 'Elektronik', count: 12, icon: 'laptop', colorBg: 'bg-blue-50', colorText: 'text-[#1d61d1]' },
    { id: 2, nama: 'Jaringan', count: 8, icon: 'network', colorBg: 'bg-purple-50', colorText: 'text-purple-600' },
    { id: 3, nama: 'Aksesoris', count: 5, icon: 'plug', colorBg: 'bg-emerald-50', colorText: 'text-emerald-600' }
];

let targetEditKategori = null;

// Render Kategori saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('grid-kategori')) {
        renderKategori(kategoriData);
    }
});

function renderKategori(data) {
    const container = document.getElementById('grid-kategori');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-8 text-gray-400">
                <i data-lucide="folder-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                Kategori tidak ditemukan.
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="p-3 ${item.colorBg} ${item.colorText} rounded-2xl">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-sm">${item.nama}</h3>
                    <p class="text-xs text-gray-400">${item.count} Item Terdaftar</p>
                </div>
            </div>
            <div class="flex gap-1 text-gray-400">
                <button onclick="openModalKategori('edit', '${item.nama}')" class="p-1.5 hover:text-[#1d61d1]"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button onclick="deleteKategori('${item.nama}')" class="p-1.5 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function handleSearchKategori() {
    const keyword = document.getElementById('search-kategori').value.toLowerCase().trim();
    const filtered = kategoriData.filter(item => item.nama.toLowerCase().includes(keyword));
    renderKategori(filtered);
}

function openModalKategori(mode = 'add', nama = '') {
    const title = document.getElementById('modal-kategori-title');
    const input = document.getElementById('input-nama-kategori');
    if (mode === 'edit') {
        title.innerText = 'Edit Kategori Barang';
        input.value = nama;
        targetEditKategori = nama;
    } else {
        title.innerText = 'Tambah Kategori Baru';
        input.value = '';
        targetEditKategori = null;
    }
    openModal('modal-kategori');
}

function saveKategori() {
    const inputNama = document.getElementById('input-nama-kategori').value.trim();
    if (!inputNama) return;

    if (targetEditKategori) {
        const item = kategoriData.find(k => k.nama === targetEditKategori);
        if (item) item.nama = inputNama;
    } else {
        kategoriData.push({
            id: Date.now(),
            nama: inputNama,
            count: 0,
            icon: 'folder',
            colorBg: 'bg-blue-50',
            colorText: 'text-[#1d61d1]'
        });
    }

    renderKategori(kategoriData);
    closeModal('modal-kategori');
}

function deleteKategori(nama) {
    confirmDelete(nama);
}