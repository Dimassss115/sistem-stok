let allLaporanData = [];

// Load data saat halaman Laporan dibuka
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabel-laporan-body')) {
        loadLaporanFromSupabase();
        setDefaultFilterDate();
    }
});

// Set input tanggal default (Awal bulan ini s/d hari ini)
function setDefaultFilterDate() {
    const tglMulaiInput = document.getElementById('tgl-mulai');
    const tglSelesaiInput = document.getElementById('tgl-selesai');
    
    if (tglMulaiInput && tglSelesaiInput) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        tglMulaiInput.value = firstDay.toISOString().slice(0, 10);
        tglSelesaiInput.value = today.toISOString().slice(0, 10);
    }
}

// 1. AMBIL DATA RIWAYAT MUTASI DARI SUPABASE
async function loadLaporanFromSupabase() {
    const tbody = document.getElementById('tabel-laporan-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-8 text-center text-gray-400">
                Memuat data laporan dari database...
            </td>
        </tr>
    `;

    // Ambil data transaksi dari Supabase
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
        console.error('Gagal mengambil data laporan:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">Gagal memuat laporan dari database.</td></tr>`;
        return;
    }

    allLaporanData = trxData || [];
    filterLaporanByDate();
}

// 2. RENDER TABEL LAPORAN
function renderLaporan(data) {
    const tbody = document.getElementById('tabel-laporan-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">
                    <i data-lucide="file-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Tidak ada data mutasi pada rentang tanggal ini.
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isMasuk = item.tipe === 'MASUK';
        const badgeClass = isMasuk ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
        const textClass = isMasuk ? 'text-emerald-600' : 'text-amber-600';
        const prefix = isMasuk ? '+' : '-';

        const tglObj = item.created_at ? new Date(item.created_at) : null;
        const displayTanggal = tglObj 
            ? tglObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : (item.tanggal || '-');

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-4">${displayTanggal}</td>
                <td class="py-3.5 px-4 font-semibold text-[#1d61d1]">${escapeHTML(item.sku)}</td>
                <td class="py-3.5 px-4 font-medium text-gray-800">${escapeHTML(item.nama_barang || item.nama)}</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 ${badgeClass} rounded-full text-[10px] font-bold">STOK ${item.tipe}</span></td>
                <td class="py-3.5 px-4 font-bold ${textClass}">${prefix}${item.jumlah} ${escapeHTML(item.satuan || 'unit')}</td>
                <td class="py-3.5 px-4 text-gray-500">${escapeHTML(item.petugas || 'Admin Gudang')}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// 3. FILTER TANGGAL DINAMIS
function filterLaporanByDate() {
    const tglMulai = document.getElementById('tgl-mulai').value;
    const tglSelesai = document.getElementById('tgl-selesai').value;

    if (!tglMulai || !tglSelesai) {
        renderLaporan(allLaporanData);
        return;
    }

    const filtered = allLaporanData.filter(item => {
        if (!item.created_at) return true;
        const itemDate = item.created_at.substring(0, 10);
        return itemDate >= tglMulai && itemDate <= tglSelesai;
    });

    renderLaporan(filtered);
}

// 4. EKSPOR KE CSV
function exportToCSV() {
    if (!allLaporanData || allLaporanData.length === 0) {
        alert('Tidak ada data laporan untuk diekspor.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Kode TRX,Tanggal,SKU,Nama Barang,Jenis Mutasi,Jumlah,Satuan,Petugas\n";
    allLaporanData.forEach(row => {
        const tgl = row.created_at ? row.created_at.substring(0, 10) : (row.tanggal || '-');
        const kode = row.kode_transaksi || `TRX-${row.id}`;
        csvContent += `"${kode}","${tgl}","${row.sku}","${row.nama_barang || row.nama}","${row.tipe}","${row.jumlah}","${row.satuan || 'unit'}","${row.petugas || 'Admin Gudang'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Mutasi_Gudang_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}