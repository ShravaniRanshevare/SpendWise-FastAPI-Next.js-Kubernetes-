from fastapi import FastAPI,Depends, HTTPException, status
from app.auth import router as auth_router
from app.db import get_connection
from app.security import get_current_user
from app.models import (
    Usercreate,
    User,
    Categorycreate,
    Category,
    CatName,
    Expensecreate,
    Expense,
    ExpenseUpdate,
    Token,
    CategoryTotal,
    AnalyticsSummary,
    Budgetcreate,
    Budget,
    BudgetAnalytics,
    budgetUpdate,
    Trend,
    Heatmap,
    Top,
    Ana_Month,
    Search
)

from datetime import date
from typing import List
import calendar

app=FastAPI()

app.include_router(auth_router,prefix="/api")

@app.get("/api/health")
def health():
    return {"message": "SpendWise API is running"}


@app.post("/api/expenses",response_model=Expense)
def create_expense(exp: Expensecreate, user= Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    if exp.created_at is None:
        exp.created_at = date.today()
    
    cur.execute("""INSERT INTO expenses(user_id,category_id,amount,currency,
                    date,description,payment_method,created_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                     RETURNING id,user_id,category_id,amount,currency,date,description,
                     payment_method,created_at;""",(int(user["sub"]),exp.category_id,exp.amount,
                exp.currency,exp.date,exp.description,exp.payment_method,exp.created_at))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="Expense not inserted, try again")
    
    conn.commit()
    cur.close()
    conn.close()
    return { "id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]}


@app.get("/api/expenses", response_model=List[Expense])
def get_expenses(user= Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])

    cur.execute("""
        SELECT * FROM expenses
        WHERE user_id=%s
        ORDER BY date DESC;
    """, (user_id,))

    rows = cur.fetchall()
    if not rows:
        return []

    cur.close()
    conn.close()

    return [{
        "id": row[0], "user_id": row[1], "category_id": row[2],
        "amount": float(row[3]), "currency": row[4], "date": row[5],
        "description": row[6], "payment_method": row[7], "created_at": row[8]
    } for row in rows]


