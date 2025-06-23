import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTestUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("admin"), v.literal("hr"), v.literal("candidate")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });

    // If candidate, create candidate profile
    if (args.role === "candidate") {
      await ctx.db.insert("candidates", {
        userId,
        skills: ["JavaScript", "React"],
        experience: 2,
        education: "Bachelor's Degree",
        location: "Remote",
      });
    }

    return { 
      message: "User created successfully!",
      userId, 
      role: args.role 
    };
  },
});
