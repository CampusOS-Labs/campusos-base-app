export type SampleInvoice = {
  invoiceNumber: string;
  academicYear: string;
  dueDate: string;
  status: "pending" | "paid";
  totalAmount: number;
  student: {
    id: string;
    name: string;
    class: string;
    rollNumber: string;
    admissionNumber: string;
  };
  parent: {
    name: string;
    phone: string;
    email: string;
  };
};

/** Sample invoices for Kidzee Vadgaon Sheri — adapted from main branch shape, local student names. */
export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    invoiceNumber: "INV-2025-0001",
    academicYear: "2025-26",
    dueDate: "2025-07-31",
    status: "pending",
    totalAmount: 18000,
    student: {
      id: "STU-VS-001",
      name: "Japleen Kaur",
      class: "Nursery",
      rollNumber: "N-01",
      admissionNumber: "ADM-2024-001",
    },
    parent: {
      name: "Harjeet Singh",
      phone: "+91-9451135915",
      email: "harjeet.singh@email.com",
    },
  },
  {
    invoiceNumber: "INV-2025-0002",
    academicYear: "2025-26",
    dueDate: "2025-07-31",
    status: "pending",
    totalAmount: 18000,
    student: {
      id: "STU-VS-002",
      name: "Anvi Sujit Jagtap",
      class: "Nursery",
      rollNumber: "N-02",
      admissionNumber: "ADM-2024-002",
    },
    parent: {
      name: "Sujit Suresh Jagtap",
      phone: "+91-8390113693",
      email: "sujit.jagtap@email.com",
    },
  },
  {
    invoiceNumber: "INV-2025-0003",
    academicYear: "2025-26",
    dueDate: "2025-07-31",
    status: "pending",
    totalAmount: 20000,
    student: {
      id: "STU-VS-003",
      name: "Aarav Peshne",
      class: "Playgroup",
      rollNumber: "PG-01",
      admissionNumber: "ADM-2023-003",
    },
    parent: {
      name: "Piyush Peshne",
      phone: "+91-9284386633",
      email: "piyush.peshne@email.com",
    },
  },
  {
    invoiceNumber: "INV-2025-0004",
    academicYear: "2025-26",
    dueDate: "2025-07-31",
    status: "pending",
    totalAmount: 24000,
    student: {
      id: "STU-VS-004",
      name: "Abhimanyu Kolpe",
      class: "Senior KG",
      rollNumber: "SKG-01",
      admissionNumber: "ADM-2022-004",
    },
    parent: {
      name: "Akash Kolpe",
      phone: "+91-7709442562",
      email: "akash.kolpe@email.com",
    },
  },
  {
    invoiceNumber: "INV-2025-0005",
    academicYear: "2025-26",
    dueDate: "2025-07-31",
    status: "pending",
    totalAmount: 22000,
    student: {
      id: "STU-VS-005",
      name: "Sumedh Jogdankar",
      class: "Junior KG",
      rollNumber: "JKG-01",
      admissionNumber: "ADM-2023-005",
    },
    parent: {
      name: "Rajesh Jogdankar",
      phone: "+91-9975264425",
      email: "rajesh.jogdankar@email.com",
    },
  },
  {
    invoiceNumber: "INV-2025-0006",
    academicYear: "2025-26",
    dueDate: "2025-06-30",
    status: "paid",
    totalAmount: 18000,
    student: {
      id: "STU-VS-006",
      name: "Jayraj Gurav",
      class: "Nursery",
      rollNumber: "N-04",
      admissionNumber: "ADM-2024-006",
    },
    parent: {
      name: "Abhijeet Gurav",
      phone: "+91-9890009501",
      email: "abhijeet.gurav@email.com",
    },
  },
];
