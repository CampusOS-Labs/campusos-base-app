/** Hardcoded for now — will move to Supabase once teacher records exist. */
export const TEACHERS = [
  { id: "t1", name: "Priya Sharma", phone: "15137997001" },
  { id: "t2", name: "Anita Desai", phone: "919876543211" },
  { id: "t3", name: "Sneha Patil", phone: "919876543212" },
  { id: "t4", name: "Meera Kulkarni", phone: "919876543213" },
  { id: "t5", name: "Ritu Singh", phone: "919876543214" },
] as const;

export type Teacher = (typeof TEACHERS)[number];

export function getTeacherById(id: string): Teacher | undefined {
  return TEACHERS.find((t) => t.id === id);
}
