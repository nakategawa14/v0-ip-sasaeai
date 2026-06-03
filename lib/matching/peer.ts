/** sasaeai_matches の 1 行から、自分 me 以外の相手 user id を返す */
export function peerIdFromMatch(m: { user1_id: string; user2_id: string }, me: string): string {
  return m.user1_id === me ? m.user2_id : m.user1_id
}

export function isMatchedRow(status: string | null | undefined): boolean {
  return status === "matched" || status == null
}
