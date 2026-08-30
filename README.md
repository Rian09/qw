# BOT WA YONIF TP 953 — FIX EALLOWGIT

ZIP ini memperbaiki error `npm ERR! code EALLOWGIT` pada Google Cloud Shell.

Penyebabnya adalah Baileys memakai dependency Signal melalui GitHub Git pada dependency tree. Masalah ini memang telah dilaporkan pada Baileys; lingkungan yang menonaktifkan Git akan gagal menginstal dependency tersebut.

Versi ini menggunakan `npm overrides` agar dependency `libsignal` diarahkan ke paket npm:
`@whiskeysockets/libsignal-node@2.0.1`

## CARA INSTALL DI GOOGLE CLOUD SHELL

```bash
unzip bot-wa-yonif-tp-953-FIXED-EALLOWGIT.zip
cd bot-wa-yonif-tp-953-FIXED
rm -rf node_modules package-lock.json
npm cache verify
npm install
npm start
```

Jika Node lama:
```bash
node -v
```
Gunakan Node.js 20 atau lebih baru.

## QR WHATSAPP

Setelah `npm start`, QR akan muncul di terminal jika akun belum tertaut.

HP:
WhatsApp → Perangkat tertaut → Tautkan perangkat → Scan QR.

Jika sudah pernah tertaut, folder `auth_info_baileys` menyimpan sesi. Jangan bagikan folder tersebut.

## FITUR

- Pesan apa pun → pembuka
- `MENU` → menu 01–08
- 01 Pengaduan
- 02 Sinergi & Aspirasi
- 03 Informasi
- 04 Cek Status
- 05 Hubungi Petugas
- 06 Tentang Portal
- 07 Keadaan Darurat
- 08 Pengawasan Anggota
- Database JSON
- Nomor tiket otomatis
- BATAL / MENU
