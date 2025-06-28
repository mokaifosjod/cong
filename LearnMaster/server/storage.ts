import fs from 'fs';
import path from 'path';
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users,
  userProgress,
  userPreferences,
  puzzleAttempts,
  type User,
  type UpsertUser,
  type UserProgress,
  type InsertUserProgress,
  type UserPreferences,
  type InsertUserPreferences,
  type PuzzleAttempt,
  type InsertPuzzleAttempt,
  type Puzzle,
  type Subject,
  type BlogArticle
} from '@shared/schema';
import { nanoid } from 'nanoid';

export interface IStorage {
  // Content operations
  getSubjects(): Promise<Subject[]>;
  getPuzzlesBySubject(subject: string, difficulty?: string): Promise<Puzzle[]>;
  getPuzzleById(id: string): Promise<Puzzle | undefined>;
  getBlogArticles(): Promise<BlogArticle[]>;
  getBlogArticleById(id: string): Promise<BlogArticle | undefined>;
  
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
  // Progress operations
  getUserProgress(userId: string, subject?: string): Promise<UserProgress[]>;
  upsertUserProgress(progressData: InsertUserProgress): Promise<UserProgress>;
  
  // Preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferencesData: InsertUserPreferences): Promise<UserPreferences>;
  
  // Puzzle attempts
  recordPuzzleAttempt(attemptData: InsertPuzzleAttempt): Promise<PuzzleAttempt>;
  getUserAttempts(userId: string, puzzleId?: string): Promise<PuzzleAttempt[]>;
}

export class DatabaseStorage implements IStorage {
  private subjects: Subject[] = [];
  private puzzles: Map<string, Puzzle[]> = new Map();
  private blogArticles: BlogArticle[] = [];

  constructor() {
    this.loadStaticData();
  }

  private async loadStaticData() {
    try {
      // Load subjects
      const subjectsPath = path.resolve(process.cwd(), 'data/subjects.json');
      if (fs.existsSync(subjectsPath)) {
        const subjectsData = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'));
        this.subjects = subjectsData.subjects || [];
      }

      // Load puzzles for each subject
      const puzzlesDir = path.resolve(process.cwd(), 'data/puzzles');
      if (fs.existsSync(puzzlesDir)) {
        const files = fs.readdirSync(puzzlesDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const subject = file.replace('.json', '');
            const filePath = path.join(puzzlesDir, file);
            const puzzleData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.puzzles.set(subject, puzzleData.puzzles || []);
          }
        }
      }

      // Load blog articles
      const blogPath = path.resolve(process.cwd(), 'data/blog/articles.json');
      if (fs.existsSync(blogPath)) {
        const blogData = JSON.parse(fs.readFileSync(blogPath, 'utf-8'));
        this.blogArticles = blogData.articles || [];
      }
    } catch (error) {
      console.error('Error loading static data:', error);
    }
  }

  // Content operations
  async getSubjects(): Promise<Subject[]> {
    return this.subjects;
  }

  async getPuzzlesBySubject(subject: string, difficulty?: string): Promise<Puzzle[]> {
    const subjectPuzzles = this.puzzles.get(subject) || [];
    if (difficulty) {
      return subjectPuzzles.filter(puzzle => puzzle.difficulty === difficulty);
    }
    return subjectPuzzles;
  }

  async getPuzzleById(id: string): Promise<Puzzle | undefined> {
    for (const puzzleArray of this.puzzles.values()) {
      const puzzle = puzzleArray.find(p => p.id === id);
      if (puzzle) return puzzle;
    }
    return undefined;
  }

  async getBlogArticles(): Promise<BlogArticle[]> {
    return this.blogArticles;
  }

  async getBlogArticleById(id: string): Promise<BlogArticle | undefined> {
    return this.blogArticles.find(article => article.id === id);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    
    // Create default preferences
    await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        starredSubjects: [],
        darkMode: false,
        emailNotifications: true,
        studyReminders: false,
      });
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Progress operations
  async getUserProgress(userId: string, subject?: string): Promise<UserProgress[]> {
    if (subject) {
      return await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.subject, subject)));
    }
    
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async upsertUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const progressId = nanoid();
    const [progress] = await db
      .insert(userProgress)
      .values({ ...progressData, id: progressId })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.subject, userProgress.difficulty],
        set: {
          ...progressData,
          lastAccessed: new Date(),
        },
      })
      .returning();
    return progress;
  }

  // Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(preferencesData: InsertUserPreferences): Promise<UserPreferences> {
    const [preferences] = await db
      .insert(userPreferences)
      .values(preferencesData)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: preferencesData,
      })
      .returning();
    return preferences;
  }

  // Puzzle attempts
  async recordPuzzleAttempt(attemptData: InsertPuzzleAttempt): Promise<PuzzleAttempt> {
    const attemptId = nanoid();
    const [attempt] = await db
      .insert(puzzleAttempts)
      .values({ ...attemptData, id: attemptId })
      .returning();
    return attempt;
  }

  async getUserAttempts(userId: string, puzzleId?: string): Promise<PuzzleAttempt[]> {
    if (puzzleId) {
      return await db.select().from(puzzleAttempts)
        .where(and(eq(puzzleAttempts.userId, userId), eq(puzzleAttempts.puzzleId, puzzleId)));
    }
    
    return await db.select().from(puzzleAttempts).where(eq(puzzleAttempts.userId, userId));
  }
}

export const storage = new DatabaseStorage();
