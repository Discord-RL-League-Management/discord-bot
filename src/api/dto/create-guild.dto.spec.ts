import { validate } from 'class-validator';
import { CreateGuildDto } from './create-guild.dto';

describe('CreateGuildDto', () => {
  const createValidDto = (): CreateGuildDto => {
    const dto = new CreateGuildDto();
    dto.id = '123456789012345678';
    dto.name = 'Test Guild';
    dto.ownerId = '987654321098765432';
    dto.memberCount = 100;
    dto.icon = 'guild_icon';
    return dto;
  };

  describe('valid DTOs', () => {
    it('should validate when all required fields are present and valid', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate when optional icon field is present', async () => {
      const dto = createValidDto();
      dto.icon = 'https://example.com/icon.png';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate when optional icon field is undefined', async () => {
      const dto = createValidDto();
      dto.icon = undefined;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate when memberCount is 0 (minimum valid value)', async () => {
      const dto = createValidDto();
      dto.memberCount = 0;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate with large memberCount values', async () => {
      const dto = createValidDto();
      dto.memberCount = 1000000;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate with empty string icon (treated as valid by IsOptional)', async () => {
      const dto = createValidDto();
      dto.icon = '';

      const errors = await validate(dto);

      const iconErrors = errors.filter((e) => e.property === 'icon');
      expect(iconErrors.length).toBeLessThanOrEqual(1); // May have IsString error
    });
  });

  describe('id field validation', () => {
    it('should fail validation when id is missing', async () => {
      const dto = createValidDto();
      delete (dto as any).id;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
      expect(idErrors[0].constraints).toBeDefined();
    });

    it('should fail validation when id is empty string', async () => {
      const dto = createValidDto();
      dto.id = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
      expect(idErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when id is not a string', async () => {
      const dto = createValidDto();
      // Use a smaller number that doesn't lose precision - the test verifies type validation, not value
      (dto as any).id = 12345678901234;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
    });

    it('should validate when id is a valid string', async () => {
      const dto = createValidDto();
      dto.id = '123456789012345678';

      const errors = await validate(dto);

      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors).toHaveLength(0);
    });

    it('should fail validation when id is null', async () => {
      const dto = createValidDto();
      (dto as any).id = null;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when id is undefined', async () => {
      const dto = createValidDto();
      (dto as any).id = undefined;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idErrors = errors.filter((e) => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
    });
  });

  describe('name field validation', () => {
    it('should fail validation when name is missing', async () => {
      const dto = createValidDto();
      delete (dto as any).name;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when name is empty string', async () => {
      const dto = createValidDto();
      dto.name = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBeGreaterThan(0);
      expect(nameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is not a string', async () => {
      const dto = createValidDto();
      (dto as any).name = 12345;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('should validate when name is a valid non-empty string', async () => {
      const dto = createValidDto();
      dto.name = 'Valid Guild Name';

      const errors = await validate(dto);

      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors).toHaveLength(0);
    });
  });

  describe('ownerId field validation', () => {
    it('should fail validation when ownerId is missing', async () => {
      const dto = createValidDto();
      delete (dto as any).ownerId;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ownerIdErrors = errors.filter((e) => e.property === 'ownerId');
      expect(ownerIdErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when ownerId is empty string', async () => {
      const dto = createValidDto();
      dto.ownerId = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ownerIdErrors = errors.filter((e) => e.property === 'ownerId');
      expect(ownerIdErrors.length).toBeGreaterThan(0);
      expect(ownerIdErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when ownerId is not a string', async () => {
      const dto = createValidDto();
      // Use a smaller number that doesn't lose precision - the test verifies type validation, not value
      (dto as any).ownerId = 98765432109876;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const ownerIdErrors = errors.filter((e) => e.property === 'ownerId');
      expect(ownerIdErrors.length).toBeGreaterThan(0);
    });

    it('should validate when ownerId is a valid string', async () => {
      const dto = createValidDto();
      dto.ownerId = '987654321098765432';

      const errors = await validate(dto);

      const ownerIdErrors = errors.filter((e) => e.property === 'ownerId');
      expect(ownerIdErrors).toHaveLength(0);
    });
  });

  describe('memberCount field validation', () => {
    it('should fail validation when memberCount is missing', async () => {
      const dto = createValidDto();
      delete (dto as any).memberCount;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when memberCount is not a number', async () => {
      const dto = createValidDto();
      (dto as any).memberCount = '100';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when memberCount is negative', async () => {
      const dto = createValidDto();
      dto.memberCount = -1;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors.length).toBeGreaterThan(0);
      expect(memberCountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation when memberCount is a float', async () => {
      const dto = createValidDto();
      (dto as any).memberCount = 100.5;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors.length).toBeGreaterThan(0);
      expect(memberCountErrors[0].constraints).toHaveProperty('isInt');
    });

    it('should validate when memberCount is 0', async () => {
      const dto = createValidDto();
      dto.memberCount = 0;

      const errors = await validate(dto);

      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors).toHaveLength(0);
    });

    it('should validate when memberCount is a positive integer', async () => {
      const dto = createValidDto();
      dto.memberCount = 500;

      const errors = await validate(dto);

      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors).toHaveLength(0);
    });

    it('should fail validation when memberCount is null', async () => {
      const dto = createValidDto();
      (dto as any).memberCount = null;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const memberCountErrors = errors.filter(
        (e) => e.property === 'memberCount',
      );
      expect(memberCountErrors.length).toBeGreaterThan(0);
    });
  });

  describe('icon field validation (optional)', () => {
    it('should validate when icon is undefined', async () => {
      const dto = createValidDto();
      dto.icon = undefined;

      const errors = await validate(dto);

      const iconErrors = errors.filter((e) => e.property === 'icon');
      expect(iconErrors).toHaveLength(0);
    });

    it('should validate when icon is a valid string', async () => {
      const dto = createValidDto();
      dto.icon = 'https://example.com/icon.png';

      const errors = await validate(dto);

      const iconErrors = errors.filter((e) => e.property === 'icon');
      expect(iconErrors).toHaveLength(0);
    });

    it('should fail validation when icon is not a string (when provided)', async () => {
      const dto = createValidDto();
      (dto as any).icon = 12345;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const iconErrors = errors.filter((e) => e.property === 'icon');
      expect(iconErrors.length).toBeGreaterThan(0);
    });

    it('should validate when icon is null (treated as undefined by IsOptional)', async () => {
      const dto = createValidDto();
      (dto as any).icon = null;

      const errors = await validate(dto);

      const iconErrors = errors.filter((e) => e.property === 'icon');
      // May have IsString error, but should not have IsNotEmpty error
      iconErrors.forEach((error) => {
        expect(error.constraints).not.toHaveProperty('isNotEmpty');
      });
    });
  });

  describe('multiple field validation errors', () => {
    it('should report all validation errors when multiple fields are invalid', async () => {
      const dto = new CreateGuildDto();
      dto.id = '';
      dto.name = '';
      dto.ownerId = '';
      dto.memberCount = -10;
      (dto as any).icon = 12345;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(4); // At least id, name, ownerId, memberCount
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('id');
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('ownerId');
      expect(errorProperties).toContain('memberCount');
    });

    it('should report specific constraint violations for each field', async () => {
      const dto = new CreateGuildDto();
      dto.id = '';
      dto.name = '';
      dto.ownerId = '';
      dto.memberCount = -5;

      const errors = await validate(dto);

      const idErrors = errors.find((e) => e.property === 'id');
      const nameErrors = errors.find((e) => e.property === 'name');
      const ownerIdErrors = errors.find((e) => e.property === 'ownerId');
      const memberCountErrors = errors.find(
        (e) => e.property === 'memberCount',
      );

      expect(idErrors?.constraints).toBeDefined();
      expect(nameErrors?.constraints).toBeDefined();
      expect(ownerIdErrors?.constraints).toBeDefined();
      expect(memberCountErrors?.constraints).toBeDefined();
      expect(memberCountErrors?.constraints).toHaveProperty('min');
    });
  });
});