@app.delete("/api/expenses/{exp_id}")
def delete_expense(exp_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT id FROM expenses WHERE user_id=%s AND id=%s;",(user_id,exp_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="No such Expense found")
    cur.execute("DELETE FROM expenses WHERE user_id=%s AND id=%s;",(user_id,exp_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message":"expense deleted"}

@app.put("/api/expenses/{exp_id}",response_model=Expense)
def update_expense(exp_id:int,exp: ExpenseUpdate,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT id FROM expenses WHERE user_id=%s AND id=%s;",(user_id,exp_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="No such Expense found")
    fields=[]
    values=[]
    if exp.category_id is not None:
        fields.append("category_id=%s")
        values.append(exp.category_id)
    if exp.amount is not None:
        fields.append("amount=%s")
        values.append(exp.amount)
    if exp.currency is not None:
        fields.append("currency=%s")
        values.append(exp.currency)
    if exp.date is not None:
        fields.append("date=%s")
        values.append(exp.date)
    if exp.description is not None:
        fields.append("description=%s")
        values.append(exp.description)
    if exp.payment_method is not None:
        fields.append("payment_method=%s")
        values.append(exp.payment_method)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    values.append(user_id)
    values.append(exp_id)
    query = f"UPDATE expenses SET {','.join(fields)} WHERE user_id=%s AND id=%s"
    query += " RETURNING id,user_id,category_id,amount,currency,date,description,payment_method,created_at;"
    
    cur.execute(query,values)
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return { "id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]}
    


@app.get("/api/analytics/summary",response_model=AnalyticsSummary)
def get_analysis(start_date:date| None = None, end_date:date| None = None ,user= Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    today = date.today()
    if start_date is None:
        start_date = date(today.year,today.month,1)
    if end_date is None:
        end_day = calendar.monthrange(today.year,today.month)[1]
        end_date = date(today.year,today.month,end_day)
        
    cur.execute("SELECT SUM(amount) FROM expenses WHERE user_id=%s AND date BETWEEN %s AND %s;",(user_id,start_date,end_date))
    total_spent=cur.fetchone()[0]
    if not total_spent:
        total_spent=0.0
    
    
    cur.execute("SELECT id,name FROM categories WHERE user_id=%s",(user_id,))
    counts = cur.fetchall()
    cats = [(count[0],count[1]) for count in counts]
    breakdown=[]
    for i in range(0,len(cats)):
        cur.execute("""SELECT SUM(amount) FROM expenses WHERE user_id=%s AND category_id=%s
                       AND  date BETWEEN %s AND %s;""",(user_id,cats[i][0],start_date,end_date))
        amt = cur.fetchone()[0]
        if not amt:
            amt = 0.0
        cat_dict={"category_id":cats[i][0],"category_name":cats[i][1],"total": float(amt)}
        
        breakdown.append(cat_dict)
        
    cur.close()
    conn.close()
    return {"start_date": start_date,"end_date": end_date,"total_spent":float(total_spent),"breakdown":breakdown}
        
        
        
@app.post("/api/categories",response_model=Category)
def create_category(cat: Categorycreate, user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    
    cur.execute("""INSERT INTO categories(user_id,name) VALUES(%s,%s) RETURNING id,user_id,name,created_at;""",(user_id,cat.name))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="Category not inserted, try again")
    conn.commit()
    cur.close()
    conn.close()
    return {"id":row[0],"user_id":row[1],"name":row[2],"created_at":row[3]}


@app.get("/api/categories",response_model=List[Category])
def get_categories(user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT * FROM categories WHERE user_id=%s;""",(user_id,))
    rows= cur.fetchall()
    if not rows:
        return []
    cur.close()
    conn.close()
    return [{"id":row[0],"user_id":row[1],"name":row[2],"created_at":row[3]} for row in rows]

@app.put("/api/categories/{cat_id}",response_model=Category)
def update_category(cat_id:int,name: CatName,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    if not name.name.strip():
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    cur.execute("""SELECT id FROM categories WHERE user_id=%s and id=%s;""",(user_id,cat_id))
    row= cur.fetchone()
    
    if not row:
        raise HTTPException(status_code=404,detail="no such category found")
        
    cur.execute("""UPDATE categories SET name=%s WHERE user_id=%s and id=%s RETURNING id,user_id,name,created_at;""",(name.name,user_id,cat_id))
    res = cur.fetchone();
    conn.commit()
    cur.close()
    conn.close()
    return {"id":res[0],"user_id":res[1],"name":res[2],"created_at":res[3]}
    
@app.delete("/api/categories/{cat_id}")
def delete_category(cat_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT id FROM categories WHERE user_id=%s and id=%s;""",(user_id,cat_id))
    row= cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="no such category found")
    cur.execute("UPDATE expenses SET category_id=NULL WHERE user_id=%s and category_id=%s;",(user_id,cat_id))
    conn.commit()
    #to set all expenses whose cat is this to default value of 0
    cur.execute("DELETE FROM categories WHERE user_id=%s and id=%s;",(user_id,cat_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message":"category deleted successfully"}


@app.post("/api/budgets",response_model=Budget)
def create_budget(budget: Budgetcreate,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("INSERT INTO budgets(user_id,category_id,category_name,amount,start,till_date) VALUES(%s,%s,%s,%s,%s,%s) RETURNING id,user_id,category_id,category_name,amount,start,till_date;",(user_id,budget.category_id,
                budget.category_name,budget.amount,budget.start,budget.till_date))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return { "id":row[0],"user_id": row[1],"category_id": row[2],"category_name":row[3],"amount":float(row[4]),"start": row[5],"till_date": row[6]}

@app.get("/api/budgets",response_model=List[Budget])
def get_budgets(user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM budgets WHERE user_id=%s;",(user_id,))
    rows= cur.fetchall()
    if not rows:
        return []
    cur.close()
    conn.close()
    return [{ "id":row[0],"user_id": row[1],"category_id": row[2],"category_name":row[3],"amount":float(row[4]),"start": row[5],"till_date": row[6]} for row in rows]

@app.get("/api/budgets/active",response_model=List[Budget])
def get_active_budgets(user=Depends(get_current_user)):
    today = date.today()
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM budgets WHERE user_id=%s AND start<= %s AND till_date>=%s;",(user_id,today,today))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    if not rows:
        return []
    return [{ "id":row[0],"user_id": row[1],"category_id": row[2],"category_name":row[3],
               "amount":float(row[4]),"start": row[5],"till_date": row[6]} for row in rows]

@app.get("/api/budgets/{b_id}",response_model=Budget)
def get_budget(b_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM budgets WHERE user_id=%s AND id=%s;",(user_id,b_id))
    row= cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="No budget found")
    cur.close()
    conn.close()
    return { "id":row[0],"user_id": row[1],"category_id": row[2],"category_name":row[3],"amount":float(row[4]),"start": row[5],"till_date": row[6]}

@app.get("/api/budgets/{b_id}/progress",response_model=BudgetAnalytics)
def get_budget_progress(b_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    #make sure budget exists for particular user
    cur.execute("SELECT id,category_id,amount,start,till_date FROM budgets WHERE user_id=%s AND id=%s;",(user_id,b_id))
    row=cur.fetchone()
    if not row:
        raise HTTPException(status_code=401,detail="No budget found")
    amount = row[2]
    cur.execute("SELECT SUM(amount) FROM expenses WHERE user_id=%s AND category_id=%s AND date BETWEEN %s AND %s;",(user_id,row[1],row[3],row[4]))
    spent= cur.fetchone()[0]
    spent = spent or 0
    remaining= amount-spent
    percentage_used =  0 if amount == 0 else (spent/amount)*100
    cur.close()
    conn.close()
    return {"budget_id":b_id,"amount":float(amount),"spent":float(spent),"remaining":float(remaining),"percentage_used":float(percentage_used)}

@app.put("/api/budgets/{b_id}",response_model=Budget)
def update_budget(bud: budgetUpdate, b_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    #make sure budget exists for particular user
    cur.execute("SELECT id FROM budgets WHERE user_id=%s AND id=%s;",(user_id,b_id))
    row=cur.fetchone()
    if not row:
        raise HTTPException(status_code=401,detail="No budget found")
    fields =[]
    values=[]
    if bud.category_id is not None:
        fields.append("category_id=%s")
        values.append(bud.category_id)
    if bud.category_name is not None:
        fields.append("category_name=%s")
        values.append(bud.category_name)
    if bud.amount is not None:
        fields.append("amount=%s")
        values.append(bud.amount)
    if bud.start is not None:
        fields.append("start=%s")
        values.append(bud.start)
    if bud.till_date is not None:
        fields.append("till_date =%s")
        values.append(bud.till_date)
    if not fields:
        raise HTTPException(status_code=401,detail="No fields to update")
    
    query = f"""UPDATE budgets SET {','.join(fields)} WHERE user_id=%s AND id=%s RETURNING id,user_id,category_id,
            category_name,amount,start,till_date;"""
    values.extend([user_id,b_id])
    cur.execute(query,values)
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return  { "id":row[0],"user_id": row[1],"category_id": row[2],"category_name":row[3],"amount":float(row[4]),"start": row[5],"till_date": row[6]}
    
@app.delete("/api/budgets/{b_id}")
def delete_budget(b_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT id FROM budgets WHERE user_id=%s AND id=%s;",(user_id,b_id))
    row=cur.fetchone()
    if not row:
        raise HTTPException(status_code=401,detail="No budget found")
    cur.execute("DELETE FROM budgets WHERE user_id=%s AND id=%s;",(user_id,b_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message":"budget deleted"}

@app.get("/api/expenses/uncategorized", response_model=List[Expense])
def get_uncategorized(user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM expenses WHERE user_id=%s AND category_id IS NULL;",(user_id,))
    rows = cur.fetchall()
    if not rows :
        return []
    cur.close()
    conn.close()
    return [{"id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]} for row in rows]
    
    
@app.get("/api/analytics/monthly",response_model=Ana_Month)
def get_monthly_analysis(year: int|None=None , month: int|None=None,user=Depends(get_current_user)):
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month= today.month
    start_date = date(year,month,1)
    end_day= calendar.monthrange(year,month)[1]
    end_date=date(year,month,end_day)
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT SUM(amount) FROM expenses WHERE user_id=%s AND date BETWEEN %s AND %s;",(user_id,start_date,end_date))
    total= cur.fetchone()[0]
    if not total:
        total = 0.0
    cur.close()
    conn.close()
    return {"expense":float(total)}

@app.get("/api/analytics/top",response_model=List[Top])
def get_top_categories(start:date,end:date,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT c.id AS id ,c.name AS name ,COALESCE(SUM(e.amount),0) AS amount
                 FROM categories c LEFT JOIN expenses e  ON e.category_id=c.id
                 WHERE e.user_id=%s AND e.date BETWEEN %s AND %s
                 GROUP BY c.id,c.name
                 ORDER BY amount DESC
                 LIMIT  3;""",(user_id,start,end))
    rows = cur.fetchall()
    if not rows:
        return []
    
    cur.close()
    conn.close()
    return [{"id": row[0] , "name": row[1],"amount":float(row[2]) } for row in rows]

@app.get("/api/analytics/category/{c_id}/trend",response_model=List[Trend])
def get_category_trend(c_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT DATE_TRUNC('month',date) AS month , COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id=%s AND category_id=%s
                 GROUP BY month ORDER BY month;""",(user_id,c_id))
    rows =cur.fetchall()
    cur.close()
    conn.close()
    return [{"month":row[0].strftime("%Y-%m"), "total": float(row[1])} for row in rows]

@app.get("/api/analytics/heatmap",response_model=List[Heatmap])
def get_heatmap(start:date,end:date,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT EXTRACT(dow FROM date) AS weekday, COALESCE(SUM(amount),0) AS total_w
                  FROM expenses WHERE user_id=%s AND date BETWEEN %s AND %s
                  GROUP BY weekday ORDER BY weekday ;""",(user_id,start,end))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"weekday":int(row[0]) , "total":float(row[1])} for row in rows]

@app.get("/api/expenses/category/{cat_id}",response_model=List[Expense])
def get_cat_expenses(cat_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM expenses WHERE user_id=%s AND category_id=%s;",(user_id,cat_id))
    rows = cur.fetchall()
    if not rows:
        return []
    cur.close()
    conn.close()
    return [{"id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]} for row in rows]

@app.get("/api/expenses/payment/{method}",response_model=List[Expense])
def get_payment_expenses(method:str,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT * FROM expenses WHERE user_id=%s AND payment_method=%s;",(user_id,method))
    rows = cur.fetchall()
    if not rows:
        return []
    cur.close()
    conn.close()
    return [{"id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]} for row in rows]

@app.get("/api/expenses/search",response_model=List[Expense])
def search_expenses(query:str,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    
    pattern = f"%{query}%"
    cur.execute("SELECT * FROM expenses WHERE user_id=%s AND description ILIKE %s;",(user_id,pattern))
    res = cur.fetchall()
    if not res:
        return []
    return [{"id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]} for row in res]

@app.get("/api/expenses/searchall", response_model=List[Expense])
def search_all(query:Search,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    fields =[]
    values=[]
    if query.description is not None:
        fields.append("e.description ILIKE %s")
        values.append(f"%{query.description}%")
        
    if query.category_name is not None:
        fields.append("c.name ILIKE %s")
        values.append(f"%{query.category_name}%")
        
    if query.payment_method is not None:
        fields.append("e.payment_method ILIKE %s")
        values.append(f"%{query.payment_method}%")
    fields.append("e.user_id=%s")
    values.append(user_id)
    run = f"SELECT e.* FROM expenses e JOIN categories c ON e.category_id = c.id C WHERE {' AND '.join(fields)};"
    cur.execute(run,values)
    rows = cur.fetchall()
    if not rows:
        return []
    cur.close()
    conn.close()
    return [{"id": row[0], "user_id": row[1],"category_id": row[2], "amount": float(row[3]),
             "currency": row[4], "date": row[5], "description": row[6], "payment_method": row[7],
             "created_at": row[8]} for row in rows]

    

@app.post("/api/categories/merge")
def merge_categories(source_id:int,target_id:int,user=Depends(get_current_user)):
    conn= get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("SELECT id FROM categories WHERE user_id=%s AND id=%s;",(user_id,source_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="No such source category exists")
    cur.execute("SELECT id FROM categories WHERE user_id=%s AND id=%s;",(user_id,target_id))
    res = cur.fetchone()
    if not res:
        raise HTTPException(status_code=404,detail="No such target category exists")
    
    cur.execute("UPDATE expenses SET category_id=%s WHERE user_id=%s AND category_id=%s;",(target_id,user_id,source_id))
    conn.commit()
    cur.execute("DELETE FROM categories WHERE user_id=%s AND id=%s;",(user_id,source_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message":"categories merged"}

@app.get("/api/expenses/recent")
def get_recent_expenses(user=Depends(get_current_user)):
    conn=get_connection()
    cur=conn.cursor()
    user_id= int(user["sub"])
    cur.execute("""SELECT e.id, e.description,e.amount,e.date,c.name
                    FROM expenses e LEFT JOIN categories c ON e.category_id=c.id
                    WHERE e.user_id=%s
                    ORDER BY e.date DESC
                    LIMIT 10;""",(user_id,))
    rows = cur.fetchall()
    if not rows :
        return []
    cur.close()
    conn.close()
    return [{"id":row[0],"description":row[1],"amount":row[2],"date":row[3],"category_name":row[4]} for row in rows]

    