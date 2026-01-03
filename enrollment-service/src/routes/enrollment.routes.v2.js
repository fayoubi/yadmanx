import express from 'express';
import enrollmentController from '../controllers/enrollment.controller.v2.js';
import { authenticateAgent } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateAgent);

/**
 * Simplified Enrollment Routes - Option B
 * - No status tracking
 * - No step-based endpoints
 * - Data always editable
 */

// Initialize enrollment with customer data (new flow)
router.post('/enrollments/initialize', enrollmentController.initialize);

// Create new enrollment
router.post('/enrollments', enrollmentController.createEnrollment);

// List enrollments for authenticated agent
router.get('/enrollments', enrollmentController.listEnrollments);

// Get specific enrollment
router.get('/enrollments/:id', enrollmentController.getEnrollment);

// Update enrollment (any data, always allowed)
router.put('/enrollments/:id', enrollmentController.updateEnrollment);

// Delete enrollment (soft delete)
router.delete('/enrollments/:id', enrollmentController.deleteEnrollment);

export default router;
