from pydantic import BaseModel
from typing import Optional, Dict, Literal
from datetime import datetime


class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    currency: str = "USD"
    payment_method: Literal['credit_card', 'paypal', 'bank_transfer']
    payment_details: Dict


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    created_at: datetime


class PaymentDetailResponse(PaymentResponse):
    payment_details: Optional[Dict] = None
    updated_at: Optional[datetime] = None
