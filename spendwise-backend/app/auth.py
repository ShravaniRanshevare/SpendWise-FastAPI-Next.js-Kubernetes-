from fastapi import APIRouter
from app.db import get_connection
from app.security import create_access_token,hash_password, verify_password
from app.models import Usercreate,User,Token

router= APIRouter()

@router.post("/auth/register",response_model=User)
def register_user(user:Usercreate):
    conn=get_connection()
    cur=conn.cursor()
    cur.execute("SELECT email FROM users WHERE email=%s;",(user.email,))
    row = cur.fetchone()
    if row:
        raise HTTPException(status_code=400,detail="Email already exists")
    password_hash= hash_password(user.password)
    cur.execute("INSERT INTO users (email,password_hash) VALUES(%s,%s) RETURNING id,email;",(user.email,password_hash))
    res = cur.fetchone()
    conn.commit()
    conn.close()
    cur.close()
    return {"id": res[0], "email": res[1]}

@router.post("/auth/login",response_model=Token)
def login_user(user:Usercreate):
    conn=get_connection()
    cur=conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=%s;",(user.email,))
    row=cur.fetchone()
    if not user.email==row[1] or not verify_password(user.password,row[2]):
       raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token=create_access_token({"sub":str(row[0]),"email":user.email})
    conn.close()
    cur.close()
    return {"access_token": token, "token_type": "bearer" }



    

    

