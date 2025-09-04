"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, Package, MapPin, CheckCircle } from "lucide-react"

interface ReviewFormProps {
  delivery: {
    id: number
    title: string
    from: string
    to: string
    reward: string
    deliverer?: string
    requester?: string
    avatar: string
    type: "delivery" | "trip"
  }
  onSubmit: (review: any) => void
  onCancel: () => void
}

export function ReviewForm({ delivery, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (comment.trim().length < 10) {
      setError("Please provide a more detailed review (at least 10 characters)")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const newReview = {
        id: Date.now(),
        deliveryId: delivery.id,
        rating,
        comment: comment.trim(),
        date: "Just now",
        type: "given",
        reviewee: delivery.deliverer || delivery.requester,
        delivery: {
          title: delivery.title,
          from: delivery.from,
          to: delivery.to,
          reward: delivery.reward,
        },
      }

      onSubmit(newReview)
      setIsSubmitting(false)
    }, 1000)
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Poor"
      case 2:
        return "Fair"
      case 3:
        return "Good"
      case 4:
        return "Very Good"
      case 5:
        return "Excellent"
      default:
        return "Select a rating"
    }
  }

  const getPlaceholderText = (rating: number) => {
    switch (rating) {
      case 1:
        return "What went wrong? Your feedback helps improve the service..."
      case 2:
        return "What could have been better? Share your experience..."
      case 3:
        return "Tell us about your experience. What was good?"
      case 4:
        return "Great experience! What made it stand out?"
      case 5:
        return "Excellent service! Share what made this delivery exceptional..."
      default:
        return "Share your experience with this delivery..."
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Write a Review</span>
          </CardTitle>
          <CardDescription>Share your experience to help build trust in our community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={delivery.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {(delivery.deliverer || delivery.requester || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{delivery.deliverer || delivery.requester}</h3>
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{delivery.title}</p>
                <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {delivery.from} → {delivery.to}
                    </span>
                  </div>
                  <span className="font-medium text-primary">{delivery.reward}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">How was your experience?</h3>
                <div className="flex justify-center space-x-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{getRatingText(hoveredRating || rating)}</p>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Tell us more about your experience
              </label>
              <Textarea
                id="comment"
                placeholder={getPlaceholderText(rating)}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Your review will be visible to other students and helps build trust in our delivery community. Please be
                honest and constructive.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1">
                {isSubmitting ? "Submitting Review..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
