from fastapi import APIRouter
from app.api.routes import job_routes, client_routes, worker_routes, payment_routes, expense_routes, report_routes, dashboard_routes, auth_routes, users_routes, epp_routes

router=APIRouter()

router.include_router(job_routes.router)
router.include_router(client_routes.router)
router.include_router(worker_routes.router)
router.include_router(payment_routes.router)
router.include_router(expense_routes.router)
router.include_router(report_routes.router)
router.include_router(dashboard_routes.router)
router.include_router(auth_routes.router)
router.include_router(users_routes.router)
router.include_router(epp_routes.router)