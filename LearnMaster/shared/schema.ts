import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User authentication table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token"),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  provider: varchar("provider").default("email"), // email, google, etc.
  providerId: varchar("provider_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject").notNull(),
  difficulty: varchar("difficulty").notNull(),
  currentPuzzleIndex: integer("current_puzzle_index").default(0),
  totalSolved: integer("total_solved").default(0),
  totalAttempts: integer("total_attempts").default(0),
  correctAnswers: integer("correct_answers").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }).default("0"),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  completedPuzzleIds: jsonb("completed_puzzle_ids").default([]),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  starredSubjects: jsonb("starred_subjects").default([]),
  darkMode: boolean("dark_mode").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  studyReminders: boolean("study_reminders").default(false),
});

// Puzzle attempts tracking
export const puzzleAttempts = pgTable("puzzle_attempts", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  puzzleId: varchar("puzzle_id").notNull(),
  subject: varchar("subject").notNull(),
  difficulty: varchar("difficulty").notNull(),
  selectedAnswer: varchar("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  hintsUsed: integer("hints_used").default(0),
  timeSpent: integer("time_spent"), // in seconds
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// Puzzle schemas (unchanged)
export const puzzleSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({
    label: z.string(),
    text: z.string()
  })),
  correctAnswer: z.string(),
  explanation: z.string(),
  hints: z.array(z.string()),
  difficulty: z.enum(["novice", "adept", "expert", "master"]),
  subject: z.string()
});

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  gradient: z.string(),
  totalPuzzles: z.number()
});

export const blogArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  author: z.string(),
  date: z.string(),
  readTime: z.string(),
  category: z.string(),
  imageUrl: z.string(),
  featured: z.boolean().optional()
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences);

export const insertPuzzleAttemptSchema = createInsertSchema(puzzleAttempts).omit({
  id: true,
  attemptedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type PuzzleAttempt = typeof puzzleAttempts.$inferSelect;
export type InsertPuzzleAttempt = z.infer<typeof insertPuzzleAttemptSchema>;

export type Puzzle = z.infer<typeof puzzleSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type BlogArticle = z.infer<typeof blogArticleSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// API Response types
export type PuzzlesResponse = {
  puzzles: Puzzle[];
  total: number;
};

export type SubjectsResponse = {
  subjects: Subject[];
};

export type BlogResponse = {
  articles: BlogArticle[];
  total: number;
};
