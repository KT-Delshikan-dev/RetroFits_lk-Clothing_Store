import spacy
from typing import List, Dict, Optional

# Load English NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If not found, we'll need to download it in setup
    nlp = None

# Term normalization mapping
NORMALIZATION_MAP = {
    "tee": "t-shirt",
    "tees": "t-shirt",
    "tshirt": "t-shirt",
    "t-shirts": "t-shirt",
    "hoody": "hoodie",
    "hoodies": "hoodie",
    "jean": "jeans",
    "trouser": "pants",
    "pant": "pants",
    "sneaker": "shoes",
    "sneakers": "shoes",
    "footwear": "shoes"
}

# Category mapping
CATEGORY_MAP = {
    "men": "Men",
    "man": "Men",
    "male": "Men",
    "boys": "Men",
    "women": "Women",
    "woman": "Women",
    "female": "Women",
    "girls": "Women",
    "lady": "Women",
    "ladies": "Women",
    "accessories": "Accessories",
    "footwear": "Footwear"
}

def extract_keywords(text: str) -> Dict:
    if not nlp:
        return {"keywords": text.split(), "category": None}
    
    doc = nlp(text.lower())
    
    keywords = []
    category = None
    
    # Extract nouns and adjectives
    for token in doc:
        # Check for category
        if token.text in CATEGORY_MAP:
            category = CATEGORY_MAP[token.text]
            continue
            
        # Extract keywords (nouns, adjectives, proper nouns)
        if token.pos_ in ["NOUN", "ADJ", "PROPN"] and not token.is_stop:
            term = token.text
            # Normalize term
            normalized_term = NORMALIZATION_MAP.get(term, term)
            if normalized_term not in keywords:
                keywords.append(normalized_term)
                
    return {
        "keywords": keywords,
        "category": category,
        "original_query": text
    }

import re

def detect_intent(text: str) -> Dict:
    text = text.lower()
    
    # 1. Order Status Intent
    order_match = re.search(r'(?:order|tracking)(?:\s+#?|[:#])\s*([a-z0-9]+)', text)
    if order_match or any(word in text for word in ["where is my order", "order status", "track my package"]):
        order_id = order_match.group(1) if order_match else None
        return {
            "intent": "order_status",
            "order_id": order_id,
            "response": f"I can help you track your order. {f'Checking status for order {order_id}...' if order_id else 'Please provide your Order ID (e.g., Order #12345).'}"
        }

    # 2. Size Recommendation Intent
    if any(word in text for word in ["size", "fit", "what size", "recommend a size"]):
        # Extract height/weight if present (simple regex)
        height_match = re.search(r'(\d+)\s*(?:cm|ft|feet|inch)', text)
        weight_match = re.search(r'(\d+)\s*(?:kg|lbs|pounds)', text)
        
        return {
            "intent": "size_recommendation",
            "height": height_match.group(0) if height_match else None,
            "weight": weight_match.group(0) if weight_match else None,
            "response": "To give you the best size recommendation, I'll need your height and weight. Generally, our sizes run true to fit."
        }

    # 3. Availability/Price Intent
    if any(word in text for word in ["stock", "available", "have in store", "price", "how much", "cost"]):
        keywords_data = extract_keywords(text)
        return {
            "intent": "availability",
            "keywords": keywords_data["keywords"],
            "category": keywords_data["category"],
            "response": f"Let me check the availability and price for {', '.join(keywords_data['keywords']) if keywords_data['keywords'] else 'that item'}."
        }

    # 4. Recommendation Intents (Rule-based)
    if any(word in text for word in ["party", "wedding", "formal", "event"]):
        return {
            "intent": "recommendation",
            "suggestion": "party wear",
            "response": "I see you're looking for something for a special occasion! Check out our formal collection."
        }
    elif any(word in text for word in ["casual", "daily", "home", "chill"]):
        return {
            "intent": "recommendation",
            "suggestion": "casual wear",
            "response": "For a relaxed look, I recommend our casual t-shirts and jeans."
        }
    elif any(word in text for word in ["sport", "gym", "run", "active"]):
        return {
            "intent": "recommendation",
            "suggestion": "sportswear",
            "response": "Looking to stay active? Our sportswear collection is perfect for you."
        }
    
    # 5. Greeting Intent
    elif any(word in text for word in ["hi", "hello", "hey", "greetings"]):
        return {
            "intent": "greeting",
            "response": "Hello! I am your RetroFits AI assistant. How can I help you find the perfect outfit today?"
        }
    
    # 6. Default Search Intent
    else:
        keywords_data = extract_keywords(text)
        if keywords_data["keywords"]:
            return {
                "intent": "search",
                "keywords": keywords_data["keywords"],
                "category": keywords_data["category"],
                "response": f"Looking for {', '.join(keywords_data['keywords'])}... Here's what I found!"
            }
        return {
            "intent": "general",
            "response": "I'm not sure I understand, but I can help you search for products! Try 'casual shirts' or 'red dresses'."
        }
