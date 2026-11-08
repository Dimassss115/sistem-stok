let allTransaksiData = [];
let allBarangList = [];
let activeFilter = 'SEMUA';

// Render Tabel dan Dropdown Barang saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabel-transaksi-body')) {
        loadTransaksiFromSupabase();
        loadSelectBarang();
    }
});

// 1. AMBIL RIWAYAT TRANSAKSI DARI SUPABASE
async function loadTransaksiFromSupabase() {
    const tbody = document.getElementById('tabel-transaksi-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-8 text-center text-gray-400">
                Memuat riwayat transaksi dari database...
            </td>
        </tr>
    `;

    const { data: trxData, error } = await supabaseClient
        .from('transaksi')
        .select('*')
        .order('id', { ascending: false });

    // Update Widget Sidebar Kapasitas Gudang
    const { data: barangData } = await supabaseClient
        .from('barang')
        .select('stok');

    if (barangData && typeof updateKapasitasWidget === 'function') {
        updateKapasitasWidget(barangData);
    }

    if (error) {
        console.error('Gagal mengambil data transaksi:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">Gagal memuat transaksi dari database. Periksa tabel 'transaksi' di Supabase.</td></tr>`;
        return;
    }

    allTransaksiData = trxData || [];
    filterTransaksi(activeFilter);
}

// 2. MUAT PILIHAN BARANG DINAMIS KE FORM MODAL TRANSAKSI
async function loadSelectBarang() {
    const select = document.getElementById('trx-barang-select');
    if (!select) return;

    const { data, error } = await supabaseClient
        .from('barang')
        .select('*')
        .order('nama_barang', { ascending: true });

    if (error || !data) {
        console.error('Gagal memuat daftar barang:', error);
        return;
    }

    allBarangList = data;

    if (data.length === 0) {
        select.innerHTML = '<option value="">Belum ada barang di database</option>';
        return;
    }

    select.innerHTML = data.map(item => `
        <option value="${escapeHTML(item.sku)}">
            ${escapeHTML(item.sku)} - ${escapeHTML(item.nama_barang)} (Stok Saat Ini: ${item.stok} ${escapeHTML(item.satuan || 'unit')})
        </option>
    `).join('');
}

