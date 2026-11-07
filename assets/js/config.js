
// Konfigurasi Supabase Client
const SUPABASE_URL = 'https://tgkmeuolmminlrddmgyq.supabase.co';

// Masukkan Publishable Key lengkap dari Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_Hffu056L118VlPuy-KL6Ow_O2IMWR1q';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
