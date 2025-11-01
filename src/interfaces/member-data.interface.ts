export interface MemberData {
  userId: string;
  username: string;
  guildId: string;
  guildName: string;
  roles: string[];
}

export interface MemberUpdateData {
  userId: string;
  username: string;
  guildId: string;
  guildName: string;
  oldRoles: string[];
  newRoles: string[];
}
