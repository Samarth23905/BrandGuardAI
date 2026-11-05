import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const enforceOrgIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.organisationId) {
    res.status(401).json({
      success: false,
      message: 'Organisation context required.',
    });
    return;
  }

  // If the request body or query specifies an organisationId, it MUST match req.organisationId
  const bodyOrgId = req.body?.organisationId;
  if (bodyOrgId && bodyOrgId.toString() !== req.organisationId) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Cross-organisation data access is strictly forbidden.',
    });
    return;
  }

  next();
};
