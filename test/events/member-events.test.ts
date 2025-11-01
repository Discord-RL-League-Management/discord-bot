import { createGuildMemberAddEvent } from '../../src/events/guildMemberAdd';
import { createGuildMemberRemoveEvent } from '../../src/events/guildMemberRemove';
import { createGuildMemberUpdateEvent } from '../../src/events/guildMemberUpdate';
import { MemberService } from '../../src/services/member.service';
import { createMockMemberService, resetAllMocks } from '../setup/service-mocks';
import { memberFixtures } from '../fixtures/member.fixtures';
import { Events } from 'discord.js';

describe('Member Event Handlers', () => {
  let mockMemberService: jest.Mocked<MemberService>;

  beforeEach(() => {
    mockMemberService = createMockMemberService();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('guildMemberAdd event', () => {
    it('should call memberService.handleMemberJoin', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      await event.execute(mockMember);

      // Assert
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledWith(mockMember);
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from service', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();
      const serviceError = new Error('Service error');
      mockMemberService.handleMemberJoin.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(event.execute(mockMember)).rejects.toThrow('Service error');
    });

    it('should return correct event name', () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);

      // Assert
      expect(event.name).toBe(Events.GuildMemberAdd);
    });

    it('should handle member with invalid data', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const invalidMember = memberFixtures.createMockGuildMember({
        user: memberFixtures.createUserWithInvalidId(),
      });

      // Act
      await event.execute(invalidMember);

      // Assert
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledWith(invalidMember);
    });

    it('should handle member with no roles', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const memberWithNoRoles = memberFixtures.createMemberWithNoRoles();

      // Act
      await event.execute(memberWithNoRoles);

      // Assert
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledWith(memberWithNoRoles);
    });
  });

  describe('guildMemberRemove event', () => {
    it('should call memberService.handleMemberLeave', async () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      await event.execute(mockMember);

      // Assert
      expect(mockMemberService.handleMemberLeave).toHaveBeenCalledWith(mockMember);
      expect(mockMemberService.handleMemberLeave).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from service', async () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();
      const serviceError = new Error('Service error');
      mockMemberService.handleMemberLeave.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(event.execute(mockMember)).rejects.toThrow('Service error');
    });

    it('should return correct event name', () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);

      // Assert
      expect(event.name).toBe(Events.GuildMemberRemove);
    });

    it('should handle partial member objects', async () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);
      const partialMember = memberFixtures.createMemberWithoutGuild();

      // Act
      await event.execute(partialMember);

      // Assert
      expect(mockMemberService.handleMemberLeave).toHaveBeenCalledWith(partialMember);
    });

    it('should handle member without user ID', async () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);
      const memberWithoutUserId = memberFixtures.createMemberWithoutUserId();

      // Act
      await event.execute(memberWithoutUserId);

      // Assert
      expect(mockMemberService.handleMemberLeave).toHaveBeenCalledWith(memberWithoutUserId);
    });
  });

  describe('guildMemberUpdate event', () => {
    it('should call memberService.handleMemberUpdate', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();

      // Act
      await event.execute(oldMember, newMember);

      // Assert
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(oldMember, newMember);
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from service', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      const serviceError = new Error('Service error');
      mockMemberService.handleMemberUpdate.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(event.execute(oldMember, newMember)).rejects.toThrow('Service error');
    });

    it('should return correct event name', () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);

      // Assert
      expect(event.name).toBe(Events.GuildMemberUpdate);
    });

    it('should handle members with same roles', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdateSameRoles();

      // Act
      await event.execute(oldMember, newMember);

      // Assert
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(oldMember, newMember);
    });

    it('should handle role additions', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();

      // Act
      await event.execute(oldMember, newMember);

      // Assert
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(oldMember, newMember);
    });

    it('should handle role removals', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      // Reverse to simulate removal - create new objects to avoid readonly issues
      const tempRoles = oldMember.roles;
      const updatedOldMember = { ...oldMember, roles: newMember.roles };
      const updatedNewMember = { ...newMember, roles: tempRoles };

      // Act
      await event.execute(updatedOldMember, updatedNewMember);

      // Assert
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(updatedOldMember, updatedNewMember);
    });

    it('should handle username changes', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      newMember.user!.username = 'newusername';

      // Act
      await event.execute(oldMember, newMember);

      // Assert
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(oldMember, newMember);
    });
  });

  describe('Event factory functions', () => {
    it('should create event objects with correct structure', () => {
      // Arrange & Act
      const addEvent = createGuildMemberAddEvent(mockMemberService);
      const removeEvent = createGuildMemberRemoveEvent(mockMemberService);
      const updateEvent = createGuildMemberUpdateEvent(mockMemberService);

      // Assert
      expect(addEvent).toHaveProperty('name');
      expect(addEvent).toHaveProperty('execute');
      expect(typeof addEvent.execute).toBe('function');

      expect(removeEvent).toHaveProperty('name');
      expect(removeEvent).toHaveProperty('execute');
      expect(typeof removeEvent.execute).toBe('function');

      expect(updateEvent).toHaveProperty('name');
      expect(updateEvent).toHaveProperty('execute');
      expect(typeof updateEvent.execute).toBe('function');
    });

    it('should create independent event instances', () => {
      // Arrange & Act
      const event1 = createGuildMemberAddEvent(mockMemberService);
      const event2 = createGuildMemberAddEvent(mockMemberService);

      // Assert
      expect(event1).not.toBe(event2);
      expect(event1.execute).not.toBe(event2.execute);
    });

    it('should bind correct service to each event', async () => {
      // Arrange
      const service1 = createMockMemberService();
      const service2 = createMockMemberService();
      const addEvent1 = createGuildMemberAddEvent(service1);
      const addEvent2 = createGuildMemberAddEvent(service2);
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      await addEvent1.execute(mockMember);
      await addEvent2.execute(mockMember);

      // Assert
      expect(service1.handleMemberJoin).toHaveBeenCalledWith(mockMember);
      expect(service2.handleMemberJoin).toHaveBeenCalledWith(mockMember);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();
      const error = new Error('Database connection failed');
      mockMemberService.handleMemberJoin.mockRejectedValue(error);

      // Act & Assert
      await expect(event.execute(mockMember)).rejects.toThrow('Database connection failed');
    });

    it('should handle network errors', async () => {
      // Arrange
      const event = createGuildMemberRemoveEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();
      const error = new Error('Network timeout');
      mockMemberService.handleMemberLeave.mockRejectedValue(error);

      // Act & Assert
      await expect(event.execute(mockMember)).rejects.toThrow('Network timeout');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const event = createGuildMemberUpdateEvent(mockMemberService);
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      const error = new Error('Validation failed');
      mockMemberService.handleMemberUpdate.mockRejectedValue(error);

      // Act & Assert
      await expect(event.execute(oldMember, newMember)).rejects.toThrow('Validation failed');
    });
  });

  describe('Event delegation', () => {
    it('should delegate to correct service method for each event type', async () => {
      // Arrange
      const addEvent = createGuildMemberAddEvent(mockMemberService);
      const removeEvent = createGuildMemberRemoveEvent(mockMemberService);
      const updateEvent = createGuildMemberUpdateEvent(mockMemberService);
      const mockMember = memberFixtures.createMockGuildMember();
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();

      // Act
      await addEvent.execute(mockMember);
      await removeEvent.execute(mockMember);
      await updateEvent.execute(oldMember, newMember);

      // Assert
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledWith(mockMember);
      expect(mockMemberService.handleMemberLeave).toHaveBeenCalledWith(mockMember);
      expect(mockMemberService.handleMemberUpdate).toHaveBeenCalledWith(oldMember, newMember);
    });

    it('should maintain service state between calls', async () => {
      // Arrange
      const event = createGuildMemberAddEvent(mockMemberService);
      const mockMember1 = memberFixtures.createMockGuildMember();
      const mockMember2 = memberFixtures.createMockGuildMember();

      // Act
      await event.execute(mockMember1);
      await event.execute(mockMember2);

      // Assert
      expect(mockMemberService.handleMemberJoin).toHaveBeenCalledTimes(2);
      expect(mockMemberService.handleMemberJoin).toHaveBeenNthCalledWith(1, mockMember1);
      expect(mockMemberService.handleMemberJoin).toHaveBeenNthCalledWith(2, mockMember2);
    });
  });
});
