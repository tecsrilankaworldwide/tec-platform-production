# Country Configuration for TecaiKids Platform
# Handles currency, pricing, language, and cultural considerations

COUNTRY_CONFIG = {
    "sri_lanka": {
        "code": "SRI",
        "name": "Sri Lanka",
        "currency": "LKR",
        "currency_symbol": "Rs.",
        "languages": ["en", "si", "ta"],
        "default_language": "en",
        "photo_policy": "optional",  # photos allowed
        "payment_methods": ["bank_transfer", "card", "paypal"],
        "pricing_multiplier": 1.0,  # Base pricing
        "phone_prefix": "+94"
    },
    "india": {
        "code": "IND",
        "name": "India",
        "currency": "INR",
        "currency_symbol": "₹",
        "languages": ["en", "hi", "bn"],
        "default_language": "hi",
        "photo_policy": "optional",
        "payment_methods": ["upi", "card", "bank_transfer"],
        "pricing_multiplier": 0.5,  # INR pricing (1 LKR ≈ 0.5 INR)
        "phone_prefix": "+91"
    },
    "malaysia": {
        "code": "MAL",
        "name": "Malaysia",
        "currency": "MYR",
        "currency_symbol": "RM",
        "languages": ["en", "ms"],
        "default_language": "ms",
        "photo_policy": "optional",
        "payment_methods": ["fpx", "card", "bank_transfer"],
        "pricing_multiplier": 0.12,  # MYR pricing
        "phone_prefix": "+60"
    },
    "bangladesh": {
        "code": "BAN",
        "name": "Bangladesh",
        "currency": "BDT",
        "currency_symbol": "৳",
        "languages": ["en", "bn"],
        "default_language": "bn",
        "photo_policy": "optional",
        "payment_methods": ["bkash", "nagad", "bank_transfer"],
        "pricing_multiplier": 0.6,  # BDT pricing
        "phone_prefix": "+880"
    },
    "pakistan": {
        "code": "PAK",
        "name": "Pakistan",
        "currency": "PKR",
        "currency_symbol": "Rs.",
        "languages": ["en", "ur"],
        "default_language": "ur",
        "photo_policy": "discouraged",  # Recommend initials/avatar for female students
        "payment_methods": ["easypaisa", "jazzcash", "bank_transfer"],
        "pricing_multiplier": 0.5,  # PKR pricing
        "phone_prefix": "+92",
        "photo_alternative_message": "For privacy and cultural respect, we recommend using initials or avatar instead of photos."
    },
    "saudi_arabia": {
        "code": "SAU",
        "name": "Saudi Arabia",
        "currency": "SAR",
        "currency_symbol": "ر.س",
        "languages": ["ar", "en"],
        "default_language": "ar",
        "photo_policy": "discouraged",  # Recommend initials/avatar
        "payment_methods": ["card", "bank_transfer", "stc_pay"],
        "pricing_multiplier": 0.06,  # SAR pricing (1 LKR ≈ 0.06 SAR)
        "phone_prefix": "+966",
        "photo_alternative_message": "نوصي باستخدام الأحرف الأولى أو الصورة الرمزية بدلاً من الصور للخصوصية والاحترام الثقافي"
    },
    "uae": {
        "code": "UAE",
        "name": "United Arab Emirates",
        "currency": "AED",
        "currency_symbol": "د.إ",
        "languages": ["ar", "en"],
        "default_language": "ar",
        "photo_policy": "discouraged",
        "payment_methods": ["card", "bank_transfer", "apple_pay"],
        "pricing_multiplier": 0.07,  # AED pricing
        "phone_prefix": "+971",
        "photo_alternative_message": "نوصي باستخدام الأحرف الأولى أو الصورة الرمزية للخصوصية"
    },
    "indonesia": {
        "code": "IDN",
        "name": "Indonesia",
        "currency": "IDR",
        "currency_symbol": "Rp",
        "languages": ["id", "en"],
        "default_language": "id",
        "photo_policy": "optional",
        "payment_methods": ["gopay", "ovo", "bank_transfer"],
        "pricing_multiplier": 50,  # IDR pricing (1 LKR ≈ 50 IDR)
        "phone_prefix": "+62"
    },
    "singapore": {
        "code": "SGP",
        "name": "Singapore",
        "currency": "SGD",
        "currency_symbol": "S$",
        "languages": ["en", "zh", "ms", "ta"],
        "default_language": "en",
        "photo_policy": "optional",
        "payment_methods": ["paynow", "card", "bank_transfer"],
        "pricing_multiplier": 0.01,  # SGD pricing
        "phone_prefix": "+65"
    },
    "international": {
        "code": "INT",
        "name": "International",
        "currency": "USD",
        "currency_symbol": "$",
        "languages": ["en"],
        "default_language": "en",
        "photo_policy": "optional",
        "payment_methods": ["card", "paypal"],
        "pricing_multiplier": 0.003,  # USD pricing
        "phone_prefix": "+1"
    }
}

