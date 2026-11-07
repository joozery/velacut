export const PASSWORD_MIN = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

export function validateCredentials(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  if (!password) errors.password = "กรุณากรอกรหัสผ่าน";
  return errors;
}

export function validateRegister(input: { name: string; email: string; password: string; confirm: string }): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (name.length < 2 || name.length > 40) errors.name = "ชื่อที่แสดงต้องยาว 2–40 ตัวอักษร";
  if (!EMAIL_RE.test(input.email.trim())) errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  if (input.password.length < PASSWORD_MIN) errors.password = `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN} ตัวอักษร`;
  else if (input.password.length > 128) errors.password = "รหัสผ่านยาวเกินไป";
  if (input.confirm !== input.password) errors.confirm = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  return errors;
}

/** กัน open redirect: ยอมเฉพาะ path ภายในเว็บ */
export function safeCallbackUrl(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}
