const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/authMiddleware');
const User = require('../src/models/User');
jest.mock('../src/models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('[TC-12][AC-8] validate Bearer token', () => {
    test('should attach user to request with valid token', async () => {
      const userId = '123456789012345678901234';
      const token = jwt.sign(
        { userId, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.headers.authorization = `Bearer ${token}`;

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(expect.objectContaining({
        _id: userId,
        email: 'test@example.com'
      }));
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should work without bearer prefix for backward compatibility', async () => {
      const userId = '123456789012345678901234';
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.headers.authorization = token;
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId })
      });

      await authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('[TC-13][AC-8] missing token', () => {
    test('should return 401 when no authorization header', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header is empty', async () => {
      req.headers.authorization = '';
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('[TC-14][AC-9] expired token', () => {
    test('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: '123456789012345678901234' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/expired|invalid/i)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('[TC-15][AC-9] invalid token signature', () => {
    test('should return 401 with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { userId: '123456789012345678901234' },
        'wrong-secret-key',
        { expiresIn: '15m' }
      );

      req.headers.authorization = `Bearer ${wrongToken}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 with malformed token', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('[EC-6][AC-9] user lookup errors', () => {
    test('should return 401 when user not found', async () => {
      const token = jwt.sign(
        { userId: '123456789012345678901234' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('user')
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      const token = jwt.sign(
        { userId: '123456789012345678901234' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('error')
        })
      );
    });
  });
});
