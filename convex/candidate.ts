import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateCandidateProfile = mutation({
  args: {
    userId: v.id("users"),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    education: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    const candidateProfile = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!candidateProfile) {
      throw new Error("Candidate profile not found");
    }

    await ctx.db.patch(candidateProfile._id, updates);
    return candidateProfile._id;
  },
});

export const getCandidateProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getAllCandidates = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect();
    
    // Get user details for each candidate
    const candidatesWithUsers = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await ctx.db.get(candidate.userId);
        return {
          ...candidate,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phone: user?.phone || "",
        };
      })
    );

    return candidatesWithUsers;
  },
});

export const matchCandidatesForJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return [];

    const candidates = await ctx.db.query("candidates").collect();
    
    // Simple matching algorithm based on skills and experience
    const matchedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await ctx.db.get(candidate.userId);
        
        // Calculate skill match percentage
        const jobSkills = job.requiredSkills.map(skill => skill.toLowerCase());
        const candidateSkills = candidate.skills.map(skill => skill.toLowerCase());
        const matchingSkills = candidateSkills.filter(skill => 
          jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
        );
        const skillMatchPercentage = jobSkills.length > 0 ? 
          (matchingSkills.length / jobSkills.length) * 100 : 0;

        // Calculate experience match
        const experienceMatch = candidate.experience >= job.experienceRequired ? 100 : 
          (candidate.experience / job.experienceRequired) * 100;

        // Overall match percentage (weighted: 70% skills, 30% experience)
        const overallMatch = Math.round((skillMatchPercentage * 0.7) + (experienceMatch * 0.3));

        return {
          ...candidate,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          matchPercentage: overallMatch,
          matchingSkills,
        };
      })
    );

    // Sort by match percentage and return top matches
    return matchedCandidates
      .filter(candidate => candidate.matchPercentage > 20) // Only show candidates with >20% match
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 10); // Top 10 matches
  },
});