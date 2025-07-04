import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const uploadProfileImage = mutation({
  args: {
    userId: v.id('users'),
    imageData: v.string(),
  },
  handler: async (ctx, args) => {
    const mockStorageId = `img_${Date.now()}` as any;

    await ctx.db.patch(args.userId, {
      profileImage: mockStorageId,
    });

    return mockStorageId;
  },
});

export const uploadResume = mutation({
  args: {
    userId: v.id('users'),
    fileName: v.string(),
    fileData: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const mockStorageId = `resume_${Date.now()}` as any;

    const candidateProfile = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (candidateProfile) {
      await ctx.db.patch(candidateProfile._id, {
        resumeId: mockStorageId,
      });
    }

    return mockStorageId;
  },
});

export const getFileUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return `https://placeholder.com/file/${args.storageId}`;
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id('_storage') },

  handler: async (ctx, args) => {
    return true;
  },
});

// Added fileStorage object to wrap getFileUrl and uploadResume
export const fileStorage = {
  getUrl: async (ctx: any, fileId: string) => {
    return await ctx.runQuery('getFileUrl', { storageId: fileId });
  },
  store: async (ctx: any, file: any) => {
    // Assuming file has properties: userId, fileName, fileData, mimeType
    // Adjust as needed based on actual file object structure
    return await ctx.runMutation('uploadResume', {
      userId: file.userId,
      fileName: file.fileName,
      fileData: file.fileData,
      mimeType: file.mimeType,
    });
  },
};
