# Customer Profile Page

A comprehensive React component that displays all customer-related information in one place, including their schedule calculations from your existing `logicService.js`.

## Features

- **Profile Header**: Customer name, status, villa number, and customer ID
- **Package & Schedule Info**: Current package, scheduled days, preferred time, and notes
- **Car Plates**: List of all customer's car plates
- **This Week's Schedule**: Real-time schedule calculation using your existing logic service
- **Full History**: Complete wash history for all customer's cars
- **Billing**: Invoice history and payment status
- **Responsive Design**: Works on desktop and mobile
- **CSS Variables**: Easy theming with your existing color scheme

## Files Created

1. `CustomerProfilePage.jsx` - Main component
2. `CustomerProfilePage.css` - Styles using your CSS variables
3. `CustomerProfileExample.jsx` - Integration example
4. `customerProfileRoutes.js` - Backend API route

## API Endpoint

The component uses a single API endpoint that fetches all required data:

```
GET /api/customer/:id/profile
```

### API Response Structure

```json
{
  "customer": {
    "CustomerID": "CUST-001",
    "CustomerName": "John Doe",
    "Villa": "A-123",
    "Status": "Active",
    "Washman_Package": "2 Ext 1 INT week",
    "Days": "Mon-Thurs",
    "Time": "6:00 AM",
    "Notes": "Special instructions",
    "CarPlates": "ABC123, XYZ789"
  },
  "thisWeekSchedule": [
    {
      "Day": "Monday",
      "Time": "6:00 AM",
      "CarPlate": "ABC123",
      "WashType": "EXT",
      "WorkerName": "Rahman"
    }
  ],
  "fullHistory": [
    {
      "WashDate": "2024-01-15",
      "Day": "Monday",
      "WashType": "EXT",
      "CarPlate": "ABC123"
    }
  ],
  "billing": [
    {
      "Ref": "GLOGO-2511001",
      "InvoiceDate": "2024-01-01",
      "TotalAmount": "500",
      "Currency": "AED",
      "Status": "Paid"
    }
  ]
}
```

## How to Use

### 1. Basic Usage

```jsx
import CustomerProfilePage from './components/clients/CustomerProfilePage';

function MyComponent() {
  const [showProfile, setShowProfile] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  return (
    <div>
      <button onClick={() => {
        setCustomerId('CUST-001');
        setShowProfile(true);
      }}>
        View Profile
      </button>

      {showProfile && (
        <CustomerProfilePage 
          customerId={customerId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
```

### 2. Integration with Existing Client Table

```jsx
// Add to your existing ClientTable component
<button 
  className="btn btn-primary btn-sm"
  onClick={() => handleViewProfile(client.CustomerID)}
  title="View Customer Profile"
>
  👤 Profile
</button>
```

### 3. Integration with Schedule Components

```jsx
// In your schedule components, you can trigger the profile from customer names
<span 
  className="customer-name"
  onClick={() => handleViewProfile(task.CustomerID)}
  style={{ cursor: 'pointer' }}
>
  {task.CustomerName}
</span>
```

## CSS Variables Used

The component uses your existing CSS variables for consistent theming:

```css
/* Colors */
--bg-primary
--bg-secondary
--text-primary
--text-secondary
--card-bg
--border-color
--brand-primary
--brand-secondary

/* Status Colors */
--status-active-bg
--status-active-text
--status-pending-bg
--status-pending-text
--status-overdue-bg
--status-overdue-text

/* Spacing */
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--spacing-xl
--spacing-2xl

/* Border Radius */
--radius-sm
--radius-md
--radius-lg

/* Shadows */
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

## Schedule Calculation Integration

The component integrates with your existing `logicService.js` to show real-time schedule calculations:

- Uses `calculateWashSchedule()` function from your logic service
- Shows the actual schedule that would be generated for this customer
- Displays wash types (EXT/INT) based on your package logic
- Shows worker assignments

## Customization

### Adding New Sections

To add a new section to the profile:

1. Add the data to the API response
2. Add the section to the component:

```jsx
{/* New Section */}
<div className="profile-section">
  <h2>New Section Title</h2>
  <div className="section-content">
    {/* Your content here */}
  </div>
</div>
```

3. Add corresponding CSS styles

### Styling

All styles use CSS variables, so you can easily customize the appearance by updating your theme variables in `v2-theme.css`.

## Error Handling

The component includes comprehensive error handling:

- Loading states
- Error messages
- Fallback data
- Network error recovery

## Performance

- Single API call fetches all data
- Efficient data processing
- Responsive design
- Optimized for large datasets

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interface

## Dependencies

- React (existing in your project)
- Your existing CSS framework
- Your existing API infrastructure

No additional dependencies required!