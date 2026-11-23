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
    renderKategoriDatalist();
    renderTableBarang(allBarangData);

    renderRingkasanRak(allBarangData);
isiDropdownFilterRak(allBarangData);

    // UPDATE WIDGET SIDEBAR DI HALAMAN BARANG
    if (typeof updateKapasitasWidget === 'function') {
        updateKapasitasWidget(allBarangData);
    }
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
        const limitKritis = typeof getStokKritisLimit === 'function' ? getStokKritisLimit() : 5;
        const isKritis = Number(item.stok) <= limitKritis;
        const namaBarang = item.nama_barang || item.nama || '-';
        const namaAman = String(namaBarang).replace(/'/g, "\\'");

        const stokDisplay = isKritis
            ? `<div class="inline-flex items-center gap-2">
                   <span class="font-semibold text-slate-900 tabular-nums">${item.stok} <span class="text-xs font-normal text-slate-400">${item.satuan}</span></span>
                   <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50/80 text-rose-700 border border-rose-200/70">
                       <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                       Stok Kritis
                   </span>
               </div>`
            : `<span class="font-semibold text-slate-700 tabular-nums">${item.stok} <span class="text-xs font-normal text-slate-400">${item.satuan}</span></span>`;

        return `
            <tr class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-5 font-semibold text-[#1d61d1]">${item.sku}</td>
                <td class="py-3.5 px-5 font-medium text-slate-800">${namaBarang}</td>
                <td class="py-3.5 px-5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80 capitalize">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        ${item.kategori_nama}
                    </span>
                </td>
                <td class="py-3.5 px-5">${stokDisplay}</td>
                <td class="py-3.5 px-5">
                    <span class="inline-block font-mono text-xs font-medium text-slate-600 bg-slate-50/80 border border-slate-200/80 px-2 py-0.5 rounded-md">
                        ${item.rak || '-'}
                    </span>
                </td>
                <td class="py-3.5 px-5 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-1.5">
                        <button type="button" onclick="openModalBarang('edit', '${item.sku}', '${namaAman}', '${item.kategori_nama}', ${item.stok}, '${item.satuan}', '${item.rak || ''}')" title="Edit Barang"
                            class="p-1.5 text-slate-500 hover:text-[#1d61d1] hover:bg-blue-50/70 rounded-lg transition">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button type="button" onclick="confirmDeleteBarang('${item.sku}')" title="Hapus Barang"
                            class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
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

// SIMPAN / EDIT BARANG KE SUPABASE
async function saveBarang() {
    const sku = document.getElementById('input-sku').value.trim();
    const nama_barang = document.getElementById('input-nama').value.trim();
    const kategori_nama = document.getElementById('input-kategori').value.trim() || 'Umum';
    const stok = parseInt(document.getElementById('input-stok').value, 10) || 0;
    const satuan = document.getElementById('input-satuan').value.trim() || 'unit';
    const rak = document.getElementById('input-rak').value.trim() || '-';

    if (!sku || !nama_barang) {
        alert('Kode SKU dan nama barang wajib diisi.');
        return;
    }

    let error;

    if (modeForm === 'edit') {
        const skuLama = document.getElementById('input-sku').dataset.oldSku || sku;

        ({ error } = await supabaseClient
            .from('barang')
            .update({
                sku,
                nama_barang,
                kategori_nama,
                stok,
                satuan,
                rak
            })
            .eq('sku', skuLama));
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

    // Catat kategori kustom agar otomatis tersimpan di Master Kategori
    saveCustomCategoryToLocal(kategori_nama);

    closeModal('modal-stok');
    await loadBarangFromSupabase();
}

function saveCustomCategoryToLocal(katName) {
    if (!katName) return;
    let customKategori = JSON.parse(localStorage.getItem('gudangku_custom_kategori') || '[]');
    if (!customKategori.includes(katName)) {
        customKategori.push(katName);
        localStorage.setItem('gudangku_custom_kategori', JSON.stringify(customKategori));
    }
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

function renderKategoriDatalist() {
    const datalist = document.getElementById('list-kategori-gudang');
    if (!datalist) return;

    const kategoriDefault = ['Elektronik', 'Jaringan', 'Aksesoris', 'Perkakas', 'Furniture', 'ATK'];
    const kategoriDatabase = (allBarangData || [])
        .map(item => (item.kategori_nama || '').trim())
        .filter(Boolean);
    const kategoriCustom = JSON.parse(localStorage.getItem('gudangku_custom_kategori') || '[]');

    const daftarKategori = [...new Set([
        ...kategoriDefault,
        ...kategoriDatabase,
        ...kategoriCustom
    ])].sort((a, b) => a.localeCompare(b, 'id'));

    datalist.innerHTML = daftarKategori
        .map(kat => `<option value="${kat}">`)
        .join('');
}

// Modal helper
async function openModalBarang(mode, sku = '', nama = '', kategori = '', stok = 0, satuan = '', rak = '') {
    modeForm = mode;
    const form = document.getElementById('form-barang');
    const title = document.querySelector('#modal-stok h3');
    const inputSku = document.getElementById('input-sku');

    if (form) form.reset();

    if (mode === 'edit') {
        if (title) title.textContent = 'Edit Data Barang';

        // Jika tombol Edit mengirim objek { sku, nama_barang, ... }
        if (typeof sku === 'object' && sku !== null) {
            const obj = sku;
            sku = obj.sku || '';
            nama = obj.nama_barang || '';
            kategori = obj.kategori_nama || '';
            stok = obj.stok ?? 0;
            satuan = obj.satuan || '';
            rak = obj.rak || '';
        } 
        // Jika tombol Edit hanya mengirim kode SKU saja, ambil sisa datanya dari Supabase
        else if (arguments.length === 2 && sku) {
            const { data } = await supabaseClient
                .from('barang')
                .select('*')
                .eq('sku', sku)
                .single();
            if (data) {
                nama = data.nama_barang || '';
                kategori = data.kategori_nama || '';
                stok = data.stok ?? 0;
                satuan = data.satuan || '';
                rak = data.rak || '';
            }
        }

        inputSku.value = sku;
        inputSku.dataset.oldSku = sku;
        inputSku.disabled = false;
        inputSku.readOnly = false;
        inputSku.classList.remove('bg-gray-100', 'cursor-not-allowed');

       document.getElementById('input-nama').value = nama;
        document.getElementById('input-kategori').value = kategori;
        document.getElementById('input-stok').value = stok;
        document.getElementById('input-satuan').value = satuan;
        document.getElementById('input-rak').value = rak;
    } else {
        if (title) title.textContent = 'Input Stok Barang Baru';
        renderKategoriDatalist(); // <-- Ganti dengan ini (atau pastikan sudah dipanggil di loadBarangFromSupabase)

        inputSku.value = '';
        delete inputSku.dataset.oldSku;
        inputSku.disabled = false;
        inputSku.readOnly = false;
        inputSku.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }

    openModal('modal-stok');
}
// ==========================================
// FITUR RINGKASAN & FILTER 16 LOKASI RAK (16 x 100 = 1.600 SLOT)
// ==========================================
const KAPASITAS_PER_RAK = 100;
const MASTER_RAK = [
    'Rak A-01', 'Rak A-02', 'Rak A-03', 'Rak A-04',
    'Rak B-01', 'Rak B-02', 'Rak B-03', 'Rak B-04',
    'Rak C-01', 'Rak C-02', 'Rak C-03', 'Rak C-04',
    'Rak D-01', 'Rak D-02', 'Rak D-03', 'Rak D-04'
];

function renderRingkasanRak(dataBarang) {
    const container = document.getElementById('ringkasan-rak-container');
    if (!container) return;

    // 1. Inisialisasi seluruh 16 rak master dengan nilai awal 0
    const grupRak = {};
    MASTER_RAK.forEach(kodeRak => {
        grupRak[kodeRak] = { jumlahSku: 0, totalUnit: 0 };
    });

    // 2. Hitung isi tiap rak dari data barang Supabase
    (dataBarang || []).forEach(item => {
        const namaRak = (item.lokasi_rak || item.rak || '').trim();
        if (!namaRak) return;

        // Jika ada data lama di luar 16 rak master (misal Rak V-03), tetap ikut ditampilkan
        if (!grupRak[namaRak]) {
            grupRak[namaRak] = { jumlahSku: 0, totalUnit: 0 };
        }
        grupRak[namaRak].jumlahSku += 1;
        grupRak[namaRak].totalUnit += Number(item.stok || 0);
    });

    const rakAktif = document.getElementById('filter-rak')?.value || 'SEMUA';

    container.innerHTML = Object.keys(grupRak).map(namaRak => {
        const info = grupRak[namaRak];
        const isKosong = info.totalUnit === 0;
        const persen = Math.min(Math.round((info.totalUnit / KAPASITAS_PER_RAK) * 100), 100);
        const isPenuh = persen >= 85;
        const isSelected = rakAktif === namaRak;

        const barColor = isPenuh ? 'bg-rose-500' : (persen >= 50 ? 'bg-amber-500' : 'bg-[#1d61d1]');
        const borderCard = isSelected
            ? 'border-[#1d61d1] ring-2 ring-[#1d61d1]/10 bg-slate-50/70'
            : (isKosong
                ? 'border-dashed border-slate-200 bg-slate-50/30 hover:border-slate-300'
                : 'border-slate-200/80 bg-white hover:border-slate-300');

        const badgeStatus = isKosong
            ? `<span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-400">Kosong</span>`
            : `<span class="text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-md ${isPenuh ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-slate-100/80 text-slate-600'}">${persen}%</span>`;

        return `
            <div onclick="pilihFilterRak('${namaRak}')"
                class="group cursor-pointer p-3.5 rounded-xl border ${borderCard} transition-all duration-150">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#1d61d1]' : (isKosong ? 'bg-slate-300' : 'bg-emerald-500')}"></span>
                        <span class="font-mono text-xs font-semibold ${isKosong ? 'text-slate-500' : 'text-slate-800'}">
                            ${namaRak}
                        </span>
                    </div>
                    ${badgeStatus}
                </div>

                <div class="flex items-baseline justify-between mt-3 mb-2">
                    <div class="text-base font-bold tracking-tight tabular-nums ${isKosong ? 'text-slate-400' : 'text-slate-900'}">
                        ${info.totalUnit}<span class="text-xs font-normal text-slate-400">/${KAPASITAS_PER_RAK}</span>
                    </div>
                    <span class="text-[11px] text-slate-400 tabular-nums">
                        ${isKosong ? '0 item' : `${info.jumlahSku} SKU`}
                    </span>
                </div>

                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-300" style="width: ${persen}%"></div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function isiDropdownFilterRak(dataBarang) {
    const selectRak = document.getElementById('filter-rak');
    if (!selectRak) return;

    const nilaiSebelumnya = selectRak.value;

    // Hitung unit per rak untuk info di dropdown
    const totalPerRak = {};
    MASTER_RAK.forEach(r => totalPerRak[r] = 0);
    (dataBarang || []).forEach(item => {
        const r = (item.lokasi_rak || item.rak || '').trim();
        if (r) totalPerRak[r] = (totalPerRak[r] || 0) + Number(item.stok || 0);
    });

    const semuaDaftarRak = Object.keys(totalPerRak);

    selectRak.innerHTML = `<option value="SEMUA">Semua Lokasi Rak (16 Rak)</option>` +
        semuaDaftarRak.map(rak => {
            const unit = totalPerRak[rak];
            const labelStatus = unit === 0 ? 'Kosong' : `${unit}/${KAPASITAS_PER_RAK} unit`;
            return `<option value="${rak}">${rak} — ${labelStatus}</option>`;
        }).join('');

    if (semuaDaftarRak.includes(nilaiSebelumnya)) {
        selectRak.value = nilaiSebelumnya;
    }
}

function pilihFilterRak(namaRak) {
    const selectRak = document.getElementById('filter-rak');
    if (!selectRak) return;

    selectRak.value = (selectRak.value === namaRak && namaRak !== 'SEMUA') ? 'SEMUA' : namaRak;
    terapkanFilterBarang();
}

function terapkanFilterBarang() {
    const rakDipilih = document.getElementById('filter-rak')?.value || 'SEMUA';
    const btnReset = document.getElementById('btn-reset-rak');

    if (btnReset) {
        btnReset.classList.toggle('hidden', rakDipilih === 'SEMUA');
    }

    const hasilFilter = (rakDipilih === 'SEMUA')
        ? allBarangData
        : allBarangData.filter(item => (item.lokasi_rak || item.rak || '').trim() === rakDipilih);

    renderRingkasanRak(allBarangData);
    renderTableBarang(hasilFilter);
}

let showAllRak = false;

function toggleTampilanRak() {
    showAllRak = !showAllRak;
    renderRingkasanRak(allBarangData);
}

function renderRingkasanRak(dataBarang) {
    const container = document.getElementById('ringkasan-rak-container');
    if (!container) return;

    // 1. Inisialisasi seluruh 16 rak master (16 x 100 = 1.600 slot)
    const grupRak = {};
    MASTER_RAK.forEach(kodeRak => {
        grupRak[kodeRak] = { jumlahSku: 0, totalUnit: 0 };
    });

    // 2. Hitung isi tiap rak dari data Supabase
    (dataBarang || []).forEach(item => {
        const namaRak = (item.lokasi_rak || item.rak || '').trim();
        if (!namaRak) return;

        if (!grupRak[namaRak]) {
            grupRak[namaRak] = { jumlahSku: 0, totalUnit: 0 };
        }
        grupRak[namaRak].jumlahSku += 1;
        grupRak[namaRak].totalUnit += Number(item.stok || 0);
    });

    const semuaKodeRak = Object.keys(grupRak);
    // Tampilkan 8 rak (2 baris) jika mode ringkas, atau seluruh rak jika mode penuh
    const rakDitampilkan = showAllRak ? semuaKodeRak : semuaKodeRak.slice(0, 8);
    const rakAktif = document.getElementById('filter-rak')?.value || 'SEMUA';

    // Update teks & ikon tombol See More
    const btnToggle = document.getElementById('btn-toggle-rak');
    if (btnToggle) {
        btnToggle.innerHTML = showAllRak
            ? `<span>Tampilkan 2 Baris</span><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`
            : `<span>Lihat Semua (${semuaKodeRak.length} Rak)</span><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>`;
    }

    container.innerHTML = rakDitampilkan.map(namaRak => {
        const info = grupRak[namaRak];
        const isKosong = info.totalUnit === 0;
        const persen = Math.min(Math.round((info.totalUnit / KAPASITAS_PER_RAK) * 100), 100);
        const isPenuh = persen >= 85;
        const isSelected = rakAktif === namaRak;

        const barColor = isPenuh ? 'bg-rose-500' : (persen >= 50 ? 'bg-amber-500' : 'bg-[#1d61d1]');
        const borderCard = isSelected
            ? 'border-[#1d61d1] ring-2 ring-[#1d61d1]/10 bg-slate-50/70'
            : (isKosong
                ? 'border-dashed border-slate-200 bg-slate-50/30 hover:border-slate-300'
                : 'border-slate-200/80 bg-white hover:border-slate-300');

        const badgeStatus = isKosong
            ? `<span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-400">Kosong</span>`
            : `<span class="text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-md ${isPenuh ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-slate-100/80 text-slate-600'}">${persen}%</span>`;

        return `
            <div onclick="pilihFilterRak('${namaRak}')"
                class="group cursor-pointer p-3.5 rounded-xl border ${borderCard} transition-all duration-150">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#1d61d1]' : (isKosong ? 'bg-slate-300' : 'bg-emerald-500')}"></span>
                        <span class="font-mono text-xs font-semibold ${isKosong ? 'text-slate-500' : 'text-slate-800'}">
                            ${namaRak}
                        </span>
                    </div>
                    ${badgeStatus}
                </div>

                <div class="flex items-baseline justify-between mt-3 mb-2">
                    <div class="text-base font-bold tracking-tight tabular-nums ${isKosong ? 'text-slate-400' : 'text-slate-900'}">
                        ${info.totalUnit}<span class="text-xs font-normal text-slate-400">/${KAPASITAS_PER_RAK}</span>
                    </div>
                    <span class="text-[11px] text-slate-400 tabular-nums">
                        ${isKosong ? '0 item' : `${info.jumlahSku} SKU`}
                    </span>
                </div>

                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-300" style="width: ${persen}%"></div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}