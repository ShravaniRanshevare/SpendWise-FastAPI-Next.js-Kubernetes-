from pydantic import BaseModel,EmailStr
from datetime import datetime,date


class Usercreate(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: EmailStr
    
#not sure
    
class Categorycreate(BaseModel):
    name: str
    
    
class Category(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    
    class Config:
        orm_mode=True
        
class CatName(BaseModel):
    name: str
    
class Expensecreate(BaseModel):
    category_id: int|None=None
    amount: float
    currency: str="GBP"
    date: date
    description: str|None = None
    payment_method: str|None=None
    created_at: date|None=None
    
class Expense(BaseModel):
    id: int
    user_id: int
    category_id: int|None=None
    amount: float
    currency: str="GBP"
    date: date
    description: str|None = None
    payment_method: str|None=None
    created_at: date
    
class ExpenseUpdate(BaseModel):
    category_id:int|None=None
    amount: float|None=None
    currency: str|None ="GBP"
    date: datetime|None
    description: str|None = None
    payment_method: str|None=None
    
class Token(BaseModel):
    access_token: str
    token_type: str
    

class CategoryTotal(BaseModel):
    category_id: int | None
    category_name: str | None
    total: float|None


class AnalyticsSummary(BaseModel):
    start_date: date
    end_date: date
    total_spent: float |None
    breakdown: list[CategoryTotal]
    
class Budgetcreate(BaseModel):
    category_id:int
    category_name:str
    amount:float
    start: date
    till_date:date
    
class Budget(BaseModel):
    id: int
    user_id: int
    category_id:int
    category_name:str
    amount:float
    start: date
    till_date:date
    
class BudgetAnalytics(BaseModel):
    budget_id: int
    amount:float
    spent: float|None
    remaining: float
    percentage_used: float|None

class budgetUpdate(BaseModel):
    category_id:int|None = None
    category_name:str|None = None
    amount:float|None = None
    start: date|None = None
    till_date:date|None =None
    
class Trend(BaseModel):
    month: date
    total: float|None
    
class Heatmap(BaseModel):
    weekday:int
    total:float|None

class Top(BaseModel):
    id:int
    name:str
    amount:float|None
    
    
class Ana_Month(BaseModel):
    expense:float|None
    
class Search(BaseModel):
    description: str|None=None
    category_name:str|None=None
    payment_method:str|None=None
    