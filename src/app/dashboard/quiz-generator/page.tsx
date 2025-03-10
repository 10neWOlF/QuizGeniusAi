"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Brain,
  FileText,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";

export default function QuizGenerator() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTypes, setSelectedTypes] = useState(["mcq"]);
  const [config, setConfig] = useState({
    questionCount: 5,
    timeLimit: 10,
  });

  const questionTypes = [
    { id: "mcq", label: "Multiple Choice" },
    { id: "true_false", label: "True/False" },
    { id: "short_answer", label: "Short Answer" },
    { id: "fill_blank", label: "Fill in the Blank" },
  ];

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, just show the file name in the text area
    setTextContent(
      `File selected: ${file.name}\n\nFile content will be processed when you generate the quiz.`,
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const generateQuiz = async () => {
    if (!textContent.trim()) {
      setError("Please enter some content or upload a file");
      return;
    }

    if (selectedTypes.length === 0) {
      setError("Please select at least one question type");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Add a small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: textContent,
          questionCount: config.questionCount,
          questionTypes: selectedTypes,
          timeLimit: config.timeLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      console.log("Generated questions:", data.questions);
      setSuccess(true);

      // Redirect to the quiz preview page
      // window.location.href = `/dashboard/quiz-preview?id=${data.quizId}`;
    } catch (err: any) {
      console.error("Error generating quiz:", err);
      setError(err.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">AI Quiz Generator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>Content Input</span>
                </CardTitle>
                <CardDescription>
                  Enter text or upload content to generate quiz questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" /> Text
                    </TabsTrigger>
                    <TabsTrigger
                      value="file"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> File Upload
                    </TabsTrigger>
                    <TabsTrigger
                      value="image"
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" /> Image
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4">
                    <Textarea
                      placeholder="Enter text content here..."
                      className="min-h-[200px]"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="file" className="mt-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="outline"
                        onClick={triggerFileInput}
                        className="mb-4"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Select File
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, TXT
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="mt-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Button variant="outline" className="mb-4">
                        <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: JPG, PNG, WEBP
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        (Image content will be analyzed using OCR)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Quiz generated successfully! You can now preview and edit your
                  quiz.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quiz Configuration</CardTitle>
                <CardDescription>Customize your quiz settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="question-count">Number of Questions</Label>
                    <span className="text-sm font-medium">
                      {config.questionCount}
                    </span>
                  </div>
                  <Slider
                    id="question-count"
                    min={1}
                    max={20}
                    step={1}
                    value={[config.questionCount]}
                    onValueChange={(value) =>
                      setConfig({ ...config, questionCount: value[0] })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                    <span className="text-sm font-medium">
                      {config.timeLimit}
                    </span>
                  </div>
                  <Slider
                    id="time-limit"
                    min={1}
                    max={60}
                    step={1}
                    value={[config.timeLimit]}
                    onValueChange={(value) =>
                      setConfig({ ...config, timeLimit: value[0] })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Question Types</Label>
                  {questionTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => handleTypeChange(type.id)}
                      />
                      <label
                        htmlFor={type.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={generateQuiz}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Quiz"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
