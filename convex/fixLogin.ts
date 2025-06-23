import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createAdminUser = mutation({
  args: {},
  handler: async (ctx) => {
    
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@slrd.com"))
      .unique();

    if (existingAdmin) {
      return { 
        message: "Admin user already exists",
        email: "admin@slrd.com",
        password: "admin123"
      };
    }

    // Create admin user
    const adminId = await ctx.db.insert("users", {
      email: "admin@slrd.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      phone: "+1-555-0001",
      createdAt: Date.now(),
    });

    return {
      message: "Admin user created successfully!",
      email: "admin@slrd.com",
      password: "admin123",
      userId: adminId
    };
  },
});

export const createCandidateUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if candidate already exists
    const existingCandidate = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "test@slrd.com"))
      .unique();

    if (existingCandidate) {
      return { 
        message: "Test candidate already exists",
        email: "test@slrd.com",
        password: "test123"
      };
    }

    // Create candidate user
    const candidateId = await ctx.db.insert("users", {
      email: "test@slrd.com",
      password: "test123",
      firstName: "Test",
      lastName: "Candidate",
      role: "candidate",
      phone: "+1-555-0002",
      createdAt: Date.now(),
    });

    await ctx.db.insert("candidates", {
      userId: candidateId,
      skills: ["JavaScript", "React", "Node.js"],
      experience: 3,
      education: "Bachelor's in Computer Science",
      location: "Bhopal , India ",
      summary: "Experienced developer looking for new opportunities",
    });

    return {
      message: "Test candidate created successfully!",
      email: "test@slrd.com",
      password: "test123",
      userId: candidateId
    };
  },
});

export const checkUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return {
      totalUsers: users.length,
      users: users.map(u => ({ 
        email: u.email, 
        role: u.role, 
        name: `${u.firstName} ${u.lastName}` 
      }))
    };
  },
});