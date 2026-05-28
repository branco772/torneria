from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.expense_schema import ExpenseCreate, ExpenseResponse
from app.services.expense_service import create_expense, get_expenses, delete_expense
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


# 🔥 Crear gasto
@router.post("/expenses", response_model=ExpenseResponse)
def create_new_expense(
    expense: ExpenseCreate = Body(...),
    db: Session = Depends(get_db)
):
    return create_expense(db, expense)


# 🔥 Listar gastos
@router.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(db: Session = Depends(get_db)):
    return get_expenses(db)

# 🔥 Eliminar gasto
@router.delete("/expenses/{id}")
def remove_expense(id: int, db: Session = Depends(get_db)):
    result = delete_expense(db, id)

    if not result:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    return {"message": "Gasto eliminado correctamente"}