import { Request, Response } from 'express';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { UserRequest } from '../types';

export class RequestController {
  constructor(private orchestrator: AgentOrchestrator) {}

  handleRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRequest: UserRequest = {
        text: req.body.text,
        user_id: req.body.user_id || 'user_default',
        preferred_language: req.body.preferred_language,
        userLocation: req.body.userLocation,
      };

      if (!userRequest.text || typeof userRequest.text !== 'string') {
        res.status(400).json({ error: 'text field is required and must be a string' });
        return;
      }

      const result = await this.orchestrator.processRequest(userRequest);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
