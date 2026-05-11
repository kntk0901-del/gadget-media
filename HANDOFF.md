# Handoff — ローカル検証完了 → Supabase / Vercel 連携

ローカルでビルド・テスト・型検査まで通っています。
ここから先は **あなたのアカウント（Supabase / Vercel / GitHub）が必要**なので、私が代行できません。
以下を順に実行してください。

---

## ✅ 完了済み（ローカル）

| Step | 状況 |
|---|---|
| Node.js LTS インストール | v24.15.0 |
| `npm install` | 447 パッケージ |
| Next.js セキュリティパッチ | 14.2.35 |
| `npm run typecheck` | ✅ pass |
| `npm test` | ✅ 14/14 pass |
| `npm run build` | ✅ 17 ルート / 5 API / middleware OK |

---

## 1. Supabase プロジェクト作成（5 分）

1. <https://supabase.com/dashboard> でログイン → **New project**
2. プロジェクト名: `gadget-media` などお好みで
3. **Database password** は手元に控える（あとで使う）
4. リージョンは Tokyo（`Northeast Asia (Tokyo)`）推奨
5. プロジェクト作成完了を待つ（〜2 分）

---

## 2. スキーマ + シードを流す（3 分）

Supabase ダッシュボードで:

1. 左メニュー **SQL Editor** → **New query**
2. `supabase/migrations/0001_init.sql` の中身を全コピペ → **Run**
3. もう一度 **New query** → `supabase/migrations/0002_seed.sql` を全コピペ → **Run**

確認:
```sql
select count(*) from sources;     -- 12
select count(*) from categories;  -- 12
select count(*) from tags;        -- 23
```

---

## 3. 管理ユーザーを作る（2 分）

1. Supabase 左メニュー **Authentication → Users → Add user → Create new user**
2. メールとパスワードを入力（Email confirm は外して OK）
3. 作成後、その user の **UID をコピー**
4. SQL Editor で:
   ```sql
   insert into admin_users (user_id, role)
   values ('<paste-UID-here>', 'admin');
   ```

---

## 4. API キーを取得して `.env.local` を埋める（2 分）

Supabase 左メニュー **Project Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role`（secret）→ `SUPABASE_SERVICE_ROLE_KEY`

ランダムシークレットを生成:

```powershell
# PowerShell
-join ((1..32) | ForEach-Object { Get-Random -Maximum 16 | %{ '{0:x}' -f $_ } })
```

`.env.local` の `INGEST_TOKEN` と `CRON_SECRET` にそれぞれ別の値を入れる。

---

## 5. ローカルで動かす（1 分）

```powershell
cd C:\Users\kntk0\Documents\Claude\gadget-media
npm run dev
```

ブラウザで:

1. <http://localhost:3000> → 公開サイト（まだ空）
2. <http://localhost:3000/admin/login> → 3 で作ったメール/パスワードでログイン
3. <http://localhost:3000/admin/logs> → **Trigger ingest** ボタンを押す
4. 30〜60 秒で 12 ソースから RSS を取得 → カテゴリ分類 → 重複検出 → スコアリング
5. <http://localhost:3000/> をリロードすると記事が並ぶ

うまく動かないとき:

| 症状 | 対処 |
|---|---|
| `ingest already running` | SQL Editor で `delete from ingest_locks;` |
| RLS エラー | `admin_users` に行が入っていない |
| 取得 0 件 | サーバーログ確認、ソースの `is_enabled = true` か確認 |
| ログインで `Invalid login` | パスワードかメール違い |

---

## 6. Vercel デプロイ（10 分）

### a. GitHub にプッシュ

```powershell
cd C:\Users\kntk0\Documents\Claude\gadget-media
git init
git add .
git commit -m "feat: initial gadget media MVP"
gh repo create gadget-media --private --source=. --push
# gh が無ければブラウザで GitHub に新規リポジトリ作って手動 push
```

### b. Vercel にインポート

1. <https://vercel.com/new> → GitHub アカウント連携 → `gadget-media` を import
2. Framework は自動検出（Next.js）
3. **Environment Variables** に `.env.local` の中身を全部貼る:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → デプロイ後の本番 URL に**変更**（後で更新可）
   - `NEXT_PUBLIC_SITE_NAME`
   - `INGEST_TOKEN`
   - `CRON_SECRET`
4. **Deploy** ボタン

### c. Cron 確認

デプロイ完了後、Vercel ダッシュボードで:

**Project → Settings → Cron Jobs** に以下 2 件が登録されているはず:

- `/api/cron/ingest`           every day 21:00 UTC
- `/api/cron/recompute-featured` every day 21:30 UTC

タイムゾーンは UTC。日本時間にしたい場合は `vercel.json` の cron schedule を編集して再デプロイ。

### d. 初回 ingest を手動キック

```powershell
$token = "あなたの INGEST_TOKEN"
$url   = "https://your-app.vercel.app/api/ingest"
Invoke-WebRequest -Uri $url -Method POST -Headers @{"x-ingest-token"=$token}
```

---

## 7. 公開準備（任意）

- 独自ドメイン → Vercel **Settings → Domains**
- OGP 画像 → `public/og.png` を置いて `layout.tsx` の metadata で参照
- アクセス解析 → Vercel Analytics or Google Analytics をスニペット追加

---

## 私が代行できないことの理由

| なぜ | 補足 |
|---|---|
| Supabase 作成 | 外部アカウントが必要、ブラウザ UI 操作で確認が必要 |
| `admin_users` 投入 | あなたの認証 UID が必要 |
| GitHub push | あなたの GitHub 認証が必要 |
| Vercel デプロイ | あなたの Vercel アカウント・課金設定が必要 |

これらは全部 5〜15 分で終わる作業です。詰まったらどのステップか教えてください。
