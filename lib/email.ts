import { Resend } from 'resend';

let resend: Resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM = 'Pedite <notificaciones@pedite.shop>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('Resend error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
