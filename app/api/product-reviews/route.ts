import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request
) {
  try {
    const session =
      await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const productId = Number(
      body?.productId
    );

    const rating = Number(
      body?.rating
    );

    const review = String(
      body?.review || ""
    ).trim();

    const isAnonymous =
      body?.isAnonymous === true;

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid rating",
        },
        {
          status: 400,
        }
      );
    }

    if (
      review.length < 2 ||
      review.length > 1500
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid review",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone"
      )
      .eq(
        "id",
        session.profileId
      )
      .eq(
        "phone",
        session.phone
      )
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (
      productError ||
      !product
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    const customerName =
      isAnonymous
        ? "Anonymous"
        : profile.full_name;

    const {
      data: savedReview,
      error: reviewError,
    } = await supabaseAdmin
      .from("product_reviews")
      .upsert(
        {
          product_id: productId,
          profile_id: profile.id,

          customer_name:
            customerName,

          rating,
          review,

          is_anonymous:
            isAnonymous,
        },
        {
          onConflict:
            "product_id,profile_id",
        }
      )
      .select(`
        id,
        product_id,
        customer_name,
        rating,
        review,
        created_at,
        is_anonymous
      `)
      .single();

    if (
      reviewError ||
      !savedReview
    ) {
      console.error(
        "Failed to save review:",
        reviewError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not save review",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      review: savedReview,
    });
  } catch (error) {
    console.error(
      "Product review API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not save review",
      },
      {
        status: 500,
      }
    );
  }
}