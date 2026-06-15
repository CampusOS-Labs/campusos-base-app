/** Hardcoded for now — will move to Supabase once teacher records exist. */
export const TEACHERS = [
  { id: "t1", name: "shilpa mishra", phone: "918788525954" },
  { id: "t2", name: "pooja chavan", phone: "918698037718" },
  { id: "t3", name: "diksha dhande", phone: "919834595629" },
  { id: "t4", name: "vaishnavi andekar", phone: "917263932554" },
  { id: "t5", name: "mitali pungaliy", phone: "918847728549" },
  { id: "t6", name: "amaan bilwar", phone: "15137997001" },
  { id: "t7", name: "samarth ghadipatil", phone: "917038667755" },
] as const;

export type Teacher = (typeof TEACHERS)[number];

export function getTeacherById(id: string): Teacher | undefined {
  return TEACHERS.find((t) => t.id === id);
}
