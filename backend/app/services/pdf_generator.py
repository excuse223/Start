from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from io import BytesIO
from datetime import date
from typing import List, Dict

def generate_manager_report_pdf(employee_data: Dict, work_logs: List[Dict], start_date: date, end_date: date) -> bytes:
    """
    Generate PDF report for managers (hours only, no financial data)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b>Work Hours Report - Manager View</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Employee info
    emp_info = Paragraph(
        f"<b>Employee:</b> {employee_data['first_name']} {employee_data['last_name']}<br/>"
        f"<b>Period:</b> {start_date} to {end_date}",
        styles['Normal']
    )
    elements.append(emp_info)
    elements.append(Spacer(1, 0.3*inch))
    
    # Work logs table
    table_data = [
        ['Date', 'Work Hours', 'Overtime', 'Vacation', 'Sick Leave', 'Other', 'Total']
    ]
    
    totals = {
        'work_hours': 0,
        'overtime_hours': 0,
        'vacation_hours': 0,
        'sick_leave_hours': 0,
        'other_hours': 0,
        'total': 0
    }
    
    for log in work_logs:
        row_total = (float(log['work_hours']) + float(log['overtime_hours']) + 
                    float(log['vacation_hours']) + float(log['sick_leave_hours']) + 
                    float(log['other_hours']))
        
        table_data.append([
            str(log['work_date']),
            f"{log['work_hours']:.2f}",
            f"{log['overtime_hours']:.2f}",
            f"{log['vacation_hours']:.2f}",
            f"{log['sick_leave_hours']:.2f}",
            f"{log['other_hours']:.2f}",
            f"{row_total:.2f}"
        ])
        
        totals['work_hours'] += float(log['work_hours'])
        totals['overtime_hours'] += float(log['overtime_hours'])
        totals['vacation_hours'] += float(log['vacation_hours'])
        totals['sick_leave_hours'] += float(log['sick_leave_hours'])
        totals['other_hours'] += float(log['other_hours'])
        totals['total'] += row_total
    
    # Add totals row
    table_data.append([
        'TOTAL',
        f"{totals['work_hours']:.2f}",
        f"{totals['overtime_hours']:.2f}",
        f"{totals['vacation_hours']:.2f}",
        f"{totals['sick_leave_hours']:.2f}",
        f"{totals['other_hours']:.2f}",
        f"{totals['total']:.2f}"
    ])
    
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Summary
    summary = Paragraph(
        f"<b>Summary:</b><br/>"
        f"Total Work Hours: {totals['work_hours']:.2f}<br/>"
        f"Total Overtime: {totals['overtime_hours']:.2f}<br/>"
        f"Total Vacation: {totals['vacation_hours']:.2f}<br/>"
        f"Total Sick Leave: {totals['sick_leave_hours']:.2f}<br/>"
        f"Grand Total: {totals['total']:.2f} hours",
        styles['Normal']
    )
    elements.append(summary)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_owner_report_pdf(employee_data: Dict, work_logs: List[Dict], start_date: date, end_date: date,
                              hourly_rate: float = 25.0, overtime_multiplier: float = 1.5) -> bytes:
    """
    Generate PDF report for owners (includes financial data)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b>Work Hours Report - Owner View (With Financial Data)</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Employee info
    emp_info = Paragraph(
        f"<b>Employee:</b> {employee_data['first_name']} {employee_data['last_name']}<br/>"
        f"<b>Period:</b> {start_date} to {end_date}<br/>"
        f"<b>Hourly Rate:</b> ${hourly_rate:.2f}<br/>"
        f"<b>Overtime Multiplier:</b> {overtime_multiplier}x",
        styles['Normal']
    )
    elements.append(emp_info)
    elements.append(Spacer(1, 0.3*inch))
    
    # Work logs table with costs
    table_data = [
        ['Date', 'Work', 'Overtime', 'Vacation', 'Sick', 'Other', 'Total Hrs', 'Cost']
    ]
    
    totals = {
        'work_hours': 0,
        'overtime_hours': 0,
        'vacation_hours': 0,
        'sick_leave_hours': 0,
        'other_hours': 0,
        'total_hours': 0,
        'total_cost': 0
    }
    
    for log in work_logs:
        work_hrs = float(log['work_hours'])
        overtime_hrs = float(log['overtime_hours'])
        vacation_hrs = float(log['vacation_hours'])
        sick_hrs = float(log['sick_leave_hours'])
        other_hrs = float(log['other_hours'])
        
        row_total_hrs = work_hrs + overtime_hrs + vacation_hrs + sick_hrs + other_hrs
        row_cost = (work_hrs * hourly_rate + 
                   overtime_hrs * hourly_rate * overtime_multiplier +
                   vacation_hrs * hourly_rate +
                   sick_hrs * hourly_rate +
                   other_hrs * hourly_rate)
        
        table_data.append([
            str(log['work_date']),
            f"{work_hrs:.2f}",
            f"{overtime_hrs:.2f}",
            f"{vacation_hrs:.2f}",
            f"{sick_hrs:.2f}",
            f"{other_hrs:.2f}",
            f"{row_total_hrs:.2f}",
            f"${row_cost:.2f}"
        ])
        
        totals['work_hours'] += work_hrs
        totals['overtime_hours'] += overtime_hrs
        totals['vacation_hours'] += vacation_hrs
        totals['sick_leave_hours'] += sick_hrs
        totals['other_hours'] += other_hrs
        totals['total_hours'] += row_total_hrs
        totals['total_cost'] += row_cost
    
    # Add totals row
    table_data.append([
        'TOTAL',
        f"{totals['work_hours']:.2f}",
        f"{totals['overtime_hours']:.2f}",
        f"{totals['vacation_hours']:.2f}",
        f"{totals['sick_leave_hours']:.2f}",
        f"{totals['other_hours']:.2f}",
        f"{totals['total_hours']:.2f}",
        f"${totals['total_cost']:.2f}"
    ])
    
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Financial summary
    summary = Paragraph(
        f"<b>Financial Summary:</b><br/>"
        f"Total Work Hours: {totals['work_hours']:.2f} @ ${hourly_rate:.2f}/hr = ${totals['work_hours'] * hourly_rate:.2f}<br/>"
        f"Total Overtime: {totals['overtime_hours']:.2f} @ ${hourly_rate * overtime_multiplier:.2f}/hr = ${totals['overtime_hours'] * hourly_rate * overtime_multiplier:.2f}<br/>"
        f"Total Vacation: {totals['vacation_hours']:.2f} @ ${hourly_rate:.2f}/hr = ${totals['vacation_hours'] * hourly_rate:.2f}<br/>"
        f"Total Sick Leave: {totals['sick_leave_hours']:.2f} @ ${hourly_rate:.2f}/hr = ${totals['sick_leave_hours'] * hourly_rate:.2f}<br/>"
        f"<b>GRAND TOTAL COST: ${totals['total_cost']:.2f}</b>",
        styles['Normal']
    )
    elements.append(summary)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
