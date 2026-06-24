# Setup Cron Job dengan GitHub Actions (100% Gratis)

## 🎯 Mengapa GitHub Actions?

✅ **Gratis selamanya** (2,000 menit/bulan free tier)  
✅ **Vercel Free Plan tidak support Cron Jobs**  
✅ **Stabil dan reliable**  
✅ **Manual trigger dari web GitHub**  
✅ **Logs lengkap dan jelas**

---

## 📁 File Yang Sudah Dibuat

File workflow sudah siap di:
```
.github/workflows/ingest-snapshots.yml
```

---

## 🚀 Cara Setup (3 Langkah)

### **Step 1: Push ke GitHub**

```bash
git add .github/workflows/ingest-snapshots.yml
git commit -m "Add GitHub Actions workflow for beachwatch snapshot ingestion"
git push origin main
```

### **Step 2: Aktifkan GitHub Actions**

1. Buka repository Anda di GitHub: `https://github.com/USERNAME/REPO-NAME`
2. Klik tab **"Actions"** di menu atas
3. Jika ada notifikasi untuk enable workflows, klik **"I understand my workflows, go ahead and enable them"**
4. Workflow **"Ingest Beachwatch Snapshots"** akan muncul di list

### **Step 3: Test Manual Trigger**

1. Di tab **Actions**, klik workflow **"Ingest Beachwatch Snapshots"**
2. Klik tombol **"Run workflow"** di sebelah kanan
3. Pilih branch **main**
4. (Opsional) Centang **"Dry run mode"** untuk test tanpa insert data
5. Klik **"Run workflow"**
6. Tunggu ~10 detik, refresh page
7. Klik run yang baru muncul untuk lihat logs

---

## ⏰ Jadwal Otomatis

Workflow akan berjalan **otomatis setiap 6 jam**:

**UTC Time:** 00:00, 06:00, 12:00, 18:00  
**WIB Time:** 07:00, 13:00, 19:00, 01:00

### Cara Ubah Jadwal

Edit file `.github/workflows/ingest-snapshots.yml`, bagian `cron`:

```yaml
# Setiap 6 jam (default sekarang)
- cron: '0 */6 * * *'

# Setiap 1 jam
- cron: '0 * * * *'

# Setiap 12 jam (tengah malam & siang)
- cron: '0 0,12 * * *'

# Sekali sehari jam 8 pagi UTC (3 sore WIB)
- cron: '0 8 * * *'

# Sekali sehari jam 1 pagi UTC (8 pagi WIB)
- cron: '0 1 * * *'
```

**Format Cron:**
```
┌───────────── menit (0 - 59)
│ ┌───────────── jam (0 - 23)
│ │ ┌───────────── hari dalam bulan (1 - 31)
│ │ │ ┌───────────── bulan (1 - 12)
│ │ │ │ ┌───────────── hari dalam minggu (0 - 6) (0 = Minggu)
│ │ │ │ │
* * * * *
```

---

## 📊 Melihat Logs & History

1. Buka **Actions** tab di GitHub
2. Klik workflow **"Ingest Beachwatch Snapshots"**
3. Lihat list semua runs (berhasil ✅ atau gagal ❌)
4. Klik run tertentu untuk lihat detail logs
5. Expand step **"🚀 Trigger Snapshot Ingestion"** untuk lihat response API

**Contoh log berhasil:**
```
Starting beachwatch snapshot ingestion...
Mode: Full Ingestion
HTTP Status: 200
Response Body:
{
  "success": true,
  "message": "Successfully ingested 245 beachwatch snapshots",
  "recordsProcessed": 245,
  "executionTimeMs": 3162,
  "stats": {
    "totalSnapshots": 490,
    "uniqueSites": 245
  }
}
✅ Ingestion completed successfully
```

---

## 🔧 Troubleshooting

### Issue: Workflow tidak jalan otomatis

**Solusi:**
1. Pastikan repository tidak private (atau enable Actions untuk private repo)
2. Pastikan branch `main` punya file workflow
3. GitHub Actions butuh minimal 1 push setelah workflow dibuat

### Issue: HTTP 500 Error

**Solusi:**
1. Cek apakah website Vercel sedang down
2. Cek logs di Vercel dashboard
3. Test manual: `curl https://onewater.vercel.app/api/cron/ingest-snapshots`

### Issue: Domain berubah

**Solusi:**
Edit file `.github/workflows/ingest-snapshots.yml`, ganti URL:
```yaml
URL="https://domain-baru-anda.com/api/cron/ingest-snapshots"
```

---

## 🎛️ Advanced: Dengan Authentication (Opsional)

Jika ingin mengamankan endpoint dengan token:

### 1. Buat Secret Token

```bash
# Generate random token
openssl rand -hex 32
# Output: abc123def456...
```

### 2. Tambahkan ke Environment Variables

**Di Vercel:**
1. Dashboard Vercel → Project Settings → Environment Variables
2. Tambahkan: `CRON_SECRET_TOKEN=abc123def456...`
3. Deploy ulang

**Di GitHub:**
1. Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CRON_SECRET_TOKEN`
4. Value: `abc123def456...`

### 3. Update Workflow File

Edit `.github/workflows/ingest-snapshots.yml`:

```yaml
- name: 🚀 Trigger Snapshot Ingestion
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
         https://onewater.vercel.app/api/cron/ingest-snapshots
```

### 4. Update API Route

Edit `src/app/api/cron/ingest-snapshots/route.ts`, uncomment bagian auth:

```typescript
const authHeader = request.headers.get('authorization');
const configuredToken = process.env.CRON_SECRET_TOKEN;

if (configuredToken && authHeader !== `Bearer ${configuredToken}`) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

---

## 📈 Monitoring

### Check Total Records di Supabase

1. Buka Supabase dashboard
2. Table Editor → `beachwatch_snapshots`
3. Lihat total rows bertambah setiap hari

### Query Statistics

```sql
-- Total snapshots
SELECT COUNT(*) FROM beachwatch_snapshots;

-- Unique sites
SELECT COUNT(DISTINCT site_id) FROM beachwatch_snapshots;

-- Date range
SELECT 
  MIN(latest_result_observation_date) as earliest,
  MAX(latest_result_observation_date) as latest
FROM beachwatch_snapshots;

-- Records per day
SELECT 
  DATE(latest_result_observation_date::timestamp) as date,
  COUNT(*) as records
FROM beachwatch_snapshots
GROUP BY date
ORDER BY date DESC
LIMIT 30;
```

---

## 💰 Cost Analysis

### GitHub Actions (yang kita pakai)
- **Cost:** $0 (gratis selamanya)
- **Free tier:** 2,000 menit/bulan
- **Usage kita:** ~3 detik per run × 4 runs/hari × 30 hari = **6 menit/bulan**
- **Remaining:** 1,994 menit untuk workflow lain

### Vercel Cron (alternatif berbayar)
- **Cost:** $20/bulan (Pro Plan)
- **Not worth it** kalau cuma buat cron job

---

## ✅ Summary

**Setup selesai!** Setelah push ke GitHub:

1. ✅ Cron job otomatis jalan setiap 6 jam
2. ✅ Data historical bertambah setiap hari
3. ✅ 100% gratis dengan GitHub Actions
4. ✅ Bisa manual trigger kapan saja
5. ✅ Logs lengkap dan jelas

**Next:** Build time-series chart untuk visualisasi data! 📈
