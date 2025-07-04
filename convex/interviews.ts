import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createInterview = mutation({
  args: {
    applicationId: v.id('applications'),
    scheduledDate: v.number(),
    interviewerName: v.string(),
    interviewerEmail: v.string(),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interviewId = await ctx.db.insert('interviews', {
      applicationId: args.applicationId,
      scheduledDate: args.scheduledDate,
      interviewerName: args.interviewerName,
      interviewerEmail: args.interviewerEmail,
      meetingLink: args.meetingLink,
      notes: args.notes,
      status: 'scheduled',
      createdAt: Date.now(),
    });
    return interviewId;
  },
});

export const getInterviewsByApplication = query({
  args: { applicationId: v.id('applications') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('interviews')
      .filter((q) => q.eq(q.field('applicationId'), args.applicationId))
      .collect();
  },
});

export const getAllInterviews = query({
  handler: async (ctx) => {
    return await ctx.db.query('interviews').collect();
  },
});

export const updateInterviewStatus = mutation({
  args: {
    interviewId: v.id('interviews'),
    status: v.union(
      v.literal('scheduled'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('rescheduled')
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { interviewId, status, notes } = args;

    await ctx.db.patch(interviewId, {
      status,
      notes,
    });

    return { success: true };
  },
});

export const updateInterview = mutation({
  args: {
    interviewId: v.id('interviews'),
    scheduledDate: v.optional(v.number()),
    interviewerName: v.optional(v.string()),
    interviewerEmail: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { interviewId, ...updates } = args;
    await ctx.db.patch(interviewId, updates);
  },
});

export const deleteInterview = mutation({
  args: { interviewId: v.id('interviews') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.interviewId);
  },
});

export const getInterviewById = query({
  args: { interviewId: v.id('interviews') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.interviewId);
  },
});

export const getInterviewsWithApplicationDetails = query({
  handler: async (ctx) => {
    const interviews = await ctx.db.query('interviews').collect();

    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        const application = await ctx.db.get(interview.applicationId);
        if (!application) return null;

        const job = await ctx.db.get(application.jobId);
        const candidate = await ctx.db.get(application.candidateId);

        return {
          ...interview,
          application,
          job,
          candidate,
        };
      })
    );

    return interviewsWithDetails.filter(Boolean);
  },
});
