-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER,
  max_score INTEGER,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
  text_response TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Questions policies
CREATE POLICY "Users can view questions for their quizzes"
  ON questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid()));

CREATE POLICY "Users can insert questions for their quizzes"
  ON questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid()));

CREATE POLICY "Users can update questions for their quizzes"
  ON questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid()));

CREATE POLICY "Users can delete questions for their quizzes"
  ON questions FOR DELETE
  USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_id AND quizzes.user_id = auth.uid()));

-- Answers policies
CREATE POLICY "Users can view answers for their questions"
  ON answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_id AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert answers for their questions"
  ON answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_id AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update answers for their questions"
  ON answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_id AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete answers for their questions"
  ON answers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON questions.quiz_id = quizzes.id
    WHERE questions.id = question_id AND quizzes.user_id = auth.uid()
  ));

-- Quiz attempts policies
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- User responses policies
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own responses"
  ON user_responses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = attempt_id AND quiz_attempts.user_id = auth.uid()
  ));

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_responses;
