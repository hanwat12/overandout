import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getCandidateResumes = query({
  args: { candidateId: v.id('users') },
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', args.candidateId))
      .unique();

    if (!candidate || !candidate.resumeId) {
      return null;
    }

    return {
      candidateId: args.candidateId,
      resumeId: candidate.resumeId,
      resumeUrl: candidate.resumeId, // In your current schema, resumeId stores the URL/reference
    };
  },
});

export const updateCandidateResume = mutation({
  args: {
    candidateId: v.id('users'),
    resumeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', args.candidateId))
      .unique();

    if (!candidate) {
      throw new Error('Candidate profile not found');
    }

    await ctx.db.patch(candidate._id, {
      resumeId: args.resumeId,
    });

    return candidate._id;
  },
});

export const getAllCandidateResumes = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').collect();

    return candidates
      .filter((candidate) => candidate.resumeId)
      .map((candidate) => ({
        candidateId: candidate.userId,
        resumeId: candidate.resumeId,
        resumeUrl: candidate.resumeId,
      }));
  },
});
