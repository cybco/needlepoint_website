"use client";
import { useEffect } from "react";
import { Review } from "@/types";
import Link from "next/link";
import { useState } from "react";
import ReviewForm from "./review-form";
import { getReviews } from "@/lib/actions/review.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Rating from "@/components/shared/product/rating";

const ReviewList = ({
  userId,
  productId,
  productSlug,
}: {
  userId: string;
  productId: string;
  productSlug: string;
}) => {
  const [review, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      const res = await getReviews({ productId });
      setReviews(res.data);
    };
    loadReviews();
  }, [productId]);

  // Reload reviews after created or updated
  const reload = async () => {
    const res = await getReviews({ productId });
    setReviews([...res.data]);
  };

  return (
    <div className="space-y-4">
      {review.length === 0 && <div>No reviews yet</div>}
      {userId ? (
        <ReviewForm userId={userId} productId={productId} onReviewSubmitted={reload} />
      ) : (
        <div>
          Please
          <Link
            className="text-blue-700 px-1"
            href={`/sign-in?callbackUrl=/product/${productSlug}`}
          >
            Sign In
          </Link>
          to write a review
        </div>
      )}
      <div className="flex-col gap-3">
        {review.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex-between">
                <CardTitle>{review.title}</CardTitle>
              </div>
              <CardDescription>{review.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-t text-sm text-muted-foreground">
                <Rating value={review.rating} />
                <div className="flex items-center">
                  <User className="mr-1 h-4 w-4 mb-1 ml-3 text-xl" />
                  {review.user ? review.user.firstName : "User"}
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 ml-3 h-3 w-3 mb-1" />
                  {formatDateTime(review.createdAt).dateTime}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
