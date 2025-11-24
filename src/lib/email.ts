import nodemailer from 'nodemailer';
import { getSubscribers } from './db';

// Create reusable transporter object using the default SMTP transport
const getTransporter = () => {
  // For local testing, we can use Ethereal (fake email service)
  // or real credentials if provided
  if (import.meta.env.DEV && !import.meta.env.EMAIL_USER) {
    console.log('Using Ethereal Email for local testing');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email', // These will be logged if not set
        pass: 'ethereal.pass'
      }
    });
  }

  return nodemailer.createTransport({
    host: import.meta.env.EMAIL_HOST || 'mail.privateemail.com', // Default to Namecheap/Reclaim common
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: import.meta.env.EMAIL_USER,
      pass: import.meta.env.EMAIL_PASS,
    },
  });
};

export async function notifySubscribers(postTitle: string, postSlug: string) {
  const subscribers = getSubscribers();
  
  if (subscribers.length === 0) {
    console.log('No subscribers to notify.');
    return;
  }

  console.log(`Preparing to notify ${subscribers.length} subscribers about "${postTitle}"`);

  // For local dev without real credentials, we'll use a test account
  let transporter;
  if (import.meta.env.DEV && !import.meta.env.EMAIL_USER) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Test email account created:', testAccount.user);
  } else {
    transporter = getTransporter();
  }

  const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
  const postUrl = `${siteUrl}/culinary-tales/${postSlug}`;

  // Send emails in parallel (be careful with limits on real servers)
  const emailPromises = subscribers.map(sub => {
    return transporter.sendMail({
      from: `"Mississippi Community Cookbook Project" <${import.meta.env.EMAIL_USER || 'noreply@example.com'}>`,
      to: sub.email,
      subject: `New Story Published: ${postTitle}`,
      text: `A new culinary tale has been published: ${postTitle}. Read it here: ${postUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #c8763d;">New Story Published!</h1>
          <p>We just added a new story to the Culinary Tales collection.</p>
          <h2 style="color: #333;">${postTitle}</h2>
          <p>Click the link below to read the full story:</p>
          <p>
            <a href="${postUrl}" style="background-color: #c8763d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Story</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            You are receiving this email because you subscribed to updates from the Mississippi Community Cookbook Project.
          </p>
        </div>
      `,
    });
  });

  try {
    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Sent ${successCount} of ${subscribers.length} emails.`);
    
    // If using Ethereal (dev mode), log the preview URL
    if (import.meta.env.DEV && !import.meta.env.EMAIL_USER && results[0].status === 'fulfilled') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl((results[0] as PromiseFulfilledResult<any>).value));
    }
    
    return successCount;
  } catch (error) {
    console.error('Error sending notification emails:', error);
    throw error;
  }
}

