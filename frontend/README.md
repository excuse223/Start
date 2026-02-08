# Work Hours Management System - Frontend

React-based frontend application for managing employee work hours, built with modern React practices and Chart.js for data visualization.

## Features

- **Dashboard**: Overview with summary cards and visual charts
- **Employee Management**: Add, view, edit, and delete employees
- **Work Log Tracking**: Record work hours with validation
- **Reports**: Filter and export work logs to CSV
- **Responsive Design**: Mobile-friendly sidebar navigation

## Technology Stack

- React 18.2.0
- React Router 6.20.0
- Axios 1.6.2
- Chart.js 4.4.0 + react-chartjs-2
- React Scripts 5.0.1

## Installation

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode
```bash
npm start
```
This runs the app at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
```
This creates an optimized production build in the `build` folder.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   ├── Dashboard.jsx        # Main dashboard with stats
│   │   ├── EmployeeList.jsx     # Employee table and management
│   │   ├── EmployeeDetails.jsx  # Individual employee view/edit
│   │   ├── WorkLogForm.jsx      # Form to add work logs
│   │   ├── Charts.jsx           # Chart.js visualizations
│   │   └── Reports.jsx          # Filtering and CSV export
│   ├── App.jsx                  # Main app with routing
│   ├── App.css                  # Main styles
│   ├── index.js                 # Entry point
│   └── index.css                # Global styles
├── package.json
└── README.md
```

## API Configuration

The frontend connects to the backend API at `http://localhost:8000/api`. To change this, update the `API_URL` constant in each component file.

## Components Overview

### App.jsx
Main application component with React Router configuration. Routes:
- `/dashboard` - Dashboard with summary and charts
- `/employees` - Employee list
- `/employees/:id` - Employee details
- `/reports` - Reports with filtering

### Sidebar.jsx
Navigation sidebar with links to Dashboard, Employees, and Reports.

### Dashboard.jsx
Displays summary cards showing total hours by type (work, overtime, vacation, sick leave) and integrates Charts component for visualizations.

### EmployeeList.jsx
Table view of all employees with:
- Add new employee form
- View employee details
- Delete employee functionality

### EmployeeDetails.jsx
Detailed view of individual employee with:
- Edit employee information
- View all work logs
- Add new work logs
- Delete work logs

### WorkLogForm.jsx
Form to add work logs with:
- Date, hours, type, and notes fields
- Validation: warns if hours > 12
- Error handling
- Types: work, overtime, vacation, sick leave

### Charts.jsx
Data visualization using Chart.js:
- Pie chart: Hours distribution by type
- Bar chart: Total hours by employee

### Reports.jsx
Generate and export reports with:
- Filter by employee, date range, and type
- Summary statistics
- Export to CSV functionality
- Detailed work log table

## Color Scheme

The application uses a consistent color scheme:
- **Green (#27ae60)**: Work hours
- **Blue (#3498db)**: Overtime
- **Yellow (#f39c12)**: Vacation
- **Red (#e74c3c)**: Sick leave

## Validation Rules

- Work log hours must be between 0.5 and 24
- Warning displayed if hours exceed 12 per day
- Email format validation for employees
- Required fields marked with *

## Error Handling

All components include:
- Loading states with spinner
- Error messages with retry options
- Form validation
- API error handling

## Building for Production

```bash
npm run build
```

The build output will be in the `build/` directory and can be served with any static file server.

### Using Docker

```bash
docker build -t work-hours-frontend .
docker run -p 3000:80 work-hours-frontend
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
REACT_APP_API_URL=http://localhost:8000/api
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- The application uses React Hooks for state management
- All API calls use axios with async/await
- Error boundaries could be added for production
- Consider adding authentication in future versions

## Contributing

1. Ensure all components follow the existing code style
2. Test components before committing
3. Update this README if adding new features

## License

Proprietary - Work Hours Management System
