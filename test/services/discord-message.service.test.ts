import { DiscordMessageService } from '../../src/services/discord-message.service';
import { EmbedBuilder } from 'discord.js';

describe('DiscordMessageService', () => {
  let service: DiscordMessageService;

  beforeEach(() => {
    service = new DiscordMessageService();
  });

  describe('createWelcomeEmbed', () => {
    it('should create a welcome embed with correct fields', () => {
      const embed = service.createWelcomeEmbed();

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.title).toBe('🚀 Rocket League Bot Joined!');
      expect(embed.data.description).toContain('manage your Rocket League leagues');
    });
  });

  describe('createErrorEmbed', () => {
    it('should create an error embed with message', () => {
      const message = 'Test error message';
      const embed = service.createErrorEmbed(message);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.title).toBe('❌ Error');
      expect(embed.data.description).toBe(message);
    });
  });

  describe('createSuccessEmbed', () => {
    it('should create a success embed with message', () => {
      const message = 'Test success message';
      const embed = service.createSuccessEmbed(message);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.title).toBe('✅ Success');
      expect(embed.data.description).toBe(message);
    });
  });
});

