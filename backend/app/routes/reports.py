from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, Literal
from datetime import date
from app.database import get_db
from app.models import WorkLog, Employee
from app.services.pdf_generator import generate_manager_report_pdf, generate_owner_report_pdf

router = APIRouter()

@router.get("/manager/{employee_id}")
def get_manager_report(
    employee_id: int,
    start_date: date,
    end_date: date,
    format: Literal["json", "pdf"] = "json",
    db: Session = Depends(get_db)
):
    """
    Generate manager report (hours only, no financial data)
    """
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get work logs
    work_logs = db.query(WorkLog).filter(
        WorkLog.employee_id == employee_id,
        WorkLog.work_date >= start_date,
        WorkLog.work_date <= end_date
    ).order_by(WorkLog.work_date).all()
    
    if not work_logs:
        raise HTTPException(status_code=404, detail="No work logs found for the specified period")
    
    # Prepare data
    employee_data = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email
    }
    
    work_logs_data = []
    totals = {
        "work_hours": 0,
        "overtime_hours": 0,
        "vacation_hours": 0,
        "sick_leave_hours": 0,
        "other_hours": 0,
        "total_hours": 0
    }
    
    for log in work_logs:
        log_data = {
            "work_date": str(log.work_date),
            "work_hours": float(log.work_hours),
            "overtime_hours": float(log.overtime_hours),
            "vacation_hours": float(log.vacation_hours),
            "sick_leave_hours": float(log.sick_leave_hours),
            "other_hours": float(log.other_hours),
            "notes": log.notes
        }
        work_logs_data.append(log_data)
        
        totals["work_hours"] += log_data["work_hours"]
        totals["overtime_hours"] += log_data["overtime_hours"]
        totals["vacation_hours"] += log_data["vacation_hours"]
        totals["sick_leave_hours"] += log_data["sick_leave_hours"]
        totals["other_hours"] += log_data["other_hours"]
        totals["total_hours"] += (log_data["work_hours"] + log_data["overtime_hours"] + 
                                 log_data["vacation_hours"] + log_data["sick_leave_hours"] + 
                                 log_data["other_hours"])
    
    if format == "json":
        return {
            "employee": employee_data,
            "period": {
                "start_date": str(start_date),
                "end_date": str(end_date)
            },
            "work_logs": work_logs_data,
            "totals": totals,
            "report_type": "manager"
        }
    else:  # pdf
        pdf_bytes = generate_manager_report_pdf(employee_data, work_logs_data, start_date, end_date)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=manager_report_{employee_id}_{start_date}_{end_date}.pdf"
            }
        )

@router.get("/owner/{employee_id}")
def get_owner_report(
    employee_id: int,
    start_date: date,
    end_date: date,
    format: Literal["json", "pdf"] = "json",
    hourly_rate: float = 25.0,
    overtime_multiplier: float = 1.5,
    db: Session = Depends(get_db)
):
    """
    Generate owner report (includes financial data with rates and costs)
    """
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get work logs
    work_logs = db.query(WorkLog).filter(
        WorkLog.employee_id == employee_id,
        WorkLog.work_date >= start_date,
        WorkLog.work_date <= end_date
    ).order_by(WorkLog.work_date).all()
    
    if not work_logs:
        raise HTTPException(status_code=404, detail="No work logs found for the specified period")
    
    # Prepare data
    employee_data = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email
    }
    
    work_logs_data = []
    totals = {
        "work_hours": 0,
        "overtime_hours": 0,
        "vacation_hours": 0,
        "sick_leave_hours": 0,
        "other_hours": 0,
        "total_hours": 0,
        "total_cost": 0
    }
    
    for log in work_logs:
        work_hrs = float(log.work_hours)
        overtime_hrs = float(log.overtime_hours)
        vacation_hrs = float(log.vacation_hours)
        sick_hrs = float(log.sick_leave_hours)
        other_hrs = float(log.other_hours)
        
        # Calculate costs
        work_cost = work_hrs * hourly_rate
        overtime_cost = overtime_hrs * hourly_rate * overtime_multiplier
        vacation_cost = vacation_hrs * hourly_rate
        sick_cost = sick_hrs * hourly_rate
        other_cost = other_hrs * hourly_rate
        total_cost = work_cost + overtime_cost + vacation_cost + sick_cost + other_cost
        
        log_data = {
            "work_date": str(log.work_date),
            "work_hours": work_hrs,
            "overtime_hours": overtime_hrs,
            "vacation_hours": vacation_hrs,
            "sick_leave_hours": sick_hrs,
            "other_hours": other_hrs,
            "notes": log.notes,
            "costs": {
                "work_cost": round(work_cost, 2),
                "overtime_cost": round(overtime_cost, 2),
                "vacation_cost": round(vacation_cost, 2),
                "sick_cost": round(sick_cost, 2),
                "other_cost": round(other_cost, 2),
                "total_cost": round(total_cost, 2)
            }
        }
        work_logs_data.append(log_data)
        
        totals["work_hours"] += work_hrs
        totals["overtime_hours"] += overtime_hrs
        totals["vacation_hours"] += vacation_hrs
        totals["sick_leave_hours"] += sick_hrs
        totals["other_hours"] += other_hrs
        totals["total_hours"] += (work_hrs + overtime_hrs + vacation_hrs + sick_hrs + other_hrs)
        totals["total_cost"] += total_cost
    
    totals["total_cost"] = round(totals["total_cost"], 2)
    
    if format == "json":
        return {
            "employee": employee_data,
            "period": {
                "start_date": str(start_date),
                "end_date": str(end_date)
            },
            "rates": {
                "hourly_rate": hourly_rate,
                "overtime_multiplier": overtime_multiplier,
                "overtime_rate": hourly_rate * overtime_multiplier
            },
            "work_logs": work_logs_data,
            "totals": totals,
            "report_type": "owner"
        }
    else:  # pdf
        pdf_bytes = generate_owner_report_pdf(
            employee_data, work_logs_data, start_date, end_date, 
            hourly_rate, overtime_multiplier
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=owner_report_{employee_id}_{start_date}_{end_date}.pdf"
            }
        )
