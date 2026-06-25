# Akses Aplikasi AMI Prodi via LAN

Panduan untuk menjalankan dan mengakses aplikasi dari device lain di jaringan lokal.

---

## 🚀 Cara Menjalankan di LAN

### 1. **Jalankan Development Server**

```bash
npm run dev
```

Server akan berjalan di:
- **Local:** http://localhost:3000
- **Network:** http://192.168.x.x:3000 (IP lokal komputer kamu)

### 2. **Cari IP Address Komputer Kamu**

**Windows:**
```cmd
ipconfig
```
Cari bagian **IPv4 Address** di network adapter yang aktif (WiFi atau Ethernet).

Contoh output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Linux/Mac:**
```bash
ifconfig
# atau
ip addr show
```

### 3. **Akses dari Device Lain**

Dari device lain (HP, laptop, tablet) yang tersambung ke **jaringan yang sama**, buka browser dan akses:

```
http://192.168.1.100:3000
```

*(Ganti `192.168.1.100` dengan IP address komputer kamu)*

---

## 🔥 Firewall & Port

Jika tidak bisa diakses, pastikan:

### Windows Firewall

1. Buka **Windows Defender Firewall** → **Advanced Settings**
2. **Inbound Rules** → klik **New Rule**
3. Pilih **Port** → Next
4. **TCP** → Specific local ports: `3000` → Next
5. **Allow the connection** → Next
6. Pilih **Domain, Private, Public** → Next
7. Name: "Next.js Dev Server" → Finish

**Atau via Command Prompt (Run as Administrator):**

```cmd
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
```

### Linux (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

## 🏭 Production Mode (untuk testing di LAN)

### Build dan jalankan production server:

```bash
npm run build
npm run start
```

Production server juga akan listen di `0.0.0.0:3000`, bisa diakses via IP LAN.

---

## 🗄️ Database MySQL/MariaDB di LAN

Jika kamu mau device lain juga bisa akses database (untuk development/testing):

### 1. Edit MySQL Configuration

**Windows (XAMPP):** Edit `C:\xampp\mysql\bin\my.ini`

**Linux:** Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`

Cari baris:
```ini
bind-address = 127.0.0.1
```

Ganti jadi:
```ini
bind-address = 0.0.0.0
```

### 2. Restart MySQL/MariaDB

**Windows (XAMPP):** Stop dan start MySQL di control panel

**Linux:**
```bash
sudo systemctl restart mysql
# atau
sudo systemctl restart mariadb
```

### 3. Grant Access ke User Database

Masuk ke MySQL console:
```bash
mysql -u root -p
```

Jalankan:
```sql
-- Untuk user 'root' dari semua host (HATI-HATI, hanya untuk dev!)
GRANT ALL PRIVILEGES ON ami_prodi.* TO 'root'@'%' IDENTIFIED BY 'password_kamu';
FLUSH PRIVILEGES;
```

⚠️ **PERINGATAN:** Ini hanya untuk development! Di production, gunakan user spesifik dengan password kuat dan batasi host.

### 4. Update `.env` (jika perlu)

Jika database di komputer lain, ganti:
```env
DATABASE_URL="mysql://root:password@192.168.1.100:3306/ami_prodi"
```

---

## 📱 Testing di Mobile

1. Pastikan HP/tablet tersambung ke **WiFi yang sama**
2. Buka browser (Chrome/Safari)
3. Akses: `http://192.168.1.100:3000` (ganti dengan IP komputer kamu)
4. Login dengan akun test:
   - Admin: `admin@polines.ac.id` / `password123`
   - Kaprodi: `kaprodi.ti@polines.ac.id` / `password123`
   - Dosen: `idhawati.hestiningsih@polines.ac.id` / `password123`

---

## 🔒 Keamanan

- **Development mode** hanya untuk testing di LAN internal
- Jangan expose dev server ke internet publik
- Gunakan HTTPS dan authentication yang proper di production
- Batasi akses database hanya ke IP yang dipercaya

---

## 🐛 Troubleshooting

### "ERR_CONNECTION_REFUSED"

- ✅ Pastikan dev server masih berjalan (`npm run dev`)
- ✅ Cek firewall tidak block port 3000
- ✅ Pastikan device tersambung ke jaringan yang sama
- ✅ Coba ping IP server dari device lain: `ping 192.168.1.100`

### "Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr"

Error ini muncul ketika mengakses dari IP yang belum terdaftar di `allowedDevOrigins`. Next.js memblokir akses HMR (Hot Module Replacement) dari origin lain untuk keamanan.

**Solusi:**

1. **Tambahkan IP ke `next.config.ts`:**

   Buka file `next.config.ts` dan tambahkan IP address device kamu ke array `allowedDevOrigins`:

   ```typescript
   allowedDevOrigins: [
     "172.16.162.212",
     "172.16.94.93",
     "192.168.1.100",  // Tambahkan IP baru di sini
   ],
   ```

2. **Restart Dev Server:**

   Perubahan di `next.config.ts` **TIDAK akan ter-apply** tanpa restart server:

   ```bash
   # Stop server (Ctrl+C), lalu jalankan lagi:
   npm run dev
   ```

3. **Reload Browser:**

   Setelah server restart, refresh halaman di browser.

**⚠️ Catatan Penting:**

- Next.js **TIDAK mendukung wildcard** seperti `0.0.0.0` atau `172.16.*.*`
- Setiap IP harus didaftarkan secara individual
- Jika sering ganti IP (DHCP), pertimbangkan set static IP di router atau gunakan hostname

**Alternatif (Use with Caution):**

Jika mau allow semua IP (hanya untuk dev environment yang aman):

```typescript
// next.config.ts
webpack: (config, { dev, isServer }) => {
  if (dev && !isServer) {
    config.devServer = {
      ...config.devServer,
      allowedHosts: 'all',
    };
  }
  return config;
},
```

### "Cannot read from database"

- ✅ Pastikan MySQL/MariaDB berjalan
- ✅ Cek `DATABASE_URL` di `.env` sudah benar
- ✅ Jika database di komputer lain, pastikan sudah grant access dan bind-address = 0.0.0.0

### Slow Connection

- Development server dengan Turbopack biasanya cukup cepat
- Jika lambat, pastikan tidak ada interferensi WiFi
- Pertimbangkan pakai kabel LAN untuk testing

---

## 📚 Referensi

- [Next.js CLI Options](https://nextjs.org/docs/app/api-reference/cli/next)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
