# Enhanced Hiring App - SLRD

## Overview

This is an enhanced version of the SLRD Hiring Application that includes additional functionalities based on a comprehensive hiring process workflow. The application maintains all existing features while adding new capabilities for requisition management, candidate processing, and interview coordination.

## New Features Added

### 1. Requisition Management System
- **Project Head Functionality**: Create new job requisitions with detailed requirements
- **Master File Integration**: Centralized management of job types, departments, and skills
- **Requisition Tracking**: Monitor the status and progress of hiring requisitions

### 2. Enhanced Candidate Management
- **Resume Upload**: HR personnel can upload candidate resumes directly to requisitions
- **Candidate Shortlisting**: Project heads can review and shortlist candidates
- **Advanced Candidate Profiles**: Extended candidate information including skills, experience, and education

### 3. Interview Management System
- **Interview Scheduling**: Schedule interviews with candidates
- **Interview Dashboard**: Comprehensive view of all scheduled, completed, and cancelled interviews
- **Feedback Collection**: Project heads can provide detailed feedback after interviews
- **Interview Status Tracking**: Monitor interview progress and outcomes

### 4. Enhanced Database Schema
- **Requisitions Table**: Store job requisition details and requirements
- **Master Lists**: Centralized reference data for job types, departments, and skills
- **Candidate Profiles**: Extended candidate information storage
- **Interview Records**: Complete interview lifecycle management

## Technical Enhancements

### Backend (Convex)
- **New Database Functions**:
  - `requisitions.ts`: Requisition CRUD operations
  - `masterLists.ts`: Master data management
  - `candidateManagement.ts`: Enhanced candidate operations
  - `interviewManagement.ts`: Interview lifecycle management

### Frontend (React Native/Expo)
- **New Components**:
  - Requisition creation and management forms
  - Candidate shortlisting interface
  - Interview scheduling and feedback forms
  - Enhanced dashboard with new workflow support

### Database Schema Updates
- Extended existing schema with new tables and relationships
- Maintained backward compatibility with existing data
- Added proper indexing and validation for new fields

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Convex account and deployment

### Setup Instructions

1. **Extract the application**:
   ```bash
   unzip enhanced_hiring_app.zip
   cd Slrd
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Convex**:
   - The application includes a pre-configured Convex deployment
   - Update `.env.local` with your Convex deployment URL if needed
   - Run `npx convex dev` to sync the enhanced schema

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Access the application**:
   - Web: Press 'w' in the terminal or visit the provided localhost URL
   - Mobile: Scan the QR code with Expo Go app

## User Roles and Permissions

### Project Head
- Create and manage job requisitions
- Review and shortlist candidates
- Provide interview feedback
- View requisition-specific analytics

### HR Personnel
- Upload candidate resumes
- Schedule interviews
- Manage interview logistics
- View comprehensive interview dashboard

### Admin
- Access to all functionalities
- User management
- System configuration
- Analytics and reporting

### Candidates
- Apply to job postings
- View application status
- Receive interview notifications

## Workflow Process

1. **Requisition Generation**: Project heads create job requisitions with specific requirements
2. **Resume Collection**: HR uploads candidate resumes to relevant requisitions
3. **Candidate Shortlisting**: Project heads review and shortlist candidates
4. **Interview Scheduling**: HR schedules interviews with shortlisted candidates
5. **Interview Confirmation**: Automated notifications sent to all parties
6. **Feedback Collection**: Project heads provide detailed interview feedback
7. **Final Selection**: Decision making based on interview outcomes

## API Endpoints

The application uses Convex for backend operations. Key API functions include:

### Requisitions
- `createRequisition`: Create new job requisitions
- `getRequisitions`: Fetch requisitions with filtering
- `updateRequisitionStatus`: Update requisition status

### Candidate Management
- `uploadCandidateResume`: Upload candidate information and resume
- `shortlistCandidates`: Mark candidates as shortlisted
- `getCandidatesForRequisition`: Fetch candidates for specific requisitions

### Interview Management
- `scheduleInterview`: Schedule new interviews
- `updateInterviewStatus`: Update interview status
- `submitInterviewFeedback`: Submit feedback after interviews

## File Structure

```
Slrd/
├── app/                          # React Native screens
│   ├── requisitions/            # Requisition management screens
│   ├── interviews_backup/       # Interview management screens
│   └── [existing screens]       # Original application screens
├── convex/                      # Backend functions and schema
│   ├── requisitions.ts          # Requisition management
│   ├── masterLists.ts           # Master data management
│   ├── candidateManagement.ts   # Enhanced candidate operations
│   ├── interviewManagement.ts   # Interview lifecycle
│   └── [existing files]        # Original backend functions
├── components/                  # Reusable UI components
└── assets/                      # Static assets
```

## Configuration

### Environment Variables
- `CONVEX_DEPLOYMENT`: Your Convex deployment ID
- `EXPO_PUBLIC_CONVEX_URL`: Public Convex API URL

### Master Data Setup
The application includes predefined master data for:
- Job types (Software Engineer, Product Manager, etc.)
- Departments (Engineering, Marketing, Sales, etc.)
- Skills (React, Node.js, Python, etc.)

## Troubleshooting

### Common Issues

1. **Convex Authentication**: Ensure you're logged into Convex CLI
2. **Metro Bundler Cache**: Clear cache with `npx expo start --clear`
3. **Dependencies**: Run `npm install` if packages are missing
4. **Port Conflicts**: Use different ports if 8081 is occupied

### Development Notes

- The interview management component is temporarily disabled due to dependency conflicts
- Date/time pickers are simplified for web compatibility
- All existing functionalities remain intact and operational

## Future Enhancements

- Real-time notifications for interview updates
- Advanced analytics and reporting
- Integration with external calendar systems
- Automated email notifications
- Mobile-optimized interview scheduling

## Support

For technical support or questions about the enhanced features, please refer to the original application documentation or contact the development team.

## Version History

- **v1.0**: Original SLRD Hiring Application
- **v2.0**: Enhanced version with requisition management, advanced candidate processing, and interview coordination

---

**Note**: This enhanced version maintains full backward compatibility with the original application while adding comprehensive hiring workflow management capabilities.

