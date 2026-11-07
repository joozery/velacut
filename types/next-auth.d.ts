import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
    /** วิธีที่ใช้ล็อกอินใน session นี้: "credentials" | "google" */
    provider?: string;
  }
}
