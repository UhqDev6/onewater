# 🚀 Quick Start: Setup Cron Job (3 Menit)

## ✅ Vercel Free Plan: Pakai GitHub Actions (Gratis Selamanya)

### Step 1: Push ke GitHub
```bash
git add .github/workflows/ingest-snapshots.yml
git commit -m "Add cron job for beachwatch snapshot ingestion"
git push origin main
```

### Step 2: Enable GitHub Actions
1. Buka repo di GitHub
2. Tab **Actions** → Enable workflows

### Step 3: Test Manual
1. Actions → **"Ingest Beachwatch Snapshots"**
2. **"Run workflow"** → Run
3. Tunggu ~10 detik → Lihat logs

## ⏰ Jadwal Otomatis

**Sekarang:** Setiap 6 jam (00:00, 06:00, 12:00, 18:00 UTC)

**Ubah jadwal:** Edit `.github/workflows/ingest-snapshots.yml`

```yaml
# Setiap 1 jam
- cron: '0 * * * *'

# Setiap 6 jam (default)
- cron: '0 */6 * * *'

# Setiap 12 jam
- cron: '0 0,12 * * *'

# Sekali sehari jam 8 pagi UTC
- cron: '0 8 * * *'
```

## 📊 Monitoring

**Lihat logs:** GitHub → Actions → Click run tertentu

**Check database:** 
```sql
SELECT COUNT(*) FROM beachwatch_snapshots;
```

**API test manual:**
```bash
curl https://onewater.vercel.app/api/cron/ingest-snapshots
```

## 💰 Cost

✅ **GitHub Actions:** $0 (gratis)  
❌ **Vercel Cron:** $20/bulan (tidak perlu!)

---

**Dokumentasi lengkap:** `CRON_SETUP_GITHUB_ACTIONS.md`
