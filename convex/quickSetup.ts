import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createQuickTestUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if any users exist
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { 
        message: "Users already exist. Use existing credentials.",
        existingEmails: existingUsers.map(u => u.email)
      };
    }

    // Create a quick admin user
    const adminId = await ctx.db.insert("users", {
      email: "admin@slrd.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      phone: "+1-555-0001",
      createdAt: Date.now(),
    });

    // Create a candidate user
    const candidateId = await ctx.db.insert("users", {
      email: "candidate@slrd.com",
      password: "candidate123",
      firstName: "John",
      lastName: "Candidate",
      role: "candidate",
      phone: "+1-555-0002",
      createdAt: Date.now(),
    });

    // Create candidate profile
    await ctx.db.insert("candidates", {
      userId: candidateId,
      skills: ["JavaScript", "React", "Node.js"],
      experience: 3,
      education: "Bachelor's in Computer Science",
      location: "San Francisco, CA",
      summary: "Experienced developer looking for new opportunities",
    });

    return {
      message: "Quick test users created successfully!",
      credentials: [
        { email: "admin@slrd.com", password: "admin123", role: "admin" },
        { email: "candidate@slrd.com", password: "candidate123", role: "candidate" }
      ]
    };
  },
});

export const checkDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const candidates = await ctx.db.query("candidates").collect();
    const jobs = await ctx.db.query("jobs").collect();

    const applications = await ctx.db.query("applications").collect();

    return {
      users: users.length,
      candidates: candidates.length,
      jobs: jobs.length,
      applications: applications.length,
      userEmails: users.map(u => ({ email: u.email, role: u.role }))
    };
  },
});
