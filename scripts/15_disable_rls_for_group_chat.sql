-- グループチャット関連テーブルのRLSを一時的に無効化
-- テスト期間中のみ使用し、本番環境では再度有効化してください

-- 参加者テーブルのRLSを無効化
ALTER TABLE sasaeai_group_chat_participants DISABLE ROW LEVEL SECURITY;

-- メッセージテーブルのRLSを無効化
ALTER TABLE sasaeai_group_chat_messages DISABLE ROW LEVEL SECURITY;

-- ルームテーブルのRLSを無効化
ALTER TABLE sasaeai_group_chat_rooms DISABLE ROW LEVEL SECURITY;
