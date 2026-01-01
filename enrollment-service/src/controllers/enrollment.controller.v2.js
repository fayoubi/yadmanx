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
   * Get enrollment step data (compatibility route for step-based frontend)
   * GET /api/v1/enrollments/:id/steps/:stepName
   *
   * Maps V2 JSONB data structure to V1 step-based format for frontend compatibility
   */
  async getEnrollmentStep(req, res, next) {
    try {
      const { id, stepName } = req.params;

      const enrollment = await enrollmentService.getById(id);

      if (!enrollment) {
        throw new ApiError(404, 'Enrollment not found');
      }

      // Map data to step-based format based on step name
      let stepData = null;

      switch (stepName) {
        case 'customer_info':
        case 'personal_info':
          // Populate from customer records, NOT JSONB
          const subscriberData = enrollment.subscriber ? {
            firstName: enrollment.subscriber.first_name,
            lastName: enrollment.subscriber.last_name,
            cin: enrollment.subscriber.cin,
            email: enrollment.subscriber.email,
            phone: enrollment.subscriber.phone,
            dateOfBirth: enrollment.subscriber.date_of_birth,
            placeOfBirth: enrollment.subscriber.birth_place,
            nationality: enrollment.subscriber.nationality,
            address: enrollment.subscriber.address
          } : {};

          const insuredData = enrollment.insured ? {
            firstName: enrollment.insured.first_name,
            lastName: enrollment.insured.last_name,
            cin: enrollment.insured.cin,
            dateOfBirth: enrollment.insured.date_of_birth
          } : {};

          stepData = {
            subscriber: subscriberData,
            insured: insuredData,
            insuredSameAsSubscriber: enrollment.data?.personalInfo?.insuredSameAsSubscriber ?? true
          };
          break;

        case 'contribution':
          stepData = enrollment.data?.contribution || {};
          break;

        case 'beneficiaries':
          stepData = {
            beneficiaries: enrollment.data?.beneficiaries || []
          };
          break;

        default:
          // Return all data for unknown step names
          stepData = enrollment.data;
      }

      res.json({
        success: true,
        data: {
          enrollment_id: enrollment.id,
          step_name: stepName,
          step_data: stepData
        }
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

      const enrollments = await enrollmentService.list(agentId, limit, offset);

      // Format enrollments for frontend display
      const formattedEnrollments = enrollments.map(enrollment => ({
        id: enrollment.id,
        customer: {
          firstName: enrollment.first_name,
          lastName: enrollment.last_name,
          fullName: formatFullName(enrollment.first_name, enrollment.last_name),
          email: enrollment.email,
          phone: enrollment.phone,
          cin: enrollment.cin, // Original CIN (for hyperlink)
          cinMasked: maskCIN(enrollment.cin), // Masked CIN for display
          city: enrollment.city
        },
        status: null, // Placeholder for future status field
        createdAt: enrollment.created_at,
        updatedAt: enrollment.updated_at
      }));

      res.json({
        success: true,
        enrollments: formattedEnrollments,
        pagination: {
          limit,
          offset,
          total: enrollments.length
        }
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
