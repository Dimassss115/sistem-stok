// Konfigurasi Supabase Client
const SUPABASE_URL = 'https://tgkmeuolmminlrddmgyq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Hffu056L118VlPuy-KL60w_02IMW...'; // Tempel publishable key lengkap di sini

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);