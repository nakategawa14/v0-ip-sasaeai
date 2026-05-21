-- 通報詳細の運営操作（公式DM・警告メール・強制退会）用に action_type を拡張
-- scripts/44 と scripts/45 のどちらの CHECK でも置き換わるよう、既存値をマージしたうえで新規3種を追加

ALTER TABLE public.sasaeai_moderation_logs
  DROP CONSTRAINT IF EXISTS sasaeai_moderation_logs_action_type_check;

ALTER TABLE public.sasaeai_moderation_logs
  ADD CONSTRAINT sasaeai_moderation_logs_action_type_check
  CHECK (action_type IN (
    -- scripts/44
    'warning_issued',
    'user_banned',
    'user_unbanned',
    'report_resolved',
    'report_dismissed',
    'user_suspended',
    'user_unsuspended',
    'content_removed',
    'verification_approved',
    'verification_rejected',
    -- scripts/45
    'report_status_change',
    'user_ban',
    'user_unban',
    'user_warning',
    'user_block',
    'message_delete',
    'profile_edit',
    'verification_approve',
    'verification_reject',
    'other',
    -- 新規
    'admin_official_dm',
    'admin_warning_email',
    'user_forced_deactivation'
  ));
