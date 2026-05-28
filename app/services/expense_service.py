from sqlalchemy.orm import Session, joinedload
from models.expense import Expense
from models.job import Job

from fastapi import HTTPException

# 🔥 Crear gasto
def create_expense(db: Session, expense_data):

    if expense_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Cantidad inválida")

    if expense_data.unit_price <= 0:
        raise HTTPException(status_code=400, detail="Precio inválido")

    if expense_data.job_id:
        job = db.query(Job).filter(Job.id == expense_data.job_id).first()
        if not job:
            raise HTTPException(status_code=400, detail="El trabajo asociado no existe")

    total = expense_data.quantity * expense_data.unit_price

    new_expense = Expense(
        description=expense_data.description,
        quantity=expense_data.quantity,
        unit_price=expense_data.unit_price,
        amount=total,
        category=expense_data.category,
        job_id=expense_data.job_id
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


# 🔥 Listar gastos
def get_expenses(db: Session):
    return db.query(Expense).options(joinedload(Expense.job)).all()

#borrar gasto
def delete_expense(db, id: int):
    expense = db.query(Expense).filter(Expense.id == id).first()

    if not expense:
        return None

    db.delete(expense)
    db.commit()

    return True
