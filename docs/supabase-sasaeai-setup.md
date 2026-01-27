# ささえ愛 Supabaseセットアップガイド（共有プロジェクト版）

既存の「ぽちゃマッチ」Supabaseプロジェクトを使用して、「ささえ愛」のテーブルを追加します。

## 前提条件

- 既存のSupabaseプロジェクト「ぽちゃマッチアプリ」にアクセス可能
- テーブル名に `sasaeai_` 接頭辞を使用して、ぽちゃマッチと区別

## セットアップ手順

### ステップ1: Supabaseプロジェクトにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. **「ポチャマッチアプリ」** プロジェクトを選択

### ステップ2: SQLスクリプトの実行

左サイドバーから **「SQL Editor」** を開き、以下のスクリプトを順番に実行します。

#### 1. テーブル作成（必須）

1. **「New query」** をクリック
2. `scripts/sasaeai_01_create_tables.sql` の内容をコピー&ペースト
3. **「RUN」** をクリック

**作成されるテーブル:**
- `sasaeai_profiles` - ユーザープロフィール
- `sasaeai_profile_tags` - プロフィールタグ
- `sasaeai_profile_photos` - プロフィール写真
- `sasaeai_likes` - いいね機能
- `sasaeai_matches` - マッチング
- `sasaeai_messages` - メッセージ
- `sasaeai_payments` - 決済履歴
- `sasaeai_blocks` - ブロック機能
- `sasaeai_reports` - 通報機能
- `sasaeai_coupon_codes` - クーポンコード
- `sasaeai_moderation_logs` - モデレーションログ
- `sasaeai_suspension_history` - ユーザー停止履歴

#### 2. RLS（Row Level Security）の有効化（必須）

1. 新しいクエリを作成
2. `scripts/sasaeai_02_enable_rls.sql` の内容をコピー&ペースト
3. **「RUN」** をクリック

**効果:**
- データセキュリティの確保
- ユーザーは自分のデータのみアクセス可能
- 有料会員のみメッセージ送信可能

#### 3. 便利な関数の作成（必須）

1. 新しいクエリを作成
2. `scripts/sasaeai_03_functions.sql` の内容をコピー&ペースト
3. **「RUN」** をクリック

**作成される関数:**
- `sasaeai_update_updated_at_column()` - 自動タイムスタンプ更新
- `sasaeai_create_match_on_mutual_like()` - 相互いいねでマッチング自動作成
- `sasaeai_check_membership_status()` - 会員資格チェック
- `sasaeai_mark_message_as_read()` - メッセージ既読処理
- `sasaeai_get_user_stats()` - ユーザー統計取得

#### 4. サンプルクーポンコードの挿入（オプション）

1. 新しいクエリを作成
2. `scripts/sasaeai_04_insert_sample_coupons.sql` の内容をコピー&ペースト
3. **「RUN」** をクリック

**挿入されるクーポン:**
- `MIRAIRO2024` - ミライロID用50%オフ
- `WELCOME300` - 初回登録300円オフ
- `FRIEND200` - 友達紹介200円オフ

### ステップ3: テーブル確認

1. 左サイドバーから **「Table Editor」** を開く
2. `sasaeai_profiles` などのテーブルが表示されることを確認

### ステップ4: v0で環境変数を確認

既存のSupabaseプロジェクトを使用するため、環境変数の変更は不要です。

現在の設定値が正しいことを確認：
- `NEXT_PUBLIC_SUPABASE_URL`: 既存のプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 既存のanon public キー

## 注意事項

### テーブル名の接頭辞

すべてのテーブル名に `sasaeai_` 接頭辞が付いています：
- ぽちゃマッチ: `profiles`, `messages` など
- ささえ愛: `sasaeai_profiles`, `sasaeai_messages` など

### コード内のテーブル参照

アプリケーションコードでは、必ず `sasaeai_` 接頭辞付きのテーブル名を使用してください。

例:
```typescript
// 正しい
const { data } = await supabase
  .from('sasaeai_profiles')
  .select('*')

// 間違い（ぽちゃマッチのテーブルにアクセスしてしまう）
const { data } = await supabase
  .from('profiles')
  .select('*')
```

## トラブルシューティング

### エラー: "relation already exists"

既にテーブルが存在する場合のエラーです。テーブルを削除してから再実行するか、スクリプトをスキップしてください。

### エラー: "permission denied"

RLSポリシーによるエラーの可能性があります。管理者権限でアクセスしているか確認してください。

### テーブルが表示されない

ブラウザをリフレッシュするか、Table Editorを再読み込みしてください。

## 次のステップ

1. アプリケーションコードでテーブル名を `sasaeai_` 接頭辞付きに更新
2. テスト用ユーザーアカウントを作成
3. 各機能の動作確認
4. 本番環境へのデプロイ準備

## サポート

問題が発生した場合は、スクリーンショットと共にエラーメッセージを確認してください。