// 3. TAMPILKAN TABEL TRANSAKSI
function renderTransaksiTable(data) {
    const tbody = document.getElementById('tabel-transaksi-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">
                    <i data-lucide="file-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Belum ada riwayat transaksi mutasi.
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isMasuk = item.tipe === 'MASUK';
        const badgeColor = isMasuk ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100';
        const iconMutasi = isMasuk ? 'arrow-down-left' : 'arrow-up-right';
        const prefixJumlah = isMasuk ? '+' : '-';
        
        const tglDisplay = item.created_at 
            ? new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : (item.tanggal || '-');

        const kodeTrx = item.kode_transaksi || `TRX-${item.id}`;

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-5 font-semibold text-gray-900">${escapeHTML(kodeTrx)}</td>
                <td class="py-3.5 px-5 text-gray-500">${tglDisplay}</td>
                <td class="py-3.5 px-5">
                    <p class="font-semibold text-[#1d61d1]">${escapeHTML(item.sku)}</p>
                    <p class="text-[11px] text-gray-500">${escapeHTML(item.nama_barang || item.nama)}</p>
                </td>
                <td class="py-3.5 px-5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 ${badgeColor} border rounded-full text-[11px] font-semibold">
                        <i data-lucide="${iconMutasi}" class="w-3.5 h-3.5"></i>
                        STOK ${item.tipe}
                    </span>
                </td>
                <td class="py-3.5 px-5 font-bold ${isMasuk ? 'text-emerald-600' : 'text-amber-600'}">
                    ${prefixJumlah}${item.jumlah} ${escapeHTML(item.satuan || 'unit')}
                </td>
                <td class="py-3.5 px-5 text-gray-500 max-w-xs truncate">${escapeHTML(item.keterangan || '-')}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// 4. FILTER TAB TRANSAKSI
function filterTransaksi(tipe) {
    activeFilter = tipe;

    ['semua', 'masuk', 'keluar'].forEach(t => {
        const tab = document.getElementById(`tab-${t}`);
        if (tab) {
            if (t.toUpperCase() === tipe) {
                tab.className = 'px-4 py-2 rounded-lg bg-white text-gray-800 shadow-sm transition';
            } else {
                tab.className = 'px-4 py-2 rounded-lg text-gray-500 hover:text-gray-800 transition';
            }
        }
    });

    let filtered = allTransaksiData;
    if (tipe !== 'SEMUA') {
        filtered = allTransaksiData.filter(item => item.tipe === tipe);
    }
    renderTransaksiTable(filtered);
}

// 5. LIVE SEARCH TRANSAKSI
function handleSearchTransaksi() {
    const keyword = document.getElementById('search-transaksi').value.toLowerCase().trim();
    const filtered = allTransaksiData.filter(item => {
        const matchesFilter = activeFilter === 'SEMUA' || item.tipe === activeFilter;
        const matchesKeyword = (item.kode_transaksi || '').toLowerCase().includes(keyword) ||
                               (item.sku || '').toLowerCase().includes(keyword) ||
                               (item.nama_barang || '').toLowerCase().includes(keyword) ||
                               (item.keterangan || '').toLowerCase().includes(keyword);
        return matchesFilter && matchesKeyword;
    });
    renderTransaksiTable(filtered);
}

// 6. SIMPAN TRANSAKSI & PERBARUI STOK BARANG DI SUPABASE
async function submitTransaksi() {
    const tipe = document.querySelector('input[name="tipe_mutasi"]:checked').value;
    const sku = document.getElementById('trx-barang-select').value;
    const jumlah = parseInt(document.getElementById('trx-jumlah').value, 10);
    const keterangan = document.getElementById('trx-keterangan').value.trim();

    if (!sku || isNaN(jumlah) || jumlah <= 0) {
        alert('Pilih barang dan masukkan jumlah transaksi yang valid.');
        return;
    }

    const targetBarang = allBarangList.find(b => b.sku === sku);
    if (!targetBarang) {
        alert('Data barang tidak ditemukan.');
        return;
    }

    const stokLama = Number(targetBarang.stok) || 0;
    let stokBaru = stokLama;

    if (tipe === 'MASUK') {
        stokBaru = stokLama + jumlah;
    } else if (tipe === 'KELUAR') {
        if (jumlah > stokLama) {
            alert(`Stok tidak mencukupi! Stok ${targetBarang.nama_barang} saat ini hanya ada ${stokLama} ${targetBarang.satuan || 'unit'}.`);
            return;
        }
        stokBaru = stokLama - jumlah;
    }

    // A. Update Jumlah Stok di Tabel 'barang' Supabase
    const { error: errUpdate } = await supabaseClient
        .from('barang')
        .update({ stok: stokBaru })
        .eq('sku', sku);

    if (errUpdate) {
        alert('Gagal mengupdate stok barang: ' + errUpdate.message);
        return;
    }

    // B. Simpan Log Riwayat Mutasi ke Tabel 'transaksi' Supabase
    const kodeTrx = `TRX-${Date.now().toString().slice(-6)}`;
    const { error: errInsert } = await supabaseClient
        .from('transaksi')
        .insert([{
            kode_transaksi: kodeTrx,
            sku: sku,
            nama_barang: targetBarang.nama_barang,
            tipe: tipe,
            jumlah: jumlah,
            satuan: targetBarang.satuan || 'unit',
            keterangan: keterangan || '-',
            petugas: 'Admin Gudang'
        }]);

    if (errInsert) {
        console.error('Gagal menyimpan log transaksi:', errInsert);
    }

    alert(`Transaksi Stok ${tipe} Berhasil!\nStok ${targetBarang.nama_barang} diperbarui dari ${stokLama} menjadi ${stokBaru} ${targetBarang.satuan || 'unit'}.`);

    closeModal('modal-transaksi');
    document.getElementById('form-transaksi').reset();

    // Reload Data Baru
    await loadSelectBarang();
    await loadTransaksiFromSupabase();
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}