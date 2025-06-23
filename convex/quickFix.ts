import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if users already exist
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { 
        message: "Users already exist",
        users: existingUsers.map(u => ({ email: u.email, role: u.role }))
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

    // Create candidate user
    const candidateId = await ctx.db.insert("users", {
      email: "candidate@slrd.com",
      password: "candidate123",
      firstName: "John",
      lastName: "Doe",
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

    // Create HR user
    const hrId = await ctx.db.insert("users", {
      email: "hr@slrd.com",
      password: "hr123",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "hr",
      phone: "+1-555-0003",
      createdAt: Date.now(),
    });

    return {
      message: "Test users created successfully!",
      users: [
        { email: "admin@slrd.com", password: "admin123", role: "admin" },
        { email: "candidate@slrd.com", password: "candidate123", role: "candidate" },
        { email: "hr@slrd.com", password: "hr123", role: "hr" }
      ]
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