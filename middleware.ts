/**
 * Next.js middleware（旧 proxy.ts と同等）。
 * /admin 配下を /dashboard へリダイレクトする処理は含めない。
 */
export { proxy as middleware, config } from "./proxy"
