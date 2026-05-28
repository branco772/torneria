from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.client_schema import ClientCreate, ClientResponse
from app.services.client_service import (
    create_client,
    get_clients,
    get_client,
    update_client,
    delete_client,
    get_client_stats,
)
from app.core.security import get_current_user
router = APIRouter(dependencies=[Depends(get_current_user)])


# 🔥 Crear cliente
@router.post("/clients", response_model=ClientResponse)
def create_new_client(client: ClientCreate, db: Session = Depends(get_db)):
    return create_client(db, client)


# 🔥 Listar clientes
@router.get("/clients", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    return get_clients(db)


# 🔥 Obtener un cliente
@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_one_client(client_id: int, db: Session = Depends(get_db)):
    client = get_client(db, client_id)

    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return client


# 🔥 Actualizar cliente
@router.put("/clients/{client_id}", response_model=ClientResponse)
def update_one_client(client_id: int, client: ClientCreate, db: Session = Depends(get_db)):
    updated = update_client(db, client_id, client)

    if not updated:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return updated


# 🔥 Eliminar cliente
@router.delete("/clients/{client_id}")
def delete_one_client(client_id: int, db: Session = Depends(get_db)):
    deleted = delete_client(db, client_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {"message": "Cliente eliminado"}

@router.get("/clients/{client_id}/stats")
def client_stats(client_id: int, db: Session = Depends(get_db)):
    return get_client_stats(db, client_id)