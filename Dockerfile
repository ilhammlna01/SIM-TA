# ========================================================
# Dockerfile — SIM Tugas Akhir Jurusan Manajemen FEB UTM
# Multi-stage production build dengan Node.js 24 LTS
# ========================================================

# Tahap 1: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Salin definisi dependensi
COPY package.json package-lock.json ./
RUN npm ci

# Salin kode sumber & lakukan kompilasi aset produksi (Vite)
COPY . .
RUN npm run build

# Tahap 2: Runtime Produksi
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Salin dependensi produksi saja
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Salin backend server, dist hasil build, data awal, dan scripts
COPY server ./server
COPY --from=builder /app/dist ./dist
COPY data ./data
COPY scripts ./scripts

# Buat direktori penyimpanan upload dan backup dengan izin akses non-root
RUN mkdir -p uploads/naskah uploads/syarat uploads/dokumen_resmi uploads/temp backups data \
    && chown -R node:node /app

# Jalankan container sebagai pengguna non-root
USER node

# Port default aplikasi
EXPOSE 5001

# Jalankan server
CMD ["node", "server/index.js"]
