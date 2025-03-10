import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InfoIcon,
  UserCircle,
  BookOpen,
  PlusCircle,
  History,
  Settings,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>
                This is a protected page only visible to authenticated users
              </span>
            </div>
          </header>

          {/* Quick Actions Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>AI Quiz Generator</span>
                </CardTitle>
                <CardDescription>
                  Create quizzes from any content
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Upload files, paste text, or use images to generate custom
                quizzes with AI.
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/quiz-generator" className="w-full">
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <span>My Quizzes</span>
                </CardTitle>
                <CardDescription>Manage your created quizzes</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View, edit, and share quizzes you've created. Track quiz
                performance.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" /> View My Quizzes
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-500" />
                  <span>Quiz History</span>
                </CardTitle>
                <CardDescription>View your quiz attempts</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                See your quiz history, scores, and performance analytics over
                time.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <History className="mr-2 h-4 w-4" /> View History
                </Button>
              </CardFooter>
            </Card>
          </section>

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
