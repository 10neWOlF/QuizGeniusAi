import { createClient } from "../../supabase/server";

export interface Question {
  question: string;
  type: string;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
}

export interface GeneratedQuestions {
  questions: Question[];
}

export async function generateQuestions(
  content: string,
  questionCount: number = 10,
  questionTypes: string[] = ["mcq"],
  timeLimit?: number,
): Promise<Question[]> {
  // Check if we should use mock data (for testing without an API key)
  if (process.env.USE_MOCK_DATA === "true") {
    return getMockQuestions();
  }

  try {
    // Get OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    // Prepare the prompt for the AI model
    const prompt = generatePrompt(content, questionCount, questionTypes);

    // Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "https://quizgenius.app",
          "X-Title": "QuizGenius AI",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku", // Using a simpler model for more reliable JSON
          messages: [
            {
              role: "system",
              content:
                "You are an expert educator and quiz creator. Generate high-quality quiz questions based on the provided content. Always return valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      throw new Error("Failed to call OpenRouter API");
    }

    const data = await response.json();

    try {
      // Try to parse the JSON response
      const content = data.choices[0].message.content;
      // Clean the content to ensure it's valid JSON
      const cleanedContent = content
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");
      const generatedQuestions = JSON.parse(cleanedContent);

      // Save to database if user is authenticated
      await saveToDatabase(generatedQuestions, content, timeLimit);

      return generatedQuestions.questions;
    } catch (parseError) {
      console.error("Error calling OpenRouter API:", parseError);
      throw new Error("Failed to parse AI-generated questions");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

async function saveToDatabase(
  generatedQuestions: GeneratedQuestions,
  content: string,
  timeLimit?: number,
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Create a new quiz in the database
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title: `Generated Quiz - ${new Date().toLocaleString()}`,
          description: `Generated from content: ${content.substring(0, 100)}...`,
          time_limit: timeLimit,
          is_published: true,
        })
        .select()
        .single();

      if (quizError) {
        console.error("Error saving quiz:", quizError);
        return;
      }

      if (quiz) {
        // Save each question and its answers
        for (const q of generatedQuestions.questions) {
          const { data: question, error: questionError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quiz.id,
              question_text: q.question,
              question_type: q.type,
              points: 1,
            })
            .select()
            .single();

          if (questionError) {
            console.error("Error saving question:", questionError);
            continue;
          }

          // Save answers for the question
          if (question && q.answers) {
            for (const a of q.answers) {
              await supabase.from("answers").insert({
                question_id: question.id,
                answer_text: a.text,
                is_correct: a.isCorrect,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error saving to database:", error);
  }
}

// Mock questions for testing without an API key
function getMockQuestions(): Question[] {
  return [
    {
      question: "What is the capital of France?",
      type: "mcq",
      answers: [
        { text: "Paris", isCorrect: true },
        { text: "London", isCorrect: false },
        { text: "Berlin", isCorrect: false },
        { text: "Madrid", isCorrect: false },
      ],
      explanation: "Paris is the capital and most populous city of France.",
    },
    {
      question: "The Earth is flat.",
      type: "true_false",
      answers: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
      explanation: "The Earth is approximately spherical in shape.",
    },
    {
      question: "What is the chemical symbol for water?",
      type: "short_answer",
      answers: [{ text: "H2O", isCorrect: true }],
      explanation: "Water consists of two hydrogen atoms and one oxygen atom.",
    },
  ];
}

function generatePrompt(
  content: string,
  questionCount: number = 10,
  questionTypes: string[] = ["mcq"],
) {
  return `
    Generate ${questionCount} quiz questions based on the following content. 
    Content: ${content}
    
    Question types to include: ${questionTypes.join(", ")}
    
    Format your response as a JSON object with the following structure:
    {
      "questions": [
        {
          "question": "Question text here",
          "type": "mcq", 
          "answers": [
            { "text": "Answer option 1", "isCorrect": false },
            { "text": "Answer option 2", "isCorrect": true },
            { "text": "Answer option 3", "isCorrect": false },
            { "text": "Answer option 4", "isCorrect": false }
          ],
          "explanation": "Explanation of the correct answer"
        }
      ]
    }
    
    For true/false questions, provide only two answer options: true and false.
    For short answer questions, provide the correct answer in the first position of the answers array.
    For fill-in-the-blank questions, use the format "This is a _____ in the text" and provide the correct word(s) as the answer.
    
    Make sure the questions are diverse, challenging but fair, and directly related to the content provided.
    
    IMPORTANT: Ensure your response is valid JSON. Do not include any markdown formatting, code blocks, or extra text outside the JSON object.
  `;
}
