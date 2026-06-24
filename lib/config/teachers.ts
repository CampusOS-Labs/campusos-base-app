export const TEACHERS = [
  { id: "t1", name: "Shilpa Mishra" },
  { id: "t2", name: "Pooja Chavan" },
  { id: "t3", name: "Diksha Dhande" },
  { id: "t4", name: "Vaishnavi Andekar" },
  { id: "t5", name: "Mitali Pungaliya" },
  { id: "t6", name: "Tushar Kamble" },
  { id: "t7", name: "Suraj Rai" },
  { id: "t8", name: "Bhuvaneshwari Fulpagarq" },
] as const;

export type Teacher = (typeof TEACHERS)[number];

export function getTeacherById(id: string): Teacher | undefined {
  return TEACHERS.find((t) => t.id === id);
}
