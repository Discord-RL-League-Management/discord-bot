import { Test, TestingModule } from '@nestjs/testing';
import { HelpCommand } from './help.command';
import { ApiModule } from '../api/api.module';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction } from 'discord.js';

describe('HelpCommand', () => {
  let command: HelpCommand;
  let module: TestingModule;

  const createMockInteraction = (): ChatInputCommandInteraction => {
    return {
      reply: jest.fn().mockResolvedValue(undefined),
    } as unknown as ChatInputCommandInteraction;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ApiModule],
      providers: [HelpCommand],
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
        ephemeral: true,
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
