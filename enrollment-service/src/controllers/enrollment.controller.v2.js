import enrollmentService from '../services/enrollment.service.v2.js';
import { ApiError } from '../middleware/errorHandler.js';
import { maskCIN, formatFullName } from '../utils/formatters.js';

/**
 * Enrollment Controller V2 - JSONB-based, No Status, Always Editable
 */
class EnrollmentControllerV2 {
  /**
   * Create a new enrollment
   * POST /api/v1/enrollments
   */
  async createEnrollment(req, res, next) {
    try {
      const agentId = req.agent.id;

      const enrollment = await enrollmentService.create(agentId);

      res.status(201).json({
        success: true,
        enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize enrollment with customer data (new flow)
   * POST /api/v1/enrollments/initialize
   *
   * Creates customer record(s) and enrollment in a single transaction
   */
  async initialize(req, res, next) {
    try {
      const agentId = req.agent.id;
      const { personalInfo } = req.body;

      // Validate required fields
      if (!personalInfo?.subscriber?.idNumber) {
        throw new ApiError(400, 'Subscriber ID number is required');
      }

      // Call service to create customer + enrollment
      const result = await enrollmentService.initialize(agentId, personalInfo);

      res.status(201).json({
        success: true,
        enrollment: result.enrollment,
        subscriber: result.subscriber,
        insured: result.insured
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollment by ID
   * GET /api/v1/enrollments/:id
   */
  async getEnrollment(req, res, next) {
    try {
      const { id } = req.params;

      const enrollment = await enrollmentService.getById(id);

      if (!enrollment) {
        throw new ApiError(404, 'Enrollment not found');
      }

      res.json({
        success: true,
        enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List enrollments for the authenticated agent
   * GET /api/v1/enrollments
   */
  async listEnrollments(req, res, next) {
    try {
      const agentId = req.agent.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const result = await enrollmentService.list(agentId, limit, offset);

      // Format enrollments for frontend display
      const formattedEnrollments = result.enrollments.map(enrollment => ({
        id: enrollment.id,
        customer: {
          firstName: enrollment.first_name,
          lastName: enrollment.last_name,
          fullName: formatFullName(enrollment.first_name, enrollment.last_name),
          email: enrollment.email,
          phone: enrollment.phone,
          cin: enrollment.cin, // Original CIN (for hyperlink)
          cinMasked: maskCIN(enrollment.cin), // Masked CIN for display
          city: enrollment.city,
          dateOfBirth: enrollment.date_of_birth,
          birthPlace: enrollment.birth_place
        },
        status: enrollment.status,
        createdAt: enrollment.created_at,
        updatedAt: enrollment.updated_at
      }));

      res.json({
        success: true,
        enrollments: formattedEnrollments,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update enrollment data (always allowed)
   * PUT /api/v1/enrollments/:id
   *
   * Accepts any of the following in request body:
   * - personalInfo: { subscriber: {...}, insured: {...} }
   * - contribution: { amount, amountText, originOfFunds, paymentMode }
   * - beneficiaries: [...]
   */
  async updateEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const enrollmentData = req.body;

      // No validation - just save everything
      const enrollment = await enrollmentService.update(id, enrollmentData);

      res.json({
        success: true,
        enrollment,
        message: 'Enrollment updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete enrollment (soft delete)
   * DELETE /api/v1/enrollments/:id
   */
  async deleteEnrollment(req, res, next) {
    try {
      const { id } = req.params;

      await enrollmentService.delete(id);

      res.json({
        success: true,
        message: 'Enrollment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EnrollmentControllerV2();
