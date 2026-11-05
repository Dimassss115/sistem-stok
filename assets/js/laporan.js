// Mock Data Laporan Mutasi Stok
let laporanData = [
    { tanggal: '2026-11-05', displayTanggal: '05 Nov 2026', sku: 'BRG-001', nama: 'Laptop Asus Core i5', jenis: 'MASUK', jumlah: 10, satuan: 'unit', petugas: 'Admin Gudang' },
    { tanggal: '2026-11-05', displayTanggal: '05 Nov 2026', sku: 'BRG-002', nama: 'Kabel LAN Cat6 50m', jenis: 'KELUAR', jumlah: 5, satuan: 'roll', petugas: 'Admin Gudang' },
    { tanggal: '2026-11-04', displayTanggal: '04 Nov 2026', sku: 'BRG-003', nama: 'Switch Hub 16 Port', jenis: 'MASUK', jumlah: 15, satuan: 'unit', petugas: 'Admin Gudang' }
];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabel-laporan-body')) {
        renderLaporan(laporanData);
    }
});

function renderLaporan(data) {
    const tbody = document.getElementById('tabel-laporan-body');
    if (!tbody) return;

    if (data.length === 0) {
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
        const isMasuk = item.jenis === 'MASUK';
        const badgeClass = isMasuk ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
        const textClass = isMasuk ? 'text-emerald-600' : 'text-amber-600';
        const prefix = isMasuk ? '+' : '-';

        return `
            <tr class="hover:bg-gray-50/50 transition">
                <td class="py-3.5 px-4">${item.displayTanggal}</td>
                <td class="py-3.5 px-4 font-semibold text-[#1d61d1]">${item.sku}</td>
                <td class="py-3.5 px-4 font-medium text-gray-800">${item.nama}</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-1 ${badgeClass} rounded-full text-[10px] font-bold">${item.jenis}</span></td>
                <td class="py-3.5 px-4 font-bold ${textClass}">${prefix}${item.jumlah} ${item.satuan}</td>
                <td class="py-3.5 px-4 text-gray-500">${item.petugas}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function filterLaporanByDate() {
    const tglMulai = document.getElementById('tgl-mulai').value;
    const tglSelesai = document.getElementById('tgl-selesai').value;

    if (!tglMulai || !tglSelesai) {
        renderLaporan(laporanData);
        return;
    }

    const filtered = laporanData.filter(item => item.tanggal >= tglMulai && item.tanggal <= tglSelesai);
    renderLaporan(filtered);
}

// Download Laporan ke Format CSV
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Tanggal,SKU,Nama Barang,Jenis,Jumlah,Satuan,Petugas\n";
    laporanData.forEach(row => {
        csvContent += `${row.displayTanggal},${row.sku},${row.nama},${row.jenis},${row.jumlah},${row.satuan},${row.petugas}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Mutasi_Gudang_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}