import { NotificationService } from '../../src/services/notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('sendDMToUser', () => {
    it('should send DM to user', async () => {
      const mockGuild = {
        members: {
          fetch: jest.fn().mockResolvedValue({
            send: jest.fn().mockResolvedValue(undefined),
          }),
        },
        name: 'Test Guild',
      } as any;

      await service.sendDMToUser('user123', mockGuild, 'Test message');

      expect(mockGuild.members.fetch).toHaveBeenCalledWith('user123');
    });

    it('should handle DM failures gracefully', async () => {
      const mockGuild = {
        members: {
          fetch: jest.fn().mockRejectedValue(new Error('User not found')),
        },
        name: 'Test Guild',
      } as any;

      await expect(
        service.sendDMToUser('user123', mockGuild, 'Test message')
      ).rejects.toThrow();
    });
  });

  describe('notifyGuildOwner', () => {
    it('should notify guild owner', async () => {
      const mockGuild = {
        fetchOwner: jest.fn().mockResolvedValue({
          send: jest.fn().mockResolvedValue(undefined),
        }),
        name: 'Test Guild',
      } as any;

      await service.notifyGuildOwner(mockGuild, 'Test message');

      expect(mockGuild.fetchOwner).toHaveBeenCalled();
    });
  });
});

