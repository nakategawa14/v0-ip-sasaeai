/**
 * 管理人向けメール通知（Resend）。
 * DB トリガー（pg_net）または手動 POST から呼び出す想定。
 *
 * 必須シークレット（Supabase Dashboard → Edge Functions → Secrets）:
 * - RESEND_API_KEY
 * - ADMIN_EMAIL
 * - ADMIN_NOTIFY_WEBHOOK_SECRET（DB の Vault に保存する値と同一）
 * - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（プロジェクト既定で注入されることが多い）
 *
 * 任意: RESEND_FROM_EMAIL（未設定時は Resend の検証用 from）
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

type NotifyBody =
  | { event: "report"; id: string }
  | { event: "ekyc"; user_id: string }

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-notify-secret",
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const webhookSecret = Deno.env.get("ADMIN_NOTIFY_WEBHOOK_SECRET")
  const headerSecret = req.headers.get("x-admin-notify-secret")
  if (!webhookSecret || headerSecret !== webhookSecret) {
    return json(401, { error: "unauthorized" })
  }

  const resendKey = Deno.env.get("RESEND_API_KEY")
  const adminEmail = Deno.env.get("ADMIN_EMAIL")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!resendKey || !adminEmail) {
    return json(500, { error: "missing_resend_or_admin_email" })
  }
  if (!supabaseUrl || !serviceRole) {
    return json(500, { error: "missing_supabase_env" })
  }

  let body: NotifyBody
  try {
    body = (await req.json()) as NotifyBody
  } catch {
    return json(400, { error: "invalid_json" })
  }

  const supabase = createClient(supabaseUrl, serviceRole)
  let subject = ""
  let text = ""

  if (body.event === "report" && body.id) {
    const { data: row, error } = await supabase.from("sasaeai_reports").select("*").eq("id", body.id).maybeSingle()
    if (error) {
      return json(502, { error: "db_report", detail: error.message })
    }
    subject = "[ささえ愛] 違反通報がありました"
    text = [
      "通報レコードが作成されました。管理画面で確認してください。",
      "",
      `report_id: ${body.id}`,
      "",
      row ? JSON.stringify(row, null, 2) : "(行の取得に失敗)",
    ].join("\n")
  } else if (body.event === "ekyc" && body.user_id) {
    const { data: row, error } = await supabase
      .from("sasaeai_profiles")
      .select("id, nickname, email, verification_status, updated_at")
      .eq("id", body.user_id)
      .maybeSingle()
    if (error) {
      return json(502, { error: "db_profile", detail: error.message })
    }
    subject = "[ささえ愛] 本人確認（eKYC）の申請がありました"
    text = [
      "ユーザーが本人確認書類の提出フローを完了し、verification_status が pending になりました。",
      "",
      `user_id: ${body.user_id}`,
      "",
      row ? JSON.stringify(row, null, 2) : "(行の取得に失敗)",
    ].join("\n")
  } else {
    return json(400, { error: "invalid_payload", expected: `report+id | ekyc+user_id` })
  }

  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "Sasaeai <onboarding@resend.dev>"
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [adminEmail],
      subject,
      html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return json(502, { error: "resend_failed", status: res.status, detail })
  }

  return json(200, { ok: true })
})
