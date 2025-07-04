import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal('admin'), v.literal('hr'), v.literal('candidate')),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  candidates: defineTable({
    userId: v.id('users'),
    skills: v.array(v.string()),
    experience: v.number(),
    education: v.string(),
    location: v.string(),
    resumeId: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
  }).index('by_user', ['userId']),

  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    department: v.string(),
    experienceRequired: v.number(),
    salaryMin: v.number(),
    salaryMax: v.number(),
    location: v.string(),
    status: v.union(v.literal('active'), v.literal('closed')),
    requiredSkills: v.array(v.string()),
    postedBy: v.id('users'),
    createdAt: v.number(),
    deadline: v.optional(v.number()),
    currency: v.optional(v.string()), // "USD", "INR", etc.
  })
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_posted_by', ['postedBy']),

  applications: defineTable({
    jobId: v.id('jobs'),
    candidateId: v.id('users'),
    status: v.union(
      v.literal('applied'),
      v.literal('screening'),
      v.literal('interview_scheduled'),
      v.literal('interviewed'),
      v.literal('selected'),
      v.literal('rejected')
    ),
    appliedAt: v.number(),
    coverLetter: v.optional(v.string()),
    matchPercentage: v.optional(v.number()),
    reviewedBy: v.optional(v.id('users')), // HR/Admin who reviewed
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
  })
    .index('by_job', ['jobId'])
    .index('by_candidate', ['candidateId'])
    .index('by_status', ['status']),

  interviews: defineTable({
    applicationId: v.id('applications'),
    scheduledDate: v.number(),
    interviewerName: v.string(),
    interviewerEmail: v.string(),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal('scheduled'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('rescheduled')
    ),
    createdAt: v.number(),
  })
    .index('by_application', ['applicationId'])
    .index('by_status', ['status']),

  notifications: defineTable({
    userId: v.id('users'),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal('application_status'),
      v.literal('interview_scheduled'),
      v.literal('job_posted'),
      v.literal('general')
    ),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type']),

  requisitions: defineTable({
    department: v.string(),
    jobRole: v.string(),
    experienceRequired: v.number(),
    numberOfPositions: v.number(),
    skillsRequired: v.array(v.string()),
    jdFileUrl: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('closed')),
    createdBy: v.id('users'),
    approvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
    description: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_department', ['department']),

  requisition_candidates: defineTable({
    requisitionId: v.id('requisitions'),
    candidateName: v.string(),
    candidateEmail: v.optional(v.string()),
    candidatePhone: v.optional(v.string()),
    skills: v.array(v.string()),
    experience: v.number(),
    resumeUrl: v.string(),
    status: v.union(
      v.literal('submitted'),
      v.literal('shortlisted'),
      v.literal('interviewed'),
      v.literal('selected'),
      v.literal('rejected')
    ),
    uploadedBy: v.id('users'),
    createdAt: v.number(),
    reviewedBy: v.optional(v.id('users')),
    reviewedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index('by_requisition', ['requisitionId'])
    .index('by_status', ['status'])
    .index('by_uploaded_by', ['uploadedBy']),

  master_departments: defineTable({
    name: v.string(),
    isActive: v.boolean(),
  }).index('by_name', ['name']),

  master_job_roles: defineTable({
    title: v.string(),
    department: v.string(),
    isActive: v.boolean(),
  })
    .index('by_department', ['department'])
    .index('by_title', ['title']),

  feedback: defineTable({
    interviewId: v.id('interviews'),
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    interviewerName: v.string(),
    overallRating: v.number(), // 1-5 scale
    technicalSkills: v.number(), // 1-5 scale
    communicationSkills: v.number(), // 1-5 scale
    problemSolving: v.number(), // 1-5 scale
    culturalFit: v.number(), // 1-5 scale
    strengths: v.string(),
    weaknesses: v.string(),
    recommendation: v.string(), // "hire", "no-hire", "maybe"
    additionalComments: v.optional(v.string()),
    submittedAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index('by_interview', ['interviewId'])
    .index('by_candidate', ['candidateId'])
    .index('by_job', ['jobId'])
    .index('by_recommendation', ['recommendation']),
});
