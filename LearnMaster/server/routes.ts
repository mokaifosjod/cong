import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, optionalAuth, registerUser, loginUser } from "./auth";
import { loginSchema, registerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, token } = await registerUser(validatedData);
      
      res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await loginUser(validatedData);
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        },
        token,
      });
    } catch (error) {
      res.status(401).json({ 
        error: error instanceof Error ? error.message : "Login failed" 
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        emailVerified: req.user.emailVerified,
      },
    });
  });

  // User preferences routes
  app.get("/api/user/preferences", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const preferences = await storage.getUserPreferences(req.user.id);
      res.json(preferences || {
        starredSubjects: [],
        darkMode: false,
        emailNotifications: true,
        studyReminders: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/user/preferences", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const preferences = await storage.upsertUserPreferences({
        userId: req.user.id,
        ...req.body,
      });
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // User progress routes
  app.get("/api/user/progress", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { subject } = req.query;
      const progress = await storage.getUserProgress(req.user.id, subject as string);
      res.json({ progress });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/user/progress", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const progress = await storage.upsertUserProgress({
        userId: req.user.id,
        ...req.body,
      });
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Puzzle attempt tracking
  app.post("/api/user/attempt", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const attempt = await storage.recordPuzzleAttempt({
        userId: req.user.id,
        ...req.body,
      });
      
      res.json(attempt);
    } catch (error) {
      res.status(500).json({ error: "Failed to record attempt" });
    }
  });

  // Get all subjects
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json({ subjects });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  // Get puzzles by subject and difficulty
  app.get("/api/puzzles/:subject", async (req, res) => {
    try {
      const { subject } = req.params;
      const { difficulty } = req.query;
      
      const puzzles = await storage.getPuzzlesBySubject(
        subject, 
        difficulty as string
      );
      
      res.json({ 
        puzzles,
        total: puzzles.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch puzzles" });
    }
  });

  // Get specific puzzle by ID
  app.get("/api/puzzle/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const puzzle = await storage.getPuzzleById(id);
      
      if (!puzzle) {
        return res.status(404).json({ error: "Puzzle not found" });
      }
      
      res.json(puzzle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch puzzle" });
    }
  });

  // Get all blog articles
  app.get("/api/blog/articles", async (req, res) => {
    try {
      const articles = await storage.getBlogArticles();
      res.json({ 
        articles,
        total: articles.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog articles" });
    }
  });

  // Get specific blog article by ID
  app.get("/api/blog/article/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getBlogArticleById(id);
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
