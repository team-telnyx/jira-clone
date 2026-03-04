const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

describe('User Model', () => {
  describe('[TC-16][AC-1] Password Hashing', () => {
    test('should hash password before save', async () => {
      const plainPassword = 'Str0ngP@ssw0rd!';
      const user = new User({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User'
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);

      const isValidHash = await bcrypt.compare(plainPassword, user.password);
      expect(isValidHash).toBe(true);
    });

    test('should use configured salt rounds', async () => {
      const plainPassword = 'Password123!';
      const user = new User({
        email: 'salttest@example.com',
        password: plainPassword,
        name: 'Salt Test'
      });

      await user.save();

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashInfo = user.password.split('$');
      expect(hashInfo[2]).toBe(saltRounds.toString());
    });
  });

  describe('[TC-17][AC-6] Password Comparison', () => {
    test('comparePassword should return true for correct password', async () => {
      const plainPassword = 'Str0ngP@ssw0rd!';
      const user = new User({
        email: 'compare@example.com',
        password: plainPassword,
        name: 'Compare Test'
      });
      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    test('comparePassword should return false for incorrect password', async () => {
      const user = new User({
        email: 'wrong@example.com',
        password: 'CorrectP@ssw0rd!',
        name: 'Wrong Test'
      });
      await user.save();

      const isMatch = await user.comparePassword('WrongPassword123!');
      expect(isMatch).toBe(false);
    });

    test('should return false for malformed hash', async () => {
      const user = new User({
        email: 'error@example.com',
        password: 'TestP@ssw0rd!',
        name: 'Error Test'
      });
      await user.save();

      user.password = 'invalid-hash';

      const result = await user.comparePassword('any');
      expect(result).toBe(false);
    });
  });

  describe('[EC-7][AC-1] Password Update Behavior', () => {
    test('should not rehash on update if password unchanged', async () => {
      const user = new User({
        email: 'nochange@example.com',
        password: 'OriginalP@ssw0rd!',
        name: 'Original'
      });
      await user.save();

      const originalHash = user.password;

      user.name = 'Updated';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    test('should rehash when password is changed', async () => {
      const user = new User({
        email: 'change@example.com',
        password: 'OldP@ssw0rd!',
        name: 'Old Name'
      });
      await user.save();

      const originalHash = user.password;

      user.password = 'NewStr0ngP@ssw0rd!';
      await user.save();

      expect(user.password).not.toBe(originalHash);

      const isMatch = await user.comparePassword('NewStr0ngP@ssw0rd!');
      expect(isMatch).toBe(true);
    });
  });

  describe('[EC-8][AC-2] Email Uniqueness', () => {
    test('should enforce unique email constraint', async () => {
      const email = 'unique@example.com';

      const user1 = new User({
        email,
        password: 'FirstP@ssw0rd!',
        name: 'First User'
      });
      await user1.save();

      const user2 = new User({
        email,
        password: 'SecondP@ssw0rd!',
        name: 'Second User'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should have unique email constraint', async () => {
      const user = new User({
        email: 'indextest@example.com',
        password: 'FirstP@ssw0rd!',
        name: 'Index Test'
      });
      await user.save();

      const schemaPath = User.schema.path('email');
      expect(schemaPath.options.unique).toBe(true);
    });
  });

  describe('[TC-18][AC-10] Required Validation', () => {
    test('should require email', async () => {
      const user = new User({
        password: 'TestP@ssw0rd!',
        name: 'No Email User'
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require password', async () => {
      const user = new User({
        email: 'nopassword@example.com',
        name: 'No Password User'
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require name', async () => {
      const user = new User({
        email: 'noname@example.com',
        password: 'NoNameP@ssw0rd!'
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const user = new User({
        email: 'not-an-email',
        password: 'ValidP@ssw0rd!',
        name: 'Invalid Email User'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('toJSON transformation', () => {
    test('should not include password in JSON output', async () => {
      const user = new User({
        email: 'json@example.com',
        password: 'SecretP@ssw0rd!',
        name: 'JSON Test'
      });
      await user.save();

      const userJson = user.toJSON();
      expect(userJson.password).toBeUndefined();
    });

    test('should include id field', async () => {
      const user = new User({
        email: 'id@example.com',
        password: 'ValidP@ssw0rd!',
        name: 'ID Test'
      });
      await user.save();

      const userJson = user.toJSON();
      expect(userJson.id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(userJson.id)).toBe(true);
    });
  });
});
