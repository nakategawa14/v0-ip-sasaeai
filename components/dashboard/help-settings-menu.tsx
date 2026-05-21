"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleHelp, Loader2, Mail } from "lucide-react"

import { deleteAccount } from "@/lib/actions/account"
import { OPERATOR_INFO, SUPPORT_MAILTO } from "@/lib/legal/operator-info"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

export function HelpSettingsMenu() {
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const runDelete = async () => {
    setDeleting(true)
    const result = await deleteAccount()
    if (result?.error) {
      toast({ title: "エラー", description: result.error, variant: "destructive" })
      setDeleting(false)
      return
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="設定・ヘルプ">
            <CircleHelp className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-[min(85vh,32rem)] overflow-y-auto">
          <DropdownMenuLabel className="font-semibold text-gray-900">運営情報（特商法に含める）</DropdownMenuLabel>
          <DropdownMenuGroup>
            <div className="px-2 py-2 text-xs leading-relaxed text-gray-600">
              <p>
                <span className="font-medium text-gray-800">運営：</span>
                {OPERATOR_INFO.name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">責任者：</span>
                {OPERATOR_INFO.representative}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">住所：</span>
                {OPERATOR_INFO.address}
              </p>
              <p className="mt-1 break-all">
                <span className="font-medium text-gray-800">連絡先：</span>
                {OPERATOR_INFO.email}
              </p>
            </div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/legal/terms">利用規約</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/legal/privacy">プライバシーポリシー</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/legal/company">運営情報（詳細ページ）</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/help">よくある質問 / 使い方 / 安全について</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={SUPPORT_MAILTO} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                運営にメール
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            退会する
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>退会の確認</AlertDialogTitle>
            <AlertDialogDescription>
              データが削除されますがよろしいですか？この操作は取り消せません。プロフィールは利用停止扱いとなり、ログアウトします。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void runDelete()} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中…
                </>
              ) : (
                "退会する"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
