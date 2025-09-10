# D:\Sem-4\project\backend\email_service.py
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formatdate
import os
from typing import List, Optional
import logging

class EmailService:
    def __init__(self, smtp_server: str, smtp_port: int, sender_email: str, sender_password: str):
        """
        Initialize the EmailService with SMTP server details and sender credentials.
        
        Args:
            smtp_server (str): SMTP server address
            smtp_port (int): SMTP server port
            sender_email (str): Email address of the sender
            sender_password (str): Password for the sender email
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
        self.logger = logging.getLogger(__name__)
        
    def _create_message(
        self,
        recipient_emails: List[str],
        subject: str,
        body: str,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> MIMEMultipart:
        """
        Create a MIME message with the given parameters.
        
        Args:
            recipient_emails (List[str]): List of recipient email addresses
            subject (str): Email subject
            body (str): Email body
            cc_emails (Optional[List[str]]): List of CC email addresses
            bcc_emails (Optional[List[str]]): List of BCC email addresses
            
        Returns:
            MIMEMultipart: Constructed email message
        """
        msg = MIMEMultipart()
        msg['From'] = self.sender_email
        msg['To'] = ', '.join(recipient_emails)
        msg['Subject'] = subject
        msg['Date'] = formatdate(localtime=True)
        
        if cc_emails:
            msg['Cc'] = ', '.join(cc_emails)
        if bcc_emails:
            msg['Bcc'] = ', '.join(bcc_emails)
            
        msg.attach(MIMEText(body, 'plain'))
        return msg
        
    def _attach_files(self, msg: MIMEMultipart, attachments: List[str]) -> None:
        """
        Attach files to the email message.
        
        Args:
            msg (MIMEMultipart): Email message to attach files to
            attachments (List[str]): List of file paths to attach
        """
        for file_path in attachments:
            if not os.path.exists(file_path):
                self.logger.warning(f"Attachment file not found: {file_path}")
                continue
                
            with open(file_path, 'rb') as f:
                filename = os.path.basename(file_path)
                ext = os.path.splitext(filename)[1].lower()
                
                if ext == '.pdf':
                    attach = MIMEApplication(f.read(), _subtype="pdf")
                else:
                    attach = MIMEApplication(f.read(), _subtype=ext[1:])
                    
                attach.add_header('Content-Disposition', 'attachment', filename=filename)
                msg.attach(attach)
    
    def send_email(
        self,
        recipient_emails: List[str],
        subject: str,
        body: str,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email with optional attachments.
        
        Args:
            recipient_emails (List[str]): List of recipient email addresses
            subject (str): Email subject
            body (str): Email body
            cc_emails (Optional[List[str]]): List of CC email addresses
            bcc_emails (Optional[List[str]]): List of BCC email addresses
            attachments (Optional[List[str]]): List of file paths to attach
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not recipient_emails:
            self.logger.error("No recipient emails provided")
            return False
            
        try:
            msg = self._create_message(recipient_emails, subject, body, cc_emails, bcc_emails)
            
            if attachments:
                self._attach_files(msg, attachments)
                
            all_recipients = recipient_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
                
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(
                    self.sender_email,
                    all_recipients,
                    msg.as_string()
                )
                
            self.logger.info(f"Email successfully sent to {recipient_emails}")
            return True
            
        except smtplib.SMTPException as e:
            self.logger.error(f"SMTP error occurred: {str(e)}")
        except Exception as e:
            self.logger.error(f"Error sending email: {str(e)}")
            
        return False
    
    def send_email_with_pdf(self, recipient_email: str, subject: str, body: str, pdf_path: str) -> bool:
        """
        Convenience method to send an email with a single PDF attachment.
        
        Args:
            recipient_email (str): Recipient email address
            subject (str): Email subject
            body (str): Email body
            pdf_path (str): Path to the PDF file to attach
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        return self.send_email(
            recipient_emails=[recipient_email],
            subject=subject,
            body=body,
            attachments=[pdf_path]
        )