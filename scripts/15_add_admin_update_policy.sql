-- 管理者が他のユーザーのプロフィールを更新できるようにするRLSポリシー

-- 既存のポリシーを確認（存在する場合は削除）
DROP POLICY IF EXISTS "管理者はすべてのプロフィールを更新可能" ON sasaeai_profiles;

-- 管理者用の更新ポリシーを作成
CREATE POLICY "管理者はすべてのプロフィールを更新可能"
ON sasaeai_profiles
FOR UPDATE
USING (
  -- 管理者であることを確認
  EXISTS (
    SELECT 1
    FROM sasaeai_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  -- 管理者であることを確認
  EXISTS (
    SELECT 1
    FROM sasaeai_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- ポリシーが正しく作成されたことを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sasaeai_profiles'
AND policyname = '管理者はすべてのプロフィールを更新可能';
