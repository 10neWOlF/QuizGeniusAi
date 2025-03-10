import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/openrouter";

export async function POST(request: Request) {
  try {
    const { content, questionCount, questionTypes, timeLimit } =
      await request.json();

    // Validate request data
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Generate questions using the OpenRouter API
    const questions = await generateQuestions(
      content,
      questionCount,
      questionTypes,
      timeLimit,
    );

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 },
    );
  }
}
