# OptiDeliver Project - Troubleshooting Guide

This document serves as a reference for known issues in the OptiDeliver project and their solutions. Use this guide to diagnose and fix problems during development.

## Backend Issues

### 1. Port Conflicts (EADDRINUSE)

**Issue**: The backend server attempts to run on port 5003, but this port is already in use.

```
Error: listen EADDRINUSE: address already in use :::5003
```

**Solution**:

- Kill any processes using port 5003: `pkill -f node`
- OR change the port in `.env` file to an unused port
- Restart the server after making changes

### 2. Data Structure Mismatches

**Issue**: The backend API returns data in a format that doesn't match the frontend's expected structure:

- Frontend expects `_id` but backend was sending `id`
- Frontend expects `receiverDetails` object but backend was sending flat fields
- Date format inconsistencies

**Solution**:

- Updated the mock API responses to match the expected TypeScript interfaces
- Ensured all IDs use MongoDB-style `_id` format
- Structured receiver data into a `receiverDetails` object
- Converted Date objects to ISO strings
- Added missing fields like `trackingId` and `senderId`

### 3. Environment Variables

**Issue**: The backend relies on environment variables that might not be properly set up.

**Solution**:

- Ensure `.env` file exists in the backend directory with these variables:
  ```
  PORT=5003
  MONGODB_URI=mongodb://localhost:27017/optideliver
  JWT_SECRET=your-secret-key
  ```

## Frontend Issues

### 1. Undefined Object Properties

**Issue**: Error when trying to access `order.receiverDetails.name` because the structure isn't consistent with the TypeScript interface.

**Solution**:

- Fixed backend API responses to match frontend interfaces
- Ensure all components use consistent property access patterns

### 2. Authentication Issues

**Issue**: Login functionality is inconsistent and may not work properly with the backend.

**Solution**:

- Implemented a mock login system for testing
- Any credentials will work in test mode
- User data is stored in localStorage for session persistence

### 3. Icon Loading Problems

**Issue**: Ad blockers might block some icon resources.

**Solution**:

- Created custom SVG icons in `Icons.tsx` to replace Lucide React icons
- This prevents issues with resources like "fingerprint.js" getting blocked

## API Integration Issues

### 1. Inconsistent Endpoint Paths

**Issue**: API calls might be missing the `/api` prefix or using inconsistent paths.

**Solution**:

- All backend endpoints should follow the pattern `/api/resource-name`
- Frontend API calls should match this pattern

### 2. API Error Handling

**Issue**: Error handling for API calls is incomplete or inconsistent.

**Solution**:

- Added comprehensive error handling in frontend components
- Implemented fallback UI states for API failures
- Added console logging for debugging purposes

## Database Issues

### 1. MongoDB Connection

**Issue**: MongoDB connection is not implemented, using mock data instead.

**Solution**:

- Currently using mock data for development
- When ready to implement MongoDB, update the connection string in `.env`
- Import and configure Mongoose in `index.ts`

## AI Service Integration

### 1. AI Service Connection

**Issue**: The AI prediction service integration is incomplete.

**Solution**:

- Created utils/aiService.ts for AI service integration
- Implement proper error handling for AI service requests
- Add fallback logic when AI service is unavailable

## Development Workflow Issues

### 1. Process Management

**Issue**: Multiple server processes might be running simultaneously, causing port conflicts.

**Solution**:

- Use `pkill -f node` or `pkill -f vite` to kill existing processes before starting new ones
- Implement a proper development environment with concurrently running services

### 2. TypeScript Compilation Errors

**Issue**: TypeScript compilation might fail due to type mismatches.

**Solution**:

- Ensure consistency between backend response structures and frontend type definitions
- Use explicit type assertions where appropriate
- Keep TypeScript interfaces up to date with actual data structures

## Testing Issues

### 1. Test Data

**Issue**: Test data might not cover all edge cases.

**Solution**:

- Created comprehensive mock data for testing
- Implemented test mode for frontend components
- Added visual indicators for test mode

## Browser Compatibility

### 1. Ad Blocker Interference

**Issue**: Some browsers with ad blockers might block certain resources.

**Solution**:

- Use custom SVG icons instead of external libraries
- Avoid using library names that trigger ad blockers
- Test with various browsers and extensions

## Deployment Issues

### 1. Environment Configuration

**Issue**: Environment-specific configuration is not properly separated.

**Solution**:

- Use environment variables for configuration
- Implement environment-specific config files
- Add proper build scripts for production deployment

## Next Steps

1. Implement proper MongoDB integration
2. Complete the AI service integration
3. Develop a comprehensive testing strategy
4. Set up CI/CD pipeline for deployment
5. Enhance error handling throughout the application

Remember to check this document when encountering issues during development.