# Language to Country Mapping
LANGUAGE_TO_COUNTRY = {
    "en": "international",
    "si": "sri_lanka",
    "ta": "sri_lanka",  # Tamil can be Sri Lanka or India
    "hi": "india",
    "bn": "bangladesh",
    "ms": "malaysia",
    "id": "indonesia",
    "ar": "saudi_arabia",  # Default to Saudi for Arabic
    "ur": "pakistan",
    "zh": "singapore"
}

# Age Group Pricing (Base in LKR - multiply by country multiplier)
BASE_PRICING = {
    "4-6": {  # Foundation
        "monthly": 800,
        "quarterly": 2800,
        "savings_percentage": 25
    },
    "7-9": {  # Explorers
        "monthly": 1200,
        "quarterly": 4200,
        "savings_percentage": 25
    },
    "10-12": {  # Smart
        "monthly": 1500,
        "quarterly": 5250,
        "savings_percentage": 28
    },
    "13-15": {  # Teens
        "monthly": 2000,
        "quarterly": 7000,
        "savings_percentage": 25
    },
    "16-18": {  # Leaders
        "monthly": 2500,
        "quarterly": 8750,
        "savings_percentage": 30
    }
}

def get_country_from_language(language_code):
    """Get country configuration from language code"""
    country_key = LANGUAGE_TO_COUNTRY.get(language_code, "international")
    return country_key, COUNTRY_CONFIG[country_key]

def get_pricing_for_country(age_group, country_code, billing_cycle="monthly"):
    """Calculate pricing in local currency for a country"""
    country_key = country_code.lower() if country_code else "international"
    
    if country_key not in COUNTRY_CONFIG:
        country_key = "international"
    
    country = COUNTRY_CONFIG[country_key]
    base_price = BASE_PRICING.get(age_group, BASE_PRICING["4-6"])[billing_cycle]
    
    local_price = base_price * country["pricing_multiplier"]
    
    return {
        "amount": round(local_price, 2),
        "currency": country["currency"],
        "symbol": country["currency_symbol"],
        "formatted": f"{country['currency_symbol']} {round(local_price, 2):,.2f}"
    }

def should_recommend_photo_alternative(country_code):
    """Check if we should recommend photo alternatives for this country"""
    country_key = country_code.lower() if country_code else "international"
    
    if country_key not in COUNTRY_CONFIG:
        return False, None
    
    country = COUNTRY_CONFIG[country_key]
    
    if country["photo_policy"] == "discouraged":
        return True, country.get("photo_alternative_message", 
                                 "For privacy and cultural respect, we recommend using initials or avatar.")
    
    return False, None

def get_country_config(country_code):
    """Get full country configuration"""
    country_key = country_code.lower() if country_code else "international"
    return COUNTRY_CONFIG.get(country_key, COUNTRY_CONFIG["international"])
