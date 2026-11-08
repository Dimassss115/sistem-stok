let allBarangKategori = [];
let groupedKategori = [];

// Muat data saat halaman Kategori dibuka
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('grid-kategori')) {
        loadKategoriFromSupabase();
    }
});

// 1. AMBIL DATA DARI SUPABASE & KELOMPOKKAN KATEGORI
async function loadKategoriFromSupabase() {
    const container = document.getElementById('grid-kategori');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-400">
            Memuat data kategori...
        </div>
    `;

    const { data, error } = await supabaseClient
        .from('barang')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Gagal mengambil data:', error);
        container.innerHTML = `<div class="col-span-3 text-center py-8 text-red-500">Gagal memuat data kategori.</div>`;
        return;
    }

    allBarangKategori = data || [];
    
    // Update Widget Sidebar Kapasitas Gudang
    if (typeof updateKapasitasWidget === 'function') {
        updateKapasitasWidget(allBarangKategori);
    }

    processAndRenderKategori(allBarangKategori);
}

// 2. OLAH KATEGORI DINAMIS + KATEGORI KUSTOM
function processAndRenderKategori(barangList) {
    const counts = {};
    
    // Hitung jumlah barang dari database
    barangList.forEach(item => {
        const kat = (item.kategori_nama || 'Umum').trim();
        counts[kat] = (counts[kat] || 0) + 1;
    });

    // Ambil daftar kategori kustom dari localStorage
    const customList = JSON.parse(localStorage.getItem('gudangku_custom_kategori') || '[]');
    customList.forEach(kat => {
        if (counts[kat] === undefined) {
            counts[kat] = 0; // Kategori baru tanpa barang
        }
    });

    const iconMap = {
        'Elektronik': 'laptop',
        'Jaringan': 'network',
        'Aksesoris': 'plug',
        'Perkakas': 'wrench',
        'Furniture': 'armchair',
        'ATK': 'file-text'
    };

    groupedKategori = Object.keys(counts).map(nama => {
        return {
            nama: nama,
            count: counts[nama],
            icon: iconMap[nama] || 'folder'
        };
    });

    renderKategoriCard(groupedKategori);
}

// 3. TAMPILKAN KARTU KATEGORI DENGAN DESAIN BIRU DASHBOARD
function renderKategoriCard(data) {
    const container = document.getElementById('grid-kategori');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-8 text-gray-400">
                <i data-lucide="folder-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                Belum ada kategori terdaftar.
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = data.map(item => `
        <div onclick="openDetailKategoriModal('${escapeHTML(item.nama)}')" class="bg-[#1d61d1] p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-700 shadow-sm transition">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-white text-[#1d61d1] rounded-xl shadow-sm">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-base">${escapeHTML(item.nama)}</h3>
                    <p class="text-xs text-blue-100 font-medium">${item.count} Item Terdaftar</p>
                </div>
            </div>
            <div class="flex items-center gap-1 text-blue-200">
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// 4. LIVE SEARCH KATEGORI
function handleSearchKategori() {
    const keyword = document.getElementById('search-kategori').value.toLowerCase().trim();
    const filtered = groupedKategori.filter(item => item.nama.toLowerCase().includes(keyword));
    renderKategoriCard(filtered);
}

// 5. TAMBAH KATEGORI BARU DARI MODAL KATEGORI
function openModalKategori(mode = 'add', nama = '') {
    const title = document.getElementById('modal-kategori-title');
    const input = document.getElementById('input-nama-kategori');
    if (input) input.value = '';
    openModal('modal-kategori');
}

function saveKategori() {
    const inputNama = document.getElementById('input-nama-kategori').value.trim();
    if (!inputNama) return;

    let customKategori = JSON.parse(localStorage.getItem('gudangku_custom_kategori') || '[]');
    if (!customKategori.includes(inputNama)) {
        customKategori.push(inputNama);
        localStorage.setItem('gudangku_custom_kategori', JSON.stringify(customKategori));
    }

    closeModal('modal-kategori');
    loadKategoriFromSupabase();
}

// 6. MODAL DETAIL BARANG PER KATEGORI
function openDetailKategoriModal(namaKategori) {
    const title = document.getElementById('modal-detail-kategori-title');
    const tbody = document.getElementById('tabel-detail-kategori-body');

    if (title) title.textContent = `Daftar Barang Kategori: ${namaKategori}`;

    const itemsFiltered = allBarangKategori.filter(item => (item.kategori_nama || 'Umum') === namaKategori);

    if (!tbody) return;

    if (itemsFiltered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 text-center text-gray-400">
                    Tidak ada barang dalam kategori ini.
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = itemsFiltered.map(item => {
           // Di dalam openDetailKategoriModal(namaKategori):
const limitKritis = typeof getStokKritisLimit === 'function' ? getStokKritisLimit() : 5;
const isKritis = Number(item.stok) <= limitKritis;
            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="py-3 px-4 font-semibold text-[#1d61d1]">${escapeHTML(item.sku)}</td>
                    <td class="py-3 px-4 font-medium text-gray-800">${escapeHTML(item.nama_barang)}</td>
                    <td class="py-3 px-4 font-semibold ${isKritis ? 'text-red-600' : 'text-gray-700'}">
                        ${Number(item.stok).toLocaleString('id-ID')} ${escapeHTML(item.satuan || 'unit')}
                    </td>
                    <td class="py-3 px-4 text-gray-500">${escapeHTML(item.rak || '-')}</td>
                    <td class="py-3 px-4 text-center">
                        ${isKritis 
                            ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-bold">Stok Kritis</span>'
                            : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] rounded-full font-bold">Aman</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (window.lucide) lucide.createIcons();
    openModal('modal-detail-kategori');
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}