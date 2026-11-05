import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { OrganisationMembership } from '../models/OrganisationMembership';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'CREATOR', 'REVIEWER']),
});

const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CREATOR', 'REVIEWER']).optional(),
  isActive: z.boolean().optional(),
});

export class UserController {
  public static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await User.find({ organisationId: req.organisationId })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Organisation users retrieved.',
      data: users,
    });
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = CreateUserSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const newUser = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: validated.role,
      organisationId: req.organisationId,
      isActive: true,
    });

    await OrganisationMembership.create({
      organisationId: req.organisationId,
      userId: newUser._id,
      role: validated.role,
      status: 'ACTIVE',
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'USER_CREATED',
      'User',
      newUser._id.toString(),
      { name: newUser.name, email: newUser.email, role: newUser.role }
    );

    res.status(201).json({
      success: true,
      message: 'New user created successfully.',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const validated = UpdateUserRoleSchema.parse(req.body);

    const targetUser = await User.findOne({ _id: userId, organisationId: req.organisationId });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found in your organisation.' });
      return;
    }

    if (validated.role) {
      targetUser.role = validated.role;
      await OrganisationMembership.updateOne(
        { organisationId: req.organisationId, userId: targetUser._id },
        { role: validated.role }
      );
    }

    if (validated.isActive !== undefined) {
      targetUser.isActive = validated.isActive;
    }

    await targetUser.save();

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'USER_UPDATED',
      'User',
      targetUser._id.toString(),
      { updatedRole: targetUser.role, isActive: targetUser.isActive }
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  }
}
