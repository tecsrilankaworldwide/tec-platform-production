from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib
from jose import JWTError, jwt
import os
import uuid
import logging
import asyncpg
import json

# Database connection
class Database:
    def __init__(self):
        self.pool = None
    
    async def connect(self):
        database_url = os.environ.get('DATABASE_URL')
        if database_url and database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        self.pool = await asyncpg.create_pool(
            database_url,
            min_size=1,
            max_size=10
        )
        await self.create_tables()
