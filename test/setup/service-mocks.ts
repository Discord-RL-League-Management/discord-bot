import { ApiService } from '../../src/services/api.service';
import { MemberService } from '../../src/services/member.service';

/**
 * Discord Bot Service Mock Factories
 * Mock the services our code depends on, not Discord.js internals
 */

export const mockApiService = {
  createGuildMember: jest.fn(),
  updateGuildMember: jest.fn(),
  removeGuildMember: jest.fn(),
} as jest.Mocked<Pick<ApiService, 'createGuildMember' | 'updateGuildMember' | 'removeGuildMember'>>;

export const createMockApiService = (): jest.Mocked<Pick<ApiService, 'createGuildMember' | 'updateGuildMember' | 'removeGuildMember'>> => {
  return {
    createGuildMember: jest.fn(),
    updateGuildMember: jest.fn(),
    removeGuildMember: jest.fn(),
  };
};

export const createMockMemberService = (): jest.Mocked<MemberService> => {
  return {
    handleMemberJoin: jest.fn(),
    handleMemberLeave: jest.fn(),
    handleMemberUpdate: jest.fn(),
    isValidDiscordId: jest.fn(),
  } as unknown as jest.Mocked<MemberService>;
};

/**
 * Reset all mocks - call in beforeEach/afterEach
 */
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
  mockApiService.createGuildMember.mockClear();
  mockApiService.updateGuildMember.mockClear();
  mockApiService.removeGuildMember.mockClear();
};