import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  id: {
    translation: {
      "welcome": "Selamat Datang di TemuSpace",
      "explore": "Jelajahi Fitur",
      "login": "Masuk / Daftar",
      "home": "Beranda",
      "resources": "LMS",
      "events": "Acara",
      "profile": "Profil",
      "adminPanel": "Panel Admin",
      "settings": "Pengaturan",
      "logout": "Keluar",
      "darkMode": "Mode Gelap",
      "lightMode": "Mode Terang",
      "accessibility": "Aksesibilitas (Zoom)",
      "language": "Bahasa",
      "cancel_rsvp": "Batal RSVP",
      "rsvp_now": "RSVP Sekarang",
      "this_month": "Bulan Ini",
      "join_virtual_room": "Gabung Virtual Room",
      "back": "Kembali",
      "lms_modules": "Modul LMS",
      "all": "Semua",
      "search_resources": "Cari modul pembelajaran atau resource...",
      "write_discussion": "Tulis pertanyaan atau diskusi...",
      "discussion": "Diskusi",
      "learning_materials": "Materi Pembelajaran",
      "completed": "Selesai",
      "mark_complete": "Tandai Selesai",
      "reply": "Balas",
      "no_comments": "Belum ada komentar.",
      "save_changes": "Simpan Perubahan",
      "write_comment": "Tulis komentar...",
      "replying_to": "Membalas",
      "submit_post": "Kirim Postingan",
      "cancel": "Batal",
      "post_tags": "Tambahkan tag (pisahkan dengan spasi, mulai dengan #)...",
      "post_body": "Apa yang ingin Anda diskusikan?",
      "post_title": "Judul Postingan",
      "collab_post": "Postingan Kolaborasi",
      "create_post": "Buat Postingan",
      "search_placeholder": "Cari topik diskusi, pengguna, atau tag...",
      "collab_name": "Nama kolaborator",
      "member_portal": "MEMBER PORTAL",
      "admin_erp": "ADMIN ERP",
      "switch_to": "Pindah ke",
      "create_event_new": "Buat Event Baru",
      "submit_event": "Ajukan Event",
    }
  },
  en: {
    translation: {
      "welcome": "Welcome to TemuSpace",
      "explore": "Explore Features",
      "login": "Login / Register",
      "home": "Home",
      "resources": "LMS",
      "events": "Events",
      "profile": "Profile",
      "adminPanel": "Admin Panel",
      "settings": "Settings",
      "logout": "Logout",
      "darkMode": "Dark Mode",
      "lightMode": "Light Mode",
      "accessibility": "Accessibility (Zoom)",
      "language": "Language",
      "cancel_rsvp": "Cancel RSVP",
      "rsvp_now": "RSVP Now",
      "this_month": "This Month",
      "join_virtual_room": "Join Virtual Room",
      "back": "Back",
      "lms_modules": "LMS Modules",
      "all": "All",
      "search_resources": "Search learning modules or resources...",
      "write_discussion": "Write a question or discussion...",
      "discussion": "Discussion",
      "learning_materials": "Learning Materials",
      "completed": "Completed",
      "mark_complete": "Mark Complete",
      "reply": "Reply",
      "no_comments": "No comments yet.",
      "save_changes": "Save Changes",
      "write_comment": "Write a comment...",
      "replying_to": "Replying to",
      "submit_post": "Submit Post",
      "cancel": "Cancel",
      "post_tags": "Add tags (space-separated, start with #)...",
      "post_body": "What do you want to discuss?",
      "post_title": "Post Title",
      "collab_post": "Collab Post",
      "create_post": "Create Post",
      "search_placeholder": "Search discussion topics, users, or tags...",
      "collab_name": "Collaborator Name",
      "member_portal": "MEMBER PORTAL",
      "admin_erp": "ADMIN ERP",
      "switch_to": "Switch to",
      "create_event_new": "Create New Event",
      "submit_event": "Submit Event",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "id", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
