-- グループチャット関連テーブルでRealtimeを有効化

-- メッセージテーブルのRealtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE sasaeai_group_chat_messages;

-- 参加者テーブルのRealtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE sasaeai_group_chat_participants;

-- ルームテーブルのRealtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE sasaeai_group_chat_rooms;
