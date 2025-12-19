import agentService from '../services/agent.service.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

class EnrollmentController {
  /**
   * GET /api/v1/agents/enrollments
   * Get all enrollments for the authenticated agent
   */
  getEnrollments = asyncHandler(async (req, res) => {
    // Agent ID is attached to request by auth middleware
    const agentId = req.agent?.id;

    if (!agentId) {
      throw new ApiError(401, 'Agent authentication required');
    }

    try {
      // Fetch enrollments from enrollment-service
      const enrollments = await agentService.getAgentEnrollments(agentId);

      // Transform response to include applicantName from customer data
      const transformedEnrollments = enrollments.map((enrollment) => {
        const applicantName = enrollment.customer
          ? `${enrollment.customer.first_name || ''} ${enrollment.customer.last_name || ''}`.trim()
          : enrollment.applicant_name || 'N/A';

        return {
          id: enrollment.id,
          enrollment_id: enrollment.enrollment_id,
          applicantName: applicantName,
          status: enrollment.status || 'Draft',
          startDate: enrollment.created_at,
          lastUpdated: enrollment.updated_at,
          customer: enrollment.customer,
          // Include any other relevant fields
          policy_type: enrollment.policy_type,
          coverage_amount: enrollment.coverage_amount,
        };
      });

      res.json({
        success: true,
        count: transformedEnrollments.length,
        enrollments: transformedEnrollments,
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw new ApiError(500, 'Failed to fetch enrollments. Please try again later.');
    }
  });

  /**
   * GET /api/v1/agents/enrollments/:id
   * Get specific enrollment details
   */
  getEnrollmentById = asyncHandler(async (req, res) => {
    const agentId = req.agent?.id;
    const enrollmentId = req.params.id;

    if (!agentId) {
      throw new ApiError(401, 'Agent authentication required');
    }

    if (!enrollmentId) {
      throw new ApiError(400, 'Enrollment ID is required');
    }

    try {
      // Call enrollment-service API to get specific enrollment
      const enrollmentServiceUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3002';
      const response = await fetch(`${enrollmentServiceUrl}/api/v1/enrollments/${enrollmentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(404, 'Enrollment not found');
        }
        throw new Error(`Enrollment service responded with status: ${response.status}`);
      }

      const data = await response.json();
      const enrollment = data.enrollment || data.data;

      // Verify the enrollment belongs to the agent
      if (enrollment.agent_id !== agentId) {
        throw new ApiError(403, 'Unauthorized access to this enrollment');
      }

      res.json({
        success: true,
        enrollment: enrollment,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error fetching enrollment details:', error);
      throw new ApiError(500, 'Failed to fetch enrollment details. Please try again later.');
    }
  });

  /**
   * POST /api/v1/agents/enrollments
   * Create a new enrollment
   */
  createEnrollment = asyncHandler(async (req, res) => {
    const agentId = req.agent?.id;

    if (!agentId) {
      throw new ApiError(401, 'Agent authentication required');
    }

    try {
      // Get agent details to sync to enrollment-service
      const agent = await agentService.getById(agentId);

      if (!agent) {
        throw new ApiError(404, 'Agent not found');
      }

      // Sync agent to enrollment-service first (with retry logic)
      const enrollmentServiceUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3002';

      console.log(`[Agent Sync] Starting sync for agent ${agent.id} (${agent.first_name} ${agent.last_name})`);

      try {
        await this.syncAgentWithRetry(enrollmentServiceUrl, agent);
        console.log(`[Agent Sync] ✓ Successfully synced agent ${agent.id}`);
      } catch (syncError) {
        console.error(`[Agent Sync] ✗ Failed to sync agent ${agent.id} after retries:`, {
          error: syncError.message,
          agent: {
            id: agent.id,
            name: `${agent.first_name} ${agent.last_name}`,
            email: agent.email,
            phone: agent.phone_number
          }
        });
        // Throw error - don't continue if sync fails
        throw new ApiError(500, `Failed to sync agent data: ${syncError.message}`);
      }

      // Call enrollment-service API to create enrollment
      console.log(`[Enrollment Creation] Creating enrollment for agent ${agent.id}`);

      const response = await fetch(`${enrollmentServiceUrl}/api/v1/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': agentId,
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[Enrollment Creation] ✗ Failed to create enrollment:`, {
          status: response.status,
          error: errorData.error,
          agentId: agent.id
        });
        throw new ApiError(response.status, errorData.error || 'Failed to create enrollment');
      }

      const data = await response.json();
      console.log(`[Enrollment Creation] ✓ Successfully created enrollment ${data.data?.id || data.enrollment?.id}`);

      res.status(201).json({
        success: true,
        enrollment: data.data || data.enrollment,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('[Enrollment Creation] Unexpected error:', error);
      throw new ApiError(500, 'Failed to create enrollment. Please try again later.');
    }
  });

  /**
   * Sync agent to enrollment-service with retry logic
   * @private
   */
  async syncAgentWithRetry(enrollmentServiceUrl, agent, maxRetries = 3) {
    const delays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Agent Sync] Attempt ${attempt + 1}/${maxRetries} for agent ${agent.id}`);

        const response = await fetch(`${enrollmentServiceUrl}/api/v1/agents/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: agent.id,
            first_name: agent.first_name,
            last_name: agent.last_name,
            email: agent.email,
            phone: agent.phone_number,
            license_number: agent.license_number,
            agency_name: agent.agency_name || 'Default Agency',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Sync failed: ${errorData.error || errorData.details || response.statusText}`);
        }

        const data = await response.json();
        console.log(`[Agent Sync] Response from enrollment-service:`, {
          success: data.success,
          agentId: data.agent?.id
        });

        return data; // Success!
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          console.error(`[Agent Sync] All ${maxRetries} attempts failed for agent ${agent.id}`);
          throw error;
        }

        // Wait before retrying
        const delay = delays[attempt];
        console.warn(`[Agent Sync] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

export default new EnrollmentController();
