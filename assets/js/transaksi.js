// Mock Data Transaksi Mutasi Stok
let transaksiData = [
    { id: 'TRX-2026-001', tanggal: '05 Nov 2026, 14:30', sku: 'BRG-001', nama: 'Laptop Asus Core i5', tipe: 'MASUK', jumlah: 10, satuan: 'unit', keterangan: 'Restock dari PT. Asus Tek' },
    { id: 'TRX-2026-002', tanggal: '05 Nov 2026, 11:15', sku: 'BRG-002', nama: 'Kabel LAN Cat6 50m', tipe: 'KELUAR', jumlah: 5, satuan: 'roll', keterangan: 'Penggunaan Lab Komputer 2' },
    { id: 'TRX-2026-003', tanggal: '04 Nov 2026, 09:00', sku: 'BRG-003', nama: 'Switch Hub 16 Port', tipe: 'MASUK', jumlah: 15, satuan: 'unit', keterangan: 'Pengadaan Divisi IT' }
];

let activeFilter = 'SEMUA';

// Render Tabel Transaksi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabel-transaksi-body')) {
        renderTransaksiTable(transaksiData);
    }
});

function renderTransaksiTable(data) {
    const tbody = document.getElementById('tabel-transaksi-body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">
                    <i data-lucide="file-search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Riwayat transaksi tidak ditemukan.
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

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-5 font-semibold text-gray-900">${item.id}</td>
                <td class="py-3.5 px-5 text-gray-500">${item.tanggal}</td>
                <td class="py-3.5 px-5">
                    <p class="font-semibold text-[#1d61d1]">${item.sku}</p>
                    <p class="text-[11px] text-gray-500">${item.nama}</p>
                </td>
                <td class="py-3.5 px-5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 ${badgeColor} border rounded-full text-[11px] font-semibold">
                        <i data-lucide="${iconMutasi}" class="w-3.5 h-3.5"></i>
                        STOK ${item.tipe}
                    </span>
                </td>
                <td class="py-3.5 px-5 font-bold ${isMasuk ? 'text-emerald-600' : 'text-amber-600'}">
                    ${prefixJumlah}${item.jumlah} ${item.satuan}
                </td>
                <td class="py-3.5 px-5 text-gray-500 max-w-xs truncate">${item.keterangan}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Filter Berdasarkan Tab (Semua, Masuk, Keluar)
function filterTransaksi(tipe) {
    activeFilter = tipe;
    
    // Toggle active tab style
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

    let filtered = transaksiData;
    if (tipe !== 'SEMUA') {
        filtered = transaksiData.filter(item => item.tipe === tipe);
    }
    renderTransaksiTable(filtered);
}

// Live Search Transaksi
function handleSearchTransaksi() {
    const keyword = document.getElementById('search-transaksi').value.toLowerCase().trim();
    const filtered = transaksiData.filter(item => {
        const matchesFilter = activeFilter === 'SEMUA' || item.tipe === activeFilter;
        const matchesKeyword = item.id.toLowerCase().includes(keyword) ||
                               item.sku.toLowerCase().includes(keyword) ||
                               item.nama.toLowerCase().includes(keyword) ||
                               item.keterangan.toLowerCase().includes(keyword);
        return matchesFilter && matchesKeyword;
    });
    renderTransaksiTable(filtered);
}

// Submit Input Transaksi Baru
function submitTransaksi() {
    const tipe = document.querySelector('input[name="tipe_mutasi"]:checked').value;
    const sku = document.getElementById('trx-barang-select').value;
    const jumlah = parseInt(document.getElementById('trx-jumlah').value);
    const keterangan = document.getElementById('trx-keterangan').value;

    const namaMap = {
        'BRG-001': { nama: 'Laptop Asus Core i5', satuan: 'unit' },
        'BRG-002': { nama: 'Kabel LAN Cat6 50m', satuan: 'roll' },
        'BRG-003': { nama: 'Switch Hub 16 Port', satuan: 'unit' }
    };

    const newTrx = {
        id: `TRX-2026-00${transaksiData.length + 1}`,
        tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        sku: sku,
        nama: namaMap[sku].nama,
        tipe: tipe,
        jumlah: jumlah,
        satuan: namaMap[sku].satuan,
        keterangan: keterangan || '-'
    };

    transaksiData.unshift(newTrx);
    filterTransaksi(activeFilter);
    closeModal('modal-transaksi');
    document.getElementById('form-transaksi').reset();
}