import express, { json, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import connectDB from "./config/database";
import Session from "./models/Session";
import Survey from "./models/Survey";
import User from "./models/User";

const app = express();
const PORT = 3000;

export type CustomRequest = Request & {
  userId?: string;
};

const authUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const routeToAuthenticate = ["GET /api/user", "POST /api/surveys", "DELETE /api/logout"];

  if (routeToAuthenticate.indexOf(req.method + " " + req.url) !== -1) {
    const cookies = req.headers.cookie; // token=55572433

    if (cookies) {
      const token = cookies.split("=")[1];

      const session = await Session.findOne({ token });
      if (session) {
        req.userId = session.userId.toString();
        return next();
      }
    }
    return res.status(401).json({ message: "Authentication required." });
  } else {
    next();
  }
};

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  authUser(req, res, next).catch(next);
};

const allowedRoutes = ["/", "/login", "/register"];
const existRoutes = (req: Request, res: Response, next: NextFunction) => {
  if (allowedRoutes.includes(req.path) && req.method === "GET") {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    next();
  }
};

async function startDB() {
  await connectDB();
}

startDB();

// middlewares
app.use(json());
app.use(authMiddleware);
app.use(express.static(path.join(__dirname, "public")));
app.use(existRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// register
app.post("/api/register", async (req: CustomRequest, res: Response) => {
  const { email, username, password } = req.body;

  try {
    const isEmailExists = await User.findOne({ email });
    const isUsernameExists = await User.findOne({ username });

    if (isEmailExists && isUsernameExists) {
      res.json(401).json({ error: "Username and password are already used." });
    }

    const newUser = new User({ email, username, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", userId: newUser._id });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Register error:", err.message);
    } else {
      console.error("An unknown error occurred.");
      res.status(500).json({ error: "An error occurred during register." });
    }
  }
});

// login
app.post("/api/login", async (req: CustomRequest, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await User.findOne({ username });

  try {
    if (user && (await user.comparePassword(password))) {
      const token = Math.floor(Math.random() * 100000000).toString();

      const newSession = new Session({
        userId: user._id,
        token,
      });

      await newSession.save();

      res.setHeader("Set-Cookie", `token=${token}; Path=/;`);
      res.status(200).json({ message: "Login successful", token });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("Login error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during login." });
  }
});

// logout
app.delete("/api/logout", async (req: CustomRequest, res: Response) => {
  const sessionId = await Session.findOne({ userId: req.userId });

  try {
    if (sessionId) Session.findOneAndDelete({ userId: req.userId });

    res.setHeader("Set-Cookie", `token=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Logout error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during logout." });
  }
});

// send user info
app.get("/api/user", async (req: CustomRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (user) res.json({ name: user.email, username: user.username });
  } catch (err) {
    if (err instanceof Error) {
      console.error("User info error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during getting user info." });
  }
});

// send all surveys
app.get("/api/surveys", async (req: CustomRequest, res: Response) => {
  try {
    const surveys = await Survey.find();

    res.status(200).json(surveys);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Sending surveys error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during getting surveys." });
  }
});

// send survey by id
app.get("/api/surveys/:surveyId", async (req: CustomRequest, res: Response) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);

    res.status(200).json(survey);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Sending survey error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during getting survey." });
  }
});

// vote
// @ts-ignore
app.post("/api/surveys/:surveyId/vote", async (req: CustomRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    // check if user already responded
    const hasResponded = survey.responses.some((response) => response.userId.toString() === userId);

    if (hasResponded) {
      return res.status(400).json({
        message: "You have already responded to this survey",
      });
    }

    const newResponse = {
      userId: new mongoose.Types.ObjectId(userId),
      answers,
      submittedAt: new Date(),
    };

    survey.responses.push(newResponse);
    await survey.save();

    res.status(200).json({
      message: "Survey response recorded successfully",
      response: newResponse,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Vote survey error:", err.message);
    } else {
      console.error("An unknown error occurred.");
    }
    res.status(500).json({ error: "An error occurred during voting survey." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
