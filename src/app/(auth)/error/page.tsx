import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>
          Something went wrong during authentication. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
