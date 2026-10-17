#!/usr/bin/env bash
# Sao lưu cơ sở dữ liệu hằng ngày, giữ 30 ngày gần nhất.
# Tự nhận biết MariaDB / SQLite theo DB_CLIENT trong file .env của ứng dụng.
# Cài vào cron:  sudo crontab -e  →  30 1 * * * /opt/ngsi/deploy/backup.sh >> /var/log/ngsi-backup.log 2>&1
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/ngsi}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ngsi}"
KEEP_DAYS="${KEEP_DAYS:-30}"

# đọc cấu hình từ .env (chỉ các dòng KEY=VALUE)
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r k v; do
    [[ "$k" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    export "$k=$v"
  done < <(grep -E '^[A-Z_][A-Z0-9_]*=' "$ENV_FILE")
fi
DB_CLIENT="${DB_CLIENT:-mariadb}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M)"

if [ "$DB_CLIENT" = "sqlite" ]; then
  DATA_DIR="${DATA_DIR:-/var/lib/ngsi}"
  OUT="$BACKUP_DIR/ngsi-$STAMP.db"
  # Tên file "ptkt.db" đúng thật (backend/lib/store.js hard-code dbFile=path.join(DATA_DIR,"ptkt.db") bất
  # kể tên app) – không phải lỗi gõ nhầm, chỉ là tên file nội bộ chưa đổi theo, không ảnh hưởng gì.
  sqlite3 "$DATA_DIR/ptkt.db" ".backup '$OUT'"
  gzip -f "$OUT"; OUT="$OUT.gz"
else
  OUT="$BACKUP_DIR/ngsi-$STAMP.sql.gz"
  DUMP="$(command -v mariadb-dump || command -v mysqldump)"
  MYSQL_PWD="${DB_PASSWORD:-}" "$DUMP" --single-transaction --quick --routines --default-character-set=utf8mb4 \
    -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER:-ngsi}" "${DB_NAME:-ngsi}" | gzip > "$OUT"
fi
chmod 600 "$OUT"
find "$BACKUP_DIR" \( -name 'ngsi-*.db.gz' -o -name 'ngsi-*.sql.gz' \) -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') Đã sao lưu ($DB_CLIENT): $OUT ($(du -h "$OUT" | cut -f1))"
