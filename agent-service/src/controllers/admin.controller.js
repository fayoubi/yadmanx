import agentService from '../services/agent.service.js';
import pool from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

class AdminController {
  /**
   * POST /api/v1/admin/sync-all-agents
   * Sync all agents to enrollment service (batch operation)
   * Requires JWT authentication
   */
  syncAllAgents = asyncHandler(async (req, res) => {
    const query = 'SELECT * FROM agents WHERE deleted_at IS NULL ORDER BY created_at DESC';
    const result = await pool.query(query);
    const agents = result.rows;

    let syncedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const agent of agents) {
      const synced = await agentService.syncToEnrollmentService(agent);
      if (synced) {
        syncedCount++;
      } else {
        failedCount++;
        errors.push({ agentId: agent.id, email: agent.email });
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} of ${agents.length} agents`,
      stats: {
        total: agents.length,
        synced: syncedCount,
        failed: failedCount,
      },
      errors: failedCount > 0 ? errors : undefined,
    });
  });
}

export default new AdminController();
