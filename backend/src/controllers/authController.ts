import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { Organisation } from '../models/Organisation';
import { OrganisationMembership } from '../models/OrganisationMembership';
import { AuditService } from '../services/auditService';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organisationName: z.string().min(2, 'Organisation name must be at least 2 characters'),
  industry: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const validated = RegisterSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Generate unique slug for the organisation
    const baseSlug = validated.organisationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const organisation = await Organisation.create({
      name: validated.organisationName,
      slug,
      industry: validated.industry || 'Health & Wellness',
      settings: {
        allowCreatorSelfApproval: false,
        minPassingScore: 70,
        blockCriticalViolations: true,
        requireReviewerNotes: true,
        scoringWeights: {
          critical: 25,
          major: 10,
          minor: 3,
        },
      },
    });

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      organisationId: organisation._id,
      isActive: true,
    });

    await OrganisationMembership.create({
      organisationId: organisation._id,
      userId: user._id,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organisationId: organisation._id.toString(),
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await AuditService.log(
      organisation._id.toString(),
      user._id.toString(),
      'ADMIN',
      'USER_REGISTERED',
      'User',
      user._id.toString(),
      { email: user.email, organisationName: organisation.name },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Organisation and administrator account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisationId: organisation._id,
        },
        organisation: {
          id: organisation._id,
          name: organisation.name,
          slug: organisation.slug,
        },
      },
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const validated = LoginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email.toLowerCase() }).populate('organisationId');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your organization administrator.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organisationId: user.organisationId._id.toString(),
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisationId: user.organisationId._id,
        },
        organisation: user.organisationId,
      },
    });
  }

  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await User.findById(req.user?.userId).select('-passwordHash').populate('organisationId');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved.',
      data: { user },
    });
  }
}
