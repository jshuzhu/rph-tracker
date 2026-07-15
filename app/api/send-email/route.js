import { Resend } from 'resend';

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY is missing from environment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(apiKey);
    const { emailTo, subject, message } = await request.json();

    const data = await resend.emails.send({
      from: 'RPH Tracker <onboarding@resend.dev>', // Guna domain anda nanti
      to: emailTo,
      subject: subject,
      html: `<p>${message}</p>`,
    });

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}