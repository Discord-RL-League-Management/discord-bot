import { Test, TestingModule } from '@nestjs/testing';
import { HelpCommand } from './help.command';
import { ApiModule } from '../api/api.module';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { AppLogger } from '../common/app-logger.service';

describe('HelpCommand', () => {
  let command: HelpCommand;
  let module: TestingModule;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const createMockInteraction = (): ChatInputCommandInteraction => {
    return {
      reply: jest.fn().mockResolvedValue(undefined),
      user: { id: '123456789012345678' },
      guildId: '987654321098765432',
      channelId: '111111111111111111',
    } as unknown as ChatInputCommandInteraction;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ApiModule],
      providers: [
        HelpCommand,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    command = module.get<HelpCommand>(HelpCommand);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('onHelp', () => {
    it('should send help embed with all commands', async () => {
      const interaction = createMockInteraction();

      await command.onHelp([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: '📖 Bot Commands',
              description: 'Here are all available commands:',
            }),
          }),
        ]),
        flags: MessageFlags.Ephemeral,
      });

      const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.data.fields).toBeDefined();
      expect(embed.data.fields.length).toBe(1);

      const commandNames = embed.data.fields.map((field: any) => field.name);
      expect(commandNames).toEqual(expect.arrayContaining(['/help']));
    });

    it('should include command descriptions', async () => {
      const interaction = createMockInteraction();

      await command.onHelp([interaction] as SlashCommandContext);

      const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
      const embed = replyCall.embeds[0];
      const fields = embed.data.fields;

      fields.forEach((field: any) => {
        expect(field.value).toBeDefined();
        expect(typeof field.value).toBe('string');
        expect(field.value.length).toBeGreaterThan(0);
      });
    });

    it('should set correct embed color', async () => {
      const interaction = createMockInteraction();

      await command.onHelp([interaction] as SlashCommandContext);

      const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.data.color).toBe(0x00ff00);
    });
  });
});
