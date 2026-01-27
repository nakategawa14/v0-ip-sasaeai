# ささえ愛 Supabaseセットアップ（簡易版）

既存の「ぽちゃマッチアプリ」Supabaseプロジェクトで実行します。

## 重要な注意事項

- すべてのテーブル名は `sasaeai_` 接頭辞付き
- 既存の「ぽちゃマッチ」のテーブルには影響しません
- 3つのステップに分けて実行します

## 実行手順

### ステップ1: 基本テーブルの作成

1. Supabaseダッシュボードで「ぽちゃマッチアプリ」プロジェクトを開く
2. 左サイドバーの **SQL Editor** をクリック
3. **New query** をクリック
4. `scripts/sasaeai_setup_step1_basic_tables.sql` の内容をコピー＆ペースト
5. **Run** ボタンをクリック
6. 成功メッセージ「ささえ愛: 基本テーブル作成完了」が表示されることを確認

**作成されるテーブル:**
- `sasaeai_profiles` - プロフィール基本情報
- `sasaeai_profile_details` - プロフィール詳細情報
- `sasaeai_profile_tags` - プロフィールタグ

### ステップ2: インタラクションテーブルの作成

1. 同じSQL Editorで **New query** をクリック
2. `scripts/sasaeai_setup_step2_interaction_tables.sql` の内容をコピー＆ペースト
3. **Run** ボタンをクリック
4. 成功メッセージ「ささえ愛: インタラクションテーブル作成完了」が表示されることを確認

**作成されるテーブル:**
- `sasaeai_likes` - いいね
- `sasaeai_matches` - マッチ
- `sasaeai_messages` - メッセージ
- `sasaeai_blocks` - ブロック

### ステップ3: システムテーブルの作成

1. 同じSQL Editorで **New query** をクリック
2. `scripts/sasaeai_setup_step3_system_tables.sql` の内容をコピー＆ペースト
3. **Run** ボタンをクリック
4. 成功メッセージ「ささえ愛: システムテーブル作成完了」が表示されることを確認

**作成されるテーブル:**
- `sasaeai_subscriptions` - サブスクリプション
- `sasaeai_coupon_codes` - クーポンコード
- `sasaeai_coupon_usage` - クーポン使用履歴
- `sasaeai_reports` - 通報

## 確認方法

1. 左サイドバーの **Table Editor** をクリック
2. 左側のテーブル一覧で `sasaeai_` で始まるテーブルを確認
3. 以下のテーブルが表示されていれば成功：
   - sasaeai_profiles
   - sasaeai_profile_details
   - sasaeai_profile_tags
   - sasaeai_likes
   - sasaeai_matches
   - sasaeai_messages
   - sasaeai_blocks
   - sasaeai_subscriptions
   - sasaeai_coupon_codes
   - sasaeai_coupon_usage
   - sasaeai_reports

## トラブルシューティング

### エラー: relation already exists

すでにテーブルが作成されている場合です。Table Editorで確認してください。

### エラー: permission denied

Supabaseプロジェクトの管理者権限が必要です。

### テーブルが表示されない

1. ブラウザを更新（F5）
2. Table Editorの左側で「Search tables...」に `sasaeai` と入力して検索

## 次のステップ

テーブル作成が完了したら：
1. RLS（Row Level Security）の設定
2. 関数とトリガーの作成
3. サンプルデータの投入（オプション）

これらは後のステップで実行します。
