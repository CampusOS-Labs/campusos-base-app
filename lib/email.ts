type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  console.log("[mock-email]", { to, subject, text });
}
