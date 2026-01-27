import Image from "next/image"

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/images/logo.png" alt="ささえ愛" width={200} height={80} className={className} />
}
