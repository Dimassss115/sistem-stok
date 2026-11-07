let targetDeleteSku = null;
let modeForm = 'add';
let allBarangData = []; // Penampung data untuk fitur Live Search

// Muat data dari Supabase saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabel-barang-body')) {
        loadBarangFromSupabase();
    }
});

// 1. READ (Ambil Data Barang dari Supabase)
async function loadBarangFromSupabase() {
    const tbody = document.getElementById('tabel-barang-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-8 text-center text-gray-400">
                Memuat data dari database Supabase...
            </td>
        </tr>
    `;

    const { data: barangData, error } = await supabaseClient
        .from('barang')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Eror mengambil data:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">Gagal memuat data dari database.</td></tr>`;
        return;
    }

    allBarangData = barangData || [];
    renderTableBarang(allBarangData);
}

// 2. RENDER TABLE
function renderTableBarang(data) {
    const tbody = document.getElementById('tabel-barang-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">
                    <i data-lucide="package-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Belum ada data barang di database.
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isKritis = item.stok <= 5;
        const badgeKategoriColor = item.kategori_nama === 'Elektronik' 
            ? 'bg-blue-50 text-[#1d61d1]' 
            : 'bg-purple-50 text-purple-600';

        const stokDisplay = isKritis
            ? `${item.stok} ${item.satuan} <span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] rounded font-bold ml-2">Stok Kritis</span>`
            : `${item.stok} ${item.satuan}`;

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-5 font-semibold text-[#1d61d1]">${item.sku}</td>
                <td class="py-3.5 px-5 font-medium text-gray-900">${item.nama_barang}</td>
                <td class="py-3.5 px-5">
                    <span class="px-2.5 py-1 ${badgeKategoriColor} rounded-full text-[11px] font-medium">${item.kategori_nama || 'Umum'}</span>
                </td>
                <td class="py-3.5 px-5 font-semibold ${isKritis ? 'text-red-600 flex items-center' : ''}">${stokDisplay}</td>
                <td class="py-3.5 px-5 text-gray-400">${item.rak}</td>
                <td class="py-3.5 px-5 text-center text-gray-400">
                    <button onclick="openModalBarang('edit', '${item.sku}', '${item.nama_barang}', '${item.kategori_nama}', ${item.stok}, '${item.satuan}', '${item.rak}')" class="p-1 hover:text-[#1d61d1] mr-1" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDeleteBarang('${item.sku}')" class="p-1 hover:text-red-600" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// 3. FITUR LIVE SEARCH
function handleSearch() {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    const filtered = allBarangData.filter(item => 
        (item.sku && item.sku.toLowerCase().includes(keyword)) ||
        (item.nama_barang && item.nama_barang.toLowerCase().includes(keyword)) ||
        (item.rak && item.rak.toLowerCase().includes(keyword)) ||
        (item.kategori_nama && item.kategori_nama.toLowerCase().includes(keyword))
    );
    renderTableBarang(filtered);
}

// 4. CREATE & UPDATE (Simpan / Edit Barang ke Supabase)

async function saveBarang() {
    const sku = document.getElementById('input-sku').value.trim();
    const nama_barang = document.getElementById('input-nama').value.trim();
    const kategori_nama = document.getElementById('input-kategori').value;
    const stok = parseInt(document.getElementById('input-stok').value) || 0;
    const satuan = document.getElementById('input-satuan').value.trim() || 'unit';
    const rak = document.getElementById('input-rak').value.trim() || '-';

    if (!sku || !nama_barang) {
        alert('Kode SKU dan nama barang wajib diisi.');
        return;
    }

    let error;

    if (modeForm === 'edit') {
        ({ error } = await supabaseClient
            .from('barang')
            .update({
                nama_barang,
                kategori_nama,
                stok,
                satuan,
                rak
            })
            .eq('sku', sku));
    } else {
        ({ error } = await supabaseClient
            .from('barang')
            .insert([{
                sku,
                nama_barang,
                kategori_nama,
                stok,
                satuan,
                rak
            }]));
    }

    if (error) {
        alert('Gagal menyimpan barang: ' + error.message);
        console.error(error);
        return;
    }

    closeModal('modal-stok');
    await loadBarangFromSupabase();
}


// 5. DELETE (Hapus Barang dari Supabase)
function confirmDeleteBarang(sku) {
    targetDeleteSku = sku;
    document.getElementById('delete-target-sku').innerText = sku;
    openModal('modal-hapus');
}

async function executeDelete() {
    if (!targetDeleteSku) return;

    const { error } = await supabaseClient
        .from('barang')
        .delete()
        .eq('sku', targetDeleteSku);

    if (error) {
        alert('Gagal menghapus barang: ' + error.message);
    } else {
        targetDeleteSku = null;
        closeModal('modal-hapus');
        loadBarangFromSupabase();
    }
}

// Modal helper
function openModalBarang(mode = 'add', sku = '', nama = '', kategori = 'Elektronik', stok = '', satuan = '', rak = '') {
    modeForm = mode;
    const title = document.getElementById('modal-title');
    
    if (mode === 'edit') {
        title.innerText = 'Edit Data Barang';
        document.getElementById('input-sku').value = sku;
        document.getElementById('input-sku').readOnly = true;
        document.getElementById('input-nama').value = nama;
        document.getElementById('input-kategori').value = kategori;
        document.getElementById('input-stok').value = stok;
        document.getElementById('input-satuan').value = satuan;
        document.getElementById('input-rak').value = rak;
    } else {
        title.innerText = 'Input Stok Barang Baru';
        document.getElementById('input-sku').readOnly = false;
        document.getElementById('form-barang').reset();
    }

    openModal('modal-stok');
}