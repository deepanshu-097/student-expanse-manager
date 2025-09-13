from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import hashlib
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret (in production, use a secure random secret)
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Student Expense Manager", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Chat instance
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({'id': user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    category: str  # Food, Travel, Study Material, Personal, Other
    date: datetime
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    date: datetime
    notes: Optional[str] = None

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # 'monthly' or 'category'
    category: Optional[str] = None  # Required if type is 'category'
    amount: float
    month: int  # 1-12
    year: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetCreate(BaseModel):
    type: str
    category: Optional[str] = None
    amount: float
    month: int
    year: int

class SavingsGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    target_amount: float
    current_amount: float = 0.0
    target_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SavingsGoalCreate(BaseModel):
    title: str
    target_amount: float
    target_date: datetime

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper function to serialize datetime for MongoDB
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key in ['date', 'created_at', 'target_date']:
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# Authentication Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({'email': user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password)
    )
    
    user_dict = prepare_for_mongo(user.dict())
    await db.users.insert_one(user_dict)
    
    return UserResponse(**user.dict())

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({'email': login_data.email})
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'])
    user_obj = parse_from_mongo(user)
    
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': UserResponse(**user_obj)
    }

# Expense Routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: User = Depends(get_current_user)):
    expense = Expense(
        user_id=current_user.id,
        **expense_data.dict()
    )
    
    expense_dict = prepare_for_mongo(expense.dict())
    await db.expenses.insert_one(expense_dict)
    
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: User = Depends(get_current_user)):
    expenses = await db.expenses.find({'user_id': current_user.id}).sort('date', -1).to_list(1000)
    return [Expense(**parse_from_mongo(expense)) for expense in expenses]

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    expense = await db.expenses.find_one({'id': expense_id, 'user_id': current_user.id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return Expense(**parse_from_mongo(expense))

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseCreate, current_user: User = Depends(get_current_user)):
    expense = await db.expenses.find_one({'id': expense_id, 'user_id': current_user.id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = prepare_for_mongo(expense_data.dict())
    await db.expenses.update_one(
        {'id': expense_id, 'user_id': current_user.id},
        {'$set': update_data}
    )
    
    updated_expense = await db.expenses.find_one({'id': expense_id, 'user_id': current_user.id})
    return Expense(**parse_from_mongo(updated_expense))

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    result = await db.expenses.delete_one({'id': expense_id, 'user_id': current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense deleted successfully"}

# Budget Routes
@api_router.post("/budgets", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, current_user: User = Depends(get_current_user)):
    budget = Budget(
        user_id=current_user.id,
        **budget_data.dict()
    )
    
    budget_dict = prepare_for_mongo(budget.dict())
    await db.budgets.insert_one(budget_dict)
    
    return budget

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(current_user: User = Depends(get_current_user)):
    budgets = await db.budgets.find({'user_id': current_user.id}).to_list(1000)
    return [Budget(**parse_from_mongo(budget)) for budget in budgets]

# Savings Goals Routes
@api_router.post("/savings-goals", response_model=SavingsGoal)
async def create_savings_goal(goal_data: SavingsGoalCreate, current_user: User = Depends(get_current_user)):
    goal = SavingsGoal(
        user_id=current_user.id,
        **goal_data.dict()
    )
    
    goal_dict = prepare_for_mongo(goal.dict())
    await db.savings_goals.insert_one(goal_dict)
    
    return goal

@api_router.get("/savings-goals", response_model=List[SavingsGoal])
async def get_savings_goals(current_user: User = Depends(get_current_user)):
    goals = await db.savings_goals.find({'user_id': current_user.id}).to_list(1000)
    return [SavingsGoal(**parse_from_mongo(goal)) for goal in goals]

@api_router.put("/savings-goals/{goal_id}/add-amount")
async def add_to_savings(goal_id: str, amount: float, current_user: User = Depends(get_current_user)):
    goal = await db.savings_goals.find_one({'id': goal_id, 'user_id': current_user.id})
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    new_amount = goal['current_amount'] + amount
    await db.savings_goals.update_one(
        {'id': goal_id, 'user_id': current_user.id},
        {'$set': {'current_amount': new_amount}}
    )
    
    updated_goal = await db.savings_goals.find_one({'id': goal_id, 'user_id': current_user.id})
    return SavingsGoal(**parse_from_mongo(updated_goal))

# Analytics Routes
@api_router.get("/analytics/expense-summary")
async def get_expense_summary(current_user: User = Depends(get_current_user)):
    expenses = await db.expenses.find({'user_id': current_user.id}).to_list(1000)
    
    total_expenses = sum(expense['amount'] for expense in expenses)
    category_totals = {}
    
    for expense in expenses:
        category = expense['category']
        category_totals[category] = category_totals.get(category, 0) + expense['amount']
    
    return {
        'total_expenses': total_expenses,
        'category_breakdown': category_totals,
        'expense_count': len(expenses)
    }

# AI Chat Routes
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message_data: ChatMessage, current_user: User = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        # Get user's recent expenses for context
        recent_expenses = await db.expenses.find({'user_id': current_user.id}).sort('date', -1).limit(10).to_list(10)
        
        # Prepare context about user's expenses
        context = f"""You are a financial advisor AI for a student expense management app. 
        The user {current_user.name} has recent expenses: {len(recent_expenses)} transactions.
        Provide helpful, concise financial advice and answer questions about budgeting, saving, and expense management.
        Keep responses friendly and educational for students."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"user_{current_user.id}",
            system_message=context
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=message_data.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(response=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Student Expense Manager API", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()