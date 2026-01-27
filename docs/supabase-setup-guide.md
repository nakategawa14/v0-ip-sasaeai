# 「ささえ愛」Supabaseセットアップガイド

このガイドでは、新しいSupabaseプロジェクトを作成し、「ささえ愛」のデータベーススキーマを構築する手順を説明します。

## ステップ1: 新規Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 左上のプロジェクト名をクリック
3. **「New project」** をクリック
4. 以下の情報を入力：
   - **Name**: `sasaeai-matching`
   - **Database Password**: 強力なパスワード（必ずメモ！）
   - **Region**: `Northeast Asia (Tokyo)`
   - **Pricing Plan**: Free（後で変更可能）
5. **「Create new project」** をクリック（作成に1-2分かかります）

## ステップ2: APIキーの取得とv0への設定

### APIキーの取得

1. 新しいプロジェクトが作成されたら、左サイドバーの **「Settings」** をクリック
2. **「API」** を選択
3. 以下をコピーしてメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys** の **anon public** キー

### v0への環境変数設定

1. v0の画面に戻る
2. 左サイドバーの **「Vars」** を開く
3. 既存の環境変数を新しい値に更新：
   - `NEXT_PUBLIC_SUPABASE_URL`: 新しいProject URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 新しいanon public キー
4. 保存

## ステップ3: SQLスクリプトの実行

Supabaseプロジェクトに戻り、以下のスクリプトを **順番通りに** 実行してください。

### 3-1. テーブル作成 (01_create_tables.sql)

1. 左サイドバーの **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. `scripts/01_create_tables.sql` の内容を全てコピー＆ペースト
4. **「Run」** ボタンをクリック
5. 「Success. No rows returned」と表示されれば成功

**このスクリプトで作成されるテーブル:**
- profiles（ユーザープロフィール）
- profile_photos（写真）
- likes（いいね）
- matches（マッチング）
- messages（メッセージ）
- payments（決済履歴）
- blocks（ブロック）
- reports（通報）
- coupon_codes（クーポン）

### 3-2. RLS設定 (02_enable_rls.sql)

1. **「New query」** をクリック
2. `scripts/02_enable_rls.sql` の内容を全てコピー＆ペースト
3. **「Run」** をクリック

**このスクリプトで設定される内容:**
- Row Level Security（行レベルセキュリティ）
- ユーザーごとのデータアクセス権限
- 有料会員のみメッセージ送信可能な制御

### 3-3. トリガー関数 (03_functions.sql)

1. **「New query」** をクリック
2. `scripts/03_functions.sql` の内容を全てコピー＆ペースト
3. **「Run」** をクリック

**このスクリプトで作成される機能:**
- 自動タイムスタンプ更新
- 相互いいねで自動マッチング作成
- 会員資格チェック関数
- メッセージ既読処理

### 3-4. サンプルクーポン (04_insert_sample_coupons.sql)

1. **「New query」** をクリック
2. `scripts/04_insert_sample_coupons.sql` の内容を全てコピー＆ペースト
3. **「Run」** をクリック

**作成されるクーポン:**
- MIRAIRO2025（50%割引）
- FIRST30（30%割引）
- FRIEND500（500円割引）

### 3-5. プロフィール詳細情報追加 (05_update_profiles_table.sql)

1. **「New query」** をクリック
2. `scripts/05_update_profiles_table.sql` の内容を全てコピー＆ペースト
3. **「Run」** をクリック

**追加される機能:**
- MBTI、身長、体型などの詳細情報
- 精神障がい・身体障がい・難病の詳細分類
- 雇用状況、生活状況
- タグシステム（profile_tagsテーブル）

### 3-6. 管理機能 (06_add_admin_features.sql)

1. **「New query」** をクリック
2. `scripts/06_add_admin_features.sql` の内容を全てコピー＆ペースト
3. **「Run」** をクリック

**追加される管理機能:**
- ユーザー停止履歴
- モデレーションログ
- 日次統計データ
- 管理者権限制御

## ステップ4: 認証設定

1. 左サイドバーの **「Authentication」** をクリック
2. **「Providers」** タブを選択
3. **「Email」** が有効になっていることを確認
4. **「URL Configuration」** で以下を設定：
   - Site URL: `https://sasaeai.help`（DNS反映後）
   - Redirect URLs に以下を追加：
     - `https://sasaeai.help/**`
     - 開発環境のURL（v0プレビューURL）

## ステップ5: データベース確認

1. 左サイドバーの **「Table Editor」** をクリック
2. 以下のテーブルが表示されていることを確認：
   - profiles
   - profile_photos
   - likes
   - matches
   - messages
   - payments
   - blocks
   - reports
   - coupon_codes
   - profile_tags
   - user_suspensions
   - moderation_logs
   - daily_statistics

## トラブルシューティング

### エラー: "relation already exists"

すでにテーブルが存在しています。スクリプトをスキップして次に進んでください。

### エラー: "permission denied"

RLSが有効になっている可能性があります。SQL Editorの右上で **「RLS disabled」** になっているか確認してください。

### エラー: "syntax error"

スクリプト全体が正しくコピーされているか確認してください。

## 完了確認

全てのスクリプトが正常に実行されたら、以下を確認：

1. Table Editorで全てのテーブルが表示される
2. profiles テーブルに多数のカラムが存在する
3. coupon_codes テーブルに3件のサンプルクーポンがある

セットアップ完了です！
