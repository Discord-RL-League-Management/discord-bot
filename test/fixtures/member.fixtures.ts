/**
 * Discord Bot Test Fixtures
 * Simple data objects for testing our business logic
 * We don't mock Discord.js internals - we test our code's behavior
 */

import { MemberData, MemberUpdateData } from '../../src/interfaces/member-data.interface';

export const memberFixtures = {
  /**
   * Simple user data for testing
   */
  createMockUser: (overrides: Record<string, any> = {}) => ({
    id: '123456789012345678',
    username: 'testuser',
    globalName: 'Test User',
    avatar: 'avatar_hash',
    ...overrides,
  }),

  /**
   * Create a user with invalid ID format
   */
  createUserWithInvalidId: () => ({
    id: '123', // Too short
    username: 'invalid_id_user',
    globalName: 'Invalid ID User',
    avatar: 'avatar_hash',
  }),

  /**
   * Simple guild data for testing
   */
  createMockGuild: (overrides: Record<string, any> = {}) => ({
    id: '987654321098765432',
    name: 'Test Guild',
    ...overrides,
  }),

  /**
   * Create a guild with invalid ID format
   */
  createGuildWithInvalidId: () => ({
    id: '456', // Too short
    name: 'Invalid ID Guild',
    icon: 'guild_icon_hash',
  }),

  /**
   * Create MemberData for testing business logic
   */
  createMemberData: (overrides: Partial<MemberData> = {}): MemberData => ({
    userId: '123456789012345678',
    username: 'testuser',
    guildId: '987654321098765432',
    guildName: 'Test Guild',
    roles: ['111111111111111111', '222222222222222222'],
    ...overrides,
  }),

  /**
   * Create MemberData with invalid ID
   */
  createMemberDataWithInvalidId: (): MemberData => ({
    userId: '123', // Invalid
    username: 'testuser',
    guildId: '987654321098765432',
    guildName: 'Test Guild',
    roles: [],
  }),

  /**
   * Create MemberUpdateData for testing updates
   */
  createMemberUpdateData: (overrides: Partial<MemberUpdateData> = {}): MemberUpdateData => ({
    userId: '123456789012345678',
    username: 'testuser',
    guildId: '987654321098765432',
    guildName: 'Test Guild',
    oldRoles: ['111111111111111111', '222222222222222222'],
    newRoles: ['111111111111111111', '222222222222222222', '333333333333333333'],
    ...overrides,
  }),

  /**
   * Create MemberUpdateData with same roles (no change)
   */
  createMemberUpdateDataSameRoles: (): MemberUpdateData => ({
    userId: '123456789012345678',
    username: 'testuser',
    guildId: '987654321098765432',
    guildName: 'Test Guild',
    oldRoles: ['111111111111111111', '222222222222222222'],
    newRoles: ['111111111111111111', '222222222222222222'],
  }),

  /**
   * Simple member data for testing (Discord object structure)
   */
  createMockMember: (overrides: Record<string, any> = {}) => ({
    id: '123456789012345678',
    user: memberFixtures.createMockUser(),
    guild: memberFixtures.createMockGuild(),
    joinedAt: new Date(),
    roles: {
      cache: new Map([
        ['111111111111111111', { id: '111111111111111111' }],
        ['222222222222222222', { id: '222222222222222222' }],
      ]),
    },
    ...overrides,
  }),

  /**
   * Alias for createMockMember (for backward compatibility)
   */
  createMockGuildMember: (overrides: Record<string, any> = {}) => 
    memberFixtures.createMockMember(overrides),

  /**
   * Create a member without guild (for leave events)
   */
  createMemberWithoutGuild: () => ({
    id: '123456789012345678',
    user: memberFixtures.createMockUser(),
    guild: undefined,
    joinedAt: new Date(),
    roles: {
      cache: new Map(), // Empty roles
    },
    displayName: 'testuser',
  }),

  /**
   * Create a member without user ID
   */
  createMemberWithoutUserId: () => ({
    id: undefined,
    user: { id: undefined, username: 'testuser' },
    guild: memberFixtures.createMockGuild(),
    joinedAt: new Date(),
    roles: {
      cache: new Map(), // Empty roles
    },
  }),

  /**
   * Create a member with no roles
   */
  createMemberWithNoRoles: () => ({
    id: '123456789012345678',
    user: memberFixtures.createMockUser(),
    guild: memberFixtures.createMockGuild(),
    joinedAt: new Date(),
    roles: {
      cache: new Map(), // Empty roles
    },
  }),

  /**
   * Create member update pair for testing role changes
   */
  createMemberUpdatePair: () => {
    const guildId = '987654321098765432';
    const userId = '123456789012345678';
    
    const oldMember = memberFixtures.createMockMember({
      guild: { id: guildId },
      user: { id: userId, username: 'old_username' },
      roles: {
        cache: new Map([
          ['111111111111111111', { id: '111111111111111111' }],
          ['222222222222222222', { id: '222222222222222222' }],
        ]), // Old roles
      },
    });

    const newMember = memberFixtures.createMockMember({
      guild: { id: guildId },
      user: { id: userId, username: 'new_username' },
      roles: {
        cache: new Map([
          ['111111111111111111', { id: '111111111111111111' }],
          ['222222222222222222', { id: '222222222222222222' }],
          ['333333333333333333', { id: '333333333333333333' }],
        ]), // Added role
      },
    });
    
    return { oldMember, newMember };
  },

  /**
   * Create member update pair with same roles (no change)
   */
  createMemberUpdateSameRoles: () => {
    const guildId = '987654321098765432';
    const userId = '123456789012345678';
    
    const commonRoles = new Map([
      ['111111111111111111', { id: '111111111111111111' }],
      ['222222222222222222', { id: '222222222222222222' }],
    ]);

    const oldMember = memberFixtures.createMockMember({
      guild: { id: guildId },
      user: { id: userId, username: 'same_roles_user' },
      roles: { cache: commonRoles },
    });

    const newMember = memberFixtures.createMockMember({
      guild: { id: guildId },
      user: { id: userId, username: 'same_roles_user' },
      roles: { cache: commonRoles },
    });
    
    return { oldMember, newMember };
  },

  /**
   * Alias for createMemberUpdateSameRoles (for backward compatibility)
   */
  createMemberSameRoles: () => memberFixtures.createMemberUpdateSameRoles(),

  /**
   * Valid Discord IDs for testing
   */
  createValidDiscordIds: () => [
    '123456789012345678',
    '987654321098765432',
    '102938475610293847',
  ],

  /**
   * Invalid Discord IDs for testing
   */
  createInvalidDiscordIds: () => [
    '123', // Too short
    'abc', // Not numeric
    '', // Empty
    '1234567890123456789', // Too long
  ],
};