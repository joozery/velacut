export type ProfileInfo = {
  id: string; name: string; email: string; image: string | null;
  providers: string[]; hasPassword: boolean; createdAt: string; lastLoginAt: string | null;
};
