import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to, subject, text, html) => {
    // If SMTP credentials aren't set, just log the email content
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('--- EMAIL SIMULATION ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        console.log('------------------------');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Mansa Edu" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

export const notifyAdminOfNewRegistration = async (userData) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) return;

    await sendEmail(
        adminEmail,
        'New Registration Request - Mansa Edu',
        `New user registered: ${userData.name} (${userData.email}) as ${userData.role}. Please review in admin dashboard.`,
        `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>New Registration Request</h2>
            <p>A new user has registered and is waiting for approval:</p>
            <ul>
                <li><strong>Name:</strong> ${userData.name}</li>
                <li><strong>Email:</strong> ${userData.email}</li>
                <li><strong>Role:</strong> ${userData.role}</li>
            </ul>
            <p><a href="${process.env.FRONTEND_URL}/admin/requests">Click here to manage requests</a></p>
        </div>
        `
    );
};

export const notifyUserOfApproval = async (userData) => {
    await sendEmail(
        userData.email,
        'Account Approved - Mansa Edu',
        `Congratulations ${userData.name}! Your account has been approved. You can now log in.`,
        `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #4CAF50;">Account Approved!</h2>
            <p>Hi ${userData.name},</p>
            <p>Your registration request on Mansa Edu has been approved. You can now access your dashboard.</p>
            <p><a href="${process.env.FRONTEND_URL}/login" style="background: #818cf8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In Now</a></p>
        </div>
        `
    );
};

export const notifyUserOfRejection = async (email, name) => {
    await sendEmail(
        email,
        'Registration Update - Mansa Edu',
        `Hi ${name}, unfortunately your registration request was not approved at this time.`,
        `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #f44336;">Registration Status Update</h2>
            <p>Hi ${name},</p>
            <p>Unfortunately, your registration request on Mansa Edu was not approved at this time.</p>
            <p>If you believe this was a mistake, please contact support.</p>
        </div>
        `
    );
};
