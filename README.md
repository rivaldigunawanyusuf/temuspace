# TemuSpace

TemuSpace adalah inovasi platform komunitas modern berbasis gamifikasi (*gamified community platform*) yang membawa pengalaman "berkumpul" ke tingkat yang lebih interaktif dan menyenangkan. 

Dibangun dengan React (Vite) dan arsitektur *canvas-based isometric 2D*, TemuSpace memungkinkan pengguna untuk memiliki avatar mereka sendiri, berinteraksi dengan komunitas, dan menjelajahi lingkungan *Virtual HQ* interaktif.

## Fitur Utama

- **Virtual Room (Isometric 2D):** Ruangan markas (*Headquarters*) virtual dengan navigasi pergerakan titik *point-and-click*, dukungan tata letak modular (zona), *furniture*, karakter jamak, dan sistem batasan wilayah (*collision bounds*).
- **Admin & Mod Dashboard:** Pengelolaan kegiatan, sumber daya komunitas, acara, dan jadwal langsung dari aplikasi.
- **Event Manager:** Penjadwalan *event* dan integrasi kalender interaktif.
- **LMS (Learning Management System):** Manajemen modul pelatihan, tutorial, artikel, hingga video *embedded* dari YouTube bagi anggota komunitas.
- **Resource Vault:** Gudang *file*, panduan, dan aset digital.
- **Task Kanban:** Sistem manajemen tugas atau kolaborasi ala Kanban yang sangat responsif.

## Menjalankan Proyek di Lingkungan Lokal (Local Development)

Proyek ini menggunakan Vite sebagai *bundler* yang sangat cepat. Ikuti langkah di bawah ini untuk menjalankan kode di komputer lokal.

### Persyaratan Sistem
- Node.js versi 18.x atau lebih baru.
- NPM (terinstal otomatis bersama Node.js) atau Yarn.

### Langkah-langkah

1. **Buka Terminal / Command Prompt** dan arahkan ke dalam direktori *repository* ini.
2. **Install Dependensi** dengan menjalankan:
   ```bash
   npm install
   ```
3. **Mulai Development Server** dengan menjalankan:
   ```bash
   npm run dev
   ```
4. Buka *browser* Anda pada alamat `http://localhost:5173` untuk melihat *preview* langsung proyek TemuSpace. Semua modifikasi kode akan diperbarui secara *real-time* (HMR).

---

## Panduan Deployment (Publikasi Proyek)

Proyek ini menghasilkan aplikasi berupa SPA (*Single Page Application*) murni HTML, CSS, dan Javascript yang statis, sehingga sangat fleksibel dan mudah untuk di-*deploy* ke manapun.

### 1. Deployment ke Vercel (Sangat Direkomendasikan)

Vercel adalah platform optimal untuk aplikasi React berbasis Vite karena dikonfigurasi secara otomatis dan gratis.

1. Buat akun di [Vercel](https://vercel.com/) (gunakan akun GitHub agar lebih mudah).
2. Unggah *repository* proyek ini ke GitHub Anda.
3. Pada halaman *dashboard* Vercel, klik **"Add New"** > **"Project"**.
4. Impor *repository* GitHub tempat Anda mengunggah TemuSpace.
5. Vercel akan mendeteksi secara otomatis bahwa ini adalah proyek **Vite**. 
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klik **"Deploy"** dan tunggu hingga selesai. Vercel akan memberi Anda *link* otomatis untuk aplikasi yang sudah jadi.

### 2. Deployment ke VPS atau *Shared Hosting* (Menggunakan Nginx / Apache)

Jika Anda ingin menjalankan aplikasi ini di server pribadi (*VPS / Virtual Private Server*), Anda perlu melakukan *build* dan mengunggah kode jadinya (bukan *source code*).

1. Di komputer lokal Anda, *build* aplikasi dengan menjalankan perintah:
   ```bash
   npm run build
   ```
2. Perintah tersebut akan menciptakan folder baru bernama `dist/` di dalam *root* proyek. Semua *file* di dalam `dist/` ini adalah *file* statis yang sudah diproses dan dioptimalkan (HTML/CSS/JS).
3. Pindahkan (unggah/FTP) **seluruh isi** folder `dist/` tersebut ke folder web server Anda di VPS (misalnya `/var/www/html`).
4. **PENTING UNTUK ROUTING (SPA):** Karena ini *Single Page Application*, Anda perlu mengatur *server* agar mengarahkan (*fallback*) semua URL masuk (misalnya `/lms`, `/kanban`) ke `index.html`.

**Contoh konfigurasi Nginx:**
```nginx
server {
    listen 80;
    server_name namadomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Contoh konfigurasi `.htaccess` (untuk Apache / Shared Hosting):**
Buat *file* bernama `.htaccess` di *folder* yang sama dengan `index.html` dan isi dengan:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
