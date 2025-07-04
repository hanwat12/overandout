import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const initializeMasterData = mutation({
  args: {},
  handler: async (ctx) => {
    const departments = [
      'Engineering',
      'Product Management',
      'Design',
      'Marketing',
      'Sales',
      'Human Resources',
      'Finance',
      'Operations',
      'Customer Success',
      'Data Science',
    ];

    for (const dept of departments) {
      const existing = await ctx.db
        .query('master_departments')
        .filter((q) => q.eq(q.field('name'), dept))
        .first();

      if (!existing) {
        await ctx.db.insert('master_departments', {
          name: dept,
          isActive: true,
        });
      }
    }

    // Initialize job roles
    const jobRoles = [
      { title: 'Software Engineer', department: 'Engineering' },
      { title: 'Senior Software Engineer', department: 'Engineering' },
      { title: 'Frontend Developer', department: 'Engineering' },
      { title: 'Backend Developer', department: 'Engineering' },
      { title: 'Full Stack Developer', department: 'Engineering' },
      { title: 'DevOps Engineer', department: 'Engineering' },
      { title: 'Product Manager', department: 'Product Management' },
      { title: 'Senior Product Manager', department: 'Product Management' },
      { title: 'UI/UX Designer', department: 'Design' },
      { title: 'Graphic Designer', department: 'Design' },
      { title: 'Marketing Manager', department: 'Marketing' },
      { title: 'Digital Marketing Specialist', department: 'Marketing' },
      { title: 'Sales Executive', department: 'Sales' },
      { title: 'Business Development Manager', department: 'Sales' },
      { title: 'HR Specialist', department: 'Human Resources' },
      { title: 'Talent Acquisition Specialist', department: 'Human Resources' },
      { title: 'Data Scientist', department: 'Data Science' },
      { title: 'Data Analyst', department: 'Data Science' },
    ];

    for (const role of jobRoles) {
      const existing = await ctx.db
        .query('master_job_roles')
        .filter((q) =>
          q.and(q.eq(q.field('title'), role.title), q.eq(q.field('department'), role.department))
        )
        .first();

      if (!existing) {
        await ctx.db.insert('master_job_roles', {
          title: role.title,
          department: role.department,
          isActive: true,
        });
      }
    }

    return { success: true };
  },
});

export const getDepartments = query({
  handler: async (ctx) => {
    return await ctx.db.query('master_departments').collect();
  },
});

export const getJobRolesByDepartment = query({
  args: { department: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('master_job_roles')
      .withIndex('by_department', (q) => q.eq('department', args.department))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

export const getAllJobRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('master_job_roles')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});
