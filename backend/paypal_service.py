"""
PayPal Payment Service for TEC Educational Platform
Implements PayPal SDK v6 integration for international payments
"""

import os
import httpx
import base64
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# PayPal Configuration
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")

# PayPal API URLs
PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
PAYPAL_SDK_URL = "https://www.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://www.paypal.com"


class PayPalService:
    """Service class for PayPal payment operations"""
    
    def __init__(self):
        self.client_id = PAYPAL_CLIENT_ID
        self.client_secret = PAYPAL_CLIENT_SECRET
        self.api_base = PAYPAL_API_BASE
        self._access_token = None
        self._token_expires = None
    
    async def get_access_token(self) -> str:
        """Get PayPal OAuth access token"""
        # Return cached token if still valid
        if self._access_token and self._token_expires and datetime.now(timezone.utc) < self._token_expires:
            return self._access_token
        
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth_bytes}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data="grant_type=client_credentials"
            )
            
            if response.status_code != 200:
                logger.error(f"PayPal auth failed: {response.text}")
                raise Exception("Failed to authenticate with PayPal")
            
            data = response.json()
            self._access_token = data["access_token"]
            # Token typically expires in 32400 seconds (9 hours), cache for 8 hours
            from datetime import timedelta
            self._token_expires = datetime.now(timezone.utc) + timedelta(hours=8)
            
            return self._access_token
    
    async def get_client_token(self) -> str:
        """Get client token for frontend SDK initialization"""
        access_token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/v1/identity/generate-token",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "Accept-Language": "en_US"
                },
                json={}
            )
            
            if response.status_code != 200:
                logger.error(f"PayPal client token failed: {response.text}")
                raise Exception("Failed to get PayPal client token")
            
            data = response.json()
            return data["client_token"]
    
    async def create_order(
        self,
        amount: float,
        currency: str = "USD",
        description: str = "TEC Educational Platform Subscription",
        custom_id: Optional[str] = None
    ) -> dict:
        """Create a PayPal order for payment"""
        access_token = await self.get_access_token()
        
        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}"
                },
                "description": description
            }]
        }
        
        if custom_id:
            order_payload["purchase_units"][0]["custom_id"] = custom_id
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=order_payload
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"PayPal create order failed: {response.text}")
                raise Exception("Failed to create PayPal order")
            
            return response.json()
    
    async def capture_order(self, order_id: str) -> dict:
        """Capture a PayPal order after buyer approval"""
        access_token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={}
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"PayPal capture order failed: {response.text}")
                raise Exception("Failed to capture PayPal order")
            
            return response.json()
    
    async def get_order_details(self, order_id: str) -> dict:
        """Get details of a PayPal order"""
        access_token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/v2/checkout/orders/{order_id}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"PayPal get order failed: {response.text}")
                raise Exception("Failed to get PayPal order details")
            
            return response.json()


# Singleton instance
paypal_service = PayPalService()


# Currency conversion rates (approximate, for display purposes)
# In production, use a real-time currency API
CURRENCY_RATES = {
    "LKR_TO_USD": 0.0031,  # 1 LKR = ~0.0031 USD
    "USD_TO_LKR": 320.0,   # 1 USD = ~320 LKR
}


def convert_lkr_to_usd(amount_lkr: float) -> float:
    """Convert LKR to USD for PayPal payments"""
    return round(amount_lkr * CURRENCY_RATES["LKR_TO_USD"], 2)


def convert_usd_to_lkr(amount_usd: float) -> float:
    """Convert USD to LKR for display"""
    return round(amount_usd * CURRENCY_RATES["USD_TO_LKR"], 2)


# Subscription pricing in USD (for international payments)
PAYPAL_SUBSCRIPTION_PRICES = {
    "monthly": {
        "5-8": 15.00,    # Foundation Level
        "9-12": 18.00,   # Development Level
        "13-16": 22.00,  # Mastery Level
    },
    "quarterly": {
        "5-8": 40.00,
        "9-12": 48.00,
        "13-16": 58.00,
    },
    "annual": {
        "5-8": 140.00,
        "9-12": 168.00,
        "13-16": 200.00,
    }
}


def get_paypal_price(subscription_type: str, age_group: str) -> float:
    """Get PayPal price in USD for a subscription"""
    return PAYPAL_SUBSCRIPTION_PRICES.get(subscription_type, {}).get(age_group, 18.00)
