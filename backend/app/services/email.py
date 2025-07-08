import os
from typing import List, Dict, Any, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi_mail.errors import ConnectionErrors
from pydantic import EmailStr
from jinja2 import Environment, select_autoescape, FileSystemLoader
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get email configuration from environment
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@skyboundjourneys.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "SkyBound Journeys")
MAIL_TLS = os.getenv("MAIL_TLS", "True").lower() == "true"
MAIL_SSL = os.getenv("MAIL_SSL", "False").lower() == "true"

# Email templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# Create template directory if it doesn't exist
TEMPLATES_DIR.mkdir(exist_ok=True)

# Create Jinja2 environment for email templates
env = Environment(
    loader=FileSystemLoader([TEMPLATES_DIR]),
    autoescape=select_autoescape(['html', 'xml'])
)

# FastAPI Mail configuration
# Creating config only if mail server is configured, otherwise use a dummy config for dev
if MAIL_SERVER:
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_FROM_NAME=MAIL_FROM_NAME,
        MAIL_STARTTLS=MAIL_TLS,  # Updated to match newer API
        MAIL_SSL_TLS=MAIL_SSL,   # Updated to match newer API
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=TEMPLATES_DIR
    )
else:
    # Dummy configuration for development environments
    logger.warning("⚠️ Email server not configured. Using dummy configuration for development.")
    conf = ConnectionConfig(
        MAIL_USERNAME="dummy",
        MAIL_PASSWORD="dummy",
        MAIL_FROM=MAIL_FROM,
        MAIL_PORT=587,
        MAIL_SERVER="dummy.example.com",
        MAIL_FROM_NAME=MAIL_FROM_NAME,
        MAIL_STARTTLS=False,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=False,
        VALIDATE_CERTS=False,
        TEMPLATE_FOLDER=TEMPLATES_DIR
    )

class EmailNotificationService:
    """Service for sending email notifications"""
    
    @staticmethod
    async def send_email(
        email_to: List[EmailStr],
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        cc: Optional[List[EmailStr]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Send an email using the provided template and context
        
        Args:
            email_to: List of recipient email addresses
            subject: Email subject
            template_name: Name of the template to use (without .html extension)
            context: Variables to pass to the template
            cc: Optional list of CC addresses
            attachments: Optional list of attachments
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Load template
            template = env.get_template(f"{template_name}.html")
            
            # Render template with context
            html_content = template.render(**context)
            
            # Create message
            message = MessageSchema(
                subject=subject,
                recipients=email_to,
                body=html_content,
                subtype="html",
                cc=cc or []
            )
            
            # Initialize FastMail
            fm = FastMail(conf)
            
            # Send email
            await fm.send_message(message, template_name=template_name)
            logger.info(f"Email sent successfully to {', '.join(email_to)}")
            return True
            
        except ConnectionErrors as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email: {str(e)}")
            return False
    
    @classmethod
    async def send_booking_confirmation(
        cls,
        email_to: EmailStr,
        booking_details: Dict[str, Any]
    ) -> bool:
        """
        Send booking confirmation email
        
        Args:
            email_to: Recipient email address
            booking_details: Dictionary containing booking information
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = f"Booking Confirmation - {booking_details.get('booking_reference', '')}"
        
        context = {
            "booking": booking_details,
            "user_name": f"{booking_details.get('user', {}).get('first_name', '')} {booking_details.get('user', {}).get('last_name', '')}",
        }
        
        return await cls.send_email(
            email_to=[email_to],
            subject=subject,
            template_name="booking_confirmation",
            context=context
        )
    
    @classmethod
    async def send_booking_update(
        cls,
        email_to: EmailStr,
        booking_details: Dict[str, Any],
        update_type: str
    ) -> bool:
        """
        Send booking update email (e.g., cancellation, modification)
        
        Args:
            email_to: Recipient email address
            booking_details: Dictionary containing booking information
            update_type: Type of update (e.g., 'cancelled', 'modified')
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = f"Booking {update_type.title()} - {booking_details.get('booking_reference', '')}"
        
        context = {
            "booking": booking_details,
            "user_name": f"{booking_details.get('user', {}).get('first_name', '')} {booking_details.get('user', {}).get('last_name', '')}",
            "update_type": update_type
        }
        
        return await cls.send_email(
            email_to=[email_to],
            subject=subject,
            template_name="booking_update",
            context=context
        )
    
    @classmethod
    async def send_flight_status_update(
        cls,
        email_to: EmailStr,
        flight_details: Dict[str, Any],
        status_update: str
    ) -> bool:
        """
        Send flight status update email
        
        Args:
            email_to: Recipient email address
            flight_details: Dictionary containing flight information
            status_update: New flight status
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = f"Flight Status Update - {flight_details.get('flight_number', '')}"
        
        context = {
            "flight": flight_details,
            "status": status_update,
            "user_name": f"{flight_details.get('user', {}).get('first_name', '')} {flight_details.get('user', {}).get('last_name', '')}",
        }
        
        return await cls.send_email(
            email_to=[email_to],
            subject=subject,
            template_name="flight_status_update",
            context=context
        )
