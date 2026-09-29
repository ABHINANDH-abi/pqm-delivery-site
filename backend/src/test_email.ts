import 'dotenv/config';
import { emailService } from './services/email.service';

async function testEmail() {
  console.log('Sending test OTP email...');
  const success = await emailService.sendOtpEmail('6abhi6nad6@gmail.com', '999888', 'Abhinandh Test');
  console.log('Email dispatch result:', success);
}

testEmail();
