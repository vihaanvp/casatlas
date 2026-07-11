"use client"

import { CommandDialog, useCommandK } from "./command-dialog"

function CommandDialogProvider({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandK()

  return (
    <>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export { CommandDialogProvider }
