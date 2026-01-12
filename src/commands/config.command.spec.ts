import { Test, TestingModule } from '@nestjs/testing';
import { ConfigCommand } from './config.command';
import { ConfigService } from '../config/config.service';
import { ApiService } from '../api/api.service';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction } from 'discord.js';

describe('ConfigCommand', () => {
  let command: ConfigCommand;
  let configService: jest.Mocked<ConfigService>;
  let module: TestingModule;

  const createMockInteraction = (
    guildId: string | null = '123456789012345678',
  ): ChatInputCommandInteraction => {
    return {
      guildId,
      reply: jest.fn().mockResolvedValue(undefined),
    } as unknown as ChatInputCommandInteraction;
  };

  beforeEach(async () => {
    const mockConfigService = {
      getDashboardUrl: jest.fn(),
    };

    const mockApiService = {
      getGuildSettings: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ConfigCommand,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    command = module.get<ConfigCommand>(ConfigCommand);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('onConfig', () => {
    it('should send dashboard URL with guild ID when both are available', async () => {
      const interaction = createMockInteraction('123456789012345678');
      configService.getDashboardUrl.mockReturnValue(
        'https://dashboard.example.com',
      );

      await command.onConfig([interaction] as SlashCommandContext);

      expect(configService.getDashboardUrl).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: '⚙️ Bot Configuration',
              description: expect.stringContaining(
                'https://dashboard.example.com?guild=123456789012345678',
              ),
            }),
          }),
        ]),
        ephemeral: true,
      });
    });

    it('should send error message when dashboard URL is not configured', async () => {
      const interaction = createMockInteraction('123456789012345678');
      configService.getDashboardUrl.mockReturnValue(undefined);

      await command.onConfig([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: '⚙️ Bot Configuration',
              description:
                'Dashboard is not configured. Please contact the bot administrator.',
            }),
          }),
        ]),
        ephemeral: true,
      });
    });

    it('should send error message when guild ID is not available', async () => {
      const interaction = createMockInteraction(null);
      configService.getDashboardUrl.mockReturnValue(
        'https://dashboard.example.com',
      );

      await command.onConfig([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              description:
                'Dashboard is not configured. Please contact the bot administrator.',
            }),
          }),
        ]),
        ephemeral: true,
      });
    });

    it('should send error message when both dashboard URL and guild ID are missing', async () => {
      const interaction = createMockInteraction(null);
      configService.getDashboardUrl.mockReturnValue(undefined);

      await command.onConfig([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              description:
                'Dashboard is not configured. Please contact the bot administrator.',
            }),
          }),
        ]),
        ephemeral: true,
      });
    });
  });
});
