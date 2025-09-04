"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, Shield, User, FileText } from "lucide-react"

export default function AdminVerificationPage() {
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@university.edu",
      studentId: "123456789",
      submittedAt: "2024-01-15T10:30:00Z",
      documents: {
        studentId: "/student-id-card.png",
        selfie: "/student-selfie-photo.png",
      },
    },
    {
      id: "2",
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@university.edu",
      studentId: "987654321",
      submittedAt: "2024-01-15T14:20:00Z",
      documents: {
        studentId: "/university-student-id.png",
        selfie: "/male-student-photo.png",
      },
    },
  ])

  const handleVerification = (userId: string, approved: boolean) => {
    setPendingUsers((users) => users.filter((user) => user.id !== userId))

    // In a real app, this would make an API call to update the user's verification status
    console.log(`User ${userId} ${approved ? "approved" : "rejected"}`)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Student Verification Dashboard</h1>
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>{pendingUsers.length} students awaiting verification review</AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending verification requests at this time.</p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.documents.selfie || "/placeholder.svg"} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Student ID</span>
                      </h4>
                      <div className="border rounded-lg p-2">
                        <img
                          src={user.documents.studentId || "/placeholder.svg"}
                          alt="Student ID"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Selfie Photo</span>
                      </h4>
                      <div className="border rounded-lg p-2">
                        <img
                          src={user.documents.selfie || "/placeholder.svg"}
                          alt="Student Selfie"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Student ID:</span>
                      <p className="text-muted-foreground">{user.studentId}</p>
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span>
                      <p className="text-muted-foreground">{new Date(user.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="destructive" onClick={() => handleVerification(user.id, false)} className="flex-1">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button onClick={() => handleVerification(user.id, true)} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
