"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

function PortfolioPrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Print / Save as PDF
    </Button>
  )
}

export { PortfolioPrintButton }
