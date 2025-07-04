import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createRequisition = mutation({
  args: {
    department: v.string(),
    jobRole: v.string(),
    experienceRequired: v.number(),
    numberOfPositions: v.number(),
    skillsRequired: v.array(v.string()),
    jdFileUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const requisitionId = await ctx.db.insert('requisitions', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
    });

    // Notify HR users about new requisition
    const hrUsers = await ctx.db
      .query('users')
      .filter((q) => q.or(q.eq(q.field('role'), 'hr'), q.eq(q.field('role'), 'admin')))
      .collect();

    for (const hrUser of hrUsers) {
      await ctx.db.insert('notifications', {
        userId: hrUser._id,
        title: 'New Requisition Created',
        message: `A new requisition for ${args.jobRole} in ${args.department} has been created.`,
        type: 'general',
        relatedId: requisitionId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return requisitionId;
  },
});

export const getAllRequisitions = query({
  args: {},
  handler: async (ctx) => {
    const requisitions = await ctx.db.query('requisitions').order('desc').collect();

    const requisitionsWithCreator = await Promise.all(
      requisitions.map(async (req) => {
        const creator = await ctx.db.get(req.createdBy);
        const approver = req.approvedBy ? await ctx.db.get(req.approvedBy) : null;

        return {
          ...req,
          creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
          approverName: approver ? `${approver.firstName} ${approver.lastName}` : null,
        };
      })
    );

    return requisitionsWithCreator;
  },
});

export const getApprovedRequisitions = query({
  args: {},
  handler: async (ctx) => {
    const requisitions = await ctx.db
      .query('requisitions')
      .withIndex('by_status', (q) => q.eq('status', 'approved'))
      .order('desc')
      .collect();

    const requisitionsWithCreator = await Promise.all(
      requisitions.map(async (req) => {
        const creator = await ctx.db.get(req.createdBy);
        const candidatesCount = await ctx.db
          .query('requisition_candidates')
          .withIndex('by_requisition', (q) => q.eq('requisitionId', req._id))
          .collect();

        return {
          ...req,
          creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
          candidatesCount: candidatesCount.length,
        };
      })
    );

    return requisitionsWithCreator;
  },
});

export const updateRequisitionStatus = mutation({
  args: {
    requisitionId: v.id('requisitions'),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('closed')),
    approvedBy: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.status === 'approved' && args.approvedBy) {
      updates.approvedBy = args.approvedBy;
      updates.approvedAt = Date.now();
    }

    await ctx.db.patch(args.requisitionId, updates);
    return args.requisitionId;
  },
});

export const getRequisitionById = query({
  args: { requisitionId: v.id('requisitions') },
  handler: async (ctx, args) => {
    const requisition = await ctx.db.get(args.requisitionId);
    if (!requisition) return null;

    const creator = await ctx.db.get(requisition.createdBy);
    const approver = requisition.approvedBy ? await ctx.db.get(requisition.approvedBy) : null;

    return {
      ...requisition,
      creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
      approverName: approver ? `${approver.firstName} ${approver.lastName}` : null,
    };
  },
});

export const uploadCandidateToRequisition = mutation({
  args: {
    requisitionId: v.id('requisitions'),
    candidateName: v.string(),
    candidateEmail: v.optional(v.string()),
    candidatePhone: v.optional(v.string()),
    skills: v.array(v.string()),
    experience: v.number(),
    resumeUrl: v.string(),
    uploadedBy: v.id('users'),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidateId = await ctx.db.insert('requisition_candidates', {
      ...args,
      status: 'submitted',
      createdAt: Date.now(),
    });

    // Notify the requisition creator
    const requisition = await ctx.db.get(args.requisitionId);
    if (requisition) {
      await ctx.db.insert('notifications', {
        userId: requisition.createdBy,
        title: 'New Candidate Uploaded',
        message: `A new candidate ${args.candidateName} has been uploaded for ${requisition.jobRole} position.`,
        type: 'general',
        relatedId: candidateId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return candidateId;
  },
});

export const getCandidatesForRequisition = query({
  args: { requisitionId: v.id('requisitions') },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query('requisition_candidates')
      .withIndex('by_requisition', (q) => q.eq('requisitionId', args.requisitionId))
      .order('desc')
      .collect();

    const candidatesWithUploader = await Promise.all(
      candidates.map(async (candidate) => {
        const uploader = await ctx.db.get(candidate.uploadedBy);
        const reviewer = candidate.reviewedBy ? await ctx.db.get(candidate.reviewedBy) : null;

        return {
          ...candidate,
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : null,
        };
      })
    );

    return candidatesWithUploader;
  },
});
